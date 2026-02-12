-- Security Hardening Migration V3 (Revised)
-- Fixes "RLS Policy Always True" on 'schools' table by DISABLING inserts.

-- Context: 'schools' is a legacy table. New data goes to 'institutions'.
-- Problem: "Admin creates school" policy was permissive (WITH CHECK (true)).
-- Fix: Drop the policy. Default RLS deny will prevent any new rows in this legacy table.

drop policy if exists "Admin creates school" on schools;

-- We do NOT create a replacement INSERT policy. 
-- This intentionally locks the table against new entries.
