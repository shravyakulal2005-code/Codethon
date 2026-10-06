import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { dashboardApi, studyPlanApi } from "../api/client";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getSummary();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const handleUpdate = () => fetchDashboard();
    window.addEventListener("planUpdated", handleUpdate);
    return () => window.removeEventListener("planUpdated", handleUpdate);
  }, []);

  const handleComplete = async (sessionId) => {
    try {
      await studyPlanApi.completeSession(sessionId, { actual_minutes: 60 });
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMiss = async (sessionId) => {
    try {
      await studyPlanApi.missSession(sessionId);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = user?.name || "Prajwal";
  const overallProg = data ? Math.round(data.overall_progress) : 68;
  const hoursDone = data ? data.study_hours_this_week : 18.5;
  const hoursPlanned = data ? data.study_hours_planned_this_week || 30 : 30;
  const examsCount = data ? data.upcoming_exams?.length || 0 : 3;
  const weakCount = data ? data.weak_subjects?.filter((w) => w.attention_level === "HIGH").length || 0 : 2;

  // Static fallback colors for subject bars
  const SUBJECT_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

  return (
    <div className={styles.dashboardContainer}>
      {/* ── Welcome Header ────────────────────────────────────── */}
      <div className={styles.welcomeHeader}>
        <div>
          <h1 className={styles.greeting}>Good Morning, {displayName} 👋</h1>
          <p className={styles.subtitle}>Here's your academic snapshot for today.</p>
        </div>
        <div className={styles.dateBadge}>
          <span className={styles.dateText}>Mon, 6 Oct 2026</span>
          <span className={styles.weekTag}>Week 5 · Sem 7</span>
        </div>
      </div>

      {/* ── Metrics Row ───────────────────────────────────────── */}
      <div className={styles.metricsGrid}>
        {/* Metric 1: Overall Progress */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Overall Progress</span>
            <div className={`${styles.metricIconCircle}`} style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              📈
            </div>
          </div>
          <div className={styles.progressRingContainer}>
            <div className={styles.progressCircle}>
              <svg width="58" height="58" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeDasharray={`${overallProg}, 100`}
                />
              </svg>
              <div style={{ position: "absolute" }}>
                <span className={styles.progressValue}>{overallProg}%</span>
              </div>
            </div>
            <div className={styles.progressMeta}>
              <span className={styles.progressTag}>↗ Keep going!</span>
              <span className={styles.progressSub}>You're doing great.</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Study Hours */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Study Hours This Week</span>
            <div className={styles.metricIconCircle} style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              ⏱️
            </div>
          </div>
          <div className={styles.metricBigNumber}>
            {hoursDone} <span>/ {hoursPlanned} hrs</span>
          </div>
          <div className={styles.metricProgressBar}>
            <div
              className={styles.metricProgressFill}
              style={{ width: `${Math.min(100, (hoursDone / hoursPlanned) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Upcoming Exams */}
        <div className={styles.metricCard} onClick={() => navigate("/classrooms")} style={{ cursor: "pointer" }}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Upcoming Exams</span>
            <div className={styles.metricIconCircle} style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
              📅
            </div>
          </div>
          <div className={styles.metricBigNumber}>{examsCount}</div>
          <div className={styles.metricMetaRow}>
            <span>within 7 days</span>
            <span className={styles.warningBadge}>⚠️ Attention</span>
          </div>
        </div>

        {/* Metric 4: Weak Subjects */}
        <div className={styles.metricCard} onClick={() => navigate("/analytics")} style={{ cursor: "pointer" }}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Weak Subjects</span>
            <div className={styles.metricIconCircle} style={{ backgroundColor: "#f5f3ff", color: "#8b5cf6" }}>
              🎯
            </div>
          </div>
          <div className={styles.metricBigNumber}>{weakCount}</div>
          <div className={styles.metricMetaRow}>
            <span>need more focus</span>
            <span className={styles.chevronLink}>›</span>
          </div>
        </div>
      </div>

      {/* ── Content Grid (Agenda, Subject Progress, Widgets) ─── */}
      <div className={styles.contentGrid}>
        {/* Column 1: Today's Agenda */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>📅</span> Today's Agenda
            </h2>
            <Link to="/timetable" className={styles.panelLink}>
              View full timetable →
            </Link>
          </div>

          <div className={styles.agendaList}>
            {data?.today_sessions && data.today_sessions.length > 0 ? (
              data.today_sessions.map((sess, idx) => {
                const isCompleted = sess.status === "COMPLETED";
                const isMissed = sess.status === "MISSED";
                const startStr = new Date(sess.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const endStr = new Date(sess.scheduled_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={sess.id} className={styles.agendaItem}>
                    <div className={styles.agendaLeft}>
                      <span
                        className={`${styles.agendaDot} ${
                          isCompleted ? styles.dotGreen : idx === 1 ? styles.dotBlue : styles.dotOrange
                        }`}
                      />
                      <span className={styles.agendaTime}>{startStr} - {endStr}</span>
                      <div className={styles.agendaDetails}>
                        <span className={styles.agendaSubject}>{sess.subject_name || "Study Block"}</span>
                        <span className={styles.agendaTopic}>{sess.topic_name || sess.session_type}</span>
                      </div>
                    </div>

                    <div className={styles.sessionActionBtns}>
                      {isCompleted ? (
                        <span className={`${styles.pill} ${styles.pillSuccess}`}>✓ Completed</span>
                      ) : isMissed ? (
                        <span className={`${styles.pill} ${styles.pillUpcoming}`}>✕ Missed</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleComplete(sess.id)}
                            className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                            title="Mark Complete"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleMiss(sess.id)}
                            className={styles.iconBtn}
                            title="Mark Missed"
                          >
                            ✕
                          </button>
                          <span className={`${styles.pill} ${styles.pillOngoing}`}>● Planned</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // Default sample sessions if no timetable created yet
              <>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <span className={`${styles.agendaDot} ${styles.dotGreen}`} />
                    <span className={styles.agendaTime}>9:00 AM - 10:00 AM</span>
                    <div className={styles.agendaDetails}>
                      <span className={styles.agendaSubject}>Data Structures</span>
                      <span className={styles.agendaTopic}>Lecture · CS</span>
                    </div>
                  </div>
                  <span className={`${styles.pill} ${styles.pillSuccess}`}>✓ Completed</span>
                </div>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <span className={`${styles.agendaDot} ${styles.dotBlue}`} />
                    <span className={styles.agendaTime}>11:00 AM - 12:00 PM</span>
                    <div className={styles.agendaDetails}>
                      <span className={styles.agendaSubject}>Database Systems</span>
                      <span className={styles.agendaTopic}>Lecture · CS</span>
                    </div>
                  </div>
                  <span className={`${styles.pill} ${styles.pillOngoing}`}>● Ongoing</span>
                </div>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <span className={`${styles.agendaDot} ${styles.dotOrange}`} />
                    <span className={styles.agendaTime}>2:00 PM - 3:00 PM</span>
                    <div className={styles.agendaDetails}>
                      <span className={styles.agendaSubject}>Web Development</span>
                      <span className={styles.agendaTopic}>Lab · CS</span>
                    </div>
                  </div>
                  <span className={`${styles.pill} ${styles.pillUpcoming}`}>○ Upcoming</span>
                </div>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <span className={`${styles.agendaDot} ${styles.dotOrange}`} />
                    <span className={styles.agendaTime}>4:00 PM - 5:00 PM</span>
                    <div className={styles.agendaDetails}>
                      <span className={styles.agendaSubject}>Mathematics</span>
                      <span className={styles.agendaTopic}>Tutorial · Maths</span>
                    </div>
                  </div>
                  <span className={`${styles.pill} ${styles.pillUpcoming}`}>○ Upcoming</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Column 2: Subject Progress */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>📊</span> Subject Progress
            </h2>
            <Link to="/classrooms" className={styles.panelLink}>
              View all →
            </Link>
          </div>

          <div className={styles.subjectList}>
            {[
              { name: "Machine Learning", pct: 82, color: "#2563eb", icon: "🤖" },
              { name: "Database Systems", pct: 67, color: "#10b981", icon: "🗄️" },
              { name: "Web Development", pct: 54, color: "#f59e0b", icon: "🌐" },
              { name: "Mathematics", pct: 71, color: "#8b5cf6", icon: "📐" },
              { name: "Data Structures", pct: 88, color: "#06b6d4", icon: "🌲" },
            ].map((s) => (
              <div key={s.name} className={styles.subjectItem}>
                <div className={styles.subjectMeta}>
                  <div className={styles.subjectTitleRow}>
                    <div className={styles.subjectIconCircle} style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      {s.icon}
                    </div>
                    <span className={styles.subjectName}>{s.name}</span>
                  </div>
                  <span className={styles.subjectPercent}>{s.pct}%</span>
                </div>
                <div className={styles.subjectBar}>
                  <div className={styles.subjectFill} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Quick Access & Study Streak */}
        <div className={styles.rightWidgets}>
          {/* Quick Access Tiles */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Quick Access</h2>
            </div>
            <div className={styles.quickAccessGrid}>
              <Link to="/notes-rag" className={styles.quickTile}>
                <div className={styles.quickTileIcon} style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
                  📚
                </div>
                <span>Notes & RAG</span>
              </Link>
              <Link to="/quizzes" className={styles.quickTile}>
                <div className={styles.quickTileIcon} style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
                  📝
                </div>
                <span>Quizzes</span>
              </Link>
              <Link to="/ai-coach" className={styles.quickTile}>
                <div className={styles.quickTileIcon} style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
                  🎙️
                </div>
                <span>AI Coach</span>
              </Link>
              <Link to="/analytics" className={styles.quickTile}>
                <div className={styles.quickTileIcon} style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}>
                  📈
                </div>
                <span>Analytics</span>
              </Link>
            </div>
          </div>

          {/* Study Streak Card */}
          <div className={styles.streakCard}>
            <div className={styles.streakHeader}>
              <div className={styles.streakLeft}>
                <span className={styles.streakIcon}>🔥</span>
                <div>
                  <div className={styles.streakNumber}>5 days</div>
                  <div className={styles.streakSub}>Keep it up!</div>
                </div>
              </div>
              <span style={{ fontSize: "1.4rem" }}>📅</span>
            </div>
            <div className={styles.streakDays}>
              {[
                { day: "Mon", checked: true },
                { day: "Tue", checked: true },
                { day: "Wed", checked: true },
                { day: "Thu", checked: true },
                { day: "Fri", checked: true },
                { day: "Sat", checked: false },
                { day: "Sun", checked: false },
              ].map((d) => (
                <div key={d.day} className={styles.dayBubble}>
                  <div className={`${styles.dayCircle} ${d.checked ? styles.dayCircleChecked : ""}`}>
                    {d.checked ? "✓" : ""}
                  </div>
                  <span>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
