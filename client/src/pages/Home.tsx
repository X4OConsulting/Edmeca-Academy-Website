import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  LineChart,
  Rocket,
  Sprout,
  Users,
  Wrench,
} from "lucide-react";

// Copy approved in docs/WEBSITE_REFRESH_CONTEXT.md (Phase 4 draft, 3 November 2026).

const beneficiaries = [
  {
    icon: Sprout,
    title: "Young people",
    description: "Made work-ready through Youthpreneur and accredited pathways.",
    tag: "Youthpreneur, in development",
  },
  {
    icon: Rocket,
    title: "Entrepreneurs and SMEs",
    description: "Businesses that last, with a usable output from every session.",
  },
  {
    icon: Users,
    title: "Leaders in corporates and ecosystems",
    description:
      "Digital Leadership means leading, and digital: enough insight to lead where digital, AI and cyber risk shape the business.",
  },
];

const commissioners = [
  "Corporates and skills development foundations",
  "ESD and supplier development programme owners",
  "Learning institutions and TVET colleges",
  "SETAs and training authorities",
  "Funders and foundations",
];

const offeringGroups = [
  {
    icon: Layers,
    title: "Programmes",
    offerings: [
      "Digital Leader Module",
      "AI for Leaders and the AI Catalyst Journey",
      "AI and digital module inside an SMME cohort",
      "Youthpreneur (in development)",
    ],
  },
  { icon: BarChart3, title: "Evidence services", offerings: ["Impact Reporting", "Research offering"] },
  {
    icon: GraduationCap,
    title: "Accredited pathways",
    offerings: ["Accredited skills programmes (QCTO-aligned)", "Staff capacitation"],
  },
  { icon: Wrench, title: "Digital tools", offerings: ["AI Business Studio, offered as post-programme access"] },
];

const steps = [
  { title: "AI onboarding first", description: "Participants get comfortable with AI before any framework is introduced." },
  { title: "Frameworks and a tools refresh", description: "Proven frameworks, worked through practical digital tools." },
  { title: "Sprint to a usable output", description: "Every session ends with something the business can use." },
  { title: "Measure and report", description: "A baseline, a mid-point and a post-programme assessment (PRE, MID, POST)." },
];

const evidenceClaims = [
  "A measurable maturity shift per participant.",
  "Tools adopted.",
  "A usable business output from every session.",
  "Funder-ready evidence.",
];

// Text tiles until each logo is cleared (decision 4.3).
const workedWith = [
  "Attacq",
  "Green Seeds",
  "Property Point",
  "Growthpoint",
  "EM Lyon",
  "Stellenbosch Business School",
  "Social Enterprise Academy",
  "Nedbank",
  "University of the Western Cape",
  "Serosoft (Academia)",
  "First Mutual Insurance",
];

const impactSampleHref = "mailto:info@edmeca.co.za?subject=Impact%20reporting%20sample";

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) {
  return (
    <div className="max-w-2xl mb-10 lg:mb-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

export default function Home() {
  // Arriving from another page at /#impact: the browser jumps before this page renders, so scroll once mounted.
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <MarketingLayout>
      {/* 1. Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="eyebrow">From Framework to Execution to Evidence</p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              We develop people into future tech leaders.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Proven business frameworks, delivered through AI-enabled, practical digital tools, with evidence of the
              shift from baseline to outcome.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/contact" asChild>
                <Button variant="cta" size="lg" data-testid="button-hero-cta">
                  Book a discovery call
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/diagnostic" asChild>
                <Button variant="outline-brand" size="lg" data-testid="button-hero-baseline">
                  Take the free baseline
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border bg-secondary flex items-center justify-center aspect-[4/3] lg:aspect-square">
            <img src="/brand/edmeca-mark.png" alt="" role="presentation" width="490" height="512" className="w-2/5 h-auto" />
          </div>
        </div>
      </section>

      {/* 2. Statement band: the long-form value statement, once per page */}
      <section className="bg-brand-blue-deep text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            EdMeCa turns learning into <span className="text-accent">earning.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            Our research-backed, AI-enabled programmes make young people work-ready, help entrepreneurs build businesses
            that last, and equip leaders to grow capability across their teams. We measure what changes and share it.
          </p>
        </div>
      </section>

      {/* 3. Who we develop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <SectionHeading eyebrow="Who we develop" title="Three groups, one playbook." />
        <div className="grid md:grid-cols-3 gap-6">
          {beneficiaries.map((group) => (
            <Card key={group.title} className="rounded-2xl">
              <CardContent className="p-6 lg:p-8">
                <group.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold text-primary">{group.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{group.description}</p>
                {group.tag && (
                  <span className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
                    {group.tag}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Who commissions our programmes */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="eyebrow mb-8">Who commissions our programmes</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {commissioners.map((name) => (
              <li key={name} className="flex items-start gap-3 rounded-lg border bg-background p-4 text-sm font-medium">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-muted-foreground">
            Delivered under the EdMeCa brand, co-branded with your programme where that helps.
          </p>
        </div>
      </section>

      {/* 5. What we do */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <SectionHeading eyebrow="What we do" title="Programmes, evidence, pathways and tools." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {offeringGroups.map((group) => (
            <Card key={group.title} className="rounded-2xl">
              <CardContent className="p-6">
                <group.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-primary">{group.title}</h3>
                <ul className="mt-3 space-y-2">
                  {group.offerings.map((offering) => (
                    <li key={offering} className="text-sm text-muted-foreground leading-relaxed">{offering}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link href="/solutions" className="mt-8 inline-flex items-center gap-2 font-medium text-primary hover:underline" data-testid="link-full-offering">
          See the full offering
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      {/* 6. How we work */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <SectionHeading eyebrow="How we work" title="Onboard, refresh, sprint, measure." />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-lg border bg-background p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-2xl bg-brand-blue-deep text-white p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <LineChart className="h-8 w-8 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Where are you on the AI Enablement Map?</h3>
                <p className="mt-2 text-white/80">Eight minutes, free, no account.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link href="/ai-map" asChild>
                <Button variant="cta" size="lg">Place my dot <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Link href="/execution-gap" asChild>
                <Button variant="ghost" size="lg" className="text-white hover:text-white">Execution Gap diagnostic</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Evidence: the four claims only, no figures and no case tiles until supplied */}
      <section id="impact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 scroll-mt-20">
        <SectionHeading eyebrow="Impact" title="What the evidence shows" />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {evidenceClaims.map((claim) => (
            <li key={claim} className="flex items-start gap-3 rounded-lg border bg-card p-6 shadow-sm">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-medium">{claim}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-muted-foreground leading-relaxed">
          Where a client needs financial growth and job creation reported, we define the measure, the timeframe and the
          attribution method before the programme starts.
        </p>

        <h3 className="mt-16 text-2xl font-bold tracking-tight">Who we have worked with</h3>
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {workedWith.map((name) => (
            <li key={name} className="flex min-h-20 items-center justify-center rounded-lg border bg-card p-4 text-center text-sm font-semibold text-primary">
              {name}
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Closing CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <div className="rounded-2xl border bg-secondary p-8 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Let's talk about your programme.</h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" asChild>
              <Button variant="cta" size="lg" data-testid="button-final-cta">
                Book a discovery call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline-brand" size="lg" asChild data-testid="button-impact-sample">
              <a href={impactSampleHref}>Request an impact reporting sample</a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
