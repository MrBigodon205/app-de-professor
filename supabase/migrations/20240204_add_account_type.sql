-- Migration: Add account_type to profiles
-- Purpose: Distinguish between 'personal' (default) and 'institutional' (school owners) accounts.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'personal';

-- Constraint to ensure valid values
ALTER TABLE public.profiles
ADD CONSTRAINT check_account_type CHECK (account_type IN ('personal', 'institutional'));

-- Update existing users to 'personal' (implicit by default, but good for clarity)
UPDATE public.profiles SET account_type = 'personal' WHERE account_type IS NULL;
