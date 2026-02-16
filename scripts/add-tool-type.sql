-- Example: Add new tool type to the system
-- Usage: npm run db:pipeline sql scripts/add-tool-type.sql

-- Add new tool type to enum
ALTER TYPE public.tool_type ADD VALUE IF NOT EXISTS 'lean_canvas';

-- Create index for new tool type (optional, for performance)
-- CREATE INDEX IF NOT EXISTS idx_artifacts_lean_canvas 
--   ON public.artifacts(user_id, created_at) 
--   WHERE tool_type = 'lean_canvas';

-- Example: Insert sample data
-- INSERT INTO public.organizations (name) 
-- VALUES ('EDMECA Digital Academy') 
-- ON CONFLICT DO NOTHING;