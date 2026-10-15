/**
 * Better Auth, self-hosted on Neon. Replaces Supabase Auth.
 *
 * - Sessions are httpOnly cookies on the site's own domain, so the browser no
 *   longer attaches bearer tokens; API routes read the session from the cookie.
 * - User ids are UUIDs and the users imported from Supabase keep their old ids,
 *   so every artifacts / user_profiles / financial_uploads row still points at
 *   its owner (scripts/supabase-import/).
 * - Supabase stored bcrypt hashes; those users can keep signing in with their
 *   existing password. A password set or reset here uses Better Auth's scrypt.
 * - Invite-only: nobody can create an account by signing in. Every sign-up
 *   route is switched off, and as a second lock a new user is refused unless
 *   their email is in public.invites (an admin's invite, server/invites.ts).
 */
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { verifyPassword } from "better-auth/crypto";
import { emailOTP } from "better-auth/plugins";
import { waitUntil } from "@vercel/functions";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { actionEmail, codeEmail, sendEmail } from "./email.js";

const OTP_MINUTES = 10;

const OTP_EMAIL = {
  "sign-in": ["Your EDMECA sign-in code", "Sign in to EDMECA Academy", "Enter this code on the sign-in page to continue."],
  "email-verification": ["Your EDMECA verification code", "Confirm your email", "Enter this code to confirm your email address."],
  "forget-password": ["Your EDMECA password reset code", "Reset your password", "Enter this code to choose a new password."],
  "change-email": ["Your EDMECA email change code", "Confirm your new email", "Enter this code to confirm your new email address."],
} as const;

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // Every Google sign-in: choose the account, then confirm what EDMECA
          // receives (name, email, photo). Google otherwise skips the
          // confirmation after the first time.
          prompt: "select_account consent" as const,
          // Invite-only: Google signs in invited accounts, never creates one.
          disableSignUp: true,
          disableImplicitSignUp: true,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: "EDMECA Academy",
  database: db(),
  basePath: "/api/auth",
  baseURL: {
    // The live domain, this project's Vercel deployments, and local dev.
    allowedHosts: ["edmeca.co.za", "www.edmeca.co.za", "edmeca-academy-website*.vercel.app", "localhost:*"],
    fallback: process.env.BETTER_AUTH_URL || "https://edmeca.co.za",
  },
  advanced: {
    database: {
      generateId: "uuid",
      // The runtime check is an unawaited query started at cold start; Vercel
      // freezes the function after the response, so it failed and logged an
      // error on every cold start. The schema is managed by db:migrate and
      // auth:migrate (which still validates it), so the check is redundant here.
      validateSchema: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    // Supabase required a confirmed email before first sign-in; keep that.
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    password: {
      async verify({ hash, password }) {
        // Hashes carried over from Supabase are bcrypt ($2a$/$2b$).
        if (hash.startsWith("$2")) return bcrypt.compare(password, hash);
        return verifyPassword({ hash, password });
      },
    },
    async sendResetPassword({ user, url }) {
      await sendEmail(user.email, "Reset your EDMECA password",
        actionEmail("Reset your password", "We received a request to reset the password for your EDMECA Academy account. The link expires in one hour.", "Choose a new password", url));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendEmail(user.email, "Confirm your EDMECA account",
        actionEmail("Confirm your email", "Welcome to EDMECA Academy. Please confirm your email address to finish creating your account.", "Confirm email", url));
    },
  },
  socialProviders: google,
  plugins: [
    // Passwordless sign-in: the user enters their email, gets a 6-digit code,
    // and enters it. Only existing (invited) accounts get a code; an unknown
    // email gets the same "check your email" answer but no email.
    emailOTP({
      disableSignUp: true,
      otpLength: 6,
      expiresIn: OTP_MINUTES * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        const [subject, heading, body] = OTP_EMAIL[type];
        // Not awaited, so the response time does not reveal whether the email
        // has an account (the plugin's advice); waitUntil keeps the function
        // alive on Vercel until the email is sent.
        waitUntil(sendEmail(email, subject, codeEmail(heading, body, otp, OTP_MINUTES))
          .catch((error) => console.error(`Sign-in code email (${type}) not sent:`, error instanceof Error ? error.message : error)));
      },
    }),
  ],
  // Limits are per IP and per endpoint; kept in Neon so they hold across all
  // function instances (the default memory store is per instance). Sending a
  // code is the abuse target (it emails any address), hence its own tight rule.
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 10 },
    },
  },
  account: {
    // A Google sign-in with the same verified email joins the existing account
    // instead of failing, as Supabase did.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  databaseHooks: {
    user: {
      create: {
        // The second lock of invite-only: whatever the route, no invite, no account.
        async before(user) {
          const rows = await db().query("select 1 from public.invites where email = $1", [String(user.email).toLowerCase()]);
          if (rows.rowCount === 0) {
            throw new APIError("FORBIDDEN", { code: "NOT_INVITED", message: "EDMECA Academy is invite-only. Apply for access, or ask your programme manager for an invite." });
          }
        },
        // Every user has a profile row; the browser used to create it on sign-in.
        async after(user) {
          await db().query("insert into public.user_profiles (user_id) values ($1) on conflict (user_id) do nothing", [user.id]);
        },
      },
    },
    session: {
      create: {
        // First sign-in accepts the invite (the Admin page shows who has joined).
        async after(session) {
          await db().query("update public.invites set accepted_at = now() where user_id = $1 and accepted_at is null", [session.userId]);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
