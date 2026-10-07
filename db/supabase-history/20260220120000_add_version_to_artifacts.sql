-- Add missing version column to artifacts table
-- This column exists in shared/schema.ts but was omitted from the initial migration.

ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
