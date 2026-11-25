// Audit Wave 1 (Codex R01–R08), by real taps at 390×844; fails on any console error. A second tab (same browser
// profile) stands in for the owner having the app open twice (R06).
const { phone, ok, done, tap, text, saved, activePh, download } = require('./helpers.js'); const fs = require('fs'); const path = require('path');
const TMP = path.resolve(__dirname, '../handoff/tmp'); fs.mkdirSync(TMP, { recursive: true });
const restore = async (p, file) => { await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.locator('input[type=file]').setInputFiles(file); await p.waitForTimeout(600); };
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-30T10:00:00+11:00' });
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  const ph0 = await activePh(p), all0 = await saved(p), dk = 'propapp:drafts:' + ph0.id;

  // R01: a damaged backup with Wattle Grove's id (staff missing) is refused before anything is written
  const bad = { app: 'PropApp', format: 1, exportedAt: new Date().toISOString(), pharmacy: { ...ph0, staff: undefined, name: 'Damaged copy' }, drafts: {} };
  fs.writeFileSync(path.join(TMP, 'damaged.json'), JSON.stringify(bad));
  await restore(p, path.join(TMP, 'damaged.json'));
  ok(/This backup is damaged \(staff\)\. Nothing was changed\./.test(await text(p)), 'R01 a damaged backup is refused with a clear message');
  await p.reload(); await p.waitForTimeout(800);
  const ph1 = await activePh(p), all1 = await saved(p);
  ok(ph1.name === ph0.name && ph1.staff.length === ph0.staff.length && ph1.records.length === ph0.records.length && Object.keys(ph1.actions).length === Object.keys(ph0.actions).length && JSON.stringify(all1[dk]) === JSON.stringify(all0[dk]), 'R01 after reload, Wattle Grove’s records, actions, staff and drafts are untouched');

  // R03: issues follow each question's own meaning (legacy-style answers with no isIssue flag, as an old backup has)
  const rec = (ans, id) => ({ id, type: 'service-vaccination', kind: 'review', title: 'Vaccination', date: '2026-11-20', by: 'Jordan Avery', notes: '', fields: {}, actionIds: [],
    answers: ['Have required fridge temperature recordings and weekly data-logger reviews been', 'Have there been vaccination errors, cold-chain breaches or adverse eve'].map((t, i) => ({ text: null, i, answer: ans[i] })) });
  const forms = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/content/reviews.json'), 'utf8')).forms['service-vaccination'].questions;
  const mk = (ans, id) => { const r = rec(ans, id); r.answers.forEach((a, i) => { a.text = forms[i].text; }); return r; };
  const copy = JSON.parse(JSON.stringify(ph0)); copy.id = 'r03-test-pharmacy'; copy.name = 'Issue Test Pharmacy (fictional)'; copy.records = [mk(['Yes', 'No'], 'r03-ok'), mk(['No', 'No'], 'r03-bad')];
  fs.writeFileSync(path.join(TMP, 'r03.json'), JSON.stringify({ app: 'PropApp', format: 1, exportedAt: new Date().toISOString(), pharmacy: copy, drafts: {} }));
  await restore(p, path.join(TMP, 'r03.json')); await p.waitForTimeout(300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).click(); await p.waitForTimeout(300);
  const rows = await p.evaluate(() => [...document.querySelectorAll('.psec')][0].querySelectorAll('tbody tr').length ? [...[...document.querySelectorAll('.psec')][0].querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(c => c.innerText)) : []);
  ok(rows.length === 2 && rows.map(r => r[3]).sort().join(',') === '0,1', 'R03 evidence pack: “Yes” to fridge records is 0 issues; “No” is 1 issue (' + rows.map(r => r[3]).join(', ') + ')');
  await tap(p, 'More'); await p.getByRole('button', { name: /^History/ }).click(); await p.waitForTimeout(300);
  const csvText = await download(p, 'Download CSV');
  const lines = csvText.split('\r\n').filter(l => /"Review","Vaccination"/.test(l));
  ok(lines.length >= 2 && lines.filter(l => /"1 issue: /.test(l)).length === 1 && lines.filter(l => /"No issues"/.test(l)).length === 1, 'R03 History CSV agrees: one record with 1 issue, one with none');

  // back to Wattle Grove for the rest
  await p.locator('.ph-switch').first().click().catch(async () => { await tap(p, 'Today'); await p.locator('.ph-switch').click(); });
  await p.getByRole('button', { name: /^Wattle Grove Pharmacy/ }).click(); await p.waitForTimeout(500);

  // R02 + R05: an "Incomplete" S8 check doesn't move the deadline; a completed one on 30 Nov allows up to 28 Feb 2027
  const dm = await import('file://' + path.resolve(__dirname, '../src/dates.js'));
  const lastDone = (await activePh(p)).records.filter(r => r.type === 'B1' && r.fields?.stockDate).map(r => r.fields.stockDate).sort().at(-1), keep = dm.fmt(dm.addMonths(lastDone, 3));
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await tap(p, 'Start review');
  await p.locator('label.choice', { hasText: /^Incomplete$/ }).click(); await p.fill('textarea[name=issue]', 'Count not finished: interrupted (fictional)'); await p.locator('textarea[name=issue]').blur(); await tap(p, 'Next');
  for (let i = 1; i < 9; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(40); }
  let t = await text(p);
  ok(!/Date the pharmacist did the stock check/.test(t) && t.includes('wasn’t finished, so the deadline stays 3 months after the last completed one (' + keep + ')'), 'R02 incomplete: no stock-check date asked; the deadline stays 3 months after the last completed check (' + keep + ')');
  await tap(p, 'Save review'); await p.waitForTimeout(400);
  let ph = await activePh(p); const inc = ph.records.filter(r => r.type === 'B1').at(-1);
  ok(inc.fields.stockIncomplete === true && !inc.fields.stockDate, 'R02 the incomplete check is recorded as incomplete, with no stock-check date');
  await tap(p, 'More'); await p.getByRole('button', { name: /^S8 at a glance/ }).click(); await p.waitForTimeout(200); t = await text(p);
  ok(t.includes('Last stock check ' + dm.fmt(lastDone)), 'R02 S8 at a glance still shows the last completed stock check (' + dm.fmt(lastDone) + ')');
  // completed check, future date refused, then 30 Nov -> 28 Feb 2027
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await tap(p, 'Start review');
  for (let i = 0; i < 9; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(40); }
  await p.fill('input[name=stockDate]', '2026-12-05'); await p.locator('input[name=stockDate]').blur(); await p.waitForTimeout(150);
  ok(/The stock-check date can’t be in the future/.test(await text(p)) && await p.getByRole('button', { name: 'Save review' }).isDisabled(), 'R02 a future stock-check date is refused');
  await p.fill('input[name=stockDate]', '2026-11-30'); await p.locator('input[name=stockDate]').blur(); await p.waitForTimeout(150);
  ok(/3 months after the stock check \(28 Feb 2027\)/.test(await text(p)), 'R05 30 Nov 2026 + 3 months = 28 Feb 2027 on the finish screen');
  await p.fill('input[name=stockBy]', 'Pat Pharmacist (fictional)'); await p.locator('input[name=stockBy]').blur(); await tap(p, 'Save review'); await p.waitForTimeout(400);
  ph = await activePh(p); ok(ph.records.filter(r => r.type === 'B1').at(-1).fields.next <= '2027-02-28' && ph.schedule.B1 <= '2027-02-28', 'R05 the saved next due date is no later than 28 Feb 2027');
  ok(dm.addMonths('2026-07-15', 3) === '2026-10-15' && dm.addMonths('2027-11-30', 3) === '2028-02-29' && dm.addMonths('2026-11-30', 3) === '2027-02-28', 'R05 addMonths: 15 Jul → 15 Oct; 30 Nov 2027 → 29 Feb 2028 (leap year)');

  // R04: privacy hint, generic calendar titles for actions, honest pack framing
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action' }).click();
  ok(/No patient names\. For example: “Check fridge log”/.test(await text(p)), 'R04 the new-action form says “No patient names”');
  await p.fill('input[name=title]', 'Ring Mrs Example about her pack (fictional)'); await tap(p, 'Save action'); await p.waitForTimeout(300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().click(); await p.waitForTimeout(200);
  const ics = await download(p, 'Download calendar file');
  ok(!/Mrs Example/.test(ics) && /SUMMARY:PropApp action due · Wattle Grove Pharmacy/.test(ics), 'R04 calendar file: actions show “PropApp action due · pharmacy”, never their own words');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).click(); t = await text(p);
  ok(/Designed for de-identified proprietor records: check your notes before sharing\./.test(t) && !/no patient information/.test(t), 'R04 the pack no longer claims “no patient information”');

  // R08: a dismissed conflict copy stays dismissed after saving and a reload
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.waitForTimeout(200);
  await p.evaluate(async () => { const r = indexedDB.open('propapp'); const dbh = await new Promise(res => { r.onsuccess = () => res(r.result); });
    const dir = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get('propapp:dir'); g.onsuccess = () => res(g.result); });
    const k = 'propapp:drafts:' + dir.active; const cur = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result); });
    cur['visit/extra'] = { ...cur['visit/extra'], notes: 'Changed on the other device', rev: Date.now() + 99999 };
    await new Promise(res => { const tx = dbh.transaction('kv', 'readwrite'); tx.objectStore('kv').put(cur, k); tx.oncomplete = res; }); });
  await p.locator('label.choice:not(:has(input:checked))').first().click(); await p.waitForTimeout(700);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  ok(await p.getByRole('button', { name: 'Dismiss', exact: true }).count() === 1, 'R08 a conflict copy is listed');
  await p.getByRole('button', { name: 'Dismiss', exact: true }).click(); await p.waitForTimeout(150);
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.locator('label.choice:not(:has(input:checked))').first().click(); await p.waitForTimeout(700);
  await p.reload(); await p.waitForTimeout(800); await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  const all2 = await saved(p); const cf = Object.keys(all2[dk] || {}).filter(k => k.includes('/conflict-'));
  ok(/CONFLICT COPIES · 0/i.test(await text(p)) && cf.length === 0, 'R08 after another save and a reload, the dismissed copy stays gone');

  // R06: two tabs each add a different action; neither overwrites the other; the header says what really happened
  const q = await b.contexts()[0].newPage(); q.on('pageerror', e => errors.push(e.message)); q.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await q.goto(p.url()); await q.waitForTimeout(800);
  for (const [pg, title] of [[p, 'Check the fridge log (tab one)'], [q, 'Service the extinguisher (tab two)']]) { await tap(pg, 'Actions'); await pg.getByRole('button', { name: 'Add an action' }).click(); await pg.fill('input[name=title]', title); }
  await tap(p, 'Save action'); await tap(q, 'Save action'); await p.waitForTimeout(1200);
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.locator('label.choice:not(:has(input:checked))').first().click();
  const during = await p.locator('.saved').first().innerText(); await p.waitForTimeout(800);
  ok(during === 'Saving…' && await p.locator('.saved').first().innerText() === 'Saved', 'R06 the header says “Saving…” then “Saved” once storage has it');
  await p.reload(); await p.waitForTimeout(800);
  const titles = Object.values((await activePh(p)).actions).map(a => a.title);
  ok(titles.includes('Check the fridge log (tab one)') && titles.includes('Service the extinguisher (tab two)'), 'R06 both tabs’ new actions are kept (merged, not overwritten)');
  await q.close();
  // R06, sharper: storage changes underneath with no message between tabs (a stale write); this tab then saves its own change
  await p.evaluate(async () => { const r = indexedDB.open('propapp'); const dbh = await new Promise(res => { r.onsuccess = () => res(r.result); });
    const dir = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get('propapp:dir'); g.onsuccess = () => res(g.result); });
    const k = 'propapp:ph:' + dir.active; const ph = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result); });
    ph.actions['other-tab-action'] = { id: 'other-tab-action', title: 'Added in another tab (fictional)', due: '', status: 'open', created: '2026-11-30', source: null, person: '', waiting: null, closed: null, log: [] };
    await new Promise(res => { const tx = dbh.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, k); tx.oncomplete = res; }); });
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action' }).click(); await p.fill('input[name=title]', 'Added in this tab (fictional)'); await tap(p, 'Save action'); await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(800);
  const t2 = Object.values((await activePh(p)).actions).map(a => a.title);
  ok(t2.includes('Added in another tab (fictional)') && t2.includes('Added in this tab (fictional)') && t2.includes('Check the fridge log (tab one)'), 'R06 a stale write is merged: the other tab’s action and this tab’s both survive');
  fs.rmSync(TMP, { recursive: true, force: true });
  await done(b, errors);
})();
