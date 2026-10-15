/**
 * Better Auth browser client. Same-origin: the server lives at /api/auth and
 * keeps the session in an httpOnly cookie, so nothing here stores tokens.
 */
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { friendlyAuthError } from "./auth-errors";

export const authClient = createAuthClient({ basePath: "/api/auth", plugins: [emailOTPClient()] });

/** Better Auth's { error } as a thrown Error with a plain-language message and the original code. */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export function unwrap<T>(result: { data: T | null; error: { message?: string; code?: string; status?: number } | null }): T {
  if (result.error) throw new AuthError(friendlyAuthError(result.error, result.error.message || undefined), result.error.code);
  return result.data as T;
}
