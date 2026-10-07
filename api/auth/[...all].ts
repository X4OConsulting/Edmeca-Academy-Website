/**
 * /api/auth/* – every Better Auth endpoint (sign-in, sign-up, sessions, Google
 * callback, password reset, email verification).
 */
import { auth } from "../../server/auth.js";

const handler = (request: Request) => auth.handler(request);

export { handler as GET, handler as POST };
