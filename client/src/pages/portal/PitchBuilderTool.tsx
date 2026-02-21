import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { artifactsService } from "@/lib/services";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  Eye,
  Edit3,
  AlertCircle,
  Lightbulb,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  PiggyBank,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

type ViewType = "editor" | "preview";

interface PitchSection {
  id: string;
  label: string;
  icon: any;
  placeholder: string;
  hint: string;
  bmcHint?: string;
  starters?: string[];
}

interface PitchData {
  companyName: string;
  tagline: string;
  problem: string;
  solution: string;
  marketSize: string;
  businessModel: string;
  traction: string;
  team: string;
  financials: string;
  ask: string;
}

const emptyData: PitchData = {
  companyName: "", tagline: "", problem: "", solution: "",
  marketSize: "", businessModel: "", traction: "", team: "", financials: "", ask: "",
};

const sections: PitchSection[] = [
  {
    id: "problem", label: "The Problem", icon: AlertCircle,
    placeholder: "What problem are you solving? Why does it matter?",
    hint: "Describe the pain your target customer experiences. Be specific and concrete — if you can quantify it (e.g. \"small businesses in SA spend 8 hours a week on manual invoicing\"), that's much stronger than a vague statement. The reader must believe this problem is real and significant.",
    bmcHint: "Look at your Customer Segments and the Pains column in your Value Proposition canvas for inspiration.",
    starters: ["The problem is that...", "X% of [target customers] struggle with...", "Currently there is no affordable solution for...", "This costs businesses / people R... per year"],
  },
  {
    id: "solution", label: "Our Solution", icon: Lightbulb,
    placeholder: "How does your product/service solve the problem uniquely?",
    hint: "Explain your core solution in plain language — what does it do, and why is it better than what already exists? Focus on the key insight that makes your approach work. Avoid jargon. A good test: can someone who knows nothing about your industry understand it in 30 seconds?",
    bmcHint: "Draw from your Value Propositions and Products & Services in your BMC and Value Prop canvas.",
    starters: ["We solve this by...", "Our platform / product allows users to...", "Unlike existing alternatives, we...", "The key insight behind our approach is..."],
  },
  {
    id: "marketSize", label: "Market Opportunity", icon: Users,
    placeholder: "TAM, SAM, SOM — how big is the market and who are your target customers?",
    hint: "Show investors there is a big enough market worth pursuing. Include TAM (Total Addressable Market), SAM (your realistic target slice), and SOM (what you can capture in 3-5 years). Use credible data — reference Stats SA, industry reports, or comparable markets.",
    bmcHint: "Your Customer Segments block in the BMC defines your SAM.",
    starters: ["Our total addressable market (TAM) is...", "We are targeting the South African / African...", "Our serviceable market (SAM) is approximately...", "We estimate we can capture X% of the market within..."],
  },
  {
    id: "businessModel", label: "Business Model", icon: DollarSign,
    placeholder: "How do you make money? Pricing model, revenue streams, unit economics…",
    hint: "Explain exactly what customers pay for and how much. Include your pricing model (subscription, per transaction, project-based, etc.), key cost drivers, and how the unit economics improve at scale. Show a clear path to profitability.",
    bmcHint: "This maps directly to Revenue Streams and Cost Structure in your BMC.",
    starters: ["Customers pay a monthly subscription of R...", "We charge per transaction at X%...", "Our primary revenue stream is...", "At X customers, we reach break-even because..."],
  },
  {
    id: "traction", label: "Traction", icon: TrendingUp,
    placeholder: "What proof do you have this is working? Customers, revenue, pilots, LOIs…",
    hint: "Traction is evidence that your solution works and people want it. Even early-stage proof matters — paying customers, signed letters of intent, pilot results, waitlists, user interviews, or a successful prototype. Show momentum and the direction of travel.",
    starters: ["We currently have X paying customers", "Completed X pilots with [organisation]...", "Our waitlist has X sign-ups in X weeks", "Revenue to date: R...", "We have letters of intent from..."],
  },
  {
    id: "team", label: "The Team", icon: UserCheck,
    placeholder: "Who are the founders? What relevant experience and skills do you bring?",
    hint: "Investors often say they back people, not just ideas. Highlight why your team is uniquely positioned to solve this problem. Include relevant domain experience, past successes, complementary skill sets, and key advisors.",
    bmcHint: "Think about your Key Resources block in the BMC — your human capital is often your most critical resource.",
    starters: ["Our CEO / Founder has X years experience in...", "Our CTO previously built...", "Combined, our team has worked at...", "We are advised by [name], who has expertise in..."],
  },
  {
    id: "financials", label: "Financials", icon: PiggyBank,
    placeholder: "Revenue projections, key cost drivers, burn rate, runway…",
    hint: "Show 3–5 year financial projections with realistic, defensible assumptions. Include monthly burn rate, current runway, key cost drivers, and when you reach profitability. Bottom-up projections (built from unit economics) are more credible than top-down (\"%  of market\").",
    bmcHint: "Reference your Cost Structure and Revenue Streams blocks in your BMC.",
    starters: ["Projected Year 1 revenue: R...", "Monthly burn rate: R...", "We have X months of runway remaining", "We project break-even at month X when...", "Our key cost drivers are..."],
  },
  {
    id: "ask", label: "The Ask", icon: HelpCircle,
    placeholder: "How much are you raising? What will you use funds for? What milestones will this reach?",
    hint: "Be specific and confident about what you want. State the amount, the type of funding (equity, convertible note, grant), exactly how the money will be spent, and the key milestones you will hit within 18–24 months. Vague asks signal poor planning.",
    starters: ["We are raising R...", "Funds will be used for: (1) product development, (2)...", "With this raise we will reach...", "We are seeking [equity / debt / grant] at a valuation of..."],
  },
];

