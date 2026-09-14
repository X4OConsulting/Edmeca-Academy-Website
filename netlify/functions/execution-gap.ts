import type { Handler, HandlerEvent } from "@netlify/functions";
import { archetypes, capabilities, multiplierOptions } from "../../client/src/data/executionGap";

const origins = ["https://edmeca.co.za", "https://edmecaacademy.netlify.app", "https://staging--edmecaacademy.netlify.app", "http://localhost:5173", "http://localhost:4173"];
const stages = ["F", "E", "V"] as const;
const ids = [1, 2, 3, 4, 5, 6] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = { action?: "map" | "unlock"; respondentId?: string; cells?: Record<string, Record<string, unknown>>; stage?: string; stageBand?: string; aiMultiplier?: number; sector?: string; programmeStatus?: string; name?: string; email?: string; business?: string; wantsCall?: boolean };
function response(statusCode: number, body: unknown, origin?: string) { return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }, body: JSON.stringify(body) }; }
function compute(cells: Record<string, Record<string, unknown>>) {
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
 * The report body emailed to the respondent. Mirrors what they saw on screen —
 * same archetype, Gap Ledger, two widest gaps and close actions — so the email
 * is a record of their map rather than a generic note. Plain text: the Apps
 * Script renders it in a white-space:pre-line block and reuses it as the
 * plain-text alternative.
 */
function buildReport(body: Body, result: ReturnType<typeof compute>) {
  const band = body.stageBand === "trading" ? "trading" : "pre";
  const headline = Object.values(archetypes).find((a) => a.name === result.archetype)?.headline ?? "";
  const gap = (id: number, index: number) => {
    const capability = capabilities.find((c) => c.id === id);
    if (!capability) return "";
    const stall = result.stalls[id - 1];
    const close = capability.closes[stall === "E" ? "E" : stall === "V" ? "V" : "F"][band];
    return `${index}. ${capability.name} — ${result.stallLabels[id - 1]}\n   Do this: ${close}\n   Edmeca: ${capability.tool} · ${capability.session}`;
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
    const result = compute(body.cells);
    if (body.action === "unlock") {
      if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !email.test(body.email) || (body.business && body.business.length > 200) || typeof body.wantsCall !== "boolean") return response(400, { message: "Invalid contact details" }, origin);
      // Exactly one forward per request. Calling forward() unconditionally here
      // and again for the unlock ran the Apps Script's unlock_() twice, so every
      // respondent got two report emails (the first with an empty body) and
      // NOTIFY_TO got two lead notifications.
      await forward(body, result, buildReport(body, result));
    } else {
      await forward(body, result);
    }
    return response(200, { ok: true, result }, origin);
  } catch (error) { console.error("Execution gap error", error instanceof Error ? error.message : "unknown error"); return response(500, { message: "Could not process the diagnostic" }, origin); }
};
