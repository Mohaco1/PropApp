// Trial batch 1 (Gemini brief on build 8131823503), by real touch taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-26T10:00:00+11:00', scale: 2 });
  const q = async () => +(((await text(p)).match(/Question (\d+)/) || [])[1] || 0);
  const next = async () => { await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(200); };
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Batch One Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const x of ['Opioid Treatment Program', 'Pharmacist prescribing', 'Medicinal cannabis', 'Medicine adherence']) await p.locator('label.tick', { hasText: x }).first().tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  // F. "Legal items first · do the rest later"
  ok(await p.getByRole('button', { name: 'Legal items first · do the rest later' }).count() === 1, 'Onboarding: the setup card offers “Legal items first · do the rest later”');
  await tap(p, 'Legal items first · do the rest later'); await p.waitForTimeout(250);
  ok(/Service setup · 4 to do · carry on when you’re ready/.test(await text(p)) && await p.locator('.card.hero', { hasText: 'Finish setting up' }).count() === 0, 'Onboarding: the setup card becomes one quiet line');
  await p.locator('.siteline', { hasText: 'Service setup' }).tap(); await p.waitForTimeout(300);
  // Day to day: why we ask
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.waitForTimeout(250);
  if (/Who runs your services day to day/.test(await text(p))) { ok(/Why we ask:/.test(await text(p)), 'Why we ask: the day-to-day question says why'); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(250); }
  // OTP: software chips
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Opioid Treatment Program/ }).first().tap(); await p.waitForTimeout(300);
  for (const x of ['Methadone oral liquid']) await p.locator('main form label.tick', { hasText: x }).tap(); await p.waitForTimeout(300); await next();
  let seenSoftware = false, chipFilled = false, seen18 = false, seenFreq = false;
  for (let i = 0; i < 30; i++) { const t = await text(p); if (/What happens next/.test(t)) break;
    if (/Which software records OTP doses\?/.test(t)) { seenSoftware = /Why we ask:/.test(t); await p.fill('main form input[name=d]', 'Fictional Dispense Pro'); await p.locator('main form input[name=d]').blur(); await p.waitForTimeout(300); await next(); continue; }
    if (/Which software holds OTP patient files\?/.test(t)) { const chip = p.locator('.placechips .chip', { hasText: 'Fictional Dispense Pro' });
      if (await chip.count()) { await chip.tap(); await p.waitForTimeout(400); chipFilled = (await p.locator('main form input[name=d]').inputValue()) === 'Fictional Dispense Pro' && Object.values((await activePh(p)).services.otp.answers).filter(v => v === 'Fictional Dispense Pro').length === 2; }
      await next(); continue; }
    if (/Does your NSW Health letter approving OTP dosing here list any extra conditions\?/.test(t)) { seen18 = /Why we ask:/.test(t); await next(); continue; }
    if (/Are OTP patient files on paper, electronic or both\?/.test(t)) { await p.locator('main form label', { hasText: 'Electronic' }).first().tap(); await p.waitForTimeout(300); await next(); continue; }
    if (/How often do you review OTP patient files\?/.test(t)) { const opts = await p.locator('main form label.choice').allInnerTexts(); seenFreq = /^Quarterly/.test(opts[0]) && await p.locator('main form input[name=v]:checked').count() === 0; }
    const ch = p.locator('main form label.choice'), tk = p.locator('main form label.tick');
    if (await ch.count()) await ch.first().tap(); else if (await tk.count()) await tk.last().tap(); else { const inp = p.locator('main form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } }
    await p.waitForTimeout(300); await next(); }
  ok(seenSoftware, 'Plain wording: “Which software records OTP doses?” with why we ask');
  ok(chipFilled, 'Places & systems: the dose software typed once is offered as a chip on the next software question, and tapping it fills and saves it');
  ok(seen18, 'Plain wording: OTP special conditions question reworded, with why we ask');
  ok(seenFreq, 'OTP file reviews: Quarterly is listed first as the suggestion, and nothing is pre-selected');
  // QLD gate + CBD wording + adherence
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Pharmacist prescribing/ }).first().tap(); await p.waitForTimeout(300);
  let gateOk = false;
  for (let i = 0; i < 12; i++) { const t = await text(p); if (/Does any pharmacist here hold the Queensland training/.test(t)) { gateOk = !/Queensland-trained pharmacists only/.test(t); await p.getByRole('button', { name: 'Yes, show those conditions' }).tap(); await p.waitForTimeout(300); gateOk = gateOk && /Queensland-trained pharmacists only/.test(await text(p)); break; }
    const ch = p.locator('main form label.choice'); if (await ch.count()) await ch.first().tap(); else { const tk = p.locator('main form label.tick'); if (await tk.count()) await tk.first().tap(); }
    await p.waitForTimeout(300); await next(); }
  ok(gateOk, 'Queensland gate: the Queensland-only conditions are hidden until the owner says a pharmacist holds that training');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Medicinal cannabis/ }).first().tap(); await p.waitForTimeout(300);
  let cbd = false; for (let i = 0; i < 10; i++) { const t = await text(p); if (/Do you supply any Schedule 8 medicinal cannabis\?/.test(t)) { cbd = /98% or more CBD \(TGA Category 1\) are Schedule 4/.test(t) && /Schedule 3 low-dose CBD entry exists, but no product is registered/.test(t) && !/CBD-only products are not S8/.test(t); break; }
    const ch = p.locator('main form label.choice'); if (await ch.count()) await ch.first().tap(); else { const tk = p.locator('main form label.tick'); if (await tk.count()) await tk.first().tap(); } await p.waitForTimeout(300); await next(); }
  ok(cbd, 'CBD: only Category 1 CBD (98%+) is Schedule 4; everything else is Schedule 8; the S3 note is there');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Medicine adherence/ }).first().tap(); await p.waitForTimeout(300);
  ok(/What this is: Medicine adherence support means structured help for patients to take their medicines as prescribed/.test(await text(p)), 'Adherence: a plain “What this is” line');
  // Tab subtitles
  await tap(p, 'Reviews'); ok(/Every check in your plan and when it’s next due\./.test(await text(p)), 'Navigation: Reviews says what it’s for');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().tap(); ok(/laid out by week, month or year/.test(await text(p)), 'Navigation: Calendar says what it’s for');
  // Quick list on the example's S8 review: one tap each, nothing pre-answered; an issue goes to the step view
  const s2 = await phone({ time: '2026-11-26T10:00:00+11:00', scale: 2 }); const e = s2.p; s2.errors.forEach(x => errors.push(x)); e.on('pageerror', x => errors.push(x.message));
  await tap(e, 'Look around an example pharmacy (fictional)'); await e.waitForTimeout(3300);
  await tap(e, 'Reviews'); await e.getByRole('button', { name: /S8 stock check/ }).first().tap(); await tap(e, 'Start review'); await e.waitForTimeout(200);
  await e.getByRole('button', { name: 'Answer as a list' }).tap(); await e.waitForTimeout(250);
  ok(await e.locator('.qlist-item').count() === 9 && await e.locator('.qlist-item .chip.on').count() === 0 && await e.getByRole('button', { name: 'Finish' }).isDisabled(), 'Quick list: all 9 S8 questions on one screen, nothing pre-answered, Finish waits for every answer');
  await e.screenshot({ path: path.join(OUT, '40_quick_list_390px.png') });
  for (let i = 0; i < 9; i++) await e.locator('.qlist-item').nth(i).locator('.chip:not(.issue)').first().tap();
  await e.waitForTimeout(200);
  ok(await e.locator('.qlist-item .chip.on').count() === 9 && !(await e.getByRole('button', { name: 'Finish' }).isDisabled()), 'Quick list: one tap per question; Finish unlocks when all are answered');
  await e.locator('.qlist-item').nth(1).locator('.chip.issue').first().tap(); await e.waitForTimeout(250);
  ok(/Question 2 of 9/.test(await text(e)) && /What needs fixing\?/.test(await text(e)), 'Quick list: an issue answer goes to that question so the owner can say what needs fixing');
  // Logo on Welcome
  const s3 = await phone({ time: '2026-11-26T10:00:00+11:00', scale: 2 });
  ok(await s3.p.locator('.wm-mark svg.logo path[fill="#005792"]').count() === 1 && await s3.p.locator('.wm-mark svg.logo path[fill="#0f766e"]').count() === 1, 'Logo: the PharmLedger ledger-and-plus on Welcome');
  await s3.b.close(); await s2.b.close();
  // Owner trial: typing a software name then ONE tap on Next saves it and moves on (it used to be lost and stay put)
  { const s4 = await phone({ time: '2026-11-26T10:00:00+11:00' }); const t4 = s4.p; t4.on('pageerror', x => errors.push(x.message));
    await tap(t4, 'Set up your pharmacy'); await t4.fill('input[name=name]', 'Typed Answer Pharmacy (fictional)'); await tap(t4, 'Continue'); await t4.fill('input[name=owner0]', 'Sam'); await tap(t4, 'Continue');
    await t4.locator('label.tick', { hasText: 'Staged supply' }).first().tap(); await tap(t4, 'Finish setup'); await t4.waitForTimeout(400); await tap(t4, 'Set up services');
    if (await t4.getByRole('button', { name: /^Answer$/ }).count()) { await t4.getByRole('button', { name: /^Answer$/ }).tap(); await t4.locator('label.choice').nth(2).tap(); await tap(t4, 'Save'); await t4.waitForTimeout(200); }
    await t4.getByRole('button', { name: /^Staged supply/ }).first().tap(); await t4.waitForTimeout(300);
    for (let i = 0; i < 6 && !(await t4.locator('main form input[name=d]').count() && await t4.locator('main form label.choice').count() === 0); i++) { await t4.locator('main form label.choice, main form label.tick').first().tap(); await t4.waitForTimeout(300); await t4.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await t4.waitForTimeout(200); }
    const before = ((await text(t4)).match(/Question (\d+)/) || [])[1];
    await t4.locator('main form input[name=d]').tap(); await t4.keyboard.type('Fictional Soft', { delay: 15 }); await t4.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await t4.waitForTimeout(400);
    const after = ((await text(t4)).match(/Question (\d+)/) || [])[1], ans = (await activePh(t4)).services.staged.answers;
    ok(Object.values(ans).includes('Fictional Soft') && +after === +before + 1, 'Trial fix: a typed software name is saved and one tap on Next moves on (Q' + before + ' → Q' + after + ')');
    await s4.b.close(); }
  await done(b, errors);
})();
