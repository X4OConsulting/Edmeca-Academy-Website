/**
 * exportReport.ts
 * Utilities for exporting the Financial Health Report as PDF (print) or Word (.docx).
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

// ── Inline bold/italic parser → TextRun[] ──────────────────────────────────
function parseInline(raw: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = raw.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else {
      runs.push(new TextRun({ text: part }));
    }
  }
  return runs.length ? runs : [new TextRun({ text: raw })];
}

// ── Table row → cells ──────────────────────────────────────────────────────
function splitTableRow(line: string): string[] {
  return line.split("|").slice(1, -1).map(c => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function buildDocxTable(tableLines: string[]): Table {
  const dataLines = tableLines.filter(l => !isSeparatorRow(l));
  const rows = dataLines.map((line, rowIdx) => {
    const cells = splitTableRow(line);
    return new TableRow({
      tableHeader: rowIdx === 0,
      children: cells.map(cell =>
        new TableCell({
          shading: rowIdx === 0 ? { fill: "1f3a6e" } : undefined,
          children: [
            new Paragraph({
              children: rowIdx === 0
                ? [new TextRun({ text: cell, bold: true, color: "FFFFFF" })]
                : parseInline(cell),
            }),
          ],
        })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// ── Markdown → docx element list ──────────────────────────────────────────
function markdownToDocxElements(markdown: string): Array<Paragraph | Table> {
  const elements: Array<Paragraph | Table> = [];
  const lines = markdown.split("\n");
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      elements.push(buildDocxTable(tableBuffer));
      tableBuffer = [];
    }
  };

  for (const line of lines) {
    // Table row — buffer until non-table line
    if (line.trimStart().startsWith("|")) {
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    // Empty / horizontal rule
    if (!line.trim() || /^---+$/.test(line.trim())) {
      elements.push(new Paragraph({ text: "" }));
      continue;
    }
    // H1
    if (line.startsWith("# ")) {
      elements.push(new Paragraph({ children: parseInline(line.slice(2)), heading: HeadingLevel.HEADING_1 }));
      continue;
    }
    // H2
    if (line.startsWith("## ")) {
      elements.push(new Paragraph({ children: parseInline(line.slice(3)), heading: HeadingLevel.HEADING_2 }));
      continue;
    }
    // H3
    if (line.startsWith("### ")) {
      elements.push(new Paragraph({ children: parseInline(line.slice(4)), heading: HeadingLevel.HEADING_3 }));
      continue;
    }
    // Bullet
    if (/^[-*] /.test(line)) {
      elements.push(new Paragraph({ children: parseInline(line.slice(2)), bullet: { level: 0 } }));
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const text = line.replace(/^\d+\. /, "");
      elements.push(new Paragraph({ children: parseInline(text), numbering: { reference: "default-numbering", level: 0 } }));
      continue;
    }
    // Regular paragraph
    elements.push(new Paragraph({ children: parseInline(line) }));
  }
  flushTable();

  return elements;
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC: Export to Word (.docx)
// ══════════════════════════════════════════════════════════════════════════════
export async function exportToWord(markdown: string, companyName: string): Promise<void> {
  const date = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  const safeName = (companyName || "Business").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 36, bold: true, color: "1f3a6e" },
          paragraph: { spacing: { before: 400, after: 160 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 28, bold: true, color: "1f3a6e" },
          paragraph: { spacing: { before: 320, after: 120 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 24, bold: true, color: "2d5986" },
          paragraph: { spacing: { before: 240, after: 80 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        },
        children: [
          // ── Cover ──────────────────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: "Financial Health Report", bold: true, size: 52, color: "1f3a6e" })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: companyName || "Business", size: 32, color: "444444" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generated: ${date} · Powered by EdMeCa Academy`, size: 20, color: "999999" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1f3a6e", space: 1 } },
            text: "",
            spacing: { after: 400 },
          }),

          // ── Report body ────────────────────────────────────────────────────
          ...markdownToDocxElements(markdown),

          // ── Footer ─────────────────────────────────────────────────────────
          new Paragraph({ text: "", spacing: { before: 480 } }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd", space: 1 } },
            children: [new TextRun({ text: `EdMeCa Academy  ·  Financial Analysis Tool  ·  ${date}`, size: 18, color: "bbbbbb" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeName}_Financial_Report.docx`);
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC: Export to PDF (print window)
// ══════════════════════════════════════════════════════════════════════════════
export function exportToPDF(markdown: string, companyName: string): void {
  const date = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  const htmlBody = markdownToHTML(markdown);

  // Build the full HTML document as a string.
  // All user-supplied values (companyName, date) are passed through escapeHtml()
  // before injection. htmlBody is produced by markdownToHTML() which runs every
  // line through inlineToHTML() — escaping &, <, > before wrapping in tags.
  // The string is rendered via a Blob URL (see below) rather than the deprecated
  // document-write API, preventing DOM-injection XSS vectors.
  const safeCompany = escapeHtml(companyName || "Business");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeCompany} \u2014 Financial Health Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body  { font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.55; padding: 2cm; }
    .cover { text-align: center; margin-bottom: 2.2em; padding-bottom: 1.4em; border-bottom: 3px solid #1f3a6e; }
    .cover-title  { font-size: 24pt; font-weight: 700; color: #1f3a6e; margin: 0 0 0.2em; }
    .cover-company { font-size: 14pt; color: #444; margin: 0 0 0.15em; }
    .cover-date   { font-size: 9.5pt; color: #999; }
    h1 { font-size: 18pt; color: #1f3a6e; margin: 1.6em 0 0.5em; }
    h2 { font-size: 13.5pt; color: #1f3a6e; margin: 1.5em 0 0.4em; border-bottom: 1.5px solid #cdd5e0; padding-bottom: 3px; }
    h3 { font-size: 11.5pt; color: #2d5986; margin: 1.1em 0 0.25em; }
    p  { margin: 0 0 0.65em; }
    ul { padding-left: 1.5em; margin: 0 0 0.8em; }
    ol { padding-left: 1.5em; margin: 0 0 0.8em; }
    li { margin-bottom: 0.2em; }
    strong { font-weight: 600; }
    hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10pt; }
    thead th { background: #1f3a6e; color: #fff; padding: 6px 11px; text-align: left; font-weight: 600; }
    tbody td { padding: 5px 11px; border-bottom: 1px solid #e8eaed; }
    tbody tr:nth-child(even) td { background: #f7f8fa; }
    .footer { margin-top: 2.5em; text-align: center; font-size: 9pt; color: #bbb; border-top: 1px solid #eee; padding-top: 0.7em; }
    @page { margin: 2cm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-title">Financial Health Report</div>
    <div class="cover-company">${safeCompany}</div>
    <div class="cover-date">Generated: ${escapeHtml(date)}</div>
  </div>
  ${htmlBody}
  <div class="footer">EdMeCa Academy &nbsp;\u00b7&nbsp; Financial Analysis Tool &nbsp;\u00b7&nbsp; ${escapeHtml(date)}</div>
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;

  // Create a Blob URL and navigate a new window to it — the modern, safe alternative
  // to the deprecated DOM-write API. Blob URLs have a unique origin, preventing
  // cross-origin access from other pages.
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const printWin = window.open(blobUrl, "_blank", "width=900,height=700");
  if (!printWin) {
    URL.revokeObjectURL(blobUrl);
    alert("Pop-up blocked. Please allow pop-ups for this page and try again.");
    return;
  }

  // Revoke the object URL after the window has loaded to free memory.
  // afterprint fires after the print dialog closes; fallback via load event.
  printWin.addEventListener("load", () => {
    printWin.addEventListener("afterprint", () => URL.revokeObjectURL(blobUrl));
    // Fallback: revoke after 5 min in case afterprint never fires (e.g. cancelled)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineToHTML(line: string): string {
  return line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHTML(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  const tableBuffer: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };

  const flushTable = () => {
    if (!tableBuffer.length) return;
    const dataRows = tableBuffer.filter(l => !isSeparatorRow(l));
    const [headerRow, ...bodyRows] = dataRows;
    const headers = splitTableRow(headerRow).map(h => `<th>${inlineToHTML(h)}</th>`).join("");
    const rows = bodyRows.map(r => `<tr>${splitTableRow(r).map(c => `<td>${inlineToHTML(c)}</td>`).join("")}</tr>`).join("\n");
    out.push(`<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`);
    tableBuffer.length = 0;
  };

  for (const line of lines) {
    if (line.trimStart().startsWith("|")) {
      flushList();
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    if (/^[-*] /.test(line)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inlineToHTML(line.slice(2))}</li>`);
      continue;
    }
    flushList();

    if (!line.trim() || /^---+$/.test(line.trim())) { out.push("<hr>"); continue; }
    if (line.startsWith("# "))   { out.push(`<h1>${inlineToHTML(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## "))  { out.push(`<h2>${inlineToHTML(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("### ")) { out.push(`<h3>${inlineToHTML(line.slice(4))}</h3>`); continue; }
    out.push(`<p>${inlineToHTML(line)}</p>`);
  }
  flushList();
  flushTable();

  return out.join("\n");
}
