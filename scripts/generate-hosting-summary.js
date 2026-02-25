import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  VerticalAlign, TableBorders, convertInchesToTwip
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../Hosting_Platform_Summary.docx');

const NAVY  = '1F3A6E';
const TEAL  = '0D7377';
const WHITE = 'FFFFFF';
const LGREY = 'F2F4F7';
const MGREY = 'D0D5DD';
const BLACK = '1A1A2E';
const GREEN = '1A6B3A';
const RED   = 'B91C1C';
const AMBER = '92400E';

const pt = n => n * 2;

const BORDERS = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: MGREY },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: MGREY },
  left:   { style: BorderStyle.SINGLE, size: 4, color: MGREY },
  right:  { style: BorderStyle.SINGLE, size: 4, color: MGREY },
};

function para(text, { bold = false, size = 11, color = BLACK, align = AlignmentType.LEFT,
  spaceBefore = 4, spaceAfter = 4, italic = false } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: pt(spaceBefore), after: pt(spaceAfter) },
    children: [new TextRun({ text, bold, size: pt(size), color, font: 'Calibri', italics: italic })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: pt(14), after: pt(6) },
    shading: { fill: NAVY, type: ShadingType.SOLID },
    children: [new TextRun({ text: '  ' + text, bold: true, size: pt(14), color: WHITE, font: 'Calibri' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: pt(10), after: pt(4) },
    children: [new TextRun({ text, bold: true, size: pt(12), color: NAVY, font: 'Calibri' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL } },
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: pt(2), after: pt(3) },
    indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.15) },
    children: [
      new TextRun({ text: '\u2022  ', color: TEAL, size: pt(11), font: 'Calibri', bold: true }),
      new TextRun({ text, size: pt(11), color: BLACK, font: 'Calibri' }),
    ],
  });
}

function note(text, fill = 'FEF9C3', borderColor = 'D97706') {
  return new Paragraph({
    spacing: { before: pt(6), after: pt(6) },
    indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
    shading: { fill, type: ShadingType.SOLID },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: borderColor } },
    children: [new TextRun({ text, size: pt(10.5), color: BLACK, font: 'Calibri', italics: true })],
  });
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function cell(text, {
  fill = WHITE, textColor = BLACK, bold = false, align = AlignmentType.LEFT, width
} = {}) {
  return new TableCell({
    borders: BORDERS,
    shading: { fill, type: ShadingType.SOLID },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: pt(4), bottom: pt(4), left: pt(6), right: pt(6) },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, size: pt(10), color: textColor, font: 'Calibri' })],
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
      children: row.map((cellDef, ci) => {
        const isHeader = ri === 0;
        const isOdd = ri % 2 === 1;
        if (typeof cellDef === 'string') {
          if (isHeader) return hdr(cellDef, widths ? widths[ci] : undefined);
          return cell(cellDef, { fill: isOdd ? LGREY : WHITE, width: widths ? widths[ci] : undefined });
        }
        return cell(cellDef.text, {
          fill: isHeader ? NAVY : (cellDef.fill || (isOdd ? LGREY : WHITE)),
          textColor: isHeader ? WHITE : (cellDef.color || BLACK),
          bold: isHeader ? true : (cellDef.bold || false),
          align: cellDef.align || AlignmentType.LEFT,
          width: widths ? widths[ci] : undefined,
        });
      }),
    })),
  });
}

function spacer(pts = 6) {
  return new Paragraph({ spacing: { before: 0, after: pt(pts) }, children: [] });
}

// ─────────────────────────────────────────────────────────────────────────────

