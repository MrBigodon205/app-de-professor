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
const InstitutionalAttendance = lazy(() => import('./institutional/attendance/InstitutionalAttendance').then(module => ({ default: module.InstitutionalAttendance })));
const StudentAttendanceOverview = lazy(() => import('./institutional/attendance/StudentAttendanceOverview'));
const InstitutionalOccurrences = lazy(() => import('./institutional/occurrences/InstitutionalOccurrences'));
const InstitutionalPlans = lazy(() => import('./institutional/planning/InstitutionalPlans'));
const InstitutionalReports = lazy(() => import('./institutional/reports/InstitutionalReports'));
const InstitutionalCheckins = lazy(() => import('./institutional/checkins/InstitutionalCheckins'));
const InstitutionalEvents = lazy(() => import('./institutional/events/InstitutionalEvents'));
const InstitutionalAIReports = lazy(() => import('./institutional/ai-reports/InstitutionalAIReports'));

const InstitutionalDashboard = lazy(() => import('./institutional/dashboard/InstitutionalDashboard').then(module => ({ default: module.InstitutionalDashboard })));
const InstitutionSettings = lazy(() => import('./pages/institution/InstitutionSettings'));
import { SchoolProvider } from './institutional/contexts/SchoolContext';

const App: React.FC = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SpeedInsights />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <SchoolProvider>
                <Layout>
                  <AnimatePresence mode="popLayout">
                    <Suspense fallback={<SkeletonLayout />} key={location.pathname}>
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

                        {/* Institutional Routes */}
                        <Route path="/institution/create" element={<CreateInstitutionForm />} />
                        <Route path="/institution/join" element={<JoinInstitutionForm />} />

                        {/* Institutional Dashboard Area */}
                        <Route path="/institution/:id/*" element={
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
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </AnimatePresence>
                </Layout>
              </SchoolProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;