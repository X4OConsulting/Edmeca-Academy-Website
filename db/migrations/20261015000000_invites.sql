-- Invite-only access. An account can only be created for an email in
-- public.invites (server/auth.ts checks it on every new user, whatever the
-- sign-in method). Admins invite from the portal's Admin page, which creates
-- the account and emails the person; accepted_at is set on first sign-in.
create table if not exists public.invites (
  email text primary key check (email = lower(email) and char_length(email) <= 200),
  user_id uuid unique references "user"(id) on delete cascade,
  name text check (char_length(name) <= 100),
  invited_by uuid references "user"(id) on delete set null,
  application_id uuid references public.signup_applications(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Everyone who already has an account counts as invited and accepted.
insert into public.invites (email, user_id, name, invited_at, accepted_at)
select lower(u.email), u.id, u.name, u."createdAt", u."createdAt" from "user" u
on conflict (email) do nothing;

-- Applications from the public form now wait for an admin's decision.
alter table public.signup_applications
  add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references "user"(id) on delete set null;
