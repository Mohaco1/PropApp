// Overnight brief Sprint 3 acceptance checks (S3-01, S3-03, S3-04, S3-05). Real taps and typing at 390×844.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js');
const answerOne = async p => { const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } await p.waitForTimeout(60); };
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Resume Test (fictional)'); await tap(p, 'Continue');
  // S3-03 core setup survives a reload
  await p.waitForTimeout(400); await p.reload(); await p.waitForTimeout(500); ok(/Step 2 of 3/.test(await text(p)), 'S3-03 core setup resumes at step 2 after a reload');
  await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const s of ['Dose administration aids', 'Home delivery']) await p.locator('label.tick', { hasText: s }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  ok(/FINISH SETTING UP · 2 LEFT/i.test(await text(p)), 'S3-03 Today shows "Finish setting up · 2 left"');
  await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await p.waitForTimeout(150);
  for (let i = 0; i < 3; i++) { await answerOne(p); await tap(p, 'Next'); }
  await p.waitForTimeout(400); const before = JSON.stringify((await activePh(p)).services.daa.answers);
  await p.reload(); await p.waitForTimeout(600);
  ok(/In progress/.test(await text(p)), 'S3-03 Today checklist shows DAA in progress after a reload');
  await tap(p, 'Carry on setting up'); await p.waitForTimeout(200);
  ok(/Question 4\b/.test(await text(p)), 'S3-03 resumes on question 4');
  ok(JSON.stringify((await activePh(p)).services.daa.answers) === before, 'S3-03 the first 3 answers are intact');
  // S3-04 records step: skip for now
  for (let i = 0; i < 40; i++) { if (await p.getByRole('button', { name: 'Skip for now', exact: true }).count()) break; if (/What happens next/.test(await text(p))) break; await answerOne(p); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); }
  ok(/Where you keep records · optional now/.test(await text(p)), 'S3-04 record locations come as one optional step');
  await tap(p, 'Skip for now'); await p.waitForTimeout(200);
  ok(/What happens next/.test(await text(p)), 'S3-04 skipping goes straight to What happens next');
  // S3-01 DAA (packed on site) offers the site visit date, which persists
  ok(await p.locator('input[name="d:Q1"]').count() === 1, 'S3-01 DAA What happens next shows a date to set');
  await p.fill('input[name="d:Q1"]', '2027-01-21'); await tap(p, 'Save dates and finish'); await p.waitForTimeout(300);
  ok((await activePh(p)).schedule.Q1 === '2027-01-21', 'S3-01 the chosen date is saved');
  await tap(p, 'Reviews'); ok(/Proprietor site visit[\s\S]{0,40}21 Jan 2027/.test(await text(p)), 'S3-01 the chosen date shows in Reviews');
  await tap(p, 'Today'); await p.locator('.filters button', { hasText: 'Waiting' }).click(); await p.waitForTimeout(150);
  ok(/Setup answers to confirm/.test(await text(p)), 'S3-04 skipped record locations are under "to confirm" on Today');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); await p.getByRole('button', { name: /^Dose administration aids/ }).click();
  ok(/TO CONFIRM BEFORE ADOPTING/i.test(await text(p)) && /kept/i.test(await p.locator('.sec', { hasText: 'To confirm' }).innerText()), 'S3-04 skipped locations are in the procedure’s confirm list');
  // finish Home delivery → one-time "All set up"
  await tap(p, 'Today'); await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Home delivery/ }).click();
  for (let i = 0; i < 30; i++) { if (/What happens next/.test(await text(p))) break; if (await p.getByRole('button', { name: 'Skip for now', exact: true }).count()) { await tap(p, 'Skip for now'); continue; } await answerOne(p); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); }
  await p.getByRole('button', { name: /^(Save dates and finish|Finish setup)$/ }).click(); await p.waitForTimeout(300); await tap(p, 'Back to Today').catch(() => tap(p, 'Today'));
  await tap(p, 'Today'); ok(/ALL SET UP/i.test(await text(p)), 'S3-03 one-time "All set up" card'); await tap(p, 'Got it'); ok(!/ALL SET UP/i.test(await text(p)), 'S3-03 it goes once dismissed');
  // S3-05 service evidence in the quarterly visit (example pharmacy)
  await p.locator('.ph-switch').click(); await tap(p, 'Open the example pharmacy (fictional)'); await p.waitForTimeout(600);
  await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 14; i++) {
    const t = await text(p); await p.locator('label.choice', { hasText: /^Satisfactory$/ }).click(); await p.waitForTimeout(80);
    if (/Dose administration aids/.test(t.split('Check ')[1] || '')) { await p.locator('label.choice', { hasText: 'Verified operational review' }).click(); await p.fill('input[name=ref]', 'Packing check log, week of 10 Nov (fictional)'); await p.locator('input[name=ref]').blur(); }
    if (/Staged supply/.test(t.split('Check ')[1] || '')) { await p.locator('label.choice', { hasText: 'Evidence reviewed' }).click(); await p.fill('input[name=ref]', 'Staged supply register (fictional)'); await p.locator('input[name=ref]').blur(); }
    if (/Vaccination & vaccine storage/.test(t.split('Check ')[1] || '')) { await p.locator('label.choice', { hasText: 'Evidence reviewed' }).click(); await p.fill('input[name=ref]', 'Fridge log folder (fictional)'); await p.locator('input[name=ref]').blur(); await p.locator('.card', { hasText: 'cold-chain breach' }).locator('label.choice', { hasText: /^No$/ }).click(); await p.locator('.card', { hasText: 'self-audit' }).locator('label.choice', { hasText: /^Not yet$/ }).click(); }
    await p.getByRole('button', { name: i === 13 ? 'Finish' : 'Next', exact: true }).click(); await p.waitForTimeout(60);
  }
  await tap(p, 'Save visit'); await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(600);
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /^Done/ }).click(); await p.locator('.row', { hasText: 'Proprietor site visit' }).first().click(); await p.waitForTimeout(200);
  let t = await text(p); ok(/SERVICE EVIDENCE/i.test(t) && /Verified operational review/.test(t) && /Packing check log/.test(t) && /Fridge log folder/.test(t) && /Staged supply register/.test(t), 'S3-05 evidence shows on the saved visit after a reload');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'More'); await p.getByRole('button', { name: /^History/ }).click();
  ok(/daa evidence: Verified operational review/.test(await text(p)), 'S3-05 evidence is in History');
  await done(b, errors);
})();
