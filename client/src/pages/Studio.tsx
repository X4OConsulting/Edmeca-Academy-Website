import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, BarChart3, FileText, Layers, LineChart, Target, TrendingUp } from "lucide-react";

// The AI Business Studio page (decision 4.7: Frameworks renamed, /frameworks redirects here).
// The tool list is what exists in the portal today (client/src/pages/portal/), described as post-programme access.
const tools = [
  { icon: Layers, title: "Business Model Canvas", description: "Map a business model across the nine building blocks." },
  { icon: BarChart3, title: "SWOT and PESTLE", description: "Identify strengths, weaknesses, opportunities, threats and market forces." },
  { icon: Target, title: "Value Proposition", description: "Define customer fit and what makes the offering different." },
  { icon: FileText, title: "Pitch Builder", description: "Structure a pitch from the work done in the other tools." },
  { icon: LineChart, title: "Financial Analysis", description: "A financial health report from uploaded bank statements and financials." },
  { icon: TrendingUp, title: "Progress Tracker", description: "Track milestones and capture evidence of progress." },
];

export default function Studio() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">Digital tools</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">AI Business Studio</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            BMC and other templates, prompt building, the leadership tool and progress tracking, in one studio with
            business, individual and leader contexts. Offered as post-programme access, not a subscription.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button variant="cta" size="lg" asChild data-testid="button-studio-signin">
              <a href="/login">
                Sign in to the AI Business Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/contact" asChild>
              <Button variant="outline-brand" size="lg" data-testid="button-studio-contact">Book a discovery call</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools available today */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="eyebrow">In the Studio today</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight mb-10">Practical digital tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card key={tool.title} className="rounded-2xl">
                <CardContent className="p-6">
                  <tool.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-primary">{tool.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="rounded-2xl border bg-secondary p-8 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Access comes with a programme.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            The AI Business Studio is available to programme participants and partners. Ask your programme lead or
            contact us for access.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact?offering=ai-business-studio" asChild>
              <Button variant="cta" size="lg">
                Contact us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/solutions" asChild>
              <Button variant="outline-brand" size="lg">See the full offering</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
