# Switchover runbook: Supabase + Netlify → Vercel + Neon

Moves edmeca.co.za from Netlify + Supabase to Vercel + Neon. Allow about two
hours, most of it waiting for DNS. Do it in a quiet hour: login is disabled on
production today, so the only live writes are the public forms and diagnostics.

## Before the day

- [ ] `staging` holds the migration (PR #8) and the Vercel staging URL works.
- [ ] Google OAuth client created; `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set on Vercel (Production).
      Redirect URI: `https://edmeca.co.za/api/auth/callback/google`.
- [ ] New DeepSeek key set as `EDMECA_DEEPSEEK_API` on Vercel (old one rotated).
- [ ] Decide whether login opens at go-live. If yes: `VITE_ENABLE_LOGIN=true` on Vercel Production
      (it is `false` today, matching the current site).
- [ ] Docker running (the data scripts use `psql` in a `postgres:18` container),
      Supabase DB password and Neon connection strings to hand (never in git).

## 1. Stop Netlify from publishing

The migration removes `netlify.toml`, whose `ignore = "exit 0"` is what keeps
Netlify from building `main`. Without this step, merging into `main` would
publish the new code on Netlify, where it cannot run.

- Netlify → site `edmecaacademy` → Site configuration → Build & deploy →
  **Stop builds**. The current production deploy stays published.

## 2. Back up Supabase

```bash
pg_dump -Fc --no-owner -f edmeca-full-<date>.dump "<supabase connection string>"
```

Keep the file outside the repo (it holds personal data).

## 3. Final data copy

From the folder that will hold the CSVs, with `scripts/supabase-import/*.sql` copied in:

```bash
psql "<supabase>" -f export-users.sql     # supabase-users.csv, supabase-identities.csv
psql "<neon>"     -f import-users.sql     # users keep their Supabase ids
psql "<supabase>" -f export-data.sql      # data-*.csv
psql "<neon>"     -f resync-data.sql      # insert or update every Supabase row; deletes nothing
```

`resync-data.sql` ends with a report: rows per table from Supabase, and Neon-only
rows (Netlify Forms messages, anything saved on the Vercel staging site). Review
the Neon-only rows; nothing is removed automatically. Both scripts can be re-run.

Rehearsed on 2026-10-12 on a scratch Postgres 18: two runs back to back, every
table equal to Supabase by checksum, `updated_at` dates untouched.

## 4. Merge to `main`

- Open a PR `staging` → `main` and merge it. Vercel builds Production.
- Check the production deployment on its `*.vercel.app` URL before DNS moves.

## 5. Move the domain

- Vercel → project `edmeca-academy-website` → Settings → Domains → add `edmeca.co.za`
  and `www.edmeca.co.za` (www redirects to the apex, see `vercel.json`).
- At the DNS host for edmeca.co.za (nameservers `ns1-4.v-dns.net`), replace the
  Netlify records with the values Vercel shows for each domain.
- Wait until Vercel shows both domains as valid with a certificate.

## 6. Verify on edmeca.co.za

- [ ] Home, a marketing page and a deep link (e.g. `/portal`) load.
- [ ] Contact and Signup forms save and reach info@edmeca.co.za.
- [ ] Google sign-in works for an existing Google user; their saved work shows.
- [ ] Email sign-up sends a confirmation email; password reset email works.
- [ ] Financial Analysis, BMC analysis and chat answer.
- [ ] Vercel runtime logs show no errors.

## 7. After go-live

- Google OAuth: remove the Supabase and Netlify URIs from the old client, or retire it.
- After a quiet week: delete the Netlify site; pause the Supabase project.
- After another week: delete the Supabase project, then delete the local
  `.env.migration.local` and the CSV exports.

## Rollback

Point the DNS records back to Netlify (`75.2.60.5`); its last production deploy
is still published because builds were stopped, not the site deleted. Anything
written on Vercel in the meantime exists only in Neon and would need copying back.
