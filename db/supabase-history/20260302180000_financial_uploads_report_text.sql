-- Add report_text column to financial_uploads
-- Stores the full Claude-generated markdown report so users can reload previous analyses
-- without re-calling the API.

ALTER TABLE public.financial_uploads
  ADD COLUMN IF NOT EXISTS report_text TEXT;

-- Also store the models used (for display in history)
ALTER TABLE public.financial_uploads
  ADD COLUMN IF NOT EXISTS model_categorisation TEXT,
  ADD COLUMN IF NOT EXISTS model_analysis TEXT;
