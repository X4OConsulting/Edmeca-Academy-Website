# Website refresh: running context

Running context for the EdMeCa website refresh. Read with `CLAUDE.md`, `docs/WEBSITE_REFRESH_PLAN_2026-10.md` (the plan), `docs/STRATEGY_POSITIONS_2026-10.md` (copy source of truth) and `brand/README.md` (brand source of truth). Updated at the end of every session.

- Branch: `strategy-updates` (from `main`). Never merged to `main` without Raymond's approval of the preview.
- Branch preview (always the latest push): https://edmeca-academy-website-git-strategy-updates-raymond-3084s-projects.vercel.app
- Seven marketing routes used for screenshots and Lighthouse CI: `/`, `/about`, `/solutions`, `/contact`, `/frameworks`, `/engagement`, `/login`.
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
- [ ] Phase 2: brand assets
- [ ] Phase 3: global chrome and naming
- [ ] Stop for Raymond's review of the Phase 3 preview
- [ ] Phase 4: home page (copy approved here first)
- [ ] Phase 5: Solutions and AI Business Studio
- [ ] Phase 6: Engagement
- [ ] Phase 7: About
- [ ] Phase 8: Diagnostic, Contact, Login, Signup
- [ ] Phase 9: legal pages
- [ ] Phase 10: QA and release

## Open items and deviations

- Evidence figures (TODO, Raymond): the two programme-type case tiles (an enterprise and supplier development cohort; an entrepreneur bootcamp run with an accelerator) are not built until the figures are supplied. Nothing goes on the page meanwhile.
- README branch table (Phase 0, needs a decision): the plan says origin has only `main`, but on 3 November 2026 origin still has `staging`, `development` and many feature branches, and recent releases went through `staging` (PRs 22 to 27). The README was therefore not rewritten to say "only `main`"; it keeps the `staging` row and adds that Vercel previews are the review surface, with the `strategy-updates` preview named. Raymond to confirm whether `staging` should be dropped from the README.

- Phase 1, `font-serif` in the portal: the plan says replace every `font-serif` class and delete the serif alias, but five of the sixteen files are portal pages (`Admin`, `BMCTool`, `Dashboard`, `PitchBuilderTool`, `Profile`), which CLAUDE.md puts out of scope. Marketing pages, legal pages, `not-found` and `AIReadiness` were converted; the portal keeps its classes and `fontFamily.serif` stays as an alias of Inter, so nothing renders in a serif and Playfair is no longer requested. Drop the alias in the portal pass.
- Phase 1, ink-10: the plan table gives `227 13% 14%`, the brand file gives `#2A2B30` (`230 7% 18%`). The brand book wins on visuals, so `--accent-foreground` uses `#2A2B30`. It still passes AA on brand green.
- Phase 1, shared tokens: `:root` is shared with the portal, so the portal's light theme also moves from navy and orange to the brand palette. The `.dark` block and the `.diagnostic-page` overrides are untouched.
- Phase 1, Lighthouse CI was not run locally (no `lhci` in the project dependencies); it runs in Phase 10. The diagnostic routes (`/ai-map`, `/ai-readiness`, `/execution-gap`) keep their own colours; only the serif class changed in `AIReadiness.tsx`.

## Change log

| Date | Phase | Commit | Change |
| --- | --- | --- | --- |
| 3 Nov 2026 | 0 | see git log | Baseline on `strategy-updates`: `npm ci`, `npm run check`, `npm test` (24 files, 297 tests) and `npm run build` pass. README renamed to EdMeCa and given the review-surface note. This file created. Baseline screenshots in `docs/refresh-screenshots/phase-0/`. |
| 3 Nov 2026 | 1 | see git log | Tokens and type. `:root` mapped to the Section 3 table with hex comments; brand tokens, `--shadow-1` to `--shadow-3`, `--shadow-ring`, motion tokens and the `.eyebrow` / `.eyebrow-on-dark` utilities added; `.dark` untouched. Tailwind: `brand-*` and `ink-*` colours, `rounded-xl` 12 px and `rounded-2xl` 16 px, brand shadows, motion durations and easings; serif aliased to Inter. Button gains `cta` (green fill, ink-10 text) and `outline-brand` variants for Phase 3. `index.html`: Playfair removed, Inter 400 to 800, JetBrains Mono kept, theme-color `#454F7E`. Marketing pages: `font-serif` replaced, gradient washes and blur blobs removed (flat cream hero, sage CTA panels with hairline), navy bands now blue-deep with green eyebrows, Tailwind green, orange and traffic-light colours replaced with brand tokens. Copy unchanged. Network log: only Inter and JetBrains Mono requested. Screenshots in `docs/refresh-screenshots/phase-1/`. |
