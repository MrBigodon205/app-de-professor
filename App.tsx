import React from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Grades } from './pages/Grades';
import { Activities } from './pages/Activities';
import { Planning } from './pages/Planning';
import { StudentProfile } from './pages/StudentProfile';
import { TeacherProfile } from './pages/TeacherProfile';
import { Observations } from './pages/Observations';

import { StudentsList } from './pages/StudentsList';
import { ClassProvider } from './contexts/ClassContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClassProvider>
          <Router>
            <SpeedInsights />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/grades" element={<Grades />} />
                      <Route path="/activities" element={<Activities />} />
                      <Route path="/planning" element={<Planning />} />
                      <Route path="/students" element={<StudentsList />} />
                      <Route path="/reports" element={<StudentProfile />} />
                      <Route path="/students/:id" element={<StudentProfile />} />
                      <Route path="/profile" element={<TeacherProfile />} />
                      <Route path="/observations" element={<Observations />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </ClassProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;