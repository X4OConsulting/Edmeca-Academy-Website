import { forwardRef, useEffect, useState } from "react";
import { type ItemId, type Quadrant, type RespondentMode, axisLabels, dimensions, quadrants, statementFor } from "@/data/aiMap";
import { type AIMapResult, ON_THE_LINE_BAND } from "@/lib/aiMap";

export type TrailPoint = { itemId: ItemId; capability: number; readiness: number };

export const MAP_SIZE = 640;
const PLOT = { left: 72, top: 36, right: 612, bottom: 562 };
const PLOT_W = PLOT.right - PLOT.left;
const PLOT_H = PLOT.bottom - PLOT.top;
const MID_X = PLOT.left + PLOT_W / 2;
const MID_Y = PLOT.top + PLOT_H / 2;

export const GREEN = "#6E9A43";
export const GREEN_SOFT = "#C9DDB3";
export const PURPLE = "#53317A";
export const GREY = "#5D6266";

const litTint: Record<Quadrant, string> = { starters: "#E3E6EA", pathseekers: "#DAE8C6", transformers: "#E2D7EF", fuelled: "#D3E2C8" };

export function mapPoint(capability: number, readiness: number) {
  return { x: PLOT.left + (Math.max(0, Math.min(100, readiness)) / 100) * PLOT_W, y: PLOT.bottom - (Math.max(0, Math.min(100, capability)) / 100) * PLOT_H };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

type QuadrantCorner = { id: Quadrant; x: number; y: number; anchor: "start" | "end"; baseline: "hanging" | "auto" };
const corners: QuadrantCorner[] = [
  { id: "pathseekers", x: PLOT.left + 14, y: PLOT.top + 16, anchor: "start", baseline: "hanging" },
  { id: "fuelled", x: PLOT.right - 14, y: PLOT.top + 16, anchor: "end", baseline: "hanging" },
  { id: "starters", x: PLOT.left + 14, y: PLOT.bottom - 36, anchor: "start", baseline: "auto" },
  { id: "transformers", x: PLOT.right - 14, y: PLOT.bottom - 36, anchor: "end", baseline: "auto" },
];

export type EnablementMapProps = {
  capability: number;
  readiness: number;
  mode: RespondentMode;
  trail?: TrailPoint[];
  activeItem?: ItemId;
  onTrailPoint?: (itemId: ItemId) => void;
  result?: AIMapResult | null;
  resolved?: boolean;
  previous?: { capability: number; readiness: number } | null;
  compact?: boolean;
  logoHref?: string;
  className?: string;
  id?: string;
  /** Static export: no transitions, no animation. */
  still?: boolean;
  /** Explicit size in user units, needed when nested inside another SVG (the Map Card). */
  width?: number;
  height?: number;
};

/**
 * The signature SVG: axes, four tinted quadrants, the respondent's dot, the
 * dotted trail of answers, dimension ticks and the on-the-line band once
 * resolved. Everything is drawn in a 640 x 640 viewBox so the same component
 * serves the live map, the compact mobile square and the Map Card export.
 */
export const EnablementMap = forwardRef<SVGSVGElement, EnablementMapProps>(function EnablementMap(
  { capability, readiness, mode, trail = [], activeItem, onTrailPoint, result, resolved = false, previous, compact = false, logoHref, className, id, still = false, width, height },
  ref,
) {
  const reduced = usePrefersReducedMotion() || still;
  const dot = mapPoint(capability, readiness);
  const quadrant = result?.quadrant;
  const label = result
    ? `AI Enablement Map. Capability ${result.capability} out of 100, readiness ${result.readiness} out of 100. You are in the ${quadrants[result.quadrant].name} quadrant${result.onTheLine ? ", close to the line" : ""}.`
    : `AI Enablement Map. Your dot is at capability ${Math.round(capability)} and readiness ${Math.round(readiness)}. It moves as you answer.`;
  const transition = reduced ? undefined : "transform .45s cubic-bezier(.2,.8,.2,1)";
  const onLineCapability = result?.onTheLine && Math.abs(result.capability - 50) <= ON_THE_LINE_BAND;
  const onLineReadiness = result?.onTheLine && Math.abs(result.readiness - 50) <= ON_THE_LINE_BAND;
  const band = (PLOT_W / 100) * ON_THE_LINE_BAND;

  return (
    <svg ref={ref} id={id} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} width={width} height={height} className={className} role="img" aria-label={label} style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="#ffffff" />
      {/* Quadrants */}
      {(["pathseekers", "fuelled", "starters", "transformers"] as Quadrant[]).map((quadrantId) => {
        const isTop = quadrantId === "pathseekers" || quadrantId === "fuelled";
        const isLeft = quadrantId === "pathseekers" || quadrantId === "starters";
        const lit = resolved && quadrant === quadrantId;
        return <rect key={quadrantId} x={isLeft ? PLOT.left : MID_X} y={isTop ? PLOT.top : MID_Y} width={PLOT_W / 2} height={PLOT_H / 2} fill={lit ? litTint[quadrantId] : quadrants[quadrantId].tint} style={{ transition: reduced ? undefined : "fill .6s ease" }} />;
      })}
      {/* On the line band */}
      {onLineCapability && <rect x={PLOT.left} y={MID_Y - band} width={PLOT_W} height={band * 2} fill={PURPLE} fillOpacity=".08" />}
      {onLineReadiness && <rect x={MID_X - band} y={PLOT.top} width={band * 2} height={PLOT_H} fill={PURPLE} fillOpacity=".08" />}
      {/* Grid and axes */}
      <line x1={MID_X} y1={PLOT.top} x2={MID_X} y2={PLOT.bottom} stroke="#ffffff" strokeWidth="3" />
      <line x1={PLOT.left} y1={MID_Y} x2={PLOT.right} y2={MID_Y} stroke="#ffffff" strokeWidth="3" />
      <rect x={PLOT.left} y={PLOT.top} width={PLOT_W} height={PLOT_H} fill="none" stroke={GREEN_SOFT} strokeWidth="2" />
      {/* Quadrant names */}
      {!compact && corners.map((corner) => {
        const lit = resolved && quadrant === corner.id;
        const copy = quadrants[corner.id];
        return (
          <g key={corner.id}>
            <text x={corner.x} y={corner.y} textAnchor={corner.anchor} dominantBaseline={corner.baseline} fill={lit ? PURPLE : GREY} fontSize={lit ? 20 : 17} fontWeight="700">{copy.name}</text>
            <text x={corner.x} y={corner.y + (corner.baseline === "hanging" ? 24 : 18)} textAnchor={corner.anchor} dominantBaseline={corner.baseline} fill={GREY} fontSize="11">{copy.subtitle}</text>
          </g>
        );
      })}
      {/* Axis labels */}
      {!compact && (
        <>
          <text transform={`translate(24 ${MID_Y}) rotate(-90)`} textAnchor="middle" fill={PURPLE} fontSize="12" fontWeight="700" letterSpacing="2">{axisLabels.capability.toUpperCase()}</text>
          <text x={MID_X} y={MAP_SIZE - 8} textAnchor="middle" fill={PURPLE} fontSize="12" fontWeight="700" letterSpacing="2">{axisLabels.readiness.toUpperCase()}</text>
          <text x={PLOT.left - 8} y={PLOT.top + 6} textAnchor="end" fill={GREY} fontSize="10">100</text>
          <text x={PLOT.left - 8} y={PLOT.bottom} textAnchor="end" fill={GREY} fontSize="10">0</text>
          <text x={PLOT.left - 8} y={MID_Y + 4} textAnchor="end" fill={GREY} fontSize="10">50</text>
          {/* Bottom numbers give way to the dimension ticks once resolved */}
          {!(resolved && result) && <text x={PLOT.right} y={PLOT.bottom + 14} textAnchor="end" fill={GREY} fontSize="10">100</text>}
          {!(resolved && result) && <text x={MID_X} y={PLOT.bottom + 14} textAnchor="middle" fill={GREY} fontSize="10">50</text>}
        </>
      )}
      {/* Dimension ticks once resolved */}
      {resolved && result && !compact && dimensions.map((dimension) => {
        const score = result.dimensions[dimension.code];
        if (score === null) return null;
        if (dimension.axis === "capability") {
          const y = mapPoint(score, 0).y;
          return <g key={dimension.code}><line x1={PLOT.left} y1={y} x2={PLOT.left + 12} y2={y} stroke={PURPLE} strokeWidth="2" /><text x={PLOT.left + 16} y={y + 3} fill={PURPLE} fontSize="9" fontWeight="700">{dimension.code}</text></g>;
        }
        const x = mapPoint(0, score).x;
        return <g key={dimension.code}><line x1={x} y1={PLOT.bottom} x2={x} y2={PLOT.bottom + 22} stroke={PURPLE} strokeWidth="2" /><text x={x} y={PLOT.bottom + 34} textAnchor="middle" fill={PURPLE} fontSize="9" fontWeight="700">{dimension.code}</text></g>;
      })}
      {/* Trail */}
      {trail.length > 1 && (
        <polyline points={trail.map((point) => { const p = mapPoint(point.capability, point.readiness); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity={resolved ? 0 : 0.9} style={{ transition: reduced ? undefined : "opacity 1s ease" }} />
      )}
      {!resolved && trail.map((point) => {
        const p = mapPoint(point.capability, point.readiness);
        const active = point.itemId === activeItem;
        return (
          <circle
            key={point.itemId}
            cx={p.x}
            cy={p.y}
            r={active ? 6 : 4.5}
            fill={active ? PURPLE : "#ffffff"}
            stroke={active ? PURPLE : GREEN}
            strokeWidth="2"
            role="button"
            tabIndex={onTrailPoint ? 0 : -1}
            aria-label={`Revisit statement ${point.itemId}: ${statementFor(point.itemId, mode)}`}
            style={{ cursor: onTrailPoint ? "pointer" : undefined }}
            onClick={() => onTrailPoint?.(point.itemId)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onTrailPoint?.(point.itemId); } }}
          />
        );
      })}
      {/* Movement vector from the previous baseline */}
      {previous && resolved && (() => {
        const from = mapPoint(previous.capability, previous.readiness);
        return (
          <g>
            <line x1={from.x} y1={from.y} x2={dot.x} y2={dot.y} stroke={GREEN} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />
            <circle cx={from.x} cy={from.y} r="8" fill="#ffffff" stroke={GREEN} strokeWidth="3" />
            {!compact && <text x={from.x} y={from.y - 14} textAnchor="middle" fill={GREEN} fontSize="10" fontWeight="700">baseline</text>}
          </g>
        );
      })()}
      {/* The dot */}
      <g style={{ transform: `translate(${dot.x}px, ${dot.y}px)`, transition }}>
        {resolved && !reduced && <circle r="12" fill="none" stroke={PURPLE} strokeWidth="3" opacity="0"><animate attributeName="r" from="12" to="34" dur="1.4s" begin="0s" repeatCount="2" /><animate attributeName="opacity" from=".6" to="0" dur="1.4s" begin="0s" repeatCount="2" /></circle>}
        <circle r={compact ? 14 : 12} fill={PURPLE} stroke="#ffffff" strokeWidth="3" />
      </g>
      {logoHref && <image href={logoHref} x={PLOT.right - 96} y={MID_Y - 40} width="84" height="48" preserveAspectRatio="xMidYMid meet" opacity=".9" />}
    </svg>
  );
});
