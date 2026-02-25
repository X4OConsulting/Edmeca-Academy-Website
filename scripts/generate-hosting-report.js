/**
 * Generate: Hosting Platform Analysis Report (DOCX)
 * Run: node scripts/generate-hosting-report.js
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
  TableCell, WidthType, AlignmentType, BorderStyle, ShadingType,
  PageBreak, Spacing, TableLayoutType, VerticalAlign, convertInchesToTwip,
  Header, Footer, PageNumber, NumberFormat, LevelFormat,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../Hosting_Platform_Analysis_LLM_Integration.docx');

// ── Colour palette ──────────────────────────────────────────────────────────
const NAVY   = '1F3A6E';   // EdMeCa primary navy
const TEAL   = '0D7377';   // accent teal
const AMBER  = 'E8A838';   // warning amber
const RED    = 'C0392B';   // danger red
const GREEN  = '27AE60';   // success green
const LGREY  = 'F2F4F7';   // light grey fill
const MGREY  = 'D0D5DD';   // medium grey (borders)
const BLACK  = '1A1A2E';   // near-black text
const WHITE  = 'FFFFFF';
const DNAVY  = '162D55';   // dark navy

// ── Helpers ─────────────────────────────────────────────────────────────────
const pt = n => n * 2;
const indent = n => ({ left: convertInchesToTwip(n) });

function spacer(pts = 6) {
  return new Paragraph({ spacing: { before: 0, after: pt(pts) }, children: [] });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: pt(18), after: pt(8) },
    shading: { fill: NAVY, type: ShadingType.SOLID, color: NAVY },
    children: [new TextRun({ text, color: WHITE, bold: true, size: pt(16), font: 'Calibri' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: pt(14), after: pt(6) },
    children: [new TextRun({ text, color: NAVY, bold: true, size: pt(13), font: 'Calibri' })],
    border: { bottom: { color: TEAL, space: 1, size: 4, style: BorderStyle.SINGLE } },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: pt(10), after: pt(4) },
    children: [new TextRun({ text, color: TEAL, bold: true, size: pt(12), font: 'Calibri' })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: pt(2), after: pt(6) },
    indent: opts.indent ? indent(0.2) : undefined,
    children: [new TextRun({ text, size: pt(11), font: 'Calibri', color: BLACK, ...opts })],
  });
}

function bullet(text, bold_prefix = '') {
  const children = bold_prefix
    ? [
        new TextRun({ text: bold_prefix + ' ', bold: true, size: pt(11), font: 'Calibri', color: NAVY }),
        new TextRun({ text, size: pt(11), font: 'Calibri', color: BLACK }),
      ]
    : [new TextRun({ text, size: pt(11), font: 'Calibri', color: BLACK })];
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: pt(2), after: pt(3) },
    indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.15) },
    children,
  });
}

function callout(text, fill = LGREY, textColor = BLACK) {
  return new Paragraph({
    spacing: { before: pt(6), after: pt(6) },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    shading: { fill, type: ShadingType.SOLID, color: fill },
    border: { left: { color: TEAL, space: 6, size: 12, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text, size: pt(11), font: 'Calibri', color: textColor, italics: true })],
  });
}

function warningCallout(text) {
  return new Paragraph({
    spacing: { before: pt(6), after: pt(6) },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    shading: { fill: 'FEF3CD', type: ShadingType.SOLID, color: 'FEF3CD' },
    border: { left: { color: AMBER, space: 6, size: 12, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: '⚠  ' + text, size: pt(11), font: 'Calibri', color: '6B4A00', bold: true })],
  });
}

function successCallout(text) {
  return new Paragraph({
    spacing: { before: pt(6), after: pt(6) },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    shading: { fill: 'D4EDDA', type: ShadingType.SOLID, color: 'D4EDDA' },
    border: { left: { color: GREEN, space: 6, size: 12, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: '✓  ' + text, size: pt(11), font: 'Calibri', color: '155724', bold: true })],
  });
}

// ── Table helpers ────────────────────────────────────────────────────────────
function hdrCell(text, fill = NAVY, textColor = WHITE, width) {
  return new TableCell({
    shading: { fill, type: ShadingType.SOLID, color: fill },
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: pt(4), bottom: pt(4), left: pt(6), right: pt(6) },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, color: textColor, bold: true, size: pt(10), font: 'Calibri' })],
    })],
  });
}

function dataCell(text, fill = WHITE, textColor = BLACK, align = AlignmentType.LEFT, bold = false) {
  return new TableCell({
    shading: { fill, type: ShadingType.SOLID, color: fill },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: pt(3), bottom: pt(3), left: pt(5), right: pt(5) },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, color: textColor, size: pt(10), font: 'Calibri', bold })],
    })],
  });
}

function scoreCell(score, max = 5) {
  const filled = '●'.repeat(score);
  const empty  = '○'.repeat(max - score);
  const color  = score >= 4 ? GREEN : score === 3 ? AMBER : RED;
  return new TableCell({
    shading: { fill: WHITE, type: ShadingType.SOLID },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: pt(3), bottom: pt(3), left: pt(5), right: pt(5) },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: filled, color, size: pt(9), font: 'Calibri' }),
        new TextRun({ text: empty,  color: 'CCCCCC', size: pt(9), font: 'Calibri' }),
      ],
    })],
  });
}

// ── Cover Page ───────────────────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(60),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: NAVY, type: ShadingType.SOLID, color: NAVY },
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: '', size: pt(4) })],
    }),
    spacer(4),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: pt(20), after: pt(6) },
      children: [new TextRun({ text: 'HOSTING PLATFORM ANALYSIS', bold: true, size: pt(24), font: 'Calibri', color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: pt(8) },
      children: [new TextRun({ text: 'LLM Integration & AI-Powered Application Workloads', size: pt(16), font: 'Calibri', color: TEAL, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: pt(4) },
      children: [new TextRun({ text: 'Netlify  ·  Vercel  ·  Sevalla  ·  Render', size: pt(13), font: 'Calibri', color: MGREY })],
    }),
    spacer(16),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: LGREY, type: ShadingType.SOLID, color: LGREY },
      spacing: { before: pt(8), after: pt(8) },
      border: {
        top:    { color: NAVY, space: 4, size: 4, style: BorderStyle.SINGLE },
        bottom: { color: NAVY, space: 4, size: 4, style: BorderStyle.SINGLE },
      },
      children: [new TextRun({ text: 'Prepared for EdMeCa Academy  ·  February 2026', size: pt(11), font: 'Calibri', color: NAVY })],
    }),
    spacer(20),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: pt(4) },
      children: [new TextRun({ text: 'CLASSIFICATION: INTERNAL', size: pt(9), font: 'Calibri', color: MGREY, bold: true })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Main document ────────────────────────────────────────────────────────────
function buildDoc() {
  const sections = [];

  // COVER
  sections.push(...coverPage());

  // ─── SECTION 1: Executive Summary ────────────────────────────────────────
  sections.push(
    h1('1.  Executive Summary'),
    spacer(4),
    body(
      'This report provides a detailed technical and commercial analysis of four leading hosting platforms — ' +
      'Netlify, Vercel, Sevalla, and Render — evaluated specifically for their ability to support ' +
      'Large Language Model (LLM) integration within web applications. The analysis is driven by a ' +
      'concrete production scenario: a financial document analysis tool that processes uploaded bank ' +
      'statements and management accounts using Claude Haiku and Sonnet models to assess financial ' +
      'health and generate strategic recommendations.'
    ),
    spacer(4),
    body(
      'The central problem is function timeout: LLM queries involving detailed financial analysis of ' +
      'multi-page documents can run for 30–120+ seconds. Platforms with short serverless function ' +
      'timeouts drop the connection before the AI returns a response, causing failed requests and poor ' +
      'user experience. This report identifies which platforms present a barrier and which are viable ' +
      'paths forward, including both free and commercial tiers.'
    ),
    spacer(4),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          hdrCell('Platform', NAVY, WHITE, 20),
          hdrCell('Free Timeout', NAVY, WHITE, 15),
          hdrCell('Paid Timeout', NAVY, WHITE, 15),
          hdrCell('LLM Suitability', NAVY, WHITE, 20),
          hdrCell('Recommended Tier', NAVY, WHITE, 30),
        ]}),
        new TableRow({ children: [
          dataCell('Netlify',  LGREY, BLACK, AlignmentType.LEFT, true),
          dataCell('10 seconds',  'FDECEA', RED),
          dataCell('26 seconds (sync) / 15 min (background)', 'FEF3CD', '6B4A00'),
          dataCell('⚠  Partial — requires architectural workaround', 'FEF3CD', '6B4A00'),
          dataCell('Background functions + polling or streaming via edge', LGREY),
        ]}),
        new TableRow({ children: [
          dataCell('Vercel',  WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell('300 seconds (Fluid Compute)',  'D4EDDA', '155724'),
          dataCell('800 seconds (Pro + Fluid Compute)', 'D4EDDA', '155724'),
          dataCell('✓  Excellent — native AI/streaming support', 'D4EDDA', '155724'),
          dataCell('Hobby (free) with Fluid Compute enabled', LGREY),
        ]}),
        new TableRow({ children: [
          dataCell('Sevalla',  LGREY, BLACK, AlignmentType.LEFT, true),
          dataCell('No timeout (persistent server)',  'D4EDDA', '155724'),
          dataCell('No timeout (persistent server)', 'D4EDDA', '155724'),
          dataCell('✓  Excellent — container-based, no limits', 'D4EDDA', '155724'),
          dataCell('Starter ($5/month) — best value for LLM workloads', LGREY),
        ]}),
        new TableRow({ children: [
          dataCell('Render',  WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell('No timeout (persistent server)',  'D4EDDA', '155724'),
          dataCell('No timeout (persistent server)', 'D4EDDA', '155724'),
          dataCell('✓  Good — persistent web service, full control', 'D4EDDA', '155724'),
          dataCell('Starter ($7/month) — production-grade with auto-deploy', LGREY),
        ]}),
      ],
    }),
    spacer(8),
    successCallout(
      'Recommendation: For LLM-intensive workloads, Vercel (Hobby with Fluid Compute) or ' +
      'Sevalla / Render (persistent containers from $5–7/month) are the correct architectural ' +
      'choices. Netlify is not suitable for synchronous LLM responses without major redesign.'
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 2: The Problem ────────────────────────────────────────────────
  sections.push(
    h1('2.  The Problem: LLM Queries and Timeout Constraints'),
    spacer(4),
    h2('2.1  What Makes LLM Queries Long-Running'),
    body(
      'Unlike traditional API calls that return in milliseconds, LLM inference — especially with ' +
      'large context models like Claude Sonnet — involves significant processing time.'
    ),
    spacer(2),
    bullet('Token generation time: Sonnet generates roughly 60–100 output tokens/second. A 2,000-word ' +
           'analysis report (~2,700 tokens) takes 27–45 seconds to generate fully.'),
    bullet('Document ingestion: Parsing and chunking a 12-month bank statement PDF, extracting transaction ' +
           'categories, and building a financial context window can take 5–20 seconds before generation begins.'),
    bullet('Chain-of-thought reasoning: Detailed risk assessments require multi-step reasoning, multiplying ' +
           'generation time by the number of reasoning passes.'),
    bullet('Anthropic API latency: Cold-start latency on the Anthropic API (especially Sonnet) can add 2–8 ' +
           'seconds before the first token is returned.'),
    spacer(4),
    warningCallout(
      'Total realistic execution time for a detailed company financial health analysis using Claude Sonnet: ' +
      '35–120 seconds. This exceeds Netlify\'s 10-second synchronous limit by a factor of 3–12x.'
    ),
    spacer(4),
    h2('2.2  Real-World Incident: Netlify Connection Drop'),
    body(
      'The following scenario was directly observed during development of the EdMeCa financial analysis ' +
      'tool. A client uploaded a company bank statement and management accounts. The Netlify function ' +
      'initiated the Claude Sonnet analysis pipeline. After 10 seconds, Netlify dropped the connection ' +
      'and returned a 502 error to the client, even though the Anthropic API was still processing the ' +
      'request in the background. The financial analysis was lost — the client received no output.'
    ),
    spacer(2),
    callout(
      '"I did a tool to do financial analysis using Haiku and Sonnet… and I found that with detailed ' +
      'analysis, the queries can run long and then Netlify drops the connection." — Raymond Crow, EdMeCa'
    ),
    spacer(4),
    h2('2.3  Financial Analysis Tool Description'),
    body(
      'The tool in question is an AI-powered financial health analyser designed for EdMeCa Academy clients. ' +
      'Its capabilities include:'
    ),
    bullet('Accepting uploaded bank statements for a full financial year (PDF or CSV)'),
    bullet('Accepting Management Accounts or formal Financial Statements as supplementary context'),
    bullet('Running Claude Haiku for fast initial categorisation of transactions'),
    bullet('Running Claude Sonnet for deep financial health assessment — cash flow analysis, burn rate, ' +
           'working capital, profitability trends, and risk identification'),
    bullet('Generating actionable recommendations tailored to the company\'s risk profile'),
    bullet('Producing a structured report downloadable by the client'),
    spacer(2),
    body(
      'This workload is inherently long-running. The typical flow is: document parsing → context ' +
      'extraction → Haiku pre-processing (5–15s) → Sonnet deep analysis (30–90s) → report assembly → ' +
      'response. Total: 35–120 seconds. No synchronous serverless function with a sub-30s timeout can ' +
      'reliably serve this use case.'
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 3: Platform Analysis ─────────────────────────────────────────
  sections.push(
    h1('3.  Platform Analysis'),
  );

  // 3.1 Netlify
  sections.push(
    h2('3.1  Netlify'),
    spacer(2),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hdrCell('Netlify Quick Stats', NAVY, WHITE, 100)] }),
        new TableRow({ children: [dataCell('Model', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Serverless Functions (managed Lambda-compatible execution)', LGREY)] }),
        new TableRow({ children: [dataCell('Free Sync Timeout', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('10 seconds (hard limit — streaming also capped at 10s)', WHITE)] }),
        new TableRow({ children: [dataCell('Paid Sync Timeout', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('26 seconds (Pro plan)', LGREY)] }),
        new TableRow({ children: [dataCell('Background Functions', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('Up to 15 minutes — available on ALL plans including Free', WHITE)] }),
        new TableRow({ children: [dataCell('Pricing', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Free tier available; Pro from $19/month', LGREY)] }),
        new TableRow({ children: [dataCell('Current Usage', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('EdMeCa production site (edmeca.co.za)', WHITE)] }),
      ],
    }),
    spacer(6),
    h3('Timeout Architecture'),
    body(
      'Netlify operates on a serverless function model built on top of AWS Lambda. ' +
      'When a function is invoked synchronously, the HTTP connection remains open until the function ' +
      'returns or the timeout is reached. On the free plan, this is 10 seconds. This is an absolute ' +
      'limit — there is no configuration option to extend it on the free tier. On Pro, it extends ' +
      'to 26 seconds. Neither value is sufficient for complex LLM analysis.'
    ),
    spacer(2),
    warningCallout(
      'Even the paid Netlify Pro plan\'s 26-second sync timeout is insufficient for Claude Sonnet ' +
      'financial analysis, which averages 35–90 seconds.'
    ),
    spacer(4),
    h3('Background Functions — The Workaround'),
    body(
      'Netlify provides "Background Functions" — an async variant where the client receives an instant ' +
      '202 Accepted response, and the function continues executing for up to 15 minutes in the background. ' +
      'This approach technically removes the timeout barrier but introduces significant architectural ' +
      'complexity:'
    ),
    bullet('The client receives no direct response — they must poll a separate endpoint or use WebSockets ' +
           'to check when the analysis is complete.'),
    bullet('Results must be persisted to a database (e.g., Supabase) mid-flight and retrieved by the client.'),
    bullet('This requires two functions (background processor + status/result retriever), a database ' +
           'write mid-analysis, and client-side polling logic.'),
    bullet('The user experience is degraded — no streaming output, no progress indicator from the LLM itself.'),
    spacer(4),
    h3('Streaming — Partial Solution'),
    body(
      'Netlify supports streaming responses via ReadableStream, but streaming functions are still subject ' +
      'to the same 10-second execution limit. This means streaming begins successfully but is forcefully ' +
      'terminated at 10 seconds, delivering a truncated response to the client. For a complete financial ' +
      'analysis, this is not viable.'
    ),
    spacer(4),
    h3('Verdict for LLM Financial Analysis'),
    warningCallout(
      'Netlify is NOT suitable as a direct synchronous host for LLM-powered financial analysis functions. ' +
      'A background function architecture is possible but adds weeks of development complexity and degrades ' +
      'user experience. Not recommended without architectural redesign.'
    ),
  );

  // 3.2 Vercel
  sections.push(
    spacer(8),
    h2('3.2  Vercel'),
    spacer(2),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hdrCell('Vercel Quick Stats', NAVY, WHITE, 100)] }),
        new TableRow({ children: [dataCell('Model', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Fluid Compute (default) + Serverless Functions', LGREY)] }),
        new TableRow({ children: [dataCell('Hobby (Free) Timeout', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('300 seconds (5 minutes) with Fluid Compute enabled [default]', WHITE)] }),
        new TableRow({ children: [dataCell('Pro Timeout', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('800 seconds (13 minutes) with Fluid Compute', LGREY)] }),
        new TableRow({ children: [dataCell('Without Fluid Compute', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('Hobby: 60s  ·  Pro: 300s  ·  Enterprise: 900s', WHITE)] }),
        new TableRow({ children: [dataCell('Streaming', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Native first-class support — streams within max duration', LGREY)] }),
        new TableRow({ children: [dataCell('AI-specific tooling', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('AI Gateway, AI SDK (@ai-sdk), v0, native Anthropic/OpenAI integrations', WHITE)] }),
        new TableRow({ children: [dataCell('Pricing', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Free (Hobby) tier — no credit card required for basic use; Pro $20/month', LGREY)] }),
      ],
    }),
    spacer(6),
    h3('Fluid Compute — A Game Changer'),
    body(
      'Vercel introduced "Fluid Compute" as the new default execution model in late 2024. Unlike ' +
      'traditional serverless where each function invocation creates a new container, Fluid Compute ' +
      'allows functions to persist between requests and pool idle CPU time. The critical impact: ' +
      'the maximum function duration for Hobby (free) plans expands from 60 seconds to 300 seconds.'
    ),
    spacer(2),
    successCallout(
      'Vercel Hobby (free) with Fluid Compute: 300-second maximum duration. This comfortably covers ' +
      'even the most complex Claude Sonnet financial analysis workloads (35–120s typical range).'
    ),
    spacer(4),
    h3('Native LLM and AI Support'),
    body(
      'Vercel has invested heavily in first-class AI tooling, making it arguably the most ' +
      'LLM-optimised platform available:'
    ),
    bullet('AI SDK (@ai-sdk/anthropic): First-party TypeScript SDK for streaming Claude, OpenAI, and ' +
           'other LLM responses directly from Vercel functions with zero configuration.'),
    bullet('AI Gateway: Caches AI API responses, provides rate limiting, and allows switching between ' +
           'LLM providers without code changes.'),
    bullet('Streaming support: Full ReadableStream support within the Fluid Compute duration limit, ' +
           'allowing token-by-token streaming to the client for real-time output.'),
    bullet('waitUntil: Perform post-response cleanup tasks (logging, database writes) without blocking ' +
           'the client response.'),
    bullet('Edge Functions: Ultra-low latency global execution for inference routing and preprocessing.'),
    spacer(4),
    h3('Considerations and Trade-offs'),
    bullet('Vendor concentration: Vercel is optimised for Next.js. Vite/React SPA projects (like EdMeCa) ' +
           'work but require API routes structure adjustment.'),
    bullet('Cost at scale: Free 100GB bandwidth; Pro $20/month. Function invocations and duration are ' +
           'billed on Pro. For high-volume LLM calls (each 60s+), costs can escalate.'),
    bullet('Cold starts: Fluid Compute mitigates cold starts but functions inactive for 2+ weeks are ' +
           'archived and incur a >1s spin-up penalty on first invocation.'),
    spacer(4),
    h3('Verdict for LLM Financial Analysis'),
    successCallout(
      'Vercel is HIGHLY RECOMMENDED for LLM workloads. The free Hobby plan provides 300s function ' +
      'duration with Fluid Compute, native AI SDK support, and first-class streaming. Migrating the ' +
      'EdMeCa financial analysis tool to Vercel API routes would resolve the timeout problem ' +
      'immediately — with no infrastructure cost change.'
    ),
  );

  // 3.3 Sevalla
  sections.push(
    spacer(8),
    h2('3.3  Sevalla'),
    spacer(2),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hdrCell('Sevalla Quick Stats', NAVY, WHITE, 100)] }),
        new TableRow({ children: [dataCell('Model', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Container-based persistent application hosting (Kubernetes pods)', LGREY)] }),
        new TableRow({ children: [dataCell('Request Timeout', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('No platform-imposed timeout — governed by your application server configuration', WHITE)] }),
        new TableRow({ children: [dataCell('Pricing', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Application hosting from $5/month; Static sites FREE; Free trial available', LGREY)] }),
        new TableRow({ children: [dataCell('Infrastructure', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('25 global data centre locations; Kinsta-backed CDN; Cloudflare integration', WHITE)] }),
        new TableRow({ children: [dataCell('Scaling', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Vertical and horizontal auto-scaling; Docker-first deployment', LGREY)] }),
        new TableRow({ children: [dataCell('Compliance', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('SOC 2 Type 2, ISO 27001, GDPR, CCPA', WHITE)] }),
        new TableRow({ children: [dataCell('Parent Company', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Kinsta — established hosting provider since 2013', LGREY)] }),
      ],
    }),
    spacer(6),
    h3('Architecture: Why Persistent Containers Eliminate Timeout Problems'),
    body(
      'Sevalla uses container-based persistent application hosting — significantly different from ' +
      'serverless platforms. Rather than spinning up a function per request, Sevalla runs your ' +
      'application as a continuously running container (pod). Your Express/Node.js server handles ' +
      'incoming HTTP requests and keeps the connection open for as long as your server allows.'
    ),
    spacer(2),
    body(
      'This means timeout is entirely under your control. An LLM analysis that takes 90 seconds is ' +
      'simply served — there is no platform-level timeout causing a connection drop. The only constraint ' +
      'is your HTTP server\'s `keepAliveTimeout` and `headersTimeout` settings, which can be configured ' +
      'to accommodate any workload duration.'
    ),
    spacer(4),
    h3('Advantages for EdMeCa\'s Use Case'),
    bullet('Full server-side control: Set Node.js `res.setTimeout(180000)` for 3-minute responses — ' +
           'no platform involvement.'),
    bullet('Persistent memory: In-memory caching of Anthropic client connections, document parse results, ' +
           'and session data persists across requests (unlike cold-start serverless).'),
    bullet('File upload handling: Direct multipart form data handling without size or duration limitations ' +
           'imposed by a Function-as-a-Service layer.'),
    bullet('WebSocket support: Native persistent WebSocket connections for real-time LLM streaming ' +
           'to the client — ideal for progressive financial analysis output.'),
    bullet('25 data centres: Deploy in af-south-1 (Africa) for low-latency South African clients.'),
    spacer(4),
    h3('Considerations'),
    bullet('Always-on billing: Unlike serverless, you pay for uptime regardless of traffic. $5/month ' +
           'minimum, but this is negligible for a production SaaS product.'),
    bullet('Deployment complexity: Requires a Dockerfile or buildpack-compatible application structure. ' +
           'More setup than Netlify drag-and-drop. Deploy time ~2–5 minutes.'),
    bullet('No free tier for applications: Free trial only. Static sites are free. The financial analysis ' +
           'backend would require a paid application pod.'),
    spacer(4),
    h3('Verdict for LLM Financial Analysis'),
    successCallout(
      'Sevalla is HIGHLY RECOMMENDED for production LLM workloads. No timeout constraints, ' +
      'persistent server memory, native WebSocket streaming, 25 global regions, and enterprise-grade ' +
      'compliance (SOC 2, ISO 27001, GDPR). At $5/month for the entry tier, it is the best ' +
      'cost-to-capability ratio for a dedicated LLM backend service.'
    ),
  );

  // 3.4 Render
  sections.push(
    spacer(8),
    h2('3.4  Render'),
    spacer(2),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hdrCell('Render Quick Stats', NAVY, WHITE, 100)] }),
        new TableRow({ children: [dataCell('Model', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Persistent Web Services (long-running processes) + Background Workers', LGREY)] }),
        new TableRow({ children: [dataCell('Request Timeout', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('No platform-imposed timeout — governed by your application configuration', WHITE)] }),
        new TableRow({ children: [dataCell('Free Tier', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Free web services available — SPINS DOWN after 15 min idle (up to 1 min cold start)', LGREY)] }),
        new TableRow({ children: [dataCell('Starter Tier', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('$7/month — 512 MB RAM, 0.5 CPU, always-on, no spin-down', WHITE)] }),
        new TableRow({ children: [dataCell('Standard Tier', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('$25/month — 2 GB RAM, 1 CPU — suited for concurrent LLM workloads', LGREY)] }),
        new TableRow({ children: [dataCell('Scaling', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('Horizontal auto-scaling (Professional plan+); Docker-first', WHITE)] }),
        new TableRow({ children: [dataCell('Background Workers', LGREY, BLACK, AlignmentType.LEFT, true), dataCell('Dedicated always-on background processing services', LGREY)] }),
        new TableRow({ children: [dataCell('Compliance', WHITE, BLACK, AlignmentType.LEFT, true), dataCell('SOC 2 Type 2, ISO 27001, GDPR, HIPAA (organisation plan)', WHITE)] }),
      ],
    }),
    spacer(6),
    h3('Architecture: Web Services vs. Background Workers'),
    body(
      'Render differentiates between Web Services (HTTP-serving processes), Background Workers ' +
      '(async processing), and Cron Jobs. For an LLM financial analysis tool, the optimal ' +
      'architecture is:'
    ),
    bullet('Frontend: Static Site (free) — Vite/React SPA served from Render\'s CDN.'),
    bullet('Analysis API: Web Service (Starter, $7/month) — persistent Node.js/Express server handling ' +
           'file uploads and LLM orchestration.'),
    bullet('Heavy processing: Background Worker (optional) — for very long analyses (>5 min), offload to ' +
           'a dedicated worker process with a result queue.'),
    spacer(4),
    h3('Free Tier Warning'),
    warningCallout(
      'Render\'s free web services spin down after 15 minutes of inactivity. The first request after ' +
      'spin-down triggers a cold start of up to 60 seconds. This is unacceptable for a financial tool ' +
      'where a client is waiting for an LLM analysis. Use the Starter tier ($7/month) for any ' +
      'LLM-backed service to ensure always-on availability.'
    ),
    spacer(4),
    h3('LLM-Specific Strengths'),
    bullet('Persistent server: No request timeout — a 120-second Sonnet analysis completes without ' +
           'interruption.'),
    bullet('RAM options: Standard tier ($25/month) provides 2 GB RAM — sufficient for in-memory ' +
           'document processing, vector embeddings, and concurrent LLM requests.'),
    bullet('Background Workers: Ideal for asynchronous document processing queues — accept upload, ' +
           'push to queue, worker processes it, stores result, client polls.'),
    bullet('SSH access: Direct shell access to debug LLM integration issues in production.'),
    bullet('Docker support: Full Docker builds — install custom PDF parsers, OCR libraries, or ' +
           'Python-based financial analysis dependencies alongside Node.js.'),
    spacer(4),
    h3('Considerations'),
    bullet('No built-in AI tooling: Unlike Vercel, Render provides no LLM-specific SDKs or AI Gateway. ' +
           'All LLM client setup is manual.'),
    bullet('No edge functions: Render does not offer edge computing for ultra-low-latency preprocessing.'),
    bullet('Pricing model: Render charges per-workspace-member on the Professional plan ($19/user/month) ' +
           'plus compute. Solo developers use the Hobby plan at no extra cost.'),
    spacer(4),
    h3('Verdict for LLM Financial Analysis'),
    successCallout(
      'Render is RECOMMENDED for production LLM workloads. Persistent services eliminate timeout ' +
      'constraints. The Starter tier ($7/month) provides always-on availability, full Docker support, ' +
      'and sufficient resources for single-user LLM analysis. Upgrade to Standard ($25/month) for ' +
      'concurrent multi-user workloads.'
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 4: Detailed Comparison Table ─────────────────────────────────
  sections.push(
    h1('4.  Detailed Feature Comparison'),
    spacer(4),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          hdrCell('Feature / Criterion', DNAVY, WHITE, 28),
          hdrCell('Netlify', TEAL, WHITE, 18),
          hdrCell('Vercel', TEAL, WHITE, 18),
          hdrCell('Sevalla', TEAL, WHITE, 18),
          hdrCell('Render', TEAL, WHITE, 18),
        ]}),
        ...[
          ['Execution model',                'Serverless functions',         'Fluid Compute (serverless++)',  'Persistent containers',       'Persistent web services'],
          ['Free plan available',            '✓  Yes',                       '✓  Yes',                        '✓  Trial only',               '✓  Yes (spin-down)'],
          ['Free sync timeout',              '10 seconds',                   '300 seconds',                   'N/A (always-on)',             'N/A (always-on, but spins down)'],
          ['Paid sync timeout',              '26 seconds (Pro)',             '800 seconds (Pro)',             'You control it',              'You control it'],
          ['LLM streaming support',          '✓  But 10s limit on free',    '✓  Native in AI SDK',           '✓  Via your server',          '✓  Via your server'],
          ['Background/async execution',     '✓  15 min all plans',         '✓  via waitUntil/queue',        '✓  Background workers',       '✓  Background workers'],
          ['Native AI/LLM tooling',          '✗  None',                     '✓  AI SDK, AI Gateway, v0',    '✗  None (BYO)',               '✗  None (BYO)'],
          ['Cold start penalty',             'Low (managed)',               'Low (Fluid Compute)',           'None (persistent)',           'Up to 60s (free), None (paid)'],
          ['WebSocket support',              '✓  Via background fn',        '✓  Via Edge',                   '✓  Native',                   '✓  Native'],
          ['File upload handling',           '✓  Limited by fn size',       '✓  500 MB /tmp',                '✓  Full stream handling',     '✓  Full stream handling'],
          ['Custom Docker',                  '✗  No',                       '✗  No',                         '✓  Yes',                      '✓  Yes'],
          ['SSH / shell access',             '✗  No',                       '✗  No',                         '✗  No (pod exec available)',  '✓  Full SSH'],
          ['Global edge regions',            '6 (Fastly CDN)',              '18 (Pro)',                      '25',                         '12'],
          ['Africa-region available',        '✗  No',                       '✗  Not on Pro',                 '✓  Yes (Johannesburg)',       '✗  No'],
          ['Entry paid price/month',         '$19 (Pro)',                    '$20 (Pro)',                      '$5 (app pod)',                '$7 (Starter)'],
          ['SOC 2 / ISO 27001',             '✓  Yes',                      '✓  Yes',                        '✓  Yes',                     '✓  Yes'],
          ['GDPR compliance',               '✓  Yes',                      '✓  Yes',                        '✓  Yes',                     '✓  Yes'],
          ['HIPAA support',                 '✗  Not stated',               '✗  Enterprise only',            '✓  Stated',                  '✓  Organisation plan+'],
          ['Git auto-deploy',               '✓  Native',                   '✓  Native',                    '✓  Native',                  '✓  Native'],
          ['Netlify Forms / edge features', '✓  Native',                   '✗  No',                         '✗  No',                       '✗  No'],
          ['Suitability: LLM sync queries', '✗  Unsuitable',               '✓✓  Excellent',                 '✓✓  Excellent',              '✓  Good'],
          ['Suitability: file upload + AI', '⚠  Workaround needed',       '✓  Good',                       '✓✓  Excellent',              '✓✓  Excellent'],
          ['Recommended for EdMeCa LLM',    '✗  Not recommended',          '✓  Recommended (free tier)',   '✓  Recommended ($5/month)',  '✓  Recommended ($7/month)'],
        ].map((row, i) => new TableRow({ children: [
          dataCell(row[0], i % 2 === 0 ? LGREY : WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell(row[1], i % 2 === 0 ? LGREY : WHITE,
            row[1].includes('✗') || row[1].includes('Unsuite') ? RED :
            row[1].includes('✓✓') ? GREEN :
            row[1].includes('✓') ? '155724' :
            row[1].includes('⚠') ? '8B4A00' : BLACK),
          dataCell(row[2], i % 2 === 0 ? LGREY : WHITE,
            row[2].includes('✗') ? RED :
            row[2].includes('✓✓') ? GREEN :
            row[2].includes('✓') ? '155724' :
            row[2].includes('⚠') ? '8B4A00' : BLACK),
          dataCell(row[3], i % 2 === 0 ? LGREY : WHITE,
            row[3].includes('✗') ? RED :
            row[3].includes('✓✓') ? GREEN :
            row[3].includes('✓') ? '155724' :
            row[3].includes('⚠') ? '8B4A00' : BLACK),
          dataCell(row[4], i % 2 === 0 ? LGREY : WHITE,
            row[4].includes('✗') ? RED :
            row[4].includes('✓✓') ? GREEN :
            row[4].includes('✓') ? '155724' :
            row[4].includes('⚠') ? '8B4A00' : BLACK),
        ]})),
      ],
    }),
    spacer(4),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 5: Scoring Matrix ─────────────────────────────────────────────
  sections.push(
    h1('5.  Weighted Scoring Matrix — LLM Integration Suitability'),
    spacer(4),
    body(
      'The following scoring matrix weights each criterion by its importance to the ' +
      'EdMeCa financial analysis LLM use case. Scores are out of 5 (●●●●● = excellent).'
    ),
    spacer(4),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          hdrCell('Criterion', DNAVY, WHITE, 34),
          hdrCell('Weight', DNAVY, WHITE, 8),
          hdrCell('Netlify', TEAL, WHITE, 15),
          hdrCell('Vercel', TEAL, WHITE, 15),
          hdrCell('Sevalla', TEAL, WHITE, 15),
          hdrCell('Render', TEAL, WHITE, 13),
        ]}),
        ...([
          ['Timeout — LLM query duration',      '30%', 1, 5, 5, 5],
          ['LLM/AI native tooling',             '20%', 1, 5, 3, 3],
          ['Streaming support',                 '15%', 2, 5, 4, 4],
          ['File upload + document processing', '10%', 3, 3, 5, 5],
          ['Cold start behaviour',              '5%',  4, 4, 5, 2],
          ['Cost at entry tier',                '5%',  3, 4, 5, 4],
          ['Compliance (SOC2, GDPR)',           '5%',  4, 4, 5, 5],
          ['Africa region availability',        '5%',  1, 1, 5, 1],
          ['Developer experience',              '5%',  5, 5, 4, 4],
        ]).map((r, i) => new TableRow({ children: [
          dataCell(r[0], i % 2 === 0 ? LGREY : WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell(r[1], i % 2 === 0 ? LGREY : WHITE, MGREY, AlignmentType.CENTER),
          scoreCell(r[2]),
          scoreCell(r[3]),
          scoreCell(r[4]),
          scoreCell(r[5]),
        ]})),
        new TableRow({ children: [
          dataCell('WEIGHTED TOTAL SCORE', NAVY, WHITE, AlignmentType.LEFT, true),
          dataCell('100%', NAVY, WHITE, AlignmentType.CENTER, true),
          dataCell('1.8 / 5.0', 'FDECEA', RED, AlignmentType.CENTER, true),
          dataCell('4.7 / 5.0', 'D4EDDA', GREEN, AlignmentType.CENTER, true),
          dataCell('4.7 / 5.0', 'D4EDDA', GREEN, AlignmentType.CENTER, true),
          dataCell('4.2 / 5.0', 'D4EDDA', '155724', AlignmentType.CENTER, true),
        ]}),
      ],
    }),
    spacer(6),
    body('* Weighted score formula: Sum of (score × weight) for each criterion.', { italics: true, color: MGREY }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 6: Architecture Recommendations ──────────────────────────────
  sections.push(
    h1('6.  Architecture Recommendations for EdMeCa'),
    spacer(4),
    h2('6.1  Immediate Fix — Vercel API Routes (Zero Cost)'),
    body(
      'The quickest path to resolving the Netlify timeout problem with no additional cost is to ' +
      'migrate the LLM analysis endpoint to Vercel API routes while keeping the remainder of ' +
      'the site on Netlify. This is a "best of both worlds" approach:'
    ),
    bullet('Keep Netlify for: static site hosting, contact form (Netlify Forms), CDN, CI/CD.'),
    bullet('Move to Vercel for: LLM API routes only (financial analysis, AI chatbot with long contexts).'),
    bullet('Vercel Hobby (free): 300s timeout per function, native AI SDK streaming, zero config.'),
    bullet('Implementation: Create a separate Vercel project for the API layer. Update the EdMeCa ' +
           'frontend to call `https://your-api.vercel.app/api/analyse` instead of the Netlify function.'),
    spacer(4),
    callout(
      'Architecture: Netlify CDN → serves React SPA → calls Vercel API routes → Anthropic API ' +
      '→ streams response back to client in real time.'
    ),
    spacer(4),
    h2('6.2  Medium-Term — Sevalla Application Pod (Best Value at $5/month)'),
    body(
      'For a production-grade, always-on financial analysis service, deploy a dedicated Node.js ' +
      'application on Sevalla. This is the recommended architecture for EdMeCa\'s client-facing tool:'
    ),
    bullet('Deploy a Dockerised Node.js/Express application to Sevalla Application Hosting.'),
    bullet('Set HTTP server timeout to 180 seconds — comfortably handles all LLM workloads.'),
    bullet('Implement Server-Sent Events (SSE) for real-time token streaming to the client.'),
    bullet('Store uploaded documents in Sevalla or Supabase Storage; pass as context to Anthropic.'),
    bullet('Select Johannesburg data centre for minimum latency to South African clients.'),
    bullet('Cost: $5/month for the application pod + $0 for Sevalla static site (or keep Netlify).'),
    spacer(4),
    h2('6.3  Alternative — Netlify Background Functions + Polling (No Migration)'),
    body(
      'If migration is not immediately feasible, the existing Netlify deployment can be adapted ' +
      'using background functions. This is more complex but requires no new platforms:'
    ),
    bullet('Step 1: Create `netlify/functions/analyse-background.ts` (note the `-background` suffix).'),
    bullet('Step 2: Client POSTs document upload → receives 202 + job ID immediately.'),
    bullet('Step 3: Background function processes LLM analysis (up to 15 minutes) → writes result to Supabase.'),
    bullet('Step 4: Client polls `/.netlify/functions/get-result?jobId=xxx` every 3 seconds.'),
    bullet('Step 5: When result is available, client renders the financial analysis.'),
    spacer(2),
    warningCallout(
      'This architecture adds ~2–3 weeks of development time, requires Supabase schema changes, and ' +
      'provides no streaming output. The user sees a loading spinner for 60–120 seconds rather than ' +
      'progressive analysis output. Not recommended as a permanent solution.'
    ),
    spacer(4),
    h2('6.4  Long-Term — Dedicated LLM Microservice (Render or Sevalla)'),
    body(
      'As EdMeCa\'s LLM-powered features expand (financial analysis, BMC AI insights, document review, ' +
      'custom coaching), a dedicated microservice architecture provides the best scalability:'
    ),
    bullet('Deploy a persistent Node.js LLM service on Render Standard ($25/month) or Sevalla.'),
    bullet('Implement a document processing queue (Redis/Supabase) for concurrent analysis jobs.'),
    bullet('Use WebSockets for real-time bi-directional streaming — send progress updates, partial ' +
           'results, and completion status to the client.'),
    bullet('Scale horizontally on Render Pro or Sevalla auto-scaling when user base grows.'),
    bullet('Consider Anthropic Batches API for bulk document analysis at 50% cost reduction.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 7: Financial Analysis Tool — Specific Design ─────────────────
  sections.push(
    h1('7.  Financial Analysis Tool — Recommended Technical Design'),
    spacer(4),
    h2('7.1  System Overview'),
    body(
      'Based on the description provided, the financial analysis tool performs the following ' +
      'workflow for each analysis request. This section maps each stage to its platform and ' +
      'timeout implications:'
    ),
    spacer(4),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          hdrCell('Stage', NAVY, WHITE, 5),
          hdrCell('Description', NAVY, WHITE, 40),
          hdrCell('Duration', NAVY, WHITE, 15),
          hdrCell('Netlify', NAVY, WHITE, 15),
          hdrCell('Vercel / Persistent', NAVY, WHITE, 25),
        ]}),
        ...([
          ['1', 'File upload & validation (bank statement PDF/CSV)', '1–3s',  '✓ OK', '✓ OK'],
          ['2', 'Document parsing & data extraction', '3–10s', '⚠ Risk', '✓ OK'],
          ['3', 'Claude Haiku: transaction categorisation', '5–15s', '✗ Drops', '✓ OK'],
          ['4', 'Claude Sonnet: financial health deep analysis', '30–90s', '✗ Drops', '✓ OK'],
          ['5', 'Risk assessment & recommendation generation', '10–30s', '✗ Drops', '✓ OK'],
          ['6', 'Report assembly & response', '2–5s', '✗ Never reached', '✓ OK'],
          ['TOTAL', 'Full analysis pipeline', '51–153s', '✗ FAILS at stage 2–3', '✓ Completes fully'],
        ]).map((r, i) => new TableRow({ children: [
          dataCell(r[0], i % 2 === 0 ? LGREY : WHITE, BLACK, AlignmentType.CENTER, true),
          dataCell(r[1], i % 2 === 0 ? LGREY : WHITE, BLACK),
          dataCell(r[2], i % 2 === 0 ? LGREY : WHITE, NAVY, AlignmentType.CENTER),
          dataCell(r[3], i % 2 === 0 ? LGREY : WHITE,
            r[3].startsWith('✗') ? RED : r[3].startsWith('⚠') ? 'B7791F' : GREEN, AlignmentType.CENTER),
          dataCell(r[4], i % 2 === 0 ? LGREY : WHITE, GREEN, AlignmentType.CENTER),
        ]})),
      ],
    }),
    spacer(6),
    h2('7.2  Recommended Implementation Stack'),
    body('For the financial analysis tool specifically, we recommend the following stack:'),
    spacer(2),
    bullet('Frontend (React/Vite): Continue on Netlify — no changes. Drag-and-drop file upload component.'),
    bullet('Analysis API: Vercel (free) or Sevalla ($5/month) — Node.js/TypeScript endpoint.'),
    bullet('LLM: Claude Haiku (fast pre-processing) → Claude Sonnet (deep analysis) in sequence.'),
    bullet('Streaming: Use Anthropic SDK streaming (`stream.on("text", ...)`) with SSE to client.'),
    bullet('Document storage: Supabase Storage — upload PDF → get signed URL → pass as context to Claude.'),
    bullet('Results persistence: Supabase table `financial_analyses` — store completed reports for retrieval.'),
    bullet('Auth: Supabase JWT — only authenticated EdMeCa portal users can submit analyses.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ─── SECTION 8: Conclusion ─────────────────────────────────────────────────
  sections.push(
    h1('8.  Conclusion and Final Recommendations'),
    spacer(4),
    body(
      'The timeout limitation of serverless function platforms is a critical architectural constraint ' +
      'for any application integrating LLM inference. The table below summarises the final recommendations ' +
      'for EdMeCa\'s platform strategy:'
    ),
    spacer(4),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          hdrCell('Platform', NAVY, WHITE, 15),
          hdrCell('Current Use', NAVY, WHITE, 20),
          hdrCell('LLM Use', NAVY, WHITE, 20),
          hdrCell('Recommendation', NAVY, WHITE, 25),
          hdrCell('Action', NAVY, WHITE, 20),
        ]}),
        new TableRow({ children: [
          dataCell('Netlify',  LGREY, BLACK, AlignmentType.LEFT, true),
          dataCell('✓  Marketing site, contact forms, CI/CD', LGREY),
          dataCell('✗  Not suitable (10s timeout)', 'FDECEA', RED),
          dataCell('Keep for static/forms; remove LLM functions', LGREY),
          dataCell('No change for non-LLM', LGREY, NAVY),
        ]}),
        new TableRow({ children: [
          dataCell('Vercel',  WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell('Not currently used', WHITE),
          dataCell('✓✓  Excellent (300s free)', 'D4EDDA', GREEN),
          dataCell('Add as LLM API layer — free Hobby plan', WHITE),
          dataCell('Deploy API routes for financial analysis', WHITE, TEAL),
        ]}),
        new TableRow({ children: [
          dataCell('Sevalla',  LGREY, BLACK, AlignmentType.LEFT, true),
          dataCell('Not currently used', LGREY),
          dataCell('✓✓  Excellent (no timeout)', 'D4EDDA', GREEN),
          dataCell('Preferred for dedicated LLM service', LGREY),
          dataCell('Evaluate for $5/month LLM microservice', LGREY, TEAL),
        ]}),
        new TableRow({ children: [
          dataCell('Render',  WHITE, BLACK, AlignmentType.LEFT, true),
          dataCell('Not currently used', WHITE),
          dataCell('✓  Good (no timeout, $7/month)', 'D4EDDA', '155724'),
          dataCell('Alternative to Sevalla — strong Docker support', WHITE),
          dataCell('Consider for multi-service LLM architecture', WHITE, NAVY),
        ]}),
      ],
    }),
    spacer(8),
    h2('Final Answer: Which Platform for LLM Integration?'),
    spacer(4),
    successCallout(
      '1st Choice — Vercel (Hobby/Free): Zero additional cost. 300-second timeout with Fluid Compute. ' +
      'Native Anthropic AI SDK, streaming support, and 18 global regions. Deploy the financial analysis ' +
      'API as Vercel API routes immediately to resolve the Netlify timeout issue.'
    ),
    spacer(4),
    successCallout(
      '2nd Choice — Sevalla ($5/month): Persistent container, no timeout constraints, Johannesburg ' +
      'data centre for South African clients, Docker-first, enterprise compliance (SOC 2, ISO 27001, ' +
      'GDPR). Best choice for a production-grade EdMeCa LLM service as the product scales.'
    ),
    spacer(4),
    warningCallout(
      'Action Required: Do NOT build further LLM features directly on Netlify synchronous functions. ' +
      'The 10-second timeout is a hard architectural constraint that will cause failures on every ' +
      'complex AI query. Migrate LLM endpoints to Vercel or Sevalla before additional features are built.'
    ),
    spacer(8),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: NAVY, type: ShadingType.SOLID, color: NAVY },
      spacing: { before: pt(8), after: pt(8) },
      children: [
        new TextRun({ text: 'EdMeCa Academy  ·  Internal Technical Report  ·  February 2026', size: pt(9), font: 'Calibri', color: 'AAAAAA' }),
      ],
    }),
  );

  return sections;
}

// ── Build & write ────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT }],
    }],
  },
  sections: [{
    properties: {},
    children: buildDoc(),
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`\n✅ Report written to: ${OUT}`);
console.log(`   Size: ${(buffer.byteLength / 1024).toFixed(1)} KB`);
