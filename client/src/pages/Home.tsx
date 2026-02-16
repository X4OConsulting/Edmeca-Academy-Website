import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  ArrowRight,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Layers,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Design Thinking",
    description: "Human-centered approach to innovation that integrates user needs with business viability.",
  },
  {
    icon: Layers,
    title: "Business Model Canvas",
    description: "Visual framework for developing and documenting your business model systematically.",
  },
  {
    icon: BarChart3,
    title: "Strategic Analysis",
    description: "SWOT and PESTLE frameworks for comprehensive market and competitive positioning.",
  },
  {
    icon: Target,
    title: "Value Proposition",
    description: "Craft compelling value propositions that resonate with your target customers.",
  },
  {
    icon: FileText,
    title: "Pitch Builder",
    description: "Structure investor-ready pitch decks with proven narrative frameworks.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Measure baseline-to-outcome progression with evidence-based milestones.",
  },
];

const audienceTracks = [
  {
    icon: Lightbulb,
    title: "For Entrepreneurs",
    subtitle: "Clarity, Speed, Confidence",
    outcomes: [
      "Business clarity through proven frameworks",
      "Faster MVP development with AI assistance",
      "Pitch-ready confidence for investors",
      "From idea to investor-ready in weeks",
    ],
    cta: "Start Your Journey",
    href: "/solutions/entrepreneurs",
  },
  {
    icon: Users,
    title: "For Programmes",
    subtitle: "Scale, Measure, Report",
    outcomes: [
      "Measurable participant progression",
      "Streamlined M&E reporting",
      "Scalable interventions across cohorts",
      "Evidence-based impact documentation",
    ],
    cta: "Explore Programme Solutions",
    href: "/solutions/programmes",
  },
];

const testimonials = [
  {
    quote: "EdMeCa transformed how we deliver our accelerator program. The tools made complex frameworks accessible to all participants.",
    author: "Sarah Chen",
    role: "Programme Director",
    company: "Startup Incubator",
  },
  {
    quote: "Within 3 weeks, I went from a vague idea to a structured business model and a pitch deck that landed my first meeting with investors.",
    author: "Marcus Johnson",
    role: "Founder",
    company: "TechStart",
  },
  {
    quote: "The progress tracking and M&E reporting saved our team hundreds of hours. We can now demonstrate impact with real evidence.",
    author: "Dr. Amara Okafor",
    role: "Development Lead",
    company: "Enterprise Africa",
  },
];

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground dark:text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Business Tools
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              From Framework to{" "}
              <span className="text-primary dark:text-accent">Execution</span>{" "}
              to Evidence
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MBA-level business frameworks made accessible to entrepreneurs through 
              hands-on delivery and AI-enabled tooling. Turn ideas into investor-ready pitches.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" asChild>
                <Button size="lg" className="min-w-40" data-testid="button-hero-cta">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/frameworks" asChild>
                <Button variant="outline" size="lg" className="min-w-40" data-testid="button-hero-learn">
                  Explore Frameworks
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Tracks */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Who We Serve</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Tailored solutions for individual entrepreneurs and enterprise development programmes alike.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {audienceTracks.map((track) => (
              <Card key={track.title} className="group hover-elevate overflow-visible">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                      <track.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-semibold">{track.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{track.subtitle}</p>
                    </div>
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    {track.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={track.href} asChild>
                    <Button variant="outline" className="mt-6 w-full" data-testid={`button-${track.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      {track.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">AI-Powered Business Tools</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform business ideas into actionable plans, 
            guided by proven frameworks and enhanced by AI.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover-elevate overflow-visible">
              <CardContent className="p-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent w-fit">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/frameworks" asChild>
            <Button variant="outline" size="lg" data-testid="button-view-frameworks">
              View All Frameworks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-primary dark:bg-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Trusted by Entrepreneurs & Programmes</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 lg:p-8"
              >
                <blockquote className="text-sm leading-relaxed opacity-90">
                  "{testimonial.quote}"
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs opacity-70">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 rounded-2xl p-8 lg:p-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Ready to Transform Your Ideas?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join hundreds of entrepreneurs and programmes using EdMeCa to turn 
              frameworks into action, prototypes into products.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" asChild>
                <Button size="lg" data-testid="button-final-cta">
                  Book a Call
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="/login">
                <Button variant="outline" size="lg" data-testid="button-final-register">
                  Register Free
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
