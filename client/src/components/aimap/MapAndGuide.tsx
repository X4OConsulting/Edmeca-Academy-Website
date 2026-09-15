import { type ReactNode, useState } from "react";
import { ChevronLeft, Maximize2, Minimize2 } from "lucide-react";

type Props = {
  eyebrow: string;
  hint: string;
  badge?: string;
  map: ReactNode;
  compactMap: ReactNode;
  dimensionList?: ReactNode;
  guide: ReactNode;
  onExit: () => void;
};

/**
 * Two panels on desktop (map left, guide right, about 58 / 42). On mobile the
 * map collapses to a 160 px square pinned under the header, with the guide
 * below it; tapping the square expands the full map.
 */
export function MapAndGuide({ eyebrow, hint, badge, map, compactMap, dimensionList, guide, onExit }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="diagnostic diagnostic-page min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-edmeca-purple">{eyebrow}</p>
            <p className="mt-1 text-sm text-edmeca-grey">{hint}</p>
            {badge && <p className="mt-2 inline-flex rounded-full bg-edmeca-green-tint px-3 py-1 text-xs font-semibold text-edmeca-green">{badge}</p>}
          </div>
          <button type="button" onClick={onExit} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-edmeca-purple"><ChevronLeft className="h-4 w-4" /> Exit</button>
        </div>

        {/* Mobile: compact square pinned under the header */}
        <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-edmeca-green-soft bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? "Collapse the map" : "Expand the map"} className={`relative shrink-0 overflow-hidden rounded-xl border border-edmeca-green-soft bg-white transition-all ${expanded ? "w-full" : "h-40 w-40"}`}>
              <div className={expanded ? "" : "h-40 w-40"}>{expanded ? map : compactMap}</div>
              <span className="absolute bottom-1.5 right-1.5 rounded-md bg-white/90 p-1 text-edmeca-purple shadow-sm">{expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}</span>
            </button>
            {!expanded && dimensionList && <div className="min-w-0 flex-1 text-xs">{dimensionList}</div>}
          </div>
          {expanded && dimensionList && <div className="mt-3">{dimensionList}</div>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[58fr_42fr]">
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-edmeca-green-soft bg-white p-3 shadow-sm">{map}</div>
            {dimensionList && <div className="mt-4 rounded-2xl border border-edmeca-green-soft bg-white p-3">{dimensionList}</div>}
          </div>
          <aside className="rounded-2xl border border-edmeca-green-soft bg-white p-5 shadow-sm sm:p-6 lg:p-8">{guide}</aside>
        </div>
      </div>
    </div>
  );
}
