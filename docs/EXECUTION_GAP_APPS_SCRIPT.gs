// Bump when pasting a new version in, then run checkSetup() to confirm the
// deployment actually serving traffic is the one you just pasted.
const SCRIPT_VERSION = '4.3';
const SHEET_NAME = 'Responses';
// The AI Enablement Baseline (/ai-map) shares this web app and spreadsheet.
// Its rows go to a second tab; see the AI MAP section at the end of this file.
const AI_MAP_SHEET_NAME = 'AI Map';
const AI_MAP_RETEST_URL = 'https://edmeca.co.za/ai-map?rt=';
const AI_MAP_HEADERS = [
  'timestamp','respondentId','status','wave','retestOf','cohort','mode','quadrant','onTheLine','capability','readiness','index','balance',
  'c1','c2','c3','c4','r1','r2','r3','r4',
  'q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15','q16','q17','q18','q19','q20','q21','q22','q23','q24',
  'priority1','priority2','route','sizeOrRole','sector','programmeStatus','context',
  'name','email','organisation','wantsCall','reportSource','reportText','unlockedAt','userAgent','referrer'
];
// Where lead notifications go, and the reply-to on every respondent email.
// A NOTIFY_TO script property (Project Settings > Script Properties) overrides
// the default. The earlier raymond@edmeca.co.za had no mailbox, so every unlock
// produced an "Address not found" bounce instead of a lead notification.
const NOTIFY_TO_DEFAULT = 'rcrown@edmeca.co.za';
function notifyTo_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_TO') || NOTIFY_TO_DEFAULT;
}
const FROM_NAME = 'Edmeca';
const HEADERS = [
  'timestamp','respondentId','status','archetype','loopScore','frameworkTotal','executionTotal','evidenceTotal','executionGap','evidenceGap',
  'c1_F','c1_E','c1_V','c2_F','c2_E','c2_V','c3_F','c3_E','c3_V','c4_F','c4_E','c4_V','c5_F','c5_E','c5_V','c6_F','c6_E','c6_V',
  'stalls','widestGaps','aiMultiplier','stage','stageBand','sector','programmeStatus','route','name','email','business','wantsCall','reportSource','reportText','unlockedAt','userAgent','referrer'
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!expected || body.secret !== expected) return json_({ ok: false, error: 'unauthorised' });
    if (body.instrument === 'ai-map') return json_(aiMap_(body));
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    ensureHeaders_(sheet);
    if (body.action === 'map') return json_(map_(sheet, body));
    if (body.action === 'unlock') return json_(unlock_(sheet, body));
    return json_({ ok: false, error: 'unknown action' });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function map_(sheet, body) {
  const result = body.result || {};
  const cells = body.cells || {};
  const row = [
    new Date(), body.respondentId, 'mapped', result.archetype || '', result.loopScore || 0,
    result.frameworkTotal || 0, result.executionTotal || 0, result.evidenceTotal || 0,
    result.executionGap || 0, result.evidenceGap || 0,
    cells[1]?.F ?? '', cells[1]?.E ?? '', cells[1]?.V ?? '', cells[2]?.F ?? '', cells[2]?.E ?? '', cells[2]?.V ?? '',
    cells[3]?.F ?? '', cells[3]?.E ?? '', cells[3]?.V ?? '', cells[4]?.F ?? '', cells[4]?.E ?? '', cells[4]?.V ?? '',
    cells[5]?.F ?? '', cells[5]?.E ?? '', cells[5]?.V ?? '', cells[6]?.F ?? '', cells[6]?.E ?? '', cells[6]?.V ?? '',
    (result.stalls || []).join(','), (result.widestGaps || []).join(','), body.aiMultiplier || '', body.stage || '', body.stageBand || '',
    body.sector || '', body.programmeStatus || '', routeFor_(body), '', '', '', '', '', '', '', body.userAgent || '', body.referrer || ''
  ];
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, HEADERS.length).setValues([row]);
  return { ok: true };
}

