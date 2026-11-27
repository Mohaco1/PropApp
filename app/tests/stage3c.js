// Stage 3C (final main bug cleanups), by real taps on the example pharmacy; fails on any console error.
// 1. Vaccination review, Reporting (part G): "Yes" is the good answer and "No" is the issue.
// 2. No "PIC" or "pharmacist in charge" role or label is left in the content; old backups still map to Pharmacist.
// 3. Site visit: choosing Issue starts Fix by at 30 days in the draft, so a visit saved without touching the date never
//    raises an action with no due date; "Last time" finds an action linked from an earlier visit (fixed or still open).
// 4. Calendar: Undo of "Align to 4 quarters" takes away a date that had not been set before; the Year plan shows an
//    overdue S8 review as ● even when an incomplete S8 review was saved this month; the power-failure step reads as one.
const { phone, ok, done, tap, text, saved, activePh } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const TIME = '2026-11-27T10:00:00+11:00', TODAY = '2026-11-27', PLUS30 = '2026-12-27';
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph);
  await p.evaluate(async ({ K, ph }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, K); tx.oncomplete = res; }); }, { K, ph });
  await p.reload(); await p.waitForTimeout(900); };
const more = async (p, name) => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const draftKey = async p => 'propapp:drafts:' + (await saved(p))['propapp:dir'].active;

