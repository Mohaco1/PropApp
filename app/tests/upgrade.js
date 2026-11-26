// Hardening item 7: upgrading the installed phone app with work in progress. Serves the old build (07775c5947, from git)
// under /PropApp/, adds an open action and a half-finished visit, switches the server to the new build, then reopens
// offline. Real taps at 390×844; fails on any console error.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { ok, done } = require('./helpers.js');
const OLD = fs.mkdtempSync(path.join(os.tmpdir(), 'sigil-old-')), NEW = path.resolve(__dirname, '../dist/pwa'), ROOT = path.resolve(__dirname, '../..');
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-180.png', 'icon-192.png', 'icon-512.png']) fs.writeFileSync(path.join(OLD, f), execFileSync('git', ['-C', ROOT, 'show', 'e7c88d2:docs/' + f], { maxBuffer: 64 * 1024 * 1024 }));
let DIR = OLD; const T = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (!u.startsWith('/PropApp/')) { r.writeHead(404); return r.end(); } u = u.slice(8); if (u === '/') u = '/index.html';
  const f = path.join(DIR, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(f).pipe(r); });
const build = p => p.evaluate(() => document.querySelector('meta[name=propapp-build]')?.content);
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL = 'http://127.0.0.1:' + srv.address().port + '/PropApp/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'en-AU', timezoneId: 'Australia/Sydney', serviceWorkers: 'allow' });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(800);
  ok(await build(p) === '07775c5947', 'Item 7: the old phone app (07775c5947) is running');
  await p.getByRole('button', { name: 'Try example' }).click(); await p.waitForTimeout(3300);
  await p.getByRole('button', { name: 'Actions', exact: true }).click(); await p.getByRole('button', { name: 'Add an action', exact: true }).first().click(); await p.fill('input[name=title]', 'Open action before update (fictional)'); await p.getByRole('button', { name: 'Save action' }).click(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Today', exact: true }).click(); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await p.getByRole('button', { name: 'Start the checks' }).click(); await p.waitForTimeout(300);
  for (let i = 0; i < 2; i++) { await p.locator('label.choice', { hasText: /^Satisfactory$/ }).first().click(); await p.waitForTimeout(100); await p.getByRole('button', { name: /^Next$/ }).click(); await p.waitForTimeout(250); }
  const stepBefore = (await p.evaluate(() => document.body.innerText)).match(/Check (\d+) of/)?.[1];
  await p.waitForTimeout(600);
  // the update arrives: the server now has the new build
  DIR = NEW; await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r?.update(); }); await p.waitForTimeout(1500);
  await p.reload(); await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(1500);
  const newBuild = fs.readFileSync(path.join(NEW, 'index.html'), 'utf8').match(/name="propapp-build" content="([^"]+)"/)[1];
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
  const t = await p.evaluate(() => document.body.innerText);
  ok(await build(p) === newBuild && /Wattle Grove Pharmacy/.test(t), 'Item 7: offline, the app opens on the new build (' + newBuild + ') with its records');
  await p.getByRole('button', { name: 'Actions', exact: true }).click(); await p.waitForTimeout(200);
  ok(/Open action before update \(fictional\)/.test(await p.evaluate(() => document.body.innerText)), 'Item 7: the open action made before the update is still there');
  await p.getByRole('button', { name: 'Today', exact: true }).click(); await p.waitForTimeout(200);
  await p.locator('[data-act=resume-visit]').first().click(); await p.waitForTimeout(400);
  const stepAfter = (await p.evaluate(() => document.body.innerText)).match(/Check (\d+) of/)?.[1];
  ok(stepBefore && stepAfter === stepBefore, 'Item 7: the half-finished visit resumes at the same check (' + stepBefore + ' → ' + stepAfter + ')');
  await ctx.setOffline(false); srv.close(); await done(b, errors);
})().catch(e => { console.error(e); process.exit(1); });
