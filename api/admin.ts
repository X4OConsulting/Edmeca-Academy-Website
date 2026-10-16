/**
 * /api/admin – access management for EDMECA admins (user_profiles.role = 'admin').
 *
 *   GET                                   -> { applications, members }
 *   POST { action: "invite", email, name }
 *   POST { action: "approve", applicationId }    invite the applicant
 *   POST { action: "decline", applicationId }
 *   POST { action: "resend", userId }            invite email again (not yet joined)
 *   POST { action: "revoke", userId }            cancel an invite nobody has used yet
 */
import { query } from "../server/db.js";
import { HttpError, json, readBody, requireUser, route } from "../server/http.js";
import { invite, sendInvite } from "../server/invites.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  const [row] = await query<{ role: string }>("select role from public.user_profiles where user_id = $1", [user.id]);
  if (row?.role !== "admin") throw new HttpError(403, "Only EDMECA admins can manage access.");
  return user;
}

const OUR_SITES = /^(https:\/\/(www\.)?edmeca\.co\.za|https:\/\/edmeca-academy-website[a-z0-9-]*\.vercel\.app|http:\/\/localhost:\d+)$/;

/** Where invite links point: the site the admin is using, if it is one of ours. */
function siteOrigin(request: Request): string {
  const origin = request.headers.get("origin") ?? "";
  return OUR_SITES.test(origin) ? origin : "https://edmeca.co.za";
}

const id = (value: unknown, label: string) => {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, `A valid ${label} is required.`);
  return value;
};

/** A member nobody has signed in as yet: the only kind an admin may remove here. */
async function pendingInvite(userId: string) {
  const [row] = await query<{ email: string; name: string }>(
    `select u.email, u.name from "user" u join public.invites i on i.user_id = u.id
     where u.id = $1 and i.accepted_at is null`, [userId]);
  if (!row) throw new HttpError(404, "No unused invite found for this person.");
  return row;
}

const handler = route({
  async GET(request) {
    await requireAdmin(request);
    const applications = await query(
      `select id, name, email, organisation, interest_type, motivation, created_at
       from public.signup_applications where status = 'pending' order by created_at desc limit 200`);
    const members = await query(
      `select u.id, u.name, u.email, u."createdAt" as created_at, coalesce(p.role::text, 'entrepreneur') as role,
              i.invited_at, i.accepted_at, (i.user_id is not null and i.accepted_at is null) as pending
       from "user" u
       left join public.user_profiles p on p.user_id = u.id
       left join public.invites i on i.user_id = u.id
       order by (i.user_id is not null and i.accepted_at is null) desc, u."createdAt" desc limit 500`);
    return json({ applications, members });
  },

  async POST(request) {
    const admin = await requireAdmin(request);
    const body = await readBody(request);
    const origin = siteOrigin(request);

    switch (body.action) {
      case "invite": {
        const result = await invite({ email: String(body.email ?? ""), name: String(body.name ?? ""), invitedBy: admin.id, origin });
        return json(result, 201);
      }
      case "approve": {
        const applicationId = id(body.applicationId, "application");
        const [app] = await query<{ email: string; name: string }>(
          "select email, name from public.signup_applications where id = $1 and status = 'pending'", [applicationId]);
        if (!app) throw new HttpError(404, "This application was already reviewed.");
        const result = await invite({ email: app.email, name: app.name, invitedBy: admin.id, applicationId, origin });
        await query("update public.signup_applications set status = 'approved', reviewed_at = now(), reviewed_by = $2 where id = $1", [applicationId, admin.id]);
        return json(result, 201);
      }
      case "decline": {
        const applicationId = id(body.applicationId, "application");
        await query("update public.signup_applications set status = 'declined', reviewed_at = now(), reviewed_by = $2 where id = $1 and status = 'pending'", [applicationId, admin.id]);
        return json({ ok: true });
      }
      case "resend": {
        const person = await pendingInvite(id(body.userId, "user"));
        await sendInvite(person.email, person.name, origin);
        await query("update public.invites set invited_at = now() where email = $1", [person.email.toLowerCase()]);
        return json({ ok: true });
      }
      case "revoke": {
        const userId = id(body.userId, "user");
        await pendingInvite(userId);
        // Never signed in, so there is no data to lose; the invite row goes with the account.
        await query('delete from "user" where id = $1', [userId]);
        return json({ ok: true });
      }
      default:
        throw new HttpError(400, "Unknown action.");
    }
  },
});

export { handler as GET, handler as POST };
