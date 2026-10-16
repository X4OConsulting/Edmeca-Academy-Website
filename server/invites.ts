/**
 * Invites: the only way an account is created (see server/auth.ts). Inviting
 * records the email in public.invites, creates the account (email already
 * confirmed, no password), and emails the person a link to sign in with a
 * code or Google.
 */
import { auth } from "./auth.js";
import { query } from "./db.js";
import { actionEmail, sendEmail } from "./email.js";
import { HttpError } from "./http.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function inviteEmail(name: string, signInUrl: string): string {
  return actionEmail(
    "You're invited to EDMECA Academy",
    `Hi ${name}, you now have access to the EDMECA Academy portal. Sign in with your email address: we'll email you a one-time code, so there is no password to remember. You can also continue with Google if this is your Google email.`,
    "Sign in to EDMECA Academy",
    signInUrl,
  );
}

export async function sendInvite(email: string, name: string, origin: string): Promise<void> {
  await sendEmail(email, "You're invited to EDMECA Academy", inviteEmail(name, `${origin}/login?email=${encodeURIComponent(email)}`));
}

/** Invites one person. Refuses an email that already has an account. */
export async function invite(input: { email: string; name?: string | null; invitedBy: string; applicationId?: string | null; origin: string }): Promise<{ userId: string }> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, "Enter a valid email address.");
  const name = (input.name ?? "").trim().slice(0, 100) || email.split("@")[0];

  const [existing] = await query<{ id: string }>('select id from "user" where email = $1', [email]);
  if (existing) throw new HttpError(409, "This email already has an account.");

  await query(
    `insert into public.invites (email, name, invited_by, application_id) values ($1, $2, $3, $4)
     on conflict (email) do update set name = excluded.name, invited_by = excluded.invited_by,
       application_id = coalesce(excluded.application_id, public.invites.application_id), invited_at = now()`,
    [email, name, input.invitedBy, input.applicationId ?? null],
  );
  const ctx = await auth.$context;
  // Confirmed now: only an admin can create it, it has no password, and the
  // only ways in are a code sent to this inbox or Google for this email.
  // (Google refuses to join an unconfirmed account.)
  const user = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: "admin" });
  await query("update public.invites set user_id = $1 where email = $2", [user.id, email]);

  try {
    await sendInvite(email, name, input.origin);
  } catch (error) {
    console.error("Invite email not sent:", error instanceof Error ? error.message : error);
    throw new HttpError(502, "The account was created, but the invite email could not be sent. Use Resend invite.");
  }
  return { userId: user.id };
}
