// Overnight brief Sprint 5 acceptance checks (S5-01 to S5-03). Real taps at 390×844. The one simulated step: a newer
// copy of a draft written straight into storage, as another device would (S5-02); everything else is tapped.
const { phone, ok, done, tap, text, activePh, saved, download } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(600);
  const more = name => tap(p, 'More').then(() => p.getByRole('button', { name }).first().click());
  // S5-02 (a): looking around without changing anything writes nothing
  await p.waitForTimeout(500); const snap = JSON.stringify(await saved(p));
  for (const tab of ['Reviews', 'Actions', 'Staff', 'More', 'Today']) { await tap(p, tab); await p.waitForTimeout(120); }
  await tap(p, 'Reviews'); await p.locator('.row').first().click(); await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Staff'); await p.locator('.row').first().click(); await p.getByRole('button', { name: 'Back', exact: true }).click();
  await more(/^Calendar/); await tap(p, 'Year plan'); await more(/^Procedures/); await p.waitForTimeout(400);
  ok(JSON.stringify(await saved(p)) === snap, 'S5-02 an untouched session writes nothing');
  // S5-01 review summary download
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^Completed/ }).click(); await p.locator('.row', { hasText: 'Proprietor site visit' }).first().click();
  const sum = await download(p, 'Download summary');
  ok(/Wattle Grove Pharmacy/.test(sum) && /Proprietor site visit/.test(sum) && /Premises, security, equipment servicing[^:]*: Checked/.test(sum) && /Actions:/.test(sum), 'S5-01 review summary downloads with answers and actions');
  // action full history
  await tap(p, 'Actions'); await p.getByRole('button', { name: /fire extinguisher/ }).click(); await p.locator('summary', { hasText: 'Full history' }).click();
  const hist = await download(p, 'Download'); ok(/Asked for: Service date from FireSafe/.test(hist) && /Action: Service the dispensary fire extinguisher/.test(hist), 'S5-01 action full history downloads');
  // print layout hides the chrome
  await more(/^History/); await p.emulateMedia({ media: 'print' });
  ok(await p.evaluate(() => ['.nav', '.bar', '#uat-btn'].every(s => !document.querySelector(s) || getComputedStyle(document.querySelector(s)).display === 'none') && getComputedStyle(document.querySelector('.print-only')).display !== 'none'), 'S5-01 printing History hides the bottom bar, header and UAT pill');
  await p.emulateMedia({ media: 'screen' });
  // S5-02 stale write: another device saves a newer extra-visit draft; this phone then changes its older copy
  await tap(p, 'Today'); await tap(p, 'Resume visit'); await p.waitForTimeout(200);
  await p.evaluate(async () => { const r = indexedDB.open('propapp'); const dbh = await new Promise(res => { r.onsuccess = () => res(r.result); });
    const dir = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get('propapp:dir'); g.onsuccess = () => res(g.result); });
    const k = 'propapp:drafts:' + dir.active; const cur = await new Promise(res => { const g = dbh.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result); });
    cur['visit/extra'] = { ...cur['visit/extra'], notes: 'Changed on the other device', rev: Date.now() + 99999 };
    await new Promise(res => { const tx = dbh.transaction('kv', 'readwrite'); tx.objectStore('kv').put(cur, k); tx.oncomplete = res; }); });
  await p.locator('label.choice', { hasText: /^Satisfactory$/ }).click(); await p.waitForTimeout(600);
  const all = await saved(p), dk = Object.keys(all).find(k => k.startsWith('propapp:drafts:') && all[k]['visit/extra']), dr = all[dk];
  ok(dr['visit/extra'].notes === 'Changed on the other device', 'S5-02 the newer copy from elsewhere is untouched');
  ok(Object.keys(dr).some(k => k.startsWith('visit/extra/conflict-')), 'S5-02 this phone’s older copy is kept as a conflict copy');
  await p.reload(); await p.waitForTimeout(600); await more(/^Backup and devices/); await p.waitForTimeout(300);
  let t = await text(p); ok(/CONFLICT COPIES · 1/i.test(t) && /Extra visit · copy from/.test(t), 'S5-02 the conflict copy is listed under Backup and devices');
  ok(/Using \d+\.\d MB of about \d+ MB|doesn’t report storage/.test(t), 'S5-02 storage status shows');
  await p.getByRole('button', { name: 'Dismiss', exact: true }).click(); await p.waitForTimeout(200); ok(/CONFLICT COPIES · 0/i.test(await text(p)), 'S5-02 the conflict copy can be dismissed');
  // S5-03 UAT tools: question marks, Clear all, Reset test data
  await more(/^Services/); await p.getByRole('button', { name: /^Home delivery/ }).click(); await tap(p, 'Edit answers');
  await p.locator('.uatq .chip', { hasText: 'Must always ask' }).click(); await p.waitForTimeout(150);
  ok(await p.locator('.uatq .chip.on', { hasText: 'Must always ask' }).count() === 1, 'S5-03 setup questions can be marked for UAT');
  await p.locator('#uat-btn').click(); await p.fill('#uat-dlg textarea', 'A test note (fictional)'); await p.locator('#uat-dlg [data-add]').click(); await p.waitForTimeout(200);
  ok(/A test note \(fictional\)/.test(await p.locator('#uat-dlg').innerText()), 'S5-03 a UAT note is added');
  await p.locator('#uat-dlg [data-clear]').click(); await p.locator('#uat-dlg [data-clear]').click(); await p.waitForTimeout(200);
  ok(!/A test note/.test(await p.locator('#uat-dlg').innerText()), 'S5-03 Clear all (two taps) empties the notes');
  await p.locator('#uat-dlg [data-reset]').click(); await Promise.all([p.waitForNavigation(), p.locator('#uat-dlg [data-reset]').click()]); await p.waitForTimeout(800);
  ok(/Set up your pharmacy/.test(await text(p)) && Object.keys(await saved(p)).filter(k => k.startsWith('propapp:ph:')).length === 0, 'S5-03 Reset test data returns to Welcome with no pharmacies stored');
  await done(b, errors);
})();
