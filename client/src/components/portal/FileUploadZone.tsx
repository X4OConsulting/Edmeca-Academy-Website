import { useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Upload, FileText, X, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Point pdfjs at its bundled worker (Vite ?url import resolves correctly)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UploadResult {
  fileName: string;
  fileType: "csv" | "xlsx" | "pdf";
  fileSize: number;   // bytes
  text: string;       // extracted text for all types
}

interface FileUploadZoneProps {
  onUpload: (result: UploadResult) => void;
  onClear: () => void;
  currentFile: string | null;
  disabled?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = [".pdf", ".csv", ".xlsx", ".xls"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(name: string): "csv" | "xlsx" | "pdf" | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function FileUploadZone({ onUpload, onClear, currentFile, disabled }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setExtractError(null);

    // Validate size
    if (file.size > MAX_BYTES) {
      setExtractError(`File too large (${formatBytes(file.size)}). Maximum is 10 MB.`);
      return;
    }

    const fileType = fileTypeLabel(file.name);
    if (!fileType) {
      setExtractError("Unsupported file type. Please upload a PDF, CSV, XLSX, or XLS file.");
      return;
    }

    setExtracting(true);
    try {
      if (fileType === "csv") {
        // Read CSV as plain text
        const text = await file.text();
        onUpload({ fileName: file.name, fileType, fileSize: file.size, text });

      } else if (fileType === "xlsx") {
        // Parse Excel with xlsx library → convert to CSV text
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        // Combine all sheets
        const allText = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          return `=== Sheet: ${sheetName} ===\n${csv}`;
        }).join("\n\n");
        onUpload({ fileName: file.name, fileType, fileSize: file.size, text: allText });

      } else {
        // PDF — extract text client-side with pdfjs-dist.
        // Uses x/y transform coordinates to reconstruct table rows.
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pageTexts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          // Collect items with their positions.
          // transform = [a,b,c,d,x,y] — we need x (index 4) and y (index 5).
          const items = content.items
            .filter((item: any) => "str" in item && item.str.trim())
            .map((item: any) => ({
              text: item.str as string,
              x: item.transform[4] as number,
              y: item.transform[5] as number,
              width: item.width as number,
            }));

          if (items.length === 0) continue;

          // Group into rows by y coordinate (items within 3 units share a row).
          const Y_TOLERANCE = 3;
          const rows: typeof items[] = [];
          let currentRow: typeof items = [];
          let currentY: number | null = null;

          // Sort top-to-bottom (PDF y is bottom-up, so sort descending).
          items.sort((a, b) => b.y - a.y);

          for (const item of items) {
            if (currentY === null || Math.abs(item.y - currentY) > Y_TOLERANCE) {
              if (currentRow.length > 0) rows.push(currentRow);
              currentRow = [item];
              currentY = item.y;
            } else {
              currentRow.push(item);
            }
          }
          if (currentRow.length > 0) rows.push(currentRow);

          // Build each row as a string. Within a row, insert tabs between
          // items that are far apart (likely separate columns).
          const lineStrings = rows.map(row => {
            row.sort((a, b) => a.x - b.x);
            let line = "";
            for (let j = 0; j < row.length; j++) {
              if (j === 0) {
                line += row[j].text;
              } else {
                const gap = row[j].x - (row[j - 1].x + (row[j - 1].width || 0));
                // Large gap = column boundary → tab; small gap = same word → space
                line += gap > 10 ? "\t" : " ";
                line += row[j].text;
              }
            }
            return line;
          });

          pageTexts.push(lineStrings.join("\n"));
        }

        const fullText = pageTexts.join("\n\n");
        if (!fullText.trim()) {
          setExtractError("Could not extract text from this PDF. It may be a scanned image — please use a text-based PDF or paste the data manually.");
          return;
        }
        onUpload({ fileName: file.name, fileType, fileSize: file.size, text: fullText });
      }
    } catch (err: any) {
      setExtractError(`Failed to read file: ${err.message ?? "unknown error"}`);
    } finally {
      setExtracting(false);
    }
  }, [onUpload]);

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  // ── Uploaded state ───────────────────────────────────────────────────────────
    if (currentFile) {
    const ext = currentFile.split(".").pop()?.toUpperCase() ?? "FILE";
    const isPdf = ext === "PDF";
    return (
      <div className="border rounded-lg p-4 flex items-center gap-3 bg-muted/30">
        {isPdf
          ? <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
          : <FileSpreadsheet className="h-8 w-8 text-green-600 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentFile}</p>
          <Badge variant="secondary" className="text-xs mt-1">{ext}</Badge>
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon" onClick={onClear} className="flex-shrink-0 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // ── Drop zone ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        role="button"
        aria-label="Upload financial document"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? "border-[#1f3a6e] bg-[#1f3a6e]/5" : "border-muted-foreground/25 hover:border-[#1f3a6e]/50 hover:bg-muted/30"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${extracting ? "opacity-70 cursor-wait" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          className="hidden"
          onChange={onInputChange}
          disabled={disabled || extracting}
        />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        {extracting ? (
          <p className="text-sm text-muted-foreground">Reading file…</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag and drop your file here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, CSV, XLSX, XLS — max 10 MB
            </p>
          </>
        )}
      </div>

      {extractError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {extractError}
        </div>
      )}
    </div>
  );
}
