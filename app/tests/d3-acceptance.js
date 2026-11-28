// Batch D3-C acceptance: the installable app (built exactly as dist/pwa, with the API origin pointed at a local test
// server) against an ephemeral createServerApp (phase-d3/server), at 390×844, real taps. Fails on any console or CSP
// error. The only console lines allowed are Chrome's own "Failed to load resource" notes for the API's expected protocol
// answers (409 conflict, the forced 503), which Chrome prints for any non-2xx fetch; they are counted and shown.
// A. A #magic=<token> link opened offline is scrubbed from the address bar before startup awaits anything, kept, and
//    verified (POST /v1/auth/verify 200) automatically on reconnect, after a 503 retried with backoff.
// B. Two devices restore the same format 1 backup, edit offline, then sync: 409 merge against the sync base, identical
//    convergence, no duplicate history, action log or procedure version ids.
// C. A deletedAt tombstone wins over the other device's stale offline edit: propapp:ph:<id> removed, propapp:tomb:<id> kept.
// D. Held /v1/sync and /v1/topics requests abort cleanly on a pharmacy switch and on Disconnect; the single-file app has
//    connect-src 'none' and makes no network request at all.
// E. (D3-D) Signing in to a different account never uploads the earlier account's pharmacies or tombstones; the owner
//    attaches a live one with an explicit tap, and the tombstone never goes.
// F. (D3-D) A backup restored over a synced deletion (its updatedAt older than the deletion) is not deleted again by the
//    other device that holds the older tombstone; the restore carries restoredAt and restoredOver.
// G. (D3-D) An empty device signs in and finds the account's pharmacies (GET /v1/vault), and one created later elsewhere.
// D3-E: A also checks the 2 s retry backoff and that same-origin /api/* and /v1/* GETs and pages (online and offline)
//    always pass the offline worker; B adds distinct action-log lines and procedure versions on both devices and
//    checks their exact ids and contents; D delivers late successful answers after Disconnect and after an account
//    switch, runs the single-file checks on this run's own build and checks app/dist matches a fresh build.
// H. (D3-E) A refused pharmacy (413) doesn't stop the others (partial status); three 409s in a row stay "Not up to date
//    yet" until the server acks; a sign-in link is checked before the ordinary sync; Disconnect reaches other tabs; UAT
//    Reset test data clears the sign-in, the synced account and a pending link.
const esbuild = require('esbuild'); const path = require('path'); const fs = require('fs'); const os = require('os');
const http = require('http'); const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { saved } = require('./helpers.js');

const ROOT = path.resolve(__dirname, '../..'), APPDIR = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'd3-accept-'));
const SHOTS = path.join(APPDIR, 'handoff'); fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0, passes = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else fails++; };
const J = x => JSON.stringify(x);
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 10000, step = 50) => { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch {} await sleep(step); } return null; };
let noRev;
const listen = srv => new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv.address().port)));

