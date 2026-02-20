/**
 * apply-sheet-formatting.js
 * Applies row-level background colour formatting to Test Cases and Bug Tracker
 * Smartsheet sheets based on current cell values.
 *
 * Smartsheet format string positions (0-indexed, comma-separated):
 *   0  fontFamily | 1  fontSize | 2  bold | 3  italic | 4  underline
 *   5  strikethrough | 6  horizontalAlign | 7  verticalAlign | 8  textWrap
 *   9  textRotation | 10 textOverflow | 11 fontColor | 12 backgroundColor
 *   13 taskbarColor | 14 numberFormat | 15 decimalCount | 16 thousandsSeparator
 *   17 currencyCode | 18 dateFormat
 *
 * Smartsheet background color palette indices:
 *   0  = none (transparent)
 *   3  = light gray      (Not Run / Pending)
 *   8  = light red       (Fail / Critical)
 *   10 = light orange    (High / Partial)
 *   12 = light yellow    (Medium / Not Run)
 *   14 = light green     (Pass / Resolved / Low)
 *   21 = light blue      (In Progress / Partial info)
 */

import 'dotenv/config';

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

/** Build a format string that sets ONLY the background colour.
 *  backgroundColor is position 12 (0-indexed), so 12 commas precede it. */
function bgFmt(colorIndex) {
  return ',,,,,,,,,,,,' + colorIndex + ',,,,,,';
}

// Background colour indices used
const BG = {
  none:        '0',
  lightGray:   '3',
  lightRed:    '8',
  lightOrange: '10',
  lightYellow: '12',
  lightGreen:  '14',
  lightBlue:   '21',
};

function getCellValue(row, columnId) {
  return row.cells.find(c => c.columnId === columnId)?.value ?? '';
}

// ─── TEST CASES ──────────────────────────────────────────────────────────────

async function formatTestCases() {
  console.log('\n=== Formatting Test Cases ===');
  const SHEET_ID = '3745437451243396';

  const sheet = await api('GET', `/sheets/${SHEET_ID}`);
  const colByTitle = {};
  sheet.columns.forEach(c => { colByTitle[c.title] = c.id; });

  const passFailColId = colByTitle['Pass/Fail'];

  const updates = sheet.rows.map(row => {
    const pf = String(getCellValue(row, passFailColId)).trim();
    let bg;
    if      (pf === 'Pass')    bg = BG.lightGreen;
    else if (pf === 'Fail')    bg = BG.lightRed;
    else if (pf === 'Partial') bg = BG.lightOrange;
    else if (pf === 'Pending') bg = BG.lightBlue;
    else                       bg = BG.lightYellow; // Not Run or blank
    return { id: row.id, format: bgFmt(bg) };
  });

  const result = await api('PUT', `/sheets/${SHEET_ID}/rows`, updates);
  console.log(`✅ Formatted ${result.result?.length ?? '?'} TC rows`);
  updates.forEach((u, i) => {
    const pf = String(getCellValue(sheet.rows[i], passFailColId)).trim() || 'blank';
    console.log(`   Row ${i + 1} (${pf}) → bg ${u.format.split(',')[12]}`);
  });
}

// ─── BUG TRACKER ─────────────────────────────────────────────────────────────

async function formatBugTracker() {
  console.log('\n=== Formatting Bug Tracker ===');
  const SHEET_ID = '789091202322308';

  const sheet = await api('GET', `/sheets/${SHEET_ID}`);
  const colByTitle = {};
  sheet.columns.forEach(c => { colByTitle[c.title] = c.id; });

  const severityColId = colByTitle['Severity'];
  const statusColId   = colByTitle['Status'];

  const updates = sheet.rows.map(row => {
    const status   = String(getCellValue(row, statusColId)).trim();
    const severity = String(getCellValue(row, severityColId)).trim();

    let bg;
    if (status === 'Open') {
      // Open bugs: colour intensity based on severity
      if      (severity === 'Critical') bg = BG.lightRed;
      else if (severity === 'High')     bg = BG.lightOrange;
      else if (severity === 'Medium')   bg = BG.lightYellow;
      else                              bg = BG.lightBlue;
    } else if (status === 'Resolved') {
      bg = BG.lightGreen;
    } else if (status === 'In Progress') {
      bg = BG.lightYellow;
    } else {
      bg = BG.none;
    }

    return { id: row.id, format: bgFmt(bg) };
  });

  const result = await api('PUT', `/sheets/${SHEET_ID}/rows`, updates);
  console.log(`✅ Formatted ${result.result?.length ?? '?'} BUG rows`);
  updates.forEach((u, i) => {
    const status   = String(getCellValue(sheet.rows[i], statusColId)).trim()   || 'blank';
    const severity = String(getCellValue(sheet.rows[i], severityColId)).trim() || 'blank';
    console.log(`   Row ${i + 1} (${severity} / ${status}) → bg ${u.format.split(',')[12]}`);
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_TOKEN) {
    console.error('ERROR: SMARTSHEET_API_TOKEN not set');
    process.exit(1);
  }
  try {
    await formatTestCases();
    await formatBugTracker();
    console.log('\n✅ Conditional formatting applied to both sheets!');
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

main();
