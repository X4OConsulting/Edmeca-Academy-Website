/**
 * Financial Analysis jobs: who asked (the Supabase user) and where the result
 * waits for the page to collect it (Netlify Blobs, keyed by job id).
 */
import { connectLambda, getStore } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";
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

export { userFromRequest } from "./auth";
