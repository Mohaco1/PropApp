// Batch 1B (C-04, C-06, M-01, M-05), by real touch taps at 390×844; fails on any console error.
// C-04, C-06 and M-01 run on the UAT single file; M-05 also runs the installable app from a local server.
const { phone, ok, done, tap, text, activePh, saved } = require('./helpers.js');
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const TIME = '2026-11-27T10:00:00+11:00';
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const openProc = async (p, id) => { await more(p, 'Procedures'); await p.locator(`[data-id="${id}"]`).first().tap(); await p.waitForTimeout(300); };
const proc = async (p, id) => (await activePh(p)).procedures.find(x => x.service === id);

(async () => {
  const { b, p, errors } = await phone({ time: TIME });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);

  // ── C-04: an adopted procedure can be redrafted when its setup answers change; the adopted version is kept.
  await openProc(p, 'staged');
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(200); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(400);
  // The example's draft predates its answers, so bring it up to date and adopt that (2.0): no banner is left.
  if (await p.getByRole('button', { name: 'Update the draft' }).count()) { await tap(p, 'Update the draft'); await p.waitForTimeout(400); await tap(p, 'Adopt for use here'); await p.waitForTimeout(200); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(400); }
  let pr = await proc(p, 'staged'), adoptedV = pr.versions.at(-1).v;
  ok(pr.status === 'adopted' && !/Your setup answers changed/.test(await text(p)), 'C-04 setup: the staged supply procedure is adopted (version ' + adoptedV + ') with nothing to update');
  // Change a setup answer (funding) by tapping it on the service page.
  await more(p, 'Services'); await p.locator('[data-id="staged"]').first().tap(); await p.waitForTimeout(250);
  await p.getByRole('button', { name: /funded staged supply/ }).first().tap(); await p.waitForTimeout(300);
  await p.locator('label.tick', { hasText: 'Private' }).first().tap(); await p.waitForTimeout(300);
  ok(/Private/.test((await activePh(p)).services.staged.answers.funding), 'C-04 the changed setup answer is saved');
  await openProc(p, 'staged');
  ok(/Your setup answers changed since this draft/.test(await text(p)) && await p.getByRole('button', { name: 'Update the draft' }).count() === 1, 'C-04 the adopted procedure offers “Update the draft” after a setup answer changes');
  const n0 = (await proc(p, 'staged')).versions.length;
  await tap(p, 'Update the draft'); await p.waitForTimeout(400);
  pr = await proc(p, 'staged'); const last = pr.versions.at(-1);
  ok(pr.versions.length === n0 + 1 && last.status === 'Draft' && /Private/.test(last.body) !== /Private/.test(pr.versions.at(-2).body) || (pr.versions.length === n0 + 1 && last.status === 'Draft' && last.body !== pr.versions.at(-2).body), 'C-04 one tap adds a new Draft version written from the new answers (' + last.v + ')');
  ok(pr.versions.some(x => x.status === 'Adopted' && x.v === adoptedV), 'C-04 the adopted version ' + adoptedV + ' is still kept in the versions');
  let t = await text(p);
  ok(new RegExp('Version ' + adoptedV.replace('.', '\\.') + ', adopted .+ stays in use until you adopt this draft').test(t) && !/Your setup answers changed/.test(t), 'C-04 the draft says the adopted version stays in use until this draft is adopted');
  ok(await p.getByRole('button', { name: 'Adopt for use here' }).count() === 1, 'C-04 the owner adopts the new draft themselves (nothing is adopted for them)');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/batch1b_c04_redraft_390px.png') });
  await more(p, 'Procedures'); ok(new RegExp('Draft ' + last.v.replace('.', '\\.') + ' · version ' + adoptedV.replace('.', '\\.') + ' in use').test(await text(p)), 'C-04 the Procedures list shows the adopted version still in use');
  await p.locator('[data-id="staged"]').first().tap(); await p.waitForTimeout(300);
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(200); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(400);
  pr = await proc(p, 'staged');
  ok(pr.status === 'adopted' && pr.versions.at(-1).v === (parseInt(adoptedV, 10) + 1) + '.0' && pr.versions.filter(x => x.status === 'Adopted').length >= 2, 'C-04 adopting the new draft makes it version ' + pr.versions.at(-1).v + ', earlier adopted versions kept');

  // ── C-06: a second edit queued while the first save is merging another tab's save is merged too, never written over it.
  await tap(p, 'Today'); await p.waitForTimeout(300); await p.locator('[data-f=all]').tap(); await p.waitForTimeout(200);
  const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, S0 = all[K];
  const defers = await p.locator('button.defer').count();
  ok(defers >= 2, 'C-06 setup: Today has at least two rows that can be deferred (' + defers + ')');
  const keys = await p.locator('button.defer').evaluateAll(bs => bs.slice(0, 2).map(x => x.dataset.key));
  await p.evaluate(({ K, T1 }) => { const get = IDBObjectStore.prototype.get;
    window.__race = { K, T1 }; window.__raced = false;
    IDBObjectStore.prototype.get = function (k) { const r = window.__race;
      if (r && k === r.K && this.transaction.mode === 'readwrite') { window.__race = null;
        this.put(r.T1, k); // Tab B saved just before this save read storage
        document.querySelectorAll('button.defer')[1].click(); window.__raced = true; } // second tap while the first save is in flight
      return get.call(this, k); }; }, { K, T1: { ...S0, flags: { ...(S0.flags || {}), tabB: 'saved in the other tab' } } });
  await p.locator('button.defer').first().tap(); await p.waitForTimeout(1500);
  const after = (await saved(p))[K];
  ok(await p.evaluate(() => window.__raced), 'C-06 the second tap landed while the first save was merging');
  ok(after.flags?.tabB === 'saved in the other tab', 'C-06 the other tab’s save survives the second save (not written over)');
  ok(after.history.length >= S0.history.length + 2 && JSON.stringify(after.schedule) !== JSON.stringify(S0.schedule), 'C-06 both of this tab’s taps are saved too (' + keys.join(', ') + ')');
  await p.reload(); await p.waitForTimeout(800);
  ok((await activePh(p)).flags?.tabB === 'saved in the other tab', 'C-06 after reload the merged copy is what’s stored');

  // C-06 drafts: the other tab's new draft survives a second draft edit queued mid-save.
  await more(p, 'Meetings'); await p.locator('.list .row').first().tap(); await p.waitForTimeout(300);
  const DK = 'propapp:drafts:' + all['propapp:dir'].active, D0 = (await saved(p))[DK] || {};
  await p.evaluate(({ K, T1 }) => { window.__race = { K, T1 }; window.__raced = false; const get = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (k) { const r = window.__race;
      if (r && k === r.K && this.transaction.mode === 'readwrite') { window.__race = null; this.put(r.T1, k);
        const ta = document.querySelector('textarea[name=s1]'); ta.value = 'Second line typed while saving'; ta.dispatchEvent(new Event('input', { bubbles: true })); window.__raced = true; }
      return get.call(this, k); }; }, { K: DK, T1: { ...D0, 'visit/extra': { date: '2026-11-27', items: {}, vacc: {}, notes: 'Started in the other tab', next: '', step: 0, rev: Date.now() + 5000 } } });
  await p.fill('textarea[name=s0]', 'First line typed here'); await p.waitForTimeout(1500);
  const dr = (await saved(p))[DK] || {};
  ok(await p.evaluate(() => window.__raced) && dr['visit/extra']?.notes === 'Started in the other tab', 'C-06 drafts: the other tab’s new draft survives a second edit queued mid-save');
  ok(Object.entries(dr).some(([k, v]) => k.startsWith('meeting/') && !k.includes('conflict') && v.s0 === 'First line typed here' && v.s1 === 'Second line typed while saving'), 'C-06 drafts: both of this tab’s edits are saved');
  await p.evaluate(() => { const ta = document.querySelector('textarea[name=s1]'); ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300);

  // ── M-01 Meeting: typed minutes survive opening an open item and a reload.
  await p.reload(); await p.waitForTimeout(800);
  await more(p, 'Meetings');
  // A meeting with an action, so the next one has an item “Still open from last time”.
  await p.locator('.list .row').first().tap(); await p.waitForTimeout(300);
  await p.fill('input[name=action]', 'Order a spare fridge thermometer (fictional)'); await tap(p, 'Save meeting'); await p.waitForTimeout(400);
  await p.locator('.list .row').first().tap(); await p.waitForTimeout(300); const withOpen = /Still open from last time/i.test(await text(p)) ? 0 : -1;
  const mtg = 'Discussed the fridge alarm (fictional) and who checks it';
  await p.fill('textarea[name=s1]', mtg); await p.fill('input[name=others]', 'Relief pharmacist');
  if (withOpen >= 0) { await p.locator('.sec', { hasText: /Still open from last time/i }).locator('.row').first().tap(); await p.waitForTimeout(300); await tap(p, 'Back'); await p.waitForTimeout(300);
    ok(await p.locator('textarea[name=s1]').inputValue() === mtg && await p.locator('input[name=others]').inputValue() === 'Relief pharmacist', 'M-01 meeting: typed minutes are still there after opening an open item and coming back'); }
  else ok(false, 'M-01 meeting: a meeting with an item “Still open from last time” was found');
  await p.reload(); await p.waitForTimeout(800);
  if (!(await p.locator('textarea[name=s1]').count())) { await more(p, 'Meetings'); await p.locator('.list .row').nth(Math.max(0, withOpen)).tap(); await p.waitForTimeout(300); }
  ok(await p.locator('textarea[name=s1]').inputValue() === mtg, 'M-01 meeting: typed minutes survive a reload');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/batch1b_m01_meeting_390px.png') });
  await tap(p, 'Save meeting'); await p.waitForTimeout(400);
  const dAfter = (await saved(p))[DK] || {};
  ok((await activePh(p)).records.some(r => r.kind === 'meeting' && r.fields.sections.some(s => s.text === mtg)) && !Object.keys(dAfter).some(k => /^meeting\//.test(k) && !k.includes('conflict')), 'M-01 meeting: saving records the minutes and clears the draft');

  // ── M-01 Visit: unblurred issue text, the visit note and the next date persist to the visit draft.
  await tap(p, 'Today'); await p.waitForTimeout(300);
  const startBtn = p.getByRole('button', { name: 'Start a visit' });
  if (await startBtn.count()) await startBtn.first().tap(); else { await p.locator('[data-f=all]').tap(); await p.getByRole('button', { name: /site visit/i }).first().tap(); }
  await p.waitForTimeout(300);
  if (await p.getByRole('button', { name: 'Quarterly visit' }).count()) await tap(p, 'Quarterly visit');
  await tap(p, /Start the checks|Resume the checks/); await p.waitForTimeout(300);
  await p.locator('label', { hasText: /^Issue$/ }).first().tap(); await p.waitForTimeout(300);
  await p.locator('textarea[name=text]').fill('Sharps bin lid cracked (fictional)'); await p.waitForTimeout(400);
  const resume = async () => { if (await p.locator('form[data-form=ans], form[data-form=fin]').count()) return; await tap(p, 'Today'); await p.waitForTimeout(200); await p.locator('[data-f=all]').tap(); await p.waitForTimeout(200);
    await p.locator('.list .row', { hasText: /visit/i }).first().tap(); await p.waitForTimeout(300); if (await p.getByRole('button', { name: 'Resume the checks' }).count()) { await tap(p, 'Resume the checks'); await p.waitForTimeout(300); } };
  const vd = () => saved(p).then(a => (a[DK] || {})['visit/quarterly']);
  ok(Object.values((await vd())?.items || {}).some(x => x.text === 'Sharps bin lid cracked (fictional)'), 'M-01 visit: issue text is saved as it’s typed, before the box loses focus');
  await p.reload(); await p.waitForTimeout(800); await resume();
  ok(await p.locator('textarea[name=text]').count() && await p.locator('textarea[name=text]').inputValue() === 'Sharps bin lid cracked (fictional)', 'M-01 visit: the issue text is back after a reload');
  // Go to the finish screen.
  for (let i = 0; i < 40 && !(await p.locator('form[data-form=fin]').count()); i++) { const opt = p.locator('form[data-form=ans] label', { hasText: /^Satisfactory$/ }); const cur = await p.locator('form[data-form=ans] input[name=status]:checked').count();
    if (!cur && await opt.count()) { await opt.first().tap(); await p.waitForTimeout(150); }
    await p.locator('.btnrow button.primary').last().tap(); await p.waitForTimeout(200); }
  ok(await p.locator('form[data-form=fin]').count() === 1, 'M-01 visit: reached the finish screen');
  await p.locator('textarea[name=notes]').fill('Fridge log looked good (fictional)'); await p.locator('input[name=next]').fill('2027-02-20'); await p.waitForTimeout(400);
  let v = await vd(); ok(v?.notes === 'Fridge log looked good (fictional)' && v?.next === '2027-02-20', 'M-01 visit: the visit note and next quarterly visit are saved to the draft as they change');
  await p.reload(); await p.waitForTimeout(800); await resume();
  ok(await p.locator('textarea[name=notes]').inputValue() === 'Fridge log looked good (fictional)' && await p.locator('input[name=next]').inputValue() === '2027-02-20', 'M-01 visit: the note and next date are back after a reload');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/batch1b_m01_visit_390px.png') });

  // ── M-05 (single file, not the installable app): the preview hints stay, the Home Screen line doesn't show.
  await tap(p, 'Today'); await p.waitForTimeout(200);
  ok(!(await p.locator('.installline').count()), 'M-05 single file: no Home Screen line (not the installable app)');
  await more(p, 'Evidence pack'); ok(/claude\.ai preview/.test(await text(p)), 'M-05 single file: the evidence pack keeps its preview printing hint');
  await more(p, 'Backup and devices'); ok(/some previews block files/.test(await text(p)), 'M-05 single file: Backup keeps its preview download hint');
  await done.call(null, { close: async () => { await b.close(); await pwa(); } }, errors);
})();

// M-05 on the installable app, served locally like the Pages copy.
async function pwa() {
  const DIR = path.resolve(__dirname, '../dist/pwa'), types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  const server = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html'; const fp = path.join(DIR, f);
    if (!fp.startsWith(DIR) || !fs.existsSync(fp)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(fp).pipe(r); });
  await new Promise(res => server.listen(0, '127.0.0.1', res)); const URL = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney', serviceWorkers: 'allow' });
  const p = await ctx.newPage(); const errors = []; p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push(e.message));
  await p.clock.install({ time: new Date(TIME) });
  await p.goto(URL); await p.waitForTimeout(600);
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  const order = await p.evaluate(() => { const il = document.querySelector('.installline'); if (!il) return 'missing'; const later = [...document.querySelectorAll('main .card, main .siteline, main .filters')];
    const st = il.getBoundingClientRect(); return later.every(x => il.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) && st.top >= 0 && st.bottom <= innerHeight ? 'first' : 'late'; });
  ok(order === 'first', 'M-05 installable app in the browser: “Add PharmLedger to your Home Screen before you enter records” is above every setup and date card, on the first screen (' + order + ')');
  ok(await p.evaluate(() => [...document.querySelectorAll('.installline button')].every(x => x.getBoundingClientRect().height >= 44)), 'M-05 the Home Screen line’s buttons are at least 44 px tall');
  await p.screenshot({ path: path.resolve(__dirname, '../handoff/batch1b_m05_today_390px.png') });
  await more(p, 'Evidence pack'); ok(!/claude\.ai/.test(await text(p)), 'M-05 installable app: no claude.ai preview hint on the evidence pack');
  await more(p, 'Backup and devices'); ok(!/some previews block files/.test(await text(p)), 'M-05 installable app: no preview hint on Backup and devices');
  // Opened from the Home Screen: no install line.
  await p.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => /display-mode: standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q); });
  await p.reload(); await p.waitForTimeout(900); await tap(p, 'Today'); await p.waitForTimeout(200);
  ok(!(await p.locator('.installline').count()), 'M-05 opened from the Home Screen: no install line');
  ok(errors.length === 0, 'installable app: no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await b.close(); server.close();
}
