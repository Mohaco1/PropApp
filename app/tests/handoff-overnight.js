// The 8 phone screenshots the overnight brief asks for (390×844 at 2×), reached by real taps.
const { phone, tap } = require('./helpers.js'); const path = require('path');
const OUT = path.resolve(__dirname, '../handoff');
const answerOne = async p => { const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } await p.waitForTimeout(50); };
(async () => { const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  const s = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Harbour Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Alex Owner'); await tap(p, 'Continue');
  for (const x of ['Dose administration aids', 'Home delivery']) await p.locator('label.tick', { hasText: x }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(300);
  await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Dose administration aids/ }).click(); for (let i = 0; i < 3; i++) { await answerOne(p); await tap(p, 'Next'); }
  await tap(p, 'Today'); await p.waitForTimeout(200); await s('2-today-setup-checklist');
  await tap(p, 'Carry on setting up'); for (let i = 0; i < 40; i++) { if (/What happens next/.test(await p.evaluate(() => document.body.innerText))) break; if (await p.getByRole('button', { name: 'Skip for now', exact: true }).count()) { await tap(p, 'Skip for now'); continue; } await answerOne(p); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); }
  await s('1-daa-what-happens-next');
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Open the example pharmacy (fictional)'); await p.waitForTimeout(600);
  await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 14; i++) { const t = await p.evaluate(() => document.body.innerText); await p.locator('label.choice', { hasText: /^Satisfactory$/ }).click(); await p.waitForTimeout(60);
    if (/Dose administration aids/.test(t.split('Check ')[1] || '')) { await p.locator('label.choice', { hasText: 'Verified operational review' }).click(); await p.fill('input[name=ref]', 'Packing check log, week of 10 Nov (fictional)'); await p.locator('input[name=ref]').blur(); await p.waitForTimeout(100); await s('3-site-visit-service-evidence'); break; }
    await p.getByRole('button', { name: 'Next', exact: true }).click(); }
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); await p.getByRole('button', { name: /Staged supply/ }).click();
  await tap(p, 'Adopt for use here'); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(150); await tap(p, 'Add a local amendment'); await p.fill('textarea[name=amendment]', 'We also text patients the day before collection (fictional).'); await tap(p, 'Save amendment'); await p.waitForTimeout(3200);
  await p.evaluate(() => document.querySelector('.sec')?.scrollIntoView()); await s('4-procedure-adopted-with-amendment');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click(); await tap(p, 'Year plan'); await p.waitForTimeout(150); await p.evaluate(() => document.querySelector('.yearplan')?.scrollIntoView({ block: 'center' })); await s('5-calendar-year-plan');
  await tap(p, 'More'); await p.getByRole('button', { name: /^If something goes wrong/ }).click(); await p.locator('summary', { hasText: 'S8 or S4D missing or stolen' }).click(); await s('6-incident-steps');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence locations/ }).click(); await s('7-evidence-locations');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(400); await p.evaluate(() => [...document.querySelectorAll('.sec-title')].find(e => /Conflict/i.test(e.textContent))?.scrollIntoView()); await s('8-conflict-copies');
  console.log('errors', errors); await b.close(); })();
