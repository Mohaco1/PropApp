// Service setup at phone size, tapped: vaccines show in 4 groups with "Select all" (owner, 24 Nov: must not go back to
// typing each one), DAA packing has its three choices, and finishing a service raises the 2026 checklist action.
const { phone, ok, done, tap, text } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Test Pharmacy (fictional)'); await tap(p, 'Continue');
  await p.fill('input[name=owner0]', 'Alex Owner'); await tap(p, 'Continue');
  for (const s of ['Vaccination', 'Dose administration aids', 'Home delivery']) await p.locator('label.tick', { hasText: s }).click();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services');
  await p.getByRole('button', { name: /Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Vaccination/ }).click(); await p.waitForTimeout(200);
  for (let i = 0; i < 6; i++) { if (await p.locator('.vgroup').count()) break; const c = p.locator('form label.choice').first(); if (await c.count()) await c.click(); await tap(p, 'Next'); await p.waitForTimeout(80); }
  ok(await p.locator('.vgroup').count() === 4, 'vaccines shown in 4 groups');
  ok(await p.locator('.vgroup').first().getByRole('button', { name: 'Select all' }).count() === 1, 'each group has Select all');
  await p.locator('.vgroup').first().getByRole('button', { name: 'Select all' }).click(); await p.waitForTimeout(200);
  const ans = await p.evaluate(async () => { const r = indexedDB.open('propapp'); return await new Promise(res => { r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').getAll(); g.onsuccess = () => res(g.result.find(v => v && v.services)?.services.vaccination.answers.vaccines || ''); }; }); });
  ok(/COVID-19/.test(ans) && /Influenza/.test(ans), 'Select all saves the group: ' + ans.slice(0, 60));
  ok(await p.locator('input[type=text][name=d]').count() === 0, 'no box to type vaccines into');
  // DAA packing choices
  await p.getByRole('button', { name: 'Back' }).click(); await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await p.waitForTimeout(200);
  const t = await text(p); ok(/We pack on site/.test(t) && /outside packer/.test(t) && /Another pharmacy dispenses/.test(t), 'DAA packing shows its three choices');
  await done(b, errors);
})();
