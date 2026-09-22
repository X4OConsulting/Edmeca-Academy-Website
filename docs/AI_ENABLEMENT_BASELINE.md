# Edmeca AI Enablement Baseline

Public self-assessment at `/ai-map` that places a respondent on the AI Enablement Map: **AI Capability** (vertical) against **Leadership and Organisational Readiness** (horizontal), four quadrants (Starters, Pathseekers, Transformers, AI-Fuelled). Eight dimensions, 24 statements, an anchored five-point scale, and a dot that moves live as the respondent answers. Businesses and individuals use the same instrument with mode-specific phrasing.

The Execution Gap diagnostic stays live at `/execution-gap`. The `/diagnostic` page asks visitors whether they are answering as an individual or as an entrepreneur and routes them to the AI Map or the Execution Gap respectively. The header "Diagnostic" link now points at `/diagnostic`.

## Routes and parameters

| URL | Effect |
| --- | --- |
| `/diagnostic` | Chooser: individual to `/ai-map?for=individual`, entrepreneur to `/execution-gap` |
| `/ai-map` | Landing, then "Who are you answering for?" (business or myself) |
| `/ai-map?for=individual` or `?for=business` | Skips the mode card |
| `/ai-map?cohort=PP2026` | Captures the cohort code silently and shows a badge. Known codes are named in `cohortNames` in `client/src/data/aiMap.ts` |
| `/ai-map?rt=<respondentId>` | Re-test link (in every report email). Loads the baseline, pre-selects mode and profile, records `wave = post`, shows movement |
| `/ai-map?rt=<id>&wave=mid` | Mid-programme pulse: statements 1, 4, 10, 13, 16, 19, 22 and 24. Unasked dimensions carry their baseline score |

## Scoring (client/src/lib/aiMap.ts, mirrored by the function)

- Dimension score: mean of its three items, 0 to 4, shown as 0 to 100.
- Axis score: mean of its four dimension scores, rounded.
- Quadrant: capability and readiness against 50. Both at or above 50 is AI-Fuelled; capability only is Pathseekers; readiness only is Transformers; otherwise Starters.
- On the line: either axis within 6 points of 50.
- Enablement index: round of the mean of the two axes. Balance: readiness minus capability, shown in words.
- Priorities: the two lowest dimensions, where a dimension on an axis below 50 gets a 12.5-point head start (half a scale step). Ties break in code order.
- Movement: current minus previous on both axes, the index, and every dimension.

`tests/unit/aiMap.test.ts` covers every boundary; `tests/unit/aiMapFunction.test.ts` covers the function.

## Data flow

```
Browser (/ai-map)
   POST /api/ai-map { action: "retest", retestOf | email }        on load with ?rt=  (returns the baseline)
   POST /api/ai-map { action: "baseline", ... }                   on "Show my position"
   POST /api/ai-map { action: "unlock", ... }                     on "Send my report"
        |
netlify/functions/ai-map.ts
   validates; recomputes scores (never trusts client scores); honeypot "website" -> 200 and nothing stored
   unlock: template report -> DeepSeek elaboration (falls back to the template) -> forward
   re-test: looks up the prior row by respondentId, or by email at unlock, and returns movement
        |
Google Apps Script web app (docs/EXECUTION_GAP_APPS_SCRIPT.gs, v4.0)   payload carries instrument: "ai-map"
   baseline: new row at row 2 with status "placed" (same respondentId overwrites its row)
   unlock:   fills the contact columns, status "report_sent", emails the report and the lead notification
   lookup:   returns the most recent matching row
        |
Google Sheet "Edmeca Execution Gap Responses", tab "AI Map" (created automatically on first write)
```

### Sheet columns (61)

```
timestamp | respondentId | status | wave | retestOf | cohort | mode | quadrant | onTheLine | capability | readiness | index | balance |
c1 | c2 | c3 | c4 | r1 | r2 | r3 | r4 |
q1 .. q24 |
priority1 | priority2 | route | sizeOrRole | sector | programmeStatus | context |
name | email | organisation | wantsCall | reportSource | reportText | unlockedAt | userAgent | referrer
```

The plan listed 63 columns; the actual list is 61 including the `status` column added for the resend diagnostics.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `AI_MAP_SCRIPT_URL` | No | Falls back to `EXECUTION_GAP_SCRIPT_URL`, the same web app |
| `AI_MAP_SHARED_SECRET` | No | Falls back to `EXECUTION_GAP_SHARED_SECRET` |
| `DEEPSEEK_API_KEY` | No | Without it every report is the template. Shared with the Execution Gap |
| `DEEPSEEK_MODEL`, `DEEPSEEK_TIMEOUT_MS` | No | As for the Execution Gap |

The plan named the Anthropic SDK for the report. The site's live report pipeline runs on DeepSeek with the key already in Netlify, so the AI Map uses the same call and the plan's section 8 prompt, with the template report as the factual anchor the model may not alter.

## One-time setup (Raymond, about five minutes)

1. Open the response sheet, **Extensions > Apps Script**, replace the editor contents with `docs/EXECUTION_GAP_APPS_SCRIPT.gs` (v4.0) and save. The `SHARED_SECRET` script property is unchanged.
2. **Deploy > Manage deployments > edit > New version**. The existing `/exec` URL keeps working, so Netlify needs no new variables.
3. Run `checkSetup()` once: it reports both tabs. The "AI Map" tab is created on the first submission.
4. Branch deploy: `feature/ai-enablement-baseline`. Test both modes end to end, then open the re-test link from the email and change a few answers to see movement.

## Test plan status

Automated: unit tests for every scoring rule, function validation, tamper tests (impossible values, forged quadrant, unlock without contact, honeypot), payload contract with the Apps Script, re-test movement, `npm run check`, `npm run build`.

Manual, on the branch deploy: row at row 2 with status `placed`; unlock updates it to `report_sent`; email arrives with logo, map table, eight dimensions, report and re-test link; notification to Raymond; cohort badge from `?cohort=`; Map Card download includes the logo; mobile square expands and collapses; keyboard 1 to 5 and arrows; reduced-motion path.

## Phase 2 (not built)

Cohort report endpoint and one-page impact report; public benchmark at 100 responses; team mode; PDF; Smartsheet mirror; partner dashboard.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-15 | v1.0 built on `feature/ai-enablement-baseline`: `/ai-map` page, `/diagnostic` chooser, Netlify function, Apps Script v4.0 with the "AI Map" tab in the existing sheet, tests and this note. Quadrant names kept from the reference picture pending a decision on Edmeca-owned names. |
| 2026-09-22 | Programme, cohort, curriculum-session and engagement-tier references removed from both surveys, the chooser, the emails and the report prompt. The surveys are stand-alone assessments for external parties; Edmeca interventions are designed around the result once an engagement starts. Curriculum session references became named interventions per dimension; the in-programme route note became a general engagement note; the "Programme status" profile question is now labelled "Development support" (same options, same sheet column). Apps Script 4.1 (wording only; 4.0 keeps working). |
