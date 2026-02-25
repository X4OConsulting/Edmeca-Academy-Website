import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  VerticalAlign, TableBorders, convertInchesToTwip, PageOrientation
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../EdMeCa_LLM_Architecture_Recommendation.docx');

const NAVY  = '1F3A6E';
const TEAL  = '0D7377';
const WHITE = 'FFFFFF';
const LGREY = 'F2F4F7';
const MGREY = 'D0D5DD';
const BLACK = '1A1A2E';
const GREEN = '155724';
const GBG   = 'D1FAE5';
const RED   = 'B91C1C';
const RBGC  = 'FEE2E2';
const AMBER = '92400E';
const ABGC  = 'FEF3C7';
const BLUE  = '1E40AF';
const BBGC  = 'DBEAFE';

const pt = n => n * 2;

const BORDERS = {
  top:    { style: BorderStyle.SINGLE, size: 3, color: MGREY },
  bottom: { style: BorderStyle.SINGLE, size: 3, color: MGREY },
  left:   { style: BorderStyle.SINGLE, size: 3, color: MGREY },
  right:  { style: BorderStyle.SINGLE, size: 3, color: MGREY },
};

// ── Primitives ────────────────────────────────────────────────────────────────
function spacer(pts = 6) {
  return new Paragraph({ spacing: { before: 0, after: pt(pts) }, children: [] });
}

function para(text, { bold=false, size=11, color=BLACK, align=AlignmentType.LEFT,
  spaceBefore=2, spaceAfter=4, italic=false, font='Calibri' } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: pt(spaceBefore), after: pt(spaceAfter) },
    children: [new TextRun({ text, bold, size: pt(size), color, font, italics: italic })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: pt(12), after: pt(5) },
    shading: { fill: NAVY, type: ShadingType.SOLID },
    children: [new TextRun({ text: '  ' + text, bold: true, size: pt(13), color: WHITE, font: 'Calibri' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: pt(10), after: pt(4) },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL } },
    children: [new TextRun({ text, bold: true, size: pt(12), color: NAVY, font: 'Calibri' })],
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: pt(8), after: pt(3) },
    children: [new TextRun({ text, bold: true, size: pt(11), color: TEAL, font: 'Calibri' })],
  });
}

function bullet(label, detail = '') {
  const children = [
    new TextRun({ text: '\u2022  ', color: TEAL, size: pt(11), font: 'Calibri', bold: true }),
    new TextRun({ text: label, size: pt(11), color: BLACK, font: 'Calibri', bold: !!detail }),
  ];
  if (detail) children.push(new TextRun({ text: '  ' + detail, size: pt(11), color: '444444', font: 'Calibri' }));
  return new Paragraph({
    spacing: { before: pt(2), after: pt(3) },
    indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.15) },
    children,
  });
}

function callout(text, fill = BBGC, borderColor = BLUE, icon = 'ℹ') {
  return new Paragraph({
    spacing: { before: pt(6), after: pt(6) },
    indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
    shading: { fill, type: ShadingType.SOLID },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: borderColor } },
    children: [new TextRun({ text: `${icon}  ${text}`, size: pt(10.5), color: BLACK, font: 'Calibri' })],
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { before: 0, after: pt(1) },
    shading: { fill: '1E1E2E', type: ShadingType.SOLID },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    children: [new TextRun({ text: line, size: pt(9.5), color: 'A6E3A1', font: 'Courier New' })],
  }));
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function cell(text, { fill=WHITE, textColor=BLACK, bold=false, align=AlignmentType.LEFT, width, italic=false } = {}) {
  return new TableCell({
    borders: BORDERS,
    shading: { fill, type: ShadingType.SOLID },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: pt(4), bottom: pt(4), left: pt(6), right: pt(6) },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, size: pt(10), color: textColor, font: 'Calibri', italics: italic })],
    })],
  });
}

function hdr(text, width) {
  return cell(text, { fill: NAVY, textColor: WHITE, bold: true, align: AlignmentType.CENTER, width });
}

