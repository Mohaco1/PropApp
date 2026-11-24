// V3-01 installable app (prepared, not deployed): served from a local server only. Real taps at 390×844; fails on
// any console error, including CSP violations.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const { ok, tap, done } = require('./helpers.js');
const DIR = path.resolve(__dirname, '../dist/pwa');
let swOverride = null;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html';
  if (f === '/sw.js' && swOverride) { r.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' }); return r.end(swOverride); }
  const p = path.join(DIR, f); if (!p.startsWith(DIR) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(p).pipe(r); });
(async () => {
  await new Promise(res => server.listen(0, '127.0.0.1', res)); const URL = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-AU', timezoneId: 'Australia/Sydney', serviceWorkers: 'allow' });
  const p = await ctx.newPage(); const errors = []; p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push(e.message));
  await p.goto(URL); await p.waitForTimeout(500);
  // manifest and icons
  const man = await p.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); const m = await (await fetch(l.href)).json(); const icons = await Promise.all(m.icons.map(async i => (await fetch(i.src)).status)); return { m, icons, apple: (await fetch(document.querySelector('link[rel=apple-touch-icon]').href)).status }; });
  ok(man.m.display === 'standalone' && man.m.start_url === './' && man.m.scope === './' && man.m.theme_color === '#005792' && man.icons.every(s => s === 200) && man.apple === 200, 'V3-01 manifest: standalone, relative start and scope, theme #005792, 192 and 512 icons and the Apple icon served');
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, state: r.active?.state, csp: document.querySelector('meta[http-equiv=Content-Security-Policy]').content }; });
  ok(sw.state === 'activated' && /worker-src 'self'/.test(sw.csp) && /connect-src 'self'/.test(sw.csp), 'V3-01 the offline worker registers and activates under the CSP (worker-src and connect-src self only)');
  // records, then offline reload
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3400);
  ok(await p.locator('.installline').count() === 1, 'V3-01 in a browser tab, Today suggests adding to the Home Screen');
  await p.reload(); await p.waitForTimeout(800); await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1200);
  ok(/Wattle Grove Pharmacy/.test(await p.evaluate(() => document.body.innerText)) && /overdue/.test(await p.evaluate(() => document.body.innerText)), 'V3-01 offline: the app reloads from the worker’s cache with its records');
  await ctx.setOffline(false);
  // a new worker version clears only its own old cache, never the records
  const before = await p.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('propapp-shell-')));
  swOverride = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8').replace(/propapp-shell-\w+/, 'propapp-shell-nextversion');
  await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(1500);
  const after = await p.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('propapp-shell-')));
  ok(before.length === 1 && after.length === 1 && after[0] === 'propapp-shell-nextversion', 'V3-01 a new version replaces the old shell cache (' + before[0] + ' → ' + after[0] + ')');
  ok(/Wattle Grove Pharmacy/.test(await p.evaluate(() => document.body.innerText)), 'V3-01 the records survive the worker update');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(600);
  const dev = await p.evaluate(() => document.getElementById('device')?.innerText || '');
  ok(/Add it to your Home Screen/.test(dev) && /keeps its own records, separate from Safari/.test(dev), 'V3-01 Backup and devices explains Home Screen install and the iPhone Safari separation');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/12_pwa_device_390px.png') });
  // the single-file app is unchanged: no worker, no install hints
  const sf = await b.newPage(); await sf.goto('file://' + path.resolve(__dirname, '../dist/propapp-standalone.html')); await sf.waitForTimeout(300);
  ok(await sf.evaluate(() => !window.PROPAPP_PWA && !document.querySelector('link[rel=manifest]')), 'V3-01 the single-file app has no worker or manifest');
  server.close(); await done(b, errors);
})().catch(e => { console.error(e); process.exit(1); });