(async () => {
  // ── servers: static app on one port, API on another (a different origin, as GitHub Pages and the API will be)
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  let PWA = '';
  // D3-E: same-origin /api/* and /v1/* on the app's own host (a controlled stand-in): /…/ping answers with a counter,
  // anything else there is a 404. The offline worker must pass every one of them straight through.
  const hits = { api: 0, v1: 0 };
  const stat = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html';
    const own = /^\/(api|v1)\//.exec(f); if (own) { if (f === '/' + own[1] + '/ping') { hits[own[1]]++; r.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); return r.end('pong-' + own[1] + '-' + hits[own[1]]); } r.writeHead(404, { 'content-type': 'text/plain' }); return r.end('no such ' + own[1] + ' path'); }
    const p = path.join(PWA, f); if (!PWA || !p.startsWith(PWA) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(p).pipe(r); });
  const SPORT = await listen(stat), SITE = 'http://127.0.0.1:' + SPORT, URL = SITE + '/';
  let app = null, APP_URL = '', racer = null; const log = [], held = [], holds = new Set(), force = [], late = new Set(), lateHeld = []; let force503 = 0;
  const api = http.createServer((req, res) => {
    const pth = req.url.split('?')[0], entry = { method: req.method, path: pth, status: 0, aborted: false, t: Date.now() }; log.push(entry);
    res.on('finish', () => { entry.status = res.statusCode; }); res.on('close', () => { if (!res.writableEnded) entry.aborted = true; });
    if (req.method === 'POST' && pth === '/v1/auth/verify' && force503 > 0) { force503--; req.resume(); res.writeHead(503, { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', Vary: 'Origin' }); return res.end('{"error":"unavailable"}'); }
    const cors = { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', Vary: 'Origin' };
    // D3-E: a forced answer for one pharmacy (e.g. 413), and a "racing" other device that writes before each push.
    const f = force.find(x => x.n > 0 && x.method === req.method && x.path === pth); if (f) { f.n--; req.resume(); res.writeHead(f.status, cors); return res.end(J(f.body || {})); }
    if (racer && req.method === 'POST') racer(pth);
    if (req.method !== 'OPTIONS' && [...holds].some(h => pth.startsWith(h))) { held.push({ req, res, entry }); return; }
    // D3-E: a late answer: the server answers now (successfully, for the session as it is now), the device gets it later.
    if (req.method !== 'OPTIONS' && [...late].some(h => pth.startsWith(h))) { const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', async () => {
      const hd = {}; for (const k of ['authorization', 'if-none-match', 'content-type', 'origin']) if (req.headers[k]) hd[k] = req.headers[k];
      const r2 = await fetch(APP_URL + req.url, { method: req.method, headers: hd, body: chunks.length ? Buffer.concat(chunks) : undefined });
      lateHeld.push({ res, entry, status: r2.status, body: Buffer.from(await r2.arrayBuffer()), etag: r2.headers.get('etag') }); }); return; }
    app.server.emit('request', req, res);
  });
  const releaseLate = () => { for (const h of lateHeld.splice(0)) { h.res.writeHead(h.status, { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', Vary: 'Origin', ...(h.etag ? { ETag: h.etag } : {}) }); h.res.end(h.status === 304 ? undefined : h.body); } };
  const APORT = await listen(api), API_ORIGIN = 'http://127.0.0.1:' + APORT;
  const release = () => { for (const h of held.splice(0)) if (!h.entry.aborted) app.server.emit('request', h.req, h.res); };

  // ── build the installable app with the test API origin (same build script as dist/pwa)
  const OUT = path.join(TMP, 'dist');
  execFileSync(process.execPath, [path.join(APPDIR, 'tools/build.js'), '--uat'], { env: { ...process.env, PROPAPP_API_ORIGIN: API_ORIGIN, PROPAPP_OUT_DIR: OUT }, stdio: 'pipe' });
  PWA = path.join(OUT, 'pwa');
  const idx = fs.readFileSync(path.join(PWA, 'index.html'), 'utf8');
  ok(idx.includes(`connect-src 'self' ${API_ORIGIN};`) && idx.includes(`window.PROPAPP_PWA=true;window.PROPAPP_API=${J(API_ORIGIN)};`), '0. the built app allows only its own origin and the API in connect-src and carries PROPAPP_API');
  ok(/connect-src 'none'/.test(fs.readFileSync(path.join(OUT, 'propapp-standalone.html'), 'utf8')) && !/PROPAPP_API=|PROPAPP_PWA=/.test(fs.readFileSync(path.join(OUT, 'propapp-standalone.html'), 'utf8')), '0. the single-file app keeps connect-src none and has no API origin');
  ok(fs.readFileSync(path.join(PWA, 'sw.js'), 'utf8').includes("/(^|\\/)(v1|api)(\\/|$)/.test(u.pathname)) return;"), '0. the offline worker returns early for /v1/ and /api/ paths (never answers or caches them)');
  let bad = 0; try { execFileSync(process.execPath, [path.join(APPDIR, 'tools/build.js')], { env: { ...process.env, PROPAPP_API_ORIGIN: 'http://api.example.com', PROPAPP_OUT_DIR: path.join(TMP, 'bad') }, stdio: 'pipe' }); } catch { bad = 1; }
  ok(bad === 1 && !fs.existsSync(path.join(TMP, 'bad')), '0. build refuses an API origin that is not https:// or http://127.0.0.1:<port>');

  // ── the back end
  const sbundle = path.join(TMP, 'server.mjs');
  await esbuild.build({ entryPoints: [path.join(ROOT, 'phase-d3/server/src/app.ts')], bundle: true, platform: 'node', target: 'node22', format: 'esm', outfile: sbundle, logLevel: 'silent' });
  const A = await import('file://' + sbundle);
  const mailer = A.memoryMailer();
  // D3-E: the server's clock runs ahead 16 minutes before each extra sign-in link this test asks for, so the
  // per-address and per-IP link limits (3 and 10 per 15 minutes) don't refuse the later tests' links.
  let skew = 0; const skip15 = () => { skew += 16 * 60000; };
  app = A.createServerApp({ clock: () => Date.now() + skew, dbPath: path.join(TMP, 'pl.db'), emailIndexKey: 'email-key-' + 'a'.repeat(40), logHmacKey: 'log-key-' + 'b'.repeat(40), extraOrigins: [SITE], mailer, logWrite: () => {}, appUrl: URL });
  APP_URL = 'http://127.0.0.1:' + (await app.listen(0, '127.0.0.1')).port;
  const linkFor = email => { const m = [...mailer.outbox].reverse().find(x => x.to === email.toLowerCase()); return m && (/#magic=(ml_[A-Za-z0-9_-]+)/.exec(m.text) || [])[1]; };
  const vault = (acc, id) => app.store.getVault(acc, id);

  // ── fixtures: two format 1 backups (fictional), from the Wattle Grove example brought in by importLegacy
  const lbundle = path.join(TMP, 'legacy.cjs');
  fs.writeFileSync(lbundle, (await esbuild.build({ stdin: { contents: "export { importLegacy } from './legacy.js'; export { migratePharmacy } from './model.js';", resolveDir: path.join(APPDIR, 'src'), loader: 'js' }, bundle: true, write: false, format: 'cjs', platform: 'node', target: 'es2020', loader: { '.json': 'json' }, logLevel: 'silent' })).outputFiles[0].text);
  const L = require(lbundle), E = JSON.parse(fs.readFileSync(path.join(ROOT, 'uat/demo/wattle-grove.json'), 'utf8'));
  const mk = (id, name) => { const g = L.importLegacy(JSON.parse(J(E.backup))); g.pharmacy = { ...g.pharmacy, id, name, flags: { ...g.pharmacy.flags, example: false } };
    const f = path.join(TMP, id + '.json'); fs.writeFileSync(f, J({ app: 'PharmLedger', product: 'PharmLedger', format: 1, exportedAt: '2026-11-27T00:00:00.000Z', pharmacy: g.pharmacy, drafts: g.drafts })); return f; };
  const PH1 = 'ph-accept-1', PH2 = 'ph-accept-2';
  const F1 = mk(PH1, 'Banksia Test Pharmacy (fictional)'), F2 = mk(PH2, 'Second Test Pharmacy (fictional)');

  // ── devices
  const br = await chromium.launch(); const errors = [], allowed = [];
  const device = async (name, { sw = false } = {}) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney', serviceWorkers: sw ? 'allow' : 'block' });
    await ctx.addInitScript(() => { const ev = window.__ev = []; const rs = history.replaceState.bind(history); history.replaceState = function (...a) { ev.push({ k: 'scrub', url: String(a[2]), hash: location.hash }); return rs(...a); };
      const io = indexedDB.open.bind(indexedDB); indexedDB.open = function (...a) { ev.push({ k: 'idb', hash: location.hash }); return io(...a); };
      addEventListener('securitypolicyviolation', e => console.error('CSP violation: ' + e.violatedDirective + ' ' + e.blockedURI));
      // D3-E: with __keepLate set, a request is not cancelled by the app's abort, so a late answer still reaches the
      // app and only its session and sequence checks can keep it out.
      const f0 = window.fetch.bind(window); window.fetch = (u, init) => { if (window.__keepLate && init?.signal) { const { signal, ...rest } = init; init = rest; } return f0(u, init); }; });
    const p = await ctx.newPage(), failed = [];
    p.on('console', m => { if (m.type() !== 'error') return; const t = m.text(), u = m.location()?.url || '';
      if ((/^Failed to load resource: the server responded with a status of (409|413|503)/.test(t) && u.startsWith(API_ORIGIN)) || (/^Failed to load resource: (the server responded with a status of 404|net::ERR_INTERNET_DISCONNECTED)/.test(t) && /^\/(api|v1)\//.test(u.slice(SITE.length)) && u.startsWith(SITE))) allowed.push(name + ' ' + t.slice(60) + ' ' + u.slice(API_ORIGIN.length)); else errors.push(name + ': ' + t); });
    p.on('pageerror', e => errors.push(name + ': ' + e.message)); p.on('requestfailed', r => failed.push({ url: r.url(), method: r.method(), err: r.failure()?.errorText || '' }));
    await p.goto(URL); await p.waitForTimeout(400); return { name, ctx, p, failed };
  };
  const tapB = (p, name, exact = true) => p.getByRole('button', { name, exact }).first().click();
  const openMore = async (p, row) => { await tapB(p, 'More'); await p.waitForTimeout(150); await p.getByRole('button', { name: row }).first().click(); await p.waitForTimeout(250); };
  const restore = async (p, file, fromWelcome) => { if (!fromWelcome) await openMore(p, /^Backup and devices/); await p.locator('input[type=file]').first().setInputFiles(file); await p.waitForTimeout(900); await tapB(p, 'Go to Today'); await p.waitForTimeout(250); };
  const session = p => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('propapp-auth-session') || 'null'); } catch { return null; } });
  const syncRev = async (p, id) => (await saved(p))['propapp:sync:' + id]?.rev || 0;
  const signIn = async (d, email) => { await openMore(d.p, /^Backup and devices/);
    await d.p.locator('form[data-form=synclink] input[name=email]').fill(email); const before = mailer.outbox.length; await tapB(d.p, 'Email me a sign-in link');
    await until(() => mailer.outbox.length > before); await d.p.waitForTimeout(150); const tok = linkFor(email);
    if (d.name === 'B1') { ok(/Check your email on this phone/.test(await d.p.evaluate(() => document.getElementById('sync')?.innerText || '')), 'B. asking for a link says to check email on this phone'); await shot(d.p, 'd3c_sync_linksent_390px.png'); }
    await d.p.goto('about:blank'); await d.p.goto(URL + '#magic=' + tok); return until(() => session(d.p)); };
  const shot = async (p, f) => { await p.evaluate(() => { const el = document.getElementById('sync'); el?.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(150); await p.screenshot({ path: path.join(SHOTS, f) }); };
  const switchTo = async (p, name) => { await openMore(p, /^Pharmacies on this device/); await p.getByRole('button', { name: new RegExp('^' + name.replace(/[()]/g, '\\$&')) }).first().click(); await p.waitForTimeout(400); };

  // ══ Test A: sign-in link opened offline
  const a = await device('A', { sw: true });
  await a.p.evaluate(async () => { await navigator.serviceWorker.ready; }); await a.p.reload(); await a.p.waitForTimeout(500);
  ok(await a.p.evaluate(() => !!navigator.serviceWorker.controller), 'A. the offline worker controls the page');
  const EA = 'owner.a@example.com';
  const ml = await fetch(API_ORIGIN + '/v1/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: J({ email: EA }) });
  ok(ml.status === 202, 'A. a sign-in link was emailed (202)');
  const tokA = linkFor(EA);
  await a.ctx.setOffline(true);
  const vBefore = log.filter(x => x.path === '/v1/auth/verify' && x.method === 'POST').length;
  await a.p.goto('about:blank'); await a.p.goto(URL + '#magic=' + tokA); await a.p.waitForTimeout(700); // opened fresh, as from the email
  const evA = await a.p.evaluate(() => ({ ev: window.__ev, hash: location.hash, href: location.href, pending: sessionStorage.getItem('propapp-pending-magic'), online: navigator.onLine, sess: localStorage.getItem('propapp-auth-session') }));
  const iScrub = evA.ev.findIndex(e => e.k === 'scrub'), iIdb = evA.ev.findIndex(e => e.k === 'idb');
  ok(!evA.online && iScrub >= 0 && evA.ev[iScrub].hash.includes(tokA) && !evA.ev[iScrub].url.includes('magic') && (iIdb < 0 || iScrub < iIdb), 'A. offline: history.replaceState scrubbed #magic before startup opened storage (scrub #' + iScrub + ', storage #' + iIdb + ')');
  ok(evA.hash === '' && !evA.href.includes(tokA) && !(await a.p.evaluate(() => document.body.innerHTML)).includes(tokA), 'A. the token is gone from the address bar and the page');
  ok(evA.pending === tokA && !evA.sess, 'A. the link is kept in sessionStorage while offline; not signed in yet');
  ok(log.filter(x => x.path === '/v1/auth/verify' && x.method === 'POST').length === vBefore, 'A. nothing was sent while offline');
  force503 = 1; await a.ctx.setOffline(false);
  const sA = await until(() => session(a.p), 12000);
  const verifies = log.filter(x => x.path === '/v1/auth/verify' && x.method === 'POST');
  ok(sA && /^pl_sess_/.test(sA.sessionToken) && verifies.length === vBefore + 2 && verifies.at(-2).status === 503 && verifies.at(-1).status === 200, 'A. on reconnect it verified automatically: 503 kept the link, the retry got 200 (' + verifies.slice(vBefore).map(x => x.status).join(', ') + ')');
  const gap = verifies.at(-1).t - verifies.at(-2).t;
  ok(gap >= 1900 && gap < 3900, 'A. the retry after the 503 waited the first backoff step, about 2 s (' + gap + ' ms)');
  ok(await a.p.evaluate(() => sessionStorage.getItem('propapp-pending-magic')) === null && (await a.p.evaluate(() => location.hash)) === '', 'A. the link is cleared after 200');
  const reuse = await fetch(API_ORIGIN + '/v1/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: J({ token: tokA }) });
  ok(reuse.status === 401, 'A. the used link no longer works (401)');
  // D3-E: same-origin /api/* and /v1/* GETs go past the offline worker every time, online and offline.
  const twice = await a.p.evaluate(async () => { const g = async u => (await (await fetch(u)).text()); return [await g('/api/ping'), await g('/api/ping'), await g('/v1/ping'), await g('/v1/ping')]; });
  ok(J(twice) === J(['pong-api-1', 'pong-api-2', 'pong-v1-1', 'pong-v1-2']) && hits.api === 2 && hits.v1 === 2, 'A. same-origin GET /api/ping and /v1/ping reach the server every time through the worker (' + twice.join(', ') + ')');
  const isShell = t => /propapp-build|<div id="app">/.test(t);
  const nav = async u => { try { await a.p.goto(SITE + u); return await a.p.content(); } catch (e) { return 'ERR ' + e.message.split('\n')[0]; } };
  const nApi = await nav('/api/missing'), nV1 = await nav('/v1/missing');
  ok(/no such api path/.test(nApi) && /no such v1 path/.test(nV1) && !isShell(nApi) && !isShell(nV1), 'A. online, opening a missing /api/ or /v1/ page shows the server’s 404, never the cached app page');
  await a.p.goto(URL); await a.p.waitForTimeout(400); await a.ctx.setOffline(true);
  const offFetch = await a.p.evaluate(async () => { const out = []; for (const u of ['/api/ping', '/v1/ping']) { try { const r = await fetch(u); out.push('got ' + r.status + ' ' + (await r.text()).slice(0, 40)); } catch (e) { out.push('failed'); } } return out; });
  ok(J(offFetch) === J(['failed', 'failed']), 'A. offline, GET /api/ping and /v1/ping fail as network errors instead of getting a cached answer (' + offFetch.join(', ') + ')');
  const oApi = await nav('/api/ping'), oV1 = await nav('/v1/anything');
  try { await a.p.goto(URL); } catch {} await a.p.waitForTimeout(600); const oApp = await a.p.content();
  ok(!isShell(oApi) && !isShell(oV1) && isShell(oApp), 'A. offline, opening an /api/ or /v1/ page never gets the cached app page (the app itself still opens offline) [' + [oApi, oV1, oApp].map(x => x.slice(0, 70)).join(' | ') + ']');
  await a.ctx.setOffline(false); await a.p.goto(URL); await a.p.waitForTimeout(300);
  ok(!(await a.p.evaluate(async () => (await Promise.all((await caches.keys()).map(async k => (await (await caches.open(k)).keys()).map(r => r.url)))).flat().some(u => /\/(v1|api)\//.test(u)))), 'A. nothing from /v1/ or /api/ is in the offline cache');
  await a.ctx.close();

  // ══ Test B: two devices, one backup, divergent offline edits
  const EB = 'owner.b@example.com';
  const b1 = await device('B1'), b2 = await device('B2');
  for (const d of [b1, b2]) { await restore(d.p, F1, true); await restore(d.p, F2, false); }
  const same0 = canon((await saved(b1.p))['propapp:ph:' + PH1]) === canon((await saved(b2.p))['propapp:ph:' + PH1]);
  ok(same0, 'B. the same format 1 backup restores identically on both devices (deterministic ids)');
  const s1 = await signIn(b1, EB);
  await openMore(b1.p, /^Backup and devices/); await until(() => b1.p.evaluate(() => /Up to date/.test(document.getElementById('sync')?.innerText || '')), 5000);
  await shot(b1.p, 'd3c_sync_signedin_390px.png');
  ok(!!s1 && await until(() => vault(s1.accountId, PH1).rev === 1 && vault(s1.accountId, PH2).rev === 1), 'B. device 1 signs in and pushes both pharmacies (rev 1 each)');
  const s2 = await signIn(b2, EB);
  ok(s2 && s2.accountId === s1.accountId && await until(async () => (await syncRev(b2.p, PH1)) === 1 && (await syncRev(b2.p, PH2)) === 1), 'B. device 2 signs in to the same account and pulls rev 1 for both');
  ok(vault(s1.accountId, PH1).rev === 1, 'B. device 2’s pull merged without pushing (still rev 1)');
  for (const d of [b1, b2]) { await switchTo(d.p, 'Banksia Test Pharmacy'); }
  await until(async () => !log.some(x => !x.status && !x.aborted && x.path.startsWith('/v1/sync/')), 5000);
  await b1.ctx.setOffline(true); await b2.ctx.setOffline(true);
  await openMore(b1.p, /^Pharmacy details/); await b1.p.locator('input[name=address]').fill('1 Test Street, Testville (fictional)'); await tapB(b1.p, 'Save'); await b1.p.waitForTimeout(300);
  await openMore(b2.p, /^Pharmacy details/); await b2.p.locator('input[name=identifier]').fill('TEST-42'); await tapB(b2.p, 'Save'); await b2.p.waitForTimeout(300);
  // D3-E: each device also adds its own action-log line (Waiting on someone) to the same action and its own procedure
  // version (Edit › Save as new version) to the same procedure, offline.
  const FRIDGE = Object.values(JSON.parse(fs.readFileSync(F1, 'utf8')).pharmacy.actions).find(x => /Fridge min\/max/.test(x.title)).id;
  const addLog = async (p, asked) => { await tapB(p, 'Actions'); await p.waitForTimeout(250); await p.locator('.list .row', { hasText: 'Fridge min/max' }).first().click(); await p.waitForTimeout(300);
    await tapB(p, 'Waiting on someone'); await p.waitForTimeout(200); await p.locator('textarea[name=asked]').fill(asked); await tapB(p, 'Save'); await p.waitForTimeout(300); };
  const addVersion = async (p, line) => { await openMore(p, /^Procedures/); await p.locator('[data-id="otp"]').first().click(); await p.waitForTimeout(300); await tapB(p, 'Edit'); await p.waitForTimeout(300);
    const ta = p.locator('textarea[name=body]'); await ta.fill((await ta.inputValue()) + '\n' + line); await tapB(p, 'Save as new version'); await p.waitForTimeout(300); };
  await addLog(b1.p, 'Asked the relief pharmacist on device 1 (fictional)'); await addLog(b2.p, 'Asked the weekend assistant on device 2 (fictional)');
  await addVersion(b1.p, 'Device 1 step (fictional).'); await addVersion(b2.p, 'Device 2 step (fictional).');
  const baseF1 = JSON.parse(fs.readFileSync(F1, 'utf8')).pharmacy, baseLogIds = baseF1.actions[FRIDGE].log.map(l => l.id), baseVerIds = baseF1.procedures.find(x => x.service === 'otp').versions.map(v => v.id);
  const newOf = async p => { const ph = (await saved(p))['propapp:ph:' + PH1]; return { log: ph.actions[FRIDGE].log.filter(l => !baseLogIds.includes(l.id)), ver: ph.procedures.find(x => x.service === 'otp').versions.filter(v => !baseVerIds.includes(v.id)), hist: ph.history.filter(h => !baseF1.history.some(b => b.id === h.id)).map(h => h.id) }; };
  const n1 = await newOf(b1.p), n2 = await newOf(b2.p);
  ok(n1.log.length === 1 && n2.log.length === 1 && n1.ver.length === 1 && n2.ver.length === 1 && n1.log[0].id !== n2.log[0].id && n1.ver[0].id !== n2.ver[0].id && /device 1/.test(n1.log[0].text) && /device 2/.test(n2.log[0].text) && /Device 1 step/.test(n1.ver[0].body) && /Device 2 step/.test(n2.ver[0].body), 'B. offline, each device added one distinct action-log line and one distinct procedure version (' + [n1.log[0]?.id, n2.log[0]?.id, n1.ver[0]?.id, n2.ver[0]?.id].map(x => String(x).slice(0, 8)).join(', ') + ')');
  await b1.p.waitForTimeout(1800);
  ok(vault(s1.accountId, PH1).rev === 1, 'B. offline edits on both devices sent nothing');
  await b1.ctx.setOffline(false);
  ok(await until(() => vault(s1.accountId, PH1).rev === 2, 8000), 'B. device 1 back online syncs its edit (rev 2)');
  const c409 = log.filter(x => x.status === 409).length;
  await b2.ctx.setOffline(false);
  ok(await until(() => vault(s1.accountId, PH1).rev === 3, 8000) && log.filter(x => x.status === 409).length === c409 + 1, 'B. device 2 back online gets 409, merges against its sync base and pushes the merge (rev 3)');
  await openMore(b1.p, /^Backup and devices/); await tapB(b1.p, 'Sync now');
  ok(await until(async () => (await syncRev(b1.p, PH1)) === 3, 8000), 'B. device 1 taps Sync now and takes rev 3');
  await b1.p.waitForTimeout(300);
  const d1 = (await saved(b1.p))['propapp:ph:' + PH1], d2 = (await saved(b2.p))['propapp:ph:' + PH1], head = vault(s1.accountId, PH1);
  ok(canon(d1) === canon(d2), 'B. both devices hold identical copies');
  noRev = x => { const { rev, ...r } = x; return r; };
  ok(canon(noRev(d1)) === canon(noRev(head.pharmacy)) && d1.rev === 3 && d2.rev === 3, 'B. …the same as the server head, at rev 3');
  ok(d1.address === '1 Test Street, Testville (fictional)' && d1.identifier === 'TEST-42', 'B. both offline edits survived the merge');
  const uniq = xs => new Set(xs).size === xs.length;
  const base = JSON.parse(fs.readFileSync(F1, 'utf8')).pharmacy;
  ok(uniq(d1.history.map(h => h.id)) && J(d1.history.map(h => h.id).sort()) === J([...base.history.map(h => h.id), ...n1.hist, ...n2.hist].sort()), 'B. history: every id once, every new line from both devices kept (' + base.history.length + ' → ' + d1.history.length + ')');
  ok(Object.values(d1.actions).every(x => uniq((x.log || []).map(l => l.id))) && Object.keys(d1.actions).length === Object.keys(base.actions).length, 'B. no duplicate action or action.log ids');
  ok(d1.procedures.every(p => uniq(p.versions.map(v => v.id))) && uniq(d1.procedures.map(p => p.id)), 'B. no duplicate procedures or procedure versions');
  const byId = xs => Object.fromEntries(xs.map(x => [x.id, canon(x)]));
  const mLog = d1.actions[FRIDGE].log, mVer = d1.procedures.find(x => x.service === 'otp').versions;
  ok(J(mLog.map(l => l.id).sort()) === J([...baseLogIds, n1.log[0].id, n2.log[0].id].sort()) && byId(mLog)[n1.log[0].id] === canon(n1.log[0]) && byId(mLog)[n2.log[0].id] === canon(n2.log[0]), 'B. the action log holds exactly the ' + baseLogIds.length + ' earlier lines plus both devices’ new lines, each unchanged (' + mLog.length + ')');
  ok(J(mVer.map(v => v.id).sort()) === J([...baseVerIds, n1.ver[0].id, n2.ver[0].id].sort()) && byId(mVer)[n1.ver[0].id] === canon(n1.ver[0]) && byId(mVer)[n2.ver[0].id] === canon(n2.ver[0]), 'B. the OTP procedure holds exactly the earlier version plus both devices’ new versions, each unchanged (' + mVer.map(v => v.v).join(', ') + ')');
  ok(canon(d2.actions[FRIDGE].log) === canon(mLog) && canon(d2.procedures.find(x => x.service === 'otp').versions) === canon(mVer), 'B. …in the same order on both devices');

  // ══ Test C: delete wins over the other device's stale offline edit
  await switchTo(b2.p, 'Second Test Pharmacy');
  await until(async () => !log.some(x => !x.status && !x.aborted && x.path.startsWith('/v1/sync/')), 5000);
  await b2.ctx.setOffline(true);
  await openMore(b2.p, /^Pharmacy details/); await b2.p.locator('input[name=address]').fill('Stale offline edit (fictional)'); await tapB(b2.p, 'Save'); await b2.p.waitForTimeout(300);
  await openMore(b1.p, /^Pharmacies on this device/); await tapB(b1.p, 'Archive or delete a pharmacy'); await b1.p.waitForTimeout(200);
  await b1.p.locator('.row.static', { hasText: 'Second Test Pharmacy' }).getByRole('button', { name: 'Delete', exact: true }).click(); await b1.p.waitForTimeout(150); await b1.p.locator('.sheet input[name=deltype]').fill('DELETE'); await b1.p.locator('.sheet').getByRole('button', { name: 'Delete permanently' }).click(); await b1.p.waitForTimeout(300);
  const delAt = await until(() => vault(s1.accountId, PH2).deletedAt, 8000);
  ok(!!delAt && vault(s1.accountId, PH2).rev === 2 && vault(s1.accountId, PH2).pharmacy === null, 'C. device 1 deletes it (typing DELETE) and the tombstone reaches the server (rev 2)');
  await b2.ctx.setOffline(false);
  const goneB2 = await until(async () => { const all = await saved(b2.p); return !all['propapp:ph:' + PH2] && all['propapp:tomb:' + PH2] ? all : null; }, 8000);
  ok(!!goneB2, 'C. device 2 back online: propapp:ph:<id> is removed');
  ok(goneB2 && goneB2['propapp:tomb:' + PH2].deletedAt === delAt && goneB2['propapp:dir'].tombstones?.[PH2] === delAt && !goneB2['propapp:dir'].ids.includes(PH2) && !goneB2['propapp:drafts:' + PH2], 'C. propapp:tomb:<id> persists with the server’s deletedAt; not listed; drafts gone');
  await b2.p.waitForTimeout(600);
  ok(vault(s1.accountId, PH2).rev === 2 && vault(s1.accountId, PH2).deletedAt === delAt, 'C. the stale edit did not bring it back on the server (still rev 2, deleted)');
  await b2.p.reload(); await b2.p.waitForTimeout(700);
  ok(!(await saved(b2.p))['propapp:ph:' + PH2] && /Banksia Test Pharmacy/.test(await b2.p.evaluate(() => document.querySelector('.bar')?.innerText || document.body.innerText)), 'C. after a reload it stays deleted and device 2 shows the other pharmacy');
  await b1.ctx.close(); await b2.ctx.close();

  // ══ Test D: held requests abort cleanly
  const ED = 'owner.d@example.com';
  const d = await device('D');
  await restore(d.p, F1, true); await restore(d.p, F2, false);
  await openMore(d.p, /^Backup and devices/);
  await shot(d.p, 'd3c_sync_signedout_390px.png');
  const sD = await signIn(d, ED);
  ok(!!sD && await until(() => vault(sD.accountId, PH1).rev === 1 && vault(sD.accountId, PH2).rev === 1), 'D. signed in (a second account) and synced both');
  const dataBefore = canon(Object.fromEntries(Object.entries(await saved(d.p)).filter(([k]) => k.startsWith('propapp:ph:'))));
  // 1. a held sync, then a pharmacy switch
  holds.add('/v1/sync/'); await openMore(d.p, /^Backup and devices/); await tapB(d.p, 'Sync now');
  const h1 = await until(() => held.length >= 1 && held[0]);
  ok(!!h1, 'D. a sync request is held by the server (' + (h1 ? h1.entry.method + ' ' + h1.entry.path : 'none') + ')');
  const seq0 = await d.p.evaluate(() => window.__seq0 = 1);
  await switchTo(d.p, 'Banksia Test Pharmacy');
  ok(await until(() => h1.entry.aborted) && d.failed.some(f => f.url.endsWith(h1.entry.path) && /ERR_ABORTED/.test(f.err)), 'D. switching pharmacy aborts the held sync (net::ERR_ABORTED)');
  holds.delete('/v1/sync/'); release();
  await until(async () => !log.some(x => !x.status && !x.aborted && x.path.startsWith('/v1/sync/')), 6000);
  // 2. a held topic, then a pharmacy switch
  holds.add('/v1/topics/');
  await d.p.evaluate(() => { window.__topic = 'pending'; window.pharmledgerTest.topic('otp-standards-2026').then(t => { window.__topic = t; }); });
  const h2 = await until(() => held.find(h => h.entry.path.startsWith('/v1/topics/')));
  ok(!!h2, 'D. a topic request is held (' + (h2 ? h2.entry.path : 'none') + ')');
  await switchTo(d.p, 'Second Test Pharmacy');
  ok(await until(() => h2.entry.aborted) && d.failed.some(f => f.url.endsWith('/v1/topics/otp-standards-2026') && /ERR_ABORTED/.test(f.err)) && (await until(() => d.p.evaluate(() => window.__topic === null))), 'D. the switch aborts the held topic and nothing is shown from it');
  holds.delete('/v1/topics/'); release();
  const tOk = await d.p.evaluate(() => window.pharmledgerTest.topic('otp-standards-2026'));
  ok(tOk && tOk.id === 'otp-standards-2026' && tOk.points.length >= 3, 'D. the same topic loads when not interrupted');
  // 3. held sync and topic, then Disconnect
  holds.add('/v1/sync/'); holds.add('/v1/topics/');
  await openMore(d.p, /^Backup and devices/); await tapB(d.p, 'Sync now');
  await d.p.evaluate(() => { window.__topic2 = 'pending'; window.pharmledgerTest.topic('daa-supply-qspp').then(t => { window.__topic2 = t; }); });
  const h3 = await until(() => held.find(h => h.entry.path.startsWith('/v1/sync/') && !h.entry.aborted)), h4 = await until(() => held.find(h => h.entry.path.startsWith('/v1/topics/') && !h.entry.aborted));
  ok(!!h3 && !!h4, 'D. a sync and a topic request are held');
  const tokD = (await session(d.p)).sessionToken;
  await tapB(d.p, 'Disconnect'); await d.p.waitForTimeout(400);
  ok(await until(() => h3.entry.aborted && h4.entry.aborted), 'D. Disconnect aborts both held requests');
  ok(!(await session(d.p)) && (await d.p.evaluate(() => sessionStorage.getItem('propapp-pending-magic'))) === null, 'D. Disconnect clears the sign-in on this device');
  ok(await until(() => log.some(x => x.method === 'POST' && x.path === '/v1/auth/logout' && x.status === 204)), 'D. it tells the server (POST /v1/auth/logout → 204)');
  holds.clear(); release();
  const after = await fetch(API_ORIGIN + '/v1/sync/' + PH1, { headers: { Authorization: 'Bearer ' + tokD } });
  ok(after.status === 401, 'D. the old session no longer works (401)');
  await d.p.waitForTimeout(400);
  const dataAfter = canon(Object.fromEntries(Object.entries(await saved(d.p)).filter(([k]) => k.startsWith('propapp:ph:'))));
  ok(dataAfter === dataBefore, 'D. every pharmacy record on the device is unchanged by the aborts and the disconnect');
  ok(await d.p.locator('form[data-form=synclink]').count() === 1 && /Sync across devices/.test(await d.p.evaluate(() => document.body.innerText)), 'D. Backup and devices offers the sign-in link again');
  const small = await d.p.evaluate(() => [...document.querySelectorAll('#sync button, #sync input')].filter(el => el.getBoundingClientRect().height < 44 || el.getBoundingClientRect().right > innerWidth + 0.5).length);
  ok(small === 0 && await d.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'D. the sync section’s controls are 44 px or taller and nothing scrolls sideways');
  // 4. D3-E: a late but successful answer, delivered after Disconnect and after an account switch, is never applied.
  const signInLink = async (p, email) => { skip15(); const before = mailer.outbox.length;
    await fetch(API_ORIGIN + '/v1/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: J({ email }) });
    await until(() => mailer.outbox.length > before); return linkFor(email); };
  const verifyTok = async tok => (await fetch(API_ORIGIN + '/v1/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: J({ token: tok }) })).json();
  await d.p.goto('about:blank'); await d.p.goto(URL + '#magic=' + await signInLink(d.p, ED));
  const sD2 = await until(() => session(d.p)); await until(async () => !log.some(x => !x.status && !x.aborted && (x.path.startsWith('/v1/sync/') || x.path === '/v1/vault')), 6000); await d.p.waitForTimeout(300);
  const lateCase = async (label, interrupt) => {
    const before = await saved(d.p), head = vault(sD2.accountId, PH1), revBefore = before['propapp:sync:' + PH1]?.rev;
    // another device writes first, so the (late) answer carries new content the guards must keep out
    app.store.putVault(sD2.accountId, PH1, head.rev, { ...head.pharmacy, name: 'Late answer ' + label + ' (fictional)', updatedAt: new Date().toISOString() }, null, null, Date.now());
    await d.p.evaluate(() => { window.__keepLate = true; }); late.add('/v1/sync/' + PH1);
    await openMore(d.p, /^Backup and devices/); await tapB(d.p, 'Sync now');
    const lh = await until(() => lateHeld.length && lateHeld[0]);
    const carried = lh && lh.status === 200 && /Late answer/.test(lh.body.toString());
    await interrupt(); late.clear(); releaseLate();
    await until(() => lh.entry.status === 200 && !lh.entry.aborted, 4000); await d.p.waitForTimeout(500);
    const after = await saved(d.p);
    await d.p.evaluate(() => { window.__keepLate = false; });
    return { delivered: !!carried && lh.entry.status === 200 && !lh.entry.aborted, unchanged: canon(after['propapp:ph:' + PH1]) === canon(before['propapp:ph:' + PH1]) && (after['propapp:sync:' + PH1]?.rev) === revBefore && !/Late answer/.test(await d.p.evaluate(() => document.body.innerText)) };
  };
  const lc1 = await lateCase('after disconnect', async () => { await tapB(d.p, 'Disconnect'); await d.p.waitForTimeout(200); });
  ok(lc1.delivered && lc1.unchanged, 'D. a successful GET /v1/sync answer that arrives after Disconnect is not applied (record, sync rev and screen unchanged)');
  await d.p.goto('about:blank'); await d.p.goto(URL + '#magic=' + await signInLink(d.p, ED)); await until(() => session(d.p));
  await until(async () => !log.some(x => !x.status && !x.aborted && (x.path.startsWith('/v1/sync/') || x.path === '/v1/vault')), 6000); await d.p.waitForTimeout(300);
  const other = await verifyTok(await signInLink(d.p, 'owner.d2@example.com'));
  const lc2 = await lateCase('after account switch', async () => { await d.p.evaluate(o => localStorage.setItem('propapp-auth-session', JSON.stringify({ sessionToken: o.sessionToken, accountId: o.accountId, expiresAt: o.expiresAt })), other); });
  const sNow = await session(d.p);
  ok(lc2.delivered && lc2.unchanged && sNow?.sessionToken === other.sessionToken, 'D. a successful answer for the earlier session that arrives after another account signed in is not applied, and the newer sign-in is kept');
  await d.p.evaluate(() => localStorage.removeItem('propapp-auth-session'));
  await d.ctx.close();

  const signInFresh = async (d, email) => { skip15(); const before = mailer.outbox.length;
    await fetch(API_ORIGIN + '/v1/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: J({ email }) });
    await until(() => mailer.outbox.length > before); await d.p.goto('about:blank'); await d.p.goto(URL + '#magic=' + linkFor(email)); return until(() => session(d.p)); };
  const idle = () => until(async () => !log.some(x => !x.status && !x.aborted && (x.path.startsWith('/v1/sync/') || x.path === '/v1/vault')), 6000);
  const delOther = async (p, name) => { await openMore(p, /^Pharmacies on this device/); await tapB(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(200);
    const rowEl = p.locator('.row.static', { hasText: name }); await rowEl.getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(150);
    await p.locator('.sheet input[name=deltype]').fill('DELETE'); await p.locator('.sheet').getByRole('button', { name: 'Delete permanently' }).click(); await p.waitForTimeout(400); };

  // ══ Test E: another account never gets the earlier account's records without an explicit step
  const e = await device('E'); const EE1 = 'owner.e1@example.com', EE2 = 'owner.e2@example.com';
  await restore(e.p, F1, true); await restore(e.p, F2, false);
  const sE1 = await signIn(e, EE1);
  ok(!!sE1 && await until(() => vault(sE1.accountId, PH1).rev === 1 && vault(sE1.accountId, PH2).rev === 1), 'E. account 1 signs in and syncs both pharmacies');
  await idle(); await openMore(e.p, /^Backup and devices/); await tapB(e.p, 'Disconnect'); await e.p.waitForTimeout(300);
  await switchTo(e.p, 'Banksia Test Pharmacy'); await delOther(e.p, 'Second Test Pharmacy');
  const eAll0 = await saved(e.p);
  ok(!eAll0['propapp:ph:' + PH2] && eAll0['propapp:tomb:' + PH2] && vault(sE1.accountId, PH2).deletedAt === null, 'E. signed out, the second pharmacy is deleted on this phone (a tombstone not yet synced)');
  const vBeforeE = log.length;
  const sE2 = await signIn(e, EE2);
  ok(!!sE2 && sE2.accountId !== sE1.accountId, 'E. signed in to a different account (account 2)');
  await openMore(e.p, /^Backup and devices/); await until(() => e.p.evaluate(() => /Up to date/.test(document.getElementById('sync')?.innerText || '')), 6000); await idle();
  ok(app.store.listVaults(sE2.accountId).length === 0 && !log.slice(vBeforeE).some(x => x.method === 'POST' && x.path.startsWith('/v1/sync/')), 'E. nothing from this phone was uploaded to account 2: no vault, no POST (pharmacy or tombstone)');
  const eAll1 = await saved(e.p);
  ok(eAll1['propapp:sync:' + PH1]?.account === sE1.accountId && eAll1['propapp:sync:' + PH2]?.account === sE1.accountId && vault(sE1.accountId, PH2).deletedAt === null, 'E. the pharmacy and the tombstone stay bound to account 1 (and account 1 was not touched while signed out)');
  const eText = await e.p.evaluate(() => document.getElementById('sync')?.innerText || '');
  ok(/1 pharmacy on this phone was synced with a different email/.test(eText) && await e.p.getByRole('button', { name: 'Add it to this account' }).count() === 1, 'E. Backup and devices says so and offers “Add it to this account”');
  await shot(e.p, 'd3d_sync_other_account_390px.png');
  await tapB(e.p, 'Add it to this account');
  ok(await until(() => vault(sE2.accountId, PH1).rev === 1, 8000) && (await saved(e.p))['propapp:sync:' + PH1]?.account === sE2.accountId, 'E. after the tap, the live pharmacy is uploaded to account 2 (rev 1) and bound to it');
  await e.p.waitForTimeout(600);
  ok(app.store.listVaults(sE2.accountId).length === 1 && vault(sE2.accountId, PH2).rev === 0 && (await saved(e.p))['propapp:sync:' + PH2]?.account === sE1.accountId, 'E. account 1’s tombstone is never attached or uploaded to account 2');
  ok(await e.p.getByRole('button', { name: /^Add (it|them) to this account$/ }).count() === 0, 'E. the note goes once nothing is left to add');
  await e.ctx.close();

  // ══ Test F: a restore over a synced deletion isn't deleted again by the other device
  const EF = 'owner.f@example.com';
  const f1 = await device('F1'), f2 = await device('F2');
  await restore(f1.p, F1, true); await restore(f1.p, F2, false);
  const sF = await signIn(f1, EF);
  ok(!!sF && await until(() => vault(sF.accountId, PH1).rev === 1 && vault(sF.accountId, PH2).rev === 1), 'F. device 1 syncs both pharmacies');
  const sF2 = await signInFresh(f2, EF);
  ok(!!sF2 && await until(async () => { const a = await saved(f2.p); return a['propapp:ph:' + PH1] && a['propapp:ph:' + PH2] && a['propapp:sync:' + PH2]?.rev === 1; }, 8000), 'F. device 2 (empty) signs in and finds both pharmacies');
  await idle(); await switchTo(f1.p, 'Banksia Test Pharmacy'); await delOther(f1.p, 'Second Test Pharmacy');
  const delF = await until(() => vault(sF.accountId, PH2).deletedAt, 8000);
  ok(!!delF && vault(sF.accountId, PH2).rev === 2, 'F. device 1 deletes it; the tombstone reaches the server (rev 2)');
  await openMore(f2.p, /^Backup and devices/); await tapB(f2.p, 'Sync now');
  ok(await until(async () => { const a = await saved(f2.p); return !a['propapp:ph:' + PH2] && a['propapp:tomb:' + PH2]?.deletedAt === delF; }, 8000), 'F. device 2 takes the deletion and holds the tombstone');
  const bkUpdated = JSON.parse(fs.readFileSync(F2, 'utf8')).pharmacy.updatedAt;
  ok(bkUpdated && bkUpdated < delF, 'F. the backup’s own updatedAt (' + bkUpdated + ') is older than the deletion (' + delF + ')');
  await idle(); await restore(f1.p, F2, false);
  const hF = await until(() => { const h = vault(sF.accountId, PH2); return h.rev === 3 && !h.deletedAt && h.pharmacy ? h : null; }, 8000);
  ok(!!hF && hF.pharmacy.restoredOver?.deletedAt === delF && hF.pharmacy.restoredOver?.rev === 2 && hF.pharmacy.restoredAt > delF && hF.pharmacy.updatedAt === bkUpdated, 'F. device 1 restores the backup: the server copy is live (rev 3) and carries restoredAt and restoredOver { deletedAt, rev 2 }');
  await openMore(f2.p, /^Backup and devices/); await tapB(f2.p, 'Sync now');
  ok(await until(async () => { const a = await saved(f2.p); return a['propapp:ph:' + PH2] && !a['propapp:tomb:' + PH2] && a['propapp:dir'].ids.includes(PH2) && a['propapp:sync:' + PH2]?.rev === 3; }, 8000), 'F. device 2 (holding the older tombstone) takes the restored pharmacy back');
  await f2.p.waitForTimeout(800); await idle();
  ok(vault(sF.accountId, PH2).rev === 3 && !vault(sF.accountId, PH2).deletedAt, 'F. device 2 did not delete it again on the server (still rev 3, live)');
  await f2.p.reload(); await f2.p.waitForTimeout(900); await idle();
  ok((await saved(f2.p))['propapp:ph:' + PH2] && vault(sF.accountId, PH2).rev === 3 && !vault(sF.accountId, PH2).deletedAt, 'F. after a reload and another sync it stays restored on both');
  await f1.ctx.close(); await f2.ctx.close();

  // ══ Test G: an empty device finds the account's pharmacies, and one created later on another device
  const g = await device('G');
  ok(await g.p.getByRole('button', { name: 'Try example' }).count() === 1 && !Object.keys(await saved(g.p)).some(k => k.startsWith('propapp:ph:')), 'G. a fresh device starts empty, on the welcome screen');
  const sG = await signInFresh(g, EB);
  ok(sG && sG.accountId === s1.accountId, 'G. it signs in to the account from test B');
  const gAll = await until(async () => { const a = await saved(g.p); return a['propapp:ph:' + PH1] && a['propapp:dir']?.active === PH1 ? a : null; }, 8000);
  ok(!!gAll && canon(noRev(gAll['propapp:ph:' + PH1])) === canon(noRev(vault(s1.accountId, PH1).pharmacy)) && gAll['propapp:sync:' + PH1]?.rev === vault(s1.accountId, PH1).rev && gAll['propapp:sync:' + PH1]?.account === s1.accountId, 'G. GET /v1/vault found the pharmacy: the device holds the server copy, at its rev, bound to this account');
  ok(gAll && !gAll['propapp:ph:' + PH2] && !(gAll['propapp:dir'].ids || []).includes(PH2), 'G. the account’s deleted pharmacy is not brought onto the fresh device');
  ok(await until(() => g.p.evaluate(() => /Banksia Test Pharmacy/.test(document.body.innerText)), 4000) && await g.p.getByRole('button', { name: 'Try example' }).count() === 0, 'G. the app opens the pharmacy it found');
  await shot(g.p, 'd3d_fresh_device_found_390px.png');
  const PH3 = 'ph-accept-3', ph3 = { ...JSON.parse(fs.readFileSync(F1, 'utf8')).pharmacy, id: PH3, name: 'Third Test Pharmacy (fictional)', updatedAt: new Date().toISOString() };
  ok(app.store.putVault(s1.accountId, PH3, 0, ph3, null, null, Date.now()).kind === 'ok', 'G. another device creates a third pharmacy on the account');
  await openMore(g.p, /^Backup and devices/); await tapB(g.p, 'Sync now');
  ok(await until(async () => { const a = await saved(g.p); return a['propapp:ph:' + PH3]?.name === 'Third Test Pharmacy (fictional)' && a['propapp:dir'].ids.includes(PH3) && a['propapp:dir'].active === PH1; }, 8000), 'G. the next sync finds it too (listed; the open pharmacy stays open)');
  await g.ctx.close();

  // ══ Test H (D3-E): one refused pharmacy doesn't stop the others; "Up to date" only once the server has acked;
  //    a sign-in link settles before the ordinary sync; Disconnect reaches the other tab; UAT reset signs out.
  const EH = 'owner.h@example.com', h = await device('H');
  await restore(h.p, F1, true); await restore(h.p, F2, false);
  const sH = await signIn(h, EH); await idle();
  ok(!!sH && await until(() => vault(sH.accountId, PH1).rev === 1 && vault(sH.accountId, PH2).rev === 1, 8000), 'H. signed in and synced both pharmacies'); await idle();
  const syncLine = () => h.p.evaluate(() => document.querySelector('#sync [role=status]')?.innerText || '');
  const editBoth = async tag => { for (const nm of ['Banksia Test Pharmacy', 'Second Test Pharmacy']) { await switchTo(h.p, nm); await idle(); await openMore(h.p, /^Pharmacy details/); await h.p.locator('input[name=address]').fill(tag + ' ' + nm + ' (fictional)'); await tapB(h.p, 'Save'); await h.p.waitForTimeout(200); } };
  force.push({ method: 'POST', path: '/v1/sync/' + PH1, status: 413, body: { error: 'too_large' }, n: 50 });
  await editBoth('Partial'); await h.p.waitForTimeout(1800); await idle();
  await openMore(h.p, /^Backup and devices/); await tapB(h.p, 'Sync now'); await idle(); await h.p.waitForTimeout(300);
  const lineP = await syncLine();
  ok(vault(sH.accountId, PH1).rev === 1 && vault(sH.accountId, PH2).rev === 2 && /^Partial/.test(vault(sH.accountId, PH2).pharmacy.address), 'H. the first pharmacy is refused (413) and the second still syncs (rev 2)');
  ok(/^Synced 1 of 2 pharmacies\. 1 couldn’t sync: a pharmacy is too large to sync/.test(lineP) && !/Up to date/.test(lineP), 'H. Backup and devices shows a partial sync, not “Up to date” (“' + lineP + '”)');
  await shot(h.p, 'd3e_sync_partial_390px.png');
  force.length = 0; await tapB(h.p, 'Sync now'); await idle(); await h.p.waitForTimeout(300);
  ok(vault(sH.accountId, PH1).rev === 2 && /Up to date/.test(await syncLine()), 'H. once the server takes it, both are synced and it says Up to date');
  // three 409s in a row (another device keeps writing first): stays "Not up to date yet" until the server acks
  let races = 0; racer = pth => { if (pth !== '/v1/sync/' + PH1 || races >= 3) return; races++; const v = vault(sH.accountId, PH1); app.store.putVault(sH.accountId, PH1, v.rev, { ...v.pharmacy, owner: 'Other device ' + races + ' (fictional)', updatedAt: new Date().toISOString() }, null, null, Date.now()); };
  await switchTo(h.p, 'Banksia Test Pharmacy'); await idle(); await openMore(h.p, /^Pharmacy details/); await h.p.locator('input[name=address]').fill('Racing edit (fictional)'); await tapB(h.p, 'Save');
  await openMore(h.p, /^Backup and devices/);
  const linePend = await until(async () => { const l = await syncLine(); return races >= 3 && /Not up to date yet/.test(l) ? l : null; }, 8000);
  ok(!!linePend && !/Up to date ·/.test(linePend) && (await saved(h.p))['propapp:ph:' + PH1].address === 'Racing edit (fictional)', 'H. after a third 409 in a row the pharmacy stays waiting (“' + linePend + '”), never “Up to date”');
  racer = null;
  ok(await until(async () => /Up to date/.test(await syncLine()) && vault(sH.accountId, PH1).pharmacy.address === 'Racing edit (fictional)', 12000), 'H. it tries again by itself and says Up to date once the server holds this phone’s copy');
  // a sign-in link opened while already signed in: the ordinary sync waits, so it can't cut the link's check short
  await idle(); holds.add('/v1/auth/verify');
  const tokH2 = await signInLink(h.p, 'owner.h2@example.com'), t0 = Date.now();
  await h.p.goto('about:blank'); await h.p.goto(URL + '#magic=' + tokH2);
  const hv = await until(() => held.find(x => x.entry.path === '/v1/auth/verify' && x.entry.t >= t0));
  await h.p.waitForTimeout(600);
  const syncedMeanwhile = log.some(x => x.t >= t0 && (x.path === '/v1/vault' || x.path.startsWith('/v1/sync/')));
  holds.delete('/v1/auth/verify'); release();
  const sH2 = await until(async () => { const z = await session(h.p); return z && z.sessionToken !== sH.sessionToken ? z : null; }, 6000);
  ok(!!hv && !syncedMeanwhile && hv.entry.status === 200 && !hv.entry.aborted && !!sH2 && sH2.accountId !== sH.accountId, 'H. with an earlier sign-in on the device, the new link is checked first (no sync meanwhile) and signs in (200, not aborted)');
  // Disconnect in one tab reaches the other tab
  const hTab = await h.ctx.newPage(); hTab.on('pageerror', e => errors.push('H tab 2: ' + e.message)); await hTab.goto(URL); await hTab.waitForTimeout(500);
  await openMore(hTab, /^Backup and devices/); await openMore(h.p, /^Backup and devices/); await idle();
  holds.add('/v1/vault'); await tapB(h.p, 'Sync now'); const hh = await until(() => held.find(x => x.entry.path === '/v1/vault' && !x.entry.aborted));
  await tapB(hTab, 'Disconnect');
  ok(!!hh && await until(() => hh.entry.aborted, 4000) && await until(() => h.p.evaluate(() => !!document.querySelector('form[data-form=synclink]')), 4000), 'H. Disconnect in another tab stops this tab’s sync and shows it signed out here too');
  holds.clear(); release(); await hTab.close();
  // UAT Reset test data clears the sign-in, the synced account and a pending link before it reloads
  await h.p.goto('about:blank'); await h.p.goto(URL + '#magic=' + await signInLink(h.p, EH)); await until(() => session(h.p)); await idle();
  await h.p.evaluate(() => sessionStorage.setItem('propapp-pending-magic', 'ml_not_a_real_link'));
  await h.p.locator('#uat-btn').click(); await h.p.waitForTimeout(200);
  const rb = h.p.locator('#uat-dlg [data-reset]'), hadReset = await rb.count();
  if (hadReset) { await rb.click(); await h.p.waitForTimeout(150); await h.p.locator('#uat-dlg [data-reset]').click(); await h.p.waitForLoadState('load'); await h.p.waitForTimeout(800); }
  const wiped = await h.p.evaluate(() => ({ s: localStorage.getItem('propapp-auth-session'), a: localStorage.getItem('propapp-sync-account'), m: sessionStorage.getItem('propapp-pending-magic'), ph: Object.keys(localStorage).filter(k => k.startsWith('propapp:ph:')).length }));
  ok(hadReset === 1 && wiped.s === null && wiped.a === null && wiped.m === null && await h.p.getByRole('button', { name: 'Try example' }).count() === 1, 'H. UAT Reset test data signs out: no propapp-auth-session, propapp-sync-account or pending link, back at the welcome screen');
  await h.ctx.close();

  // ── the single-file app: connect-src 'none' and no network at all
  const sf = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  const sp = await sf.newPage(), reqs = []; sp.on('request', r => reqs.push(r.url())); sp.on('console', m => { if (m.type() === 'error') errors.push('standalone: ' + m.text()); }); sp.on('pageerror', e => errors.push('standalone: ' + e.message));
  const STAND = path.join(OUT, 'propapp-standalone.html'); // D3-E: the build made by this run
  await sp.goto('file://' + STAND); await sp.waitForTimeout(300);
  await tapB(sp, 'Try example'); await sp.waitForTimeout(1200);
  await openMore(sp, /^Backup and devices/);
  const csp = await sp.evaluate(() => document.querySelector('meta[http-equiv=Content-Security-Policy]')?.content || '');
  ok(/connect-src 'none'/.test(csp) && await sp.evaluate(() => !window.PROPAPP_API && !window.PROPAPP_PWA && !document.getElementById('sync')), 'D. the freshly built single-file app: connect-src none, no API origin, no sync section');
  ok(reqs.length > 0 && reqs.every(u => /^(file|data|blob):/.test(u)), 'D. the single-file app made zero network requests (' + reqs.length + ' file/data loads)');
  // D3-E: the checked-in app/dist files are exactly what the build script makes now (UAT build, real API origin).
  const PAR = path.join(TMP, 'parity'); const { PROPAPP_API_ORIGIN, ...env0 } = process.env;
  execFileSync(process.execPath, [path.join(APPDIR, 'tools/build.js'), '--uat'], { env: { ...env0, PROPAPP_OUT_DIR: PAR }, stdio: 'pipe' });
  const same = f => fs.readFileSync(path.join(PAR, f), 'utf8') === fs.readFileSync(path.join(APPDIR, 'dist', f), 'utf8');
  ok(same('propapp-standalone.html') && same('propapp.html') && same('pwa/index.html') && same('pwa/sw.js'), 'D. checked-in app/dist (standalone, page, pwa/index.html, pwa/sw.js) matches a fresh --uat build of this source');
  const real = fs.readFileSync(path.join(APPDIR, 'dist/pwa/index.html'), 'utf8');
  ok(real.includes("connect-src 'self' https://pharmledger-sync.fly.dev;") && real.includes('window.PROPAPP_API="https://pharmledger-sync.fly.dev"'), 'D. the real dist/pwa build points at https://pharmledger-sync.fly.dev only');
  await sf.close();

  ok(errors.length === 0, 'no console or CSP errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : '') + ' (expected API answers Chrome noted: ' + allowed.length + ')');
  await br.close(); await app.close(); stat.close(); api.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(passes + ' passed, ' + fails + ' failed');
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed: ' + e.message); process.exit(1); });
