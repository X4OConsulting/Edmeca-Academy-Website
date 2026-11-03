# Website refresh: running context

Running context for the EdMeCa website refresh. Read with `CLAUDE.md`, `docs/WEBSITE_REFRESH_PLAN_2026-10.md` (the plan), `docs/STRATEGY_POSITIONS_2026-10.md` (copy source of truth) and `brand/README.md` (brand source of truth). Updated at the end of every session.

- Branch: `strategy-updates` (from `main`). Never merged to `main` without Raymond's approval of the preview.
- Branch preview (always the latest push): https://edmeca-academy-website-git-strate-aef9d5-raymond-3084s-projects.vercel.app
- Per-commit previews (Vercel project `edmeca-academy-website`):
  - Phase 0: https://edmeca-academy-website-5tcuw97vf-raymond-3084s-projects.vercel.app
  - Phase 1: https://edmeca-academy-website-nync3jaur-raymond-3084s-projects.vercel.app
  - Phase 2: https://edmeca-academy-website-e2tlnw9c4-raymond-3084s-projects.vercel.app
  - Phase 2 (revised, squared lockup): https://edmeca-academy-website-ocyn4459u-raymond-3084s-projects.vercel.app
  - Phase 3: https://edmeca-academy-website-nosvj5g69-raymond-3084s-projects.vercel.app
- Phase 3 contact sheet of all fourteen screenshots: `docs/refresh-screenshots/phase-3/contact-sheet.jpg`.
- Seven marketing routes used for screenshots and Lighthouse CI: `/`, `/about`, `/solutions`, `/contact`, `/studio` (was `/frameworks` until Phase 5), `/engagement`, `/login`.
- Screenshots: `docs/refresh-screenshots/phase-N/`, one full-page JPEG per route at 1366 px and 390 px, taken from `npm run build` plus `vite preview` of the phase commit.

## Settled clarifications (plan Section 4, answered by Raymond on 3 November 2026)

1. Evidence block: the three home page testimonials are not real quotes and are removed, with the "hundreds of entrepreneurs" line. The evidence section carries the four claims only; programme-type case tiles wait for Raymond's figures.
2. Free sign-up: remove "Free to start", "No credit card required", "Register Free", "Get Started Free" and the public `/signup` route; `/signup` redirects to `/contact` with "Apply for access". The free diagnostics remain the public entry point.
3. "Who we have worked with": text tiles for all ten organisations (Attacq, Green Seeds, Property Point, Growthpoint, EM Lyon, Stellenbosch Business School, Social Enterprise Academy, Nedbank, University of the Western Cape, Serosoft (Academia)); logos swapped in as permissions arrive.
4. Co-founder roles: the three Phase 7 narratives are final; cards carry the D-mark, no portraits, no names, no personal email addresses.
5. Values, heading "Our Values", exact wording:
   - Empowerment: We uplift and enable youth, entrepreneurs and business leaders to reach their full potential.
   - Collaboration: We build an ecosystem where people, ideas and opportunities connect.
   - Impact: We measure our success by the positive, lasting change we create in society.
   The design principles stay internal.
6. Engagement pricing: no prices; a proposal within five working days of a discovery call; "Most Popular", "Unlimited platform usage", "Email support" and "White-label options" removed.
7. Frameworks page: renamed AI Business Studio at `/studio`, with `/frameworks` redirecting to it.
8. Contrast: primary buttons green fill with ink-10 text; secondary buttons blue outline; eyebrows brand blue on light surfaces, green on dark surfaces.
9. Dark mode: the `.dark` block is untouched in this plan (portal only).
10. Legal pages: renaming to EdMeCa and AI Business Studio in Privacy and Terms proceeds in Phase 9 without legal review.

Non-gating, still open (answer any time):

- LinkedIn page URL to pair with @Edmeca Pty Ltd in the footer.
- Whether the "Powered by X4O" credit stays (kept until answered).
- Whether to add a short Research offering page.
- Whether Youthpreneur is public (shown as "in development" until answered).

## Phase checklist

- [x] Phase 0: setup (README, this file, baseline checks)
- [x] Phase 1: tokens and type
- [x] Phase 2: brand assets
- [x] Phase 3: global chrome and naming
- [x] Stop for Raymond's review of the Phase 3 preview (go-ahead for Phase 4 given 3 November 2026)
- [x] Phase 4: home page (copy approved 3 November 2026)
- [x] Phase 5: Solutions and AI Business Studio
- [ ] Phase 6: Engagement
- [ ] Phase 7: About
- [ ] Phase 8: Diagnostic, Contact, Login, Signup
- [ ] Phase 9: legal pages
- [ ] Phase 10: QA and release

