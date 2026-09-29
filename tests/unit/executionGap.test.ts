import { describe, expect, it } from "vitest";
import { emptyCells, getStall, scoreExecutionGap } from "@/lib/executionGap";

describe("execution gap scoring", () => {
  it("resolves framework, execution, evidence and closed stalls", () => {
    expect(getStall({ F: 0, E: 2, V: 2 })).toBe("F");
    expect(getStall({ F: 2, E: 1, V: 2 })).toBe("E");
    expect(getStall({ F: 2, E: 2, V: 1 })).toBe("V");
    expect(getStall({ F: 2, E: 2, V: 2 })).toBe("C");
  });
  it("recognises a closed loop", () => {
    const cells = emptyCells();
    for (const id of [1, 2, 3, 4, 5, 6] as const) cells[id] = { F: 2, E: 2, V: 2 };
    const result = scoreExecutionGap(cells);
    expect(result.loopScore).toBe(100);
    expect(result.closedCount).toBe(6);
    expect(result.archetype.name).toBe("The Closed Loop");
  });
  it("selects the planner when frameworks lead execution by three", () => {
    const cells = emptyCells();
    for (const id of [1, 2, 3, 4, 5, 6] as const) cells[id] = { F: 2, E: 1, V: 0 };
    expect(scoreExecutionGap(cells).archetype.name).toBe("The Planner");
  });
  it("detects instinct-led capabilities", () => {
    const cells = emptyCells(); cells[1] = { F: 0, E: 2, V: 0 };
    expect(scoreExecutionGap(cells).instinctLed[1]).toBe(true);
  });
});
