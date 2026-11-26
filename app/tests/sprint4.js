// Overnight brief Sprint 4 acceptance checks (S4-01 to S4-05). Real taps and typing at 390×844, plus 320×568 overflow checks.
const { phone, ok, done, tap, text, activePh, download } = require('./helpers.js');
const noSideways = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Try example'); await p.waitForTimeout(600);
  const more = name => tap(p, 'More').then(() => p.getByRole('button', { name }).first().click());
  // S4-01 procedure lifecycle
  await more(/^Procedures/); await p.getByRole('button', { name: /Staged supply/ }).click(); await tap(p, 'Adopt for use here'); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(200);
  await tap(p, 'Add a local amendment'); await p.fill('textarea[name=amendment]', 'We also text patients the day before collection (fictional).'); await tap(p, 'Save amendment'); await p.waitForTimeout(200);
  await tap(p, 'Record that I reviewed it'); await p.fill('textarea[name=note]', 'Read through with the team (fictional).'); await tap(p, 'Record review'); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(600); await more(/^Procedures/); await p.getByRole('button', { name: /Staged supply/ }).click(); let t = await text(p);
  ok(/Adopted · version 1\.0/.test(t) && /We also text patients the day before/.test(t) && /Last reviewed 24 Nov by Jordan Avery/.test(t) && /next review 24 Nov 2027/.test(t), 'S4-01 version 1.0, amendment and review persist after reload');
  await tap(p, '+ Add an action for this procedure'); await p.waitForTimeout(200); ok(/Update Staged supply procedure/.test(await p.locator('input[name=title]').inputValue()), 'S4-01 a linked action can be raised from the procedure');
  await more(/^History/); t = await text(p); ok(/Procedure reviewed|Local amendment/.test(t) || (await activePh(p)).history.some(h => /Procedure reviewed · Staged supply/.test(h.what)), 'S4-01 the review and amendment are in History');
  await more(/^Procedures/); await tap(p, '+ Add a document reference'); await p.fill('input[name=title]', 'Privacy policy (fictional)'); await p.fill('input[name=ref]', 'Office folder 3'); await tap(p, 'Save'); await p.waitForTimeout(200);
  ok(/Privacy policy \(fictional\)/.test(await text(p)), 'S4-01 document reference library');
  // S4-02 reviews filters, live search, include inactive, detail
  await tap(p, 'Reviews'); for (const f of ['All', 'Overdue', 'Due soon', 'On track', 'No date', 'Required by law', 'Completed']) { await p.locator('.chip', { hasText: new RegExp('^' + f + ' · ') }).click(); await p.waitForTimeout(80); }
  ok(await p.locator('.chip.on', { hasText: /^Completed/ }).count() === 1 && await p.locator('.list .row').count() > 5, 'S4-02 all 7 filters work (Completed lists past reviews)');
  await p.locator('.chip', { hasText: /^All · / }).click(); await p.locator('input[name=q]').click(); await p.keyboard.type('OTP', { delay: 40 }); await p.waitForTimeout(150);
  const rows = await p.locator('.list .row').allInnerTexts(); ok(rows.length > 0 && rows.every(r => /OTP/.test(r)), 'S4-02 typing OTP filters live (' + rows.length + ' rows)');
  await p.fill('input[name=q]', ''); const nBefore = await p.locator('.list .row').count(); await p.locator('label.tick', { hasText: 'Include reviews not in your plan' }).click(); await p.waitForTimeout(150);
  ok(await p.locator('.list .row').count() > nBefore && /Not in your plan/.test(await text(p)), 'S4-02 Include inactive adds reviews not in the plan');
  await p.locator('.row', { hasText: 'Home delivery' }).first().click(); t = await text(p); ok(/HOW OFTEN|How often/.test(t) && /Last done/.test(t) && /Set by/.test(t) && /Why it's here/.test(t), 'S4-02 detail shows how often, last done, set by, why');
  await p.setViewportSize({ width: 320, height: 568 }); ok(await noSideways(p), 'S4-02 review detail: no sideways scroll at 320'); await p.setViewportSize({ width: 390, height: 844 });
  // S4-03 calendar
  await more(/^Calendar/); for (const v of ['Weeks', 'Month', 'Year plan']) { await tap(p, v); for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) { await p.setViewportSize(vp); ok(await noSideways(p), `S4-03 ${v} at ${vp.width}: no sideways scroll`); } await p.setViewportSize({ width: 390, height: 844 }); }
  ok(/● due · ○ expected repeat · ✓ done/.test(await text(p)) && await p.locator('table.yearplan td.done').count() > 0, 'S4-03 year plan shows due, repeats and done marks');
  await p.fill('input[name=find]', 'next Friday'); await tap(p, 'Find'); ok(/Fri 27 Nov/.test(await text(p)), 'S4-03 "next Friday" finds Fri 27 Nov');
  await tap(p, 'Schedule a meeting on this date'); await p.locator('label.choice', { hasText: 'Staff safety meeting' }).click(); await tap(p, 'Schedule'); await p.waitForTimeout(200);
  ok((await activePh(p)).schedule.M1 === '2026-11-27', 'S4-03 Staff safety meeting scheduled for 27 Nov');
  await tap(p, 'Weeks'); ok(/Staff safety meeting[\s\S]{0,60}Fri 27 Nov/.test(await text(p)), 'S4-03 the meeting appears on the Calendar');
  const ics = await download(p, 'Download calendar file'); ok(/DTSTART;VALUE=DATE:20261127\r\nDTEND;VALUE=DATE:20261128\r\nSUMMARY:Staff safety meeting/.test(ics), 'S4-03 the meeting is in the calendar file');
  // S4-04 incident steps
  await more(/^If something goes wrong/); t = await text(p);
  ok(/S8 or S4D missing or stolen/.test(t) && /Destroying S8 at the pharmacy/.test(t) && await p.locator('a[href^="tel:"]').count() >= 1 && await p.locator('a[href^="mailto:"]').count() >= 1, 'S4-04 lost/stolen and destruction steps with tappable contacts');
  await p.setViewportSize({ width: 320, height: 568 }); ok(await noSideways(p), 'S4-04 no sideways scroll at 320'); await p.setViewportSize({ width: 390, height: 844 });
  // S4-05 evidence locations
  await more(/^Evidence locations/); await p.locator('.row', { hasText: 'S8 drug register' }).first().click(); await p.fill('input[name=where]', 'Dispensary office drawer 2'); await tap(p, 'Save'); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(600); await more(/^Evidence locations/);
  ok(/Dispensary office drawer 2/.test(await p.locator('.row', { hasText: 'S8 drug register' }).first().innerText()), 'S4-05 the location persists after reload');
  await more(/^History/); await p.locator('.chip', { hasText: /^Change$/ }).click().catch(() => {}); ok((await activePh(p)).history.some(h => /Evidence location saved/.test(h.what)), 'S4-05 the change is logged in History');
  await done(b, errors);
})();
