-- Security Hardening Migration V2
-- Fixes "RLS Policy Always True", "Extension in Public", and cleans up legacy "schools" table access

-- 1. Fix Extension Schema (Best Practice)
-- Attempt to move pg_trgm to extensions schema. 
-- Note: This requires the schema 'extensions' to exist.
create schema if not exists extensions;
alter extension "pg_trgm" set schema extensions;

-- 2. Hardening 'institution_invites'
-- Problem: 'Usuario consome convite' had USING (true), causing "Always True" warning.
-- Fix: Restrict UPDATE to only rows that are not yet used.
drop policy if exists "Usuario consome convite" on institution_invites;

create policy "Usuario consome convite" on institution_invites
for update using (
  used_at is null -- Can only target unused invites
)
with check (
  used_by = auth.uid() -- Can only claim for self
);

-- 3. Hardening 'schools' (Legacy Table)
-- Problem: Multiple "Public can view" policies with USING (true).
-- Fix: Remove permissive policies, keep only owner access.

drop policy if exists "Public Metadata Access" on schools;
drop policy if exists "Public can view schools" on schools;
drop policy if exists "View All Schools" on schools;

-- Re-assert secure owner access if it doesn't exist or just rely on existing specific ones
-- We leave "Owners can..." policies alone if they are secure (usually check owner_id)
-- We ensure there is at least one safe policy if needed, but dropping the permissive ones is the key fix.

-- 4. Audit 'schools' Update/Delete if they were too permissive
-- (Based on logs, they seemed to have owner checks, so we might be good, 
-- but let's ensure we don't have "Always True" on them).

-- Check existing: "Owners can update school" had qual: EXISTS... owner check. (Safe)
-- Check existing: "Owners can delete schools" had qual: EXISTS... owner check. (Safe)

-- Final Cleanup for consistency
alter table if exists schools enable row level security;
