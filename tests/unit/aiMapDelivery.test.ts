/**
 * Background delivery of an AI Enablement Report: DeepSeek elaboration with
 * template fallback, the single Apps Script call, and the token check on the
 * background function.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type UnlockJob, deliverUnlock } from "../../netlify/functions/lib/aiMapDelivery";
import { handler as background } from "../../netlify/functions/ai-map-unlock-background";
import { type Answers, itemIds } from "@/data/aiMap";

const ANSWERS = Object.fromEntries(itemIds.map((id) => [id, id <= 12 ? 3 : 1])) as unknown as Answers;
const JOB: UnlockJob = {
  respondentId: "66417aba-bb18-475b-8521-15585ac55234", wave: "baseline", retestOf: "", cohort: "", mode: "business", answers: ANSWERS,
  profile: { sizeOrRole: "6 to 20", sector: "Manufacturing", programmeStatus: "Not currently" }, context: "We quote with ChatGPT.",
  name: "Raymond", email: "r@example.com", organisation: "Edmeca", wantsCall: true, userAgent: "vitest", referrer: "",
};
const LONG_REPORT = Array.from({ length: 80 }, (_, i) => `Sentence ${i + 1} of a report that is comfortably longer than the template.`).join(" ");

const OLD = { ...process.env };
let fetchMock: ReturnType<typeof vi.fn>;
const json = (payload: unknown, status = 200) => ({ ok: status < 400, status, json: async () => payload, text: async () => JSON.stringify(payload) });

beforeEach(() => {
  process.env.AI_MAP_SCRIPT_URL = "https://script.google.com/macros/s/test/exec";
  process.env.AI_MAP_SHARED_SECRET = "test-secret";
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.EDMECA_DEEPSEEK_API;
  fetchMock = vi.fn(async () => json({ ok: true }));
  global.fetch = fetchMock as never;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});
afterEach(() => {
  process.env = { ...OLD };
  vi.restoreAllMocks();
});

const callsTo = (host: string) => fetchMock.mock.calls.filter((call) => String(call[0]).includes(host));

describe("deliverUnlock", () => {
  it("uses the DeepSeek report when the key is set and the answer is usable", async () => {
    process.env.EDMECA_DEEPSEEK_API = "sk-test";
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("deepseek")) return json({ choices: [{ finish_reason: "stop", message: { content: LONG_REPORT } }] });
      return json({ ok: true });
    });
    const outcome = await deliverUnlock(JOB);
    expect(outcome.reportSource).toBe("deepseek:deepseek-flash");
    expect(callsTo("deepseek")).toHaveLength(1);
    const deepseekBody = JSON.parse(callsTo("deepseek")[0][1].body);
    expect(deepseekBody.max_tokens).toBeGreaterThanOrEqual(2000);
    expect(callsTo("deepseek")[0][1].headers.Authorization).toBe("Bearer sk-test");
    const sheet = JSON.parse(callsTo("script.google")[0][1].body);
    expect(sheet.action).toBe("unlock");
    expect(sheet.reportText).toBe(LONG_REPORT);
    expect(sheet.reportSource).toBe("deepseek:deepseek-flash");
  });

  it("falls back to the template, and says why, when the model spends its tokens on reasoning", async () => {
    process.env.EDMECA_DEEPSEEK_API = "sk-test";
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("deepseek")) return json({ choices: [{ finish_reason: "length", message: { content: "", reasoning_content: "thinking..." } }] });
      return json({ ok: true });
    });
    const outcome = await deliverUnlock(JOB);
    expect(outcome.reportSource).toBe("template");
    const logged = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => call.join(" ")).join("\n");
    expect(logged).toContain("finish length");
    expect(logged).toContain("reasoning 11 chars");
    const sheet = JSON.parse(callsTo("script.google")[0][1].body);
    expect(sheet.reportText).toContain("YOUR EIGHT DIMENSIONS");
  });

  it("falls back to the template on an HTTP error and includes the DeepSeek message in the log", async () => {
    process.env.EDMECA_DEEPSEEK_API = "sk-bad";
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("deepseek")) return json({ error: { message: "Authentication Fails" } }, 401);
      return json({ ok: true });
    });
    const outcome = await deliverUnlock(JOB);
    expect(outcome.reportSource).toBe("template");
    const logged = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => call.join(" ")).join("\n");
    expect(logged).toContain("DeepSeek 401");
    expect(logged).toContain("Authentication Fails");
  });

  it("makes exactly one Apps Script call without a re-test link and reads movement from its answer", async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (body.action === "unlock") return json({ ok: true, previous: { capability: 50, readiness: 25, quadrant: "fuelled", dimensions: { C1: 50, C2: 50, C3: 50, C4: 50, R1: 25, R2: 25, R3: 25, R4: 25 } } });
      return json({ ok: true });
    });
    const outcome = await deliverUnlock(JOB);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(outcome.movement?.capability).toBe(25);
    expect(outcome.movement?.quadrantChanged).toBe(true);
  });

  it("looks the baseline up first for a re-test", async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (body.action === "lookup") return json({ ok: true, previous: { capability: 25, readiness: 25, quadrant: "starters", dimensions: { C1: 25, C2: 25, C3: 25, C4: 25, R1: 25, R2: 25, R3: 25, R4: 25 } } });
      return json({ ok: true });
    });
    const outcome = await deliverUnlock({ ...JOB, retestOf: "8b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d", wave: "post" });
    const actions = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).action);
    expect(actions).toEqual(["lookup", "unlock"]);
    expect(outcome.movement?.capability).toBe(50);
  });

  it("throws when the sheet refuses, so the failure reaches the log", async () => {
    fetchMock.mockResolvedValue(json({ ok: false, error: "report email failed: quota" }));
    await expect(deliverUnlock(JOB)).rejects.toThrow("report email failed: quota");
  });
});

describe("background function", () => {
  const invoke = (headers: Record<string, string>, body: unknown) =>
    background({ httpMethod: "POST", headers, body: JSON.stringify(body) } as never, {} as never, (() => {}) as never) as Promise<{ statusCode: number }>;

  it("rejects a call without the shared token", async () => {
    expect((await invoke({}, JOB)).statusCode).toBe(401);
    expect((await invoke({ "x-ai-map-token": "wrong" }, JOB)).statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("delivers the job when the token matches and never throws on failure", async () => {
    expect((await invoke({ "x-ai-map-token": "test-secret" }, JOB)).statusCode).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).action).toBe("unlock");
    fetchMock.mockResolvedValue(json({ ok: false, error: "unauthorised" }));
    expect((await invoke({ "x-ai-map-token": "test-secret" }, JOB)).statusCode).toBe(200);
  });
});