## Phase 4 home page copy (approved by Raymond, 3 November 2026)

Status: approved as drafted and coded in Phase 4. Later addition (Raymond, 3 November 2026): First Mutual Insurance added to Who we have worked with, making eleven text tiles. The four questions were settled on the draft's defaults: the [draft] lines stand; ten separate tiles; the sample button is a mailto for now and moves to the contact form in Phase 8; the hero panel carries the D-mark.

Original note: Wording marked [plan] or [strategy] is lifted from the plan's Phase 4 or from `docs/STRATEGY_POSITIONS_2026-10.md` and is not up for rewording unless you want it changed. Wording marked [draft] is mine and needs your yes, edit or no. Questions are at the end.

Removed from the current page: the "AI-Powered Business Tools" badge and headline, "Free to start" and "No credit card required", the Who We Serve cards, the six-tool grid, the three testimonials and the "Trusted by" band, "Join hundreds of entrepreneurs and programmes", and "Register Free".

### 1. Hero (cream, split layout with a sage panel holding the D-mark; no photography)

- Eyebrow: From Framework to Execution to Evidence [plan]
- Headline: We develop people into future tech leaders. [plan]
- Lead: Proven business frameworks, delivered through AI-enabled, practical digital tools, with evidence of the shift from baseline to outcome. [plan]
- Primary button: Book a discovery call (to `/contact`) [plan]
- Secondary button: Take the free baseline (to `/diagnostic`) [plan]

### 2. Statement band (blue-deep, white text, "earning." in green)

- Headline: EdMeCa turns learning into earning. [strategy]
- Paragraph: Our research-backed, AI-enabled programmes make young people work-ready, help entrepreneurs build businesses that last, and equip leaders to grow capability across their teams. We measure what changes and share it. [strategy]

### 3. Who we develop (three cards, in this order)

- Eyebrow: Who we develop [draft]
- Heading: Three groups, one playbook. [draft]
- Card 1, Young people: Made work-ready through Youthpreneur and accredited pathways. [draft, from strategy segments] Tag: Youthpreneur, in development.
- Card 2, Entrepreneurs and SMEs: Businesses that last, with a usable output from every session. [draft, from strategy segments]
- Card 3, Leaders in corporates and ecosystems: Digital Leadership means leading, and digital: enough insight to lead where digital, AI and cyber risk shape the business. [draft, condensed from strategy "Digital Leadership"]

### 4. Who commissions our programmes (one row of five text tiles)

- Eyebrow: Who commissions our programmes [plan]
- Tiles: Corporates and skills development foundations; ESD and supplier development programme owners; Learning institutions and TVET colleges; SETAs and training authorities; Funders and foundations. [plan]
- Line under the row: Delivered under the EdMeCa brand, co-branded with your programme where that helps. [plan]

### 5. What we do (four group cards, then a link)

- Eyebrow: What we do [draft]
- Heading: Programmes, evidence, pathways and tools. [draft]
- Programmes: Digital Leader Module; AI for Leaders and the AI Catalyst Journey; AI and digital module inside an SMME cohort; Youthpreneur (in development). [strategy]
- Evidence services: Impact Reporting; Research offering. [strategy]
- Accredited pathways: Accredited skills programmes (QCTO-aligned); Staff capacitation. [strategy]
- Digital tools: AI Business Studio, offered as post-programme access. [strategy]
- Link: See the full offering (to `/solutions`) [plan]

### 6. How we work (four numbered steps, then the diagnostic card)

- Eyebrow: How we work [draft]
- Heading: Onboard, refresh, sprint, measure. [draft]
- Step 1, AI onboarding first: Participants get comfortable with AI before any framework is introduced. [draft]
- Step 2, Frameworks and a tools refresh: Proven frameworks, worked through practical digital tools. [draft]
- Step 3, Sprint to a usable output: Every session ends with something the business can use. [draft, from strategy claim]
- Step 4, Measure and report: A baseline, a mid-point and a post-programme assessment (PRE, MID, POST). [draft, from strategy]
- Diagnostic card: Where are you on the AI Enablement Map? Eight minutes, free, no account. [plan] Buttons: Place my dot (to `/ai-map`, as today); Execution Gap diagnostic (to `/execution-gap`, as today).

### 7. Evidence (section id `impact`, the target of the Impact link)

- Eyebrow: Impact [draft]
- Heading: What the evidence shows [plan]
- Four claims [strategy]:
  - A measurable maturity shift per participant.
  - Tools adopted.
  - A usable business output from every session.
  - Funder-ready evidence.
