// Gemini's Sprint 2 items (24 Nov 2026), real taps and typing at 390×844, failing on console errors.
const { phone, ok, done, tap, text, activePh, download } = require('./helpers.js');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00' });
  await tap(p, 'Try example'); await p.waitForTimeout(500);
  ok(await p.locator('.status a').count() === 0 && await p.locator('.status button').count() <= 1 && (await p.locator('.status button').count() === 0 || await p.locator('.status button.inline-link').count() === 1), 'N-11 (updated by pre-trial B4) the status sentence has no links; only the item it names is tappable');
  // N-20: tap the pharmacy name to switch, with a quiet overdue count
  await p.locator('.ph-switch').click(); await p.waitForTimeout(200);
  ok(/Pharmacies/.test(await text(p)) && /\d+ overdue|Nothing overdue/.test(await text(p)), 'N-20 header name opens Pharmacies with an overdue count per site');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // UX 5: a procedure gap opens its exact question and comes back with the draft updated
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await p.waitForTimeout(200);
  await p.locator('.row', { hasText: /Where pack collection or delivery records are kept/i }).click(); await p.waitForTimeout(200);
  // PharmLedger spec: the item opens Edit with "I've checked it" on screen; its setup question is one link away
  ok(/Edit wording/.test(await text(p)) && await p.getByRole('button', { name: 'I’ve checked it — remove this marker' }).count() === 1, 'UX5 the gap opens Edit with “I’ve checked it — remove this marker”');
  await p.getByRole('button', { name: 'Change my setup answer instead' }).click(); await p.waitForTimeout(200);
  let t = await text(p); ok(/Where are pack collection or delivery records kept/i.test(t), 'UX5 “Change my setup answer instead” opens its exact question');
  await p.locator('label.tick', { hasText: 'Paper folder in the pharmacy' }).click(); await p.fill('input[name=d]', 'DAA delivery book, dispensary shelf 2 (fictional)'); await p.locator('input[name=d]').blur(); await p.waitForTimeout(150);
  await tap(p, 'Save and back to the procedure'); await p.waitForTimeout(300);
  t = await text(p); ok(/Dose administration aids procedure/.test(t) && !/TO CONFIRM BEFORE ADOPTING/i.test(t), 'UX5 back on the procedure with nothing left to confirm');
  ok(await p.getByRole('button', { name: 'Adopt for use here' }).isEnabled(), 'UX5 Adopt is now available');
  // N-07: DAA packing change on the DAA service page
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: /^Services/ }).click(); await p.getByRole('button', { name: /^Dose administration aids/ }).click();
  ok(await p.getByRole('button', { name: 'Change how DAAs are packed' }).count() === 1, 'N-07 "Change how DAAs are packed" is on the DAA service page');
  await tap(p, 'Change how DAAs are packed'); await p.locator('label.tick', { hasText: 'We dispense, an outside packer packs' }).click(); await tap(p, 'Show what changes'); await p.waitForTimeout(200);
  t = await text(p); ok(/Packing instructions match each prescription/.test(t) && /packer’s TGA manufacturing licence/.test(t), 'N-07 the change lists what depends on it');
  ok((await activePh(p)).services.daa.answers.routes.includes('routeA'), 'N-07 the new packing arrangement is saved');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // N-10: My log appears in History; date range and print
  await tap(p, 'More'); await p.getByRole('button', { name: /^My log/ }).click(); await p.fill('input[name=what]', 'Reported a cold-chain breach (fictional)'); await tap(p, 'Add to log'); await p.waitForTimeout(200);
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: /^History/ }).click(); await p.waitForTimeout(200);
  ok(await p.locator('.chip', { hasText: 'My log' }).count() === 1 && /Reported a cold-chain breach/.test(await text(p)), 'N-10 My log entries are in History');
  const before = +((await text(p)).match(/(\d+) entries/) || [])[1];
  await p.fill('input[name=from]', '2026-10-01'); await p.locator('input[name=from]').dispatchEvent('change'); await p.waitForTimeout(200);
  const after = +((await text(p)).match(/(\d+) entr/) || [])[1];
  ok(after > 0 && after < before, `History date range narrows the list (${before} → ${after})`);
  ok(await p.getByRole('button', { name: 'Print or save as PDF' }).count() === 1, 'History has Print or save as PDF');
  await p.fill('input[name=from]', ''); await p.locator('input[name=from]').dispatchEvent('change'); await p.waitForTimeout(150);
  const csv = await download(p, 'Download CSV'); const lines = csv.split('\r\n'), head = lines[0];
  ok(/"Recorded or closed by"/.test(head) && lines.some(l => /"My log","Reported a cold-chain breach \(fictional\)"/.test(l)), 'N-10 the CSV includes My log rows');
  const openActs = lines.filter(l => /"Action"/.test(l) && /"Open/.test(l)); ok(openActs.length > 0 && openActs.every(l => !/"Action","[^"]*",""/.test(l)), 'N-13 open actions in the CSV say who raised them (' + openActs.length + ' rows)');
  // N-09: contacts are tappable
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: /^NSW Health dates/ }).click();
  ok(await p.locator('a[href^="tel:"]').count() >= 1 && await p.locator('a[href^="mailto:"]').count() >= 1, 'N-09 phone numbers and emails are tappable');
  // N-19: Add staff without a role shows the message on the field
  await tap(p, 'Staff'); await p.getByRole('button', { name: 'Add a staff member' }).click(); await p.fill('input[name=name]', 'Test Person'); await tap(p, 'Save'); await p.waitForTimeout(150);
  ok(await p.locator('.err', { hasText: 'Choose a role.' }).count() === 1, 'N-19 inline "Choose a role." under the field');
  // N-13: toasts don't follow you to the next screen
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'More'); await p.getByRole('button', { name: /^My log/ }).click(); await p.fill('input[name=what]', 'Second note (fictional)'); await tap(p, 'Add to log');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); ok(await p.locator('.toast').count() === 0, 'N-13 the confirmation clears when you move on');
  // N-14/15/17/18: fresh service setup
  await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Fresh Test (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam'); await tap(p, 'Continue');
  for (const s of ['Dose administration aids', 'Home delivery']) await p.locator('label.tick', { hasText: s }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(300);
  await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await p.waitForTimeout(150);
  ok(/more may follow, depending on your answers/.test(await text(p)), 'N-14 no jumping total: "more may follow"');
  let policies = 0;
  for (let i = 0; i < 40; i++) { if (/What happens next/.test(await text(p))) break; if (/\(Policies\)/.test(await text(p))) policies++; if (await p.getByRole('button', { name: 'Answer now' }).count()) await tap(p, 'Answer now'); const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(50); }
  ok(policies === 0, 'N-16 no "(Policies)" anywhere in DAA setup');
  // P-01/P-03: the whole bundle (all 17 services' setup notes, drafts and review forms) has neither leftover
  for (const f of ['propapp.html', 'propapp-standalone.html']) { const src = require('fs').readFileSync(require('path').resolve(__dirname, '../dist/' + f), 'utf8');
    ok(!src.includes('(Policies)'), 'P-01 ' + f + ': 0 matches for "(Policies)"'); ok(!src.includes('Responsible person or role'), 'P-03 ' + f + ': 0 "Responsible person or role" labels'); }
  ok(await p.locator('input[name="d:Q1"]').count() === 1, 'N-15 DAA offers the site visit date (DAA is checked there)');
  await p.fill('input[name="d:Q1"]', '2027-01-20'); await tap(p, 'Save dates and finish'); await p.waitForTimeout(300);
  t = await text(p); ok(/Next: Home delivery/.test(t), 'N-17 finishing hands over to the next service');
  await tap(p, 'Set up Home delivery'); await p.waitForTimeout(150);
  for (let i = 0; i < 30; i++) { if (/What happens next/.test(await text(p))) break; if (await p.getByRole('button', { name: 'Answer now' }).count()) await tap(p, 'Answer now'); const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(50); }
  ok(/first dates/i.test(await text(p)) && await p.locator('input[type=date][name="d:service-delivery"]').count() === 1, 'N-15 What happens next lets you set the first dates');
  await p.fill('input[name="d:service-delivery"]', '2027-02-15'); await tap(p, 'Save dates and finish'); await p.waitForTimeout(300);
  ok(/All your services are set up/.test(await text(p)), 'N-17 last service: all set up');
  await tap(p, 'Reviews'); t = await text(p);
  ok(/Proprietor site visit[\s\S]{0,40}20 Jan 2027/.test(t) && /Home delivery[\s\S]{0,40}15 Feb 2027/.test(t), 'N-15 both chosen first dates show in Reviews');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); ok(/Draft 0\.1/.test(await p.locator('.row', { hasText: 'Dose administration aids' }).innerText()), 'N-18 the draft procedure exists after finishing');
  await done(b, errors);
})();
