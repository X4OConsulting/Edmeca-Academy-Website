/**
 * /api/execution-gap – see server/handlers/execution-gap.ts (ported from Netlify Functions).
 */
import { handler } from "../server/handlers/execution-gap.js";
import { toWebHandler } from "../server/legacy.js";

const web = toWebHandler(handler);

export { web as POST, web as OPTIONS };
