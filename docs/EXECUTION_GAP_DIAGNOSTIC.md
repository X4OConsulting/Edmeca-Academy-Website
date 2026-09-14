# Edmeca Execution Gap Diagnostic

The v2 diagnostic maps the gap between a founder's Framework, Execution and Evidence across six capabilities. It is intentionally not a maturity ladder or generic AI survey.

## Response sheet

Canonical Google Sheet: [Edmeca Execution Gap Responses](https://docs.google.com/spreadsheets/d/1E4o-RUkF_keY4t3-oVwC9PM4H4F0I_nxtrc5lZl8bJA/edit?gid=0#gid=0)

Spreadsheet ID: `1E4o-RUkF_keY4t3-oVwC9PM4H4F0I_nxtrc5lZl8bJA`

The browser must never call the Sheet directly. The eventual Netlify function will use `EXECUTION_GAP_SCRIPT_URL` and `EXECUTION_GAP_SHARED_SECRET` server-side to forward validated maps and unlocked reports to the Apps Script web app bound to this sheet.

## Planned route

`/execution-gap`

The diagnostic uses a map-and-guide interface, a stage-tuned question set, three-point answers (No, Partly, Yes), archetypes, stall markers, a Gap Ledger, a 30-day action plan and an optional report unlock.

## Setup still required

1. Create or verify the `Responses` tab and the v2 columns from the build plan.
2. Deploy the Apps Script as a web app and add its URL as `EXECUTION_GAP_SCRIPT_URL` in Netlify.
3. Add the matching `EXECUTION_GAP_SHARED_SECRET` and `ANTHROPIC_API_KEY` to Netlify.

## Email setup walkthrough

1. Open the linked Google Sheet and create or select the `Responses` tab.
2. Open **Extensions > Apps Script**, replace the editor contents with [`EXECUTION_GAP_APPS_SCRIPT.gs`](EXECUTION_GAP_APPS_SCRIPT.gs), and save.
3. In **Project Settings > Script properties**, add `SHARED_SECRET`. Generate a value locally with `openssl rand -hex 32`; do not paste it into the repository.
4. Deploy **New deployment > Web app**, execute as yourself, and allow access to anyone. Copy the `/exec` URL into Netlify as `EXECUTION_GAP_SCRIPT_URL`.
5. Add the exact same secret to Netlify as `EXECUTION_GAP_SHARED_SECRET`. Add `ANTHROPIC_API_KEY` there as well.
6. Deploy the site and test `/execution-gap` on the deployed URL. A local Vite server will return 404 for `/api/execution-gap`; use `netlify dev` for local function testing.

Never put `EXECUTION_GAP_SHARED_SECRET` or `ANTHROPIC_API_KEY` in a `VITE_` variable or client-side code.
## Report elaboration (DeepSeek)

The emailed report is built in two stages.

1. `buildReport()` composes a deterministic report from the respondent's own
   map: archetype and headline, Gap Ledger, the two widest gaps with the
   stage-banded close action and Edmeca tool/session for each, a 30-day plan,
   and the AI multiplier note. This always succeeds.
2. `elaborate()` sends that report to DeepSeek to expand into fuller prose.

The template is the source of truth. The system prompt forbids inventing,
changing or removing any figure, capability name or recommended action — a
report that contradicts the map the respondent just completed is worse than a
terse one. Respondent free text is stripped of prompt-injection patterns before
it reaches the model, using the same list as `netlify/functions/chat.ts`.

Stage 2 never throws. Missing key, timeout, HTTP error, or a suspiciously short
answer all fall back to the template, and the `reportSource` column records
which was used (`template` or `deepseek:<model>`).

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | No | — | Without it every report is the template |
| `DEEPSEEK_MODEL` | No | `deepseek-flash` | Or `deepseek-v4-pro` |
| `DEEPSEEK_TIMEOUT_MS` | No | `15000` | Netlify allows 60s; the Apps Script forward takes 2.4-7.4s |

Never expose these as `VITE_` variables — they are server-side only.
