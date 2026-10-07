/**
 * Financial Analysis (/api/analyze-financials).
 *
 * POST starts a job and answers 202 { jobId } at once; the analysis keeps
 * running in this same invocation via waitUntil (a deep analysis takes ~45 s,
 * well inside the 300 s function limit). GET ?job=<id> reports the job's
 * status and, once it is done, hands over the result and forgets it.
 *
 * On Netlify this was two functions (start + background) sharing Netlify
 * Blobs; on Vercel the job row lives in Neon (public.analysis_jobs).
 */
import { randomUUID } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { query } from "../server/db.js";
import { sessionUser } from "../server/http.js";
import { overLimit } from "../server/rateLimit.js";
import { AnalysisError, type AnalysisInput, type AnalysisResult, InputError, createClient, parseInput, runAnalysis } from "../server/lib/financialAnalysis.js";

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// A job that never finished (instance lost) stops being reported as running after this.
const STALE_AFTER_MS = 10 * 60 * 1000;

const respond = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type JobRow = { status: "queued" | "running" | "done" | "error"; step: string | null; result: AnalysisResult | null; error: string | null; updated_at: string };

async function run(jobId: string, input: AnalysisInput): Promise<void> {
  const save = (status: JobRow["status"], fields: { step?: string; result?: AnalysisResult; error?: string } = {}) =>
    query(
      "update public.analysis_jobs set status = $2, step = coalesce($3, step), result = $4, error = $5, updated_at = now() where id = $1",
      [jobId, status, fields.step ?? null, fields.result ? JSON.stringify(fields.result) : null, fields.error ?? null],
    );
  try {
    await save("running");
    const result = await runAnalysis(input, createClient(), (step) => save("running", { step }));
    await save("done", { result });
    console.log(`Financial analysis ${jobId} done (${input.analysisMode})`);
  } catch (error) {
    const known = error instanceof InputError || error instanceof AnalysisError;
    console.error(`Financial analysis ${jobId} failed:`, error instanceof Error ? error.message : error);
    await save("error", { error: known ? (error as Error).message : "The analysis failed. Please try again." }).catch((saveError) =>
      console.error(`Financial analysis ${jobId}: could not record the failure`, saveError instanceof Error ? saveError.message : saveError));
  }
}

export async function GET(request: Request): Promise<Response> {
  const user = await sessionUser(request);
  if (!user) return respond(401, { error: "Please sign in again to run an analysis." });
  const id = new URL(request.url).searchParams.get("job") ?? "";
  if (!JOB_ID.test(id)) return respond(400, { error: "Invalid job id" });
  const [job] = await query<JobRow>("select status, step, result, error, updated_at from public.analysis_jobs where id = $1 and user_id = $2", [id, user.id]);
  if (!job) return respond(404, { error: "Analysis not found. Please run it again." });
  if ((job.status === "queued" || job.status === "running") && Date.now() - Date.parse(job.updated_at) > STALE_AFTER_MS) {
    await query("delete from public.analysis_jobs where id = $1", [id]);
    return respond(200, { status: "error", error: "The analysis stopped unexpectedly. Please try again." });
  }
  if (job.status === "done" || job.status === "error") await query("delete from public.analysis_jobs where id = $1", [id]);
  return respond(200, { status: job.status, step: job.step ?? undefined, result: job.result ?? undefined, error: job.error ?? undefined });
}

export async function POST(request: Request): Promise<Response> {
  const user = await sessionUser(request);
  if (!user) return respond(401, { error: "Please sign in again to run an analysis." });

  let input: AnalysisInput;
  try {
    input = parseInput(await request.json());
  } catch (error) {
    return respond(400, { error: error instanceof InputError ? error.message : "Invalid request" });
  }
  const limited = await overLimit("analyze-financials", user.id);
  if (limited) return respond(429, { error: limited });

  const jobId = randomUUID();
  await query("insert into public.analysis_jobs (id, user_id, status) values ($1, $2, 'queued')", [jobId, user.id]);
  // Old, uncollected jobs (the page was closed) would otherwise stay forever.
  await query("delete from public.analysis_jobs where user_id = $1 and updated_at < now() - interval '1 day'", [user.id]);
  waitUntil(run(jobId, input));
  return respond(202, { jobId });
}