function unlock_(sheet, body) {
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === body.respondentId) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) {
    map_(sheet, body);
    rowIndex = 2;
  }
  // Columns 37-45 are name..referrer. Writing 10 values here used to push route
  // into column 46, one past the last header; route belongs in column 36.
  sheet.getRange(rowIndex, 37, 1, 9).setValues([[
    body.name || '', body.email || '', body.business || '', body.wantsCall ? 'Yes' : 'No',
    body.reportSource || 'template', body.reportText || '', new Date(), body.userAgent || '', body.referrer || ''
  ]]);
  sheet.getRange(rowIndex, 36).setValue(routeFor_(body));
  return sendBoth_(sheet, rowIndex, 3, function () { sendRespondentEmail_(body); }, function () { sendNotification_(body); });
}

/**
 * Sends the respondent report, then the lead notification, and records the
 * outcome in the status column: "report_sent" only when the report actually
 * left, otherwise "send_failed: <reason>" so the sheet shows why. The status
 * used to be written before sending, which made a failed send look successful.
 * A notification failure (the bounce to raymond@edmeca.co.za was one) never
 * costs the respondent their report.
 */
function sendBoth_(sheet, rowIndex, statusColumn, sendReport, sendNotification) {
  try {
    sendReport();
  } catch (error) {
    sheet.getRange(rowIndex, statusColumn).setValue('send_failed: ' + String(error).slice(0, 200));
    return { ok: false, error: 'report email failed: ' + String(error) };
  }
  sheet.getRange(rowIndex, statusColumn).setValue('report_sent');
  try { sendNotification(); } catch (error) { Logger.log('Notification failed: %s', String(error)); }
  return { ok: true };
}

function sendRespondentEmail_(body) {
  const subject = 'Your Edmeca Execution Gap Report';
  const report = escapeHtml_(body.reportText || 'Your map shows where Framework, Execution and Evidence currently connect.');
  // GmailApp rather than MailApp: it sends through Gmail proper, so the message
  // lands in the sending account's Sent folder and can actually be traced when a
  // respondent reports nothing arrived. MailApp sends leave no such record.
  // Note the signature — GmailApp is positional and does not accept MailApp's
  // single options object; passing one silently sends a malformed message.
  GmailApp.sendEmail(body.email, subject, body.reportText || 'Your Execution Gap Report is ready.', {
    name: FROM_NAME,
    replyTo: notifyTo_(),
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#5D6266;max-width:640px"><img src="https://edmeca.co.za/logo.png" alt="EdMeCa" style="width:160px"><h1 style="color:#53317A">Your Execution Gap Report</h1><p><strong>' + escapeHtml_(body.result?.archetype || 'Your Loop Map') + '</strong></p><div style="white-space:pre-line;line-height:1.6">' + report + '</div><p><a href="https://edmeca.co.za/contact" style="background:#53317A;color:#fff;padding:12px 18px;text-decoration:none">Book a conversation</a></p></div>'
  });
}

function sendNotification_(body) {
  GmailApp.sendEmail(notifyTo_(), '[Edmeca] Execution Gap lead: ' + (body.name || 'Unknown'),
    ['New Execution Gap report unlocked', '', 'Name: ' + (body.name || ''), 'Email: ' + (body.email || ''), 'Business: ' + (body.business || ''), 'Wants a call: ' + (body.wantsCall ? 'YES' : 'no'), 'Stage: ' + (body.stage || ''), 'Sector: ' + (body.sector || ''), 'Archetype: ' + (body.result?.archetype || ''), 'Loop score: ' + (body.result?.loopScore || '')].join('\n'),
    { name: FROM_NAME, replyTo: notifyTo_() });
}

function routeFor_(body) {
  const stalls = body.result?.stalls || [];
  const count = stalls.filter(function (stall) { return stall !== 'C'; }).length;
  if (body.stageBand === 'trading') return count >= 5 ? 'Extended intervention series' : count >= 3 ? 'Targeted interventions' : 'Focused intervention';
  return count >= 3 ? 'Targeted interventions' : 'Focused intervention';
}

