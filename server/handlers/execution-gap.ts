import { type Handler, type HandlerEvent, inBackground } from "../legacy";
import { type BackgroundJob, type MapJob, type UnlockJob, compute, deliverMap, deliverUnlock } from "../lib/executionGapDelivery";

const origins = ["https://edmeca.co.za", "http://localhost:5173", "http://localhost:4173", "http://localhost:3999"];
const stages = ["F", "E", "V"] as const;
const ids = [1, 2, 3, 4, 5, 6] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


type Body = { action?: "map" | "unlock"; respondentId?: string; cells?: Record<string, Record<string, unknown>>; stage?: string; stageBand?: string; aiMultiplier?: number; sector?: string; programmeStatus?: string; name?: string; email?: string; business?: string; wantsCall?: boolean };

function response(statusCode: number, body: unknown, origin?: string) { return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }, body: JSON.stringify(body) }; }

/**
 * Delivers a validated job after the browser has its answer: the sheet row for
 * a map; the model-written report, sheet row and emails for an unlock. (This
 * was the execution-gap-unlock-background Netlify function.) Exactly one
 * delivery per request: running the Apps Script's unlock_() twice once sent
 * every respondent two report emails and NOTIFY_TO two lead notifications.
 */
export async function runJob(job: BackgroundJob): Promise<void> {
  if (job.kind === "map") {
    await deliverMap(job);
    console.log(`Execution gap map stored for ${job.respondentId}`);
  } else {
    const outcome = await deliverUnlock(job);
    console.log(`Execution gap report delivered to ${job.email} (${outcome.reportSource}, ${outcome.result.archetype})`);
  }
}

const enqueue = (job: BackgroundJob) => inBackground(`Execution gap ${job.kind} for ${job.respondentId}`, () => runJob(job));

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...response(204, {}, origin).headers, "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return response(405, { message: "Method Not Allowed" }, origin);
  try {
    const body = JSON.parse(event.body || "{}") as Body;
    if (!body.respondentId || !uuid.test(body.respondentId)) return response(400, { message: "Invalid respondent ID" }, origin);
    if (!body.cells || ids.some((id) => stages.some((stage) => ![0, 1, 2].includes(Number(body.cells?.[String(id)]?.[stage]))))) return response(400, { message: "All 18 map answers are required" }, origin);
    const aiMultiplier = body.aiMultiplier;
    if (typeof aiMultiplier !== "number" || !Number.isInteger(aiMultiplier) || aiMultiplier < 1 || aiMultiplier > 5) return response(400, { message: "Invalid AI multiplier" }, origin);
    const result = compute(body.cells);
    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !email.test(body.email) || (body.business && body.business.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      const job: UnlockJob = {
        respondentId: body.respondentId, cells: body.cells, stage: body.stage || "", stageBand: body.stageBand || "", aiMultiplier,
        sector: body.sector || "", programmeStatus: body.programmeStatus || "", name: body.name, email: body.email, business: body.business || "", wantsCall: body.wantsCall,
      };
      // The browser gets its answer now; the report is written and emailed in the background.
      enqueue({ kind: "unlock", ...job });
      return response(200, { ok: true, result, queued: true }, origin);
    }
    const map: MapJob = { respondentId: body.respondentId, cells: body.cells, stage: body.stage || "", stageBand: body.stageBand || "", aiMultiplier, sector: body.sector || "", programmeStatus: body.programmeStatus || "" };
    // The browser only needs the scores; the sheet write happens in the background so a cold script cannot lose the row.
    enqueue({ kind: "map", ...map });
    return response(200, { ok: true, result, queued: true }, origin);
  } catch (error) { console.error("Execution gap error", error instanceof Error ? error.message : "unknown error"); return response(500, { message: "Could not process the diagnostic" }, origin); }
};
