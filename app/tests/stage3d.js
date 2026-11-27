// Stage 3D (storage, backup and offline worker safety), by real taps at 390×844; fails on any unexpected console error.
// 1. A restore whose write fails (storage full) shows an error, keeps what was there and writes no stamp; the second
//    pick must be the same pharmacy by id (not just the same name); restoring an archived pharmacy unarchives it.
// 2. Storage switched off (SecurityError) still starts the app; a replayed journal entry is removed only once the write
//    commits; a restore stamps its pharmacy and drafts; an older "replace" leftover is discarded; a new pharmacy's first
//    save journals the directory with it; the localStorage fallback writes under a Web Lock.
// 3. Pharmacy details refuses a name of only spaces; a restore refuses non-object drafts, staff without services,
//    unsafe keys and bad conflict-copy times; a bad conflict-copy time already stored can't break the Backup screen.
// 4. The offline worker opens the cached app on a 503, only caches a page of its own build, and a tab running an older
//    build reloads when a new worker takes over.
const { chromium } = require('playwright'); const http = require('http');
const { phone, ok, done, tap, text, saved, download, APP } = require('./helpers.js');
const path = require('path'); const fs = require('fs'); const os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stage3d-'));
const QUOTA = 'stage3d quota (test)';
// Storage that refuses writes while a flag is set, as a full phone does.
const failPut = () => { const tx = IDBDatabase.prototype.transaction; IDBDatabase.prototype.transaction = function (st, mode, ...a) { if (mode === 'readwrite' && localStorage.getItem('stage3d-failput') === '1') throw new DOMException('stage3d quota (test)', 'QuotaExceededError'); return tx.call(this, st, mode, ...a); }; };
const setFail = (p, on) => p.evaluate(on => on ? localStorage.setItem('stage3d-failput', '1') : localStorage.removeItem('stage3d-failput'), on);
const writeIDB = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const lsKeys = (p, pre) => p.evaluate(pre => Object.keys(localStorage).filter(k => k.startsWith(pre)), pre);
const backupScreen = async p => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: /^Backup and devices/ }).first().click(); await p.waitForTimeout(400); };
const pick = async (p, file) => { await p.locator('input[type=file]').setInputFiles(file); await p.waitForTimeout(900); };
const toast = p => p.evaluate(() => document.querySelector('.toast')?.innerText || '');
const title = p => p.evaluate(() => document.querySelector('.pane-detail .bar-title, .bar-title')?.innerText || '');
const file = (name, obj) => { const f = path.join(TMP, name); fs.writeFileSync(f, typeof obj === 'string' ? obj : JSON.stringify(obj)); return f; };

