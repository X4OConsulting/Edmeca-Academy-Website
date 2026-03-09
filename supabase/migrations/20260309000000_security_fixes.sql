-- Security fixes from Supabase Advisor scan — 2026-03-09
-- Addresses three findings:
--   1. contact_submissions: RLS enabled but no policies
--   2. update_updated_at_column: mutable search_path (CVE pattern)
--   3. (Dashboard action only) leaked password protection — see note below


-- ============================================================
-- FIX 1: contact_submissions RLS policies
-- ============================================================
-- The table already has RLS enabled (from initial_schema.sql) but
-- no policies, which means ALL access is denied by default for the
-- anon and authenticated roles.  The intended model for a public
-- contact form is:
--   • ANYONE (including unauthenticated / anon role) can INSERT
--   • NO ONE (except service_role, used by admin tooling) can
--     SELECT / UPDATE / DELETE via the client API.
-- This follows the principle of least privilege: submit-only public
-- form, admin reads happen via the service_role key in a backend
-- context only.

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow any visitor (even unauthenticated) to submit the contact form.
-- WITH CHECK prevents the insert of extra fields not in the form.
DROP POLICY IF EXISTS "Anyone can submit the contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit the contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Deny all SELECT/UPDATE/DELETE from anon and authenticated roles.
-- No policy = deny; these are explicit for documentation clarity.
-- (service_role bypasses RLS entirely — admin queries are safe)


-- ============================================================
-- FIX 2: update_updated_at_column — fix mutable search_path
-- ============================================================
-- The existing function has no fixed search_path, which means a
-- sufficiently privileged attacker who can change the session
-- search_path could cause the function to resolve untrusted objects.
-- Fix: recreate with SET search_path = '' and fully-qualified names.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''          -- lock the function to an empty search path
AS $$
BEGIN
  NEW.updated_at = now();     -- now() is a built-in — always resolves correctly
  RETURN NEW;
END;
$$;

-- Revoke broad execute permissions that might have been granted implicitly.
-- The function is called by triggers owned by the table owner, which is
-- sufficient — anonymous / authenticated roles do not need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Grant only to the postgres role (table owner / trigger executor)
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO postgres;


-- ============================================================
-- FIX 3: leaked password protection
-- ============================================================
-- This is a dashboard-only setting (Supabase Auth config, not SQL).
-- It cannot be applied via a migration.
--
-- NOTE: Leaked password protection (HaveIBeenPwned integration) requires
-- the Supabase Pro plan and is NOT available on the free tier.
--
-- MITIGATION (free plan): Set a strong minimum password length instead.
-- Dashboard → Authentication → Providers → Email → Minimum password length
-- Recommended value: 12
--
-- If upgraded to Pro in future:
--   Authentication → Providers → Email → Password Strength
--   Toggle: "Reject passwords that have been exposed in data breaches"
-- Or via the Management API:
--   PATCH /v1/projects/{ref}/config/auth
--   Body: { "password_hibp_enabled": true }
--
-- No SQL needed.
