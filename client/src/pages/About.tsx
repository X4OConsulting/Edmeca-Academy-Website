import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, Target, Lightbulb, Users, Award, Zap, Heart } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Outcomes-Focused",
    description: "Every framework, tool, and intervention is designed to deliver measurable results.",
  },
  {
    icon: Lightbulb,
    title: "Accessible Excellence",
    description: "MBA-level quality made practical and applicable for real-world entrepreneurs.",
  },
  {
    icon: Users,
    title: "Human-Centered",
    description: "Technology amplifies human capability—our AI assists, you decide.",
  },
  {
    icon: Zap,
    title: "Execution Over Theory",
    description: "Frameworks are only valuable when they lead to action and evidence.",
  },
];

const approach = [
  {
    step: "1",
    title: "Framework Foundation",
    description: "We start with proven business frameworks—Design Thinking, Business Model Canvas, SWOT, PESTLE, and more. These aren't just theory; they're battle-tested tools used by the world's best consulting firms.",
  },
  {
    step: "2",
    title: "AI-Enabled Execution",
    description: "Our platform guides you through each framework with intelligent prompts and AI-assisted suggestions. You maintain control while benefiting from instant, context-aware guidance.",
  },
  {
    step: "3",
    title: "Evidence-Based Outcomes",
    description: "Every step is documented. Every milestone is tracked. From baseline to outcome, you'll have the evidence to demonstrate progress to investors, partners, and stakeholders.",
  },
];

export default function About() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Making Business Frameworks Work for Everyone
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              EDMECA bridges the gap between MBA-level business theory and entrepreneurial execution. 
              We believe the best frameworks shouldn't be locked behind expensive consulting fees or 
              inaccessible education.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">Our Story</h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  EDMECA was born from a simple observation: entrepreneurs across Africa and emerging 
                  markets have extraordinary ideas but often lack access to the strategic tools that 
                  help businesses succeed.
                </p>
                <p>
                  We saw incubators and accelerators struggling to deliver consistent, measurable 
                  outcomes across diverse cohorts. We saw individual founders spending months 
                  figuring out what established frameworks could teach them in days.
                </p>
                <p>
                  So we built EDMECA—a platform that combines the rigor of management consulting 
                  frameworks with the accessibility of modern technology and AI. From Framework 
                  to Execution to Evidence.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Heart className="h-16 w-16 mx-auto text-primary dark:text-accent opacity-50" />
                  <p className="mt-6 font-serif text-xl font-semibold">Built with Purpose</p>
                  <p className="mt-2 text-sm text-muted-foreground">For entrepreneurs, by entrepreneurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">Our Approach</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A systematic journey from understanding to action to measurable results.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {approach.map((item) => (
            <div key={item.step} className="relative">
              <div className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent flex items-center justify-center font-serif text-xl font-bold">
                {item.step}
              </div>
              <Card className="pt-8 h-full">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mt-2">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Our Values</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build and deliver.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="hover-elevate overflow-visible">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto p-3 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent w-fit">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Placeholder */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">The Team</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A diverse team of consultants, technologists, and entrepreneurs committed to 
            democratizing business excellence.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover-elevate overflow-visible">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Award className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="mt-4 font-semibold">Team Member</h3>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary dark:bg-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Ready to Work With Us?
          </h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">
            Whether you're an entrepreneur seeking clarity or a programme looking for 
            scalable solutions, we'd love to hear from you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" asChild>
              <Button size="lg" variant="secondary" data-testid="button-about-contact">
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
