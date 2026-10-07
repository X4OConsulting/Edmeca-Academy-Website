/**
 * /api/profile – the signed-in user's profile row.
 *
 *   GET                                      the row (null if none yet)
 *   PUT    {businessName?, businessDescription?}  create or update, returns the row
 *
 * Only the business fields are writable. role, organization_id and cohort_id
 * are set by admins in the database, never by the user (the gap the unapplied
 * Supabase "portal hardening" SQL was meant to close).
 */
import { query } from "../server/db.js";
import { HttpError, json, pick, readBody, requireUser, route, setClause } from "../server/http.js";

const WRITABLE = ["business_name", "business_description"] as const;

const handler = route({
  async GET(request) {
    const user = await requireUser(request);
    const [row] = await query("select * from public.user_profiles where user_id = $1", [user.id]);
    return json(row ?? null);
  },

  async PUT(request) {
    const user = await requireUser(request);
    const values = pick(await readBody(request), WRITABLE);
    for (const [column, value] of Object.entries(values)) {
      if (value !== null && typeof value !== "string") throw new HttpError(400, `${column} must be text.`);
      if (typeof value === "string" && value.length > 5000) throw new HttpError(400, `${column} is too long.`);
    }
    const columns = Object.keys(values);
    const set = setClause(values, 2);
    const [row] = await query(
      `insert into public.user_profiles (user_id${columns.map((c) => `, "${c}"`).join("")})
       values ($1${columns.map((_, i) => `, $${i + 2}`).join("")})
       on conflict (user_id) do update set ${columns.length ? `${set.sql}, ` : ""}updated_at = now()
       returning *`,
      [user.id, ...set.params],
    );
    return json(row);
  },
});

export { handler as GET, handler as PUT };
