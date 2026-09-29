import { forwardRef } from "react";
import { type RespondentMode, quadrants } from "@/data/aiMap";
import type { AIMapResult } from "@/lib/aiMap";
import { EnablementMap, GREEN, GREY, MAP_SIZE, PURPLE } from "./EnablementMap";

export const CARD_SIZE = 1080;

type Props = { result: AIMapResult; mode: RespondentMode; logoHref?: string; previous?: { capability: number; readiness: number } | null };

/**
 * The 1080 x 1080 shareable Map Card: logo, quadrant name, the map with the dot,
 * the two axis scores and the call to place your own. Rendered as an SVG so the
 * on-screen preview and the exported PNG are the same drawing.
 */
export const MapCard = forwardRef<SVGSVGElement, Props>(function MapCard({ result, mode, logoHref, previous }, ref) {
  const copy = quadrants[result.quadrant];
  const mapScale = 600 / MAP_SIZE;
  return (
    <svg ref={ref} viewBox={`0 0 ${CARD_SIZE} ${CARD_SIZE}`} role="img" aria-label={`Map Card: ${copy.name}. Capability ${result.capability}, readiness ${result.readiness}.`} style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <rect width={CARD_SIZE} height={CARD_SIZE} fill="#ffffff" />
      <rect x="0" y="0" width={CARD_SIZE} height="14" fill={GREEN} />
      {logoHref ? <image href={logoHref} x="72" y="60" width="200" height="112" preserveAspectRatio="xMinYMid meet" /> : <text x="72" y="130" fill={PURPLE} fontSize="44" fontWeight="800">EdMeCa</text>}
      <text x={CARD_SIZE - 72} y="96" textAnchor="end" fill={GREY} fontSize="22" fontWeight="700" letterSpacing="4">AI ENABLEMENT MAP</text>
      <text x={CARD_SIZE - 72} y="132" textAnchor="end" fill={GREY} fontSize="20">{mode === "business" ? "Answering for a business" : "Answering as an individual"}</text>
      <text x="72" y="250" fill={PURPLE} fontSize="30" fontWeight="700" letterSpacing="3">MY POSITION</text>
      <text x="72" y="330" fill={PURPLE} fontSize="76" fontWeight="800">{copy.name}</text>
      <text x="72" y="372" fill={GREY} fontSize="26">{copy.subtitle}</text>
      <g transform={`translate(${(CARD_SIZE - 600) / 2} 384) scale(${mapScale})`}>
        <EnablementMap capability={result.capability} readiness={result.readiness} mode={mode} result={result} resolved still previous={previous} width={MAP_SIZE} height={MAP_SIZE} />
      </g>
      <g transform="translate(72 1010)">
        <text x="0" y="0" fill={GREY} fontSize="22" fontWeight="700" letterSpacing="3">CAPABILITY</text>
        <text x="0" y="46" fill={PURPLE} fontSize="48" fontWeight="800">{result.capability}</text>
        <text x="240" y="0" fill={GREY} fontSize="22" fontWeight="700" letterSpacing="3">READINESS</text>
        <text x="240" y="46" fill={PURPLE} fontSize="48" fontWeight="800">{result.readiness}</text>
      </g>
      <text x={CARD_SIZE - 72} y="1056" textAnchor="end" fill={GREEN} fontSize="24" fontWeight="700">Place yours at edmeca.co.za/ai-map</text>
    </svg>
  );
});
