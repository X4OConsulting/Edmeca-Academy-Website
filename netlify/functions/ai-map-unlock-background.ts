import type { Handler, HandlerEvent } from "@netlify/functions";
import { type BackgroundJob, deliverBaseline, deliverUnlock, scriptTarget } from "./lib/aiMapDelivery";

/**
 * Background delivery of an AI Enablement Report. Netlify answers the caller
 * with 202 at once and lets this run for up to 15 minutes, so the model call
 * and the Apps Script call (sheet row, two emails) never race the 26 s limit
 * of a synchronous function.
 *
 * Only ai-map.ts calls it, with the shared secret in a header, after it has
 * validated the submission. Anything else is ignored.
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const { secret } = scriptTarget();
  const token = event.headers["x-ai-map-token"] || event.headers["X-AI-Map-Token"];
  if (!secret || token !== secret) {
    console.error("AI map background: rejected call without the shared token");
    return { statusCode: 401, body: "" };
  }
  let job: BackgroundJob;
  try {
    job = JSON.parse(event.body || "{}") as BackgroundJob;
  } catch {
    console.error("AI map background: unreadable job");
    return { statusCode: 400, body: "" };
  }
  try {
    if (job.kind === "baseline") {
      await deliverBaseline(job);
      console.log(`AI map baseline stored for ${job.respondentId} (${job.result.quadrant})`);
    } else {
      const outcome = await deliverUnlock(job);
      console.log(`AI map report delivered to ${job.email} (${outcome.reportSource}, ${outcome.result.quadrant}${outcome.movement ? ", with movement" : ""})`);
    }
  } catch (error) {
    console.error(`AI map background ${job.kind ?? "unlock"} failed for ${job.respondentId}:`, error instanceof Error ? error.message : "unknown error");
  }
  return { statusCode: 200, body: "" };
};
