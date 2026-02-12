-- Migration: Add grading configuration to institutions settings
-- Purpose: Extend the settings JSONB to include all grading configuration

-- The settings column already exists as JSONB, we just need to extend the schema
-- This migration adds the grading_config to institutions

COMMENT ON COLUMN public.institutions.settings IS 'Institution settings including:
- modules: array of enabled modules
- gps_tolerance: GPS tolerance in meters for check-in
- grading_config: complete grading configuration with:
  - calculation_type: ''simple_average'' | ''weighted_average'' | ''total_sum'' | ''custom_formula''
  - approval_grade: minimum grade to pass (e.g. 6.0)
  - rounding_mode: ''none'' | ''half_up'' | ''floor'' | ''ceiling''
  - units: array of unit configurations
  - components: array of grade components per unit
  - custom_formula: formula string for custom calculation
  - final_exam: final exam configuration
  - recovery: recovery exam configuration
';

-- Create a function to validate grading config (optional, for future use)
CREATE OR REPLACE FUNCTION public.validate_grading_config(config jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Basic validation: must have calculation_type
  IF config IS NULL THEN
    RETURN true; -- NULL is valid (default config)
  END IF;
  
  IF config ? 'calculation_type' THEN
    IF NOT (config->>'calculation_type' IN ('simple_average', 'weighted_average', 'total_sum', 'custom_formula')) THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;
