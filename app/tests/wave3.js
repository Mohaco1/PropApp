// Wave 3 / V3-05 (consolidated brief Section 4), by real taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00' });
  const more = re => tap(p, 'More').then(() => p.getByRole('button', { name: re }).first().click());
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  // A. TGA and eNRMC links labelled honestly; new NSW sources listed with links
  await more(/^Law and sources/); await tap(p, 'Sources'); await p.waitForTimeout(300); let t = await text(p);
  ok((t.match(/Quoted by the 25 Nov independent review/g) || []).length === 3, 'Section 4A the 2 TGA vape links and the eNRMC link say they were quoted by the 25 Nov review');
  ok(/NSW Pharmacist Vaccination Standards \(5 Nov 2026\)/.test(t) && /SafeScript NSW: privacy and security/.test(t) && /Vaccine storage and cold chain management/.test(t), 'Section 4 the Vaccination Standards, cold chain and SafeScript pages are listed as sources');
  // B. vaccination readiness: alarmed logger, and the cold-chain module rule as NSW Health states it
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.fill('input[type=search]', 'readiness'); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Vaccination readiness/ }).first().click(); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: 'Start review' }).count()) await tap(p, 'Start review');
  for (let i = 0; i < 3; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  t = await text(p); ok(/continuous temperature data logger set to alarm outside \+2°C to \+8°C/.test(t), 'V3-05 vaccination readiness: logger set to alarm outside +2°C to +8°C');
  for (let i = 3; i < 7; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  t = await text(p); ok(/at least two staff who manage vaccines have completed the NSW Health Vaccine Storage and Cold Chain Management module \(recommended for everyone who handles vaccines\)/.test(t), 'V3-05 cold-chain module: at least two staff (as NSW Health states), not “every staff member”');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // B. SafeScript in the governance review
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.fill('input[type=search]', 'governance'); await p.waitForTimeout(300); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await tap(p, 'Start review');
  ok(/Question 1 of 14/.test(await text(p)), 'V3-05 the governance review has 14 questions');
  for (let i = 0; i < 11; i++) { await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  ok(/SafeScript NSW \(NSW Health, Privacy and security\): each pharmacist uses their own login with multi-factor authentication/.test(await text(p)), 'V3-05 question 12: SafeScript own logins, MFA, penalties, no overseas logins');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // SafeScript approvals in the updates feed
  await more(/^Law and sources/); await tap(p, 'Law and practice updates'); await p.waitForTimeout(200);
  ok(/Pharmacists can now see NSW Health medicine approvals in SafeScript NSW/.test(await text(p)), 'V3-05 the NSW laws update mentions SafeScript approvals');
  // F-LIVE-11: no "per your research/plan" placeholders in procedures; honest "— verify" remains where unconfirmed
  await more(/^Procedures/); await p.getByRole('button', { name: /^Vaccination/ }).first().click(); await p.waitForTimeout(300);
  // Wattle Grove's draft comes from the old app; the owner chooses to update it (never automatic)
  ok(await p.getByRole('button', { name: 'Update the draft' }).count() === 1, 'F-LIVE-11 an older stored draft is offered “Update the draft” (not changed for the owner)');
  await tap(p, 'Update the draft'); await p.waitForTimeout(300);
  t = await text(p); ok(!/per your (research|plan)/.test(t) && !/— verify/.test(t) && /NSW Health, Vaccine storage and cold chain management/.test(t) && /your pharmacy’s practice/.test(t), 'F-LIVE-11 + B7 the vaccination procedure has no “per your plan” and no “— verify”: steps cite NSW Health or say they are the pharmacy’s own practice');
  ok(!/steps marked “— verify”/.test(t), 'B7 the vaccination draft has no “— verify” blocker left');
  await done(b, errors);
})();
