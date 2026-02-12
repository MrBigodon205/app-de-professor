-- Database Optimization: Add Missing Indexes for Foreign Keys
-- Fixes "Unindexed foreign keys" linter warnings to improve join performance

-- 1. ACADEMIC YEARS
CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON public.academic_years(school_id);

-- 2. ACTIVITIES
CREATE INDEX IF NOT EXISTS idx_activities_school_id ON public.activities(school_id);

-- 3. ATTENDANCE
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance(school_id);

-- 4. CLASS ASSIGNMENTS
CREATE INDEX IF NOT EXISTS idx_class_assignments_teacher_id ON public.class_assignments(teacher_id);

-- 5. CLASS ENROLLMENTS
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON public.class_enrollments(student_id);

-- 6. GRADES
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON public.grades(school_id);

-- 7. INSTITUTION INVITES
CREATE INDEX IF NOT EXISTS idx_institution_invites_created_by ON public.institution_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_institution_invites_institution_id ON public.institution_invites(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_invites_used_by ON public.institution_invites(used_by);

-- 8. INSTITUTION SCHEDULES
CREATE INDEX IF NOT EXISTS idx_institution_schedules_class_subject_id ON public.institution_schedules(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_institution_schedules_institution_id ON public.institution_schedules(institution_id);

-- 9. INSTITUTIONAL STUDENTS
CREATE INDEX IF NOT EXISTS idx_institutional_students_institution_id ON public.institutional_students(institution_id);

-- 10. INSTITUTIONS
CREATE INDEX IF NOT EXISTS idx_institutions_owner_id ON public.institutions(owner_id);

-- 11. OCCURRENCES
CREATE INDEX IF NOT EXISTS idx_occurrences_school_id ON public.occurrences(school_id);

-- 12. PLANS
CREATE INDEX IF NOT EXISTS idx_plans_school_id ON public.plans(school_id);

-- 13. SCHEDULES
CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON public.schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_schedules_school_id ON public.schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);

-- 14. SCHOOL CLASSES
CREATE INDEX IF NOT EXISTS idx_school_classes_academic_year_id ON public.school_classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_school_id ON public.school_classes(school_id);

-- 15. STUDENTS
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);

-- 16. TEACHER ATTENDANCE RECORDS
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_records_institution_id ON public.teacher_attendance_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_records_teacher_id ON public.teacher_attendance_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_records_validated_by ON public.teacher_attendance_records(validated_by);
