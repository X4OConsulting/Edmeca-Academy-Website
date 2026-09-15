import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { type Quadrant, quadrants } from "@/data/aiMap";
import { MapMiniature } from "./MapMiniature";

type Props = { onStart: () => void; cohortLabel?: string; returning?: boolean };

const order: Quadrant[] = ["starters", "pathseekers", "transformers", "fuelled"];

export function Landing({ onStart, cohortLabel, returning }: Props) {
  return (
    <div className="diagnostic diagnostic-page bg-background">
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-edmeca-purple">Free baseline. Eight minutes.</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-edmeca-purple sm:text-6xl">Where are you on the AI Enablement Map?</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-edmeca-grey">Capability is what you can do with AI. Readiness is whether it will stick. Most businesses have one without the other. Find out which, and what moves you.</p>
            {cohortLabel && <p className="mt-4 inline-flex rounded-full bg-edmeca-green-tint px-3 py-1 text-sm font-semibold text-edmeca-green">Answering as part of {cohortLabel}</p>}
            {returning && <p className="mt-4 rounded-lg border border-edmeca-green-soft bg-edmeca-green-tint p-3 text-sm text-edmeca-grey">Welcome back. Your earlier baseline is loaded, so your results will show how far your dot has moved.</p>}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button onClick={onStart} size="lg" className="bg-edmeca-purple text-white hover:bg-edmeca-purple/90">{returning ? "Move my dot" : "Place my dot"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <span className="text-sm text-edmeca-grey">Free. No account. Answer for your business or for yourself.</span>
            </div>
            <p className="mt-6 text-sm text-edmeca-grey">Running a venture and want the Framework, Execution and Evidence view instead? <Link href="/execution-gap" className="font-semibold text-edmeca-purple underline-offset-2 hover:underline">Take the Execution Gap diagnostic</Link>.</p>
          </div>
          <div className="rounded-2xl border border-edmeca-green-soft bg-edmeca-green-tint p-6 sm:p-8">
            <MapMiniature className="h-auto w-full" />
            <p className="mt-5 text-sm leading-relaxed text-edmeca-grey">Your dot moves as you answer 24 short statements. Nothing is judged until you say "show my position".</p>
          </div>
        </div>
      </section>
      <section className="border-y border-edmeca-green-soft bg-edmeca-green-tint/50">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-edmeca-purple">The four quadrants</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {order.map((id) => {
              const copy = quadrants[id];
              return (
                <article key={id} className="rounded-xl border border-edmeca-green-soft p-5" style={{ backgroundColor: copy.tint }}>
                  <h3 className="font-bold text-edmeca-purple">{copy.name}</h3>
                  <p className="text-xs font-semibold text-edmeca-grey">{copy.position}</p>
                  <p className="mt-3 text-sm leading-relaxed text-edmeca-grey">{copy.reading}</p>
                </article>
              );
            })}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-edmeca-grey">Programmes use the same 24 statements as a baseline before Session 1 and a measure after Session 6, so every participant, and the programme itself, can see the dot move. Cohort members answer with their programme code and still get their own results and report.</p>
        </div>
      </section>
    </div>
  );
}
