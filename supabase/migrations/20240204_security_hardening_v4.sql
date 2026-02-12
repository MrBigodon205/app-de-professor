-- Security Hardening Migration V4
-- Fixes lingering "RLS Policy Always True" on 'schools' table

-- Problem: There were multiple duplicate/similarly named policies allowing INSERTs with (true).
-- Fix: Drop all identified permissive policies on the legacy 'schools' table.

drop policy if exists "Authenticated users can create schools" on schools;
drop policy if exists "Enable insert for authenticated users only" on schools;
drop policy if exists "Auth users can create schools" on schools;

-- Note: We are NOT adding replacements because this is a legacy table 
-- and we want to prevent new creations in favor of 'institutions'.
