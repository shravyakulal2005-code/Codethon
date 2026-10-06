import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import ClassroomDetails from "./pages/ClassroomDetails";
import SubjectDetails from "./pages/SubjectDetails";
import Timetable from "./pages/Timetable";
import Availability from "./pages/Availability";
import NotesRag from "./pages/NotesRag";
import Quizzes from "./pages/Quizzes";
import AICoach from "./pages/AICoach";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected App Routes with Unified MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/classrooms/:id" element={<ClassroomDetails />} />
            <Route path="/subjects/:id" element={<SubjectDetails />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/notes-rag" element={<NotesRag />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
