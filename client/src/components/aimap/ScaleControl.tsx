import { type Answer, scale } from "@/data/aiMap";

type Props = { value?: Answer; onChange: (value: Answer) => void; labelledBy: string; disabled?: boolean };

/** Not at all / A little / Partly / Mostly / Fully. A radio group named by the statement it answers. */
export function ScaleControl({ value, onChange, labelledBy, disabled }: Props) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-labelledby={labelledBy}>
      {scale.map((option) => {
        const selected = value === option.value;
        const full = option.value === 4;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[3.25rem] flex-col items-center justify-center rounded-lg border px-1 py-2 text-center text-[11px] font-semibold leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-edmeca-purple sm:text-xs ${
              selected
                ? full ? "border-edmeca-green bg-edmeca-green text-white" : "border-edmeca-purple bg-edmeca-purple text-white"
                : "border-edmeca-green-soft bg-white text-edmeca-grey hover:border-edmeca-purple"
            }`}
          >
            <span className={`mb-1 text-[10px] font-bold ${selected ? "text-white/80" : "text-edmeca-green"}`}>{option.value + 1}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
