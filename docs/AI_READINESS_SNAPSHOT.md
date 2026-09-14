# Edmeca Gauge

The v2 replacement for this document is the Execution Gap Diagnostic. Its canonical response sheet is [Edmeca Execution Gap Responses](https://docs.google.com/spreadsheets/d/1E4o-RUkF_keY4t3-oVwC9PM4H4F0I_nxtrc5lZl8bJA/edit?gid=0#gid=0), with spreadsheet ID `1E4o-RUkF_keY4t3-oVwC9PM4H4F0I_nxtrc5lZl8bJA`.

The public `/edmeca-gauge` route is a seven-step, no-login From Strategy to Evidence assessment for Edmeca. The legacy `/ai-readiness` route remains as an alias. It scores five dimensions from 1 to 5, shows the respondent's position before asking for contact details, and submits snapshot and unlock actions to `/api/assessment`.

## Local development

Run `npm run dev`, then open `http://127.0.0.1:5173/edmeca-gauge`. The public scoring and results flow works without Supabase or external services. Snapshot delivery is intentionally best-effort until the Netlify function is deployed.

## Netlify configuration

Set these environment variables in the Netlify project:

- `ANTHROPIC_API_KEY` for the AI-written report. Without it, the function uses the built-in practical fallback report.
- `ASSESSMENT_SCRIPT_URL` for the deployed Google Apps Script web app.
- `ASSESSMENT_SHARED_SECRET` matching the Apps Script `SHARED_SECRET` property.

The Apps Script should append snapshots at row 2 in the `Edmeca Gauge Responses` sheet, update the matching row on unlock, email the respondent, and notify `raymond@edmeca.co.za`.

## Verification

- `npx vitest run tests/unit/readinessScoring.test.ts`
- `npm run check`
- `npm run build`

The live benchmark, sector-specific comparisons, PDF report and longer cohort assessment remain Phase 2 work.