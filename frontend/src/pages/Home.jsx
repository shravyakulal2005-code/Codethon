import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { user, fetchMe } = useAuth();

  useEffect(() => {
    if (!user) fetchMe();
  }, []);

  return (
    <div className="page-container">
      <div className="home-hero">
        <div className="home-hero-content">
          <span className="home-badge">AI-Powered</span>
          <h1 className="home-title">
            Welcome back,{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0] ?? "Student"}</span>!
          </h1>
          <p className="home-subtitle">
            Your intelligent study planner is ready. Manage subjects, generate schedules,
            track progress, and chat with your AI tutor — all in one place.
          </p>
        </div>
        <div className="home-hero-art">🧠</div>
      </div>

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <Link to={f.href} key={f.title} className="feature-card glass">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
            <span className="feature-cta">Get started →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📚",
    title: "Subjects & Topics",
    href: "/classrooms",
    desc: "Organise your courses, add topics and track difficulty.",
  },
  {
    icon: "📅",
    title: "Study Planner",
    href: "/planner",
    desc: "AI generates a personalised schedule based on your availability.",
  },
  {
    icon: "🎯",
    title: "Exams & Deadlines",
    href: "/exams",
    desc: "Never miss a deadline — OCR imports dates from timetable images.",
  },
  {
    icon: "📊",
    title: "Progress Dashboard",
    href: "/dashboard",
    desc: "Visual charts of your study hours, completion rates and predictions.",
  },
  {
    icon: "🤖",
    title: "AI Chat Tutor",
    href: "/chat",
    desc: "Ask questions — answers come from your uploaded notes.",
  },
  {
    icon: "👤",
    title: "My Profile",
    href: "/profile",
    desc: "Update your name, email, password and availability.",
  },
];
