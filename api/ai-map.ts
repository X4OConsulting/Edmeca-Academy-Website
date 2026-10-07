/**
 * /api/ai-map – see server/handlers/ai-map.ts (ported from Netlify Functions).
 */
import { handler } from "../server/handlers/ai-map.js";
import { toWebHandler } from "../server/legacy.js";

const web = toWebHandler(handler);

export { web as POST, web as OPTIONS };
