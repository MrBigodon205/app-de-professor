-- Database Optimization & Cleanup Migration
-- 1. Fixes "Auth RLS Initialization Plan" warnings by caching auth.uid()
-- 2. Fixes "Multiple Permissive Policies" by removing duplicates

-- ===========================================
-- HELPER: Function to stabilize auth.uid()
-- (Ideally Supabase just needs (select auth.uid()) in the query)
-- ===========================================

-- 1. ACTIVITIES TABLE
drop policy if exists "Users can manage own activities" on activities;
drop policy if exists "Users can only handle their own activities" on activities;
drop policy if exists "Users can only see their own activities" on activities;
drop policy if exists "Users can manage their own activities" on activities;

create policy "Users can manage own activities" on activities
for all using (
  (select auth.uid()) = user_id 
  OR 
  (school_id IN (
    select school_members.school_id 
    from school_members 
    where school_members.user_id = (select auth.uid()) 
    and school_members.role in ('owner', 'admin', 'coordinator')
  ))
);

-- 2. ATTENDANCE TABLE
drop policy if exists "Users can manage own attendance" on attendance;
drop policy if exists "Users can only handle their own attendance" on attendance;
drop policy if exists "Users can only see their own attendance" on attendance;
drop policy if exists "Users can only see their own attendance" on attendance; -- Duplicate check

create policy "Users can manage own attendance" on attendance
for all using (
  (select auth.uid()) = user_id
);

-- 3. GRADES TABLE
drop policy if exists "Users can manage own grades" on grades;
drop policy if exists "Users can only insert their own grades" on grades;
drop policy if exists "Users can only update their own grades" on grades;
drop policy if exists "Users can only delete their own grades" on grades;
drop policy if exists "Users can only see their own grades" on grades;
drop policy if exists "Users can manage their own grades" on grades;

create policy "Users can manage own grades" on grades
for all using (
  (select auth.uid()) = user_id
);

-- 4. CLASSES TABLE
drop policy if exists "Users can manage own classes" on classes;
drop policy if exists "Users can only see their own classes" on classes;
drop policy if exists "Users can manage own classes" on classes; -- check/dup

create policy "Users can manage own classes" on classes
for all using (
  (select auth.uid()) = user_id
);

-- 5. STUDENTS TABLE
drop policy if exists "Users can manage own students" on students;
drop policy if exists "Users can only see their own students" on students;
drop policy if exists "Users can only insert their own students" on students;
drop policy if exists "Users can only update their own students" on students;
drop policy if exists "Users can only delete their own students" on students;

create policy "Users can manage own students" on students
for all using (
  (select auth.uid()) = user_id
);

-- 6. PLANS TABLE
drop policy if exists "Users can only handle their own plans" on plans;
drop policy if exists "Users can manage own plans" on plans;
drop policy if exists "Users can manage their own plans" on plans;

create policy "Users can manage own plans" on plans
for all using (
  (select auth.uid()) = user_id
);

-- 7. OCCURRENCES TABLE
drop policy if exists "Users can only handle their own occurrences" on occurrences;
drop policy if exists "Users can manage own occurrences" on occurrences;

create policy "Users can manage own occurrences" on occurrences
for all using (
  (select auth.uid()) = user_id
);

-- 8. PROFILES TABLE
drop policy if exists "Users can only handle their own profiles" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Profiles are viewable by owners" on profiles;

create policy "Users can manage own profile" on profiles
for all using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);
-- Allow public read of basic profile info if needed, otherwise this covers it.

-- 9. SCHOOL MEMBERS TABLE
drop policy if exists "Members can see their schools" on school_members;
drop policy if exists "View own memberships" on school_members;
drop policy if exists "Insert own membership" on school_members;
drop policy if exists "Strict Own Membership Only" on school_members;
drop policy if exists "Users can view own memberships" on school_members;
drop policy if exists "Users can join schools" on school_members;
drop policy if exists "Users can leave schools" on school_members;
drop policy if exists "Only owners can add members" on school_members;
drop policy if exists "Only owners can update members" on school_members;
drop policy if exists "Only owners can remove members" on school_members;

