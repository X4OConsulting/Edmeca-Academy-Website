---
name: senior-backend
description: 'Senior backend/tooling engineering skill for the EdMeCa Academy platform. Use when: writing or debugging Node.js scripts, configuring Vite/Netlify, working with Supabase (schema, RLS, auth, storage), managing Drizzle ORM migrations, operating the Smartsheet CLI, setting up environment variables, adding Netlify Functions, configuring Resend email, or reviewing build/deploy configuration. Triggers on: "script", "Node.js", "build", "Vite", "Netlify", "deploy", "Supabase", "database", "schema", "migration", "Drizzle", "API", "Smartsheet", "environment", "env", "serverless", "function", "email", "Resend", "CI", "backend", "auth", "OAuth", "RLS".'
argument-hint: 'Describe the script, API, build, deployment, or database task to work on'
---

# Senior Backend & Tooling Engineering — EdMeCa Academy

## Scope
**Node.js ESM scripts · Vite 7 · Netlify (static + Functions) · Supabase (Auth + Postgres + Storage) · Drizzle ORM · Express server · Resend email · Smartsheet REST API · Environment variable management**

---

## Project Architecture

```
Root
├── vite.config.ts          ← Build config (root: "client", out: "client/dist")
├── netlify.toml            ← Deploy config, redirects, security headers, env per context
├── shared/
│   └── schema.ts           ← Drizzle ORM schema (shared between client types + server)
├── server/                 ← Express server (if used for SSR or API proxying)
├── api/
│   └── analyze-financials.ts  ← Serverless-style API handler
├── scripts/
│   ├── smartsheet-cli.js   ← Smartsheet REST API CRUD
│   ├── security-audit.mjs  ← Security report generator
│   └── setup.js            ← Dev environment bootstrap
├── netlify/functions/      ← Netlify serverless functions (ESM .mjs format)
├── supabase/               ← Supabase local config + migrations
└── deliverables/           ← Project documentation HTML
```

All scripts use **ESM (`"type": "module"`)** — always use `import`/`export`, never `require()`.

---

## Node.js Scripts: Standards

```js
// Required boilerplate for __dirname in ESM
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

- Exit with `process.exit(1)` on fatal errors; log a human-readable message first.
- Validate required env vars at the top of the script before doing any work.
- Never log the token/secret value itself — only confirm presence.

---

## Environment Variables

| Variable | Purpose | Required by |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Client (all pages) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Client (all pages) |
| `VITE_ENABLE_LOGIN` | Login button gate | Client header |
| `SESSION_SECRET` | Express session secret | Server |
| `RESEND_API_KEY` | Transactional email | Server / Netlify Functions |
| `SMARTSHEET_API_TOKEN` | Smartsheet REST auth | scripts/smartsheet-cli.js |
| `SMARTSHEET_SHEET_ID` | Target Smartsheet sheet | scripts/smartsheet-cli.js |

**Rules:**
- `VITE_*` prefix exposes vars to the client bundle — never put secrets here.
- Non-`VITE_` vars are server/function only.
- `.env.local` is gitignored and holds real values locally.
- Netlify env vars set per context in `netlify.toml` or Netlify dashboard.

**Login gate pattern** (only acceptable way to check):
```ts
const isLoginEnabled = import.meta.env.VITE_ENABLE_LOGIN === "true";
```

---

## Supabase

### Auth
- Email auth via Resend SMTP (`smtp.resend.com:465`, sender `Info@edmeca.co.za`)
- Google OAuth via `gen-lang-client-0996272869` (BUG-003: consent screen name pending — see copilot-instructions)
- Allowed redirect URLs must include: `http://localhost:5173/**`, `https://edmeca.co.za/**`, `https://staging--edmecaacademy.netlify.app/**`

### RLS Policy Principle
- Row-Level Security is the security boundary — client-side `useAuth()` checks are UX only.
- Every Supabase table that holds user data must have RLS policies.
- Never bypass RLS for portal data (artifacts, progress entries).

### Storage
- Bucket: `publiclogos` — contains `logo.png` for email templates.
- Public read, no write from client.

### Drizzle ORM
- Schema: `shared/schema.ts`
- Migrations: via `supabase/` folder or Drizzle Kit
- Type-safe queries — never raw SQL strings unless absolutely necessary

---

## Vite Configuration

Key settings in `vite.config.ts`:
- `root: "client"` — Vite treats `client/` as project root
- `@` alias → `client/src/`
- `outDir` → `client/dist`
- `envDir` → project root (so `.env` at root is loaded, not `client/.env`)
- Dev server: `port: 5173`, `host: true`

**When modifying `vite.config.ts`:**
- Keep `envDir` at project root — env files live there.
- Don't change `root` without also updating `netlify.toml`'s `publish` path.
- Test with `npm run build` (not just `npm run dev`) before shipping.

---

## Netlify Configuration (`netlify.toml`)

### Branch / Environment strategy
| Branch | Context | Login | Deploy |
|---|---|---|---|
| `main` | `production` | `VITE_ENABLE_LOGIN=false` | Auto |
| `staging` | `staging` | `VITE_ENABLE_LOGIN=true` | Auto |
| `development` | `branch-deploy` | `VITE_ENABLE_LOGIN=true` | Auto |

### After merging to main — always sync:
```sh
git checkout staging ; git merge main --no-edit ; git push origin staging
git checkout development ; git merge main --no-edit ; git push origin development
git checkout main
```

### Security headers (already in netlify.toml)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Adding Netlify Functions
1. Create `netlify/functions/<name>.mjs` (ESM)
2. Validate HTTP method first, then parse body inside try/catch
3. Add env vars to Netlify dashboard — never hardcode
4. Lock `Access-Control-Allow-Origin` to known origins (`edmeca.co.za`, staging URL) — never `*`

---

## Smartsheet CLI (`scripts/smartsheet-cli.js`)

### Sheet IDs
| Sheet | ID |
|---|---|
| SDLC Tasks | `1413139749883780` |
| Test Cases | `3745437451243396` |
| Bug Tracker | `789091202322308` |

### Key column IDs (SDLC sheet)
| Column | ID |
|---|---|
| STATUS | `5778398742531972` |
| % Complete | `3526598928846724` |

### Commands
```sh
node scripts/smartsheet-cli.js sheet                   # list rows
node scripts/smartsheet-cli.js complete <taskId>       # mark 100% Complete
node scripts/smartsheet-cli.js status <taskId> "<val>" # set status string
node scripts/smartsheet-cli.js sync                    # show recent git commits
```

### Commit + Smartsheet workflow
1. `git add <files>`
2. `git commit -m "type(scope): description [X.Y]"` (hook auto-updates task X.Y)
3. `git push origin main`
4. Sync staging + development branches
5. Update `smartsheet/EDMECA_Academy_SDLC_Tasks.csv`

---

## Resend Email

- Domain: `edmeca.co.za` — verified
- DNS: DKIM, SPF, MX, DMARC all set at IT-Guru Online
- Sender: `Info@edmeca.co.za`
- Used for: Supabase auth emails (confirm, reset, magic link) + contact form

---

## References
- [netlify.toml](../../netlify.toml)
- [vite.config.ts](../../vite.config.ts)
- [shared/schema.ts](../../shared/schema.ts)
- [scripts/smartsheet-cli.js](../../scripts/smartsheet-cli.js)
- [copilot-instructions.md](../copilot-instructions.md)
