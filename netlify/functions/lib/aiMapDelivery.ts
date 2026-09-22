/**
 * Delivery side of the AI Enablement Baseline: talking to the Apps Script web
 * app, writing the report with DeepSeek, and the full "unlock" job that the
 * background function runs.
 *
 * Why a separate module: a synchronous Netlify function is stopped at 26 s. One
 * Apps Script call takes 2-8 s warm and has been measured at 14-27 s cold, and
 * the model call takes 5-20 s, so report delivery cannot reliably fit in one
 * synchronous request. ai-map.ts validates and answers the browser at once;
 * ai-map-unlock-background.ts runs deliverUnlock() with minutes to spare.
 */
import { type Answers, type RespondentMode, type Wave, dimensionCodes } from "../../../client/src/data/aiMap";
import { type AIMapResult, type Movement, type PriorPosition, movementBetween, scoreAIMap } from "../../../client/src/lib/aiMap";
import { type ReportFacts, SYSTEM_PROMPT, buildTemplateReport, buildUserMessage } from "./aiMapReportPrompt";

export type Profile = { sizeOrRole?: string; sector?: string; programmeStatus?: string };
export type Prior = PriorPosition & { respondentId?: string; timestamp?: string; mode?: string; profile?: Profile; wave?: string };

export type UnlockJob = {
  respondentId: string;
  wave: Wave;
  retestOf: string;
  cohort: string;
  mode: RespondentMode;
  answers: Answers;
  profile: Profile;
  context: string;
  name: string;
  email: string;
  organisation: string;
  wantsCall: boolean;
  userAgent: string;
  referrer: string;
};

// DeepSeek is OpenAI-compatible, same shape as the Groq call in chat.ts.
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
const INJECTION = [/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, /forget\s+(everything|all|prior|previous)/gi, /disregard\s+(all\s+)?instructions?/gi, /you\s+are\s+now\s+[a-z]/gi, /new\s+instructions?:/gi, /system\s+prompt:/gi, /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi];
const clean = (value: string, max: number) => INJECTION.reduce((text, pattern) => text.replace(pattern, "[removed]"), value).slice(0, max);

export function scriptTarget() {
  return { url: process.env.AI_MAP_SCRIPT_URL || process.env.EXECUTION_GAP_SCRIPT_URL, secret: process.env.AI_MAP_SHARED_SECRET || process.env.EXECUTION_GAP_SHARED_SECRET };
}

/**
 * Forwards to the Apps Script bound to the response sheet. The same web app
 * serves the Execution Gap diagnostic; `instrument` tells it which tab to use.
 * Apps Script answers HTTP 200 even when doPost() caught an error, so the JSON
 * body is the real status.
 */
export async function forward(payload: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown>> {
  const { url, secret } = scriptTarget();
  if (!url || !secret) return { ok: true, skipped: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let upstream: Response;
  try {
    upstream = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, instrument: "ai-map", ...payload }), signal: controller.signal });
  } catch (error) {
    throw new Error(error instanceof Error && error.name === "AbortError" ? `Sheet delivery timed out after ${timeoutMs} ms` : "Sheet delivery failed");
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) throw new Error("Sheet delivery failed");
  const parsed = await upstream.json().catch(() => null) as Record<string, unknown> | null;
  if (!parsed || parsed.ok !== true) throw new Error(`Sheet delivery failed: ${(parsed?.error as string) ?? "unrecognised response"}`);
  return parsed;
}

/** Turns the Apps Script's `previous` record into the shape the scorer expects. */
export function toPrior(raw: unknown): Prior | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const capability = Number(record.capability);
  const readiness = Number(record.readiness);
  if (!Number.isFinite(capability) || !Number.isFinite(readiness)) return null;
  const dims = (record.dimensions && typeof record.dimensions === "object" ? record.dimensions : {}) as Record<string, unknown>;
  const dimensionsOut = Object.fromEntries(dimensionCodes.map((code) => {
    const value = Number(dims[code] ?? dims[code.toLowerCase()]);
    return [code, Number.isFinite(value) ? value : null];
  })) as PriorPosition["dimensions"];
  return {
    capability, readiness,
    quadrant: (record.quadrant as PriorPosition["quadrant"]) || "starters",
    dimensions: dimensionsOut,
    respondentId: typeof record.respondentId === "string" ? record.respondentId : undefined,
    timestamp: typeof record.timestamp === "string" ? record.timestamp : undefined,
    mode: typeof record.mode === "string" ? record.mode : undefined,
    wave: typeof record.wave === "string" ? record.wave : undefined,
    profile: record.profile && typeof record.profile === "object" ? record.profile as Profile : undefined,
  };
}

