import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { value: string; onChange: (value: string) => void; onContinue: () => void; onSkip: () => void; busy?: boolean };

const MAX = 2000;

export function ContextCard({ value, onChange, onContinue, onSkip, busy }: Props) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">Optional, but it makes the report yours</p>
      <h2 className="mt-3 text-2xl font-bold text-edmeca-purple">What is actually happening with AI for you right now?</h2>
      <p className="mt-2 text-sm leading-relaxed text-edmeca-grey">A few lines in your own words: what you use, what you tried and dropped, what you wish worked. Your report quotes you back.</p>
      <label className="sr-only" htmlFor="ai-map-context">What is actually happening with AI for you right now?</label>
      <textarea id="ai-map-context" value={value} maxLength={MAX} onChange={(event) => onChange(event.target.value)} rows={6} placeholder="For example: we use ChatGPT for quotes and proposals, but only two of us do. Nobody has written down what is allowed." className="mt-5 w-full rounded-lg border border-edmeca-green-soft bg-white px-3 py-3 text-sm text-edmeca-grey focus:border-edmeca-purple focus:outline-none" />
      <p className="mt-1 text-right text-xs text-edmeca-grey">{value.length} / {MAX}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={busy} onClick={onContinue} className="bg-edmeca-purple text-white hover:bg-edmeca-purple/90">Show my position <ArrowRight className="ml-2 h-4 w-4" /></Button>
        <Button disabled={busy} variant="outline" onClick={onSkip} className="border-edmeca-green text-edmeca-green">Skip and show my position</Button>
      </div>
    </section>
  );
}
