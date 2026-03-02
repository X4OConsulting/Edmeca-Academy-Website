import { useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, FileText, X, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UploadResult {
  fileName: string;
  fileType: "csv" | "xlsx" | "pdf";
  fileSize: number;   // bytes
  text: string;       // extracted text (empty string for PDFs — extracted server-side)
  fileData?: string;  // base64-encoded bytes (PDFs only)
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
        // PDF — read as base64, extraction happens server-side via pdf-parse
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        onUpload({ fileName: file.name, fileType, fileSize: file.size, text: "", fileData: base64 });
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
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{ext}</Badge>
            {isPdf && (
              <span className="text-xs text-muted-foreground">Text extracted server-side</span>
            )}
          </div>
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
