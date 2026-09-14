/**
 * Builds the Execution Gap response workbook template.
 *
 * The column order here is copied verbatim from HEADERS in
 * docs/EXECUTION_GAP_APPS_SCRIPT.gs. The Apps Script rewrites row 1 on every
 * POST (ensureHeaders_), so the template must match it exactly or the script
 * will silently overwrite the header row and the columns will shift.
 *
 *   node scripts/build-execution-gap-template.mjs
 */
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

// ── Verbatim from EXECUTION_GAP_APPS_SCRIPT.gs ───────────────────────────────
const HEADERS = [
  'timestamp', 'respondentId', 'status', 'archetype', 'loopScore',
  'frameworkTotal', 'executionTotal', 'evidenceTotal', 'executionGap', 'evidenceGap',
  'c1_F', 'c1_E', 'c1_V', 'c2_F', 'c2_E', 'c2_V', 'c3_F', 'c3_E', 'c3_V',
  'c4_F', 'c4_E', 'c4_V', 'c5_F', 'c5_E', 'c5_V', 'c6_F', 'c6_E', 'c6_V',
  'stalls', 'widestGaps', 'aiMultiplier', 'stage', 'stageBand', 'sector',
  'programmeStatus', 'route', 'name', 'email', 'business', 'wantsCall',
  'reportSource', 'reportText', 'unlockedAt', 'userAgent', 'referrer',
];

// The six capabilities, from client/src/data/executionGap.ts
const CAPABILITIES = [
  'Problem and customer',
  'Value proposition',
  'Business model',
  'Prototype or MVP',
  'Market entry and first revenue',
  'Pitch and funding readiness',
];

const STATUS = {
  OK: 'OK',
  BROKEN: 'NOT POPULATED — see Known gaps',
};

/** What actually fills each column today. */
const FIELD_MAP = [
  ['timestamp', 'Apps Script', 'new Date() at insert', STATUS.OK],
  ['respondentId', 'client', 'crypto.randomUUID() in sessionStorage', STATUS.OK],
  ['status', 'Apps Script', "'mapped', then 'report_sent' on unlock", STATUS.OK],
  ['archetype', 'function', 'result.archetype', STATUS.OK],
  ['loopScore', 'function', 'result.loopScore (0-100)', STATUS.OK],
  ['frameworkTotal', 'function', 'result.frameworkTotal', STATUS.BROKEN],
  ['executionTotal', 'function', 'result.executionTotal', STATUS.BROKEN],
  ['evidenceTotal', 'function', 'result.evidenceTotal', STATUS.BROKEN],
  ['executionGap', 'function', 'result.executionGap', STATUS.OK],
  ['evidenceGap', 'function', 'result.evidenceGap', STATUS.OK],
  ...CAPABILITIES.flatMap((name, i) =>
    ['F', 'E', 'V'].map((stage) => [
      `c${i + 1}_${stage}`,
      'client',
      `${name} — ${{ F: 'Framework', E: 'Execution', V: 'Evidence' }[stage]} (0, 1 or 2)`,
      STATUS.OK,
    ])
  ),
  ['stalls', 'function', 'result.stalls joined — F/E/V/C per capability', STATUS.OK],
  ['widestGaps', 'function', 'result.widestGaps joined', STATUS.BROKEN],
  ['aiMultiplier', 'client', 'AI multiplier level, 1-5', STATUS.OK],
  ['stage', 'client', 'Venture stage — map only', 'map only; blank on unlock'],
  ['stageBand', 'client', "'pre' or 'trading' — map only", 'map only; blank on unlock'],
  ['sector', 'client', 'Selected sector', STATUS.OK],
  ['programmeStatus', 'client', 'Incubator / accelerator status', STATUS.OK],
  ['route', 'Apps Script', 'routeFor_() — Focused Session / Mid-Tier / Full Journey', STATUS.OK],
  ['name', 'client', 'Unlock form', 'unlock only'],
  ['email', 'client', 'Unlock form', 'unlock only'],
  ['business', 'client', 'Unlock form', 'unlock only'],
  ['wantsCall', 'client', "Unlock form — 'Yes' or 'No'", 'unlock only'],
  ['reportSource', 'Apps Script', "defaults to 'template'", 'unlock only'],
  ['reportText', 'function', 'Report body sent to the respondent', 'unlock only'],
  ['unlockedAt', 'Apps Script', 'new Date() at unlock', 'unlock only'],
  ['userAgent', 'client', 'body.userAgent', STATUS.BROKEN],
  ['referrer', 'client', 'body.referrer', STATUS.BROKEN],
];

