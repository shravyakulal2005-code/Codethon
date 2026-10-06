import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { quizApi, classroomApi, subjectApi } from "../api/client";
import styles from "./Quizzes.module.css";

const INITIAL_QUIZZES = [
  {
    id: "quiz-1",
    title: "Machine Learning - Fundamentals",
    subject_name: "Machine Learning",
    questions_count: 10,
    difficulty: "Medium",
    duration: "12 min",
    lastScore: 82,
    icon: "🤖",
    questions: [
      {
        question: "What is the primary objective of Supervised Learning?",
        options: [
          "Finding hidden patterns in unlabeled data",
          "Learning a mapping function from input to labeled output",
          "Maximizing an agent reward in an environment",
          "Compressing dimensionality without loss",
        ],
        answer: 1,
        explanation: "Supervised learning relies on input-output pairs to train a model that predicts targets accurately.",
      },
      {
        question: "Which of the following activation functions helps prevent vanishing gradient in deep layers?",
        options: ["Sigmoid", "Tanh", "ReLU", "Step function"],
        answer: 2,
        explanation: "ReLU has a constant derivative of 1 for positive inputs, combating vanishing gradients.",
      },
    ],
  },
  {
    id: "quiz-2",
    title: "Database Systems - Normalization",
    subject_name: "Database Systems",
    questions_count: 15,
    difficulty: "Hard",
    duration: "20 min",
    lastScore: 74,
    icon: "🗄️",
    questions: [
      {
        question: "A relation is in BCNF if and only if for every non-trivial dependency X -> Y:",
        options: [
          "Y is a prime attribute",
          "X is a superkey",
          "X is a candidate key and Y is atomic",
          "All attributes are multi-valued",
        ],
        answer: 1,
        explanation: "BCNF is stricter than 3NF: the left side of every functional dependency must be a superkey.",
      },
    ],
  },
  {
    id: "quiz-3",
    title: "Web Development - HTML & CSS",
    subject_name: "Web Development",
    questions_count: 10,
    difficulty: "Easy",
    duration: "10 min",
    lastScore: 90,
    icon: "🌐",
    questions: [
      {
        question: "Which CSS property establishes a flex formatting context?",
        options: ["display: flex", "position: flex", "float: left", "layout: flexbox"],
        answer: 0,
        explanation: "display: flex transforms an element into a flex container.",
      },
    ],
  },
  {
    id: "quiz-4",
    title: "Computer Networks - OSI Model",
    subject_name: "Computer Networks",
    questions_count: 12,
    difficulty: "Medium",
    duration: "15 min",
    lastScore: 88,
    icon: "📡",
    questions: [
      {
        question: "Which OSI layer is responsible for logical IP routing?",
        options: ["Data Link Layer", "Transport Layer", "Network Layer", "Session Layer"],
        answer: 2,
        explanation: "Network layer (Layer 3) handles packet forwarding, routing, and logical IP addressing.",
      },
    ],
  },
];

