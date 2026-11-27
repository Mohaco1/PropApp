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
  const stat = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html';
    const p = path.join(PWA, f); if (!PWA || !p.startsWith(PWA) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(p).pipe(r); });
  const SPORT = await listen(stat), SITE = 'http://127.0.0.1:' + SPORT, URL = SITE + '/';
  let app = null; const log = [], held = [], holds = new Set(); let force503 = 0;
  const api = http.createServer((req, res) => {
    const pth = req.url.split('?')[0], entry = { method: req.method, path: pth, status: 0, aborted: false }; log.push(entry);
    res.on('finish', () => { entry.status = res.statusCode; }); res.on('close', () => { if (!res.writableEnded) entry.aborted = true; });
    if (req.method === 'POST' && pth === '/v1/auth/verify' && force503 > 0) { force503--; req.resume(); res.writeHead(503, { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', Vary: 'Origin' }); return res.end('{"error":"unavailable"}'); }
    if (req.method !== 'OPTIONS' && [...holds].some(h => pth.startsWith(h))) { held.push({ req, res, entry }); return; }
    app.server.emit('request', req, res);
  });
  const APORT = await listen(api), API_ORIGIN = 'http://127.0.0.1:' + APORT;
  const release = () => { for (const h of held.splice(0)) if (!h.entry.aborted) app.server.emit('request', h.req, h.res); };

  // ── build the installable app with the test API origin (same build script as dist/pwa)
  const OUT = path.join(TMP, 'dist');
  execFileSync(process.execPath, [path.join(APPDIR, 'tools/build.js'), '--uat'], { env: { ...process.env, PROPAPP_API_ORIGIN: API_ORIGIN, PROPAPP_OUT_DIR: OUT }, stdio: 'pipe' });
  PWA = path.join(OUT, 'pwa');
  const idx = fs.readFileSync(path.join(PWA, 'index.html'), 'utf8');
  ok(idx.includes(`connect-src 'self' ${API_ORIGIN};`) && idx.includes(`window.PROPAPP_PWA=true;window.PROPAPP_API=${J(API_ORIGIN)};`), '0. the built app allows only its own origin and the API in connect-src and carries PROPAPP_API');
  ok(/connect-src 'none'/.test(fs.readFileSync(path.join(OUT, 'propapp-standalone.html'), 'utf8')) && !/PROPAPP_API=|PROPAPP_PWA=/.test(fs.readFileSync(path.join(OUT, 'propapp-standalone.html'), 'utf8')), '0. the single-file app keeps connect-src none and has no API origin');
  ok(/\/\(\^\|\\\/\)v1\(\\\/\|\$\)\/\.test\(u\.pathname\)\) return;/.test(fs.readFileSync(path.join(PWA, 'sw.js'), 'utf8')), '0. the offline worker returns early for /v1/ paths (never answers or caches them)');
  let bad = 0; try { execFileSync(process.execPath, [path.join(APPDIR, 'tools/build.js')], { env: { ...process.env, PROPAPP_API_ORIGIN: 'http://api.example.com', PROPAPP_OUT_DIR: path.join(TMP, 'bad') }, stdio: 'pipe' }); } catch { bad = 1; }
  ok(bad === 1 && !fs.existsSync(path.join(TMP, 'bad')), '0. build refuses an API origin that is not https:// or http://127.0.0.1:<port>');

  // ── the back end
  const sbundle = path.join(TMP, 'server.mjs');
  await esbuild.build({ entryPoints: [path.join(ROOT, 'phase-d3/server/src/app.ts')], bundle: true, platform: 'node', target: 'node22', format: 'esm', outfile: sbundle, logLevel: 'silent' });
  const A = await import('file://' + sbundle);
  const mailer = A.memoryMailer();
  app = A.createServerApp({ dbPath: path.join(TMP, 'pl.db'), emailIndexKey: 'email-key-' + 'a'.repeat(40), logHmacKey: 'log-key-' + 'b'.repeat(40), extraOrigins: [SITE], mailer, logWrite: () => {}, appUrl: URL });
  await app.listen(0, '127.0.0.1');
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
      addEventListener('securitypolicyviolation', e => console.error('CSP violation: ' + e.violatedDirective + ' ' + e.blockedURI)); });
    const p = await ctx.newPage(), failed = [];
    p.on('console', m => { if (m.type() !== 'error') return; const t = m.text(), u = m.location()?.url || '';
      if (/^Failed to load resource: the server responded with a status of (409|503)/.test(t) && u.startsWith(API_ORIGIN)) allowed.push(name + ' ' + t.slice(60) + ' ' + u.slice(API_ORIGIN.length)); else errors.push(name + ': ' + t); });
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
  ok(await a.p.evaluate(() => sessionStorage.getItem('propapp-pending-magic')) === null && (await a.p.evaluate(() => location.hash)) === '', 'A. the link is cleared after 200');
  const reuse = await fetch(API_ORIGIN + '/v1/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: J({ token: tokA }) });
  ok(reuse.status === 401, 'A. the used link no longer works (401)');
  ok(!(await a.p.evaluate(async () => (await Promise.all((await caches.keys()).map(async k => (await (await caches.open(k)).keys()).map(r => r.url)))).flat().some(u => u.includes('/v1/')))), 'A. nothing from /v1/ is in the offline cache');
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
  ok(uniq(d1.history.map(h => h.id)) && d1.history.length === base.history.length + 2, 'B. history: every id once, both new lines kept (' + base.history.length + ' → ' + d1.history.length + ')');
  ok(Object.values(d1.actions).every(x => uniq((x.log || []).map(l => l.id))) && Object.keys(d1.actions).length === Object.keys(base.actions).length, 'B. no duplicate action or action.log ids');
  ok(d1.procedures.every(p => uniq(p.versions.map(v => v.id))) && uniq(d1.procedures.map(p => p.id)), 'B. no duplicate procedures or procedure versions');

  // ══ Test C: delete wins over the other device's stale offline edit
  await switchTo(b2.p, 'Second Test Pharmacy');
  await until(async () => !log.some(x => !x.status && !x.aborted && x.path.startsWith('/v1/sync/')), 5000);
  await b2.ctx.setOffline(true);
  await openMore(b2.p, /^Pharmacy details/); await b2.p.locator('input[name=address]').fill('Stale offline edit (fictional)'); await tapB(b2.p, 'Save'); await b2.p.waitForTimeout(300);
  await openMore(b1.p, /^Pharmacies on this device/); await tapB(b1.p, 'Archive or delete a pharmacy'); await b1.p.waitForTimeout(200);
  await tapB(b1.p, 'Delete'); await b1.p.waitForTimeout(150); await tapB(b1.p, 'Tap again to delete for good'); await b1.p.waitForTimeout(300);
  const delAt = await until(() => vault(s1.accountId, PH2).deletedAt, 8000);
  ok(!!delAt && vault(s1.accountId, PH2).rev === 2 && vault(s1.accountId, PH2).pharmacy === null, 'C. device 1 deletes it (two taps) and the tombstone reaches the server (rev 2)');
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
  await d.ctx.close();

  const signInFresh = async (d, email) => { const before = mailer.outbox.length;
    await fetch(API_ORIGIN + '/v1/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: J({ email }) });
    await until(() => mailer.outbox.length > before); await d.p.goto('about:blank'); await d.p.goto(URL + '#magic=' + linkFor(email)); return until(() => session(d.p)); };
  const idle = () => until(async () => !log.some(x => !x.status && !x.aborted && (x.path.startsWith('/v1/sync/') || x.path === '/v1/vault')), 6000);
  const delOther = async (p, name) => { await openMore(p, /^Pharmacies on this device/); await tapB(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(200);
    const rowEl = p.locator('.row.static', { hasText: name }); await rowEl.getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(150);
    await rowEl.getByRole('button', { name: 'Tap again to delete for good' }).click(); await p.waitForTimeout(400); };

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

  // ── the single-file app: connect-src 'none' and no network at all
  const sf = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  const sp = await sf.newPage(), reqs = []; sp.on('request', r => reqs.push(r.url())); sp.on('console', m => { if (m.type() === 'error') errors.push('standalone: ' + m.text()); }); sp.on('pageerror', e => errors.push('standalone: ' + e.message));
  const STAND = path.join(APPDIR, 'dist/propapp-standalone.html');
  await sp.goto('file://' + STAND); await sp.waitForTimeout(300);
  await tapB(sp, 'Try example'); await sp.waitForTimeout(1200);
  await openMore(sp, /^Backup and devices/);
  const csp = await sp.evaluate(() => document.querySelector('meta[http-equiv=Content-Security-Policy]')?.content || '');
  ok(/connect-src 'none'/.test(csp) && await sp.evaluate(() => !window.PROPAPP_API && !window.PROPAPP_PWA && !document.getElementById('sync')), 'D. dist/propapp-standalone.html: connect-src none, no API origin, no sync section');
  ok(reqs.length > 0 && reqs.every(u => /^(file|data|blob):/.test(u)), 'D. the single-file app made zero network requests (' + reqs.length + ' file/data loads)');
  const real = fs.readFileSync(path.join(APPDIR, 'dist/pwa/index.html'), 'utf8');
  ok(real.includes("connect-src 'self' https://api.pharmledger.com.au;") && real.includes('window.PROPAPP_API="https://api.pharmledger.com.au"'), 'D. the real dist/pwa build points at https://api.pharmledger.com.au only');
  await sf.close();

  ok(errors.length === 0, 'no console or CSP errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : '') + ' (expected API answers Chrome noted: ' + allowed.length + ')');
  await br.close(); await app.close(); stat.close(); api.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(passes + ' passed, ' + fails + ' failed');
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed: ' + e.message); process.exit(1); });
