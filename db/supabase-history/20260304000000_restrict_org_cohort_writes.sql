-- Restrict direct write access to organizations and cohorts tables.
-- Previously only SELECT policies existed, meaning any authenticated user could
-- INSERT/UPDATE/DELETE organization or cohort records via the Supabase client.
-- These tables should only be writable by service-role (admin operations).
-- Using ENABLE RLS + no public write policy = default-deny for writes.

-- Organisations: authenticated users can read, no public write permitted
-- (already covered by existing SELECT policy — this migration adds explicit denial via no-insert-policy)

-- Drop overly-broad catch-all in case it was somehow added
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can delete organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "Authenticated users can update cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "Authenticated users can delete cohorts" ON public.cohorts;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- No INSERT / UPDATE / DELETE policies = service-role-only writes.
-- The Supabase service role bypasses RLS; the anon/authenticated roles cannot write.

-- Document: admin-only insert policy (requires service role key, never sent to client)
COMMENT ON TABLE public.organizations IS 'Organisation records. Writes restricted to service role (admin). Reads available to all authenticated users.';
COMMENT ON TABLE public.cohorts IS 'Cohort records. Writes restricted to service role (admin). Reads available to all authenticated users.';
