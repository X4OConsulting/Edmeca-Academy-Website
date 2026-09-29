/**
 * Financial Analysis: input checks, the two Claude pipelines and the checks
 * on what the model returns. Shared by analyze-financials.ts (accepts the job,
 * reports its status) and analyze-financials-background.ts (runs it).
 *
 * Moved from api/analyze-financials.ts, the Vercel function whose deployment
 * was disabled. Differences: the full input is analysed (no silent slicing),
 * a reply cut off at max_tokens is an error, and the deep analysis must match
 * the dashboard's shape or the job fails; there is no invented fallback score.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/** The one input limit, shown to the user in the tool before they submit. */
export const MAX_INPUT_CHARS = 50_000;

const QUICK_MODEL = "claude-haiku-4-5";
const CATEGORISE_MODEL = "claude-haiku-4-5";
const ANALYSIS_MODEL = "claude-sonnet-4-5";

export type AnalysisInput = {
  statements: string;
  companyName: string;
  analysisMode: "quick" | "deep";
  sector: string;
  stage: string;
  yearEnd: string;
  inputType: "management" | "bank";
};

export class InputError extends Error {}
export class AnalysisError extends Error {}

const sanitise = (value: unknown, max: number) => String(value ?? "").replace(/[\x00-\x1F\x7F]/g, "").slice(0, max);

/** Validates the request body. Throws InputError with a message fit to show the user. */
export function parseInput(body: unknown): AnalysisInput {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const statements = String(raw.statements ?? "").trim();
  if (!statements) throw new InputError("No financial data provided.");
  if (statements.length > MAX_INPUT_CHARS) {
    throw new InputError(`Your financial data is ${statements.length.toLocaleString("en-ZA")} characters; the limit is ${MAX_INPUT_CHARS.toLocaleString("en-ZA")}. Remove older periods or upload fewer files.`);
  }
  return {
    statements,
    companyName: sanitise(raw.companyName, 200) || "the business",
    analysisMode: raw.analysisMode === "quick" ? "quick" : "deep",
    sector: sanitise(raw.sector, 100) || "General",
    stage: sanitise(raw.stage, 100) || "Established",
    yearEnd: sanitise(raw.yearEnd, 50) || String(new Date().getFullYear()),
    inputType: raw.inputType === "management" ? "management" : "bank",
  };
}

const text = z.string().catch("N/A");
const flag = z.boolean().catch(true);
const structuredSchema = z.object({
  businessName: z.string().catch(""),
  period: z.string().catch(""),
  healthScore: z.number().min(0).max(100),
  healthGrade: z.string(),
  healthSummary: z.string(),
  kpis: z.object({
    revenue: text, revenueChange: text, revenueChangePositive: flag,
    grossMargin: text, grossMarginVsSector: text, grossMarginPositive: flag,
    netMargin: text, netMarginVsSector: text, netMarginPositive: flag,
    currentRatio: text, currentRatioNote: text, currentRatioPositive: flag,
    cashRunway: text, cashRunwayNote: text, cashRunwayPositive: flag,
    debtToEquity: text, debtToEquityNote: text, debtToEquityPositive: flag,
  }),
  monthlyData: z.array(z.object({ month: z.string(), revenue: z.number(), expenses: z.number() })).catch([]),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]).catch("medium"),
    title: z.string(),
    description: z.string(),
  })).catch([]),
  supportAreas: z.array(z.object({
    icon: z.string().catch("•"),
    label: z.string(),
    level: z.enum(["urgent", "recommended", "optional"]).catch("recommended"),
  })).catch([]),
  executiveSummary: z.string(),
  keyStrengths: z.array(z.string()).catch([]),
  keyRisks: z.array(z.string()).catch([]),
});

export type StructuredAnalysis = z.infer<typeof structuredSchema>;

export type AnalysisResult = {
  success: true;
  report: string;
  structured?: StructuredAnalysis;
  meta: {
    model_categorisation: string;
    model_analysis: string;
    company: string;
    analysis_mode: "quick" | "deep";
    sector: string;
    stage: string;
    inputType: string;
  };
};

