# CLAUDE.md

Working instructions for Claude Code in this repository. Read this first, then `docs/WEBSITE_REFRESH_PLAN_2026-10.md`, `docs/STRATEGY_POSITIONS_2026-10.md` and `brand/README.md`.

## What this repository is

The marketing site and portal for EdMeCa (edmeca.co.za). React 18, TypeScript, Vite, Tailwind, shadcn/ui on the client; Vercel Functions under `api/` with server code in `server/`; Neon Postgres; Better Auth. Vercel deploys every push (`main` is production; every branch push gets a preview URL).

- Marketing pages: `client/src/pages/` (Home, About, Solutions, Frameworks, Diagnostic, Engagement, Contact, Login, Signup, ResetPassword, Privacy, Terms).
- Shared chrome: `client/src/components/marketing/` (Header, Footer, MarketingLayout).
- Tokens: `client/src/index.css` (shadcn HSL variables) and `tailwind.config.ts`.
- Portal: `client/src/pages/portal/`. Diagnostics: `client/src/components/aimap/`, `client/src/data/`.
- Brand source of truth: `brand/README.md`, `brand/colors_and_type.css`, `brand/assets/`.
- Content source of truth: `docs/STRATEGY_POSITIONS_2026-10.md`.
- Running context for the refresh: `docs/WEBSITE_REFRESH_CONTEXT.md` (create it in Phase 0 if absent; update it at the end of every session).

## Current work: the website refresh

Branch `strategy-updates`. Follow `docs/WEBSITE_REFRESH_PLAN_2026-10.md` phase by phase, one commit per phase, and stop where the plan says to wait for Raymond's review. All ten clarifications in the plan's Section 4 are answered; treat them as settled.

## Scope

In scope: marketing pages, shared chrome, `client/index.html`, tokens, brand assets, the repo README, docs.
Out of scope: `client/src/pages/portal/`, `client/src/components/aimap/`, `client/src/data/`, `server/`, `api/`, `db/`, auth, environment and Vercel configuration. The only exceptions are the ones the plan names: naming strings and the logo alt text in the portal (Phases 2 and 3), and the contact form field change in `server/forms.ts` (Phase 8). Do not touch the `.dark` block.

## Naming

- The company is EdMeCa in running text. Never EDMECA, Edmeca or "EdMeCa Digital Academy". The legal line, used only in the footer and legal pages, is "Edmeca (Pty) Ltd, trading as EdMeCa".
- The portal is the AI Business Studio. "Online Academy" and "EDMECA Academy" are retired.
- Social handle: @Edmeca Pty Ltd. Email: info@edmeca.co.za.
- Co-founders appear by role only. No personal names, no portraits with names, no personal email addresses anywhere on the site.

## Writing conventions

- No em dashes and no section symbols anywhere: copy, comments, commit messages. Use a comma, a colon, or "to" for ranges.
- Sentence case for body copy and headings; Title Case for programme names (Digital Leader Module, AI Business Studio); uppercase eyebrows via the eyebrow style; the tagline is "From Framework to Execution to Evidence".
- No emoji, no exclamation marks. Lists short and parallel.
- Use: AI and digital; practical digital tools; future tech leaders; research-backed. Do not use: AI and technology; AI tools; 10X; first in the world; white-label; unlimited; free account; any university mention.
- SMEs in copy; SMME only inside the offering name "AI and digital module inside an SMME cohort". QCTO-aligned with a hyphen as an adjective. "Discovery call", not "discovery meeting".
- Keep the three beneficiary groups in this order wherever listed: young people, entrepreneurs, leaders.

## Evidence rules

- Never invent testimonials, numbers, client names, logos, team members or outcomes.
- The evidence section carries the four claims from `docs/STRATEGY_POSITIONS_2026-10.md` only. No figures and no case tiles until Raymond supplies them; record the gap in the context file, not on the page.
- Evidence, when added, is described by programme type, never by client name. Client and partner names appear only on the "Who we have worked with" wall, as text tiles until a logo is cleared.

## Brand tokens (summary; the full mapping is Section 3 of the plan)

| Token | Hex | HSL (shadcn) | Use |
| --- | --- | --- | --- |
| brand green | #99C221 | 75 71% 45% | primary CTA fill (with ink-10 text), accents, fills |
| green-deep | #7DA019 | 76 73% 36% | hover, success |
| green-tint | #F1F7DC | 73 63% 92% | sage section and panel fill |
| brand blue | #454F7E | 229 29% 38% | primary, h3, links, eyebrows on light surfaces |
| blue-deep | #353D5C | 228 27% 28% | dark sections, never black |
| coral | #E15F55 | 4 70% 61% | accent only, never a surface |
| brand gray | #4C4E56 | 228 6% 32% | primary text, never pure black |
| ink-40 | #6A6C75 | 229 5% 44% | body text |
| ink-80 | #D8D9D3 | 75 7% 84% | hairline borders |
| cream | #F7F8F5 | 80 18% 97% | page background |

Rules: Inter only (Playfair Display is removed; JetBrains Mono stays loaded for the portal). No gradients. White cards with a 1 px hairline, 8 px radius (12 to 16 px for hero and programme cards), soft shadows. Lucide icons in brand blue on light surfaces. Contrast: brand green never carries small text; buttons are green fill with ink-10 text or blue fill with white text; eyebrows are blue on light surfaces and green on dark surfaces.

## Working rules

- Confirm `npm ci`, `npm run check`, `npm test` and `npm run build` pass before and after each phase.
- One phase per commit; push after each phase; put the Vercel preview URL and screenshots of the seven marketing routes (1366 px and 390 px) in `docs/WEBSITE_REFRESH_CONTEXT.md`.
- Never merge to `main`. Raymond approves previews and merges.
- Where the plan says copy is approved in the context file first, write the draft there, push, and stop.
- If something in the plan cannot be done as written, record it in the context file and ask; do not improvise around it.