/**
 * Diagnostics — run these from the Apps Script editor (Run > select function)
 * and read the output in View > Logs. Neither prints the secret.
 */
function checkSetup() {
  Logger.log('Script version: %s', SCRIPT_VERSION);
  Logger.log('Sending as: %s', Session.getEffectiveUser().getEmail());
  Logger.log('Notifications and reply-to: %s (%s)', notifyTo_(), PropertiesService.getScriptProperties().getProperty('NOTIFY_TO') ? 'NOTIFY_TO script property' : 'default; set NOTIFY_TO to change');
  Logger.log('Emails left today: %s (shared daily quota)', MailApp.getRemainingDailyQuota());
  // Touching GmailApp forces the authorisation prompt for the broader
  // https://mail.google.com/ scope it needs. MailApp only needed script.send_mail,
  // so an existing deployment is NOT authorised for this until it is re-approved:
  // without that, doPost fails on every unlock.
  try {
    GmailApp.getAliases();
    Logger.log('GmailApp: authorised. Sends will appear in this account\'s Sent folder.');
    // A real send, with the same options the reports use, to the notification
    // address. If this arrives but reports do not, compare the two in Gmail.
    GmailApp.sendEmail(notifyTo_(), '[Edmeca] checkSetup test ' + SCRIPT_VERSION, 'Plain-text part. If you can read this, GmailApp sends from ' + Session.getEffectiveUser().getEmail() + ' work.', { name: FROM_NAME, replyTo: notifyTo_(), htmlBody: '<div style="font-family:Arial,sans-serif"><img src="https://edmeca.co.za/logo.png" alt="EdMeCa" style="width:160px"><p>HTML part with the logo, as the reports send it.</p></div>' });
    Logger.log('Test email sent to %s. Check that inbox (and spam) for "[Edmeca] checkSetup test".', notifyTo_());
  } catch (error) {
    Logger.log('GmailApp: NOT AUTHORISED — %s', String(error));
    Logger.log('  Re-approve the script, then redeploy the Web App as a NEW version.');
  }
  const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!secret) {
    Logger.log('SHARED_SECRET: NOT SET. Add it under Project Settings > Script Properties.');
  } else {
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secret, Utilities.Charset.UTF_8);
    const hex = bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
    Logger.log('SHARED_SECRET: length %s, sha256[:16] %s', secret.length, hex.slice(0, 16));
    Logger.log('  Must match: netlify env:list --context production --json');
    if (secret !== secret.trim()) Logger.log('  WARNING: leading or trailing whitespace — this alone causes "unauthorised".');
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('Sheet "%s": MISSING. Every write fails until a tab with this exact name exists.', SHEET_NAME);
  } else {
    const headers = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    Logger.log('Sheet "%s": found, %s data row(s).', SHEET_NAME, Math.max(0, sheet.getLastRow() - 1));
    Logger.log('  Headers %s', headers.join('|') === HEADERS.join('|') ? 'match.' : 'DO NOT match — they will be rewritten on the next POST.');
  }
  const aiMapSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AI_MAP_SHEET_NAME);
  if (!aiMapSheet) {
    Logger.log('Sheet "%s": not yet created. It is created automatically on the first /ai-map submission.', AI_MAP_SHEET_NAME);
  } else {
    const aiHeaders = aiMapSheet.getLastRow() === 0 ? [] : aiMapSheet.getRange(1, 1, 1, AI_MAP_HEADERS.length).getValues()[0];
    Logger.log('Sheet "%s": found, %s data row(s).', AI_MAP_SHEET_NAME, Math.max(0, aiMapSheet.getLastRow() - 1));
    Logger.log('  Headers %s', aiHeaders.join('|') === AI_MAP_HEADERS.join('|') ? 'match.' : 'DO NOT match — they will be rewritten on the next POST.');
  }
}

