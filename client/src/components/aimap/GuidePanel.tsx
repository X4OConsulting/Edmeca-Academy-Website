import { ChevronLeft, ChevronRight, CircleHelp } from "lucide-react";
import { type Answer, type ItemId, type RespondentMode, axisShortLabels, dimensionFor, itemFor } from "@/data/aiMap";
import { ScaleControl } from "./ScaleControl";

type Props = {
  itemId: ItemId;
  mode: RespondentMode;
  value?: Answer;
  index: number;
  total: number;
  onAnswer: (value: Answer) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/** One statement at a time: dimension label, statement, why it matters, the five-point scale. */
export function GuidePanel({ itemId, mode, value, index, total, onAnswer, onPrev, onNext }: Props) {
  const item = itemFor(itemId);
  const dimension = dimensionFor(item.dimension);
  const headingId = `ai-map-statement-${itemId}`;
  return (
    <section aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">{dimension.code}, {dimension.name}</p>
        <span className="rounded-full bg-edmeca-purple-soft px-3 py-1 text-xs font-bold text-edmeca-purple">{axisShortLabels[dimension.axis]}</span>
      </div>
      <h2 id={headingId} className="mt-3 text-xl font-bold leading-snug text-edmeca-purple sm:text-2xl">{item[mode]}</h2>
      <p className="mt-4 flex gap-2 text-sm leading-relaxed text-edmeca-grey"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-edmeca-green" />{item.why}</p>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-edmeca-grey">How true is this today?</p>
      <div className="mt-2"><ScaleControl value={value} onChange={onAnswer} labelledBy={headingId} /></div>
      <div className="mt-6 flex items-center justify-between text-xs text-edmeca-grey">
        <button type="button" onClick={onPrev} disabled={!onPrev} className="inline-flex items-center gap-1 font-semibold text-edmeca-purple disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Back</button>
        <span>{index} of {total} <span className="hidden sm:inline">· keys 1 to 5 answer</span></span>
        <button type="button" onClick={onNext} disabled={!onNext} className="inline-flex items-center gap-1 font-semibold text-edmeca-purple disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
  );
}
