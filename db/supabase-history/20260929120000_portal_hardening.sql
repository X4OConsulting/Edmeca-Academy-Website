-- Portal hardening, September 2026 (Phase 5 of the portal fixes).
-- Run once in the Supabase SQL editor; every statement is safe to re-run.

-- 1. Financial Analysis: keep the dashboard data with each saved report,
--    so reopening a past analysis shows the gauge and charts, not only text.
ALTER TABLE public.financial_uploads
  ADD COLUMN IF NOT EXISTS structured JSONB;

-- 2. Financial Analysis: let people delete their own reports (POPIA).
DROP POLICY IF EXISTS "Users can delete their own financial uploads" ON public.financial_uploads;
CREATE POLICY "Users can delete their own financial uploads"
  ON public.financial_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- 3. User profiles: the update policy has no column restriction, so a user
--    could make themselves an admin or join any organisation or cohort.
--    Only the service role (server code, the dashboard) may set these fields;
--    for everyone else they keep their current (or default) values.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'entrepreneur';
    NEW.organization_id := NULL;
    NEW.cohort_id := NULL;
  ELSE
    NEW.role := OLD.role;
    NEW.organization_id := OLD.organization_id;
    NEW.cohort_id := OLD.cohort_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.user_profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- 4. Live Dashboard updates: the portal subscribes to changes on these tables,
--    which only arrive once they are in the realtime publication.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'artifacts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.artifacts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'progress_entries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_entries;
  END IF;
END;
$$;
