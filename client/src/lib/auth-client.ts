/**
 * Better Auth browser client. Same-origin: the server lives at /api/auth and
 * keeps the session in an httpOnly cookie, so nothing here stores tokens.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({ basePath: "/api/auth" });

/** Better Auth's { error } as a thrown Error carrying its code, so callers can try/catch. */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export function unwrap<T>(result: { data: T | null; error: { message?: string; code?: string } | null }): T {
  if (result.error) throw new AuthError(result.error.message || "Something went wrong. Please try again.", result.error.code);
  return result.data as T;
}
