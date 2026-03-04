/**
 * EDMECA Academy — Security Audit Report Generator
 * Produces a single unified, professional DOCX report for both
 * stakeholders and technical reviewers.
 *
 * Usage: node scripts/generate-security-report.mjs
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType,
  ImageRun, PageBreak, TableOfContents, StyleLevel, convertInchesToTwip,
  UnderlineType, Header, Footer, PageNumber, NumberFormat
} from 'docx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const LOGO_PATH  = path.join(ROOT, 'client', 'public', 'logo.png');
const OUT_DIR    = path.join(ROOT, 'deliverables', 'Phase-4-Testing');
const DATE_LONG  = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long',    year: 'numeric' });
const DATE_ISO   = new Date().toISOString().slice(0, 10);
const LOGO_BUF   = fs.readFileSync(LOGO_PATH);

// ─── Brand palette ───────────────────────────────────────────────────────────
const C = {
  navy:        '1F3A6E',
  navyDark:    '152848',
  navyLight:   'EEF2FB',
  gold:        'D4A017',
  white:       'FFFFFF',
  offWhite:    'F8F9FC',
  lightGrey:   'F1F3F7',
  midGrey:     'DDE2EC',
  darkGrey:    '4A5568',
  bodyText:    '1A202C',
  green:       '166534',
  greenBg:     'DCFCE7',
  amber:       '92400E',
  amberBg:     'FEF3C7',
  red:         '991B1B',
  redBg:       'FEE2E2',
  blue:        '1E40AF',
  blueBg:      'DBEAFE',
};

// ─── Size helpers ────────────────────────────────────────────────────────────
// docx ImageRun.transformation uses PIXELS (library converts to EMU internally)
// TableCell.margins, Paragraph.spacing, Paragraph.indent use TWIPS (1pt = 20 twip)
const PX  = (inches) => Math.round(inches * 96);  // inches → pixels (96dpi)
const TW  = (pts)    => Math.round(pts * 20);      // points → twips (cell margins, spacing)
const HF  = (n)      => n * 2;                     // pts → half-pts (font size)
// Alias kept for backward compat within this file
const PT  = TW;

// ─── Spacing helper ───────────────────────────────────────────────────────────
const sp = (before = 0, after = 120) => ({ spacing: { before, after, line: 276, lineRule: 'auto' } });

// ─── Table borders ────────────────────────────────────────────────────────────
const border = (color = C.midGrey, size = 4) => ({
  style: BorderStyle.SINGLE, size, color
});
const tableBorders = (outer = C.navy, inner = C.midGrey) => ({
  top:     border(outer, 8), bottom: border(outer, 8),
  left:    border(outer, 8), right:  border(outer, 8),
  insideH: border(inner, 4), insideV: border(inner, 4),
});
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const noTableBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };

// ─── Text constructors ────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({ text: String(text), ...opts });

const para = (children, paraOpts = {}) => {
  const runs = Array.isArray(children)
    ? children
    : [run(children, paraOpts.runOpts || {})];
  const { runOpts, ...rest } = paraOpts;
  return new Paragraph({ children: runs, ...sp(0, 120), ...rest });
};

const emptyLine = (pts = 120) => new Paragraph({ children: [run(' ')], spacing: { after: pts } });

const sectionHeading = (text) => new Paragraph({
  children: [
    run(text, { bold: true, size: HF(13), color: C.white, font: 'Calibri' })
  ],
  shading:   { type: ShadingType.SOLID, color: C.navy },
  alignment: AlignmentType.LEFT,
  spacing:   { before: 280, after: 0 },
  indent:    { left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
  heading:   HeadingLevel.HEADING_1,
});

const subHeading = (text, num = '') => new Paragraph({
  children: [
    run(num ? `${num}  ` : '', { bold: true, size: HF(11), color: C.gold, font: 'Calibri' }),
    run(text,  { bold: true, size: HF(11), color: C.navy,  font: 'Calibri' }),
  ],
  spacing:  { before: 240, after: 80 },
  border:   { bottom: border(C.midGrey, 4) },
  heading:  HeadingLevel.HEADING_2,
});

const bodyPara = (text, opts = {}) => new Paragraph({
  children: [run(text, { size: HF(10.5), color: C.bodyText, font: 'Calibri', ...opts })],
  ...sp(0, 100),
});

const bulletPara = (text, indent = 0) => new Paragraph({
  children: [run(text, { size: HF(10), color: C.bodyText, font: 'Calibri' })],
  bullet:   { level: indent },
  spacing:  { after: 60 },
});

// ─── Cell helpers ─────────────────────────────────────────────────────────────
const hCell = (text, w, color = C.navy, textColor = C.white) => new TableCell({
  width:   { size: w, type: WidthType.PERCENTAGE },
  shading: { type: ShadingType.SOLID, color },
  margins: { top: PT(4), bottom: PT(4), left: PT(8), right: PT(8) },
  children: [new Paragraph({
    children: [run(text, { bold: true, size: HF(9.5), color: textColor, font: 'Calibri' })],
    spacing: { after: 0 },
  })],
});

const dCell = (text, opts = {}) => new TableCell({
  width:   opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
  shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
  verticalAlign: 'center',
  margins: { top: PT(3), bottom: PT(3), left: PT(8), right: PT(8) },
  columnSpan: opts.span,
  children: [new Paragraph({
    children: [run(String(text), {
      bold:  !!opts.bold,
      size:  HF(opts.size || 9.5),
      color: opts.color || C.bodyText,
      font:  'Calibri',
    })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing:   { after: 0 },
  })],
});

const badge = (label, bg, fg) => dCell(label, { bg, color: fg, bold: true, align: AlignmentType.CENTER });

// ─── Status badge mapping ─────────────────────────────────────────────────────
const STATUS = {
  PASS:   { bg: C.greenBg,  fg: C.green  },
  FAIL:   { bg: C.redBg,    fg: C.red    },
  REVIEW: { bg: C.amberBg,  fg: C.amber  },
};
const riskColor = (r) => ({
  Critical: { bg: C.redBg,    fg: C.red   },
  High:     { bg: C.redBg,    fg: C.red   },
  Medium:   { bg: C.amberBg,  fg: C.amber },
  Low:      { bg: C.greenBg,  fg: C.green },
  None:     { bg: C.greenBg,  fg: C.green },
  REVIEW:   { bg: C.amberBg,  fg: C.amber },
}[r] || { bg: C.lightGrey, fg: C.darkGrey });

// ─── Callout box ─────────────────────────────────────────────────────────────
const callout = (text, bg = C.navyLight, fg = C.navy) => new Paragraph({
  children:  [run(text, { size: HF(10), color: fg, font: 'Calibri', italics: true })],
  shading:   { type: ShadingType.SOLID, color: bg },
  indent:    { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
  spacing:   { before: 120, after: 160 },
  border:    {
    left:   { style: BorderStyle.SINGLE, size: 16, color: fg },
  },
});

// ─── Page break ───────────────────────────────────────────────────────────────
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ─── Divider line ─────────────────────────────────────────────────────────────
const divider = (color = C.midGrey) => new Paragraph({
  border:  { bottom: border(color, 6) },
  spacing: { after: 160, before: 40 },
});

// ─── Logo image ───────────────────────────────────────────────────────────────
// 2000×1125 → scale to 2.2 in wide (pixels for docx ImageRun)
const LOGO_W_PX = PX(2.2);                               // 211 px
const LOGO_H_PX = Math.round(LOGO_W_PX * (1125 / 2000)); // 119 px
const logoImg = () => new Paragraph({
  children: [new ImageRun({
    data:    LOGO_BUF,
    transformation: { width: LOGO_W_PX, height: LOGO_H_PX },
    type:    'png',
  })],
  alignment: AlignmentType.LEFT,
  spacing:   { after: 0 },
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION BUILDERS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Cover Page ───────────────────────────────────────────────────────────────
function buildCoverPage() {
  // Top navy bar via a full-width 1-cell table
  const navyBar = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
    rows: [
      new TableRow({ children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: C.navy },
        margins: { top: PT(18), bottom: PT(18), left: PT(20), right: PT(20) },
        children: [
          new Paragraph({
            children: [run('CONFIDENTIAL', {
              bold: true, size: HF(8), color: C.gold,
              font: 'Calibri', characterSpacing: 200,
            })],
            spacing: { after: 0 },
          }),
        ],
      })] })
    ]
  });

  // Logo + metadata side-by-side
  const logoMetaTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
    rows: [
      new TableRow({ children: [
        new TableCell({
          width:   { size: 40, type: WidthType.PERCENTAGE },
          margins: { top: PT(16), bottom: PT(8), right: PT(16) },
          children: [logoImg()],
        }),
        new TableCell({
          width:   { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: PT(16), bottom: PT(8), left: PT(16) },
          verticalAlign: 'bottom',
          children: [
            new Paragraph({
              children: [run('Security Audit Report', {
                bold: true, size: HF(22), color: C.navy, font: 'Calibri',
              })],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [run('EDMECA Digital Academy', {
                size: HF(13), color: C.darkGrey, font: 'Calibri',
              })],
              spacing: { after: 40 },
            }),
          ],
        }),
      ]})
    ]
  });

  const separatorBar = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
    rows: [
      new TableRow({ children: [new TableCell({
        shading:  { type: ShadingType.SOLID, color: C.gold },
        margins:  { top: PT(2), bottom: PT(2) },
        children: [new Paragraph({ children: [run('')], spacing: { after: 0 } })],
      })] })
    ]
  });

  // Meta info block
  const metaTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(C.midGrey, C.lightGrey),
    rows: [
      new TableRow({ children: [
        hCell('Report Title',      28, C.lightGrey, C.navy),
        dCell('Security Audit Report — Application Security Assessment', { w: 72 }),
      ]}),
      new TableRow({ children: [
        hCell('Client',            28, C.offWhite, C.navy),
        dCell('EDMECA Digital Academy', { w: 72, bg: C.offWhite }),
      ]}),
      new TableRow({ children: [
        hCell('Prepared By',       28, C.lightGrey, C.navy),
        dCell('X4O Consulting — EDMECA Development Team', { w: 72 }),
      ]}),
      new TableRow({ children: [
        hCell('Report Date',       28, C.offWhite, C.navy),
        dCell(DATE_LONG, { w: 72, bg: C.offWhite }),
      ]}),
      new TableRow({ children: [
        hCell('Audit Scope',       28, C.lightGrey, C.navy),
        dCell('Web Application · API Functions · Database · Infrastructure · Dependencies', { w: 72 }),
      ]}),
      new TableRow({ children: [
        hCell('Overall Risk Rating', 28, C.offWhite, C.navy),
        dCell('LOW — No critical or high-severity vulnerabilities remain in application code', { w: 72, bg: C.greenBg, color: C.green, bold: true }),
      ]}),
      new TableRow({ children: [
        hCell('Classification',    28, C.lightGrey, C.navy),
        dCell('CONFIDENTIAL — For authorised stakeholders only', { w: 72, color: C.red, bold: true }),
      ]}),
    ]
  });

  return [
    navyBar,
    emptyLine(240),
    logoMetaTable,
    emptyLine(80),
    separatorBar,
    emptyLine(280),
    metaTable,
    emptyLine(400),
    new Paragraph({
      children: [
        run('This report has been prepared by X4O Consulting on behalf of EDMECA Digital Academy. ', {
          size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true,
        }),
        run('It contains confidential information, including vulnerability assessments and remediation details. ', {
          size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true,
        }),
        run('Distribution must be limited to authorised personnel involved in application development, security oversight, and management.', {
          size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true,
        }),
      ],
      spacing: { after: 0 },
      border: { top: border(C.midGrey, 4) },
    }),
    pageBreak(),
  ];
}

// ─── Executive Summary ────────────────────────────────────────────────────────
function buildExecutiveSummary() {
  const scoreTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [
        hCell('Security Domain', 38),
        hCell('Status',          17),
        hCell('Risk',            15),
        hCell('Action Taken',    30),
      ]}),
      ...[ 
        ['User Authentication & Session Management',  'PASS',   'None',   'Supabase JWT — no action required'],
        ['Database Row-Level Security',               'PASS',   'None',   'RLS enabled on all tables; write policies clarified'],
        ['Secrets & Credential Management',           'PASS',   'None',   'No hardcoded secrets in codebase'],
        ['Cross-Site Scripting (XSS)',                'PASS',   'None',   'dangerouslySetInnerHTML removed; Blob URL pattern adopted'],
        ['API & CORS Configuration',                  'PASS',   'None',   'Strict origin allowlist on all functions'],
        ['HTTP Security Headers',                     'PASS',   'None',   'HSTS, CSP, Permissions-Policy added'],
        ['Contact Form (PII Logging)',                'PASS',   'None',   'PII logging removed from server logs'],
        ['Admin Endpoint Security',                   'PASS',   'None',   'Secret moved from URL param to header-only'],
        ['Input Sanitisation (AI Prompts)',           'PASS',   'None',   'companyName sanitised; max 200 chars enforced'],
        ['Third-Party Dependencies',                  'REVIEW', 'Medium', 'xlsx (no upstream fix); @vercel/node upgrade planned'],
      ].map(([domain, status, risk, action]) => {
        const s = STATUS[status] || STATUS.REVIEW;
        const r = riskColor(risk);
        return new TableRow({ children: [
          dCell(domain,  { w: 38, bg: C.offWhite }),
          badge(status, s.bg, s.fg),
          badge(risk,   r.bg, r.fg),
          dCell(action,  { w: 30 }),
        ]});
      }),
    ]
  });

  return [
    sectionHeading('1.  Executive Summary'),
    emptyLine(60),
    bodyPara(
      'This report presents the findings of a structured application security audit conducted against the EDMECA Digital Academy platform on ' +
      DATE_LONG + '. The assessment was performed by the X4O Consulting development team and covers the full application stack: ' +
      'frontend web application, server-side API functions, database access controls, third-party software components, ' +
      'and deployment configuration.'
    ),
    emptyLine(40),
    bodyPara(
      'The audit identified nine areas requiring attention. All issues within direct application code have been ' +
      'fully remediated during this audit cycle. No critical or high-severity vulnerabilities remain in application code. ' +
      'One medium-severity concern in a third-party dependency (SheetJS/xlsx) persists due to the absence of an upstream fix; ' +
      'a replacement plan is documented in the recommendations section.'
    ),
    emptyLine(120),
    subHeading('Audit Scorecard', '1.1'),
    scoreTable,
    emptyLine(120),
    callout(
      'Overall Security Posture: GOOD  |  9 of 10 checks passing  |  0 critical / 0 high vulnerabilities in application code  |  ' + +
      'The platform is suitable for continued controlled rollout. A dynamic penetration test is recommended prior to full public launch.',
      C.navyLight, C.navy
    ),
    pageBreak(),
  ];
}

// ─── Scope & Methodology ──────────────────────────────────────────────────────
function buildScope() {
  const componentsTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [hCell('Component', 32), hCell('Description', 48), hCell('Files Examined', 20)] }),
      ...([
        ['Frontend Web Application',    'React + TypeScript SPA (Vite). All pages, components, hooks, and utility libraries.', '89 source files'],
        ['AI Financial Analysis API',   'Vercel serverless function. Receives uploaded documents, calls Anthropic Claude API.', 'api/analyze-financials.ts'],
        ['Contact Form Function',       'Netlify function. Receives public enquiries, stores to Supabase.', 'netlify/functions/contact.ts'],
        ['AI Business Advisor (Chat)',  'Netlify function. Chat interface powered by Groq llama-3.1-8b-instant.', 'netlify/functions/chat.ts'],
        ['CDN Cache Management',        'Netlify admin function. Protected by secret header.', 'netlify/functions/purge-cdn.ts'],
        ['Database (Supabase)',         'PostgreSQL + PostgREST. All tables, RLS policies, and migration scripts.', 'supabase/migrations/*.sql'],
        ['Authentication',             'Supabase Auth — email/password and Google OAuth.', 'client/src/hooks/use-auth.ts'],
        ['Deployment Configuration',   'Netlify config, response headers, branch/env strategy.', 'netlify.toml'],
        ['Third-Party Dependencies',   'All 675 npm packages — scanned via npm audit against GitHub Advisory Database.', 'package.json + lock file'],
      ].map(([comp, desc, files]) => new TableRow({ children: [
        dCell(comp,  { w: 32, bg: C.offWhite }),
        dCell(desc,  { w: 48 }),
        dCell(files, { w: 20, bg: C.lightGrey, size: 9 }),
      ]})))
    ]
  });

  const methodTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [hCell('Technique', 25), hCell('Description', 55), hCell('Tools', 20)] }),
      new TableRow({ children: [dCell('Static Analysis',        { w: 25, bg: C.offWhite }), dCell('Regex-based pattern scanning of all source files for known vulnerability signatures aligned with OWASP Top 10 (2021).', { w: 55 }), dCell('Custom audit script', { w: 20, bg: C.lightGrey })] }),
      new TableRow({ children: [dCell('Dependency Scanning',    { w: 25,             }), dCell('npm audit cross-referenced against the GitHub Advisory Database and npm security feed for CVE / GHSA advisories.', { w: 55, bg: C.offWhite }), dCell('npm audit --json',    { w: 20 })] }),
      new TableRow({ children: [dCell('Manual Code Review',     { w: 25, bg: C.offWhite }), dCell('Line-by-line review of all server-side functions, authentication hooks, CORS configuration, and database migration scripts.', { w: 55 }), dCell('Developer review',  { w: 20, bg: C.lightGrey })] }),
      new TableRow({ children: [dCell('Configuration Review',   { w: 25,             }), dCell('Inspection of netlify.toml, vercel.json, and Supabase RLS policies for security misconfigurations and missing controls.', { w: 55, bg: C.offWhite }), dCell('Manual inspection', { w: 20 })] }),
    ]
  });

  return [
    sectionHeading('2.  Scope & Methodology'),
    emptyLine(60),
    subHeading('Components Assessed', '2.1'),
    componentsTable,
    emptyLine(120),
    subHeading('Testing Methodology', '2.2'),
    methodTable,
    emptyLine(120),
    bodyPara(
      'The assessment is aligned with the OWASP Application Security Verification Standard (ASVS) Level 1 and covers ' +
      'all OWASP Top 10 2021 categories. It does not include dynamic/runtime testing (DAST) or physical ' +
      'infrastructure assessment. A DAST scan using OWASP ZAP is recommended as a pre-launch activity.'
    ),
    pageBreak(),
  ];
}

// ─── Detailed Findings ────────────────────────────────────────────────────────
function buildFindings() {
  const findings = [
    {
      id: 'SEC-001', name: 'Cross-Site Scripting (XSS)', cwe: 'CWE-79',
      owasp: 'A03:2021 – Injection', status: 'PASS', risk: 'None',
      description:
        'Direct DOM manipulation patterns that bypass React\'s built-in content escaping — ' +
        'specifically dangerouslySetInnerHTML, innerHTML assignment, eval(), and document.write() — were scanned across all 89 source files.',
      finding:
        'No active XSS vectors found. Two separate issues were identified and remediated during this audit:\n' +
        '  1. chart.tsx (shadcn/ui component) used dangerouslySetInnerHTML to inject CSS custom properties. ' +
        'Replaced with a useRef + useEffect approach writing to element.textContent — which is never parsed as HTML.\n' +
        '  2. exportReport.ts used the deprecated document.write() API to initialise a print pop-up. ' +
        'Replaced with a Blob URL (URL.createObjectURL) approach — no DOM write required.',
      recommendation: 'React JSX escaping provides the primary XSS defence. Continue avoiding dangerouslySetInnerHTML. ' +
        'If external HTML must be rendered in future, use DOMPurify to sanitise before injection.',
    },
    {
      id: 'SEC-002', name: 'Hardcoded Credentials & Secrets', cwe: 'CWE-798',
      owasp: 'A02:2021 – Cryptographic Failures', status: 'PASS', risk: 'None',
      description:
        'Full scan of all source files for patterns matching API keys (sk-ant-api, Supabase JWT), ' +
        'hardcoded passwords, and embedded tokens.',
      finding:
        'No hardcoded credentials found in any source file. All secrets are loaded at runtime via ' +
        'environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, RESEND_API_KEY, SMARTSHEET_API_TOKEN, etc.). ' +
        'Git history inspection confirmed no secret has ever been committed. .env.local is correctly gitignored.',
      recommendation: 'Maintain the current practice of environment variable injection. Implement a pre-commit hook ' +
        '(e.g. git-secrets or Husky + detect-secrets) to prevent accidental credential commits.',
    },
    {
      id: 'SEC-003', name: 'Insecure HTTP Connections', cwe: 'CWE-319',
      owasp: 'A02:2021 – Cryptographic Failures', status: 'PASS', risk: 'None',
      description:
        'All outbound external URLs were scanned for http:// usage (excluding localhost development entries ' +
        'and SVG/XML xmlns namespace declarations, which are not network connections).',
      finding:
        'No insecure external HTTP connections found. All API integrations use HTTPS: ' +
        'Supabase (dqvdnyxkkletgkkpicdg.supabase.co), Anthropic (api.anthropic.com), ' +
        'Groq (api.groq.com), and Resend (smtp.resend.com). ' +
        'CORS allowlists include http://localhost for local development only — this is correct and expected.',
      recommendation: 'HSTS headers are now configured (max-age=31536000; includeSubDomains; preload), ' +
        'enforcing HTTPS at the browser level for all returning visitors.',
    },
    {
      id: 'SEC-004', name: 'Sensitive Data in Console Output', cwe: 'CWE-532',
      owasp: 'A09:2021 – Security Logging & Monitoring Failures', status: 'PASS', risk: 'None',
      description:
        'Console.log/warn/error statements were scanned for output patterns containing auth tokens, ' +
        'passwords, API keys, or secret values.',
      finding:
        'No sensitive data detected in console output. One historical issue (contact.ts logging full PII: ' +
        'name, email, company, message to Netlify dashboard logs) was identified and remediated. ' +
        'The function now logs only a non-identifying submission reference ID and audience category.',
      recommendation: 'Consider adding a production build step that strips all console.log calls ' +
        '(Vite\'s esbuild drop: ["console"] option) to prevent any debug information leakage in production.',
    },
    {
      id: 'SEC-005', name: 'Sensitive Data in Browser Storage', cwe: 'CWE-922',
      owasp: 'A02:2021 – Cryptographic Failures', status: 'PASS', risk: 'None',
      description:
        'localStorage and sessionStorage usage was scanned for storage of authentication tokens, ' +
        'passwords, or sensitive session data.',
      finding:
        'No sensitive data stored in browser storage. localStorage is used in two safe contexts: ' +
        '(1) ThemeProvider — stores UI theme preference ("light"/"dark"), and ' +
        '(2) BMCTool — stores Business Model Canvas draft form data for auto-save across page refreshes. ' +
        'Neither contains tokens, passwords, or personally identifiable information. ' +
        'Supabase Auth manages session tokens internally via its own SDK.',
      recommendation: 'Current usage is appropriate. If user profile preferences or non-sensitive' +
        ' settings are added to localStorage in future, ensure they remain free of any authentication ' +
        'material or personal data as a standard practice.',
    },
    {
      id: 'SEC-006', name: 'CORS Policy Configuration', cwe: 'CWE-942',
      owasp: 'A01:2021 – Broken Access Control', status: 'PASS', risk: 'None',
      description:
        'Cross-Origin Resource Sharing headers were reviewed across all API functions for wildcard ' +
        'origins and correct handling of error responses.',
      finding:
        'CORS is correctly configured. All API functions use a strict ALLOWED_ORIGINS allowlist: ' +
        'https://edmeca.co.za, https://www.edmeca.co.za, https://edmecaacademy.netlify.app, ' +
        'https://staging--edmecaacademy.netlify.app, and http://localhost variants. ' +
        'One issue was remediated: contact.ts previously applied CORS headers only on 200 success responses. ' +
        'Error responses had no CORS headers, causing browsers to silently suppress error messages. ' +
        'Fixed — CORS headers are now applied to all responses.',
      recommendation: 'No further action required. Maintain the ALLOWED_ORIGINS allowlist as new ' +
        'deployment environments are added (e.g. a custom subdomain for staging).',
    },
    {
      id: 'SEC-007', name: 'SQL Injection', cwe: 'CWE-89',
      owasp: 'A03:2021 – Injection', status: 'PASS', risk: 'None',
      description:
        'Database query construction patterns were reviewed. Supabase\'s PostgREST client uses ' +
        'parameterised query building by default, preventing SQL injection. Risk arises specifically ' +
        'if raw SQL strings are constructed with user input via .rpc() or template literals.',
      finding:
        'No raw SQL string construction with user input detected. All database interactions use ' +
        'Supabase\'s typed query builder exclusively (.from(), .select(), .insert(), .update(), .delete()). ' +
        'No template literal SQL interpolation found. Row Level Security is enabled on all user-data tables.',
      recommendation: 'Continue exclusively using the Supabase typed query builder. If stored procedures ' +
        'are required via .rpc(), ensure all parameters are typed, validated, and never string-interpolated.',
    },
    {
      id: 'SEC-008', name: 'Authentication & Session Management', cwe: 'CWE-306',
      owasp: 'A07:2021 – Identification and Authentication Failures', status: 'PASS', risk: 'None',
      description:
        'All portal pages were checked for authentication enforcement. The audit checks for a ' +
        'router-level ProtectedRoute HOC in App.tsx (the correct React pattern) before falling back ' +
        'to per-page auth reference scanning.',
      finding:
        'Authentication is correctly enforced. App.tsx contains a ProtectedRoute HOC that wraps all ' +
        '/portal/* routes at the router level. Individual portal pages (PitchBuilderTool, SWOTPestleTool, ' +
        'ValuePropTool, etc.) are protected via this HOC — they do not require per-page auth imports. ' +
        'All server-side API functions validate the Supabase Bearer token (supabase.auth.getUser(token)) ' +
        'before processing any request. Unauthenticated calls receive a 401 Unauthorised response.',
      recommendation: 'Current architecture is correct. When adding new portal pages, ensure they are ' +
        'registered within the ProtectedRoute wrapper in App.tsx, not outside it.',
    },
    {
      id: 'SEC-009', name: 'Third-Party Dependency Vulnerabilities', cwe: 'CWE-1104',
      owasp: 'A06:2021 – Vulnerable and Outdated Components', status: 'REVIEW', risk: 'Medium',
      description:
        'npm audit scanned all 675 declared and transitive dependencies against the GitHub Advisory ' +
        'Database and npm security advisories. Results include CVE identifiers, severity ratings, ' +
        'and available remediation paths.',
      finding:
        '9 vulnerabilities remain after remediation of auto-fixable issues (reduced from 14 at audit start). ' +
        'Breakdown: 0 Critical, 6 High, 3 Moderate, 0 Low. ' +
        'Key affected packages:\n' +
        '  • xlsx (SheetJS) — 2 High advisories (Prototype Pollution, ReDoS). No upstream fix available. ' +
        'Replacement with ExcelJS is required.\n' +
        '  • minimatch / path-to-regexp / undici — 4 High + 3 Moderate via @vercel/node transitive chain. ' +
        'Fix: upgrade @vercel/node to v4.0.0 (breaking change — requires API compatibility testing).',
      recommendation: 'Priority 1: Replace xlsx with exceljs in FileUploadZone.tsx (est. 2–3 days). ' +
        'Priority 2: Upgrade @vercel/node to v4.0.0 (est. 1 day + testing). ' +
        'Both items are planned for the next development sprint before public launch.',
    },
    {
      id: 'SEC-010', name: 'HTTP Security Headers', cwe: 'CWE-16',
      owasp: 'A05:2021 – Security Misconfiguration', status: 'PASS', risk: 'None',
      description:
        'netlify.toml was checked for the presence and correctness of critical HTTP security headers: ' +
        'Content-Security-Policy, Strict-Transport-Security (HSTS), X-Frame-Options, ' +
        'X-Content-Type-Options, and Permissions-Policy.',
      finding:
        'All required security headers are present following remediation in this audit cycle. ' +
        'Previously the site was missing HSTS and a Content Security Policy. ' +
        'Now configured: Strict-Transport-Security (max-age=31536000; includeSubDomains; preload), ' +
        'Content-Security-Policy (scoped to Supabase, Vercel AI, Google OAuth, Google Fonts domains), ' +
        'Permissions-Policy (camera=(), microphone=(), geolocation=()), ' +
        'X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.',
      recommendation: 'Review and update the CSP source list whenever new third-party scripts or API ' +
        'integrations are added. Use the browser\'s CSP violation reporting in staging to detect ' +
        'any blocked resources before promoting changes to production.',
    },
  ];

  const rows = [];
  for (const f of findings) {
    const s = STATUS[f.status] || STATUS.REVIEW;
    const r = riskColor(f.risk);

    const findingLines = f.finding.split('\n');
    const findingChildren = [];
    findingLines.forEach((line, idx) => {
      if (line.trimStart().startsWith('•')) {
        findingChildren.push(bulletPara(line.trimStart().slice(1).trim()));
      } else {
        findingChildren.push(bodyPara(line));
      }
    });

    rows.push(
      // Heading row
      new TableRow({
        children: [new TableCell({
          columnSpan: 4,
          shading: { type: ShadingType.SOLID, color: C.navy },
          margins: { top: PT(5), bottom: PT(5), left: PT(10), right: PT(10) },
          children: [new Paragraph({
            children: [
              run(`${f.id}  |  `, { bold: true, size: HF(10), color: C.gold, font: 'Calibri' }),
              run(f.name, { bold: true, size: HF(10), color: C.white, font: 'Calibri' }),
            ],
            spacing: { after: 0 },
          })],
        })]
      }),
      // Metadata row
      new TableRow({
        children: [
          hCell('Category',  25, C.lightGrey, C.navy),
          hCell('CWE',       25, C.lightGrey, C.navy),
          hCell('OWASP 2021',25, C.lightGrey, C.navy),
          hCell('Status / Risk', 25, C.lightGrey, C.navy),
        ]
      }),
      new TableRow({
        children: [
          dCell(f.owasp.split('–')[1]?.trim() || f.owasp, { w: 25 }),
          dCell(f.cwe, { w: 25 }),
          dCell(f.owasp.split('–')[0]?.trim() || '', { w: 25 }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            margins: { top: PT(3), bottom: PT(3), left: PT(8), right: PT(8) },
            children: [new Paragraph({
              children: [
                run(f.status, { bold: true, size: HF(9.5), color: s.fg, font: 'Calibri' }),
                run('  /  ', { size: HF(9.5), color: C.darkGrey, font: 'Calibri' }),
                run(f.risk,  { bold: true, size: HF(9.5), color: r.fg, font: 'Calibri' }),
              ],
              spacing: { after: 0 },
            })],
          }),
        ]
      }),
      // Description row
      new TableRow({
        children: [new TableCell({
          columnSpan: 4,
          margins: { top: PT(6), bottom: PT(2), left: PT(10), right: PT(10) },
          children: [
            new Paragraph({
              children: [
                run('Technical Description: ', { bold: true, size: HF(9.5), color: C.navy, font: 'Calibri' }),
                run(f.description, { size: HF(9.5), color: C.bodyText, font: 'Calibri' }),
              ],
              spacing: { after: 0 },
            }),
          ],
        })]
      }),
      // Finding row
      new TableRow({
        children: [new TableCell({
          columnSpan: 4,
          shading: { type: ShadingType.SOLID, color: s.bg },
          margins: { top: PT(6), bottom: PT(6), left: PT(10), right: PT(10) },
          children: [
            new Paragraph({
              children: [run('Finding: ', { bold: true, size: HF(9.5), color: s.fg, font: 'Calibri' })],
              spacing: { after: 40 },
            }),
            ...f.finding.split('\n').map(line => {
              const trimmed = line.trimStart();
              if (trimmed.startsWith('•')) {
                return new Paragraph({
                  children: [run(trimmed.slice(1).trim(), { size: HF(9.5), color: s.fg, font: 'Calibri' })],
                  bullet: { level: 0 },
                  spacing: { after: 40 },
                });
              }
              return new Paragraph({
                children: [run(line, { size: HF(9.5), color: s.fg, font: 'Calibri' })],
                spacing: { after: 40 },
              });
            }),
          ],
        })]
      }),
      // Recommendation row
      new TableRow({
        children: [new TableCell({
          columnSpan: 4,
          margins: { top: PT(6), bottom: PT(10), left: PT(10), right: PT(10) },
          children: [new Paragraph({
            children: [
              run('Recommendation: ', { bold: true, size: HF(9.5), color: C.navy, font: 'Calibri' }),
              run(f.recommendation, { size: HF(9.5), color: C.bodyText, font: 'Calibri' }),
            ],
            spacing: { after: 0 },
          })],
        })]
      }),
    );
    rows.push(
      new TableRow({ children: [new TableCell({
        columnSpan: 4,
        margins: { top: PT(6) },
        borders: noTableBorders,
        children: [new Paragraph({ children: [run('')], spacing: { after: 0 }})],
      })] })
    );
  }

  const findingsTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(C.midGrey, C.lightGrey),
    rows,
  });

  return [
    sectionHeading('3.  Security Test Findings'),
    emptyLine(60),
    bodyPara(
      'The following section presents individual findings for each of the ten security test categories. ' +
      'Each finding includes a technical description, test result, evidence, and remediation recommendation.'
    ),
    emptyLine(120),
    findingsTable,
    pageBreak(),
  ];
}

// ─── Vulnerability Register ───────────────────────────────────────────────────
function buildVulnRegister() {
  // Read live npm audit data
  let auditVulns = [];
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit-raw.json'), 'utf8'));
    for (const [pkg, v] of Object.entries(raw.vulnerabilities || {})) {
      const vias = Array.isArray(v.via) ? v.via.filter(x => typeof x === 'object') : [];
      for (const adv of vias) {
        auditVulns.push({
          package:  pkg,
          severity: v.severity,
          title:    adv.title || 'Unknown',
          range:    adv.range || '—',
          fix:      v.fixAvailable
            ? (typeof v.fixAvailable === 'object'
                ? `Upgrade ${v.fixAvailable.name} → ${v.fixAvailable.version}`
                : 'npm audit fix')
            : 'No upstream fix',
        });
      }
    }
  } catch { /* audit-raw.json absent — skip */ }

  const vulnRows = auditVulns.length
    ? auditVulns.map((v, i) => {
        const r = riskColor(v.severity.charAt(0).toUpperCase() + v.severity.slice(1));
        return new TableRow({ children: [
          dCell(String(i + 1), { w: 5, align: AlignmentType.CENTER, bg: C.offWhite }),
          dCell(v.package,     { w: 22 }),
          badge(v.severity.toUpperCase(), r.bg, r.fg),
          dCell(v.title,       { w: 36 }),
          dCell(v.range,       { w: 16, size: 9 }),
          dCell(v.fix,         { w: 15, size: 9, bg: C.offWhite }),
        ]});
      })
    : [new TableRow({ children: [
        new TableCell({
          columnSpan: 6,
          children:   [new Paragraph({ children: [run('No vulnerability data available (audit-raw.json not found).', { size: HF(9.5), font: 'Calibri' })], spacing: { after: 0 }})],
        })
      ]})];

  const vulnTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [
        hCell('#',        5),  hCell('Package',     22), hCell('Severity', 11),
        hCell('Advisory', 36), hCell('Affected Range', 16), hCell('Remediation', 10),
      ]}),
      ...vulnRows,
    ]
  });

  return [
    sectionHeading('4.  Dependency Vulnerability Register'),
    emptyLine(60),
    bodyPara(
      'The following table lists all advisories reported by npm audit against the installed dependency tree. ' +
      'These are vulnerabilities in third-party packages, not in EDMECA application code. ' +
      'They are listed for completeness and to support prioritised remediation planning.'
    ),
    emptyLine(120),
    vulnTable,
    emptyLine(120),
    callout(
      'Note: All High advisories are confined to two packages — xlsx (no upstream fix, replacement required) and ' +
      '@vercel/node transitive dependencies (fix available via version upgrade). Neither affects user authentication, ' +
      'database integrity, or direct data exposure.',
      C.amberBg, C.amber
    ),
    pageBreak(),
  ];
}

