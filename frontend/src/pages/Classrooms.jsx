import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { classroomApi } from "../api/client";
import styles from "./Classrooms.module.css";

export default function Classrooms() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", academic_year: "2026-2027" });

  const fetchClassrooms = async () => {
    try {
      const res = await classroomApi.getAll();
      setClassrooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await classroomApi.create(formData);
      setModalOpen(false);
      setFormData({ name: "", description: "", academic_year: "2026-2027" });
      fetchClassrooms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Classrooms & Semesters</h1>
          <p className={styles.subtitle}>Organize your academic syllabus, exams, notes, and schedules by semester.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className={styles.createBtn}>
          <span>+</span> New Classroom
        </button>
      </div>

      <div className={styles.grid}>
        {classrooms.length > 0 ? (
          classrooms.map((c) => (
            <div
              key={c.id}
              className={styles.card}
              onClick={() => navigate(`/classrooms/${c.id}`)}
            >
              <div>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{c.name}</h2>
                  <span className={styles.yearTag}>{c.academic_year || "Current"}</span>
                </div>
                <p className={styles.cardDesc}>{c.description || "Academic syllabus workspace."}</p>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.badge}>
                  <span>📚</span> {c.subject_count || 0} Subjects
                </span>
                <span className={styles.actionLink}>
                  Open Workspace <span>→</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          // Default initial card if student hasn't created one
          <div
            className={styles.card}
            onClick={() => setModalOpen(true)}
          >
            <div>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Computer Science & Engineering</h2>
                <span className={styles.yearTag}>Semester 7</span>
              </div>
              <p className={styles.cardDesc}>Default semester workspace for Machine Learning, DBMS, and Web Dev.</p>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.badge}>
                <span>📚</span> 5 Subjects
              </span>
              <span className={styles.actionLink}>
                + Set up now <span>→</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ────────────────────────────────────── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add New Classroom</h2>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Classroom / Semester Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science - Semester 7"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Academic Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-2027"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
