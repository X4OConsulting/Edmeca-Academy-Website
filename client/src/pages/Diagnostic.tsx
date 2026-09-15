import { useEffect } from "react";
import { ArrowRight, Briefcase, User } from "lucide-react";
import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

/**
 * The Diagnostic entry page. Visitors say whether they are answering as an
 * individual or as an entrepreneur running a venture, and are routed to the
 * AI Enablement Baseline or the Execution Gap diagnostic respectively.
 */
export default function Diagnostic() {
  useEffect(() => {
    document.title = "Diagnostic | Edmeca";
    document.documentElement.classList.add("diagnostic-mode");
    return () => document.documentElement.classList.remove("diagnostic-mode");
  }, []);

  const tile = "group flex h-full flex-col rounded-2xl border border-edmeca-green-soft bg-white p-6 text-left shadow-sm transition hover:border-edmeca-purple hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-edmeca-purple sm:p-8";

  return (
    <MarketingLayout>
      <div className="diagnostic diagnostic-page bg-background">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-edmeca-purple">Free diagnostics. No account.</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-edmeca-purple sm:text-5xl">Who are you answering as?</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-edmeca-grey">Two short instruments, two different questions. Pick the one that fits and we will take you straight there.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Link href="/ai-map?for=individual" className={tile}>
              <span className="inline-flex w-fit rounded-lg bg-edmeca-green-tint p-3 text-edmeca-green"><User className="h-6 w-6" /></span>
              <span className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-edmeca-green">I am an individual</span>
              <span className="mt-2 text-2xl font-bold text-edmeca-purple">Where am I on the AI Enablement Map?</span>
              <span className="mt-3 flex-1 text-sm leading-relaxed text-edmeca-grey">A founder, a professional or a programme participant answering for yourself. Eight minutes, 24 statements, and a dot that moves as you answer. You leave with your position, your two priorities and a report.</span>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-edmeca-purple">Place my dot <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>

            <Link href="/execution-gap" className={tile}>
              <span className="inline-flex w-fit rounded-lg bg-edmeca-purple-soft p-3 text-edmeca-purple"><Briefcase className="h-6 w-6" /></span>
              <span className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">I am an entrepreneur</span>
              <span className="mt-2 text-2xl font-bold text-edmeca-purple">Do I know more than I use?</span>
              <span className="mt-3 flex-1 text-sm leading-relaxed text-edmeca-grey">Running or building a venture. Six minutes across six capabilities, mapping where you stall between Framework, Execution and Evidence, with two gaps to close this month.</span>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-edmeca-purple">Map my gaps <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </div>

          <p className="mt-8 text-sm text-edmeca-grey">Answering for a business or team on the AI Enablement Map? <Link href="/ai-map?for=business" className="font-semibold text-edmeca-purple underline-offset-2 hover:underline">Start the business version</Link>. Programme cohorts use the link their programme sent them.</p>
        </section>
      </div>
    </MarketingLayout>
  );
}
