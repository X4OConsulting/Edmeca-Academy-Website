/**
 * AI Enablement Baseline scoring. Pure functions, no React, no I/O.
 *
 * Imported by the page and by netlify/functions/ai-map.ts, so the position the
 * respondent sees on screen is exactly the position the sheet records.
 *
 * Rules (section 4 of the plan):
 * - dimension score = mean of its items, 0..4, shown as 0..100
 * - axis score = mean of its four dimension scores
 * - quadrant from the two axis scores against 50
 * - on the line when either axis is within 6 points of 50
 * - index = round((capability + readiness) / 2); balance = readiness - capability
 * - priorities = the two lowest dimensions, weighted toward the axis below 50
 */
import {
  type Answer, type Answers, type Axis, type DimensionCode, type ItemId, type Quadrant, type Wave,
  dimensionCodes, dimensionFor, dimensions, itemFor, itemIds, pulseItems,
} from "@/data/aiMap";

export const ON_THE_LINE_BAND = 6;
/** Head start given to dimensions on the axis that is below 50 when ranking priorities: half a scale step. */
export const WEAK_AXIS_WEIGHT = 12.5;

export type DimensionScores = Record<DimensionCode, number | null>;

export type AIMapResult = {
  dimensions: DimensionScores;
  capability: number;
  readiness: number;
  quadrant: Quadrant;
  onTheLine: boolean;
  index: number;
  balance: number;
  priorities: [DimensionCode, DimensionCode];
};

export type Movement = {
  capability: number;
  readiness: number;
  index: number;
  dimensions: Record<DimensionCode, number | null>;
  quadrantChanged: boolean;
};

export type PriorPosition = Pick<AIMapResult, "capability" | "readiness" | "quadrant"> & { dimensions: Partial<Record<DimensionCode, number | null>> };

export const toPercent = (mean: number) => (mean / 4) * 100;

export function itemsForWave(wave: Wave): ItemId[] {
  return wave === "mid" ? pulseItems : itemIds;
}

export function isAnswer(value: unknown): value is Answer {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 4;
}

export function allAnswered(answers: Answers, wave: Wave = "baseline"): boolean {
  return itemsForWave(wave).every((id) => isAnswer(answers[id]));
}

export function answeredCount(answers: Answers, wave: Wave = "baseline"): number {
  return itemsForWave(wave).filter((id) => isAnswer(answers[id])).length;
}

/** Mean of the answered items in a dimension as 0..100, or null when none are answered. */
export function dimensionScore(answers: Answers, code: DimensionCode): number | null {
  const values = dimensionFor(code).items.map((id) => answers[id]).filter(isAnswer);
  if (values.length === 0) return null;
  return toPercent(values.reduce<number>((sum, value) => sum + value, 0) / values.length);
}

export function dimensionScores(answers: Answers): DimensionScores {
  return Object.fromEntries(dimensionCodes.map((code) => [code, dimensionScore(answers, code)])) as DimensionScores;
}

export function axisDimensions(axis: Axis): DimensionCode[] {
  return dimensions.filter((dimension) => dimension.axis === axis).map((dimension) => dimension.code);
}

/**
 * Axis score as the mean of the dimensions that have a score. Returns null when
 * nothing on the axis is answered yet, so the live dot can stay at the centre.
 */
