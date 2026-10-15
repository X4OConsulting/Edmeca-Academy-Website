/**
 * Plain-language messages for every sign-in problem a user can hit. Better
 * Auth's own messages ("Invalid OTP", "Credential account not found") are
 * written for developers; these say what happened and what to do next.
 */

type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

const BY_CODE: Record<string, string> = {
  // Sign-in codes
  INVALID_OTP: "That code is not right. Check the latest email from EDMECA and try again.",
  OTP_EXPIRED: "That code has expired. Request a new one below.",
  TOO_MANY_ATTEMPTS: "Too many wrong codes. Request a new code and try again.",
  // Passwords
  INVALID_EMAIL_OR_PASSWORD: "Email or password is incorrect. If you usually sign in with Google or a code, use that instead.",
  INVALID_PASSWORD: "That password is incorrect.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "This account has no password. Sign in with an email code or Google instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "That password is too long. Use 128 characters or fewer.",
  EMAIL_NOT_VERIFIED: "This email is not confirmed yet. Sign in with an email code instead: it confirms your email at the same time.",
  // Accounts
  USER_ALREADY_EXISTS: "An account with this email already exists. Sign in instead: an email code works for every account.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Sign in instead: an email code works for every account.",
  USER_NOT_FOUND: "No account found for this email. EDMECA Academy is invite-only: apply for access first.",
  NOT_INVITED: "EDMECA Academy is invite-only. Apply for access, or ask your programme manager for an invite.",
  INVALID_EMAIL: "That email address does not look right.",
  // Reset links
  INVALID_TOKEN: "This link is no longer valid. Request a new one.",
  TOKEN_EXPIRED: "This link has expired. Request a new one.",
};

/** Errors Google sign-in reports back on /login?error=… */
const OAUTH_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  // Invite-only: Google found no invited account for this email.
  signup_disabled: "This Google account's email has not been invited to EDMECA Academy. Apply for access, or sign in with the email you were invited with.",
  NOT_INVITED: "This Google account's email has not been invited to EDMECA Academy. Apply for access, or sign in with the email you were invited with.",
  account_not_linked: "This Google account could not be joined to your existing EDMECA account. Sign in with an email code instead.",
  unable_to_link_account: "This Google account could not be joined to your existing EDMECA account. Sign in with an email code instead.",
  email_not_found: "Google did not share an email address. Sign in with an email code instead.",
  state_mismatch: "Google sign-in timed out. Please try again.",
};

export function friendlyAuthError(error: AuthErrorLike, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  if (error.status === 429) return "Too many attempts from this device. Please wait a minute and try again.";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 0 || /failed to fetch|network/i.test(error.message ?? "")) {
    return "Could not reach EDMECA. Check your internet connection and try again.";
  }
  return fallback;
}

export function friendlyOAuthError(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERRORS[code] ?? "Google sign-in did not complete. Please try again, or sign in with an email code.";
}
