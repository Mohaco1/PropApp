// Delete any pharmacy (28 Nov 2026, owner), by real taps at 390×844; fails on any console error.
// Archive or delete lists every pharmacy (open now, others, archived), each with Delete, whatever it holds. Delete opens a
// sheet where "Delete permanently" stays disabled until DELETE is typed (any case). Deleting leaves the D3 tombstone
// (propapp:tomb:<id>); deleting the open one opens the next active pharmacy, or the welcome screen when none is left.
const { phone, ok, done, tap, text, saved } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-28T10:00:00+11:00' });
  const setup = async name => { await p.fill('input[name=name]', name); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await tap(p, 'Finish setup'); await p.waitForTimeout(400); };
  const pharmacies = async () => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: /^Pharmacies on this device/ }).first().click(); await p.waitForTimeout(300); };
  const manage = async () => { await pharmacies(); await tap(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(250); };
  const rowOf = name => p.locator('.row.static', { hasText: name });
  const sheetBtn = () => p.locator('.sheet').getByRole('button', { name: 'Delete permanently' });
  const tombed = (all, id) => !all['propapp:ph:' + id] && !all['propapp:drafts:' + id] && !!all['propapp:tomb:' + id]?.deletedAt && all['propapp:dir'].tombstones?.[id] === all['propapp:tomb:' + id].deletedAt;

  // A real-looking pharmacy (no "test" or "fictional" in its name) with an action recorded: the old rule never offered Delete.
  await tap(p, 'Set up your pharmacy'); await setup('Brightwater Lane Pharmacy');
  const a = (await saved(p))['propapp:dir'].active;
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action' }).click(); await p.fill('input[name=title]', 'Fix the fridge door seal'); await tap(p, 'Save action'); await p.waitForTimeout(400);
  ok(Object.keys((await saved(p))['propapp:ph:' + a].actions).length === 1, 'Brightwater Lane Pharmacy has an action recorded');
  await pharmacies(); await tap(p, 'Set up another pharmacy'); await p.waitForTimeout(250); await setup('Second Test Pharmacy (fictional)');
  const bId = (await saved(p))['propapp:dir'].active; ok(bId && bId !== a, 'a second pharmacy is set up and open');
  await pharmacies(); await p.getByRole('button', { name: /^Brightwater Lane Pharmacy/ }).first().click(); await p.waitForTimeout(400);
  ok((await saved(p))['propapp:dir'].active === a, 'switched back to Brightwater Lane Pharmacy');

  // 1. Every pharmacy has Delete, including the open one with an action.
  await manage(); const t1 = await text(p);
  ok(await p.getByRole('button', { name: 'Delete', exact: true }).count() === 2 && await rowOf('Brightwater Lane Pharmacy').getByRole('button', { name: 'Delete', exact: true }).count() === 1, 'Delete is shown for both pharmacies, including the open one with an action');
  ok(/Open now · 0 records · 1 action/.test(t1) && await rowOf('Brightwater Lane Pharmacy').getByRole('button', { name: 'Archive' }).count() === 0 && await rowOf('Second Test Pharmacy').getByRole('button', { name: 'Archive' }).count() === 1, 'the open one is marked “Open now” and offers no Archive; the other offers Archive');
  ok(/after you type DELETE to confirm/.test(t1) && !/offered only for test|switch to another first/.test(t1), 'the intro copy describes the new rule (no empty-only or switch-first wording)');

  // 2. The DELETE confirmation for the open pharmacy.
  await rowOf('Brightwater Lane Pharmacy').getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(250);
  ok(await p.locator('.sheet').count() === 1 && /Delete Brightwater Lane Pharmacy for good\?/.test(await text(p)) && /removes the pharmacy and all its records \(0 records, 1 action\) from this device for good/.test(await text(p)), 'Delete opens a sheet that says it removes the pharmacy and its records for good');
  ok(/Second Test Pharmacy \(fictional\) opens next/.test(await text(p)) && await p.locator('.sheet').getByRole('button', { name: 'Download its backup first' }).count() === 1, 'it says which pharmacy opens next and offers a backup first');
  ok(await sheetBtn().isDisabled() && !!(await saved(p))['propapp:ph:' + a], '“Delete permanently” is disabled before anything is typed; nothing is deleted yet');
  await p.locator('.sheet input[name=deltype]').fill('DELET'); ok(await sheetBtn().isDisabled(), 'still disabled for “DELET”');
  await p.locator('.sheet').getByRole('button', { name: 'Cancel' }).click(); await p.waitForTimeout(200);
  ok(await p.locator('.sheet').count() === 0 && !!(await saved(p))['propapp:ph:' + a], 'Cancel closes the sheet and keeps the pharmacy');
  await rowOf('Brightwater Lane Pharmacy').getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(250);
  ok(await p.locator('.sheet input[name=deltype]').inputValue() === '' && await sheetBtn().isDisabled(), 'opening it again starts with an empty box');
  await p.locator('.sheet input[name=deltype]').fill('delete'); ok(!(await sheetBtn().isDisabled()), 'typing “delete” (any case) enables “Delete permanently”');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no sideways scroll with the sheet open');
  await p.screenshot({ path: path.join(OUT, '60_delete_confirm_390px.png') });
  await sheetBtn().click(); await p.waitForTimeout(700);
  let all = await saved(p);
  ok(tombed(all, a) && !all['propapp:dir'].ids.includes(a), 'the open pharmacy with an action is gone, leaving a propapp:tomb:<id> tombstone (also in the directory)');
  ok(all['propapp:dir'].active === bId && /Second Test Pharmacy/.test(await p.locator('header').first().innerText()) && await p.locator('nav').count() === 1, 'the other pharmacy opens, on Today');
  ok(/Deleted Brightwater Lane Pharmacy from this device\. Second Test Pharmacy \(fictional\) is open now\./.test(await text(p)), 'it says what was deleted and what is open now');
  await p.screenshot({ path: path.join(OUT, '61_delete_switched_390px.png') });

  // 3. An archived pharmacy can be deleted too.
  await pharmacies(); await tap(p, 'Set up another pharmacy'); await p.waitForTimeout(250); await setup('Third Test Pharmacy (fictional)');
  const cId = (await saved(p))['propapp:dir'].active;
  await manage(); await rowOf('Second Test Pharmacy').getByRole('button', { name: 'Archive' }).click(); await p.waitForTimeout(300);
  ok(((await saved(p))['propapp:dir'].archived || []).includes(bId) && /Archived · 0 records · 0 actions/.test(await text(p)) && await rowOf('Second Test Pharmacy').getByRole('button', { name: 'Delete', exact: true }).count() === 1, 'an archived pharmacy is still listed, with Delete');
  await rowOf('Second Test Pharmacy').getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(250);
  await p.locator('.sheet input[name=deltype]').fill(' Delete '); await sheetBtn().click(); await p.waitForTimeout(600);
  all = await saved(p);
  ok(tombed(all, bId) && !(all['propapp:dir'].archived || []).includes(bId) && all['propapp:dir'].active === cId, 'the archived pharmacy is deleted with a tombstone; the open one stays open');
  ok(await p.locator('.bar-title, header').first().innerText().then(x => /Archive or delete/.test(x)) && await rowOf('Second Test Pharmacy').count() === 0, 'it stays on Archive or delete, without the deleted row');

  // 4. The only pharmacy left (open) returns to the welcome screen.
  await rowOf('Third Test Pharmacy').getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(250);
  ok(/You’ll go back to the welcome screen/.test(await text(p)), 'for the last pharmacy it says you’ll go back to the welcome screen');
  await p.locator('.sheet input[name=deltype]').fill('DELETE'); await sheetBtn().click(); await p.waitForTimeout(700);
  all = await saved(p);
  ok(tombed(all, cId) && all['propapp:dir'].ids.length === 0 && !all['propapp:dir'].active, 'the last pharmacy is gone with a tombstone; nothing is open');
  ok(await p.locator('.welcome').count() === 1 && await p.getByRole('button', { name: 'Set up your pharmacy' }).count() === 1 && await p.locator('nav').count() === 0, 'the welcome screen shows, without the tab bar');
  ok(/Deleted Third Test Pharmacy \(fictional\) from this device/.test(await text(p)), 'it says what was deleted');
  await p.screenshot({ path: path.join(OUT, '62_delete_last_welcome_390px.png') });
  await p.reload(); await p.waitForTimeout(700);
  ok(await p.locator('.welcome').count() === 1 && !(await saved(p))['propapp:ph:' + cId] && !(await saved(p))['propapp:ph:' + a], 'after a reload they stay deleted, on the welcome screen');
  await tap(p, 'Set up your pharmacy'); await setup('Fourth Test Pharmacy (fictional)');
  const d2 = (await saved(p))['propapp:dir'];
  ok(d2.ids.length === 1 && d2.active && ![a, bId, cId].includes(d2.active) && /Fourth Test Pharmacy/.test(await text(p)), 'a new pharmacy can be set up afterwards');
  await done(b, errors);
})();