export function axisScore(scores: DimensionScores, axis: Axis): number | null {
  const values = axisDimensions(axis).map((code) => scores[code]).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Live position while answering: unanswered axes sit at the centre (50). */
export function runningPosition(answers: Answers): { capability: number; readiness: number } {
  const scores = dimensionScores(answers);
  return { capability: axisScore(scores, "capability") ?? 50, readiness: axisScore(scores, "readiness") ?? 50 };
}

export function quadrantFor(capability: number, readiness: number): Quadrant {
  if (capability >= 50 && readiness >= 50) return "fuelled";
  if (capability >= 50) return "pathseekers";
  if (readiness >= 50) return "transformers";
  return "starters";
}

export function isOnTheLine(capability: number, readiness: number): boolean {
  return Math.abs(capability - 50) <= ON_THE_LINE_BAND || Math.abs(readiness - 50) <= ON_THE_LINE_BAND;
}

/** The two quadrants a borderline respondent sits between, for the "on the line" sentence. */
export function neighbouringQuadrants(capability: number, readiness: number): Quadrant[] {
  const current = quadrantFor(capability, readiness);
  const neighbours = new Set<Quadrant>();
  if (Math.abs(capability - 50) <= ON_THE_LINE_BAND) neighbours.add(quadrantFor(capability >= 50 ? 49 : 50, readiness));
  if (Math.abs(readiness - 50) <= ON_THE_LINE_BAND) neighbours.add(quadrantFor(capability, readiness >= 50 ? 49 : 50));
  neighbours.delete(current);
  return Array.from(neighbours);
}

export function balanceLabel(balance: number): string {
  if (Math.abs(balance) < 8) return "your capability and readiness are broadly in step";
  return balance > 0 ? "your readiness is ahead of your capability" : "your capability is ahead of your readiness";
}

/**
 * The two dimensions that move the dot most. A dimension on an axis that is
 * below 50 gets a head start of WEAK_AXIS_WEIGHT points, so a weak spot on the
 * axis that decides the quadrant outranks a similar one on the axis already
 * over the line. Ties break in code order (C1..R4).
 */
export function priorities(scores: DimensionScores, capability: number, readiness: number): [DimensionCode, DimensionCode] {
  const ranked = dimensionCodes
    .filter((code) => scores[code] !== null)
    .map((code) => {
      const axis = dimensionFor(code).axis;
      const axisValue = axis === "capability" ? capability : readiness;
      return { code, key: (scores[code] as number) - (axisValue < 50 ? WEAK_AXIS_WEIGHT : 0) };
    })
    .sort((a, b) => a.key - b.key || dimensionCodes.indexOf(a.code) - dimensionCodes.indexOf(b.code));
  return [ranked[0]?.code ?? "C1", ranked[1]?.code ?? "C2"];
}

/**
 * Scores a complete (or, for the mid pulse, partial) set of answers. When a
 * baseline is supplied, dimensions the pulse does not ask about carry their
 * baseline score so the axis means stay comparable.
 */
export function scoreAIMap(answers: Answers, baseline?: PriorPosition | null): AIMapResult {
  const scores = dimensionScores(answers);
  if (baseline) {
    dimensionCodes.forEach((code) => {
      if (scores[code] === null && typeof baseline.dimensions[code] === "number") scores[code] = baseline.dimensions[code] as number;
    });
  }
  const capability = Math.round(axisScore(scores, "capability") ?? 0);
  const readiness = Math.round(axisScore(scores, "readiness") ?? 0);
  const rounded = Object.fromEntries(dimensionCodes.map((code) => [code, scores[code] === null ? null : Math.round(scores[code] as number)])) as DimensionScores;
  return {
    dimensions: rounded,
    capability,
    readiness,
    quadrant: quadrantFor(capability, readiness),
    onTheLine: isOnTheLine(capability, readiness),
    index: Math.round((capability + readiness) / 2),
    balance: readiness - capability,
    priorities: priorities(rounded, capability, readiness),
  };
}

export function movementBetween(previous: PriorPosition, current: AIMapResult): Movement {
  const dims = Object.fromEntries(dimensionCodes.map((code) => {
    const before = previous.dimensions[code];
    const after = current.dimensions[code];
    return [code, typeof before === "number" && typeof after === "number" ? after - before : null];
  })) as Record<DimensionCode, number | null>;
  return {
    capability: current.capability - previous.capability,
    readiness: current.readiness - previous.readiness,
    index: current.index - Math.round((previous.capability + previous.readiness) / 2),
    dimensions: dims,
    quadrantChanged: previous.quadrant !== current.quadrant,
  };
}

export function statementText(id: ItemId, mode: "business" | "individual"): string {
  return itemFor(id)[mode];
}

/** Next unanswered item after `from` in wave order, wrapping to the start; undefined when everything is answered. */
export function nextUnanswered(answers: Answers, from: ItemId, wave: Wave = "baseline"): ItemId | undefined {
  const order = itemsForWave(wave);
  const start = order.indexOf(from);
  for (let step = 1; step <= order.length; step += 1) {
    const candidate = order[(start + step) % order.length];
    if (!isAnswer(answers[candidate])) return candidate;
  }
  return undefined;
}
