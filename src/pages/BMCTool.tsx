import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
const edmecaLogo = "/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/services";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import {
  Building2,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  Download,
  RotateCcw,
  LayoutGrid,
  BarChart3,
  List,
  ArrowLeft,
  Users,
  Gift,
  Truck,
  Heart,
  DollarSign,
  Box,
  Cog,
  Handshake,
  CreditCard,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Edit3,
  FileText,
  Save,
  CheckCircle,
  Lock,
  Unlock,
  PenLine,
  Sparkles,
  Loader2,
  Link2,
} from "lucide-react";

type ViewType = "guided" | "canvas" | "dashboard";

interface AIAnalysis {
  strengths: string[];
  areasToImprove: string[];
  coherenceChecks: string[];
  overallAssessment: string;
}

type SectionId =
  | "customerSegments"
  | "valuePropositions"
  | "channels"
  | "customerRelationships"
  | "revenueStreams"
  | "keyResources"
  | "keyActivities"
  | "keyPartnerships"
  | "costStructure";

interface CanvasData {
  customerSegments: string[];
  valuePropositions: string[];
  channels: string[];
  customerRelationships: string[];
  revenueStreams: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartnerships: string[];
  costStructure: string[];
}

interface PromptConfig {
  starter: string;
  example: string;
  maxChars?: number;
}

type TabId = "desirability" | "viability" | "feasibility";

interface TabConfig {
  id: TabId;
  label: string;
  description: string;
  sectionIds: SectionId[];
}

const TABS: TabConfig[] = [
  {
    id: "desirability",
    label: "Desirability",
    description: "Do customers want this?",
    sectionIds: ["valuePropositions", "customerSegments", "channels", "customerRelationships"],
  },
  {
    id: "viability",
    label: "Viability",
    description: "Can this make money?",
    sectionIds: ["costStructure", "revenueStreams"],
  },
  {
    id: "feasibility",
    label: "Feasibility",
    description: "Can we deliver this?",
    sectionIds: ["keyActivities", "keyResources", "keyPartnerships"],
  },
];

