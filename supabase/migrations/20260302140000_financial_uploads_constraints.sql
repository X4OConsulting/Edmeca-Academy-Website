-- Add missing CHECK constraints to financial_uploads table.
-- The original migration was applied without these; this migration retrofits them.

ALTER TABLE public.financial_uploads
  ADD CONSTRAINT financial_uploads_file_name_length
    CHECK (char_length(file_name) <= 255);

ALTER TABLE public.financial_uploads
  ADD CONSTRAINT financial_uploads_file_type_enum
    CHECK (file_type IN ('paste', 'csv', 'xlsx', 'pdf'));
