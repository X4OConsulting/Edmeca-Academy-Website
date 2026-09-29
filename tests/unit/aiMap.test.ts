/**
 * AI Enablement Baseline scoring: every rule in section 4 of the plan.
 */
import { describe, expect, it } from "vitest";
import {
  allAnswered, answeredCount, axisScore, dimensionScore, dimensionScores, isOnTheLine, itemsForWave, movementBetween,
  neighbouringQuadrants, nextUnanswered, priorities, quadrantFor, runningPosition, scoreAIMap, WEAK_AXIS_WEIGHT,
} from "@/lib/aiMap";
import { type Answer, type Answers, type ItemId, dimensions, items, itemIds, pulseItems, statementFor } from "@/data/aiMap";

const fill = (value: Answer, ids: ItemId[] = itemIds): Answers => Object.fromEntries(ids.map((id) => [id, value])) as Answers;
const withValues = (values: Record<number, Answer>): Answers => values as Answers;

describe("instrument shape", () => {
  it("has eight dimensions of three items covering all 24 statements once", () => {
    expect(dimensions).toHaveLength(8);
    const covered = dimensions.flatMap((dimension) => dimension.items);
    expect([...covered].sort((a, b) => a - b)).toEqual(itemIds);
    expect(items).toHaveLength(24);
    items.forEach((item) => expect(dimensions.find((dimension) => dimension.code === item.dimension)?.items).toContain(item.id));
  });

  it("selects the mode-specific statement for all 24 items", () => {
    itemIds.forEach((id) => {
      const business = statementFor(id, "business");
      const individual = statementFor(id, "individual");
      expect(business.length).toBeGreaterThan(10);
      expect(individual.length).toBeGreaterThan(10);
      expect(business).not.toBe(individual);
      expect(individual.startsWith("I ") || individual.startsWith("My ") || individual.startsWith("AI ") || individual.startsWith("That ") || individual.startsWith("The ") || individual.startsWith("When ")).toBe(true);
    });
  });

  it("uses the eight pulse items for the mid wave and all 24 otherwise", () => {
    expect(itemsForWave("mid")).toEqual(pulseItems);
    expect(itemsForWave("baseline")).toEqual(itemIds);
    expect(itemsForWave("post")).toEqual(itemIds);
  });
});

describe("dimension and axis maths", () => {
  it("scores a dimension as the mean of its items on 0..100", () => {
    expect(dimensionScore(withValues({ 1: 0, 2: 0, 3: 0 }), "C1")).toBe(0);
    expect(dimensionScore(withValues({ 1: 4, 2: 4, 3: 4 }), "C1")).toBe(100);
    expect(dimensionScore(withValues({ 1: 2, 2: 2, 3: 2 }), "C1")).toBe(50);
    expect(dimensionScore(withValues({ 1: 1, 2: 2, 3: 3 }), "C1")).toBe(50);
    expect(dimensionScore(withValues({ 1: 4, 2: 0, 3: 1 }), "C1")).toBeCloseTo(41.667, 2);
  });

  it("returns null for a dimension with no answers and ignores unanswered items", () => {
    expect(dimensionScore({}, "R4")).toBeNull();
    expect(dimensionScore(withValues({ 22: 4 }), "R4")).toBe(100);
  });

  it("averages the four dimensions on an axis and skips unscored ones", () => {
    const scores = dimensionScores(withValues({ 1: 4, 2: 4, 3: 4, 4: 0, 5: 0, 6: 0 }));
    expect(axisScore(scores, "capability")).toBe(50);
    expect(axisScore(scores, "readiness")).toBeNull();
  });

  it("keeps the live dot at the centre for unanswered axes", () => {
    expect(runningPosition({})).toEqual({ capability: 50, readiness: 50 });
    expect(runningPosition(withValues({ 13: 4 }))).toEqual({ capability: 50, readiness: 100 });
  });

  it("counts answers and knows when a wave is complete", () => {
    expect(allAnswered(fill(2))).toBe(true);
    expect(allAnswered(fill(2, pulseItems), "mid")).toBe(true);
    expect(allAnswered(fill(2, pulseItems), "baseline")).toBe(false);
    expect(answeredCount(fill(1, [1, 2, 3]))).toBe(3);
  });
});

describe("quadrant assignment on every boundary", () => {
  it.each([
    [49, 49, "starters"], [49, 50, "transformers"], [49, 51, "transformers"],
    [50, 49, "pathseekers"], [50, 50, "fuelled"], [50, 51, "fuelled"],
    [51, 49, "pathseekers"], [51, 50, "fuelled"], [51, 51, "fuelled"],
    [0, 0, "starters"], [100, 0, "pathseekers"], [0, 100, "transformers"], [100, 100, "fuelled"],
  ] as const)("capability %s, readiness %s -> %s", (capability, readiness, expected) => {
    expect(quadrantFor(capability, readiness)).toBe(expected);
  });
});

