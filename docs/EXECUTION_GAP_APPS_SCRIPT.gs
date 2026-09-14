const SHEET_NAME = 'Responses';
const NOTIFY_TO = 'raymond@edmeca.co.za';
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
  sheet.getRange(rowIndex, 3).setValue('report_sent');
  sendRespondentEmail_(body);
  sendNotification_(body);
  return { ok: true };
}

function sendRespondentEmail_(body) {
  const subject = 'Your Edmeca Execution Gap Report';
  const report = escapeHtml_(body.reportText || 'Your map shows where Framework, Execution and Evidence currently connect.');
  MailApp.sendEmail({
    to: body.email,
    name: FROM_NAME,
    replyTo: NOTIFY_TO,
    subject,
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#5D6266;max-width:640px"><img src="https://edmeca.co.za/logo.png" alt="EdMeCa" style="width:160px"><h1 style="color:#53317A">Your Execution Gap Report</h1><p><strong>' + escapeHtml_(body.result?.archetype || 'Your Loop Map') + '</strong></p><div style="white-space:pre-line;line-height:1.6">' + report + '</div><p><a href="https://edmeca.co.za/contact" style="background:#53317A;color:#fff;padding:12px 18px;text-decoration:none">Book a conversation</a></p></div>',
    body: body.reportText || 'Your Execution Gap Report is ready.'
  });
}

function sendNotification_(body) {
  MailApp.sendEmail({
    to: NOTIFY_TO,
    name: FROM_NAME,
    subject: '[Edmeca] Execution Gap lead: ' + (body.name || 'Unknown'),
    body: ['New Execution Gap report unlocked', '', 'Name: ' + (body.name || ''), 'Email: ' + (body.email || ''), 'Business: ' + (body.business || ''), 'Wants a call: ' + (body.wantsCall ? 'YES' : 'no'), 'Stage: ' + (body.stage || ''), 'Sector: ' + (body.sector || ''), 'Archetype: ' + (body.result?.archetype || ''), 'Loop score: ' + (body.result?.loopScore || '')].join('\n')
  });
}

function routeFor_(body) {
  const stalls = body.result?.stalls || [];
  const count = stalls.filter(function (stall) { return stall !== 'C'; }).length;
  if (body.stageBand === 'trading') return count >= 5 ? 'Full Journey' : count >= 3 ? 'Mid-Tier' : 'Focused Session';
  return count >= 3 ? 'Mid-Tier' : 'Focused Session';
}

/**
 * Diagnostics — run these from the Apps Script editor (Run > select function)
 * and read the output in View > Logs. Neither prints the secret.
 */
function checkSetup() {
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
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  else if (sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}
function escapeHtml_(value) { return String(value).replace(/[&<>'"]/g, function (character) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]; }); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
