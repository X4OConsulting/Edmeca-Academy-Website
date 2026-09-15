/**
 * AI Enablement Baseline Netlify function: validation, scoring parity with the
 * client, honeypot, re-test movement, and the sheet delivery contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../../netlify/functions/ai-map";
import { buildTemplateReport, SYSTEM_PROMPT } from "../../netlify/functions/lib/aiMapReportPrompt";
import { scoreAIMap } from "@/lib/aiMap";
import { type Answers, itemIds, pulseItems } from "@/data/aiMap";

const RESPONDENT = "66417aba-bb18-475b-8521-15585ac55234";
const BASELINE_ID = "8b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d";
const ANSWERS = Object.fromEntries(itemIds.map((id) => [id, id <= 12 ? 3 : 1])) as Record<number, number>;

function post(body: Record<string, unknown>) {
  return handler({ httpMethod: "POST", headers: { origin: "https://edmeca.co.za" }, body: JSON.stringify(body) } as never, {} as never, (() => {}) as never) as Promise<{ statusCode: number; body: string }>;
}

const baselineBody = (extra: Record<string, unknown> = {}) => ({
  action: "baseline", respondentId: RESPONDENT, wave: "baseline", mode: "business", answers: ANSWERS,
  profile: { sizeOrRole: "6 to 20", sector: "Manufacturing", programmeStatus: "Not currently" }, context: "We quote with ChatGPT.", ...extra,
});

const OLD = { ...process.env };
let fetchMock: ReturnType<typeof vi.fn>;
const scriptOk = (payload: Record<string, unknown> = { ok: true }) => ({ ok: true, json: async () => payload });

beforeEach(() => {
  delete process.env.DEEPSEEK_API_KEY;
  process.env.AI_MAP_SCRIPT_URL = "https://script.google.com/macros/s/test/exec";
  process.env.AI_MAP_SHARED_SECRET = "test-secret";
  fetchMock = vi.fn(async () => scriptOk());
  global.fetch = fetchMock as never;
});
afterEach(() => {
  process.env = { ...OLD };
  vi.restoreAllMocks();
});

describe("validation", () => {
  it("rejects a bad respondent id, mode, wave and cohort", async () => {
    expect((await post(baselineBody({ respondentId: "nope" }))).statusCode).toBe(400);
    expect((await post(baselineBody({ mode: "team" }))).statusCode).toBe(400);
    expect((await post(baselineBody({ wave: "weekly" }))).statusCode).toBe(400);
    expect((await post(baselineBody({ cohort: "PP 2026!" }))).statusCode).toBe(400);
  });

  it("rejects impossible answer values and missing statements", async () => {
    expect((await post(baselineBody({ answers: { ...ANSWERS, 7: 5 } }))).statusCode).toBe(400);
    expect((await post(baselineBody({ answers: { ...ANSWERS, 7: -1 } }))).statusCode).toBe(400);
    const partial = { ...ANSWERS } as Record<number, number | undefined>; delete partial[24];
    expect((await post(baselineBody({ answers: partial }))).statusCode).toBe(400);
  });

  it("accepts the eight pulse items for the mid wave", async () => {
    const answers = Object.fromEntries(pulseItems.map((id) => [id, 2]));
    const res = await post(baselineBody({ wave: "mid", answers }));
    expect(res.statusCode).toBe(200);
    const { result } = JSON.parse(res.body);
    expect(result.dimensions.C3).toBeNull();
  });

  it("rejects a profile value that is not one of the offered options", async () => {
    expect((await post(baselineBody({ profile: { sizeOrRole: "Enormous", sector: "Manufacturing", programmeStatus: "Not currently" } }))).statusCode).toBe(400);
    expect((await post(baselineBody({ mode: "individual", profile: { sizeOrRole: "6 to 20", sector: "Manufacturing", programmeStatus: "Not currently" } }))).statusCode).toBe(400);
  });

  it("ignores a forged quadrant: the server recomputes everything", async () => {
    const res = await post(baselineBody({ result: { quadrant: "fuelled", capability: 99 } }));
    const { result } = JSON.parse(res.body);
    expect(result.quadrant).toBe("pathseekers");
    expect(result.capability).toBe(75);
  });

  it("refuses an unlock without contact details", async () => {
    expect((await post(baselineBody({ action: "unlock" }))).statusCode).toBe(400);
    expect((await post(baselineBody({ action: "unlock", name: "R", email: "not-an-email", wantsCall: false }))).statusCode).toBe(400);
  });

  it("swallows a filled honeypot without touching the sheet", async () => {
    const res = await post(baselineBody({ action: "unlock", name: "Bot", email: "bot@example.com", wantsCall: false, website: "http://spam" }));
    expect(res.statusCode).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("scoring parity and sheet payload", () => {
  it("returns the same result the client computed", async () => {
    const res = await post(baselineBody());
    const { result } = JSON.parse(res.body);
    const client = scoreAIMap(ANSWERS as unknown as Answers);
    expect(result).toEqual(client);
  });

  it("forwards the instrument, action, answers, profile and result to the Apps Script", async () => {
    await post(baselineBody({ cohort: "PP2026" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.secret).toBe("test-secret");
    expect(sent.instrument).toBe("ai-map");
    expect(sent.action).toBe("baseline");
    expect(sent.cohort).toBe("PP2026");
    expect(sent.mode).toBe("business");
    expect(sent.answers["24"]).toBe(1);
    expect(sent.profile.sector).toBe("Manufacturing");
    expect(sent.result.quadrant).toBe("pathseekers");
    expect(sent.result.priorities).toHaveLength(2);
  });

  it("falls back to the Execution Gap script variables when the AI Map ones are absent", async () => {
    delete process.env.AI_MAP_SCRIPT_URL; delete process.env.AI_MAP_SHARED_SECRET;
    process.env.EXECUTION_GAP_SCRIPT_URL = "https://script.google.com/macros/s/shared/exec";
    process.env.EXECUTION_GAP_SHARED_SECRET = "shared-secret";
    await post(baselineBody());
    expect(fetchMock.mock.calls[0][0]).toBe("https://script.google.com/macros/s/shared/exec");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).secret).toBe("shared-secret");
  });

  it("reports an Apps Script failure hidden behind HTTP 200", async () => {
    fetchMock.mockResolvedValueOnce(scriptOk({ ok: false, error: "unauthorised" }));
    expect((await post(baselineBody())).statusCode).toBe(500);
  });
});

describe("unlock", () => {
  it("sends one forward carrying the template report when no model key is set", async () => {
    const res = await post(baselineBody({ action: "unlock", name: "Raymond", email: "R@Example.com", organisation: "Edmeca", wantsCall: true }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).reportSource).toBe("template");
    // One lookup by email (for movement) and one unlock forward.
    const actions = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).action);
    expect(actions).toEqual(["lookup", "unlock"]);
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent.email).toBe("r@example.com");
    expect(sent.reportText).toContain("PATHSEEKERS");
    expect(sent.reportText).toContain("WHAT MOVES YOUR DOT");
    expect(sent.reportSource).toBe("template");
  });

  it("uses the email match to report movement for a returning respondent", async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (body.action === "lookup") return scriptOk({ ok: true, previous: { respondentId: BASELINE_ID, capability: 50, readiness: 25, quadrant: "fuelled", dimensions: { C1: 50, C2: 50, C3: 50, C4: 50, R1: 25, R2: 25, R3: 25, R4: 25 } } });
      return scriptOk();
    });
    const res = await post(baselineBody({ action: "unlock", name: "Raymond", email: "r@example.com", wantsCall: false }));
    const { movement } = JSON.parse(res.body);
    expect(movement.capability).toBe(25);
    expect(movement.readiness).toBe(0);
    expect(movement.quadrantChanged).toBe(true);
  });
});

describe("re-test", () => {
  it("looks up the baseline and returns the movement with the new position", async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (body.action === "lookup") { expect(body.respondentId).toBe(BASELINE_ID); return scriptOk({ ok: true, previous: { capability: 25, readiness: 25, quadrant: "starters", dimensions: { C1: 25, C2: 25, C3: 25, C4: 25, R1: 25, R2: 25, R3: 25, R4: 25 } } }); }
      return scriptOk();
    });
    const res = await post(baselineBody({ retestOf: BASELINE_ID, wave: "post" }));
    const { result, movement } = JSON.parse(res.body);
    expect(result.quadrant).toBe("pathseekers");
    expect(movement.capability).toBe(50);
    expect(movement.readiness).toBe(0);
    expect(movement.dimensions.C1).toBe(50);
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent.retestOf).toBe(BASELINE_ID);
    expect(sent.wave).toBe("post");
  });

  it("carries baseline dimensions into a mid pulse", async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (body.action === "lookup") return scriptOk({ ok: true, previous: { capability: 25, readiness: 25, quadrant: "starters", dimensions: { C1: 25, C2: 25, C3: 25, C4: 25, R1: 25, R2: 25, R3: 25, R4: 25 } } });
      return scriptOk();
    });
    const answers = Object.fromEntries(pulseItems.map((id) => [id, 4]));
    const res = await post(baselineBody({ retestOf: BASELINE_ID, wave: "mid", answers }));
    const { result } = JSON.parse(res.body);
    expect(result.dimensions.C3).toBe(25);
    expect(result.dimensions.C1).toBe(100);
  });

  it("answers a retest lookup by link or by email", async () => {
    fetchMock.mockResolvedValue(scriptOk({ ok: true, previous: null }));
    expect((await post({ action: "retest", retestOf: BASELINE_ID })).statusCode).toBe(200);
    expect((await post({ action: "retest", email: "r@example.com" })).statusCode).toBe(200);
    expect((await post({ action: "retest" })).statusCode).toBe(400);
  });
});

describe("report prompt", () => {
  it("builds a template report that names every dimension and both priorities", () => {
    const result = scoreAIMap(ANSWERS as unknown as Answers);
    const text = buildTemplateReport({ mode: "business", result, profile: { programmeStatus: "In an ESD programme, incubator or accelerator now" } });
    ["C1", "C2", "C3", "C4", "R1", "R2", "R3", "R4"].forEach((code) => expect(text).toContain(code));
    expect(text).toContain("inside your programme");
    expect(text).toContain("Capability 75, Readiness 25");
  });

  it("keeps the section structure the plan specifies in the system prompt", () => {
    expect(SYSTEM_PROMPT).toContain("(1) Where you are on the map");
    expect(SYSTEM_PROMPT).toContain("(5) One closing sentence");
    expect(SYSTEM_PROMPT).toContain("under 600 words");
  });
});
