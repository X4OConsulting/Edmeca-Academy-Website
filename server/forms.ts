/**
 * Shared checks and the team notification for the public marketing forms
 * (contact, signup). These replace Netlify Forms.
 */
import { HttpError } from "./http.js";
import { sendEmail } from "./email.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A trimmed text field, or a 400 naming the field. */
export function field(body: Record<string, unknown>, name: string, { max, min = 0, required = true }: { max: number; min?: number; required?: boolean }): string | null {
  const raw = body[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    if (required) throw new HttpError(400, `${name} is required.`);
    return null;
  }
  if (value.length < min || value.length > max) throw new HttpError(400, `${name} must be between ${min} and ${max} characters.`);
  return value;
}

export function email(body: Record<string, unknown>): string {
  const value = field(body, "email", { max: 200 })!;
  if (!EMAIL.test(value)) throw new HttpError(400, "Please enter a valid email address.");
  return value;
}

export function oneOf<T extends string>(body: Record<string, unknown>, name: string, allowed: readonly T[]): T {
  const value = body[name];
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new HttpError(400, `${name} must be one of: ${allowed.join(", ")}.`);
  return value as T;
}

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the team a submission. The row is already saved, so a mail failure is
 * logged, not shown to the visitor (the team can still see it in the database).
 */
export async function notifyTeam(subject: string, fields: Record<string, string | null>): Promise<void> {
  const to = process.env.FORMS_NOTIFY_TO || "info@edmeca.co.za";
  const rows = Object.entries(fields)
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">${escape(label)}</td><td style="padding:4px 0;white-space:pre-wrap">${escape(value ?? "-")}</td></tr>`)
    .join("");
  try {
    await sendEmail(to, subject, `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937"><h3>${escape(subject)}</h3><table>${rows}</table></body></html>`);
  } catch (error) {
    console.error(`Form notification "${subject}" not sent:`, error instanceof Error ? error.message : error);
  }
}