- Line under the claims: Where a client needs financial growth and job creation reported, we define the measure, the timeframe and the attribution method before the programme starts. [strategy]
- No figures and no case tiles (TODO for Raymond: figures for the enterprise and supplier development cohort and the entrepreneur bootcamp run with an accelerator).
- Sub-heading: Who we have worked with [plan]
- Ten text tiles: Attacq; Green Seeds; Property Point; Growthpoint; EM Lyon; Stellenbosch Business School; Social Enterprise Academy; Nedbank; University of the Western Cape; Serosoft (Academia). [decision 4.3]

### 8. Closing CTA (sage tint panel, flat, hairline)

- Heading: Let's talk about your programme. [plan]
- Primary button: Book a discovery call (to `/contact`) [plan]
- Secondary button: Request an impact reporting sample [plan], target to confirm (question 3).

### Questions for Raymond

1. Are the [draft] lines acceptable as written? Edit any you want changed; the rest stays as is.
2. Who we have worked with: the strategy file pairs some names ("Attacq and Green Seeds", "Property Point and Growthpoint", "EM Lyon and Stellenbosch Business School"), giving seven tiles; decision 4.3 lists ten organisations. The draft uses ten separate tiles. Confirm ten, or seven paired tiles.
3. "Request an impact reporting sample": a `mailto:info@edmeca.co.za` with the subject "Impact reporting sample" now, or `/contact` with the subject preset (the contact form only gains presets in Phase 8)? Draft: mailto now, switched to the form in Phase 8.
4. Hero sage panel: the D-mark at large scale on the sage panel, as the brand's cover slide does. Confirm, or leave the panel plain.

## Decisions after Phase 4 (Raymond, 3 November 2026)

- Who we have worked with: add First Mutual Insurance (eleven text tiles; the grid is four columns on desktop). Also added to `docs/STRATEGY_POSITIONS_2026-10.md` section 6.
- About page: remove the team section until the team members can be added. The "The Team" section with its three "Coming Soon" tiles is gone. This puts the Phase 7 co-founder role cards (decision 4.4) on hold: Phase 7 does not add a team or co-founder section until Raymond says the team can be shown.
- Engagement Options: include an executive masterclass. Added now to the current page as the first card, "AI Masterclass for Executives" (the brand book name, confirmed by Raymond on 3 November 2026), worded from the strategy file's "AI for Leaders" executive session and the Digital Leadership positioning. Phase 6 keeps it when it rewrites the page (with no price, per decision 4.6).



- Evidence figures (TODO, Raymond): the two programme-type case tiles (an enterprise and supplier development cohort; an entrepreneur bootcamp run with an accelerator) are not built until the figures are supplied. Nothing goes on the page meanwhile.
- README branch table (Phase 0, needs a decision): the plan says origin has only `main`, but on 3 November 2026 origin still has `staging`, `development` and many feature branches, and recent releases went through `staging` (PRs 22 to 27). The README was therefore not rewritten to say "only `main`"; it keeps the `staging` row and adds that Vercel previews are the review surface, with the `strategy-updates` preview named. Raymond to confirm whether `staging` should be dropped from the README.