const doc = new Document({
  sections: [{
    children: [
      // TITLE BLOCK
      para('HOSTING PLATFORM COMPARISON', { bold: true, size: 22, color: NAVY, align: AlignmentType.CENTER, spaceBefore: 0, spaceAfter: 2 }),
      para('LLM Integration Suitability — Netlify · Vercel · Sevalla · Render', { size: 11, color: TEAL, align: AlignmentType.CENTER, italic: true, spaceBefore: 0, spaceAfter: 2 }),
      para('EdMeCa Academy  ·  February 2026', { size: 9, color: MGREY, align: AlignmentType.CENTER, spaceBefore: 0, spaceAfter: 10 }),

      // ── 1. The Problem ────────────────────────────────────────────────────
      h1('1.  The Problem'),
      spacer(2),
      para(
        'Claude Haiku and Sonnet queries for detailed financial analysis typically run 35–120 seconds. ' +
        'Netlify drops the connection at 10 seconds (free) or 26 seconds (Pro), killing the response ' +
        'before the AI finishes. The financial analysis tool — which processes uploaded bank statements ' +
        'and management accounts to assess company financial health — cannot function reliably on ' +
        'Netlify\'s synchronous function limits.',
        { spaceAfter: 6 }
      ),
      note(
        '⚠  Observed issue: Netlify drops the connection mid-analysis when using Claude Sonnet for ' +
        'detailed financial health reports. This triggers a 502 error and the client receives no output.'
      ),

      spacer(4),

      // ── 2. Quick Comparison ───────────────────────────────────────────────
      h1('2.  Platform Comparison'),
      spacer(4),
      makeTable([
        ['Platform',   'Execution Model',         'Free Timeout',      'Paid Timeout',         'LLM Suitability'],
        [
          { text: 'Netlify',  bold: true },
          'Serverless functions',
          { text: '10 seconds',     color: RED, bold: true },
          { text: '26 sec (Pro)',   color: AMBER },
          { text: '✗  Not suitable — redesign required', color: RED },
        ],
        [
          { text: 'Vercel',   bold: true },
          'Fluid Compute (persistent serverless)',
          { text: '300 seconds',    color: GREEN, bold: true },
          { text: '800 sec (Pro)',   color: GREEN },
          { text: '✓  Excellent — native AI SDK + streaming', color: GREEN },
        ],
        [
          { text: 'Sevalla',  bold: true },
          'Persistent container pods',
          { text: 'No limit (always-on)',   color: GREEN, bold: true },
          { text: 'No limit',        color: GREEN },
          { text: '✓  Excellent — zero timeout constraints', color: GREEN },
        ],
        [
          { text: 'Render',   bold: true },
          'Persistent web services',
          { text: 'No limit (spins down idle)',  color: AMBER, bold: true },
          { text: 'No limit',        color: GREEN },
          { text: '✓  Good — upgrade Starter to avoid spin-down', color: '155724' },
        ],
      ], [14, 26, 16, 16, 28]),

      spacer(8),

      // ── 3. Key Facts ──────────────────────────────────────────────────────
      h1('3.  Key Facts Per Platform'),
      spacer(4),

      h2('Netlify  (current hosting)'),
      bullet('Free sync timeout: 10 seconds. Pro sync timeout: 26 seconds.'),
      bullet('Background functions available on all plans — run up to 15 minutes asynchronously.'),
      bullet('Workaround exists: use background functions + Supabase + client polling — but adds 2–3 weeks of dev and degrades UX (no live streaming, user waits behind a spinner).'),
      bullet('Streaming functions still capped at 10 seconds — not suitable.'),
      bullet('Best kept for: static site, contact forms (Netlify Forms), CI/CD.'),
      spacer(6),

      h2('Vercel  (recommended — free tier)'),
      bullet('Hobby (free) with Fluid Compute: 300-second timeout. Pro: 800 seconds.'),
      bullet('Fluid Compute is enabled by default — no configuration needed.'),
      bullet('Native AI SDK (@ai-sdk/anthropic) — streams Claude tokens directly to the client in real time.'),
      bullet('AI Gateway: caches LLM responses, rate-limits, provider switching without code changes.'),
      bullet('Zero extra cost to try — deploy the financial analysis function as a Vercel API route today.'),
      spacer(6),

      h2('Sevalla  ($5/month)'),
      bullet('Container-based persistent hosting (Kinsta infrastructure). No platform timeout.'),
      bullet('You control timeouts: set Node.js server timeout to 180 seconds from your own code.'),
      bullet('Johannesburg data centre available — lowest latency for South African clients.'),
      bullet('Full Docker support: install Python, PDF parsers, OCR libraries alongside Node.js.'),
      bullet('SOC 2 Type 2, ISO 27001, GDPR, CCPA certified.'),
      bullet('25 global data centre locations; auto-scaling available.'),
      spacer(6),

      h2('Render  ($7/month Starter for always-on)'),
      bullet('Persistent web service — no timeout. Full SSH access to debug production issues.'),
      bullet('Free tier available but spins down after 15 min idle — unacceptable for LLM tools.'),
      bullet('Starter ($7/month): always-on, 512 MB RAM, suitable for single-user LLM workloads.'),
      bullet('Standard ($25/month): 2 GB RAM — handles concurrent multi-user analysis requests.'),
      bullet('Background Workers: dedicated async processing service — ideal for long document queues.'),
      bullet('Docker builds: full container support, same flexibility as Sevalla.'),

      spacer(4),

      // ── 4. Scoring ────────────────────────────────────────────────────────
      h1('4.  Suitability Scores for LLM Financial Analysis'),
      spacer(4),
      makeTable([
        ['Criterion',                          'Weight', 'Netlify', 'Vercel', 'Sevalla', 'Render'],
        ['Timeout — handles 35–120s queries',  '30%',    { text: '1/5', color: RED, bold: true, align: AlignmentType.CENTER },    { text: '5/5', color: GREEN, bold: true, align: AlignmentType.CENTER },   { text: '5/5', color: GREEN, bold: true, align: AlignmentType.CENTER },  { text: '5/5', color: GREEN, bold: true, align: AlignmentType.CENTER }],
        ['AI/LLM native tooling',              '20%',    { text: '1/5', color: RED, align: AlignmentType.CENTER },   { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '3/5', color: AMBER, align: AlignmentType.CENTER }, { text: '3/5', color: AMBER, align: AlignmentType.CENTER }],
        ['Streaming to client',                '15%',    { text: '2/5', color: RED, align: AlignmentType.CENTER },   { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '4/5', color: GREEN, align: AlignmentType.CENTER }, { text: '4/5', color: GREEN, align: AlignmentType.CENTER }],
        ['File upload + document processing',  '10%',    { text: '3/5', color: AMBER, align: AlignmentType.CENTER }, { text: '3/5', color: AMBER, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }],
        ['Cost at entry',                      '10%',    { text: '3/5', color: AMBER, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }],
        ['Africa region availability',         '5%',     { text: '1/5', color: RED, align: AlignmentType.CENTER },   { text: '1/5', color: RED, align: AlignmentType.CENTER },   { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '1/5', color: RED, align: AlignmentType.CENTER }],
        ['Cold start behaviour',               '5%',     { text: '4/5', color: GREEN, align: AlignmentType.CENTER }, { text: '4/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '2/5', color: RED, align: AlignmentType.CENTER }],
        ['Compliance (SOC2, GDPR)',            '5%',     { text: '4/5', color: GREEN, align: AlignmentType.CENTER }, { text: '4/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }, { text: '5/5', color: GREEN, align: AlignmentType.CENTER }],
        [
          { text: 'WEIGHTED TOTAL', bold: true },
          { text: '100%', bold: true, align: AlignmentType.CENTER },
          { text: '1.9 / 5', color: RED,   bold: true, fill: 'FEE2E2', align: AlignmentType.CENTER },
          { text: '4.7 / 5', color: GREEN, bold: true, fill: 'D1FAE5', align: AlignmentType.CENTER },
          { text: '4.7 / 5', color: GREEN, bold: true, fill: 'D1FAE5', align: AlignmentType.CENTER },
          { text: '4.1 / 5', color: '155724', bold: true, fill: 'D1FAE5', align: AlignmentType.CENTER },
        ],
      ], [32, 8, 15, 15, 15, 15]),

      spacer(8),

      // ── 5. Recommendations ───────────────────────────────────────────────
      h1('5.  Recommendations'),
      spacer(4),
      makeTable([
        ['Priority',  'Action',                                          'Cost',         'Effort'],
        [
          { text: '1 — NOW',    bold: true, color: GREEN },
          'Deploy financial analysis API as Vercel API routes (free Hobby plan, 300s timeout, AI SDK)',
          { text: 'Free',  color: GREEN, bold: true },
          'Low — 1–2 days',
        ],
        [
          { text: '2 — Soon',   bold: true, color: AMBER },
          'Evaluate Sevalla ($5/month) for dedicated LLM microservice — Johannesburg region, no timeout, Docker',
          '$5/month',
          'Medium — 3–5 days',
        ],
        [
          { text: '3 — Later',  bold: true, color: BLACK },
          'Migrate full backend to Render Standard ($25/mo) or Sevalla when multi-user concurrent analysis needed',
          '$7–25/month',
          'Medium — 1 week',
        ],
        [
          { text: '4 — Avoid',  bold: true, color: RED },
          'Do NOT build more LLM features on Netlify synchronous functions — timeout is a hard architectural limit',
          { text: 'N/A',   color: RED },
          { text: 'N/A',   color: RED },
        ],
      ], [12, 52, 12, 24]),

      spacer(8),
      note(
        'Current status: Netlify remains the right choice for static hosting, CI/CD, and Netlify Forms. ' +
        'Only LLM-backed API endpoints need to move. A hybrid Netlify (frontend) + Vercel (LLM API) ' +
        'architecture requires no migration of the main site and resolves the timeout problem immediately.'
      ),

      spacer(10),

      // ── 6. ZAR Cost Analysis ──────────────────────────────────────────────
      h1('6.  Monthly Cost in South African Rand (ZAR)'),
      spacer(4),
      para(
        'Exchange rate: $1 = R15.98  (XE mid-market, 23 February 2026). ' +
        'ZAR costs below are converted from USD list prices and are indicative — actual billing depends on ' +
        'the rate applied on your card\'s transaction date.',
        { size: 9.5, color: '555555', italic: true, spaceAfter: 6 }
      ),
      note(
        '⚠  SARS VAT on digital services: Foreign digital service providers that supply to South African ' +
        'recipients are required to charge or you are required to self-assess 15% VAT under the VAT Act ' +
        '(Section 6). The "+VAT" column below shows your actual effective monthly cost.'
      ),
      spacer(6),

      makeTable([
        ['Platform', 'Plan', 'USD/month', 'ZAR (excl. VAT)', 'ZAR (incl. 15% VAT)', 'LLM-capable?'],

        // Netlify
        [{ text: 'Netlify', bold: true }, 'Free',     '$0',   { text: 'R0',         color: GREEN, align: AlignmentType.CENTER }, { text: 'R0',           color: GREEN, align: AlignmentType.CENTER }, { text: '✗',  color: RED,   align: AlignmentType.CENTER }],
        [{ text: 'Netlify', bold: true }, 'Pro',      '$19',  { text: 'R303.62',    align: AlignmentType.CENTER }, { text: 'R349.16',      align: AlignmentType.CENTER }, { text: '✗',  color: RED,   align: AlignmentType.CENTER }],
        [{ text: 'Netlify', bold: true }, 'Business', '$99',  { text: 'R1 582.02',  color: AMBER, align: AlignmentType.CENTER }, { text: 'R1 819.32',    color: AMBER, align: AlignmentType.CENTER }, { text: '✗',  color: RED,   align: AlignmentType.CENTER }],

        // Vercel
        [{ text: 'Vercel',  bold: true }, 'Hobby (free)',  '$0',   { text: 'R0',         color: GREEN, align: AlignmentType.CENTER }, { text: 'R0',           color: GREEN, align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],
        [{ text: 'Vercel',  bold: true }, 'Pro',           '$20',  { text: 'R319.60',    align: AlignmentType.CENTER }, { text: 'R367.54',      align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],

        // Sevalla
        [{ text: 'Sevalla', bold: true }, 'Static site (free)',      '$0',   { text: 'R0',         color: GREEN, align: AlignmentType.CENTER }, { text: 'R0',           color: GREEN, align: AlignmentType.CENTER }, { text: 'N/A', color: AMBER, align: AlignmentType.CENTER }],
        [{ text: 'Sevalla', bold: true }, 'App — minimum',           '$5',   { text: 'R79.90',    color: GREEN, bold: true, align: AlignmentType.CENTER }, { text: 'R91.88',       color: GREEN, bold: true, align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],
        [{ text: 'Sevalla', bold: true }, 'App — standard workload', '$25',  { text: 'R399.50',    align: AlignmentType.CENTER }, { text: 'R459.43',      align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],

        // Render
        [{ text: 'Render',  bold: true }, 'Free (spins down)',  '$0',   { text: 'R0',         color: AMBER, align: AlignmentType.CENTER }, { text: 'R0',           color: AMBER, align: AlignmentType.CENTER }, { text: '⚠',  color: AMBER, align: AlignmentType.CENTER }],
        [{ text: 'Render',  bold: true }, 'Starter — always-on', '$7',  { text: 'R111.86',   color: GREEN, bold: true, align: AlignmentType.CENTER }, { text: 'R128.64',      color: GREEN, bold: true, align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],
        [{ text: 'Render',  bold: true }, 'Standard',            '$25', { text: 'R399.50',    align: AlignmentType.CENTER }, { text: 'R459.43',      align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],
        [{ text: 'Render',  bold: true }, 'Performance',         '$85', { text: 'R1 358.30',  color: AMBER, align: AlignmentType.CENTER }, { text: 'R1 562.05',    color: AMBER, align: AlignmentType.CENTER }, { text: '✓',  color: GREEN, align: AlignmentType.CENTER }],
      ], [14, 22, 10, 16, 20, 18]),

      spacer(8),

      h2('Cost Summary — LLM-capable tiers only'),
      spacer(4),
      makeTable([
        ['Platform',  'Cheapest LLM-capable plan', 'USD/month', 'ZAR incl. 15% VAT', 'Annual (ZAR incl. VAT)', 'Notes'],
        [
          { text: 'Vercel', bold: true },
          'Hobby (free)',
          { text: '$0',    color: GREEN, bold: true, align: AlignmentType.CENTER },
          { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },
          { text: 'R0',    color: GREEN, bold: true, align: AlignmentType.CENTER },
          'Start here — 300s free tier, AI SDK included',
        ],
        [
          { text: 'Sevalla', bold: true },
          'App — minimum',
          { text: '$5',   color: GREEN, bold: true, align: AlignmentType.CENTER },
          { text: 'R91.88',  color: GREEN, align: AlignmentType.CENTER },
          { text: 'R1 102.56', align: AlignmentType.CENTER },
          'Johannesburg DC, no timeout, Docker — best for prod',
        ],
        [
          { text: 'Render', bold: true },
          'Starter',
          { text: '$7',   color: GREEN, bold: true, align: AlignmentType.CENTER },
          { text: 'R128.64', align: AlignmentType.CENTER },
          { text: 'R1 543.68', align: AlignmentType.CENTER },
          'Always-on, SSH access, no timeout',
        ],
        [
          { text: 'Vercel', bold: true },
          'Pro',
          '$20',
          { text: 'R367.54', align: AlignmentType.CENTER },
          { text: 'R4 410.48', align: AlignmentType.CENTER },
          '800s timeout, advanced analytics, team features',
        ],
        [
          { text: 'Netlify', bold: true },
          'Pro (background fns only)',
          '$19',
          { text: 'R349.16', color: AMBER, align: AlignmentType.CENTER },
          { text: 'R4 189.92', color: AMBER, align: AlignmentType.CENTER },
          { text: 'Async workaround only — still no sync LLM streaming', color: AMBER, italic: false },
        ],
      ], [14, 26, 10, 18, 18, 14]),

      spacer(6),
      note(
        'Best value: Vercel Hobby (R0/month) for an immediate fix during development. ' +
        'Sevalla at R91.88/month (incl. VAT) is the most cost-effective always-on production option, ' +
        'with the added advantage of a Johannesburg data centre for South African client performance. ' +
        'Render Starter at R128.64/month is a straightforward runner-up with no cold start.',
        'D1FAE5', '16A34A'
      ),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buf);
console.log(`✅  Written: ${OUT}  (${(buf.byteLength / 1024).toFixed(1)} KB)`);
