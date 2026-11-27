// Batch 1A (C-01, C-02, C-03, C-05), by real touch taps at 390×844 on the UAT build; fails on any console error.
const { phone, ok, done, tap, text, activePh, saved } = require('./helpers.js'); const path = require('path'); const fs = require('fs'); const os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'batch1a-'));
const TIME = '2026-11-26T10:00:00+11:00', TODAY = '2026-11-26';
const clearActive = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  const dir = await new Promise(res => { const g = db.transaction('kv').objectStore('kv').get('propapp:dir'); g.onsuccess = () => res(g.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put({ ...dir, active: '' }, 'propapp:dir'); tx.oncomplete = res; }); });
(async () => {
  // C-01 (pure part): alignPlan never snaps the S8 date past the window (3 months from today with no stock check on record).
  { const esbuild = require('esbuild'); const out = path.join(TMP, 'align.cjs');
    esbuild.buildSync({ entryPoints: [path.resolve(__dirname, '../src/align.js')], bundle: true, platform: 'node', format: 'cjs', outfile: out, loader: { '.json': 'json', '.css': 'text' }, logLevel: 'silent' });
    const A = require(out); const ph = { services: {}, schedule: { B1: '2027-04-20' }, records: [], staff: [], flags: {}, intervals: {} };
    const b1 = A.alignPlan(ph, TODAY).find(x => x.id === 'B1');
    ok(!b1 || b1.to <= '2027-02-26', 'C-01 align: with no stock check, the S8 date is never aligned past 3 months from today (' + (b1 ? b1.to : 'not moved') + ')');
    ph.records = [{ type: 'B1', date: '2026-07-01', answers: [], fields: { stockDate: '2026-07-01' } }]; ph.schedule.B1 = '2026-12-05';
    const b2 = A.alignPlan(ph, TODAY).find(x => x.id === 'B1');
    ok(!b2 || b2.to <= '2026-12-10', 'C-01 align: when the S8 check is already overdue, alignment stays inside the 14-day window'); }

  const { b, p, errors } = await phone({ time: TIME });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Harbour Lane Pharmacy'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  // C-01: first dates. The S8 date input is capped at 3 months from today (no stock check yet), and a later date is refused.
  await tap(p, 'Plan the dates'); await p.waitForTimeout(250);
  const b1 = p.locator('input[name=B1]');
  ok(await b1.getAttribute('max') === '2027-02-26', 'C-01 first dates: the S8 date has max 3 months from today when no stock check is recorded');
  await b1.fill('2027-04-01'); await tap(p, 'Save these dates'); await p.waitForTimeout(250);
  ok(!(await activePh(p)).schedule.B1 && /on or before 26 Feb/.test(await text(p)), 'C-01 first dates: a date past the 3-month limit is not saved, and the limit is shown');
  await b1.fill('2027-01-15'); await tap(p, 'Save these dates'); await p.waitForTimeout(300);
  ok((await activePh(p)).schedule.B1 === '2027-01-15', 'C-01 first dates: a date inside the limit saves');
  // C-01: Today keeps "Add your last S8 stocktake date" because no stock-check date exists yet, even though B1 has a date.
  ok(await p.getByRole('button', { name: 'Add your last S8 stocktake date' }).count() === 1, 'C-01 Today: the S8 stocktake prompt stays after a due date is set, until a stock-check date is recorded');
  // C-01: Change due date also caps at 3 months from today.
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await p.waitForTimeout(200);
  await tap(p, 'Change due date'); await p.waitForTimeout(200);
  ok(await p.locator('form[data-form=due] input[name=date]').getAttribute('max') === '2027-02-26', 'C-01 due date: max is 3 months from today with no stock check on record');
  await p.screenshot({ path: path.join(TMP, 'due.png') });
  await tap(p, 'Back'); await tap(p, 'Back'); await tap(p, 'Today');

  // C-02: a backup whose S8 stock check is 4 months old (so the S8 check is overdue). Restoring the same file twice replaces.
  const ph = await activePh(p); const old = structuredClone(ph);
  old.records.push({ id: 'r-old', type: 'B1', kind: 'review', title: 'S8 stock check', date: '2026-07-01', by: 'Sam Owner', answers: [], actionIds: [], fields: { stockDate: '2026-07-01' } });
  old.schedule.B1 = '2026-10-01';
  const file = path.join(TMP, 'harbour-backup.json'); fs.writeFileSync(file, JSON.stringify({ app: 'PropApp', product: 'PharmLedger', format: 1, exportedAt: new Date().toISOString(), pharmacy: old, drafts: {} }));
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).tap(); await p.waitForTimeout(250);
  const inp = p.locator('input[type=file][data-change=restore]');
  await inp.setInputFiles(file); await p.waitForTimeout(400);
  ok(/already on this device/.test(await text(p)) && await inp.inputValue() === '', 'C-02 restore: the first pick asks to choose the file again and clears the file input so the same file fires again');
  ok((await activePh(p)).records.length === 0, 'C-02 restore: nothing is replaced on the first pick');
  await inp.setInputFiles(file); await p.waitForTimeout(600);
  ok((await activePh(p)).records.length === 1, 'C-02 restore: choosing the same file again replaces the pharmacy');
  await p.waitForTimeout(200);
  // C-02: navigation disarms the replace.
  await tap(p, 'Today'); await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).tap(); await p.waitForTimeout(250);
  fs.writeFileSync(file, JSON.stringify({ app: 'PropApp', format: 1, pharmacy: { ...old, records: [] }, drafts: {} }));
  await inp.setInputFiles(file); await p.waitForTimeout(400);
  await tap(p, 'Back'); await p.getByRole('button', { name: /^Backup and devices/ }).tap(); await p.waitForTimeout(250);
  await inp.setInputFiles(file); await p.waitForTimeout(400);
  ok((await activePh(p)).records.length === 1 && /already on this device/.test(await text(p)), 'C-02 restore: leaving the screen disarms it, so the next pick asks again instead of replacing');
  await tap(p, 'Back'); await tap(p, 'Today'); await p.waitForTimeout(250);

  // C-01 overdue: the stock check was 1 Jul, so the 3-month limit (1 Oct) has passed. A short window (to 10 Dec) opens instead of a deadlock.
  ok(await p.getByRole('button', { name: 'Add your last S8 stocktake date' }).count() === 0, 'C-01 Today: the S8 stocktake prompt goes once a stock-check date is recorded');
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await p.waitForTimeout(200);
  await tap(p, 'Change due date'); await p.waitForTimeout(200);
  const due = p.locator('form[data-form=due] input[name=date]');
  ok(await due.getAttribute('max') === '2026-12-10' && /overdue/.test(await text(p)), 'C-01 overdue: the due date allows today to +14 days (max 10 Dec), not a max in the past');
  await due.fill('2026-12-20'); await p.fill('form[data-form=due] input[name=why]', 'Fictional reason'); await tap(p, 'Save date'); await p.waitForTimeout(250);
  ok((await activePh(p)).schedule.B1 === '2026-10-01', 'C-01 overdue: a date past the 14-day window is refused');
  await due.fill('2026-12-03'); await tap(p, 'Save date'); await p.waitForTimeout(300);
  ok((await activePh(p)).schedule.B1 === '2026-12-03', 'C-01 overdue: a date inside the window saves (no deadlock)');
  await p.screenshot({ path: path.join(TMP, 's8.png') });
  await tap(p, 'Back'); await tap(p, 'Today');

  // C-05: with a real pharmacy (records, not test or fictional) here, Reset test data is blocked.
  await p.locator('#uat-btn').click(); await p.waitForTimeout(200);
  ok(await p.locator('#uat-dlg [data-reset]').count() === 0 && /Reset test data is off/.test(await p.locator('#uat-dlg').innerText()), 'C-05 UAT: Reset test data is blocked while a real pharmacy is on the device, with backup + delete guidance');
  await p.locator('#uat-dlg [data-x]').click(); await p.waitForTimeout(150);

  // C-03: Set up another pharmacy keeps the open one; Back from Step 1 returns to it.
  const id = (await saved(p))['propapp:dir'].active;
  await tap(p, 'More'); await p.getByRole('button', { name: /^Pharmacies on this device/ }).tap(); await p.waitForTimeout(200);
  await tap(p, 'Set up another pharmacy'); await p.waitForTimeout(300);
  ok(/Step 1 of 3/.test(await text(p)) && (await saved(p))['propapp:dir'].active === id, 'C-03 another pharmacy: Step 1 opens and the open pharmacy stays active');
  await tap(p, 'Back'); await p.waitForTimeout(300);
  ok(/Pharmacies/.test(await text(p)) && /Harbour Lane Pharmacy/.test(await text(p)) && !/Step 1 of 3/.test(await text(p)), 'C-03 Back from Step 1 returns to the open pharmacy');
  await tap(p, 'Set up another pharmacy'); await p.waitForTimeout(300);
  ok(/Step 1 of 3/.test(await text(p)) && await p.locator('input[name=name]').inputValue() === '', 'C-03 another pharmacy: a second start is a fresh setup');
  await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await tap(p, 'Finish setup'); await p.waitForTimeout(500);
  const dir = (await saved(p))['propapp:dir']; ok(dir.ids.length === 2 && dir.active !== id, 'C-03 another pharmacy: Step 3 creates and opens the new pharmacy');
  // C-03: an empty active (an older build's lockout) shows "Back to [Pharmacy]" on the welcome screen.
  await clearActive(p); await p.reload(); await p.waitForTimeout(500);
  const backTo = p.getByRole('button', { name: /^Back to / });
  ok(await backTo.count() === 1, 'C-03 welcome: “Back to [Pharmacy]” shows when pharmacies exist but none is open');
  await p.screenshot({ path: path.join(TMP, 'welcome.png') });
  await backTo.tap(); await p.waitForTimeout(400);
  ok(/Today/.test(await text(p)) && !!(await saved(p))['propapp:dir'].active, 'C-03 welcome: “Back to” opens that pharmacy');
  await done(b, errors.concat(await (async () => {
    // C-05: with only test or fictional pharmacies, Reset test data is still offered.
    const s = await phone({ time: TIME }); await tap(s.p, 'Set up your pharmacy'); await s.p.fill('input[name=name]', 'Reset Test Pharmacy (fictional)'); await tap(s.p, 'Continue'); await s.p.fill('input[name=owner0]', 'Sam Owner'); await tap(s.p, 'Continue'); await tap(s.p, 'Finish setup'); await s.p.waitForTimeout(400);
    await s.p.locator('#uat-btn').click(); await s.p.waitForTimeout(200);
    ok(await s.p.locator('#uat-dlg [data-reset]').count() === 1, 'C-05 UAT: Reset test data is offered when every pharmacy is test or fictional');
    await s.b.close(); return s.errors; })()));
})().catch(e => { console.log('FAIL crashed: ' + e.message); process.exit(1); });
