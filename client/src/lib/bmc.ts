/**
 * The saved shape of a Business Model Canvas, shared by BMCTool (which writes
 * it) and the tools that pre-fill from it (Value Proposition, Pitch Builder,
 * SWOT & PESTLE, the chat assistant).
 *
 * BMCTool saves `content: { companyName, canvas: { customerSegments: [...] }, ... }`.
 * Rows written before September 2026 have no companyName; readBmc() also
 * accepts sections at the top level of content, the shape the readers expected.
 */

export const BMC_SECTIONS = [
  "customerSegments",
  "valuePropositions",
  "channels",
  "customerRelationships",
  "revenueStreams",
  "keyResources",
  "keyActivities",
  "keyPartnerships",
  "costStructure",
] as const;

export type BmcSection = (typeof BMC_SECTIONS)[number];
export type BmcCanvas = Record<BmcSection, string[]>;

export const EMPTY_CANVAS: BmcCanvas = Object.fromEntries(BMC_SECTIONS.map((id) => [id, []])) as unknown as BmcCanvas;

const MAX_ITEMS = 20;
const MAX_CHARS = 2000;

/**
 * Turns anything (an imported file, localStorage, an old row) into a canvas.
 * Answers keep their positions, because each position is one guided prompt:
 * a non-string answer becomes "" rather than being dropped, which would move
 * the answers after it under the wrong prompt.
 */
export function sanitizeCanvas(raw: unknown): BmcCanvas {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const canvas = { ...EMPTY_CANVAS };
  for (const id of BMC_SECTIONS) {
    const items = source[id];
    canvas[id] = Array.isArray(items)
      ? items.slice(0, MAX_ITEMS).map((item) => (typeof item === "string" ? item.slice(0, MAX_CHARS) : ""))
      : [];
  }
  return canvas;
}

/** The answered items only, for reading and prompting rather than editing. */
export function answeredOnly(canvas: BmcCanvas): BmcCanvas {
  return Object.fromEntries(BMC_SECTIONS.map((id) => [id, canvas[id].filter((item) => item.trim().length > 0)])) as unknown as BmcCanvas;
}

/** Reads a saved BMC artifact's content for pre-filling another tool. */
export function readBmc(content: unknown): { companyName: string; canvas: BmcCanvas } {
  const record = content && typeof content === "object" ? (content as Record<string, unknown>) : {};
  const nested = record.canvas && typeof record.canvas === "object" ? record.canvas : record;
  return {
    companyName: typeof record.companyName === "string" ? record.companyName : "",
    canvas: answeredOnly(sanitizeCanvas(nested)),
  };
}
