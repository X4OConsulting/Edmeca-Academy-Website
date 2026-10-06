/**
 * /api/ai-map – see server/handlers/ai-map.ts (ported from Netlify Functions).
 */
import { handler } from "../server/handlers/ai-map";
import { toWebHandler } from "../server/legacy";

const web = toWebHandler(handler);

export { web as POST, web as OPTIONS };
