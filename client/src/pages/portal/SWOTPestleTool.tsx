import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { artifactsService } from "@/lib/services";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Globe,
  DollarSign,
  Users,
  Cpu,
  Scale,
  Leaf,
  BarChart2,
} from "lucide-react";

type ViewType = "swot" | "pestle" | "summary";

interface AnalysisData {
  companyName: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  pestle: {
    political: string[];
    economic: string[];
    social: string[];
    technological: string[];
    legal: string[];
    environmental: string[];
  };
}

const emptyData: AnalysisData = {
  companyName: "",
  swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
  pestle: { political: [], economic: [], social: [], technological: [], legal: [], environmental: [] },
};

const swotConfig = [
  {
    key: "strengths" as const,
    label: "Strengths",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    hint: "Internal advantages — what does your business do well? (e.g. skilled team, strong brand, unique IP)",
  },
  {
    key: "weaknesses" as const,
    label: "Weaknesses",
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    hint: "Internal limitations — what could you improve? (e.g. limited capital, gaps in expertise)",
  },
  {
    key: "opportunities" as const,
    label: "Opportunities",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    hint: "External possibilities — what market trends or gaps could you exploit?",
  },
  {
    key: "threats" as const,
    label: "Threats",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    hint: "External risks — what could harm your business? (e.g. new competitors, regulation changes)",
  },
];