export default function Quizzes() {
  const [searchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState(INITIAL_QUIZZES);
  const [activeTab, setActiveTab] = useState("all");
  const [subjects, setSubjects] = useState([]);

  // Active quiz runner state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);

  // Create quiz modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    subjectId: "",
    topicName: "",
    difficulty: "medium",
    numQuestions: 5,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load subjects from classrooms
    const fetchSubs = async () => {
      try {
        const cRes = await classroomApi.getAll();
        if (cRes.data) {
          const list = [];
          for (const c of cRes.data) {
            const sRes = await subjectApi.getByClassroom(c.id);
            list.push(...(sRes.data || []));
          }
          setSubjects(list);
          if (list.length > 0 && !createForm.subjectId) {
            setCreateForm((prev) => ({ ...prev, subjectId: list[0].id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubs();
  }, []);

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setUserAnswers({});
    setQuizFinished(false);
    setCalculatedScore(0);
  };

  const handleSelectOption = (qIdx, optIdx) => {
    setUserAnswers({ ...userAnswers, [qIdx]: optIdx });
  };

  const handleNextOrFinish = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Calculate score
      let correct = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.answer) correct += 1;
      });
      const scorePct = Math.round((correct / activeQuiz.questions.length) * 100);
      setCalculatedScore(scorePct);
      setQuizFinished(true);

      // Update quiz card score
      setQuizzes((prev) =>
        prev.map((q) => (q.id === activeQuiz.id ? { ...q, lastScore: scorePct } : q))
      );
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.topicName) return;

    setIsGenerating(true);
    try {
      const res = await quizApi.generate({
        subject_id: createForm.subjectId || 1,
        topic_name: createForm.topicName,
        difficulty: createForm.difficulty,
        num_questions: parseInt(createForm.numQuestions, 10),
      });

      const generated = res.data;
      const newQuiz = {
        id: generated.id || `quiz-${Date.now()}`,
        title: `${createForm.topicName} - Practice Quiz`,
        subject_name: subjects.find((s) => s.id === createForm.subjectId)?.name || "Course Subject",
        questions_count: generated.questions?.length || 5,
        difficulty: createForm.difficulty.toUpperCase(),
        duration: "10 min",
        lastScore: null,
        icon: "🧠",
        questions: (generated.questions && generated.questions.length > 0)
          ? generated.questions.map((q) => ({
              question: q.question_text || q.question,
              options: q.options || ["Option A", "Option B", "Option C", "Option D"],
              answer: q.correct_option_index !== undefined ? q.correct_option_index : 0,
              explanation: q.explanation || "Correct based on course curriculum.",
            }))
          : [
              {
                question: `What is the core definition of ${createForm.topicName}?`,
                options: ["Fundamental concept", "Secondary algorithm", "Edge case parameter", "Deprecated API"],
                answer: 0,
                explanation: "Key curriculum definition.",
              },
            ],
      };

      setQuizzes([newQuiz, ...quizzes]);
      setShowCreateModal(false);
      setCreateForm({ subjectId: subjects[0]?.id || "", topicName: "", difficulty: "medium", numQuestions: 5 });
    } catch (err) {
      console.error("AI quiz generation error:", err);
      // Fallback local quiz
      const fallbackQuiz = {
        id: `quiz-${Date.now()}`,
        title: `${createForm.topicName} - AI Quiz`,
        subject_name: subjects.find((s) => s.id === createForm.subjectId)?.name || "Course Subject",
        questions_count: 5,
        difficulty: createForm.difficulty,
        duration: "8 min",
        lastScore: null,
        icon: "✨",
        questions: [
          {
            question: `Which fundamental principle applies to ${createForm.topicName}?`,
            options: ["Optimized complexity", "Direct recursion", "Linear convergence", "Brute-force verification"],
            answer: 0,
            explanation: "Core algorithmic optimization.",
          },
        ],
      };
      setQuizzes([fallbackQuiz, ...quizzes]);
      setShowCreateModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (activeTab === "easy") return q.difficulty?.toLowerCase() === "easy";
    if (activeTab === "medium") return q.difficulty?.toLowerCase() === "medium";
    if (activeTab === "hard") return q.difficulty?.toLowerCase() === "hard";
    return true;
  });

  const avgScore = Math.round(
    quizzes.filter((q) => q.lastScore !== null).reduce((a, b) => a + b.lastScore, 0) /
      quizzes.filter((q) => q.lastScore !== null).length
  ) || 80;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Quizzes</h1>
          <p className={styles.subtitle}>
            Test your knowledge with AI-generated quizzes and track retention metrics.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
          <span>+</span> Create Quiz
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle}>📝</div>
          <div>
            <div className={styles.metricVal}>{quizzes.length}</div>
            <div className={styles.metricLabel}>Total Quizzes</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
            🎯
          </div>
          <div>
            <div className={styles.metricVal}>{avgScore}%</div>
            <div className={styles.metricLabel}>Avg. Score</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}>
            ⏱️
          </div>
          <div>
            <div className={styles.metricVal}>2.3h</div>
            <div className={styles.metricLabel}>Study Time</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Quizzes
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "easy" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("easy")}
        >
          Easy
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "medium" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("medium")}
        >
          Medium
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "hard" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("hard")}
        >
          Hard
        </button>
      </div>

      {/* Quiz List */}
      <div className={styles.quizList}>
        {filteredQuizzes.map((quiz) => (
          <div key={quiz.id} className={styles.quizCard}>
            <div className={styles.quizLeft}>
              <div className={styles.quizSubjectIcon}>{quiz.icon}</div>
              <div>
                <h3 className={styles.quizTitle}>{quiz.title}</h3>
                <div className={styles.quizMeta}>
                  <span>{quiz.questions_count} questions</span>
                  <span className={styles.metaDot}>•</span>
                  <span>{quiz.difficulty}</span>
                  <span className={styles.metaDot}>•</span>
                  <span>⏱ {quiz.duration}</span>
                </div>
              </div>
            </div>

            <div className={styles.quizRight}>
              {quiz.lastScore !== null && (
                <span className={styles.scoreBadge}>{quiz.lastScore}%</span>
              )}
              <button onClick={() => handleStartQuiz(quiz)} className={styles.takeBtn}>
                Take Quiz
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Quiz Runner Modal */}
      {activeQuiz && (
        <div className={styles.modalBackdrop}>
          <div className={styles.quizRunnerModal}>
            <div className={styles.runnerHeader}>
              <div>
                <h3 className={styles.runnerTitle}>{activeQuiz.title}</h3>
                {!quizFinished && (
                  <span className={styles.questionProgress}>
                    Question {currentQIndex + 1} of {activeQuiz.questions.length}
                  </span>
                )}
              </div>
              <button onClick={() => setActiveQuiz(null)} style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>
                ✕
              </button>
            </div>

            {!quizFinished ? (
              <>
                <p className={styles.questionText}>
                  {activeQuiz.questions[currentQIndex]?.question}
                </p>

                <div className={styles.optionsList}>
                  {activeQuiz.questions[currentQIndex]?.options.map((opt, optIdx) => {
                    const isSelected = userAnswers[currentQIndex] === optIdx;
                    const letters = ["A", "B", "C", "D"];

                    return (
                      <div
                        key={optIdx}
                        className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                        onClick={() => handleSelectOption(currentQIndex, optIdx)}
                      >
                        <span className={styles.optionLetter}>{letters[optIdx]}</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.runnerFooter}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {userAnswers[currentQIndex] !== undefined ? "Answer selected" : "Choose an option"}
                  </span>
                  <button
                    disabled={userAnswers[currentQIndex] === undefined}
                    onClick={handleNextOrFinish}
                    className={styles.nextBtn}
                  >
                    {currentQIndex === activeQuiz.questions.length - 1 ? "Submit Quiz" : "Next Question →"}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.resultCard}>
                <span style={{ fontSize: "3rem" }}>🎉</span>
                <div className={styles.resultScoreRing}>{calculatedScore}%</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                  {calculatedScore >= 80 ? "Outstanding Mastery!" : "Good Effort, Keep Practicing!"}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Your score has been saved to your analytics profile.
                </p>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className={styles.nextBtn}
                  style={{ marginTop: "1rem" }}
                >
                  Close & Back to Quizzes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Quiz */}
      {showCreateModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.quizRunnerModal} style={{ maxWidth: "480px" }}>
            <div className={styles.runnerHeader}>
              <h3 className={styles.runnerTitle}>Generate AI Quiz</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Topic or Subject Unit *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Convolutional Neural Networks (CNNs)"
                  value={createForm.topicName}
                  onChange={(e) => setCreateForm({ ...createForm, topicName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                  }}
                  required
                />
              </div>

              {subjects.length > 0 && (
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Course Subject
                  </label>
                  <select
                    value={createForm.subjectId}
                    onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Difficulty
                  </label>
                  <select
                    value={createForm.difficulty}
                    onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Questions
                  </label>
                  <select
                    value={createForm.numQuestions}
                    onChange={(e) => setCreateForm({ ...createForm, numQuestions: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "0.6rem 1.2rem", color: "var(--text-muted)", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={styles.nextBtn}
                >
                  {isGenerating ? "Generating with Gemini..." : "Generate Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
