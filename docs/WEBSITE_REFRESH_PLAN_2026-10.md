# EdMeCa Website Update Plan for Claude Code

Prepared: 31 October 2026. Revised 3 November 2026 after review (version 1.2, final for hand-off, all clarifications answered, branch prepared).
Entity: Edmeca (Pty) Ltd, trading as EdMeCa. Keep separate from X4O, Incitrix, CFT, MPS and Squillion. X4O appears only as the "Powered by" build credit in the footer.
Status: final plan, ready to hand to Claude Code. No code, deployment or artefact has been changed. All ten clarifications in Section 4 were answered by Raymond on 3 November 2026 and are recorded there; every phase may start on Raymond's go-ahead once the prerequisites in Section 5 are in place.

Sources reviewed
- Live site edmeca.co.za, rendered on 31 October 2026 (all public routes).
- Source repository: github.com/X4OConsulting/Edmeca-Academy-Website (main at d4aca87, 16 October 2026), deployed by Vercel project `edmeca-academy-website`, team raymond-3084s-projects, production = `main`.
- EdMeCa Design System (Claude artifact MS9wRxFzMGtbD1jNLvTWS4): README (brand book, value statement, presentation layout system, naming rules), colors_and_type.css, logo files without the Online Academy line (31 October 2026).
- BMC Review and Suggested Updates, 31 October 2026 (v2, after the strategy session transcript and RACI), the BMC v2 block drafts, and the decisions log.
- EdMeCa_Business_Model_Canvas_v2_31Oct2026.docx (the strategy document: "Strategy on a page", nine blocks, decisions log), EDMECA_Strategy_2026_2027_Context.md and the executive briefing deck built on 31 October 2026.
- Terminology used in this plan: "SMEs" in running copy, with "SMME" kept only inside the offering name "AI and digital module inside an SMME cohort" as the canvas writes it; "QCTO-aligned" with a hyphen when used as an adjective; the tagline in Title Case, "From Framework to Execution to Evidence"; "discovery call" throughout.

---

## 1. Summary

The live site is a well-built Vite and React marketing site with a portal behind it, but it still sells the April 2026 business: a self-serve "Digital Academy" SaaS with free sign-up, AI-powered framework tools, two customer types (entrepreneurs and programmes) and white-label delivery. It uses a navy and orange palette with a Playfair Display serif, none of which is in the brand guide, and it carries the old logo lockup with "Online Academy" under the wordmark.

The design system and the 31 October strategy decisions move EdMeCa to an own-brand company that develops young people, entrepreneurs and leaders into future tech leaders, sells to corporates, ESD programme owners, institutions, SETAs and funders, delivers through a defined offering stack, and claims only what its evidence pack shows. The portal is now the AI Business Studio, offered as post-programme access, not a subscription.

The plan therefore has two layers, done in this order:

1. Re-skin to the design system (tokens, type, logo, surfaces, chrome). Mechanical, low risk, one branch.
2. Re-write the marketing content to the BMC v2 positions (positioning, segments, offering stack, evidence, engagement, naming). Needs decisions and copy sign-off, page by page.

Both layers touch only the marketing pages and shared chrome. The portal tools, auth, diagnostics logic and API are out of scope except for naming strings and the logo asset.

---

## 2. Current state of edmeca.co.za

### 2.1 Stack and structure (from the repo)

| Item | Finding |
| --- | --- |
| Framework | React 18, TypeScript, Vite, Tailwind, shadcn/ui, wouter-style routing in `client/src/App.tsx` |
| Hosting | Vercel, region fra1, `vercel.json` with SPA rewrite, security headers and a CSP that allows Google Fonts |
| API | Vercel Functions under `api/`, server code in `server/` (auth, assessment, ai-map, execution-gap, email) |
| Marketing pages | `client/src/pages/`: Home, About, Solutions, Frameworks, Diagnostic, Engagement, Contact, Login, Signup, ResetPassword, Privacy, Terms, not-found |
| Shared chrome | `client/src/components/marketing/Header.tsx`, `Footer.tsx`, `MarketingLayout.tsx` |
| Diagnostics | `/diagnostic`, `/ai-map`, `/ai-readiness`, `/execution-gap`, `/edmeca-gauge`, components in `client/src/components/aimap/`, data in `client/src/data/` |
| Portal | `/portal`, `/portal/tools/*`, `/portal/admin`, `/portal/profile` in `client/src/pages/portal/` |
| Tokens | `client/src/index.css` (shadcn HSL variables plus Replit "elevate" helpers), `tailwind.config.ts` |
| Fonts | `client/index.html` loads Inter, Playfair Display and JetBrains Mono from Google Fonts; `font-serif` is used in 16 files |
| Brand assets | `client/public/logo.png`, `client/public/favicon.png` (old lockup with superscript 2 and "Online Academy") |
| Tests and QA | Vitest unit tests, Playwright (`tests/`, `playwright.config.ts`), Lighthouse CI config (`.lighthouserc.json`) covering the seven marketing routes, GitHub Actions lint and type checks on main, staging and development |
| Docs | `docs/` holds deployment, environment, diagnostic and migration guides; no CLAUDE.md in the repo |

### 2.2 Visual audit against the design system