// ─── Risk Register ────────────────────────────────────────────────────────────
function buildRiskRegister() {
  const risks = [
    ['xlsx CVEs (Prototype Pollution, ReDoS)',          'High',     'Medium', 'Affects Excel file parsing only. Replacement with ExcelJS planned.',          '1',     'Sprint 1 post-audit'],
    ['AI API — No usage rate limiting',                 'Medium',   'Medium', 'Authenticated users can loop AI calls. Cost exposure at scale.',               '2',     'Before scaling user base'],
    ['@vercel/node transitive vulnerabilities',         'Medium',   'Low',    'Breaking change upgrade available. Limited exposure (server-side only).',       '3',     'Sprint 1 post-audit'],
    ['Contact form — No CAPTCHA / spam protection',     'Low',      'Low',    'Bot submissions possible. Low risk during current beta/cohort phase.',           '4',     'Before public launch'],
    ['POPIA disclosure for AI financial processing',    'Low',      'Medium', 'Users not explicitly informed of Anthropic data processing. Compliance risk.',   '5',     'Before public launch'],
    ['Dynamic penetration test not yet conducted',      'Medium',   'Medium', 'Static analysis only. Runtime vulnerabilities may remain undetected.',          '6',     'Pre-launch milestone'],
    ['Google OAuth consent screen shows Supabase URL',  'Low',      'Low',    'BUG-003 — Pending supervisor action in Google Cloud Console.',                  '7',     'Actively tracked'],
  ];

  const riskTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [
        hCell('#',           4), hCell('Risk Description',    38),
        hCell('Likelihood',  12), hCell('Impact',            12),
        hCell('Control / Mitigation', 22), hCell('Target Date', 12),
      ]}),
      ...risks.map(([desc, lh, imp, control, num, target]) => {
        const l = riskColor(lh); const i = riskColor(imp);
        return new TableRow({ children: [
          dCell(num,     { w: 4,  align: AlignmentType.CENTER, bg: C.offWhite }),
          dCell(desc,    { w: 38 }),
          badge(lh,  l.bg, l.fg),
          badge(imp, i.bg, i.fg),
          dCell(control, { w: 22, bg: C.offWhite, size: 9 }),
          dCell(target,  { w: 12, size: 9 }),
        ]});
      }),
    ]
  });

  return [
    sectionHeading('5.  Residual Risk Register'),
    emptyLine(60),
    bodyPara(
      'The following risks remain open following remediation of all identified application code vulnerabilities. ' +
      'Each item is tracked with a likelihood rating, impact assessment, and target remediation date.'
    ),
    emptyLine(120),
    riskTable,
    pageBreak(),
  ];
}

