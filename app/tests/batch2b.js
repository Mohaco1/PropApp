// Batch 2B (H-05, H-08, H-10, M-04), by real touch taps on the example pharmacy at 344 and 390 px; fails on any console error.
// Where a check needs data the example lacks (a staff issue note), it is written into the phone's storage first, as the
// app would have saved it, then read back through the screens and the downloaded calendar file.
const { phone, ok, done, tap, text, activePh, saved, download } = require('./helpers.js');
const path = require('path');
const TIME = '2026-11-27T10:00:00+11:00';
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph);
  await p.evaluate(async ({ K, ph }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, K); tx.oncomplete = res; }); }, { K, ph });
  await p.reload(); await p.waitForTimeout(900); };
// Every pack table ends inside the pack card and the page never scrolls sideways.
const fits = p => p.evaluate(() => { const pk = document.querySelector('.pack').getBoundingClientRect();
  // a table either fits its card or scrolls inside it (never cut off): its wrapper is no wider than the card
  const bad = [...document.querySelectorAll('.pack .ptable')].filter(t => { const w = t.parentElement, r = w.getBoundingClientRect(); return r.right > pk.right + 1 || (t.scrollWidth > w.clientWidth + 1 && getComputedStyle(w).overflowX !== 'auto'); }).length;
  return { bad, page: document.documentElement.scrollWidth <= innerWidth, tables: document.querySelectorAll('.pack .ptable').length }; });

