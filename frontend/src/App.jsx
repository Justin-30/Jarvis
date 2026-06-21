import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewspaperPage from "./pages/NewspaperPage";
import { useState } from "react";
import { Send, Mic, CirclePower } from "lucide-react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "jarvis",
      text: "Good evening Justin. JARVIS is online.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Try Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    setMessages((prev) => [
      ...prev,
      { role: "jarvis", text: "Listening..." },
    ]);
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    setMessage(transcript);

    setTimeout(() => {
      sendVoiceMessage(transcript);
    }, 200);
  };

  recognition.onerror = (event) => {
    setMessages((prev) => [
      ...prev,
      { role: "jarvis", text: "Microphone error: " + event.error },
    ]);
  };

  recognition.start();
}



  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "jarvis", text: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "jarvis",
          text: "I could not connect to the backend.",
        },
      ]);
    }

    setLoading(false);
  }

async function sendVoiceMessage(voiceText) {
  if (!voiceText.trim()) return;

  setMessages((prev) => [...prev, { role: "user", text: voiceText }]);
  setLoading(true);

  try {
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: voiceText }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "jarvis", text: data.answer },
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      {
        role: "jarvis",
        text: "I could not connect to the backend.",
      },
    ]);
  }

  setLoading(false);
}

  return (
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <div className="page">
            <div className="dashboard">
              <aside className="leftPanel">
                <h1>JARVIS</h1>
                <p className="subtitle">Local Mac Assistant</p>

                <div className="statusCard">
                  <CirclePower size={22} />
                  <div>
                    <strong>Status</strong>
                    <p>Online on localhost</p>
                  </div>
                </div>

                <div className="card">
                  <h3>Today</h3>
                  <p>No Moodle deadlines connected yet.</p>
                  <p>No calendar connected yet.</p>
                </div>

                <div className="card">
                  <h3>Next upgrades</h3>
                  <p>Voice input</p>
                  <p>Daily newspaper</p>
                  <p>Moodle checker</p>
                </div>
              </aside>

              <main className="mainPanel">
                <div className={loading ? "orb thinking" : "orb"}>
                  <div className="orbCore"></div>
                </div>

                <h2>How can I help, Justin?</h2>

                <div className="chatBox">
                  {messages.map((m, index) => (
                    <div
                      key={index}
                      className={m.role === "user" ? "msg user" : "msg jarvis"}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                <div className="inputRow">
                  <button onClick={startListening} className="iconButton">
                    <Mic size={20} />
                  </button>

                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    placeholder="Ask JARVIS..."
                  />

                  <button onClick={sendMessage} className="sendButton">
                    <Send size={20} />
                  </button>
                </div>
              </main>

              <aside className="rightPanel">
                <div className="newspaper">
                  <h3>Morning Newspaper</h3>

                  <button
                    onClick={() => (window.location.href = "/newspaper")}
                    className="newsButton"
                  >
                    Open Newspaper
                  </button>

                  <p>Open your full JARVIS daily briefing in a separate page.</p>
                  <p>Each article will include its resource link.</p>
                </div>

                <div className="card">
                  <h3>Quick commands</h3>
                  <p>open Safari</p>
                  <p>open Xcode</p>
                  <p>open Chrome</p>
                </div>
              </aside>
            </div>
          </div>
        }
      />

      <Route path="/newspaper" element={<NewspaperPage />} />
    </Routes>
  </BrowserRouter>
);
}

export default App;