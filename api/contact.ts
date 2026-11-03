/**
 * /api/contact – the public Contact form. Saves the message and emails the team.
 * Replaces Netlify Forms and netlify/functions/contact.ts.
 */
import { query } from "../server/db.js";
import { email, field, notifyTeam, oneOf } from "../server/forms.js";
import { json, readBody, route } from "../server/http.js";
import { AUDIENCES, OFFERINGS } from "../client/src/data/offerings.js";

// The earlier three values stay valid so a page loaded before a release can still submit.
const AUDIENCE_VALUES = [...AUDIENCES.map((a) => a.value), "entrepreneur", "programme"];
const OFFERING_SLUGS = OFFERINGS.map((o) => o.slug);

const audienceLabel = (value: string) => AUDIENCES.find((a) => a.value === value)?.label ?? value;

const handler = route({
  async POST(request) {
    const body = await readBody(request);
    const submission = {
      name: field(body, "name", { min: 2, max: 100 })!,
      email: email(body),
      company: field(body, "company", { max: 200, required: false }),
      audienceType: oneOf(body, "audienceType", AUDIENCE_VALUES),
      message: field(body, "message", { min: 10, max: 5000 })!,
    };
    // Optional; not stored (contact_submissions has no column for it), only sent in the notification.
    const offering = body.offering ? oneOf(body, "offering", OFFERING_SLUGS) : null;
    const [row] = await query<{ id: string; created_at: string }>(
      "insert into public.contact_submissions (name, email, company, audience_type, message) values ($1, $2, $3, $4, $5) returning id, created_at",
      [submission.name, submission.email, submission.company, submission.audienceType, submission.message],
    );
    // Never log the message itself (personal information).
    console.log("Contact form submission received", { id: row.id, audienceType: submission.audienceType, offering });
    await notifyTeam(`New contact message from ${submission.name}`, {
      Name: submission.name,
      Email: submission.email,
      Company: submission.company,
      "I am": audienceLabel(submission.audienceType),
      "Offering of interest": OFFERINGS.find((o) => o.slug === offering)?.title ?? null,
      Message: submission.message,
    });
    return json({ id: row.id, created_at: row.created_at, ...submission, offering }, 201);
  },
});

export { handler as POST };
