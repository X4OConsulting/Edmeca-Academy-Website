import { archetypes, capabilities, type CapabilityId, type Cells, type CellValue, type LoopStage } from "@/data/executionGap";

export type Stall = "F" | "E" | "V" | "C";
export type ComputedGap = {
  frameworkTotal: number; executionTotal: number; evidenceTotal: number; loopScore: number;
  executionGap: number; evidenceGap: number; stalls: Record<CapabilityId, Stall>;
  stallLabels: Record<CapabilityId, string>; instinctLed: Record<CapabilityId, boolean>;
  closedCount: number; stalledAtExecutionCount: number; stalledAtEvidenceCount: number;
  widestGaps: CapabilityId[]; archetype: (typeof archetypes)[keyof typeof archetypes];
};
export const capabilityIds: CapabilityId[] = [1, 2, 3, 4, 5, 6];
export const loopStages: LoopStage[] = ["F", "E", "V"];

export function getStall(cell: Partial<Record<LoopStage, CellValue>>): Stall {
  if ((cell.F ?? 0) < 2) return "F";
  if ((cell.E ?? 0) < 2) return "E";
  if ((cell.V ?? 0) < 2) return "V";
  return "C";
}
export function getStallLabel(stall: Stall, cell: Partial<Record<LoopStage, CellValue>>): string {
  if (stall === "F") return (cell.F ?? 0) === 0 ? "No framework yet" : "Framework in progress";
  if (stall === "E") return "Known, not yet run";
  if (stall === "V") return "Done, not yet proven";
  return "Closed loop";
}
function getArchetype(f: number, e: number, v: number) {
  const total = f + e + v;
  if (total <= 9) return archetypes.starter;
  if (f >= 10 && e >= 10 && v >= 10) return archetypes.closed;
  if (f - e >= 3) return archetypes.planner;
  if (e - f >= 3) return archetypes.instinctive;
  if (e >= 8 && e - v >= 3) return archetypes.unproven;
  return archetypes.balanced;
}
export function scoreExecutionGap(cells: Cells): ComputedGap {
  const totals = { F: 0, E: 0, V: 0 } as Record<LoopStage, number>;
  const stalls = {} as Record<CapabilityId, Stall>;
  const stallLabels = {} as Record<CapabilityId, string>;
  const instinctLed = {} as Record<CapabilityId, boolean>;
  const depths = capabilityIds.map((id) => {
    const cell = cells[id] ?? {};
    loopStages.forEach((stage) => { totals[stage] += cell[stage] ?? 0; });
    const stall = getStall(cell);
    stalls[id] = stall; stallLabels[id] = getStallLabel(stall, cell);
    instinctLed[id] = (cell.E ?? 0) > (cell.F ?? 0);
    return { id, depth: 2 - Math.min(cell.F ?? 0, cell.E ?? 0, cell.V ?? 0) + (stall === "E" ? 0.25 : stall === "V" ? 0.15 : 0) };
  });
  const widestGaps = [...depths].sort((a, b) => b.depth - a.depth || a.id - b.id).slice(0, 2).map(({ id }) => id);
  return { frameworkTotal: totals.F, executionTotal: totals.E, evidenceTotal: totals.V, loopScore: Math.round(((totals.F + totals.E + totals.V) / 36) * 100), executionGap: totals.F - totals.E, evidenceGap: totals.E - totals.V, stalls, stallLabels, instinctLed, closedCount: capabilityIds.filter((id) => stalls[id] === "C").length, stalledAtExecutionCount: capabilityIds.filter((id) => stalls[id] === "E").length, stalledAtEvidenceCount: capabilityIds.filter((id) => stalls[id] === "V").length, widestGaps, archetype: getArchetype(totals.F, totals.E, totals.V) };
}
export function emptyCells(): Cells { return Object.fromEntries(capabilityIds.map((id) => [id, {}])) as Cells; }
export function allCellsAnswered(cells: Cells): boolean { return capabilityIds.every((id) => loopStages.every((stage) => cells[id]?.[stage] !== undefined)); }
export function setCell(cells: Cells, id: CapabilityId, stage: LoopStage, value: CellValue): Cells { return { ...cells, [id]: { ...cells[id], [stage]: value } }; }
export function capabilityFor(id: CapabilityId) { return capabilities.find((capability) => capability.id === id)!; }