/**
 * Replays the report email for the most recent unlocked row, to the address on
 * that row. Use it when the sheet says report_sent but nothing arrived: doPost
 * swallows mail errors into its catch, so running this surfaces the real error
 * (quota, missing authorisation) in the Apps Script log instead.
 */
function resendLastReport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('Sheet "%s" is missing.', SHEET_NAME); return; }
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] !== 'report_sent' && String(values[i][2]).indexOf('send_failed') !== 0) continue;
    const row = values[i];
    Logger.log('Row %s — %s <%s>, reportText %s chars', i + 1, row[36], row[37], String(row[41]).length);
    if (!row[37]) { Logger.log('No email address on that row.'); return; }
    try {
      sendRespondentEmail_({ email: row[37], reportText: row[41], result: { archetype: row[3] } });
      Logger.log('Sent. Quota left: %s. If it still does not arrive, check spam and the sending account.', MailApp.getRemainingDailyQuota());
    } catch (error) {
      Logger.log('FAILED: %s', String(error));
    }
    return;
  }
  Logger.log('No row with status report_sent or send_failed found.');
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  else if (sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}
function escapeHtml_(value) { return String(value).replace(/[&<>'"]/g, function (character) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]; }); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }

/* =====================================================================
 * AI MAP — the AI Enablement Baseline at edmeca.co.za/ai-map
 *
 * Same web app, same SHARED_SECRET, second tab. netlify/functions/ai-map.ts
 * sends { instrument: 'ai-map', action: 'baseline' | 'unlock' | 'lookup' }.
 *   baseline: new row at row 2 with status "placed"
 *   unlock:   fills the contact columns, status "report_sent", emails the report
 *   lookup:   returns the most recent row for a respondentId or email so the
 *             function can report movement on a re-test
 * ===================================================================== */
const AI_MAP_DIMENSIONS = ['C1','C2','C3','C4','R1','R2','R3','R4'];
const AI_MAP_QUADRANT_NAMES = { starters: 'Starters', pathseekers: 'Pathseekers', transformers: 'Transformers', fuelled: 'AI-Fuelled' };
const AI_MAP_DIMENSION_NAMES = { C1: 'Skills and tool fluency', C2: 'Adoption in daily work', C3: 'Data and information readiness', C4: 'Outcomes and value', R1: 'Ambition and strategy', R2: 'Leadership and commitment', R3: 'People and change', R4: 'Governance and responsible use' };

function aiMapCol_(name) { return AI_MAP_HEADERS.indexOf(name) + 1; }

function aiMapSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(AI_MAP_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(AI_MAP_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(AI_MAP_HEADERS);
  else if (sheet.getRange(1, 1, 1, AI_MAP_HEADERS.length).getValues()[0].join('|') !== AI_MAP_HEADERS.join('|')) sheet.getRange(1, 1, 1, AI_MAP_HEADERS.length).setValues([AI_MAP_HEADERS]);
  return sheet;
}

function aiMap_(body) {
  const sheet = aiMapSheet_();
  if (body.action === 'baseline') return aiMapBaseline_(sheet, body);
  if (body.action === 'unlock') return aiMapUnlock_(sheet, body);
  if (body.action === 'lookup') return aiMapLookup_(sheet, body);
  return { ok: false, error: 'unknown action' };
}

function aiMapRoute_(body) {
  const quadrant = (body.result || {}).quadrant;
  return quadrant === 'fuelled' ? 'Focused interventions / partnership' : quadrant === 'transformers' ? 'Structured hands-on interventions' : quadrant === 'pathseekers' ? 'Targeted interventions' : 'Focused intervention to start';
}

function aiMapRow_(body, status) {
  const result = body.result || {};
  const dims = result.dimensions || {};
  const answers = body.answers || {};
  const profile = body.profile || {};
  const row = [
    new Date(), body.respondentId, status, body.wave || 'baseline', body.retestOf || '', body.cohort || '', body.mode || '',
    result.quadrant || '', result.onTheLine ? 'Yes' : 'No', result.capability ?? '', result.readiness ?? '', result.index ?? '', result.balance ?? ''
  ];
  AI_MAP_DIMENSIONS.forEach(function (code) { row.push(dims[code] === null || dims[code] === undefined ? '' : dims[code]); });
  for (let id = 1; id <= 24; id++) row.push(answers[String(id)] === undefined ? '' : answers[String(id)]);
  const priorities = result.priorities || [];
  row.push(priorities[0] || '', priorities[1] || '', aiMapRoute_(body), profile.sizeOrRole || '', profile.sector || '', profile.programmeStatus || '', body.context || '');
  row.push('', '', '', '', '', '', '', body.userAgent || '', body.referrer || '');
  return row;
}

function aiMapFindRow_(sheet, respondentId) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) if (values[i][aiMapCol_('respondentId') - 1] === respondentId) return i + 1;
  return -1;
}

function aiMapBaseline_(sheet, body) {
  // A respondent who revisits a statement and resolves again keeps one row:
  // overwrite the scores and answers, leave any contact and report columns.
  const existing = aiMapFindRow_(sheet, body.respondentId);
  if (existing > 0) {
    const row = aiMapRow_(body, sheet.getRange(existing, aiMapCol_('status')).getValue() || 'placed');
    const keep = aiMapCol_('context');
    sheet.getRange(existing, 1, 1, keep).setValues([row.slice(0, keep)]);
    return { ok: true, updated: true };
  }
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, AI_MAP_HEADERS.length).setValues([aiMapRow_(body, 'placed')]);
  return { ok: true };
}

function aiMapUnlock_(sheet, body) {
  let rowIndex = aiMapFindRow_(sheet, body.respondentId);
  if (rowIndex < 0) { aiMapBaseline_(sheet, body); rowIndex = 2; }
  sheet.getRange(rowIndex, aiMapCol_('name'), 1, 9).setValues([[
    body.name || '', body.email || '', body.organisation || '', body.wantsCall ? 'Yes' : 'No',
    body.reportSource || 'template', body.reportText || '', new Date(), body.userAgent || '', body.referrer || ''
  ]]);
  return sendBoth_(sheet, rowIndex, aiMapCol_('status'), function () { aiMapSendReport_(body); }, function () { aiMapNotify_(body); });
}

/**
 * Most recent row matching respondentId, or email (case-insensitive), skipping
 * `exclude` (the row being unlocked right now). Rows are newest first.
 */
function aiMapLookup_(sheet, body) {
  const values = sheet.getDataRange().getValues();
  const wantedEmail = String(body.email || '').trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = row[aiMapCol_('respondentId') - 1];
    if (body.exclude && id === body.exclude) continue;
    const matches = body.respondentId ? id === body.respondentId : wantedEmail && String(row[aiMapCol_('email') - 1]).trim().toLowerCase() === wantedEmail;
    if (!matches) continue;
    const dimensions = {};
    AI_MAP_DIMENSIONS.forEach(function (code) { const value = row[aiMapCol_(code.toLowerCase()) - 1]; dimensions[code] = value === '' ? null : Number(value); });
    const timestamp = row[aiMapCol_('timestamp') - 1];
    return { ok: true, previous: {
      respondentId: id, timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp), wave: row[aiMapCol_('wave') - 1], mode: row[aiMapCol_('mode') - 1],
      quadrant: row[aiMapCol_('quadrant') - 1], capability: Number(row[aiMapCol_('capability') - 1]), readiness: Number(row[aiMapCol_('readiness') - 1]), dimensions: dimensions,
      profile: { sizeOrRole: row[aiMapCol_('sizeOrRole') - 1], sector: row[aiMapCol_('sector') - 1], programmeStatus: row[aiMapCol_('programmeStatus') - 1] }
    } };
  }
  return { ok: true, previous: null };
}

