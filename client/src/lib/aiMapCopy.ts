/**
 * Sentences derived from a result that both the report panel and the emailed
 * report use, so the screen and the email say the same thing.
 */
import { type DimensionCode, type Quadrant, bandFor, bandMeaning, dimensionFor, inProgrammeRouteNote, inProgrammeStatus, quadrants } from "@/data/aiMap";
import { type AIMapResult, type Movement, balanceLabel, neighbouringQuadrants } from "@/lib/aiMap";

const quadrantName = (quadrant: Quadrant) => quadrants[quadrant].name;

export function routeParagraph(result: Pick<AIMapResult, "quadrant">, programmeStatus?: string): string {
  const copy = quadrants[result.quadrant];
  const route = `${copy.route} Format: ${copy.format}`;
  return programmeStatus === inProgrammeStatus ? `${route} ${inProgrammeRouteNote}` : route;
}

export function onTheLineSentence(result: AIMapResult): string {
  if (!result.onTheLine) return "";
  const neighbours = neighbouringQuadrants(result.capability, result.readiness).map(quadrantName);
  const deciders = result.priorities.map((code) => dimensionFor(code).name).join(" and ");
  const between = neighbours.length ? `between ${quadrantName(result.quadrant)} and ${neighbours.join(" and ")}` : `on the edge of ${quadrantName(result.quadrant)}`;
  return `You sit on the line ${between}; ${deciders} decide which way you go.`;
}

export function positionSentence(result: AIMapResult): string {
  return `Capability ${result.capability}, Readiness ${result.readiness}: ${balanceLabel(result.balance)}.`;
}

export function dimensionLine(code: DimensionCode, score: number | null): string {
  const dimension = dimensionFor(code);
  if (score === null) return `${code} ${dimension.name}: not assessed in this wave.`;
  const band = bandFor(score);
  return `${code} ${dimension.name}: ${score} (${band}), ${bandMeaning[band]}.`;
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function movementSentence(movement: Movement, quadrant: Quadrant): string {
  const parts = [`capability ${signed(movement.capability)}`, `readiness ${signed(movement.readiness)}`];
  const where = movement.quadrantChanged ? `Your dot has crossed into ${quadrantName(quadrant)}.` : `You are still in ${quadrantName(quadrant)}.`;
  return `Since your last baseline: ${parts.join(", ")}. ${where}`;
}
