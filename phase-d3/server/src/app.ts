// PharmLedger D3 sync back end: emailed-link sign-in and one vault per pharmacy (HTTPS only), hosted in Sydney.
// Six endpoints (healthz, magic-link, verify, logout, sync GET/POST, topics). Node 22 built-ins only.
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { openStore, hmac, normaliseEmail, type Store } from './db.ts';
import { createLimiter, type Limiter } from './ratelimit.ts';
import { createLogger, type Logger } from './logger.ts';
import { applyCors, DEFAULT_ORIGINS } from './cors.ts';
import { getTopic, TOPICS } from './topics.ts';
import { memoryMailer, type Mailer } from './mailer.ts';

export { memoryMailer, sesMailer, signV4 } from './mailer.ts';
export { TOPICS, getTopic } from './topics.ts';

export const REGION = 'ap-southeast-2';
export const AUTH_BODY_LIMIT = 4096;
export const SYNC_BODY_LIMIT = 2 * 1024 * 1024;
export const MAGIC_TTL_SEC = 900;
export const SESSION_TTL_SEC = 30 * 86_400;
export const LIMITS = { emailPer15: 3, ipPer15: 10, verifyIpPer15: 30, windowSec: 900 };

export interface ServerConfig {
  dbPath: string;
  emailIndexKey: string;
  logHmacKey: string;
  appUrl?: string;                 // where the emailed link opens; the token rides in the #magic= fragment
  extraOrigins?: string[];         // test origins only
  clock?: () => number;
  mailer?: Mailer;
  logWrite?: (line: string) => void;
  trustProxy?: boolean;            // true on Fly: take the client IP from Fly-Client-IP
  mailFrom?: string;
}

export interface ServerApp { server: Server; store: Store; limiter: Limiter; log: Logger; listen(port: number, host?: string): Promise<AddressInfo>; close(): Promise<void> }

