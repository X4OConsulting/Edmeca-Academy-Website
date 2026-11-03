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
- [ ] Phase 1: tokens and type
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

## Change log

| Date | Phase | Commit | Change |
| --- | --- | --- | --- |
| 3 Nov 2026 | 0 | see git log | Baseline on `strategy-updates`: `npm ci`, `npm run check`, `npm test` (24 files, 297 tests) and `npm run build` pass. README renamed to EdMeCa and given the review-surface note. This file created. Baseline screenshots in `docs/refresh-screenshots/phase-0/`. |
