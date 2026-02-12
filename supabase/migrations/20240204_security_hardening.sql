-- Security Hardening Migration
-- Fixes RLS warnings and Function Search Path vulnerabilities

-- 1. Enable RLS on all tables
alter table if exists institutional_students enable row level security;
alter table if exists class_enrollments enable row level security;
alter table if exists class_subjects enable row level security;
alter table if exists institution_schedules enable row level security;
alter table if exists institution_invites enable row level security;

-- 2. Add Policies (Basic Read Access for Institution Members)

-- Institutional Students
create policy "School members can view students" on institutional_students
for select using (
  institution_id in (
    select institution_id from institution_teachers where user_id = auth.uid()
  )
);

-- Institution Schedules
create policy "School members can view schedules" on institution_schedules
for select using (
  institution_id in (
    select institution_id from institution_teachers where user_id = auth.uid()
  )
);

-- Class Subjects (Linked via class_id)
create policy "School members can view class subjects" on class_subjects
for select using (
  class_id in (
    select id from institutional_classes where institution_id in (
      select institution_id from institution_teachers where user_id = auth.uid()
    )
  )
);

-- Class Enrollments (Linked via class_id)
create policy "School members can view enrollments" on class_enrollments
for select using (
  class_id in (
    select id from institutional_classes where institution_id in (
      select institution_id from institution_teachers where user_id = auth.uid()
    )
  )
);

-- Institution Invites (Only admins/coordinators can see invites)
create policy "Admins can view invites" on institution_invites
for select using (
  institution_id in (
    select institution_id from institution_teachers 
    where user_id = auth.uid() and role in ('admin', 'coordinator')
  )
);

-- 3. Fix Function Search Paths (Security Definer Vulnerability)
-- Setting search_path prevents malicious object injection

alter function if exists public.get_heatmap_data set search_path = public;
alter function if exists public.get_school_stats set search_path = public;
alter function if exists public.delete_school_owner set search_path = public;
alter function if exists public.create_invite set search_path = public;
alter function if exists public.create_school_class set search_path = public;
alter function if exists public.assign_teacher_to_subject set search_path = public;
alter function if exists public.get_school_classes_summary set search_path = public;
alter function if exists public.batch_create_school_classes set search_path = public;
alter function if exists public.update_teacher_disciplines set search_path = public;
alter function if exists public.get_school_members_safe set search_path = public;
alter function if exists public.create_school_event set search_path = public;
alter function if exists public.create_school_for_user set search_path = public;
alter function if exists public.handle_new_user set search_path = public;