| Area | Live site | Design system | Gap |
| --- | --- | --- | --- |
| Primary colour | Navy `#20325A` (hsl 222 47% 24%) | Brand blue `#454F7E`, blue-deep `#353D5C` for dark surfaces | Replace |
| Accent | Orange `#FB890E` (hsl 31 97% 52%), used for eyebrows, bullets, highlights, CTA band | Brand green `#99C221` for CTAs and eyebrows (green-deep `#7DA019`); coral `#E15F55` as accent only | Replace; orange is not a brand colour |
| Success and checks | Tailwind green `#16A34A` | Green-deep `#7DA019` | Replace |
| Text | Near-black `#0F1729` | Brand gray `#4C4E56` (never pure black), ink-40 `#6A6C75` body | Replace |
| Page background | Off-white `#F9FAFB` and white | Cream `#F7F8F5` default; white reserved for cards; sage tint `#F1F7DC` for accent sections | Replace |
| Dark sections | Navy | Blue-deep `#353D5C`, never black | Replace |
| Headings | Playfair Display serif | Inter only (Helvetica Neue substitute); Comfortaa is locked to the logo | Remove serif |
| Mono | JetBrains Mono loaded | Not needed on marketing pages; used by the portal | Keep loaded for the portal; no use on marketing pages |
| Gradients | Hero has radial and linear gradient washes; CTA band is a gradient panel | No gradients, ever; flat fills | Remove |
| Cards | White, 8 px radius, light shadow | White, 1 px `#D8D9D3` hairline, 8 px (12 to 16 px for hero and programme cards), soft paper shadow | Minor: add hairline, soften shadows |
| Icons | Lucide, line style | Lucide (placeholder until EdMeCa standardises), brand blue on light surfaces | Keep; recolour |
| Logo | Old lockup, superscript 2, "Online Academy" line | New lockup without the Online Academy line; D-mark for favicon | Replace |
| theme-color | `#1a365d` | Brand blue `#454F7E` | Replace |
| Em dashes | Present in About, Frameworks, Engagement, Solutions copy | None in any EdMeCa document, spreadsheet or presentation | Remove |

### 2.3 Content audit against the BMC v2 and strategy decisions

| Area | Live site says | Strategy now says | Action |
| --- | --- | --- | --- |
| Company name | "EdMeCa Digital Academy" (title, meta, footer), "EDMECA Academy" (login, admin, reset password), "EDMECA" (privacy, terms) | EdMeCa in running text; legal name only where needed as "Edmeca (Pty) Ltd, trading as EdMeCa"; never EDMECA | Rename everywhere |
| Portal name | "EDMECA Academy", "the portal" | AI Business Studio (decision, 31 October) | Rename |
| Positioning | "AI-Powered Business Tools", "Turning Strategy into Execution - Backed by Evidence", frameworks for entrepreneurs | Develops people into future tech leaders; proven frameworks through AI-enabled, practical digital tools; evidence of the shift; "AI and digital", not "AI and technology"; research added; Digital Leadership as the positioning | Rewrite hero and statement |
| Value statement | Not present | "EdMeCa turns learning into earning." plus the supporting paragraph (long form once per page); short form "Research-backed AI capability that turns learning into earning." for footers | Add |
| Who we serve | Two cards: For Entrepreneurs, For Programmes | Three beneficiary groups in order: young people, entrepreneurs and SMEs, leaders in corporates and ecosystems. Payers: corporates, ESD programme owners, learning institutions, SETAs and training authorities, funders | Restructure |
| Who we do not serve | Implied self-serve individuals | NGOs without a named funder, individuals paying out of pocket, cold outbound | Remove self-serve framing |
| Offering | Six "AI-powered tools" (Design Thinking, BMC, Strategic Analysis, Value Proposition, Pitch Builder, Progress Tracking) and a Frameworks page | Nine-item market offering stack: Digital Leader Module; AI for Leaders and the AI Catalyst Journey; AI and digital module inside an SMME cohort; Impact Reporting; AI Business Studio; Research offering; Youthpreneur; Accredited skills programmes (QCTO-aligned); Staff capacitation | Replace tools grid with the offering stack |
| Free and self-serve | "Free to start", "No credit card required", "Register Free", "Get Started Free", "Create your free account", a public /signup route | Subscriptions for entrepreneurs ruled out; the Studio is post-programme access; the portal is invite-only; sales rule is "never free" (the free diagnostics stay as the baseline instrument) | Remove free sign-up CTAs; route to discovery call and diagnostic |
| Delivery brand | "White-label options available" (Solutions, Engagement) | EdMeCa builds its own content and delivers under its own brand, co-branded with a programme owner where that helps | Replace |
| Evidence | Three testimonials (Naledi Mokoena, Sipho Ndlovu, Dr Zanele Mthembu) and "Join hundreds of entrepreneurs and programmes" | Claim only what the evidence pack shows: measurable maturity shift per participant, tools adopted, a usable output from every session, funder-ready evidence. No revenue multiples. Evidence is presented by programme type, not by client name: an enterprise and supplier development cohort and an entrepreneur bootcamp run with an accelerator (mid-programme figures only) | Replace; the testimonials and "hundreds" cannot be verified against any programme record and must not stay unless confirmed real |
| Who we have worked with | None shown | Attacq and Green Seeds, Property Point and Growthpoint, EM Lyon and Stellenbosch Business School, Social Enterprise Academy, Nedbank, University of the Western Cape, Serosoft (Academia) | Add a "Who we have worked with" logo wall, subject to permission |
| Engagement tiers | Focused Session (1 to 2 days), Mid-Tier Journey (4 to 8 weeks, "Most Popular"), Full Journey (6 to 12 months); "Custom" pricing; "Unlimited platform usage", "Email support", "White-label options" | Three tiers (from the January briefing, recorded in the design system under "Three engagement tiers"): Focused Session; Mid-Tier (4 to 5 targeted interventions); Full Journey (12-month partnership with baseline-to-outcome impact reporting). Pricing: component catalogue and rate card by client type, quoted in a proposal within five working days. Impact Reporting is the standalone entry product | Reword tiers; remove unproven labels; add Impact Reporting as the entry point |
| About | "Our Story" describes "a platform"; "Our Values" lists four invented values; team tiles say "Coming Soon" | Own-brand delivery; value statement adopted; three values confirmed on 3 November 2026 (Empowerment, Collaboration, Impact; wording in Section 4, item 5); three co-founder roles presented as roles with a short narrative each, not as named people (Business Development, Marketing and Branding; Research and Content; Operations and Technology); January lesson: AI onboarding before frameworks, then a tools refresh, then a sprint | Rewrite story and approach; co-founder role cards; values from the canvas |
| End game | Not mentioned | Future Tech University is internal; the external wording is "accredited pathways" (no university mention, per the final briefing) | Use "accredited pathways" only |
| Credentials | Not shown | Level One B-BBEE contributor (used for supplier databases) | Add to footer and About |
| Contact | "Info@edmeca.co.za" (capital I), "Global Reach: Africa, Europe and beyond" | info@edmeca.co.za; @Edmeca Pty Ltd; South Africa based, partners across Africa and Europe | Correct |
| Diagnostics | AI Enablement Map (individual and business) and Execution Gap (entrepreneur), presented as standalone instruments | The Digital Leader Module baseline is the PRE in PRE and POST; the diagnostics are the public entry to it | Keep both; connect them to the Digital Leader Module and Impact Reporting in copy |

