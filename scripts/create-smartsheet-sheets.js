#!/usr/bin/env node
/**
 * Creates Test Cases and Bug Tracker sheets in Smartsheet
 * and populates them with data from the local CSVs.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const BASE = 'https://api.smartsheet.com/2.0';

const http = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
  timeout: 30000,
});

async function req(method, url, data) {
  try {
    const res = await http({ method, url, data });
    return res.data;
  } catch (e) {
    console.error(`❌ ${method.toUpperCase()} ${url} → ${e.response?.status} ${e.response?.data?.message || e.message}`);
    throw e;
  }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Sheet definitions ──────────────────────────────────────────────────────

const TEST_CASES_COLUMNS = [
  { title: 'Test ID',              type: 'TEXT_NUMBER', primary: true },
  { title: 'Test Case Name',       type: 'TEXT_NUMBER' },
  { title: 'SDLC Phase',           type: 'PICKLIST', options: ['3 - Development','4 - Testing','5 - Deployment'] },
  { title: 'Feature Area',         type: 'TEXT_NUMBER' },
  { title: 'Priority',             type: 'PICKLIST', options: ['Critical','High','Medium','Low'] },
  { title: 'Test Type',            type: 'PICKLIST', options: ['Smoke','Functional','Visual','Negative','Deliverability'] },
  { title: 'Status',               type: 'PICKLIST', options: ['Pass','Fail','Partial','Pending','Not Run'] },
  { title: 'Tested By',            type: 'TEXT_NUMBER' },
  { title: 'Test Date',            type: 'DATE' },
  { title: 'Environment',          type: 'TEXT_NUMBER' },
  { title: 'Pre-Conditions',       type: 'TEXT_NUMBER' },
  { title: 'Test Steps',           type: 'TEXT_NUMBER' },
  { title: 'Expected Result',      type: 'TEXT_NUMBER' },
  { title: 'Actual Result',        type: 'TEXT_NUMBER' },
  { title: 'Pass/Fail',            type: 'PICKLIST', options: ['Pass','Fail','Partial','Pending'] },
  { title: 'Linked Task',          type: 'TEXT_NUMBER' },
  { title: 'Linked Bug',           type: 'TEXT_NUMBER' },
  { title: 'Notes',                type: 'TEXT_NUMBER' },
];

const BUG_TRACKER_COLUMNS = [
  { title: 'Bug ID',               type: 'TEXT_NUMBER', primary: true },
  { title: 'Title',                type: 'TEXT_NUMBER' },
  { title: 'Module / Area',        type: 'TEXT_NUMBER' },
  { title: 'Severity',             type: 'PICKLIST', options: ['Critical','High','Medium','Low'] },
  { title: 'Priority',             type: 'PICKLIST', options: ['Critical','High','Medium','Low'] },
  { title: 'Status',               type: 'PICKLIST', options: ['Open','In Progress','Resolved','Closed'] },
  { title: 'Reported By',          type: 'TEXT_NUMBER' },
  { title: 'Date Reported',        type: 'DATE' },
  { title: 'Date Resolved',        type: 'DATE' },
  { title: 'Environment Found',    type: 'TEXT_NUMBER' },
  { title: 'Branch Found',         type: 'TEXT_NUMBER' },
  { title: 'Root Cause Category',  type: 'PICKLIST', options: ['Configuration','Logic Error','Network','UI/UX','Security','Performance'] },
  { title: 'Root Cause Description', type: 'TEXT_NUMBER' },
  { title: 'Steps to Reproduce',   type: 'TEXT_NUMBER' },
  { title: 'Expected Behaviour',   type: 'TEXT_NUMBER' },
  { title: 'Actual Behaviour',     type: 'TEXT_NUMBER' },
  { title: 'Fix Summary',          type: 'TEXT_NUMBER' },
  { title: 'Linked Task',          type: 'TEXT_NUMBER' },
  { title: 'Linked Test',          type: 'TEXT_NUMBER' },
  { title: 'Verified By',          type: 'TEXT_NUMBER' },
  { title: 'Verification Date',    type: 'DATE' },
  { title: 'Regression Risk',      type: 'PICKLIST', options: ['Low','Medium','High'] },
  { title: 'Notes',                type: 'TEXT_NUMBER' },
];

// ─── Row data ────────────────────────────────────────────────────────────────

const TEST_CASE_ROWS = [
  ['TC-001','Production site accessible via custom domain','5 - Deployment','Infrastructure','Critical','Smoke','Pass','Keenan','2026-02-16','edmeca.co.za','DNS records configured at IT-Guru Online; Netlify deployment completed','1. Open browser. 2. Navigate to https://edmeca.co.za. 3. Verify site loads. 4. Check SSL padlock shows. 5. Verify www.edmeca.co.za redirects correctly.','Site loads with valid SSL; www redirects to root domain','Site loads correctly with SSL; www redirect working','Pass','5.5','','SSL provisioned after removing old Replit TXT records. Cross-browser verified.'],
  ['TC-002','Staging site accessible via branch deploy URL','5 - Deployment','Infrastructure','Critical','Smoke','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','Netlify branch deploys enabled for staging branch in dashboard','1. Navigate to https://staging--edmecaacademy.netlify.app. 2. Verify site loads. 3. Check SSL is valid. 4. Verify content matches main branch.','Staging site loads with valid SSL and correct content','Staging site live and accessible; all content correct','Pass','5.4','','Netlify branch deploy configured in dashboard and netlify.toml'],
  ['TC-003','Login button disabled on production','3 - Development','Auth / UI','Critical','Functional','Pass','Keenan','2026-02-18','edmeca.co.za','Main branch deployed; VITE_ENABLE_LOGIN not set in production','1. Navigate to edmeca.co.za. 2. Click Log In button. 3. Verify no navigation occurs. 4. Inspect DOM - confirm no anchor wrapper.','Button renders as disabled element with no anchor tag; clicking does nothing','Button is fully inert - no anchor wrapper; cursor shows not-allowed','Pass','3.12','','Fixed after first attempt where disabled attr on anchor did not prevent navigation'],
  ['TC-004','Login button active and navigates on staging','3 - Development','Auth / UI','Critical','Functional','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','Staging deployed; VITE_ENABLE_LOGIN=true in netlify.toml staging context','1. Navigate to staging URL. 2. Click Log In button. 3. Verify navigation to /login. 4. Test mobile menu login button also navigates.','Login button navigates to /login on both desktop and mobile','Desktop and mobile login buttons both navigate to /login page correctly','Pass','3.12','','VITE_ENABLE_LOGIN=true in netlify.toml staging context'],
  ['TC-005','Login page renders with all auth options','3 - Development','Auth / UI','High','Functional','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','Staging accessible; user navigates to /login','1. Navigate to /login. 2. Verify Sign In and Sign Up tabs. 3. Verify Google button with correct G icon. 4. Verify GitHub button present.','Login page shows tabs; forms; real Google G coloured icon; GitHub icon','All elements render correctly; Google icon shows correct multi-colour G','Pass','3.14','','Google icon SVG manually added to replace Mail icon from lucide-react'],
  ['TC-006','Google OAuth opens consent screen','3 - Development','Auth / Security','Critical','Functional','Partial','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','Google provider enabled in Supabase with correct Client ID and Secret','1. Navigate to /login. 2. Click Continue with Google. 3. Verify Google OAuth consent screen opens. 4. Check consent screen shows EdMeCa Academy name.','Google consent screen opens; shows EdMeCa Academy; user can select account','Consent screen opens but shows Supabase URL instead of EdMeCa Academy','Partial','3.14','BUG-003','OAuth consent screen app name pending supervisor update in Google Cloud Console'],
  ['TC-007','Email sign-up sends confirmation email','3 - Development','Auth / Email','Critical','Functional','Pass','Keenan','2026-02-19','staging--edmecaacademy.netlify.app','Resend SMTP configured; domain verified; email templates set','1. Navigate to /login > Sign Up. 2. Enter test email and password. 3. Click Create Account. 4. Check inbox for confirmation email.','Success message shown; confirmation email received within 2 minutes','Success message shown; confirmation email received from Info@edmeca.co.za','Pass','3.13','BUG-001','Initial test failed with Gmail SMTP. Resolved by switching to Resend.'],
  ['TC-008','Confirmation email sent from correct address','3 - Development','Auth / Email','High','Functional','Pass','Keenan','2026-02-19','staging--edmecaacademy.netlify.app','Resend SMTP configured with Info@edmeca.co.za as sender','1. Complete sign-up flow. 2. Open received email. 3. Check From address. 4. Verify sender name.','Email received from Info@edmeca.co.za with sender name EdMeCa Academy','Email from Info@edmeca.co.za - EdMeCa Academy confirmed','Pass','3.13','',''],
  ['TC-009','Confirmation email has branded template','3 - Development','Auth / Email','High','Visual','Pass','Keenan','2026-02-19','staging--edmecaacademy.netlify.app','Email templates updated in Supabase; logo uploaded to Supabase Storage','1. Receive confirmation email. 2. Verify EdMeCa logo renders. 3. Verify button colour is navy (#1f3a6e). 4. Verify footer shows Info@edmeca.co.za.','Email shows EdMeCa logo; navy CTA button; branded footer; readable on mobile','Logo renders from Supabase Storage; button is correct navy colour','Pass','3.13','','Logo URL: dqvdnyxkkletgkkpicdg.supabase.co/storage/v1/object/public/publiclogos/logo.png'],
  ['TC-010','Confirmation email CTA link works','3 - Development','Auth / Email','Critical','Functional','Pass','Keenan','2026-02-19','staging--edmecaacademy.netlify.app','Confirmation email received; link not expired (24h window)','1. Open confirmation email. 2. Click Confirm my account button. 3. Verify account confirmed. 4. Attempt login with confirmed account.','Account confirmed; user redirected to site; login succeeds','Email link worked; account confirmed; login successful','Pass','3.13','',''],
  ['TC-011','Confirmation email lands in spam','3 - Development','Auth / Email','Medium','Deliverability','Fail','Keenan','2026-02-19','staging--edmecaacademy.netlify.app','Resend SMTP working; domain verified; first send to Gmail inbox','1. Complete sign-up flow. 2. Check primary inbox. 3. Check spam/junk folder.','Email lands in primary inbox','Email received in spam/junk folder','Fail','3.13','BUG-002','DMARC TXT record added to IT-Guru DNS as remediation. Deliverability improves over time.'],
  ['TC-012','Sign-up error displays friendly message','3 - Development','Auth / UI','High','Negative','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','Gmail SMTP misconfigured (to validate error handling)','1. Navigate to /login > Sign Up. 2. Enter valid email and password. 3. Click Create Account. 4. Verify error message displays.','Friendly error message shown; not raw Supabase/API error text','Error message shown: Error sending confirmation email','Pass','3.2','BUG-001','Error message is user-friendly though SMTP was causing 500 internally.'],
  ['TC-013','Password mismatch validation on sign-up','3 - Development','Auth / Validation','High','Negative','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','User on sign-up tab','1. Enter email. 2. Enter password in Password field. 3. Enter different value in Confirm Password. 4. Click Create Account.','Error shown: Passwords do not match; form not submitted','Validation error shown correctly; form not submitted','Pass','3.2','','Client-side validation in handleSignUp function'],
  ['TC-014','Password too short validation on sign-up','3 - Development','Auth / Validation','High','Negative','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','User on sign-up tab','1. Enter email. 2. Enter password with fewer than 6 characters in both fields. 3. Click Create Account.','Error shown: Password must be at least 6 characters; form not submitted','Validation error shown correctly; form not submitted','Pass','3.2','',''],
  ['TC-015','Google OAuth redirects to /portal on success','3 - Development','Auth / Security','Critical','Functional','Not Run','Keenan','','staging--edmecaacademy.netlify.app','Google OAuth enabled; consent screen published; test account available','1. Click Continue with Google. 2. Select account. 3. Grant permissions. 4. Verify redirect to /portal. 5. Verify session established.','User redirected to /portal after OAuth; session active','Not yet run - pending consent screen app name fix by supervisor','Pending','3.14','BUG-003','signInWithOAuth passes redirectTo: window.location.origin/portal'],
  ['TC-016','Protected route redirects unauthenticated user','3 - Development','Auth / Security','Critical','Functional','Pass','Keenan','2026-02-18','staging--edmecaacademy.netlify.app','User not logged in','1. Navigate directly to /portal. 2. Verify redirect occurs. 3. Verify user lands on /login page.','Unauthenticated user redirected to /login when accessing /portal','ProtectedRoute component triggers redirect to /login','Pass','3.3','','ProtectedRoute component with useAuth hook'],
  ['TC-017','Theme defaults to light mode on load','3 - Development','UI / Theme','Medium','Functional','Pass','Keenan','2026-02-17','edmeca.co.za','No theme preference stored in localStorage','1. Clear localStorage. 2. Navigate to edmeca.co.za. 3. Verify light mode is active by default.','Site loads in light mode by default','Light mode active on initial load; ThemeProvider defaults to light','Pass','2.1','','ThemeProvider.tsx defaultTheme set to light'],
  ['TC-018','Mobile hamburger menu opens and closes','3 - Development','UI / Navigation','High','Functional','Pass','Keenan','2026-02-16','edmeca.co.za','Site loaded on mobile viewport (< 768px)','1. Open site on mobile. 2. Tap hamburger icon. 3. Verify slide-out menu appears. 4. Verify login button state. 5. Close menu.','Menu opens with all nav links; login button disabled on prod','Mobile menu works correctly; login button correct per environment','Pass','3.12','','Tested via browser DevTools mobile emulation'],
  ['TC-019','Contact form submission via Netlify Forms','3 - Development','Forms / Email','High','Functional','Pass','Keenan','2026-02-16','edmeca.co.za','Hidden Netlify form in index.html; Netlify Forms detection active','1. Navigate to /contact. 2. Fill in all form fields. 3. Submit form. 4. Check Netlify Forms dashboard for submission.','Form submitted successfully; entry visible in Netlify Forms dashboard','Form submission confirmed; 5 fields detected by Netlify','Pass','','','Hidden HTML form added to index.html for Netlify Forms detection'],
  ['TC-020','All nav links route to correct pages','3 - Development','UI / Routing','High','Functional','Pass','Keenan','2026-02-16','edmeca.co.za','Site deployed and accessible','1. Click About > /about. 2. Click Solutions > /solutions. 3. Click Frameworks > /frameworks. 4. Click Engagement > /engagement. 5. Click Contact > /contact.','Each nav link routes to correct page without full page reload','All routes functioning correctly via Wouter client-side routing','Pass','','',''],
];

const BUG_ROWS = [
  ['BUG-001','Gmail SMTP throws config reloader error on sign-up','Auth / Email','Critical','Critical','Resolved','Keenan','2026-02-18','2026-02-18','staging--edmecaacademy.netlify.app','staging','Configuration','Google Workspace Admin blocks SMTP relay. smtp.gmail.com:587 with App Password fails with Error 500: config reloader is exiting on the Supabase SMTP handler.','1. Configure Supabase SMTP with smtp.gmail.com:587 and App Password. 2. Navigate to /login > Sign Up. 3. Enter email and password. 4. Click Create Account. 5. Observe 500 error.','Sign-up succeeds and confirmation email delivered','Error: SMTP config reloader is exiting. Sign-up fails for all new users.','Removed Gmail SMTP. Switched to Resend. Created API key. Added DNS records: DKIM, SPF, MX. Configured Supabase SMTP: smtp.resend.com:465.','3.13','TC-007','Keenan','2026-02-18','Low','Google Workspace SMTP relay was disabled. App Passwords tried but blocked. Resend used as permanent replacement.'],
  ['BUG-002','Confirmation email delivered to spam folder','Auth / Email','Medium','High','Resolved','Keenan','2026-02-19','2026-02-19','staging--edmecaacademy.netlify.app','staging','Configuration','No DMARC policy in DNS. New sender domain with no historical sending reputation causes Gmail to classify mail as spam.','1. Configure Resend SMTP with DKIM and SPF only (no DMARC). 2. Complete sign-up flow. 3. Check Gmail inbox primary tab. 4. Check spam/junk folder.','Confirmation email arrives in primary Gmail inbox','Confirmation email received in spam / junk folder','Added DMARC TXT record to IT-Guru DNS: _dmarc.edmeca.co.za → v=DMARC1; p=none; rua=mailto:Info@edmeca.co.za.','3.13','TC-011','Keenan','2026-02-19','Low','DMARC p=none (monitor mode) to avoid blocking legitimate mail. Can escalate to p=quarantine after monitoring period.'],
  ['BUG-003','Google OAuth consent screen shows Supabase URL','Auth / OAuth','High','High','Open','Keenan','2026-02-18','','staging--edmecaacademy.netlify.app','staging','Configuration','Google Cloud OAuth consent screen not configured. App is in Testing mode. Supabase callback URL appears as redirect so Google shows Supabase project URL to end users.','1. Navigate to /login. 2. Click Continue with Google. 3. Observe consent screen header. 4. Note the name and URL shown to user.','Consent screen shows EdMeCa Academy as app name and edmeca.co.za','Consent screen shows Supabase project URL instead of EdMeCa Academy name','PENDING: Supervisor Raymond Crow to update Google Cloud Console OAuth consent screen - set app name, homepage URL, add logo, publish app.','3.14','TC-006','','','Medium','OAuth flow itself works. Only branding/UX concern. In Testing mode only verified test users can sign in.'],
  ['BUG-004','Login button navigates despite disabled attribute','Auth / UI','High','High','Resolved','Keenan','2026-02-18','2026-02-18','edmeca.co.za','main','Logic Error','Header.tsx wrapped disabled <button> in <a href=/login> anchor tag. HTML disabled only applies to form elements; anchor ignores it. Clicking triggered anchor navigation.','1. Ensure VITE_ENABLE_LOGIN is not set. 2. Deploy to production. 3. Navigate to edmeca.co.za. 4. Click Log In button. 5. Observe navigation to /login despite appearing disabled.','Clicking disabled login button produces no action','Clicking disabled login button navigates to /login page','Refactored Header.tsx: isLoginEnabled = VITE_ENABLE_LOGIN === true. When false: render plain disabled button with no anchor. When true: render anchor wrapping button.','3.12','TC-003','Keenan','2026-02-18','Low','Fix applied to both desktop and mobile navigation menu.'],
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function createSheet(name, columns) {
  console.log(`\n📋 Creating sheet: ${name}`);
  const colDefs = columns.map((c, i) => ({
    title: c.title,
    type: c.type,
    primary: c.primary || false,
    ...(c.options ? { options: c.options } : {}),
  }));
  const result = await req('POST', '/sheets', { name, columns: colDefs });
  const sheetId = result.result.id;
  console.log(`✅ Created sheet "${name}" — ID: ${sheetId}`);
  return { sheetId, columns: result.result.columns };
}

async function addRows(sheetId, columns, rows, colTitles) {
  // Map title → columnId
  const colMap = {};
  columns.forEach(c => { colMap[c.title] = c.id; });

  console.log(`\n📝 Inserting ${rows.length} rows...`);
  for (let i = 0; i < rows.length; i++) {
    const rowData = rows[i];
    const cells = colTitles
      .map((title, idx) => ({ columnId: colMap[title], value: rowData[idx] || '' }))
      .filter(c => c.columnId && c.value !== '');

    try {
      await req('POST', `/sheets/${sheetId}/rows`, { rows: [{ toBottom: true, cells }] });
      console.log(`  ✅ Row ${i + 1}/${rows.length}: ${rowData[0]}`);
    } catch (e) {
      console.error(`  ❌ Failed row ${i + 1}: ${rowData[0]}`);
    }
    await delay(1500);
  }
}

const TC_TITLES  = TEST_CASES_COLUMNS.map(c => c.title);
const BUG_TITLES = BUG_TRACKER_COLUMNS.map(c => c.title);

async function main() {
  if (!API_TOKEN) { console.error('❌ SMARTSHEET_API_TOKEN not set in .env.local'); process.exit(1); }

  // Test Cases sheet
  const tc = await createSheet('EDMECA Academy - Test Cases', TEST_CASES_COLUMNS);
  await delay(2000);
  await addRows(tc.sheetId, tc.columns, TEST_CASE_ROWS, TC_TITLES);

  await delay(3000);

  // Bug Tracker sheet
  const bt = await createSheet('EDMECA Academy - Bug Tracker', BUG_TRACKER_COLUMNS);
  await delay(2000);
  await addRows(bt.sheetId, bt.columns, BUG_ROWS, BUG_TITLES);

  console.log('\n🎉 Done! Both sheets created and populated.');
  console.log(`   Test Cases sheet ID : ${tc.sheetId}`);
  console.log(`   Bug Tracker sheet ID: ${bt.sheetId}`);
  console.log('\n💡 Add these IDs to .github/copilot-instructions.md for reference.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
