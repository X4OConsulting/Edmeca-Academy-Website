import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, Lightbulb, Users, CheckCircle2, Rocket, BarChart3, FileText, Target } from "lucide-react";

const entrepreneurBenefits = [
  {
    icon: Lightbulb,
    title: "Business Clarity",
    description: "Transform vague ideas into structured business models using proven frameworks.",
  },
  {
    icon: Rocket,
    title: "Faster MVP Development",
    description: "AI-guided tools help you move from concept to prototype in weeks, not months.",
  },
  {
    icon: Target,
    title: "Investor-Ready Pitches",
    description: "Build compelling pitch decks backed by rigorous strategic analysis.",
  },
  {
    icon: FileText,
    title: "Documented Progress",
    description: "Every step is tracked, creating a portfolio of your entrepreneurial journey.",
  },
];

const programmeBenefits = [
  {
    icon: Users,
    title: "Scalable Interventions",
    description: "Deliver consistent, high-quality training across multiple cohorts simultaneously.",
  },
  {
    icon: BarChart3,
    title: "Measurable Progression",
    description: "Track participant progress from baseline to outcome with real evidence.",
  },
  {
    icon: FileText,
    title: "Streamlined M&E",
    description: "Generate comprehensive impact reports automatically for funders and stakeholders.",
  },
  {
    icon: Target,
    title: "Cohort Management",
    description: "Organize participants, track milestones, and manage the entire journey in one place.",
  },
];

const entrepreneurJourney = [
  { step: "1", title: "Onboard", description: "Create your profile and tell us about your business idea" },
  { step: "2", title: "Explore", description: "Work through frameworks with AI-guided assistance" },
  { step: "3", title: "Build", description: "Create your BMC, value proposition, and strategic analysis" },
  { step: "4", title: "Pitch", description: "Compile everything into an investor-ready presentation" },
];

export default function Solutions() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Solutions That Deliver Results
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Whether you're an individual entrepreneur or leading a development programme, 
              EdMeCa provides the tools and frameworks you need to succeed.
            </p>
          </div>
        </div>
      </section>

      {/* For Entrepreneurs */}
      <section id="entrepreneurs" className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Lightbulb className="w-4 h-4" />
                For Entrepreneurs
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                From Idea to Investor-Ready
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Access the same strategic frameworks used by top consulting firms, enhanced 
                with AI guidance and practical tools designed for entrepreneurs.
              </p>
              
              <div className="mt-8 space-y-4">
                {entrepreneurJourney.map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link href="/api/login" asChild>
                  <Button size="lg" data-testid="button-entrepreneur-start">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {entrepreneurBenefits.map((benefit) => (
                <Card key={benefit.title} className="hover-elevate overflow-visible">
                  <CardContent className="p-5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent w-fit">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Programmes */}
      <section id="programmes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-4">
            {programmeBenefits.map((benefit) => (
              <Card key={benefit.title} className="hover-elevate overflow-visible">
                <CardContent className="p-5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent w-fit">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              For Programmes
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Scale Impact, Measure Outcomes
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Enterprise development programmes, incubators, and accelerators trust EDMECA 
              to deliver consistent interventions and demonstrate measurable impact.
            </p>
            
            <ul className="mt-6 space-y-3">
              {[
                "Multi-cohort management dashboard",
                "Participant progress tracking",
                "Automated M&E reporting",
                "Evidence-based impact documentation",
                "White-label options available",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-8">
              <Link href="/contact" asChild>
                <Button size="lg" data-testid="button-programme-contact">
                  Talk to Our Team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary dark:bg-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Not Sure Which Solution Fits?
          </h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">
            Book a free consultation call and we'll help you identify the right approach 
            for your needs.
          </p>
          <div className="mt-8">
            <Link href="/contact" asChild>
              <Button size="lg" variant="secondary" data-testid="button-solutions-consult">
                Book a Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
