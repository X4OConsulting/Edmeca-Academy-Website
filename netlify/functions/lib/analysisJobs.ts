/**
 * Financial Analysis jobs: who asked (the Supabase user) and where the result
 * waits for the page to collect it (Netlify Blobs, keyed by job id).
 */
import { connectLambda, getStore } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { AnalysisResult, Step } from "./financialAnalysis";

export type Job = {
  userId: string;
  status: "queued" | "running" | "done" | "error";
  step?: Step;
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
};

export const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jobStore(event: HandlerEvent) {
  // Lambda-compatible handlers must hand Netlify's Blobs context over first.
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
  return getStore("financial-analysis-jobs");
}

/** The signed-in user behind the request's bearer token, or null. */
export async function userFromRequest(event: HandlerEvent): Promise<{ id: string } | null> {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const { data, error } = await createClient(url, anonKey).auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id };
}
