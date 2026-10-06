/**
 * /api/signup – the public Signup (application) form. Saves the application
 * and emails the team. Replaces Netlify Forms.
 */
import { query } from "../server/db";
import { email, field, notifyTeam, oneOf } from "../server/forms";
import { json, readBody, route } from "../server/http";

const INTERESTS = ["entrepreneur", "programme", "other"] as const;

const handler = route({
  async POST(request) {
    const body = await readBody(request);
    const application = {
      name: field(body, "name", { min: 2, max: 100 })!,
      email: email(body),
      phone: field(body, "phone", { max: 50, required: false }),
      organisation: field(body, "organisation", { max: 200, required: false }),
      interestType: oneOf(body, "interestType", INTERESTS),
      motivation: field(body, "motivation", { min: 20, max: 5000 })!,
    };
    const [row] = await query<{ id: string }>(
      "insert into public.signup_applications (name, email, phone, organisation, interest_type, motivation) values ($1, $2, $3, $4, $5, $6) returning id",
      [application.name, application.email, application.phone, application.organisation, application.interestType, application.motivation],
    );
    console.log("Signup application received", { id: row.id, interestType: application.interestType });
    await notifyTeam(`New EDMECA application from ${application.name}`, {
      Name: application.name, Email: application.email, Phone: application.phone, Organisation: application.organisation,
      Interest: application.interestType, Motivation: application.motivation,
    });
    return json({ id: row.id }, 201);
  },
});

export { handler as POST };
