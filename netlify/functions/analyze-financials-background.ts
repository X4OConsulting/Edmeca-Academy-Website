import type { Handler } from "@netlify/functions";
import { AnalysisError, InputError, createClient, parseInput, runAnalysis } from "./lib/financialAnalysis";
import { type Job, JOB_ID, jobStore, userFromRequest } from "./lib/analysisJobs";

/**
 * Runs one Financial Analysis job. Netlify answers the caller with 202 and
 * gives this up to 15 minutes. It acts only for the user who owns the job
 * (same bearer token as the request that created it) and records the outcome
 * in the job for analyze-financials.ts to hand to the page.
 */
export const handler: Handler = async (event) => {
  const user = await userFromRequest(event);
  let body: { jobId?: string; input?: unknown };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "" };
  }
  const jobId = body.jobId ?? "";
  if (!user || !JOB_ID.test(jobId)) {
    console.error("Financial analysis background: rejected call without a valid user or job");
    return { statusCode: 401, body: "" };
  }
  const store = jobStore(event);
  const job = await store.get(jobId, { type: "json" }) as Job | null;
  if (!job || job.userId !== user.id || job.status !== "queued") return { statusCode: 404, body: "" };

  const save = (update: Partial<Job>) => store.setJSON(jobId, { ...job, ...update });
  try {
    const input = parseInput(body.input);
    await save({ status: "running" });
    const result = await runAnalysis(input, createClient(), (step) => save({ status: "running", step }));
    await save({ status: "done", result });
    console.log(`Financial analysis ${jobId} done (${input.analysisMode})`);
  } catch (error) {
    const known = error instanceof InputError || error instanceof AnalysisError;
    console.error(`Financial analysis ${jobId} failed:`, error instanceof Error ? error.message : error);
    await save({ status: "error", error: known ? (error as Error).message : "The analysis failed. Please try again." });
  }
  return { statusCode: 200, body: "" };
};
