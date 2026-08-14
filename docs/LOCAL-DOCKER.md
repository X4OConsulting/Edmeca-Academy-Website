# Local Docker Stack

Run the whole EDMECA Academy stack on your machine with Docker — no local
Node/npm setup required. The stack has three parts:

| Part | What | How it runs |
|---|---|---|
| Web app | Vite dev server with HMR | `web` service in `docker-compose.yml` (port **5173**) |
| API functions | Netlify functions: `/api/contact`, `/api/chat` | `functions` service (port **9999**), reached through the Vite proxy |
| Supabase | Postgres, Auth, REST, Studio, mail capture | Supabase CLI (`npx supabase start`) — it manages its own containers from `supabase/config.toml` and applies `supabase/migrations` |

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- That's it — Node is only needed if you use the npm helper scripts below
  (any Node ≥ 18 works for those; the containers pin their own Node)

## Quick start

```bash
# Web + functions only (portal browsable via auth bypass, no database):
npm run docker:dev

# Full stack — local Supabase + web + functions:
npm run stack:up
```

Then open http://localhost:5173.

`npm run stack:up` first-run downloads the Supabase images (~2 GB) and can
take several minutes. Useful local endpoints once it's up:

| URL | Service |
|---|---|
| http://localhost:5173 | Web app |
| http://localhost:54321 | Supabase API (what the app talks to) |
| http://localhost:54323 | Supabase Studio (database UI) |
| http://localhost:54324 | Inbucket/Mailpit — captures signup/reset emails |
| http://localhost:9999/.netlify/functions/contact | Functions server (direct) |

Stop everything with `npm run stack:down` (or `npm run docker:down` if you
only started the compose services).

## Configuration

The first `docker:*`/`stack:*` run copies `.env.docker.example` →
`.env.docker` (gitignored). Defaults point at the **local** Supabase stack
using Supabase's standard local development keys, with `VITE_BYPASS_AUTH=true`
so the portal is browsable immediately.

Common overrides in `.env.docker`:

- **Real auth against local Supabase** — set `VITE_BYPASS_AUTH=false`, run
  `npm run stack:up`, sign up in the app, grab the confirmation email at
  http://localhost:54324.
- **Cloud/staging Supabase instead of local** — set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` to the project values, and set
  `SUPABASE_INTERNAL_URL` to the *same* URL (it's only different when the
  target is on your host machine). Add `SUPABASE_SERVICE_ROLE_KEY` if the
  contact form should write for real.
- **Chat assistant** — set `GROQ_API_KEY`.
- **Financial Analysis tool** — set `VITE_AI_API_URL` to the deployed Vercel
  API (the `api/analyze-financials.ts` Vercel function is not containerized;
  run it with `vercel dev` separately if you need it locally).

## How the pieces connect

- The browser only ever talks to **localhost:5173**. The Vite dev server
  proxies `/api/*` to the functions container (`FUNCTIONS_ORIGIN` env,
  wired in `docker-compose.yml`), mirroring the production redirects in
  `netlify.toml`.
- The functions container reaches the local Supabase stack through
  `host.docker.internal:54321`, because the Supabase CLI publishes its
  services on the host, outside the compose network.
- Source code is bind-mounted into the containers, so edits hot-reload.
  `node_modules` lives in a named volume built inside the image — your
  host `node_modules` (if any) is not used.

## Everyday commands

```bash
npm run docker:dev     # start web + functions in the foreground
npm run docker:down    # stop compose services
npm run stack:up       # local Supabase + web + functions (detached)
npm run stack:down     # stop compose services and Supabase
npm run docker:reset   # also delete the node_modules volume — run this
                       # after changing package.json dependencies
docker compose --profile preview up --build preview
                       # production-style build served on :4173
```

## Gotchas

- **Dependency changes**: the in-container `node_modules` volume is seeded
  from the image on first start only. After editing `package.json`, run
  `npm run docker:reset` and start again so the volume is rebuilt.
- **Ports in use**: the stack needs 5173, 9999 and (full stack) 54320-54324
  free. A host `npm run dev` and the `web` container can't both hold 5173.
- **Windows**: use Docker Desktop's WSL2 backend; keep the repo inside the
  WSL filesystem for fast, reliable file watching.
- **Air-gapped/mirrored registries**: the images default to
  `node:20.19-bookworm-slim` (matching `NODE_VERSION` in `netlify.toml`);
  override with `BASE_IMAGE=<your-mirror/node:...> npm run docker:dev`.
