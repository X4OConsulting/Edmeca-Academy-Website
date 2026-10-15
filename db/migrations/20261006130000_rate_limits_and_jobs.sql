-- Replaces Netlify Blobs on the move to Vercel.

-- Per-user hourly limits on the AI endpoints (server/rateLimit.ts): one row per call.
create table if not exists public.ai_usage (
  name text not null,
  user_id uuid not null references "user"(id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists ai_usage_lookup_idx on public.ai_usage (name, user_id, at desc);

-- Financial Analysis jobs (api/analyze-financials.ts): the page starts a job,
-- then polls until the result is ready, and the row is deleted on collection.
create table if not exists public.analysis_jobs (
  id uuid primary key,
  user_id uuid not null references "user"(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'done', 'error')),
  step text,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists analysis_jobs_user_idx on public.analysis_jobs (user_id);
