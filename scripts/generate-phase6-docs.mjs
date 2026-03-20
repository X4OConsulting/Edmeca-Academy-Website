/**
 * EdMeCa Academy — Phase 6 Documentation Generator
 * Generates all 5 branded DOCX deliverables for Phase 6: Documentation
 *
 * Outputs to: deliverables/Phase-6-Documentation/
 *
 * Usage: node scripts/generate-phase6-docs.mjs
 */

import fs from 'fs';
import path from 'path';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType,
  PageBreak, UnderlineType
} from 'docx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const OUT_DIR   = path.join(ROOT, 'deliverables', 'Phase-6-Documentation');
const DATE      = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
const YEAR      = new Date().getFullYear();

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Brand Palette ────────────────────────────────────────────────────────────
const NAVY       = '1f3a6e';
const WHITE      = 'FFFFFF';
const LIGHT_GREY = 'F8F9FA';
const MID_GREY   = 'E9ECEF';
const DARK_GREY  = '495057';
const GREEN      = '1E7E34';
const AMBER      = 'D97706';
const RED        = 'B91C1C';
const NAVY_LIGHT = 'EEF2FF';
const BLUE_GREY  = '6C7A91';
const LIGHT_GREEN = 'D1FAE5';
const LIGHT_AMBER = 'FEF3C7';
const LIGHT_RED  = 'FEE2E2';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const sp = (before = 0, after = 160) => ({ spacing: { before, after } });

const coverTitle = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 56, color: WHITE })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 200 }
});

const coverSubtitle = (text) => new Paragraph({
  children: [new TextRun({ text, size: 28, color: 'D0D8E8' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 }
});

const coverMeta = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: 'A0B0C8' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 }
});

const h1 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 36, color: NAVY })],
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 600, after: 240 }
});

const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 28, color: NAVY })],
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 400, after: 160 }
});

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 24, color: NAVY })],
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 280, after: 120 }
});

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: DARK_GREY, ...opts })],
  spacing: { after: 140 }
});

const bullet = (text, level = 0) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: DARK_GREY })],
  bullet: { level },
  spacing: { after: 100 }
});

const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
  spacing: { after: 240 }
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const callout = (text, bg = NAVY_LIGHT, color = NAVY) => new Paragraph({
  children: [new TextRun({ text, size: 22, color, bold: true })],
  shading: { type: ShadingType.SOLID, color: bg },
  indent: { left: 240, right: 240 },
  spacing: { before: 160, after: 200 }
});

const code = (text) => new Paragraph({
  children: [new TextRun({ text, size: 20, font: 'Courier New', color: NAVY })],
  shading: { type: ShadingType.SOLID, color: MID_GREY },
  indent: { left: 360, right: 360 },
  spacing: { before: 80, after: 80 }
});

// Header cell (navy bg, white text)
const hCell = (text, w) => new TableCell({
  width: { size: w, type: WidthType.PERCENTAGE },
  shading: { type: ShadingType.SOLID, color: NAVY },
  children: [new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: WHITE })],
    spacing: { after: 0 }
  })]
});

// Data cell
const dCell = (text, w, shade = null, bold = false) => new TableCell({
  width: { size: w, type: WidthType.PERCENTAGE },
  shading: shade ? { type: ShadingType.SOLID, color: shade } : undefined,
  children: [new Paragraph({
    children: [new TextRun({ text: String(text ?? ''), size: 20, bold, color: DARK_GREY })],
    spacing: { after: 0 }
  })]
});

const borders = {
  top:     { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  bottom:  { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  left:    { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  right:   { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  insideH: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  insideV: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
};

const makeTable = (headers, rows) => {
  const colW = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => hCell(h, colW))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dCell(cell, colW, ri % 2 === 0 ? LIGHT_GREY : WHITE))
      }))
    ]
  });
};