---

## 3. Target design tokens

The repo uses shadcn HSL variables. Map them to the design system as follows (HSL triplets computed from the brand hex values). Keep the design system hex values as the comment of record on each line.

| Variable | Current | Target | Brand token |
| --- | --- | --- | --- |
| `--background` | 210 20% 98% | 80 18% 97% | cream `#F7F8F5` |
| `--foreground` | 222 47% 11% | 228 6% 32% | brand gray `#4C4E56` |
| `--card` | 0 0% 100% | 0 0% 100% | white |
| `--card-border`, `--border` | 214 20% 92% / 90% | 75 7% 84% | ink-80 `#D8D9D3` |
| `--primary` | 222 47% 24% | 229 29% 38% | brand blue `#454F7E` |
| `--primary-foreground` | 0 0% 100% | 0 0% 100% | white (contrast 7.9:1) |
| `--secondary` | 214 20% 94% | 73 63% 92% | green-tint `#F1F7DC` |
| `--secondary-foreground` | 222 47% 24% | 229 29% 38% | brand blue |
| `--muted` | 214 20% 96% | 75 10% 93% | ink-90 `#EFF0EC` |
| `--muted-foreground` | 215 16% 40% | 229 5% 44% | ink-40 `#6A6C75` |
| `--accent` | 31 97% 52% (orange) | 75 71% 45% | brand green `#99C221` |
| `--accent-foreground` | 0 0% 100% | 227 13% 14% | ink-10 (see contrast note) |
| `--destructive` | 0 84% 60% | 4 70% 61% | coral `#E15F55` |
| `--ring` | 222 47% 24% | 75 71% 45% at 20% alpha | `--shadow-ring` |
| `--radius` | .5rem | .5rem | 8 px cards; 12 to 16 px hero cards via utilities |
| `--font-serif` | Playfair Display | remove; alias to Inter during migration | Inter |
| `--font-mono` | JetBrains Mono | unchanged | portal only |
| `--chart-1..5` | navy, orange, teal, purple, pink | blue, green, green-deep, blue-deep, coral | brand ramp |
| New: `--brand-green-deep` | none | 76 73% 36% | `#7DA019` |
| New: `--brand-blue-deep` | none | 228 27% 28% | `#353D5C` dark sections |
| New: `--brand-green-soft` | none | 72 63% 77% | `#DAE99F` |
| `.dark` block | navy and orange inverted | unchanged (portal only, decision 4.9) | out of scope |

Also add the design system's shadow scale (`--shadow-1` to `--shadow-3`), motion tokens (120, 200, 320 ms, `--ease-out`) and the eyebrow style (12 px, bold, uppercase, 0.14 em tracking).

Contrast note (WCAG AA, computed): brand green on white is 2.1:1 and green-deep on cream is 2.9:1, so neither passes for text; ink-10 on green passes at 7.7:1, white on blue at 7.9:1, white on blue-deep at 10.6:1, green on blue-deep at 5.1:1. Consequences for the site:

- Primary buttons: green fill with ink-10 text (not white text), or blue fill with white text. Adopted under decision 4.8: green fill with ink-10 text for the single primary CTA and blue outline for secondary, which matches the design system's "primary CTAs green" rule while passing AA.
- Eyebrows on light surfaces: green-deep at 12 px bold does not pass AA. Either set eyebrows in brand blue on light surfaces (green on dark surfaces), or add a text-safe green token to the design system. Settled under decision 4.8: blue eyebrows on light surfaces, green on dark.
- Green is fine as a fill, rule, dot, bullet, pill background or one word in a large (24 px plus) heading on blue-deep.

---

## 4. Clarifications (answered 3 November 2026)

Each item records the question as put and Raymond's answer. Claude Code copies the answers into `docs/WEBSITE_REFRESH_CONTEXT.md` in Phase 0 and treats them as settled.

1. Evidence block. Confirm that the three testimonials on the home page are not real quotes. If they are not, they are removed. Replacement: an evidence panel drawn from the two current programme reports, presented by programme type (an enterprise and supplier development cohort; an entrepreneur bootcamp run with an accelerator) with no client named and mid-programme figures only, plus real quotes only with written consent. Also confirm "hundreds of entrepreneurs" is dropped.
   Answer: confirmed. The testimonials and the "hundreds" line are removed.
2. Free sign-up. Confirm removal of "Free to start", "No credit card required", "Register Free", "Get Started Free" and the public `/signup` route from the marketing site (sign-up stays reachable for invited users only, or `/signup` redirects to the contact form with "Apply for access"). The free diagnostics remain the public entry point.
   Answer: confirmed. Remove the free-account CTAs and the public /signup route; /signup redirects to /contact with "Apply for access".
3. "Who we have worked with" logos. Confirm which logos may be shown (Attacq, Green Seeds, Property Point, Growthpoint, EM Lyon, Stellenbosch Business School, Social Enterprise Academy, Nedbank, University of the Western Cape, Serosoft (Academia)). Text tiles are the fallback until permission is in hand.
   Answer: use placeholders. Build the wall with text tiles for all ten organisations; swap in logos later as permissions arrive.
4. Co-founder roles. The About page presents the three co-founders by role, not by name: a narrative card each for Business Development, Marketing and Branding; Research and Content; and Operations and Technology (draft narratives in Phase 7). Confirm the three narratives, and whether the cards carry greyscale portraits (unnamed) or the D-mark. No names or personal email addresses on the page; contact routes to info@edmeca.co.za.
   Answer: approved. The three narratives in Phase 7 are final; cards carry the D-mark (no portraits).
