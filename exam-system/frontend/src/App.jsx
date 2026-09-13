import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage'
import StudentsPage from './pages/admin/StudentsPage'
import QuestionsPage from './pages/admin/QuestionsPage'
import ExamsPage from './pages/admin/ExamsPage'
import ResultsPage from './pages/admin/ResultsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'

// Student pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentExamsPage from './pages/student/StudentExamsPage'
import ExamInstructionsPage from './pages/student/ExamInstructionsPage'
import ExamPage from './pages/student/ExamPage'
import StudentResultPage from './pages/student/StudentResultPage'
import LeaderboardPage from './pages/student/LeaderboardPage'

import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="analytics/:examId" element={<AnalyticsPage />} />
            </Route>

            {/* Student routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="exams" element={<StudentExamsPage />} />
              <Route path="exam/:examId/instructions" element={<ExamInstructionsPage />} />
              <Route path="exam/:examId/take" element={<ExamPage />} />
              <Route path="results/:attemptId" element={<StudentResultPage />} />
              <Route path="leaderboard/:examId" element={<LeaderboardPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
