import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to /login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default apiClient;

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => apiClient.post("/auth/register", data),
  login: (data) => apiClient.post("/auth/login", data),
};

// ── User API ──────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => apiClient.get("/users/me"),
  updateMe: (data) => apiClient.put("/users/me", data),
};

// ── Classrooms API ────────────────────────────────────────────────────────────
export const classroomApi = {
  getAll: () => apiClient.get("/classrooms"),
  getById: (id) => apiClient.get(`/classrooms/${id}`),
  create: (data) => apiClient.post("/classrooms", data),
  update: (id, data) => apiClient.put(`/classrooms/${id}`, data),
  delete: (id) => apiClient.delete(`/classrooms/${id}`),
};

// ── Subjects API ──────────────────────────────────────────────────────────────
export const subjectApi = {
  getByClassroom: (classroomId) => apiClient.get(`/classrooms/${classroomId}/subjects`),
  getById: (id) => apiClient.get(`/subjects/${id}`),
  create: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/subjects`, data),
  update: (id, data) => apiClient.put(`/subjects/${id}`, data),
  delete: (id) => apiClient.delete(`/subjects/${id}`),
};

// ── Topics API ────────────────────────────────────────────────────────────────
export const topicApi = {
  getBySubject: (subjectId) => apiClient.get(`/subjects/${subjectId}/topics`),
  create: (subjectId, data) => apiClient.post(`/subjects/${subjectId}/topics`, data),
  update: (id, data) => apiClient.put(`/topics/${id}`, data),
  delete: (id) => apiClient.delete(`/topics/${id}`),
};

// ── Exams API ─────────────────────────────────────────────────────────────────
export const examApi = {
  getBySubject: (subjectId) => apiClient.get(`/subjects/${subjectId}/exams`),
  create: (subjectId, data) => apiClient.post(`/subjects/${subjectId}/exams`, data),
  update: (id, data) => apiClient.put(`/exams/${id}`, data),
  delete: (id) => apiClient.delete(`/exams/${id}`),
};

// ── Assignments API ───────────────────────────────────────────────────────────
export const assignmentApi = {
  getBySubject: (subjectId) => apiClient.get(`/subjects/${subjectId}/assignments`),
  create: (subjectId, data) => apiClient.post(`/subjects/${subjectId}/assignments`, data),
  update: (id, data) => apiClient.put(`/assignments/${id}`, data),
  delete: (id) => apiClient.delete(`/assignments/${id}`),
};

// ── Availability API ──────────────────────────────────────────────────────────
export const availabilityApi = {
  getAll: () => apiClient.get("/availability"),
  setBatch: (slots) => apiClient.post("/availability", { slots }),
  delete: (id) => apiClient.delete(`/availability/${id}`),
};

// ── Study Plan & Sessions API ─────────────────────────────────────────────────
export const studyPlanApi = {
  getActive: () => apiClient.get("/study-plan/active"),
  generate: (data = {}) => apiClient.post("/study-plan/generate", data),
  generateForClassroom: (classroomId, data = {}) => apiClient.post(`/classrooms/${classroomId}/study-plan/generate`, data),
  getSessions: () => apiClient.get("/study-sessions"),
  completeSession: (sessionId, data) => apiClient.post(`/study-sessions/${sessionId}/complete`, data),
  missSession: (sessionId) => apiClient.post(`/study-sessions/${sessionId}/miss`),
  reschedule: (data = {}) => apiClient.post("/study-plan/reschedule", data),
};

// ── Notes & RAG API ───────────────────────────────────────────────────────────
export const notesApi = {
  getBySubject: (subjectId) => apiClient.get(`/subjects/${subjectId}/notes`),
  getById: (id) => apiClient.get(`/notes/${id}`),
  upload: (subjectId, formData) =>
    apiClient.post(`/subjects/${subjectId}/notes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => apiClient.delete(`/notes/${id}`),
  queryRag: (data) => apiClient.post("/rag/query", data),
};

// ── Quizzes API ───────────────────────────────────────────────────────────────
export const quizApi = {
  generate: (data) => apiClient.post("/quizzes/generate", data),
  getById: (id) => apiClient.get(`/quizzes/${id}`),
  submit: (id, answers) => apiClient.post(`/quizzes/${id}/submit`, { answers }),
};

// ── Dashboard & Analytics API ─────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => apiClient.get("/dashboard"),
};

export const analyticsApi = {
  getSummary: () => apiClient.get("/analytics"),
};

// ── AI Assistant API ──────────────────────────────────────────────────────────
export const aiApi = {
  chat: (data) => apiClient.post("/ai/chat", data),
  extractTimetable: (rawText) => apiClient.post("/ai/timetable/extract", { raw_text: rawText }),
  getAudioGuidance: (data) => apiClient.post("/ai/audio/guidance", data),
};
