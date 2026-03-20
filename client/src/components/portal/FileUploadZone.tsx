import { useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Upload, FileText, X, AlertTriangle, FileSpreadsheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Point pdfjs at its bundled worker (Vite ?url import resolves correctly)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  // Multi-file mode
  multiple?: boolean;
  uploadedFiles?: UploadResult[];
  onUploadMultiple?: (results: UploadResult[]) => void;
  onClearFile?: (index: number) => void;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

async function extractText(file: File): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (${formatBytes(file.size)}). Maximum is 10 MB.`);
  }
  const fileType = fileTypeLabel(file.name);
  if (!fileType) {
    throw new Error("Unsupported file type. Please upload a PDF, CSV, XLSX, or XLS file.");
  }

  if (fileType === "csv") {
    const text = await file.text();
    return { fileName: file.name, fileType, fileSize: file.size, text };
  }

  if (fileType === "xlsx") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const allText = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `=== Sheet: ${sheetName} ===\n${csv}`;
    }).join("\n\n");
    return { fileName: file.name, fileType, fileSize: file.size, text: allText };
  }

  // PDF
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items
      .filter((item: any) => "str" in item && item.str.trim())
      .map((item: any) => ({
        text: item.str as string,
        x: item.transform[4] as number,
        y: item.transform[5] as number,
        width: item.width as number,
      }));

    if (items.length === 0) continue;

    const Y_TOLERANCE = 3;
    const rows: typeof items[] = [];
    let currentRow: typeof items = [];
    let currentY: number | null = null;

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

    const lineStrings = rows.map(row => {
      row.sort((a, b) => a.x - b.x);
      let line = "";
      for (let j = 0; j < row.length; j++) {
        if (j === 0) {
          line += row[j].text;
        } else {
          const gap = row[j].x - (row[j - 1].x + (row[j - 1].width || 0));
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
    throw new Error("Could not extract text from this PDF. It may be a scanned image â€” please use a text-based PDF or paste the data manually.");
  }
  return { fileName: file.name, fileType, fileSize: file.size, text: fullText };
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function FileUploadZone({
  onUpload, onClear, currentFile, disabled,
  multiple = false, uploadedFiles = [], onUploadMultiple, onClearFile,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setExtractError(null);
    setExtracting(true);
    const fileArray = Array.from(files);

    if (multiple && onUploadMultiple) {
      const results: UploadResult[] = [];
      for (const file of fileArray) {
        try {
          results.push(await extractText(file));
        } catch (err: any) {
          setExtractError(`${file.name}: ${err.message}`);
          setExtracting(false);
          return;
        }
      }
      onUploadMultiple(results);
    } else {
      const file = fileArray[0];
      try {
        const result = await extractText(file);
        onUpload(result);
      } catch (err: any) {
        setExtractError(err.message);
      }
    }
    setExtracting(false);
  }, [multiple, onUpload, onUploadMultiple]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
    e.target.value = "";
  };

  // â”€â”€ Multi-file mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (multiple) {
    return (
      <div className="space-y-3">
        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((f, i) => {
              const ext = f.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
              const isPdf = ext === "PDF";
              return (
                <div key={i} className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
                  {isPdf
                    ? <FileText className="h-6 w-6 text-red-500 flex-shrink-0" />
                    : <FileSpreadsheet className="h-6 w-6 text-green-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(f.fileSize)}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{ext}</Badge>
                  {!disabled && onClearFile && (
                    <Button variant="ghost" size="icon" onClick={() => onClearFile(i)} className="h-7 w-7">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Drop zone â€” always visible in multi mode */}
        <div
          role="button"
          aria-label="Upload financial documents"
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${extracting ? "opacity-70 cursor-wait" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={onInputChange}
            disabled={disabled || extracting}
          />
          {extracting ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin">â³</span> Reading filesâ€¦
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {uploadedFiles.length > 0
                ? <><Plus className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Add more files</p></>
                : <><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium">Drag &amp; drop files here, or click to browse</p></>}
              <p className="text-xs text-muted-foreground">PDF, CSV, XLSX, XLS â€” max 10 MB each Â· Multiple files supported</p>
            </div>
          )}
        </div>

        {extractError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{extractError}
          </div>
        )}
      </div>
    );
  }

  // â”€â”€ Single-file mode (backward compat) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <p className="text-sm text-muted-foreground">Reading fileâ€¦</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag and drop your file here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, CSV, XLSX, XLS â€” max 10 MB
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
