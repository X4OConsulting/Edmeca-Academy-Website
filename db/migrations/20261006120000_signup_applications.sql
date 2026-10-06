-- Signup page applications. On Netlify they lived only in Netlify Forms; on
-- Vercel the site stores them here and emails the team (api/signup.ts).
create table if not exists public.signup_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 100),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 50),
  organisation text check (char_length(organisation) <= 200),
  interest_type text not null check (interest_type in ('entrepreneur', 'programme', 'other')),
  motivation text not null check (char_length(motivation) <= 5000),
  created_at timestamptz not null default now()
);

create index if not exists signup_applications_created_at_idx on public.signup_applications (created_at desc);
