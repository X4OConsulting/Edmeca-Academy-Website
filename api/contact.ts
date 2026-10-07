/**
 * /api/contact – the public Contact form. Saves the message and emails the team.
 * Replaces Netlify Forms and netlify/functions/contact.ts.
 */
import { query } from "../server/db.js";
import { email, field, notifyTeam, oneOf } from "../server/forms.js";
import { json, readBody, route } from "../server/http.js";

const AUDIENCES = ["entrepreneur", "programme", "other"] as const;

const handler = route({
  async POST(request) {
    const body = await readBody(request);
    const submission = {
      name: field(body, "name", { min: 2, max: 100 })!,
      email: email(body),
      company: field(body, "company", { max: 200, required: false }),
      audienceType: oneOf(body, "audienceType", AUDIENCES),
      message: field(body, "message", { min: 10, max: 5000 })!,
    };
    const [row] = await query<{ id: string; created_at: string }>(
      "insert into public.contact_submissions (name, email, company, audience_type, message) values ($1, $2, $3, $4, $5) returning id, created_at",
      [submission.name, submission.email, submission.company, submission.audienceType, submission.message],
    );
    // Never log the message itself (personal information).
    console.log("Contact form submission received", { id: row.id, audienceType: submission.audienceType });
    await notifyTeam(`New contact message from ${submission.name}`, {
      Name: submission.name, Email: submission.email, Company: submission.company, Audience: submission.audienceType, Message: submission.message,
    });
    return json({ id: row.id, created_at: row.created_at, ...submission }, 201);
  },
});

export { handler as POST };
