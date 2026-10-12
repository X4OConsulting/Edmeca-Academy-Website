-- Final Supabase -> Neon data copy for switchover day. Run against the NEON
-- database (psql, from the folder holding the CSVs export-data.sql wrote),
-- after import-users.sql so every user the rows point at exists.
--
-- Supabase is the source of truth until switchover, so each Supabase row is
-- inserted, or updated in place when it is already in Neon. Nothing is
-- deleted: Neon also holds rows Supabase never had (Netlify Forms messages,
-- anything saved on the Vercel staging site). The report at the end lists
-- those Neon-only rows so a person can decide about them.
\set ON_ERROR_STOP on
begin;

-- These triggers stamp updated_at = now() on every UPDATE, which would turn
-- each re-copied row's "last edited" into the time of this run. Off for the
-- copy only: DDL is transactional, so they are back on at commit or rollback.
alter table public.artifacts disable trigger update_artifacts_updated_at;
alter table public.user_profiles disable trigger update_user_profiles_updated_at;

create temp table src_organizations (like public.organizations) on commit drop;
create temp table src_cohorts (like public.cohorts) on commit drop;
create temp table src_user_profiles (like public.user_profiles) on commit drop;
create temp table src_artifacts (like public.artifacts) on commit drop;
create temp table src_progress_entries (like public.progress_entries) on commit drop;
create temp table src_financial_uploads (like public.financial_uploads) on commit drop;
create temp table src_contact_submissions (like public.contact_submissions) on commit drop;
create temp table src_ballots (like public.ballots) on commit drop;
create temp table src_config (like public.config) on commit drop;

\copy src_organizations (id, name, created_at) from 'data-organizations.csv' csv header
\copy src_cohorts (id, name, organization_id, invite_code, start_date, end_date, created_at) from 'data-cohorts.csv' csv header
\copy src_user_profiles (id, user_id, role, organization_id, cohort_id, business_name, business_description, created_at, updated_at) from 'data-user_profiles.csv' csv header
\copy src_artifacts (id, user_id, tool_type, title, content, status, created_at, updated_at, version) from 'data-artifacts.csv' csv header
\copy src_progress_entries (id, user_id, milestone, completed_at, notes, created_at) from 'data-progress_entries.csv' csv header
\copy src_financial_uploads (id, user_id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis) from 'data-financial_uploads.csv' csv header
\copy src_contact_submissions (id, name, email, company, audience_type, message, created_at) from 'data-contact_submissions.csv' csv header
\copy src_ballots (student_id, student_name, student_group, scores, submitted_at) from 'data-ballots.csv' csv header
\copy src_config (key, value) from 'data-config.csv' csv header

-- Parents before children (foreign keys).
insert into public.organizations (id, name, created_at)
select id, name, created_at from src_organizations
on conflict (id) do update set name = excluded.name, created_at = excluded.created_at;

insert into public.cohorts (id, name, organization_id, invite_code, start_date, end_date, created_at)
select id, name, organization_id, invite_code, start_date, end_date, created_at from src_cohorts
on conflict (id) do update set name = excluded.name, organization_id = excluded.organization_id, invite_code = excluded.invite_code,
  start_date = excluded.start_date, end_date = excluded.end_date, created_at = excluded.created_at;

-- One profile per user: match on user_id, not id (Neon made profiles for users Supabase had none for).
insert into public.user_profiles (id, user_id, role, organization_id, cohort_id, business_name, business_description, created_at, updated_at)
select id, user_id, role, organization_id, cohort_id, business_name, business_description, created_at, updated_at from src_user_profiles
on conflict (user_id) do update set role = excluded.role, organization_id = excluded.organization_id, cohort_id = excluded.cohort_id,
  business_name = excluded.business_name, business_description = excluded.business_description,
  created_at = excluded.created_at, updated_at = excluded.updated_at;

insert into public.artifacts (id, user_id, tool_type, title, content, status, created_at, updated_at, version)
select id, user_id, tool_type, title, content, status, created_at, updated_at, version from src_artifacts
on conflict (id) do update set user_id = excluded.user_id, tool_type = excluded.tool_type, title = excluded.title, content = excluded.content,
  status = excluded.status, created_at = excluded.created_at, updated_at = excluded.updated_at, version = excluded.version;

insert into public.progress_entries (id, user_id, milestone, completed_at, notes, created_at)
select id, user_id, milestone, completed_at, notes, created_at from src_progress_entries
on conflict (id) do update set user_id = excluded.user_id, milestone = excluded.milestone, completed_at = excluded.completed_at,
  notes = excluded.notes, created_at = excluded.created_at;

insert into public.financial_uploads (id, user_id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis)
select id, user_id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis from src_financial_uploads
on conflict (id) do update set user_id = excluded.user_id, file_name = excluded.file_name, file_type = excluded.file_type,
  company_name = excluded.company_name, analysed_at = excluded.analysed_at, report_text = excluded.report_text,
  model_categorisation = excluded.model_categorisation, model_analysis = excluded.model_analysis;

insert into public.contact_submissions (id, name, email, company, audience_type, message, created_at)
select id, name, email, company, audience_type, message, created_at from src_contact_submissions
on conflict (id) do update set name = excluded.name, email = excluded.email, company = excluded.company,
  audience_type = excluded.audience_type, message = excluded.message, created_at = excluded.created_at;

insert into public.ballots (student_id, student_name, student_group, scores, submitted_at)
select student_id, student_name, student_group, scores, submitted_at from src_ballots
on conflict (student_id) do update set student_name = excluded.student_name, student_group = excluded.student_group,
  scores = excluded.scores, submitted_at = excluded.submitted_at;

insert into public.config (key, value)
select key, value from src_config
on conflict (key) do update set value = excluded.value;

-- Report: Supabase rows (should equal Neon rows that came from Supabase) and Neon-only rows (not touched).
select 'organizations' as "table", (select count(*) from src_organizations) as supabase, (select count(*) from public.organizations t where not exists (select 1 from src_organizations s where s.id = t.id)) as neon_only
union all select 'cohorts', (select count(*) from src_cohorts), (select count(*) from public.cohorts t where not exists (select 1 from src_cohorts s where s.id = t.id))
union all select 'user_profiles', (select count(*) from src_user_profiles), (select count(*) from public.user_profiles t where not exists (select 1 from src_user_profiles s where s.user_id = t.user_id))
union all select 'artifacts', (select count(*) from src_artifacts), (select count(*) from public.artifacts t where not exists (select 1 from src_artifacts s where s.id = t.id))
union all select 'progress_entries', (select count(*) from src_progress_entries), (select count(*) from public.progress_entries t where not exists (select 1 from src_progress_entries s where s.id = t.id))
union all select 'financial_uploads', (select count(*) from src_financial_uploads), (select count(*) from public.financial_uploads t where not exists (select 1 from src_financial_uploads s where s.id = t.id))
union all select 'contact_submissions', (select count(*) from src_contact_submissions), (select count(*) from public.contact_submissions t where not exists (select 1 from src_contact_submissions s where s.id = t.id))
union all select 'ballots', (select count(*) from src_ballots), (select count(*) from public.ballots t where not exists (select 1 from src_ballots s where s.student_id = t.student_id))
union all select 'config', (select count(*) from src_config), (select count(*) from public.config t where not exists (select 1 from src_config s where s.key = t.key));

alter table public.artifacts enable trigger update_artifacts_updated_at;
alter table public.user_profiles enable trigger update_user_profiles_updated_at;

commit;
