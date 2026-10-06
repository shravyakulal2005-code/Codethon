import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { subjectApi, topicApi, assignmentApi, examApi, notesApi } from "../api/client";
import styles from "./SubjectDetails.module.css";

export default function SubjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("topics");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  // Form states
  const [topicForm, setTopicForm] = useState({ name: "", estimated_minutes: 60, difficulty: "medium" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", due_date: "", description: "" });
  const [examForm, setExamForm] = useState({ title: "", exam_date: "", weightage: 20 });

  const loadData = async () => {
    try {
      const [sRes, tRes, aRes, eRes, nRes] = await Promise.all([
        subjectApi.getById(id),
        topicApi.getBySubject(id),
        assignmentApi.getBySubject(id),
        examApi.getBySubject(id),
        notesApi.getBySubject(id).catch(() => ({ data: [] })),
      ]);

      setSubject(sRes.data);
      const topList = tRes.data || [];
      setTopics(topList);
      if (topList.length > 0 && !selectedTopic) {
        setSelectedTopic(topList[0]);
      }
      setAssignments(aRes.data || []);
      setExams(eRes.data || []);
      setNotes(nRes.data || []);
    } catch (err) {
      console.error("Failed to load subject details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.name) return;
    try {
      await topicApi.create(id, {
        name: topicForm.name,
        estimated_minutes: parseInt(topicForm.estimated_minutes, 10),
        difficulty: topicForm.difficulty,
        order: topics.length + 1,
      });
      setShowAddTopic(false);
      setTopicForm({ name: "", estimated_minutes: 60, difficulty: "medium" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTopicProgress = async (newVal) => {
    if (!selectedTopic) return;
    const progress = Math.min(100, Math.max(0, parseInt(newVal, 10) || 0));
    const status = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "pending";

    // Optimistic update
    const updated = { ...selectedTopic, progress_percentage: progress, status };
    setSelectedTopic(updated);
    setTopics(topics.map((t) => (t.id === selectedTopic.id ? updated : t)));

    try {
      await topicApi.update(selectedTopic.id, {
        progress_percentage: progress,
        status: status,
      });
      // reload subject to reflect overall progress
      const sRes = await subjectApi.getById(id);
      setSubject(sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title) return;
    try {
      await assignmentApi.create(id, {
        title: assignmentForm.title,
        due_date: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : new Date().toISOString(),
        description: assignmentForm.description,
        status: "pending",
      });
      setShowAddAssignment(false);
      setAssignmentForm({ title: "", due_date: "", description: "" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examForm.title) return;
    try {
      await examApi.create(id, {
        title: examForm.title,
        exam_date: examForm.exam_date ? new Date(examForm.exam_date).toISOString() : new Date().toISOString(),
        weightage: parseFloat(examForm.weightage) || 20,
      });
      setShowAddExam(false);
      setExamForm({ title: "", exam_date: "", weightage: 20 });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const overallProgress = Math.round(subject?.progress || 0);

  // SVG ring calculation
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className={styles.container}>
      {/* Breadcrumb & Header */}
      <div>
        <div className={styles.breadcrumb}>
          <Link to="/classrooms" className={styles.breadcrumbLink}>Classrooms</Link>
          {" › "}
          {subject?.classroom_name ? (
            <Link to={`/classrooms/${subject.classroom_id}`} className={styles.breadcrumbLink}>
              {subject.classroom_name}
            </Link>
          ) : (
            <span>Workspace</span>
          )}
          {" › "}
          <span>{subject?.name || "Subject"}</span>
        </div>

        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.subjectIconCircle}>
              {subject?.code ? subject.code.substring(0, 2).toUpperCase() : "📘"}
            </div>
            <div>
              <h1 className={styles.title}>{subject?.name || "Subject Details"}</h1>
              <p className={styles.subtitle}>
                {subject?.description || "Explore topics, track progress, and ace your exams."}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button onClick={() => navigate(`/notes-rag?subjectId=${id}`)} className={styles.secondaryBtn}>
              <span>📚</span> View Notes
            </button>
            <button onClick={() => setShowAddTopic(true)} className={styles.addBtn}>
              <span>+</span> Add Topic
            </button>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className={styles.statsStrip}>
        <div className={styles.progressTile}>
          <div className={styles.ringWrapper}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="7"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span className={styles.ringText}>{overallProgress}%</span>
          </div>
          <div>
            <div className={styles.progressInfoTitle}>Overall Progress</div>
            <div className={styles.progressInfoDesc}>Keep up the rhythm!</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statVal}>{topics.length}</div>
          <div className={styles.statLabel}>Total Topics</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statVal}>
            {assignments.filter((a) => a.status === "completed" || a.status === "submitted").length}/{assignments.length}
          </div>
          <div className={styles.statLabel}>Assignments Done</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statVal}>{exams.length}</div>
          <div className={styles.statLabel}>Scheduled Exams</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "topics" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("topics")}
        >
          <span>📖 Topics</span>
          <span className={styles.tabBadge}>{topics.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "assignments" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          <span>📋 Assignments</span>
          <span className={styles.tabBadge}>{assignments.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "exams" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("exams")}
        >
          <span>🎯 Exams</span>
          <span className={styles.tabBadge}>{exams.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "notes" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <span>📑 Notes & PDFs</span>
          <span className={styles.tabBadge}>{notes.length}</span>
        </button>
      </div>

      {/* Tab: TOPICS */}
      {activeTab === "topics" && (
        <div className={styles.topicsSplit}>
          {/* Left: Topic List */}
          <div className={styles.topicsCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Syllabus Topics</h2>
              <button onClick={() => setShowAddTopic(true)} className={styles.secondaryBtn} style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
                + Add
              </button>
            </div>

            {topics.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                No topics added yet. Click "+ Add Topic" to start.
              </p>
            ) : (
              <div className={styles.topicList}>
                {topics.map((t, idx) => {
                  const isDone = (t.progress_percentage || 0) >= 100;
                  const isInProg = (t.progress_percentage || 0) > 0 && !isDone;
                  const isSelected = selectedTopic?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`${styles.topicItem} ${isSelected ? styles.topicItemActive : ""}`}
                      onClick={() => setSelectedTopic(t)}
                    >
                      <div className={styles.topicLeft}>
                        <div
                          className={`${styles.statusIndicator} ${
                            isDone ? styles.statusDone : isInProg ? styles.statusProgress : styles.statusPending
                          }`}
                        >
                          {isDone ? "✓" : isInProg ? "◑" : idx + 1}
                        </div>
                        <div>
                          <div className={styles.topicName}>{t.name}</div>
                          <div className={styles.topicMeta}>
                            <span>⏱ {t.estimated_minutes || 60}m</span>
                            <span
                              className={`${styles.difficultyPill} ${
                                t.difficulty === "easy"
                                  ? styles.diffEasy
                                  : t.difficulty === "hard"
                                  ? styles.diffHard
                                  : styles.diffMedium
                              }`}
                            >
                              {t.difficulty || "medium"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.topicRight}>
                        <span className={styles.percentBadge}>{Math.round(t.progress_percentage || 0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Topic Quick Actions */}
          <div className={styles.detailCard}>
            {selectedTopic ? (
              <>
                <div className={styles.detailHeader}>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase" }}>
                    Selected Focus Topic
                  </div>
                  <h3 className={styles.detailTitle}>{selectedTopic.name}</h3>
                  <p className={styles.detailDesc}>
                    Estimated time: {selectedTopic.estimated_minutes || 60} mins · Difficulty: {selectedTopic.difficulty}
                  </p>
                </div>

                <div className={styles.progressSliderBlock}>
                  <div className={styles.sliderHeader}>
                    <span>Topic Mastery</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                      {Math.round(selectedTopic.progress_percentage || 0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(selectedTopic.progress_percentage || 0)}
                    onChange={(e) => handleUpdateTopicProgress(e.target.value)}
                    className={styles.rangeInput}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>0% Not Started</span>
                    <span>50% In Progress</span>
                    <span>100% Completed</span>
                  </div>
                </div>

                <div className={styles.actionTileList}>
                  <div className={styles.actionTile}>
                    <div className={styles.tileLeft}>
                      <span className={styles.tileIcon}>📝</span>
                      <div>
                        <div className={styles.tileName}>Notes & RAG Summary</div>
                        <div className={styles.tileSub}>Review extracted study notes</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/notes-rag?subjectId=${id}`)}
                      className={styles.tileBtn}
                    >
                      View
                    </button>
                  </div>

                  <div className={styles.actionTile}>
                    <div className={styles.tileLeft}>
                      <span className={styles.tileIcon}>🎯</span>
                      <div>
                        <div className={styles.tileName}>Practice Quiz</div>
                        <div className={styles.tileSub}>Test yourself on this topic</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/quizzes?subjectId=${id}&topicId=${selectedTopic.id}`)}
                      className={styles.tileBtn}
                    >
                      Start
                    </button>
                  </div>

                  <div className={styles.actionTile}>
                    <div className={styles.tileLeft}>
                      <span className={styles.tileIcon}>🎙️</span>
                      <div>
                        <div className={styles.tileName}>Ask AI Tutor</div>
                        <div className={styles.tileSub}>Get audio or text explanations</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/ai-coach?topic=${encodeURIComponent(selectedTopic.name)}`)}
                      className={styles.tileBtn}
                    >
                      Coach
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem" }}>
                Select a topic on the left to see actions and adjust progress.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button onClick={() => setShowAddAssignment(true)} className={styles.addBtn}>
              + Add Assignment
            </button>
          </div>
          {assignments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ color: "var(--text-muted)" }}>No assignments added yet.</p>
            </div>
          ) : (
            <div className={styles.cardsList}>
              {assignments.map((a) => (
                <div key={a.id} className={styles.itemCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>📋</div>
                    <div>
                      <div className={styles.itemTitle}>{a.title}</div>
                      <div className={styles.itemDate}>
                        Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "No deadline set"}
                      </div>
                    </div>
                  </div>
                  <span className={a.status === "completed" ? styles.badgeSuccess : styles.badgeWarning}>
                    {a.status === "completed" ? "Submitted" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: EXAMS */}
      {activeTab === "exams" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button onClick={() => setShowAddExam(true)} className={styles.addBtn}>
              + Add Exam
            </button>
          </div>
          {exams.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ color: "var(--text-muted)" }}>No exams scheduled for this subject.</p>
            </div>
          ) : (
            <div className={styles.cardsList}>
              {exams.map((e) => {
                const daysLeft = Math.ceil((new Date(e.exam_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={e.id} className={styles.itemCard}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemIcon}>🎯</div>
                      <div>
                        <div className={styles.itemTitle}>{e.title}</div>
                        <div className={styles.itemDate}>
                          Date: {new Date(e.exam_date).toLocaleDateString()} · Weightage: {e.weightage}%
                        </div>
                      </div>
                    </div>
                    <span className={daysLeft <= 3 ? styles.badgeDanger : daysLeft <= 7 ? styles.badgeWarning : styles.badgeSuccess}>
                      {daysLeft < 0 ? "Completed" : daysLeft === 0 ? "Today!" : `${daysLeft} days left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: NOTES */}
      {activeTab === "notes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button onClick={() => navigate(`/notes-rag?subjectId=${id}`)} className={styles.addBtn}>
              + Upload PDF in Notes & RAG
            </button>
          </div>
          {notes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ color: "var(--text-muted)" }}>No notes uploaded for this subject yet.</p>
            </div>
          ) : (
            <div className={styles.cardsList}>
              {notes.map((n) => (
                <div key={n.id} className={styles.itemCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>📄</div>
                    <div>
                      <div className={styles.itemTitle}>{n.title || n.filename}</div>
                      <div className={styles.itemDate}>
                        {n.file_size ? `${(n.file_size / (1024 * 1024)).toFixed(1)} MB` : "Document"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/notes-rag?subjectId=${id}`)}
                    className={styles.secondaryBtn}
                  >
                    Query RAG →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Topic */}
      {showAddTopic && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Syllabus Topic</h3>
              <button onClick={() => setShowAddTopic(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateTopic}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Topic Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Neural Networks & Backprop"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Estimated Minutes</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={topicForm.estimated_minutes}
                  onChange={(e) => setTopicForm({ ...topicForm, estimated_minutes: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Difficulty</label>
                <select
                  value={topicForm.difficulty}
                  onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                  className={styles.select}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddTopic(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Assignment */}
      {showAddAssignment && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Assignment</h3>
              <button onClick={() => setShowAddAssignment(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lab Assignment 3: CNN Implementation"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Due Date</label>
                <input
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Guidelines or requirements..."
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddAssignment(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Exam */}
      {showAddExam && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Scheduled Exam</h3>
              <button onClick={() => setShowAddExam(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateExam}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Exam Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Exam Date *</label>
                <input
                  type="date"
                  value={examForm.exam_date}
                  onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Weightage (% of total grade)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={examForm.weightage}
                  onChange={(e) => setExamForm({ ...examForm, weightage: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddExam(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
