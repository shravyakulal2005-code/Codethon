import { useState, useEffect } from "react";
import { studyPlanApi } from "../api/client";
import styles from "./Timetable.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { label: "8:00", hour: 8 },
  { label: "10:00", hour: 10 },
  { label: "12:00", hour: 12 },
  { label: "2:00", hour: 14 },
  { label: "4:00", hour: 16 },
  { label: "6:00", hour: 18 },
  { label: "8:00", hour: 20 },
];

export default function Timetable() {
  const [sessions, setSessions] = useState([]);
  const [viewMode, setViewMode] = useState("week"); // week | month
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const loadSessions = async () => {
    try {
      const res = await studyPlanApi.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to load study sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleComplete = async (sessionId, duration = 60) => {
    try {
      await studyPlanApi.completeSession(sessionId, {
        actual_duration_minutes: duration,
        notes: "Completed on schedule",
      });
      setActionMsg("Session marked as completed! 🎉");
      setTimeout(() => setActionMsg(""), 3000);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMiss = async (sessionId) => {
    try {
      await studyPlanApi.missSession(sessionId);
      setActionMsg("Session marked missed. Adaptive reschedule updated!");
      setTimeout(() => setActionMsg(""), 3000);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async () => {
    try {
      setActionMsg("Recalculating adaptive schedule...");
      await studyPlanApi.reschedule({ reason: "user_triggered_quick_reschedule" });
      setActionMsg("Timetable rescheduled to fit your goals! ✨");
      setTimeout(() => setActionMsg(""), 3500);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    try {
      setActionMsg("Generating fresh 7-day study plan...");
      await studyPlanApi.generate({ days_ahead: 7 });
      setActionMsg("New study schedule generated successfully! 🚀");
      setTimeout(() => setActionMsg(""), 3500);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  // Today's date calculations
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Filter today's sessions
  const todayDateStr = today.toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => {
    if (!s.scheduled_date) return false;
    return s.scheduled_date.startsWith(todayDateStr);
  });

  const CHIP_COLORS = [styles.chipBlue, styles.chipGreen, styles.chipAmber, styles.chipPurple, styles.chipRose];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Timetable & Sessions</h1>
          <p className={styles.subtitle}>
            Weekly visual calendar, adaptive slots, and real-time session tracking.
          </p>
        </div>

        <div className={styles.controls}>
          {/* Week date navigator */}
          <div className={styles.dateNavigator}>
            <button className={styles.navArrow}>‹</button>
            <span className={styles.currentRange}>Oct 6 – Oct 12, 2026</span>
            <button className={styles.navArrow}>›</button>
          </div>

          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === "week" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === "month" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
          </div>

          <button onClick={handleReschedule} className={styles.rescheduleBtn}>
            <span>⚡</span> Quick Reschedule
          </button>
          <button onClick={handleGenerate} className={styles.genBtn}>
            <span>🔄</span> Generate Plan
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.9rem",
            border: "1px solid rgba(37, 99, 235, 0.2)",
          }}
        >
          {actionMsg}
        </div>
      )}

      {/* Main Grid: Calendar on Left, Today & Streak on Right */}
      <div className={styles.contentGrid}>
        {/* Weekly Calendar Matrix */}
        <div className={styles.calendarCard}>
          <div className={styles.gridHeader}>
            <div className={styles.gridTimeLabel}>GMT</div>
            {DAYS.map((day, idx) => {
              const dayNum = 6 + idx;
              const isToday = idx === currentDayIndex;
              return (
                <div key={day} className={styles.dayColumnHeader}>
                  <span className={styles.dayName}>{day}</span>
                  <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ""}`}>
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.calendarBody}>
            {TIME_SLOTS.map((slot) => (
              <div key={slot.label} className={styles.timeRow}>
                <div className={styles.timeLabel}>{slot.label}</div>

                {DAYS.map((day, dayIdx) => {
                  // Find sessions scheduled on this day and approximate hour slot
                  const slotSessions = sessions.filter((s) => {
                    if (!s.scheduled_date) return false;
                    const d = new Date(s.scheduled_date);
                    const sDayIdx = (d.getDay() + 6) % 7;
                    if (sDayIdx !== dayIdx) return false;

                    // Match start_time or fallback
                    if (s.start_time) {
                      const h = parseInt(s.start_time.split(":")[0], 10);
                      return Math.abs(h - slot.hour) <= 1;
                    }
                    return false;
                  });

                  return (
                    <div key={day} className={styles.slotCell}>
                      {slotSessions.map((sess, sIdx) => {
                        const chipClass = CHIP_COLORS[(sess.id || sIdx) % CHIP_COLORS.length];
                        return (
                          <div
                            key={sess.id}
                            className={`${styles.sessionChip} ${chipClass}`}
                            title={`${sess.subject_name || "Study"} - ${sess.topic_name || "Session"}`}
                          >
                            <span className={styles.chipSubject}>{sess.subject_name || "Study Session"}</span>
                            <span className={styles.chipTopic}>{sess.topic_name || "Scheduled Topic"}</span>
                            <span className={styles.chipTime}>
                              {sess.start_time || "09:00"} - {sess.end_time || "10:30"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Panel: Today's Sessions & Streak */}
        <div className={styles.sidePanel}>
          {/* Today's Sessions Card */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Today's Sessions</h3>

            {todaySessions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>
                No study sessions scheduled for today. Click "Generate Plan" to populate.
              </p>
            ) : (
              <div className={styles.todaySessionsList}>
                {todaySessions.map((sess) => {
                  const isDone = sess.status === "completed";
                  const isMissed = sess.status === "missed";

                  return (
                    <div key={sess.id} className={styles.todaySessionItem}>
                      <div className={styles.todaySessionHeader}>
                        <div>
                          <div className={styles.todaySubject}>{sess.subject_name || "Study Block"}</div>
                          <div className={styles.todayTopic}>{sess.topic_name || "Core Concept"}</div>
                        </div>
                        <span className={styles.todayTime}>
                          {sess.start_time ? `${sess.start_time.slice(0, 5)} - ${sess.end_time?.slice(0, 5)}` : "60 min"}
                        </span>
                      </div>

                      {isDone ? (
                        <div className={styles.statusCompleted}>✓ Completed</div>
                      ) : isMissed ? (
                        <div className={styles.statusMissed}>✕ Missed</div>
                      ) : (
                        <div className={styles.actionRow}>
                          <button
                            onClick={() => handleComplete(sess.id, sess.duration_minutes || 60)}
                            className={styles.completeBtn}
                          >
                            <span>✓</span> Complete
                          </button>
                          <button onClick={() => handleMiss(sess.id)} className={styles.missBtn}>
                            ✕ Miss
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Study Streak Card */}
          <div className={styles.sideCard}>
            <div className={styles.streakWidget}>
              <div className={styles.streakTop}>
                <span className={styles.fireIcon}>🔥</span>
                <div>
                  <div className={styles.streakDays}>5 days</div>
                  <div className={styles.streakMsg}>Keep it up! Active habit</div>
                </div>
              </div>

              <div className={styles.daysRow}>
                {DAYS.map((day, idx) => {
                  const active = idx <= 4; // Mon-Fri active
                  return (
                    <div key={day} className={styles.dayBubble}>
                      <span className={styles.bubbleDayName}>{day}</span>
                      <div className={`${styles.bubbleCircle} ${active ? styles.bubbleCircleActive : ""}`}>
                        {active ? "✓" : "○"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
