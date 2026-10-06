/**
 * /api/assessment – see server/handlers/assessment.ts (ported from Netlify Functions).
 */
import { handler } from "../server/handlers/assessment";
import { toWebHandler } from "../server/legacy";

const web = toWebHandler(handler);

export { web as POST, web as OPTIONS };
