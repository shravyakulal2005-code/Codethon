import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/classrooms", label: "Classrooms", icon: "🏫" },
  { path: "/timetable", label: "Timetable & Sessions", icon: "📅" },
  { path: "/availability", label: "Study Availability", icon: "⏰" },
  { path: "/notes-rag", label: "Notes & RAG", icon: "📚" },
  { path: "/quizzes", label: "Quizzes", icon: "📝" },
  { path: "/ai-coach", label: "AI Coach", icon: "🎙️" },
  { path: "/analytics", label: "Analytics", icon: "📈" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "Prajwal Ganiga";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🧠</div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>StudyMind AI</span>
          <span className={styles.brandSubtitle}>Smarter Learning, Brighter Future</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile & Actions */}
      <div className={styles.bottomSection}>
        <NavLink to="/profile" className={styles.profileCard}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{displayName}</div>
            <div className={styles.profileRole}>CS · Sem 7</div>
          </div>
          <span className={styles.chevron}>›</span>
        </NavLink>

        <div className={styles.actionLinks}>
          <NavLink to="/profile" className={styles.actionBtn}>
            <span>⚙️</span> Settings
          </NavLink>
          <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