function makeTable(rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: rows.map((row, ri) => new TableRow({
      children: row.map((def, ci) => {
        const isHdr = ri === 0;
        const isOdd = ri % 2 === 1;
        if (typeof def === 'string') {
          if (isHdr) return hdr(def, widths?.[ci]);
          return cell(def, { fill: isOdd ? LGREY : WHITE, width: widths?.[ci] });
        }
        return cell(def.text || '', {
          fill: isHdr ? NAVY : (def.fill || (isOdd ? LGREY : WHITE)),
          textColor: isHdr ? WHITE : (def.color || BLACK),
          bold: isHdr ? true : (def.bold || false),
          align: def.align || AlignmentType.LEFT,
          width: widths?.[ci],
          italic: def.italic || false,
        });
      }),
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────

const doc = new Document({
  sections: [{
    children: [

      // ── COVER ──────────────────────────────────────────────────────────────
      para('EdMeCa Academy', { bold: true, size: 22, color: NAVY, align: AlignmentType.CENTER, spaceBefore: 0, spaceAfter: 2 }),
      para('LLM Integration — Recommended Architecture', { bold: true, size: 14, color: TEAL, align: AlignmentType.CENTER, spaceBefore: 0, spaceAfter: 2 }),
      para('Hybrid Netlify + Vercel Approach', { size: 11, color: MGREY, align: AlignmentType.CENTER, italic: true, spaceBefore: 0, spaceAfter: 2 }),
      para('23 February 2026  ·  Prepared by: GitHub Copilot / Raymond Crow', { size: 9, color: MGREY, align: AlignmentType.CENTER, spaceBefore: 0, spaceAfter: 14 }),

      // ── 1. CURRENT STATE ───────────────────────────────────────────────────
      h1('1.  Current Project Setup'),
      spacer(3),
      para(
        'The EdMeCa Academy website is a React + TypeScript (Vite) single-page application hosted on Netlify. ' +
        'The backend consists entirely of Netlify Functions (AWS Lambda), with no persistent server. ' +
        'Supabase handles authentication and database. Two functions are currently live:'
      ),
      spacer(3),
      makeTable([
        ['Function', 'Path', 'AI Model', 'Typical Response Time', 'Status'],
        ['BMC Chat Assistant', '/api/chat → chat.ts',    'Groq llama-3.1-8b-instant', '1–3 seconds',   { text: '✓ Works fine', color: GREEN, bold: true }],
        ['Contact Form',       '/api/contact → contact.ts', 'None (email only)',        '< 1 second', { text: '✓ Works fine', color: GREEN, bold: true }],
      ], [22, 28, 24, 16, 10]),
      spacer(6),
      callout(
        'The current Groq-based chat function is safe on Netlify. Groq inference runs in 1–3 seconds, ' +
        'well within the 10-second synchronous timeout. No changes needed for existing features.',
        GBG, GREEN, '✓'
      ),

      spacer(8),

      // ── 2. THE PROBLEM ─────────────────────────────────────────────────────
      h1('2.  The Problem — Financial Analysis Tool'),
      spacer(3),
      para(
        'The planned Financial Analysis Tool requires uploading bank statements and management accounts, ' +
        'which are then processed through a multi-step Claude AI pipeline:'
      ),
      spacer(4),
      makeTable([
        ['Step', 'Model', 'Task', 'Estimated Time'],
        ['1', 'Claude Haiku 3.5',  'Parse and categorise transactions from uploaded statements',       '15–45 seconds'],
        ['2', 'Claude Sonnet 3.7', 'Deep financial health analysis, ratios, trend identification',    '25–60 seconds'],
        ['3', 'Claude Sonnet 3.7', 'Generate recommendations, risk flags, narrative health report',   '15–30 seconds'],
        [{ text: 'Total', bold: true }, { text: '', bold: false }, { text: 'Full pipeline (sequential)',    bold: true }, { text: '55–135 seconds', bold: true, color: RED }],
      ], [6, 22, 46, 26]),
      spacer(6),
      callout(
        '⚠  Netlify drops the HTTP connection after 10 seconds on Free, 26 seconds on Pro. ' +
        'A 55–135 second pipeline triggers a 502 error — the client receives no output and the analysis is lost. ' +
        'This is a hard architectural limit; no Netlify configuration can extend it for synchronous functions.',
        RBGC, RED, ''
      ),

      spacer(8),

      // ── 3. RECOMMENDED APPROACH ────────────────────────────────────────────
      h1('3.  Recommended Approach — Hybrid Architecture'),
      spacer(3),
      para(
        'Keep Netlify for everything it currently does. Add Vercel as a second, free deployment solely for ' +
        'Claude-powered API endpoints. The React frontend calls different URLs depending on the feature.'
      ),
      spacer(6),

      h2('3.1  What stays on Netlify'),
      bullet('Static site (all React pages, assets, CSS)', 'No change required'),
      bullet('chat.ts — Groq BMC assistant', 'Sub-3s response, well within 10s limit'),
      bullet('contact.ts — Contact form + Resend email', 'No AI, instant response'),
      bullet('CI/CD pipeline, branch previews', 'staging and development environments unchanged'),
      bullet('Netlify Forms', 'Contact form fallback, no function needed'),
      spacer(6),

      h2('3.2  What moves to Vercel (new, free)'),
      bullet('POST /api/analyze-financials', 'Claude Haiku → Sonnet pipeline, up to 300s free timeout'),
      bullet('POST /api/generate-report', 'Narrative financial health report generation'),
      bullet('Any future Claude-based features', 'Full AI Gateway, caching, streaming support included'),
      spacer(6),

      callout(
        'Vercel Hobby (free tier) provides a 300-second function timeout with Fluid Compute enabled by default. ' +
        'This covers the entire 55–135 second pipeline with 165 seconds of headroom. ' +
        'No payment required to start. Upgrade to Pro (R367.54/month incl. VAT) only if scaling demands it.',
        BBGC, BLUE, 'ℹ'
      ),

      spacer(8),

      // ── 4. ARCHITECTURE DIAGRAM (text-based) ──────────────────────────────
      h1('4.  Architecture Diagram'),
      spacer(4),
      makeTable([
        ['Layer', 'Service', 'Handles', 'Timeout', 'Monthly Cost'],
        ['Frontend',       'Netlify (CDN)', 'React SPA, static assets, routing',   'N/A',        { text: 'Free', color: GREEN, bold: true }],
        ['Auth + DB',      'Supabase',      'User auth, sessions, data storage',    'N/A',        { text: 'Free tier', color: GREEN }],
        ['Fast AI',        'Netlify Functions → Groq', 'BMC chat, quick Q&A',      '10 seconds', { text: 'Free', color: GREEN }],
        ['Long AI',        'Vercel Functions → Anthropic', 'Financial analysis, report generation', '300 seconds (free)', { text: 'Free → R0', color: GREEN, bold: true }],
        ['Email',          'Netlify Functions → Resend', 'Contact form, notifications', '10 seconds', { text: 'Free', color: GREEN }],
        ['File uploads',   'Supabase Storage', 'Bank statements, management accounts', 'N/A',    { text: 'Free tier', color: GREEN }],
      ], [12, 26, 30, 18, 14]),
      spacer(8),

      // ── 5. IMPLEMENTATION STEPS ────────────────────────────────────────────
      h1('5.  Implementation Steps'),
      spacer(4),

      h3('Step 1 — Link the repo to Vercel (30 minutes)'),
      para('Run the following in a terminal at the project root:', { spaceAfter: 3 }),
      ...codeBlock([
        '# Install Vercel CLI globally',
        'npm install -g vercel',
        '',
        '# Authenticate and create a new Vercel project (same GitHub repo)',
        'vercel',
        '',
        '# Follow the prompts:',
        '#   Link to existing project? → No (create new)',
        '#   Which framework? → Vite',
        '#   Root directory? → . (project root)',
      ]),
      spacer(6),

      h3('Step 2 — Create the API route'),
      para('Add a Vercel API route at /api/analyze-financials.ts in the project root:', { spaceAfter: 3 }),
      ...codeBlock([
        '// api/analyze-financials.ts',
        'import Anthropic from "@anthropic-ai/sdk";',
        '',
        'export const config = { maxDuration: 300 }; // 300 seconds (Fluid Compute)',
        '',
        'export default async function handler(req, res) {',
        '  const client = new Anthropic();',
        '',
        '  // Step 1: Haiku — categorise transactions',
        '  const categorisation = await client.messages.create({',
        '    model: "claude-haiku-4-5",',
        '    max_tokens: 4096,',
        '    messages: [{ role: "user", content: req.body.statements }],',
        '  });',
        '',
        '  // Step 2: Sonnet — deep analysis',
        '  const analysis = await client.messages.create({',
        '    model: "claude-sonnet-4-5",',
        '    max_tokens: 8192,',
        '    messages: [{ role: "user", content: categorisation.content[0].text }],',
        '  });',
        '',
        '  res.json({ report: analysis.content[0].text });',
        '}',
      ]),
      spacer(6),

      h3('Step 3 — Set environment variables in Vercel'),
      para('In the Vercel dashboard → Project Settings → Environment Variables, add:', { spaceAfter: 3 }),
      makeTable([
        ['Variable', 'Value', 'Environment'],
        ['ANTHROPIC_API_KEY',  'sk-ant-... (from console.anthropic.com)',  'Production, Preview, Development'],
        ['VITE_SUPABASE_URL',  'Your Supabase project URL',               'Production, Preview, Development'],
        ['VITE_SUPABASE_ANON_KEY', 'Your Supabase anon key',              'Production, Preview, Development'],
      ], [28, 44, 28]),
      spacer(6),

      h3('Step 4 — Update the React frontend to call Vercel for analysis'),
      para('In the financial analysis component, point the API call at the Vercel domain:', { spaceAfter: 3 }),
      ...codeBlock([
        '// In your financial analysis component or lib/api.ts',
        'const VERCEL_API = import.meta.env.VITE_VERCEL_API_URL',
        '               ?? "https://your-project.vercel.app";',
        '',
        'const response = await fetch(`${VERCEL_API}/api/analyze-financials`, {',
        '  method: "POST",',
        '  headers: {',
        '    "Content-Type": "application/json",',
        '    "Authorization": `Bearer ${session.access_token}`,',
        '  },',
        '  body: JSON.stringify({ statements: uploadedFileContent }),',
        '});',
      ]),
      spacer(6),
      callout(
        'Add VITE_VERCEL_API_URL to .env.local and to Netlify environment variables (production, staging, dev). ' +
        'This keeps the Vercel URL configurable without hardcoding it in source.',
        BBGC, BLUE, 'ℹ'
      ),

      spacer(8),

      // ── 6. STREAMING (OPTIONAL) ────────────────────────────────────────────
      h1('6.  Optional — Streaming Responses for Better UX'),
      spacer(3),
      para(
        'Instead of waiting 55–135 seconds for a complete JSON response, Vercel supports server-sent events (SSE) ' +
        'streaming so Claude\'s tokens appear in real time on the client — like ChatGPT\'s typing effect.'
      ),
      spacer(4),
      ...codeBlock([
        '// api/analyze-financials.ts — streaming version',
        'import Anthropic from "@anthropic-ai/sdk";',
        '',
        'export const config = { maxDuration: 300 };',
        '',
        'export default async function handler(req, res) {',
        '  res.setHeader("Content-Type", "text/event-stream");',
        '  res.setHeader("Cache-Control", "no-cache");',
        '',
        '  const client = new Anthropic();',
        '  const stream = await client.messages.stream({',
        '    model: "claude-sonnet-4-5",',
        '    max_tokens: 8192,',
        '    messages: [{ role: "user", content: req.body.prompt }],',
        '  });',
        '',
        '  for await (const event of stream) {',
        '    if (event.type === "content_block_delta") {',
        '      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\\n\\n`);',
        '    }',
        '  }',
        '  res.end();',
        '}',
      ]),
      spacer(8),

      // ── 7. COST SUMMARY ────────────────────────────────────────────────────
      h1('7.  Cost Summary'),
      spacer(4),
      makeTable([
        ['Service', 'Plan', 'Monthly (USD)', 'Monthly (ZAR incl. 15% VAT)', 'Role'],
        ['Netlify',    'Free',       '$0',   { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },   'Static hosting, chat, contact, forms'],
        ['Vercel',     'Hobby',      '$0',   { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },   'Financial analysis API (300s timeout)'],
        ['Supabase',   'Free',       '$0',   { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },   'Auth, database, file storage'],
        ['Anthropic',  'Pay-per-use','~$2–8',{ text: '~R36–R147', color: '92400E', align: AlignmentType.CENTER },        'Claude API calls (usage-based)'],
        ['Resend',     'Free',       '$0',   { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },   '3,000 emails/month'],
        [
          { text: 'TOTAL PLATFORM', bold: true },
          { text: 'Launch phase', bold: true },
          { text: '~$2–8', bold: true, color: GREEN },
          { text: '~R36–R147/month', bold: true, color: GREEN, align: AlignmentType.CENTER },
          { text: 'Pure AI API costs only — all platforms free', italic: true },
        ],
      ], [14, 14, 12, 24, 36]),
      spacer(6),
      callout(
        'Anthropic pricing (Claude API, as at Feb 2026): ' +
        'Haiku 3.5 — $0.80 per million input tokens, $4.00 per million output tokens. ' +
        'Sonnet 3.7 — $3.00 per million input tokens, $15.00 per million output tokens. ' +
        'A typical 10-page financial analysis consumes ~8,000 input + ~2,000 output tokens ≈ $0.07 per analysis.',
        ABGC, '92400E', '💰'
      ),

      spacer(8),

      // ── 8. WHEN TO UPGRADE ─────────────────────────────────────────────────
      h1('8.  When to Upgrade'),
      spacer(4),
      makeTable([
        ['Trigger', 'Recommended next step', 'Approx. cost (ZAR incl. VAT)'],
        [
          'Multiple users running simultaneous analyses (Vercel Hobby function concurrency limit hit)',
          'Upgrade to Vercel Pro',
          'R367.54/month',
        ],
        [
          'Need PDF parsing, OCR, or Python-based document processing alongside LLM',
          'Move LLM microservice to Sevalla ($5/month) — Docker, Johannesburg DC',
          'R91.88/month',
        ],
        [
          'Need a persistent Node.js/Express server with WebSockets or background job queue',
          'Render Starter ($7/month) — always-on, SSH access, no timeout',
          'R128.64/month',
        ],
        [
          'Full multi-tenant platform with concurrent users at scale',
          'Render Standard ($25/month) — 2 GB RAM, 1 CPU',
          'R459.43/month',
        ],
      ], [40, 38, 22]),

      spacer(8),

      // ── 9. DECISION SUMMARY ────────────────────────────────────────────────
      h1('9.  Decision Summary'),
      spacer(4),
      callout(
        'Action: Create a free Vercel project linked to the same GitHub repo. ' +
        'Do not migrate anything — Netlify keeps running the site and existing functions. ' +
        'Build all Claude-based financial analysis endpoints as Vercel API routes. ' +
        'The frontend calls Netlify for fast features and Vercel for long-running AI. ' +
        'Total additional cost: R0/month until scale demands an upgrade.',
        GBG, GREEN, '✓'
      ),
      spacer(4),
      bullet('Effort:', '1–2 developer days to set up Vercel project and write the first analysis endpoint'),
      bullet('Risk:', 'Very low — Netlify is untouched; Vercel runs independently'),
      bullet('Reversible:', 'Yes — Vercel project can be deleted at any time with no impact on the live site'),
      bullet('Rate used for ZAR conversions:', '$1 = R15.98 (XE mid-market, 23 February 2026)'),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buf);
console.log(`✅  Written: ${OUT}  (${(buf.byteLength / 1024).toFixed(1)} KB)`);