5. Values section. The four invented values on the live page are replaced with EdMeCa's values from the strategy document of 31 October 2026.
   Answer: the values are final and read exactly as follows, under the heading "Our Values":
   - Empowerment: We uplift and enable youth, entrepreneurs and business leaders to reach their full potential.
   - Collaboration: We build an ecosystem where people, ideas and opportunities connect.
   - Impact: We measure our success by the positive, lasting change we create in society.
   The design principles stay internal and do not appear on the site.
6. Engagement page pricing. Confirm the site shows no prices and promises a proposal within five working days of a discovery call, in line with the rate-card decision. Confirm removal of "Most Popular", "Unlimited platform usage", "Email support" and "White-label options".
   Answer: yes. No prices; proposal within five working days; the four labels are removed.
7. Frameworks page. The offering stack makes the standalone Frameworks page redundant. Options: (a) retire it and redirect `/frameworks` to `/solutions#studio`; (b) keep it as the AI Business Studio page describing the Studio as the canvas does (BMC and other templates, prompt building, the leadership tool, progress tracking) and listing the tools that exist in the portal today (BMC, SWOT and PESTLE, value proposition, pitch builder, financial analysis, progress tracker) as post-programme access. Recommend (b), renamed to "AI Business Studio" at `/studio` with a redirect from `/frameworks`.
   Answer: rename. Option (b) applies: `/studio`, titled AI Business Studio, with `/frameworks` redirecting to it.
8. Eyebrow and button colours. Settle the contrast rule in Section 3 in the design system first (text-safe green token or blue eyebrows), then apply it to the site.
   Answer: use the recommendation. Primary buttons are green fill with ink-10 text, secondary buttons blue outline; eyebrows are brand blue on light surfaces and green on dark surfaces. The design system README gets a note recording this rule as part of prerequisite 1.
9. Dark mode. The marketing site has no theme toggle; the `.dark` block serves the portal. Confirm whether to re-map it to brand colours now or leave it for a later portal pass. Recommend leaving the portal pass for later and scoping this plan to marketing pages only.
   Answer: agreed. The `.dark` block is untouched in this plan.
10. Legal pages. Privacy and Terms name "EDMECA" and "the EDMECA Academy portal". Renaming to EdMeCa and AI Business Studio is a wording change only; confirm it may be made without legal review. The legal line itself is settled by the design system: "Edmeca (Pty) Ltd, trading as EdMeCa".
   Answer: yes. Phase 9 proceeds without legal review.

Non-gating (can be answered during the build): the LinkedIn page URL to pair with @Edmeca Pty Ltd in the footer, whether the "Powered by X4O" credit stays, whether to add a short Research offering page, and whether the Youthpreneur offering is public yet or listed as "in development" (until answered, Phases 4 and 5 show Youthpreneur with an "in development" label).

---

## 5. Prerequisites to hand to Claude Code

1. Export the design system files into the repo so Claude Code can read them (Claude Code cannot open claude.ai artifacts). Create `brand/` at the repo root with: `README.md` (brand book), `colors_and_type.css`, `assets/edmeca-logo.png`, `assets/edmeca-logo-full.png`, `assets/edmeca-wordmark.png`, `assets/edmeca-mark.png`, and the brand guide PDF. Do not copy `assets/legacy-online-academy/`. Before exporting, correct the design system README: social handle @Edmeca Pty Ltd; University of the Western Cape and Serosoft (Academia) added to the clients and partners line; and a note recording the contrast rule from Section 4, item 8 (green buttons carry ink-10 text; eyebrows are blue on light surfaces, green on dark). The brand guide PDF is carried as the 2024 colour and type reference only; its logo pages are superseded by the files in `assets/`.
2. Put this plan at `docs/WEBSITE_REFRESH_PLAN_2026-10.md` and the BMC v2 text ("Strategy on a page"; Customer Segments; Value Propositions; Channels; Revenue Streams) at `docs/STRATEGY_POSITIONS_2026-10.md` as the copy source of truth.
3. Evidence figures are deferred (Raymond, 3 November 2026). Phase 4 builds the evidence section with the four claims only; the two programme-type case tiles are not built until Raymond supplies the figures, and no placeholder figures are shown. Logos: text tiles until cleared.
4. Confirm the working branch and deployment path: branch `strategy-updates` from `main`; preview deployments on Vercel per push; merge to `main` only after Raymond approves the preview. The repo's README mentions a `staging` branch, but origin currently has only `main`, so previews are the review surface.

---

## 6. Work plan

Each phase is one Claude Code session or less, ends with a commit, a Vercel preview link and an update to the context file. Phases 1 and 2 need no copy decisions and can start on confirmation of this plan alone.

### Phase 0: Setup (30 minutes)

Files: `CLAUDE.md` (new), `docs/WEBSITE_REFRESH_CONTEXT.md` (new), `brand/` (from prerequisite 1).

Tasks
- Add `CLAUDE.md` with: the stack summary from Section 2.1; the naming rules (EdMeCa, AI Business Studio, legal name only in the legal line); the writing conventions (no em dashes, no section symbols, sentence case body, Title Case programme names, uppercase eyebrows, no emoji, no exclamation marks); the brand token table from Section 3; the rule that marketing pages are in scope and `portal/`, `server/`, `api/`, `aimap/` and `data/` are not, except for naming strings and the logo path; the rule that no evidence, testimonial, number or partner name is invented; and the instruction to update `docs/WEBSITE_REFRESH_CONTEXT.md` at the end of every session.
- Create `docs/WEBSITE_REFRESH_CONTEXT.md` with the ten answered clarifications from Section 4, the phase checklist and an empty change log. This is the running context file.
- Update the repo `README.md`: the site is EdMeCa (not "EDMECA Digital Academy"), and the deployment table reflects that origin has only `main` and previews are the review surface.
- Create the branch and confirm `npm ci`, `npm run check`, `npm test` and `npm run build` pass before any change.

Acceptance: clean build on the branch; context file committed.

### Phase 1: Tokens and type (2 hours)

