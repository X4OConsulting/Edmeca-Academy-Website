/**
 * Delivery side of the Execution Gap diagnostic: scoring, the report, the
 * DeepSeek elaboration and the Apps Script call, shared by execution-gap.ts
 * (validation, synchronous answer to the browser) and
 * execution-gap-unlock-background.ts (report writing and emailing, with
 * minutes rather than Netlify's 26 s synchronous limit).
 */
import { archetypes, capabilities, multiplierOptions } from "../../../client/src/data/executionGap";

const stages = ["F", "E", "V"] as const;
const ids = [1, 2, 3, 4, 5, 6] as const;

// DeepSeek is OpenAI-compatible, same shape as the Groq call in chat.ts.
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
// Same patterns as netlify/functions/chat.ts: respondent free text reaches the prompt.
const INJECTION = [/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, /forget\s+(everything|all|prior|previous)/gi, /disregard\s+(all\s+)?instructions?/gi, /you\s+are\s+now\s+[a-z]/gi, /new\s+instructions?:/gi, /system\s+prompt:/gi, /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi];
const clean = (value: string) => INJECTION.reduce((text, pattern) => text.replace(pattern, "[removed]"), value).slice(0, 200);

export type Cells = Record<string, Record<string, unknown>>;

export type UnlockJob = {
  respondentId: string;
  cells: Cells;
  stage: string;
  stageBand: string;
  aiMultiplier: number;
  sector: string;
  programmeStatus: string;
  name: string;
  email: string;
  business: string;
  wantsCall: boolean;
};

export type Computed = ReturnType<typeof compute>;

export function compute(cells: Cells) {
  const totals = { F: 0, E: 0, V: 0 }; const stalls: string[] = []; const stallLabels: string[] = []; const depths: { id: number; depth: number }[] = [];
  ids.forEach((id) => { const cell = cells[String(id)] || {}; stages.forEach((stage) => { totals[stage] += Number(cell[stage]) || 0; }); const f = Number(cell.F) || 0; const e = Number(cell.E) || 0; const v = Number(cell.V) || 0; const stall = f < 2 ? "F" : e < 2 ? "E" : v < 2 ? "V" : "C"; stalls.push(stall); stallLabels.push(stall === "F" ? (f === 0 ? "No framework yet" : "Framework in progress") : stall === "E" ? "Known, not yet run" : stall === "V" ? "Done, not yet proven" : "Closed loop"); depths.push({ id, depth: 2 - Math.min(f, e, v) + (stall === "E" ? 0.25 : stall === "V" ? 0.15 : 0) }); });
  const total = totals.F + totals.E + totals.V; const archetype = total <= 9 ? "The Starter" : totals.F >= 10 && totals.E >= 10 && totals.V >= 10 ? "The Closed Loop" : totals.F - totals.E >= 3 ? "The Planner" : totals.E - totals.F >= 3 ? "The Instinctive Operator" : totals.E >= 8 && totals.E - totals.V >= 3 ? "The Unproven Builder" : "The Balanced Builder";
  // Same ranking as scoreExecutionGap() in client/src/lib/executionGap.ts, so the
  // sheet records the two capabilities the respondent was actually shown.
  const widestGaps = [...depths].sort((a, b) => b.depth - a.depth || a.id - b.id).slice(0, 2).map(({ id }) => id);
  // frameworkTotal/executionTotal/evidenceTotal are the names the Apps Script reads
  // (HEADERS in docs/EXECUTION_GAP_APPS_SCRIPT.gs); F/E/V are kept for the API response.
  return { ...totals, frameworkTotal: totals.F, executionTotal: totals.E, evidenceTotal: totals.V, loopScore: Math.round((total / 36) * 100), executionGap: totals.F - totals.E, evidenceGap: totals.E - totals.V, stalls, stallLabels, widestGaps, archetype };
}

