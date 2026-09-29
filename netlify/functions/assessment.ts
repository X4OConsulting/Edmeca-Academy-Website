import type { Handler, HandlerEvent } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const ALLOWED_ORIGINS = [
  "https://edmeca.co.za",
  "https://edmecaacademy.netlify.app",
  "https://staging--edmecaacademy.netlify.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

const dimensions = ["foundations", "operations", "sales", "finance", "innovation"] as const;
const stages = ["Intent", "Focus", "Activation", "Measurement", "Evidence"] as const;
const stageDescriptors = [
  "You can see the need for change, but the link between ambition and action is still forming.",
  "You have identified promising opportunities and are choosing where effort will matter most.",
  "Priority work is moving, with people testing practical changes in the business.",
  "Execution is becoming repeatable, with owners, measures and learning loops in place.",
  "Your strategy is producing measurable outcomes that strengthen decisions and create new advantage.",
];
const stageDistribution = [30, 36, 22, 9, 3];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AssessmentBody = {
  action?: "snapshot" | "unlock";
  respondentId?: string;
  answers?: Record<string, unknown>;
  profile?: { sector?: string; size?: string };
  context?: string;
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  wantsCall?: boolean;
  website?: string;
};

type ComputedResult = {
  scores: Record<(typeof dimensions)[number], number>;
  total: number;
  score: number;
  average: number;
  stageIndex: number;
  stage: string;
  percentile: number;
};

function headers(origin: string | undefined): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(statusCode: number, body: unknown, origin?: string) {
  return { statusCode, headers: headers(origin), body: JSON.stringify(body) };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function compute(answers: Record<string, unknown>): ComputedResult {
  const scores = Object.fromEntries(dimensions.map((dimension) => [dimension, Number(answers[dimension])])) as ComputedResult["scores"];
  const values = dimensions.map((dimension) => scores[dimension]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / dimensions.length;
  const stageIndex = average <= 1.8 ? 0 : average <= 2.6 ? 1 : average <= 3.4 ? 2 : average <= 4.2 ? 3 : 4;
  const below = stageDistribution.slice(0, stageIndex).reduce((sum, value) => sum + value, 0);
  return { scores, total, score: Math.round((total / 25) * 100), average, stageIndex, stage: stages[stageIndex], percentile: Math.round(below + stageDistribution[stageIndex] / 2) };
}

function validateBase(body: AssessmentBody): string | null {
  if (!validUuid(body.respondentId)) return "Invalid respondent ID";
  if (!body.answers || dimensions.some((dimension) => !Number.isInteger(body.answers?.[dimension]) || Number(body.answers[dimension]) < 1 || Number(body.answers[dimension]) > 5)) return "All five assessment answers are required";
  if (!body.profile?.sector || body.profile.sector.length > 100 || !body.profile.size || body.profile.size.length > 50) return "Sector and business size are required";
  if (typeof body.context !== "string" || body.context.length > 2000) return "Context is too long";
  return null;
}

function fallbackReport(body: AssessmentBody, result: ComputedResult): string {
  return `You are currently at the ${result.stage} stage with a readiness score of ${result.score}/100. ${stageDescriptors[result.stageIndex]} In the context of ${body.profile?.sector || "your sector"} and a business of ${body.profile?.size || "your size"}, this gives you a useful starting point for focused progress.\n\nYour next 90 days should turn your strongest capability into repeatable practice while giving attention to the dimension with the most room to grow. Start with one practical workflow, measure what changes, and share the learning with the team.\n\n1. Choose one high-frequency task to improve with AI and document the new way of working. This creates a visible baseline for Session 2.\n2. Connect your AI experiments to a customer, pricing or delivery outcome. Use Session 3 or Session 4 to turn activity into business value.\n3. Review the result with your team and choose the next opportunity. Session 6 helps you build the implementation roadmap.\n\nEdmeca would be glad to help you turn this snapshot into a practical next step.`;
}

async function generateReport(body: AssessmentBody, result: ComputedResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackReport(body, result);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 900,
    temperature: 0.4,
    system: "You write a short, practical From Strategy to Evidence assessment report for a South African small business owner on behalf of Edmeca. Use plain, warm, direct English. No jargon, no hype, no em dashes. Do not invent facts. Keep it under 550 words. Structure exactly as: Where you are; Your shape; The evidence gap; Your next 90 days with three numbered priorities; one closing invitation to talk with Edmeca.",
    messages: [{ role: "user", content: JSON.stringify({ stage: result.stage, score: result.score, scores: result.scores, sector: body.profile?.sector, size: body.profile?.size, context: body.context }) }],
  });
  const text = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
  return text || fallbackReport(body, result);
}

async function forward(body: AssessmentBody, result: ComputedResult, reportText?: string): Promise<void> {
  const url = process.env.ASSESSMENT_SCRIPT_URL;
  const secret = process.env.ASSESSMENT_SHARED_SECRET;
  if (!url || !secret) return;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, action: body.action, respondentId: body.respondentId, stage: result.stage, score: result.score, scores: result.scores, sector: body.profile?.sector, size: body.profile?.size, context: body.context, name: body.name, email: body.email, company: body.company, role: body.role, wantsCall: body.wantsCall, reportText, userAgent: "", referrer: "" }) });
  if (!response.ok) throw new Error("Assessment delivery failed");
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...headers(origin), "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return json(405, { message: "Method Not Allowed" }, origin);
  try {
    const body = JSON.parse(event.body || "{}") as AssessmentBody;
    if (body.website) return json(200, { ok: true }, origin);
    const validationError = validateBase(body);
    if (validationError) return json(400, { message: validationError }, origin);
    const result = compute(body.answers as Record<string, unknown>);
    if (body.action === "snapshot") {
      await forward(body, result);
      return json(200, { ok: true, score: result.score, stage: result.stage }, origin);
    }
    if (body.action !== "unlock") return json(400, { message: "Unknown assessment action" }, origin);
    if (!body.name || body.name.length > 100 || !body.email || body.email.length > 200 || !emailPattern.test(body.email) || (body.company && body.company.length > 200) || (body.role && body.role.length > 100) || typeof body.wantsCall !== "boolean") return json(400, { message: "Please provide valid contact details" }, origin);
    const reportText = await generateReport(body, result);
    await forward(body, result, reportText);
    return json(200, { ok: true }, origin);
  } catch (error) {
    console.error("Assessment function error", error instanceof Error ? error.message : "unknown error");
    return json(500, { message: "We could not process the assessment. Please try again." }, origin);
  }
};