Files: `client/src/index.css`, `tailwind.config.ts`, `client/index.html`, 16 files using `font-serif`.

Tasks
- Replace the `:root` variables with the Section 3 mapping; keep the Replit `elevate` helpers since shadcn buttons depend on them; add the brand tokens, shadow scale, motion tokens and the `.eyebrow` utility.
- Remove Playfair Display from the Google Fonts link in `client/index.html`; load Inter 400, 500, 600, 700, 800. Keep JetBrains Mono in the link because the portal's financial analysis tool and chart component use it (portal is out of scope). Keep the CSP as is (it already allows Google Fonts).
- In `tailwind.config.ts`: set `fontFamily.sans` and `fontFamily.serif` both to Inter during migration, then replace every `font-serif` class with a display utility (`font-bold tracking-tight` for h1 and h2, `font-semibold text-primary` for h3) and delete the serif alias. Extend `borderRadius` with `xl: 12px` and `2xl: 16px` for hero and programme cards. Map `boxShadow` to the three brand shadows.
- Replace Tailwind `green-*`, `orange-*` and `amber-*` utility classes in marketing pages with the brand tokens (`grep -rn "text-green\|bg-green\|text-orange\|bg-orange\|text-amber\|bg-amber\|accent" client/src/pages client/src/components/marketing`).
- Remove the two gradient washes in `Home.tsx` (hero and CTA band) and replace them with flat brand surfaces (cream hero, sage tint CTA panel with a hairline). Keep the existing copy and section structure; Phase 4 restructures the page.
- Update `theme-color` to `#454F7E`.

Acceptance: no Playfair request in the network log; no orange or navy anywhere on marketing routes; Lighthouse CI accessibility score not lower than before; screenshots of all seven marketing routes attached to the context file.

### Phase 2: Brand assets (1 hour)

Files: `client/public/logo.png`, `client/public/favicon.png`, `client/public/brand/` (new), `client/index.html`, `Header.tsx`, `Footer.tsx`, `client/src/pages/portal/BMCTool.tsx` (alt text only).

Tasks
- Replace `logo.png` with the new lockup (no Online Academy line); add `edmeca-mark.png` as favicon and apple-touch-icon at 32, 180 and 512 px; add an OG image (1200 by 630, cream, logo plus the tagline "From Framework to Execution to Evidence") and reference it in `index.html`.
- Respect the logo clear-space rule (50 percent of logo height) in the header and footer; header logo at a height that keeps the wordmark legible on mobile.
- Fix the alt text "EdMeCa Online Academy" in BMCTool.tsx to "EdMeCa".

Acceptance: no file in the build references the old lockup; favicon renders the D-mark.

### Phase 3: Global chrome and naming (2 hours)

Files: `Header.tsx`, `Footer.tsx`, `MarketingLayout.tsx`, `client/index.html` (title and meta), `Login.tsx`, `Signup.tsx`, `ResetPassword.tsx`, `portal/Admin.tsx` (strings only). Privacy and Terms are left to Phase 9.

Tasks
- Header navigation: About, What we do (Solutions), Impact (an anchor to the home page evidence section, `/#impact`, not a new route), Engagement, Diagnostic, Contact. Right side: "AI Business Studio" (link to `/login`) and the primary CTA "Book a discovery call" (to `/contact`). Remove "Get Started".
- Footer: new logo; short value statement line "Research-backed AI capability that turns learning into earning."; columns What we do (the offering groups), Company (About, Impact, Engagement, Contact), Studio (sign in); contact info@edmeca.co.za and @Edmeca Pty Ltd; a Level One B-BBEE line; legal line "Edmeca (Pty) Ltd, trading as EdMeCa. All rights reserved." with Privacy and Terms; keep "Powered by X4O" as a small build credit unless the non-gating answer in Section 4 removes it.
- Title "EdMeCa | From Framework to Execution to Evidence"; meta description from the value statement; keywords replaced with: digital leadership, AI capability, enterprise and supplier development, impact reporting, QCTO-aligned skills programmes, entrepreneur development, South Africa.
- Replace every "EdMeCa Digital Academy", "EDMECA Academy", "EDMECA" and "the portal" string with EdMeCa or AI Business Studio as the context requires. Login heading: "Sign in to the AI Business Studio"; invite line: "The AI Business Studio is available to programme participants and partners. Ask your programme lead or contact us for access."

Acceptance: `grep -rn "Digital Academy\|EDMECA\|Online Academy" client/src` returns only the legal line and the Privacy and Terms strings that Phase 9 handles; all seven routes carry the new chrome.

### Phase 4: Home page (3 hours)

File: `client/src/pages/Home.tsx` (split sections into `client/src/components/marketing/home/` if the file grows past 300 lines).

Section order and copy direction (final copy to be approved in the context file before it is coded):
1. Hero (cream, split layout with a sage panel; no photography until an approved asset exists). Eyebrow: "From Framework to Execution to Evidence" (rendered uppercase by the eyebrow style). Headline: "We develop people into future tech leaders." Lead: "Proven business frameworks, delivered through AI-enabled, practical digital tools, with evidence of the shift from baseline to outcome." Primary CTA "Book a discovery call"; secondary "Take the free baseline" to `/diagnostic`. No "free to start" line.
2. Statement band (blue-deep, white text, last word of the headline in green): the long-form value statement, once. "EdMeCa turns learning into earning." plus the supporting paragraph, in the design system's order (young people, entrepreneurs, leaders) with the measurement sentence.
3. Who we develop: three cards in order. Young people (work-ready, Youthpreneur, accredited pathways). Entrepreneurs and SMEs (businesses that last; a usable output from every session). Leaders in corporates and ecosystems (Digital Leadership: leading, and digital; cyber risk sits inside it).
4. Who commissions our programmes: one row of five tiles, text only: corporates and skills development foundations; ESD and supplier development programme owners; learning institutions and TVET colleges; SETAs and training authorities; funders and foundations. One line under the row: "Delivered under the EdMeCa brand, co-branded with your programme where that helps."
5. What we do: the offering stack in four groups (see Phase 5), each group a card listing its offerings (four, two, two and one) and a "See the full offering" link to `/solutions`.
6. How we work: four steps from the January lesson and the engagement model: AI onboarding first; frameworks and tools refresh; sprint to a usable output; measure and report (PRE, MID, POST). The diagnostic card sits here: "Where are you on the AI Enablement Map? Eight minutes, free, no account."
7. Evidence: "What the evidence shows" with the four claims the BMC allows (maturity shift per participant, tools adopted, a usable output from every session, funder-ready evidence). No figures and no case tiles in this release: the two programme-type case tiles (an enterprise and supplier development cohort; an entrepreneur bootcamp run with an accelerator) are added in a later pass once Raymond supplies the figures. Leave a marked TODO in the context file, not on the page. "Who we have worked with" wall below, built as text tiles for all ten organisations (logos swapped in as permissions arrive). The testimonials component is deleted.
8. Closing CTA (sage tint panel, flat): "Let's talk about your programme." Primary "Book a discovery call"; secondary "Request an impact reporting sample" (mailto or contact form with the subject preset).

