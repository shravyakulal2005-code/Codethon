import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../api/client";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, password: "" });
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      const res = await userApi.updateMe(payload);
      setUser(res.data);
      setSuccess("Profile updated successfully!");
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">My Profile</h2>
        <button id="logout-btn" className="btn btn-outline" onClick={logout}>
          Sign Out
        </button>
      </div>

      <div className="card profile-card glass">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-meta">
          <h3>{user.name}</h3>
          <span className="profile-email">{user.email}</span>
          <span className="profile-since">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card glass" style={{ marginTop: "1.5rem" }}>
        <h3 className="card-title">Edit Profile</h3>
        <form onSubmit={handleSubmit} id="profile-form">
          <div className="form-group">
            <label htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-password">
              New Password <span className="optional">(leave blank to keep)</span>
            </label>
            <input
              id="profile-password"
              name="password"
              type="password"
              placeholder="Min 8 chars, 1 letter + 1 digit"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              className="form-input"
            />
          </div>

          {success && <div className="success-banner">{success}</div>}
          {error && <div className="error-banner">{error}</div>}

          <button
            id="profile-save"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