class HttpError extends Error { constructor(public status: number, public code: string, public headers: Record<string, string> = {}) { super(code); } }

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const hasForbiddenKey = (v: unknown, depth = 0): boolean => {
  if (depth > 64) return true;
  if (v === null || typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.some(x => hasForbiddenKey(x, depth + 1));
  for (const k of Object.keys(v as object)) { if (FORBIDDEN_KEYS.has(k) || hasForbiddenKey((v as any)[k], depth + 1)) return true; }
  return false;
};

const readJson = (req: IncomingMessage, limit: number): Promise<any> => new Promise((resolve, reject) => {
  const ct = String(req.headers['content-type'] || '');
  if (!/^application\/json\b/i.test(ct)) { req.resume(); return reject(new HttpError(415, 'json_required')); }
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > limit) return reject(new HttpError(413, 'body_too_large'));
  const chunks: Buffer[] = []; let size = 0; let over = false;
  req.on('data', (c: Buffer) => { if (over) return; size += c.length; if (size > limit) { over = true; chunks.length = 0; reject(new HttpError(413, 'body_too_large')); } else chunks.push(c); });
  req.on('end', () => {
    if (over) return;
    let v: unknown;
    try { v = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reject(new HttpError(400, 'invalid_json')); }
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return reject(new HttpError(400, 'object_required'));
    if (hasForbiddenKey(v)) return reject(new HttpError(400, 'forbidden_key'));
    resolve(v);
  });
  req.on('error', () => reject(new HttpError(400, 'read_error')));
});

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
const MAGIC_RE = /^ml_[A-Za-z0-9_-]{43}$/;
const BEARER_RE = /^Bearer (pl_sess_[A-Za-z0-9_-]{43})$/;
const PHARMACY_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const TOPIC_RE = /^[a-z0-9-]{1,64}$/;
const IDEM_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const isIso = (s: unknown) => typeof s === 'string' && s.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s));
const etagMatch = (header: string | undefined, etag: string) => !!header && header.split(',').map(s => s.trim().replace(/^W\//, '')).some(t => t === etag || t === '*');

export function createServerApp(cfg: ServerConfig): ServerApp {
  if (!cfg.emailIndexKey || cfg.emailIndexKey.length < 32) throw new Error('EMAIL_INDEX_HMAC_KEY must be at least 32 characters');
  if (!cfg.logHmacKey || cfg.logHmacKey.length < 32) throw new Error('LOG_HMAC_KEY must be at least 32 characters');
  if (cfg.emailIndexKey === cfg.logHmacKey) throw new Error('EMAIL_INDEX_HMAC_KEY and LOG_HMAC_KEY must differ');
  const clock = cfg.clock || Date.now;
  const store = openStore(cfg.dbPath);
  const limiter = createLimiter();
  const log = createLogger({ hmacKey: cfg.logHmacKey, write: cfg.logWrite, now: clock });
  const mailer = cfg.mailer || memoryMailer();
  const appUrl = cfg.appUrl || 'https://mohaco1.github.io/PropApp/';
  const origins = new Set([...DEFAULT_ORIGINS, ...(cfg.extraOrigins || [])]);

  const send = (res: ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) => {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    if (body === undefined || status === 204 || status === 304) { res.writeHead(status); res.end(); return; }
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(s) });
    res.end(s);
  };
  const clientIp = (req: IncomingMessage) => String((cfg.trustProxy && req.headers['fly-client-ip']) || req.socket.remoteAddress || 'unknown');
  const limit = (key: string, max: number) => {
    const r = limiter.hit(key, max, LIMITS.windowSec, clock());
    if (!r.ok) throw new HttpError(429, 'rate_limited', { 'Retry-After': String(r.retryAfter) });
  };
  const bearer = (req: IncomingMessage): { token: string; accountId: string } => {
    const m = BEARER_RE.exec(String(req.headers.authorization || ''));
    if (!m) throw new HttpError(401, 'unauthorized');
    const accountId = store.sessionAccount(m[1], clock());
    if (!accountId) throw new HttpError(401, 'unauthorized');
    return { token: m[1], accountId };
  };
  const headOut = (h: ReturnType<Store['getVault']>) => ({ pharmacyId: h.pharmacyId, rev: h.rev, updatedAt: h.updatedAt, deletedAt: h.deletedAt, pharmacy: h.pharmacy });

  type Ctx = { req: IncomingMessage; res: ServerResponse; params: Record<string, string>; ipRef: string; meta: Record<string, unknown> };
  type Handler = (c: Ctx) => Promise<void> | void;
  const routes: { method: string; pattern: RegExp; route: string; keys: string[]; h: Handler }[] = [];
  const on = (method: string, route: string, h: Handler) => {
    const keys: string[] = [];
    const pattern = new RegExp('^' + route.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, pattern, route, keys, h });
  };

  on('GET', '/v1/healthz', ({ res }) => {
    let sqlite = 'ok';
    try { store.db.prepare('SELECT 1 AS one').get(); } catch { sqlite = 'error'; }
    send(res, sqlite === 'ok' ? 200 : 503, { ok: sqlite === 'ok', region: REGION, sqlite, ts: new Date(clock()).toISOString() });
  });

  on('POST', '/v1/auth/magic-link', async ({ req, res, ipRef, meta }) => {
    const body = await readJson(req, AUTH_BODY_LIMIT);
    if (typeof body.email !== 'string' || body.email.length > 254 || !EMAIL_RE.test(body.email.trim())) throw new HttpError(400, 'invalid_email');
    const email = normaliseEmail(body.email);
    const emailIndex = hmac(cfg.emailIndexKey, 'email:' + email);
    limit('ml-ip:' + ipRef, LIMITS.ipPer15);
    limit('ml-em:' + emailIndex, LIMITS.emailPer15);
    const token = store.createMagicCode(emailIndex, MAGIC_TTL_SEC, clock());
    const link = appUrl + '#magic=' + token;
    try {
      await mailer.send({ to: email, subject: 'Your PharmLedger sign-in link', text: `Tap to sign in to PharmLedger on this phone:\n\n${link}\n\nThe link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.` });
    } catch { log.error('mail_failed', { reason: 'send' }); }
    meta.reason = 'link_sent';
    send(res, 202, { accepted: true, expiresInSec: MAGIC_TTL_SEC });
  });

  on('POST', '/v1/auth/verify', async ({ req, res, ipRef, meta }) => {
    const body = await readJson(req, AUTH_BODY_LIMIT);
    limit('vf-ip:' + ipRef, LIMITS.verifyIpPer15);
    if (typeof body.token !== 'string' || !MAGIC_RE.test(body.token)) throw new HttpError(401, 'invalid_token');
    const r = store.consumeMagicCode(body.token, SESSION_TTL_SEC, clock());
    if (!r) throw new HttpError(401, 'invalid_token');
    meta.accountRef = log.ref('acct', r.accountId);
    send(res, 200, { sessionToken: r.sessionToken, accountId: r.accountId, expiresAt: new Date(r.expiresAt).toISOString() });
  });

  on('POST', '/v1/auth/logout', ({ req, res, meta }) => {
    const { token, accountId } = bearer(req);
    req.resume();
    if (!store.revokeSession(token, clock())) throw new HttpError(401, 'unauthorized');
    meta.accountRef = log.ref('acct', accountId);
    send(res, 204);
  });

  const pharmacyParam = (p: string) => {
    let id: string;
    try { id = decodeURIComponent(p); } catch { throw new HttpError(400, 'invalid_pharmacy_id'); }
    if (!PHARMACY_RE.test(id) || FORBIDDEN_KEYS.has(id)) throw new HttpError(400, 'invalid_pharmacy_id');
    return id;
  };

  on('GET', '/v1/sync/:pharmacyId', ({ req, res, params, meta }) => {
    const { accountId } = bearer(req);
    const pharmacyId = pharmacyParam(params.pharmacyId);
    const h = store.getVault(accountId, pharmacyId);
    Object.assign(meta, { accountRef: log.ref('acct', accountId), pharmacyRef: log.ref('ph', accountId + '/' + pharmacyId), rev: h.rev });
    const etag = `"rev-${h.rev}"`;
    if (etagMatch(req.headers['if-none-match'] as string | undefined, etag)) return send(res, 304, undefined, { ETag: etag });
    send(res, 200, headOut(h), { ETag: etag });
  });

  on('POST', '/v1/sync/:pharmacyId', async ({ req, res, params, meta }) => {
    const { accountId } = bearer(req);
    const pharmacyId = pharmacyParam(params.pharmacyId);
    const body = await readJson(req, SYNC_BODY_LIMIT);
    const { baseRev, pharmacy } = body;
    const deletedAt = body.deletedAt ?? null;
    if (!Number.isSafeInteger(baseRev) || baseRev < 0) throw new HttpError(400, 'invalid_base_rev');
    if (deletedAt !== null && !isIso(deletedAt)) throw new HttpError(400, 'invalid_deleted_at');
    if (pharmacy !== null && pharmacy !== undefined && (typeof pharmacy !== 'object' || Array.isArray(pharmacy))) throw new HttpError(400, 'invalid_pharmacy');
    if (deletedAt === null && (pharmacy === null || pharmacy === undefined)) throw new HttpError(400, 'pharmacy_required');
    if (pharmacy && pharmacy.id !== undefined && pharmacy.id !== pharmacyId) throw new HttpError(400, 'pharmacy_id_mismatch');
    const idemHeader = req.headers['idempotency-key'];
    const idem = typeof idemHeader === 'string' ? idemHeader : null;
    if (idem !== null && !IDEM_RE.test(idem)) throw new HttpError(400, 'invalid_idempotency_key');
    const r = store.putVault(accountId, pharmacyId, baseRev, pharmacy ?? null, deletedAt, idem, clock());
    Object.assign(meta, { accountRef: log.ref('acct', accountId), pharmacyRef: log.ref('ph', accountId + '/' + pharmacyId), baseRev });
    if (r.kind === 'idem_mismatch') throw new HttpError(422, 'idempotency_key_reused');
    if (r.kind === 'conflict') {
      meta.rev = r.head.rev; meta.reason = 'conflict';
      return send(res, 409, { error: 'conflict', pharmacyId, rev: r.head.rev, currentRev: r.head.rev, updatedAt: r.head.updatedAt, deletedAt: r.head.deletedAt, pharmacy: r.head.pharmacy }, { ETag: `"rev-${r.head.rev}"` });
    }
    meta.rev = r.head.rev; meta.replayed = r.replayed;
    send(res, 200, { pharmacyId, rev: r.head.rev, updatedAt: r.head.updatedAt, deletedAt: r.head.deletedAt, replayed: r.replayed }, { ETag: `"rev-${r.head.rev}"` });
  });

  on('GET', '/v1/topics', ({ res }) => {
    send(res, 200, { topics: TOPICS.map(t => ({ id: t.id, title: t.title, effective: t.effective, etag: getTopic(t.id)!.etag })) });
  });

  on('GET', '/v1/topics/:topicId', ({ req, res, params, meta }) => {
    const id = params.topicId;
    const t = TOPIC_RE.test(id) ? getTopic(id) : undefined;
    if (!t) throw new HttpError(404, 'unknown_topic');
    meta.topicId = id;
    if (etagMatch(req.headers['if-none-match'] as string | undefined, t.etag)) return send(res, 304, undefined, { ETag: t.etag });
    send(res, 200, t.body, { ETag: t.etag });
  });

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    const t0 = process.hrtime.bigint();
    const meta: Record<string, unknown> = {};
    let route = 'unmatched';
    const ipRef = log.ref('ip', clientIp(req));
    res.on('finish', () => log.info('request', { method: req.method, route, status: res.statusCode, ms: Number((process.hrtime.bigint() - t0) / 1000000n), ipRef, ...meta }));
    try {
      if (applyCors(req, res, origins) === 'done') { route = req.method === 'OPTIONS' ? 'preflight' : 'cors_refused'; req.resume(); return; }
      const path = (req.url || '/').split('?')[0];
      const matches = routes.filter(r => r.pattern.test(path));
      if (!matches.length) throw new HttpError(404, 'not_found');
      const r = matches.find(x => x.method === req.method);
      if (!r) throw new HttpError(405, 'method_not_allowed', { Allow: [...new Set(matches.map(m => m.method))].join(', ') });
      route = r.route;
      const m = r.pattern.exec(path)!;
      const params: Record<string, string> = Object.create(null);
      r.keys.forEach((k, i) => { params[k] = m[i + 1]; });
      await r.h({ req, res, params, ipRef, meta });
    } catch (e) {
      if (res.headersSent) { res.destroy(); return; }
      if (e instanceof HttpError) {
        meta.reason = e.code;
        if (e.status === 413) res.setHeader('Connection', 'close');
        send(res, e.status, { error: e.code }, e.headers);
        if (e.status === 413) req.resume();
      } else {
        log.error('handler_error', { route, reason: e instanceof Error ? e.name : 'unknown' });
        send(res, 500, { error: 'internal' });
      }
    }
  };

  const server = createServer({ requestTimeout: 30_000, headersTimeout: 15_000 }, (req, res) => { void handle(req, res); });
  return {
    server, store, limiter, log,
    listen: (port, host = '0.0.0.0') => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => { const a = server.address() as AddressInfo; log.info('listening', { port: a.port, region: REGION }); resolve(a); });
    }),
    close: () => new Promise(resolve => { server.close(() => { try { store.close(); } catch { /* closed */ } resolve(); }); server.closeAllConnections?.(); }),
  };
}
