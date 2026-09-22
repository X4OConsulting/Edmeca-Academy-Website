import type { Handler, HandlerEvent } from "@netlify/functions";
import {
  type Answer, type Answers, type ItemId, type RespondentMode, type Wave,
  businessSizes, dimensionCodes, programmeStatuses, roles, sectors,
} from "../../client/src/data/aiMap";
import { type AIMapResult, type Movement, type PriorPosition, isAnswer, itemsForWave, movementBetween, scoreAIMap } from "../../client/src/lib/aiMap";
import { type ReportFacts, SYSTEM_PROMPT, buildTemplateReport, buildUserMessage } from "./lib/aiMapReportPrompt";

const origins = ["https://edmeca.co.za", "https://edmecaacademy.netlify.app", "https://staging--edmecaacademy.netlify.app", "https://feature-ai-enablement-baseline--edmecaacademy.netlify.app", "http://localhost:5173", "http://localhost:4173", "http://localhost:8888"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cohortPattern = /^[A-Za-z0-9_-]{1,40}$/;
const waves: Wave[] = ["baseline", "mid", "post"];
const modes: RespondentMode[] = ["business", "individual"];

// Same OpenAI-compatible DeepSeek call as execution-gap.ts. The plan named the
// Anthropic SDK; the site's live report pipeline runs on DEEPSEEK_API_KEY, which
// is already configured in Netlify, so this instrument uses the same key.
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS) || 15000;
const INJECTION = [/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, /forget\s+(everything|all|prior|previous)/gi, /disregard\s+(all\s+)?instructions?/gi, /you\s+are\s+now\s+[a-z]/gi, /new\s+instructions?:/gi, /system\s+prompt:/gi, /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi];
const clean = (value: string, max: number) => INJECTION.reduce((text, pattern) => text.replace(pattern, "[removed]"), value).slice(0, max);

type Profile = { sizeOrRole?: string; sector?: string; programmeStatus?: string };
type Body = {
  action?: "baseline" | "unlock" | "retest";
  respondentId?: string;
  wave?: string;
  retestOf?: string;
  cohort?: string;
  mode?: string;
  answers?: Record<string, unknown>;
  profile?: Profile;
  context?: string;
  name?: string;
  email?: string;
  organisation?: string;
  wantsCall?: boolean;
  website?: string; // honeypot
  userAgent?: string;
  referrer?: string;
};

type Prior = PriorPosition & { respondentId?: string; timestamp?: string; mode?: string; profile?: Profile; wave?: string };

function response(statusCode: number, body: unknown, origin?: string) {
  return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }, body: JSON.stringify(body) };
}

function scriptTarget() {
  return { url: process.env.AI_MAP_SCRIPT_URL || process.env.EXECUTION_GAP_SCRIPT_URL, secret: process.env.AI_MAP_SHARED_SECRET || process.env.EXECUTION_GAP_SHARED_SECRET };
}

/**
 * Forwards to the Apps Script bound to the response sheet. The same web app
 * serves the Execution Gap diagnostic; `instrument` tells it which tab to use.
 * Apps Script answers HTTP 200 even when doPost() caught an error, so the JSON
 * body is the real status.
 */
// Netlify stops a synchronous function at 26 s. One Apps Script call takes
// 2-8 s warm and up to ~20 s cold, so each forward gets its own budget and the
// unlock path makes exactly one call.
const SCRIPT_TIMEOUT_MS = Number(process.env.AI_MAP_SCRIPT_TIMEOUT_MS) || 22000;
async function forward(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { url, secret } = scriptTarget();
  if (!url || !secret) return { ok: true, skipped: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRIPT_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, instrument: "ai-map", ...payload }), signal: controller.signal });
  } catch (error) {
    throw new Error(error instanceof Error && error.name === "AbortError" ? `Sheet delivery timed out after ${SCRIPT_TIMEOUT_MS} ms` : "Sheet delivery failed");
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) throw new Error("Sheet delivery failed");
  const parsed = await upstream.json().catch(() => null) as Record<string, unknown> | null;
  if (!parsed || parsed.ok !== true) throw new Error(`Sheet delivery failed: ${(parsed?.error as string) ?? "unrecognised response"}`);
  return parsed;
}

function parseAnswers(raw: Record<string, unknown> | undefined, wave: Wave): Answers | null {
  if (!raw || typeof raw !== "object") return null;
  const answers: Answers = {};
  for (const id of itemsForWave(wave)) {
    const value = Number(raw[String(id)]);
    if (!isAnswer(value)) return null;
    answers[id as ItemId] = value as Answer;
  }
  return answers;
}

function parseProfile(mode: RespondentMode, raw: Profile | undefined): Profile | null {
  const profile = raw ?? {};
  const sizeOrRoleOptions = mode === "business" ? businessSizes : roles;
  if (profile.sizeOrRole && !sizeOrRoleOptions.includes(profile.sizeOrRole)) return null;
  if (profile.sector && !sectors.includes(profile.sector)) return null;
  if (profile.programmeStatus && !programmeStatuses.includes(profile.programmeStatus)) return null;
  return { sizeOrRole: profile.sizeOrRole || "", sector: profile.sector || "", programmeStatus: profile.programmeStatus || "" };
}

