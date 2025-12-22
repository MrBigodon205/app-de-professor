-- Applied on 2025-12-21 to fix Duplicates and Integrity Issues

-- 1. Fix Attendance "Disappearing Checks" (Unique Constraint)
-- Prevents multiple rows for the same student/date/user.
ALTER TABLE attendance 
ADD CONSTRAINT attendance_student_date_user_unique 
UNIQUE (student_id, date, user_id);

-- 2. Prevent Duplicate Students
-- Prevents having two students with Number "01" in the same Class/Section/User.
ALTER TABLE students 
ADD CONSTRAINT students_series_section_number_user_unique 
UNIQUE (series_id, section, number, user_id);

-- 3. Prevent Duplicate Classes
-- Prevents having two classes named "6º Ano" for the same user.
ALTER TABLE classes 
ADD CONSTRAINT classes_name_user_unique 
UNIQUE (name, user_id);
