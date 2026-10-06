/**
 * Small helpers shared by the /api route handlers (Web Request/Response).
 */
import { auth } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** The signed-in user (from the Better Auth session cookie), or null. */
export async function sessionUser(request: Request): Promise<{ id: string; email: string; name: string } | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session ? { id: session.user.id, email: session.user.email, name: session.user.name } : null;
}

/** The signed-in user, or a 401. */
export async function requireUser(request: Request): Promise<{ id: string; email: string; name: string }> {
  const user = await sessionUser(request);
  if (!user) throw new HttpError(401, "Please sign in again.");
  return user;
}

/** The request's JSON body as an object, or a 400. */
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through to the 400 below
  }
  throw new HttpError(400, "The request body must be a JSON object.");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A UUID query parameter, or a 400. */
export function uuidParam(url: URL, name: string): string {
  const value = url.searchParams.get(name) ?? "";
  if (!UUID.test(value)) throw new HttpError(400, `A valid ${name} is required.`);
  return value;
}

const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/**
 * Keeps only the allowed columns of a write, accepting camelCase or snake_case
 * keys (the pages send both). Anything else, user_id, role, ids, is dropped, so
 * a caller can never write a column it does not own.
 */
export function pick(body: Record<string, unknown>, allowed: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const column = snake(key);
    if (value !== undefined && allowed.includes(column)) out[column] = value;
  }
  return out;
}

/**
 * Builds the "col = $n" list for an UPDATE from already-picked columns.
 * Column names come only from the allow-lists, never from the request.
 */
export function setClause(values: Record<string, unknown>, firstIndex: number): { sql: string; params: unknown[] } {
  const columns = Object.keys(values);
  return {
    sql: columns.map((column, i) => `"${column}" = $${firstIndex + i}`).join(", "),
    params: columns.map((column) => toParam(values[column])),
  };
}

/** jsonb values go over the wire as JSON text; everything else as is. */
export const toParam = (value: unknown) => (value !== null && typeof value === "object" && !(value instanceof Date) ? JSON.stringify(value) : value);

/**
 * Wraps a method map into one handler: maps HttpError to its status, logs the
 * rest without leaking details, and answers 405 for other methods.
 */
export function route(handlers: Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", (request: Request) => Promise<Response>>>) {
  return async (request: Request): Promise<Response> => {
    const handler = handlers[request.method as keyof typeof handlers];
    if (!handler) return json({ error: "Method Not Allowed" }, 405, { Allow: Object.keys(handlers).join(", ") });
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(`${request.method} ${new URL(request.url).pathname} failed:`, error instanceof Error ? error.message : error);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}
