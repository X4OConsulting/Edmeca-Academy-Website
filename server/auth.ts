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
 */
import { betterAuth } from "better-auth";
import { verifyPassword } from "better-auth/crypto";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { actionEmail, sendEmail } from "./email.js";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
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
  account: {
    // A Google sign-in with the same verified email joins the existing account
    // instead of failing, as Supabase did.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  databaseHooks: {
    user: {
      create: {
        // Every user has a profile row; the browser used to create it on sign-in.
        async after(user) {
          await db().query("insert into public.user_profiles (user_id) values ($1) on conflict (user_id) do nothing", [user.id]);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