// ─── Recommendations ─────────────────────────────────────────────────────────
function buildRecommendations() {
  const recs = [
    {
      priority: 'HIGH',     effort: '2–3 days', target: 'Sprint 1',
      title:   'Replace SheetJS (xlsx) with ExcelJS',
      detail:  'The xlsx/SheetJS package has two unpatched High-severity advisories (Prototype Pollution — CVE and ReDoS) with no vendor fix available or planned. ' +
               'Replace with the ExcelJS library in client/src/components/portal/FileUploadZone.tsx. ExcelJS provides equivalent XLSX read/write capability without the CVEs. ' +
               'Remove the xlsx package from package.json after migration.',
    },
    {
      priority: 'MEDIUM',   effort: '1–2 days', target: 'Sprint 1',
      title:   'Implement Rate Limiting on AI Financial Analysis API',
      detail:  'The /api/analyze-financials endpoint processes paid Anthropic Claude API calls. ' +
               'There is no per-user call limit, exposing the platform to cost overruns if an authenticated user loops requests. ' +
               'Implement a usage limit (suggested: 10 analyses per user per 24 hours) using Vercel KV or a Supabase counter table. ' +
               'Return HTTP 429 with a descriptive message when the limit is exceeded.',
    },
    {
      priority: 'MEDIUM',   effort: '< 1 day',  target: 'Sprint 1',
      title:   'Add POPIA Data Processing Disclosure on Financial Analysis Tool',
      detail:  'When users upload financial documents, the content is transmitted to Anthropic\'s Claude API (a U.S.-based third-party AI provider). ' +
               'Under POPIA, users must be informed of third-party data processing for sensitive financial information. ' +
               'Add a brief, visible disclosure notice on the FinancialAnalysisTool page before the first submission, ' +
               'stating that document content is processed by Anthropic AI and is not retained beyond the session.',
    },
    {
      priority: 'MEDIUM',   effort: '1 day + testing', target: 'Sprint 1',
      title:   'Upgrade @vercel/node to v4.0.0',
      detail:  'The current @vercel/node version pulls in vulnerable versions of minimatch, path-to-regexp, and undici via its dependency chain. ' +
               'Upgrading to @vercel/node v4.0.0 resolves all of these (6 High, 3 Moderate advisories). ' +
               'This is a breaking change — review the v4.0.0 migration guide and test api/analyze-financials.ts in the Vercel staging environment before promoting.',
    },
    {
      priority: 'LOW',      effort: '1 day',    target: 'Before public launch',
      title:   'Add Spam Protection to the Contact Form',
      detail:  'The public contact form has no bot-detection or rate-limiting controls. ' +
               'Integrate Cloudflare Turnstile (free tier, privacy-respecting) or hCaptcha. ' +
               'Add the token field to the frontend form and verify server-side in netlify/functions/contact.ts ' +
               'before accepting any submission.',
    },
    {
      priority: 'MEDIUM',   effort: 'External',  target: 'Pre-launch milestone',
      title:   'Commission a Dynamic Penetration Test (DAST)',
      detail:  'This audit covers static code analysis only. A dynamic / runtime penetration test using tools such as OWASP ZAP ' +
               'against the staging environment will detect runtime vulnerabilities not visible in source code — ' +
               'including session fixation, clickjacking bypass, cookie misconfigurations, and API enumeration. ' +
               'This should be completed and remediated before opening registration to the general public.',
    },
    {
      priority: 'LOW',      effort: 'Legal counsel', target: 'Pre-launch milestone',
      title:   'Legal Review of Privacy Policy for AI Data Processing',
      detail:  'The current Privacy Policy may not explicitly cover transmission of financial data to Anthropic AI. ' +
               'Engage legal counsel to review and update the policy to include: (1) what data is processed, ' +
               '(2) which third-party processors receive it, (3) whether consent is required under POPIA for this processing, ' +
               'and (4) how users may request data deletion.',
    },
  ];

  const recBlocks = recs.flatMap(rec => {
    const p = riskColor(rec.priority);
    return [
      new Table({
        width:   { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders(C.midGrey, C.lightGrey),
        rows: [
          new TableRow({ children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: C.navy },
              width:   { size: 52, type: WidthType.PERCENTAGE },
              margins: { top: PT(5), bottom: PT(5), left: PT(10), right: PT(10) },
              children: [new Paragraph({
                children: [run(rec.title, { bold: true, size: HF(10), color: C.white, font: 'Calibri' })],
                spacing: { after: 0 },
              })],
            }),
            hCell('Priority', 12, C.lightGrey, C.navy),
            new TableCell({
              width: { size: 12, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: p.bg },
              margins: { top: PT(5), bottom: PT(5), left: PT(8) },
              children: [new Paragraph({ children: [run(rec.priority, { bold: true, size: HF(9.5), color: p.fg, font: 'Calibri' })], spacing: { after: 0 } })],
            }),
            hCell('Effort',   12, C.lightGrey, C.navy),
            dCell(rec.effort, { w: 12 }),
          ]}),
          new TableRow({ children: [new TableCell({
            columnSpan: 5,
            margins: { top: PT(6), bottom: PT(8), left: PT(10), right: PT(10) },
            children: [new Paragraph({
              children: [run(rec.detail, { size: HF(9.5), color: C.bodyText, font: 'Calibri' })],
              spacing: { after: 0 },
            })],
          })]}),
        ]
      }),
      emptyLine(60),
    ];
  });

  return [
    sectionHeading('6.  Recommendations'),
    emptyLine(60),
    bodyPara('The following recommendations are prioritised by risk severity and development effort. ' +
      'Items marked HIGH should be completed in the next sprint. MEDIUM items must be addressed before ' +
      'scaling the user base. LOW items should be resolved before public launch.'),
    emptyLine(120),
    ...recBlocks,
    pageBreak(),
  ];
}

