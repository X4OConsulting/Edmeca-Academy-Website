/**
 * Execution Gap Netlify function — sheet delivery contract.
 *
 * These cover the mismatches between netlify/functions/execution-gap.ts and the
 * Apps Script in docs/EXECUTION_GAP_APPS_SCRIPT.gs. The regression that matters
 * most is the last block: Apps Script answers HTTP 200 even when it failed, so
 * checking only the status code reports lost submissions as successes.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { handler } from "../../netlify/functions/execution-gap";
import { scoreExecutionGap } from "@/lib/executionGap";
import type { Cells } from "@/data/executionGap";

const CELLS = {
  1: { F: 2, E: 1, V: 0 }, 2: { F: 2, E: 1, V: 1 }, 3: { F: 1, E: 2, V: 1 },
  4: { F: 2, E: 2, V: 0 }, 5: { F: 1, E: 1, V: 1 }, 6: { F: 2, E: 0, V: 0 },
};
const RESPONDENT = "66417aba-bb18-475b-8521-15585ac55234";

function post(body: Record<string, unknown>) {
  return handler(
    { httpMethod: "POST", headers: { origin: "https://edmeca.co.za" }, body: JSON.stringify(body) } as never,
    {} as never,
    (() => {}) as never,
  ) as Promise<{ statusCode: number; body: string }>;
}

const mapBody = (extra: Record<string, unknown> = {}) => ({
  action: "map", respondentId: RESPONDENT, cells: CELLS,
  stage: "idea", stageBand: "pre", aiMultiplier: 3,
  sector: "Manufacturing", programmeStatus: "Not currently", ...extra,
});

describe("execution gap function — payload sent to the sheet", () => {
  it("emits the totals under the names the Apps Script reads", async () => {
    const res = await post(mapBody());
    const { result } = JSON.parse(res.body);
    // HEADERS in the Apps Script are frameworkTotal/executionTotal/evidenceTotal.
    // Sending them as F/E/V left all three columns recording 0.
    expect(result.frameworkTotal).toBe(10);
    expect(result.executionTotal).toBe(7);
    expect(result.evidenceTotal).toBe(3);
  });

  it("still exposes F/E/V for the API response", async () => {
    const { result } = JSON.parse((await post(mapBody())).body);
    expect([result.F, result.E, result.V]).toEqual([10, 7, 3]);
  });

  it("sends widestGaps, which the Apps Script records but nothing used to send", async () => {
    const { result } = JSON.parse((await post(mapBody())).body);
    expect(result.widestGaps).toEqual([1, 6]);
  });

  it("ranks widestGaps identically to the client the respondent saw", async () => {
    const { result } = JSON.parse((await post(mapBody())).body);
    const client = scoreExecutionGap(CELLS as unknown as Cells);
    expect(result.widestGaps).toEqual(client.widestGaps);
    expect(result.frameworkTotal).toBe(client.frameworkTotal);
    expect(result.executionTotal).toBe(client.executionTotal);
    expect(result.evidenceTotal).toBe(client.evidenceTotal);
    expect(result.loopScore).toBe(client.loopScore);
    expect(result.archetype).toBe(client.archetype.name);
  });
});

describe("execution gap function — Apps Script failures must surface", () => {
  const OLD = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.EXECUTION_GAP_SCRIPT_URL = "https://script.google.com/macros/s/test/exec";
    process.env.EXECUTION_GAP_SHARED_SECRET = "test-secret";
    fetchMock = vi.fn();
    global.fetch = fetchMock as never;
  });
  afterEach(() => {
    process.env.EXECUTION_GAP_SCRIPT_URL = OLD.EXECUTION_GAP_SCRIPT_URL;
    process.env.EXECUTION_GAP_SHARED_SECRET = OLD.EXECUTION_GAP_SHARED_SECRET;
    vi.restoreAllMocks();
  });

  it("fails when Apps Script answers 200 with ok:false", async () => {
    // The exact shape doPost() returns when the secret is wrong or the
    // "Responses" tab is missing — HTTP 200, failure in the body.
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: "unauthorised" }) });
    expect((await post(mapBody())).statusCode).toBe(500);
  });

  it("fails when Apps Script returns an unparseable body", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("not json"); } });
    expect((await post(mapBody())).statusCode).toBe(500);
  });

  it("succeeds only when the body reports ok:true", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const res = await post(mapBody());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).ok).toBe(true);
  });

  it("forwards the shared secret and never returns it to the browser", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const res = await post(mapBody());
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.secret).toBe("test-secret");
    expect(res.body).not.toContain("test-secret");
  });

  it("forwards exactly once on unlock", async () => {
    // Two forwards ran the Apps Script's unlock_() twice, so every respondent
    // got two report emails — the first with an empty body — and NOTIFY_TO got
    // two lead notifications.
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await post(mapBody({
      action: "unlock", name: "Test Person", email: "test@example.com",
      business: "Test Business", wantsCall: false,
    }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forwards exactly once on map, with no report body", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await post(mapBody());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reportText).toBe("");
  });

  it("sends a real report, not a placeholder line", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await post(mapBody({
      action: "unlock", name: "Test Person", email: "test@example.com",
      business: "Test Business", wantsCall: false,
    }));
    const { reportText } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(reportText).toContain("The Planner");
    expect(reportText).toContain("GAP LEDGER");
    expect(reportText).toContain("Framework   10 / 12");
    expect(reportText).toContain("Loop score  56 / 100");
    expect(reportText).toContain("YOUR TWO WIDEST GAPS");
    expect(reportText).toContain("YOUR NEXT 30 DAYS");
    expect(reportText).toContain("AI MULTIPLIER — LEVEL 3");
    // The two widest gaps, with the close action for each stall stage.
    expect(reportText).toContain("Problem and customer");
    expect(reportText).toContain("Pitch and funding readiness");
    expect(reportText).toMatch(/Do this: \S/);
    expect(reportText.length).toBeGreaterThan(600);
  });

  it("uses the trading close actions when the respondent is trading", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await post(mapBody({
      action: "unlock", stage: "growing", stageBand: "trading",
      name: "Test Person", email: "test@example.com", business: "Test Business", wantsCall: false,
    }));
    const { reportText } = JSON.parse(fetchMock.mock.calls[0][1].body);
    // "pre" wording for capability 1 stalled at E; the trading variant differs.
    expect(reportText).not.toContain("Book ten conversations with people who fit that paragraph");
    expect(reportText).toContain("Do this:");
  });

  it("carries stage and stageBand through on unlock", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await post(mapBody({
      action: "unlock", name: "Test Person", email: "test@example.com",
      business: "Test Business", wantsCall: false,
    }));
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.stage).toBe("idea");
    expect(sent.stageBand).toBe("pre");
  });
});
