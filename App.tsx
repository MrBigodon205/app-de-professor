import React, { Suspense, lazy } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Attendance = lazy(() => import('./pages/Attendance').then(module => ({ default: module.Attendance })));
const Grades = lazy(() => import('./pages/Grades').then(module => ({ default: module.Grades })));
const Activities = lazy(() => import('./pages/Activities').then(module => ({ default: module.Activities })));
const Planning = lazy(() => import('./pages/Planning').then(module => ({ default: module.Planning })));
const StudentProfile = lazy(() => import('./pages/StudentProfile').then(module => ({ default: module.StudentProfile })));
const TeacherProfile = lazy(() => import('./pages/TeacherProfile').then(module => ({ default: module.TeacherProfile })));
const Timetable = lazy(() => import('./pages/Timetable').then(module => ({ default: module.Timetable })));
const Observations = lazy(() => import('./pages/Observations').then(module => ({ default: module.Observations })));
const StudentsList = lazy(() => import('./pages/StudentsList').then(module => ({ default: module.StudentsList })));
import { ResetPassword } from './pages/ResetPassword';
const Instructions = lazy(() => import('./pages/Instructions').then(module => ({ default: module.Instructions })));
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import { PageTransition } from './components/PageTransition';
import { SkeletonLayout } from './components/SkeletonLayout';

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
              <Suspense fallback={<SkeletonLayout />}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition type="dashboard"><Dashboard /></PageTransition>} />
                    <Route path="/attendance" element={<PageTransition type="attendance"><Attendance /></PageTransition>} />
                    <Route path="/grades" element={<PageTransition type="grades"><Grades /></PageTransition>} />
                    <Route path="/activities" element={<PageTransition type="activities"><Activities /></PageTransition>} />
                    <Route path="/planning" element={<PageTransition type="planning"><Planning /></PageTransition>} />
                    <Route path="/students" element={<PageTransition type="students"><StudentsList mode="manage" /></PageTransition>} />
                    <Route path="/reports" element={<PageTransition type="default"><StudentProfile /></PageTransition>} />
                    <Route path="/reports/:id" element={<PageTransition type="default"><StudentProfile /></PageTransition>} />
                    <Route path="/students/:id" element={<PageTransition type="default"><StudentProfile /></PageTransition>} />
                    <Route path="/profile" element={<PageTransition type="default"><TeacherProfile /></PageTransition>} />
                    <Route path="/timetable" element={<PageTransition type="default"><Timetable /></PageTransition>} />
                    <Route path="/observations" element={<PageTransition type="dashboard"><Observations /></PageTransition>} />
                    <Route path="/instructions" element={<PageTransition type="default"><Instructions /></PageTransition>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;