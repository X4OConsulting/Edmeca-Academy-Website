-- Run against the NEON database (psql, from the folder holding the CSVs that
-- export-users.sql wrote), after scripts/auth-migrate.ts --apply.
-- Idempotent: re-running updates users in place and adds nothing twice.
\set ON_ERROR_STOP on
begin;

create temp table src_users (id uuid, email text, name text, email_verified boolean, image text, created_at timestamptz, updated_at timestamptz, password_hash text) on commit drop;
create temp table src_identities (user_id uuid, provider text, provider_id text, created_at timestamptz, updated_at timestamptz) on commit drop;
\copy src_users from 'supabase-users.csv' csv header
\copy src_identities from 'supabase-identities.csv' csv header

-- Users keep their Supabase id, so existing rows in the app tables still point at them.
insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
select id, name, lower(email), email_verified, image, created_at, updated_at from src_users
on conflict (id) do update set name = excluded.name, email = excluded.email, "emailVerified" = excluded."emailVerified",
  image = coalesce("user".image, excluded.image), "updatedAt" = greatest("user"."updatedAt", excluded."updatedAt");

-- Email/password sign-in: Better Auth's credential account (accountId = user id) with the bcrypt hash.
insert into account ("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
select s.id::text, 'credential', s.id, s.password_hash, s.created_at, s.updated_at from src_users s
where s.password_hash is not null
  and not exists (select 1 from account a where a."userId" = s.id and a."providerId" = 'credential');

-- Google (and any other OAuth) sign-in: accountId is the provider's subject id.
insert into account ("accountId", "providerId", "userId", "createdAt", "updatedAt")
select i.provider_id, i.provider, i.user_id, i.created_at, i.updated_at from src_identities i
where exists (select 1 from "user" u where u.id = i.user_id)
  and not exists (select 1 from account a where a."providerId" = i.provider and a."accountId" = i.provider_id);

-- Every user has a profile row (Supabase made it in the browser on first sign-in; some never got one).
insert into public.user_profiles (user_id) select id from "user" on conflict (user_id) do nothing;

-- The app tables pointed at Supabase's auth.users; point them at Better Auth's "user" table instead.
do $$
declare t text;
begin
  foreach t in array array['artifacts', 'financial_uploads', 'progress_entries', 'user_profiles'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_user_id_fkey') then
      execute format('alter table public.%I add constraint %I foreign key (user_id) references "user"(id) on delete cascade', t, t || '_user_id_fkey');
    end if;
  end loop;
end $$;

commit;

select (select count(*) from "user") as users,
       (select count(*) from account where "providerId" = 'credential') as password_accounts,
       (select count(*) from account where "providerId" <> 'credential') as oauth_accounts;
