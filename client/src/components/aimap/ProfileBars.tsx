import { type Axis, axisLabels, dimensions } from "@/data/aiMap";
import type { AIMapResult, Movement } from "@/lib/aiMap";
import { signed } from "@/lib/aiMapCopy";

type Props = { result: AIMapResult; movement?: Movement | null };

/** Eight horizontal bars grouped under the two axes; the two priority dimensions in purple. */
export function ProfileBars({ result, movement }: Props) {
  const axes: Axis[] = ["capability", "readiness"];
  return (
    <div className="grid gap-6">
      {axes.map((axis) => (
        <div key={axis}>
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-bold text-edmeca-purple">{axisLabels[axis]}</h4>
            <span className="text-sm font-bold text-edmeca-purple">{result[axis]}</span>
          </div>
          <ul className="mt-2 grid gap-2">
            {dimensions.filter((dimension) => dimension.axis === axis).map((dimension) => {
              const score = result.dimensions[dimension.code];
              const priority = result.priorities.includes(dimension.code);
              const change = movement?.dimensions[dimension.code];
              return (
                <li key={dimension.code}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className={priority ? "font-bold text-edmeca-purple" : "text-edmeca-grey"}>{dimension.code} {dimension.name}{priority && <span className="ml-2 rounded-full bg-edmeca-purple-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-edmeca-purple">priority</span>}</span>
                    <span className={`font-semibold ${priority ? "text-edmeca-purple" : "text-edmeca-grey"}`}>{score === null ? "n/a" : score}{typeof change === "number" && change !== 0 && <span className={`ml-1 text-[10px] ${change > 0 ? "text-edmeca-green" : "text-red-600"}`}>{signed(change)}</span>}</span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-edmeca-green-tint" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score ?? 0} aria-label={`${dimension.name} ${score ?? "not assessed"}`}>
                    <div className={`h-full rounded-full ${priority ? "bg-edmeca-purple" : "bg-edmeca-green"}`} style={{ width: `${score ?? 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
