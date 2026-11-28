// Delete the only pharmacy on this device (28 Nov 2026), by real taps at 390×844; fails on any console error.
// More › Pharmacies always offers "Archive or delete a pharmacy"; with one pharmacy it offers Delete only (two taps),
// leaves the D3 tombstone (propapp:tomb:<id>), clears the open pharmacy and returns to the welcome screen.
const { phone, ok, done, tap, text, saved } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-28T10:00:00+11:00' });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Solo Test Pharmacy (fictional)'); await tap(p, 'Continue');
  await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const id = (await saved(p))['propapp:dir'].active;
  ok(!!id && (await saved(p))['propapp:dir'].ids.length === 1, 'one pharmacy set up and open');
  await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: /^Pharmacies on this device/ }).first().click(); await p.waitForTimeout(300);
  ok(await p.getByRole('button', { name: 'Archive or delete a pharmacy' }).count() === 1, 'Pharmacies shows "Archive or delete a pharmacy" with only one pharmacy');
  await tap(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(250);
  ok(/only pharmacy on this device/.test(await text(p)) && await p.getByRole('button', { name: 'Archive', exact: true }).count() === 0 && await p.getByRole('button', { name: 'Delete', exact: true }).count() === 1, 'the sole pharmacy is offered for Delete only (no Archive)');
  await p.getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(200);
  ok(await p.getByRole('button', { name: 'Tap again to delete for good' }).count() === 1 && (await saved(p))['propapp:ph:' + id], 'the first tap only arms it; nothing is deleted yet');
  await p.screenshot({ path: path.join(OUT, '60_delete_last_armed_390px.png') });
  await p.getByRole('button', { name: 'Tap again to delete for good' }).click(); await p.waitForTimeout(600);
  const all = await saved(p), d = all['propapp:dir'];
  ok(!all['propapp:ph:' + id] && !all['propapp:drafts:' + id] && all['propapp:tomb:' + id]?.deletedAt && d.tombstones?.[id] === all['propapp:tomb:' + id].deletedAt, 'its record is gone and a propapp:tomb:<id> tombstone is left (also in the directory)');
  ok(d.ids.length === 0 && !d.active, 'no pharmacy is open');
  ok(await p.locator('.welcome').count() === 1 && await p.getByRole('button', { name: 'Set up your pharmacy' }).count() === 1 && await p.locator('nav').count() === 0, 'the welcome screen shows, without the tab bar');
  ok(/Deleted Solo Test Pharmacy \(fictional\) from this device/.test(await text(p)), 'it says what was deleted');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no sideways scroll');
  await p.screenshot({ path: path.join(OUT, '61_delete_last_welcome_390px.png') });
  await p.reload(); await p.waitForTimeout(700);
  ok(await p.locator('.welcome').count() === 1 && !(await saved(p))['propapp:ph:' + id], 'after a reload it stays deleted, on the welcome screen');
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue');
  await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const d2 = (await saved(p))['propapp:dir'];
  ok(d2.ids.length === 1 && d2.active && d2.active !== id && /Second Test Pharmacy/.test(await text(p)), 'a new pharmacy can be set up afterwards');
  await done(b, errors);
})();