interface SectionConfig {
  id: SectionId;
  title: string;
  sequence: number;
  question: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
  borderColor: string;
  tips: string[];
  prompts: PromptConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: "customerSegments",
    title: "Customer Segments",
    sequence: 1,
    question: "Who exactly are you creating value for — and who are you deliberately choosing not to serve?",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-500",
    tips: [
      "Osterwalder identifies five segment types: mass market (one broad group), niche market (highly specialised), segmented (similar needs on a spectrum), diversified (unrelated segments), and multi-sided platform (interdependent groups that need each other).",
      "Groups are truly separate segments if they need a distinct offer, are reached through different channels, require different relationships, have different profitabilities, or pay for different aspects of the offer.",
      "Be concrete, not generic — 'SMEs' is a label; 'owner-managed construction firms with 10-50 employees who lack a dedicated finance function' is a segment you can actually design for.",
      "Every segment you add multiplies complexity — a distinct segment may need its own value proposition, channels, relationships, and revenue streams. Choose deliberately.",
    ],
    prompts: [
      {
        starter: "Our target customer is [specific description] who currently struggles with...",
        example: "Our target customer is a freelance designer (25-45, working solo or in a micro-studio) who currently struggles with pricing projects because she has no reliable market data — she guesses rates based on outdated blog posts and peer gossip.",
      },
      {
        starter: "Our segment type is [mass / niche / segmented / diversified / multi-sided] because...",
        example: "Our segment type is niche because we serve only freelance creatives who sell project-based services — not agencies, not salaried designers, not other freelance professions. This narrow focus lets us build deeply relevant benchmarks.",
      },
      {
        starter: "We chose this segment over [alternative group] because...",
        example: "We chose solo freelancers over design agencies because freelancers have no procurement team to negotiate rates, making the pain more acute and willingness to pay for a self-service tool much higher.",
      },
    ],
  },
  {
    id: "valuePropositions",
    title: "Value Propositions",
    sequence: 2,
    question: "Why would a customer choose you over any alternative?",
    icon: Gift,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-500",
    tips: [
      "Start from the customer, not your product — 'we sell accounting software' describes a product; 'we eliminate the 20 hours/month you spend on bookkeeping' describes a value proposition.",
      "Osterwalder lists eleven value elements: newness, performance, customization, getting the job done, design, brand/status, price, cost reduction, risk reduction, accessibility, and convenience/usability — strong propositions typically rest on 2-3 of these, not all eleven.",
      "Is your offer innovative (creating an entirely new market) or improved (an existing solution with better features, price, or experience)? This shapes every block that follows.",
      "Write a separate proposition for each Customer Segment — if you serve three segments, you may need three distinct value bundles, each emphasising different elements.",
    ],
    prompts: [
      {
        starter: "For [customer segment], the biggest unresolved pain is... and we address it by...",
        example: "For freelance designers, the biggest unresolved pain is spending hours guessing project rates — and we address it by giving them real-time benchmarks from thousands of actual freelance contracts.",
        maxChars: 280,
      },
      {
        starter: "Our proposition is [innovative / improved] and rests on these value elements:",
        example: "Our proposition is improved and rests on accessibility (data previously only agencies could afford), convenience (instant reports vs. manual research), and cost reduction (saves hours of rate research per project).",
        maxChars: 280,
      },
      {
        starter: "A customer would switch to us from [current alternative] because...",
        example: "A customer would switch from googling 'freelance design rates' because generic articles give national averages, while we show rates filtered by skill, region, and project type — updated weekly.",
        maxChars: 280,
      },
    ],
  },
  {
    id: "channels",
    title: "Channels",
    sequence: 3,
    question: "How does your customer discover, evaluate, buy, receive, and get support for your offer?",
    icon: Truck,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-500",
    tips: [
      "Channels cover five phases, not just sales: (1) Awareness — how customers learn you exist, (2) Evaluation — how they compare you to alternatives, (3) Purchase — how they buy, (4) Delivery — how they receive value, (5) After-sales — how you support them afterward.",
      "Channels are either your own (website, sales team) or partner-owned (distributors, resellers) — own channels have higher margins but cost more; partner channels extend reach but reduce margin. The right answer is usually a mix.",
      "A channel that doesn't fit into how the customer naturally behaves will underperform a mediocre channel that meets them where they already are — design around customer routines, not your preferences.",
      "Check coherence: a premium value proposition delivered through a discount channel undermines itself; a self-service channel can't deliver dedicated personal assistance.",
    ],
    prompts: [
      {
        starter: "Across the five phases, our customer journey works like this: they discover us through... evaluate us via... buy through... receive value by... and get support from...",
        example: "They discover us through Instagram ads and freelancer community posts, evaluate us via a free-tier dashboard with sample data, buy through self-service checkout on our website, receive value by logging into their personalised benchmarking dashboard, and get support from in-app chat and a knowledge base.",
      },
      {
        starter: "Our channels are [own / partner / mixed] because...",
        example: "Our channels are own-direct because we sell a digital product — no physical distribution needed. This gives us full control over the customer experience and higher margins, which matters for a R199/month subscription.",
      },
      {
        starter: "The weakest phase in our channel is [awareness / evaluation / purchase / delivery / after-sales] because...",
        example: "The weakest phase is evaluation — freelancers can see the free tier but can't preview the Pro benchmarks before paying, so they're making a leap of faith. We plan to add a 7-day Pro trial to close this gap.",
      },
    ],
  },
  {
    id: "customerRelationships",
    title: "Customer Relationships",
    sequence: 4,
    question: "How do you acquire, retain, and grow customers?",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-500",
    tips: [
      "Osterwalder identifies six types: personal assistance, dedicated rep, self-service, automated services, communities, and co-creation — which fits your segment?",
      "Different segments may need different relationship types — a freemium user expects self-service while an enterprise buyer expects a dedicated rep.",
      "Does your relationship choice match your cost structure? High-touch relationships cost more per customer.",
      "Can you layer relationships — e.g. self-service for onboarding, then community for retention, then personal assistance for upselling?",
    ],
    prompts: [
      {
        starter: "To [acquire / retain / upsell] customers, we use a [relationship type] approach where...",
        example: "To acquire customers, we use a self-service approach where users sign up for a free tier, explore benchmarking data on their own, and upgrade when they see the value.",
      },
      {
        starter: "In practice, this relationship works by...",
        example: "Automated onboarding emails guide new users through three key features in their first week, then a dashboard tracks their engagement and triggers personalised nudges.",
      },
      {
        starter: "This relationship approach fits our model because...",
        example: "Self-service keeps our cost per acquisition under R15, which supports our freemium pricing — dedicated reps would cost 10x more and break our unit economics.",
      },
    ],
  },
  {
    id: "revenueStreams",
    title: "Revenue Streams",
    sequence: 5,
    question: "How does your business earn revenue?",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-500",
    tips: [
      "Osterwalder identifies seven revenue mechanisms: asset sale, usage fee, subscription, lending/renting/leasing, licensing, brokerage fees, and advertising — which ones fit your value proposition?",
      "Revenue has two fundamental types: transaction (one-time) and recurring (ongoing) — recurring revenue is more predictable but requires continuous value delivery.",
      "Pricing can be fixed (list price, feature-dependent, volume-dependent) or dynamic (negotiation, yield management, auctions) — your choice shapes customer expectations.",
      "Different customer segments may warrant different mechanisms — e.g. subscription for individuals, licensing for enterprises, usage fees for occasional users.",
    ],
    prompts: [
      {
        starter: "Customers willingly pay for [value] because...",
        example: "Customers willingly pay for real-time pricing benchmarks because guessing their rates costs them thousands in lost revenue or underbid projects each year.",
      },
      {
        starter: "We capture this value through a [mechanism] model where...",
        example: "We capture this value through a subscription model where users pay R199/month for unlimited benchmark reports — this gives us predictable recurring revenue and aligns with continuous data updates.",
      },
      {
        starter: "Our pricing approach is [fixed / dynamic] because...",
        example: "Our pricing approach is fixed (three published tiers: Free, Pro at R199/month, Team at R499/month) because freelancers need predictable costs — but we use volume-dependent discounts for agencies buying 10+ seats.",
      },
    ],
  },
  {
    id: "keyResources",
    title: "Key Resources",
    sequence: 6,
    question: "What critical assets must you have or control to make this business model work?",
    icon: Box,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-500",
    tips: [
      "Osterwalder identifies four resource categories: physical (facilities, equipment, logistics), intellectual (brands, patents, proprietary data, copyrights), human (key talent, expertise), and financial (cash, credit lines, vendor financing) — which categories dominate your model?",
      "Trace backwards: what resources do your value proposition, channels, customer relationships, and revenue streams each require you to possess or control?",
      "You don't need to own every resource — key resources can come from partners. But if a critical resource depends on a partner, that partnership becomes structurally essential, not optional.",
      "Rank resources by vulnerability: a patent is legally protected, a customer database built over years is hard to replicate, but a skilled team can be poached and a facility can be copied by a funded competitor.",
    ],
    prompts: [
      {
        starter: "Our most critical resource is [physical / intellectual / human / financial]: specifically...",
        example: "Our most critical resource is intellectual: a proprietary database of freelance pricing data across 50+ industries, built from thousands of real contracts over two years — this is our core competitive moat and cannot be easily replicated.",
      },
      {
        starter: "This resource enables our [value proposition / channels / relationships / revenue] because...",
        example: "This resource enables our value proposition because the accuracy and depth of our benchmarks is what customers pay for — without the database, our pricing tool would just be a calculator with no data behind it.",
      },
      {
        starter: "We [own / lease / acquire from a partner] this resource, and its main vulnerability is...",
        example: "We own this resource outright, and its main vulnerability is data freshness — if we stopped actively collecting new contract data, the benchmarks would become stale within 3-6 months and users would lose trust.",
      },
    ],
  },
  {
    id: "keyActivities",
    title: "Key Activities",
    sequence: 7,
    question: "What critical actions make your business model work?",
    icon: Cog,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-500",
    tips: [
      "Osterwalder identifies three categories: production (making/delivering a product), problem solving (bespoke solutions for individual customers), and platform/network (managing an ecosystem) — which dominates your model?",
      "Trace backwards from your other blocks: what activities do your value proposition, channels, customer relationships, and revenue streams each require?",
      "The test for a Key Activity: if you stopped doing it, would your specific business model break? Generic tasks (accounting, invoicing) don't belong here.",
      "Cross-check: do you have the Key Resources to perform these activities, or should a Key Partner handle some of them instead?",
    ],
    prompts: [
      {
        starter: "Our model is primarily [production / problem solving / platform] because the critical action is...",
        example: "Our model is primarily platform because the critical action is maintaining a real-time data pipeline that collects, validates, and serves freelance pricing benchmarks across 50+ industries.",
      },
      {
        starter: "Without this activity, our [value proposition / channels / customer relationships / revenue] would break because...",
        example: "Without continuous data validation, our benchmarks would become stale within weeks — users would lose trust in the numbers and cancel their subscriptions.",
      },
      {
        starter: "We [do / outsource] this activity because...",
        example: "We do this in-house because data accuracy is our core differentiator — outsourcing it would mean losing control over the quality our customers pay for.",
      },
    ],
  },
  {
    id: "keyPartnerships",
    title: "Key Partnerships",
    sequence: 8,
    question: "What can't you — or shouldn't you — do alone, and who fills that gap?",
    icon: Handshake,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-500",
    tips: [
      "Osterwalder identifies four partnership types: strategic alliances between non-competitors, coopetition (partnerships between competitors), joint ventures to develop new businesses, and buyer-supplier relationships to assure reliable supplies.",
      "Three motivations drive partnerships: optimisation and economy of scale (someone else does it cheaper), reduction of risk and uncertainty (sharing the bet), and acquisition of resources or activities you can't build yourself.",
      "Link this block to what you've already written — go to your Key Resources and ask: which do we not own? Go to Key Activities and ask: which are we not performing ourselves? Every answer points to a partnership.",
      "Stress-test: if this partner disappeared, doubled their price, or became a competitor — would your model break? If yes, consider alternatives, contractual protections, or a path to internalising.",
    ],
    prompts: [
      {
        starter: "Our key partner is [name/type] who provides [Key Resource / Key Activity] that we cannot do ourselves because...",
        example: "Our key partner is freelance platforms (Upwork, Fiverr) who provide anonymised contract pricing data that we cannot collect ourselves because individual freelancers won't share rates directly, but platforms have this data at scale.",
      },
      {
        starter: "This is a [strategic alliance / coopetition / joint venture / buyer-supplier] partnership motivated by [optimisation / risk reduction / capability acquisition]...",
        example: "This is a buyer-supplier partnership motivated by capability acquisition — we buy structured data feeds from platforms because building our own data collection network would take years and millions we don't have.",
      },
      {
        starter: "If this partner disappeared tomorrow, our model would [break / degrade / survive] because...",
        example: "If this partner disappeared, our model would degrade significantly — we'd lose 60% of our data sources. To mitigate this, we partner with three platforms rather than one and are building direct freelancer surveys as a backup channel.",
      },
    ],
  },
  {
    id: "costStructure",
    title: "Cost Structure",
    sequence: 9,
    question: "What does your operating engine cost, and does that spending make sense?",
    icon: CreditCard,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-500",
    tips: [
      "This block comes last for a reason — look back at your Key Resources, Key Activities, and Key Partnerships and ask: what does all of this cost?",
      "Your model is either cost-driven (minimise costs, lean operations, maximum automation) or value-driven (premium experience, cost is secondary) — which are you, and does the rest of your canvas match?",
      "Four characteristics to examine: fixed costs (stay constant), variable costs (scale with volume), economies of scale (cheaper per unit as you grow), and economies of scope (same infrastructure serves multiple products/segments).",
      "Cost Structure reveals contradictions — if your most expensive activities don't support your most important value propositions, something is misaligned.",
    ],
    prompts: [
      {
        starter: "Our model is [cost-driven / value-driven] because...",
        example: "Our model is cost-driven because we compete on affordable access to pricing data — so we automate data collection, use self-service onboarding, and avoid dedicated account managers.",
      },
      {
        starter: "Our most expensive [Key Resource / Key Activity] is... and it costs roughly...",
        example: "Our most expensive Key Resource is the data engineering team (3 engineers at ~R45k/month each = ~R135k/month) — this is fixed and stays the same whether we have 100 or 10,000 users.",
      },
      {
        starter: "As we scale, our costs [improve / stay flat / grow] because...",
        example: "As we scale, our costs improve because server and data costs are variable but grow slowly (economies of scale), while our fixed team cost stays constant — so cost per user drops significantly with growth.",
      },
    ],
  },
];

