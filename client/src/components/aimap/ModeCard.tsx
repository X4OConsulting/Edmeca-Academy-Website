import { Building2, User } from "lucide-react";
import type { RespondentMode } from "@/data/aiMap";

type Props = { mode?: RespondentMode; onSelect: (mode: RespondentMode) => void };

const tiles: { value: RespondentMode; title: string; detail: string; Icon: typeof User }[] = [
  { value: "business", title: "My business or team", detail: "Statements are phrased for the business: what we do, who owns it, what our rules are.", Icon: Building2 },
  { value: "individual", title: "Myself", detail: "Statements are phrased for you: what you can do, how you learn, what you check.", Icon: User },
];

export function ModeCard({ mode, onSelect }: Props) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">First, one choice</p>
      <h2 className="mt-3 text-2xl font-bold text-edmeca-purple">Who are you answering for?</h2>
      <p className="mt-2 text-sm leading-relaxed text-edmeca-grey">Same map, same scoring. This sets how each statement is phrased.</p>
      <div className="mt-6 grid gap-3">
        {tiles.map(({ value, title, detail, Icon }) => (
          <button key={value} type="button" onClick={() => onSelect(value)} className={`flex items-start gap-4 rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-edmeca-purple ${mode === value ? "border-edmeca-purple bg-edmeca-purple-soft" : "border-edmeca-green-soft bg-white hover:border-edmeca-purple"}`}>
            <span className="rounded-lg bg-edmeca-green-tint p-2 text-edmeca-green"><Icon className="h-5 w-5" /></span>
            <span><span className="block font-bold text-edmeca-purple">{title}</span><span className="mt-1 block text-sm text-edmeca-grey">{detail}</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}