describe("on-the-line band", () => {
  it.each([
    [44, 80, true], [45, 80, true], [55, 80, true], [56, 80, true], [43, 80, false], [57, 80, false],
    [80, 44, true], [80, 56, true], [80, 43, false], [80, 57, false], [50, 50, true], [20, 80, false],
  ] as const)("capability %s, readiness %s -> %s", (capability, readiness, expected) => {
    expect(isOnTheLine(capability, readiness)).toBe(expected);
  });

  it("names the neighbouring quadrants", () => {
    expect(neighbouringQuadrants(48, 20)).toEqual(["pathseekers"]);
    expect(neighbouringQuadrants(52, 20)).toEqual(["starters"]);
    expect(neighbouringQuadrants(20, 52)).toEqual(["starters"]);
    expect(neighbouringQuadrants(52, 52).sort()).toEqual(["pathseekers", "transformers"]);
    expect(neighbouringQuadrants(20, 20)).toEqual([]);
  });
});

describe("priority selection", () => {
  it("picks the two lowest dimensions when both axes are on the same side of 50", () => {
    const scores = { C1: 30, C2: 20, C3: 40, C4: 35, R1: 25, R2: 45, R3: 40, R4: 38 };
    expect(priorities(scores, 31, 37)).toEqual(["C2", "R1"]);
  });

  it("lets a low dimension on the weak axis outrank a slightly lower one on the strong axis", () => {
    // Capability is above 50, readiness below. R2 at 40 beats C2 at 35 because R2 is on the axis below the line.
    const scores = { C1: 70, C2: 35, C3: 80, C4: 75, R1: 45, R2: 40, R3: 48, R4: 44 };
    expect(priorities(scores, 65, 44)).toEqual(["R2", "R4"]);
  });

  it("still lets a much lower dimension on the strong axis through", () => {
    const scores = { C1: 70, C2: 5, C3: 80, C4: 75, R1: 45, R2: 40, R3: 48, R4: 44 };
    expect(priorities(scores, 58, 44)).toEqual(["C2", "R2"]);
    expect(WEAK_AXIS_WEIGHT).toBe(12.5);
  });

  it("breaks ties in code order", () => {
    const scores = { C1: 50, C2: 50, C3: 50, C4: 50, R1: 50, R2: 50, R3: 50, R4: 50 };
    expect(priorities(scores, 50, 50)).toEqual(["C1", "C2"]);
  });
});

describe("scoreAIMap", () => {
  it("places all zeros in Starters and all fours in AI-Fuelled", () => {
    const low = scoreAIMap(fill(0));
    expect(low).toMatchObject({ capability: 0, readiness: 0, quadrant: "starters", onTheLine: false, index: 0, balance: 0 });
    const high = scoreAIMap(fill(4));
    expect(high).toMatchObject({ capability: 100, readiness: 100, quadrant: "fuelled", index: 100 });
  });

  it("computes index, balance and flags the line for a mixed set", () => {
    const answers: Answers = { ...fill(3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), ...fill(1, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]) };
    const result = scoreAIMap(answers);
    expect(result.capability).toBe(75);
    expect(result.readiness).toBe(25);
    expect(result.quadrant).toBe("pathseekers");
    expect(result.index).toBe(50);
    expect(result.balance).toBe(-50);
    expect(result.onTheLine).toBe(false);
    expect(result.priorities.every((code) => code.startsWith("R"))).toBe(true);
  });

  it("flags on the line when an axis rounds to within six of 50", () => {
    const answers: Answers = { ...fill(2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), ...fill(4, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]) };
    const result = scoreAIMap(answers);
    expect(result.capability).toBe(50);
    expect(result.onTheLine).toBe(true);
    expect(result.quadrant).toBe("fuelled");
  });

  it("carries baseline scores into a mid pulse for dimensions the pulse does not ask", () => {
    const baseline = scoreAIMap(fill(1));
    const pulse = scoreAIMap(fill(4, pulseItems), baseline);
    expect(pulse.dimensions.C3).toBe(25);
    expect(pulse.dimensions.C1).toBe(100);
    expect(pulse.capability).toBe(Math.round((100 + 100 + 25 + 100) / 4));
  });
});

describe("movement", () => {
  it("reports the vector from baseline to now and per-dimension change", () => {
    const before = scoreAIMap(fill(1));
    const after = scoreAIMap({ ...fill(1), 1: 4, 2: 4, 3: 4, 13: 3, 14: 3, 15: 3 });
    const move = movementBetween(before, after);
    expect(move.dimensions.C1).toBe(75);
    expect(move.dimensions.R1).toBe(50);
    expect(move.dimensions.C2).toBe(0);
    expect(move.capability).toBe(after.capability - 25);
    expect(move.readiness).toBe(after.readiness - 25);
    expect(move.quadrantChanged).toBe(false);
  });

  it("notices a quadrant change", () => {
    const move = movementBetween(scoreAIMap(fill(1)), scoreAIMap(fill(3)));
    expect(move.quadrantChanged).toBe(true);
    expect(move.index).toBe(50);
  });
});

describe("navigation helpers", () => {
  it("finds the next unanswered item, wrapping around", () => {
    const answers: Answers = { ...fill(2), 3: undefined, 20: undefined } as Answers;
    expect(nextUnanswered(answers, 10)).toBe(20);
    expect(nextUnanswered(answers, 22)).toBe(3);
    expect(nextUnanswered(fill(2), 5)).toBeUndefined();
  });
});
