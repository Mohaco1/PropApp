// Structured JSON logs on stdout. Only ALLOWED_KEYS reach the line; people and pharmacies appear only as short HMAC
// refs (LOG_HMAC_KEY), and a final guard drops any line that still looks like an email, a token or a Bearer header.
import { createHmac } from 'node:crypto';

export const ALLOWED_KEYS = new Set([
  'ts', 'level', 'event', 'method', 'route', 'status', 'ms', 'bytes', 'reason', 'code',
  'accountRef', 'pharmacyRef', 'ipRef', 'rev', 'baseRev', 'replayed', 'topicId', 'region', 'port',
]);
const REDACT = /@|ml_|pl_sess_|Bearer /i;

export interface Logger {
  info(event: string, f?: Record<string, unknown>): void;
  warn(event: string, f?: Record<string, unknown>): void;
  error(event: string, f?: Record<string, unknown>): void;
  ref(kind: 'acct' | 'ph' | 'ip', value: string): string;
}

export function createLogger(opts: { hmacKey: string; write?: (line: string) => void; now?: () => number }): Logger {
  const write = opts.write || ((l: string) => process.stdout.write(l + '\n'));
  const now = opts.now || Date.now;
  const ref = (kind: string, value: string) => createHmac('sha256', opts.hmacKey).update(kind + ':' + value).digest('base64url').slice(0, 16);
  const emit = (level: string, event: string, f: Record<string, unknown> = {}) => {
    const rec: Record<string, unknown> = { ts: new Date(now()).toISOString(), level, event };
    for (const [k, v] of Object.entries(f)) {
      if (!ALLOWED_KEYS.has(k) || k === 'ts' || k === 'level' || k === 'event') continue;
      if (v === undefined) continue;
      if (v !== null && typeof v === 'object') continue; // flat values only
      rec[k] = typeof v === 'string' ? v.slice(0, 120) : v;
    }
    let line = JSON.stringify(rec);
    if (REDACT.test(line)) line = JSON.stringify({ ts: rec.ts, level: 'warn', event: 'log_redacted', reason: 'guard' });
    write(line);
  };
  return {
    info: (e, f) => emit('info', e, f),
    warn: (e, f) => emit('warn', e, f),
    error: (e, f) => emit('error', e, f),
    ref: (kind, value) => ref(kind, value),
  };
}
