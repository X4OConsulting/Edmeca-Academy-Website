import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, BarChart3, Briefcase, CheckCircle2, Crown, Star, Zap } from "lucide-react";

// Tier names and descriptions from the design system (brand/README.md, "Three engagement tiers").
// No prices, badges or support promises (decision 4.6); pricing is set in a proposal.

const entryPoints = [
  {
    icon: BarChart3,
    eyebrow: "Entry point",
    title: "Impact Reporting on its own",
    description:
      "Baseline, mid and post assessments, with a consolidated report within 10 business days, formatted for funder reporting.",
    forLine: "ESD programme owners, funders and learning institutions",
    cta: "Ask about Impact Reporting",
    href: "/contact?offering=impact-reporting",
  },
  {
    // Added at Raymond's request (3 November 2026); name from the brand book.
    icon: Briefcase,
    eyebrow: "For leadership teams",
    title: "AI Masterclass for Executives",
    description:
      "An executive session on Digital Leadership: enough insight to lead where digital, AI and cyber risk shape the business. It leads into the AI Catalyst Journey, a six-session programme for teams.",
    forLine: "Corporates and skills development foundations, buying for their executives and management teams",
    cta: "Ask about the masterclass",
    href: "/contact?offering=ai-for-leaders",
  },
];

const tiers = [
  {
    icon: Zap,
    name: "Focused Session",
    description: "A single targeted intervention, for example a BMC workshop, a design sprint or pitch prep.",
    points: ["One targeted intervention", "A clear, scoped outcome", "A usable output from the session"],
    inverted: false,
  },
  {
    icon: Star,
    name: "Mid-Tier",
    description: "4 to 5 targeted interventions, scoped outcomes, measurable participant progression.",
    points: ["4 to 5 targeted interventions", "Scoped outcomes", "Measurable participant progression"],
    inverted: false,
  },
  {
    icon: Crown,
    name: "Full Journey",
    description:
      "A 12-month partnership with comprehensive tooling, multiple touchpoints, and baseline-to-outcome impact reporting.",
    points: [
      "12-month partnership",
      "Comprehensive tooling",
      "Multiple touchpoints",
      "Baseline-to-outcome impact reporting",
      "Studio access after the programme",
    ],
    inverted: true,
  },
];

const faq = [
  {
    question: "How do we choose the right engagement?",
    answer:
      "Start from the outcome you need. A Focused Session solves one scoped problem, a Mid-Tier engagement builds measurable progression over 4 to 5 interventions, and a Full Journey is a 12-month partnership with impact reporting from baseline to outcome. If you need evidence first, start with Impact Reporting on its own. We agree the fit on a discovery call.",
  },
  {
    question: "How is pricing set?",
    answer:
      "Pricing is built from a component catalogue and a rate card by client type, and any discounts are stated upfront. A proposal follows within five working days of a discovery call.",
  },
  {
    question: "Can the programme carry our brand?",
    answer: "We deliver under the EdMeCa brand, co-branded with your programme where that helps.",
  },
  {
    question: "How do you measure results?",
    answer:
      "We take a baseline, a mid-point and a post-programme assessment. Where a client needs financial growth and job creation reported, we define the measure, the timeframe and the attribution method before the programme starts.",
  },
  {
    question: "What happens after the programme?",
    answer: "Participants keep working in the AI Business Studio, which is offered as post-programme access, not a subscription.",
  },
];

export default function Engagement() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">Engagement</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">Three ways to engage.</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Start with Impact Reporting or an executive masterclass, then choose the depth of engagement that fits your
            programme. Every engagement is scoped with you and set out in a proposal within five working days of a
            discovery call.
          </p>
        </div>
      </section>

      {/* Entry points */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <p className="eyebrow mb-6">Where to start</p>
        <div className="grid md:grid-cols-2 gap-6">
          {entryPoints.map((entry) => (
            <Card key={entry.title} className="rounded-2xl flex flex-col">
              <CardContent className="p-6 lg:p-8 flex flex-1 flex-col">
                <entry.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="eyebrow mt-4">{entry.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary">{entry.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{entry.description}</p>
                <p className="mt-4 text-sm">
                  <span className="font-semibold">For: </span>
                  <span className="text-muted-foreground">{entry.forLine}</span>
                </p>
                <div className="mt-auto pt-8">
                  <Link
                    href={entry.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {entry.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* The three tiers */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="eyebrow">Three ways to engage</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight mb-10">Choose the depth that fits.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 lg:p-8 flex flex-col shadow-sm ${
                  tier.inverted ? "bg-brand-blue-deep text-white border-brand-blue-deep" : "bg-background"
                }`}
              >
                <tier.icon className={`h-6 w-6 ${tier.inverted ? "text-accent" : "text-primary"}`} aria-hidden="true" />
                <h3 className={`mt-4 text-xl font-semibold ${tier.inverted ? "text-white" : "text-primary"}`}>{tier.name}</h3>
                <p className={`mt-3 leading-relaxed ${tier.inverted ? "text-white/85" : "text-muted-foreground"}`}>
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-2 flex-1">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className={`h-4 w-4 mt-0.5 shrink-0 ${tier.inverted ? "text-accent" : "text-primary"}`}
                        aria-hidden="true"
                      />
                      <span className={tier.inverted ? "text-white/90" : "text-muted-foreground"}>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/contact" asChild>
                    <Button
                      variant={tier.inverted ? "cta" : "outline-brand"}
                      className="w-full"
                      data-testid={`button-tier-${tier.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      Book a discovery call
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">Questions we are asked</h2>
        <div className="space-y-6">
          {faq.map((item) => (
            <div key={item.question} className="border-b pb-6 last:border-0">
              <h3 className="font-semibold text-primary mb-2">{item.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <div className="rounded-2xl border bg-secondary p-8 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Let's talk about your programme.</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            A proposal follows within five working days of a discovery call.
          </p>
          <div className="mt-8">
            <Link href="/contact" asChild>
              <Button variant="cta" size="lg" data-testid="button-engagement-consult">
                Book a discovery call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
