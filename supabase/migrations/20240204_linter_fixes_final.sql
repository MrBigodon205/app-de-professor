-- Final Linter Cleanup Migration
-- Resolves "Auth RLS Initialization Plan" (wrapping auth.uid), "Multiple Permissive Policies", and "Duplicate Index"

-- ==============================================================================
-- 1. DUPLICATE INDEXES
-- ==============================================================================
DROP INDEX IF EXISTS idx_activities_user_date_range; -- Identical to idx_activities_user_date

-- ==============================================================================
-- 2. SCHOOl_CLASSES (Auth RLS Init Plan)
-- ==============================================================================
DROP POLICY IF EXISTS "Members can view classes" ON school_classes;
CREATE POLICY "Members can view classes" ON school_classes
FOR SELECT USING (
  school_id IN (
    SELECT school_members.school_id 
    FROM school_members 
    WHERE school_members.user_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 3. CLASS_ASSIGNMENTS (Auth RLS Init Plan)
-- ==============================================================================
DROP POLICY IF EXISTS "Members can view assignments" ON class_assignments;
CREATE POLICY "Members can view assignments" ON class_assignments
FOR SELECT USING (
  school_class_id IN (
    SELECT class_enrollments.class_id 
    FROM class_enrollments 
    WHERE class_enrollments.student_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 4. STUDENT_PHOTOS (Auth RLS Init Plan)
-- ==============================================================================
DROP POLICY IF EXISTS "Members can view standard photos" ON student_photos;
CREATE POLICY "Members can view standard photos" ON student_photos
FOR SELECT USING (
  student_registry_id IN (
    SELECT students.id::text 
    FROM students 
    WHERE students.user_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 5. SCHOOLS (Legacy Table) - Fix Auth RLS Init Plan & Consolidate Updates
-- ==============================================================================
-- Drop redundant updates
DROP POLICY IF EXISTS "Admins can update schools" ON schools;
DROP POLICY IF EXISTS "Owners can update school" ON schools;
DROP POLICY IF EXISTS "Owners can delete schools" ON schools;
DROP POLICY IF EXISTS "View my schools" ON schools;

-- Recreate Optimized
CREATE POLICY "Owners/Admins can update schools" ON schools
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = schools.id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners can delete schools" ON schools
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = schools.id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role = 'owner'
  )
);

CREATE POLICY "View my schools" ON schools
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = schools.id
    AND school_members.user_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 6. INSTITUTIONS (Auth RLS Init Plan)
-- ==============================================================================
DROP POLICY IF EXISTS "Instituicao visivel para membros" ON institutions;
DROP POLICY IF EXISTS "Admin cria escola" ON institutions;

CREATE POLICY "Instituicao visivel para membros" ON institutions
FOR SELECT USING (
  id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid())
  )
  OR owner_id = (SELECT auth.uid())
);

CREATE POLICY "Authenticated can create institutions" ON institutions
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
);

-- ==============================================================================
-- 7. INSTITUTION_INVITES (Auth RLS, Multiple Permissive)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can invite" ON institution_invites;
DROP POLICY IF EXISTS "Coord cria convites" ON institution_invites;
DROP POLICY IF EXISTS "Admins can view invites" ON institution_invites;
DROP POLICY IF EXISTS "Usuario consome convite" ON institution_invites;
DROP POLICY IF EXISTS "Qualquer um le convite valido via codigo" ON institution_invites; -- Keep this for public/anon?

-- Consolidate Insert (Admins/Coords)
CREATE POLICY "Admins/Coords can manage invites" ON institution_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM institution_teachers
    WHERE institution_teachers.institution_id = institution_invites.institution_id
    AND institution_teachers.user_id = (SELECT auth.uid())
    AND institution_teachers.role IN ('admin', 'coordinator')
  )
  OR
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = institution_invites.institution_id
    AND institutions.owner_id = (SELECT auth.uid())
  )
);

-- Public/Anon access to validate invite codes (Read Only)
CREATE POLICY "Public can view valid invites by code" ON institution_invites
FOR SELECT USING (
  used_at IS NULL 
  AND expires_at > now()
);

-- ==============================================================================
-- 8. INSTITUTION_TEACHERS (Auth RLS, Multiple Permissive)
-- ==============================================================================
DROP POLICY IF EXISTS "Ver meu proprio perfil escolar" ON institution_teachers;
DROP POLICY IF EXISTS "Coordenadores veem professores" ON institution_teachers;

