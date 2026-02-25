import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 300 };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const { statements, companyName = 'the business' } = req.body as {
    statements: string;
    companyName?: string;
  };

  if (!statements) return res.status(400).json({ error: 'No financial data provided' });

  try {
    // ── Step 1: Haiku — categorise and structure transactions ─────────────────
    const categorisation = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a financial data analyst. Extract and categorise all transactions from the following bank statement / management accounts data for ${companyName}. 
Output a structured JSON summary with: income categories, expense categories, totals per category, and monthly trends.

DATA:
${statements.slice(0, 12000)}`,
      }],
    });

    const categorisedData = categorisation.content[0].type === 'text'
      ? categorisation.content[0].text
      : '';

    // ── Step 2: Sonnet — deep financial health analysis ───────────────────────
    const analysis = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are a senior financial advisor. Based on the following categorised financial data for ${companyName}, produce a comprehensive financial health report.

Include:
1. Executive Summary (3–4 sentences)
2. Revenue Analysis — trends, consistency, growth/decline
3. Expense Analysis — major cost drivers, unusual items, cost efficiency
4. Cash Flow Assessment — liquidity position, working capital
5. Key Financial Ratios (where calculable from the data)
6. Risk Flags — any concerning patterns or red flags
7. Recommendations — 3–5 actionable recommendations ranked by priority

CATEGORISED DATA:
${categorisedData}`,
      }],
    });

    const report = analysis.content[0].type === 'text'
      ? analysis.content[0].text
      : '';

    return res.status(200).json({
      success: true,
      report,
      meta: {
        model_categorisation: 'claude-haiku-4-5',
        model_analysis: 'claude-sonnet-4-5',
        company: companyName,
      },
    });

  } catch (err: any) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message ?? 'Analysis failed' });
  }
}
