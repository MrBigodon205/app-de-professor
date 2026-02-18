import React, { Suspense, lazy, useEffect } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { BackgroundPattern } from './components/BackgroundPattern';
import { Login } from './pages/Login';
import { loaders } from './utils/routeLoaders';

// Lazy imports using centralized loaders for prefetching capability
const Dashboard = lazy(() => loaders.dashboard().then(module => ({ default: module.Dashboard })));
const Attendance = lazy(() => loaders.attendance().then(module => ({ default: module.Attendance })));
const Grades = lazy(() => loaders.grades().then(module => ({ default: module.Grades })));
const Activities = lazy(() => loaders.activities().then(module => ({ default: module.Activities })));
const Planning = lazy(() => loaders.planning().then(module => ({ default: module.Planning })));
const StudentProfile = lazy(() => loaders.reports().then(module => ({ default: module.StudentProfile })));
const TeacherProfile = lazy(() => loaders.profile().then(module => ({ default: module.TeacherProfile })));
const Timetable = lazy(() => loaders.timetable().then(module => ({ default: module.Timetable })));
const Observations = lazy(() => loaders.observations().then(module => ({ default: module.Observations })));
const StudentsList = lazy(() => loaders.students().then(module => ({ default: module.StudentsList })));
import { ResetPassword } from './pages/ResetPassword';
const Instructions = lazy(() => loaders.instructions().then(module => ({ default: module.Instructions })));
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

import { PageTransition } from './components/PageTransition';
import { SkeletonLayout } from './components/SkeletonLayout';
const CreateInstitutionForm = lazy(() => import('./institutional/auth/CreateInstitutionForm').then(module => ({ default: module.CreateInstitutionForm })));
const JoinInstitutionForm = lazy(() => import('./institutional/auth/JoinInstitutionForm').then(module => ({ default: module.JoinInstitutionForm })));
const TeachersList = lazy(() => import('./institutional/teachers/TeachersList').then(module => ({ default: module.TeachersList })));

const ClassesList = lazy(() => import('./institutional/classes/ClassesList').then(module => ({ default: module.ClassesList })));
const ManageClassForm = lazy(() => import('./institutional/classes/ManageClassForm').then(module => ({ default: module.ManageClassForm })));
const ClassSubjectsManager = lazy(() => import('./institutional/classes/ClassSubjectsManager'));
const InstitutionalStudents = lazy(() => import('./institutional/students/InstitutionalStudents'));
const InstitutionalSchedule = lazy(() => import('./institutional/schedule/InstitutionalSchedule'));
const InstitutionalGrades = lazy(() => import('./institutional/grades/InstitutionalGrades'));
const InstitutionalAttendance = lazy(() => loaders.inst_attendance().then(module => ({ default: module.InstitutionalAttendance })));
const StudentAttendanceOverview = lazy(() => import('./institutional/attendance/StudentAttendanceOverview'));
const InstitutionalOccurrences = lazy(() => import('./institutional/occurrences/InstitutionalOccurrences'));
const InstitutionalPlans = lazy(() => import('./institutional/planning/InstitutionalPlans'));
const InstitutionalReports = lazy(() => import('./institutional/reports/InstitutionalReports'));
const InstitutionalCheckins = lazy(() => import('./institutional/checkins/InstitutionalCheckins'));
const InstitutionalEvents = lazy(() => import('./institutional/events/InstitutionalEvents'));
const InstitutionalAIReports = lazy(() => import('./institutional/ai-reports/InstitutionalAIReports'));

const InstitutionalDashboard = lazy(() => loaders.inst_dashboard().then(module => ({ default: module.InstitutionalDashboard })));
const InstitutionSettings = lazy(() => loaders.inst_settings().then(module => ({ default: module.InstitutionSettings })));
import { SchoolProvider } from './institutional/contexts/SchoolContext';