-- Consolidate to: View Own, Join (Insert for Self)
create policy "Users can manage own memberships" on school_members
for all using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "Owners can manage members" on school_members
for all using (
  exists (
    select 1 from schools 
    join school_members sm on sm.school_id = schools.id
    where schools.id = school_members.school_id
    and sm.user_id = (select auth.uid())
    and sm.role = 'owner'
  )
);

-- 10. SCHOOL INVITES TABLE
drop policy if exists "Users can see invites to their email" on school_invites;
drop policy if exists "Admins can view invites" on school_invites;
drop policy if exists "Usuario consome convite" on school_invites; -- legacy naming?
drop policy if exists "Only owners can manage invites" on school_invites;
drop policy if exists "Only owners can create invites" on school_invites;

create policy "Users can see invites to their email" on school_invites
for select using (
  email = (select auth.email())
);

create policy "Admins/Owners can manage invites" on school_invites
for all using (
  exists (
    select 1 from school_members
    where school_members.school_id = school_invites.school_id
    and school_members.user_id = (select auth.uid())
    and school_members.role in ('owner', 'admin')
  )
);

-- 11. SCHEDULES TABLE
drop policy if exists "Users can view own schedule" on schedules;
drop policy if exists "Users can insert own schedule" on schedules;
drop policy if exists "Users can update own schedule" on schedules;
drop policy if exists "Users can delete own schedule" on schedules;
drop policy if exists "Users can only handle their own schedules" on schedules;
drop policy if exists "Users can manage own schedules" on schedules;

create policy "Users can manage own schedules" on schedules
for all using (
  (select auth.uid()) = user_id
);

-- 12. SCHOOL EVENTS TABLE
drop policy if exists "Members can view school events" on school_events;
drop policy if exists "School members can see events" on school_events;
drop policy if exists "Only owners can manage events" on school_events;

create policy "School members can view events" on school_events
for select using (
  exists (
    select 1 from school_members
    where school_members.school_id = school_events.school_id
    and school_members.user_id = (select auth.uid())
  )
);

create policy "Owners/Admins can manage events" on school_events
for all using (
  exists (
    select 1 from school_members
    where school_members.school_id = school_events.school_id
    and school_members.user_id = (select auth.uid())
    and school_members.role in ('owner', 'admin')
  )
);

-- 13. ACADEMIC YEARS TABLE
drop policy if exists "Owners can create years" on academic_years;

create policy "Owners/Admins can manage years" on academic_years
for all using (
  exists (
    select 1 from school_members
    where school_members.school_id = academic_years.school_id
    and school_members.user_id = (select auth.uid())
    and school_members.role in ('owner', 'admin')
  )
);

-- 14. INSTITUTIONAL TABLES OPTIMIZATIONS
drop policy if exists "School members can view students" on institutional_students;
create policy "School members can view students" on institutional_students
for select using (
  institution_id in (
    select institution_id 
    from institution_teachers 
    where user_id = (select auth.uid())
  )
);

drop policy if exists "School members can view enrollments" on class_enrollments;
create policy "School members can view enrollments" on class_enrollments
for select using (
  class_id in (
      select id from institutional_classes where institution_id in (
          select institution_id from institution_teachers where user_id = (select auth.uid())
      )
  )
);

drop policy if exists "Membros veem turmas da escola" on institutional_classes;
drop policy if exists "Membros veem dados da escola" on institutional_classes;
drop policy if exists "Coord edita turmas" on institutional_classes;

create policy "School members can view classes" on institutional_classes
for select using (
  institution_id in (
    select institution_id 
    from institution_teachers 
    where user_id = (select auth.uid())
  )
);

create policy "Coord/Admin can manage classes" on institutional_classes
for all using (
  institution_id in (
    select institution_id 
    from institution_teachers 
    where user_id = (select auth.uid())
    and role in ('admin', 'coordinator')
  )
);
