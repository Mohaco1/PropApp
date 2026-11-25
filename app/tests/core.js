// Core loop, tapped like a person on a phone: example pharmacy → Today → quarterly visit while an extra visit is open
// → answer every check (one issue) → save → action raised → close it with what you saw. Fails on any console error.
const { phone, ok, done, tap, text, saved } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(500);
  let t = await text(p);
  ok(/Wattle Grove Pharmacy/.test(t) && /Extra visit (· 4 checked|in progress · 4 checked)/.test(t), 'Today shows the extra visit in progress (one line while a legal item is overdue)');
  ok(/\d+ things are overdue/.test(t), 'status sentence: ' + (t.match(/\d+ things? (is|are) overdue/) || [''])[0]);
  ok((t.match(/Ben Carter/g) || []).length <= 1, 'Ben Carter is one row on Today');
  ok(await p.locator('.row', { hasText: 'S8 stock check' }).count() === 1, 'one S8 row on Today');
  // quarterly visit from the Today list while the extra visit stays open (F-03)
  await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await p.waitForTimeout(300);
  t = await text(p); ok(/This counts as your quarterly visit/.test(t), 'Start a visit opens on Quarterly');
  await tap(p, 'Start the checks'); await p.waitForTimeout(300);
  t = await text(p); ok(/Check 1 of 14/.test(t), 'quarterly checks start at 1 of 14');
  for (let i = 0; i < 14; i++) {
    const label = i === 1 ? 'Issue' : 'Satisfactory';
    await p.locator('label.choice', { hasText: new RegExp('^' + label + '$') }).click(); await p.waitForTimeout(80);
    if (i === 1) { await p.fill('textarea[name=text]', 'Fridge log missing Sunday readings'); await p.locator('textarea[name=text]').blur(); }
    if (await p.locator('input[name=vaccEvent]').count()) { await p.locator('label.choice', { hasText: /^No$/ }).click(); await p.locator('label.choice', { hasText: /^Yes$/ }).last().click(); await p.waitForTimeout(80); await p.fill('input[name=vaccDate]', '2026-10-01'); await p.locator('input[name=vaccDate]').blur(); }
    await p.getByRole('button', { name: i === 13 ? 'Finish' : 'Next' }).click(); if (i < 13) await p.waitForFunction(n => document.body.innerText.includes('Check ' + n + ' of 14'), i + 2); await p.waitForTimeout(80);
  }
  t = await text(p); ok(/1 issue becomes an action/.test(t), 'finish screen: 1 issue becomes an action');
  await p.waitForTimeout(300); ok(Object.entries(await saved(p)).every(([k, v]) => !k.startsWith('propapp:drafts:') || !Object.keys(v || {}).some(x => x.includes('/conflict-'))), 'quick saves on one phone never make a conflict copy');
  await tap(p, 'Save visit'); await p.waitForTimeout(400);
  t = await text(p); ok(/Extra visit (· 4 checked|in progress · 4 checked)/.test(t), 'extra visit still in progress after saving the quarterly one');
  const st = await p.evaluate(async () => { const r = indexedDB.open('propapp'); return await new Promise(res => { r.onsuccess = () => { const tx = r.result.transaction('kv'); const g = tx.objectStore('kv').getAll(); g.onsuccess = () => res(g.result.filter(v => v && v.records).map(ph => ({ visits: ph.records.filter(x => x.type === 'Q1').length, q1: ph.schedule.Q1, acts: Object.values(ph.actions).filter(a => a.title === 'Fridge log missing Sunday readings').length }))); }; }); });
  ok(st[0] && st[0].visits === 4 && st[0].acts === 1 && st[0].q1 === '2027-02-24', 'visit saved, action raised, next quarterly date set: ' + JSON.stringify(st));
  // close the new action
  await tap(p, 'Actions'); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Fridge log missing Sunday readings/ }).click(); await p.waitForTimeout(200);
  await tap(p, 'Seen the fix · close it'); await p.fill('textarea[name=what]', 'Weekend readings filled in since; checked the log'); await tap(p, 'Close action'); await p.waitForTimeout(300);
  t = await text(p); ok(/Closed/.test(t) && /What you saw/i.test(t), 'action closed with what was seen'); if (!/What you saw/i.test(t)) console.log(t.slice(0, 600));
  await done(b, errors);
})();
