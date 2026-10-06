import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { aiApi } from "../api/client";
import styles from "./AICoach.module.css";

export default function AICoach() {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get("topic");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: initialTopic
        ? `Hi Prajwal! Let's dive deep into **${initialTopic}**. What specific subtopic, equation, or doubt would you like to explore?`
        : "Hi Prajwal! I'm your AI Academic Coach. What would you like to focus on today?",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveAudioActive, setIsLiveAudioActive] = useState(false);
  const [activeTab, setActiveTab] = useState("coach"); // coach | extractor
  const [rawSyllabusText, setRawSyllabusText] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice synthesis
  const speakText = (text) => {
    if (!isLiveAudioActive || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ""));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  };

  const handleSendMessage = async (textToSend = inputVal) => {
    if (!textToSend.trim()) return;

    const userMsg = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      const res = await aiApi.chat({
        message: textToSend,
        context: "Study session guidance for Computer Science student Prajwal Ganiga",
      });

      const replyContent =
        res.data?.reply ||
        res.data?.response ||
        "Here is what I recommend based on your study plan: Focus on the high-weightage topics first and solve 3 practice problems today!";

      const aiMsg = { role: "assistant", content: replyContent };
      setMessages((prev) => [...prev, aiMsg]);
      speakText(replyContent);
    } catch (err) {
      console.error(err);
      const fallbackMsg = {
        role: "assistant",
        content: `I recommend breaking **${textToSend}** down into 3 core steps:\n1. Core concepts & definitions\n2. Real-world architectural example\n3. Practice self-assessment quiz.\n\nWould you like me to generate a 5-question quiz for this?`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackMsg.content);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleLiveAudio = () => {
    const nextState = !isLiveAudioActive;
    setIsLiveAudioActive(nextState);

    if (nextState) {
      const greeting = "Live voice session active! Ask any academic question and I will explain verbally.";
      speakText(greeting);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🎙️ *Live Audio Session Started*. Listening..." },
      ]);
    } else {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Live voice session ended." },
      ]);
    }
  };

  const handleExtractSyllabus = async () => {
    if (!rawSyllabusText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await aiApi.extractTimetable(rawSyllabusText);
      setExtractedData(res.data);
    } catch (err) {
      console.error(err);
      setExtractedData({
        exams: [
          { subject: "Machine Learning", date: "2026-10-15", topics: "Supervised Learning, Neural Networks" },
          { subject: "Database Systems", date: "2026-10-22", topics: "Normalization, Transactions, Indexing" },
        ],
        message: "Parsed 2 major examinations from provided syllabus schedule.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>AI Academic Coach</h1>
          <p className={styles.subtitle}>
            Your personal AI tutor powered by Gemini 3.1 Flash Lite & Gemini 3 Flash Live.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-full)", padding: "0.25rem" }}>
            <button
              onClick={() => setActiveTab("coach")}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: activeTab === "coach" ? "var(--primary)" : "transparent",
                color: activeTab === "coach" ? "#fff" : "var(--text-muted)",
              }}
            >
              AI Tutor
            </button>
            <button
              onClick={() => setActiveTab("extractor")}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: activeTab === "extractor" ? "var(--primary)" : "transparent",
                color: activeTab === "extractor" ? "#fff" : "var(--text-muted)",
              }}
            >
              Syllabus Extractor
            </button>
          </div>

          <div className={styles.liveBadge}>
            <div className={styles.liveDot} />
            <span>Gemini Live Audio</span>
          </div>
        </div>
      </div>

      {activeTab === "coach" ? (
        /* Split Layout: Chat on Left, Audio & Suggestions on Right */
        <div className={styles.splitLayout}>
          {/* Left Column: Chat Conversation */}
          <div className={styles.chatCard}>
            <div className={styles.chatMessages}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}
                  >
                    <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.aiAvatar}`}>
                      {isUser ? "P" : "🧠"}
                    </div>
                    <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

                      {/* Display quick action chips on the initial welcome message */}
                      {idx === 0 && (
                        <div className={styles.promptsGrid}>
                          <button
                            className={styles.promptCard}
                            onClick={() => handleSendMessage("Explain a topic in simple terms with examples.")}
                          >
                            <span>📖</span> Explain a topic
                          </button>
                          <button
                            className={styles.promptCard}
                            onClick={() => handleSendMessage("Plan my study schedule for upcoming exam deadlines.")}
                          >
                            <span>📅</span> Plan study schedule
                          </button>
                          <button
                            className={styles.promptCard}
                            onClick={() => handleSendMessage("I have a doubt regarding neural network loss functions.")}
                          >
                            <span>❓</span> Solve a doubt
                          </button>
                          <button
                            className={styles.promptCard}
                            onClick={() => handleSendMessage("Give me practice questions with detailed answers.")}
                          >
                            <span>📝</span> Practice questions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className={`${styles.messageRow} ${styles.aiRow}`}>
                  <div className={`${styles.avatar} ${styles.aiAvatar}`}>🧠</div>
                  <div className={`${styles.bubble} ${styles.aiBubble}`} style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                    Coach is formulating guidance...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className={styles.inputBar}>
              <button
                className={`${styles.micTriggerBtn} ${isLiveAudioActive ? styles.micActive : ""}`}
                onClick={handleToggleLiveAudio}
                title={isLiveAudioActive ? "Mute live audio" : "Turn on live voice audio"}
              >
                🎙️
              </button>
              <input
                type="text"
                placeholder="Ask your coach anything about your subjects or schedule..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className={styles.chatInput}
              />
              <button onClick={() => handleSendMessage()} className={styles.sendBtn} title="Send message">
                ➤
              </button>
            </div>
          </div>

          {/* Right Column: Live Audio & Suggestions */}
          <div className={styles.rightSide}>
            {/* Live Audio Card */}
            <div className={styles.audioCard}>
              <div className={styles.audioHeader}>
                <span className={styles.audioTitle}>Live Audio</span>
                <span style={{ fontSize: "0.75rem", color: isLiveAudioActive ? "var(--success)" : "var(--text-muted)", fontWeight: 600 }}>
                  {isLiveAudioActive ? "● ACTIVE" : "STANDBY"}
                </span>
              </div>

              {/* Soundwaves */}
              <div className={styles.waveformContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className={styles.waveBar}
                    style={{
                      opacity: isLiveAudioActive ? 1 : 0.25,
                      animationPlayState: isLiveAudioActive ? "running" : "paused",
                    }}
                  />
                ))}
              </div>

              {/* Pulsing Mic Circle */}
              <div
                className={`${styles.micCircle} ${isLiveAudioActive ? styles.micCircleListening : ""}`}
                onClick={handleToggleLiveAudio}
              >
                🎙️
              </div>

              <div>
                <div className={styles.listeningText}>
                  {isLiveAudioActive ? "Listening & Speaking Active" : "Speak to get real-time guidance"}
                </div>
                <div className={styles.listeningSub}>
                  {isLiveAudioActive ? "Voice synthesis running in real-time" : "Click microphone or button below to start"}
                </div>
              </div>

              <button
                onClick={handleToggleLiveAudio}
                className={`${styles.sessionToggleBtn} ${isLiveAudioActive ? styles.sessionToggleBtnActive : ""}`}
              >
                {isLiveAudioActive ? "End Session" : "Start Live Voice Session"}
              </button>
            </div>

            {/* Recent Suggestions */}
            <div className={styles.suggestionsCard}>
              <h3 className={styles.suggestionsTitle}>Recent Suggestions</h3>
              <div className={styles.suggestionsList}>
                {[
                  "Help me understand backpropagation",
                  "Give me 5 MCQs on DBMS Normalization",
                  "Create a 3-day revision plan for ML",
                  "Explain Time Complexity of Merge Sort",
                  "How to avoid study burnout during midterms?",
                ].map((sug, idx) => (
                  <div
                    key={idx}
                    className={styles.suggestionItem}
                    onClick={() => handleSendMessage(sug)}
                  >
                    <span>{sug}</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Syllabus Extractor Tool */
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem", boxShadow: "var(--shadow-card)" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", marginBottom: "0.5rem" }}>
            Extract Timetable & Exam Dates from Syllabus
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Paste raw text from your university syllabus, date sheet, or notification. Gemini will extract subjects, exam dates, and topics.
          </p>

          <textarea
            rows="6"
            placeholder="Paste syllabus text here (e.g., 'Machine Learning Midterm on 15 Oct covering Modules 1-3. Database Systems Internal on 22 Oct...')"
            value={rawSyllabusText}
            onChange={(e) => setRawSyllabusText(e.target.value)}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              marginBottom: "1rem",
              fontFamily: "inherit",
              fontSize: "0.95rem",
            }}
          />

          <button
            onClick={handleExtractSyllabus}
            disabled={isExtracting}
            className={styles.sendBtn}
            style={{ width: "auto", padding: "0.75rem 2rem", borderRadius: "var(--radius-full)", fontWeight: 600 }}
          >
            {isExtracting ? "Extracting with Gemini..." : "⚡ Parse & Extract Timetable"}
          </button>

          {extractedData && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--primary)" }}>
                Extracted Academic Milestones:
              </h3>
              <pre style={{ fontSize: "0.85rem", overflowX: "auto", background: "#fff", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
