import { useState } from "react";
import { Link } from "wouter";
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
  ArrowLeft,
  TrendingUp,
  ClipboardList,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Activity,
  FileText,
  Lightbulb,
  ShieldAlert,
  Clock,
  RefreshCw,
} from "lucide-react";

interface AnalysisResult {
  success: boolean;
  report: string;
  meta: { model_categorisation: string; model_analysis: string; company: string; };
}

type Step = "idle" | "categorising" | "analysing" | "done";

interface UploadRecord {
  id: string;
  file_name: string;
  file_type: string;
  company_name: string | null;
  analysed_at: string;
}

function parseSections(report: string) {
  const sectionPatterns = [
    { key: "executive",       label: "Executive Summary",     icon: FileText,    color: "text-[#1f3a6e]" },
    { key: "revenue",         label: "Revenue Analysis",      icon: TrendingUp,  color: "text-green-600" },
    { key: "expense",         label: "Expense Analysis",      icon: DollarSign,  color: "text-orange-600" },
    { key: "cashflow",        label: "Cash Flow Assessment",  icon: Activity,    color: "text-blue-600" },
    { key: "ratios",          label: "Key Financial Ratios",  icon: BarChart3,   color: "text-purple-600" },
    { key: "risks",           label: "Risk Flags",            icon: ShieldAlert, color: "text-red-600" },
    { key: "recommendations", label: "Recommendations",       icon: Lightbulb,   color: "text-yellow-600" },
  ];
  const lines = report.split("\n");
  const sections: { key: string; label: string; icon: any; color: string; content: string }[] = [];
  let cur: (typeof sections)[0] | null = null;
  let curLines: string[] = [];
  for (const line of lines) {
    const matched = sectionPatterns.find(s =>
      line.toLowerCase().includes(s.label.toLowerCase()) || line.toLowerCase().includes(s.key)
    );
    if (matched) {
      if (cur) sections.push({ ...cur, content: curLines.join("\n").trim() });
      cur = { ...matched, content: "" };
      curLines = [];
    } else if (cur) {
      curLines.push(line);
    }
  }
  if (cur) sections.push({ ...cur, content: curLines.join("\n").trim() });
  if (sections.length === 0)
    return [{ key: "full", label: "Financial Analysis Report", icon: FileText, color: "text-[#1f3a6e]", content: report }];
  return sections;
}

