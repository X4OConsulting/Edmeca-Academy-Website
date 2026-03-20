import { useState, useEffect } from "react";
import { Link } from "wouter";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/lib/services";
import { supabase } from "@/lib/supabase";
import { FileUploadZone, type UploadResult } from "@/components/portal/FileUploadZone";
import {
  ArrowLeft, TrendingUp, ClipboardList, Upload, Loader2, CheckCircle2,
  AlertTriangle, FileText, Clock, RefreshCw, Download, FileDown,
  Zap, Brain, ArrowRight, ChevronRight,
} from "lucide-react";
import { exportToWord, exportToPDF } from "@/lib/exportReport";
import { cn } from "@/lib/utils";
import type { StructuredAnalysis } from "../../../../api/analyze-financials";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  success: boolean;
  report: string;
  structured?: StructuredAnalysis;
  meta: {
    model_categorisation: string;
    model_analysis: string;
    company: string;
    analysis_mode?: "quick" | "deep";
    sector?: string;
    stage?: string;
    inputType?: string;
  };
}

type WizardStep = "setup" | "input" | "processing" | "dashboard";
type ProcessingStep = "idle" | "categorising" | "analysing" | "done";

const SECTORS = [
  "Agriculture", "Construction", "Education", "Financial Services",
  "Healthcare", "Manufacturing", "Retail", "Services", "Technology", "Other",
];

const STAGES = [
  "Startup (0–2 years)", "Early Growth (2–5 years)",
  "Established (5+ years)", "Scale-up",
];

const STEP_LABELS = ["Setup", "Upload Data", "Analysing", "Dashboard"];

// ── Leadership quotes ─────────────────────────────────────────────────────────
const QUOTES = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You must gain control over your money or the lack of it will forever control you.", author: "Dave Ramsey" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "It's not about how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
];

