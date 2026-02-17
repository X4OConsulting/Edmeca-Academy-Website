import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ArrowRight, CheckCircle2, Star, Zap, Crown } from "lucide-react";

const tiers = [
  {
    icon: Zap,
    name: "Focused Session",
    subtitle: "Single Intervention",
    price: "Custom",
    duration: "1-2 days",
    description: "A targeted workshop or session focused on a specific framework or business challenge.",
    features: [
      "Single framework deep-dive",
      "BMC workshop OR design sprint OR pitch prep",
      "Hands-on tool access during session",
      "Exported deliverables",
      "Follow-up resources",
    ],
    ideal: "Entrepreneurs needing quick clarity on a specific area, or teams wanting a focused intervention.",
    cta: "Book a Session",
    popular: false,
  },
  {
    icon: Star,
    name: "Mid-Tier Journey",
    subtitle: "Targeted Interventions",
    price: "Custom",
    duration: "4-8 weeks",
    description: "A structured series of 4-5 interventions covering key business frameworks and tools.",
    features: [
      "4-5 targeted framework sessions",
      "Full platform access during engagement",
      "AI-assisted tool guidance",
      "Progress tracking",
      "Pitch deck development",
      "Email support",
    ],
    ideal: "Entrepreneurs building their first business model and investor pitch, or programmes running intensive bootcamps.",
    cta: "Learn More",
    popular: true,
  },
  {
    icon: Crown,
    name: "Full Journey",
    subtitle: "Comprehensive Partnership",
    price: "Custom",
    duration: "6-12 months",
    description: "End-to-end entrepreneurial support from ideation to investor-ready, with comprehensive tooling.",
    features: [
      "Complete framework library access",
      "Unlimited platform usage",
      "AI-powered tools and suggestions",
      "Baseline-to-outcome tracking",
      "Regular coaching sessions",
      "Priority support",
      "White-label options for programmes",
      "M&E reporting and dashboards",
    ],
    ideal: "Serious entrepreneurs building investable businesses, or development programmes seeking scalable, measurable interventions.",
    cta: "Talk to Our Team",
    popular: false,
  },
];

const faq = [
  {
    question: "How do I know which tier is right for me?",
    answer: "It depends on your goals and timeline. If you need quick clarity on one area, start with a Focused Session. If you're building a complete business case, the Mid-Tier Journey gives you everything you need. For long-term support and comprehensive tooling, the Full Journey is ideal.",
  },
  {
    question: "Can programmes get custom pricing?",
    answer: "Absolutely. We work with enterprise development programmes, incubators, and accelerators on custom engagements that include multi-cohort access, M&E reporting, and white-label options. Contact us for a tailored proposal.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! You can create a free account to explore the platform and see how the tools work. The free tier gives you limited access to our core frameworks.",
  },
  {
    question: "What kind of support is included?",
    answer: "All tiers include access to our help resources and community. Mid-Tier includes email support, and Full Journey includes priority support with dedicated check-ins.",
  },
];

export default function Engagement() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Engagement Options
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Choose the level of support that matches your needs—from focused sessions 
              to comprehensive entrepreneurial partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <Card 
              key={tier.name} 
              className={`relative hover-elevate overflow-visible h-full flex flex-col ${tier.popular ? 'ring-2 ring-accent' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tier.popular ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent'}`}>
                    <tier.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <p className="text-2xl font-bold">{tier.price}</p>
                  <p className="text-sm text-muted-foreground">{tier.duration}</p>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {tier.description}
                </p>
                
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-4">
                    <strong>Ideal for:</strong> {tier.ideal}
                  </p>
                  <Link href="/contact" asChild>
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-tier-${tier.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-y">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {faq.map((item) => (
              <div key={item.question} className="border-b pb-6 last:border-0">
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl p-8 lg:p-16 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Let's Find the Right Fit
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Book a free consultation call and we'll help you identify the engagement 
            option that best matches your goals and budget.
          </p>
          <div className="mt-8">
            <Link href="/contact" asChild>
              <Button size="lg" data-testid="button-engagement-consult">
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