export async function lookup(criteria: { respondentId?: string; email?: string; exclude?: string }, timeoutMs: number): Promise<Prior | null> {
  try {
    const answer = await forward({ action: "lookup", ...criteria }, timeoutMs);
    return toPrior(answer.previous);
  } catch (error) {
    console.error("AI map lookup failed", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

type Completion = { choices?: { finish_reason?: string; message?: { content?: string; reasoning_content?: string } }[]; error?: { message?: string } };

/**
 * Expands the template report with DeepSeek. Never throws; falls back to the
 * template. Logs the shape of an unusable answer (finish reason, content and
 * reasoning lengths) so a model that spends its tokens on reasoning, or a
 * renamed model, is visible in the function log rather than a mystery.
 */
export async function writeReport(facts: ReportFacts, timeoutMs: number): Promise<{ text: string; source: string }> {
  const template = buildTemplateReport(facts);
  const key = process.env.EDMECA_DEEPSEEK_API || process.env.DEEPSEEK_API_KEY;
  if (!key) return { text: template, source: "template" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const safeFacts: ReportFacts = { ...facts, context: facts.context ? clean(facts.context, 2000) : "", organisation: facts.organisation ? clean(facts.organisation, 200) : "" };
    const upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({ model: DEEPSEEK_MODEL, temperature: 0.4, max_tokens: 2500, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: buildUserMessage(safeFacts, template) }] }),
    });
    const raw = await upstream.text();
    if (!upstream.ok) throw new Error(`DeepSeek ${upstream.status}: ${raw.slice(0, 200)}`);
    const payload = JSON.parse(raw) as Completion;
    const choice = payload.choices?.[0];
    const text = choice?.message?.content?.trim();
    if (!text || text.length < template.length / 2) {
      throw new Error(`DeepSeek returned no usable report (model ${DEEPSEEK_MODEL}, finish ${choice?.finish_reason ?? "?"}, content ${text?.length ?? 0} chars, reasoning ${choice?.message?.reasoning_content?.length ?? 0} chars, template ${template.length} chars): ${raw.slice(0, 200)}`);
    }
    return { text, source: `deepseek:${DEEPSEEK_MODEL}` };
  } catch (error) {
    console.error("AI map report elaboration failed, sending template", error instanceof Error ? error.message : "unknown error");
    return { text: template, source: "template" };
  } finally {
    clearTimeout(timer);
  }
}

export type DeliveryOutcome = { result: AIMapResult; movement: Movement | null; reportSource: string };

/**
 * The whole unlock: find the baseline for a re-test, score, write the report,
 * forward to the sheet (which sends the emails and matches a returning
 * respondent by email). Throws when the sheet refuses, so the background
 * function log carries the reason; the sheet's status column carries it too.
 */
export async function deliverUnlock(job: UnlockJob, timeouts = { script: 60000, model: 60000 }): Promise<DeliveryOutcome> {
  const prior = job.retestOf ? await lookup({ respondentId: job.retestOf }, timeouts.script) : null;
  const result = scoreAIMap(job.answers, prior);
  let movement: Movement | null = prior ? movementBetween(prior, result) : null;
  const report = await writeReport({ mode: job.mode, result, profile: job.profile, context: job.context, cohort: job.cohort, organisation: job.organisation, movement }, timeouts.model);
  const delivered = await forward({
    action: "unlock", respondentId: job.respondentId, wave: job.wave, retestOf: job.retestOf, cohort: job.cohort, mode: job.mode,
    answers: job.answers, profile: job.profile, context: job.context, result, movement,
    name: job.name, email: job.email, organisation: job.organisation, wantsCall: job.wantsCall,
    reportText: report.text, reportSource: report.source, userAgent: job.userAgent, referrer: job.referrer,
  }, timeouts.script);
  if (!movement) {
    const byEmail = toPrior(delivered.previous);
    if (byEmail) movement = movementBetween(byEmail, result);
  }
  return { result, movement, reportSource: report.source };
}
