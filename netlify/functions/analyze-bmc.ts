import { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const MAX_CANVAS_CHARS = 15000;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // ── Authentication ─────────────────────────────────────────────────────────
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorised' }) };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  }

  // ── API key check ──────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) };
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let body: { companyName?: string; canvasData?: Record<string, string[]> };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { companyName = 'Untitled Business', canvasData } = body;
  if (!canvasData || typeof canvasData !== 'object') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Canvas data is required' }) };
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
    return { statusCode: 400, body: JSON.stringify({ error: 'Canvas data too large' }) };
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
    const client = new Anthropic({ apiKey });
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

    // Parse JSON response
    let analysis: {
      strengths: string[];
      areasToImprove: string[];
      coherenceChecks: string[];
      overallAssessment: string;
    };

    try {
      analysis = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate shape
    if (
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.areasToImprove) ||
      !Array.isArray(analysis.coherenceChecks) ||
      typeof analysis.overallAssessment !== 'string'
    ) {
      throw new Error('Invalid response shape from AI');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    };
  } catch (err) {
    console.error('BMC analysis error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'AI analysis failed. Please try again shortly.' }),
    };
  }
};
