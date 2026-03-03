# EDMECA Digital Academy

> Entrepreneurship education platform with AI-powered business tools for South African SMEs.

[![Netlify Status](https://api.netlify.com/api/v1/badges/edmecaacademy/deploy-status)](https://app.netlify.com/sites/edmecaacademy/deploys)

## Live Sites

| Environment | URL | Login |
|---|---|---|
| Production | https://edmeca.co.za | Disabled (pending auth validation) |
| Staging | https://staging--edmecaacademy.netlify.app | Enabled |
| AI API (Vercel) | https://edmeca-academy-website.vercel.app | - |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (Email via Resend + Google OAuth) |
| Database | Supabase (PostgreSQL) + Drizzle ORM |
| AI API | Anthropic Claude (Haiku + Sonnet) via Vercel Functions |
| Email | Resend (domain: edmeca.co.za) |
| Hosting | Netlify (frontend) + Vercel (AI API) |
| CI/CD | GitHub > Netlify auto-deploy (main / staging / development) |

## Portal Tools

| Tool | Description |
|---|---|
| **Financial Analysis Tool** | Upload bank statements / financials (PDF, CSV, XLSX). AI-generated report. Quick Snapshot (~5s) or Deep Analysis (~45s). Export to PDF or Word. |
| **Business Model Canvas** | Interactive BMC builder |
| **SWOT & PESTLE** | Strategic analysis tool |
| **Value Proposition** | Value prop designer |
| **Pitch Builder** | Pitch deck assistant |
| **Progress Tracker** | Learning progress tracker |

## Quick Start

```bash
git clone https://github.com/X4OConsulting/Edmeca-Academy-Website.git
cd Edmeca-Academy-Website
npm install
```

Copy `.env.example` to `.env.local` and populate:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
VITE_AI_API_URL=https://edmeca-academy-website.vercel.app
VITE_ENABLE_LOGIN=true
SMARTSHEET_API_TOKEN=
SMARTSHEET_SHEET_ID=1413139749883780
RESEND_API_KEY=
SESSION_SECRET=
```

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build locally
```

## Branch Strategy

| Branch | Environment | Login | Auto-Deploy |
|---|---|---|---|
| `main` | Production (edmeca.co.za) | Disabled | Yes |
| `staging` | Staging | Enabled | Yes |
| `development` | Dev preview | Enabled | Yes |

After any merge to `main`, sync branches:

```bash
git checkout staging ; git merge main --no-edit ; git push origin staging
git checkout development ; git merge main --no-edit ; git push origin development
git checkout main
```

## Database

Migrations in [`supabase/migrations/`](./supabase/migrations/).
Apply via the [Supabase SQL editor](https://supabase.com/dashboard/project/dqvdnyxkkletgkkpicdg/sql).

Key tables: `profiles`, `financial_uploads`

## Project Structure

```
client/src/
  pages/portal/         # Authenticated portal tools
  pages/                # Marketing pages (Home, About, Contact ...)
  components/portal/    # Portal-specific components
  components/marketing/ # Header, Footer, etc.
  components/ui/        # shadcn/ui primitives
  lib/                  # exportReport.ts, utils, queryClient
api/
  analyze-financials.ts     # Vercel AI serverless function
netlify/functions/           # Netlify edge functions (contact, chat)
supabase/migrations/         # Database migration files
scripts/
  smartsheet-cli.js          # Project tracker CLI (add / complete / status)
docs/                        # Technical documentation
deliverables/                # SDLC phase deliverables
```

## Smartsheet CLI

Manage the project tracker from the terminal:

```bash
node scripts/smartsheet-cli.js sheet                     # View sheet info
node scripts/smartsheet-cli.js complete 3.25             # Mark task complete
node scripts/smartsheet-cli.js status 3.25 "In Progress" # Set status
node scripts/smartsheet-cli.js add 3.28 "Title" "Feature Development" "High" "Description" "Complete" "Low"
```

## Documentation

- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Environment Setup](./docs/ENVIRONMENT_SETUP.md)
- [Git Workflow](./docs/WORKFLOW.md)
- [Smartsheet Integration](./docs/SMARTSHEET_INTEGRATION.md)

## Organisation

**EDMECA Digital Academy** - powered by [X4O Consulting](https://x4o.co.za)
Contact: khusselmann@x4o.co.za