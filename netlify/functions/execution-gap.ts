import type { Handler, HandlerEvent } from "@netlify/functions";

const origins = ["https://edmeca.co.za", "https://edmecaacademy.netlify.app", "https://staging--edmecaacademy.netlify.app", "http://localhost:5173", "http://localhost:4173"];
const stages = ["F", "E", "V"] as const;
const ids = [1, 2, 3, 4, 5, 6] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = { action?: "map" | "unlock"; respondentId?: string; cells?: Record<string, Record<string, unknown>>; stage?: string; stageBand?: string; aiMultiplier?: number; sector?: string; programmeStatus?: string; name?: string; email?: string; business?: string; wantsCall?: boolean };
function response(statusCode: number, body: unknown, origin?: string) { return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }, body: JSON.stringify(body) }; }
function compute(cells: Record<string, Record<string, unknown>>) {
  const totals = { F: 0, E: 0, V: 0 }; const stalls: string[] = []; const depths: { id: number; depth: number }[] = [];
  ids.forEach((id) => { const cell = cells[String(id)] || {}; stages.forEach((stage) => { totals[stage] += Number(cell[stage]) || 0; }); const f = Number(cell.F) || 0; const e = Number(cell.E) || 0; const v = Number(cell.V) || 0; const stall = f < 2 ? "F" : e < 2 ? "E" : v < 2 ? "V" : "C"; stalls.push(stall); depths.push({ id, depth: 2 - Math.min(f, e, v) + (stall === "E" ? 0.25 : stall === "V" ? 0.15 : 0) }); });
  const total = totals.F + totals.E + totals.V; const archetype = total <= 9 ? "The Starter" : totals.F >= 10 && totals.E >= 10 && totals.V >= 10 ? "The Closed Loop" : totals.F - totals.E >= 3 ? "The Planner" : totals.E - totals.F >= 3 ? "The Instinctive Operator" : totals.E >= 8 && totals.E - totals.V >= 3 ? "The Unproven Builder" : "The Balanced Builder";
  // Same ranking as scoreExecutionGap() in client/src/lib/executionGap.ts, so the
  // sheet records the two capabilities the respondent was actually shown.
  const widestGaps = [...depths].sort((a, b) => b.depth - a.depth || a.id - b.id).slice(0, 2).map(({ id }) => id);
  // frameworkTotal/executionTotal/evidenceTotal are the names the Apps Script reads
  // (HEADERS in docs/EXECUTION_GAP_APPS_SCRIPT.gs); F/E/V are kept for the API response.
  return { ...totals, frameworkTotal: totals.F, executionTotal: totals.E, evidenceTotal: totals.V, loopScore: Math.round((total / 36) * 100), executionGap: totals.F - totals.E, evidenceGap: totals.E - totals.V, stalls, widestGaps, archetype };
}
async function forward(body: Body, result: ReturnType<typeof compute>, reportText = "") {
  const url = process.env.EXECUTION_GAP_SCRIPT_URL; const secret = process.env.EXECUTION_GAP_SHARED_SECRET;
  if (!url || !secret) return;
  const upstream = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, ...body, result, reportText }) });
  if (!upstream.ok) throw new Error("Sheet delivery failed");
  // Apps Script returns HTTP 200 even when doPost() catches an error — the real
  // status is in the JSON body. Without this check a failed sheet write (missing
  // "Responses" tab, wrong secret) is reported to the browser as success.
  const payload = await upstream.json().catch(() => null) as { ok?: boolean; error?: string } | null;
  if (!payload || payload.ok !== true) throw new Error(`Sheet delivery failed: ${payload?.error ?? "unrecognised response"}`);
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
    const result = compute(body.cells); await forward(body, result);
    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !email.test(body.email) || (body.business && body.business.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      await forward(body, result, `Your ${result.archetype} report is ready. Your biggest gaps are between framework, execution and evidence. Start with the two widest gaps and close one loop this month.`);
    }
    return response(200, { ok: true, result }, origin);
  } catch (error) { console.error("Execution gap error", error instanceof Error ? error.message : "unknown error"); return response(500, { message: "Could not process the diagnostic" }, origin); }
};