// ── Markdown renderer ─────────────────────────────────────────────────────────
const mdComponents: Components = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-primary mt-6 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-primary mt-5 mb-2 first:mt-0 flex items-center gap-2 border-b border-primary/10 pb-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 space-y-1 list-decimal pl-5">{children}</ol>,
  li: ({ children }) => (
    <li className="text-sm leading-relaxed flex gap-2">
      <span className="text-primary font-bold flex-shrink-0 mt-px">•</span>
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[400px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary text-primary-foreground">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap">{children}</th>,
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-muted/40 transition-colors">{children}</tr>,
  td: ({ children }) => <td className="px-4 py-2 text-xs text-foreground">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-3 text-muted-foreground italic bg-muted/20 rounded-r-md py-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-5" />,
  code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
};

// ── Upload history record ──────────────────────────────────────────────────────
interface UploadRecord {
  id: string;
  file_name: string;
  file_type: string;
  company_name: string | null;
  analysed_at: string;
  report_text: string | null;
  model_categorisation: string | null;
  model_analysis: string | null;
}

async function fetchUploadHistory(): Promise<UploadRecord[]> {
  const { data, error } = await supabase
    .from("financial_uploads")
    .select("id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis")
    .order("analysed_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

async function saveUploadRecord(record: {
  file_name: string;
  file_type: string;
  company_name: string | null;
  report_text: string | null;
  model_categorisation: string | null;
  model_analysis: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("financial_uploads").insert({ user_id: user.id, ...record });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (score: number) => {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#00A99D";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
};

const formatCurrency = (value: number) => {
  if (!value) return "R0";
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R${(value / 1_000).toFixed(0)}K`;
  return `R${value}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** 4-step wizard progress bar */
function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-background border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center overflow-x-auto">
          {STEP_LABELS.map((label, i) => {
            const stepN = i + 1;
            const isActive = currentStep === stepN;
            const isDone = currentStep > stepN;
            return (
              <div key={stepN} className="flex items-center flex-shrink-0">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-[3px] transition-all select-none whitespace-nowrap",
                  isActive ? "text-primary border-primary" : isDone ? "text-emerald-600 border-transparent" : "text-muted-foreground border-transparent",
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    isDone ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}>
                    {isDone ? "✓" : stepN}
                  </div>
                  {label}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Circular health score gauge (conic-gradient) */
function HealthGauge({ score, grade }: { score: number; grade: string }) {
  const color = scoreColor(score);
  const conicGradient = `conic-gradient(${color} 0% ${score}%, hsl(var(--muted)) ${score}% 100%)`;
  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Overall Health Score</p>
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center mb-3"
        style={{ background: conicGradient }}
        aria-label={`Health score: ${score} out of 100`}
        role="img"
      >
        <div className="w-20 h-20 bg-card rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-primary leading-none">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="font-bold text-base" style={{ color }}>{grade}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {score >= 80 ? "Strong financial health." :
         score >= 60 ? "Viable but needs attention in some areas." :
         score >= 40 ? "Significant pressures require intervention." :
         "Critical — immediate support needed."}
      </p>
    </div>
  );
}

/** Individual KPI metric card */
function KPICard({ label, value, change, positive }: {
  label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className={cn("text-xs font-semibold mt-1", positive ? "text-emerald-600" : "text-destructive")}>{change}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FinancialAnalysisTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Wizard navigation
  const [wizardStep, setWizardStep] = useState<WizardStep>("setup");
  const wizardStepN = { setup: 1, input: 2, processing: 3, dashboard: 4 }[wizardStep];

  // Setup fields (3.15.1, 3.15.2)
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [inputType, setInputType] = useState<"management" | "bank">("bank");
  const [analysisMode, setAnalysisMode] = useState<"quick" | "deep">("deep");
  const [companyNameOverride, setCompanyNameOverride] = useState("");

  // Input step
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [statements, setStatements] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);   // multi-file (3.15.3)
  const [singleUpload, setSingleUpload] = useState<UploadResult | null>(null); // legacy single

  // Processing state
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Result
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Quote rotation while processing
  useEffect(() => {
    const isProcessing = wizardStep === "processing";
    if (!isProcessing) { setCurrentQuote(null); return; }
    let idx = Math.floor(Math.random() * QUOTES.length);
    const show = () => { setCurrentQuote(QUOTES[idx % QUOTES.length]); idx++; };
    show();
    const id = setInterval(show, 7000);
    return () => clearInterval(id);
  }, [wizardStep]);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileService.getUserProfile });
  const companyName = companyNameOverride || profile?.businessName || "";

  const { data: uploadHistory = [] } = useQuery({
    queryKey: ["financial-uploads"],
    queryFn: fetchUploadHistory,
  });

  const saveMutation = useMutation({
    mutationFn: saveUploadRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financial-uploads"] }),
  });

  // Multi-file combined text
  const combinedUploadText = uploadedFiles.map(f => `=== ${f.fileName} ===\n${f.text}`).join("\n\n");

  const handleAnalyse = async () => {
    const isPaste = inputMode === "paste";
    const isUpload = inputMode === "upload";
    const hasData = isPaste ? !!statements.trim() : (uploadedFiles.length > 0 || !!singleUpload);
    if (!hasData) {
      toast({
        title: isPaste ? "No data provided" : "No file selected",
        description: isPaste ? "Please paste your financial statements." : "Please upload at least one file.",
        variant: "destructive",
      });
      return;
    }

    setWizardStep("processing");
    setError(null);
    setResult(null);

    if (analysisMode === "deep") {
      setProcessingStep("categorising");
    } else {
      setProcessingStep("analysing");
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (analysisMode === "deep") {
        await new Promise(r => setTimeout(r, 600));
        setProcessingStep("analysing");
      }

      const aiBase = (import.meta.env.VITE_AI_API_URL ?? "").replace(/\/$/, "");
      const statementText = isPaste
        ? statements.trim()
        : (uploadedFiles.length > 0 ? combinedUploadText : singleUpload!.text);

      const response = await fetch(`${aiBase}/api/analyze-financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          statements: statementText,
          companyName: companyName || "the business",
          analysisMode,
          sector: sector || "General",
          stage: stage || "Established",
          yearEnd: yearEnd || String(new Date().getFullYear()),
          inputType,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setProcessingStep("done");
      setWizardStep("dashboard");

      // Save to history
      const primaryFile = uploadedFiles[0] ?? singleUpload;
      saveMutation.mutate({
        file_name: isPaste ? "(pasted text)" : (primaryFile?.fileName ?? "(pasted text)"),
        file_type: isPaste ? "paste" : (primaryFile?.fileType ?? "paste"),
        company_name: companyName || null,
        report_text: data.report,
        model_categorisation: data.meta.model_categorisation,
        model_analysis: data.meta.model_analysis,
      });

      toast({ title: "Analysis complete!", description: "Your financial report is ready." });
    } catch (err: any) {
      setError(err.message ?? "Analysis failed.");
      setWizardStep("input");
      setProcessingStep("idle");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setResult(null); setError(null); setProcessingStep("idle");
    setStatements(""); setUploadedFiles([]); setSingleUpload(null);
    setWizardStep("setup");
  };

  const handleLoadReport = (rec: UploadRecord) => {
    if (!rec.report_text) {
      toast({ title: "No saved report", description: "This analysis was saved before reports were stored. Re-upload to re-analyse.", variant: "destructive" });
      return;
    }
    setResult({
      success: true, report: rec.report_text,
      meta: { company: rec.company_name ?? "Business", model_categorisation: rec.model_categorisation ?? "Claude Haiku", model_analysis: rec.model_analysis ?? "Claude Sonnet" },
    });
    setWizardStep("dashboard");
  };

  const handleExportPDF = () => { if (result) exportToPDF(result.report, result.meta.company); };
  const handleExportWord = async () => { if (result) await exportToWord(result.report, result.meta.company); };

  // ── Structured dashboard data ─────────────────────────────────────────────
  const s = result?.structured;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">Financial Analysis</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Claude Haiku + Sonnet</Badge>
        </div>
      </header>

      {/* ── Step Bar (3.15.4) ────────────────────────────────────────────────── */}
      <StepBar currentStep={wizardStepN} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1: SETUP — business context + analysis configuration
        ══════════════════════════════════════════════════════════════════════ */}
        {wizardStep === "setup" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business Context &amp; Analysis Setup</CardTitle>
              <p className="text-sm text-muted-foreground">Tell us about your business so we can tailor the analysis.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Company / Business Name</label>
                <Input
                  placeholder={profile?.businessName ?? "e.g. EdMeCa Academy"}
                  value={companyNameOverride}
                  onChange={e => setCompanyNameOverride(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Business context fields (3.15.1) */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Sector</label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business Stage</label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Financial Year End</label>
                  <Input
                    placeholder="e.g. 28 February 2025"
                    value={yearEnd}
                    onChange={e => setYearEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Input type selector (3.15.2) */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Document Type</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => setInputType("bank")}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      inputType === "bank" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <p className={cn("text-sm font-semibold", inputType === "bank" ? "text-primary" : "text-foreground")}>Bank Statements</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Transaction history from your bank</p>
                  </button>
                  <button
                    onClick={() => setInputType("management")}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      inputType === "management" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <p className={cn("text-sm font-semibold", inputType === "management" ? "text-primary" : "text-foreground")}>Management Accounts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">P&L, balance sheet, cash flow</p>
                  </button>
                </div>
              </div>

              {/* Analysis mode */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Analysis Mode</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => setAnalysisMode("quick")}
                    data-testid="button-mode-quick"
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                      analysisMode === "quick" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <Zap className={cn("h-5 w-5 mt-0.5 flex-shrink-0", analysisMode === "quick" ? "text-amber-500" : "text-muted-foreground")} />
                    <div>
                      <p className={cn("text-sm font-semibold", analysisMode === "quick" ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>Quick Snapshot</p>
                      <p className="text-xs text-muted-foreground mt-0.5">4-section · ~5s · Haiku</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setAnalysisMode("deep")}
                    data-testid="button-mode-deep"
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                      analysisMode === "deep" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <Brain className={cn("h-5 w-5 mt-0.5 flex-shrink-0", analysisMode === "deep" ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className={cn("text-sm font-semibold", analysisMode === "deep" ? "text-primary" : "text-foreground")}>Deep Analysis</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Full dashboard · ~45s · Sonnet</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button onClick={() => setWizardStep("input")} className="gap-2">
                Next: Upload Data <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2: INPUT — multi-file upload or paste
        ══════════════════════════════════════════════════════════════════════ */}
        {wizardStep === "input" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload Financial Data</CardTitle>
              <p className="text-sm text-muted-foreground">
                {inputType === "management" ? "Management accounts:" : "Bank statements:"} paste or upload files.
              </p>
              <div className="flex gap-1 mt-2 p-1 bg-muted rounded-lg w-fit">
                <button onClick={() => setInputMode("paste")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    inputMode === "paste" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <ClipboardList className="h-3.5 w-3.5" />Paste Text
                </button>
                <button onClick={() => setInputMode("upload")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    inputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Upload className="h-3.5 w-3.5" />Upload Files
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputMode === "paste" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Financial Data</label>
                  <Textarea
                    placeholder={"Paste your bank statement, management accounts, or CSV export here.\n\nExample:\nDate, Description, Amount\n2026-01-01, Client Invoice #001, 15000\n2026-01-03, Office Rent, -8500\n..."}
                    value={statements}
                    onChange={e => setStatements(e.target.value)}
                    rows={14} className="font-mono text-sm resize-y" />
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV, plain text, or copied bank rows. Max ~12 000 characters.</p>
                </div>
              )}

              {inputMode === "upload" && (
                <div className="space-y-3">
                  {/* Multi-file drop zone (3.15.3) */}
                  <FileUploadZone
                    multiple
                    uploadedFiles={uploadedFiles}
                    onUpload={r => setSingleUpload(r)}
                    onClear={() => setSingleUpload(null)}
                    currentFile={singleUpload?.fileName ?? null}
                    onUploadMultiple={results => setUploadedFiles(prev => [...prev, ...results])}
                    onClearFile={idx => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Combined preview ({uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}):</p>
                      <pre className="text-xs font-mono overflow-auto max-h-28 whitespace-pre-wrap">
                        {combinedUploadText.slice(0, 500)}{combinedUploadText.length > 500 ? "\n…" : ""}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setWizardStep("setup")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <Button
                  onClick={handleAnalyse}
                  data-testid="button-analyse"
                  disabled={inputMode === "paste" ? !statements.trim() : (uploadedFiles.length === 0 && !singleUpload)}
                  className={cn("gap-2", analysisMode === "quick" ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90")}
                >
                  {analysisMode === "quick"
                    ? <><Zap className="h-4 w-4" />Quick Snapshot</>
                    : <><Brain className="h-4 w-4" />Deep Analysis</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3: PROCESSING — loading states with quote rotation
        ══════════════════════════════════════════════════════════════════════ */}
        {wizardStep === "processing" && (
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="max-w-lg mx-auto space-y-8">
                <div className="flex flex-col gap-3">
                  {analysisMode === "deep" && (
                    <div className={cn("flex items-center gap-3 text-sm", processingStep === "categorising" ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {processingStep === "categorising" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      Step 1 — Categorising transactions
                      <Badge variant="outline" className="text-xs ml-auto">Claude Haiku</Badge>
                    </div>
                  )}
                  <div className={cn("flex items-center gap-3 text-sm", processingStep === "analysing" ? "text-foreground font-medium" : "text-muted-foreground/40")}>
                    {processingStep === "analysing" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
                    {analysisMode === "quick" ? "Generating quick snapshot" : "Step 2 — Generating structured dashboard"}
                    <Badge variant="outline" className="text-xs ml-auto">
                      {analysisMode === "quick" ? "Claude Haiku" : "Claude Sonnet"}
                    </Badge>
                  </div>
                </div>

                {currentQuote && (
                  <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-transparent p-5 text-center space-y-2">
                    <p className="text-sm text-foreground/80 italic leading-relaxed">&ldquo;{currentQuote.text}&rdquo;</p>
                    <p className="text-xs text-muted-foreground font-medium">— {currentQuote.author}</p>
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {analysisMode === "quick" ? "This may take 5–10 seconds…" : "This may take 30–60 seconds…"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 4: DASHBOARD — structured results
        ══════════════════════════════════════════════════════════════════════ */}
        {wizardStep === "dashboard" && result && (
          <>
            {/* Header row */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-lg text-primary">{result.meta.company} — Financial Health Report</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {s?.period ?? "Analysis complete"} · Analysed {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {result.meta.analysis_mode === "quick"
                  ? <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100"><Zap className="h-3 w-3 mr-1" />Quick Snapshot</Badge>
                  : <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"><Brain className="h-3 w-3 mr-1" />Deep Analysis</Badge>}
                <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-3.5 w-3.5 mr-1.5" />Export PDF</Button>
                <Button variant="outline" size="sm" onClick={handleExportWord}><FileDown className="h-3.5 w-3.5 mr-1.5" />Export Word</Button>
                <Button variant="outline" size="sm" onClick={handleReset}>New Analysis</Button>
              </div>
            </div>

            {/* ── Health summary banner */}
            {s?.healthSummary && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3 items-start text-sm text-primary">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>{s.healthSummary}</span>
              </div>
            )}

            {/* ── Deep mode: structured dashboard (3.15.6, 3.15.7, 3.15.8) ──────── */}
            {s && result.meta.analysis_mode === "deep" && (
              <>
                {/* Row 1: Health gauge + KPI grid (3.15.6) */}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
                  {/* Health gauge */}
                  <Card>
                    <CardContent className="p-0">
                      <HealthGauge score={s.healthScore} grade={s.healthGrade} />
                    </CardContent>
                  </Card>

                  {/* KPI cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <KPICard label="Annual Revenue" value={s.kpis.revenue} change={s.kpis.revenueChange} positive={s.kpis.revenueChangePositive} />
                    <KPICard label="Gross Profit Margin" value={s.kpis.grossMargin} change={s.kpis.grossMarginVsSector} positive={s.kpis.grossMarginPositive} />
                    <KPICard label="Net Profit Margin" value={s.kpis.netMargin} change={s.kpis.netMarginVsSector} positive={s.kpis.netMarginPositive} />
                    <KPICard label="Current Ratio" value={s.kpis.currentRatio} change={s.kpis.currentRatioNote} positive={s.kpis.currentRatioPositive} />
                    <KPICard label="Cash Runway" value={s.kpis.cashRunway} change={s.kpis.cashRunwayNote} positive={s.kpis.cashRunwayPositive} />
                    <KPICard label="Debt-to-Equity" value={s.kpis.debtToEquity} change={s.kpis.debtToEquityNote} positive={s.kpis.debtToEquityPositive} />
                  </div>
                </div>

                {/* Row 2: Revenue chart + Recommendations (3.15.7, 3.15.8) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Monthly Revenue vs Expenses bar chart */}
                  {s.monthlyData?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-primary">📊 Monthly Revenue vs Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={s.monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={58} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="revenue" name="Revenue" fill="#93C5FD" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations panel (3.15.8) */}
                  {s.recommendations?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-primary">⚡ Key Findings &amp; Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {s.recommendations.map((rec, i) => {
                          const styles = {
                            high:   { bg: "bg-red-50 dark:bg-red-950/30",    dot: "bg-red-500",    title: "text-red-700 dark:text-red-400",    icon: "🔴" },
                            medium: { bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-amber-400", title: "text-amber-700 dark:text-amber-400", icon: "🟡" },
                            low:    { bg: "bg-green-50 dark:bg-green-950/30", dot: "bg-green-500",  title: "text-green-700 dark:text-green-400", icon: "🟢" },
                          }[rec.priority] ?? { bg: "bg-muted", dot: "bg-muted-foreground", title: "text-foreground", icon: "⚪" };
                          return (
                            <div key={i} className={cn("flex gap-3 p-3 rounded-lg", styles.bg)}>
                              <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", styles.dot)} />
                              <div>
                                <p className={cn("text-xs font-bold mb-0.5", styles.title)}>
                                  {styles.icon} {rec.priority === "high" ? "Critical" : rec.priority === "medium" ? "Attention" : "Positive"} — {rec.title}
                                </p>
                                <p className="text-xs text-foreground/80 leading-relaxed">{rec.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Row 3: Accelerator support areas (3.15.8) */}
                {s.supportAreas?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-primary">🎯 Accelerator Support Areas</CardTitle>
                      <p className="text-xs text-muted-foreground">EdMeCa programmes that can help address your key challenges</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {s.supportAreas.map((area, i) => {
                          const lvlStyle = {
                            urgent:      "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200",
                            recommended: "bg-primary/10 text-primary border-primary/20",
                            optional:    "bg-muted text-muted-foreground border-border",
                          }[area.level] ?? "bg-muted text-muted-foreground border-border";
                          return (
                            <span key={i} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium", lvlStyle)}>
                              <span>{area.icon}</span>{area.label}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Row 4: Strengths & Risks (3.15.8) */}
                {(s.keyStrengths?.length > 0 || s.keyRisks?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {s.keyStrengths?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-emerald-600">✅ Key Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {s.keyStrengths.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-emerald-500 font-bold flex-shrink-0 mt-px">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {s.keyRisks?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-destructive">⚠️ Risk Flags</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {s.keyRisks.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-destructive font-bold flex-shrink-0 mt-px">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Quick mode / fallback: markdown report ─────────────────────── */}
            {(!s || result.meta.analysis_mode !== "deep") && (
              <Card>
                <CardContent className="pt-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {result.report}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleReset}>Analyse Different Data</Button>
            </div>
          </>
        )}

        {/* ── Upload history — shown on setup/input steps ─────────────────── */}
        {(wizardStep === "setup" || wizardStep === "input") && uploadHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-0">
                {uploadHistory.map(rec => (
                  <li key={rec.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate font-medium">{rec.file_name}</span>
                    <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">{rec.file_type}</Badge>
                    {rec.company_name && <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{rec.company_name}</span>}
                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(rec.analysed_at).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" className="h-7 flex-shrink-0 text-xs" onClick={() => handleLoadReport(rec)}>
                      {rec.report_text
                        ? <><FileText className="h-3.5 w-3.5 mr-1" />Load</>
                        : <><RefreshCw className="h-3.5 w-3.5 mr-1" />Re-run</>}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
