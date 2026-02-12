-- Linter Fixes Strict V3
-- Goal: Strictly separate SELECT from INSERT/UPDATE/DELETE to definitely resolve "Multiple Permissive Policies".
-- Strategy: Use one consolidated SELECT policy per table that covers ALL allowed view cases (using OR).
--           Use separate INSERT/UPDATE/DELETE policies for mutations.

-- ==============================================================================
-- 1. SCHOOL_MEMBERS
-- ==============================================================================
-- Current State: ALL (Owners/Admins) + SELECT (View own) -> Overlap on SELECT.
-- Solution: Consolidated SELECT, Separate MUTATION.

DROP POLICY IF EXISTS "Owners/Admins can manage school members" ON school_members;
DROP POLICY IF EXISTS "View own memberships" ON school_members;
DROP POLICY IF EXISTS "Users can manage own memberships" ON school_members; 

-- 1A. Consolidated SELECT
CREATE POLICY "school_members_select" ON school_members
FOR SELECT USING (
  -- Case 1: View own membership
  user_id = (SELECT auth.uid())
  OR
  -- Case 2: Owners/Admins view all members of their school
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
);

-- 1B. Mutation Policies (Owners/Admins)
-- Insert/Update/Delete for Owners/Admins
CREATE POLICY "school_members_mutation_admin" ON school_members
FOR ALL USING (
  -- Restrict to mutations (implicit by separating from SELECT if used with FOR INSERT/UPDATE/DELETE, 
  -- but FOR ALL covers SELECT too unless we restrict inputs? No, FOR ALL includes SELECT.
  -- SO WE MUST NOT USE "FOR ALL" if we want to avoid overlap warnings for "SELECT".
  -- We must explicitly list INSERT, UPDATE, DELETE.
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
);

-- Wait, if I use FOR ALL, Supabase counts it as a SELECT policy too.
-- So verify: Does "FOR ALL" count as a "Permissive Policy for SELECT"? 
-- Yes. That is the root cause.
-- So I MUST break "FOR ALL" into "FOR INSERT", "FOR UPDATE", "FOR DELETE" 
-- OR just accept that I need to drop "FOR ALL".

DROP POLICY IF EXISTS "school_members_mutation_admin" ON school_members;

CREATE POLICY "admin_insert_school_members" ON school_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
);

CREATE POLICY "admin_update_school_members" ON school_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
);

CREATE POLICY "admin_delete_school_members" ON school_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
);

-- 1C. Mutation Policies (Self)
-- Users can leave (DELETE) or Update self?
-- Previous policy allowed specific self-management.
CREATE POLICY "user_delete_own_membership" ON school_members
FOR DELETE USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "user_update_own_membership" ON school_members
FOR UPDATE USING (
  user_id = (SELECT auth.uid())
);

-- Note: "Users can join schools via invite" (INSERT) is already separate/safe.


-- ==============================================================================
-- 2. INSTITUTION_INVITES
-- ==============================================================================
-- Current: ALL (Admin) + SELECT (Public). Overlap on SELECT.

DROP POLICY IF EXISTS "Manage institution invites" ON institution_invites;
DROP POLICY IF EXISTS "Public view invites" ON institution_invites;

-- 2A. Consolidated SELECT
CREATE POLICY "institution_invites_select" ON institution_invites
FOR SELECT USING (
  -- Public valid invites
  (used_at IS NULL AND expires_at > now())
  OR
  -- Authenticated Admin/Owner view
  (
    auth.role() = 'authenticated' AND (
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
    )
  )
);

-- 2B. Admin Mutations (INS/UPD/DEL only)
CREATE POLICY "admin_insert_inst_invites" ON institution_invites
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
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
  )
);

CREATE POLICY "admin_update_inst_invites" ON institution_invites
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
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
  )
);

CREATE POLICY "admin_delete_inst_invites" ON institution_invites
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
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
  )
);


-- ==============================================================================
-- 3. SCHOOL_INVITES
-- ==============================================================================
-- Current: ALL (Admin) + SELECT (Self Email). Overlap on SELECT.

DROP POLICY IF EXISTS "Manage school invites" ON school_invites;
DROP POLICY IF EXISTS "View own email invites" ON school_invites;

-- 3A. Consolidated SELECT
CREATE POLICY "school_invites_select" ON school_invites
FOR SELECT USING (
  -- View own email
  email = (SELECT auth.email())
  OR
  -- Admin view
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

-- 3B. Admin Mutations
CREATE POLICY "admin_insert_school_invites" ON school_invites
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "admin_update_school_invites" ON school_invites
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "admin_delete_school_invites" ON school_invites
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);
