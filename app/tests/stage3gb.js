// Stage 3G-B (28 Nov): the four 3G-A CSS regressions and six 3E–3F logic bugs, by real taps on the fictional example
// pharmacy at 390×844 and unfolded at 840×900; fails on any console error.
// CSS: 1. one 1 px divider between a plain row and a deferrable row; 2. the open Waiting / All tab on Today's ruled
//      index stays transparent; 3. unfolded, "Overdue" never spills over the Defer column; 4. unfolded, the
//      2-pharmacy pill's ring isn't clipped and the list and record bars still meet at the same height.
// Logic: 5. a previous owner's same-day stocktake doesn't hide the takeover S8 inventory (s 111(3)); 6. another tab
//      moving a review on never pours this tab's unsaved note into a different question; 7. a backup shared while the
//      owner switches pharmacy marks the exported pharmacy as backed up; 8. with a 1.1 draft, 1.0's annual review can
//      still be recorded (against 1.0); 9. the printed adopted procedure includes its local amendment; 10. the History
//      CSV's close event carries the completion date History shows.
const { phone, ok, done, tap, text, saved, activePh, download } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const put = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const patch = async (p, fn, reload = true) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph); await put(p, K, ph); if (reload) { await p.reload(); await p.waitForTimeout(900); } };
const patchDrafts = async (p, fn) => { const all = await saved(p), K = 'propapp:drafts:' + all['propapp:dir'].active, d = all[K] || {}; fn(d); await put(p, K, d); };
const ping = p => p.evaluate(() => { const ch = new BroadcastChannel('propapp'); ch.postMessage({ keys: [] }); ch.close(); });
const more = async (p, name) => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: new RegExp('^' + name) }).first().click(); await p.waitForTimeout(300); };
const back = async p => { await p.getByRole('button', { name: 'Back', exact: true }).first().click(); await p.waitForTimeout(300); };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, 'stage3gb_' + n + '.png') });
const TODAY = '2026-11-26';

