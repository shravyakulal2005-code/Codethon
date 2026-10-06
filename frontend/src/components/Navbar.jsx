import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { studyPlanApi } from "../api/client";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleToast, setRescheduleToast] = useState("");

  const handleQuickReschedule = async () => {
    setRescheduling(true);
    try {
      await studyPlanApi.reschedule({ reason: "Quick reschedule from header" });
      setRescheduleToast("Schedule updated!");
      setTimeout(() => setRescheduleToast(""), 3000);
      // If currently on dashboard or timetable, reload or trigger event
      window.dispatchEvent(new CustomEvent("planUpdated"));
    } catch {
      setRescheduleToast("Failed to reschedule");
      setTimeout(() => setRescheduleToast(""), 3000);
    } finally {
      setRescheduling(false);
    }
  };

  const displayName = user?.name || "Prajwal Ganiga";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className={styles.navbar}>
      {/* Search Input */}
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search subjects, topics, or anything..."
          className={styles.searchInput}
        />
      </div>

      {/* Right Actions */}
      <div className={styles.actions}>
        {/* Notification Bell */}
        <button className={styles.notificationBtn} title="Notifications">
          <span>🔔</span>
          <span className={styles.badge}>3</span>
        </button>

        {/* Quick Reschedule Button */}
        <button
          onClick={handleQuickReschedule}
          disabled={rescheduling}
          className={styles.rescheduleBtn}
          title="Recalculate your study timetable"
        >
          <span>⚡</span>
          <span>{rescheduling ? "Updating..." : (rescheduleToast || "Quick Reschedule")}</span>
        </button>

        {/* Ask AI Coach Button */}
        <button
          onClick={() => navigate("/ai-coach")}
          className={styles.coachBtn}
        >
          <span>🎙️</span>
          <span>Ask AI Coach</span>
        </button>

        {/* User Pill */}
        <NavLink to="/profile" className={styles.userPill}>
          <div className={styles.userAvatar}>{initial}</div>
          <span className={styles.userName}>{displayName}</span>
          <span className={styles.dropdownArrow}>▾</span>
        </NavLink>
      </div>
    </header>
  );
}
