import { useEffect, useState } from "react";

function cleanText(text) {
  if (!text) return "No text available.";

  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(text, maxLength = 180) {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export default function NewspaperPage() {
  const [newspaper, setNewspaper] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadNewspaper() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/newspaper");
      const data = await res.json();
      setNewspaper(data);
    } catch (err) {
      console.error(err);
      alert("Could not load newspaper. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetch("http://localhost:8000/newspaper")
      .then((res) => res.json())
      .then((data) => {
        if (active) setNewspaper(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Could not load newspaper. Make sure backend is running.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentHour = new Date().getHours();

  let briefingTitle = "Morning Newspaper";

  if (currentHour >= 12 && currentHour < 17) {
    briefingTitle = "Afternoon Newspaper";
  } else if (currentHour >= 17 && currentHour < 22) {
    briefingTitle = "Evening Newspaper";
  } else if (currentHour >= 22 || currentHour < 5) {
    briefingTitle = "Night Briefing";
  }

  const summaryLines =
    newspaper?.summary
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) || [];

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #13223b 0%, #070b13 45%, #03050a 100%)",
      color: "white",
      padding: "32px 24px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    },
    container: {
      maxWidth: "1250px",
      margin: "0 auto",
    },
    backButton: {
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.08)",
      color: "white",
      borderRadius: "999px",
      padding: "10px 16px",
      cursor: "pointer",
      marginBottom: "24px",
    },
    hero: {
      border: "1px solid rgba(255,255,255,0.12)",
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(59,130,246,0.08), rgba(255,255,255,0.04))",
      borderRadius: "34px",
      padding: "70px 34px 62px",
      textAlign: "center",
      boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      marginBottom: "28px",
    },
    label: {
      color: "#67e8f9",
      letterSpacing: "4px",
      textTransform: "uppercase",
      fontSize: "12px",
      marginBottom: "10px",
    },
    title: {
      fontSize: "clamp(42px, 5.2vw, 96px)",
      letterSpacing: "7px",
      margin: "0 0 22px",
      fontWeight: 800,
      lineHeight: 0.95,
    },
    date: {
      color: "#cbd5e1",
      fontSize: "22px",
      marginBottom: "34px",
      position: "relative",
      zIndex: 2,
    },
    button: {
      border: "1px solid rgba(103,232,249,0.35)",
      background: "rgba(34,211,238,0.14)",
      color: "#cffafe",
      borderRadius: "999px",
      padding: "12px 18px",
      cursor: "pointer",
    },
    section: {
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.055)",
      borderRadius: "28px",
      padding: "24px",
      marginBottom: "28px",
      boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
    },
    sectionTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "16px",
      alignItems: "center",
      marginBottom: "18px",
      flexWrap: "wrap",
    },
    sectionTitle: {
      margin: "0",
      fontSize: "28px",
    },
    badge: {
      background: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.12)",
      padding: "8px 12px",
      borderRadius: "999px",
      color: "#cbd5e1",
      fontSize: "13px",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "16px",
    },
    summaryCard: {
      background: "rgba(0,0,0,0.24)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "22px",
      padding: "18px",
      lineHeight: 1.6,
      color: "#e5e7eb",
      fontSize: "14px",
    },
    newsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      margin: "0 0 16px",
      flexWrap: "wrap",
      gap: "12px",
    },
    newsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "18px",
      alignItems: "stretch",
    },
    card: {
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.045))",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "28px",
      padding: "22px",
      boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
      display: "flex",
      flexDirection: "column",
      minHeight: "270px",
      textAlign: "left",
    },
    cardMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    region: {
      color: "#67e8f9",
      fontSize: "12px",
      letterSpacing: "3px",
      textTransform: "uppercase",
      fontWeight: 700,
    },
    newsNumber: {
      color: "#94a3b8",
      fontSize: "13px",
    },
    cardTitle: {
      fontSize: "22px",
      lineHeight: 1.25,
      margin: "0 0 14px",
      fontWeight: 800,
    },
    cardSummary: {
      color: "#cbd5e1",
      lineHeight: 1.65,
      fontSize: "15px",
      margin: "0 0 18px",
      flex: 1,
    },
    cardFooter: {
      borderTop: "1px solid rgba(255,255,255,0.1)",
      paddingTop: "14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
    },
    source: {
      color: "#94a3b8",
      fontSize: "13px",
    },
    link: {
      color: "#cffafe",
      textDecoration: "none",
      border: "1px solid rgba(103,232,249,0.35)",
      background: "rgba(34,211,238,0.14)",
      borderRadius: "999px",
      padding: "9px 13px",
      whiteSpace: "nowrap",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          onClick={() => (window.location.href = "/")}
          style={styles.backButton}
        >
          ← Back to JARVIS
        </button>

        <header style={styles.hero}>
          <div style={styles.label}>JARVIS Daily Briefing</div>
          <h1 style={styles.title}>{briefingTitle}</h1>
          <div style={styles.date}>{newspaper?.date || "Today’s briefing"}</div>

          <button onClick={loadNewspaper} style={styles.button}>
            Regenerate Briefing
          </button>
        </header>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px", color: "#cbd5e1" }}>
            Generating your newspaper...
          </div>
        )}

        {!loading && newspaper && (
          <>
            <section style={styles.section}>
              <div style={styles.sectionTop}>
                <div>
                  <div style={styles.label}>Executive Summary</div>
                  <h2 style={styles.sectionTitle}>Today’s Briefing</h2>
                </div>

                <div style={styles.badge}>
                  {newspaper.articles?.length || 0} sources
                </div>
              </div>

              <div style={styles.summaryGrid}>
                {summaryLines.map((line, index) => (
                  <div key={index} style={styles.summaryCard}>
                    {line}
                  </div>
                ))}
              </div>
            </section>

            <div style={styles.newsHeader}>
              <div>
                <div style={styles.label}>Latest News</div>
                <h2 style={styles.sectionTitle}>Source Cards</h2>
              </div>
            </div>

            <section style={styles.newsGrid}>
              {newspaper.articles?.map((article, index) => (
                <article key={index} style={styles.card}>
                  <div style={styles.cardMeta}>
                    <span style={styles.region}>{article.region || "News"}</span>
                    <span style={styles.newsNumber}>News #{index + 1}</span>
                  </div>

                  <h3 style={styles.cardTitle}>{cleanText(article.title)}</h3>

                  <p style={styles.cardSummary}>
                    {shortText(article.summary || article.description, 190)}
                  </p>

                  <div style={styles.cardFooter}>
                    <div style={styles.source}>
                      Source:{" "}
                      <strong style={{ color: "#e5e7eb" }}>
                        {cleanText(article.source || "Unknown")}
                      </strong>
                    </div>

                    {article.link && (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.link}
                      >
                        Open →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}