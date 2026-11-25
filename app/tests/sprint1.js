// Gemini's Sprint 1 acceptance checks (24 Nov 2026), with real taps and real typing at 390×844. Fails on console errors.
const { phone, ok, done, tap, text } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  // N-04: a Content Security Policy inside <head>
  ok(await p.evaluate(() => !!document.querySelector('head meta[http-equiv="Content-Security-Policy"]')), 'N-04 CSP meta is inside <head>');
  ok(await p.evaluate(() => /connect-src 'none'/.test(document.querySelector('head meta[http-equiv="Content-Security-Policy"]')?.content || '')), 'N-04 CSP blocks network connections');
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(500);
  // N-05: Today and Calendar agree on overdue
  const todayOver = +(await p.locator('.filters button', { hasText: 'Overdue' }).locator('b').innerText());
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click(); await p.waitForTimeout(200);
  const calOver = +((await text(p)).match(/OVERDUE · (\d+)/i) || [])[1];
  ok(todayOver === calOver, `N-05 Today overdue (${todayOver}) = Calendar overdue (${calOver})`);
  ok(/IN PROGRESS · 1/i.test(await text(p)), 'N-05 extra visit sits under In progress, not Overdue');
  // N-12: Reviews keeps the quarterly visit overdue while only the extra visit is open
  await tap(p, 'Reviews'); const rv = await p.locator('.row', { hasText: 'Proprietor site visit' }).innerText();
  ok(/Overdue/.test(rv) && !/In progress/.test(rv), 'N-12 quarterly visit shows Overdue, not In progress: ' + rv.replace(/\n/g, ' '));
  // N-02: search while typing
  await tap(p, 'Today'); await p.getByRole('button', { name: 'Search' }).click(); await p.locator('input[name=q]').click(); await p.keyboard.type('fridge', { delay: 40 }); await p.waitForTimeout(200);
  ok(await p.locator('#sr .row', { hasText: /Fridge/i }).count() >= 1, 'N-02 typing "fridge" finds the fridge action');
  await p.locator('#sr .row', { hasText: /Fridge/i }).first().click(); await p.waitForTimeout(200);
  ok(/Seen the fix · close it/.test(await text(p)), 'N-02 tapping the result opens the action');
  // N-03: Issue keeps you on the check
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.waitForTimeout(200);
  const before = ((await text(p)).match(/Check (\d+) of 14/) || [])[1];
  await p.locator('label.choice', { hasText: /^Issue$/ }).click(); await p.waitForTimeout(250);
  let t = await text(p); const after = (t.match(/Check (\d+) of 14/) || [])[1];
  ok(before === after && /What did you find\?/.test(t), `N-03 Issue stays on check ${before} (now ${after}) and asks what you found`);
  await p.fill('textarea[name=text]', 'Two open actions have no due date'); await p.locator('textarea[name=text]').blur(); await p.waitForTimeout(150);
  ok(((await text(p)).match(/Check (\d+) of 14/) || [])[1] === before, 'N-03 still on the same check after typing the finding');
  ok(await p.locator('select[name=link] option', { hasText: /Link to:/ }).count() >= 1, 'N-03 an issue can be linked to an existing open action');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // N-01: adopt a ready procedure
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); await p.getByRole('button', { name: /Staged supply/ }).click();
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(150); ok(/Adopt version 1\.0 for use here\?/.test(await text(p)), 'N-01 Adopt asks to confirm in the page');
  await tap(p, 'Yes, adopt it'); await p.waitForTimeout(300); ok(/Adopted · version 1\.0/.test(await text(p)), 'N-01 status is Adopted · version 1.0');
  await p.reload(); await p.waitForTimeout(600); await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click();
  ok(/Adopted · version 1\.0/.test(await p.locator('.row', { hasText: 'Staged supply' }).innerText()), 'N-01 still adopted after reload');
  // N-06: annual check shows expiring dates and won't bulk-confirm them
  await tap(p, 'Staff'); await p.getByRole('button', { name: /Tom Nguyen/ }).click(); await tap(p, 'Annual check'); await p.waitForTimeout(200);
  t = await text(p); ok(/Valid until 30 Nov/.test(t) && /Valid until 13 Dec/.test(t), 'N-06 expiry dates 30 Nov and 13 Dec are shown');
  ok(/EXPIRED OR EXPIRING SOON · 2/i.test(t), 'N-06 the two expiring checks are listed first');
  await p.getByRole('button', { name: /^Confirm these \d+ unchanged$/ }).click(); await p.waitForTimeout(200);
  const urgentPicked = await p.locator('.card.wait input[type=radio]:checked').count();
  ok(urgentPicked === 0, 'N-06 bulk confirm leaves the expiring checks for you to answer');
  // N-08: a new pharmacy lists the legal S8 review first and no DAA review before packing is answered
  await tap(p, 'More'); await p.getByRole('button', { name: /Pharmacies on this device/ }).click(); await tap(p, 'Set up another pharmacy');
  await p.fill('input[name=name]', 'Fresh Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Dose administration aids' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const first = await p.locator('.list .row').first().innerText();
  ok(/S8 stock check/.test(first), 'N-08 S8 stock check is the first row on a new pharmacy: ' + first.split('\n')[0]);
  ok(!/DAA in-house packing/.test(await text(p)), 'N-08 no DAA in-house review before the packing question is answered');
  await done(b, errors);
})();