Acceptance: no claim on the page that is not traceable to the BMC v2, the evidence reports or the design system; copy approved in the context file; mobile layout checked at 390 px; no em dashes (`LC_ALL=C grep -rnP "\xE2\x80\x94" client/src/pages` returns nothing; the pattern is the UTF-8 bytes of the em dash).

### Phase 5: Solutions page, the offering stack (3 hours)

Files: `client/src/pages/Solutions.tsx`, `client/src/pages/Frameworks.tsx` (renamed `Studio.tsx`, decision 4.7), `App.tsx` for the redirects (`/solutions/entrepreneurs` and `/solutions/programmes` redirect to the new anchors; `/frameworks` to `/studio`).

Structure: intro paragraph (the proposition: industry insight, academic rigour and practical digital tools, delivered by facilitators working from one playbook), then the nine offerings as cards in four groups, each card with eyebrow (group), title, one sentence, "For" line (the Primary segments column of the market offering stack table in `docs/STRATEGY_POSITIONS_2026-10.md`) and a link to the contact form with the offering preset.

| Group | Offerings |
| --- | --- |
| Programmes | Digital Leader Module (signature opener, 10-dimension baseline, maturity scale 1 to 4); AI for Leaders and the AI Catalyst Journey (executive session, then six sessions); AI and digital module inside an SMME cohort; Youthpreneur (youth variant for TVET incubators and youth programmes, QCTO-aligned) |
| Evidence services | Impact Reporting (baseline, mid, post, consolidated report within 10 business days, formatted for funder reporting); Research offering (sector and trend research for programme owners and institutions) |
| Accredited pathways | QCTO-aligned skills programmes, starting with AI and Automation User and related unit standards, with work-integrated learning and RPL entry; staff capacitation for institutions (train-the-trainer) |
| Digital tools | AI Business Studio: BMC and other templates, prompt building, the leadership tool, progress tracking; one studio with business, individual and leader contexts; post-programme access, not a subscription |

Rules: no "white-label"; no "unlimited"; no "free account"; no university mention; the Digital Leadership paragraph from the BMC appears once on this page.

Acceptance: all nine offerings present with the BMC wording; old route redirects work; Lighthouse CI URL list updated if routes change.

### Phase 6: Engagement page (2 hours)

File: `client/src/pages/Engagement.tsx`.

- Three tiers with the design system names and descriptions: Focused Session (single targeted intervention, for example a BMC workshop, design sprint or pitch prep); Mid-Tier (4 to 5 targeted interventions, scoped outcomes, measurable participant progression); Full Journey (12-month partnership, comprehensive tooling, multiple touchpoints, baseline-to-outcome impact reporting). The Full Journey card is the inverted (blue-deep) card per the UI kit.
- Remove the "Most Popular" badge, the "Custom" price labels, "Unlimited platform usage", "Email support", "Priority support", "White-label options". Add "Studio access after the programme" where tooling is included.
- Add an "Impact Reporting on its own" card as the entry product, before the tiers or beside them.
- Replace the pricing FAQ answer with the rate-card position: pricing is built from a component catalogue and a rate card by client type; a proposal follows within five working days of a discovery call; discounts are stated upfront.
- Rewrite the remaining FAQs without em dashes.

Acceptance: wording matches the design system tier descriptions; no price, badge or support promise that the strategy has not made.

### Phase 7: About page (2 hours)

File: `client/src/pages/About.tsx`, images in `client/public/images/`.

- Hero: "Making business-level thinking work for the people who need it." Lead from the BMC proposition.
- Our story: rewrite to the own-brand position (founded to make MBA-level frameworks usable by entrepreneurs and programme owners; grew through ESD and accelerator cohorts; now builds its own content and delivers under its own brand; QCTO alignment as the design principle for all new content). Mention "accredited pathways" as the direction; no university.
- Our approach: the January lesson as three steps (AI onboarding before frameworks; tools refresh; sprint to a usable output), with measurement as the fourth.
- Value statement: the long form lives on the home page statement band; the About page uses the short form plus the three beneficiary lines (young people, entrepreneurs, leaders).
- Our Values: three cards, one per value, with the wording copied exactly from Section 4, item 5 (Empowerment, Collaboration, Impact). Heading "Our Values"; no additions; the design principles are not shown.
- Co-founders by role: three cards following the design system People slide layout, with the role title in brand blue uppercase in place of a name (decision 4.8), a short narrative, and the D-mark in place of a portrait (decision 4.4). No names, no email addresses. Remove the "Coming Soon" tiles. Draft narratives, to be approved in the context file before coding:
  - Business Development, Marketing and Branding. "The co-founder who opens the door. Builds and keeps the relationships with programme owners, corporates, institutions and funders, takes every enquiry from a first conversation to a discovery call and a proposal within five working days, and keeps the EdMeCa brand consistent across every programme we deliver, co-branded with a partner where that helps."
  - Research and Content. "The co-founder who builds what we teach. Owns the content engine: the frameworks, the QCTO-aligned programmes, the research offering and the material each cohort works from. Brings the academic rigour that sits alongside industry insight, and turns sector and trend research into programme content that stays current."
  - Operations and Technology. "The co-founder who makes it run and proves it worked. Owns delivery from onboarding to close-out, the AI Business Studio and the practical digital tools that make every session produce a usable output, and the measurement: the baseline, the mid-point and the post-programme assessment that become the impact report within ten business days."
