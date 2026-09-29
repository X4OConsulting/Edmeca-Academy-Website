import { quadrants } from "@/data/aiMap";
import { GREEN, GREEN_SOFT, PURPLE, GREY, usePrefersReducedMotion } from "./EnablementMap";

/**
 * The small live map on the landing page: a dot drifts from the centre into a
 * quadrant and back, so the visitor sees what "place my dot" means before they
 * start. Purely decorative; the real map is EnablementMap.
 */
export function MapMiniature({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const size = 320;
  const pad = 16;
  const inner = size - pad * 2;
  const mid = pad + inner / 2;
  const names: { id: keyof typeof quadrants; x: number; y: number; anchor: "start" | "end" }[] = [
    { id: "pathseekers", x: pad + 10, y: pad + 20, anchor: "start" },
    { id: "fuelled", x: size - pad - 10, y: pad + 20, anchor: "end" },
    { id: "starters", x: pad + 10, y: size - pad - 12, anchor: "start" },
    { id: "transformers", x: size - pad - 10, y: size - pad - 12, anchor: "end" },
  ];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <rect x={pad} y={pad} width={inner / 2} height={inner / 2} fill={quadrants.pathseekers.tint} />
      <rect x={mid} y={pad} width={inner / 2} height={inner / 2} fill={quadrants.fuelled.tint} />
      <rect x={pad} y={mid} width={inner / 2} height={inner / 2} fill={quadrants.starters.tint} />
      <rect x={mid} y={mid} width={inner / 2} height={inner / 2} fill={quadrants.transformers.tint} />
      <line x1={mid} y1={pad} x2={mid} y2={size - pad} stroke="#fff" strokeWidth="3" />
      <line x1={pad} y1={mid} x2={size - pad} y2={mid} stroke="#fff" strokeWidth="3" />
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke={GREEN_SOFT} strokeWidth="2" />
      {names.map((name) => <text key={name.id} x={name.x} y={name.y} textAnchor={name.anchor} fill={GREY} fontSize="11" fontWeight="700">{quadrants[name.id].name}</text>)}
      {!reduced && <path d={`M ${mid} ${mid} C ${mid + 40} ${mid - 20}, ${mid + 60} ${mid - 60}, ${mid + 70} ${mid - 80}`} fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="3 6" opacity=".8" />}
      <g>
        <circle r="10" fill={PURPLE} stroke="#fff" strokeWidth="3" cx={reduced ? mid + 70 : 0} cy={reduced ? mid - 80 : 0}>
          {!reduced && <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;0.25;0.5;0.75;1" keyTimes="0;0.35;0.5;0.85;1" calcMode="linear" path={`M ${mid} ${mid} C ${mid + 40} ${mid - 20}, ${mid + 60} ${mid - 60}, ${mid + 70} ${mid - 80} L ${mid + 70} ${mid - 80} C ${mid + 20} ${mid - 40}, ${mid - 40} ${mid + 30}, ${mid - 60} ${mid + 50} L ${mid - 60} ${mid + 50} C ${mid - 30} ${mid + 20}, ${mid - 10} ${mid + 10}, ${mid} ${mid}`} />}
        </circle>
      </g>
    </svg>
  );
}
