// Stage 3A (inspector red-team and walkthrough fixes), by real taps at 390 × 844 on the example pharmacy; fails on any
// console error. Where a check needs data the example lacks, it is written into the phone's storage first, as the app
// would have saved it, then read back through the screens, the printed pack and the downloaded calendar file.
// 1. A review answer that reveals "Note (optional)" doesn't move on by itself.
// 2. Today's Finish setting up rows open their own setup; the calendar line waits for a date; You're all set links to
//    Procedures; "Change my setup answer instead" only shows when a setup question covers the marker.
// 3. The evidence pack says "Completed with issues", includes My log, Other documents, amendments and who adopted, keeps
//    the adopted version apart from a pending draft, and every printed date (pack and History) carries the year.
// 4. The calendar file never carries a staff member's name or credential.
const { phone, ok, done, tap, text, activePh, saved, download } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const TIME = '2026-11-27T10:00:00+11:00';
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph);
  await p.evaluate(async ({ K, ph }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, K); tx.oncomplete = res; }); }, { K, ph });
  await p.reload(); await p.waitForTimeout(900); };
// The example has an extra visit in progress, which Today shows before the setup card: clear it first.
const noVisit = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  const get = k => new Promise(res => { const g = db.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result); });
  const dir = await get('propapp:dir'), k = 'propapp:drafts:' + dir.active, d = (await get(k)) || {}; delete d['visit/extra']; delete d['visit/quarterly'];
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(d, k); tx.oncomplete = res; }); });
const qn = async p => +((await text(p)).match(/Question (\d+) of/) || [])[1];
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const { b, p, errors } = await phone({ time: TIME });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  const shot = n => p.screenshot({ path: path.join(SHOTS, 'stage3a_' + n + '_390px.png') });

  // ── 1. S8 review: tapping "Completed" reveals the note box and stays on the question.
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: 'Start review', exact: true }).count()) await tap(p, 'Start review');
  await p.waitForTimeout(300); const q0 = await qn(p);
  const clean = p.locator('form[data-form="q"] label').filter({ hasNotText: /Incomplete|issue/i }).first();
  const optName = (await clean.innerText()).trim(); await clean.tap(); await p.waitForTimeout(1200);
  ok(await qn(p) === q0, '1. after tapping “' + optName + '” the review stays on question ' + q0 + ' (no auto-advance, 1.2 s later)');
  ok(await p.locator('textarea[name="note"]').isVisible(), '1. the “Note (optional)” box it revealed is still on screen to tap');
  await p.locator('textarea[name="note"]').tap(); await p.keyboard.type('Checked against the register (fictional)'); await p.waitForTimeout(700);
  ok(await qn(p) === q0, '1. typing in the note never moves the question on');
  await shot('review_note'); await tap(p, 'Next'); await p.waitForTimeout(300);
  ok(await qn(p) === q0 + 1, '1. one tap on Next moves on (Q' + q0 + ' → Q' + (await qn(p)) + ')');
  const dr = (await saved(p)); const drafts = dr['propapp:drafts:' + dr['propapp:dir'].active] || {};
  ok(Object.values(drafts).some(d => Object.values(d?.notesQ || {}).some(n => /register \(fictional\)/.test(n))), '1. the note typed before Next is saved with the answer');
  await tap(p, 'Previous'); await p.waitForTimeout(300); await p.locator('form[data-form="q"] label').filter({ hasNotText: new RegExp('^' + optName + '$') }).filter({ hasNotText: /Incomplete|issue/i }).first().tap().catch(() => {});
  await p.waitForTimeout(1000); ok(await qn(p) === q0, '1. changing the answer also stays put');

  // ── 2a. Today's Finish setting up: each service still to set up opens its own setup.
  const ph0 = await activePh(p), svcs = Object.keys(ph0.services).filter(k => ph0.services[k].active);
  const target = svcs[1] || svcs[0];
  await noVisit(p); await patch(p, ph => { ph.services[target].setup = 'todo'; delete ph.services[target].pos; if (ph.flags) { delete ph.flags.setupLater; delete ph.flags.icsHint; } });
  await tap(p, 'Today'); await p.waitForTimeout(300);
  let t = await text(p); ok(/Finish setting up/i.test(t), '2. Today shows Finish setting up with one service still to do');
  const goBtn = p.locator('.checklist .checkgo').first();
  ok(await goBtn.count() === 1, '2. the one service still to set up is a tappable row (done services are not)');
  const bb = await goBtn.boundingBox(); ok(bb && bb.height >= 44, '2. the row is at least 44 px tall (' + Math.round(bb?.height || 0) + ')');
  ok(await p.getByRole('button', { name: 'Add due dates to your phone calendar' }).count() === 1, '2. with dates on Today, the calendar line shows');
  await shot('finish_setup'); await goBtn.tap(); await p.waitForTimeout(400);
  const svcName = (await p.locator('h1').first().innerText()).trim();
  const want = { daa: 'Dose administration aids', staged: 'Staged supply', otp: 'Opioid Treatment Program', vaccination: 'Vaccination', delivery: 'Home delivery' }[target];
  ok(svcName.startsWith(want) && await p.locator('form').count() > 0 && !/Services/.test(svcName), '2. tapping it opens that service’s own setup questions (' + svcName + '), not the Services list');

  // ── 2b. The calendar line waits until there is a service set up or a date.
  await patch(p, ph => { for (const k of Object.keys(ph.services)) ph.services[k].setup = 'todo'; ph.records = []; ph.schedule = {}; ph.actions = {}; ph.staff = []; for (const pr of ph.procedures) pr.status = 'draft'; if (ph.flags) delete ph.flags.icsHint; });
  await tap(p, 'Today'); await p.waitForTimeout(300); t = await text(p);
  await p.locator('.filters button').filter({ hasText: 'All' }).first().tap(); await p.waitForTimeout(200);
  const rights = await p.evaluate(() => [...document.querySelectorAll('.list .row-right')].map(e => e.innerText));
  ok(/Finish setting up/i.test(t) && rights.every(r => !/\d/.test(r)) && !/Add due dates to your phone calendar/.test(t), '2. with no service set up and no date, “Add due dates to your phone calendar” is hidden (' + rights.length + ' undated rows)');
  await p.close().catch(() => {});
  // fresh example for the rest
  const P2 = await phone({ time: TIME }); const p2 = P2.p; await tap(p2, 'Try example'); await p2.waitForTimeout(3400);
  const shot2 = n => p2.screenshot({ path: path.join(SHOTS, 'stage3a_' + n + '_390px.png') });

  // ── 2c. You're all set links to Procedures. Every service set up except one, whose answers are all in; finish it.
  const phA = await activePh(p2), act = Object.keys(phA.services).filter(k => phA.services[k].active), last = act.at(-1);
  await patch(p2, ph => { ph.services[last].setup = 'doing'; });
  await more(p2, 'Services'); await p2.getByRole('button', { name: /Answered · tap to finish|In progress/ }).first().tap(); await p2.waitForTimeout(400);
  for (let i = 0; i < 60 && !(await p2.getByRole('button', { name: /^(Finish setup|Save dates and finish)$/ }).count()); i++) { const nx = p2.getByRole('button', { name: /^(Next|Continue|Skip)$/ }).first(); if (!(await nx.count())) break; await nx.tap(); await p2.waitForTimeout(150); }
  const fin = p2.getByRole('button', { name: /^(Finish setup|Save dates and finish)$/ }).first();
  if (await fin.count()) { await fin.tap(); await p2.waitForTimeout(500); const ob = p2.getByRole('button', { name: 'Open Today', exact: true }); if (await ob.count()) { /* plan card */ } }
  t = await text(p2);
  ok(/You’re all set/.test(t), '2. finishing the last service shows “You’re all set”');
  const rp = p2.getByRole('button', { name: 'Review procedures', exact: true });
  ok(await rp.count() === 1, '2. the You’re all set card has a “Review procedures” link'); await shot2('all_set');
  if (await rp.count()) { await rp.tap(); await p2.waitForTimeout(300); ok(/Procedures/.test(await p2.locator('h1').first().innerText()), '2. it opens Procedures'); }

  // ── 2d. A marker no setup question covers: "Change my setup answer instead" is hidden.
  const svcP = act[0];
  await patch(p2, ph => { let pr = ph.procedures.find(x => x.service === svcP); const v = pr.versions.at(-1);
    pr.status = 'draft'; pr.versions.push({ ...v, v: '0.9', status: 'Draft', body: v.body + '\n\nZebra mosaic in place. [Confirm: zebra mosaic arrangement]', at: '2026-11-26T00:00:00.000Z', edited: true }); });
  await more(p2, 'Procedures'); await p2.locator('.list .row').first().tap(); await p2.waitForTimeout(300);
  await p2.getByRole('button', { name: /Zebra mosaic arrangement/ }).first().tap(); await p2.waitForTimeout(400);
  t = await text(p2);
  ok(/To check: zebra mosaic arrangement/i.test(t), '2. the marker opens in Edit wording with its note');
  ok(!(await p2.getByRole('button', { name: 'Change my setup answer instead' }).count()), '2. no setup question covers it, so “Change my setup answer instead” is hidden');
  ok(await p2.getByRole('button', { name: /I’ve checked it/ }).count() === 1, '2. the owner can still confirm the check themselves'); await shot2('marker_no_question');
  await tap(p2, 'Cancel'); await p2.waitForTimeout(200);

  // ── 3. Evidence pack: S8 with issues, My log, Other documents, amendment, adopted by, pending draft, years.
  const svcQ = act[0];
  await patch(p2, ph => {
    const b1 = ph.records.filter(r => r.type === 'B1').sort((a, b) => b.date.localeCompare(a.date))[0];
    b1.answers = [...(b1.answers || [])]; b1.answers.push({ text: 'Fictional discrepancy check', answer: 'Issue', isIssue: true }); b1.date = '2026-08-21';
    ph.log.push({ id: 's3a-log', date: '2025-12-04', what: 'Called the PSA about a fictional query', kind: 'Phone call', ref: 'Ref 123', by: 'Alex Example' });
    ph.documents.push({ id: 's3a-doc', title: 'Fictional cleaning policy', url: '', ref: 'Shelf 2 binder', version: '3', owner: 'Owner', reviewDate: '2027-02-01' });
    const pr = ph.procedures.find(x => x.service === svcQ), v = pr.versions.at(-1);
    pr.versions.push({ ...v, v: '1.0', status: 'Adopted', at: '2026-09-02T00:00:00.000Z', adoptedAt: '2026-09-02T00:00:00.000Z', adoptedBy: 'Alex Example' });
    pr.versions.push({ ...v, v: '1.1', status: 'Draft', at: '2026-11-20T00:00:00.000Z' }); pr.status = 'draft'; pr.amendment = 'We check the fictional fridge twice daily.'; });
  await more(p2, 'Evidence pack'); await p2.waitForTimeout(300);
  const secT = name => p2.evaluate(n => [...document.querySelectorAll('.psec')].find(s => (s.querySelector('h2')?.innerText || '').startsWith(n))?.innerText || '', name);
  const s8 = await secT('S8 stock checks');
  ok(/21 Aug 2026\s+Completed with issues/.test(s8), '3. an S8 check with an issue says “Completed with issues”, not “Completed stocktake”');
  ok(/completed stocktake/.test(s8), '3. it still counts as a completed stocktake in the heading');
  const lg = await secT('My log'); ok(/4 Dec 2025/.test(lg) && /Called the PSA about a fictional query/.test(lg) && /Ref 123/.test(lg), '3. My log is in the pack');
  const dc = await secT('Other documents'); ok(/Fictional cleaning policy/.test(dc) && /Shelf 2 binder/.test(dc) && /1 Feb 2027/.test(dc), '3. Other documents are in the pack');
  const pc = await secT('Procedures');
  ok(/1\.0\s+Adopted 2 Sept? 2026 by Alex Example\s+Draft 1\.1 · 20 Nov 2026/.test(pc) || (/Adopted 2 Sep 2026 by Alex Example/.test(pc) && /Draft 1\.1 · 20 Nov 2026/.test(pc)), '3. the adopted version (1.0, date, by) is shown apart from the pending draft 1.1');
  ok(/We check the fictional fridge twice daily/.test(pc), '3. the local amendment is in the pack');
  const dates = await p2.evaluate(() => [...document.querySelectorAll('.pack td')].map(td => td.innerText).filter(x => /^\d{1,2} [A-Z][a-z]{2}( \d{4})?$/.test(x.trim())));
  ok(dates.length > 5 && dates.every(x => /\d{4}$/.test(x)), '3. every date in the pack tables carries the year (' + dates.length + ' dates, e.g. ' + dates[0] + ')');
  await p2.evaluate(() => document.querySelector('.psec h2')?.scrollIntoView()); await shot2('pack');
  await more(p2, 'History'); await p2.waitForTimeout(300);
  const hd = await p2.evaluate(() => [...document.querySelectorAll('.print-only table td:first-child')].map(td => td.textContent.trim()));
  ok(hd.length > 5 && hd.every(x => !x || /\d{4}$/.test(x)), '3. the History print carries the year on every date (' + hd.length + ' rows, e.g. ' + hd[0] + ')');

  // ── 4. Calendar file: staff events carry no name or credential.
  const phS = await activePh(p2), names = phS.staff.map(s => s.name).filter(Boolean);
  await more(p2, 'Calendar'); const cal = (await download(p2, 'Download calendar file')).replace(/\r\n /g, '');
  const sums = cal.match(/^(SUMMARY|DESCRIPTION):.*$/gm) || [];
  ok(names.length > 0 && !names.some(n => cal.includes(n)), '4. no staff member’s name is anywhere in the calendar file (' + names.length + ' staff checked)');
  ok(sums.some(s => /SUMMARY:PharmLedger staff check due · /.test(s)), '4. staff expiries and annual checks appear as “PharmLedger staff check due · pharmacy”');
  ok(!sums.some(s => /registration|police|working with children|first aid|CPR|immunisation|vaccinat.*(course|training)/i.test(s) && /staff/i.test(s)), '4. no staff event names a credential');
  ok(/SUMMARY:\[Required by law\] S8 stock check/.test(cal), '4. other due dates keep their names');

  // Errors from both phones.
  errors.push(...P2.errors); await P2.b.close(); await done(b, errors);
})().catch(e => { console.log('FAIL crashed: ' + e.message); process.exit(1); });