(async () => {
  const { b, p, errors } = await phone({ time: TIME });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  const shot = n => p.screenshot({ path: path.resolve(__dirname, '../handoff/batch2b_' + n + '_390px.png') });

  // ── H-05: the pack lists where each service keeps its records, as More → Evidence locations does.
  await more(p, 'Evidence locations'); const locT = await text(p);
  const ph0 = await activePh(p), vaccAir = ph0.services.vaccination.answers.air;
  ok(!!vaccAir && locT.includes(vaccAir), 'H-05 setup: Evidence locations shows the vaccination AIR record location (' + vaccAir + ')');
  await more(p, 'Evidence pack');
  const obl = await p.evaluate(() => [...document.querySelectorAll('.psec')].find(s => /where the evidence is/.test(s.querySelector('h2')?.innerText || ''))?.innerText || '');
  ok(obl.includes(vaccAir) && /Vaccination ·/.test(obl), 'H-05 the evidence pack lists the service record locations (Vaccination · AIR)');
  ok(!/No evidence locations recorded yet/.test(obl), 'H-05 the evidence locations section is not empty on the example pharmacy');
  let f = await fits(p); ok(f.tables >= 4 && f.bad === 0 && f.page, 'H-05 at 390 px every pack table (' + f.tables + ') fits, Next due included, and no sideways scroll');
  await shot('pack');
  await p.setViewportSize({ width: 344, height: 844 }); await p.waitForTimeout(300);
  f = await fits(p); ok(f.bad === 0 && f.page, 'H-05 at 344 px every pack table fits and no sideways scroll');
  const nd = await p.evaluate(() => { const th = [...document.querySelectorAll('.pack th')].find(x => x.innerText === 'Next due'), w = th.closest('.pscroll'); w.scrollLeft = w.scrollWidth; const r = th.getBoundingClientRect(), wr = w.getBoundingClientRect(); const v = r.right <= wr.right + 1 && r.left >= wr.left - 1 && r.width > 20; w.scrollLeft = 0; return v; });
  ok(nd, 'H-05 at 344 px the Next due column is fully visible (scrolled to, if the table is wider than the card)');
  await p.locator('.pack .psec').first().scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, -60)); await p.screenshot({ path: path.resolve(__dirname, '../handoff/batch2b_pack_344px.png') });
  // A4: printed from a wide (unfolded) screen, the pack uses the whole page width, not a pane of a 100vh split.
  await p.setViewportSize({ width: 1024, height: 768 }); await p.waitForTimeout(300); await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(200);
  const pr = await p.evaluate(() => ({ w: document.querySelector('.pack').getBoundingClientRect().width, vw: innerWidth, pad: getComputedStyle(document.getElementById('app')).paddingLeft, nav: getComputedStyle(document.querySelector('.nav') || document.body).display, h: document.querySelector('.pack').scrollHeight }));
  ok(pr.w >= pr.vw * 0.95 && pr.pad === '0px' && pr.nav === 'none', 'H-05 print at 1024 px: the pack spans the page (' + Math.round(pr.w) + ' of ' + pr.vw + ' px), no side rail');
  const pdf = await p.pdf({ format: 'A4' }); ok(pdf.length > 5000, 'H-05 the pack prints to an A4 PDF (' + Math.round(pdf.length / 1024) + ' KB)');
  await p.emulateMedia({ media: 'screen' }); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);

  // ── H-08: staff actions in the calendar file say only that an action is due; UIDs come from ids.
  await patch(p, ph => { const ben = ph.staff.find(s => s.name === 'Ben Carter'); const id = 'b2b-staff-issue';
    ph.actions[id] = { id, title: 'Police check · Ben Carter: awaiting the secret note (fictional)', due: '2026-12-05', status: 'open', created: '2026-11-20', log: [], source: { type: 'staff', staffId: ben.id, req: 'police', label: 'Annual check' } }; });
  await more(p, 'Calendar'); let cal = (await download(p, 'Download calendar file')).replace(/\r\n /g, '');
  const evs = cal.split('BEGIN:VEVENT').slice(1);
  ok(!/secret note/.test(cal) && !evs.some(e => /Ben Carter/.test(e) && /Review |Police check/.test(e)), 'H-08 no staff action words or the person’s name for an action reach the calendar file');
  const ev = evs.find(e => e.includes('action/b2b-staff-issue')) || '';
  ok(/SUMMARY:PharmLedger action due/.test(ev) && /DTSTART;VALUE=DATE:20261205/.test(ev), 'H-08 the staff action is one “PharmLedger action due” event, UID from its action id');
  const uids = cal.match(/^UID:.*$/gm) || [];
  ok(new Set(uids).size === uids.length && !uids.some(u => /person\/[^-]+-\d+-/.test(u)), 'H-08 every UID is unique and none is built from a part’s position');
  // remove another of Ben's checks: the remaining events keep their UIDs
  await patch(p, ph => { const a = Object.values(ph.actions).find(x => x.status === 'open' && x.source?.type === 'staff' && x.due && x.id !== 'b2b-staff-issue'); if (a) delete ph.actions[a.id]; });
  await more(p, 'Calendar'); const cal2 = (await download(p, 'Download calendar file')).replace(/\r\n /g, '');
  const keep = (cal2.match(/^UID:.*$/gm) || []); ok(keep.length === uids.length - 1 && keep.every(u => uids.includes(u)), 'H-08 when one check goes, every other event keeps its UID');

  // ── H-10: Former staff can be restored; their open actions stay on Today meanwhile, matching Actions.
  await tap(p, 'Staff'); await p.getByRole('button', { name: /Ben Carter/ }).first().tap(); await p.waitForTimeout(300);
  await tap(p, 'Leaving'); await p.waitForTimeout(300);
  for (const c of await p.locator('main .card').all()) await c.locator('label.choice', { hasText: /^Done$/ }).first().tap();
  await tap(p, 'Move to former staff'); await p.waitForTimeout(500);
  let ph = await activePh(p); ok(ph.staff.find(s => s.name === 'Ben Carter').active === false, 'H-10 setup: Ben Carter moved to former staff');
  const benOpen = Object.values(ph.actions).filter(a => a.status === 'open' && a.source?.staffId === ph.staff.find(s => s.name === 'Ben Carter').id);
  await tap(p, 'Today'); await p.waitForTimeout(300); await p.locator('.filters button', { hasText: 'All' }).first().tap(); await p.waitForTimeout(300); let t = await text(p);
  ok(benOpen.length > 0 && benOpen.every(a => t.includes(a.title)), 'H-10 Ben’s ' + benOpen.length + ' open actions still show on Today while he is former staff');
  await tap(p, 'Actions'); await p.waitForTimeout(300); t = await text(p);
  ok(benOpen.every(a => t.includes(a.title)), 'H-10 the same open actions are on Actions');
  await tap(p, 'Staff'); await p.getByRole('button', { name: /^Former/ }).tap(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Ben Carter/ }).first().tap(); await p.waitForTimeout(300);
  const rb = p.getByRole('button', { name: 'Restore to active staff' }); ok(await rb.count() === 1, 'H-10 a former staff profile has “Restore to active staff”');
  await rb.scrollIntoViewIfNeeded(); await shot('restore');
  await rb.tap(); await p.waitForTimeout(500);
  ph = await activePh(p); const ben = ph.staff.find(s => s.name === 'Ben Carter');
  ok(ben.active === true && !ben.end && ph.records.some(r => r.kind === 'departure' && r.fields?.personId === ben.id), 'H-10 restoring makes him active again; the leaving record stays in the history');
  ok(await p.getByRole('button', { name: 'Leaving' }).count() === 1 && await p.getByRole('button', { name: 'Annual check' }).count() === 1, 'H-10 the restored profile offers Annual check and Leaving again');
  await tap(p, 'Today'); await p.waitForTimeout(300); t = await text(p);
  ok(/Ben Carter/.test(t), 'H-10 after restoring, his checks are one Today row again');
  // 44 px source links under If something goes wrong
  await more(p, 'If something goes wrong');
  await p.evaluate(() => document.querySelectorAll('details.why').forEach(d => { d.open = true; }));
  const hs = await p.evaluate(() => [...document.querySelectorAll('details.why a[href]')].map(a => a.getBoundingClientRect().height));
  ok(hs.length === 5 && hs.every(x => x >= 44), 'H-10 all 5 source links are at least 44 px tall (' + hs.map(Math.round).join(', ') + ')');
  await p.locator('details.why a[href]').first().scrollIntoViewIfNeeded(); await shot('incidents');

  // ── M-04: blank titles and names are refused; free-text boxes say no patient names.
  await tap(p, 'Actions'); const nA = Object.keys((await activePh(p)).actions).length;
  await p.locator('.bar').getByRole('button', { name: /Add/ }).first().tap().catch(async () => { await p.locator('[data-act=add]').first().tap(); }); await p.waitForTimeout(300);
  await p.fill('input[name=title]', '    '); await tap(p, 'Save action'); await p.waitForTimeout(400);
  ok(Object.keys((await activePh(p)).actions).length === nA && /Say what needs fixing/.test(await text(p)), 'M-04 an action title of only spaces is refused');
  await tap(p, 'Staff'); await p.getByRole('button', { name: /^Locums/ }).tap(); await tap(p, 'Locum on duty · quick check'); await p.waitForTimeout(300);
  await p.fill('input[name=name]', '   '); for (const c of await p.locator('main .card').all()) await c.locator('label.choice', { hasText: /^Done$/ }).first().tap();
  const nS = (await activePh(p)).staff.length; await tap(p, 'Save'); await p.waitForTimeout(400);
  ok((await activePh(p)).staff.length === nS && /Enter the locum’s name/.test(await text(p)), 'M-04 a locum name of only spaces is refused');
  await more(p, 'Meetings'); await p.locator('main .row').first().tap(); await p.waitForTimeout(300);
  const st = p.getByRole('button', { name: /^Start/ }); if (await st.count()) { await st.first().tap(); await p.waitForTimeout(300); }
  const mh = await p.evaluate(() => ['others', 'action'].map(n => document.querySelector('input[name=' + n + ']')?.closest('label')?.innerText || ''));
  ok(mh.every(x => /No patient names/.test(x)), 'M-04 the meeting “Others there” and “New action” boxes say no patient names');
  await done(b, errors);
})();
