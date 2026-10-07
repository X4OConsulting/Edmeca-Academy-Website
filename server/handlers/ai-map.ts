import { type Handler, type HandlerEvent, inBackground } from "../legacy.js";
import {
  type Answer, type Answers, type ItemId, type RespondentMode, type Wave,
  businessSizes, programmeStatuses, roles, sectors,
} from "../../client/src/data/aiMap.js";
import { type AIMapResult, type Movement, isAnswer, itemsForWave, movementBetween, scoreAIMap } from "../../client/src/lib/aiMap.js";
import { type BackgroundJob, type Profile, type UnlockJob, deliverBaseline, deliverUnlock, lookup } from "../lib/aiMapDelivery.js";

const origins = ["https://edmeca.co.za", "http://localhost:5173", "http://localhost:4173", "http://localhost:3999"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cohortPattern = /^[A-Za-z0-9_-]{1,40}$/;
const waves: Wave[] = ["baseline", "mid", "post"];
const modes: RespondentMode[] = ["business", "individual"];

// One Apps Script call takes 2-8 s warm and up to ~27 s cold. The browser is
// answered after at most one such call (a re-test lookup); the sheet write,
// report and emails run after the response (inBackground).
const SCRIPT_TIMEOUT_MS = Number(process.env.AI_MAP_SCRIPT_TIMEOUT_MS) || 22000;

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

function response(statusCode: number, body: unknown, origin?: string) {
  return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }, body: JSON.stringify(body) };
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

/**
 * Delivers a validated job after the browser has its answer: the sheet row
 * for a baseline; the model-written report, sheet row and two emails for an
 * unlock. (This was the ai-map-unlock-background Netlify function.)
 */
export async function runJob(job: BackgroundJob): Promise<void> {
  if (job.kind === "baseline") {
    await deliverBaseline(job);
    console.log(`AI map baseline stored for ${job.respondentId} (${job.result.quadrant})`);
  } else {
    const outcome = await deliverUnlock(job);
    console.log(`AI map report delivered to ${job.email} (${outcome.reportSource}, ${outcome.result.quadrant}${outcome.movement ? ", with movement" : ""})`);
  }
}

const enqueue = (job: BackgroundJob) => inBackground(`AI map ${job.kind} for ${job.respondentId}`, () => runJob(job));

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...response(204, {}, origin).headers, "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return response(405, { message: "Method Not Allowed" }, origin);
  try {
    const body = JSON.parse(event.body || "{}") as Body;
    if (body.website) return response(200, { ok: true }, origin); // honeypot: pretend success, store nothing

    if (body.action === "retest") {
      if (body.retestOf && uuid.test(body.retestOf)) return response(200, { ok: true, previous: await lookup({ respondentId: body.retestOf }, SCRIPT_TIMEOUT_MS) }, origin);
      if (body.email && emailPattern.test(body.email) && body.email.length <= 200) return response(200, { ok: true, previous: await lookup({ email: body.email.trim().toLowerCase() }, SCRIPT_TIMEOUT_MS) }, origin);
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

    const userAgent = (body.userAgent || event.headers["user-agent"] || "").slice(0, 300);
    const referrer = (body.referrer || "").slice(0, 300);
    const context = (body.context || "").slice(0, 2000);

    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !emailPattern.test(body.email) || (body.organisation && body.organisation.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      const job: UnlockJob = {
        respondentId: body.respondentId, wave, retestOf: body.retestOf || "", cohort: body.cohort || "", mode, answers, profile, context,
        name: body.name.trim(), email: body.email.trim().toLowerCase(), organisation: (body.organisation || "").trim(), wantsCall: body.wantsCall, userAgent, referrer,
      };
      // The browser gets its answer now; the report is written and emailed in the background.
      enqueue({ kind: "unlock", ...job });
      return response(200, { ok: true, result: scoreAIMap(answers), queued: true }, origin);
    }

    // A re-test needs the baseline to (a) carry unasked pulse dimensions and (b) report movement.
    const prior = body.retestOf ? await lookup({ respondentId: body.retestOf }, SCRIPT_TIMEOUT_MS) : null;
    const result: AIMapResult = scoreAIMap(answers, prior);
    const movement: Movement | null = prior ? movementBetween(prior, result) : null;
    const baseline = { respondentId: body.respondentId, wave, retestOf: body.retestOf || "", cohort: body.cohort || "", mode, answers, profile, context, result, movement, userAgent, referrer };
    // The browser only needs the scores; the sheet write happens in the background so a cold script cannot lose the row.
    enqueue({ kind: "baseline", ...baseline });
    return response(200, { ok: true, result, movement, queued: true }, origin);
  } catch (error) {
    console.error("AI map error", error instanceof Error ? error.message : "unknown error");
    return response(500, { message: "Could not process the baseline" }, origin);
  }
};
