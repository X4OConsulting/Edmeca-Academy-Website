/**
 * /api/password – lets a user who signs in with an email code or Google add a
 * password. Better Auth's setPassword is server-only (changing an existing
 * password goes through /api/auth/change-password from the browser).
 *
 *   POST { newPassword } -> { ok: true }
 */
import { auth } from "../server/auth.js";
import { HttpError, json, readBody, requireUser, route } from "../server/http.js";

const MESSAGES: Record<string, string> = {
  PASSWORD_ALREADY_SET: "This account already has a password. Use Change Password instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "That password is too long. Use 128 characters or fewer.",
};

const handler = route({
  async POST(request) {
    await requireUser(request);
    const { newPassword } = await readBody(request);
    if (typeof newPassword !== "string" || !newPassword) throw new HttpError(400, "Enter a new password.");
    try {
      await auth.api.setPassword({ body: { newPassword }, headers: request.headers });
    } catch (error) {
      const code = (error as { body?: { code?: string } })?.body?.code;
      if (code && MESSAGES[code]) throw new HttpError(400, MESSAGES[code]);
      throw error;
    }
    return json({ ok: true });
  },
});

export { handler as POST };
