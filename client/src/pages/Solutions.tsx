import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { ArrowRight } from "lucide-react";

// The market offering stack from docs/STRATEGY_POSITIONS_2026-10.md, in the plan's four groups.
// "For" lines are the Primary segments column. Each card links to the contact form with the offering
// preset (`?offering=`); the form reads it from Phase 8.

type Offering = {
  slug: string;
  title: string;
  description: string;
  forLine: string;
  tag?: string;
  extraLink?: { href: string; label: string };
};

type OfferingGroup = { id: string; title: string; offerings: Offering[] };

const groups: OfferingGroup[] = [
  {
    id: "programmes",
    title: "Programmes",
    offerings: [
      {
        slug: "digital-leader-module",
        title: "Digital Leader Module",
        description:
          "Our signature opener: a 10-dimension baseline on a maturity scale of 1 to 4, with cohort profiling and an AI opportunity map. It is the PRE in PRE and POST.",
        forLine: "Every client type",
      },
      {
        slug: "ai-for-leaders",
        title: "AI for Leaders and the AI Catalyst Journey",
        description: "An executive session, then a six-session programme for teams.",
        forLine: "Corporates and learning institutions",
      },
      {
        slug: "smme-cohort-module",
        title: "AI and digital module inside an SMME cohort",
        description:
          "Delivered under the EdMeCa brand, co-branded with the programme owner where that helps, with an impact report.",
        forLine: "ESD programme owners",
      },
      {
        slug: "youthpreneur",
        title: "Youthpreneur",
        description: "A youth variant for TVET incubators and youth programmes, QCTO-aligned.",
        forLine: "Learning institutions, SETAs and funders",
        tag: "In development",
      },
    ],
  },
  {
    id: "evidence",
    title: "Evidence services",
    offerings: [
      {
        slug: "impact-reporting",
        title: "Impact Reporting",
        description:
          "Our entry product, offered on its own: baseline, mid and post assessments, with a consolidated report within 10 business days, formatted for funder reporting.",
        forLine: "ESD programme owners, funders and learning institutions",
      },
      {
        slug: "research",
        title: "Research offering",
        description:
          "Sector and trend research for programme owners and institutions, produced by funded researchers who also build our content.",
        forLine: "Learning institutions and funders",
      },
    ],
  },
  {
    id: "pathways",
    title: "Accredited pathways",
    offerings: [
      {
        slug: "accredited-skills-programmes",
        title: "Accredited skills programmes",
        description:
          "QCTO-aligned, starting with AI and Automation User and related unit standards, assembled toward a higher certificate pathway with work-integrated learning and RPL entry.",
        forLine: "SETAs and learning institutions",
      },
      {
        slug: "staff-capacitation",
        title: "Staff capacitation",
        description: "Lecturer, research and operations staff capability, including train-the-trainer.",
        forLine: "Learning institutions",
      },
    ],
  },
  {
    id: "studio",
    title: "Digital tools",
    offerings: [
      {
        slug: "ai-business-studio",
        title: "AI Business Studio",
        description:
          "BMC and other templates, prompt building, the leadership tool and progress tracking, in one studio with business, individual and leader contexts. Offered as post-programme access, not a subscription.",
        forLine: "Every client type",
        extraLink: { href: "/studio", label: "About the Studio" },
      },
    ],
  },
];

export default function Solutions() {
  useScrollToHash();

  return (
    <MarketingLayout>
      {/* Hero: the proposition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">What we do</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Programmes, evidence, pathways and tools.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            A unique blend of industry insight, academic rigour and practical digital tools, delivered by facilitators
            working from one playbook. We develop people to become future tech leaders. We measure the shift and share
            the evidence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/contact" asChild>
              <Button variant="cta" size="lg" data-testid="button-solutions-cta">
                Book a discovery call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/diagnostic" asChild>
              <Button variant="outline-brand" size="lg">Take the free baseline</Button>
            </Link>
          </div>
          <nav aria-label="Offering groups" className="mt-10 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-primary hover:bg-secondary transition-colors"
              >
                {group.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Digital Leadership, once on this page */}
      <section className="bg-brand-blue-deep text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="eyebrow eyebrow-on-dark">Our positioning</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Digital <span className="text-accent">Leadership</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            Digital Leadership means leading, and digital. Leaders do not need to be digital experts, but they need
            enough insight to lead where digital, AI and cyber risk shape the business, together with established
            leadership competencies. Cyber security sits inside Digital Leadership. This is the natural overlap we
            position on, for corporates, ecosystems and institutions alike.
          </p>
        </div>
      </section>

      {/* The offering stack */}
      {groups.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          className={`scroll-mt-20 ${index % 2 === 1 ? "bg-card border-y" : ""}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">{group.title}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {group.offerings.map((offering) => (
                <Card key={offering.slug} className="rounded-2xl flex flex-col">
                  <CardContent className="p-6 lg:p-8 flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="eyebrow">{group.title}</p>
                      {offering.tag && (
                        <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-primary">
                          {offering.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-primary">{offering.title}</h3>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{offering.description}</p>
                    <p className="mt-4 text-sm">
                      <span className="font-semibold">For: </span>
                      <span className="text-muted-foreground">{offering.forLine}</span>
                    </p>
                    <div className="mt-auto pt-10 flex flex-wrap gap-x-6 gap-y-2">
                      <Link
                        href={`/contact?offering=${offering.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        data-testid={`link-offering-${offering.slug}`}
                      >
                        Ask about this offering
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {offering.extraLink && (
                        <Link href={offering.extraLink.href} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                          {offering.extraLink.label}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Closing CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="rounded-2xl border bg-secondary p-8 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Let's talk about your programme.</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            A proposal follows within five working days of a discovery call.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" asChild>
              <Button variant="cta" size="lg">
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
