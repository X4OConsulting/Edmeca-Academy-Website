/**
 * EDMECA Academy — Stakeholder Security Report Generator
 * Produces a plain-language executive summary for non-technical stakeholders.
 * Usage: node scripts/security-stakeholder-report.mjs
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
const ROOT = path.resolve(__dirname, '..');
const REPORT_DATE = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
const REPORT_YEAR = new Date().getFullYear();

// ─── Colour Palette ──────────────────────────────────────────────────────────
const NAVY        = '1f3a6e';
const WHITE       = 'FFFFFF';
const LIGHT_GREY  = 'F8F9FA';
const MID_GREY    = 'E9ECEF';
const DARK_GREY   = '495057';
const GREEN       = '1E7E34';
const AMBER       = 'D97706';
const RED         = 'B91C1C';
const LIGHT_GREEN = 'D1FAE5';
const LIGHT_AMBER = 'FEF3C7';
const LIGHT_RED   = 'FEE2E2';
const NAVY_LIGHT  = 'EEF2FF';
const ACCENT      = '2563EB';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sp = (before = 0, after = 160) => ({ spacing: { before, after } });

const para = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, ...opts })],
  ...sp(0, 120)
});

const centred = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, ...opts })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 }
});

const h1 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 32, color: NAVY })],
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 }
});

const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 160 }
});

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 22, color: NAVY })],
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 }
});

const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
  spacing: { after: 200 }
});

const bullet = (text, bold = false) => new Paragraph({
  children: [new TextRun({ text, size: 22, bold })],
  bullet: { level: 0 },
  spacing: { after: 100 }
});

const callout = (text, bgColor = NAVY_LIGHT, textColor = NAVY) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: textColor })],
  shading: { type: ShadingType.SOLID, color: bgColor },
  indent: { left: 240, right: 240 },
  spacing: { before: 120, after: 200 }
});

const cell = (text, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
  verticalAlign: 'center',
  children: [new Paragraph({
    children: [new TextRun({ text: String(text), size: 20, bold: !!opts.bold, color: opts.color || '000000' })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { after: 0 }
  })]
});

const headerCell = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  shading: { type: ShadingType.SOLID, color: NAVY },
  children: [new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: WHITE })],
    spacing: { after: 0 }
  })]
});

const tableBorders = {
  top:     { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  bottom:  { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  left:    { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  right:   { style: BorderStyle.SINGLE, size: 4, color: NAVY },
  insideH: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  insideV: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
};

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'EDMECA Academy / X4O Consulting',
  title: 'Security Audit — Stakeholder Summary Report',
  description: 'Plain-language security posture summary for EDMECA Digital Academy stakeholders',
  sections: [{
    properties: {
      page: { margin: { top: 1080, bottom: 1080, left: 1134, right: 1134 } }
    },
    children: [

      // ══════════════════════════════════════════════════════════════════════
      // COVER PAGE
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({
        children: [new TextRun({ text: ' ', size: 48 })],
        spacing: { after: 800 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'EDMECA DIGITAL ACADEMY', bold: true, size: 52, color: NAVY })],
        alignment: AlignmentType.CENTER, spacing: { after: 160 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Security Audit', bold: true, size: 64, color: NAVY })],
        alignment: AlignmentType.CENTER, spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Stakeholder Summary Report', size: 30, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 600 }
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Date:`, bold: true, size: 24, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: REPORT_DATE, size: 24, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Prepared by:', bold: true, size: 24, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'X4O Consulting — EDMECA Development Team', size: 24, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Classification:', bold: true, size: 24, color: DARK_GREY })],
        alignment: AlignmentType.CENTER, spacing: { after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'CONFIDENTIAL — For Authorised Stakeholders Only', bold: true, size: 24, color: RED })],
        alignment: AlignmentType.CENTER, spacing: { after: 600 }
      }),
      new Paragraph({
        children: [new TextRun({ text: ' ', size: 22 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Powered by X4O', size: 20, color: DARK_GREY, italics: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 0 }
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 1. EXECUTIVE SUMMARY
      // ══════════════════════════════════════════════════════════════════════
      h1('1. Executive Summary'),
      divider(),
      para('The EDMECA Digital Academy platform underwent a structured security audit on 3 March 2026. The audit was conducted by the X4O Consulting development team and covered the web application, all server-side functions, the database, and all third-party software components.'),
      new Paragraph({ spacing: { after: 120 } }),
      para('The overall outcome is positive. The platform was found to have strong foundational security controls in place, including properly configured user authentication, database-level access controls, and no exposed credentials or passwords in the codebase. Several areas requiring improvement were identified; the most significant issues have already been resolved as part of this audit cycle.'),
      new Paragraph({ spacing: { after: 120 } }),

      // Scorecard
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({
            children: [
              headerCell('Area', 40),
              headerCell('Status', 30),
              headerCell('Action Taken', 30),
            ]
          }),
          new TableRow({ children: [
            cell('User Authentication', { shading: LIGHT_GREY }),
            cell('Secure', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('No action required', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Database Access Controls', { shading: WHITE }),
            cell('Secure', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('Minor policy clarification applied', { shading: WHITE }),
          ]}),
          new TableRow({ children: [
            cell('API Security (AI & Contact)', { shading: LIGHT_GREY }),
            cell('Resolved', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('4 issues identified and fixed', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Data Privacy (POPIA)', { shading: WHITE }),
            cell('Resolved', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('Personal data no longer logged', { shading: WHITE }),
          ]}),
          new TableRow({ children: [
            cell('Website Security Headers', { shading: LIGHT_GREY }),
            cell('Resolved', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('HSTS and CSP headers added', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Third-Party Software (Dependencies)', { shading: WHITE }),
            cell('Attention Required', { shading: LIGHT_AMBER, bold: true, color: AMBER }),
            cell('9 known issues remain — plan in place', { shading: WHITE }),
          ]}),
          new TableRow({ children: [
            cell('No Passwords/Keys in Codebase', { shading: LIGHT_GREY }),
            cell('Secure', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('No action required', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Abuse Prevention (Rate Limiting)', { shading: WHITE }),
            cell('Attention Required', { shading: LIGHT_AMBER, bold: true, color: AMBER }),
            cell('Planned for next development phase', { shading: WHITE }),
          ]}),
        ]
      }),
      new Paragraph({ spacing: { after: 300 } }),

      callout('Overall Security Posture: GOOD — The platform is suitable for continued development and staged rollout. No critical or high-severity vulnerabilities remain in application code. Action is required on third-party components and abuse prevention before full public launch.', NAVY_LIGHT, NAVY),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 2. WHAT WAS TESTED
      // ══════════════════════════════════════════════════════════════════════
      h1('2. What Was Tested'),
      divider(),
      para('The audit examined the following components of the EDMECA Digital Academy platform:'),
      new Paragraph({ spacing: { after: 120 } }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({ children: [headerCell('Component', 35), headerCell('Description', 65)] }),
          new TableRow({ children: [cell('Web Application Frontend', { shading: LIGHT_GREY }), cell('All pages — marketing site, login, and entrepreneur portal tools', { shading: LIGHT_GREY })] }),
          new TableRow({ children: [cell('AI Financial Analysis API', {}), cell('Server function that processes uploaded financial documents using AI', {})] }),
          new TableRow({ children: [cell('Contact Form Function', { shading: LIGHT_GREY }), cell('Server function that receives and stores public enquiries', { shading: LIGHT_GREY })] }),
          new TableRow({ children: [cell('AI Business Advisor (Chat)', {}), cell('Chat assistant available inside the entrepreneur portal', {})] }),
          new TableRow({ children: [cell('CDN Cache Management', { shading: LIGHT_GREY }), cell('Administrative function for resetting site caches', { shading: LIGHT_GREY })] }),
          new TableRow({ children: [cell('Database (Supabase)', {}), cell('All tables storing user profiles, business tool data, and financial records', {})] }),
          new TableRow({ children: [cell('User Authentication', { shading: LIGHT_GREY }), cell('Email/password login and Google Sign-In', { shading: LIGHT_GREY })] }),
          new TableRow({ children: [cell('Third-Party Software Packages', {}), cell('All 675 software libraries used to build the platform', {})] }),
          new TableRow({ children: [cell('Configuration & Secrets', { shading: LIGHT_GREY }), cell('Environment variables, deployment configuration, and API keys', { shading: LIGHT_GREY })] }),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),
      para('The audit used static code analysis — reviewing source code for known vulnerability patterns — and automated dependency scanning via the npm security audit tool, which checks packages against a global advisory database of known software vulnerabilities (CVEs).'),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 3. ISSUES FIXED
      // ══════════════════════════════════════════════════════════════════════
      h1('3. Issues Identified and Resolved'),
      divider(),
      para('The following issues were identified and fully resolved during the audit. No further action is required for any item in this section.'),
      new Paragraph({ spacing: { after: 200 } }),

      // 3.1
      h3('3.1  Personal Information Logged to Server Logs  [FIXED]'),
      para('', {}),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'When a visitor submitted the contact form, the server was recording the full contents of their message — including their name, email address, and inquiry text — into server log files. These logs are visible to platform administrators and represent an unnecessary storage of personal information, which carries obligations under the Protection of Personal Information Act (POPIA).', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was done? ', bold: true, size: 22 }),
          new TextRun({ text: 'The logging was updated to record only a non-identifying reference number and the general category of the enquiry (e.g., "entrepreneur", "investor"), removing all personal details from the logs.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Risk if not fixed: Unnecessary retention of personal data. Potential POPIA compliance issue.', LIGHT_AMBER, AMBER),

      // 3.2
      h3('3.2  Website Missing Critical Security Headers  [FIXED]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The website was not sending two important browser-level security instructions: HTTP Strict Transport Security (HSTS) and a Content Security Policy (CSP). HSTS tells browsers to always use a secure, encrypted connection. CSP tells browsers which sources of content (scripts, images, fonts) are permitted, preventing attackers from injecting malicious content.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was done? ', bold: true, size: 22 }),
          new TextRun({ text: 'Both headers have been added to the site\'s deployment configuration. The site now enforces HTTPS for all visitors, restricts content to approved sources only, and prevents it from being embedded in iframes on other sites (clickjacking protection).', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Risk if not fixed: Users could be intercepted on insecure connections. Site content could be injected or embedded on malicious pages.', LIGHT_AMBER, AMBER),

      // 3.3
      h3('3.3  Administrative Cache Reset Exposed a Secret in URLs  [FIXED]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'An administrative tool used to clear the website\'s cache accepted a security token (password) as part of the web address (URL). URLs are recorded in server access logs, browser history, and proxy systems — meaning the secret could be extracted by anyone with access to those logs.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was done? ', bold: true, size: 22 }),
          new TextRun({ text: 'The tool was updated to only accept the security token in a request header, which is not recorded in standard logs. URL-based access has been removed entirely.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Risk if not fixed: An attacker with log access could extract the secret and trigger unauthorized cache resets.', LIGHT_AMBER, AMBER),

      // 3.4
      h3('3.4  User-Supplied Input Not Fully Sanitised in AI Prompts  [FIXED]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The company name field in the Financial Analysis tool was passed directly into the AI prompt sent to Anthropic\'s Claude model without length validation or control character filtering. Excessively long or specially crafted input could potentially manipulate the AI prompt or cause unexpected behavior.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was done? ', bold: true, size: 22 }),
          new TextRun({ text: 'The company name field is now limited to 200 characters, and invisible control characters are stripped before the value is used in any AI prompt.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Risk if not fixed: Potential for prompt injection attacks that could manipulate AI outputs. Increased API cost exposure.', LIGHT_AMBER, AMBER),

      // 3.5
      h3('3.5  API Error Responses Missing Security Headers  [FIXED]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The contact form function returned Cross-Origin Resource Sharing (CORS) security headers only on successful submissions, not on error responses. This meant the user\'s browser would silently discard error messages from staging and development environments, causing confusion and making debugging difficult. It also exposed a hardcoded production domain that would prevent the staging site from functioning correctly.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'What was done? ', bold: true, size: 22 }),
          new TextRun({ text: 'Security headers are now applied consistently to all responses regardless of success or failure. The function now correctly supports all three environments: production, staging, and local development.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Risk if not fixed: Broken contact form on staging. Hidden errors making it impossible to diagnose submission failures.', LIGHT_AMBER, AMBER),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 4. ITEMS REQUIRING ATTENTION
      // ══════════════════════════════════════════════════════════════════════
      h1('4. Items Requiring Attention'),
      divider(),
      para('The following items were identified but could not be immediately resolved, either because they require replacement of third-party software (a larger undertaking) or additional infrastructure investment. A recommended action and priority level is provided for each.'),
      new Paragraph({ spacing: { after: 200 } }),

      h3('4.1  Known Vulnerabilities in Third-Party Software  [MEDIUM PRIORITY]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What is the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The platform uses 675 third-party software packages. The dependency scan identified 9 known vulnerabilities: 6 rated High and 3 rated Moderate. None are Critical. All High-severity issues are in one of two areas:', size: 22 }),
        ], spacing: { after: 120 }
      }),
      bullet('The SheetJS (xlsx) library used to read Excel files — this package has two unpatched vulnerabilities with no fix available from the vendor. It requires replacement.'),
      bullet('Vercel deployment tooling (internal, server-side only) — not directly accessible to users. An upgrade path exists but requires testing.'),
      new Paragraph({ spacing: { after: 100 } }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Important context: ', bold: true, size: 22 }),
          new TextRun({ text: 'These vulnerabilities are in libraries used during file processing, not in the main application logic. They do not directly expose user data or allow unauthorised access to accounts. The risk level for the affected features is elevated until remediated.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Recommended action: ', bold: true, size: 22 }),
          new TextRun({ text: 'Replace the SheetJS (xlsx) library with an alternative (ExcelJS) in the next development sprint. Upgrade Vercel tooling when testing capacity allows.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Business impact if not remediated: Elevated risk during Excel file processing. No immediate user impact, but unresolved CVEs create compliance and reputational exposure.', LIGHT_AMBER, AMBER),

      new Paragraph({ spacing: { after: 160 } }),

      h3('4.2  No Rate Limiting on the AI Financial Analysis Feature  [MEDIUM PRIORITY]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What is the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The Financial Analysis tool — which uses paid AI services (Anthropic Claude) to analyse uploaded documents — does not currently limit how many times a logged-in user can call it within a given time period. A malicious or misconfigured user could repeatedly trigger the analysis, generating significant unexpected API costs.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Recommended action: ', bold: true, size: 22 }),
          new TextRun({ text: 'Implement a usage limit (e.g. 10 analyses per user per day) before the portal is opened to a large user base. This requires a small addition of tracking logic and is estimated at 1–2 days of development effort.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Business impact if not remediated: Potential for unexpected operational cost overruns from AI API usage. Risk increases proportionally with user numbers.', LIGHT_AMBER, AMBER),

      new Paragraph({ spacing: { after: 160 } }),

      h3('4.3  No CAPTCHA or Spam Protection on the Contact Form  [LOW PRIORITY]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What is the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'The public contact form does not currently include any automated bot detection (CAPTCHA or equivalent). This means automated bots could flood the form with spam submissions, filling the database with junk data and potentially obscuring legitimate enquiries.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Recommended action: ', bold: true, size: 22 }),
          new TextRun({ text: 'Add Cloudflare Turnstile (privacy-respecting, free tier available) before public launch. Estimated at 1 day of development effort.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Business impact if not remediated: Spam submissions in the contact database. Low risk during private/beta phase; higher risk at public launch.', LIGHT_GREY, DARK_GREY),

      new Paragraph({ spacing: { after: 160 } }),

      h3('4.4  Data Processing Disclosure for Financial Analysis  [LOW PRIORITY — COMPLIANCE]'),
      new Paragraph({
        children: [
          new TextRun({ text: 'What is the issue? ', bold: true, size: 22 }),
          new TextRun({ text: 'When users upload financial documents for AI analysis, that data is transmitted to Anthropic\'s API (a U.S.-based third-party AI provider). Users are currently not explicitly informed of this before submitting their data. Under POPIA, users should be made aware of third-party data processing, particularly for sensitive financial information.', size: 22 }),
        ], spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Recommended action: ', bold: true, size: 22 }),
          new TextRun({ text: 'Add a brief, plain-language disclosure on the Financial Analysis tool page stating that document content is processed by a third-party AI service and is not stored beyond the analysis session. A legal review of the full Privacy Policy is also recommended.', size: 22 }),
        ], spacing: { after: 200 }
      }),
      callout('Business impact if not remediated: Potential POPIA compliance exposure. Reputational risk if users are unaware their data is processed externally.', LIGHT_GREY, DARK_GREY),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 5. WHAT IS SECURE
      // ══════════════════════════════════════════════════════════════════════
      h1('5. What Is Working Well'),
      divider(),
      para('The following areas were assessed and found to meet or exceed expectations for a platform at this stage of development:'),
      new Paragraph({ spacing: { after: 120 } }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({ children: [headerCell('Security Control', 40), headerCell('Detail', 60)] }),
          new TableRow({ children: [
            cell('No credentials in source code', { shading: LIGHT_GREY }),
            cell('A full scan of all 89 source files confirmed zero hardcoded API keys, passwords, or tokens. All secrets are stored securely as environment variables.', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Strong user authentication', {}),
            cell('Login is handled by Supabase Auth with industry-standard JWT tokens. Sessions expire automatically. Google OAuth is integrated for convenience.', {}),
          ]}),
          new TableRow({ children: [
            cell('Database row-level security', { shading: LIGHT_GREY }),
            cell('Every database table uses Row Level Security: users can only access their own data. One user cannot see another user\'s business tools, financial records, or profile.', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Protected portal routes', {}),
            cell('All entrepreneur portal pages require an active login session. Unauthenticated users are automatically redirected to the login page.', {}),
          ]}),
          new TableRow({ children: [
            cell('Server-side token validation', { shading: LIGHT_GREY }),
            cell('The AI APIs verify that each request carries a valid Supabase authentication token. Anonymous calls are rejected with a 401 Unauthorised response.', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('Prompt injection protection', {}),
            cell('The AI chat function actively detects and strips prompt injection attempts — messages designed to override the AI\'s instructions and make it behave maliciously.', {}),
          ]}),
          new TableRow({ children: [
            cell('Input validation on all forms', { shading: LIGHT_GREY }),
            cell('Contact form validates field lengths, email format, and audience type against an approved list before accepting any submission.', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('CORS correctly configured', {}),
            cell('All server-side APIs restrict cross-origin requests to an explicit list of approved domains. Requests from unknown origins are blocked.', {}),
          ]}),
          new TableRow({ children: [
            cell('Sensitive files excluded from version control', { shading: LIGHT_GREY }),
            cell('Git history was audited. No .env files, API keys, or sensitive configuration has ever been committed to the repository.', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('XSS protection via React', {}),
            cell('The application uses React JSX throughout, which automatically escapes all user-provided content — preventing cross-site scripting attacks.', {}),
          ]}),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 6. PRIORITY ACTION PLAN
      // ══════════════════════════════════════════════════════════════════════
      h1('6. Priority Action Plan'),
      divider(),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({ children: [
            headerCell('#', 6),
            headerCell('Action', 44),
            headerCell('Priority', 15),
            headerCell('Est. Effort', 15),
            headerCell('Status', 20),
          ]}),
          new TableRow({ children: [
            cell('1', { shading: LIGHT_GREY }),
            cell('Replace SheetJS (xlsx) with ExcelJS for Excel file parsing', { shading: LIGHT_GREY }),
            cell('High', { shading: LIGHT_RED, bold: true, color: RED }),
            cell('2–3 days', { shading: LIGHT_GREY }),
            cell('Pending', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('2', {}),
            cell('Add usage rate limiting to the AI Financial Analysis tool (10 analyses/user/day)', {}),
            cell('Medium', { shading: LIGHT_AMBER, bold: true, color: AMBER }),
            cell('1–2 days', {}),
            cell('Pending', {}),
          ]}),
          new TableRow({ children: [
            cell('3', { shading: LIGHT_GREY }),
            cell('Add POPIA disclosure notice on the Financial Analysis page', { shading: LIGHT_GREY }),
            cell('Medium', { shading: LIGHT_AMBER, bold: true, color: AMBER }),
            cell('< 1 day', { shading: LIGHT_GREY }),
            cell('Pending', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('4', {}),
            cell('Add Cloudflare Turnstile CAPTCHA to the contact form', {}),
            cell('Low', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('1 day', {}),
            cell('Before public launch', {}),
          ]}),
          new TableRow({ children: [
            cell('5', { shading: LIGHT_GREY }),
            cell('Upgrade @vercel/node to v4.0.0 (resolves minimatch and undici advisories)', { shading: LIGHT_GREY }),
            cell('Low', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('1 day + testing', { shading: LIGHT_GREY }),
            cell('Before public launch', { shading: LIGHT_GREY }),
          ]}),
          new TableRow({ children: [
            cell('6', {}),
            cell('Commission a dynamic penetration test against the staging environment using OWASP ZAP prior to public launch', {}),
            cell('Recommended', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('External engagement', {}),
            cell('Pre-launch milestone', {}),
          ]}),
          new TableRow({ children: [
            cell('7', { shading: LIGHT_GREY }),
            cell('Legal review of Privacy Policy to cover AI data processing disclosure', { shading: LIGHT_GREY }),
            cell('Recommended', { shading: LIGHT_GREEN, bold: true, color: GREEN }),
            cell('Legal counsel', { shading: LIGHT_GREY }),
            cell('Pre-launch milestone', { shading: LIGHT_GREY }),
          ]}),
        ]
      }),

      new Paragraph({ spacing: { after: 300 } }),

      // ══════════════════════════════════════════════════════════════════════
      // 7. CONCLUSION
      // ══════════════════════════════════════════════════════════════════════
      h1('7. Conclusion'),
      divider(),
      para('The EDMECA Digital Academy platform has a sound security foundation. The five issues identified in this audit have been resolved. The platform\'s authentication, data isolation, and secrets management practices are implemented correctly and meet the expected standard for a production-grade web application.'),
      new Paragraph({ spacing: { after: 120 } }),
      para('The remaining items are manageable: the highest priority is replacing the SheetJS library (approximately 2–3 days of work), followed by adding usage rate limiting to the AI feature before scaling to a larger user base. Neither item represents an immediate threat to user data security.'),
      new Paragraph({ spacing: { after: 120 } }),
      para('The platform is assessed as ready for continued controlled rollout to cohorts and programme participants. A full dynamic penetration test is strongly recommended before opening registration to the general public.'),
      new Paragraph({ spacing: { after: 300 } }),

      divider(),
      new Paragraph({
        children: [
          new TextRun({ text: 'This report was prepared by X4O Consulting on behalf of EDMECA Digital Academy.  ', size: 18, color: DARK_GREY, italics: true }),
          new TextRun({ text: `Report date: ${REPORT_DATE}.  `, size: 18, color: DARK_GREY, italics: true }),
          new TextRun({ text: 'Classification: CONFIDENTIAL.', size: 18, color: RED, bold: true }),
        ],
        spacing: { after: 0 }
      }),
    ]
  }]
});

// ─── Write file ───────────────────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
const outPath = path.join(ROOT, 'deliverables', 'Phase-4-Testing', `EDMECA_Security_Audit_Stakeholder_Report_${new Date().toISOString().slice(0,10)}.docx`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buffer);
console.log(`\nStakeholder report written to: ${path.relative(ROOT, outPath)}`);
