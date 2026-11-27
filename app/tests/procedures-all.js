// Owner trial (26 Nov): every service's procedure can reach "nothing left to confirm" through the screens, by real touch
// taps at 390×844. A pharmacy with all 17 services is set up (first option for each question), each draft is saved,
// then each "to confirm" item is cleared the way the owner would: answer the question, write the steps, or confirm the
// check. Nothing is adopted. Fails if any item can't be cleared, loops, or there's a console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js');
const next = p => p.getByRole('button', { name: /^(Next|Finish)$/ }).first();
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-26T10:00:00+11:00' });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Every Service Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const l of await p.locator('form label.tick').all()) await l.tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').first().tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  const services = Object.keys((await activePh(p)).services);
  const nameOf = async id => (await p.evaluate(id => document.querySelector(`[data-act="go"][data-id="${id}"] .row-title, [data-id="${id}"] .row-title`)?.innerText || '', id));
  // answer every service's setup: first real option (or "Yes"), first tick, "Fictional" for typed answers
  for (const id of services) {
    await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.waitForTimeout(150);
    const row = p.locator(`[data-id="${id}"]`).first(); if (!(await row.count())) continue; await row.tap(); await p.waitForTimeout(250);
    if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers');
    if (await p.getByRole('button', { name: 'Answer now' }).count()) await tap(p, 'Answer now');
    for (let i = 0; i < 60; i++) { if (await p.getByRole('button', { name: 'Answer now' }).count()) { await tap(p, 'Answer now'); await p.waitForTimeout(200); }
      const t = await text(p); if (/What happens next/.test(t) || !(await next(p).count())) break;
      if (await p.getByRole('button', { name: 'Yes, show those conditions' }).count()) {}
      // LATER=1: answer "Check later" wherever it's offered, so the "to confirm" items go back to their setup questions
      if (process.env.LATER && await p.locator('main form label', { hasText: /^Check later$/ }).count()) { if (!(await p.locator('main form input:checked').count())) await p.locator('main form label', { hasText: /^Check later$/ }).first().tap(); await p.waitForTimeout(150); if (await next(p).count()) if (await next(p).count()) await next(p).tap(); /* a single choice may already have moved on (onboarding polish) */ await p.waitForTimeout(250); continue; }
      const ch = p.locator('main form label.choice').filter({ hasNotText: /^Check later$/ }), tk = p.locator('main form label.tick').filter({ hasNotText: /^Check later$/ });
      if (await ch.count()) { if (!(await p.locator('main form input[name=v]:checked').count())) await ch.first().tap(); }
      else if (await tk.count()) { if (!(await p.locator('main form input[name=m]:checked').count())) await tk.first().tap(); }
      const d = p.locator('main form input[name=d]'); if (await d.count() && !(await d.inputValue())) { await d.tap(); await p.keyboard.type('Fictional', { delay: 5 }); }
      await p.waitForTimeout(150); if (await next(p).count()) await next(p).tap(); await p.waitForTimeout(250); }
    if (await p.getByRole('button', { name: /^(Save dates and finish|Finish setup)$/ }).count()) { await p.getByRole('button', { name: /^(Save dates and finish|Finish setup)$/ }).first().tap(); await p.waitForTimeout(250); }
  }
  // each procedure: save the draft, then clear every "to confirm" item through the screens
  const results = [];
  for (const id of services) {
    await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.waitForTimeout(200);
    const pr = p.locator(`.row[data-id="${id}"], [data-act][data-id="${id}"]`).first(); if (!(await pr.count())) { results.push([id, 'no procedure row']); continue; }
    const title = (await pr.innerText()).split('\n')[0]; await pr.tap(); await p.waitForTimeout(250);
    if (await p.getByRole('button', { name: 'Save this draft' }).count()) { await tap(p, 'Save this draft'); await p.waitForTimeout(300); }
    if (await p.getByRole('button', { name: 'Update the draft' }).count()) { await tap(p, 'Update the draft'); await p.waitForTimeout(300); }
    const n = async () => +(((await text(p)).match(/TO CONFIRM BEFORE ADOPTING · (\d+)/i) || [0, 0])[1]);
    const start = await n(); let left = start, steps = [], stuck = '', seen = {};
    for (let k = 0; k < 25 && left > 0; k++) {
      const r = p.locator('.sec', { hasText: /To confirm/i }).locator('.row').first(); const label = (await r.innerText()).replace(/\n/g, ' | '); await r.tap(); await p.waitForTimeout(300);
      const t = await text(p);
      if (await p.getByRole('button', { name: 'I’ve checked it — remove this marker' }).count()) { await tap(p, 'I’ve checked it — remove this marker'); steps.push('checked'); }
      else if (/Edit wording/.test(t)) { await p.keyboard.type('Fictional pharmacy steps written by the owner.'); await tap(p, 'Save as new version'); steps.push('wrote'); }
      else if (await p.getByRole('button', { name: 'Save and back to the procedure' }).count()) {
        const ch = p.locator('main form label.choice').filter({ hasNotText: /^Check later$/ }), tk = p.locator('main form label.tick').filter({ hasNotText: /^Check later$/ });
        if (await ch.count()) await ch.first().tap(); else if (await tk.count()) await tk.first().tap();
        const d = p.locator('main form input[name=d]'); if (await d.count() && !(await d.inputValue())) { await d.tap(); await p.keyboard.type('Fictional', { delay: 5 }); }
        await p.waitForTimeout(150); await tap(p, 'Save and back to the procedure'); steps.push('answered'); }
      else { stuck = 'opened an unexpected screen: ' + t.slice(0, 80).replace(/\n/g, ' / ') + ' (from “' + label + '”)'; break; }
      await p.waitForTimeout(350);
      if (!/procedure/i.test((await text(p)).slice(0, 120))) { stuck = 'did not come back to the procedure (from “' + label + '”)'; break; }
      // an answer may swap an item for its follow-up (e.g. "the emergency procedure" → "steps match the Handbook"); only the
      // same item coming back twice counts as stuck
      const now = await n(); seen[label] = (seen[label] || 0) + 1; if (seen[label] > 2) { stuck = '“' + label + '” keeps coming back (' + left + ' → ' + now + ')'; break; } left = now; }
    const adopt = p.getByRole('button', { name: 'Adopt for use here' }); if (!(await adopt.count())) console.log('NOADOPT', id, (await text(p)).slice(0, 300).replace(/\n/g, ' / '));
    const adoptOk = left === 0 && await adopt.count() && !(await adopt.isDisabled());
    results.push([title, stuck || (adoptOk ? 'ok' : 'Adopt still locked'), start + ' to confirm → ' + left + (steps.length ? ' (' + steps.join(', ') + ')' : '')]);
  }
  for (const [t, r, d] of results) ok(r === 'ok', 'Procedure “' + t + '”: ' + (r === 'ok' ? 'every item cleared through the screens; Adopt unlocks' : r) + ' · ' + (d || ''));
  ok(results.length >= 15, 'Checked ' + results.length + ' procedures');
  ok((await activePh(p)).procedures.every(x => x.status !== 'adopted'), 'Nothing was adopted for the owner');
  await done(b, errors);
})();