/** Turns the Apps Script's `previous` record into the shape the scorer expects. */
function toPrior(raw: unknown): Prior | null {
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

async function lookup(criteria: { respondentId?: string; email?: string; exclude?: string }): Promise<Prior | null> {
  try {
    const answer = await forward({ action: "lookup", ...criteria });
    return toPrior(answer.previous);
  } catch (error) {
    console.error("AI map lookup failed", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

/** Expands the template report with DeepSeek. Never throws; falls back to the template. */
async function writeReport(facts: ReportFacts): Promise<{ text: string; source: string }> {
  const template = buildTemplateReport(facts);
  const key = (process.env.EDMECA_DEEPSEEK_API || process.env.DEEPSEEK_API_KEY);
  if (!key) return { text: template, source: "template" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  try {
    const safeFacts: ReportFacts = { ...facts, context: facts.context ? clean(facts.context, 2000) : "", organisation: facts.organisation ? clean(facts.organisation, 200) : "" };
    const upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({ model: DEEPSEEK_MODEL, temperature: 0.4, max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: buildUserMessage(safeFacts, template) }] }),
    });
    if (!upstream.ok) throw new Error(`DeepSeek ${upstream.status}`);
    const payload = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text || text.length < template.length / 2) throw new Error("DeepSeek returned no usable report");
    return { text, source: `deepseek:${DEEPSEEK_MODEL}` };
  } catch (error) {
    console.error("AI map report elaboration failed, sending template", error instanceof Error ? error.message : "unknown error");
    return { text: template, source: "template" };
  } finally {
    clearTimeout(timer);
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...response(204, {}, origin).headers, "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return response(405, { message: "Method Not Allowed" }, origin);
  try {
    const body = JSON.parse(event.body || "{}") as Body;
    if (body.website) return response(200, { ok: true }, origin); // honeypot: pretend success, store nothing

    if (body.action === "retest") {
      if (body.retestOf && uuid.test(body.retestOf)) return response(200, { ok: true, previous: await lookup({ respondentId: body.retestOf }) }, origin);
      if (body.email && emailPattern.test(body.email) && body.email.length <= 200) return response(200, { ok: true, previous: await lookup({ email: body.email.trim().toLowerCase() }) }, origin);
      return response(400, { message: "A re-test link or email address is required" }, origin);
    }

    if (body.action !== "baseline" && body.action !== "unlock") return response(400, { message: "Unknown action" }, origin);
    if (!body.respondentId || !uuid.test(body.respondentId)) return response(400, { message: "Invalid respondent ID" }, origin);
    const mode = body.mode as RespondentMode;
    if (!modes.includes(mode)) return response(400, { message: "Invalid mode" }, origin);
    const wave = (body.wave || "baseline") as Wave;
    if (!waves.includes(wave)) return response(400, { message: "Invalid wave" }, origin);
    if (body.retestOf && !uuid.test(body.retestOf)) return response(400, { message: "Invalid re-test reference" }, origin);
    if (body.cohort && !cohortPattern.test(body.cohort)) return response(400, { message: "Invalid cohort code" }, origin);
    const answers = parseAnswers(body.answers, wave);
    if (!answers) return response(400, { message: `All ${itemsForWave(wave).length} statements need an answer between 0 and 4` }, origin);
    const profile = parseProfile(mode, body.profile);
    if (!profile) return response(400, { message: "Invalid profile details" }, origin);
    if (body.context && (typeof body.context !== "string" || body.context.length > 2000)) return response(400, { message: "Context is too long" }, origin);

    // A re-test needs the baseline to (a) carry unasked pulse dimensions and (b) report movement.
    const prior = body.retestOf ? await lookup({ respondentId: body.retestOf }) : null;
    const result: AIMapResult = scoreAIMap(answers, prior);
    let movement: Movement | null = prior ? movementBetween(prior, result) : null;

    const common = {
      respondentId: body.respondentId, wave, retestOf: body.retestOf || "", cohort: body.cohort || "", mode,
      answers, profile, context: (body.context || "").slice(0, 2000), result, movement,
      userAgent: (body.userAgent || event.headers["user-agent"] || "").slice(0, 300), referrer: (body.referrer || "").slice(0, 300),
    };

    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !emailPattern.test(body.email) || (body.organisation && body.organisation.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      const email = body.email.trim().toLowerCase();
      const report = await writeReport({ mode, result, profile, context: body.context, cohort: body.cohort, organisation: body.organisation, movement });
      const delivered = await forward({ action: "unlock", ...common, movement, name: body.name.trim(), email, organisation: (body.organisation || "").trim(), wantsCall: body.wantsCall, reportText: report.text, reportSource: report.source });
      // Without a re-test link the Apps Script matches the email itself and returns the earlier row, so a returning respondent still sees movement.
      if (!movement) {
        const byEmail = toPrior(delivered.previous);
        if (byEmail) movement = movementBetween(byEmail, result);
      }
      return response(200, { ok: true, result, movement, reportSource: report.source }, origin);
    }

    await forward({ action: "baseline", ...common });
    return response(200, { ok: true, result, movement }, origin);
  } catch (error) {
    console.error("AI map error", error instanceof Error ? error.message : "unknown error");
    return response(500, { message: "Could not process the baseline" }, origin);
  }
};
