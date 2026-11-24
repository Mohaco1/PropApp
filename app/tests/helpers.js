// Shared test helpers: phone-size browser, real taps, and failure on any console error (CLAUDE.md "How to work").
const { chromium } = require('playwright'); const path = require('path');
const APP = 'file://' + path.resolve(__dirname, '../dist/propapp-standalone.html');
async function phone(opts = {}) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: opts.viewport || { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: opts.scale || 1, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  const p = await ctx.newPage(); const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push(e.message));
  if (opts.time) await p.clock.install({ time: new Date(opts.time) });
  // Clipboard stand-in (P-05): a file:// page can't use the real clipboard, so Copy buttons write here and tests read it back.
  if (opts.clip) await p.addInitScript(() => { window.__clip = []; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__clip.push(String(t)); } }, configurable: true }); });
  await p.goto(APP); await p.waitForTimeout(300);
  return { b, p, errors };
}
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const done = async (b, errors) => { ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : '')); await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); };
// Tap a button by its exact name first (so 'Reviews' means the tab, not a line that mentions reviews), else by partial name.
const tap = async (p, text, scope = 'body') => { const exact = p.locator(scope).getByRole('button', { name: text, exact: true }); if (await exact.count()) return exact.first().click(); return p.locator(scope).getByRole('button', { name: text }).first().click(); };
const text = p => p.evaluate(() => document.body.innerText);
// Tap a Copy button and return what reached the clipboard plus the confirmation shown.
const copied = async (p, name, scope) => { const before = await p.evaluate(() => window.__clip.length); await tap(p, name, scope); await p.waitForFunction(n => window.__clip.length > n, before); await p.waitForTimeout(80); return { clip: await p.evaluate(() => window.__clip[window.__clip.length - 1]), toast: await p.evaluate(() => document.querySelector('.toast')?.innerText || '') }; };
// Read the phone's saved data (IndexedDB) for state assertions.
const saved = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); return await new Promise(res => { r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').getAll(); const k = r.result.transaction('kv').objectStore('kv').getAllKeys(); g.onsuccess = () => k.onsuccess = () => res(Object.fromEntries(k.result.map((key, i) => [key, g.result[i]]))); }; }); });
const activePh = async p => { const all = await saved(p); return all['propapp:ph:' + all['propapp:dir'].active]; };
// Tap a button that downloads a file and return its text.
const download = async (p, name) => { const [d] = await Promise.all([p.waitForEvent('download'), tap(p, name)]); const fs = require('fs'); return fs.readFileSync(await d.path(), 'utf8'); };
// Another device saves a newer copy of the extra-visit draft (written straight into storage, as that device would);
// the next change on this phone then keeps its own older copy as a conflict copy (S5-02). Call with the visit open.
const otherDeviceSaves = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); const dbh = await new Promise(res => { r.onsuccess = () => res(r.result); });
  const dir = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get('propapp:dir'); g.onsuccess = () => res(g.result); });
  const k = 'propapp:drafts:' + dir.active; const cur = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result); });
  cur['visit/extra'] = { ...cur['visit/extra'], notes: 'Changed on the other device', rev: Date.now() + 99999 };
  await new Promise(res => { const tx = dbh.transaction('kv', 'readwrite'); tx.objectStore('kv').put(cur, k); tx.oncomplete = res; }); });
module.exports = { otherDeviceSaves, copied, phone, ok, done, tap, text, APP, saved, activePh, download };