(async () => {
  const { b, p, errors } = await phone({ time: TODAY + 'T10:00:00+11:00', scale: 2 });
  // A share sheet that stays open until the test closes it (item 7).
  await p.addInitScript(() => { Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: () => new Promise(res => { window.__shareDone = res; }), configurable: true }); });
  await p.reload(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Try example' }).click(); await p.waitForTimeout(3300);

  // ── 1. Dividers: a plain row followed by a deferrable row has one 1 px line, not two.
  const div = await p.evaluate(() => [...document.querySelectorAll('.list > .rowwrap')].filter(w => w.previousElementSibling?.classList.contains('row')).map(w => {
    const a = getComputedStyle(w.previousElementSibling, '::after'); return (parseFloat(getComputedStyle(w).borderTopWidth) || 0) + (a.display !== 'none' && a.content !== 'none' ? parseFloat(a.height) || 0 : 0); }));
  ok(div.length > 0 && div.every(x => x === 1), '1. every row-to-deferrable-row divider is 1 px (' + div.join(', ') + ')');
  // ── 2. Ruled index: the open Waiting and All tabs keep no fill.
  for (const f of ['waiting', 'all']) { await p.locator(`.filters.today-index button[data-f=${f}]`).click(); await p.waitForTimeout(150);
    const bg = await p.evaluate(f => getComputedStyle(document.querySelector(`.filters.today-index button[data-f=${f}]`)).backgroundColor, f);
    ok(bg === 'rgba(0, 0, 0, 0)', '2. the open ' + f + ' tab on Today is transparent (' + bg + ')'); }
  await p.mouse.move(1, 1); await p.waitForTimeout(150); await shot(p, 'today_all_390px');

  // ── 5. Takeover on the same day as the previous owner's stocktake.
  await patch(p, ph => { delete ph.inherited; ph.records.push({ id: 's8prev', type: 'B1', kind: 'review', title: 'S8', date: TODAY, at: '2026-11-25T20:00:00.000Z', by: 'Previous owner (fictional)', answers: [{ text: 'Stock', answer: 'Completed' }], fields: { stockDate: TODAY }, notes: '', actionIds: [] }); });
  await more(p, 'Bought, selling or closing'); await tap(p, 'I’ve just bought this pharmacy'); await p.waitForTimeout(400); await back(p);
  const inh = (await activePh(p)).inherited; ok(inh?.since === TODAY && /T/.test(inh?.at || ''), '5. marking the takeover keeps its date and time');
  await more(p, 'S8 at a glance'); const s8t = await text(p);
  ok(/make an S8 inventory in the drug register now \(s 111\(3\)\)/.test(s8t) && /Due today|Overdue/.test(s8t), '5. the previous owner’s same-day stocktake doesn’t hide the takeover inventory (s 111(3)), due now');
  await back(p); await tap(p, 'Today'); await p.waitForTimeout(200); await p.locator('.filters.today-index button[data-f=all]').click(); await p.waitForTimeout(150);
  const keys = await p.evaluate(() => [...document.querySelectorAll('main .list [data-key]')].map(x => x.dataset.key));
  const firstLegal = await p.evaluate(() => [...document.querySelectorAll('main .list .row')].findIndex(r => /S8 stock check/.test(r.innerText)));
  ok(keys.includes('review/B1') && firstLegal === 0, '5. on Today the takeover S8 check is first, ahead of everything else (row ' + firstLegal + ')');
  // the new owner's own inventory, recorded after the takeover, ends it
  await patch(p, ph => { ph.records.push({ id: 's8new', type: 'B1', kind: 'review', title: 'S8', date: TODAY, at: new Date(Date.now() + 60000).toISOString(), by: 'Test Owner (fictional)', answers: [{ text: 'Stock', answer: 'Completed' }], fields: { stockDate: TODAY }, notes: '', actionIds: [] }); });
  await more(p, 'S8 at a glance'); ok(!/make an S8 inventory in the drug register now/.test(await text(p)), '5. the new owner’s same-day inventory, recorded after the takeover, ends the takeover prompt'); await back(p);
  await patch(p, ph => { delete ph.inherited; ph.records = ph.records.filter(r => !['s8prev', 's8new'].includes(r.id)); });

  // ── 6. Another tab moves the review on: this tab's unsaved note stays with its own question.
  await tap(p, 'Reviews'); await p.waitForTimeout(200);
  const rvRow = p.locator('main .row[data-act]').filter({ hasText: /Staff safety meeting|Proprietor governance|Cleaning|Fridge/ }).first();
  await (await rvRow.count() ? rvRow : p.locator('main .row[data-act]').first()).click(); await p.waitForTimeout(300);
  const startBtn = p.getByRole('button', { name: /^Start/ }).first(); if (await startBtn.count()) { await startBtn.click(); await p.waitForTimeout(300); }
  const choice0 = p.locator('form[data-form=q] label.choice').first(); await choice0.click(); await p.waitForTimeout(300);
  const issue0 = await p.locator('textarea[name=issue]').count();
  if (issue0) { await p.locator('form[data-form=q] label.choice').nth(1).click(); await p.waitForTimeout(300); }
  const note = p.locator('textarea[name=note]');
  if (!await note.count()) { await p.locator('form[data-form=q] label.choice').last().click(); await p.waitForTimeout(300); }
  await note.fill('Step one note (fictional)'); await p.waitForTimeout(150);
  const scope = await p.locator('form[data-form=q]').getAttribute('data-scope'); const rid = scope.split('/')[0];
  await patchDrafts(p, d => { const k = 'review/' + rid, x = d[k]; x.answers[1] = x.answers[0]; x.step = 1; x.notesQ = { ...(x.notesQ || {}), 1: '' }; x.rev = Date.now() + 99999; });
  await ping(p); await p.waitForTimeout(900);
  const after = { steps: await p.locator('.steps').first().innerText(), note: await p.locator('textarea[name=note]').count() ? await p.locator('textarea[name=note]').inputValue() : '(no note box)' };
  ok(/Question 2/.test(after.steps) && after.note !== 'Step one note (fictional)', '6. another tab moving the review to question 2 doesn’t carry question 1’s unsaved note into it (' + after.steps + ' · “' + after.note + '”)');
  await p.getByRole('button', { name: 'Previous', exact: true }).click(); await p.waitForTimeout(300);
  ok(await p.locator('textarea[name=note]').inputValue() === 'Step one note (fictional)', '6. question 1 still has its own note');
  await back(p);

  // ── 8–9. Procedures: 1.0 in use with a 1.1 draft; the printed adopted procedure carries its local amendment.
  await patch(p, ph => { const q = ph.procedures.find(x => x.status === 'adopted') || ph.procedures[0]; ph.__svc = q.service;
    const v = q.versions.at(-1); q.versions = [{ ...v, v: '1.0', status: 'Adopted', at: '2026-01-10T00:00:00.000Z', adoptedAt: '2026-01-10T00:00:00.000Z' }, { ...v, v: '1.1', status: 'Draft', at: '2026-11-20T00:00:00.000Z', adoptedAt: undefined }];
    q.status = 'draft'; q.reviews = []; q.amendment = 'We double-check deliveries on Mondays (fictional).'; });
  const svc = (await activePh(p)).__svc;
  await more(p, 'Procedures'); await p.locator(`main .row[data-id="${svc}"]`).first().click(); await p.waitForTimeout(300);
  ok(await p.getByRole('button', { name: 'Record that I reviewed it', exact: true }).count() === 1, '8. with a 1.1 draft saved, “Record that I reviewed it” is still there for 1.0');
  await shot(p, 'procedure_draft_review_390px');
  await tap(p, 'Record that I reviewed it'); await p.waitForTimeout(200); await tap(p, 'Record review'); await p.waitForTimeout(300);
  const rv = (await activePh(p)).procedures.find(x => x.service === svc).reviews.at(-1);
  ok(rv?.date === TODAY && rv?.version === '1.0', '8. the review is recorded against 1.0, the version in use (' + JSON.stringify(rv) + ')');
  await patch(p, ph => { const q = ph.procedures.find(x => x.service === svc); q.versions.push({ ...q.versions[1], v: '2.0', status: 'Adopted', at: '2026-11-25T00:00:00.000Z', adoptedAt: '2026-11-25T00:00:00.000Z' }); q.status = 'adopted'; delete ph.__svc; });
  await more(p, 'Procedures'); await p.locator(`main .row[data-id="${svc}"]`).first().click(); await p.waitForTimeout(300);
  await p.emulateMedia({ media: 'print' });
  const pr = await p.evaluate(() => { const a = document.querySelector('.procamend'); return a ? { shown: getComputedStyle(a).display !== 'none' && a.getBoundingClientRect().height > 0, t: a.innerText } : null; });
  ok(pr?.shown && /Local amendment/.test(pr.t) && /double-check deliveries on Mondays/.test(pr.t), '9. the printed adopted procedure includes the local amendment (' + JSON.stringify(pr) + ')');
  await p.emulateMedia({ media: 'screen' });
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.procamend')).display) === 'none', '9. on screen the amendment is shown once (in Using it), not twice');
  await back(p);

  // ── 10. History CSV: a back-dated close shows the same completion date in the action row and its close event.
  await tap(p, 'Actions'); await p.waitForTimeout(200); await p.locator('main .row[data-act]').first().click(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /close it$/ }).first().click(); await p.waitForTimeout(200);
  await p.fill('textarea[name=what]', 'Seen it fixed (fictional)'); await p.fill('form[data-form=close] input[name=date]', '2026-11-20'); await p.locator('form[data-form=close] button[type=submit]').click(); await p.waitForTimeout(300);
  const closed = Object.values((await activePh(p)).actions).find(a => a.closed?.what === 'Seen it fixed (fictional)');
  await back(p); await more(p, 'History'); const csvT = await download(p, 'Download CSV');
  const rows = csvT.split('\r\n').filter(l => l.includes(JSON.stringify(closed.title).slice(1, -1)));
  const actRow = rows.find(l => /"Action"/.test(l) && /"Closed"/.test(l)), evRow = rows.find(l => /"Action event"/.test(l) && /"Closed"/.test(l));
  ok(closed.closed.date === '2026-11-20' && actRow?.includes('"2026-11-20"') && evRow?.includes('"2026-11-20"'), '10. the CSV close event carries the completion date History shows, 20 Nov (' + (evRow || '').slice(0, 160) + ')');

  // ── 3–4, 7. Two pharmacies, unfolded at 840×900, then a backup shared while switching pharmacy.
  await back(p); await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy');
  await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await p.locator('label.tick', { hasText: 'Home delivery' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const secondId = (await saved(p))['propapp:dir'].active;
  await p.locator('.ph-switch').click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /Wattle Grove/ }).first().click(); await p.waitForTimeout(500);
  const wattleId = (await saved(p))['propapp:dir'].active;
  await p.setViewportSize({ width: 840, height: 900 }); await p.waitForTimeout(300);
  for (const t of ['Today', 'Actions']) {
    await p.getByRole('button', { name: t, exact: true }).first().click(); await p.waitForTimeout(250); await p.locator('main .row[data-act]').first().click(); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const R = s => document.querySelector(s)?.getBoundingClientRect();
      const over = [...document.querySelectorAll('.pane-master .row-right.row-date')].filter(d => { const df = d.closest('.rowwrap')?.querySelector('.defer'); return d.scrollWidth > d.clientWidth + 1 || (df && d.getBoundingClientRect().right > df.getBoundingClientRect().left + 0.5); }).map(d => d.innerText);
      const pill = R('.pane-master .sw-pill'), h1 = R('.pane-master .bar-title');
      return { over, mb: R('.pane-master .bar')?.bottom, db: R('.pane-detail .bar')?.bottom, ring: pill && h1 ? pill.top - 4 >= h1.top - 0.5 && pill.bottom + 4 <= h1.bottom + 0.5 && pill.left - 4 >= h1.left - 0.5 : null }; });
    ok(m.over.length === 0, '3. 840×900 ' + t + ': no date badge spills over the Defer column' + (m.over.length ? ' (' + m.over.join(' | ') + ')' : ''));
    ok(m.mb && m.mb === m.db, '4. 840×900 ' + t + ': the list and record bars end at the same line (' + m.mb + ' / ' + m.db + ')');
    if (t === 'Today') ok(m.ring === true, '4. 840×900: the 2-pharmacy pill’s 4 px ring sits inside the bar, not clipped');
    await shot(p, 'unfolded_' + t.toLowerCase() + '_840px');
  }
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
  await more(p, 'Backup and devices'); await tap(p, 'Download a backup'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => typeof window.__shareDone === 'function'), '7. the backup opens the share sheet');
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /Second Test Pharmacy/ }).first().click(); await p.waitForTimeout(500);
  ok((await saved(p))['propapp:dir'].active === secondId, '7. the owner switched to the second pharmacy while the share sheet was open');
  await p.evaluate(() => window.__shareDone()); await p.waitForTimeout(600);
  const all = await saved(p);
  ok(!!all['propapp:ph:' + wattleId].settings.lastBackup && !all['propapp:ph:' + secondId].settings.lastBackup, '7. the exported pharmacy (Wattle Grove) is marked backed up, not the one open when the share finished');
  await done(b, errors);
})();