- Credentials line: Level One B-BBEE contributor; South Africa based; partners across Africa and Europe.
- Replace `about-our-story.webp` only if a brand-compliant photograph is supplied (warm, candid workshop scene, no corporate stock); otherwise use a sage panel with the D-mark.

Acceptance: no "platform" as the company description; no em dashes; no personal names or email addresses on the page; the three role narratives approved in the context file.

### Phase 8: Diagnostic, Contact, Login and Signup (2 hours)

Files: `Diagnostic.tsx`, `Contact.tsx`, `Login.tsx`, `Signup.tsx`, `App.tsx`.

- Diagnostic: keep both instruments. Add one line above the cards connecting them to the offering: "Both instruments are the baseline we use inside the Digital Leader Module and in Impact Reporting. Take one now, retake it after an intervention, and see the dot move." The two eyebrows ("I am an individual", "I am an entrepreneur") stay as they are. Apply tokens; no logic changes. The new sentence goes in `Diagnostic.tsx`, not in the `aimap/` components.
- Contact: lower-case the email; "I am..." options become: a corporate or skills development foundation; an ESD or supplier development programme; a learning institution, TVET college or SETA; a funder or foundation; an entrepreneur or young person on a programme; other. Add an optional "Offering of interest" select fed from the nine offerings. Response promise stays at one business day; proposal within five working days of a discovery call. Replace "Global Reach" with "South Africa based, working with partners across Africa and Europe."
- Login: naming per Phase 3; remove or hide "Apply for access" if it points to `/signup`; route it to `/contact` with the subject "Studio access".
- Signup: remove the public route from `App.tsx` and redirect `/signup` to `/contact` with the subject "Apply for access" (decision 4.2).

Acceptance: contact form still posts to `/api/contact`; `server/forms.ts` accepts the changed "I am" option values and the one new optional field "Offering of interest" and includes both in the notification email (this is the only server change in the plan, named here as the scope exception); diagnostics unchanged in behaviour (run the existing Playwright diagnostic tests).

### Phase 9: Legal pages (30 minutes)

Files: `Privacy.tsx`, `Terms.tsx`.

- EDMECA to EdMeCa; "the EDMECA Academy portal" to "the AI Business Studio"; the defined term "EdMeCa" after the legal name; remove em dashes. No change to the substance of either policy.

### Phase 10: QA, accessibility and release (2 hours)

- Run `npm run check`, `npm test`, Playwright marketing and a11y suites (`tests/a11y`, `tests/mobile`), Lighthouse CI with the updated URL list. Targets: accessibility 100 on all marketing routes; performance not lower than the current build.
- Contrast check every text colour against its surface with the Section 3 values; fix any eyebrow or button that fails AA.
- Manual pass at 390, 768, 1024 and 1366 px: no horizontal scroll, logo clear space respected, no gradient, no serif, no orange.
- Copy pass: `LC_ALL=C grep -rnP "\xE2\x80\x94|\xC2\xA7|EDMECA|Digital Academy|white-label|Unlimited|Register Free|No credit card" client/src` (the first two patterns are the UTF-8 bytes of the em dash and the section symbol) returns nothing outside the legal line.
- Update `docs/WEBSITE_REFRESH_CONTEXT.md` with the change log, screenshots and the preview URL; open a pull request to `main` with the checklist; Raymond reviews the preview and approves.
- After approval and merge: verify production at edmeca.co.za, then Raymond runs his standing final review pass (the Fable review) of the live site against Sections 2.3 and 7 of this plan, and its findings are logged in the context file for a follow-up pass.

---

## 7. Guardrails for Claude Code

- Write EdMeCa in running text, never EDMECA, Edmeca or "EdMeCa Digital Academy". The legal line is "Edmeca (Pty) Ltd, trading as EdMeCa". The portal is the AI Business Studio. The learning platform name "EdMeCa Online Academy" is retired from all surfaces.
- No em dashes and no section symbols anywhere in copy, comments or commit messages. Use a comma, a colon, or "to" for ranges.
- Present evidence by programme type (for example an enterprise and supplier development cohort, an entrepreneur bootcamp run with an accelerator), never by client name. Client and partner names appear only on the "Who we have worked with" logo wall, as text tiles until a logo is cleared (decision 4.3).
- Do not invent testimonials, numbers, client names, logos, team members or outcomes. If a figure is needed and not supplied, leave a clearly marked placeholder in the context file and a neutral sentence on the page.
- Do not mention the Future Tech University, revenue multiples, "10X", "first in the world", or that customers "switch from generic providers".
- Use "AI and digital", "practical digital tools", "future tech leaders", "research-backed". Do not use "AI and technology" or "AI tools" for the toolkit.
- Keep the three beneficiary groups in the order young people, entrepreneurs, leaders wherever they are listed.
- The co-founders appear by role only. No personal names, portraits with names, or personal email addresses anywhere on the site; contact routes to info@edmeca.co.za. The social handle is @Edmeca Pty Ltd.
- Marketing pages and shared chrome only. Do not change portal tools, auth, diagnostics logic, API handlers, database or environment configuration, except the string and asset changes named in Phases 2 and 3 and the contact form field change named in Phase 8.
- One phase per commit; every commit updates `docs/WEBSITE_REFRESH_CONTEXT.md`; every phase ends with a Vercel preview link in the context file; nothing merges to `main` without Raymond's approval of the preview.
- Load the design system from `brand/README.md` and `brand/colors_and_type.css` at the start of every session; where the brand book and this plan disagree, the brand book wins on visuals and the BMC v2 wins on content.

---

## 8. Effort and sequence

