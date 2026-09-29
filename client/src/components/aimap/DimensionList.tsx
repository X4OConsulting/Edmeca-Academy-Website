import { type Answers, type ItemId, type Wave, axisShortLabels, dimensions } from "@/data/aiMap";
import { isAnswer, itemsForWave } from "@/lib/aiMap";

type Props = { answers: Answers; activeItem?: ItemId; wave: Wave; onSelect: (itemId: ItemId) => void; disabled?: boolean };

/** Eight rows under the map, each with a three-cell progress mark. Tapping a row jumps to its first unanswered statement. */
export function DimensionList({ answers, activeItem, wave, onSelect, disabled }: Props) {
  const inWave = new Set(itemsForWave(wave));
  return (
    <div className="grid min-w-0 gap-x-6 gap-y-1 sm:grid-cols-2" role="list" aria-label="Dimensions">
      {dimensions.map((dimension) => {
        const cells = dimension.items.filter((id) => inWave.has(id));
        if (cells.length === 0) return null;
        const target = cells.find((id) => !isAnswer(answers[id])) ?? cells[0];
        const active = activeItem !== undefined && dimension.items.includes(activeItem);
        return (
          <button
            key={dimension.code}
            type="button"
            role="listitem"
            disabled={disabled}
            onClick={() => onSelect(target)}
            className={`flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-edmeca-green-tint disabled:cursor-default disabled:hover:bg-transparent ${active ? "bg-edmeca-purple-soft/50" : ""}`}
            aria-label={`${dimension.code} ${dimension.name} (${axisShortLabels[dimension.axis]}), ${cells.filter((id) => isAnswer(answers[id])).length} of ${cells.length} answered`}
          >
            <span className="min-w-0 truncate"><span className="font-bold text-edmeca-purple">{dimension.code}</span> <span className="text-edmeca-grey">{dimension.name}</span></span>
            <span className="flex shrink-0 gap-0.5" aria-hidden="true">
              {cells.map((id) => <span key={id} className={`h-2.5 w-3 rounded-sm ${isAnswer(answers[id]) ? "bg-edmeca-green" : id === activeItem ? "bg-edmeca-purple" : "bg-edmeca-green-soft"}`} />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