/**
 * The report body emailed to the respondent. Mirrors what they saw on screen:
 * same archetype, Gap Ledger, two widest gaps and close actions, so the email
 * is a record of their map rather than a generic note. Plain text: the Apps
 * Script renders it in a white-space:pre-line block and reuses it as the
 * plain-text alternative.
 */
export function buildReport(body: { stageBand?: string; aiMultiplier?: number }, result: Computed) {
  const band = body.stageBand === "trading" ? "trading" : "pre";
  const headline = Object.values(archetypes).find((a) => a.name === result.archetype)?.headline ?? "";
  const gap = (id: number, index: number) => {
    const capability = capabilities.find((c) => c.id === id);
    if (!capability) return "";
    const stall = result.stalls[id - 1];
    const close = capability.closes[stall === "E" ? "E" : stall === "V" ? "V" : "F"][band];
    return `${index}. ${capability.name} — ${result.stallLabels[id - 1]}\n   Do this: ${close}\n   Edmeca intervention: ${capability.intervention}`;
  };
  const widest = result.widestGaps.map((id, i) => gap(id, i + 1)).filter(Boolean);
  const level = Number(body.aiMultiplier) || 0;
  const aiNote = level <= 2
    ? "AI is not yet working for you. Closing your gaps gets faster once it is."
    : level === 3
      ? "AI is helping with tasks. The next step is putting it behind your frameworks."
      : "AI is already a multiplier. Point it at your widest gap first.";
  const firstClose = widest[0]?.split("Do this: ")[1]?.split("\n")[0] ?? "";
  const secondClose = widest[1]?.split("Do this: ")[1]?.split("\n")[0] ?? "";
  return [
    result.archetype,
    "",
    headline,
    "",
    "GAP LEDGER",
    `Framework   ${result.frameworkTotal} / 12`,
    `Execution   ${result.executionTotal} / 12`,
    `Evidence    ${result.evidenceTotal} / 12`,
    `Loop score  ${result.loopScore} / 100`,
    "",
    `Execution gap ${result.executionGap} — how far your execution trails your frameworks.`,
    `Evidence gap ${result.evidenceGap} — how far your evidence trails your execution.`,
    "",
    "YOUR TWO WIDEST GAPS",
    "",
    ...widest.flatMap((entry) => [entry, ""]),
    "YOUR NEXT 30 DAYS",
    `Days 1-14:  ${firstClose}`,
    `Days 15-30: ${secondClose}`,
    "",
    `AI MULTIPLIER — LEVEL ${level}`,
    multiplierOptions[level - 1] ?? "",
    aiNote,
  ].join("\n");
}

/**
 * Expands the deterministic report into fuller prose with DeepSeek.
 *
 * The template report is the source of truth: it already carries every score,
 * gap and recommended action. The model may only rephrase and expand; the
 * prompt forbids inventing or altering figures, because a report that
 * contradicts the map the respondent just completed is worse than a terse one.
 *
 * Never throws. Any failure (no key, timeout, bad response, empty or cut-off
 * content) returns the template unchanged, so the respondent always gets a report.
 */
