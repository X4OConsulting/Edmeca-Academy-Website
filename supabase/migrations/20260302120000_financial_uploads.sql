-- Financial uploads history table
-- Stores metadata for every document uploaded to the Financial Analysis tool.

CREATE TABLE public.financial_uploads (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name    text         NOT NULL,
  file_type    text         NOT NULL DEFAULT 'paste',  -- 'paste' | 'csv' | 'xlsx' | 'pdf'
  company_name text,
  analysed_at  timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own uploads"
  ON public.financial_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON public.financial_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX financial_uploads_user_id_idx   ON public.financial_uploads(user_id);
CREATE INDEX financial_uploads_analysed_idx  ON public.financial_uploads(analysed_at DESC);
