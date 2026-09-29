/**
 * Per-user hourly limits on the AI endpoints, so one account (or a script
 * using one) cannot run up the Anthropic or Groq bill. Counts live in
 * Netlify Blobs. Not atomic: two simultaneous calls can both pass the last
 * slot, which is fine for a cost guard.
 */
import { connectLambda, getStore } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";

export const LIMITS = {
  "analyze-bmc": { perHour: 20, noun: "canvas analyses" },
  "analyze-financials": { perHour: 10, noun: "financial analyses" },
  chat: { perHour: 60, noun: "chat messages" },
} as const;

export type LimitName = keyof typeof LIMITS;
const HOUR = 60 * 60 * 1000;

/** Records one use; returns the message to show when the user is over the limit, else null. */
export async function overLimit(event: HandlerEvent, name: LimitName, userId: string): Promise<string | null> {
  const { perHour, noun } = LIMITS[name];
  try {
    connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
    const store = getStore("ai-rate-limits");
    const key = `${name}/${userId}`;
    const now = Date.now();
    const recent = ((await store.get(key, { type: "json" })) as number[] | null ?? []).filter((at) => now - at < HOUR);
    if (recent.length >= perHour) {
      const minutes = Math.max(1, Math.ceil((recent[0] + HOUR - now) / 60000));
      return `You've reached the limit of ${perHour} ${noun} an hour. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    await store.setJSON(key, [...recent, now]);
    return null;
  } catch (error) {
    // A storage outage should not lock people out of the tools.
    console.error(`Rate limit check failed for ${name}, allowing the call`, error instanceof Error ? error.message : error);
    return null;
  }
}
