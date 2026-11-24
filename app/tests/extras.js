// Restore an old R.Pharmacy backup (receipt), search, "How often", and the first visit after buying. Real taps.
const { phone, ok, done, tap, text } = require('./helpers.js'); const path = require('path'); const fs = require('fs'); const os = require('os');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  const file = path.join(os.tmpdir(), 'wattle-old-backup.json'); fs.writeFileSync(file, JSON.stringify(require('../../uat/demo/wattle-grove.json').backup));
  await p.locator('input[type=file]').setInputFiles(file); await p.waitForTimeout(800);
  let t = await text(p); ok(/Restored/.test(t) && /Wattle Grove Pharmacy/.test(t) && /\d+ recorded reviews/.test(t), 'restore receipt after an old R.Pharmacy backup');
  await tap(p, 'Go to Today'); await p.getByRole('button', { name: 'Search' }).click(); await p.fill('input[name=q]', 'S8'); await p.locator('input[name=q]').blur(); await p.waitForTimeout(200);
  t = await text(p); ok(/S8 stock check/.test(t) && /Legal obligation/.test(t), 'search finds the S8 review and S8 rules');
  await p.getByRole('button', { name: /^Back$/ }).click(); await tap(p, 'Reviews'); await p.getByRole('button', { name: /Home delivery/ }).first().click();
  await p.getByRole('button', { name: /How often/ }).click(); await p.locator('label.choice', { hasText: 'Six-monthly' }).click(); await tap(p, 'Save'); await p.waitForTimeout(200);
  t = await text(p); ok(/How often: Six-monthly/.test(t), 'interval changed to six-monthly');
  await tap(p, 'More'); await p.getByRole('button', { name: /Bought, selling/ }).click(); await tap(p, 'I’ve just bought this pharmacy'); await p.waitForTimeout(200);
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await p.waitForTimeout(200);
  t = await text(p); ok(/From the previous owner/i.test(t) && /Is that still how this pharmacy runs/.test(t), 'first visit after buying asks to confirm the previous owner’s records');
  await done(b, errors);
})();
