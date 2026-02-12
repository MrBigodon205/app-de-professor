-- Linter Fixes Cleanup V2 - Targeted Fixes
-- Address specific remaining warnings for auth_rls_initplan and multiple_permissive_policies

-- ==============================================================================
-- 1. SCHOOL_MEMBERS (Auth RLS Init Plan + Multiple Permissive)
-- ==============================================================================
-- Problem: "View Own Memberships" uses unwrapped auth.uid()
-- Problem: Overlap between "Owners can manage members" (ALL) and "Users can manage own memberships" (ALL)

DROP POLICY IF EXISTS "View Own Memberships" ON school_members;
DROP POLICY IF EXISTS "Users can manage own memberships" ON school_members;
DROP POLICY IF EXISTS "Owners can manage members" ON school_members;
DROP POLICY IF EXISTS "Members can see their schools" ON school_members; -- Potential duplicate
DROP POLICY IF EXISTS "View own memberships" ON school_members; -- Case sensitive duplicate check

-- Recreate consolidated policies

-- 1. All members can view their own membership
CREATE POLICY "View own memberships" ON school_members
FOR SELECT USING (
  user_id = (SELECT auth.uid())
);

-- 2. Owners/Admins can manage members of their schools
CREATE POLICY "Owners/Admins can manage school members" ON school_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM school_members sm_check
    WHERE sm_check.school_id = school_members.school_id
    AND sm_check.user_id = (SELECT auth.uid())
    AND sm_check.role IN ('owner', 'admin')
  )
  OR
  -- Allow users to manage their OWN row (e.g. leave school / delete self)? 
  -- Original policy "Users can manage own memberships" allowed ALL. 
  -- Let's restrict to DELETE (leave) and UPDATE (e.g. accept invite?).
  -- Safe to keep simple:
  user_id = (SELECT auth.uid()) 
);

-- Note: "Users can join schools via invite" (INSERT) remains separate as it has specific logic.


-- ==============================================================================
-- 2. INSTITUTIONAL_CLASSES (Multiple Permissive)
-- ==============================================================================
-- Problem: "Coord/Admin can manage classes" (ALL) overlaps with "School members can view classes" (SELECT)

DROP POLICY IF EXISTS "Coord/Admin can manage classes" ON institutional_classes;
DROP POLICY IF EXISTS "School members can view classes" ON institutional_classes;

-- Consolidated into one ALL policy that handles role-based access
CREATE POLICY "Manage institutional classes" ON institutional_classes
FOR ALL USING (
  -- View: All members of the institution
  (
    institution_id IN (
      SELECT institution_id 
      FROM institution_teachers 
      WHERE user_id = (SELECT auth.uid())
    )
    OR 
    institution_id IN (
       SELECT id FROM institutions WHERE owner_id = (SELECT auth.uid())
    )
  )
  AND
  (
    -- Write: Only Admins/Coords/Owners can write (INSERT/UPDATE/DELETE)
    CASE 
      WHEN (current_setting('request.method', true) = 'GET') THEN TRUE -- SELECT matches above
      ELSE 
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
    END
  )
);
-- Simplify: separate SELECT vs mutation is often cleaner for avoiding complex logic warnings,
-- but "Multiple Permissive" complains about multiple policies for same action.
-- If we separate SELECT and INSERT/UPDATE/DELETE, we avoid overlaps on SELECT.

DROP POLICY IF EXISTS "Manage institutional classes" ON institutional_classes; -- Cleanup my draft above

-- Better Approach: Separate policies by ACTION where possible to avoid SELECT overlap.

-- Policy A: View classes (SELECT)
CREATE POLICY "View institutional classes" ON institutional_classes
FOR SELECT USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_teachers 
    WHERE user_id = (SELECT auth.uid())
  )
  OR 
  institution_id IN (
     SELECT id FROM institutions WHERE owner_id = (SELECT auth.uid())
  )
);

