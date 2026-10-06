/**
 * /api/artifacts – the signed-in user's saved tool outputs.
 *
 *   GET                          all, newest first
 *   GET    ?id=<uuid>            one (null when missing)
 *   GET    ?toolType=<type>      the latest of that tool (null when none)
 *   POST   {toolType,title,…}    create, returns the row
 *   PATCH  ?id=<uuid>[&touch=0]  update, returns the row; touch=0 leaves updated_at alone
 *   DELETE ?id=<uuid>
 *
 * Every statement is scoped to the session's user_id (what RLS did on Supabase).
 */
import { query } from "../server/db";
import { HttpError, json, pick, readBody, requireUser, route, setClause, toParam, uuidParam } from "../server/http";

const WRITABLE = ["tool_type", "title", "content", "status", "version"] as const;

const handler = route({
  async GET(request) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    if (url.searchParams.has("id")) {
      const [row] = await query("select * from public.artifacts where id = $1 and user_id = $2", [uuidParam(url, "id"), user.id]);
      return json(row ?? null);
    }
    const toolType = url.searchParams.get("toolType");
    if (toolType) {
      const [row] = await query(
        "select * from public.artifacts where user_id = $1 and tool_type::text = $2 order by created_at desc limit 1",
        [user.id, toolType],
      );
      return json(row ?? null);
    }
    return json(await query("select * from public.artifacts where user_id = $1 order by created_at desc", [user.id]));
  },

  async POST(request) {
    const user = await requireUser(request);
    const values = pick(await readBody(request), WRITABLE);
    if (typeof values.tool_type !== "string" || typeof values.title !== "string") throw new HttpError(400, "toolType and title are required.");
    const columns = Object.keys(values);
    const [row] = await query(
      `insert into public.artifacts (user_id, ${columns.map((c) => `"${c}"`).join(", ")})
       values ($1, ${columns.map((_, i) => `$${i + 2}`).join(", ")}) returning *`,
      [user.id, ...columns.map((c) => toParam(values[c]))],
    );
    return json(row, 201);
  },

  async PATCH(request) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const id = uuidParam(url, "id");
    const values = pick(await readBody(request), WRITABLE);
    if (Object.keys(values).length === 0) throw new HttpError(400, "Nothing to update.");
    const set = setClause(values, 3);
    const touch = url.searchParams.get("touch") !== "0";
    const [row] = await query(
      `update public.artifacts set ${set.sql}${touch ? ", updated_at = now()" : ""} where id = $1 and user_id = $2 returning *`,
      [id, user.id, ...set.params],
    );
    if (!row) throw new HttpError(404, "Artifact not found.");
    return json(row);
  },

  async DELETE(request) {
    const user = await requireUser(request);
    const id = uuidParam(new URL(request.url), "id");
    await query("delete from public.artifacts where id = $1 and user_id = $2", [id, user.id]);
    return new Response(null, { status: 204 });
  },
});

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
