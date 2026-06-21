from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import subprocess
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "qwen2.5:3b"

IMESSAGE_TARGET = "+10000000000"

NEWS_SOURCES = [
    # Albania
    {
        "name": "Top Channel",
        "type": "website",
        "url": "https://top-channel.tv/",
        "region": "Albania",
    },
    {
        "name": "Klan",
        "type": "website",
        "url": "https://tvklan.al/",
        "region": "Albania",
    },
    {
        "name": "Report TV",
        "type": "website",
        "url": "https://shqiptarja.com/lajmet",
        "region": "Albania",
    },

    # Austria
    {
        "name": "The Local Austria",
        "type": "rss",
        "url": "https://www.thelocal.at/feeds/rss.php",
        "region": "Austria",
    },
    {
        "name": "Vienna.at English",
        "type": "rss",
        "url": "https://www.vienna.at/news/om:vienna:news:english/rss",
        "region": "Austria",
    },
    {
        "name": "Vienna Times",
        "type": "rss",
        "url": "https://www.viennatimes.com/feed/",
        "region": "Austria",
    },

    # World / Europe
    {
        "name": "BBC World",
        "type": "rss",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "region": "World",
    },
    {
        "name": "The Guardian World",
        "type": "rss",
        "url": "https://www.theguardian.com/world/rss",
        "region": "World",
    },
    {
        "name": "Politico Europe",
        "type": "rss",
        "url": "https://www.politico.eu/feed/",
        "region": "Europe",
    },
    {
        "name": "Euronews",
        "type": "rss",
        "url": "https://www.euronews.com/rss",
        "region": "Europe",
    },

    # Tech / Apple
    {
        "name": "The Verge",
        "type": "rss",
        "url": "https://www.theverge.com/rss/index.xml",
        "region": "Tech",
    },
    {
        "name": "Apple Developer News",
        "type": "rss",
        "url": "https://developer.apple.com/news/rss/news.rss",
        "region": "Apple",
    },
]


class ChatRequest(BaseModel):
    message: str


def speak(text: str):
    subprocess.Popen(["say", "-v", "Daniel", "-r", "170", text])


def open_app(app_name: str):
    subprocess.Popen(["open", "-a", app_name])


def send_imessage(phone_or_email: str, text: str):
    safe_text = (
        text
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
    )

    script = f'''
tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "{phone_or_email}" of targetService
    send "{safe_text}" to targetBuddy
end tell
'''

    subprocess.run(["osascript", "-e", script], check=True)


def ask_ollama(message: str) -> str:
    system_prompt = """
You are JARVIS, Justin's local Mac assistant.
Speak like a calm, intelligent British AI assistant.
Be direct, elegant, and slightly futuristic.
Do not over-explain unless Justin asks.
Use short phrases naturally:
- Certainly, Justin.
- Systems are online.
- I have prepared that for you.
- Shall I proceed?
"""

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()
    return response.json()["message"]["content"].strip()


def clean_html(text):
    if not text:
        return ""

    return BeautifulSoup(text, "html.parser").get_text(" ", strip=True)


def clean_link(link, source_url):
    if not link:
        return ""

    if link.startswith("/"):
        return source_url.rstrip("/") + link

    return link


def fetch_rss_source(source):
    feed = feedparser.parse(source["url"])
    articles = []

    for entry in feed.entries[:5]:
        title = clean_html(entry.get("title", "Untitled"))
        summary = clean_html(entry.get("summary", ""))
        link = entry.get("link", "")

        if len(summary) > 220:
            summary = summary[:220].strip() + "..."

        if title:
            articles.append({
                "source": source["name"],
                "title": title,
                "link": link,
                "summary": summary or title,
                "region": source.get("region", "News"),
            })

    return articles


