import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
const edmecaLogo = "/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";

type ViewType = "guided" | "canvas" | "dashboard";

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

interface SectionConfig {
  id: SectionId;
  title: string;
  question: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
  borderColor: string;
  tips: string[];
  quickAddItems: string[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: "customerSegments",
    title: "Customer Segments",
    question: "Who are your most important customers?",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-500",
    tips: [
      "For whom are you creating value?",
      "Who are your most important customers?",
      "Are you targeting mass market, niche, or multi-sided?",
      "What are the characteristics of your ideal customer?",
      "What jobs do they need to get done?",
    ],
    quickAddItems: [
      "Mass market consumers",
      "Enterprise companies",
      "Small businesses",
      "Young professionals",
      "Tech-savvy users",
    ],
  },
  {
    id: "valuePropositions",
    title: "Value Propositions",
    question: "What value do you deliver to customers?",
    icon: Gift,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-500",
    tips: [
      "What value do you deliver to the customer?",
      "Which customer problems are you solving?",
      "What bundles of products/services do you offer?",
      "Which customer needs are you satisfying?",
      "What makes your offer unique?",
    ],
    quickAddItems: [
      "Cost reduction",
      "Time savings",
      "Convenience",
      "Quality improvement",
      "Risk reduction",
    ],
  },
  {
    id: "channels",
    title: "Channels",
    question: "How do you reach your customers?",
    icon: Truck,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-500",
    tips: [
      "Through which channels do customers want to be reached?",
      "How are you reaching them now?",
      "How are your channels integrated?",
      "Which channels work best?",
      "Which channels are most cost-efficient?",
    ],
    quickAddItems: [
      "Website/Online store",
      "Mobile app",
      "Social media",
      "Direct sales team",
      "Partner network",
    ],
  },
  {
    id: "customerRelationships",
    title: "Customer Relationships",
    question: "What relationship does each segment expect?",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-500",
    tips: [
      "What type of relationship does each segment expect?",
      "Which ones have you established?",
      "How costly are they?",
      "How are they integrated with your business?",
      "Personal assistance or self-service?",
    ],
    quickAddItems: [
      "Personal assistance",
      "Self-service",
      "Automated services",
      "Community",
      "Co-creation",
    ],
  },
  {
    id: "revenueStreams",
    title: "Revenue Streams",
    question: "How does your business earn revenue?",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-500",
    tips: [
      "For what value are customers willing to pay?",
      "What do they currently pay for?",
      "How are they currently paying?",
      "How would they prefer to pay?",
      "How much does each revenue stream contribute?",
    ],
    quickAddItems: [
      "Subscription fees",
      "Usage fees",
      "Licensing",
      "Transaction fees",
      "Advertising",
    ],
  },
  {
    id: "keyResources",
    title: "Key Resources",
    question: "What resources do you need?",
    icon: Box,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-500",
    tips: [
      "What key resources does your value proposition require?",
      "What resources do your channels require?",
      "What about customer relationships?",
      "Physical, intellectual, human, or financial?",
      "Which resources are most important?",
    ],
    quickAddItems: [
      "Skilled workforce",
      "Technology platform",
      "Brand/reputation",
      "Intellectual property",
      "Financial capital",
    ],
  },
  {
    id: "keyActivities",
    title: "Key Activities",
    question: "What key activities does your value proposition require?",
    icon: Cog,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-500",
    tips: [
      "What key activities does your value proposition require?",
      "What activities do your channels require?",
      "Customer relationships?",
      "Revenue streams?",
      "Production, problem solving, or platform/network?",
    ],
    quickAddItems: [
      "Product development",
      "Marketing & sales",
      "Customer support",
      "Platform maintenance",
      "Quality assurance",
    ],
  },
  {
    id: "keyPartnerships",
    title: "Key Partnerships",
    question: "Who are your key partners and suppliers?",
    icon: Handshake,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-500",
    tips: [
      "Who are your key partners?",
      "Who are your key suppliers?",
      "Which key resources come from partners?",
      "Which key activities do partners perform?",
      "What motivations are there for partnerships?",
    ],
    quickAddItems: [
      "Technology providers",
      "Distribution partners",
      "Strategic alliances",
      "Outsourcing partners",
      "Industry associations",
    ],
  },
  {
    id: "costStructure",
    title: "Cost Structure",
    question: "What are the most important costs?",
    icon: CreditCard,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-500",
    tips: [
      "What are the most important costs in your business?",
      "Which key resources are most expensive?",
      "Which key activities are most expensive?",
      "Cost-driven or value-driven?",
      "Fixed costs vs variable costs?",
    ],
    quickAddItems: [
      "Personnel costs",
      "Technology infrastructure",
      "Marketing & advertising",
      "Operations & logistics",
      "Research & development",
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
  
  const [companyName, setCompanyName] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyNameSet, setCompanyNameSet] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentView, setCurrentView] = useState<ViewType>("guided");
  const [showTips, setShowTips] = useState(true);
  const [canvasData, setCanvasData] = useState<CanvasData>(INITIAL_CANVAS_DATA);
  const [itemInput, setItemInput] = useState("");
  const [isEditingCompanyName, setIsEditingCompanyName] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.companyNameSet) setCompanyNameSet(data.companyNameSet);
        if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
        if (data.canvasData) setCanvasData(data.canvasData);
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
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
    return SECTIONS.filter((section) => canvasData[section.id].length > 0).length;
  }, [canvasData]);

  const totalItems = useMemo(() => {
    return Object.values(canvasData).reduce((sum, items) => sum + items.length, 0);
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
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("artifacts").insert({
        user_id: user.id,
        tool_type: "bmc",
        title: `${data.companyName || "Untitled"} — Business Model Canvas`,
        content: data.canvasData,
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
      canvasData,
      completedSections,
      totalItems,
      completionPercentage: progressPercentage,
    });
  }, [companyName, canvasData, completedSections, totalItems, progressPercentage, finalizeMutation, toast]);

  const addItem = useCallback(
    (sectionId: SectionId, item: string) => {
      const trimmed = item.trim();
      if (trimmed && !canvasData[sectionId].includes(trimmed)) {
        setCanvasData((prev) => ({
          ...prev,
          [sectionId]: [...prev[sectionId], trimmed],
        }));
        toast({
          title: "Item added",
          description: `"${trimmed}" added to ${SECTIONS.find((s) => s.id === sectionId)?.title}`,
        });
        return true;
      }
      return false;
    },
    [canvasData, toast]
  );

  const removeItem = useCallback(
    (sectionId: SectionId, index: number) => {
      setCanvasData((prev) => ({
        ...prev,
        [sectionId]: prev[sectionId].filter((_, i) => i !== index),
      }));
    },
    []
  );

  const handleAddItem = useCallback(() => {
    if (addItem(currentSection.id, itemInput)) {
      setItemInput("");
    }
  }, [addItem, currentSection?.id, itemInput]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAddItem();
      }
    },
    [handleAddItem]
  );

  const handleCompanyNameSubmit = useCallback(() => {
    if (companyNameInput.trim()) {
      setCompanyName(companyNameInput.trim());
      setCompanyNameSet(true);
      setIsEditingCompanyName(false);
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
    setItemInput("");
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Canvas reset",
      description: "All data has been cleared",
    });
  }, [toast]);

  const handleExport = useCallback(() => {
    const exportData = {
      companyName: companyName || "Untitled Business",
      exportDate: new Date().toISOString(),
      canvas: canvasData,
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
  }, [companyName, canvasData, completedSections, totalItems, progressPercentage, toast]);

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
          text: section.title,
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
            ...createSectionContent(SECTIONS[0], canvasData.customerSegments),
            ...createSectionContent(SECTIONS[1], canvasData.valuePropositions),
            ...createSectionContent(SECTIONS[2], canvasData.channels),
            ...createSectionContent(SECTIONS[3], canvasData.customerRelationships),
            ...createSectionContent(SECTIONS[4], canvasData.revenueStreams),
            ...createSectionContent(SECTIONS[5], canvasData.keyResources),
            ...createSectionContent(SECTIONS[6], canvasData.keyActivities),
            ...createSectionContent(SECTIONS[7], canvasData.keyPartnerships),
            ...createSectionContent(SECTIONS[8], canvasData.costStructure),
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
  }, [companyName, canvasData, completedSections, totalItems, progressPercentage, toast]);

  const getInsights = useMemo(() => {
    const strengths: string[] = [];
    const areasToImprove: string[] = [];

    const {
      customerSegments, valuePropositions, channels,
      customerRelationships, revenueStreams, keyResources,
      keyActivities, keyPartnerships, costStructure,
    } = canvasData;

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
              size="icon"
              onClick={handleReset}
              data-testid="button-reset"
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
            itemInput={itemInput}
            setItemInput={setItemInput}
            handleAddItem={handleAddItem}
            handleKeyPress={handleKeyPress}
            addItem={addItem}
            removeItem={removeItem}
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
  itemInput: string;
  setItemInput: (value: string) => void;
  handleAddItem: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  addItem: (sectionId: SectionId, item: string) => boolean;
  removeItem: (sectionId: SectionId, index: number) => void;
  progressPercentage: number;
  completedSections: number;
  setCurrentView: (view: ViewType) => void;
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
  itemInput,
  setItemInput,
  handleAddItem,
  handleKeyPress,
  addItem,
  removeItem,
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

      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {SECTIONS.map((section, index) => {
          const hasItems = canvasData[section.id].length > 0;
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
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden">{index + 1}</span>
              {hasItems && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {canvasData[section.id].length}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

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
            {sectionItems.length > 0 && (
              <Badge variant="secondary" className="shrink-0" data-testid="badge-item-count">
                {sectionItems.length} item{sectionItems.length !== 1 ? "s" : ""}
              </Badge>
            )}
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

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={`Add a ${currentSection.title.toLowerCase().slice(0, -1)}...`}
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                onKeyPress={handleKeyPress}
                data-testid="input-add-item"
              />
              <Button
                onClick={handleAddItem}
                disabled={!itemInput.trim()}
                data-testid="button-add-item"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {currentSection.quickAddItems.map((item) => {
                  const isAdded = sectionItems.includes(item);
                  return (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(currentSection.id, item)}
                      disabled={isAdded}
                      className="gap-1"
                      data-testid={`button-quick-add-${item.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {isAdded && <Check className="h-3 w-3 text-green-500" />}
                      {item}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {sectionItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Added items:</p>
              <div className="space-y-2">
                {sectionItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3"
                    data-testid={`item-${currentSection.id}-${index}`}
                  >
                    <span className="text-sm">{item}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(currentSection.id, index)}
                      data-testid={`button-delete-item-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            {currentStep < 8 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
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
  const filled = items.length > 0;
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
            {section.title}
          </span>
          {filled && (
            <span className="ml-auto text-[10px] font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
              {items.length}
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
              {items.map((item, index) => (
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
            const items = canvasData[section.id];
            const Icon = section.icon;
            const filled = items.length > 0;
            return (
              <Card key={section.id} className={filled ? "border-primary/30" : ""} data-testid={`detail-card-${section.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{section.title}</span>
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

      {/* Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h3 className="font-serif text-lg font-semibold">Canvas Insights</h3>
        </div>
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
