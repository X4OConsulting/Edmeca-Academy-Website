/**
 * One Neon connection pool per function instance. Fluid Compute reuses
 * instances across requests, so the pool (and its warm connections) is
 * created lazily once and shared, not opened per request.
 *
 * The Neon `Pool` speaks the node-postgres API over WebSockets, which is what
 * Better Auth's built-in Kysely adapter expects, and gives us parameterised
 * queries for the data routes ($1, $2 … never string-built SQL).
 */
import { Pool } from "@neondatabase/serverless";

// The Neon Pool needs a global WebSocket: built into Node 22+ (local) and 24 (Vercel).
if (typeof WebSocket === "undefined") throw new Error("Node 22 or newer is required (no global WebSocket).");

let pool: Pool | undefined;

export function db(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set (connect the Neon integration or run `vercel env pull`).");
  pool = new Pool({ connectionString });
  return pool;
}

/** Runs a parameterised query and returns its rows. */
export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await db().query(text, params);
  return result.rows as T[];
}