| Phase | Depends on | Effort |
| --- | --- | --- |
| 0 Setup | Plan confirmed, prerequisites 1 and 2 | 0.5 h |
| 1 Tokens and type | Phase 0 | 2 h |
| 2 Brand assets | Phase 0 | 1 h |
| 3 Chrome and naming | Phases 1, 2 | 2 h |
| 4 Home | Phase 3 | 3 h |
| 5 Solutions and Studio | Phase 3 | 3 h |
| 6 Engagement | Phase 3 | 2 h |
| 7 About | Phase 3 | 2 h |
| 8 Diagnostic, Contact, Login, Signup | Phase 3 | 2 h |
| 9 Legal | Phase 3 | 0.5 h |
| 10 QA and release | All | 2 h |

About 20 hours of Claude Code time across six to eight sessions. Phases 0 to 3 can run as one block as soon as the brand files are in the repo; Phases 4 to 9 follow once the BMC v2 text is in `docs/`.

---

## 9. Kick-off prompts for Claude Code

The branch `strategy-updates` already holds `CLAUDE.md`, `brand/`, this plan at `docs/WEBSITE_REFRESH_PLAN_2026-10.md` and `docs/STRATEGY_POSITIONS_2026-10.md`. Open the repo in Claude Code, check out `strategy-updates`, and use the prompts in order.

Prompt A (Phases 0 to 3):

"Read CLAUDE.md, docs/WEBSITE_REFRESH_PLAN_2026-10.md, docs/STRATEGY_POSITIONS_2026-10.md and brand/README.md before doing anything. We are on branch strategy-updates. Do Phases 0, 1, 2 and 3 of the plan, in order, one commit per phase. Phase 0: confirm npm ci, npm run check, npm test and npm run build pass, update the repo README as the plan says, and create docs/WEBSITE_REFRESH_CONTEXT.md from the plan's Section 4 answers and phase list. Phase 1: tokens and type per Section 3 and the Phase 1 task list. Phase 2: brand assets from brand/assets. Phase 3: header, footer, title and meta, and the naming changes, leaving Privacy and Terms for Phase 9. Follow Section 7 guardrails exactly: marketing pages and shared chrome only; no em dashes or section symbols; EdMeCa and AI Business Studio naming. After each phase update the context file, push, and give me the Vercel preview URL and screenshots of the seven marketing routes at 1366 px and 390 px. Stop after Phase 3 and wait for my review."

Prompt B (Phases 4 to 9, after Raymond approves the Phase 3 preview):

"Continue on branch strategy-updates from the state recorded in docs/WEBSITE_REFRESH_CONTEXT.md. Do Phases 4 to 9 of docs/WEBSITE_REFRESH_PLAN_2026-10.md in order, one commit per phase. Copy comes from docs/STRATEGY_POSITIONS_2026-10.md and the wording given in the plan; where the plan says copy is to be approved in the context file first, write the draft into the context file, push, and stop for my approval before coding that page. The evidence section carries the four claims only, with no figures and no case tiles. The Our Values wording and the three co-founder narratives are used exactly as written in the plan. Push after each phase with the preview URL and screenshots. Stop after Phase 9."

Prompt C (Phase 10, after Raymond approves the Phase 9 preview):

"Run Phase 10 of docs/WEBSITE_REFRESH_PLAN_2026-10.md on branch strategy-updates: all checks, the contrast pass, the manual responsive pass and the copy grep. Fix what fails, update the context file with the change log and screenshots, and open a pull request from strategy-updates to main with the Phase 10 checklist in the description. Do not merge."

---

## 10. Related items noted during the review (outside the page work)

- The design system README still carries the April "Who they serve" list, the three programme pillars and the old Mechanics note on em dashes; the later sections supersede them. A tidy of the README would stop Claude Code reading two versions.
- The design system's Banner and One-Pager pages, the Business Profile pptx and the brand guide PDF still carry the old lockup.
- The `.lighthouserc.json` URL list and the Playwright marketing tests reference `/frameworks`; both change with the rename to `/studio` (decision 4.7); update them in Phase 5.
- The repo README still describes the site as "EDMECA Digital Academy" and lists a staging branch that no longer exists on origin (handled in Phase 0).
- The design system README lists the social handle as @EdMecaGlobal and its clients and partners line omits the University of the Western Cape and Serosoft (Academia); both are corrected in the design system as part of prerequisite 1.

---

## 11. Revision log

| Date | Change |
| --- | --- |
| 31 Oct 2026 | First issue after the site review, repo inspection and design system and BMC v2 read. |
| 3 Nov 2026 (v1.2) | Branch named `strategy-updates` and pre-populated with CLAUDE.md, brand/ and the two docs files. Evidence figures deferred: Phase 4 shows the four claims only, no case tiles. Three Claude Code prompts written (Section 9). |
| 3 Nov 2026 (v1.1) | All ten clarifications answered by Raymond and recorded in Section 4: testimonials removed; free sign-up removed; text-tile placeholders for the wall; role narratives approved with the D-mark; values set (Empowerment, Collaboration, Impact); no prices and labels removed; Frameworks renamed AI Business Studio at /studio; contrast rule adopted; dark mode left alone; legal wording change without legal review. Phase gates replaced by phase order. |
| 3 Nov 2026 (v1.0) | Independent review pass applied: Phase gating aligned (Phases 0 to 3 on go-ahead, 4 to 9 after clarifications); Privacy and Terms moved wholly to Phase 9; "Impact" defined as a home page anchor; the one server change (contact form fields) named as the scope exception; JetBrains Mono kept for the portal; terminology standardised (SMEs, QCTO-aligned, discovery call, Title Case tagline); Youthpreneur shown as "in development" until confirmed; grep checks made locale-safe. |
| 3 Nov 2026 | Social handle changed to @Edmeca Pty Ltd. Evidence presented by programme type, never by client name. "Partners" renamed "Who we have worked with" with University of the Western Cape and Serosoft (Academia) added. Co-founders presented by role with a draft narrative each; names, portraits with names and personal emails removed. Values sourced from the "Strategy on a page" section of the BMC v2. Marked final for hand-off. |
