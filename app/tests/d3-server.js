// Batch D3-B: the Sydney sync back end (phase-d3/server). Boots createServerApp on an ephemeral 127.0.0.1 port with a
// temp SQLite file, a fixed clock, distinct HMAC keys and the in-memory mailer, then checks over real HTTP:
// 1. healthz; 2. strict CORS; 3. magic-link (202, body cap 413, prototype keys, content type); 4. rate limits (429);
// 5. verify (single use, parallel race [200, 401], expiry); 6. sync (401, idempotent retry, 409 conflict, ETag, deletedAt
// tombstone kept across a restart, accounts kept apart, 2 MiB cap); 7. all 10 topics (+ ETag 304, 404, grounding);
// 8. logout (204, then 401); 9. the SES SigV4 helper; 10. a raw byte scan of the SQLite file + WAL and of every stdout
// log line for emails, IPs and tokens; 11. bundle and container files. Prints ALL PASS or the failure count.
const esbuild = require('esbuild'); const path = require('path'); const fs = require('fs'); const os = require('os');
const http = require('http'); const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const SERVER = path.join(ROOT, 'phase-d3/server');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'd3-server-'));
const DB = path.join(TMP, 'pharmledger.db');
let fails = 0, passes = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else fails++; };
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

const GH = 'https://mohaco1.github.io';
const TEST_ORIGIN = 'http://127.0.0.1:5173';
const EMAIL_KEY = 'email-index-key-' + crypto.randomBytes(24).toString('hex');
const LOG_KEY = 'log-hmac-key-' + crypto.randomBytes(24).toString('hex');
let now = Date.parse('2026-11-27T09:00:00.000Z');
const clock = () => now;

// Plain node:http client so Origin and every other header are sent exactly as given.
let PORT = 0;
const req = (method, p, { body, headers = {}, raw } = {}) => new Promise((resolve, reject) => {
  const data = raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined;
  const h = { ...headers };
  if (data !== undefined) { h['Content-Length'] = Buffer.byteLength(data); if (!Object.keys(h).some(k => k.toLowerCase() === 'content-type')) h['Content-Type'] = 'application/json'; }
  const r = http.request({ host: '127.0.0.1', port: PORT, method, path: p, headers: h }, res => {
    const chunks = []; res.on('data', c => chunks.push(c));
    res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8'); let json; try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; } resolve({ status: res.statusCode, headers: res.headers, text, json }); });
  });
  r.on('error', e => (e.code === 'EPIPE' || e.code === 'ECONNRESET') ? resolve({ status: 'reset', headers: {}, text: '' }) : reject(e));
  if (data !== undefined) r.write(data); r.end();
});
const auth = t => ({ Authorization: 'Bearer ' + t });
const ip = n => ({ 'Fly-Client-IP': '203.0.113.' + n });
const acHeaders = h => Object.keys(h).filter(k => k.startsWith('access-control-'));

