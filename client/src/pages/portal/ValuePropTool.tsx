import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { artifactsService } from "@/lib/services";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  CheckCircle,
  Target,
  Frown,
  Smile,
  Briefcase,
  Zap,
  ShieldCheck,
  Star,
  ArrowRight,
} from "lucide-react";

type ViewType = "customer" | "value" | "fit";

interface ValuePropData {
  companyName: string;
  customerSegment: string;
  customer: {
    jobs: string[];
    pains: string[];
    gains: string[];
  };
  value: {
    products: string[];
    painRelievers: string[];
    gainCreators: string[];
  };
}

const emptyData: ValuePropData = {
  companyName: "",
  customerSegment: "",
  customer: { jobs: [], pains: [], gains: [] },
  value: { products: [], painRelievers: [], gainCreators: [] },
};

function ItemList({
  items,
  onAdd,
  onRemove,
  placeholder,
  disabled,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const submit = () => {
    const v = input.trim();
    if (v) { onAdd(v); setInput(""); }
  };
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="flex-1 text-sm py-0.5 leading-relaxed">{item}</span>
          {!disabled && (
            <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex gap-2 mt-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder={placeholder} className="text-sm h-8" />
          <Button size="sm" variant="ghost" onClick={submit} className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

export default function ValuePropTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewType>("customer");
  const [data, setData] = useState<ValuePropData>(emptyData);
  const [isFinalized, setIsFinalized] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const existingIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  useEffect(() => { existingIdRef.current = existingId; }, [existingId]);

  const { data: existing } = useQuery({
    queryKey: ["artifact", "value_proposition"],
    queryFn: () => artifactsService.getLatestArtifactByType("value_proposition"),
    staleTime: 0,
  });

  const { data: bmcArtifact } = useQuery({
    queryKey: ["artifact", "bmc"],
    queryFn: () => artifactsService.getLatestArtifactByType("bmc"),
    enabled: !existing,
  });

  useEffect(() => {
    if (hasLoadedRef.current) return; // never overwrite user edits after initial load
    if (existing === undefined) return;
    if (existing) {
      setExistingId(existing.id);
      if (existing.status === "complete") setIsFinalized(true);
    } else if (bmcArtifact) {
      const c = bmcArtifact.content as any;
      setData(prev => ({
        ...prev,
        companyName: c?.companyName || "",
        customerSegment: (c?.customerSegments?.[0]) || "",
        value: { ...prev.value, products: c?.valuePropositions || [] },
      }));
    }
    setTimeout(() => { hasLoadedRef.current = true; }, 0);
  }, [existing, bmcArtifact]);

  // Auto-save draft 1.5s after any data change (silent — no toast)
  useEffect(() => {
    if (!hasLoadedRef.current || isFinalized) return;
    const timer = setTimeout(async () => {
      try {
        const id = await artifactsService.saveArtifact(existingIdRef.current, {
          tool_type: "value_proposition",
          title: `${data.companyName || "Untitled"} — Value Proposition`,
          content: data as unknown as Record<string, unknown>,
          status: "in_progress",
        });
        if (!existingIdRef.current) { existingIdRef.current = id; setExistingId(id); }
      } catch { /* silent */ }
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, isFinalized]);

  const updateCustomer = (key: keyof ValuePropData["customer"], items: string[]) =>
    setData(prev => ({ ...prev, customer: { ...prev.customer, [key]: items } }));

  const updateValue = (key: keyof ValuePropData["value"], items: string[]) =>
    setData(prev => ({ ...prev, value: { ...prev.value, [key]: items } }));

  const totalCustomer = Object.values(data.customer).reduce((s, a) => s + a.length, 0);
  const totalValue = Object.values(data.value).reduce((s, a) => s + a.length, 0);

  const saveMutation = useMutation({
    mutationFn: async (finalize: boolean) => {
      const id = await artifactsService.saveArtifact(existingIdRef.current, {
        tool_type: "value_proposition",
        title: `${data.companyName || "Untitled"} — Value Proposition`,
        content: data as unknown as Record<string, unknown>,
        status: finalize ? "complete" : "in_progress",
      });
      if (!existingIdRef.current) { existingIdRef.current = id; setExistingId(id); }
      queryClient.invalidateQueries({ queryKey: ["artifact", "value_proposition"] });
      return finalize;
    },
    onSuccess: (finalized) => {
      if (finalized) {
        setIsFinalized(true);
        toast({ title: "Value Proposition Finalized", description: "Saved to your artifacts." });
      } else {
        toast({ title: "Draft Saved" });
      }
    },
    onError: (e: any) => toast({ title: "Save Failed", description: e.message, variant: "destructive" }),
  });

  const canFinalize = totalCustomer >= 3 && totalValue >= 3;

  return (
    <div className="min-h-screen bg-background">
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
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Value Proposition</span>
            </div>
            {isFinalized && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Finalized</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Draft</span>
            </Button>
            {!isFinalized && (
              <Button size="sm" className="gap-2" onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending || !canFinalize}>
                <CheckCircle className="h-3.5 w-3.5" />
                Finalize
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input value={data.companyName} onChange={e => setData(p => ({ ...p, companyName: e.target.value }))} placeholder="Company / venture name…" className="max-w-48 font-medium" disabled={isFinalized} />
          <Input value={data.customerSegment} onChange={e => setData(p => ({ ...p, customerSegment: e.target.value }))} placeholder="Target customer segment…" className="max-w-64" disabled={isFinalized} />
          <span className="text-sm text-muted-foreground ml-auto">{totalCustomer} customer · {totalValue} value items</span>
        </div>

        <div className="flex gap-2 mb-6">
          {([
            { v: "customer" as ViewType, label: "Customer Profile" },
            { v: "value" as ViewType, label: "Value Map" },
            { v: "fit" as ViewType, label: "Value Fit" },
          ]).map(({ v, label }) => (
            <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => setView(v)}>{label}</Button>
          ))}
        </div>

        {/* Customer Profile View */}
        {view === "customer" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Map what your customer is trying to accomplish, their frustrations, and their desired outcomes.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-blue-600"><Briefcase className="h-4 w-4" />Customer Jobs</CardTitle>
                  <p className="text-xs text-muted-foreground">Tasks customers need to get done (functional, social, emotional)</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.customer.jobs} onAdd={v => updateCustomer("jobs", [...data.customer.jobs, v])} onRemove={i => updateCustomer("jobs", data.customer.jobs.filter((_, idx) => idx !== i))} placeholder="Add a customer job…" disabled={isFinalized} />
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-3 bg-red-50 dark:bg-red-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-red-600"><Frown className="h-4 w-4" />Pains</CardTitle>
                  <p className="text-xs text-muted-foreground">Obstacles, risks, and bad outcomes customers want to avoid</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.customer.pains} onAdd={v => updateCustomer("pains", [...data.customer.pains, v])} onRemove={i => updateCustomer("pains", data.customer.pains.filter((_, idx) => idx !== i))} placeholder="Add a customer pain…" disabled={isFinalized} />
                </CardContent>
              </Card>
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-green-600"><Smile className="h-4 w-4" />Gains</CardTitle>
                  <p className="text-xs text-muted-foreground">Outcomes and benefits customers want to achieve</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.customer.gains} onAdd={v => updateCustomer("gains", [...data.customer.gains, v])} onRemove={i => updateCustomer("gains", data.customer.gains.filter((_, idx) => idx !== i))} placeholder="Add a desired gain…" disabled={isFinalized} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Value Map View */}
        {view === "value" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Define what you offer and how it directly addresses your customer's pains and gains.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3 bg-purple-50 dark:bg-purple-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-purple-600"><Star className="h-4 w-4" />Products & Services</CardTitle>
                  <p className="text-xs text-muted-foreground">What you offer to help customers get their jobs done</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.value.products} onAdd={v => updateValue("products", [...data.value.products, v])} onRemove={i => updateValue("products", data.value.products.filter((_, idx) => idx !== i))} placeholder="Add product or service…" disabled={isFinalized} />
                </CardContent>
              </Card>
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3 bg-orange-50 dark:bg-orange-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-orange-600"><ShieldCheck className="h-4 w-4" />Pain Relievers</CardTitle>
                  <p className="text-xs text-muted-foreground">How your offering eliminates or reduces customer pains</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.value.painRelievers} onAdd={v => updateValue("painRelievers", [...data.value.painRelievers, v])} onRemove={i => updateValue("painRelievers", data.value.painRelievers.filter((_, idx) => idx !== i))} placeholder="Add pain reliever…" disabled={isFinalized} />
                </CardContent>
              </Card>
              <Card className="border-teal-200 dark:border-teal-800">
                <CardHeader className="pb-3 bg-teal-50 dark:bg-teal-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base text-teal-600"><Zap className="h-4 w-4" />Gain Creators</CardTitle>
                  <p className="text-xs text-muted-foreground">How your offering produces outcomes customers want</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ItemList items={data.value.gainCreators} onAdd={v => updateValue("gainCreators", [...data.value.gainCreators, v])} onRemove={i => updateValue("gainCreators", data.value.gainCreators.filter((_, idx) => idx !== i))} placeholder="Add gain creator…" disabled={isFinalized} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fit View */}
        {view === "fit" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Value Fit is achieved when your <strong>Pain Relievers</strong> match customer <strong>Pains</strong>, and your <strong>Gain Creators</strong> match customer <strong>Gains</strong>.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pain ↔ Pain Reliever */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Frown className="h-4 w-4 text-red-500" />
                    Pains <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <ShieldCheck className="h-4 w-4 text-orange-500" />
                    Pain Relievers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Customer Pains</p>
                      {data.customer.pains.length === 0 ? <p className="text-xs text-muted-foreground italic">None added</p> : data.customer.pains.map((p, i) => <p key={i} className="text-sm mb-1 flex gap-1.5"><span className="text-red-400">•</span>{p}</p>)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Pain Relievers</p>
                      {data.value.painRelievers.length === 0 ? <p className="text-xs text-muted-foreground italic">None added</p> : data.value.painRelievers.map((p, i) => <p key={i} className="text-sm mb-1 flex gap-1.5"><span className="text-orange-400">•</span>{p}</p>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Gains ↔ Gain Creators */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="h-4 w-4 text-green-500" />
                    Gains <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Zap className="h-4 w-4 text-teal-500" />
                    Gain Creators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Customer Gains</p>
                      {data.customer.gains.length === 0 ? <p className="text-xs text-muted-foreground italic">None added</p> : data.customer.gains.map((g, i) => <p key={i} className="text-sm mb-1 flex gap-1.5"><span className="text-green-400">•</span>{g}</p>)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Gain Creators</p>
                      {data.value.gainCreators.length === 0 ? <p className="text-xs text-muted-foreground italic">None added</p> : data.value.gainCreators.map((g, i) => <p key={i} className="text-sm mb-1 flex gap-1.5"><span className="text-teal-400">•</span>{g}</p>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-purple-500" />Products & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.value.products.length === 0 ? <p className="text-sm text-muted-foreground italic">No products/services added</p> : data.value.products.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
                </div>
              </CardContent>
            </Card>
            {/* BMC link */}
            <Card className="border-dashed bg-muted/30">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Your <strong>Value Proposition</strong> directly maps to the Value Propositions and Customer Segments blocks in your BMC.</p>
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
