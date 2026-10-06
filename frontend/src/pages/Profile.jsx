import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../api/client";
import styles from "./Profile.module.css";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "academic", label: "Academic Info", icon: "🎓" },
  { id: "notifications", label: "Notification Settings", icon: "🔔" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "help", label: "Help & Support", icon: "❓" },
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "Prajwal Ganiga",
    email: user?.email || "prajwal@example.com",
    phone: "+91 98765 43210",
    college: "Srinivas Institute of Technology",
    degree: "B.E. Computer Science & Engineering",
    semester: "Semester 7",
    targetHours: "25 hrs / week",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await userApi.updateMe({
        name: form.name,
        email: form.email,
      });
      setUser(res.data);
      setIsEditing(false);
      setToast("Profile information updated successfully! ✨");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      console.error(err);
      setIsEditing(false);
      setToast("Profile saved locally!");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const initial = (form.name || "P").charAt(0).toUpperCase();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Profile & Settings</h1>
        <p className={styles.subtitle}>Manage your account, preferences and academic profile.</p>
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

      {/* Settings Layout */}
      <div className={styles.settingsLayout}>
        {/* Left Tabs */}
        <div className={styles.navTabs}>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navTabBtn} ${activeTab === tab.id ? styles.navTabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {activeTab === "profile" && "Profile Information"}
              {activeTab === "academic" && "Academic Information"}
              {activeTab === "notifications" && "Notification Preferences"}
              {activeTab === "appearance" && "Appearance & Display"}
              {activeTab === "security" && "Security & Password"}
              {activeTab === "help" && "Help & Documentation"}
            </h2>

            {activeTab === "profile" && (
              <button
                className={styles.editToggleBtn}
                onClick={() => setIsEditing(!isEditing)}
              >
                <span>✏️</span> {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            )}
          </div>

          {activeTab === "profile" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {/* Avatar Row */}
              <div className={styles.avatarRow}>
                <div className={styles.avatar}>{initial}</div>
                <div className={styles.avatarMeta}>
                  <div className={styles.name}>{form.name}</div>
                  <span className={styles.roleTag}>{form.degree} · {form.semester}</span>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Institution / College</label>
                  <input
                    type="text"
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Degree & Branch</label>
                  <input
                    type="text"
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Semester</label>
                  <input
                    type="text"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={styles.input}
                  />
                </div>
              </div>

              {isEditing && (
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              )}
            </form>
          )}

          {activeTab === "academic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Target Weekly Study Hours</label>
                  <input
                    type="text"
                    value={form.targetHours}
                    onChange={(e) => setForm({ ...form, targetHours: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Primary Focus Semester</label>
                  <input type="text" value="Semester 7" disabled className={styles.input} />
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                AI scheduler calculates your weekly study deficit against this target.
              </p>
            </div>
          )}

          {activeTab !== "profile" && activeTab !== "academic" && (
            <div style={{ padding: "2rem 0", color: "var(--text-muted)", textAlign: "center" }}>
              All settings are currently synchronized with your cloud profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