const KNOWN_GAPS = [
  ['#', 'Column(s)', 'Problem', 'Fix'],
  [
    1,
    'frameworkTotal, executionTotal, evidenceTotal',
    'The Apps Script reads result.frameworkTotal / .executionTotal / .evidenceTotal, but netlify/functions/execution-gap.ts sends these totals as result.F / result.E / result.V. The names never match, so all three columns record 0 on every submission.',
    'Either rename the keys in compute() to frameworkTotal/executionTotal/evidenceTotal, or read result.F/.E/.V in map_().',
  ],
  [
    2,
    'widestGaps',
    'The Apps Script reads result.widestGaps. The Netlify function never computes or sends that field, so the column is always blank.',
    'Compute the two widest gaps in the function (the client already derives them for display) and include them in result.',
  ],
  [
    3,
    'userAgent, referrer',
    'The Apps Script reads body.userAgent and body.referrer. Neither the client nor the function ever sends them, so both columns are always blank.',
    'Populate them in the client POST, or drop the two columns.',
  ],
  [
    4,
    'route (on unlock)',
    'HEADERS is 45 columns, but unlock_() writes 10 values starting at column 37 (37-46). The 10th value, route, lands in column 46 — one past the last header — instead of the route column at 36.',
    'Write 9 values (37-45) and set column 36 separately, or extend HEADERS.',
  ],
  [
    5,
    'stage, stageBand (on unlock)',
    "The client's unlock POST (ExecutionGap.tsx) omits stage and stageBand, which the map POST does send. On an unlock that creates a fresh row, both columns are blank, and routeFor_() misreads the band.",
    'Include stage and stageBand in the unlock POST body.',
  ],
  [
    6,
    'archetype in the respondent email',
    'sendRespondentEmail_() and sendNotification_() read body.archetype, but the function nests it at result.archetype. Every report email falls back to the generic "Your Loop Map" heading.',
    'Read body.result.archetype in both mail helpers.',
  ],
  [
    7,
    'Silent failure (whole sheet)',
    'Apps Script returns HTTP 200 even when doPost() catches an error, putting the real status in the JSON body as {ok:false}. The Netlify function only checks upstream.ok (the HTTP status), so a failed sheet write still returns success to the browser. This is why the live endpoint returns 200 while nothing is captured.',
    'Parse the Apps Script JSON response in forward() and throw when body.ok is false.',
  ],
];

// ── Build workbook ───────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// Sheet 1: Responses — the live capture target. Header row only.
const responses = XLSX.utils.aoa_to_sheet([HEADERS]);
responses['!cols'] = HEADERS.map((h) => ({ wch: Math.max(12, Math.min(h.length + 4, 40)) }));
responses['!freeze'] = { xSplit: 0, ySplit: 1 };
XLSX.utils.book_append_sheet(wb, responses, 'Responses');

// Sheet 2: Field map
const fieldMap = XLSX.utils.aoa_to_sheet([
  ['Column', 'Filled by', 'Meaning', 'Status'],
  ...FIELD_MAP,
]);
fieldMap['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 62 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, fieldMap, 'Field map');

// Sheet 3: Known gaps
const gaps = XLSX.utils.aoa_to_sheet(KNOWN_GAPS);
gaps['!cols'] = [{ wch: 5 }, { wch: 38 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, gaps, 'Known gaps');

// Sheet 4: Setup notes
const setup = XLSX.utils.aoa_to_sheet([
  ['Execution Gap — response sheet setup'],
  [],
  ['1', 'The capture tab MUST be named exactly "Responses" (SHEET_NAME in the Apps Script).'],
  ['', 'getSheetByName returns null for any other name, doPost throws, and the write is lost.'],
  ['2', 'Keep row 1 exactly as shipped. ensureHeaders_() rewrites row 1 on every POST when it'],
  ['', 'does not match, so renaming or reordering a column silently shifts every later write.'],
  ['3', 'New responses are inserted at row 2 (insertRowBefore), so the newest row is always on top.'],
  ['4', 'Set SHARED_SECRET in the Apps Script under Project Settings > Script Properties.'],
  ['', 'It must match EXECUTION_GAP_SHARED_SECRET in the Netlify environment.'],
  ['5', 'Never add a "secret" column. The shared secret is sent in the POST body and must not be stored.'],
  ['6', 'Deploy the Apps Script as a Web App with Execute as: Me, Access: Anyone.'],
  [],
  ['Scoring', 'Each of the 6 capabilities is scored 0, 1 or 2 on each of Framework, Execution, Evidence.'],
  ['', 'Per-stage total is therefore 0-12, and loopScore = round(total / 36 * 100).'],
  [],
  ['Generated by', 'scripts/build-execution-gap-template.mjs'],
]);
setup['!cols'] = [{ wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, setup, 'Setup');

const out = 'deliverables/execution-gap-response-template.xlsx';
writeFileSync(out, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
console.log(`Wrote ${out}`);
console.log(`  Responses : ${HEADERS.length} columns`);
console.log(`  Field map : ${FIELD_MAP.length} rows`);
console.log(`  Known gaps: ${KNOWN_GAPS.length - 1} issues`);
