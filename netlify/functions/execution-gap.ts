import type { Handler, HandlerEvent } from "@netlify/functions";
import { type BackgroundJob, type MapJob, type UnlockJob, compute, deliverMap, deliverUnlock, scriptTarget } from "./lib/executionGapDelivery";

const origins = ["https://edmeca.co.za", "https://edmecaacademy.netlify.app", "https://staging--edmecaacademy.netlify.app", "http://localhost:5173", "http://localhost:4173"];
const stages = ["F", "E", "V"] as const;
const ids = [1, 2, 3, 4, 5, 6] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Netlify stops a synchronous function at 26 s. One Apps Script call takes
// 2-8 s warm and up to ~27 s cold, so the synchronous path makes at most one
// call with this budget; report writing and emailing run in the background function.
const SCRIPT_TIMEOUT_MS = Number(process.env.EXECUTION_GAP_SCRIPT_TIMEOUT_MS) || 22000;
const INLINE_MODEL_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS) || 15000;
export const BACKGROUND_PATH = "/.netlify/functions/execution-gap-unlock-background";

type Body = { action?: "map" | "unlock"; respondentId?: string; cells?: Record<string, Record<string, unknown>>; stage?: string; stageBand?: string; aiMultiplier?: number; sector?: string; programmeStatus?: string; name?: string; email?: string; business?: string; wantsCall?: boolean };

function response(statusCode: number, body: unknown, origin?: string) { return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }, body: JSON.stringify(body) }; }

/**
 * Hands the validated unlock to the background function, which Netlify
 * acknowledges with 202 before running it. Returns false when the call could
 * not be made (no site URL, no secret, network error), in which case the
 * caller delivers inline as a best effort.
 */
async function enqueue(job: BackgroundJob): Promise<boolean> {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const { secret } = scriptTarget();
  if (!base || !secret) return false;
  try {
    const answer = await fetch(`${base}${BACKGROUND_PATH}`, { method: "POST", headers: { "Content-Type": "application/json", "x-execution-gap-token": secret }, body: JSON.stringify(job) });
    return answer.status === 202 || answer.ok;
  } catch (error) {
    console.error("Execution gap background enqueue failed", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...response(204, {}, origin).headers, "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return response(405, { message: "Method Not Allowed" }, origin);
  try {
    const body = JSON.parse(event.body || "{}") as Body;
    if (!body.respondentId || !uuid.test(body.respondentId)) return response(400, { message: "Invalid respondent ID" }, origin);
    if (!body.cells || ids.some((id) => stages.some((stage) => ![0, 1, 2].includes(Number(body.cells?.[String(id)]?.[stage]))))) return response(400, { message: "All 18 map answers are required" }, origin);
    if (!Number.isInteger(body.aiMultiplier) || body.aiMultiplier < 1 || body.aiMultiplier > 5) return response(400, { message: "Invalid AI multiplier" }, origin);
    const result = compute(body.cells);
    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !email.test(body.email) || (body.business && body.business.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      const job: UnlockJob = {
        respondentId: body.respondentId, cells: body.cells, stage: body.stage || "", stageBand: body.stageBand || "", aiMultiplier: body.aiMultiplier,
        sector: body.sector || "", programmeStatus: body.programmeStatus || "", name: body.name, email: body.email, business: body.business || "", wantsCall: body.wantsCall,
      };
      // The browser gets its answer now; the report is written and emailed in the background.
      if (await enqueue({ kind: "unlock", ...job })) return response(200, { ok: true, result, queued: true }, origin);
      // Exactly one forward per request. Calling forward() unconditionally here
      // and again for the unlock ran the Apps Script's unlock_() twice, so every
      // respondent got two report emails (the first with an empty body) and
      // NOTIFY_TO got two lead notifications.
      const outcome = await deliverUnlock(job, { script: SCRIPT_TIMEOUT_MS, model: INLINE_MODEL_TIMEOUT_MS });
      return response(200, { ok: true, result, reportSource: outcome.reportSource }, origin);
    }
    const map: MapJob = { respondentId: body.respondentId, cells: body.cells, stage: body.stage || "", stageBand: body.stageBand || "", aiMultiplier: body.aiMultiplier, sector: body.sector || "", programmeStatus: body.programmeStatus || "" };
    // The browser only needs the scores; the sheet write happens in the background so a cold script cannot lose the row.
    if (await enqueue({ kind: "map", ...map })) return response(200, { ok: true, result, queued: true }, origin);
    await deliverMap(map, SCRIPT_TIMEOUT_MS);
    return response(200, { ok: true, result }, origin);
  } catch (error) { console.error("Execution gap error", error instanceof Error ? error.message : "unknown error"); return response(500, { message: "Could not process the diagnostic" }, origin); }
};
