import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  Users,
  Handshake,
  Lightbulb,
  Heart,
  Truck,
  UserCheck,
  DollarSign,
  Wallet,
  Cog,
} from "lucide-react";
import type { Artifact, BMCCanvas } from "@shared/schema";

const bmcBlocks = [
  {
    id: "keyPartners",
    title: "Key Partners",
    icon: Handshake,
    color: "bg-violet-500",
    prompt: "Who are your key suppliers and partners? What resources do you acquire from them?",
    gridClass: "row-span-2",
  },
  {
    id: "keyActivities",
    title: "Key Activities",
    icon: Cog,
    color: "bg-blue-500",
    prompt: "What key activities does your value proposition require? Distribution, production, problem solving?",
    gridClass: "",
  },
  {
    id: "valuePropositions",
    title: "Value Propositions",
    icon: Lightbulb,
    color: "bg-amber-500",
    prompt: "What value do you deliver to customers? Which problems are you solving? What bundles of products/services?",
    gridClass: "row-span-2",
  },
  {
    id: "customerRelationships",
    title: "Customer Relationships",
    icon: Heart,
    color: "bg-pink-500",
    prompt: "What type of relationship does each customer segment expect? Personal, automated, self-service, community?",
    gridClass: "",
  },
  {
    id: "customerSegments",
    title: "Customer Segments",
    icon: Users,
    color: "bg-green-500",
    prompt: "Who are your most important customers? What are their characteristics and needs?",
    gridClass: "row-span-2",
  },
  {
    id: "keyResources",
    title: "Key Resources",
    icon: UserCheck,
    color: "bg-blue-500",
    prompt: "What key resources does your value proposition require? Physical, intellectual, human, financial?",
    gridClass: "",
  },
  {
    id: "channels",
    title: "Channels",
    icon: Truck,
    color: "bg-pink-500",
    prompt: "How do you reach your customers? Sales force, web, own stores, partner stores?",
    gridClass: "",
  },
  {
    id: "costStructure",
    title: "Cost Structure",
    icon: Wallet,
    color: "bg-orange-500",
    prompt: "What are the most important costs inherent to your business model? Fixed costs, variable costs?",
    gridClass: "col-span-2",
  },
  {
    id: "revenueStreams",
    title: "Revenue Streams",
    icon: DollarSign,
    color: "bg-emerald-500",
    prompt: "For what value are customers willing to pay? How do they pay? How much does each revenue stream contribute?",
    gridClass: "col-span-2",
  },
];

const defaultCanvas: BMCCanvas = {
  keyPartners: "",
  keyActivities: "",
  keyResources: "",
  valuePropositions: "",
  customerRelationships: "",
  channels: "",
  customerSegments: "",
  costStructure: "",
  revenueStreams: "",
};