(async () => {
  const { b, p, errors } = await phone({ time: TIME });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);

  // ── 1. Vaccination review: question 3 (Reporting, part G).
  const RV = require('../src/content/reviews.json'), q3 = RV.forms['service-vaccination'].questions.find(q => q.n === 3);
  ok(/^Reporting \(Vaccination Standards, part G\)/.test(q3.text) && q3.options.find(o => o.value === 'Yes').issue === false && q3.options.find(o => o.value === 'No').issue === true, '1. content: Reporting (part G) has Yes = fine, No = issue');
  // The vaccination service review is answered inside the site visit; saved and restored records are counted by these
  // definitions in the Evidence pack, History and record view. All-good answers (Yes to reporting) are 0 issues.
  const Q = RV.forms['service-vaccination'].questions, vrecord = (id, ans) => ({ id, type: 'service-vaccination', kind: 'review', title: 'Vaccination', date: '2026-11-24', at: '2026-11-24T01:00:00.000Z', by: 'Test', notes: '', fields: {}, actionIds: [],
    answers: Q.map((q, i) => ({ text: q.text, i, answer: ans[i] })) });
  await patch(p, ph => { ph.records.push(vrecord('vacc-ok', ['Yes', 'No', 'No', 'Yes']), vrecord('vacc-bad', ['Yes', 'No', 'No', 'No'])); });
  await more(p, 'Evidence pack'); await p.waitForTimeout(300);
  const vrows = await p.evaluate(() => [...document.querySelectorAll('.psec')][0] ? [...[...document.querySelectorAll('.psec')][0].querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(c => c.innerText)).filter(r => /24 Nov 2026/.test(r[0]) && /^Vaccination/.test(r[1])) : []);
  ok(vrows.length === 2 && vrows.map(r => r[3]).sort().join(',') === '0,1', '1. Evidence pack: reporting done (Yes) is 0 issues, not done (No) is 1 issue (' + vrows.map(r => r[3]).join(', ') + ')');
  await p.locator('.psec').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'stage3c_vaccination_reporting_pack_390px.png') });
  await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(250);
  await patch(p, ph => { ph.records = ph.records.filter(r => !/^vacc-/.test(r.id)); });

  // ── 2. "PIC" and "pharmacist in charge" are gone from roles and labels; old backups still map to Pharmacist.
  const ST = fs.readFileSync(path.resolve(__dirname, '../src/content/staff.json'), 'utf8'), RVt = JSON.stringify(RV);
  ok(!/\bPIC\b|in charge/i.test(ST), '2. staff.json has no “PIC” or “in charge” role');
  ok(!/pharmacist in charge/i.test(RVt) && RVt.includes('"label":"Pharmacist on duty"'), '2. the meeting field says “Pharmacist on duty”, and no review says “pharmacist in charge”');
  ok(/in charge\|\\bPIC\\b/.test(fs.readFileSync(path.resolve(__dirname, '../src/legacy.js'), 'utf8')), '2. the old-backup import still maps a PIC role to Pharmacist');
  await tap(p, 'Staff'); await p.waitForTimeout(250); await p.locator('[aria-label="Add a staff member"]').tap(); await p.waitForTimeout(300);
  const roles = await p.locator('select[name=role] option').allInnerTexts();
  ok(roles.length > 3 && !roles.some(r => /PIC|in charge/i.test(r)), '2. the role list offers no “PIC” or “in charge” role (' + roles.length + ' options)');
  await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(250);

  // ── 3a. Site visit: choosing Issue fills Fix by in the draft; saving untouched gives the action a due date.
  await patch(p, ph => { for (const a of Object.values(ph.actions)) if (a.status === 'open') { a.status = 'closed'; a.closed = { date: '2026-11-20', what: 'Fictional', by: 'Test' }; } });
  await tap(p, 'Today'); await p.waitForTimeout(300);
  const sv = p.getByRole('button', { name: /Proprietor site visit|Start a visit/ }); if (await sv.count()) await sv.first().tap(); else { await p.locator('[data-f=all]').tap(); await p.getByRole('button', { name: /site visit/i }).first().tap(); }
  await p.waitForTimeout(300); if (await p.getByRole('button', { name: 'Quarterly visit' }).count()) await tap(p, 'Quarterly visit');
  await tap(p, /Start the checks|Resume the checks/); await p.waitForTimeout(300);
  const firstTitle = (await p.locator('h2.big-title').innerText()).trim();
  await p.locator('form[data-form=ans] label', { hasText: /^Issue$/ }).first().tap(); await p.waitForTimeout(300);
  const DK = await draftKey(p), vd = async () => ((await saved(p))[DK] || {})['visit/quarterly'];
  let v = await vd(), first = Object.values(v.items).find(x => x.status === 'issue');
  ok(first && first.due === PLUS30, '3. choosing Issue saves Fix by as 30 days ahead in the draft before anything is typed (' + first?.due + ')');
  ok(await p.locator('input[name=due]').inputValue() === PLUS30, '3. the Fix by box shows the same date');
  await p.locator('textarea[name=text]').fill('Sharps bin lid cracked (fictional)'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(SHOTS, 'stage3c_visit_issue_fix_by_390px.png') });
  for (let i = 0; i < 40 && !(await p.locator('form[data-form=fin]').count()); i++) { const cur = await p.locator('form[data-form=ans] input[name=status]:checked').count();
    if (!cur) { await p.locator('form[data-form=ans] label', { hasText: /^Satisfactory$/ }).first().tap(); await p.waitForTimeout(150); }
    if (await p.locator('input[name=vaccEvent]').count() && !(await p.locator('input[name=vaccEvent]:checked').count())) { await p.locator('label.choice', { hasText: /^No$/ }).first().tap(); await p.waitForTimeout(150); }
    await p.locator('.btnrow button.primary').last().tap(); await p.waitForTimeout(200); }
  ok(await p.locator('form[data-form=fin]').count() === 1, '3. reached the finish screen');
  await tap(p, 'Save visit'); await p.waitForTimeout(500);
  let ph = await activePh(p); const vrec = ph.records.filter(r => r.type === 'Q1').sort((a, b) => b.at.localeCompare(a.at))[0];
  const act = Object.values(ph.actions).find(a => a.title === 'Sharps bin lid cracked (fictional)');
  ok(act && act.due === PLUS30, '3. the action raised by the visit is due ' + PLUS30 + ' (' + act?.due + ')');
  ok(Object.values(ph.actions).every(a => a.due !== ''), '3. no action has an empty due date');
  ok(vrec.answers.find(x => x.text === firstTitle)?.actionId === act?.id, '3. the visit answer remembers its action');

  // ── 3b. "Last time" finds an action that a later visit linked to, though the action came from an earlier visit.
  const FIRST_KEY = vrec.answers.find(x => x.text === firstTitle).item;
  await patch(p, ph => { const a = Object.values(ph.actions).find(x => x.title === 'Sharps bin lid cracked (fictional)');
    a.source.recordId = 'older-visit'; // the action belongs to an earlier visit
    ph.records.push({ id: 'linked-visit', type: 'Q1', kind: 'visit', title: 'Extra site visit', extra: true, date: '2026-11-26', at: '2026-11-26T01:00:00.000Z', by: 'Test', notes: '', fields: {},
      answers: [{ item: FIRST_KEY, text: firstTitle, answer: 'Issue', isIssue: true, note: 'Lid still cracked (fictional)', ref: '' }], actionIds: [a.id] });
    for (const r of ph.records) if (r.type === 'Q1' && r.id !== 'linked-visit' && r.date >= '2026-11-26') r.date = '2026-11-25';
    a.log.push({ at: '2026-11-26T01:00:00.000Z', by: 'Test', kind: 'updated', text: 'Seen again at the extra visit on 2026-11-26: Lid still cracked (fictional)' }); });
  const openVisit = async () => { await tap(p, 'Today'); await p.waitForTimeout(300); const s = p.getByRole('button', { name: /Proprietor site visit|Start a visit/ });
    if (await s.count()) await s.first().tap(); else { await p.locator('[data-f=all]').tap(); await p.getByRole('button', { name: /site visit/i }).first().tap(); }
    await p.waitForTimeout(300); await tap(p, 'Extra visit'); await p.waitForTimeout(200); await tap(p, /Start the checks|Resume the checks/); await p.waitForTimeout(300);
    for (let i = 0; i < 20 && (await p.locator('h2.big-title').innerText()).trim() !== firstTitle; i++) { await p.locator('.btnrow button').first().tap(); await p.waitForTimeout(150); } };
  await openVisit(); let t = await text(p);
  ok(/Last time \(26 Nov\): Lid still cracked \(fictional\)/.test(t), '3. Last time shows the linked visit’s note');
  ok(await p.locator('.card.wait', { hasText: 'Sharps bin lid cracked (fictional)' }).count() === 1, '3. the linked action shows as still open');
  await patch(p, ph => { const a = Object.values(ph.actions).find(x => x.title === 'Sharps bin lid cracked (fictional)'); a.status = 'closed'; a.closed = { date: '2026-11-27', what: 'New lid fitted (fictional)', by: 'Test' }; });
  await openVisit(); t = await text(p);
  ok(/Last time \(26 Nov\): Lid still cracked \(fictional\) · fixed 27 Nov/.test(t), '3. once the linked action is closed, Last time says “fixed 27 Nov”');
  await p.screenshot({ path: path.join(SHOTS, 'stage3c_visit_last_time_linked_390px.png') });
  await tap(p, 'Today'); await p.waitForTimeout(200);

  // ── 4a. Align then Undo: an S8 date that was never set is taken away again (not left as the s 111 limit).
  await patch(p, ph => { delete ph.schedule.B1; delete ph.flags?.alignUndo;
    ph.records.push({ id: 's8-done', type: 'B1', kind: 'review', title: 'S8 stock check', date: '2026-11-20', at: '2026-11-20T01:00:00.000Z', by: 'Test', notes: '', answers: [], actionIds: [], fields: { stockDate: '2026-11-20', stockBy: 'Priya Sharma (fictional)' } }); });
  await more(p, 'Calendar'); await tap(p, 'Year plan'); await p.waitForTimeout(250);
  const alignBtn = p.getByRole('button', { name: /^Align \d+ dates?$/ });
  ok(await alignBtn.count() === 1, '4. the Year plan offers Align');
  await alignBtn.tap(); await p.waitForTimeout(400); ph = await activePh(p);
  const unset = (ph.flags.alignUndo?.changes || []).filter(x => x.unset).map(x => x.id);
  ok(unset.includes('B1') && ph.schedule.B1 === '2027-02-01', '4. Align moved the unset S8 date to 1 Feb 2027 and remembered it had none (' + ph.schedule.B1 + '; unset: ' + unset.join(', ') + ')');
  await p.getByRole('button', { name: /^Undo the alignment/ }).tap(); await p.waitForTimeout(400); ph = await activePh(p);
  ok(!('B1' in ph.schedule) && unset.every(k => !(k in ph.schedule)), '4. Undo takes the S8 date away again (schedule.B1: ' + ph.schedule.B1 + ')');
  ok(!ph.flags.alignUndo, '4. the Undo link is used up');

  // ── 4b. Year plan: an overdue S8 review stays ● (overdue) though an incomplete S8 review was saved this month.
  await patch(p, ph => { ph.records = ph.records.filter(r => r.type !== 'B1');
    ph.records.push({ id: 's8-old', type: 'B1', kind: 'review', title: 'S8 stock check', date: '2026-08-15', at: '2026-08-15T01:00:00.000Z', by: 'Test', notes: '', answers: [], actionIds: [], fields: { stockDate: '2026-08-15', stockBy: 'Priya Sharma (fictional)' } });
    ph.records.push({ id: 's8-inc', type: 'B1', kind: 'review', title: 'S8 stock check', date: '2026-11-21', at: '2026-11-21T01:00:00.000Z', by: 'Test', notes: '', answers: [{ answer: 'Incomplete' }], actionIds: [], fields: { stockIncomplete: true } });
    ph.schedule.B1 = '2026-11-10'; });
  await more(p, 'Calendar'); await tap(p, 'Year plan'); await p.waitForTimeout(250);
  const cell = await p.evaluate(() => { const row = [...document.querySelectorAll('table.yearplan tbody tr')].find(r => /S8/.test(r.querySelector('th').innerText)); const td = row?.querySelectorAll('td')[5]; return td ? { s: td.innerText.trim(), k: td.className } : null; });
  ok(cell && cell.s === '●' && cell.k === 'bad', '4. the S8 row shows ● overdue in Nov, not ✓ (' + JSON.stringify(cell) + ')');
  await p.locator('table.yearplan').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'stage3c_year_plan_s8_overdue_390px.png') });

  // ── 4c. The power-failure step: if the vaccines stay in the fridge, the second sentence no longer says "restocking".
  const VS = require('../src/content/verified-steps.json').pairs[8][1];
  ok(/^Power failure:/.test(VS) && /leave them in the fridge with the door closed/.test(VS) && !/before restocking/.test(VS) && /before putting back any vaccines you moved/.test(VS), '4. the power-failure step reads as one: put back only what you moved');

  ok(true, 'screens saved to app/handoff/stage3c_*.png');
  await done(b, errors);
})();
