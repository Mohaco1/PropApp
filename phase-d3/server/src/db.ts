// SQLite store for the D3 sync back end (node:sqlite, Node 22). Nothing identifying is written to disk:
// emails are kept only as an HMAC blind index (EMAIL_INDEX_HMAC_KEY), and magic codes and session tokens only as
// SHA-256 hashes. IP addresses are never stored. Single-use codes and vault writes run inside BEGIN IMMEDIATE.
import { DatabaseSync } from 'node:sqlite';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

export const sha256 = (s: string | Buffer): string => createHash('sha256').update(s).digest('hex');
export const hmac = (key: string, s: string): string => createHmac('sha256', key).update(s).digest('hex');
export const randomToken = (prefix: string): string => prefix + randomBytes(32).toString('base64url');
export const normaliseEmail = (e: string): string => e.trim().toLowerCase();

// Stable JSON (sorted keys) so the same envelope always hashes the same, whatever order a phone sent its keys in.
export const canonical = (v: unknown): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).sort().filter(k => o[k] !== undefined).map(k => JSON.stringify(k) + ':' + canonical(o[k])).join(',') + '}';
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email_index TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS magic_codes (
  code_hash TEXT PRIMARY KEY,
  email_index TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
) STRICT;
CREATE INDEX IF NOT EXISTS magic_codes_expiry ON magic_codes(expires_at);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
) STRICT;
CREATE TABLE IF NOT EXISTS vaults (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL,
  rev INTEGER NOT NULL,
  payload TEXT,
  payload_sha256 TEXT NOT NULL,
  deleted_at TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, pharmacy_id)
) STRICT;
CREATE TABLE IF NOT EXISTS sync_revs (
  account_id TEXT NOT NULL,
  pharmacy_id TEXT NOT NULL,
  rev INTEGER NOT NULL,
  payload_sha256 TEXT NOT NULL,
  idempotency_key TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, pharmacy_id, rev),
  FOREIGN KEY (account_id, pharmacy_id) REFERENCES vaults(account_id, pharmacy_id) ON DELETE CASCADE
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS sync_revs_idem ON sync_revs(account_id, pharmacy_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
`;

export interface Head { pharmacyId: string; rev: number; updatedAt: string | null; deletedAt: string | null; pharmacy: unknown }
export interface VaultEntry { pharmacyId: string; rev: number; updatedAt: string | null; deletedAt: string | null }
export type PutResult =
  | { kind: 'ok'; head: Head; replayed: boolean }
  | { kind: 'conflict'; head: Head }
  | { kind: 'idem_mismatch' }
  | { kind: 'vault_limit'; limit: number };
// D3-D: bounded storage per account. A new vault past maxVaults is refused (tombstones count, so a deleted pharmacy
// can't be brought back by an old copy); each vault keeps only its newest maxRevsPerVault revision rows.
export interface StoreLimits { maxVaults: number; maxRevsPerVault: number }
export const DEFAULT_STORE_LIMITS: StoreLimits = Object.freeze({ maxVaults: 50, maxRevsPerVault: 200 });

export interface Store {
  db: DatabaseSync;
  createMagicCode(emailIndex: string, ttlSec: number, now: number): string;
  consumeMagicCode(token: string, sessionTtlSec: number, now: number): null | { sessionToken: string; accountId: string; expiresAt: number };
  sessionAccount(token: string, now: number): string | null;
  revokeSession(token: string, now: number): boolean;
  getVault(accountId: string, pharmacyId: string): Head;
  listVaults(accountId: string): VaultEntry[];
  limits: StoreLimits;
  putVault(accountId: string, pharmacyId: string, baseRev: number, pharmacy: unknown, deletedAt: string | null, idempotencyKey: string | null, now: number): PutResult;
  close(): void;
}

export function openStore(file: string, limitsIn: Partial<StoreLimits> = {}): Store {
  const limits: StoreLimits = { ...DEFAULT_STORE_LIMITS, ...limitsIn };
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;');
  db.exec(SCHEMA);

  const tx = <T>(fn: () => T): T => {
    db.exec('BEGIN IMMEDIATE');
    try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw e; }
  };
  const iso = (ms: number | null): string | null => (ms == null ? null : new Date(ms).toISOString());

  const q = {
    insCode: db.prepare('INSERT INTO magic_codes (code_hash, email_index, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    purgeCodes: db.prepare('DELETE FROM magic_codes WHERE expires_at < ?'),
    getCode: db.prepare('SELECT email_index, expires_at, used_at FROM magic_codes WHERE code_hash = ?'),
    useCode: db.prepare('UPDATE magic_codes SET used_at = ? WHERE code_hash = ? AND used_at IS NULL'),
    getAcct: db.prepare('SELECT id FROM accounts WHERE email_index = ?'),
    insAcct: db.prepare('INSERT INTO accounts (id, email_index, created_at) VALUES (?, ?, ?)'),
    insSess: db.prepare('INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    getSess: db.prepare('SELECT account_id, expires_at, revoked_at FROM sessions WHERE token_hash = ?'),
    revSess: db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL'),
    getVault: db.prepare('SELECT rev, payload, payload_sha256, deleted_at, updated_at FROM vaults WHERE account_id = ? AND pharmacy_id = ?'),
    insVault: db.prepare('INSERT INTO vaults (account_id, pharmacy_id, rev, payload, payload_sha256, deleted_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    updVault: db.prepare('UPDATE vaults SET rev = ?, payload = ?, payload_sha256 = ?, deleted_at = ?, updated_at = ? WHERE account_id = ? AND pharmacy_id = ? AND rev = ?'),
    insRev: db.prepare('INSERT INTO sync_revs (account_id, pharmacy_id, rev, payload_sha256, idempotency_key, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
    getIdem: db.prepare('SELECT rev, payload_sha256 FROM sync_revs WHERE account_id = ? AND pharmacy_id = ? AND idempotency_key = ?'),
    listVaults: db.prepare('SELECT pharmacy_id, rev, deleted_at, updated_at FROM vaults WHERE account_id = ? ORDER BY pharmacy_id LIMIT ?'),
    countVaults: db.prepare('SELECT COUNT(*) AS n FROM vaults WHERE account_id = ?'),
    pruneRevs: db.prepare('DELETE FROM sync_revs WHERE account_id = ? AND pharmacy_id = ? AND rev <= ?'),
  };

  const head = (accountId: string, pharmacyId: string): Head => {
    const r = q.getVault.get(accountId, pharmacyId) as any;
    if (!r) return { pharmacyId, rev: 0, updatedAt: null, deletedAt: null, pharmacy: null };
    return { pharmacyId, rev: Number(r.rev), updatedAt: iso(Number(r.updated_at)), deletedAt: r.deleted_at ?? null, pharmacy: r.payload == null ? null : JSON.parse(r.payload) };
  };

  return {
    db,
    createMagicCode(emailIndex, ttlSec, now) {
      const token = randomToken('ml_');
      tx(() => { q.purgeCodes.run(now - 86_400_000); q.insCode.run(sha256(token), emailIndex, now, now + ttlSec * 1000); });
      return token;
    },
    // Single use: the read, the used_at stamp and the session insert happen in one IMMEDIATE transaction, so two
    // phones racing the same link can't both get a session.
    consumeMagicCode(token, sessionTtlSec, now) {
      const h = sha256(token);
      return tx(() => {
        const c = q.getCode.get(h) as any;
        if (!c || c.used_at != null || Number(c.expires_at) <= now) return null;
        if (Number(q.useCode.run(now, h).changes) !== 1) return null;
        let acct = q.getAcct.get(c.email_index) as any;
        const accountId: string = acct ? acct.id : randomUUID();
        if (!acct) q.insAcct.run(accountId, c.email_index, now);
        const sessionToken = randomToken('pl_sess_');
        const expiresAt = now + sessionTtlSec * 1000;
        q.insSess.run(sha256(sessionToken), accountId, now, expiresAt);
        return { sessionToken, accountId, expiresAt };
      });
    },
    sessionAccount(token, now) {
      const s = q.getSess.get(sha256(token)) as any;
      if (!s || s.revoked_at != null || Number(s.expires_at) <= now) return null;
      return s.account_id;
    },
    revokeSession(token, now) { return Number(q.revSess.run(now, sha256(token)).changes) === 1; },
    getVault: head,
    limits,
    // D3-D: the account's vault ids (live and deleted, no payloads), so a fresh device finds every pharmacy.
    listVaults(accountId) {
      return (q.listVaults.all(accountId, limits.maxVaults) as any[]).map(r => ({ pharmacyId: String(r.pharmacy_id), rev: Number(r.rev), updatedAt: iso(Number(r.updated_at)), deletedAt: r.deleted_at ?? null }));
    },
    // Optimistic concurrency: baseRev must equal the stored rev, and the write becomes rev + 1. A retry of a write
    // that already landed (same Idempotency-Key, or the same payload on top of its own base) gets the head back
    // with 200, not a conflict. D3-D: only while that write is still the head; once a newer revision has landed on top
    // of it, the retry gets 409 with the head, never a 200 carrying a rev it didn't make.
    putVault(accountId, pharmacyId, baseRev, pharmacy, deletedAt, idempotencyKey, now) {
      const payload = pharmacy == null ? null : JSON.stringify(pharmacy);
      const digest = sha256(canonical({ pharmacy: pharmacy ?? null, deletedAt }));
      const idem = idempotencyKey ? sha256('idem:' + idempotencyKey) : null;
      return tx((): PutResult => {
        if (idem) {
          const prior = q.getIdem.get(accountId, pharmacyId, idem) as any;
          if (prior) {
            if (prior.payload_sha256 !== digest || baseRev !== Number(prior.rev) - 1) return { kind: 'idem_mismatch' };
            const h = head(accountId, pharmacyId);
            return h.rev === Number(prior.rev) ? { kind: 'ok', head: h, replayed: true } : { kind: 'conflict', head: h };
          }
        }
        const cur = q.getVault.get(accountId, pharmacyId) as any;
        const curRev = cur ? Number(cur.rev) : 0;
        if (!cur && Number((q.countVaults.get(accountId) as any).n) >= limits.maxVaults) return { kind: 'vault_limit', limit: limits.maxVaults };
        if (cur && baseRev === curRev - 1 && cur.payload_sha256 === digest) return { kind: 'ok', head: head(accountId, pharmacyId), replayed: true };
        if (baseRev !== curRev) return { kind: 'conflict', head: head(accountId, pharmacyId) };
        const rev = curRev + 1;
        if (cur) q.updVault.run(rev, payload, digest, deletedAt, now, accountId, pharmacyId, curRev);
        else q.insVault.run(accountId, pharmacyId, rev, payload, digest, deletedAt, now);
        q.insRev.run(accountId, pharmacyId, rev, digest, idem, now);
        if (rev > limits.maxRevsPerVault) q.pruneRevs.run(accountId, pharmacyId, rev - limits.maxRevsPerVault);
        return { kind: 'ok', head: head(accountId, pharmacyId), replayed: false };
      });
    },
    close() { db.close(); },
  };
}
