import type { Handler, HandlerEvent } from "@netlify/functions";
import { type BackgroundJob, deliverMap, deliverUnlock, scriptTarget } from "./lib/executionGapDelivery";

/**
 * Background delivery of an Execution Gap Report. Netlify answers the caller
 * with 202 at once and lets this run for up to 15 minutes, so the model call
 * and the Apps Script call (sheet row, two emails) never race the 26 s limit
 * of a synchronous function.
 *
 * Only execution-gap.ts calls it, with the shared secret in a header, after
 * it has validated the submission. Anything else is ignored.
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const { secret } = scriptTarget();
  const token = event.headers["x-execution-gap-token"] || event.headers["X-Execution-Gap-Token"];
  if (!secret || token !== secret) {
    console.error("Execution gap background: rejected call without the shared token");
    return { statusCode: 401, body: "" };
  }
  let job: BackgroundJob;
  try {
    job = JSON.parse(event.body || "{}") as BackgroundJob;
  } catch {
    console.error("Execution gap background: unreadable job");
    return { statusCode: 400, body: "" };
  }
  try {
    if (job.kind === "map") {
      await deliverMap(job);
      console.log(`Execution gap map stored for ${job.respondentId}`);
    } else {
      const outcome = await deliverUnlock(job);
      console.log(`Execution gap report delivered to ${job.email} (${outcome.reportSource}, ${outcome.result.archetype})`);
    }
  } catch (error) {
    console.error(`Execution gap background ${job.kind ?? "unlock"} failed for ${job.respondentId}:`, error instanceof Error ? error.message : "unknown error");
  }
  return { statusCode: 200, body: "" };
};
