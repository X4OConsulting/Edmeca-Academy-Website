import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 300,
};

// ── Structured analysis result shape ─────────────────────────────────────────
export interface StructuredAnalysis {
  businessName: string;
  period: string;
  healthScore: number;
  healthGrade: string;
  healthSummary: string;
  kpis: {
    revenue: string;
    revenueChange: string;
    revenueChangePositive: boolean;
    grossMargin: string;
    grossMarginVsSector: string;
    grossMarginPositive: boolean;
    netMargin: string;
    netMarginVsSector: string;
    netMarginPositive: boolean;
    currentRatio: string;
    currentRatioNote: string;
    currentRatioPositive: boolean;
    cashRunway: string;
    cashRunwayNote: string;
    cashRunwayPositive: boolean;
    debtToEquity: string;
    debtToEquityNote: string;
    debtToEquityPositive: boolean;
  };
  monthlyData: Array<{ month: string; revenue: number; expenses: number }>;
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; title: string; description: string }>;
  supportAreas: Array<{ icon: string; label: string; level: 'urgent' | 'recommended' | 'optional' }>;
  executiveSummary: string;
  keyStrengths: string[];
  keyRisks: string[];
}

// ── Build markdown report from structured data (for export) ──────────────────
function buildMarkdownReport(s: StructuredAnalysis): string {
  const kpiTable = [
    `| KPI | Value | Note |`,
    `|-----|-------|------|`,
    `| Annual Revenue | ${s.kpis.revenue} | ${s.kpis.revenueChange} |`,
    `| Gross Profit Margin | ${s.kpis.grossMargin} | ${s.kpis.grossMarginVsSector} |`,
    `| Net Profit Margin | ${s.kpis.netMargin} | ${s.kpis.netMarginVsSector} |`,
    `| Current Ratio | ${s.kpis.currentRatio} | ${s.kpis.currentRatioNote} |`,
    `| Cash Runway | ${s.kpis.cashRunway} | ${s.kpis.cashRunwayNote} |`,
    `| Debt-to-Equity | ${s.kpis.debtToEquity} | ${s.kpis.debtToEquityNote} |`,
  ].join('\n');

  const recommendations = s.recommendations
    .map((r, i) => `${i + 1}. **[${r.priority.toUpperCase()}] ${r.title}** — ${r.description}`)
    .join('\n');

  const strengths = s.keyStrengths.map(x => `- ${x}`).join('\n');
  const risks = s.keyRisks.map(x => `- ${x}`).join('\n');

  const supportAreas = s.supportAreas
    .map(a => `- ${a.icon} **${a.label}** *(${a.level})*`)
    .join('\n');

  return `# Financial Health Report — ${s.businessName}

**Period:** ${s.period}
**Overall Health Score:** ${s.healthScore}/100 — ${s.healthGrade}

## Executive Summary

${s.executiveSummary}

> **Health Assessment:** ${s.healthSummary}

## Key Performance Indicators

${kpiTable}

## Recommendations

${recommendations}

## Key Strengths

${strengths}

## Risk Flags

${risks}

## Accelerator Support Areas

${supportAreas}
`;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_ORIGINS = [
  'https://edmeca.co.za',
  'https://edmecaacademy.netlify.app',
  'https://staging--edmecaacademy.netlify.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function setCors(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Auth: verify Supabase session ──────────────────────────────────────────
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  // ── Parse request ──────────────────────────────────────────────────────────
  const {
    statements,
    companyName: rawCompanyName = 'the business',
    analysisMode = 'deep',
    sector: rawSector = 'General',
    stage: rawStage = 'Established',
    yearEnd: rawYearEnd = String(new Date().getFullYear()),
    inputType: rawInputType = 'bank',
  } = req.body as {
    statements?: string;
    companyName?: string;
    analysisMode?: 'quick' | 'deep';
    sector?: string;
    stage?: string;
    yearEnd?: string;
    inputType?: 'management' | 'bank';
  };

  // Sanitise string inputs — strip control characters, cap lengths
  const sanitise = (s: string, max = 200) =>
    String(s ?? '').replace(/[\x00-\x1F\x7F]/g, '').slice(0, max);

  const companyName = sanitise(rawCompanyName, 200) || 'the business';
  const sector      = sanitise(rawSector, 100)      || 'General';
  const stage       = sanitise(rawStage, 100)        || 'Established';
  const yearEnd     = sanitise(rawYearEnd, 50)       || String(new Date().getFullYear());
  const inputType   = rawInputType === 'management' ? 'management' : 'bank';

  const textToAnalyse = (statements ?? '').trim();
  if (!textToAnalyse) return res.status(400).json({ error: 'No financial data provided' });

  // Guard: reject oversized input to prevent runaway Anthropic API costs and prompt injection.
  // 50 000 chars ≈ 12 500 tokens — ample for any real financial statement paste.
  if (textToAnalyse.length > 50_000) {
    return res.status(400).json({ error: 'Financial data exceeds maximum allowed size (50 000 characters)' });
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // QUICK MODE — single Haiku step, fast 4-section snapshot (~5s)
    // ════════════════════════════════════════════════════════════════════════
    if (analysisMode === 'quick') {
      const quickAnalysis = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are a concise financial advisor. Analyse the following financial data for ${companyName} (${sector} sector, ${stage} stage) and produce a quick-scan snapshot.

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
${textToAnalyse.slice(0, 8000)}`,
        }],
      });

      const report = quickAnalysis.content[0].type === 'text'
        ? quickAnalysis.content[0].text
        : '';

      return res.status(200).json({
        success: true,
        report,
        meta: {
          model_categorisation: 'claude-haiku-4-5',
          model_analysis: 'claude-haiku-4-5',
          company: companyName,
          analysis_mode: 'quick',
          sector,
          stage,
          inputType,
        },
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // DEEP MODE — Haiku categorise → Sonnet structured JSON analysis (~45s)
    // ════════════════════════════════════════════════════════════════════════

    // ── Step 1: Haiku — categorise and structure transactions ─────────────────
    const categorisation = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a financial data analyst. Extract and categorise all transactions from the following ${inputType === 'management' ? 'management accounts' : 'bank statement'} data for ${companyName} (${sector} sector).
Output a structured JSON summary with: income categories, expense categories, totals per category, and monthly trends.

DATA:
${textToAnalyse.slice(0, 12000)}`,
      }],
    });

    const categorisedData = categorisation.content[0].type === 'text'
      ? categorisation.content[0].text
      : '';

    // ── Step 2: Sonnet — structured JSON financial analysis ───────────────────
    const analysis = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are a senior financial analyst at an entrepreneurial accelerator. Analyse the categorised financial data below for ${companyName} and return a comprehensive assessment.

