// Shared test helpers: phone-size browser, real taps, and failure on any console error (CLAUDE.md "How to work").
const { chromium } = require('playwright'); const path = require('path');
const APP = 'file://' + path.resolve(__dirname, '../dist/propapp-standalone.html');
async function phone(opts = {}) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: opts.viewport || { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: opts.scale || 1, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  const p = await ctx.newPage(); const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push(e.message));
  if (opts.time) await p.clock.install({ time: new Date(opts.time) });
  await p.goto(APP); await p.waitForTimeout(300);
  return { b, p, errors };
}
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const done = async (b, errors) => { ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : '')); await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); };
// Tap a button by its exact name first (so 'Reviews' means the tab, not a line that mentions reviews), else by partial name.
const tap = async (p, text, scope = 'body') => { const exact = p.locator(scope).getByRole('button', { name: text, exact: true }); if (await exact.count()) return exact.first().click(); return p.locator(scope).getByRole('button', { name: text }).first().click(); };
const text = p => p.evaluate(() => document.body.innerText);
// Read the phone's saved data (IndexedDB) for state assertions.
const saved = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); return await new Promise(res => { r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').getAll(); const k = r.result.transaction('kv').objectStore('kv').getAllKeys(); g.onsuccess = () => k.onsuccess = () => res(Object.fromEntries(k.result.map((key, i) => [key, g.result[i]]))); }; }); });
const activePh = async p => { const all = await saved(p); return all['propapp:ph:' + all['propapp:dir'].active]; };
// Tap a button that downloads a file and return its text.
const download = async (p, name) => { const [d] = await Promise.all([p.waitForEvent('download'), tap(p, name)]); const fs = require('fs'); return fs.readFileSync(await d.path(), 'utf8'); };
module.exports = { phone, ok, done, tap, text, APP, saved, activePh, download };
