import type { HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/** The signed-in Supabase user behind the request's bearer token, or null. */
export async function userFromRequest(event: HandlerEvent): Promise<{ id: string } | null> {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const { data, error } = await createClient(url, anonKey).auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id };
}
