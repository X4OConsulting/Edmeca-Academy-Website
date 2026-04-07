import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const MAX_CANVAS_CHARS = 15000;

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
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  const { companyName = 'Untitled Business', canvasData } = req.body ?? {};
  if (!canvasData || typeof canvasData !== 'object') {
    return res.status(400).json({ error: 'Canvas data is required' });
  }

  // ── Build canvas summary for the prompt ────────────────────────────────────
  const sectionLabels: Record<string, string> = {
    customerSegments: '1. Customer Segments',
    valuePropositions: '2. Value Propositions',
    channels: '3. Channels',
    customerRelationships: '4. Customer Relationships',
    revenueStreams: '5. Revenue Streams',
    keyResources: '6. Key Resources',
    keyActivities: '7. Key Activities',
    keyPartnerships: '8. Key Partnerships',
    costStructure: '9. Cost Structure',
  };

  const canvasSummary = Object.entries(sectionLabels)
    .map(([key, label]) => {
      const items = (canvasData[key] || []).filter((s: string) => s && s.trim());
      if (items.length === 0) return `${label}: [EMPTY]`;
      return `${label}:\n${items.map((item: string, i: number) => `  ${i + 1}. ${item}`).join('\n')}`;
    })
    .join('\n\n');

  if (canvasSummary.length > MAX_CANVAS_CHARS) {
    return res.status(400).json({ error: 'Canvas data too large' });
  }

  // ── Call Claude Haiku ──────────────────────────────────────────────────────
  const systemPrompt = `You are an expert business model analyst trained on Osterwalder's Business Model Canvas framework. You are reviewing a student's Business Model Canvas for "${companyName}".

Your task: analyse the canvas data below and return a JSON object with exactly this structure:
{
  "strengths": ["string", ...],
  "areasToImprove": ["string", ...],
  "coherenceChecks": ["string", ...],
  "overallAssessment": "string"
}

Rules for your analysis:
1. STRENGTHS — identify what the student has done well. Reference specific content they wrote. Praise specificity, cross-block consistency, and Osterwalder-aligned thinking. Max 4 items.
2. AREAS TO IMPROVE — identify gaps, vague answers, or missing sections. Give actionable advice that references the Osterwalder framework (e.g. "Your Customer Relationships section mentions self-service, but you haven't explained how this supports your premium value proposition"). Max 4 items.
3. COHERENCE CHECKS — examine cross-block alignment. Check whether:
   - Value proposition matches the customer segment's actual pain
   - Channels match the relationship type (self-service channel + dedicated personal assistance = contradiction)
   - Revenue model aligns with value proposition (premium offer + rock-bottom pricing = misalignment)
   - Cost structure supports the operational model (cost-driven claim + expensive resources = contradiction)
   - Key activities and resources actually enable the value proposition
   - Key partnerships fill real gaps in resources or activities
   Max 3 items. Only flag genuine contradictions or misalignments — do not invent problems.
4. OVERALL ASSESSMENT — a 2-3 sentence summary of the canvas quality and the single most important next step.

Be specific and reference the student's actual content. Do not give generic advice. Write in plain English suitable for a university-level business student. Use South African context where relevant.

Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Here is the Business Model Canvas for "${companyName}":\n\n${canvasSummary}`,
        },
      ],
      system: systemPrompt,
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let analysis: {
      strengths: string[];
      areasToImprove: string[];
      coherenceChecks: string[];
      overallAssessment: string;
    };

    try {
      analysis = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    if (
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.areasToImprove) ||
      !Array.isArray(analysis.coherenceChecks) ||
      typeof analysis.overallAssessment !== 'string'
    ) {
      throw new Error('Invalid response shape from AI');
    }

    return res.status(200).json(analysis);
  } catch (err) {
    console.error('BMC analysis error:', err);
    return res.status(502).json({ error: 'AI analysis failed. Please try again shortly.' });
  }
}
