/**
 * Per-user hourly limits on the AI endpoints, so one account (or a script
 * using one) cannot run up the Anthropic or Groq bill. Counts live in Neon
 * (public.ai_usage). Not atomic: two simultaneous calls can both pass the last
 * slot, which is fine for a cost guard.
 */
import { query } from "./db.js";

export const LIMITS = {
  "analyze-bmc": { perHour: 20, noun: "canvas analyses" },
  "analyze-financials": { perHour: 10, noun: "financial analyses" },
  chat: { perHour: 60, noun: "chat messages" },
} as const;

export type LimitName = keyof typeof LIMITS;

/** Records one use; returns the message to show when the user is over the limit, else null. */
export async function overLimit(name: LimitName, userId: string): Promise<string | null> {
  const { perHour, noun } = LIMITS[name];
  try {
    const [usage] = await query<{ used: number; oldest: string | null }>(
      "select count(*)::int as used, min(at) as oldest from public.ai_usage where name = $1 and user_id = $2 and at > now() - interval '1 hour'",
      [name, userId],
    );
    if (usage.used >= perHour) {
      const freesAt = Date.parse(usage.oldest ?? "") + 60 * 60 * 1000;
      const minutes = Math.max(1, Math.ceil((freesAt - Date.now()) / 60000) || 1);
      return `You've reached the limit of ${perHour} ${noun} an hour. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    await query("insert into public.ai_usage (name, user_id) values ($1, $2)", [name, userId]);
    // Keep the table small: drop this user's rows that no longer count.
    await query("delete from public.ai_usage where name = $1 and user_id = $2 and at < now() - interval '1 hour'", [name, userId]);
    return null;
  } catch (error) {
    // A database outage should not lock people out of the tools.
    console.error(`Rate limit check failed for ${name}, allowing the call`, error instanceof Error ? error.message : error);
    return null;
  }
}