async function fetchUploadHistory(): Promise<UploadRecord[]> {
  const { data, error } = await supabase
    .from("financial_uploads")
    .select("id, file_name, file_type, company_name, analysed_at")
    .order("analysed_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

async function saveUploadRecord(record: { file_name: string; file_type: string; company_name: string | null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("financial_uploads").insert({ user_id: user.id, ...record });
}

export default function FinancialAnalysisTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [statements, setStatements] = useState("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [companyNameOverride, setCompanyNameOverride] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleAnalyse = async () => {
    const isPaste = inputMode === "paste";
    const hasData = isPaste ? !!statements.trim() : !!uploadResult;
    if (!hasData) {
      toast({
        title: isPaste ? "No data provided" : "No file selected",
        description: isPaste ? "Please paste your financial statements." : "Please upload a file.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalysing(true);
    setError(null);
    setResult(null);
    setStep("categorising");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      await new Promise(r => setTimeout(r, 600));
      setStep("analysing");

      const aiBase = (import.meta.env.VITE_AI_API_URL ?? "").replace(/\/$/, "");
      const body: Record<string, string> = { companyName: companyName || "the business" };

      if (isPaste) {
        body.statements = statements.trim();
      } else if (uploadResult!.fileType === "pdf") {
        body.fileData = uploadResult!.fileData!;
        body.fileName = uploadResult!.fileName;
      } else {
        body.statements = uploadResult!.text;
      }

      const response = await fetch(`${aiBase}/api/analyze-financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setStep("done");

      saveMutation.mutate({
        file_name: isPaste ? "(pasted text)" : uploadResult!.fileName,
        file_type: isPaste ? "paste" : uploadResult!.fileType,
        company_name: companyName || null,
      });

      toast({ title: "Analysis complete!", description: "Your financial report is ready." });
    } catch (err: any) {
      setError(err.message ?? "Analysis failed.");
      setStep("idle");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => { setResult(null); setError(null); setStep("idle"); setStatements(""); setUploadResult(null); };
  const sections = result ? parseSections(result.report) : [];

  return (
    <div className="min-h-screen bg-background">

      <div className="bg-[#1f3a6e] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/portal">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-lg p-2"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-semibold">Financial Analysis</h1>
              <p className="text-xs text-blue-200">AI-powered financial health report</p>
            </div>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">Claude Haiku + Sonnet</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {step !== "done" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial Data Input</CardTitle>
              <div className="flex gap-1 mt-2 p-1 bg-muted rounded-lg w-fit">
                <button onClick={() => setInputMode("paste")} disabled={isAnalysing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${inputMode === "paste" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <ClipboardList className="h-3.5 w-3.5" />Paste Text
                </button>
                <button onClick={() => setInputMode("upload")} disabled={isAnalysing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${inputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Upload className="h-3.5 w-3.5" />Upload File
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Company / Business Name</label>
                <Input placeholder={profile?.businessName ?? "e.g. EdMeCa Academy"} value={companyNameOverride}
                  onChange={e => setCompanyNameOverride(e.target.value)} className="max-w-sm" disabled={isAnalysing} />
              </div>

              {inputMode === "paste" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Financial Statements / Bank Statement Data</label>
                  <Textarea
                    placeholder={"Paste your bank statement, management accounts, or CSV export here.\n\nExample:\nDate, Description, Amount\n2026-01-01, Client Invoice #001, 15000\n2026-01-03, Office Rent, -8500\n..."}
                    value={statements} onChange={e => setStatements(e.target.value)}
                    rows={14} className="font-mono text-sm resize-y" disabled={isAnalysing} />
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV, plain text, or copied bank rows. Max ~12 000 characters.</p>
                </div>
              )}

              {inputMode === "upload" && (
                <div className="space-y-3">
                  <FileUploadZone onUpload={setUploadResult} onClear={() => setUploadResult(null)}
                    currentFile={uploadResult?.fileName ?? null} disabled={isAnalysing} />
                  {uploadResult && uploadResult.fileType !== "pdf" && uploadResult.text && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Extracted preview:</p>
                      <pre className="text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                        {uploadResult.text.slice(0, 600)}{uploadResult.text.length > 600 ? "\n…" : ""}
                      </pre>
                    </div>
                  )}
                  {uploadResult?.fileType === "pdf" && (
                    <p className="text-xs text-muted-foreground">PDF text will be extracted server-side when you generate the report.</p>
                  )}
                </div>
              )}

              {isAnalysing && (
                <div className="flex flex-col gap-3 py-2">
                  <div className={`flex items-center gap-3 text-sm ${step === "categorising" ? "text-foreground" : "text-muted-foreground"}`}>
                    {step === "categorising" ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    Step 1 — Categorising transactions (Claude Haiku)
                  </div>
                  <div className={`flex items-center gap-3 text-sm ${(step as Step) === "analysing" ? "text-foreground" : (step as Step) === "done" ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                    {(step as Step) === "analysing" ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" /> : (step as Step) === "done" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
                    Step 2 — Generating health report (Claude Sonnet)
                  </div>
                  <p className="text-xs text-muted-foreground">This may take 30–60 seconds…</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              <Button onClick={handleAnalyse}
                disabled={isAnalysing || (inputMode === "paste" ? !statements.trim() : !uploadResult)}
                className="bg-[#1f3a6e] hover:bg-[#162d57] w-full sm:w-auto">
                {isAnalysing
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing…</>
                  : <><TrendingUp className="h-4 w-4 mr-2" />Generate Financial Report</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && step === "done" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-sm">Analysis complete for <span className="text-[#1f3a6e] font-semibold">{result.meta.company}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{result.meta.model_categorisation}</Badge>
                <Badge variant="outline" className="text-xs">{result.meta.model_analysis}</Badge>
                <Button variant="outline" size="sm" onClick={handleReset}>New Analysis</Button>
              </div>
            </div>
            <div className="space-y-4">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <Card key={section.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${section.color}`} />{section.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleReset}>Analyse Different Data</Button>
            </div>
          </>
        )}

        {uploadHistory.length > 0 && step !== "done" && (
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" title="Re-analyse"
                      onClick={() => toast({ title: "Re-analyse coming soon", description: "Upload the file again to re-run the analysis." })}>
                      <RefreshCw className="h-3.5 w-3.5" />
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