(async () => {
  const { b, p, errors } = await phone();
  await p.addInitScript(failPut); await p.reload(); await p.waitForTimeout(400);
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  await backupScreen(p);
  const bk = JSON.parse(await download(p, 'Download a backup')), ID = bk.pharmacy.id, K = 'propapp:ph:' + ID, DK = 'propapp:drafts:' + ID;
  const full = file('full.json', bk);

  // ── 1a. A restore whose write fails: an error, no receipt, the device keeps what it had, no stamp written.
  await tap(p, 'More'); await p.getByRole('button', { name: /^Pharmacy details/ }).first().click(); await p.waitForTimeout(300);
  await p.locator('input[name=name]').fill('Wattle Grove Pharmacy edited (fictional)'); await tap(p, 'Save'); await p.waitForTimeout(500);
  await backupScreen(p);
  await pick(p, full); ok(/already on this device/.test(await text(p)), '1. the first pick of a backup for a pharmacy already here asks to choose it again');
  await setFail(p, true); await pick(p, full);
  const failToast = await toast(p), failTitle = await title(p); await setFail(p, false);
  ok(/Couldn’t save on this device/.test(failToast) && !/Restored/.test(failTitle), '1. storage full during the restore: an error, not the receipt (' + failToast.slice(0, 50) + ' · ' + failTitle + ')');
  await p.waitForTimeout(400); let all = await saved(p);
  ok(all[K].name === 'Wattle Grove Pharmacy edited (fictional)' && all['propapp:dir'].active === ID, '1. the stored pharmacy is still the edited one: nothing was half-restored');
  ok((await lsKeys(p, 'propapp-restored:')).length === 0 && (await lsKeys(p, 'propapp-journal:')).length === 0, '1. a failed restore writes no restore stamp and leaves no journal entry');
  await p.reload(); await p.waitForTimeout(900);
  ok(/edited/.test(await text(p)), '1. after a reload the device still has the edited pharmacy (the failed restore was taken back, not retried later)');

  // ── 1b. The replace confirmation is tied to the pharmacy id: another pharmacy with the same name doesn't confirm it.
  const ID2 = 'stage3d-twin', twin = { ...bk.pharmacy, id: ID2, name: 'Wattle Grove Pharmacy edited (fictional)' };
  const dir0 = all['propapp:dir']; await writeIDB(p, 'propapp:ph:' + ID2, twin); await writeIDB(p, 'propapp:dir', { ...dir0, ids: [...dir0.ids, ID2], archived: [ID2] });
  await p.reload(); await p.waitForTimeout(900); await backupScreen(p);
  const fOne = file('one.json', { ...bk, pharmacy: { ...bk.pharmacy, name: 'Wattle Grove Pharmacy edited (fictional)' } }), fTwin = file('twin.json', { ...bk, pharmacy: { ...twin, name: 'Restored twin (fictional)' } });
  await pick(p, fOne); await pick(p, fTwin);
  ok(!/Restored/.test(await title(p)) && /already on this device/.test(await text(p)), '1. arming the replace for one pharmacy, then picking another with the same name, asks again instead of replacing');
  // ── 1c. Confirming the twin (archived) restores it open and unarchived.
  await pick(p, fTwin); all = await saved(p);
  ok(/Restored/.test(await title(p)) && all['propapp:dir'].active === ID2 && !(all['propapp:dir'].archived || []).includes(ID2), '1. restoring an archived pharmacy opens it and takes it out of the archive (' + JSON.stringify(all['propapp:dir'].archived) + ')');
  // ── 2c. The restore stamped both its pharmacy and its drafts, after the write.
  const stamps = await lsKeys(p, 'propapp-restored:');
  ok(stamps.includes('propapp-restored:propapp:ph:' + ID2) && stamps.includes('propapp-restored:propapp:drafts:' + ID2), '2. a restore stamps its pharmacy and its drafts (' + stamps.length + ' stamps)');
  ok(/Checked: every count matches the backup file/.test(await text(p)), '1. the successful restore’s receipt matches the file');

  // ── 2d. A "replace" leftover saved before that restore is discarded, not replayed over it.
  const stampAt = Number(await p.evaluate(k => localStorage.getItem(k), 'propapp-restored:propapp:ph:' + ID2));
  await p.evaluate(({ ID2, ph, at }) => localStorage.setItem('propapp-journal:old:propapp:ph:' + ID2, JSON.stringify({ v: { ...ph, name: 'Stale replace (fictional)' }, base: null, at, baseAt: 0, replace: true })), { ID2, ph: twin, at: stampAt - 5000 });
  await p.reload(); await p.waitForTimeout(900); all = await saved(p);
  ok(all['propapp:ph:' + ID2].name === 'Restored twin (fictional)' && !/Stale replace/.test(await text(p)) && !(await lsKeys(p, 'propapp-journal:')).length, '2. an older “replace” journal entry is discarded after a restore (name: ' + all['propapp:ph:' + ID2].name + ')');

  // ── 2b. A replayed journal entry stays until IndexedDB has committed it.
  const cur = all['propapp:ph:' + ID2], jk = 'propapp-journal:crash:propapp:ph:' + ID2;
  await p.evaluate(({ jk, cur }) => localStorage.setItem(jk, JSON.stringify({ v: { ...cur, address: '1 Journal Lane (fictional)' }, base: cur, at: Date.now(), baseAt: Date.now(), replace: false })), { jk, cur });
  await setFail(p, true); await p.reload(); await p.waitForTimeout(1200);
  const kept = (await lsKeys(p, 'propapp-journal:')).includes(jk); await setFail(p, false);
  ok(kept, '2. a journal replay whose write fails keeps its journal entry for the next start');
  await p.reload(); await p.waitForTimeout(1200); all = await saved(p);
  ok(all['propapp:ph:' + ID2].address === '1 Journal Lane (fictional)' && !(await lsKeys(p, 'propapp-journal:')).includes(jk), '2. once the replay commits, the change is saved and the journal entry removed');

  // ── 3a. Pharmacy details: a name of only spaces is refused, and nothing is saved.
  await tap(p, 'More'); await p.getByRole('button', { name: /^Pharmacy details/ }).first().click(); await p.waitForTimeout(300);
  await p.locator('input[name=name]').fill('   '); await tap(p, 'Save'); await p.waitForTimeout(400);
  ok(/Enter the pharmacy name\./.test(await text(p)) && /Pharmacy details/.test(await title(p)) && (await saved(p))['propapp:ph:' + ID2].name === 'Restored twin (fictional)', '3. Pharmacy details refuses a name of only spaces and stays open');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/stage3d_blank_name_390px.png') });
  await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(300);

  // ── 3b. Restore refuses damaged parts; nothing is changed.
  await backupScreen(p); const before = JSON.stringify((await saved(p))['propapp:ph:' + ID2]);
  const staffNoSvc = { ...bk, pharmacy: { ...bk.pharmacy, staff: bk.pharmacy.staff.map((s, i) => { if (i) return s; const { services, ...rest } = s; return rest; }) } };
  const protoText = JSON.stringify(bk).replace('"pharmacy":{', '"pharmacy":{"__proto__":{"polluted":true},');
  const cases = [['drafts as a list', { ...bk, drafts: [] }], ['a draft that is text', { ...bk, drafts: { 'review/S8': 'text' } }], ['staff without services', staffNoSvc], ['a __proto__ key', protoText],
    ['conflict copy with letters', { ...bk, drafts: { 'review/S8/conflict-abc': { answers: {} } } }], ['conflict copy out of range', { ...bk, drafts: { 'review/S8/conflict-999999999999999': { answers: {} } } }]];
  for (const [n, body] of cases) { await pick(p, file('bad.json', body)); const t = await toast(p);
    ok(/This backup is damaged/.test(t) && !/Restored/.test(await title(p)), '3. a restore refuses ' + n + ' (' + t.slice(0, 70) + ')'); }
  ok(JSON.stringify((await saved(p))['propapp:ph:' + ID2]) === before && ({}).polluted === undefined, '3. after the refused files the stored pharmacy is unchanged and nothing reached Object.prototype');

  // ── 3c. A bad conflict-copy time already in storage shows as “an earlier save”, never breaks the screen.
  const dr = (await saved(p))['propapp:drafts:' + ID2] || {}; await writeIDB(p, 'propapp:drafts:' + ID2, { ...dr, 'review/S8/conflict-99999999999999999': { answers: { a: 'Yes' } } });
  await p.reload(); await p.waitForTimeout(900); await backupScreen(p);
  const bt = await text(p);
  ok(/Conflict copies · 1/i.test(bt) && /copy from an earlier save/.test(bt) && !/Something went wrong/.test(bt), '3. a bad conflict-copy time renders as “an earlier save” on Backup and devices');
  await p.locator('#storage').scrollIntoViewIfNeeded().catch(() => {}); await p.getByText('Conflict copies').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.resolve(__dirname, '../handoff/stage3d_conflict_copy_390px.png') });
  await b.close();

  // ── 2a. Storage switched off: localStorage and IndexedDB both throw SecurityError; the app still starts.
  const b2 = await chromium.launch(); const ctxOpts = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' };
  let c2 = await b2.newContext(ctxOpts), q = await c2.newPage(); const e2 = []; q.on('pageerror', e => e2.push(e.message)); q.on('console', m => { if (m.type() === 'error') e2.push(m.text()); });
  await q.addInitScript(() => { const deny = () => { throw new DOMException('denied (test)', 'SecurityError'); }; Object.defineProperty(window, 'localStorage', { get: deny, configurable: true }); Object.defineProperty(window, 'indexedDB', { get: deny, configurable: true }); });
  await q.goto(APP); await q.waitForTimeout(800);
  ok(await q.getByRole('button', { name: 'Try example' }).count() === 1 && !e2.length, '2. with storage denied (SecurityError) the app still starts at the welcome screen' + (e2.length ? ': ' + e2[0] : ''));
  await c2.close();

  // ── 2f. localStorage fallback (no IndexedDB): saves are written under a Web Lock.
  c2 = await b2.newContext(ctxOpts); q = await c2.newPage(); q.on('pageerror', e => e2.push(e.message)); q.on('console', m => { if (m.type() === 'error') e2.push(m.text()); });
  await q.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('no idb (test)', 'SecurityError'); }, configurable: true });
    window.__locks = 0; const req = navigator.locks.request.bind(navigator.locks); navigator.locks.request = (name, ...a) => { if (name === 'propapp-ls-write') window.__locks++; return req(name, ...a); }; });
  await q.goto(APP); await q.waitForTimeout(500); await q.getByRole('button', { name: 'Try example' }).click(); await q.waitForTimeout(3400);
  const ls = await q.evaluate(() => ({ locks: window.__locks, dir: JSON.parse(localStorage.getItem('propapp:dir') || 'null') }));
  ok(ls.locks > 0 && ls.dir?.ids?.length === 1 && /Wattle Grove/.test(await text(q)), '2. on the localStorage fallback every save runs under a Web Lock (' + ls.locks + ' locked writes)');
  ok(!e2.length, '2. no console errors with storage denied or on the fallback' + (e2.length ? ': ' + e2.slice(0, 2).join(' | ') : ''));
  await c2.close();

  // ── 2e. A new pharmacy's first save journals the directory with it at once (IndexedDB refusing the write).
  c2 = await b2.newContext(ctxOpts); q = await c2.newPage(); const e3 = []; q.on('pageerror', e => e3.push(e.message)); q.on('console', m => { if (m.type() === 'error') e3.push(m.text()); });
  await q.addInitScript(failPut); await q.goto(APP); await q.waitForTimeout(500); await setFail(q, true);
  await q.getByRole('button', { name: 'Try example' }).click(); await q.waitForTimeout(200);
  const jkeys = await lsKeys(q, 'propapp-journal:');
  ok(jkeys.some(k => k.endsWith(':propapp:dir')) && jkeys.some(k => /:propapp:ph:/.test(k)), '2. the first save of a new pharmacy journals the pharmacy and the directory together (' + jkeys.length + ' entries)');
  await q.waitForTimeout(800); await setFail(q, false); await q.reload(); await q.waitForTimeout(1200);
  const d3 = (await saved(q))['propapp:dir'];
  ok(d3?.ids?.length === 1 && !!(await saved(q))['propapp:ph:' + d3.ids[0]] && !(await lsKeys(q, 'propapp-journal:')).length, '2. after the restart the new pharmacy is saved and listed, and the journal is clear');
  ok(e3.every(m => m.includes(QUOTA)), '2. only the expected storage-full errors were logged' + (e3.some(m => !m.includes(QUOTA)) ? ': ' + e3.find(m => !m.includes(QUOTA)) : ''));
  await b2.close();

  // ── 4. Offline worker: 503 fallback, build check before caching, reload when a new worker takes an older tab.
  const DIR = path.resolve(__dirname, '../dist/pwa'), html0 = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8'), BUILD = /name="propapp-build" content="([0-9a-f]+)"/.exec(html0)[1];
  let mode = '', swOverride = null; const NEXT = 'f00dfacade';
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  const server = http.createServer((rq, rs) => { let f = decodeURIComponent(rq.url.split('?')[0]); if (f === '/') f = '/index.html';
    if (f === '/index.html' && mode === '503') { rs.writeHead(503, { 'content-type': 'text/html' }); return rs.end('<h1>Service Unavailable</h1>'); }
    if (f === '/index.html' && mode === 'other') { rs.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' }); return rs.end(html0.split(BUILD).join('0000000000')); }
    if (f === '/index.html' && mode === 'next') { rs.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' }); return rs.end(html0.split(BUILD).join(NEXT)); }
    if (f === '/sw.js' && swOverride) { rs.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' }); return rs.end(swOverride); }
    const fp = path.join(DIR, f); if (!fp.startsWith(DIR) || !fs.existsSync(fp)) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'content-type': types[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(fp).pipe(rs); });
  await new Promise(res => server.listen(0, '127.0.0.1', res)); const URL = 'http://127.0.0.1:' + server.address().port + '/';
  const b3 = await chromium.launch(); const c3 = await b3.newContext({ ...ctxOpts, serviceWorkers: 'allow' }); const w = await c3.newPage(); const e4 = [];
  w.on('pageerror', e => e4.push(e.message)); w.on('console', m => { if (m.type() === 'error' && !/503/.test(m.text())) e4.push(m.text()); });
  await w.goto(URL); await w.evaluate(() => navigator.serviceWorker.ready); await w.reload(); await w.waitForTimeout(600);
  const cachedBuild = () => w.evaluate(async () => { const r = await caches.match('./index.html'); return r ? (/name="propapp-build" content="([0-9a-f]+)"/.exec(await r.text()) || [])[1] : ''; });
  ok(await w.evaluate(() => !!navigator.serviceWorker.controller) && await cachedBuild() === BUILD, '4. the worker controls the page and its cached shell is build ' + BUILD);
  mode = '503'; await w.reload(); await w.waitForTimeout(900);
  ok(await w.getByRole('button', { name: 'Try example' }).count() === 1 && !/Service Unavailable/.test(await text(w)), '4. a 503 from the server opens the cached app instead of the error page');
  await w.screenshot({ path: path.resolve(__dirname, '../handoff/stage3d_sw_503_fallback_390px.png') });
  mode = 'other'; await w.reload(); await w.waitForTimeout(900);
  ok(await cachedBuild() === BUILD, '4. a page with another build marker is shown but never stored as the offline shell');
  mode = ''; await w.reload(); await w.waitForTimeout(600);
  await w.evaluate(() => { window.__oldTab = true; });
  mode = 'next'; swOverride = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8').split(BUILD).join(NEXT);
  await w.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await w.waitForFunction(() => !window.__oldTab, null, { timeout: 8000 }).catch(() => {}); await w.waitForTimeout(800);
  const after = await w.evaluate(() => ({ old: !!window.__oldTab, build: window.PROPAPP_BUILD, mark: sessionStorage.getItem('propapp-sw-reload') }));
  ok(!after.old && after.build === NEXT && after.mark === NEXT && await cachedBuild() === NEXT, '4. a new worker taking over an older tab reloads it once into the new build (' + JSON.stringify(after) + ')');
  ok(!e4.length, '4. no console errors in the installable app' + (e4.length ? ': ' + e4.slice(0, 2).join(' | ') : ''));
  await b3.close(); server.close();

  for (let i = errors.length - 1; i >= 0; i--) if (errors[i].includes(QUOTA)) errors.splice(i, 1);
  await done(b, errors);
})().catch(e => { console.error('FAIL crashed', e); process.exit(1); });
