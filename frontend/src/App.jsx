import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoadingSpinner from './components/LoadingSpinner';
import './density.css';

// Import all pages directly
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import EventsPage from './pages/EventsPage';
import CheckinPage from './pages/CheckinPage';
import FaceEnrollmentPage from './pages/FaceEnrollmentPage';
import AttendanceLogsPage from './pages/AttendanceLogsPage';
import FinesPage from './pages/FinesPage';
import ReportsPage from './pages/ReportsPage';
import ArchivePage from './pages/ArchivePage';
import UsersPage from './pages/UsersPage';
import AuditLogPage from './pages/AuditLogPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentEventsPage from './pages/StudentEventsPage';
import EventAnalyticsPage from './pages/EventAnalyticsPage';
import EventViewPage from './pages/EventViewPage';
import EventEditPage from './pages/EventEditPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />

              {/* Officer/Admin routes */}
              <Route element={
                <ProtectedRoute roles={['officer', 'admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventViewPage />} />
                <Route path="/events/:id/edit" element={<EventEditPage />} />
                <Route path="/events/:id/analytics" element={<EventAnalyticsPage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/face-enrollment" element={<FaceEnrollmentPage />} />
                <Route path="/attendance" element={<AttendanceLogsPage />} />
                <Route path="/fines" element={<FinesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
              </Route>

              {/* Student routes */}
              <Route element={
                <ProtectedRoute roles={['student']}>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/student-dashboard" element={<StudentDashboardPage />} />
                <Route path="/student-attendance" element={<StudentAttendancePage />} />
                <Route path="/student-events" element={<StudentEventsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}