Business Context:
- Business Name: ${companyName}
- Sector: ${sector}
- Stage: ${stage}
- Financial Year End: ${yearEnd}
- Document Type: ${inputType === 'management' ? 'Management Accounts' : 'Bank Statements'}

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
    {"month": "Jan", "revenue": <number>, "expenses": <number>},
    {"month": "Feb", "revenue": <number>, "expenses": <number>},
    {"month": "Mar", "revenue": <number>, "expenses": <number>},
    {"month": "Apr", "revenue": <number>, "expenses": <number>},
    {"month": "May", "revenue": <number>, "expenses": <number>},
    {"month": "Jun", "revenue": <number>, "expenses": <number>},
    {"month": "Jul", "revenue": <number>, "expenses": <number>},
    {"month": "Aug", "revenue": <number>, "expenses": <number>},
    {"month": "Sep", "revenue": <number>, "expenses": <number>},
    {"month": "Oct", "revenue": <number>, "expenses": <number>},
    {"month": "Nov", "revenue": <number>, "expenses": <number>},
    {"month": "Dec", "revenue": <number>, "expenses": <number>}
  ],
  "recommendations": [
    {"priority": "high", "title": "<title>", "description": "<1-2 sentence recommendation>"},
    {"priority": "medium", "title": "<title>", "description": "<1-2 sentence recommendation>"},
    {"month": "low", "title": "<title>", "description": "<1-2 sentence recommendation>"}
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

Ensure all number fields (monthlyData revenue/expenses) are actual numbers, not strings.
If monthly data is not available in the source, estimate based on annual totals.

CATEGORISED DATA:
${categorisedData}`,
      }],
    });

    const rawText = analysis.content[0].type === 'text' ? analysis.content[0].text : '{}';

    // ── Parse structured JSON — strip any accidental markdown fences ──────────
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let structured: StructuredAnalysis;
    try {
      structured = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as StructuredAnalysis;
      // Normalise recommendations priority — handle any stray "month" key typos
      if (Array.isArray(structured.recommendations)) {
        structured.recommendations = structured.recommendations.map(r => ({
          ...r,
          priority: (['high', 'medium', 'low'].includes(r.priority) ? r.priority : 'medium') as 'high' | 'medium' | 'low',
        }));
      }
    } catch {
      // JSON parse failed — construct minimal fallback from raw text
      structured = {
        businessName: companyName,
        period: `FY ${yearEnd}`,
        healthScore: 50,
        healthGrade: 'Moderate',
        healthSummary: 'Analysis completed. See the full report below.',
        kpis: {
          revenue: 'N/A', revenueChange: 'N/A', revenueChangePositive: true,
          grossMargin: 'N/A', grossMarginVsSector: 'N/A', grossMarginPositive: true,
          netMargin: 'N/A', netMarginVsSector: 'N/A', netMarginPositive: true,
          currentRatio: 'N/A', currentRatioNote: 'N/A', currentRatioPositive: true,
          cashRunway: 'N/A', cashRunwayNote: 'N/A', cashRunwayPositive: true,
          debtToEquity: 'N/A', debtToEquityNote: 'N/A', debtToEquityPositive: true,
        },
        monthlyData: [],
        recommendations: [{ priority: 'medium', title: 'See full report', description: rawText.slice(0, 200) }],
        supportAreas: [],
        executiveSummary: rawText.slice(0, 500),
        keyStrengths: [],
        keyRisks: [],
      };
    }

    // ── Build backward-compat markdown report ─────────────────────────────────
    const report = buildMarkdownReport(structured);

    return res.status(200).json({
      success: true,
      structured,
      report,
      meta: {
        model_categorisation: 'claude-haiku-4-5',
        model_analysis: 'claude-sonnet-4-5',
        company: companyName,
        analysis_mode: 'deep',
        sector,
        stage,
        inputType,
      },
    });

  } catch (err: any) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message ?? 'Analysis failed' });
  }
}
