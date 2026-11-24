// Restore an old R.Pharmacy backup (receipt), search, "How often", and the first visit after buying. Real taps.
const { phone, ok, done, tap, text, activePh, download } = require('./helpers.js'); const path = require('path'); const fs = require('fs'); const os = require('os');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  const file = path.join(os.tmpdir(), 'wattle-old-backup.json'); fs.writeFileSync(file, JSON.stringify(require('../../uat/demo/wattle-grove.json').backup));
  await p.locator('input[type=file]').setInputFiles(file); await p.waitForTimeout(800);
  let t = await text(p); ok(/Restored/.test(t) && /Wattle Grove Pharmacy/.test(t) && /\d+ recorded reviews/.test(t), 'restore receipt after an old R.Pharmacy backup');
  await tap(p, 'Go to Today'); await p.getByRole('button', { name: 'Search' }).click(); await p.locator('input[name=q]').click(); await p.keyboard.type('S8', { delay: 40 }); await p.waitForTimeout(200);
  t = await text(p); ok(/S8 stock check/.test(t) && /Legal obligation/.test(t), 'search finds the S8 review and S8 rules');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Reviews'); await p.getByRole('button', { name: /Home delivery/ }).first().click();
  await p.getByRole('button', { name: /How often/ }).click(); await p.locator('label.choice', { hasText: 'Six-monthly' }).click(); await tap(p, 'Save'); await p.waitForTimeout(200);
  t = await text(p); ok(/How often: Six-monthly/.test(t), 'interval changed to six-monthly');
  await tap(p, 'More'); await p.getByRole('button', { name: /Bought, selling/ }).click(); await tap(p, 'I’ve just bought this pharmacy'); await p.waitForTimeout(200);
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await p.waitForTimeout(200);
  t = await text(p); ok(/From the previous owner/i.test(t) && /Is that still how this pharmacy runs/.test(t), 'first visit after buying asks to confirm the previous owner’s records');
  // calendar file
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click();
  const ics = await download(p, 'Download calendar file');
  ok(/^BEGIN:VCALENDAR/.test(ics) && /TRIGGER:-P1D/.test(ics) && /SUMMARY:\[Required by law\] S8 stock check/.test(ics), 'calendar file is a valid VCALENDAR with day-before reminders');
  // waiting on someone: "Still waiting" keeps the due date
  await tap(p, 'Actions'); await p.getByRole('button', { name: /fire extinguisher/ }).click(); const due0 = Object.values((await activePh(p)).actions).find(a => /extinguisher/.test(a.title)).due;
  await tap(p, 'Still waiting · new date'); await p.fill('textarea[name=asked]', 'Chased FireSafe again (fictional)'); await p.locator('label.chip', { hasText: 'In 2 weeks' }).click(); await tap(p, 'Save'); await p.waitForTimeout(200);
  const a1 = Object.values((await activePh(p)).actions).find(a => /extinguisher/.test(a.title));
  ok(a1.due === due0 && a1.waiting && /Chased FireSafe/.test(a1.waiting.asked), 'Still waiting keeps the due date (' + due0 + ') and records the new ask');
  // leaving: S8 codes and e-register
  await tap(p, 'Staff'); await p.getByRole('button', { name: /Grace Li/ }).click(); await tap(p, 'Leaving');
  t = await text(p); ok(/Personal S8 safe codes or biometrics removed/.test(t) && /Electronic drug register login removed/.test(t), 'leaving checklist includes S8 codes and the e-register');
  for (const card of await p.locator('form .card').all()) await card.locator('label.choice').first().click();
  await p.locator('form .card').nth(2).locator('label.choice', { hasText: 'Not yet' }).click(); await tap(p, 'Move to former staff'); await p.waitForTimeout(200);
  let ph = await activePh(p); ok(ph.staff.find(x => x.name === 'Grace Li').active === false && Object.values(ph.actions).some(a => /Personal S8 safe codes/.test(a.title) && a.status === 'open'), 'leaving saved; "Not yet" on S8 codes raised an action');
  // locum quick check
  await p.getByRole('button', { name: /^Locums/ }).click(); await tap(p, 'Locum on duty · quick check'); await p.fill('input[name=name]', 'Lee Locum (fictional)');
  for (const card of await p.locator('form .card').all()) await card.locator('label.choice', { hasText: 'Done' }).click(); await tap(p, 'Save'); await p.waitForTimeout(200);
  ph = await activePh(p); ok(ph.staff.some(x => x.name === 'Lee Locum (fictional)' && x.engagement === 'Locum') && ph.records.some(r => r.title === 'Locum check · Lee Locum (fictional)'), 'locum check saved as a record');
  await done(b, errors);
})();