/**
 * Parses and checks the deep analysis JSON. Core fields (score, grade,
 * summaries, KPIs) must be present; list fields fall back to empty.
 * Throws AnalysisError rather than inventing a score.
 */
export function parseStructured(rawText: string): StructuredAnalysis {
  const fenced = rawText.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  let json: unknown;
  try {
    json = JSON.parse(start >= 0 && end > start ? fenced.slice(start, end + 1) : fenced);
  } catch {
    throw new AnalysisError("The analysis could not be structured into a report. Please try again.");
  }
  const parsed = structuredSchema.safeParse(json);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].slice(0, 5).join(", ");
    throw new AnalysisError(`The analysis was missing required parts (${fields}). Please try again.`);
  }
  return parsed.data;
}

export function buildMarkdownReport(s: StructuredAnalysis): string {
  const k = s.kpis;
  const kpiTable = [
    "| KPI | Value | Note |",
    "|-----|-------|------|",
    `| Annual Revenue | ${k.revenue} | ${k.revenueChange} |`,
    `| Gross Profit Margin | ${k.grossMargin} | ${k.grossMarginVsSector} |`,
    `| Net Profit Margin | ${k.netMargin} | ${k.netMarginVsSector} |`,
    `| Current Ratio | ${k.currentRatio} | ${k.currentRatioNote} |`,
    `| Cash Runway | ${k.cashRunway} | ${k.cashRunwayNote} |`,
    `| Debt-to-Equity | ${k.debtToEquity} | ${k.debtToEquityNote} |`,
  ].join("\n");
  const list = (items: string[]) => items.map((x) => `- ${x}`).join("\n");
  return `# Financial Health Report — ${s.businessName}

**Period:** ${s.period}
**Overall Health Score:** ${s.healthScore}/100 — ${s.healthGrade}

## Executive Summary

${s.executiveSummary}

> **Health Assessment:** ${s.healthSummary}

## Key Performance Indicators

${kpiTable}

## Recommendations

${s.recommendations.map((r, i) => `${i + 1}. **[${r.priority.toUpperCase()}] ${r.title}** — ${r.description}`).join("\n")}

## Key Strengths

${list(s.keyStrengths)}

## Risk Flags

${list(s.keyRisks)}

## Accelerator Support Areas

${s.supportAreas.map((a) => `- ${a.icon} **${a.label}** *(${a.level})*`).join("\n")}
`;
}

type MessagesClient = Pick<Anthropic, "messages">;

/** One model call. A reply cut off at max_tokens or refused is an error, never a partial report. */
async function complete(client: MessagesClient, model: string, maxTokens: number, prompt: string): Promise<string> {
  const response = await client.messages.create({ model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] });
  if (response.stop_reason === "max_tokens") throw new AnalysisError("The analysis ran longer than allowed and was cut off. Please try again with less data.");
  if (response.stop_reason === "refusal") throw new AnalysisError("The analysis could not be completed for this data.");
  const reply = response.content.filter((block): block is Anthropic.TextBlock => block.type === "text").map((block) => block.text).join("").trim();
  if (!reply) throw new AnalysisError("The analysis came back empty. Please try again.");
  return reply;
}

export function createClient(): MessagesClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AnalysisError("The analysis service is not configured.");
  // Background functions have minutes; one retry covers a transient overload.
  return new Anthropic({ apiKey, timeout: 180_000, maxRetries: 1 });
}

export type Step = "categorising" | "analysing";

