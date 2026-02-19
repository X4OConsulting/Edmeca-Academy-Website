/**
 * inject-sheet-data.js
 * Updates existing empty rows in Test Cases and Bug Tracker Smartsheet sheets
 * using PUT (not POST) since rows already exist.
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const BASE_URL  = 'https://api.smartsheet.com/2.0';

async function api(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

function cell(columnId, value) {
  return { columnId, value: value ?? '' };
}

async function injectTestCases() {
  console.log('\n=== Injecting Test Cases ===');
  const TC_SHEET_ID = '3745437451243396';

  // Column IDs (from earlier GET)
  const C = {
    testId:          6300344223747972,
    name:            4048544410062724,
    sdlcPhase:       8552144037433220,
    featureArea:     389369712824196,
    priority:        4892969340194692,
    testType:        2641169526509444,
    status:          7144769153879940,
    testedBy:        1515269619666820,
    testDate:        6018869247037316,
    environment:     3767069433352068,
    preConditions:   8270669060722564,
    testSteps:       952319666245508,
    expectedResult:  5455919293616004,
    actualResult:    3204119479930756,
    passFail:        7707719107301252,
    linkedTask:      2078219573088132,
    linkedBug:       6581819200458628,
    notes:           4330019386773380,
  };

  // Get existing row IDs
  const sheet = await api('GET', `/sheets/${TC_SHEET_ID}`);
  const rowIds = sheet.rows.map(r => r.id);
  console.log(`Found ${rowIds.length} existing rows`);

  const rows = [
    { id: rowIds[0],  cells: [cell(C.testId,'TC-001'), cell(C.name,'Production site accessible via custom domain'), cell(C.sdlcPhase,'5 - Deployment'), cell(C.featureArea,'Infrastructure'), cell(C.priority,'Critical'), cell(C.testType,'Smoke'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-16'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'DNS records configured at IT-Guru Online; Netlify deployment completed'), cell(C.testSteps,'1. Open browser. 2. Navigate to https://edmeca.co.za. 3. Verify site loads. 4. Check SSL padlock shows. 5. Verify https://www.edmeca.co.za redirects correctly.'), cell(C.expectedResult,'Site loads with valid SSL; www redirects to root domain'), cell(C.actualResult,'Site loads correctly with Let\'s Encrypt SSL; www redirect working'), cell(C.passFail,'Pass'), cell(C.linkedTask,'5.5'), cell(C.linkedBug,''), cell(C.notes,'SSL provisioned after removing old Replit TXT records. Cross-browser verified: Chromium, Firefox, WebKit.')] },
    { id: rowIds[1],  cells: [cell(C.testId,'TC-002'), cell(C.name,'Staging site accessible via branch deploy URL'), cell(C.sdlcPhase,'5 - Deployment'), cell(C.featureArea,'Infrastructure'), cell(C.priority,'Critical'), cell(C.testType,'Smoke'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Netlify branch deploys enabled for staging branch in dashboard'), cell(C.testSteps,'1. Open browser. 2. Navigate to https://staging--edmecaacademy.netlify.app. 3. Verify site loads. 4. Check SSL is valid. 5. Verify content matches main branch.'), cell(C.expectedResult,'Staging site loads with valid SSL and correct content'), cell(C.actualResult,'Staging site live and accessible; all content correct'), cell(C.passFail,'Pass'), cell(C.linkedTask,'5.4'), cell(C.linkedBug,''), cell(C.notes,'Netlify branch deploy configured in dashboard and netlify.toml')] },
    { id: rowIds[2],  cells: [cell(C.testId,'TC-003'), cell(C.name,'Login button disabled on production'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / UI'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'Main branch deployed to production; VITE_ENABLE_LOGIN not set in production'), cell(C.testSteps,'1. Navigate to https://edmeca.co.za. 2. Inspect header - Log In button visible. 3. Click Log In button. 4. Verify no navigation occurs. 5. Inspect DOM - confirm no <a> wrapper.'), cell(C.expectedResult,'Button renders as disabled element with no anchor tag; clicking does nothing'), cell(C.actualResult,'Button is fully inert - no anchor wrapper; cursor shows not-allowed'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.12'), cell(C.linkedBug,'BUG-004'), cell(C.notes,'Fixed after first attempt where disabled attr on anchor did not prevent navigation')] },
    { id: rowIds[3],  cells: [cell(C.testId,'TC-004'), cell(C.name,'Login button active and navigates on staging'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / UI'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Staging branch deployed; VITE_ENABLE_LOGIN=true in netlify.toml staging context'), cell(C.testSteps,'1. Navigate to https://staging--edmecaacademy.netlify.app. 2. Click Log In button. 3. Verify navigation to /login. 4. Test mobile menu login button also navigates.'), cell(C.expectedResult,'Login button navigates to /login on both desktop and mobile'), cell(C.actualResult,'Desktop and mobile login buttons both navigate to /login page correctly'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.12'), cell(C.linkedBug,''), cell(C.notes,'VITE_ENABLE_LOGIN=true in netlify.toml staging context')] },
    { id: rowIds[4],  cells: [cell(C.testId,'TC-005'), cell(C.name,'Login page renders with all auth options'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / UI'), cell(C.priority,'High'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Staging branch accessible; user navigates to /login'), cell(C.testSteps,'1. Navigate to /login. 2. Verify Sign In and Sign Up tabs. 3. Verify email/password fields present. 4. Verify Google button with correct G icon. 5. Verify GitHub button.'), cell(C.expectedResult,'Login page shows tabs; forms; real Google G coloured icon; GitHub icon'), cell(C.actualResult,'All elements render correctly; Google icon shows correct multi-colour G'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.14'), cell(C.linkedBug,''), cell(C.notes,'Google icon SVG manually added to replace Mail icon from lucide-react')] },
    { id: rowIds[5],  cells: [cell(C.testId,'TC-006'), cell(C.name,'Google OAuth opens consent screen'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Security'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Partial'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Google provider enabled in Supabase with correct Client ID and Secret'), cell(C.testSteps,'1. Navigate to /login. 2. Click Continue with Google. 3. Verify Google OAuth consent screen opens. 4. Check consent screen shows EdMeCa Academy name.'), cell(C.expectedResult,'Google consent screen opens; shows EdMeCa Academy; user can select account'), cell(C.actualResult,'Consent screen opens and account picker works, but shows Supabase URL instead of EdMeCa Academy'), cell(C.passFail,'Partial'), cell(C.linkedTask,'3.14'), cell(C.linkedBug,'BUG-003'), cell(C.notes,'OAuth consent screen app name pending supervisor update in Google Cloud Console')] },
    { id: rowIds[6],  cells: [cell(C.testId,'TC-007'), cell(C.name,'Email sign-up sends confirmation email'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Email'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-19'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Resend SMTP configured; domain verified; email templates set; Confirm email ON'), cell(C.testSteps,'1. Navigate to /login. 2. Switch to Sign Up tab. 3. Enter test email and password. 4. Click Create Account. 5. Verify success message. 6. Check inbox for confirmation email.'), cell(C.expectedResult,'Success message shown; confirmation email received within 2 minutes'), cell(C.actualResult,'Success message shown; confirmation email received from Info@edmeca.co.za'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.13'), cell(C.linkedBug,'BUG-001'), cell(C.notes,'Initial test failed with Gmail SMTP (500 error). Resolved by switching to Resend.')] },
    { id: rowIds[7],  cells: [cell(C.testId,'TC-008'), cell(C.name,'Confirmation email sent from correct address'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Email'), cell(C.priority,'High'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-19'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Resend SMTP configured with Info@edmeca.co.za as sender'), cell(C.testSteps,'1. Complete sign-up flow. 2. Open received email. 3. Check From address. 4. Verify sender name.'), cell(C.expectedResult,'Email received from Info@edmeca.co.za with sender name EdMeCa Academy'), cell(C.actualResult,'Email from Info@edmeca.co.za - EdMeCa Academy confirmed'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.13'), cell(C.linkedBug,''), cell(C.notes,'')] },
    { id: rowIds[8],  cells: [cell(C.testId,'TC-009'), cell(C.name,'Confirmation email has branded template'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Email'), cell(C.priority,'High'), cell(C.testType,'Visual'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-19'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Email templates updated in Supabase; logo uploaded to Supabase Storage'), cell(C.testSteps,'1. Receive confirmation email. 2. Verify EdMeCa logo renders. 3. Verify button colour is navy (#1f3a6e). 4. Verify footer shows Info@edmeca.co.za.'), cell(C.expectedResult,'Email shows EdMeCa logo; navy CTA button; branded footer; readable on mobile'), cell(C.actualResult,'Logo renders from Supabase Storage; button is correct navy colour'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.13'), cell(C.linkedBug,''), cell(C.notes,'Logo URL: dqvdnyxkkletgkkpicdg.supabase.co/storage/v1/object/public/publiclogos/logo.png')] },
    { id: rowIds[9],  cells: [cell(C.testId,'TC-010'), cell(C.name,'Confirmation email CTA link works'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Email'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-19'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Confirmation email received; link not expired (24h window)'), cell(C.testSteps,'1. Open confirmation email. 2. Click Confirm my account button. 3. Verify redirect to staging site. 4. Verify account confirmed. 5. Attempt login with confirmed account.'), cell(C.expectedResult,'Account confirmed; user redirected to site; login succeeds'), cell(C.actualResult,'Email link worked; account confirmed; login successful'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.13'), cell(C.linkedBug,''), cell(C.notes,'')] },
    { id: rowIds[10], cells: [cell(C.testId,'TC-011'), cell(C.name,'Confirmation email lands in spam'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Email'), cell(C.priority,'Medium'), cell(C.testType,'Deliverability'), cell(C.status,'Fail'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-19'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Resend SMTP working; domain verified; first send to Gmail inbox'), cell(C.testSteps,'1. Complete sign-up flow. 2. Check primary inbox. 3. Check spam/junk folder for confirmation email.'), cell(C.expectedResult,'Email lands in primary inbox'), cell(C.actualResult,'Email received in spam/junk folder'), cell(C.passFail,'Fail'), cell(C.linkedTask,'3.13'), cell(C.linkedBug,'BUG-002'), cell(C.notes,'DMARC TXT record added to IT-Guru DNS as remediation. Deliverability improves as reputation builds.')] },
    { id: rowIds[11], cells: [cell(C.testId,'TC-012'), cell(C.name,'Sign-up error displays friendly message'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / UI'), cell(C.priority,'High'), cell(C.testType,'Negative'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Gmail SMTP misconfigured (to validate error handling)'), cell(C.testSteps,'1. Navigate to /login > Sign Up. 2. Enter valid email and password. 3. Click Create Account. 4. Verify error message displays. 5. Verify no raw API error shown.'), cell(C.expectedResult,'Friendly error message shown; not raw Supabase/API error text'), cell(C.actualResult,'Error message shown: Error sending confirmation email'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.2'), cell(C.linkedBug,'BUG-001'), cell(C.notes,'Error message is user-friendly though SMTP was causing 500 internally.')] },
    { id: rowIds[12], cells: [cell(C.testId,'TC-013'), cell(C.name,'Password mismatch validation on sign-up'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Validation'), cell(C.priority,'High'), cell(C.testType,'Negative'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'User on sign-up tab'), cell(C.testSteps,'1. Navigate to /login > Sign Up. 2. Enter email. 3. Enter password. 4. Enter different Confirm Password. 5. Click Create Account.'), cell(C.expectedResult,'Error shown: Passwords do not match; form not submitted'), cell(C.actualResult,'Validation error shown correctly; form not submitted'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.2'), cell(C.linkedBug,''), cell(C.notes,'Client-side validation in handleSignUp function')] },
    { id: rowIds[13], cells: [cell(C.testId,'TC-014'), cell(C.name,'Password too short validation on sign-up'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Validation'), cell(C.priority,'High'), cell(C.testType,'Negative'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'User on sign-up tab'), cell(C.testSteps,'1. Navigate to /login > Sign Up. 2. Enter email. 3. Enter password < 6 chars in both fields. 4. Click Create Account.'), cell(C.expectedResult,'Error shown: Password must be at least 6 characters; form not submitted'), cell(C.actualResult,'Validation error shown correctly; form not submitted'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.2'), cell(C.linkedBug,''), cell(C.notes,'')] },
    { id: rowIds[14], cells: [cell(C.testId,'TC-015'), cell(C.name,'Google OAuth redirects to /portal on success'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Security'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Not Run'), cell(C.testedBy,'Keenan'), cell(C.testDate,''), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'Google OAuth enabled; consent screen published; test account available'), cell(C.testSteps,'1. Click Continue with Google. 2. Select Google account. 3. Grant permissions. 4. Verify redirect to /portal. 5. Verify session established.'), cell(C.expectedResult,'User redirected to /portal after successful OAuth; session active'), cell(C.actualResult,'Not yet run - pending consent screen app name fix by supervisor'), cell(C.passFail,'Pending'), cell(C.linkedTask,'3.14'), cell(C.linkedBug,'BUG-003'), cell(C.notes,'signInWithOAuth passes redirectTo: window.location.origin/portal')] },
    { id: rowIds[15], cells: [cell(C.testId,'TC-016'), cell(C.name,'Protected route redirects unauthenticated user'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Auth / Security'), cell(C.priority,'Critical'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-18'), cell(C.environment,'staging--edmecaacademy.netlify.app'), cell(C.preConditions,'User not logged in'), cell(C.testSteps,'1. Open browser (not logged in). 2. Navigate directly to /portal. 3. Verify redirect occurs. 4. Verify user lands on /login.'), cell(C.expectedResult,'Unauthenticated user redirected to /login when accessing /portal'), cell(C.actualResult,'ProtectedRoute component triggers redirect to /login'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.3'), cell(C.linkedBug,''), cell(C.notes,'ProtectedRoute component with useAuth hook')] },
    { id: rowIds[16], cells: [cell(C.testId,'TC-017'), cell(C.name,'Theme defaults to light mode on load'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'UI / Theme'), cell(C.priority,'Medium'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-17'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'No theme preference stored in localStorage'), cell(C.testSteps,'1. Clear localStorage. 2. Navigate to https://edmeca.co.za. 3. Verify light mode is active. 4. Check no dark mode classes on body.'), cell(C.expectedResult,'Site loads in light mode by default regardless of OS preference'), cell(C.actualResult,'Light mode active on initial load; ThemeProvider defaults to light'), cell(C.passFail,'Pass'), cell(C.linkedTask,'2.1'), cell(C.linkedBug,''), cell(C.notes,'ThemeProvider.tsx defaultTheme set to light')] },
    { id: rowIds[17], cells: [cell(C.testId,'TC-018'), cell(C.name,'Mobile hamburger menu opens and closes'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'UI / Navigation'), cell(C.priority,'High'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-16'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'Site loaded on mobile viewport (< 768px)'), cell(C.testSteps,'1. Open site on mobile. 2. Tap hamburger icon. 3. Verify slide-out menu appears. 4. Verify all nav links present. 5. Close menu.'), cell(C.expectedResult,'Menu opens with all navigation links; login button disabled on prod'), cell(C.actualResult,'Mobile menu works correctly; login button disabled on prod, active on staging'), cell(C.passFail,'Pass'), cell(C.linkedTask,'3.12'), cell(C.linkedBug,''), cell(C.notes,'Tested via browser DevTools mobile emulation')] },
    { id: rowIds[18], cells: [cell(C.testId,'TC-019'), cell(C.name,'Contact form submission via Netlify Forms'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'Forms / Email'), cell(C.priority,'High'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-16'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'Hidden Netlify form in index.html; Netlify Forms detection active'), cell(C.testSteps,'1. Navigate to /contact. 2. Fill in all form fields. 3. Submit form. 4. Verify success message. 5. Check Netlify Forms dashboard.'), cell(C.expectedResult,'Form submitted successfully; entry visible in Netlify Forms dashboard'), cell(C.actualResult,'Form submission confirmed; 5 fields detected by Netlify'), cell(C.passFail,'Pass'), cell(C.linkedTask,''), cell(C.linkedBug,''), cell(C.notes,'Hidden HTML form added to index.html for Netlify Forms detection')] },
    { id: rowIds[19], cells: [cell(C.testId,'TC-020'), cell(C.name,'All nav links route to correct pages'), cell(C.sdlcPhase,'3 - Development'), cell(C.featureArea,'UI / Routing'), cell(C.priority,'High'), cell(C.testType,'Functional'), cell(C.status,'Pass'), cell(C.testedBy,'Keenan'), cell(C.testDate,'2026-02-16'), cell(C.environment,'edmeca.co.za'), cell(C.preConditions,'Site deployed and accessible'), cell(C.testSteps,'1. Click About > /about. 2. Click Solutions > /solutions. 3. Click Frameworks > /frameworks. 4. Click Engagement > /engagement. 5. Click Contact > /contact.'), cell(C.expectedResult,'Each nav link routes to the correct page without full page reload'), cell(C.actualResult,'All routes functioning correctly via Wouter client-side routing'), cell(C.passFail,'Pass'), cell(C.linkedTask,''), cell(C.linkedBug,''), cell(C.notes,'')] },
  ];

  // PUT all rows in one call (Smartsheet supports batch PUT)
  const result = await api('PUT', `/sheets/${TC_SHEET_ID}/rows`, rows);
  console.log(`✅ Updated ${result.result?.length ?? '?'} TC rows`);
}

async function injectBugTracker() {
  console.log('\n=== Injecting Bug Tracker ===');
  const BUG_SHEET_ID = '789091202322308';

  // Column IDs (from GET)
  const C = {
    bugId:            6353385392131972,
    title:            4101585578446724,
    module:           8605185205817220,
    severity:         442410881208196,
    priority:         4946010508578692,
    status:           2694210694893444,
    reportedBy:       7197810322263940,
    dateReported:     1568310788050820,
    dateResolved:     6071910415421316,
    environmentFound: 3820110601736068,
    branchFound:      8323710229106564,
    rootCauseCategory:1005360834629508,
    rootCauseDesc:    5508960462000004,
    stepsToReproduce: 3257160648314756,
    expectedBehaviour:7760760275685252,
    actualBehaviour:  2131260741472132,
    fixSummary:       6634860368842628,
    linkedTask:       4383060555157380,
    linkedTest:       8886660182527876,
    verifiedBy:       90567160319876,
    verificationDate: 4594166787690372,
    regressionRisk:   2342366974005124,
    notes:            6845966601375620,
  };

  const sheet = await api('GET', `/sheets/${BUG_SHEET_ID}`);
  const rowIds = sheet.rows.map(r => r.id);
  console.log(`Found ${rowIds.length} existing rows`);

  const rows = [
    { id: rowIds[0], strict: false, cells: [
      cell(C.bugId, 'BUG-001'),
      cell(C.title, 'Gmail SMTP throws config reloader error on sign-up'),
      cell(C.module, 'Auth / Email'),
      cell(C.severity, 'Critical'),
      cell(C.priority, 'Critical'),
      cell(C.status, 'Resolved'),
      cell(C.reportedBy, 'Keenan'),
      cell(C.dateReported, '2026-02-18'),
      cell(C.dateResolved, '2026-02-18'),
      cell(C.environmentFound, 'staging--edmecaacademy.netlify.app'),
      cell(C.branchFound, 'staging'),
      cell(C.rootCauseCategory, 'Configuration'),
      cell(C.rootCauseDesc, 'Google Workspace Admin blocks SMTP relay for external apps. smtp.gmail.com:587 with App Password fails with Error 500: config reloader is exiting on the Supabase SMTP handler.'),
      cell(C.stepsToReproduce, '1. Configure Supabase SMTP with smtp.gmail.com:587. 2. Navigate to /login > Sign Up. 3. Enter valid email. 4. Click Create Account. 5. Observe 500 error.'),
      cell(C.expectedBehaviour, 'Sign-up succeeds and confirmation email delivered'),
      cell(C.actualBehaviour, 'Error: SMTP config reloader is exiting. Sign-up fails for all new users.'),
      cell(C.fixSummary, 'Removed Gmail SMTP. Switched to Resend email delivery service. Added DKIM TXT, SPF TXT, MX records. Configured Supabase SMTP: smtp.resend.com:465 with API key as password.'),
      cell(C.linkedTask, '3.13'),
      cell(C.linkedTest, 'TC-007'),
      cell(C.verifiedBy, 'Keenan'),
      cell(C.verificationDate, '2026-02-18'),
      cell(C.regressionRisk, 'Low'),
      cell(C.notes, 'Google Workspace admin SMTP relay disabled. App Passwords tried but blocked at Google level. Resend used as permanent replacement.'),
    ]},
    { id: rowIds[1], strict: false, cells: [
      cell(C.bugId, 'BUG-002'),
      cell(C.title, 'Confirmation email delivered to spam folder'),
      cell(C.module, 'Auth / Email'),
      cell(C.severity, 'Medium'),
      cell(C.priority, 'High'),
      cell(C.status, 'Resolved'),
      cell(C.reportedBy, 'Keenan'),
      cell(C.dateReported, '2026-02-19'),
      cell(C.dateResolved, '2026-02-19'),
      cell(C.environmentFound, 'staging--edmecaacademy.netlify.app'),
      cell(C.branchFound, 'staging'),
      cell(C.rootCauseCategory, 'Configuration'),
      cell(C.rootCauseDesc, 'No DMARC policy record in DNS. New sender domain with no historical sending reputation causes Gmail to classify mail as spam.'),
      cell(C.stepsToReproduce, '1. Configure Resend SMTP with DKIM and SPF only (no DMARC). 2. Complete sign-up flow. 3. Check Gmail inbox primary tab. 4. Check spam/junk folder.'),
      cell(C.expectedBehaviour, 'Confirmation email arrives in primary Gmail inbox'),
      cell(C.actualBehaviour, 'Confirmation email received in spam / junk folder'),
      cell(C.fixSummary, 'Added DMARC TXT record to IT-Guru DNS: _dmarc.edmeca.co.za → v=DMARC1; p=none; rua=mailto:Info@edmeca.co.za. Deliverability to improve as sender reputation builds.'),
      cell(C.linkedTask, '3.13'),
      cell(C.linkedTest, 'TC-011'),
      cell(C.verifiedBy, 'Keenan'),
      cell(C.verificationDate, '2026-02-19'),
      cell(C.regressionRisk, 'Low'),
      cell(C.notes, 'DMARC p=none (monitor mode) chosen. Can escalate to p=quarantine after monitoring period. Gmail reputation improvement is gradual.'),
    ]},
    { id: rowIds[2], strict: false, cells: [
      cell(C.bugId, 'BUG-003'),
      cell(C.title, 'Google OAuth consent screen shows Supabase URL'),
      cell(C.module, 'Auth / OAuth'),
      cell(C.severity, 'High'),
      cell(C.priority, 'High'),
      cell(C.status, 'Open'),
      cell(C.reportedBy, 'Keenan'),
      cell(C.dateReported, '2026-02-18'),
      cell(C.dateResolved, ''),
      cell(C.environmentFound, 'staging--edmecaacademy.netlify.app'),
      cell(C.branchFound, 'staging'),
      cell(C.rootCauseCategory, 'Configuration'),
      cell(C.rootCauseDesc, 'Google Cloud OAuth consent screen not configured. App name and domain not set. App is in Testing mode. Supabase callback URL appears as the authorised redirect.'),
      cell(C.stepsToReproduce, '1. Navigate to /login. 2. Click Continue with Google. 3. Observe consent screen header. 4. Note the name and URL shown to user.'),
      cell(C.expectedBehaviour, 'Consent screen shows EdMeCa Academy as the app name and edmeca.co.za'),
      cell(C.actualBehaviour, 'Consent screen shows Supabase project URL instead of EdMeCa Academy name'),
      cell(C.fixSummary, 'PENDING: Supervisor Raymond Crow to update Google Cloud Console OAuth consent screen: set app name to EdMeCa Academy, homepage and privacy URLs to edmeca.co.za, add logo, publish app.'),
      cell(C.linkedTask, '3.14'),
      cell(C.linkedTest, 'TC-006'),
      cell(C.verifiedBy, ''),
      cell(C.verificationDate, ''),
      cell(C.regressionRisk, 'Medium'),
      cell(C.notes, 'OAuth flow itself works. Only branding/UX concern. In Testing mode only verified test users can sign in. Publish required for general user access.'),
    ]},
    { id: rowIds[3], strict: false, cells: [
      cell(C.bugId, 'BUG-004'),
      cell(C.title, 'Login button navigates despite disabled attribute'),
      cell(C.module, 'Auth / UI'),
      cell(C.severity, 'High'),
      cell(C.priority, 'High'),
      cell(C.status, 'Resolved'),
      cell(C.reportedBy, 'Keenan'),
      cell(C.dateReported, '2026-02-18'),
      cell(C.dateResolved, '2026-02-18'),
      cell(C.environmentFound, 'edmeca.co.za'),
      cell(C.branchFound, 'main'),
      cell(C.rootCauseCategory, 'Logic Error'),
      cell(C.rootCauseDesc, 'Production Header.tsx wrapped disabled <button> in <a href=/login> anchor tag. HTML disabled attribute only applies to form elements; <a> ignores it.'),
      cell(C.stepsToReproduce, '1. Ensure VITE_ENABLE_LOGIN is not set. 2. Build and deploy to production. 3. Navigate to https://edmeca.co.za. 4. Click Log In button. 5. Observe navigation to /login.'),
      cell(C.expectedBehaviour, 'Clicking disabled login button produces no action'),
      cell(C.actualBehaviour, 'Clicking disabled login button navigates to /login page'),
      cell(C.fixSummary, 'Refactored Header.tsx: isLoginEnabled = VITE_ENABLE_LOGIN === true. When false: render plain disabled <button> only. When true: render <a href=/login> wrapping <button>.'),
      cell(C.linkedTask, '3.12'),
      cell(C.linkedTest, 'TC-003'),
      cell(C.verifiedBy, 'Keenan'),
      cell(C.verificationDate, '2026-02-18'),
      cell(C.regressionRisk, 'Low'),
      cell(C.notes, 'Fix also applied to mobile navigation menu. Both desktop and mobile login buttons use same isLoginEnabled conditional.'),
    ]},
  ];

  const result = await api('PUT', `/sheets/${BUG_SHEET_ID}/rows`, rows);
  console.log(`✅ Updated ${result.result?.length ?? '?'} BUG rows`);
}

async function main() {
  if (!API_TOKEN) {
    console.error('ERROR: SMARTSHEET_API_TOKEN not set in .env.local');
    process.exit(1);
  }
  try {
    await injectTestCases();
    await injectBugTracker();
    console.log('\n✅ All data injected successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
