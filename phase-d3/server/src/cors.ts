// Strict CORS for the installable app on GitHub Pages. Bearer tokens only, so no Access-Control-Allow-Credentials.
// A request with a disallowed Origin gets 403 and no Access-Control-Allow-* header at all.
import type { IncomingMessage, ServerResponse } from 'node:http';

export const DEFAULT_ORIGINS = ['https://mohaco1.github.io'];
const ALLOW_HEADERS = 'Authorization, Content-Type, If-None-Match, Idempotency-Key';
const EXPOSE_HEADERS = 'ETag, Retry-After';
const ALLOW_METHODS = 'GET, POST, OPTIONS';

export function securityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
}

// Returns 'done' when the request has been answered (preflight or refusal), otherwise 'next'.
export function applyCors(req: IncomingMessage, res: ServerResponse, allowed: Set<string>): 'done' | 'next' {
  securityHeaders(res);
  const origin = req.headers.origin;
  if (origin !== undefined) {
    if (!allowed.has(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'origin_not_allowed' }));
      return 'done';
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  }
  if (req.method === 'OPTIONS') {
    if (origin !== undefined) {
      res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS);
      res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
      res.setHeader('Access-Control-Max-Age', '600');
    }
    res.writeHead(204); res.end();
    return 'done';
  }
  return 'next';
}
