// Unified 17-service "Onboard me" spec (26 Nov 2026), by real touch taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-26T10:00:00+11:00', scale: 2 });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Onboarding Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const l of await p.locator('form label.tick').all()) await l.tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').first().tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  const ids = Object.keys((await activePh(p)).services); let n = 0, shot = false;
  for (const id of ids) {
    await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.waitForTimeout(150);
    await p.locator(`[data-id="${id}"]`).first().tap(); await p.waitForTimeout(250);
    if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers');
    const link = p.getByRole('button', { name: 'New to this service? Onboard me' });
    const qBefore = (await text(p)).match(/Question \d+|Where you keep records/)?.[0] || '';
    const hasLink = await link.count() === 1; if (!hasLink) { ok(false, id + ': “Onboard me” link under the heading'); continue; }
    // the first question stays visible under the link
    ok(await p.evaluate(() => { const l = document.querySelector('.onboardlink').getBoundingClientRect(), q = document.querySelector('.qtext, .big-title'); return !!q && q.getBoundingClientRect().top < innerHeight - 80 && l.bottom <= q.getBoundingClientRect().top + 1; }), id + ': the link sits above the first question, which stays on screen');
    await link.tap(); await p.waitForTimeout(250); const t = await text(p);
    const steps = await p.locator('.obsteps > li').count(), links = await p.locator('.obsrc a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    ok(/What this is:/.test(t) && /Watch for:/.test(t) && steps >= 4 && steps <= 5 && links.every(u => /^https:\/\//.test(u)), id + ': guide with what this is, ' + steps + ' steps, watch for, ' + links.length + ' official source links');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), id + ': no sideways scroll');
    if (!shot && id === 'vaccination') { await p.screenshot({ path: path.join(OUT, '50_onboard_vaccination_390px.png') }); shot = true; }
    const nAct = Object.keys((await activePh(p)).actions).length;
    await tap(p, 'Add a follow-up'); await p.waitForTimeout(250);
    const after = Object.values((await activePh(p)).actions);
    ok(after.length === nAct + 1 && after.some(a => a.source?.type === 'onboard' && a.source.service === id && a.status === 'open'), id + ': “Add a follow-up” saves one open action');
    ok(await p.getByRole('button', { name: 'Open your follow-up' }).count() === 1 && await p.getByRole('button', { name: 'Add a follow-up' }).count() === 0, id + ': it then shows “Open your follow-up” (no duplicate)');
    await tap(p, 'Return to setup'); await p.waitForTimeout(250);
    ok(((await text(p)).match(/Question \d+|Where you keep records/)?.[0] || '') === qBefore && Object.keys((await activePh(p)).actions).length === nAct + 1, id + ': Return to setup lands on the same step; answers and actions unchanged');
    n++;
  }
  ok(n === 17, 'All 17 services have an “Onboard me” guide (' + n + ')');
  // dated and conditional notices
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="aged"]').first().tap(); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers');
  ok(/31 Mar 2027:/.test(await text(p)) && /eNRMC transition period ends on 31 March 2027/.test(await text(p)), 'Aged care: the dated eNRMC notice (31 Mar 2027)');
  const ph = await activePh(p);
  ok(/PPA DAA Program/.test(ph.services.daa.answers.funded || '') === /QSPP/.test(await (async () => { await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="daa"]').first().tap(); await p.waitForTimeout(200); if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers'); return text(p); })()), 'DAA: the 1 July 2027 QSPP note shows only when the PPA DAA Program is chosen');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="reviews"]').first().tap(); await p.waitForTimeout(200); if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers');
  ok(!/QSPP/.test(await text(p)), 'Medicines reviews (HMR/RMMR): no QSPP note');
  // prescribing: OCP initiation offered without the Queensland gate; the five Queensland conditions wait for it
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.locator('[data-id="prescribing"]').first().tap(); await p.waitForTimeout(200); if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers');
  let pt = ''; for (let i = 0; i < 12; i++) { pt = await text(p); if (/Does any pharmacist here hold the Queensland training/.test(pt)) break; await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(250); }
  ok(/Initiation of the oral contraceptive pill \(approved pharmacists: JCU, University of Newcastle or UTS graduate certificate\)/.test(pt) && !/Acute nausea and vomiting/.test(pt), 'Prescribing: OCP initiation (JCU, Newcastle or UTS) is offered without the Queensland gate; the five Queensland conditions stay hidden until “Yes”');
  await done(b, errors);
})();