function aiMapMapTable_(result) {
  const quadrant = result.quadrant;
  const cell = function (id, label, sub) {
    const lit = id === quadrant;
    return '<td style="width:50%;padding:14px;border:1px solid #C9DDB3;text-align:center;background:' + (lit ? '#6E9A43' : '#ffffff') + ';color:' + (lit ? '#ffffff' : '#5D6266') + '"><strong>' + label + '</strong><br><span style="font-size:11px">' + sub + '</span>' + (lit ? '<br><span style="font-size:22px;line-height:1">&#9679;</span>' : '') + '</td>';
  };
  return '<table style="border-collapse:collapse;width:100%;max-width:420px;font-family:Arial,sans-serif;font-size:13px">'
    + '<tr><td colspan="2" style="font-size:11px;color:#53317A;font-weight:bold;padding-bottom:4px">AI CAPABILITY &uarr;</td></tr>'
    + '<tr>' + cell('pathseekers', 'Pathseekers', 'Building momentum') + cell('fuelled', 'AI-Fuelled', 'At scale, learning') + '</tr>'
    + '<tr>' + cell('starters', 'Starters', 'Exploring') + cell('transformers', 'Transformers', 'Pilots to impact') + '</tr>'
    + '<tr><td colspan="2" style="font-size:11px;color:#53317A;font-weight:bold;text-align:right;padding-top:4px">LEADERSHIP AND ORGANISATIONAL READINESS &rarr;</td></tr></table>';
}

