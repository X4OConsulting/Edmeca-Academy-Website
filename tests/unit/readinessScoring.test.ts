import { describe, expect, it } from "vitest";
import { getStageIndex, scoreReadiness } from "@/lib/readinessScoring";

describe("AI readiness scoring", () => {
  it.each([
    [1.8, 0], [1.9, 1], [2.6, 1], [2.7, 2], [3.4, 2], [3.5, 3], [4.2, 3], [4.3, 4],
  ])("maps average %s to stage %s", (average, stage) => {
    expect(getStageIndex(average)).toBe(stage);
  });

  it("scores five threes as 60 and Activation", () => {
    const result = scoreReadiness({ foundations: 3, operations: 3, sales: 3, finance: 3, innovation: 3 });
    expect(result.score).toBe(60);
    expect(result.stage.name).toBe("Activation");
  });

  it("keeps the first dimension when weakest scores tie", () => {
    const result = scoreReadiness({ foundations: 2, operations: 2, sales: 4, finance: 4, innovation: 4 });
    expect(result.weakest).toBe("foundations");
  });
});
