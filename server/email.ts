/**
 * Transactional email through Resend's REST API (https://resend.com/docs/api-reference/emails/send-email).
 * Supabase used to send the auth emails over Resend SMTP; with Better Auth our
 * server sends them, from the same verified edmeca.co.za domain.
 */
const FROM = process.env.EMAIL_FROM || "EDMECA Academy <noreply@edmeca.co.za>";

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set; cannot send email.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Resend's error body names the problem (unverified domain, bad key) and holds no secrets.
    throw new Error(`Resend rejected the email (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
}

/** A plain, client-safe email with one call-to-action link. */
export function actionEmail(heading: string, body: string, buttonText: string, url: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:24px">
<h2 style="color:#0f2a44">${escape(heading)}</h2>
<p>${escape(body)}</p>
<p><a href="${escape(url)}" style="display:inline-block;background:#e8762c;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${escape(buttonText)}</a></p>
<p style="font-size:12px;color:#6b7280">If the button does not work, paste this link into your browser:<br>${escape(url)}</p>
<p style="font-size:12px;color:#6b7280">If you did not ask for this, you can ignore this email.</p>
</body></html>`;
}
