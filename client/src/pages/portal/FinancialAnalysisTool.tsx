import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/lib/services";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  TrendingUp,
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
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  success: boolean;
  report: string;
  meta: {
    model_categorisation: string;
    model_analysis: string;
    company: string;
  };
}

// ── Section parser — splits the Claude report into labelled sections ───────────
function parseSections(report: string) {
  const sectionPatterns = [
    { key: "executive", label: "Executive Summary", icon: FileText, color: "text-navy-700" },
    { key: "revenue", label: "Revenue Analysis", icon: TrendingUp, color: "text-green-600" },
    { key: "expense", label: "Expense Analysis", icon: DollarSign, color: "text-orange-600" },
    { key: "cashflow", label: "Cash Flow Assessment", icon: Activity, color: "text-blue-600" },
    { key: "ratios", label: "Key Financial Ratios", icon: BarChart3, color: "text-purple-600" },
    { key: "risks", label: "Risk Flags", icon: ShieldAlert, color: "text-red-600" },
    { key: "recommendations", label: "Recommendations", icon: Lightbulb, color: "text-yellow-600" },
  ];

  // Split on numbered headings or bold section names
  const lines = report.split("\n");
  const sections: { key: string; label: string; icon: any; color: string; content: string }[] = [];
  let currentSection: (typeof sections)[0] | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const matched = sectionPatterns.find((s) =>
      line.toLowerCase().includes(s.label.toLowerCase()) ||
      line.toLowerCase().includes(s.key)
    );

    if (matched) {
      if (currentSection) {
        sections.push({ ...currentSection, content: currentLines.join("\n").trim() });
      }
      currentSection = { ...matched, content: "" };
      currentLines = [];
    } else if (currentSection) {
      currentLines.push(line);
    }
  }

  if (currentSection) {
    sections.push({ ...currentSection, content: currentLines.join("\n").trim() });
  }

  // If parsing fails, return the full report as one block
  if (sections.length === 0) {
    return [
      {
        key: "full",
        label: "Financial Analysis Report",
        icon: FileText,
        color: "text-[#1f3a6e]",
        content: report,
      },
    ];
  }

  return sections;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FinancialAnalysisTool() {
  const { toast } = useToast();
  const [statements, setStatements] = useState("");
  const [companyNameOverride, setCompanyNameOverride] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  type Step = "idle" | "categorising" | "analysing" | "done";
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill company name from profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getUserProfile,
  });

  const companyName = companyNameOverride || profile?.businessName || "";

  const handleAnalyse = async () => {
    if (!statements.trim()) {
      toast({ title: "No data provided", description: "Please paste your financial statements or bank data.", variant: "destructive" });
      return;
    }

    setIsAnalysing(true);
    setError(null);
    setResult(null);
    setStep("categorising");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Give the UI a moment to show step 1 before the heavy API call starts
      await new Promise((r) => setTimeout(r, 600));
      setStep("analysing");

      const response = await fetch("/api/analyze-financials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          statements: statements.trim(),
          companyName: companyName || "the business",
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setStep("done");
      toast({ title: "Analysis complete!", description: "Your financial report is ready." });
    } catch (err: any) {
      setError(err.message ?? "Analysis failed. Please try again.");
      setStep("idle");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setStep("idle");
    setStatements("");
  };

  const sections = result ? parseSections(result.report) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#1f3a6e] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/portal">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-lg p-2">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Financial Analysis</h1>
              <p className="text-xs text-blue-200">AI-powered financial health report</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
              Claude Haiku + Sonnet
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Input card */}
        {step !== "done" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#1f3a6e]" />
                Paste Your Financial Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Company / Business Name
                </label>
                <Input
                  placeholder={profile?.businessName ?? "e.g. EdMeCa Academy"}
                  value={companyNameOverride}
                  onChange={(e) => setCompanyNameOverride(e.target.value)}
                  className="max-w-sm"
                  disabled={isAnalysing}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Financial Statements / Bank Statement Data
                </label>
                <Textarea
                  placeholder={`Paste your bank statement, management accounts, or CSV export here.\n\nExample:\nDate, Description, Amount\n2026-01-01, Client Invoice #001, 15000\n2026-01-03, Office Rent, -8500\n2026-01-05, Software Subscriptions, -1200\n...`}
                  value={statements}
                  onChange={(e) => setStatements(e.target.value)}
                  rows={14}
                  className="font-mono text-sm resize-y"
                  disabled={isAnalysing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, plain text, or copied bank statement rows. Max ~12 000 characters for best results.
                </p>
              </div>

              {/* Progress indicator */}
              {isAnalysing && (
                <div className="flex flex-col gap-3 py-2">
                  <div className={`flex items-center gap-3 text-sm ${step === "categorising" ? "text-foreground" : "text-muted-foreground"}`}>
                    {(step as string) === "categorising"
                      ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" />
                      : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    Step 1 — Categorising and structuring transactions (Claude Haiku)
                  </div>
                  <div className={`flex items-center gap-3 text-sm ${
                    (step as string) === "analysing" ? "text-foreground"
                    : (step as string) === "done" ? "text-muted-foreground"
                    : "text-muted-foreground/40"
                  }`}>
                    {(step as string) === "analysing"
                      ? <Loader2 className="h-4 w-4 animate-spin text-[#1f3a6e]" />
                      : (step as string) === "done"
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
                    Step 2 — Generating financial health report (Claude Sonnet)
                  </div>
                  <p className="text-xs text-muted-foreground">This may take 30–60 seconds…</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleAnalyse}
                disabled={isAnalysing || !statements.trim()}
                className="bg-[#1f3a6e] hover:bg-[#162d57] w-full sm:w-auto"
              >
                {isAnalysing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysing…</>
                ) : (
                  <><TrendingUp className="h-4 w-4 mr-2" /> Generate Financial Report</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && step === "done" && (
          <>
            {/* Meta bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-sm">
                  Analysis complete for <span className="text-[#1f3a6e] font-semibold">{result.meta.company}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{result.meta.model_categorisation}</Badge>
                <Badge variant="outline" className="text-xs">{result.meta.model_analysis}</Badge>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  New Analysis
                </Button>
              </div>
            </div>

            {/* Section cards */}
            <div className="space-y-4">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${section.color}`} />
                        {section.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Analyse again button */}
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleReset}>
                Analyse Different Data
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