export default function BMCTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("My Business Model Canvas");
  const [canvas, setCanvas] = useState<BMCCanvas>(defaultCanvas);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: artifact, isLoading: artifactLoading } = useQuery<Artifact | null>({
    queryKey: ["/api/artifacts", "bmc", "latest"],
    enabled: !!user,
  });

  useEffect(() => {
    if (artifact) {
      setTitle(artifact.title);
      setCanvas(artifact.content as BMCCanvas || defaultCanvas);
    }
  }, [artifact]);
  
  const [artifactId, setArtifactId] = useState<string | null>(null);
  
  useEffect(() => {
    if (artifact?.id) {
      setArtifactId(artifact.id);
    }
  }, [artifact]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        toolType: "bmc" as const,
        title,
        content: canvas,
        status: "in_progress" as const,
      };
      
      if (artifactId) {
        return apiRequest("PATCH", `/api/artifacts/${artifactId}`, payload);
      }
      const response = await apiRequest("POST", "/api/artifacts", payload);
      const newArtifact = await response.json();
      setArtifactId(newArtifact.id);
      return response;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
      toast({
        title: "Saved!",
        description: "Your canvas has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBlockChange = (blockId: string, value: string) => {
    setCanvas(prev => ({ ...prev, [blockId]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate();
    setIsSaving(false);
  };

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvas !== defaultCanvas && !saveMutation.isPending) {
        saveMutation.mutate();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [canvas]);

  const getFilledCount = () => {
    return Object.values(canvas).filter(v => v && v.trim().length > 0).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <Link href="/portal" asChild>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-semibold text-lg border-none shadow-none h-auto p-0 focus-visible:ring-0"
                  placeholder="Canvas Title"
                  data-testid="input-canvas-title"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {getFilledCount()}/9 blocks
                  </Badge>
                  {lastSaved && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Instructions */}
        <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">AI-Assisted Canvas Builder</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click on any block to start filling it in. Each block has guiding prompts to help you think through your business model.
              </p>
            </div>
          </div>
        </div>

        {/* BMC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 lg:gap-4">
          {/* Row 1-2: Partners, Activities, Value Props, Relationships, Segments */}
          <div className="md:col-span-1 md:row-span-2">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "keyPartners")!}
              value={canvas.keyPartners}
              onChange={(v) => handleBlockChange("keyPartners", v)}
              isActive={activeBlock === "keyPartners"}
              onFocus={() => setActiveBlock("keyPartners")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>
          
          <div className="md:col-span-1 space-y-3 lg:space-y-4">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "keyActivities")!}
              value={canvas.keyActivities}
              onChange={(v) => handleBlockChange("keyActivities", v)}
              isActive={activeBlock === "keyActivities"}
              onFocus={() => setActiveBlock("keyActivities")}
              onBlur={() => setActiveBlock(null)}
            />
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "keyResources")!}
              value={canvas.keyResources}
              onChange={(v) => handleBlockChange("keyResources", v)}
              isActive={activeBlock === "keyResources"}
              onFocus={() => setActiveBlock("keyResources")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>
          
          <div className="md:col-span-1 md:row-span-2">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "valuePropositions")!}
              value={canvas.valuePropositions}
              onChange={(v) => handleBlockChange("valuePropositions", v)}
              isActive={activeBlock === "valuePropositions"}
              onFocus={() => setActiveBlock("valuePropositions")}
              onBlur={() => setActiveBlock(null)}
              highlight
            />
          </div>
          
          <div className="md:col-span-1 space-y-3 lg:space-y-4">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "customerRelationships")!}
              value={canvas.customerRelationships}
              onChange={(v) => handleBlockChange("customerRelationships", v)}
              isActive={activeBlock === "customerRelationships"}
              onFocus={() => setActiveBlock("customerRelationships")}
              onBlur={() => setActiveBlock(null)}
            />
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "channels")!}
              value={canvas.channels}
              onChange={(v) => handleBlockChange("channels", v)}
              isActive={activeBlock === "channels"}
              onFocus={() => setActiveBlock("channels")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>
          
          <div className="md:col-span-1 md:row-span-2">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "customerSegments")!}
              value={canvas.customerSegments}
              onChange={(v) => handleBlockChange("customerSegments", v)}
              isActive={activeBlock === "customerSegments"}
              onFocus={() => setActiveBlock("customerSegments")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>

          {/* Row 3: Cost Structure, Revenue Streams */}
          <div className="md:col-span-2">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "costStructure")!}
              value={canvas.costStructure}
              onChange={(v) => handleBlockChange("costStructure", v)}
              isActive={activeBlock === "costStructure"}
              onFocus={() => setActiveBlock("costStructure")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>
          
          <div className="md:col-span-3">
            <BMCBlock
              block={bmcBlocks.find(b => b.id === "revenueStreams")!}
              value={canvas.revenueStreams}
              onChange={(v) => handleBlockChange("revenueStreams", v)}
              isActive={activeBlock === "revenueStreams"}
              onFocus={() => setActiveBlock("revenueStreams")}
              onBlur={() => setActiveBlock(null)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

interface BMCBlockProps {
  block: typeof bmcBlocks[0];
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  highlight?: boolean;
}

function BMCBlock({ block, value, onChange, isActive, onFocus, onBlur, highlight }: BMCBlockProps) {
  const Icon = block.icon;
  
  return (
    <Card 
      className={`h-full transition-all ${
        isActive ? 'ring-2 ring-primary' : ''
      } ${highlight ? 'bg-accent/5 border-accent/30' : ''}`}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${block.color} text-white`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-sm font-semibold">{block.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={block.prompt}
          className="min-h-24 text-sm resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
          data-testid={`textarea-${block.id}`}
        />
      </CardContent>
    </Card>
  );
}
