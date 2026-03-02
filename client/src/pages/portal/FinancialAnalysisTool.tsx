import { useState, useEffect } from "react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Quote,
} from "lucide-react";

interface AnalysisResult {
  success: boolean;
  report: string;
  meta: { model_categorisation: string; model_analysis: string; company: string; };
}

type Step = "idle" | "categorising" | "analysing" | "done";

// ── Leadership quotes shown while analysis runs ────────────────────────────────
const QUOTES = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You must gain control over your money or the lack of it will forever control you.", author: "Dave Ramsey" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "It's not about how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The function of leadership is to produce more leaders, not more followers.", author: "Ralph Nader" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
];

function QuotesCarousel() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[idx];
  return (
    <div className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex gap-3 items-start">
        <Quote className="h-6 w-6 text-[#1f3a6e]/30 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm italic text-muted-foreground leading-relaxed">"{quote.text}"</p>
          <p className="text-xs font-medium text-[#1f3a6e] mt-1.5">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}

// ── Markdown renderer — styled to match the system design ─────────────────────
const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h1 className="text-base font-bold text-[#1f3a6e] mb-2 mt-4 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-[#1f3a6e] mb-1.5 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mb-1 mt-3 first:mt-0 border-b pb-0.5">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  ul: ({ children }) => <ul className="space-y-1 mb-2 pl-4 list-none">{children}</ul>,
  ol: ({ children }) => <ol className="space-y-1 mb-2 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="text-sm leading-relaxed flex gap-2">
      <span className="text-[#1f3a6e] mt-1.5 flex-shrink-0">&#x2022;</span>
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#1f3a6e]/5">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-[#1f3a6e] border-b whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-xs border-b last:border-0 border-border/50">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#1f3a6e]/30 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-border my-3" />,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
};

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

        {/* ── Loading card — shown instead of input form while analysing ─────── */}
        {isAnalysing && (
          <Card className="border-[#1f3a6e]/20">
            <CardContent className="pt-8 pb-8">
              <div className="max-w-lg mx-auto space-y-8">
                {/* Steps */}
                <div className="flex flex-col gap-3">
                  <div className={`flex items-center gap-3 text-sm ${step === "categorising" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step === "categorising" ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    Step 1 — Categorising transactions
                    <Badge variant="outline" className="text-xs ml-auto">Claude Haiku</Badge>
                  </div>
                  <div className={`flex items-center gap-3 text-sm ${step === "analysing" ? "text-foreground font-medium" : step === "done" ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                    {step === "analysing" ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" /> : step === "done" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
                    Step 2 — Generating health report
                    <Badge variant="outline" className="text-xs ml-auto">Claude Sonnet</Badge>
                  </div>
                </div>

                {/* Quote card */}
                <div className="rounded-xl border border-[#1f3a6e]/15 bg-gradient-to-br from-[#1f3a6e]/5 via-background to-transparent p-6">
                  <p className="text-[10px] font-semibold text-[#1f3a6e] uppercase tracking-widest mb-4">While you wait</p>
                  <QuotesCarousel />
                </div>

                <p className="text-xs text-center text-muted-foreground">This may take 30–60 seconds…</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Input form — hidden while analysing ────────────────────────────── */}
        {step !== "done" && !isAnalysing && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial Data Input</CardTitle>
              <div className="flex gap-1 mt-2 p-1 bg-muted rounded-lg w-fit">
                <button onClick={() => setInputMode("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${inputMode === "paste" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <ClipboardList className="h-3.5 w-3.5" />Paste Text
                </button>
                <button onClick={() => setInputMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${inputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Upload className="h-3.5 w-3.5" />Upload File
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Company / Business Name</label>
                <Input placeholder={profile?.businessName ?? "e.g. EdMeCa Academy"} value={companyNameOverride}
                  onChange={e => setCompanyNameOverride(e.target.value)} className="max-w-sm" />
              </div>

              {inputMode === "paste" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Financial Statements / Bank Statement Data</label>
                  <Textarea
                    placeholder={"Paste your bank statement, management accounts, or CSV export here.\n\nExample:\nDate, Description, Amount\n2026-01-01, Client Invoice #001, 15000\n2026-01-03, Office Rent, -8500\n..."}
                    value={statements} onChange={e => setStatements(e.target.value)}
                    rows={14} className="font-mono text-sm resize-y" />
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV, plain text, or copied bank rows. Max ~12 000 characters.</p>
                </div>
              )}

              {inputMode === "upload" && (
                <div className="space-y-3">
                  <FileUploadZone onUpload={setUploadResult} onClear={() => setUploadResult(null)}
                    currentFile={uploadResult?.fileName ?? null} />
                  {uploadResult?.text && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Extracted preview:</p>
                      <pre className="text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                        {uploadResult.text.slice(0, 600)}{uploadResult.text.length > 600 ? "\n…" : ""}
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

              <Button onClick={handleAnalyse}
                disabled={inputMode === "paste" ? !statements.trim() : !uploadResult}
                className="bg-[#1f3a6e] hover:bg-[#162d57] w-full sm:w-auto">
                <TrendingUp className="h-4 w-4 mr-2" />Generate Financial Report
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${section.color}`} />{section.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {section.content}
                      </ReactMarkdown>
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