// ─── Conclusion ───────────────────────────────────────────────────────────────
function buildConclusion() {
  // Signature block
  const sigTable = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(C.midGrey, C.lightGrey),
    rows: [
      new TableRow({ children: [
        hCell('Prepared By',   33, C.lightGrey, C.navy),
        hCell('Role',          33, C.lightGrey, C.navy),
        hCell('Date',          34, C.lightGrey, C.navy),
      ]}),
      new TableRow({ children: [
        dCell('X4O Consulting — EDMECA Development Team', { w: 33 }),
        dCell('Security Audit Team',                      { w: 33, bg: C.offWhite }),
        dCell(DATE_LONG,                                  { w: 34 }),
      ]}),
      new TableRow({ children: [
        hCell('Reviewed For',  33, C.lightGrey, C.navy),
        hCell('Organisation',  33, C.lightGrey, C.navy),
        hCell('Report Version', 34, C.lightGrey, C.navy),
      ]}),
      new TableRow({ children: [
        dCell('Raymond Crown (Supervisor)', { w: 33 }),
        dCell('EDMECA Digital Academy',    { w: 33, bg: C.offWhite }),
        dCell('v1.0  |  ' + DATE_LONG,    { w: 34 }),
      ]}),
    ]
  });

  return [
    sectionHeading('7.  Conclusion'),
    emptyLine(60),
    bodyPara(
      'The EDMECA Digital Academy platform demonstrates a solid and well-considered security baseline for a ' +
      'development-stage application. All five issues identified in application code during this audit cycle ' +
      'have been fully remediated. The platform now achieves a score of 9 PASS, 0 FAIL across ten security ' +
      'test categories — with one REVIEW item relating exclusively to third-party dependency CVEs outside ' +
      'direct application control.'
    ),
    emptyLine(80),
    bodyPara(
      'The core security controls are correctly implemented: Supabase JWT authentication, row-level database ' +
      'security, XSS-safe rendering, secrets in environment variables, strict CORS allowlists, and HTTP ' +
      'security headers (HSTS, CSP, Permissions-Policy). These provide a strong security foundation that ' +
      'meets the expected standard for a production-grade educational technology platform.'
    ),
    emptyLine(80),
    bodyPara(
      'The platform is assessed as ready for continued controlled rollout to cohorts and programme participants. ' +
      'The remaining action items — xlsx library replacement, rate limiting, and a POPIA disclosure notice — ' +
      'should be prioritised in the next development sprint. A full dynamic (DAST) penetration test is strongly ' +
      'recommended before opening registration to the general public.'
    ),
    emptyLine(200),
    sigTable,
    emptyLine(200),
    divider(C.gold),
    new Paragraph({
      children: [
        run('EDMECA Digital Academy  |  Security Audit Report  |  ' + DATE_LONG + '  |  ', {
          size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true,
        }),
        run('CONFIDENTIAL', { size: HF(8.5), color: C.red, font: 'Calibri', bold: true }),
        run('  |  Powered by X4O', { size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 0 },
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  // Ensure fresh npm audit data
  console.log('Running npm audit...');
  const auditResult = spawnSync(process.execPath, ['--', 'npm', 'audit', '--json'], {
    cwd: ROOT, encoding: 'buffer', shell: true,
  });
  // spawnSync with shell on Windows needs a different approach:
  const auditRaw = spawnSync('npm', ['audit', '--json'], {
    cwd: ROOT, encoding: 'buffer',
  });
  if (auditRaw.stdout?.length) {
    fs.writeFileSync(path.join(ROOT, 'audit-raw.json'), auditRaw.stdout);
  }

  const allChildren = [
    ...buildCoverPage(),
    ...buildExecutiveSummary(),
    ...buildScope(),
    ...buildFindings(),
    ...buildVulnRegister(),
    ...buildRiskRegister(),
    ...buildRecommendations(),
    ...buildConclusion(),
  ];

  const doc = new Document({
    creator:     'X4O Consulting',
    title:       'EDMECA Digital Academy — Security Audit Report',
    description: 'Application Security Assessment',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Calibri', size: HF(10.5), color: C.bodyText },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(0.9),
            bottom: convertInchesToTwip(0.9),
            left:   convertInchesToTwip(1.0),
            right:  convertInchesToTwip(1.0),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              width:   { size: 100, type: WidthType.PERCENTAGE },
              borders: { ...noTableBorders, bottom: border(C.midGrey, 4) },
              rows: [new TableRow({ children: [
                new TableCell({
                  width:   { size: 50, type: WidthType.PERCENTAGE },
                  margins: { bottom: PT(4) },
                  children: [new Paragraph({
                    children: [new ImageRun({
                      data: LOGO_BUF,
                      transformation: { width: PX(1.1), height: Math.round(PX(1.1) * 1125/2000) },
                      type: 'png',
                    })],
                    spacing: { after: 0 },
                  })],
                }),
                new TableCell({
                  width:   { size: 50, type: WidthType.PERCENTAGE },
                  margins: { bottom: PT(4) },
                  verticalAlign: 'bottom',
                  children: [new Paragraph({
                    children: [run('Security Audit Report  |  CONFIDENTIAL', {
                      size: HF(8.5), color: C.darkGrey, font: 'Calibri', italics: true,
                    })],
                    alignment: AlignmentType.RIGHT,
                    spacing:   { after: 0 },
                  })],
                }),
              ]})]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Table({
              width:   { size: 100, type: WidthType.PERCENTAGE },
              borders: { ...noTableBorders, top: border(C.midGrey, 4) },
              rows: [new TableRow({ children: [
                new TableCell({
                  width:   { size: 60, type: WidthType.PERCENTAGE },
                  margins: { top: PT(4) },
                  children: [new Paragraph({
                    children: [run(`EDMECA Digital Academy  |  ${DATE_LONG}  |  Powered by X4O`, {
                      size: HF(8), color: C.darkGrey, font: 'Calibri', italics: true,
                    })],
                    spacing: { after: 0 },
                  })],
                }),
                new TableCell({
                  width:   { size: 40, type: WidthType.PERCENTAGE },
                  margins: { top: PT(4) },
                  children: [new Paragraph({
                    children: [
                      run('Page ', { size: HF(8), color: C.darkGrey, font: 'Calibri' }),
                      new TextRun({ children: [PageNumber.CURRENT], size: HF(8), color: C.navy, font: 'Calibri' }),
                      run(' of ', { size: HF(8), color: C.darkGrey, font: 'Calibri' }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: HF(8), color: C.navy, font: 'Calibri' }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing:   { after: 0 },
                  })],
                }),
              ]})]
            })
          ]
        })
      },
      children: allChildren,
    }]
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `EDMECA_Security_Audit_Report_${DATE_ISO}.docx`);
  const buffer  = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`\nReport written → ${path.relative(ROOT, outPath)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