import { useAuth } from './contexts/AuthContext';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const location = useLocation();
  const { activeSubject } = useAuth();
  const theme = useTheme();

  const isInstitutionalRoute = location.pathname.startsWith('/institution/') && !location.pathname.startsWith('/institution/create') && !location.pathname.startsWith('/institution/join');

  // Helper to wrap pages with Transition + Suspense
  // We pass 'type' to BOTH PageTransition (for animation variant) AND SkeletonLayout (for layout matching)
  const SuspendedPage = ({ children, type = 'default' }: { children: React.ReactNode, type?: 'default' | 'dashboard' | 'table' | 'profile' | string }) => (
    <PageTransition type={type}>
      <Suspense fallback={<SkeletonLayout type={type as any} />}>
        {children}
      </Suspense>
    </PageTransition>
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SpeedInsights />
        {/* Persistent Background Layer - Outside Routes/AnimatePresence */}
        <BackgroundPattern theme={theme} activeSubject={activeSubject} />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <SchoolProvider>
                <Layout>
                  {/* Mode="wait" ensures clean transitions without overlap/layout thrashing */}
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={<SuspendedPage type="dashboard"><Dashboard /></SuspendedPage>} />
                      <Route path="/attendance" element={<SuspendedPage type="table"><Attendance /></SuspendedPage>} />
                      <Route path="/grades" element={<SuspendedPage type="table"><Grades /></SuspendedPage>} />
                      <Route path="/activities" element={<SuspendedPage type="table"><Activities /></SuspendedPage>} />
                      <Route path="/planning" element={<SuspendedPage type="default"><Planning /></SuspendedPage>} />
                      <Route path="/students" element={<SuspendedPage type="table"><StudentsList mode="manage" /></SuspendedPage>} />
                      <Route path="/reports" element={<SuspendedPage type="profile"><StudentProfile /></SuspendedPage>} />
                      <Route path="/reports/:id" element={<SuspendedPage type="profile"><StudentProfile /></SuspendedPage>} />
                      <Route path="/students/:id" element={<SuspendedPage type="profile"><StudentProfile /></SuspendedPage>} />
                      <Route path="/profile" element={<SuspendedPage type="profile"><TeacherProfile /></SuspendedPage>} />
                      <Route path="/timetable" element={<SuspendedPage type="default"><Timetable /></SuspendedPage>} />
                      <Route path="/observations" element={<SuspendedPage type="dashboard"><Observations /></SuspendedPage>} />
                      <Route path="/instructions" element={<SuspendedPage type="default"><Instructions /></SuspendedPage>} />

                      {/* Institutional Routes */}
                      <Route path="/institution/create" element={<SuspendedPage type="modal"><CreateInstitutionForm /></SuspendedPage>} />
                      <Route path="/institution/join" element={<SuspendedPage type="modal"><JoinInstitutionForm /></SuspendedPage>} />

                      {/* Institutional Dashboard Area */}
                      <Route path="/institution/:id/*" element={
                        <PageTransition type="dashboard">
                          <Suspense fallback={<SkeletonLayout type="dashboard" />}>
                            <Routes>
                              <Route path="dashboard" element={<InstitutionalDashboard />} />
                              <Route path="teachers" element={<TeachersList />} />

                              {/* Management Routes */}
                              <Route path="classes" element={<ClassesList />} />
                              <Route path="classes/new" element={<ManageClassForm />} />
                              <Route path="classes/:classId/edit" element={<ManageClassForm />} />
                              <Route path="classes/:classId/subjects" element={<ClassSubjectsManager />} />

                              <Route path="students" element={<InstitutionalStudents />} />
                              <Route path="schedule" element={<InstitutionalSchedule />} />
                              <Route path="grades" element={<InstitutionalGrades />} />
                              <Route path="attendance" element={<InstitutionalAttendance />} />
                              <Route path="student-attendance" element={<StudentAttendanceOverview />} />
                              <Route path="occurrences" element={<InstitutionalOccurrences />} />
                              <Route path="plans" element={<InstitutionalPlans />} />
                              <Route path="reports" element={<InstitutionalReports />} />
                              <Route path="checkins" element={<InstitutionalCheckins />} />
                              <Route path="events" element={<InstitutionalEvents />} />
                              <Route path="ai-reports" element={<InstitutionalAIReports />} />
                              <Route path="settings" element={<InstitutionSettings />} />
                            </Routes>
                          </Suspense>
                        </PageTransition>
                      } />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AnimatePresence>
                </Layout>
              </SchoolProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </ErrorBoundary >
  );
};

export default App;