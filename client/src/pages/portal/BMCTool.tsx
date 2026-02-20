import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import edmecaLogo from "@assets/EdMeca_LOGOMARK_A4_2024_1767948366417.jpg";
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

    SECTIONS.forEach((section) => {
      const items = canvasData[section.id];
      if (items.length >= 3) {
        strengths.push(`Strong ${section.title.toLowerCase()} definition with ${items.length} elements`);
      } else if (items.length === 0) {
        areasToImprove.push(`${section.title} needs attention - no items defined yet`);
      } else if (items.length < 2) {
        areasToImprove.push(`Consider expanding ${section.title.toLowerCase()} - only ${items.length} item defined`);
      }
    });

    if (canvasData.valuePropositions.length > 0 && canvasData.customerSegments.length > 0) {
      strengths.push("Good alignment between value propositions and customer segments");
    }

    if (canvasData.revenueStreams.length > 0 && canvasData.costStructure.length > 0) {
      strengths.push("Financial model foundation is in place");
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
  return (
    <div
      className={`flex flex-col rounded-lg border-2 p-3 ${section.borderColor} ${section.bgColor} ${className}`}
      data-testid={`canvas-cell-${section.id}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${section.color}`} />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {section.title}
        </span>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {items.length}
          </Badge>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-auto">
        {items.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">No items yet</p>
        ) : (
          items.map((item, index) => (
            <p key={index} className="text-xs">
              • {item}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function CanvasView({ canvasData }: CanvasViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold" data-testid="text-canvas-title">Business Model Canvas</h2>
      
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3">
        <CanvasCell
          section={SECTIONS[7]}
          items={canvasData.keyPartnerships}
          className="row-span-2"
        />
        <CanvasCell
          section={SECTIONS[6]}
          items={canvasData.keyActivities}
        />
        <CanvasCell
          section={SECTIONS[1]}
          items={canvasData.valuePropositions}
          className="row-span-2"
        />
        <CanvasCell
          section={SECTIONS[3]}
          items={canvasData.customerRelationships}
        />
        <CanvasCell
          section={SECTIONS[0]}
          items={canvasData.customerSegments}
          className="row-span-2"
        />
        <CanvasCell
          section={SECTIONS[5]}
          items={canvasData.keyResources}
        />
        <CanvasCell
          section={SECTIONS[2]}
          items={canvasData.channels}
        />
        <CanvasCell
          section={SECTIONS[8]}
          items={canvasData.costStructure}
          className="col-span-2"
        />
        <CanvasCell
          section={SECTIONS[4]}
          items={canvasData.revenueStreams}
          className="col-span-3"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:hidden">
        {SECTIONS.map((section) => (
          <CanvasCell
            key={section.id}
            section={section}
            items={canvasData[section.id]}
          />
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-dashboard-title">
          {companyName ? `${companyName} - ` : ""}Business Model Overview
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={handleExportWord} data-testid="button-export-word">
            <FileText className="mr-2 h-4 w-4" />
            Export Word
          </Button>
          {isFinalized ? (
            <Button variant="outline" disabled className="gap-2" data-testid="button-finalized">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Saved to Database
            </Button>
          ) : (
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="gap-2"
              data-testid="button-finalize"
            >
              <Save className="h-4 w-4" />
              {isFinalizing ? "Saving..." : "Finalize & Save"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setCurrentView("guided")} data-testid="button-continue-editing">
            Continue Editing
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Company"
          value={companyName || "Not set"}
          icon={Building2}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          testId="stat-company"
        />
        <StatCard
          title="Completion"
          value={`${completedSections}/9`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          testId="stat-completion"
        />
        <StatCard
          title="Total Items"
          value={totalItems.toString()}
          icon={List}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
          testId="stat-items"
        />
        <StatCard
          title="Model Strength"
          value={`${progressPercentage}%`}
          icon={BarChart3}
          color="bg-gradient-to-br from-green-500 to-green-600"
          testId="stat-strength"
        />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Canvas Overview</h3>
        <CanvasView canvasData={canvasData} />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Section Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const items = canvasData[section.id];
            const Icon = section.icon;
            return (
              <Card key={section.id} className={`border-l-4 ${section.borderColor}`} data-testid={`detail-card-${section.id}`}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.bgColor}`}>
                    <Icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">
                      No items defined
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {items.slice(0, 3).map((item, index) => (
                        <li key={index} className="text-sm">
                          • {item}
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          +{items.length - 3} more...
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">AI Insights</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-green-500" data-testid="card-strengths">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Lightbulb className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-base">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.strengths.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">
                  Add more items to see your strengths
                </p>
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

          <Card className="border-l-4 border-amber-500" data-testid="card-improvements">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="text-base">Areas to Develop</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.areasToImprove.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">
                  Great work! All sections are well-defined
                </p>
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
  color,
  testId,
}: {
  title: string;
  value: string;
  icon: typeof Building2;
  color: string;
  testId: string;
}) {
  return (
    <Card className={`${color} text-white`} data-testid={testId}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
