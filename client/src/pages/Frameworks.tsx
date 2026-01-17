import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  ArrowRight,
  Lightbulb,
  Layers,
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const frameworks = [
  {
    icon: Lightbulb,
    title: "Design Thinking",
    category: "Innovation",
    description: "A human-centered approach to innovation that integrates user needs, technology possibilities, and business viability.",
    capabilities: [
      "Empathy mapping and user research",
      "Problem definition and HMW questions",
      "Ideation and concept development",
      "Rapid prototyping guidance",
    ],
  },
  {
    icon: Layers,
    title: "Business Model Canvas",
    category: "Strategy",
    description: "Visual strategic management template for developing new or documenting existing business models.",
    capabilities: [
      "9-block canvas with guided prompts",
      "AI-assisted block suggestions",
      "Version history and comparison",
      "PDF/DOCX export ready",
    ],
  },
  {
    icon: BarChart3,
    title: "SWOT Analysis",
    category: "Analysis",
    description: "Strategic planning technique to identify Strengths, Weaknesses, Opportunities, and Threats.",
    capabilities: [
      "Structured internal/external analysis",
      "Prioritization matrix",
      "Strategic implications generator",
      "Action planning integration",
    ],
  },
  {
    icon: TrendingUp,
    title: "PESTLE Analysis",
    category: "Analysis",
    description: "Macro-environmental analysis covering Political, Economic, Social, Technological, Legal, and Environmental factors.",
    capabilities: [
      "Comprehensive factor assessment",
      "Trend identification",
      "Risk and opportunity mapping",
      "Industry-specific prompts",
    ],
  },
  {
    icon: Target,
    title: "Value Proposition Design",
    category: "Strategy",
    description: "Tools to understand customer jobs, pains, and gains—and design value propositions that resonate.",
    capabilities: [
      "Customer persona builder",
      "Jobs-to-be-done framework",
      "Problem-solution fit analysis",
      "Assumptions and test planning",
    ],
  },
  {
    icon: FileText,
    title: "Pitch Builder",
    category: "Communication",
    description: "Structure compelling investor pitches with proven narrative frameworks and persuasive storytelling.",
    capabilities: [
      "10-slide deck structure",
      "Key message refinement",
      "Story arc development",
      "Investor-ready export",
    ],
  },
];

const aiFeatures = [
  {
    title: "Contextual Suggestions",
    description: "AI analyzes your inputs and provides relevant suggestions for each framework block.",
  },
  {
    title: "Accept, Edit, or Reject",
    description: "You maintain full control—AI assists, you decide what makes it into your final output.",
  },
  {
    title: "Industry Intelligence",
    description: "Suggestions are tailored to your industry, market, and specific business context.",
  },
  {
    title: "Continuous Learning",
    description: "The more you use the platform, the more relevant suggestions become.",
  },
];

export default function Frameworks() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground dark:text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Enhanced Frameworks
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Proven Frameworks, Powered by AI
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Access the same strategic frameworks used by top consulting firms and business schools, 
              enhanced with intelligent guidance and practical tooling.
            </p>
          </div>
        </div>
      </section>

      {/* Frameworks Grid */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Our Framework Library</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Each framework is implemented as an interactive tool with guided prompts, 
              AI assistance, and export capabilities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frameworks.map((framework) => (
              <Card key={framework.title} className="hover-elevate overflow-visible h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                      <framework.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {framework.category}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">{framework.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                    {framework.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {framework.capabilities.slice(0, 3).map((cap) => (
                      <li key={cap} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Integration */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground dark:text-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Intelligent Assistance, Your Control
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our AI doesn't replace your thinking—it amplifies it. Get instant, contextual 
              suggestions while maintaining complete control over your final outputs.
            </p>
            
            <div className="mt-8 space-y-6">
              {aiFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border p-6 lg:p-8">
              <div className="bg-card rounded-lg shadow-lg p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground dark:text-accent">
                      <Sparkles className="w-3 h-3" />
                      AI Suggestion
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 bg-accent/30 rounded w-full" />
                      <div className="h-2 bg-accent/30 rounded w-4/5" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="text-xs h-7">Accept</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7">Edit</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary dark:bg-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Ready to Apply These Frameworks?
          </h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">
            Create your free account and start building your business with AI-powered guidance.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/api/login" asChild>
              <Button size="lg" variant="secondary" data-testid="button-frameworks-start">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/engagement" asChild>
              <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10" data-testid="button-frameworks-options">
                View Engagement Options
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