export async function elaborate(template: string, body: { business?: string; sector?: string }, timeoutMs: number): Promise<{ text: string; source: string }> {
  const key = process.env.EDMECA_DEEPSEEK_API || process.env.DEEPSEEK_API_KEY;
  if (!key) return { text: template, source: "template" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const business = body.business ? clean(body.business) : "";
    const sector = body.sector ? clean(body.sector) : "";
    const upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.4,
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: [
              "You write Execution Gap reports for EdMeCa, a South African entrepreneurship academy.",
              "You will be given a completed diagnostic report. Expand it into a warmer, fuller report the founder can act on.",
              "RULES, all absolute:",
              "1. Never invent, change, remove or add any number, score, total, gap figure or percentage. Reproduce every figure exactly as given.",
              "2. Never invent capability names, recommended actions or intervention names. Use only those supplied.",
              "3. Keep every section and keep them in the same order, under the same headings.",
              "4. Expand the commentary around the facts: explain what each figure means for the business and why the recommended action matters.",
              "5. South African English. Plain text only — no markdown, asterisks or bullet characters.",
              "6. Address the founder directly as 'you'. Warm, direct, practical. No filler or congratulation.",
              "7. Roughly 450-700 words.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              business ? `Business: ${business}` : "",
              sector ? `Sector: ${sector}` : "",
              "",
              "Report to expand:",
              "",
              template,
            ].filter(Boolean).join("\n"),
          },
        ],
      }),
    });
    if (!upstream.ok) throw new Error(`DeepSeek ${upstream.status}`);
    const payload = await upstream.json() as { choices?: { finish_reason?: string; message?: { content?: string } }[] };
    const choice = payload.choices?.[0];
    const text = choice?.message?.content?.trim();
    // A suspiciously short answer means the model refused or drifted, and a
    // cut-off one ends mid-sentence; the template is more useful than either.
    if (!text || text.length < template.length / 2 || choice?.finish_reason === "length") throw new Error(`DeepSeek returned no usable report (finish ${choice?.finish_reason ?? "?"}, ${text?.length ?? 0} chars)`);
    return { text, source: `deepseek:${DEEPSEEK_MODEL}` };
  } catch (error) {
    console.error("DeepSeek elaboration failed, sending template report", error instanceof Error ? error.message : "unknown error");
    return { text: template, source: "template" };
  } finally {
    clearTimeout(timer);
  }
}

export function scriptTarget() {
  return { url: process.env.EXECUTION_GAP_SCRIPT_URL, secret: process.env.EXECUTION_GAP_SHARED_SECRET };
}

/**
 * Forwards to the Apps Script. Apps Script returns HTTP 200 even when doPost()
 * catches an error; the real status is in the JSON body. Without this check a
 * failed sheet write (missing "Responses" tab, wrong secret) is reported to the
 * browser as success.
 */
export async function forward(body: Record<string, unknown>, result: Computed, reportText = "", reportSource = "", timeoutMs = 22000) {
  const { url, secret } = scriptTarget();
  if (!url || !secret) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let upstream: Response;
  try {
    upstream = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, ...body, result, reportText, ...(reportSource ? { reportSource } : {}) }), signal: controller.signal });
  } catch (error) {
    throw new Error(error instanceof Error && error.name === "AbortError" ? `Sheet delivery timed out after ${timeoutMs} ms` : "Sheet delivery failed");
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) throw new Error("Sheet delivery failed");
  const payload = await upstream.json().catch(() => null) as { ok?: boolean; error?: string } | null;
  if (!payload || payload.ok !== true) throw new Error(`Sheet delivery failed: ${payload?.error ?? "unrecognised response"}`);
}

/** The sheet write for "Resolve my map": the validated submission plus its scores. */
export type MapJob = { respondentId: string; cells: Cells; stage: string; stageBand: string; aiMultiplier: number; sector: string; programmeStatus: string };
export type BackgroundJob = ({ kind: "unlock" } & UnlockJob) | ({ kind: "map" } & MapJob);

export async function deliverMap(job: MapJob, timeoutMs = 60000): Promise<void> {
  const { kind: _kind, ...row } = job as MapJob & { kind?: string };
  await forward({ action: "map", ...row }, compute(job.cells), "", "", timeoutMs);
}

/** The whole unlock: score, write the report, forward once (the script emails). Throws when the sheet refuses. */
export async function deliverUnlock(job: UnlockJob, timeouts = { script: 60000, model: 60000 }): Promise<{ result: Computed; reportSource: string }> {
  const { kind: _kind, ...row } = job as UnlockJob & { kind?: string };
  const result = compute(job.cells);
  const report = await elaborate(buildReport(job, result), job, timeouts.model);
  await forward({ action: "unlock", ...row }, result, report.text, report.source, timeouts.script);
  return { result, reportSource: report.source };
}
