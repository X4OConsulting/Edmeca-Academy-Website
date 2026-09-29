import { randomUUID } from "node:crypto";
import type { Handler, HandlerEvent } from "@netlify/functions";
import { InputError, parseInput } from "./lib/financialAnalysis";
import { type Job, JOB_ID, jobStore, userFromRequest } from "./lib/analysisJobs";
import { overLimit } from "./lib/rateLimit";

/**
 * Financial Analysis, same-origin (/api/analyze-financials).
 *
 * POST starts a job and answers 202 { jobId } at once; the analysis runs in
 * analyze-financials-background, because a deep analysis (~45 s) is past
 * Netlify's synchronous limit. GET ?job=<id> reports the job's status and,
 * once it is done, hands over the result and forgets it.
 */
export const BACKGROUND_PATH = "/.netlify/functions/analyze-financials-background";

const json = (statusCode: number, body: unknown) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function siteBase(event: HandlerEvent): string {
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const proto = event.headers["x-forwarded-proto"] || (host?.startsWith("localhost") ? "http" : "https");
  // The deploy that received the request, so staging runs staging's background function.
  return host ? `${proto}://${host}` : (process.env.DEPLOY_PRIME_URL || process.env.URL || "");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });
  const user = await userFromRequest(event);
  if (!user) return json(401, { error: "Please sign in again to run an analysis." });
  const store = jobStore(event);

  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters?.job ?? "";
    if (!JOB_ID.test(id)) return json(400, { error: "Invalid job id" });
    const job = await store.get(id, { type: "json" }) as Job | null;
    if (!job || job.userId !== user.id) return json(404, { error: "Analysis not found. Please run it again." });
    if (job.status === "done" || job.status === "error") await store.delete(id);
    return json(200, { status: job.status, step: job.step, result: job.result, error: job.error });
  }

  let input;
  try {
    input = parseInput(JSON.parse(event.body || "{}"));
  } catch (error) {
    return json(400, { error: error instanceof InputError ? error.message : "Invalid request" });
  }
  const limited = await overLimit(event, "analyze-financials", user.id);
  if (limited) return json(429, { error: limited });
  const jobId = randomUUID();
  const job: Job = { userId: user.id, status: "queued", createdAt: new Date().toISOString() };
  await store.setJSON(jobId, job);
  try {
    const started = await fetch(`${siteBase(event)}${BACKGROUND_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: event.headers.authorization || event.headers.Authorization || "" },
      body: JSON.stringify({ jobId, input }),
    });
    if (started.status !== 202 && !started.ok) throw new Error(`background responded ${started.status}`);
  } catch (error) {
    console.error("Financial analysis: could not start the background job", error instanceof Error ? error.message : error);
    await store.delete(jobId);
    return json(502, { error: "The analysis service is unavailable right now. Please try again in a few minutes." });
  }
  return json(202, { jobId });
};