export async function runAnalysis(input: AnalysisInput, client: MessagesClient, onStep: (step: Step) => Promise<unknown> = async () => undefined): Promise<AnalysisResult> {
  const { companyName, sector, stage, yearEnd, inputType, statements } = input;
  const meta = { company: companyName, sector, stage, inputType, analysis_mode: input.analysisMode };

  if (input.analysisMode === "quick") {
    await onStep("analysing");
    const report = await complete(client, QUICK_MODEL, 4096, `You are a concise financial advisor. Analyse the following financial data for ${companyName} (${sector} sector, ${stage} stage) and produce a quick-scan snapshot.

Use this exact markdown structure:

## Executive Summary
2–3 sentences on overall financial health.

## Revenue vs Expenses Snapshot
Key income and expense figures; net position.

## Top Risk Flags
Up to 3 bullet points of the most urgent concerns.

## Quick Wins
Up to 3 actionable recommendations achievable within 30 days.

Keep each section brief and practical. Avoid unnecessary detail.

DATA:
${statements}`);
    return { success: true, report, meta: { ...meta, model_categorisation: QUICK_MODEL, model_analysis: QUICK_MODEL } };
  }

  await onStep("categorising");
  const categorised = await complete(client, CATEGORISE_MODEL, 8192, `You are a financial data analyst. Extract and categorise all transactions from the following ${inputType === "management" ? "management accounts" : "bank statement"} data for ${companyName} (${sector} sector).
Output a structured JSON summary with: income categories, expense categories, totals per category, and monthly trends.

DATA:
${statements}`);

  await onStep("analysing");
  const rawText = await complete(client, ANALYSIS_MODEL, 16000, `You are a senior financial analyst at an entrepreneurial accelerator. Analyse the categorised financial data below for ${companyName} and return a comprehensive assessment.

Business Context:
- Business Name: ${companyName}
- Sector: ${sector}
- Stage: ${stage}
- Financial Year End: ${yearEnd}
- Document Type: ${inputType === "management" ? "Management Accounts" : "Bank Statements"}

Return ONLY a valid JSON object (no markdown, no code blocks, just raw JSON) matching this exact structure:

{
  "businessName": "${companyName}",
  "period": "FY ${yearEnd}",
  "healthScore": <number 0-100>,
  "healthGrade": "<Excellent|Good|Moderate|Concerning|Critical>",
  "healthSummary": "<2-sentence summary of overall financial health>",
  "kpis": {
    "revenue": "<formatted e.g. R 2.4M>",
    "revenueChange": "<e.g. ↑ 18% YoY or N/A>",
    "revenueChangePositive": <true|false>,
    "grossMargin": "<e.g. 34%>",
    "grossMarginVsSector": "<e.g. ↓ 4pp below sector avg (38%)>",
    "grossMarginPositive": <true|false>,
    "netMargin": "<e.g. 7.2%>",
    "netMarginVsSector": "<e.g. ≈ sector avg (7%)>",
    "netMarginPositive": <true|false>,
    "currentRatio": "<e.g. 1.3×>",
    "currentRatioNote": "<brief note>",
    "currentRatioPositive": <true|false>,
    "cashRunway": "<e.g. 3.1 mo>",
    "cashRunwayNote": "<brief note>",
    "cashRunwayPositive": <true|false>,
    "debtToEquity": "<e.g. 0.8×>",
    "debtToEquityNote": "<brief note>",
    "debtToEquityPositive": <true|false>
  },
  "monthlyData": [
    {"month": "Jan", "revenue": <number>, "expenses": <number>}
  ],
  "recommendations": [
    {"priority": "high", "title": "<title>", "description": "<1-2 sentence recommendation>"},
    {"priority": "medium", "title": "<title>", "description": "<1-2 sentence recommendation>"},
    {"priority": "low", "title": "<title>", "description": "<1-2 sentence recommendation>"}
  ],
  "supportAreas": [
    {"icon": "📊", "label": "<area>", "level": "urgent|recommended|optional"},
    {"icon": "💰", "label": "<area>", "level": "urgent|recommended|optional"},
    {"icon": "📈", "label": "<area>", "level": "urgent|recommended|optional"}
  ],
  "executiveSummary": "<4-5 sentence detailed narrative about financial health, trading performance and key issues>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "keyRisks": ["<risk 1>", "<risk 2>", "<risk 3>"]
}

monthlyData has one entry per month, Jan to Dec. Ensure all number fields (monthlyData revenue/expenses) are actual numbers, not strings.
If monthly data is not available in the source, estimate based on annual totals.

CATEGORISED DATA:
${categorised}`);

  const structured = parseStructured(rawText);
  return { success: true, structured, report: buildMarkdownReport(structured), meta: { ...meta, model_categorisation: CATEGORISE_MODEL, model_analysis: ANALYSIS_MODEL } };
}