function aiMapSendReport_(body) {
  const result = body.result || {};
  const quadrantName = AI_MAP_QUADRANT_NAMES[result.quadrant] || 'Your position';
  const retestLink = AI_MAP_RETEST_URL + encodeURIComponent(body.respondentId || '');
  const dims = result.dimensions || {};
  const dimRows = AI_MAP_DIMENSIONS.map(function (code) {
    const score = dims[code] === null || dims[code] === undefined ? '-' : dims[code];
    return '<tr><td style="padding:4px 8px 4px 0;color:#5D6266">' + code + ' ' + AI_MAP_DIMENSION_NAMES[code] + '</td><td style="padding:4px 0;font-weight:bold;color:#53317A;text-align:right">' + score + '</td></tr>';
  }).join('');
  const report = escapeHtml_(body.reportText || 'Your AI Enablement Report is ready.');
  const plain = (body.reportText || 'Your AI Enablement Report is ready.') + '\n\nRetake your baseline in 90 days, or after an intervention: ' + retestLink + '\n\nWe use your details to send this report and, if you asked for one, to arrange a conversation. We do not share them.';
  GmailApp.sendEmail(body.email, 'Your Edmeca AI Enablement Report: ' + quadrantName, plain, {
    name: FROM_NAME,
    replyTo: notifyTo_(),
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#5D6266;max-width:640px;background:#ffffff;padding:8px">'
      + '<img src="https://edmeca.co.za/logo.png" alt="EdMeCa" style="width:160px;display:block">'
      + '<p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#53317A;font-weight:bold;margin:20px 0 4px">Your position on the AI Enablement Map</p>'
      + '<h1 style="color:#53317A;margin:0 0 12px;font-size:28px">' + escapeHtml_(quadrantName) + '</h1>'
      + '<p style="margin:0 0 16px"><strong>Capability ' + escapeHtml_(String(result.capability ?? '')) + '</strong> &middot; <strong>Readiness ' + escapeHtml_(String(result.readiness ?? '')) + '</strong> &middot; Enablement index ' + escapeHtml_(String(result.index ?? '')) + '</p>'
      + aiMapMapTable_(result)
      + '<h2 style="color:#53317A;font-size:16px;margin:24px 0 8px">Your eight dimensions</h2><table style="border-collapse:collapse;font-size:13px;font-family:Arial,sans-serif">' + dimRows + '</table>'
      + '<h2 style="color:#53317A;font-size:16px;margin:24px 0 8px">Your AI Enablement Report</h2>'
      + '<div style="white-space:pre-line;line-height:1.6">' + report + '</div>'
      + '<p style="margin:24px 0"><a href="' + retestLink + '" style="background:#6E9A43;color:#fff;padding:12px 18px;text-decoration:none;font-weight:bold">Come back and move the dot</a></p>'
      + '<p style="font-size:13px">That link re-opens your baseline so you can retake it in 90 days, or after an intervention, and see how far your dot has moved. Talk to Edmeca: <a href="https://edmeca.co.za/contact" style="color:#53317A">edmeca.co.za/contact</a>.</p>'
      + '<p style="font-size:11px;color:#8a8f93;margin-top:24px">We use your details to send this report and, if you asked for one, to arrange a conversation. We do not share them.</p>'
      + '</div>'
  });
}

