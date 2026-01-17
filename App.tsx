import React, { Suspense, lazy } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { ResetPassword } from './pages/ResetPassword';
import { Instructions } from './pages/Instructions';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import { PageTransition } from './components/PageTransition';

const App: React.FC = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <SpeedInsights />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<PageTransition type="dashboard"><Dashboard /></PageTransition>} />
                  <Route path="/attendance" element={<PageTransition type="attendance"><Attendance /></PageTransition>} />
                  <Route path="/grades" element={<PageTransition type="grades"><Grades /></PageTransition>} />
                  <Route path="/activities" element={<PageTransition type="activities"><Activities /></PageTransition>} />
                  <Route path="/planning" element={<PageTransition type="planning"><Planning /></PageTransition>} />
                  <Route path="/students" element={<PageTransition type="students"><StudentsList mode="manage" /></PageTransition>} />
                  <Route path="/reports" element={<PageTransition type="default"><StudentsList mode="report" /></PageTransition>} />
                  <Route path="/reports/:id" element={<PageTransition type="default"><StudentProfile /></PageTransition>} />
                  <Route path="/students/:id" element={<PageTransition type="default"><StudentProfile /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition type="default"><TeacherProfile /></PageTransition>} />
                  <Route path="/observations" element={<PageTransition type="dashboard"><Observations /></PageTransition>} />
                  <Route path="/instructions" element={<PageTransition type="default"><Instructions /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;