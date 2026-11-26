// PharmLedger spec (26 Nov 2026, build 5359cb8efe): the stale-date finish deadlock, procedure "to confirm" items opening
// in Edit, "Update the draft", and the PharmLedger name and icon. Real touch taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-26T10:00:00+11:00' });
  // brand
  ok(await p.title() === 'PharmLedger' && /PharmLedger/.test(await text(p)) && /For the owner’s side of the counter\./.test(await text(p)) && !/Sigil/.test(await text(p)), 'Brand: PharmLedger with “For the owner’s side of the counter.”');
  ok(await p.locator('.wm-mark svg.logo rect').count() === 3 && await p.locator('.wm-mark svg.logo path[fill="#005792"]').count() === 1, 'Brand: the Option C mark (teal ledger with spine cut, ocean-blue plus)');
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Ledger Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Home delivery' }).first().tap(); await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  const toFinish = async (pick = 0, later = false) => { for (let i = 0; i < 30 && !/What happens next/.test(await text(p)); i++) {
    const cl = p.locator('main form label', { hasText: /^Check later$/ }); if (later && await cl.count()) { await cl.first().tap(); await p.waitForTimeout(250); await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(250); continue; }
    const ch = p.locator('main form label.choice').filter({ hasNotText: /^Check later$/ }), tk = p.locator('main form label.tick').filter({ hasNotText: /^Check later$/ });
    if (await ch.count()) await ch.nth(Math.min(pick, await ch.count() - 1)).tap(); else if (await tk.count()) await tk.first().tap(); else { const d = p.locator('main form input[name=d]'); if (await d.count() && !(await d.inputValue())) { await d.tap(); await p.keyboard.type('Fictional', { delay: 5 }); } }
    await p.waitForTimeout(250); const nx = p.getByRole('button', { name: /^(Next|Finish|Answer now)$/ }).first(); if (await nx.count()) await nx.tap(); await p.waitForTimeout(250); } };
  await p.getByRole('button', { name: /^Home delivery/ }).first().tap(); await p.waitForTimeout(250); await toFinish(0, true);
  const date = p.locator('main form input[type=date]').first(); const key = (await date.getAttribute('name')).slice(2);
  await date.fill('2026-11-26'); await tap(p, 'Save dates and finish'); await p.waitForTimeout(400);
  ok((await activePh(p)).schedule[key] === '2026-11-26', 'Setup: first date saved as today (26 Nov)');
  // next day: the saved date is now in the past; finishing again must not be blocked
  await p.clock.setSystemTime(new Date('2026-11-27T10:00:00+11:00')); await p.reload(); await p.waitForTimeout(800);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="delivery"]').first().tap(); await p.waitForTimeout(250);
  if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers'); await toFinish(0, true);
  ok(await p.locator(`main form input[name="d:${key}"]`).inputValue() === '2026-11-26', 'Next day: the saved (now past) date is shown as it is');
  await tap(p, 'Save dates and finish'); await p.waitForTimeout(400);
  ok(!/What happens next/.test(await text(p)) && (await activePh(p)).services.delivery.setup === 'done' && await p.evaluate(() => !document.querySelector('input:invalid')), '“Save dates and finish” submits with a past saved date (no “must be today or later” block)');
  // procedure: every "to confirm" item opens Edit with the confirm button on screen
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.locator('[data-id="delivery"]').first().tap(); await p.waitForTimeout(250);
  if (await p.getByRole('button', { name: 'Save this draft' }).count()) { await tap(p, 'Save this draft'); await p.waitForTimeout(300); }
  const rows = p.locator('.sec', { hasText: /To confirm/i }).locator('.row'); const nRows = await rows.count(); let allEdit = nRows > 0;
  for (let i = 0; i < nRows; i++) { await p.locator('.sec', { hasText: /To confirm/i }).locator('.row').nth(i).tap(); await p.waitForTimeout(300);
    const btn = p.getByRole('button', { name: /I’ve checked it — remove this marker|We already have our own written procedure/ }).first();
    const vis = await btn.count() && await btn.evaluate(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    allEdit = allEdit && /Edit wording/.test(await text(p)) && !!vis && !/Save and back to the procedure/.test(await text(p));
    await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.locator('[data-id="delivery"]').first().tap(); await p.waitForTimeout(250);
    if (/Edit wording/.test(await text(p))) await p.locator('.dock-inline button', { hasText: /Cancel/ }).first().tap().catch(() => {}); await p.waitForTimeout(200); }
  ok(allEdit, 'Procedure: each of the ' + nRows + ' “to confirm” items opens Edit with its confirm button on screen (never a setup question)');
  // "Update the draft" after a setup answer changes
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="delivery"]').first().tap(); await p.waitForTimeout(250);
  if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers'); await toFinish(1); await tap(p, 'Save dates and finish'); await p.waitForTimeout(400);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.locator('[data-id="delivery"]').first().tap(); await p.waitForTimeout(250);
  const hadBanner = /Your setup answers changed/.test(await text(p)); const v0 = (await activePh(p)).procedures[0].versions.length;
  if (hadBanner) { await tap(p, 'Update the draft'); await p.waitForTimeout(400); }
  ok(hadBanner && !/Your setup answers changed/.test(await text(p)) && (await activePh(p)).procedures[0].versions.length === v0 + 1 && (await activePh(p)).procedures[0].status === 'draft', '“Update the draft”: one tap adds the new version and the banner goes (' + (hadBanner ? 'banner shown' : 'no banner') + ')');
  await done(b, errors);
})();