function aiMapNotify_(body) {
  const result = body.result || {};
  const profile = body.profile || {};
  const movement = body.movement;
  GmailApp.sendEmail(notifyTo_(), '[Edmeca] AI Map report: ' + (body.name || 'Unknown') + ' (' + (AI_MAP_QUADRANT_NAMES[result.quadrant] || '') + ')',
    ['New AI Enablement Report unlocked', '', 'Name: ' + (body.name || ''), 'Email: ' + (body.email || ''), 'Organisation: ' + (body.organisation || ''), 'Wants a call: ' + (body.wantsCall ? 'YES' : 'no'),
     'Mode: ' + (body.mode || ''), 'Wave: ' + (body.wave || 'baseline'), 'Cohort: ' + (body.cohort || '-'), 'Size or role: ' + (profile.sizeOrRole || ''), 'Sector: ' + (profile.sector || ''), 'Programme status: ' + (profile.programmeStatus || ''),
     '', 'Quadrant: ' + (AI_MAP_QUADRANT_NAMES[result.quadrant] || ''), 'Capability: ' + (result.capability ?? ''), 'Readiness: ' + (result.readiness ?? ''), 'Index: ' + (result.index ?? ''), 'On the line: ' + (result.onTheLine ? 'yes' : 'no'),
     'Priorities: ' + ((result.priorities || []).join(', ')), movement ? 'Movement since baseline: capability ' + movement.capability + ', readiness ' + movement.readiness : 'First baseline',
     '', 'Context: ' + (body.context || '-'), '', 'Report source: ' + (body.reportSource || 'template')].join('\n'),
    { name: FROM_NAME, replyTo: notifyTo_() });
}

/** Replays the AI Map report email for the most recent report_sent row; the AI Map twin of resendLastReport(). */
function aiMapResendLastReport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AI_MAP_SHEET_NAME);
  if (!sheet) { Logger.log('Sheet "%s" is missing.', AI_MAP_SHEET_NAME); return; }
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const status = String(row[aiMapCol_('status') - 1]);
    if (status !== 'report_sent' && status.indexOf('send_failed') !== 0) continue;
    const dimensions = {};
    AI_MAP_DIMENSIONS.forEach(function (code) { dimensions[code] = row[aiMapCol_(code.toLowerCase()) - 1]; });
    try {
      aiMapSendReport_({ respondentId: row[aiMapCol_('respondentId') - 1], email: row[aiMapCol_('email') - 1], reportText: row[aiMapCol_('reportText') - 1], result: { quadrant: row[aiMapCol_('quadrant') - 1], capability: row[aiMapCol_('capability') - 1], readiness: row[aiMapCol_('readiness') - 1], index: row[aiMapCol_('index') - 1], dimensions: dimensions } });
      Logger.log('Sent to %s. Quota left: %s.', row[aiMapCol_('email') - 1], MailApp.getRemainingDailyQuota());
    } catch (error) {
      Logger.log('FAILED: %s', String(error));
    }
    return;
  }
  Logger.log('No AI Map row with status report_sent or send_failed found.');
}
