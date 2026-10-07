/**
 * /api/progress – the signed-in user's Progress Tracker milestones.
 *
 *   GET                                       all, newest first
 *   POST   {milestone, evidence?, completedAt?}  create, returns the row
 *   PATCH  ?id=<uuid>  {completed: boolean}   set or clear completed_at
 *   DELETE ?id=<uuid>
 *
 * The table has no evidence column; the evidence text lives in notes.
 */
import { query } from "../server/db.js";
import { HttpError, json, readBody, requireUser, route, uuidParam } from "../server/http.js";

const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.slice(0, max) : null);

const handler = route({
  async GET(request) {
    const user = await requireUser(request);
    return json(await query("select * from public.progress_entries where user_id = $1 order by created_at desc", [user.id]));
  },

  async POST(request) {
    const user = await requireUser(request);
    const body = await readBody(request);
    const milestone = text(body.milestone, 500);
    if (!milestone) throw new HttpError(400, "A milestone is required.");
    const completedAt = typeof body.completedAt === "string" && !Number.isNaN(Date.parse(body.completedAt)) ? body.completedAt : null;
    const [row] = await query(
      "insert into public.progress_entries (user_id, milestone, notes, completed_at) values ($1, $2, $3, $4) returning *",
      [user.id, milestone, text(body.evidence, 5000), completedAt],
    );
    return json(row, 201);
  },

  async PATCH(request) {
    const user = await requireUser(request);
    const id = uuidParam(new URL(request.url), "id");
    const body = await readBody(request);
    if (typeof body.completed !== "boolean") throw new HttpError(400, "completed must be true or false.");
    const [row] = await query(
      "update public.progress_entries set completed_at = case when $3 then now() else null end where id = $1 and user_id = $2 returning *",
      [id, user.id, body.completed],
    );
    if (!row) throw new HttpError(404, "Milestone not found.");
    return json(row);
  },

  async DELETE(request) {
    const user = await requireUser(request);
    const id = uuidParam(new URL(request.url), "id");
    await query("delete from public.progress_entries where id = $1 and user_id = $2", [id, user.id]);
    return new Response(null, { status: 204 });
  },
});

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