export default function PitchBuilderTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewType>("editor");
  const [activeSection, setActiveSection] = useState(0);
  const [data, setData] = useState<PitchData>(emptyData);
  const [isFinalized, setIsFinalized] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const existingIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  useEffect(() => { existingIdRef.current = existingId; }, [existingId]);

  const { data: existing } = useQuery({
    queryKey: ["artifact", "pitch_builder"],
    queryFn: () => artifactsService.getLatestArtifactByType("pitch_builder"),
    staleTime: 0,
  });

  const { data: bmcArtifact } = useQuery({
    queryKey: ["artifact", "bmc"],
    queryFn: () => artifactsService.getLatestArtifactByType("bmc"),
    enabled: !existing,
  });

  const { data: valuePropArtifact } = useQuery({
    queryKey: ["artifact", "value_proposition"],
    queryFn: () => artifactsService.getLatestArtifactByType("value_proposition"),
    enabled: !existing,
  });

  useEffect(() => {
    if (hasLoadedRef.current) return; // never overwrite user edits after initial load
    if (existing === undefined) return;
    if (existing) {
      setData(existing.content as PitchData);
      setExistingId(existing.id);
      if (existing.status === "complete") setIsFinalized(true);
    } else if (bmcArtifact) {
      const c = bmcArtifact.content as any;
      const vp = valuePropArtifact?.content as any;
      setData(prev => ({
        ...prev,
        companyName: c?.companyName || "",
        businessModel: c?.revenueStreams?.length
          ? `Revenue Streams:\n• ${c.revenueStreams.join("\n• ")}\n\nCost Structure:\n• ${(c.costStructure || []).join("\n• ")}`
          : "",
        solution: vp?.value?.products?.length
          ? vp.value.products.join("\n")
          : (c?.valuePropositions?.join("\n") || ""),
        marketSize: c?.customerSegments?.length
          ? `Target Segments:\n• ${c.customerSegments.join("\n• ")}`
          : "",
      }));
    }
    setTimeout(() => { hasLoadedRef.current = true; }, 0);
  }, [existing, bmcArtifact, valuePropArtifact]);

  // Auto-save draft 1.5s after any data change (silent — no toast)
  useEffect(() => {
    if (!hasLoadedRef.current || isFinalized) return;
    const timer = setTimeout(async () => {
      try {
        const id = await artifactsService.saveArtifact(existingIdRef.current, {
          tool_type: "pitch_builder",
          title: `${data.companyName || "Untitled"} — Pitch Deck`,
          content: data as unknown as Record<string, unknown>,
          status: "in_progress",
        });
        if (!existingIdRef.current) { existingIdRef.current = id; setExistingId(id); }
      } catch { /* silent */ }
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, isFinalized]);

  const set = (field: keyof PitchData, val: string) =>
    setData(prev => ({ ...prev, [field]: val }));

  const completedSections = sections.filter(s => (data as any)[s.id]?.trim()).length;

  const saveMutation = useMutation({
    mutationFn: async (finalize: boolean) => {
      const id = await artifactsService.saveArtifact(existingIdRef.current, {
        tool_type: "pitch_builder",
        title: `${data.companyName || "Untitled"} — Pitch Deck`,
        content: data as unknown as Record<string, unknown>,
        status: finalize ? "complete" : "in_progress",
      });
      if (!existingIdRef.current) { existingIdRef.current = id; setExistingId(id); }
      queryClient.invalidateQueries({ queryKey: ["artifact", "pitch_builder"] });
      return finalize;
    },
    onSuccess: (finalized) => {
      if (finalized) { setIsFinalized(true); toast({ title: "Pitch Finalized", description: "Saved to your artifacts." }); }
      else toast({ title: "Draft Saved" });
    },
    onError: (e: any) => toast({ title: "Save Failed", description: e.message, variant: "destructive" }),
  });

  const current = sections[activeSection];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Pitch Builder</span>
            </div>
            {isFinalized && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Finalized</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === "editor" ? "preview" : "editor")} className="gap-2">
              {view === "editor" ? <><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">Preview</span></> : <><Edit3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Edit</span></>}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" /><span className="hidden sm:inline">Save</span>
            </Button>
            {!isFinalized && (
              <Button size="sm" className="gap-2" onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending || completedSections < 5}>
                <CheckCircle className="h-3.5 w-3.5" />Finalize
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Company + tagline */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <Input value={data.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Company name…" className="max-w-48 font-medium" disabled={isFinalized} />
          <Input value={data.tagline} onChange={e => set("tagline", e.target.value)} placeholder="One-line tagline…" className="max-w-72" disabled={isFinalized} />
          <span className="text-sm text-muted-foreground ml-auto">{completedSections} / {sections.length} sections complete</span>
        </div>

        {view === "editor" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar nav */}
            <div className="lg:col-span-1">
              <div className="space-y-1">
                {sections.map((s, i) => {
                  const filled = !!(data as any)[s.id]?.trim();
                  const SIcon = s.icon;
                  return (
                    <button key={s.id} onClick={() => setActiveSection(i)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeSection === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      <SIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{s.label}</span>
                      {filled && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor panel */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-orange-600" />
                    Slide {activeSection + 1}: {current.label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground leading-relaxed">{current.hint}</p>
                  {current.bmcHint && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 leading-relaxed">
                      💡 BMC Tip: {current.bmcHint}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {current.starters && !isFinalized && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs text-muted-foreground self-center mr-0.5">Starters:</span>
                      {current.starters.map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            const cur = (data as any)[current.id] || "";
                            set(current.id as keyof PitchData, cur ? `${cur}\n${s}` : s);
                          }}
                          className="text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={(data as any)[current.id]}
                    onChange={e => set(current.id as keyof PitchData, e.target.value)}
                    placeholder={current.placeholder}
                    className="min-h-40 text-sm resize-none"
                    disabled={isFinalized}
                  />
                  <div className="flex justify-between mt-3">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveSection(i => Math.max(0, i - 1))} disabled={activeSection === 0}>
                      <ChevronLeft className="h-4 w-4" />Prev
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveSection(i => Math.min(sections.length - 1, i + 1))} disabled={activeSection === sections.length - 1}>
                      Next<ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            {/* Cover slide */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-10 text-center">
                <h1 className="font-serif text-4xl font-bold mb-2">{data.companyName || "Your Company"}</h1>
                <p className="text-primary-foreground/80 text-lg">{data.tagline || "Your tagline goes here"}</p>
              </CardContent>
            </Card>
            {sections.map((s, i) => {
              const SIcon = s.icon;
              const content = (data as any)[s.id];
              if (!content?.trim()) return null;
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <SIcon className="h-4 w-4 text-orange-600" />
                      {i + 1}. {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{content}</p>
                  </CardContent>
                </Card>
              );
            })}
            {/* BMC link */}
            <Card className="border-dashed bg-muted/30">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Your Business Model and Solution slides draw directly from your <strong>Business Model Canvas</strong>.</p>
                <Link href="/portal/tools/bmc"><Button variant="outline" size="sm">Open BMC</Button></Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