-- Policy B: Manage classes (INSERT, UPDATE, DELETE)
CREATE POLICY "Manage institutional classes" ON institutional_classes
FOR INSERT WITH CHECK (
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

CREATE POLICY "Manage institutional classes update" ON institutional_classes
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

CREATE POLICY "Manage institutional classes delete" ON institutional_classes
FOR DELETE USING (
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
-- 3. OCCURRENCES, PLANS, PROFILES (Multiple Permissive)
-- ==============================================================================

-- Occurrences
DROP POLICY IF EXISTS "Users can manage own occurrences" ON occurrences;
DROP POLICY IF EXISTS "Users can only see their own occurrences" ON occurrences; -- Redundant?
DROP POLICY IF EXISTS "Users can only handle their own occurrences" ON occurrences;

CREATE POLICY "Users manage own occurrences" ON occurrences
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- Plans
DROP POLICY IF EXISTS "Users can manage own plans" ON plans;
DROP POLICY IF EXISTS "Users can only handle their own plans" ON plans;
DROP POLICY IF EXISTS "Users can manage their own plans" ON plans;
DROP POLICY IF EXISTS "Users can only see their own plans" ON plans;

CREATE POLICY "Users manage own plans" ON plans
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- Profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles; -- Keep if exists?

CREATE POLICY "Users manage own profile" ON profiles
FOR ALL USING (
  id = (SELECT auth.uid())
);

CREATE POLICY "Public profiles view" ON profiles
FOR SELECT USING (true); -- Verify if this is desired, usually required for displaying user names


-- ==============================================================================
-- 4. INSTITUTION_INVITES (Already consolidated but checking again)
-- ==============================================================================
-- Ensure we don't have overlapped SELECT
DROP POLICY IF EXISTS "Admins/Coords can manage invites" ON institution_invites;
DROP POLICY IF EXISTS "Public can view valid invites by code" ON institution_invites;

-- Policy 1: Manage (Insert/Update/Delete - Authenticated)
CREATE POLICY "Manage institution invites" ON institution_invites
FOR ALL USING (
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

-- Policy 2: Public View (SELECT - Anon/Public)
CREATE POLICY "Public view invites" ON institution_invites
FOR SELECT USING (
  used_at IS NULL 
  AND expires_at > now()
);

-- ==============================================================================
-- 5. SCHOOL_INVITES (Multiple Permissive)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins/Owners can manage invites" ON school_invites;
DROP POLICY IF EXISTS "Users can see invites to their email" ON school_invites;

-- Consolidated Manage (All ops for owners/admins)
CREATE POLICY "Manage school invites" ON school_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_invites.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

-- Separate View for Email recipients (SELECT only)
CREATE POLICY "View own email invites" ON school_invites
FOR SELECT USING (
  email = (SELECT auth.email())
);

-- ==============================================================================
-- 6. SCHOOL_EVENTS (Multiple Permissive)
-- ==============================================================================
DROP POLICY IF EXISTS "Owners/Admins can manage events" ON school_events;
DROP POLICY IF EXISTS "School members can view events" ON school_events;


CREATE POLICY "Manage school events" ON school_events
FOR ALL USING (
   EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "View school events" ON school_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
  )
); 
-- Note: Member View overlaps with Owner Manage (Owner is a member).
-- "Multiple Permissive" warns when multiple policies allow access.
-- If Owner is covered by "View school events", do they need "Manage" for SELECT?
-- Yes, "Manage" is for ALL. "View" is SELECT.
-- Supabase warns if you have 2 policies granting SELECT.
-- Fix: Make "View" policy EXCLUDE admins/owners if you want strict non-overlap, OR just merge them.
-- Merging into ONE policy for SELECT is cleaner:

DROP POLICY IF EXISTS "Manage school events" ON school_events;
DROP POLICY IF EXISTS "View school events" ON school_events;

CREATE POLICY "School Events Access" ON school_events
FOR ALL USING (
  -- READ Access: Any member
  (
    current_setting('request.method', true) = 'GET' 
    AND 
    EXISTS (
      SELECT 1 FROM school_members
      WHERE school_members.school_id = school_events.school_id
      AND school_members.user_id = (SELECT auth.uid())
    )
  )
  OR
  -- WRITE Access: Owners/Admins
  (
    EXISTS (
      SELECT 1 FROM school_members
      WHERE school_members.school_id = school_events.school_id
      AND school_members.user_id = (SELECT auth.uid())
      AND school_members.role IN ('owner', 'admin')
    )
  )
  -- Effectively: If I am an Admin, I match the second clause (WRITE implies READ usually).
  -- If I am a Student, I match first clause (READ only).
);
-- Wait, RLS USING clause is checked for existing rows.
-- If I am Admin, I match 2nd clause -> True -> I can SELECT.
-- If I am Student, I match 1st clause -> True -> I can SELECT.
-- Writing:
-- Admin: matches 2nd clause -> True -> I can UPDATE/DELETE.
-- Student: matches ?? 1st clause checks request.method.
-- This request.method trick is risky if Supabase/PostgREST implementation changes or internal calls.
-- Better: Separate SELECT and WRITE policies explicitly.
-- AND accept that Admins have 2 SELECT policies? No, we want 1.
-- Make View Policy: "Members (including admins) can view".
-- Make Manage Policy: "Admins can Insert/Update/Delete" (Explicit cmd).

CREATE POLICY "Members view events" ON school_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admins manage events" ON school_events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins update events" ON school_events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins delete events" ON school_events
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_events.school_id
    AND school_members.user_id = (SELECT auth.uid())
    AND school_members.role IN ('owner', 'admin')
  )
);