const INITIAL_CANVAS_DATA: CanvasData = {
  customerSegments: [],
  valuePropositions: [],
  channels: [],
  customerRelationships: [],
  revenueStreams: [],
  keyResources: [],
  keyActivities: [],
  keyPartnerships: [],
  costStructure: [],
};

const STORAGE_KEY = "business-model-canvas";

export default function BusinessModelCanvas() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
  }, []);

  const [companyName, setCompanyName] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyNameSet, setCompanyNameSet] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentView, setCurrentView] = useState<ViewType>("guided");
  const [showTips, setShowTips] = useState(true);
  const [canvasData, setCanvasData] = useState<CanvasData>(INITIAL_CANVAS_DATA);
  const [isEditingCompanyName, setIsEditingCompanyName] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.companyNameSet) setCompanyNameSet(data.companyNameSet);
        if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
        if (data.canvasData) setCanvasData(data.canvasData);
        // If localStorage has a name we're done — no profile fetch needed
        if (data.companyName && data.companyNameSet) return;
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
    // Fallback: load business name from Supabase profile so the prompt
    // doesn't re-appear after every sign-out / sign-in cycle
    profileService.getUserProfile().then((profile) => {
      const name = (profile as any)?.business_name;
      if (name) {
        setCompanyName(name);
        setCompanyNameSet(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const data = {
      companyName,
      companyNameSet,
      currentStep,
      canvasData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [companyName, companyNameSet, currentStep, canvasData]);

  const currentSection = SECTIONS[currentStep];

  const completedSections = useMemo(() => {
    return SECTIONS.filter((section) =>
      canvasData[section.id].some((item) => item.trim().length > 0)
    ).length;
  }, [canvasData]);

  const totalItems = useMemo(() => {
    return Object.values(canvasData).reduce(
      (sum, items) => sum + items.filter((item) => item.trim().length > 0).length,
      0
    );
  }, [canvasData]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedSections / 9) * 100);
  }, [completedSections]);

  const finalizeMutation = useMutation({
    mutationFn: async (data: {
      companyName: string;
      canvasData: CanvasData;
      completedSections: number;
      totalItems: number;
      completionPercentage: number;
      aiAnalysis: AIAnalysis | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("artifacts").insert({
        user_id: user.id,
        tool_type: "bmc",
        title: `${data.companyName || "Untitled"} — Business Model Canvas`,
        content: {
          canvas: data.canvasData,
          statistics: {
            completedSections: data.completedSections,
            totalItems: data.totalItems,
            completionPercentage: data.completionPercentage,
          },
          analysis: data.aiAnalysis,
          savedAt: new Date().toISOString(),
        },
        version: 1,
        status: "complete",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setIsFinalized(true);
      toast({
        title: "BMC Finalized",
        description: "Your Business Model Canvas has been saved to the database",
      });
    },
    onError: (error) => {
      console.error("Error finalizing BMC:", error);
      toast({
        title: "Error",
        description: "Failed to save your Business Model Canvas",
        variant: "destructive",
      });
    },
  });

  const handleFinalize = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your canvas to the database",
        variant: "destructive",
      });
      return;
    }
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name before finalizing",
        variant: "destructive",
      });
      return;
    }

    finalizeMutation.mutate({
      companyName: companyName.trim(),
      canvasData: filteredCanvasData as CanvasData,
      completedSections,
      totalItems,
      completionPercentage: progressPercentage,
      aiAnalysis,
    });
  }, [companyName, isAuthenticated, canvasData, completedSections, totalItems, progressPercentage, aiAnalysis, finalizeMutation, toast]);

  const analyzeCanvasMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/analyze-bmc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || "Untitled Business",
          canvasData: filteredCanvasData,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      return res.json() as Promise<AIAnalysis>;
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      setAiAnalysisError(null);
      toast({ title: "Analysis complete", description: "AI insights have been generated for your canvas" });
      // Auto-save full canvas + analysis to database
      const saveToDb = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return; // silently skip if not authenticated
          await supabase.from("artifacts").insert({
            user_id: user.id,
            tool_type: "bmc",
            title: `${companyName || "Untitled"} — Business Model Canvas`,
            content: {
              canvas: filteredCanvasData,
              statistics: {
                completedSections,
                totalItems,
                completionPercentage: progressPercentage,
              },
              analysis: data,
              savedAt: new Date().toISOString(),
            },
            version: 1,
            status: "complete",
          });
          setIsFinalized(true);
        } catch (e) {
          console.error("Auto-save after analysis failed:", e);
        }
      };
      saveToDb();
    },
    onError: (error) => {
      setAiAnalysisError(error instanceof Error ? error.message : "Analysis failed");
      toast({ title: "Analysis failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    },
  });

  const handleAnalyzeCanvas = useCallback(() => {
    analyzeCanvasMutation.mutate();
  }, [analyzeCanvasMutation]);

  const updateCanvasField = useCallback(
    (sectionId: SectionId, promptIndex: number, value: string) => {
      setCanvasData((prev) => {
        const current = [...prev[sectionId]];
        while (current.length <= promptIndex) current.push("");
        current[promptIndex] = value;
        return { ...prev, [sectionId]: current };
      });
    },
    []
  );

  const clearCanvasField = useCallback(
    (sectionId: SectionId, promptIndex: number) => {
      setCanvasData((prev) => {
        const current = [...prev[sectionId]];
        if (promptIndex < current.length) {
          current[promptIndex] = "";
        }
        return { ...prev, [sectionId]: current };
      });
    },
    []
  );

  const handleCompanyNameSubmit = useCallback(() => {
    if (companyNameInput.trim()) {
      const name = companyNameInput.trim();
      setCompanyName(name);
      setCompanyNameSet(true);
      setIsEditingCompanyName(false);
      // Persist to profile so it survives sign-out
      profileService.upsertUserProfile({ business_name: name } as any).catch(() => {});
    }
  }, [companyNameInput]);

  const handleSkipCompanyName = useCallback(() => {
    setCompanyNameSet(true);
  }, []);

  const handleReset = useCallback(() => {
    setCompanyName("");
    setCompanyNameInput("");
    setCompanyNameSet(false);
    setCurrentStep(0);
    setCurrentView("guided");
    setCanvasData(INITIAL_CANVAS_DATA);
    setIsEditMode(true);
    setAiAnalysis(null);
    setAiAnalysisError(null);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Canvas reset",
      description: "All data has been cleared",
    });
  }, [toast]);

  const SAMPLE_CANVAS_DATA: CanvasData = {
    customerSegments: [
      "Our target customer is a freelance designer (25-45, working solo or in a micro-studio) who currently struggles with pricing projects because she has no reliable market data — she guesses rates based on outdated blog posts and peer gossip.",
      "Our segment type is niche because we serve only freelance creatives who sell project-based services — not agencies, not salaried designers, not other freelance professions.",
      "We chose solo freelancers over design agencies because freelancers have no procurement team to negotiate rates, making the pain more acute and willingness to pay for a self-service tool much higher.",
    ],
    valuePropositions: [
      "For freelance designers, the biggest unresolved pain is spending hours guessing project rates — and we address it by giving them real-time benchmarks from thousands of actual freelance contracts.",
      "Our proposition is improved and rests on accessibility (data previously only agencies could afford), convenience (instant reports vs. manual research), and cost reduction (saves hours per project).",
      "A customer would switch from googling 'freelance design rates' because generic articles give national averages, while we show rates filtered by skill, region, and project type — updated weekly.",
    ],
    channels: [
      "They discover us through Instagram ads and freelancer community posts, evaluate us via a free-tier dashboard with sample data, buy through self-service checkout, receive value via their personalised dashboard, and get support from in-app chat.",
      "Our channels are own-direct because we sell a digital product — no physical distribution needed. Full control over customer experience and higher margins for a R199/month subscription.",
      "The weakest phase is evaluation — freelancers can see the free tier but can't preview Pro benchmarks before paying. We plan to add a 7-day Pro trial.",
    ],
    customerRelationships: [
      "To acquire customers, we use a self-service approach where users sign up for a free tier, explore benchmarking data on their own, and upgrade when they see the value.",
      "Automated onboarding emails guide new users through three key features in their first week, then a dashboard tracks engagement and triggers personalised nudges.",
      "Self-service keeps our cost per acquisition under R15, which supports our freemium pricing — dedicated reps would cost 10x more and break our unit economics.",
    ],
    revenueStreams: [
      "Customers willingly pay for real-time pricing benchmarks because guessing their rates costs them thousands in lost revenue or underbid projects each year.",
      "We capture this value through a subscription model where users pay R199/month for unlimited benchmark reports — predictable recurring revenue aligned with continuous data updates.",
      "Our pricing approach is fixed (Free, Pro at R199/month, Team at R499/month) because freelancers need predictable costs — with volume discounts for agencies buying 10+ seats.",
    ],
    keyResources: [
      "Our most critical resource is intellectual: a proprietary database of freelance pricing data across 50+ industries, built from thousands of real contracts over two years.",
      "This resource enables our value proposition because the accuracy and depth of our benchmarks is what customers pay for — without it, our tool is just a calculator with no data.",
      "We own this resource outright, and its main vulnerability is data freshness — if we stopped collecting new contract data, benchmarks would become stale within 3-6 months.",
    ],
    keyActivities: [
      "Our model is primarily platform because the critical action is maintaining a real-time data pipeline that collects, validates, and serves freelance pricing benchmarks across 50+ industries.",
      "Without continuous data validation, our benchmarks would become stale within weeks — users would lose trust in the numbers and cancel their subscriptions.",
      "We do this in-house because data accuracy is our core differentiator — outsourcing it would mean losing control over the quality our customers pay for.",
    ],
    keyPartnerships: [
      "Our key partner is freelance platforms (Upwork, Fiverr) who provide anonymised contract pricing data that we cannot collect ourselves because individual freelancers won't share rates directly.",
      "This is a buyer-supplier partnership motivated by capability acquisition — we buy structured data feeds because building our own collection network would take years.",
      "If this partner disappeared, our model would degrade significantly — we'd lose 60% of our data sources. We partner with three platforms and are building direct surveys as backup.",
    ],
    costStructure: [
      "Our model is cost-driven because we compete on affordable access to pricing data — we automate data collection, use self-service onboarding, and avoid dedicated account managers.",
      "Our most expensive Key Resource is the data engineering team (3 engineers at ~R45k/month each = ~R135k/month) — this is fixed regardless of user count.",
      "As we scale, our costs improve because server and data costs grow slowly (economies of scale), while our fixed team cost stays constant — cost per user drops significantly.",
    ],
  };

  const handleLoadSample = useCallback(() => {
    setCompanyName("RateMyRate");
    setCompanyNameSet(true);
    setCanvasData(SAMPLE_CANVAS_DATA);
    setCurrentView("dashboard");
    toast({
      title: "Sample canvas loaded",
      description: "A complete example canvas has been loaded for RateMyRate",
    });
  }, [toast]);

  const filteredCanvasData = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    for (const key of Object.keys(canvasData) as SectionId[]) {
      filtered[key] = canvasData[key].filter((item) => item.trim().length > 0);
    }
    return filtered;
  }, [canvasData]);

  const handleExport = useCallback(() => {
    const exportData = {
      companyName: companyName || "Untitled Business",
      exportDate: new Date().toISOString(),
      canvas: filteredCanvasData,
      statistics: {
        completedSections,
        totalItems,
        completionPercentage: progressPercentage,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bmc-${companyName?.replace(/\s+/g, "-").toLowerCase() || "canvas"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Export successful",
      description: "Your canvas has been exported as JSON",
    });
  }, [companyName, filteredCanvasData, completedSections, totalItems, progressPercentage, toast]);

  const handleExportWord = useCallback(async () => {
    const businessName = companyName || "Untitled Business";
    const exportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const createSectionContent = (section: typeof SECTIONS[0], items: string[]) => {
      const paragraphs: Paragraph[] = [
        new Paragraph({
          text: `${section.sequence}. ${section.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: section.question,
              italics: true,
              color: "666666",
            }),
          ],
          spacing: { after: 200 },
        }),
      ];

      if (items.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "No items defined yet",
                italics: true,
                color: "999999",
              }),
            ],
            spacing: { after: 200 },
          })
        );
      } else {
        items.forEach((item) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${item}`,
              spacing: { after: 100 },
            })
          );
        });
      }

      return paragraphs;
    };

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "Business Model Canvas",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: businessName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${exportDate}`,
                  color: "666666",
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Completion: ${completedSections}/9 sections | ${totalItems} total items | ${progressPercentage}% complete`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              border: {
                bottom: {
                  color: "CCCCCC",
                  space: 10,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),
            ...createSectionContent(SECTIONS[0], canvasData.customerSegments.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[1], canvasData.valuePropositions.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[2], canvasData.channels.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[3], canvasData.customerRelationships.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[4], canvasData.revenueStreams.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[5], canvasData.keyResources.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[6], canvasData.keyActivities.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[7], canvasData.keyPartnerships.filter(s => s.trim())),
            ...createSectionContent(SECTIONS[8], canvasData.costStructure.filter(s => s.trim())),
            // ── AI Analysis (if available) ──────────────────────────────
            ...(aiAnalysis ? [
              new Paragraph({
                text: "",
                spacing: { before: 400 },
                border: {
                  bottom: {
                    color: "CCCCCC",
                    space: 10,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
              new Paragraph({
                text: "AI Canvas Analysis",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 300 },
              }),
              new Paragraph({
                text: "Overall Assessment",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: aiAnalysis.overallAssessment,
                spacing: { after: 300 },
              }),
              ...(aiAnalysis.strengths.length > 0 ? [
                new Paragraph({
                  text: "Strengths",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                ...aiAnalysis.strengths.map((s) =>
                  new Paragraph({ text: `✓ ${s}`, spacing: { after: 80 } })
                ),
              ] : []),
              ...(aiAnalysis.areasToImprove.length > 0 ? [
                new Paragraph({
                  text: "Areas to Develop",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                ...aiAnalysis.areasToImprove.map((a) =>
                  new Paragraph({ text: `▲ ${a}`, spacing: { after: 80 } })
                ),
              ] : []),
              ...(aiAnalysis.coherenceChecks.length > 0 ? [
                new Paragraph({
                  text: "Cross-Block Coherence",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                ...aiAnalysis.coherenceChecks.map((c) =>
                  new Paragraph({ text: `→ ${c}`, spacing: { after: 80 } })
                ),
              ] : []),
            ] : []),
          ],
        },
      ],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `bmc-${businessName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.docx`
      );
      toast({
        title: "Export successful",
        description: "Your canvas has been exported as a Word document",
      });
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your canvas",
        variant: "destructive",
      });
    }
  }, [companyName, canvasData, completedSections, totalItems, progressPercentage, aiAnalysis, toast]);

  const getInsights = useMemo(() => {
    const strengths: string[] = [];
    const areasToImprove: string[] = [];

    const filterFilled = (items: string[]) => items.filter((item) => item.trim().length > 0);
    const customerSegments = filterFilled(canvasData.customerSegments);
    const valuePropositions = filterFilled(canvasData.valuePropositions);
    const channels = filterFilled(canvasData.channels);
    const customerRelationships = filterFilled(canvasData.customerRelationships);
    const revenueStreams = filterFilled(canvasData.revenueStreams);
    const keyResources = filterFilled(canvasData.keyResources);
    const keyActivities = filterFilled(canvasData.keyActivities);
    const keyPartnerships = filterFilled(canvasData.keyPartnerships);
    const costStructure = filterFilled(canvasData.costStructure);

    // --- Strengths ---
    if (valuePropositions.length >= 2 && customerSegments.length >= 2) {
      strengths.push("Your value proposition is clearly matched to defined customer segments — a strong commercial foundation.");
    }
    if (revenueStreams.length >= 2 && costStructure.length >= 2) {
      strengths.push("You have both revenue streams and cost structure defined — your financial model has a solid base.");
    }
    if (channels.length >= 2 && customerRelationships.length >= 1) {
      strengths.push("You've described how you reach customers and maintain relationships — this supports sales and retention.");
    }
    if (keyActivities.length >= 2 && keyResources.length >= 2) {
      strengths.push("Your operational backbone (key activities + key resources) is taking shape — this shows operational awareness.");
    }
    if (keyPartnerships.length >= 1) {
      strengths.push(`You've identified ${keyPartnerships.length} key partner${keyPartnerships.length > 1 ? "s" : ""} — leveraging external expertise reduces risk.`);
    }
    const filledSections = Object.values(canvasData).filter(a => a.length > 0).length;
    if (filledSections >= 7) {
      strengths.push("Over 75% of your canvas is complete — you have a well-developed business model overview.");
    }

    // --- Areas to Improve ---
    if (valuePropositions.length === 0) {
      areasToImprove.push("Define your Value Proposition — this is the heart of your business model and should come first.");
    }
    if (customerSegments.length === 0) {
      areasToImprove.push("Add your Customer Segments — without knowing your audience, it's hard to design the right solution.");
    }
    if (revenueStreams.length === 0) {
      areasToImprove.push("Revenue Streams is empty — describe how your business will make money (subscriptions, fees, sales, etc.).");
    }
    if (costStructure.length === 0) {
      areasToImprove.push("Cost Structure is empty — list your main costs so you can assess profitability.");
    }
    if (channels.length === 0) {
      areasToImprove.push("Add your Channels — explain how customers will find, buy, and receive your product or service.");
    }
    if (keyActivities.length === 0) {
      areasToImprove.push("Key Activities is empty — describe what your business must do every day to deliver its value.");
    }
    if (keyResources.length === 0) {
      areasToImprove.push("Key Resources is empty — list the assets most essential to your business (people, IP, tech, funds).");
    }
    if (revenueStreams.length > 0 && costStructure.length === 0) {
      areasToImprove.push("You have revenue streams but no costs defined — add your Cost Structure to assess your margin.");
    }
    if (valuePropositions.length > 0 && channels.length === 0) {
      areasToImprove.push("Great value proposition — now add Channels to explain how customers will access it.");
    }

    // If canvas is empty, give a starter nudge
    if (strengths.length === 0 && areasToImprove.length === 0) {
      areasToImprove.push("Start with Customer Segments and Value Proposition — these anchor your entire business model.");
    }

    return { strengths, areasToImprove };
  }, [canvasData]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Link href="/portal" asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-sm">Business Model Canvas</span>
            {companyName && !isEditingCompanyName && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium" data-testid="text-company-name">{companyName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setCompanyNameInput(companyName);
                      setIsEditingCompanyName(true);
                    }}
                    data-testid="button-edit-company"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {isEditingCompanyName && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCompanyNameSubmit()}
                  className="h-8 w-40"
                  autoFocus
                  data-testid="input-company-name-edit"
                />
                <Button size="sm" onClick={handleCompanyNameSubmit} data-testid="button-save-company">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingCompanyName(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-lg border p-1 sm:flex">
              <Button
                variant={currentView === "guided" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("guided")}
                className="gap-1.5"
                data-testid="button-view-guided"
              >
                <List className="h-4 w-4" />
                <span className="hidden md:inline">Guided</span>
              </Button>
              <Button
                variant={currentView === "canvas" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("canvas")}
                className="gap-1.5"
                data-testid="button-view-canvas"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden md:inline">Canvas</span>
              </Button>
              <Button
                variant={currentView === "dashboard" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("dashboard")}
                className="gap-1.5"
                data-testid="button-view-dashboard"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="gap-1.5 hidden sm:flex"
              data-testid="button-load-sample"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="hidden md:inline">Example</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              data-testid="button-reset"
              aria-label="Reset canvas"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {currentView === "guided" && (
          <GuidedView
            companyNameSet={companyNameSet}
            companyNameInput={companyNameInput}
            setCompanyNameInput={setCompanyNameInput}
            handleCompanyNameSubmit={handleCompanyNameSubmit}
            handleSkipCompanyName={handleSkipCompanyName}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            currentSection={currentSection}
            showTips={showTips}
            setShowTips={setShowTips}
            canvasData={canvasData}
            updateCanvasField={updateCanvasField}
            clearCanvasField={clearCanvasField}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            progressPercentage={progressPercentage}
            completedSections={completedSections}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === "canvas" && (
          <CanvasView canvasData={canvasData} />
        )}

        {currentView === "dashboard" && (
          <DashboardView
            companyName={companyName}
            canvasData={canvasData}
            completedSections={completedSections}
            totalItems={totalItems}
            progressPercentage={progressPercentage}
            insights={getInsights}
            handleExport={handleExport}
            handleExportWord={handleExportWord}
            handleFinalize={handleFinalize}
            isFinalized={isFinalized}
            isFinalizing={finalizeMutation.isPending}
            setCurrentView={setCurrentView}
            aiAnalysis={aiAnalysis}
            aiAnalysisError={aiAnalysisError}
            isAnalyzing={analyzeCanvasMutation.isPending}
            handleAnalyzeCanvas={handleAnalyzeCanvas}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
    </div>
  );
}

interface GuidedViewProps {
  companyNameSet: boolean;
  companyNameInput: string;
  setCompanyNameInput: (value: string) => void;
  handleCompanyNameSubmit: () => void;
  handleSkipCompanyName: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  currentSection: SectionConfig;
  showTips: boolean;
  setShowTips: (show: boolean) => void;
  canvasData: CanvasData;
  updateCanvasField: (sectionId: SectionId, promptIndex: number, value: string) => void;
  clearCanvasField: (sectionId: SectionId, promptIndex: number) => void;
  isEditMode: boolean;
  setIsEditMode: (editing: boolean) => void;
  progressPercentage: number;
  completedSections: number;
  setCurrentView: (view: ViewType) => void;
}

function PromptTextarea({
  prompt,
  value,
  promptIndex,
  isEditMode,
  onChange,
  onClear,
}: {
  prompt: PromptConfig;
  value: string;
  promptIndex: number;
  isEditMode: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const handleAutoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const charCount = value.length;
  const maxChars = prompt.maxChars;
  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isEditMode ? (
          <PenLine className="h-3.5 w-3.5 text-primary shrink-0" />
        ) : (
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <label className="text-sm font-medium text-foreground">
          {prompt.starter}
        </label>
      </div>
      <div className="relative">
        <Textarea
          placeholder={`e.g. ${prompt.example}`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleAutoResize(e);
          }}
          readOnly={!isEditMode}
          className={`min-h-[60px] resize-none transition-all ${
            isEditMode
              ? "ring-2 ring-primary/20 border-primary/40 bg-background focus:ring-primary/40"
              : "bg-muted/50 border-muted text-muted-foreground cursor-default"
          } ${isOverLimit ? "ring-2 ring-destructive/40 border-destructive/40" : ""}`}
          data-testid={`textarea-prompt-${promptIndex}`}
        />
        {value.trim() && isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onClear}
            data-testid={`button-clear-prompt-${promptIndex}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {maxChars && (
        <div className={`text-xs text-right ${
          isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
        }`}>
          {charCount} / {maxChars}
        </div>
      )}
    </div>
  );
}

function GuidedView({
  companyNameSet,
  companyNameInput,
  setCompanyNameInput,
  handleCompanyNameSubmit,
  handleSkipCompanyName,
  currentStep,
  setCurrentStep,
  currentSection,
  showTips,
  setShowTips,
  canvasData,
  updateCanvasField,
  clearCanvasField,
  isEditMode,
  setIsEditMode,
  progressPercentage,
  completedSections,
  setCurrentView,
}: GuidedViewProps) {
  if (!companyNameSet) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img
                src={edmecaLogo}
                alt="EdMeCa Online Academy"
                className="h-16 object-contain"
                data-testid="img-welcome-logo"
              />
            </div>
            <CardTitle className="text-2xl">Business Model Canvas Builder</CardTitle>
            <p className="text-muted-foreground">
              Start by entering your company or project name
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter company name..."
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCompanyNameSubmit()}
              className="text-center text-lg"
              data-testid="input-company-name"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCompanyNameSubmit}
                disabled={!companyNameInput.trim()}
                data-testid="button-continue"
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkipCompanyName}
                data-testid="button-skip"
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionItems = canvasData[currentSection.id];
  const filledCount = sectionItems.filter((item) => item.trim().length > 0).length;
  const Icon = currentSection.icon;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span data-testid="text-progress">{completedSections}/9 sections completed</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border p-1 gap-1" data-testid="tab-bar">
        {TABS.map((tab) => {
          const tabSectionIndices = tab.sectionIds.map((id) => SECTIONS.findIndex((s) => s.id === id));
          const isActiveTab = tabSectionIndices.includes(currentStep);
          const filledInTab = tab.sectionIds.filter((id) =>
            canvasData[id].some((item) => item.trim().length > 0)
          ).length;
          return (
            <Button
              key={tab.id}
              variant={isActiveTab ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentStep(tabSectionIndices[0])}
              className="flex-1 gap-1.5"
              data-testid={`tab-${tab.id}`}
            >
              <span className="font-medium">{tab.label}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {filledInTab}/{tab.sectionIds.length}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Section buttons within active tab */}
      {(() => {
        const activeTab = TABS.find((tab) =>
          tab.sectionIds.map((id) => SECTIONS.findIndex((s) => s.id === id)).includes(currentStep)
        ) || TABS[0];
        return (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              <span className="font-semibold">{activeTab.label}</span> — {activeTab.description}
            </p>
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
              {activeTab.sectionIds.map((sectionId) => {
                const index = SECTIONS.findIndex((s) => s.id === sectionId);
                const section = SECTIONS[index];
                const hasItems = canvasData[section.id].some((item) => item.trim().length > 0);
                const itemCount = canvasData[section.id].filter((item) => item.trim().length > 0).length;
                const SectionIcon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={index === currentStep ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(index)}
                    className="relative shrink-0 gap-1.5"
                    data-testid={`button-section-${section.id}`}
                  >
                    <SectionIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.sequence}. {section.title}</span>
                    {hasItems && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                      >
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })()}

      <Card className={`border-2 ${currentSection.borderColor}`}>
        <CardHeader className={`${currentSection.bgColor} rounded-t-lg`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm ${currentSection.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl" data-testid="text-section-title">{currentSection.title}</CardTitle>
                <p className="mt-1 text-muted-foreground" data-testid="text-section-question">
                  {currentSection.question}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {filledCount > 0 && (
                <Badge variant="secondary" data-testid="badge-item-count">
                  {filledCount} / {currentSection.prompts.length}
                </Badge>
              )}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="gap-1.5"
                data-testid="button-toggle-edit"
              >
                {isEditMode ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Editing</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Locked</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Collapsible open={showTips} onOpenChange={setShowTips}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between" data-testid="button-toggle-tips">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Guiding questions</span>
                </div>
                {showTips ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-4">
                {currentSection.tips.map((tip, index) => (
                  <p key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-primary">•</span>
                    {tip}
                  </p>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-5">
            {currentSection.prompts.map((prompt, promptIndex) => (
              <PromptTextarea
                key={`${currentSection.id}-${promptIndex}`}
                prompt={prompt}
                value={sectionItems[promptIndex] || ""}
                promptIndex={promptIndex}
                isEditMode={isEditMode}
                onChange={(value) => updateCanvasField(currentSection.id, promptIndex, value)}
                onClear={() => clearCanvasField(currentSection.id, promptIndex)}
              />
            ))}
          </div>

          {(() => {
            // Navigation order follows tab grouping
            const orderedIndices = TABS.flatMap((tab) =>
              tab.sectionIds.map((id) => SECTIONS.findIndex((s) => s.id === id))
            );
            const posInOrder = orderedIndices.indexOf(currentStep);
            const isFirst = posInOrder === 0;
            const isLast = posInOrder === orderedIndices.length - 1;
            const prevStep = isFirst ? -1 : orderedIndices[posInOrder - 1];
            const nextStep = isLast ? -1 : orderedIndices[posInOrder + 1];

            return (
          <div className="flex items-center justify-between gap-4 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prevStep)}
              disabled={isFirst}
              data-testid="button-previous"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            {!isLast ? (
              <Button
                onClick={() => setCurrentStep(nextStep)}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setCurrentView("dashboard")} data-testid="button-view-dashboard-final">
                <BarChart3 className="mr-1 h-4 w-4" />
                View Dashboard
              </Button>
            )}
          </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

interface CanvasViewProps {
  canvasData: CanvasData;
}

function CanvasCell({
  section,
  items,
  className = "",
}: {
  section: SectionConfig;
  items: string[];
  className?: string;
}) {
  const Icon = section.icon;
  const filledItems = items.filter((item) => item.trim().length > 0);
  const filled = filledItems.length > 0;
  return (
    <div
      className={`flex flex-col rounded-lg border bg-card overflow-hidden min-h-[120px] ${className}`}
      data-testid={`canvas-cell-${section.id}`}
    >
      {/* Accent bar */}
      <div className="h-1 w-full bg-primary/70" />
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-primary/10">
            <Icon className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-foreground leading-tight">
            <span className="text-primary/70">{section.sequence}.</span> {section.title}
          </span>
          {filled && (
            <span className="ml-auto text-[10px] font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
              {filledItems.length}
            </span>
          )}
        </div>
        <div className="flex-1">
          {!filled ? (
            <p className="text-[10px] text-muted-foreground italic leading-tight">
              {section.question}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filledItems.map((item, index) => (
                <li key={index} className="text-[11px] text-foreground/80 flex items-start gap-1">
                  <span className="text-primary mt-0.5 shrink-0">›</span>
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasView({ canvasData }: CanvasViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold" data-testid="text-canvas-title">Canvas Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">A visual map of how your business creates, delivers, and captures value.</p>
        </div>
      </div>
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-2">
        <CanvasCell section={SECTIONS[7]} items={canvasData.keyPartnerships} className="row-span-2" />
        <CanvasCell section={SECTIONS[6]} items={canvasData.keyActivities} />
        <CanvasCell section={SECTIONS[1]} items={canvasData.valuePropositions} className="row-span-2" />
        <CanvasCell section={SECTIONS[3]} items={canvasData.customerRelationships} />
        <CanvasCell section={SECTIONS[0]} items={canvasData.customerSegments} className="row-span-2" />
        <CanvasCell section={SECTIONS[5]} items={canvasData.keyResources} />
        <CanvasCell section={SECTIONS[2]} items={canvasData.channels} />
        <div className="col-span-5 grid grid-cols-5 gap-2">
          <div className="col-span-2"><CanvasCell section={SECTIONS[8]} items={canvasData.costStructure} /></div>
          <div className="col-span-3"><CanvasCell section={SECTIONS[4]} items={canvasData.revenueStreams} /></div>
        </div>
      </div>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:hidden">
        {SECTIONS.map((section) => (
          <CanvasCell key={section.id} section={section} items={canvasData[section.id]} />
        ))}
      </div>
    </div>
  );
}

interface DashboardViewProps {
  companyName: string;
  canvasData: CanvasData;
  completedSections: number;
  totalItems: number;
  progressPercentage: number;
  insights: { strengths: string[]; areasToImprove: string[] };
  handleExport: () => void;
  handleExportWord: () => void;
  handleFinalize: () => void;
  isFinalized: boolean;
  isFinalizing: boolean;
  setCurrentView: (view: ViewType) => void;
  aiAnalysis: AIAnalysis | null;
  aiAnalysisError: string | null;
  isAnalyzing: boolean;
  handleAnalyzeCanvas: () => void;
  isAuthenticated: boolean;
}

function DashboardView({
  companyName,
  canvasData,
  completedSections,
  totalItems,
  progressPercentage,
  insights,
  handleExport,
  handleExportWord,
  handleFinalize,
  isFinalized,
  isFinalizing,
  setCurrentView,
  aiAnalysis,
  aiAnalysisError,
  isAnalyzing,
  handleAnalyzeCanvas,
  isAuthenticated,
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold" data-testid="text-dashboard-title">
            {companyName || "Business Model"} Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Summary of your Business Model Canvas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportWord} data-testid="button-export-word">
            <FileText className="mr-2 h-4 w-4" />
            Export Word
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentView("guided")} data-testid="button-continue-editing">
            Continue Editing
          </Button>
          {isFinalized ? (
            <Button variant="outline" size="sm" disabled className="gap-2 text-green-600 border-green-200" data-testid="button-finalized">
              <CheckCircle className="h-4 w-4" />
              Saved
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinalize} disabled={isFinalizing} data-testid="button-finalize">
              <Save className="h-4 w-4 mr-2" />
              {isFinalizing ? "Saving..." : "Finalise & Save"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Business" value={companyName || "Not set"} icon={Building2} testId="stat-company" />
        <StatCard title="Sections Filled" value={`${completedSections} of 9`} icon={TrendingUp} testId="stat-completion" />
        <StatCard title="Total Points" value={totalItems.toString()} icon={List} testId="stat-items" />
        <StatCard title="Completeness" value={`${progressPercentage}%`} icon={BarChart3} testId="stat-strength" />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-sm text-muted-foreground">{completedSections}/9 sections</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progressPercentage < 40 ? "Keep going — you're getting started!" :
             progressPercentage < 80 ? "Good progress — a few sections left." :
             "Almost complete — great work!"}
          </p>
        </CardContent>
      </Card>

      {/* Canvas grid */}
      <div>
        <CanvasView canvasData={canvasData} />
      </div>

      {/* Section Details */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h3 className="font-serif text-lg font-semibold">Section Breakdown</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const items = canvasData[section.id].filter((item) => item.trim().length > 0);
            const Icon = section.icon;
            const filled = items.length > 0;
            return (
              <Card key={section.id} className={filled ? "border-primary/30" : ""} data-testid={`detail-card-${section.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm"><span className="text-primary/70">{section.sequence}.</span> {section.title}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      filled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {filled ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "Empty"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 italic">{section.question}</p>
                  {filled ? (
                    <ul className="space-y-1">
                      {items.slice(0, 3).map((item, index) => (
                        <li key={index} className="text-xs text-foreground/80 flex items-start gap-1">
                          <span className="text-primary shrink-0 mt-0.5">›</span>{item}
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-3">+{items.length - 3} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No items added yet.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="font-serif text-lg font-semibold">Canvas Insights</h3>
          </div>
          <Button
            size="sm"
            onClick={handleAnalyzeCanvas}
            disabled={isAnalyzing || completedSections === 0}
            className="gap-2"
            data-testid="button-analyze-canvas"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyse Canvas
              </>
            )}
          </Button>
        </div>

        {/* AI Analysis Results */}
        {aiAnalysis ? (
          <div className="space-y-4">
            {/* Overall Assessment */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium">{aiAnalysis.overallAssessment}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-strengths">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-base">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiAnalysis.strengths.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No strengths identified yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {aiAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-improvements">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base">Areas to Develop</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiAnalysis.areasToImprove.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No areas to develop identified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {aiAnalysis.areasToImprove.map((area, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coherence Checks */}
            {aiAnalysis.coherenceChecks.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">Cross-Block Coherence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiAnalysis.coherenceChecks.map((check, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Fallback: static insights when AI hasn't been triggered */
          <div>
            {aiAnalysisError && (
              <Card className="mb-4 border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-sm text-destructive">{aiAnalysisError}</p>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-strengths">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-base">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.strengths.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add more items to reveal your strengths.</p>
                  ) : (
                    <ul className="space-y-2">
                      {insights.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-improvements">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base">Areas to Develop</CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.areasToImprove.length === 0 ? (
                    <p className="text-sm text-muted-foreground">All sections are well-defined — great work!</p>
                  ) : (
                    <ul className="space-y-2">
                      {insights.areasToImprove.map((area, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Click "Analyse Canvas" above for AI-powered insights based on Osterwalder's framework.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  testId,
}: {
  title: string;
  value: string;
  icon: typeof Building2;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
