
export const loaders = {
    dashboard: () => import('../pages/Dashboard'),
    attendance: () => import('../pages/Attendance'),
    grades: () => import('../pages/Grades'),
    activities: () => import('../pages/Activities'),
    planning: () => import('../pages/Planning'),
    students: () => import('../pages/StudentsList'),
    reports: () => import('../pages/StudentProfile'),
    profile: () => import('../pages/TeacherProfile'),
    timetable: () => import('../pages/Timetable'),
    observations: () => import('../pages/Observations'),
    instructions: () => import('../pages/Instructions'),
    // Institutional
    inst_dashboard: () => import('../institutional/dashboard/InstitutionalDashboard'),
    inst_settings: () => import('../pages/institution/InstitutionSettings'),
    inst_attendance: () => import('../institutional/attendance/InstitutionalAttendance'),
};

export const prefetchRoute = (key: keyof typeof loaders) => {
    const loader = loaders[key];
    if (loader) {
        loader();
    }
};
