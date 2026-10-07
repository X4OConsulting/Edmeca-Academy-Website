/**
 * /api/financial-uploads – the signed-in user's saved Financial Analysis reports.
 *
 *   GET          the latest 10
 *   POST {…}     save one report
 */
import { query } from "../server/db.js";
import { HttpError, json, pick, readBody, requireUser, route } from "../server/http.js";

const COLUMNS = "id, file_name, file_type, company_name, analysed_at, report_text, model_categorisation, model_analysis";
const WRITABLE = ["file_name", "file_type", "company_name", "report_text", "model_categorisation", "model_analysis"] as const;
const FILE_TYPES = ["paste", "csv", "xlsx", "pdf"];

const handler = route({
  async GET(request) {
    const user = await requireUser(request);
    return json(await query(`select ${COLUMNS} from public.financial_uploads where user_id = $1 order by analysed_at desc limit 10`, [user.id]));
  },

  async POST(request) {
    const user = await requireUser(request);
    const values = pick(await readBody(request), WRITABLE);
    if (typeof values.file_name !== "string" || !values.file_name) throw new HttpError(400, "file_name is required.");
    if (!FILE_TYPES.includes(String(values.file_type))) throw new HttpError(400, "file_type must be paste, csv, xlsx or pdf.");
    for (const [column, value] of Object.entries(values)) {
      if (value !== null && typeof value !== "string") throw new HttpError(400, `${column} must be text.`);
    }
    const [row] = await query(
      `insert into public.financial_uploads (user_id, file_name, file_type, company_name, report_text, model_categorisation, model_analysis)
       values ($1, $2, $3, $4, $5, $6, $7) returning ${COLUMNS}`,
      [user.id, (values.file_name as string).slice(0, 255), values.file_type, values.company_name ?? null,
        values.report_text ?? null, values.model_categorisation ?? null, values.model_analysis ?? null],
    );
    return json(row, 201);
  },
});

export { handler as GET, handler as POST };