-- Consolidate View (Self + Coords/Admins view all)
CREATE POLICY "View own or managed teachers" ON institution_teachers
FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR 
  institution_id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid()) 
    AND role IN ('admin', 'coordinator')
  )
  OR
  institution_id IN (
    SELECT id FROM institutions WHERE owner_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 9. TEACHER_ATTENDANCE_RECORDS (Auth RLS, Multiple Permissive)
-- ==============================================================================
DROP POLICY IF EXISTS "Prof ve seu ponto" ON teacher_attendance_records;
DROP POLICY IF EXISTS "Prof registra ponto" ON teacher_attendance_records;
DROP POLICY IF EXISTS "Coord ve todo ponto" ON teacher_attendance_records;

-- Consolidated View
CREATE POLICY "View own or managed attendance" ON teacher_attendance_records
FOR SELECT USING (
  teacher_id = (SELECT auth.uid())
  OR 
  institution_id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid()) 
    AND role IN ('admin', 'coordinator')
  )
  OR
  institution_id IN (
    SELECT id FROM institutions WHERE owner_id = (SELECT auth.uid())
  )
);

-- Consolidated Insert/Update (Self + Validation by Coord)
CREATE POLICY "Professors manage own attendance" ON teacher_attendance_records
FOR INSERT WITH CHECK (
  teacher_id = (SELECT auth.uid())
);

CREATE POLICY "Coordinators validate attendance" ON teacher_attendance_records
FOR UPDATE USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid()) 
    AND role IN ('admin', 'coordinator')
  )
  OR
  institution_id IN (
    SELECT id FROM institutions WHERE owner_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 10. SCHOOL_MEMBERS (Auth RLS Fixes)
-- ==============================================================================
-- Re-applying fix specifically for "Users can join schools via invite" if not already covered
DROP POLICY IF EXISTS "Users can join schools via invite" ON school_members;
CREATE POLICY "Users can join schools via invite" ON school_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_invites 
    WHERE school_invites.school_id = school_members.school_id
    AND school_invites.email = (SELECT auth.email()) -- Use wrapper if needed, but email() usually safe in check
    AND school_invites.used_at IS NULL
  )
);

-- ==============================================================================
-- 11. INSTITUTION_SCHEDULES (Auth RLS)
-- ==============================================================================
DROP POLICY IF EXISTS "School members can view schedules" ON institution_schedules;
CREATE POLICY "School members can view schedules" ON institution_schedules
FOR SELECT USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- 12. CLASS_SUBJECTS (Auth RLS)
-- ==============================================================================
DROP POLICY IF EXISTS "School members can view class subjects" ON class_subjects;
CREATE POLICY "School members can view class subjects" ON class_subjects
FOR SELECT USING (
  class_id IN (
    SELECT sc.id 
    FROM school_classes sc
    JOIN school_members sm ON sm.school_id = sc.school_id
    WHERE sm.user_id = (SELECT auth.uid())
  )
  OR 
  id IN (
    SELECT class_subject_id FROM institution_schedules 
    WHERE institution_id IN (
      SELECT institution_id FROM institution_teachers WHERE user_id = (SELECT auth.uid())
    )
  )
);

-- ==============================================================================
-- 13. SCHOOL_EVENTS (Multiple Permissive Clean Up)
-- ==============================================================================
DROP POLICY IF EXISTS "Owners/Admins can manage events" ON school_events;
DROP POLICY IF EXISTS "School members can view events" ON school_events;

CREATE POLICY "School members can view events" ON school_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners/Admins can manage events" ON school_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

-- ==============================================================================
-- 14. SCHOOL_INVITES (Multiple Permissive Clean Up)
-- ==============================================================================
-- Already partially handled in section 7 (Institution Invites) but checking School Invites too
DROP POLICY IF EXISTS "Admins can invite" ON school_invites;
DROP POLICY IF EXISTS "Admins/Owners can manage invites" ON school_invites;
DROP POLICY IF EXISTS "Users can see invites to their email" ON school_invites;
DROP POLICY IF EXISTS "Anyone can select invites by code" ON school_invites;

CREATE POLICY "Admins/Owners can manage invites" ON school_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can see invites to their email" ON school_invites
FOR SELECT USING (
  email = (SELECT auth.email())
);