- Phase 1, `font-serif` in the portal: the plan says replace every `font-serif` class and delete the serif alias, but five of the sixteen files are portal pages (`Admin`, `BMCTool`, `Dashboard`, `PitchBuilderTool`, `Profile`), which CLAUDE.md puts out of scope. Marketing pages, legal pages, `not-found` and `AIReadiness` were converted; the portal keeps its classes and `fontFamily.serif` stays as an alias of Inter, so nothing renders in a serif and Playfair is no longer requested. Drop the alias in the portal pass.
- Phase 1, ink-10: the plan table gives `227 13% 14%`, the brand file gives `#2A2B30` (`230 7% 18%`). The brand book wins on visuals, so `--accent-foreground` uses `#2A2B30`. It still passes AA on brand green.
- Phase 1, shared tokens: `:root` is shared with the portal, so the portal's light theme also moves from navy and orange to the brand palette. The `.dark` block and the `.diagnostic-page` overrides are untouched.
- Phase 1, Lighthouse CI was not run locally (no `lhci` in the project dependencies); it runs in Phase 10. The diagnostic routes (`/ai-map`, `/ai-readiness`, `/execution-gap`) keep their own colours; only the serif class changed in `AIReadiness.tsx`.
- Phase 2, which lockup (settled by Raymond, 3 November 2026): the site uses the EdMeCa squared lockup, `brand/assets/edmeca-logo.png` (superscript 2, no Online Academy line). The first Phase 2 commit used `edmeca-logo-full.png`; a follow-up commit swapped it and regenerated the OG image.
- Phase 2, shared logo file: `attached_assets/logo.png` (the `@assets/logo.png` import) was replaced in place, so the portal and the diagnostic pages also show the new lockup. Their size classes were not changed (out of scope); the trimmed lockup at their `h-12` reads larger than the old padded file did. Worth a look in the portal pass.
- Phase 2, OG image tagline is set in Helvetica Neue (the brand body face; Inter is only its web substitute), rendered once to a PNG.
- Phase 3, anchors: `/#impact` (Phase 4) and the Solutions anchors (Phase 5) now exist. The footer links to `/solutions#programmes`, `#evidence`, `#pathways` and `#studio`. Those sections arrive in Phases 4 and 5; until then the links land at the top of the page.
- Phase 3, header layout: six nav links, "AI Business Studio" and "Book a discovery call" do not fit below 1280 px, so the full nav shows from 1024 px, the Studio link from 1280 px, and the hamburger menu (which carries both) below 1280 px. Below 640 px the bar shows the logo and the menu only; the CTA is the last item in the menu.
- Phase 3, naming beyond the named files: "EDMECA" and "EDMECA Academy" also lived in `client/src/lib/auth-errors.ts` (sign-in error messages shown on Login), `client/src/lib/exportReport.ts` and `FinancialAnalysisTool.tsx` (portal export footer and a placeholder), `FloatingChat.tsx` ("your portal"), and "Edmeca" in the browser titles of the diagnostic pages and two strings in `ExecutionGap.tsx`. These are string changes only, under the naming exception. Not changed (out of scope, for a later pass): "Edmeca" in `client/src/components/aimap/ReportPanel.tsx` ("Edmeca intervention", "Your Edmeca route") and `UnlockForm.tsx`; the emoji in the FinancialAnalysisTool support card; any naming in `server/` email templates; the "EDMECA Academy" headers in the Playwright test files.
- Phase 3, Login: the heading is now the page `h1`. The "Apply for access" link still points to `/signup`; Phase 8 routes it to `/contact`.
- "Powered by X4O" kept as a small credit until the non-gating answer says otherwise. LinkedIn URL not yet linked; the handle shows as text.

- Em dash checks before 3 November 2026 were invalid: `grep` on this machine is ugrep, which does not match the plan's `LC_ALL=C grep -P` byte pattern, so it reported nothing even where em dashes existed. Checks now use Python (`'\u2014' in text`). Re-run result: marketing pages had seven (About 3, Frameworks 2, Engagement 1, Signup 1) plus one in `ExecutionGap.tsx`; all fixed by punctuation only. Home, the shared chrome, `index.html`, the README and this file have none. Still present, out of scope: portal pages (142 in `pages/portal/`), `FloatingChat.tsx`, `ui/chart.tsx`, `use-realtime.ts`, `exportReport.ts`, `queryKeys.ts` (mostly comments), and `tests/mobile/mobile.spec.ts`. No section symbols anywhere in `client/`. No commit message on the branch has an em dash.

## Change log

