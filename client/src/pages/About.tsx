import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, BadgeCheck, Globe2, HandHeart, LineChart, MapPin, Users } from "lucide-react";

// The January 2026 lesson (docs/STRATEGY_POSITIONS_2026-10.md, "How we work"), with measurement as the fourth step.
const approach = [
  {
    title: "AI onboarding first",
    description: "Participants get comfortable with AI before any framework is introduced, so the tools help rather than get in the way.",
  },
  {
    title: "Frameworks and a tools refresh",
    description: "Proven business frameworks, worked through practical digital tools in the AI Business Studio.",
  },
  {
    title: "Sprint to a usable output",
    description: "Every session ends with something the business or team can use the next day.",
  },
  {
    title: "Measure and report",
    description: "A baseline, a mid-point and a post-programme assessment show what changed (PRE, MID, POST).",
  },
];

// Value statement rules: young people, entrepreneurs, leaders, in that order.
const beneficiaries = [
  { group: "Young people", line: "Work-ready, with AI and digital capability employers look for." },
  { group: "Entrepreneurs", line: "Businesses that last, built on proven frameworks." },
  { group: "Leaders", line: "Capability that grows across their teams." },
];

// Exact wording, confirmed 3 November 2026 (plan Section 4, item 5). No additions.
const values = [
  {
    icon: HandHeart,
    title: "Empowerment",
    description: "We uplift and enable youth, entrepreneurs and business leaders to reach their full potential.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "We build an ecosystem where people, ideas and opportunities connect.",
  },
  {
    icon: LineChart,
    title: "Impact",
    description: "We measure our success by the positive, lasting change we create in society.",
  },
];

// Co-founders by role only (decisions 4.4 and 4.8): no names, no portraits, no personal email addresses.
// Narratives exactly as approved in plan Phase 7.
const cofounders = [
  {
    role: "Business Development, Marketing and Branding",
    narrative:
      "The co-founder who opens the door. Builds and keeps the relationships with programme owners, corporates, institutions and funders, takes every enquiry from a first conversation to a discovery call and a proposal within five working days, and keeps the EdMeCa brand consistent across every programme we deliver, co-branded with a partner where that helps.",
  },
  {
    role: "Research and Content",
    narrative:
      "The co-founder who builds what we teach. Owns the content engine: the frameworks, the QCTO-aligned programmes, the research offering and the material each cohort works from. Brings the academic rigour that sits alongside industry insight, and turns sector and trend research into programme content that stays current.",
  },
  {
    role: "Operations and Technology",
    narrative:
      "The co-founder who makes it run and proves it worked. Owns delivery from onboarding to close-out, the AI Business Studio and the practical digital tools that make every session produce a usable output, and the measurement: the baseline, the mid-point and the post-programme assessment that become the impact report within ten business days.",
  },
];

const credentials = [
  { icon: BadgeCheck, label: "Level One B-BBEE contributor" },
  { icon: MapPin, label: "South Africa based" },
  { icon: Globe2, label: "Partners across Africa and Europe" },
];

export default function About() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">About EdMeCa</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Making business-level thinking work for the people who need it.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            A unique blend of industry insight, academic rigour and practical digital tools, delivered by facilitators
            working from one playbook. We develop people to become future tech leaders. We measure the shift and share
            the evidence.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="eyebrow">Our story</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">From frameworks to our own brand.</h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  EdMeCa was founded to make MBA-level business frameworks usable by the people who need them most:
                  entrepreneurs, and the programme owners who back them.
                </p>
                <p>
                  We grew through enterprise and supplier development programmes and accelerator cohorts, learning
                  what it takes to move a cohort from a framework to a usable output, and to show the change.
                </p>
                <p>
                  Today EdMeCa builds its own content and delivers under its own brand, co-branded with a programme
                  owner where that helps. QCTO alignment is the design principle for all new content, and accredited
                  pathways are the direction we are building toward.
                </p>
              </div>
            </div>
            {/* Sage panel with the D-mark until a brand-compliant photograph is supplied (plan Phase 7). */}
            <div className="rounded-2xl border bg-secondary flex items-center justify-center aspect-[4/3] lg:aspect-square">
              <img src="/brand/edmeca-mark.png" alt="" role="presentation" width="490" height="512" className="w-2/5 h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <p className="eyebrow">Our approach</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight mb-10">Onboard, refresh, sprint, measure.</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {approach.map((step, index) => (
            <li key={step.title} className="rounded-lg border bg-card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Value statement, short form, with the three beneficiary lines */}
      <section className="bg-brand-blue-deep text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h2 className="max-w-3xl text-3xl sm:text-4xl font-bold tracking-tight">
            Research-backed AI capability that turns learning into <span className="text-accent">earning.</span>
          </h2>
          <ul className="mt-10 grid md:grid-cols-3 gap-6">
            {beneficiaries.map((item) => (
              <li key={item.group} className="border-t border-white/20 pt-5">
                <p className="eyebrow eyebrow-on-dark">{item.group}</p>
                <p className="mt-2 text-white/85 leading-relaxed">{item.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10 text-center">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value) => (
            <Card key={value.title} className="rounded-2xl">
              <CardContent className="p-6 lg:p-8">
                <value.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold text-primary">{value.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Co-founders by role, People slide layout with the D-mark in place of a portrait */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Our co-founders</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Three co-founders, each leading one part of the business.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {cofounders.map((cofounder) => (
              <article key={cofounder.role} className="rounded-2xl border bg-background p-6 lg:p-8 flex flex-col">
                <div className="rounded-xl bg-secondary flex items-center justify-center aspect-[3/2]">
                  <img src="/brand/edmeca-mark.png" alt="" role="presentation" width="490" height="512" className="w-1/4 h-auto" />
                </div>
                <h3 className="eyebrow mt-6 leading-snug">{cofounder.role}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{cofounder.narrative}</p>
              </article>
            ))}
          </div>
          <ul className="mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-primary">
            {credentials.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="rounded-2xl border bg-secondary p-8 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Let's talk about your programme.</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Write to info@edmeca.co.za or book a discovery call. A proposal follows within five working days.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" asChild>
              <Button variant="cta" size="lg" data-testid="button-about-contact">
                Book a discovery call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/engagement" asChild>
              <Button variant="outline-brand" size="lg">See how we engage</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