// Cover page with navy background
const coverPage = (title, subtitle, refNumber) => [
  new Paragraph({
    children: [new TextRun({ text: '' })],
    shading: { type: ShadingType.SOLID, color: NAVY },
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 }
  }),
  new Paragraph({
    children: [new TextRun({ text: 'EdMeCa Academy', bold: true, size: 28, color: 'A0B0C8' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 1600, after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: 'DIGITAL ACADEMY PLATFORM', size: 20, color: '7A90AA' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  }),
  new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 52, color: WHITE })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 }
  }),
  new Paragraph({
    children: [new TextRun({ text: subtitle, size: 26, color: 'D0D8E8' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: '─────────────────────────────────', color: BLUE_GREY, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 }
  }),
  new Paragraph({
    children: [new TextRun({ text: `Document Reference: ${refNumber}`, size: 20, color: 'A0B0C8' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: `Date: ${DATE}`, size: 20, color: 'A0B0C8' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Prepared by: X4O Consulting / Keenan Husselmann', size: 20, color: 'A0B0C8' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Supervisor: Raymond Crown', size: 20, color: 'A0B0C8' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: `© ${YEAR} EdMeCa Academy. Confidential.`, size: 18, color: '6070A0' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 0 }
  }),
  pageBreak()
];

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 1 — Technical Documentation (6.1)
// ─────────────────────────────────────────────────────────────────────────────
async function generateTechnicalDoc() {
  const sections = [
    ...coverPage('Technical Documentation', 'Developer Reference & Architecture Guide', 'EDMECA-DOC-6.1'),

    h1('1. Executive Summary'),
    divider(),
    body('This document provides comprehensive technical documentation for the EdMeCa Academy Digital Platform — a React-based web application hosted on Netlify with Supabase for authentication and database services. It is intended for developers maintaining, extending, or onboarding to the platform.'),
    callout('Platform URL: https://edmeca.co.za  |  Staging: https://staging--edmecaacademy.netlify.app'),

    h1('2. Technology Stack'),
    divider(),
    body('The platform is built on the following core technologies:'),
    makeTable(
      ['Layer', 'Technology', 'Version', 'Purpose'],
      [
        ['Frontend', 'React', '18.x', 'UI framework'],
        ['Language', 'TypeScript', '5.x', 'Type-safe development'],
        ['Build Tool', 'Vite', '7.x', 'Dev server & bundler'],
        ['Styling', 'Tailwind CSS', '3.x', 'Utility-first CSS'],
        ['UI Components', 'shadcn/ui + Radix UI', 'Latest', 'Accessible component primitives'],
        ['State/Data', 'TanStack Query', 'v5', 'Server state & caching'],
        ['Backend', 'Netlify Functions', 'ESM', 'Serverless API handlers'],
        ['Database', 'Supabase (PostgreSQL)', 'Latest', 'Database + Auth + Storage'],
        ['ORM', 'Drizzle ORM', 'Latest', 'Type-safe schema & migrations'],
        ['Email', 'Resend', 'Latest', 'Transactional email'],
        ['Testing', 'Vitest + Playwright', 'Latest', 'Unit + E2E testing'],
        ['Hosting', 'Netlify', 'Latest', 'Static hosting + Functions'],
      ]
    ),

    pageBreak(),
    h1('3. Project Structure'),
    divider(),
    body('The repository follows a client-centric monorepo layout:'),
    code('root/'),
    code('├── client/            ← React SPA (Vite root)'),
    code('│   ├── src/           ← Application source'),
    code('│   │   ├── App.tsx    ← Router & ProtectedRoute'),
    code('│   │   ├── pages/     ← Route components'),
    code('│   │   ├── components/← Reusable UI components'),
    code('│   │   ├── hooks/     ← Custom React hooks'),
    code('│   │   └── lib/       ← Utilities & query client'),
    code('│   └── public/        ← Static assets'),
    code('├── netlify/functions/ ← Serverless functions'),
    code('├── api/               ← Vercel-style handlers'),
    code('├── scripts/           ← Dev & ops CLI tools'),
    code('├── supabase/          ← DB config & migrations'),
    code('├── shared/            ← Shared schema types'),
    code('├── deliverables/      ← Project documentation'),
    code('└── tests/             ← Playwright E2E tests'),

    pageBreak(),
    h1('4. Application Architecture'),
    divider(),
    h2('4.1 Frontend Architecture'),
    body('The React application uses a page-based routing structure powered by React Router v6. Authentication is enforced at the router level via a ProtectedRoute higher-order component in App.tsx, which validates the Supabase session before rendering any /portal/* routes.'),
    makeTable(
      ['Route', 'Component', 'Auth Required', 'Description'],
      [
        ['/', 'Home.tsx', 'No', 'Marketing landing page'],
        ['/about', 'About.tsx', 'No', 'Academy overview & mission'],
        ['/solutions', 'Solutions.tsx', 'No', 'Course & service offerings'],
        ['/contact', 'Contact.tsx', 'No', 'Contact form'],
        ['/login', 'Login.tsx', 'No', 'Authentication page'],
        ['/signup', 'Signup.tsx', 'No', 'Registration page'],
        ['/portal', 'Dashboard.tsx', 'Yes', 'User portal dashboard'],
        ['/portal/bmc', 'BMCTool.tsx', 'Yes', 'Business Model Canvas'],
        ['/portal/swot', 'SWOTPestleTool.tsx', 'Yes', 'SWOT & PESTLE analysis'],
        ['/portal/value-prop', 'ValuePropTool.tsx', 'Yes', 'Value Proposition canvas'],
        ['/portal/pitch', 'PitchBuilderTool.tsx', 'Yes', 'Pitch deck builder'],
        ['/portal/progress', 'ProgressTrackerTool.tsx', 'Yes', 'Learning progress tracker'],
        ['/portal/financials', 'FinancialAnalysisTool.tsx', 'Yes', 'AI-powered financial analysis'],
        ['/portal/profile', 'Profile.tsx', 'Yes', 'User profile management'],
      ]
    ),

    h2('4.2 Authentication Flow'),
    body('Authentication is managed by Supabase Auth with the following flow:'),
    bullet('User visits /login and enters email + password, or clicks "Sign in with Google"'),
    bullet('Supabase validates credentials and issues a JWT access token + refresh token'),
    bullet('The Supabase JS SDK stores the session internally (not in localStorage directly)'),
    bullet('ProtectedRoute in App.tsx calls supabase.auth.getSession() on mount'),
    bullet('If no valid session, the user is redirected to /login with the intended path preserved'),
    bullet('On session expiry, Supabase automatically refreshes via the refresh token'),

    h2('4.3 Login Gate (Production Control)'),
    body('The login button visibility is controlled by the VITE_ENABLE_LOGIN environment variable. This allows the login UI to be hidden in production while the application is being validated.'),
    code('const isLoginEnabled = import.meta.env.VITE_ENABLE_LOGIN === "true";'),
    makeTable(
      ['Environment', 'VITE_ENABLE_LOGIN', 'Effect'],
      [
        ['Production (main)', 'false', 'Login button hidden — inert disabled state'],
        ['Staging', 'true', 'Login button active — full auth flow available'],
        ['Development', 'true', 'Login button active — full auth flow available'],
      ]
    ),

    pageBreak(),
    h1('5. API Documentation'),
    divider(),
    body('The platform exposes three Netlify serverless functions as API endpoints:'),

    h2('5.1 POST /api/contact'),
    body('Accepts contact form submissions, validates input, stores to Supabase, and sends a confirmation email via Resend.'),
    makeTable(
      ['Field', 'Type', 'Required', 'Validation'],
      [
        ['name', 'string', 'Yes', 'Non-empty, max 200 chars'],
        ['email', 'string', 'Yes', 'Valid email format'],
        ['audienceType', 'string', 'Yes', 'Enum: entrepreneur | student | educator | corporate'],
        ['message', 'string', 'Yes', 'Non-empty, max 5000 chars'],
      ]
    ),
    body('Responses: 200 OK on success | 400 Bad Request on validation failure | 405 Method Not Allowed for non-POST | 500 Internal Server Error'),

    h2('5.2 POST /api/chat'),
    body('AI-powered financial analysis endpoint backed by the Anthropic Claude API. Requires a valid Supabase JWT Bearer token in the Authorization header.'),
    makeTable(
      ['Header', 'Value', 'Required'],
      [
        ['Authorization', 'Bearer <supabase-jwt>', 'Yes'],
        ['Content-Type', 'application/json', 'Yes'],
      ]
    ),
    body('Responses: 200 OK with AI analysis | 401 Unauthorized (missing/invalid JWT) | 405 Method Not Allowed | 413 Payload Too Large'),

    h2('5.3 POST /.netlify/functions/purge-cdn'),
    body('Triggers a Netlify CDN cache purge. Protected by a shared secret token in the x-purge-secret header. Used for cache invalidation after content updates.'),
    body('Responses: 200 OK | 401 Unauthorized (wrong/missing secret)'),

    pageBreak(),
    h1('6. Database Schema'),
    divider(),
    body('The platform uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables. Schema is managed via Drizzle ORM with migrations in supabase/migrations/.'),
    makeTable(
      ['Table', 'Purpose', 'RLS Policies'],
      [
        ['profiles', 'Extended user data linked to auth.users', 'SELECT/UPDATE: own record only'],
        ['contact_submissions', 'Contact form entries', 'INSERT: public | SELECT: service-role only'],
        ['user_artifacts', 'Portal tool saved states (BMC, SWOT, etc.)', 'Full CRUD: own records only'],
        ['user_sessions', 'Session tracking metadata', 'SELECT/INSERT: own records only'],
      ]
    ),
    callout('All Supabase tables have RLS enabled. The anon key cannot access data beyond what RLS policies allow.'),

    pageBreak(),
    h1('7. Environment Variables'),
    divider(),
    makeTable(
      ['Variable', 'Scope', 'Required', 'Description'],
      [
        ['VITE_SUPABASE_URL', 'Client', 'Yes', 'Supabase project URL'],
        ['VITE_SUPABASE_ANON_KEY', 'Client', 'Yes', 'Supabase anon/public key'],
        ['VITE_ENABLE_LOGIN', 'Client', 'Yes', '"true" enables login button; omit/false disables it'],
        ['SESSION_SECRET', 'Server', 'Yes', 'Express session secret (32+ char random string)'],
        ['RESEND_API_KEY', 'Server', 'Yes', 'Resend email API key for transactional emails'],
        ['SMARTSHEET_API_TOKEN', 'Server/Dev', 'Dev only', 'Smartsheet API token for project tracker CLI'],
        ['SMARTSHEET_SHEET_ID', 'Server/Dev', 'Dev only', 'Target Smartsheet sheet ID'],
      ]
    ),
    callout('IMPORTANT: Never prefix sensitive secrets with VITE_ — this exposes them in the client bundle.'),

    h1('8. Build & Development Commands'),
    divider(),
    makeTable(
      ['Command', 'Script', 'Description'],
      [
        ['npm run dev', 'vite --config vite.config.ts', 'Start local dev server on port 5173'],
        ['npm run build', 'vite build', 'Build production bundle to client/dist/'],
        ['npm run check', 'tsc', 'TypeScript type checking'],
        ['npm run test', 'vitest run', 'Run unit tests (Vitest)'],
        ['npm run coverage', 'vitest run --coverage', 'Unit test coverage report'],
        ['npx playwright test', '—', 'Run E2E tests (Playwright)'],
        ['npm run db:migrate', 'supabase db push', 'Apply pending DB migrations'],
        ['node scripts/smartsheet-cli.js', '—', 'Smartsheet project tracker CLI'],
      ]
    ),

    h1('9. Deployment'),
    divider(),
    body('Deployment is managed by Netlify with automatic branch deploys configured in netlify.toml:'),
    makeTable(
      ['Branch', 'Environment', 'URL', 'Login'],
      [
        ['main', 'Production', 'https://edmeca.co.za', 'Disabled'],
        ['staging', 'Staging', 'https://staging--edmecaacademy.netlify.app', 'Enabled'],
        ['development', 'Dev Preview', 'Netlify preview URL', 'Enabled'],
      ]
    ),
    body('After every merge to main, sync staging and development:'),
    code('git checkout staging && git merge main --no-edit && git push origin staging'),
    code('git checkout development && git merge main --no-edit && git push origin development'),
    code('git checkout main'),
  ];

  const doc = new Document({
    creator: 'X4O Consulting / EdMeCa Academy',
    title: 'Technical Documentation — EdMeCa Academy',
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: sections }]
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'EDMECA_Technical_Documentation.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Generated: ${path.basename(outPath)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 2 — User Guide (6.2)
// ─────────────────────────────────────────────────────────────────────────────
async function generateUserGuide() {
  const sections = [
    ...coverPage('User Guide', 'Portal Tools & Platform Help System', 'EDMECA-DOC-6.2'),

    h1('1. Welcome to EdMeCa Academy'),
    divider(),
    body('Welcome to the EdMeCa Digital Academy — a practical, empowering business education platform designed for South African entrepreneurs, students, and educators. This guide will help you get started, navigate the portal, and make the most of all available tools.'),
    callout('EdMeCa Academy empowers entrepreneurs with the knowledge, tools, and community to build sustainable businesses.'),

    h1('2. Getting Started'),
    divider(),
    h2('2.1 Creating an Account'),
    body('To access the EdMeCa portal and all its tools, you first need to create a free account:'),
    bullet('Visit https://edmeca.co.za and click the Login button in the top navigation'),
    bullet('Click "Don\'t have an account? Sign up" to open the registration page'),
    bullet('Enter your full name, email address, and a secure password (minimum 8 characters)'),
    bullet('Click "Create Account" — a confirmation email will be sent to your inbox'),
    bullet('Open the confirmation email and click the verification link'),
    bullet('You\'re now registered and can log in!'),

    h2('2.2 Logging In'),
    body('Once registered, you can log in with:'),
    bullet('Email & Password: Enter your registered email and password, then click "Sign In"'),
    bullet('Google Sign-In: Click "Continue with Google" to authenticate with your Google account'),
    callout('Tip: Use the "Remember me" option to stay logged in on your personal device.'),

    h2('2.3 Resetting Your Password'),
    bullet('Click "Forgot your password?" on the login page'),
    bullet('Enter your registered email address'),
    bullet('Check your inbox for a password reset email'),
    bullet('Click the link in the email and enter your new password'),

    pageBreak(),
    h1('3. Portal Dashboard'),
    divider(),
    body('Once logged in, you\'ll arrive at the Portal Dashboard — your central hub for all EdMeCa tools and resources.'),
    h2('3.1 Dashboard Overview'),
    makeTable(
      ['Section', 'Description'],
      [
        ['Welcome Panel', 'Displays your name and a personalised greeting'],
        ['Tool Cards', 'Quick-access cards for all 6 business tools'],
        ['Progress Summary', 'Overview of your progress across tools'],
        ['Navigation Menu', 'Access all tools via the top navigation bar'],
      ]
    ),

    pageBreak(),
    h1('4. Business Tools Guide'),
    divider(),
    body('The EdMeCa portal provides 6 practical business tools designed to guide you from idea to execution:'),

    h2('4.1 Business Model Canvas (BMC)'),
    body('The Business Model Canvas is a strategic management and lean startup template for developing new or documenting existing business models.'),
    makeTable(
      ['Canvas Section', 'Description'],
      [
        ['Key Partners', 'Who are your key partners and suppliers?'],
        ['Key Activities', 'What key activities does your value proposition require?'],
        ['Key Resources', 'What key resources does your business need?'],
        ['Value Propositions', 'What value do you deliver to the customer?'],
        ['Customer Relationships', 'What type of relationship does each customer segment expect?'],
        ['Channels', 'Through which channels do your customer segments want to be reached?'],
        ['Customer Segments', 'For whom are you creating value?'],
        ['Cost Structure', 'What are the most important costs in your business model?'],
        ['Revenue Streams', 'For what value are your customers really willing to pay?'],
      ]
    ),
    bullet('Click any canvas section to add, edit, or remove entries'),
    bullet('Your canvas auto-saves as you type'),
    bullet('Use the Export button to download your canvas as a PDF'),

    h2('4.2 SWOT & PESTLE Analysis Tool'),
    body('Conduct a comprehensive strategic analysis of your business environment.'),
    body('SWOT Analysis examines internal and external factors:'),
    bullet('Strengths — Internal advantages and capabilities'),
    bullet('Weaknesses — Internal limitations and disadvantages'),
    bullet('Opportunities — External factors you could exploit'),
    bullet('Threats — External factors that could cause trouble'),
    body('PESTLE Analysis examines macro-environmental factors:'),
    bullet('Political, Economic, Social, Technological, Legal, Environmental'),
    bullet('Toggle between SWOT and PESTLE using the tab selector at the top of the tool'),

    h2('4.3 Value Proposition Tool'),
    body('Define and refine your product or service\'s Value Proposition using the proven Value Proposition Canvas framework. Map your value map against your customer profile to identify fit.'),
    bullet('Customer Jobs — What are your customers trying to accomplish?'),
    bullet('Pains — What annoys your customers? What risks do they fear?'),
    bullet('Gains — What outcomes and benefits do customers want?'),
    bullet('Products & Services — What products/services help customers get jobs done?'),
    bullet('Pain Relievers — How do your offerings reduce customer pains?'),
    bullet('Gain Creators — How do your offerings create customer gains?'),

    h2('4.4 Pitch Builder Tool'),
    body('Build a professional investor-ready pitch deck structure step by step. The tool guides you through the key slides every successful pitch deck needs:'),
    makeTable(
      ['Slide', 'Content'],
      [
        ['1. Problem', 'What problem are you solving?'],
        ['2. Solution', 'How does your product/service solve it?'],
        ['3. Market Size', 'Total Addressable Market (TAM, SAM, SOM)'],
        ['4. Business Model', 'How do you make money?'],
        ['5. Traction', 'Evidence of progress and validation'],
        ['6. Team', 'Who is behind the business?'],
        ['7. Financials', 'Revenue projections and key metrics'],
        ['8. The Ask', 'What are you raising and for what purpose?'],
      ]
    ),

    h2('4.5 Progress Tracker'),
    body('Track your learning journey and business milestones with the Progress Tracker. Set goals, mark milestones complete, and monitor your overall completion percentage.'),
    bullet('Add new milestones by clicking "Add Milestone"'),
    bullet('Check the checkbox next to a milestone to mark it complete'),
    bullet('The progress bar at the top updates automatically'),
    bullet('Use the Notes field to attach context to each milestone'),

    h2('4.6 Financial Analysis Tool (AI-Powered)'),
    body('The Financial Analysis Tool uses Anthropic Claude AI to provide intelligent analysis of your business financials. Upload your financial data and receive structured insights on profitability, cash flow, and financial health.'),
    bullet('Upload financial documents (PDF, CSV, or Excel format)'),
    bullet('Provide context about your business in the text field'),
    bullet('Click "Analyse" to generate an AI-powered financial report'),
    bullet('Review the structured analysis covering revenue trends, cost drivers, and recommendations'),
    callout('Note: This tool requires an active internet connection and a valid EdMeCa account session.'),

    pageBreak(),
    h1('5. Profile Management'),
    divider(),
    body('Update your personal profile from the portal navigation:'),
    bullet('Click your name or avatar icon in the top-right corner'),
    bullet('Select "Profile" from the dropdown menu'),
    bullet('Update your display name, email, and profile photo'),
    bullet('Click "Save Changes" to confirm updates'),

    h1('6. Frequently Asked Questions'),
    divider(),
    makeTable(
      ['Question', 'Answer'],
      [
        ['Can I use the tools on mobile?', 'Yes — the platform is fully responsive and optimised for mobile devices and tablets.'],
        ['Is my data saved automatically?', 'Yes — all tool inputs auto-save as you type. You can safely close the browser and return later.'],
        ['Can I share my canvases with others?', 'Sharing functionality is on the roadmap for a future release.'],
        ['What browsers are supported?', 'Chrome, Firefox, Safari, and Edge — all major modern browsers are supported.'],
        ['I forgot my password — what do I do?', 'Use the "Forgot Password" link on the login page to receive a reset email.'],
        ['Is there a free plan?', 'Current access is provided to registered EdMeCa Academy learners. Contact info@edmeca.co.za for access.'],
        ['How do I contact support?', 'Use the Contact form at edmeca.co.za/contact or email info@edmeca.co.za'],
      ]
    ),

    h1('7. Contact & Support'),
    divider(),
    body('For help, feedback, or technical issues, please reach out through any of the following channels:'),
    bullet('Contact Form: https://edmeca.co.za/contact'),
    bullet('Email: info@edmeca.co.za'),
    bullet('Website: https://edmeca.co.za'),
    callout('EdMeCa Academy — Empowering entrepreneurs through practical business education.'),
  ];

  const doc = new Document({
    creator: 'X4O Consulting / EdMeCa Academy',
    title: 'User Guide — EdMeCa Academy',
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: sections }]
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'EDMECA_User_Guide.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Generated: ${path.basename(outPath)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3 — Admin Documentation (6.3)
// ─────────────────────────────────────────────────────────────────────────────
async function generateAdminDoc() {
  const sections = [
    ...coverPage('Admin Documentation', 'Platform Administration & Content Management', 'EDMECA-DOC-6.3'),

    h1('1. Overview'),
    divider(),
    body('This document covers administrative procedures for managing the EdMeCa Academy platform. It is intended for designated platform administrators and the development team at X4O Consulting.'),
    callout('Admin access requires valid credentials. Never share admin credentials. Use the principle of least privilege.'),

    h1('2. Admin Portals & Access'),
    divider(),
    makeTable(
      ['System', 'URL', 'Access Method', 'Role'],
      [
        ['Supabase Dashboard', 'https://supabase.com/dashboard', 'Email + Password', 'Platform Admin'],
        ['Netlify Dashboard', 'https://app.netlify.com', 'Email / OAuth', 'Deploy Admin'],
        ['Resend Dashboard', 'https://resend.com/dashboard', 'Email + Password', 'Email Admin'],
        ['Google Cloud Console', 'https://console.cloud.google.com', 'Google Account', 'OAuth Admin'],
        ['Smartsheet', 'https://app.smartsheet.com', 'Email + Password', 'Project Tracker'],
      ]
    ),

    pageBreak(),
    h1('3. Supabase Administration'),
    divider(),
    h2('3.1 User Management'),
    body('To view and manage registered users:'),
    bullet('Log in to the Supabase Dashboard at supabase.com/dashboard'),
    bullet('Select the EdMeCa project (ID: dqvdnyxkkletgkkpicdg)'),
    bullet('Navigate to Authentication → Users'),
    bullet('Here you can view all registered users, their sign-in method, and last login date'),

    h2('3.2 Admin Actions for Users'),
    makeTable(
      ['Action', 'How To', 'Notes'],
      [
        ['View user details', 'Authentication → Users → click user row', 'Shows email, UID, created date, providers'],
        ['Delete a user', 'Authentication → Users → click user → Delete User', 'Permanent — cannot be undone'],
        ['Reset user password', 'Authentication → Users → Send Reset Password', 'Sends reset email to user'],
        ['Ban / Suspend user', 'Authentication → Users → Ban User', 'Blocks login without deleting data'],
        ['View user data', 'Table Editor → profiles (filter by user_id)', 'Shows portal data and profile info'],
      ]
    ),

    h2('3.3 Database Management (Table Editor)'),
    body('The Supabase Table Editor provides a spreadsheet-like interface for managing data:'),
    makeTable(
      ['Table', 'Purpose', 'Admin Actions'],
      [
        ['profiles', 'User display names, avatars, preferences', 'View, edit records'],
        ['contact_submissions', 'Contact form submissions', 'View, export, delete'],
        ['user_artifacts', 'All portal tool saved states', 'View, audit, delete on request'],
      ]
    ),

    h2('3.4 Viewing Contact Form Submissions'),
    bullet('Go to Supabase Dashboard → Table Editor → contact_submissions'),
    bullet('All form submissions are stored here with timestamp, name, email, and message'),
    bullet('To export: click the Download icon to get a CSV/JSON export'),
    bullet('To delete a record: select the row and press Delete'),

    pageBreak(),
    h1('4. Netlify Administration'),
    divider(),
    h2('4.1 Deploy Management'),
    bullet('Log in to app.netlify.com'),
    bullet('Select site: edmecaacademy.netlify.app'),
    bullet('Deploys tab: view all deployment history, trigger manual deploys, roll back'),
    bullet('Site Settings → Environment Variables: manage per-context env vars'),

    h2('4.2 Triggering a Manual Deploy'),
    bullet('Open app.netlify.com → select site'),
    bullet('Click "Deploys" → "Trigger deploy" → "Deploy site"'),
    bullet('Use "Clear cache and deploy site" if CSS or JS changes aren\'t appearing'),

    h2('4.3 Rolling Back a Deploy'),
    bullet('Go to Deploys tab and find the last known-good deploy'),
    bullet('Click the deploy entry → "Publish deploy"'),
    bullet('The production URL will revert to that deploy immediately'),

    h2('4.4 Netlify Forms (Contact Submissions)'),
    body('Netlify Forms is configured as a backup intake method alongside Supabase. To view form submissions:'),
    bullet('Netlify Dashboard → Forms tab'),
    bullet('Select the "contact" form'),
    bullet('Download or view submissions'),

    pageBreak(),
    h1('5. Email Administration (Resend)'),
    divider(),
    body('All transactional emails (signup confirmation, password reset) are sent via Resend from Info@edmeca.co.za.'),
    makeTable(
      ['Email Type', 'Trigger', 'Template Location'],
      [
        ['Signup Confirmation', 'New user registers', 'Supabase Dashboard → Auth → Email Templates → Confirm Signup'],
        ['Password Reset', 'User requests reset', 'Supabase Dashboard → Auth → Email Templates → Reset Password'],
        ['Magic Link', 'Passwordless login', 'Supabase Dashboard → Auth → Email Templates → Magic Link'],
      ]
    ),
    body('To update an email template:'),
    bullet('Log in to Supabase Dashboard → Authentication → Email Templates'),
    bullet('Select the template to edit'),
    bullet('Update HTML content (use {{ .ConfirmationURL }} for links)'),
    bullet('Save changes — live immediately'),

    h1('6. Analytics & Monitoring'),
    divider(),
    body('Basic platform analytics are available through:'),
    makeTable(
      ['Tool', 'What It Shows', 'Access'],
      [
        ['Netlify Analytics', 'Page views, unique visitors, top pages, bandwidth', 'Netlify Dashboard → Analytics'],
        ['Supabase Logs', 'API requests, auth events, DB queries, errors', 'Supabase Dashboard → Logs'],
        ['Netlify Function Logs', 'Serverless function invocations and errors', 'Netlify → Functions tab'],
      ]
    ),
  ];

  const doc = new Document({
    creator: 'X4O Consulting / EdMeCa Academy',
    title: 'Admin Documentation — EdMeCa Academy',
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: sections }]
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'EDMECA_Admin_Documentation.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Generated: ${path.basename(outPath)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 4 — Maintenance Procedures (6.4)
// ─────────────────────────────────────────────────────────────────────────────
async function generateMaintenanceDoc() {
  const sections = [
    ...coverPage('Maintenance Procedures', 'Operational Runbook & Troubleshooting Guide', 'EDMECA-DOC-6.4'),

    h1('1. Overview'),
    divider(),
    body('This document defines the operational maintenance procedures for the EdMeCa Academy platform. It covers scheduled maintenance, update processes, backup procedures, monitoring, and incident troubleshooting.'),
    callout('Always test changes on the staging branch before merging to main. Never apply untested changes directly to production.'),

    h1('2. Maintenance Schedule'),
    divider(),
    makeTable(
      ['Frequency', 'Task', 'Owner', 'Estimated Time'],
      [
        ['Weekly', 'Review Netlify deploy logs for errors', 'Dev', '15 min'],
        ['Weekly', 'Check Supabase auth logs for anomalies', 'Dev', '15 min'],
        ['Monthly', 'Run npm audit and review vulnerabilities', 'Dev', '30 min'],
        ['Monthly', 'Review and rotate API keys if needed', 'Admin', '30 min'],
        ['Monthly', 'Update dependencies (patch/minor only)', 'Dev', '1–2 hrs'],
        ['Quarterly', 'Full Playwright E2E test suite on staging', 'Dev', '2 hrs'],
        ['Quarterly', 'Review and update email templates', 'Admin', '1 hr'],
        ['Quarterly', 'Supabase project health check', 'Dev', '1 hr'],
        ['As needed', 'Security patch deploys', 'Dev', 'ASAP'],
      ]
    ),

    pageBreak(),
    h1('3. Dependency Update Process'),
    divider(),
    body('Follow this process to safely update npm dependencies:'),
    bullet('Step 1: Create a feature branch from development'),
    code('git checkout development && git pull origin development'),
    code('git checkout -b chore/dependency-update-YYYY-MM'),
    bullet('Step 2: Run npm audit to assess current vulnerabilities'),
    code('npm audit'),
    bullet('Step 3: Apply safe automatic fixes'),
    code('npm audit fix'),
    bullet('Step 4: Check for outdated packages'),
    code('npm outdated'),
    bullet('Step 5: Test the build after updates'),
    code('npm run build && npm run test'),
    bullet('Step 6: Run E2E tests on staging after merging'),
    callout('Do NOT run npm audit fix --force without understanding the breaking changes it introduces.'),

    h2('3.1 High-Risk Packages to Monitor'),
    makeTable(
      ['Package', 'Risk Level', 'Notes'],
      [
        ['@supabase/supabase-js', 'Critical', 'Auth client — test all auth flows after update'],
        ['react / react-dom', 'High', 'Test entire UI after major version bumps'],
        ['vite', 'Medium', 'Test build output after updates'],
        ['@anthropic-ai/sdk', 'High', 'Server-side only — test financial analysis tool'],
        ['drizzle-orm', 'Medium', 'Test DB migrations after update'],
      ]
    ),

    pageBreak(),
    h1('4. Deployment & Branch Sync'),
    divider(),
    h2('4.1 Standard Deploy Process'),
    body('All production deployments flow through the Git branch hierarchy:'),
    bullet('1. Develop on development branch (or a feature branch off it)'),
    bullet('2. Test thoroughly on development / staging'),
    bullet('3. Create a PR to merge development → staging → main'),
    bullet('4. Netlify auto-deploys on push to each branch'),

    h2('4.2 Post-Deploy Branch Sync'),
    body('After every merge to main, sync staging and development to keep branches aligned:'),
    code('git checkout staging'),
    code('git merge main --no-edit'),
    code('git push origin staging'),
    code('git checkout development'),
    code('git merge main --no-edit'),
    code('git push origin development'),
    code('git checkout main'),

    h2('4.3 Hotfix Process'),
    body('For urgent production fixes:'),
    bullet('Branch off main: git checkout -b hotfix/description main'),
    bullet('Apply the minimal fix and test locally'),
    bullet('Merge directly to main with PR review'),
    bullet('Immediately sync to staging and development'),
    bullet('Update Smartsheet with the hotfix task status'),

    pageBreak(),
    h1('5. Troubleshooting Guide'),
    divider(),
    h2('5.1 Common Issues'),
    makeTable(
      ['Symptom', 'Likely Cause', 'Resolution'],
      [
        ['Login page not showing up', 'VITE_ENABLE_LOGIN not set to "true"', 'Check Netlify env vars for staging/dev context'],
        ['Confirmation email not received', 'Supabase SMTP config or spam filter', 'Check Resend dashboard logs; user checks spam folder'],
        ['Portal shows blank page after login', 'Auth session not initialised before React renders', 'Check ProtectedRoute and supabase.auth.getSession()'],
        ['Contact form 400 error', 'Validation failure (missing field or bad email)', 'Check the request body for missing required fields'],
        ['Financial analysis 401 error', 'Expired or missing JWT token', 'User needs to log in again; check token refresh logic'],
        ['Build fails on Netlify', 'Node version mismatch or env vars missing', 'Check netlify.toml NODE_VERSION and Netlify env vars'],
        ['CSS not updating after deploy', 'CDN cache serving stale assets', 'Use "Clear cache and deploy site" in Netlify'],
        ['Supabase quota exceeded', 'Free tier limits hit (database or bandwidth)', 'Upgrade Supabase plan or optimise queries'],
      ]
    ),

    h2('5.2 Checking Logs'),
    body('To diagnose issues:'),
    bullet('Netlify Function logs: app.netlify.com → Functions → View logs in real-time'),
    bullet('Supabase logs: supabase.com → project → Logs Explorer (filter by service)'),
    bullet('Browser console: Press F12 → Console (check for JS errors and network failures)'),
    bullet('Network tab: F12 → Network → filter by XHR to see API calls and responses'),

    h1('6. Backup & Recovery'),
    divider(),
    body('Supabase manages automated backups on paid plans. For the free tier:'),
    makeTable(
      ['Backup Method', 'Frequency', 'Retention', 'Storage'],
      [
        ['Supabase Point-in-Time Recovery (paid)', 'Continuous', '7 days', 'Supabase managed'],
        ['Manual Supabase export', 'Monthly (manual)', 'Indefinite', 'Admin download'],
        ['Git repository', 'Every commit', 'Indefinite', 'GitHub'],
        ['Netlify deploy snapshots', 'Every deploy', '90 days', 'Netlify managed'],
      ]
    ),
    body('To perform a manual Supabase database export:'),
    bullet('Supabase Dashboard → Settings → Database → Download backup'),
    bullet('Or use CLI: npx supabase db dump -f backup_YYYY-MM-DD.sql'),

    h1('7. Rollback Procedures'),
    divider(),
    body('If a deployment causes a regression:'),
    bullet('Netlify rollback: Netlify Dashboard → Deploys → click previous good deploy → Publish Deploy'),
    bullet('Database rollback: Apply the previous migration: npx supabase db reset (caution — drops and recreates DB)'),
    bullet('Code rollback: git revert <commit-hash> on main, then push'),
  ];

  const doc = new Document({
    creator: 'X4O Consulting / EdMeCa Academy',
    title: 'Maintenance Procedures — EdMeCa Academy',
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: sections }]
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'EDMECA_Maintenance_Procedures.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Generated: ${path.basename(outPath)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 5 — Security Documentation (6.5)
// ─────────────────────────────────────────────────────────────────────────────
async function generateSecurityDoc() {
  const sections = [
    ...coverPage('Security Documentation', 'Security Policies, Procedures & Compliance', 'EDMECA-DOC-6.5'),

    h1('1. Overview'),
    divider(),
    body('This document defines the security policies, procedures, and compliance posture for the EdMeCa Academy Digital Platform. It is intended for the development team, administrators, and supervisors responsible for maintaining the platform\'s security.'),
    callout('A formal security audit was conducted on 04 March 2026. The full audit report is available at: deliverables/Phase-4-Testing/EDMECA_Security_Audit_Report_2026-03-04.docx'),

    h1('2. Security Posture Summary'),
    divider(),
    body('The following OWASP Top 10 (2021) security tests were conducted and passed during Phase 4 Security Testing:'),
    makeTable(
      ['Test ID', 'OWASP Category', 'Test Description', 'Result'],
      [
        ['SEC-001', 'A03 – Injection', 'XSS — dangerouslySetInnerHTML / eval() scan', 'PASS'],
        ['SEC-002', 'A02 – Cryptographic', 'Hardcoded credentials in source code', 'PASS'],
        ['SEC-003', 'A02 – Cryptographic', 'Insecure HTTP connections (non-HTTPS)', 'PASS'],
        ['SEC-004', 'A09 – Logging', 'Sensitive data in console.log output', 'PASS'],
        ['SEC-005', 'A02 – Cryptographic', 'Auth tokens in localStorage/sessionStorage', 'PASS'],
        ['SEC-006', 'A01 – Access Control', 'CORS policy on API endpoints', 'REVIEW'],
        ['SEC-007', 'A03 – Injection', 'SQL injection via Supabase query builder', 'PASS'],
        ['SEC-008', 'A07 – Auth Failures', 'Portal route authentication guards', 'PASS'],
        ['SEC-009', 'A06 – Outdated Deps', 'npm audit — dependency vulnerabilities', 'REVIEW'],
        ['SEC-010', 'A05 – Misconfiguration', 'HTTP security headers (CSP, HSTS, etc.)', 'PASS'],
      ]
    ),
    callout('Status: PASS = No vulnerability found. REVIEW = Low-risk item noted for monitoring.'),

    pageBreak(),
    h1('3. Security Policies'),
    divider(),
    h2('3.1 Password Policy'),
    makeTable(
      ['Policy', 'Requirement'],
      [
        ['Minimum Length', '8 characters'],
        ['Complexity', 'Enforced by Supabase Auth — requires mixed characters'],
        ['Expiry', 'No forced expiry — user-initiated reset available'],
        ['Storage', 'Supabase manages password hashing (bcrypt) — never stored in plain text'],
        ['Transmission', 'HTTPS enforced by Netlify HSTS header (max-age=31536000)'],
      ]
    ),

    h2('3.2 Environment Variable Policy'),
    bullet('All secrets and API keys MUST be stored in .env.local (gitignored)'),
    bullet('Never prefix sensitive variables with VITE_ (exposes to client bundle)'),
    bullet('Netlify environment variables are set per-context (production/staging/development)'),
    bullet('Credentials must never appear in source code, comments, or commit messages'),
    bullet('API tokens must be rotated immediately if accidental exposure is detected'),

    h2('3.3 Authentication & Session Policy'),
    bullet('Supabase JWT tokens are used for all authenticated API calls'),
    bullet('Token expiry: 1 hour (configurable in Supabase Auth settings)'),
    bullet('Refresh token rotation is enabled — tokens cannot be replayed after use'),
    bullet('Google OAuth is the only third-party provider enabled'),
    bullet('All /portal/* routes are protected by ProtectedRoute in App.tsx'),

    h2('3.4 Data Handling Policy'),
    bullet('All user data is stored in Supabase with Row Level Security (RLS) enabled'),
    bullet('Users can only access their own records — enforced at the database level'),
    bullet('Contact form data is stored only in the contact_submissions table'),
    bullet('No financial data is stored — Financial Analysis Tool inputs are processed in-memory only'),
    bullet('User session data is managed by Supabase Auth SDK, not manually'),

    pageBreak(),
    h1('4. HTTP Security Headers'),
    divider(),
    body('The following security headers are configured in netlify.toml and applied to all responses:'),
    makeTable(
      ['Header', 'Value', 'Purpose'],
      [
        ['Content-Security-Policy', 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; ...', 'Prevents XSS and injection attacks'],
        ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload', 'Enforces HTTPS'],
        ['X-Frame-Options', 'DENY', 'Prevents clickjacking attacks'],
        ['X-XSS-Protection', '1; mode=block', 'Legacy XSS browser filter'],
        ['X-Content-Type-Options', 'nosniff', 'Prevents MIME sniffing'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin', 'Limits referrer header leakage'],
        ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()', 'Restricts browser API access'],
      ]
    ),

    h1('5. Incident Response Procedures'),
    divider(),
    h2('5.1 Incident Classification'),
    makeTable(
      ['Level', 'Description', 'Response Time', 'Examples'],
      [
        ['P1 – Critical', 'Active breach or data exposure', 'Immediate (< 1 hour)', 'Credentials in git history, RLS bypass'],
        ['P2 – High', 'Vulnerability exploitable in production', '< 24 hours', 'Unpatched CVE in critical dependency'],
        ['P3 – Medium', 'Potential weakness, not actively exploited', '< 7 days', 'CORS review finding, weak CSP'],
        ['P4 – Low', 'Informational finding, low risk', '< 30 days', 'Dependency advisory, console log'],
      ]
    ),

    h2('5.2 Incident Response Steps'),
    body('P1 Critical Incident:'),
    bullet('1. ISOLATE: Immediately revoke exposed credentials (rotate API keys, tokens)'),
    bullet('2. CONTAIN: If code is in git history, contact GitHub support for history purge'),
    bullet('3. ASSESS: Determine scope of exposure — what data, how long, who accessed'),
    bullet('4. NOTIFY: Inform supervisor (Raymond Crown) and affected users within 72 hours (POPIA requirement)'),
    bullet('5. REMEDIATE: Fix the root cause and deploy the patch'),
    bullet('6. DOCUMENT: Create an incident report and update the bug tracker'),
    bullet('7. REVIEW: Post-incident review to prevent recurrence'),

    h2('5.3 Credential Rotation Procedure'),
    body('If a secret is suspected to be compromised:'),
    bullet('Supabase JWT Secret: Supabase Dashboard → Settings → API → Regenerate JWT Secret'),
    bullet('Resend API Key: Resend Dashboard → API Keys → Revoke and generate new key'),
    bullet('Google OAuth Secret: Google Cloud Console → Credentials → Regenerate secret'),
    bullet('After rotation: Update .env.local locally and update Netlify environment variables'),
    bullet('Redeploy all environments immediately after rotation'),

    pageBreak(),
    h1('6. Privacy & Compliance (POPIA)'),
    divider(),
    body('The EdMeCa Academy platform operates under the Protection of Personal Information Act (POPIA). The following controls are in place:'),
    makeTable(
      ['POPIA Requirement', 'Implementation', 'Status'],
      [
        ['Lawful processing', 'Data collected only for stated purpose (education platform)', 'Compliant'],
        ['Consent', 'Users accept terms on signup', 'Compliant'],
        ['Data minimisation', 'Only name, email, and tool data collected', 'Compliant'],
        ['Data subject rights', 'Profile deletion available; admin can delete on request', 'Compliant'],
        ['Security safeguards', 'RLS, HTTPS, JWT auth, HSTS headers', 'Compliant'],
        ['Breach notification', 'Incident response procedure defined (Section 5)', 'Compliant'],
        ['Data retention', 'Contact data retained for business operations', 'Review annually'],
      ]
    ),

    h1('7. Access Control Matrix'),
    divider(),
    makeTable(
      ['Role', 'Platform Access', 'Supabase Access', 'Netlify Access', 'Source Code'],
      [
        ['End User', 'Portal (own data only)', 'None', 'None', 'None'],
        ['Platform Admin', 'All portal + admin', 'Dashboard (limited)', 'View analytics', 'None'],
        ['Developer', 'All environments', 'Full dashboard', 'Full deploy access', 'Read + Write'],
        ['Supervisor', 'Staging review only', 'View only', 'View analytics', 'Read only'],
      ]
    ),

    h1('8. Security Audit Log'),
    divider(),
    makeTable(
      ['Audit Date', 'Type', 'Conducted By', 'Result', 'Report'],
      [
        ['04 March 2026', 'Automated OWASP Static Analysis', 'X4O Consulting', '8 PASS, 2 REVIEW', 'EDMECA_Security_Audit_Report_2026-03-04.docx'],
        ['04 March 2026', 'Live Endpoint Security Test', 'X4O Consulting', 'All tests passed', 'Included in audit report'],
        ['Ongoing', 'npm audit (monthly)', 'Dev Team', 'Monitored', 'Inline Smartsheet updates'],
      ]
    ),
    callout('Next scheduled security review: June 2026 (quarterly). Schedule a penetration test for the pre-launch review.'),
  ];

  const doc = new Document({
    creator: 'X4O Consulting / EdMeCa Academy',
    title: 'Security Documentation — EdMeCa Academy',
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: sections }]
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'EDMECA_Security_Documentation.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Generated: ${path.basename(outPath)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📄 EdMeCa Academy — Phase 6 Documentation Generator');
  console.log('════════════════════════════════════════════════════');
  console.log(`📂 Output: ${OUT_DIR}\n`);

  await generateTechnicalDoc();
  await generateUserGuide();
  await generateAdminDoc();
  await generateMaintenanceDoc();
  await generateSecurityDoc();

  console.log('\n✅ All 5 documentation files generated successfully.');
  console.log('📁 Location: deliverables/Phase-6-Documentation/\n');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