| Date | Phase | Commit | Change |
| --- | --- | --- | --- |
| 3 Nov 2026 | 0 | see git log | Baseline on `strategy-updates`: `npm ci`, `npm run check`, `npm test` (24 files, 297 tests) and `npm run build` pass. README renamed to EdMeCa and given the review-surface note. This file created. Baseline screenshots in `docs/refresh-screenshots/phase-0/`. |
| 3 Nov 2026 | 1 | see git log | Tokens and type. `:root` mapped to the Section 3 table with hex comments; brand tokens, `--shadow-1` to `--shadow-3`, `--shadow-ring`, motion tokens and the `.eyebrow` / `.eyebrow-on-dark` utilities added; `.dark` untouched. Tailwind: `brand-*` and `ink-*` colours, `rounded-xl` 12 px and `rounded-2xl` 16 px, brand shadows, motion durations and easings; serif aliased to Inter. Button gains `cta` (green fill, ink-10 text) and `outline-brand` variants for Phase 3. `index.html`: Playfair removed, Inter 400 to 800, JetBrains Mono kept, theme-color `#454F7E`. Marketing pages: `font-serif` replaced, gradient washes and blur blobs removed (flat cream hero, sage CTA panels with hairline), navy bands now blue-deep with green eyebrows, Tailwind green, orange and traffic-light colours replaced with brand tokens. Copy unchanged. Network log: only Inter and JetBrains Mono requested. Screenshots in `docs/refresh-screenshots/phase-1/`. |
| 3 Nov 2026 | 2 | see git log | Brand assets. `logo.png` (public and `attached_assets`) replaced with the lockup without the Online Academy line, trimmed and sized for web; `client/public/brand/` holds the logo, the D-mark, favicon 32 px, apple-touch-icon 180 px (on cream), icon 512 px and the 1200 by 630 OG image (cream, logo, tagline). `favicon.png` is now the D-mark. `index.html` references the new icons and adds `og:image` and Twitter card tags. Header logo 32 px tall in a 64 px bar and footer logo 40 px with 20 px padding, which keeps the 50 percent clear space. BMCTool alt text now "EdMeCa". Screenshots in `docs/refresh-screenshots/phase-2/`. |
| 3 Nov 2026 | 2 (revised) | see git log | Logo and OG image regenerated from the EdMeCa squared lockup (`edmeca-logo.png`) at Raymond's instruction. |
| 3 Nov 2026 | 3 | see git log | Global chrome and naming. Header: About, What we do, Impact (`/#impact`), Engagement, Diagnostic, Contact; "AI Business Studio" to `/login` (or `/portal` when signed in); primary CTA "Book a discovery call" (green fill, ink-10 text) to `/contact`; "Get Started" removed; 8 px header blur. Footer: logo, short value statement, What we do (four offering groups), Company (About, Impact, Engagement, Contact), Studio (sign in), info@edmeca.co.za, @Edmeca Pty Ltd, Level One B-BBEE contributor, legal line "Edmeca (Pty) Ltd, trading as EdMeCa. All rights reserved.", Privacy, Terms, Powered by X4O. `index.html`: title "EdMeCa | From Framework to Execution to Evidence", description from the value statement, the plan's keywords, OG title and description. Naming: Login ("Sign in to the AI Business Studio" plus the invite line), ResetPassword, Signup, Admin and the strings listed under Open items. Tests updated for the new toast title and the mobile CTA test id. Acceptance grep returns only Privacy and Terms (Phase 9). Screenshots in `docs/refresh-screenshots/phase-3/`. |

| 3 Nov 2026 | 4 (draft) | see git log | Home page copy draft written above for approval. No code changed. |
| 3 Nov 2026 | 4 | see git log | Home page rebuilt to the approved copy in eight sections: split hero with the D-mark on a sage panel; blue-deep statement band with the long-form value statement; Who we develop (three cards, Youthpreneur tagged in development); Who commissions our programmes (five text tiles and the co-branding line); What we do (four offering group cards, link to `/solutions`); How we work (four steps and the AI Enablement Map card); Evidence at `#impact` (four claims, the measurement line, ten text tiles for Who we have worked with); sage closing CTA with Book a discovery call and a mailto for an impact reporting sample. Testimonials, the tools grid and all free sign-up lines removed. No figures and no case tiles. Em dash grep clean. Screenshots in `docs/refresh-screenshots/phase-4/`. |
| 3 Nov 2026 | 4 (follow-up) | see git log | First Mutual Insurance added to the wall; About team section removed; Executive Masterclass card added to Engagement Options; em dashes removed from the marketing pages and `ExecutionGap.tsx`; em dash check method corrected. |
| 3 Nov 2026 | 4 (fix) | see git log | Impact link fixed for arrivals from other pages: Home scrolls to the URL hash once it has rendered (before this, `/#impact` opened at the top of the page). Phase 5 needs the same for the `/solutions#...` anchors. |
| 3 Nov 2026 | 4 (follow-up) | see git log | Masterclass card renamed "AI Masterclass for Executives". |
| 3 Nov 2026 | 5 | see git log | Solutions rebuilt as the offering stack: proposition intro, group jump links, the Digital Leadership paragraph once (blue-deep band), then the nine offerings in four groups at `#programmes`, `#evidence`, `#pathways` and `#studio`, each card with eyebrow, title, one sentence, For line and a contact link with the offering preset; Youthpreneur tagged In development. `Frameworks.tsx` renamed `Studio.tsx` and rewritten as the AI Business Studio page at `/studio` (Studio description, the six portal tools as post-programme access, access panel). Redirects: `/frameworks` to `/studio`; `/solutions/entrepreneurs` and `/solutions/programmes` to `/solutions#programmes`. New `useScrollToHash` hook shared by Home and Solutions. `.lighthouserc.json` and the Playwright suites now use `/studio`. No em dashes or banned terms on either page. Screenshots in `docs/refresh-screenshots/phase-5/`. |
