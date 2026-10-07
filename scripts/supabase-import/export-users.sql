-- Run against the SUPABASE database (psql, from the backups folder).
-- Writes two CSVs that import-users.sql loads into Neon. They hold password
-- hashes: keep them out of git and delete them once Supabase is gone.

\copy (select u.id, u.email, coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)) as name, u.email_confirmed_at is not null as email_verified, nullif(u.raw_user_meta_data->>'avatar_url', '') as image, u.created_at, coalesce(u.updated_at, u.created_at) as updated_at, nullif(u.encrypted_password, '') as password_hash from auth.users u where u.deleted_at is null and u.email is not null order by u.created_at) to 'supabase-users.csv' csv header

\copy (select i.user_id, i.provider, i.provider_id, i.created_at, coalesce(i.updated_at, i.created_at) as updated_at from auth.identities i join auth.users u on u.id = i.user_id where i.provider <> 'email' and u.deleted_at is null order by i.created_at) to 'supabase-identities.csv' csv header