const pestleConfig = [
  { key: "political" as const, label: "Political", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800", hint: "Government policies, trade agreements, political stability affecting your market" },
  { key: "economic" as const, label: "Economic", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", hint: "Inflation, exchange rates, unemployment, consumer spending trends (e.g. South African Rand volatility)" },
  { key: "social" as const, label: "Social", icon: Users, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-800", hint: "Demographics, cultural attitudes, lifestyle shifts, education levels in your target market" },
  { key: "technological" as const, label: "Technological", icon: Cpu, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", hint: "Digital disruption, automation, R&D trends, tech adoption rates" },
  { key: "legal" as const, label: "Legal", icon: Scale, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", hint: "Labour law, POPIA/GDPR, sector-specific regulations, IP protection" },
  { key: "environmental" as const, label: "Environmental", icon: Leaf, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-800", hint: "Climate impact, sustainability requirements, ESG expectations" },
];

function ItemList({
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const submit = () => {
    const v = input.trim();
    if (v) { onAdd(v); setInput(""); }
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="flex-1 text-sm py-0.5 leading-relaxed">{item}</span>
          <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="text-sm h-8"
        />
        <Button size="sm" variant="ghost" onClick={submit} className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SWOTPestleTool() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewType>("swot");
  const [data, setData] = useState<AnalysisData>(emptyData);
  const [isFinalized, setIsFinalized] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // Load existing draft or last saved artifact
  const { data: existing } = useQuery({
    queryKey: ["artifact", "swot_pestle"],
    queryFn: () => artifactsService.getLatestArtifactByType("swot_pestle"),
  });

  // Pre-load company name from BMC if no SWOT exists
  const { data: bmcArtifact } = useQuery({
    queryKey: ["artifact", "bmc"],
    queryFn: () => artifactsService.getLatestArtifactByType("bmc"),
    enabled: !existing,
  });

  useEffect(() => {
    if (existing) {
      setData(existing.content as AnalysisData);
      setExistingId(existing.id);
      if (existing.status === "complete") setIsFinalized(true);
    } else if (bmcArtifact) {
      const bmcContent = bmcArtifact.content as any;
      setData(prev => ({ ...prev, companyName: bmcContent?.companyName || "" }));
    }
  }, [existing, bmcArtifact]);

  const updateSwot = (key: keyof AnalysisData["swot"], items: string[]) =>
    setData(prev => ({ ...prev, swot: { ...prev.swot, [key]: items } }));

  const updatePestle = (key: keyof AnalysisData["pestle"], items: string[]) =>
    setData(prev => ({ ...prev, pestle: { ...prev.pestle, [key]: items } }));

  const totalSwotItems = Object.values(data.swot).reduce((s, arr) => s + arr.length, 0);
  const totalPestleItems = Object.values(data.pestle).reduce((s, arr) => s + arr.length, 0);

  const saveMutation = useMutation({
    mutationFn: async (finalize: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        tool_type: "swot_pestle",
        title: `${data.companyName || "Untitled"} — SWOT & PESTLE Analysis`,
        content: data,
        version: 1,
        status: finalize ? "complete" : "in_progress",
      };
      if (existingId) {
        const { error } = await supabase.from("artifacts").update(payload).eq("id", existingId);
        if (error) throw new Error(error.message);
      } else {
        const { data: saved, error } = await supabase.from("artifacts").insert(payload).select().single();
        if (error) throw new Error(error.message);
        setExistingId(saved.id);
      }
      return finalize;
    },
    onSuccess: (finalized) => {
      if (finalized) {
        setIsFinalized(true);
        toast({ title: "Analysis Finalized", description: "Your SWOT & PESTLE has been saved." });
      } else {
        toast({ title: "Draft Saved", description: "Progress saved successfully." });
      }
    },
    onError: (e: any) => toast({ title: "Save Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">SWOT & PESTLE Analysis</span>
            </div>
            {isFinalized && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Finalized</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Draft</span>
            </Button>
            {!isFinalized && (
              <Button size="sm" className="gap-2 bg-primary" onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending || totalSwotItems < 4}>
                <CheckCircle className="h-3.5 w-3.5" />
                Finalize
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Company Name */}
        <div className="mb-6 flex items-center gap-3">
          <Input
            value={data.companyName}
            onChange={e => setData(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder="Enter your company / venture name…"
            className="max-w-xs font-medium"
            disabled={isFinalized}
          />
          <span className="text-sm text-muted-foreground">
            {totalSwotItems} SWOT · {totalPestleItems} PESTLE items
          </span>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          {(["swot", "pestle", "summary"] as ViewType[]).map(v => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              size="sm"
              onClick={() => setView(v)}
              className="capitalize"
            >
              {v === "summary" ? "Summary" : v.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* SWOT View */}
        {view === "swot" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {swotConfig.map(({ key, label, icon: Icon, color, bg, border, hint }) => (
              <Card key={key} className={`border ${border}`}>
                <CardHeader className={`pb-3 ${bg} rounded-t-lg`}>
                  <CardTitle className={`flex items-center gap-2 text-base ${color}`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList
                    items={data.swot[key]}
                    onAdd={v => updateSwot(key, [...data.swot[key], v])}
                    onRemove={i => updateSwot(key, data.swot[key].filter((_, idx) => idx !== i))}
                    placeholder={`Add ${label.toLowerCase()}…`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* PESTLE View */}
        {view === "pestle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pestleConfig.map(({ key, label, icon: Icon, color, bg, border, hint }) => (
              <Card key={key} className={`border ${border}`}>
                <CardHeader className={`pb-3 ${bg} rounded-t-lg`}>
                  <CardTitle className={`flex items-center gap-2 text-base ${color}`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList
                    items={data.pestle[key]}
                    onAdd={v => updatePestle(key, [...data.pestle[key], v])}
                    onRemove={i => updatePestle(key, data.pestle[key].filter((_, idx) => idx !== i))}
                    placeholder={`Add ${label.toLowerCase()} factor…`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary View */}
        {view === "summary" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SWOT Summary — {data.companyName || "Your Business"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {swotConfig.map(({ key, label, icon: Icon, color, bg }) => (
                    <div key={key} className={`rounded-lg p-4 ${bg}`}>
                      <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${color}`}>
                        <Icon className="h-4 w-4" />{label}
                      </div>
                      {data.swot[key].length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No items added</p>
                      ) : (
                        <ul className="space-y-1">
                          {data.swot[key].map((item, i) => (
                            <li key={i} className="text-sm flex gap-2"><span className="text-muted-foreground">•</span>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PESTLE Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {pestleConfig.map(({ key, label, icon: Icon, color, bg }) => (
                    <div key={key} className={`rounded-lg p-4 ${bg}`}>
                      <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${color}`}>
                        <Icon className="h-4 w-4" />{label}
                      </div>
                      {data.pestle[key].length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No items added</p>
                      ) : (
                        <ul className="space-y-1">
                          {data.pestle[key].map((item, i) => (
                            <li key={i} className="text-sm flex gap-2"><span className="text-muted-foreground">•</span>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BMC Link hint */}
            <Card className="border-dashed bg-muted/30">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Use your SWOT insights to refine your <strong>Business Model Canvas</strong> — strengths map to Key Resources, threats inform your risk mitigation in Revenue Streams.
                </p>
                <Link href="/portal/tools/bmc">
                  <Button variant="outline" size="sm">Open BMC</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