def fetch_website_source(source):
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(source["url"], headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    articles = []
    seen_titles = set()

    for a in soup.find_all("a", href=True):
        raw_title = clean_html(a.get_text(" ", strip=True))
        link = clean_link(a["href"], source["url"])

        if not raw_title:
            continue

        if not link.startswith("http"):
            continue

        bad_words = [
            "facebook",
            "instagram",
            "youtube",
            "twitter",
            "tiktok",
            "login",
            "kontakt",
            "privacy",
            "cookie",
            "reklama",
        ]

        if any(word in link.lower() for word in bad_words):
            continue

        title = raw_title

        for separator in [
            " 5 maj 2026",
            " 6 maj 2026",
            " 2026 -",
            " - Në ",
            " - Sot ",
            " - ",
        ]:
            if separator in title:
                title = title.split(separator)[0].strip()

        if len(title) > 130:
            title = title[:130].rsplit(" ", 1)[0].strip() + "..."

        if len(title) < 30:
            continue

        if title in seen_titles:
            continue

        seen_titles.add(title)

        articles.append({
            "source": source["name"],
            "title": title,
            "link": link,
            "summary": title,
            "region": source.get("region", "News"),
        })

        if len(articles) >= 3:
            break

    return articles


def fetch_all_news():
    all_articles = []

    region_limits = {
        "Albania": 3,
        "Austria": 3,
        "World": 3,
        "Europe": 2,
        "Tech": 1,
        "Apple": 1,
        "News": 2,
    }

    region_counts = {}

    for source in NEWS_SOURCES:
        try:
            source_type = source.get("type", "rss")

            if source_type == "rss":
                articles = fetch_rss_source(source)
            elif source_type == "website":
                articles = fetch_website_source(source)
            else:
                articles = []

            region = source.get("region", "News")
            limit = region_limits.get(region, 2)

            if region_counts.get(region, 0) >= limit:
                continue

            if articles:
                article = articles[0]
                article["region"] = region
                article["source"] = source["name"]

                all_articles.append(article)
                region_counts[region] = region_counts.get(region, 0) + 1

        except Exception as e:
            print(f"Error reading {source['name']}: {e}")

    return all_articles[:12]


def make_newspaper_summary(articles):
    grouped = {
        "Albania": [],
        "Austria": [],
        "World": [],
        "Europe": [],
        "Tech": [],
        "Apple": [],
    }

    for article in articles:
        region = article.get("region", "News")
        if region in grouped:
            grouped[region].append(article)

    lines = []

    if grouped["Albania"]:
        lines.append(
            "Albania: latest headlines from Top Channel, Klan, and Report TV are ready."
        )

    if grouped["Austria"]:
        austria_titles = [a["title"] for a in grouped["Austria"][:2]]
        lines.append("Austria: " + " | ".join(austria_titles))

    world_europe = grouped["World"][:2] + grouped["Europe"][:1]
    if world_europe:
        world_titles = [a["title"] for a in world_europe[:3]]
        lines.append("World/Europe: " + " | ".join(world_titles))

    tech_apple = grouped["Tech"][:1] + grouped["Apple"][:1]
    if tech_apple:
        tech_titles = [a["title"] for a in tech_apple]
        lines.append("Tech/Apple: " + " | ".join(tech_titles))

    return "\n".join(lines)


@app.get("/")
def root():
    return {"status": "JARVIS backend running"}


@app.get("/newspaper")
def newspaper():
    articles = fetch_all_news()
    summary = make_newspaper_summary(articles)

    return {
        "date": datetime.now().strftime("%A, %d %B %Y"),
        "articles": articles,
        "summary": summary,
    }


@app.get("/send-newspaper-imessage")
def send_newspaper_imessage():
    articles = fetch_all_news()
    summary = make_newspaper_summary(articles)

    message = "JARVIS Briefing\n"
    message += f"{datetime.now().strftime('%A, %d %B %Y')}\n\n"
    message += f"Executive Summary\n{summary}\n\n"

    for article in articles[:6]:
        title = article.get("title", "Untitled")
        source = article.get("source", "Unknown")
        region = article.get("region", "News")
        link = article.get("link", "")

        message += f"- {region}: {title}\n"
        message += f"Source: {source}\n"

        if link:
            message += f"{link}\n"

        message += "\n"

    send_imessage(IMESSAGE_TARGET, message)

    return {
        "status": "sent",
        "method": "iMessage",
        "articles": len(articles),
    }


@app.post("/chat")
def chat(req: ChatRequest):
    message = req.message.lower()

    if "open safari" in message:
        answer = "Opening Safari."
        open_app("Safari")
        speak(answer)
        return {"answer": answer}

    if "open xcode" in message:
        answer = "Opening Xcode."
        open_app("Xcode")
        speak(answer)
        return {"answer": answer}

    if "open chrome" in message:
        answer = "Opening Chrome."
        open_app("Google Chrome")
        speak(answer)
        return {"answer": answer}

    answer = ask_ollama(req.message)
    speak(answer)
    return {"answer": answer}