-- Run against the SUPABASE database (psql, from the backups folder), after
-- export-users.sql. Writes one CSV per app table for resync-data.sql.
-- The CSVs hold personal data: keep them out of git, delete after cutover.

\copy (select id, name, created_at from public.organizations) to 'data-organizations.csv' csv header
\copy (select id, name, organization_id, invite_code, start_date, end_date, created_at from public.cohorts) to 'data-cohorts.csv' csv header
\copy (select id, user_id, role, organization_id, cohort_id, business_name, business_description, created_at, updated_at from public.user_profiles) to 'data-user_profiles.csv' csv header
\copy (select id, user_id, tool_type, title, content, status, created_at, updated_at, version from public.artifacts) to 'data-artifacts.csv' csv header
\copy (select id, user_id, milestone, completed_at, notes, created_at from public.progress_entries) to 'data-progress_entries.csv' csv header
\copy (select id, user_id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis from public.financial_uploads) to 'data-financial_uploads.csv' csv header
\copy (select id, name, email, company, audience_type, message, created_at from public.contact_submissions) to 'data-contact_submissions.csv' csv header
\copy (select student_id, student_name, student_group, scores, submitted_at from public.ballots) to 'data-ballots.csv' csv header
\copy (select key, value from public.config) to 'data-config.csv' csv header
