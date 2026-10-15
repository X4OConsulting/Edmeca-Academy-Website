/**
 * Runs the handlers written for Netlify Functions (event in, { statusCode,
 * headers, body } out) as Vercel Web handlers, so their validated logic and
 * tests carry over unchanged. New routes use Request/Response directly.
 */
import { waitUntil } from "@vercel/functions";

export type HandlerEvent = {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  queryStringParameters?: Record<string, string | undefined>;
};

export type HandlerResult = { statusCode: number; headers?: Record<string, string>; body?: string };

export type Handler = (event: HandlerEvent) => Promise<HandlerResult>;

export function toWebHandler(handler: Handler) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const result = await handler({
      httpMethod: request.method,
      headers: Object.fromEntries(request.headers),
      body: request.method === "GET" || request.method === "HEAD" ? null : await request.text(),
      queryStringParameters: Object.fromEntries(url.searchParams),
    });
    return new Response(result.statusCode === 204 ? null : result.body ?? "", { status: result.statusCode, headers: result.headers });
  };
}

/**
 * Runs work after the response is sent (the email and sheet delivery that
 * Netlify Background Functions did). Vercel keeps the function alive until it
 * settles; failures are logged, never thrown at the already-answered caller.
 */
export function inBackground(label: string, work: () => Promise<void>): void {
  waitUntil(work().catch((error) => console.error(`${label} failed:`, error instanceof Error ? error.message : "unknown error")));
}