(async () => {
  // Bundle the TypeScript sources exactly as production would (esbuild), then load the app module.
  const appOut = path.join(TMP, 'app.mjs');
  await esbuild.build({ entryPoints: [path.join(SERVER, 'src/app.ts')], bundle: true, platform: 'node', target: 'node22', format: 'esm', outfile: appOut, logLevel: 'silent' });
  const idx = await esbuild.build({ entryPoints: [path.join(SERVER, 'src/index.ts')], bundle: true, platform: 'node', target: 'node22', format: 'esm', write: false, logLevel: 'silent', metafile: true });
  const inputs = Object.keys(idx.metafile.inputs);
  ok(idx.errors.length === 0 && idx.outputFiles[0].text.length > 1000, '0. esbuild bundles src/index.ts (' + Math.round(idx.outputFiles[0].text.length / 1024) + ' kB)');
  ok(inputs.every(f => f.includes('phase-d3/server/src/')), '0. the bundle has zero npm runtime dependencies (only server sources)');
  const pkg = JSON.parse(fs.readFileSync(path.join(SERVER, 'package.json'), 'utf8'));
  ok(Object.keys(pkg.dependencies || {}).length === 0, '0. package.json has no runtime dependencies');

  const A = await import('file://' + appOut);
  const logs = [];
  const mailer = A.memoryMailer();
  const boot = async () => {
    const app = A.createServerApp({ dbPath: DB, emailIndexKey: EMAIL_KEY, logHmacKey: LOG_KEY, extraOrigins: [TEST_ORIGIN], clock, mailer, logWrite: l => logs.push(l), trustProxy: true, appUrl: 'https://mohaco1.github.io/PropApp/' });
    const a = await app.listen(0, '127.0.0.1'); PORT = a.port; return app;
  };
  let threw = false; try { A.createServerApp({ dbPath: path.join(TMP, 'x.db'), emailIndexKey: EMAIL_KEY, logHmacKey: EMAIL_KEY }); } catch { threw = true; }
  ok(threw, '0. refuses to start when the email index key and the log key are the same');
  let app = await boot();
  ok(PORT > 0, '0. listening on an ephemeral 127.0.0.1 port');

  // ── 1. healthz
  let r = await req('GET', '/v1/healthz');
  ok(r.status === 200 && r.json.ok === true && r.json.region === 'ap-southeast-2' && r.json.sqlite === 'ok' && r.json.ts === new Date(now).toISOString(), '1. GET /v1/healthz → 200 { ok, region ap-southeast-2, sqlite ok, ts from the clock }');
  const mode = app.store.db.prepare('PRAGMA journal_mode').get(); const fk = app.store.db.prepare('PRAGMA foreign_keys').get(); const bt = app.store.db.prepare('PRAGMA busy_timeout').get();
  ok(Object.values(mode)[0] === 'wal' && Object.values(fk)[0] === 1 && Object.values(bt)[0] === 5000, '1. SQLite runs WAL, foreign_keys ON, busy_timeout 5000');
  const ddl = app.store.db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table'").all();
  ok(['accounts', 'magic_codes', 'sessions', 'vaults', 'sync_revs'].every(n => ddl.some(t => t.name === n && /\)\s*STRICT\s*$/.test(t.sql))), '1. the 5 tables are STRICT');

  // ── 2. CORS
  r = await req('GET', '/v1/healthz', { headers: { Origin: GH } });
  ok(r.status === 200 && r.headers['access-control-allow-origin'] === GH && /Origin/.test(r.headers.vary || ''), '2. GitHub Pages origin allowed with Vary: Origin');
  ok(r.headers['access-control-allow-credentials'] === undefined, '2. no Access-Control-Allow-Credentials (Bearer only)');
  ok(/ETag/.test(r.headers['access-control-expose-headers'] || '') && /Retry-After/.test(r.headers['access-control-expose-headers'] || ''), '2. exposes ETag and Retry-After');
  ok(r.headers['x-content-type-options'] === 'nosniff' && r.headers['referrer-policy'] === 'no-referrer' && r.headers['cache-control'] === 'no-store', '2. nosniff, no-referrer, no-store');
  r = await req('OPTIONS', '/v1/sync/ph-1', { headers: { Origin: GH, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization, content-type, idempotency-key' } });
  const allowH = (r.headers['access-control-allow-headers'] || '').toLowerCase();
  ok(r.status === 204 && r.text === '' && ['authorization', 'content-type', 'if-none-match', 'idempotency-key'].every(h => allowH.includes(h)) && r.headers['access-control-allow-origin'] === GH, '2. OPTIONS preflight → 204 allowing Authorization, Content-Type, If-None-Match, Idempotency-Key');
  for (const evil of ['https://evil.example', 'https://mohaco1.github.io.evil.example', 'http://mohaco1.github.io', 'null']) {
    r = await req('GET', '/v1/healthz', { headers: { Origin: evil } });
    ok(r.status === 403 && acHeaders(r.headers).length === 0, '2. Origin ' + evil + ' → 403 with no Access-Control-Allow-* headers');
  }
  r = await req('OPTIONS', '/v1/auth/magic-link', { headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
  ok(r.status === 403 && acHeaders(r.headers).length === 0, '2. preflight from an evil origin → 403, no CORS headers');
  r = await req('GET', '/v1/healthz', { headers: { Origin: TEST_ORIGIN } });
  ok(r.status === 200 && r.headers['access-control-allow-origin'] === TEST_ORIGIN, '2. the test origin passed in config is allowed');

  // ── 3. magic-link
  const EMAIL1 = 'Owner.Test@Example.com';
  r = await req('POST', '/v1/auth/magic-link', { body: { email: EMAIL1 }, headers: { ...ip(1), Origin: GH } });
  ok(r.status === 202 && r.json.accepted === true && r.json.expiresInSec === 900, '3. POST /v1/auth/magic-link → 202 { accepted: true, expiresInSec: 900 }');
  let mail = mailer.outbox[mailer.outbox.length - 1];
  const linkTok = m => (/#magic=(ml_[A-Za-z0-9_-]+)/.exec(m.text) || [])[1];
  ok(mail && mail.to === EMAIL1.toLowerCase() && /https:\/\/mohaco1\.github\.io\/PropApp\/#magic=ml_[A-Za-z0-9_-]{43}/.test(mail.text), '3. the email carries a #magic=<token> fragment link to the app');
  const tok1 = linkTok(mail);
  r = await req('POST', '/v1/auth/magic-link', { body: { email: 'not-an-email' }, headers: ip(2) });
  ok(r.status === 400, '3. an invalid email → 400');
  r = await req('POST', '/v1/auth/magic-link', { raw: JSON.stringify({ email: 'big@example.com', pad: 'x'.repeat(4096) }), headers: ip(2) });
  ok(r.status === 413 || r.status === 'reset', '3. an auth body over 4096 B → 413 (got ' + r.status + ')');
  r = await req('POST', '/v1/auth/magic-link', { raw: '{"email":"proto@example.com","__proto__":{"admin":true}}', headers: ip(2) });
  ok(r.status === 400 && r.json.error === 'forbidden_key' && ({}).admin === undefined, '3. a __proto__ key → 400 and nothing polluted');
  r = await req('POST', '/v1/auth/magic-link', { raw: '{"email":"c@example.com","a":{"constructor":{"prototype":{"x":1}}}}', headers: ip(2) });
  ok(r.status === 400 && r.json.error === 'forbidden_key', '3. nested constructor/prototype keys → 400');
  r = await req('POST', '/v1/auth/magic-link', { raw: 'email=x@example.com', headers: { ...ip(2), 'Content-Type': 'application/x-www-form-urlencoded' } });
  ok(r.status === 415, '3. a non-JSON body → 415');

  // ── 4. rate limits
  const EMAIL_RL = 'limit.test@example.com'; const st = [];
  for (let i = 0; i < 4; i++) st.push((await req('POST', '/v1/auth/magic-link', { body: { email: EMAIL_RL }, headers: ip(10 + i) })));
  ok(st.slice(0, 3).every(x => x.status === 202) && st[3].status === 429, '4. 3 links per email per 900 s, the 4th → 429');
  ok(Number(st[3].headers['retry-after']) > 0 && Number(st[3].headers['retry-after']) <= 900, '4. 429 carries Retry-After (' + st[3].headers['retry-after'] + ' s)');
  const ipSt = [];
  for (let i = 0; i < 11; i++) ipSt.push((await req('POST', '/v1/auth/magic-link', { body: { email: `ip${i}.test@example.com` }, headers: ip(50) })).status);
  ok(ipSt.slice(0, 10).every(s => s === 202) && ipSt[10] === 429, '4. 10 links per IP per 900 s, the 11th → 429');
  r = await req('POST', '/v1/auth/magic-link', { body: { email: 'ip99.test@example.com' }, headers: { ...ip(50), Origin: GH } });
  ok(r.status === 429 && r.headers['access-control-allow-origin'] === GH, '4. a 429 still carries CORS so the app can read Retry-After');

  // ── 5. verify
  r = await req('POST', '/v1/auth/verify', { body: { token: tok1 }, headers: ip(1) });
  ok(r.status === 200 && /^pl_sess_[A-Za-z0-9_-]{43}$/.test(r.json.sessionToken) && typeof r.json.accountId === 'string' && r.json.expiresAt === new Date(now + 30 * 86400000).toISOString(), '5. POST /v1/auth/verify → 200 { sessionToken, accountId, expiresAt }');
  const S1 = r.json.sessionToken, ACC1 = r.json.accountId;
  r = await req('POST', '/v1/auth/verify', { body: { token: tok1 }, headers: ip(1) });
  ok(r.status === 401, '5. a used link replayed → 401');
  r = await req('POST', '/v1/auth/verify', { body: { token: 'ml_' + 'A'.repeat(43) }, headers: ip(1) });
  ok(r.status === 401, '5. an unknown token → 401');
  r = await req('POST', '/v1/auth/verify', { body: { token: 'garbage' }, headers: ip(1) });
  ok(r.status === 401, '5. a malformed token → 401');
  await req('POST', '/v1/auth/magic-link', { body: { email: EMAIL1 }, headers: ip(3) });
  const tokRace = linkTok(mailer.outbox[mailer.outbox.length - 1]);
  const race = await Promise.all([req('POST', '/v1/auth/verify', { body: { token: tokRace }, headers: ip(3) }), req('POST', '/v1/auth/verify', { body: { token: tokRace }, headers: ip(4) })]);
  ok(J(race.map(x => x.status).sort()) === '[200,401]', '5. two parallel verifies of one link → [200, 401]');
  ok(race.find(x => x.status === 200).json.accountId === ACC1, '5. the same email signs in to the same account');
  await req('POST', '/v1/auth/magic-link', { body: { email: EMAIL1 }, headers: ip(5) });
  const tokExp = linkTok(mailer.outbox[mailer.outbox.length - 1]);
  now += 901 * 1000;
  r = await req('POST', '/v1/auth/verify', { body: { token: tokExp }, headers: ip(5) });
  ok(r.status === 401, '5. a link older than 900 s → 401');
  const EMAIL2 = 'second.owner@example.org';
  await req('POST', '/v1/auth/magic-link', { body: { email: EMAIL2 }, headers: ip(6) });
  const tok2 = linkTok(mailer.outbox[mailer.outbox.length - 1]);
  r = await req('POST', '/v1/auth/verify', { body: { token: tok2 }, headers: ip(6) });
  const S2 = r.json.sessionToken, ACC2 = r.json.accountId;
  ok(r.status === 200 && ACC2 !== ACC1, '5. a second email gets its own account');

  // ── 6. sync
  const PH = { id: 'ph-1', schema: 2, name: 'Banksia Test Pharmacy (fictional)', proprietors: [{ id: 'o1', name: 'Alex Test' }], services: { daa: { active: true } }, updatedAt: '2026-11-27T09:00:00.000Z' };
  r = await req('GET', '/v1/sync/ph-1');
  ok(r.status === 401, '6. GET /v1/sync without a bearer token → 401');
  r = await req('GET', '/v1/sync/ph-1', { headers: { Authorization: 'Basic abc' } });
  ok(r.status === 401, '6. a non-Bearer Authorization → 401');
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 0 && r.json.pharmacy === null && r.json.deletedAt === null && r.json.pharmacyId === 'ph-1', '6. GET an empty vault → 200 rev 0');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: PH, deletedAt: null }, headers: { ...auth(S1), 'Idempotency-Key': 'idem-key-0001' } });
  ok(r.status === 200 && r.json.rev === 1 && r.json.replayed === false && r.json.updatedAt === new Date(now).toISOString(), '6. POST baseRev 0 → 200 rev 1');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: PH, deletedAt: null }, headers: { ...auth(S1), 'Idempotency-Key': 'idem-key-0001' } });
  ok(r.status === 200 && r.json.rev === 1 && r.json.replayed === true, '6. retry with the same Idempotency-Key → 200 rev 1 (replayed)');
  const reordered = Object.fromEntries(Object.entries(PH).reverse());
  r = await req('POST', '/v1/sync/ph-1', { body: { deletedAt: null, pharmacy: reordered, baseRev: 0 }, headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 1 && r.json.replayed === true, '6. retry without a key, same payload (keys in another order) → 200 rev 1 (payload_sha256)');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: { ...PH, name: 'Other (fictional)' }, deletedAt: null }, headers: { ...auth(S1), 'Idempotency-Key': 'idem-key-0001' } });
  ok(r.status === 422, '6. the same Idempotency-Key with a different payload → 422');
  const PHB = { ...PH, services: { daa: { active: true }, otp: { active: true } } };
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: PHB, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 409 && r.json.error === 'conflict' && r.json.rev === 1 && r.json.currentRev === 1 && r.json.pharmacyId === 'ph-1' && J(r.json.pharmacy) === J(PH) && 'updatedAt' in r.json && r.json.deletedAt === null, '6. a stale baseRev → 409 with the server head');
  now += 60000;
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 1, pharmacy: PHB, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 2 && r.headers.etag === '"rev-2"', '6. POST on the current head → rev 2 with ETag');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: PH, deletedAt: null }, headers: { ...auth(S1), 'Idempotency-Key': 'idem-key-0001' } });
  ok(r.status === 409 && r.json.rev === 2 && J(r.json.pharmacy) === J(PHB), '6. D3-D a late retry of the rev 1 write (same key) after rev 2 landed → 409 with the head, not 200 with rev 2');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 1, pharmacy: PH, deletedAt: null }, headers: { ...auth(S1), 'Idempotency-Key': 'idem-key-0001' } });
  ok(r.status === 422, '6. D3-D the same key and payload on a different baseRev → 422');
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 2 && J(r.json.pharmacy) === J(PHB) && r.headers.etag === '"rev-2"', '6. GET → 200 { pharmacyId, rev 2, updatedAt, deletedAt, pharmacy }');
  r = await req('GET', '/v1/sync/ph-1', { headers: { ...auth(S1), 'If-None-Match': '"rev-2"' } });
  ok(r.status === 304 && r.text === '', '6. GET with If-None-Match on the head → 304');
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S2) });
  ok(r.status === 200 && r.json.rev === 0 && r.json.pharmacy === null, '6. another account cannot see this pharmacy');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 0, pharmacy: { ...PH, name: 'Other owner (fictional)' }, deletedAt: null }, headers: auth(S2) });
  ok(r.status === 200 && r.json.rev === 1, '6. the same pharmacy id under another account is a separate vault');
  const DEL = '2026-11-27T10:00:00.000Z';
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 2, pharmacy: null, deletedAt: DEL }, headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 3 && r.json.deletedAt === DEL, '6. a deletedAt tombstone → 200 rev 3');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 2, pharmacy: PHB, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 409 && r.json.deletedAt === DEL && r.json.pharmacy === null, '6. a stale edit after the delete → 409 showing the tombstone');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 3, pharmacy: { ...PH, id: 'ph-2' }, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 400, '6. a pharmacy whose id differs from the path → 400');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: -1, pharmacy: PH, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 400, '6. a negative baseRev → 400');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 3, pharmacy: null, deletedAt: 'yesterday' }, headers: auth(S1) });
  ok(r.status === 400, '6. a deletedAt that is not an ISO date → 400');
  r = await req('GET', '/v1/sync/__proto__', { headers: auth(S1) });
  ok(r.status === 400, '6. pharmacy id __proto__ → 400');
  r = await req('POST', '/v1/sync/ph-1', { raw: '{"baseRev":3,"deletedAt":null,"pharmacy":{"id":"ph-1","x":{"__proto__":{"a":1}}}}', headers: auth(S1) });
  ok(r.status === 400 && r.json.error === 'forbidden_key', '6. a __proto__ key inside the pharmacy → 400');
  const bigPh = { ...PH, pad: 'x'.repeat(2 * 1024 * 1024) };
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 3, pharmacy: bigPh, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 413 || r.status === 'reset', '6. a sync body over 2 MiB → 413 (got ' + r.status + ')');
  const nearPh = { ...PH, pad: 'x'.repeat(1024 * 1024) };
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 3, pharmacy: nearPh, deletedAt: null }, headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 4, '6. a 1 MiB pharmacy is accepted (rev 4)');
  r = await req('POST', '/v1/sync/ph-1', { body: { baseRev: 4, pharmacy: null, deletedAt: DEL }, headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 5, '6. deleted again → rev 5');
  // Restart on the same file: the tombstone is on disk.
  await app.close(); app = await boot();
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S1) });
  ok(r.status === 200 && r.json.rev === 5 && r.json.deletedAt === DEL && r.json.pharmacy === null, '6. after a restart the tombstone persists (rev 5, deletedAt kept)');
  ok(r.status === 200, '6. the session survives a restart (it lives in SQLite)');
  // D3-D: the account-scoped vault list
  r = await req('GET', '/v1/vault');
  ok(r.status === 401, '6. D3-D GET /v1/vault without a bearer token → 401');
  r = await req('GET', '/v1/vault', { headers: { ...auth(S1), Origin: GH } });
  ok(r.status === 200 && r.headers['access-control-allow-origin'] === GH && r.json.vaults.length === 1 && r.json.vaults[0].pharmacyId === 'ph-1' && r.json.vaults[0].rev === 5 && r.json.vaults[0].deletedAt === DEL && !('pharmacy' in r.json.vaults[0]) && r.json.maxVaults === A.DEFAULT_STORE_LIMITS.maxVaults, '6. D3-D GET /v1/vault lists this account’s vaults (id, rev, deletedAt; no payload)');
  r = await req('GET', '/v1/vault', { headers: auth(S2) });
  ok(r.status === 200 && r.json.vaults.length === 1 && r.json.vaults[0].rev === 1 && r.json.vaults[0].deletedAt === null, '6. D3-D another account sees only its own vault');
  // D3-D: bounded retention (a separate instance with small limits)
  {
    const lapp = A.createServerApp({ dbPath: path.join(TMP, 'limits.db'), emailIndexKey: EMAIL_KEY, logHmacKey: LOG_KEY, clock, mailer: A.memoryMailer(), logWrite: () => {}, limits: { maxVaults: 2, maxRevsPerVault: 3 } });
    const st = lapp.store, code = st.createMagicCode('f'.repeat(64), 900, now), { accountId: LA } = st.consumeMagicCode(code, 3600, now);
    const put = (id, base, n) => st.putVault(LA, id, base, { id, n }, null, null, now);
    const a1 = put('v-1', 0, 1), a2 = put('v-2', 0, 1), a3 = put('v-3', 0, 1);
    ok(a1.kind === 'ok' && a2.kind === 'ok' && a3.kind === 'vault_limit' && a3.limit === 2, '6. D3-D a third vault past maxVaults 2 is refused (vault_limit)');
    for (let i = 1; i < 8; i++) put('v-1', i, i + 1);
    const revs = st.db.prepare('SELECT rev FROM sync_revs WHERE account_id = ? AND pharmacy_id = ? ORDER BY rev').all(LA, 'v-1').map(x => x.rev);
    ok(st.getVault(LA, 'v-1').rev === 8 && J(revs) === J([6, 7, 8]), '6. D3-D only the newest maxRevsPerVault (3) revision rows are kept (' + revs.join(',') + ')');
    const lp = await lapp.listen(0, '127.0.0.1'), keep = PORT; PORT = lp.port;
    const ls = st.consumeMagicCode(st.createMagicCode('f'.repeat(64), 900, now), 3600, now).sessionToken;
    r = await req('POST', '/v1/sync/v-9', { body: { baseRev: 0, pharmacy: { id: 'v-9' }, deletedAt: null }, headers: auth(ls) });
    ok(r.status === 403 && r.json.error === 'vault_limit' && r.json.maxVaults === 2, '6. D3-D over HTTP a new vault past the limit → 403 vault_limit');
    PORT = keep; await lapp.close();
  }

  // ── 7. topics
  const IDS = ['s8-storage-register', 'otp-standards-2026', 'vaccination-standards-2026', 'pharmacist-prescribing-2026', 'daa-supply-qspp', 'vaping-therapeutic-goods', 'medicinal-cannabis-scheduling', 'aged-care-enrmc', 'pba-safe-services-governance', 'mhr-privacy-breach-2026'];
  ok(A.TOPICS.length === 10 && J(A.TOPICS.map(t => t.id)) === J(IDS), '7. TOPICS holds exactly the 10 Nov 2026 NSW topics');
  const appContent = ['content/law.json', 'content/sources.js', 'content/updates.js', 'content/onboard.js'].map(f => fs.readFileSync(path.join(ROOT, 'app/src', f), 'utf8')).join('\n').replace(/NSWH \+ '/g, "'https://www.health.nsw.gov.au");
  let all = '';
  for (const id of IDS) {
    r = await req('GET', '/v1/topics/' + id, { headers: { Origin: GH } });
    const good = r.status === 200 && r.json.id === id && r.json.points.length >= 3 && r.json.sources.length >= 1 && r.headers.etag === '"' + sha256(r.text) + '"' && r.headers.etag === A.getTopic(id).etag;
    ok(good, '7. GET /v1/topics/' + id + ' → 200 with a SHA-256 ETag of its body');
    const r304 = await req('GET', '/v1/topics/' + id, { headers: { 'If-None-Match': r.headers.etag } });
    ok(r304.status === 304 && r304.text === '' && r304.headers.etag === r.headers.etag, '7. ' + id + ' If-None-Match → 304');
    const unlisted = r.json.sources.map(s => s.url).filter(u => !appContent.includes(u) && !u.includes('sl-2025-0430') && !u.endsWith('/oral-contraceptive-pill-initiation.aspx')); // D3-D: the OCP page is a topic source only (owner's brief); the app itself links the protocol PDF (stage3f)
    ok(unlisted.length === 0, '7. ' + id + ': every source link is one the app already cites' + (unlisted.length ? ' (not: ' + unlisted.join(', ') + ')' : ''));
    all += r.text + '\n';
  }
  ok(!/\bPIC\b/.test(all) && !/pharmacist in charge/i.test(all) && !/responsible person/i.test(all), '7. no "PIC", "pharmacist in charge" or "responsible person" in any topic');
  ok(!/\b2008\b/.test(all) && !/\b2016\b/.test(all.replace(/replaced the My Health Records Rule 2016 on 1 April 2026/g, '')), '7. no repealed 2008 or 2016 instruments in any topic (2016 only as the Rule that was replaced)');
  const T = id => JSON.stringify(A.getTopic(id).topic);
  ok(!all.includes('otp-standards.aspx') && T('otp-standards-2026').includes('opioid-treatment-pharmacist-info.aspx') && T('otp-standards-2026').includes(' s 81') && !T('otp-standards-2026').includes('every pharmacist has read the OTP Standards'), '7. D3-D OTP: the registration page link, s 81, no repeated reading clause');
  ok(T('pharmacist-prescribing-2026').includes('oral-contraceptive-pill-initiation.aspx') && T('pharmacist-prescribing-2026').includes('MPTG Reg 2026 s 37A and NSW OCP Protocol'), '7. D3-D prescribing: OCP information page and s 37A in the law line');
  ok(/s 194/.test(A.getTopic('s8-storage-register').topic.lawLine) && T('s8-storage-register').includes('written notice of receipt (electronic or paper) within 24 hours'), '7. D3-D S8: s 194 in the law line; written notice of receipt within 24 hours');
  ok(T('vaccination-standards-2026').includes('(mpox: unless the patient opts out)') && A.getTopic('daa-supply-qspp').topic.lawLine.includes('s 136–137'), '7. D3-D vaccination mpox AIR rule; DAA s 136–137');
  ok(T('vaping-therapeutic-goods').includes('over 20 mg/mL, or for patients under 18') && T('vaping-therapeutic-goods').includes('not to vaping devices on their own'), '7. D3-D vaping: prescription over 20 mg/mL or under 18; AP/SAS applies to vaping substances');
  ok(A.getTopic('pba-safe-services-governance').topic.lawLine.includes('Health Practitioner Regulation (New South Wales) Regulation 2025 s 11(1)(e)') && T('pba-safe-services-governance').includes('(Pharmacy Board compounding guidelines)') && T('pba-safe-services-governance').includes('(Council Guide; Ten tips for quality compounding)'), '7. D3-D premises: s 11(1)(e), full title, compounding attributions');
  ok(T('mhr-privacy-breach-2026').includes('on 1 April 2026') && T('mhr-privacy-breach-2026').includes('from 1 October 2026 (r 72(3))'), '7. D3-D My Health Record: replaced on 1 April 2026; r 21 from 1 October 2026 (r 72(3))');
  ok(['sl-2025-0430', 'Sch 4 s 1', 's 11(2)', 'ten-tips-quality-compounding', 'protocol-initiation-oral-contraceptive-pill.pdf', 'sl-2026-0330'].every(s => all.includes(s)), '7. topics cite sl-2025-0430 Sch 4 s 1 / s 11(2), ten-tips-quality-compounding and the OCP protocol PDF');
  r = await req('GET', '/v1/topics/not-a-topic');
  ok(r.status === 404, '7. an unknown topic → 404');
  r = await req('GET', '/v1/topics');
  ok(r.status === 200 && r.json.topics.length === 10, '7. GET /v1/topics lists the 10 ids with their ETags');
  r = await req('POST', '/v1/topics/otp-standards-2026', { body: {} });
  ok(r.status === 405, '7. POST on a topic → 405');

  // ── 8. logout
  r = await req('POST', '/v1/auth/logout');
  ok(r.status === 401, '8. logout without a token → 401');
  r = await req('POST', '/v1/auth/logout', { headers: auth(S1) });
  ok(r.status === 204 && r.text === '', '8. POST /v1/auth/logout → 204 with an empty body');
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S1) });
  ok(r.status === 401, '8. the revoked token can no longer sync → 401');
  r = await req('POST', '/v1/auth/logout', { headers: auth(S1) });
  ok(r.status === 401, '8. logging out twice → 401');
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S2) });
  ok(r.status === 200, '8. the other account’s session still works');
  now += 31 * 86400000;
  r = await req('GET', '/v1/sync/ph-1', { headers: auth(S2) });
  ok(r.status === 401, '8. a session past its 30-day expiry → 401');

  // ── 9. SES SigV4 helper (fake fetch; nothing leaves the machine)
  let sent;
  const ses = A.sesMailer({ from: 'noreply@pharmledger.test', accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', clock, fetch: async (url, init) => { sent = { url, init }; return { ok: true, status: 200 }; } });
  await ses.send({ to: 'x@example.com', subject: 's', text: 't' });
  const authz = sent && sent.init.headers.authorization;
  ok(sent && sent.url === 'https://email.ap-southeast-2.amazonaws.com/v2/email/outbound-emails', '9. SES mailer posts to SES v2 in ap-southeast-2');
  ok(/^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/\d{8}\/ap-southeast-2\/ses\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/.test(authz || ''), '9. the request is SigV4-signed for ses/ap-southeast-2');
  const again = A.signV4({ method: 'POST', host: 'email.ap-southeast-2.amazonaws.com', path: '/v2/email/outbound-emails', region: 'ap-southeast-2', service: 'ses', body: sent.init.body, accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', now: new Date(now) });
  ok(again.authorization === authz, '9. signing is deterministic for a fixed clock');

  // ── 10. zero-PII audit: raw SQLite + WAL bytes, and every stdout line
  app.log.info('guard_probe', { reason: 'someone@example.com' });
  app.log.info('guard_probe', { reason: 'Bearer pl_sess_abc' });
  app.log.info('guard_probe', { email: EMAIL1, ip: '203.0.113.1', name: 'Banksia Test Pharmacy (fictional)' });
  const files = ['', '-wal', '-shm'].map(s => DB + s).filter(f => fs.existsSync(f));
  ok(files.some(f => f.endsWith('-wal')), '10. the WAL file exists and is scanned (' + files.map(f => path.basename(f)).join(', ') + ')');
  const disk = Buffer.concat(files.map(f => fs.readFileSync(f)));
  const tokens = mailer.outbox.map(linkTok).filter(Boolean);
  const secrets = [EMAIL1, EMAIL1.toLowerCase(), EMAIL2, EMAIL_RL, 'ip3.test@example.com', ...tokens, S1, S2, '203.0.113.', '127.0.0.1', 'idem-key-0001', EMAIL_KEY, LOG_KEY];
  const onDisk = secrets.filter(s => disk.includes(Buffer.from(s)) || disk.includes(Buffer.from(s, 'utf16le')));
  ok(onDisk.length === 0, '10. SQLite + WAL hold no email, IP, magic token, session token or key (' + secrets.length + ' values scanned)' + (onDisk.length ? ': found ' + onDisk.length : ''));
  ok(!disk.includes(Buffer.from('@example.')), '10. no "@example." anywhere on disk');
  const codeRows = app.store.db.prepare('SELECT code_hash FROM magic_codes').all();
  ok(codeRows.length > 0 && codeRows.every(x => /^[0-9a-f]{64}$/.test(x.code_hash)), '10. magic codes are stored only as SHA-256 hashes');
  const sessRows = app.store.db.prepare('SELECT token_hash FROM sessions').all();
  ok(sessRows.length >= 2 && sessRows.every(x => /^[0-9a-f]{64}$/.test(x.token_hash)) && sessRows.some(x => x.token_hash === sha256(S1)), '10. sessions are stored only as SHA-256 hashes');
  const acctRows = app.store.db.prepare('SELECT email_index FROM accounts').all();
  ok(acctRows.length === 2 && acctRows.every(x => /^[0-9a-f]{64}$/.test(x.email_index)) && acctRows.some(x => x.email_index === crypto.createHmac('sha256', EMAIL_KEY).update('email:' + EMAIL1.toLowerCase()).digest('hex')), '10. emails are kept only as an HMAC blind index');
  const LOG_KEYS = new Set(['ts', 'level', 'event', 'method', 'route', 'status', 'ms', 'bytes', 'reason', 'code', 'accountRef', 'pharmacyRef', 'ipRef', 'rev', 'baseRev', 'replayed', 'topicId', 'region', 'port']);
  let parsed = 0, badKeys = 0;
  for (const l of logs) { try { const o = JSON.parse(l); parsed++; if (Object.keys(o).some(k => !LOG_KEYS.has(k))) badKeys++; } catch { /* counted below */ } }
  ok(logs.length > 50 && parsed === logs.length, '10. every stdout line is JSON (' + logs.length + ' lines)');
  ok(badKeys === 0, '10. every log line uses only allowlisted keys');
  const logText = logs.join('\n');
  const leaks = [...secrets, '@', 'ml_', 'pl_sess_', 'Bearer ', 'Banksia', 'Alex Test', ACC1, ACC2, 'ph-1'].filter(s => logText.includes(s));
  ok(leaks.length === 0, '10. logs hold no email, IP, token, account id, pharmacy id or name' + (leaks.length ? ': found ' + leaks.length : ''));
  ok(logs.filter(l => l.includes('"log_redacted"')).length === 2, '10. the redaction guard dropped the 2 lines that looked like an email or a Bearer token');
  ok(logs.some(l => /"accountRef":"[A-Za-z0-9_-]{16}"/.test(l)) && logs.some(l => /"pharmacyRef":"[A-Za-z0-9_-]{16}"/.test(l)) && logs.some(l => /"ipRef":"[A-Za-z0-9_-]{16}"/.test(l)), '10. logs carry HMAC accountRef, pharmacyRef and ipRef tags');
  ok(logs.some(l => /"route":"\/v1\/sync\/:pharmacyId"/.test(l)), '10. logs name the route pattern, not the raw path');

  // ── 11. container files
  const docker = fs.readFileSync(path.join(SERVER, 'Dockerfile'), 'utf8');
  ok(/FROM node:22-bookworm-slim/.test(docker) && /tini/.test(docker) && /litestream replicate[^\n]*-exec \\?"node \/app\/dist\/server\.mjs\\?"/.test(docker) && /\nUSER app\b/.test(docker) && /\/data/.test(docker), '11. Dockerfile: node:22-bookworm-slim, tini, litestream replicate -exec, non-root user, /data');
  const fly = fs.readFileSync(path.join(SERVER, 'fly.toml'), 'utf8');
  ok(['primary_region = "syd"', 'internal_port = 8080', 'force_https = true', 'auto_stop_machines = "suspend"', 'min_machines_running = 0', '[mounts]', 'destination = "/data"', 'path = "/v1/healthz"'].every(s => fly.includes(s)), '11. fly.toml: syd, port 8080, force_https, suspend, min 0, /data mount, healthz check');
  const ls = fs.readFileSync(path.join(SERVER, 'litestream.yml'), 'utf8');
  ok(/^dbs:\n  - path: \/data\/pharmledger\.db\n    replicas:\n      - type: s3\n        bucket: \$LITESTREAM_S3_BUCKET\n/m.test(ls) && /\n        region: ap-southeast-2\n/.test(ls) && /\n        sync-interval: 10s\n/.test(ls) && !/\t/.test(ls), '11. litestream.yml: valid indent, /data/pharmledger.db → S3 ap-southeast-2, $LITESTREAM_S3_BUCKET, sync-interval 10s');

  await app.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(passes + ' passed, ' + fails + ' failed');
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed: ' + e.message); process.exit(1); });
function J(x) { return JSON.stringify(x); }
