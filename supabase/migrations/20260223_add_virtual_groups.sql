-- Migration: Add Virtual Groups Table
-- Purpose: Store virtual groupings of series/classes for teachers to sync across devices

-- Create the table
CREATE TABLE IF NOT EXISTS public.virtual_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    context_key TEXT NOT NULL, -- 'personal' or institutional ID
    class_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.virtual_groups ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can only see and manage their own groups
CREATE POLICY "Users can manage their own virtual groups"
    ON public.virtual_groups
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_virtual_groups_user_context ON public.virtual_groups(user_id, context_key);

-- Create trigger to automatically update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_virtual_groups_updated_at
    BEFORE UPDATE ON public.virtual_groups
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.virtual_groups IS 'Stores teacher-defined virtual folders/groups for organizing series/classes.';
