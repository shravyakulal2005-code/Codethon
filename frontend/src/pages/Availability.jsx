import { useState, useEffect } from "react";
import { availabilityApi, studyPlanApi } from "../api/client";
import styles from "./Availability.module.css";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_SCHEDULE = [
  { day: 0, active: true, start_time: "18:00", end_time: "21:00", minutes: 180 },
  { day: 1, active: true, start_time: "18:00", end_time: "21:00", minutes: 180 },
  { day: 2, active: true, start_time: "18:00", end_time: "21:00", minutes: 180 },
  { day: 3, active: true, start_time: "18:00", end_time: "21:00", minutes: 180 },
  { day: 4, active: true, start_time: "18:00", end_time: "21:00", minutes: 180 },
  { day: 5, active: true, start_time: "10:00", end_time: "15:00", minutes: 300 },
  { day: 6, active: true, start_time: "10:00", end_time: "14:00", minutes: 240 },
];

export default function Availability() {
  const [days, setDays] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const calculateMinutes = (start, end) => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const total = eh * 60 + em - (sh * 60 + sm);
      return total > 0 ? total : 60;
    } catch {
      return 60;
    }
  };

  const loadData = async () => {
    try {
      const res = await availabilityApi.getAll();
      if (res.data && res.data.length > 0) {
        // Map backend slots to 7 days
        const mapped = DAY_NAMES.map((_, idx) => {
          const match = res.data.find((slot) => slot.day_of_week === idx);
          if (match) {
            return {
              day: idx,
              active: true,
              start_time: match.start_time?.slice(0, 5) || "18:00",
              end_time: match.end_time?.slice(0, 5) || "21:00",
              minutes: match.available_minutes || 180,
            };
          }
          return {
            day: idx,
            active: false,
            start_time: "18:00",
            end_time: "20:00",
            minutes: 120,
          };
        });
        setDays(mapped);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDay = (idx) => {
    setDays((prev) =>
      prev.map((d) => (d.day === idx ? { ...d, active: !d.active } : d))
    );
  };

  const handleTimeChange = (idx, field, value) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day === idx) {
          const updated = { ...d, [field]: value };
          updated.minutes = calculateMinutes(updated.start_time, updated.end_time);
          return updated;
        }
        return d;
      })
    );
  };

  const applyPreset = (presetType) => {
    if (presetType === "standard") {
      setDays(DEFAULT_SCHEDULE);
    } else if (presetType === "intensive") {
      setDays(
        days.map((d) => ({
          ...d,
          active: true,
          start_time: "16:00",
          end_time: "21:00",
          minutes: 300,
        }))
      );
    } else if (presetType === "weekend") {
      setDays(
        days.map((d) => ({
          ...d,
          active: true,
          start_time: d.day >= 5 ? "09:00" : "19:00",
          end_time: d.day >= 5 ? "17:00" : "21:00",
          minutes: d.day >= 5 ? 480 : 120,
        }))
      );
    }
  };

  const handleSave = async () => {
    try {
      setToast("Saving study availability...");
      const activeSlots = days
        .filter((d) => d.active)
        .map((d) => ({
          day_of_week: d.day,
          start_time: d.start_time,
          end_time: d.end_time,
          available_minutes: d.minutes,
        }));

      await availabilityApi.setBatch(activeSlots);
      // Auto reschedule timetable
      await studyPlanApi.reschedule({ reason: "availability_updated" }).catch(() => {});

      setToast("Availability saved & timetable adaptively rescheduled! 🎉");
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      console.error(err);
      setToast("Error saving availability");
    }
  };

  const totalWeeklyMinutes = days.reduce(
    (sum, d) => sum + (d.active ? d.minutes : 0),
    0
  );
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const activeDaysCount = days.filter((d) => d.active).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Study Availability</h1>
          <p className={styles.subtitle}>
            Set your weekly study slots so AI schedules sessions during your optimal focus hours.
          </p>
        </div>

        <button onClick={handleSave} className={styles.saveBtn}>
          <span>💾</span> Save Availability
        </button>
      </div>

      {toast && (
        <div
          style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.9rem",
            border: "1px solid rgba(37, 99, 235, 0.2)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Presets Bar */}
      <div className={styles.presetsBar}>
        <span className={styles.presetsLabel}>⚡ Quick Presets:</span>
        <div className={styles.presetsGroup}>
          <button onClick={() => applyPreset("standard")} className={styles.presetBtn}>
            Standard Weekday Evening
          </button>
          <button onClick={() => applyPreset("intensive")} className={styles.presetBtn}>
            Intensive Exam Prep (5 hrs/day)
          </button>
          <button onClick={() => applyPreset("weekend")} className={styles.presetBtn}>
            Weekend Intensive
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{totalWeeklyHours} hrs</div>
          <div className={styles.statLabel}>Total Weekly Available</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{activeDaysCount} of 7</div>
          <div className={styles.statLabel}>Active Study Days</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>
            {activeDaysCount > 0 ? (totalWeeklyHours / activeDaysCount).toFixed(1) : 0} hrs
          </div>
          <div className={styles.statLabel}>Average Daily Capacity</div>
        </div>
      </div>

      {/* Days List */}
      <div className={styles.daysCard}>
        <div className={styles.daysList}>
          {days.map((d) => (
            <div
              key={d.day}
              className={`${styles.dayRow} ${!d.active ? styles.dayRowDisabled : ""}`}
            >
              {/* Left Switch & Name */}
              <div className={styles.dayIdentifier}>
                <div
                  className={`${styles.daySwitch} ${d.active ? styles.daySwitchActive : ""}`}
                  onClick={() => handleToggleDay(d.day)}
                >
                  <div className={styles.switchKnob} />
                </div>
                <span className={styles.dayName}>{DAY_NAMES[d.day]}</span>
              </div>

              {/* Middle Time Pickers */}
              <div className={styles.timePickers}>
                <div className={styles.pickerGroup}>
                  <span className={styles.pickerLabel}>Start:</span>
                  <input
                    type="time"
                    disabled={!d.active}
                    value={d.start_time}
                    onChange={(e) => handleTimeChange(d.day, "start_time", e.target.value)}
                    className={styles.timeInput}
                  />
                </div>

                <div className={styles.pickerGroup}>
                  <span className={styles.pickerLabel}>End:</span>
                  <input
                    type="time"
                    disabled={!d.active}
                    value={d.end_time}
                    onChange={(e) => handleTimeChange(d.day, "end_time", e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
              </div>

              {/* Right Duration Badge */}
              <div className={styles.durationBadge}>
                {d.active ? (
                  <>
                    <span className={styles.hoursNum}>{(d.minutes / 60).toFixed(1)} hrs</span>
                    <span className={styles.hoursLabel}>{d.minutes} minutes</span>
                  </>
                ) : (
                  <span style={{ color: "var(--text-light)", fontSize: "0.85rem", fontWeight: 500 }}>
                    Rest Day
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
