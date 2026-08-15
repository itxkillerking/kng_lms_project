import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleRoute } from './components/layout/RoleRoute';
import { AuthLayout, StudentLayout, InstructorLayout } from './components/layout/Layouts';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/shared/Dashboard';
import { Error403, Error404, Error500 } from './pages/errors/ErrorPages';
import { ViolationsPlaceholder, SnapshotsPlaceholder, ReportsPlaceholder } from './pages/placeholders/Placeholders';
import { StudentExams, StudentExamDetail } from './pages/student/StudentExams';
import { StudentResults } from './pages/student/StudentResults';
import { StudentCourses } from './pages/student/StudentCourses';
import { StudentProfile } from './pages/student/StudentProfile';
import { ExamScreen } from './pages/student/ExamScreen';
import { InstructorExams } from './pages/instructor/InstructorExams';
import { InstructorCreateExam } from './pages/instructor/InstructorCreateExam';
import { InstructorEditExam } from './pages/instructor/InstructorEditExam';
import { InstructorImportExam } from './pages/instructor/InstructorImportExam';
import { InstructorCourses } from './pages/instructor/InstructorCourses';
import { InstructorProfile } from './pages/instructor/InstructorProfile';
import { AttemptReview } from './pages/instructor/AttemptReview';
import { InstructorSubmissions } from './pages/instructor/InstructorSubmissions';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ExamProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Student Routes */}
              <Route element={<RoleRoute allowedRoles={['student']} />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student/exams" element={<StudentExams />} />
                  <Route path="/student/exam/:id" element={<StudentExamDetail />} />
                  <Route path="/student/results" element={<StudentResults />} />
                  <Route path="/student/courses" element={<StudentCourses />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                </Route>
                <Route path="/student/exam/:id/take/:attemptId" element={<ExamScreen />} />
              </Route>
              
              {/* Instructor Routes */}
              <Route element={<RoleRoute allowedRoles={['instructor', 'admin', 'staff']} />}>
                <Route element={<InstructorLayout />}>
                  <Route path="/instructor/exams" element={<InstructorExams />} />
                  <Route path="/instructor/create" element={<InstructorCreateExam />} />
                  <Route path="/instructor/courses" element={<InstructorCourses />} />
                  <Route path="/instructor/profile" element={<InstructorProfile />} />
                  <Route path="/instructor/import" element={<InstructorImportExam />} />
                  <Route path="/instructor/edit/:id" element={<InstructorEditExam />} />
                  <Route path="/instructor/submissions/:id" element={<InstructorSubmissions />} />
                  <Route path="/instructor/attempt/:id" element={<AttemptReview />} />
                  <Route path="/instructor/reports" element={<ReportsPlaceholder />} />
                  <Route path="/instructor/violations" element={<ViolationsPlaceholder />} />
                  <Route path="/instructor/snapshots" element={<SnapshotsPlaceholder />} />
                </Route>
              </Route>
            </Route>

            {/* Error Routes */}
            <Route path="/403" element={<Error403 />} />
            <Route path="/500" element={<Error500 />} />
            
            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </ExamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
