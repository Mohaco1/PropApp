// In-memory sliding-window rate limiter. Keys are HMAC refs (never a raw email or IP), so nothing identifying is
// held even in memory. One machine in Sydney (fly.toml) means one limiter; it resets on restart, which is acceptable
// for a sign-in throttle.
export interface Limiter { hit(key: string, limit: number, windowSec: number, now: number): { ok: boolean; retryAfter: number }; size(): number }

export function createLimiter(): Limiter {
  const hits = new Map<string, number[]>();
  let lastSweep = 0;
  return {
    hit(key, limit, windowSec, now) {
      const win = windowSec * 1000;
      if (now - lastSweep > 60_000) { // drop keys whose window has passed
        lastSweep = now;
        for (const [k, ts] of hits) if (!ts.length || ts[ts.length - 1] <= now - win) hits.delete(k);
      }
      const ts = (hits.get(key) || []).filter(t => t > now - win);
      if (ts.length >= limit) {
        hits.set(key, ts);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((ts[0] + win - now) / 1000)) };
      }
      ts.push(now); hits.set(key, ts);
      return { ok: true, retryAfter: 0 };
    },
    size: () => hits.size,
  };
}
