# EDMECA Digital Academy

> Entrepreneurship education platform with AI-powered business tools for South African SMEs.

## Live Sites

| Environment | URL | Login |
|---|---|---|
| Production | https://edmeca.co.za | Disabled (pending switchover, see [docs/SWITCHOVER.md](./docs/SWITCHOVER.md)) |
| Staging | https://edmeca-academy-website-git-staging-raymond-3084s-projects.vercel.app | Enabled (Vercel login required) |

Until switchover, edmeca.co.za is still served by Netlify + Supabase from `main`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| API | Vercel Functions (`api/`, Node, region fra1) |
| Auth | Better Auth, self-hosted on Neon (email + password, Google) – see `server/auth.ts` |
| Database | Neon Postgres (Vercel Marketplace), migrations in `db/migrations` |
| AI | Anthropic Claude, Groq (chat), DeepSeek (diagnostic reports) |
| Email | Resend (domain: edmeca.co.za) |
| Hosting | Vercel, team raymond-3084s-projects, project `edmeca-academy-website` |
| CI/CD | GitHub Actions checks; Vercel deploys every push (`main` = production) |

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

Pull the environment from Vercel (needs access to the project):

```bash
vercel link          # once: team raymond-3084s-projects, project edmeca-academy-website
vercel env pull .env.local
```

```bash
vercel dev --listen 3999   # site + API at http://localhost:3999 (port 3000 is often taken)
npm run dev                # site only (Vite) at http://localhost:5173
npm run build              # production build
npm test                   # unit tests (Vitest)
npm run check              # TypeScript
```

Server code in `api/` and `server/` runs as Node ES modules on Vercel: relative imports need a `.js` extension and cannot use the `@/` alias (`tests/unit/esmImports.test.ts` enforces this).

## Branch Strategy

| Branch | Environment | Login | Deploys to |
|---|---|---|---|
| `main` | Production (edmeca.co.za after switchover) | Disabled until switchover | Vercel production |
| `staging` | Staging | Enabled | Vercel preview (stable `git-staging` URL) |
| feature branches | Previews | Enabled | Vercel preview per push |

Pull requests into `staging` are merged automatically by CI once checks pass. Do not merge `staging` into `main` before switchover.

## Database

Neon Postgres. Schema changes are SQL files in [`db/migrations/`](./db/migrations/), applied with:

```bash
npm run db:migrate              # apply pending migrations (uses DATABASE_URL_UNPOOLED from .env.local)
npm run db:migrate -- --status  # list applied / pending
npm run auth:migrate            # create or update Better Auth tables after changing server/auth.ts
```

Key tables: `user`, `account`, `session` (Better Auth), `user_profiles`, `artifacts`, `progress_entries`, `financial_uploads`, `contact_submissions`, `signup_applications`. Supabase history is kept in [`db/supabase-history/`](./db/supabase-history/).

## Project Structure

```
client/src/
  pages/portal/         # Authenticated portal tools
  pages/                # Marketing pages (Home, About, Contact ...)
  components/           # UI, marketing and portal components
  lib/                  # services.ts (API client), auth-client.ts, utils
api/                    # Vercel Functions: auth, data, AI, diagnostics, forms
server/                 # Shared server code: auth, db, email, rate limits, handlers
db/migrations/          # Neon schema (npm run db:migrate)
scripts/
  supabase-import/      # One-off Supabase -> Neon copy (switchover)
  smartsheet-cli.js     # Project tracker CLI (add / complete / status)
docs/                   # Technical documentation (SWITCHOVER.md: go-live runbook)
deliverables/           # SDLC phase deliverables
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

- [Switchover runbook (Supabase/Netlify -> Vercel/Neon)](./docs/SWITCHOVER.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Environment Setup](./docs/ENVIRONMENT_SETUP.md)
- [Git Workflow](./docs/WORKFLOW.md)
- [Smartsheet Integration](./docs/SMARTSHEET_INTEGRATION.md)

## Organisation

**EDMECA Digital Academy** - powered by [X4O Consulting](https://x4o.co.za)
Contact: khusselmann@x4o.co.za