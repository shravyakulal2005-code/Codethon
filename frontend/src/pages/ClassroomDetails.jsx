import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { classroomApi, subjectApi, studyPlanApi } from "../api/client";
import styles from "./ClassroomDetails.module.css";

export default function ClassroomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [planToast, setPlanToast] = useState("");

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        classroomApi.getById(id),
        subjectApi.getByClassroom(id),
      ]);
      setClassroom(cRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await subjectApi.create(id, formData);
      setModalOpen(false);
      setFormData({ name: "", code: "", description: "" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      await studyPlanApi.generateForClassroom(id, { days_ahead: 7 });
      setPlanToast("Timetable generated!");
      setTimeout(() => setPlanToast(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div>
        <div className={styles.breadcrumb}>
          <Link to="/classrooms" className={styles.breadcrumbLink}>Classrooms</Link> › {classroom?.name || "Semester Workspace"}
        </div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{classroom?.name || "Computer Science & Engineering"}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {classroom?.academic_year || "Semester 7"} · {subjects.length} Subjects
            </p>
          </div>
          <div className={styles.actions}>
            <button onClick={handleGeneratePlan} className={styles.planBtn}>
              <span>⚡</span> {planToast || "Generate Study Plan"}
            </button>
            <button onClick={() => setModalOpen(true)} className={styles.addBtn}>
              <span>+</span> Add Subject
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className={styles.subjectGrid}>
        {subjects.length > 0 ? (
          subjects.map((s, idx) => {
            const prog = Math.round(s.progress || 0);
            const color = COLORS[idx % COLORS.length];

            return (
              <div
                key={s.id}
                className={styles.subjectCard}
                onClick={() => navigate(`/subjects/${s.id}`)}
              >
                <div>
                  <div className={styles.cardTop}>
                    <h3 className={styles.subjectTitle}>{s.name}</h3>
                    {s.code && <span className={styles.codeTag}>{s.code}</span>}
                  </div>

                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressLabels}>
                      <span className={styles.progressLabelText}>Progress</span>
                      <span className={styles.progressVal}>{prog}%</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${prog}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <span>📝 {s.topic_count || 0} Topics</span>
                  <span style={{ color: "var(--primary)", fontWeight: 600 }}>Explore →</span>
                </div>
              </div>
            );
          })
        ) : (
          // Default initial subject cards
          [
            { id: 1, name: "Machine Learning", code: "CS701", prog: 72, topics: 12 },
            { id: 2, name: "Database Systems", code: "CS702", prog: 58, topics: 9 },
            { id: 3, name: "Web Development", code: "CS703", prog: 45, topics: 10 },
            { id: 4, name: "Computer Networks", code: "CS704", prog: 68, topics: 11 },
          ].map((s, idx) => (
            <div
              key={s.id}
              className={styles.subjectCard}
              onClick={() => setModalOpen(true)}
            >
              <div>
                <div className={styles.cardTop}>
                  <h3 className={styles.subjectTitle}>{s.name}</h3>
                  <span className={styles.codeTag}>{s.code}</span>
                </div>

                <div className={styles.progressBarContainer}>
                  <div className={styles.progressLabels}>
                    <span className={styles.progressLabelText}>Progress</span>
                    <span className={styles.progressVal}>{s.prog}%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${s.prog}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                  </div>
                </div>
              </div>

              <div className={styles.cardBottom}>
                <span>📝 {s.topics} Topics</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>+ Add to DB</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Subject Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1.25rem", fontSize: "1.3rem" }}>
              Add Subject
            </h2>
            <form onSubmit={handleCreateSubject}>
              <div className={styles.formGroup}>
                <label>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS701"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Brief subject overview..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "var(--primary)", color: "white", padding: "0.6rem 1.3rem", borderRadius: "var(--radius-full)", fontWeight: 600 }}
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
