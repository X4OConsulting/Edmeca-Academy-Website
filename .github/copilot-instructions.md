# EDMECA Academy – GitHub Copilot Persistent Instructions

This file is auto-loaded by GitHub Copilot on every conversation.
Always read and apply this context before making any changes to the project.

---

## Project Overview

**Client:** EdMeCa Academy  
**Stack:** React + TypeScript (Vite), Tailwind CSS, Supabase auth, Drizzle ORM, Express server  
**Hosting:** Netlify (main = production, staging branch = staging, development branch = dev)  
**Live URL:** https://edmeca.co.za  
**Staging URL:** https://staging--edmecaacademy.netlify.app  
**Repo:** https://github.com/X4OConsulting/Edmeca-Academy-Website

---

## Branch Strategy

| Branch | Environment | Login Button | Auto-Deploy |
|---|---|---|---|
| `main` | Production (edmeca.co.za) | **DISABLED** | Yes |
| `staging` | Staging (staging--edmecaacademy.netlify.app) | **ENABLED** | Yes |
| `development` | Dev preview | **ENABLED** | Yes |

**After every merge to main, always sync staging and development:**
```bash
git checkout staging ; git merge main --no-edit ; git push origin staging
git checkout development ; git merge main --no-edit ; git push origin development
git checkout main
```

---

## Smartsheet Workflow — CRITICAL

**Every code change must be reflected in the live Smartsheet project tracker.**  
Sheet: "EdMeCa Academy Website Development" (Sheet ID: 1413139749883780)

### How the automation works

A git post-commit hook (`.git/hooks/post-commit`) fires on every commit.  
It reads `SMARTSHEET_API_TOKEN` and `SMARTSHEET_SHEET_ID` from `.env.local` and calls the Smartsheet API to update task statuses automatically.

- Commit prefix `fix:` or `feat:` → marks referenced task **Complete** (100%)
- Other prefixes (`docs:`, `test:`, `chore:` etc.) → marks referenced task **In Progress**
- Task ID must appear in the commit message (e.g. `fix: resolve login redirect [3.2]`)

### Manual CLI commands

```bash
# Check connection / sheet info
node scripts/smartsheet-cli.js sheet

# Mark a task complete
node scripts/smartsheet-cli.js complete 3.14

# Set a task to a specific status
node scripts/smartsheet-cli.js status 3.14 "In Progress"

# View recent commits (sync preview)
node scripts/smartsheet-cli.js sync
```

### When to update Smartsheet manually

- When adding NEW rows (POST is blocked by network — add manually in browser at app.smartsheet.com)
- When the hook misidentifies a task status
- When updating % complete to a non-100 value

### Smartsheet CSV files (source of truth for import)

Local copies kept in sync with code:
- `smartsheet/EDMECA_Academy_SDLC_Tasks.csv` — main project tracker
- `smartsheet/EDMECA_Academy_Test_Cases.csv` — all test cases (TC-001 to TC-020+)
- `smartsheet/EDMECA_Academy_Bug_Tracker.csv` — bug log (BUG-001 to BUG-004+)

**Always update the relevant CSV AND push the live Smartsheet update after any task change.**

### Smartsheet Sheet IDs

| Sheet | ID |
|---|---|
| SDLC Tasks (EdMeCa Academy Website Development) | `1413139749883780` |
| Test Cases (EDMECA Academy - Test Cases) | `3745437451243396` |
| Bug Tracker (EDMECA Academy - Bug Tracker) | `789091202322308` |

---

## Environment Variables

Stored in `.env.local` (gitignored — never commit):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_ENABLE_LOGIN` | Set `true` locally and in staging/dev; `false`/unset on prod |
| `SESSION_SECRET` | Express session secret |
| `RESEND_API_KEY` | Resend transactional email API key |
| `SMARTSHEET_API_TOKEN` | Smartsheet API token for CLI and git hook |
| `SMARTSHEET_SHEET_ID` | `1413139749883780` (SDLC Tasks sheet) |

Netlify environment variables are set per context in `netlify.toml`:
- `[context.production]` → `VITE_ENABLE_LOGIN=false`
- `[context.staging]` → `VITE_ENABLE_LOGIN=true`
- `[context.development]` → `VITE_ENABLE_LOGIN=true`

---

## Infrastructure

### Supabase
- Project ID: `dqvdnyxkkletgkkpicdg`
- Auth: Email (Resend SMTP), Google OAuth enabled
- SMTP: `smtp.resend.com:465`, username `resend`, password = Resend API key
- Storage bucket: `publiclogos` — contains `logo.png` for email templates
- Email templates: Confirm Signup, Reset Password, Magic Link — all branded with navy (#1f3a6e) and logo

### Resend (email)
- Domain: `edmeca.co.za` — verified
- DNS records at IT-Guru Online: DKIM TXT (`resend._domainkey`), SPF TXT (`send`), MX (`send` → `feedback-smtp.eu-west-1.amazonses.com`), DMARC TXT (`_dmarc`)
- Sender: `Info@edmeca.co.za`

### Google OAuth
- OAuth project: `gen-lang-client-0996272869`
- Credentials stored in Supabase dashboard and `.env.local` only — never in code or CSVs
- **PENDING (BUG-003):** Supervisor Raymond Crow to update consent screen app name to "EdMeCa Academy" and publish app in Google Cloud Console

### Netlify
- Site: `edmecaacademy.netlify.app`
- Branch deploys enabled for `staging` and `development`
- Forms: Netlify Forms active (hidden HTML form in `client/index.html`)

---

## Login Button — How it works

`client/src/components/marketing/Header.tsx`:
```ts
const isLoginEnabled = import.meta.env.VITE_ENABLE_LOGIN === "true";
```
- When `false`: renders a plain `<button disabled>` with no `<a>` wrapper — completely inert
- When `true`: renders `<a href="/login"><button>...</button></a>`
- Applies to both desktop header and mobile slide-out menu

**Auth testing is on staging only — do not enable login on production until auth is fully validated.**

---

## Active Bugs

| ID | Description | Status |
|---|---|---|
| BUG-001 | Gmail SMTP config reloader error | Resolved — switched to Resend |
| BUG-002 | Confirmation email landing in spam | Resolved — added DMARC record |
| BUG-003 | Google OAuth consent screen shows Supabase URL | **OPEN** — pending supervisor action |
| BUG-004 | Login button navigated despite disabled attribute | Resolved — removed anchor wrapper |

---

## Task Numbering Convention

| Phase | Range |
|---|---|
| 1 – Planning | 1.1 – 1.x |
| 2 – Design | 2.1 – 2.x |
| 3 – Development | 3.1 – 3.x (currently at 3.14) |
| 4 – Testing | 4.1 – 4.x |
| 5 – Deployment | 5.1 – 5.x |
| 6 – Documentation | 6.1 – 6.x |
| 7 – Maintenance | 7.1 – 7.x |

---

## Standard Commit + Smartsheet Update Checklist

After completing any task:
1. `git add` the changed files
2. Commit with task reference: `git commit -m "feat: description [X.Y]"`  
   → Hook auto-updates task X.Y to Complete in Smartsheet
3. `git push origin main`
4. Sync branches: staging → development
5. Update the relevant CSV in `smartsheet/`
6. If it's a new task row in Smartsheet, add it manually at app.smartsheet.com (POST is blocked by network layer)
