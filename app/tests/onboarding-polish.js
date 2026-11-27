// Onboarding polish (27 Nov), tapped at phone size: a single-choice answer moves on by itself (Previous still goes
// back, a quick Next after it never skips a question, ticks and typed boxes wait for Next); Finish setup shows one
// plan card with one primary button, Open Today; and a focused box on a short screen keeps its main button in view.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js');
const qn = async p => +((await text(p)).match(/Question (\d+)/) || [])[1] || 0;
const inView = async (p, sel) => p.evaluate(s => { const b = [...document.querySelectorAll(s)].find(x => x.offsetParent); if (!b) return false; const r = b.getBoundingClientRect(), vv = window.visualViewport; return r.top >= 0 && r.bottom <= (vv ? vv.height : innerHeight); }, sel);
async function setup(p, services) {
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Polish Test Pharmacy (fictional)'); await tap(p, 'Continue');
  await p.fill('input[name=owner0]', 'Alex Owner'); await tap(p, 'Continue');
  for (const s of services) await p.locator('label.tick', { hasText: s }).first().click();
  await p.getByRole('button', { name: 'Finish setup', exact: true }).click(); await p.waitForTimeout(400);
}
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-27T10:00:00+11:00' });
  await setup(p, ['Dose administration aids', 'Home delivery']);
  // Plan reveal
  let t = await text(p);
  ok(/Here’s your pharmacy plan/.test(t), 'Finish setup shows the plan card');
  ok(await p.locator('.bar-title').innerText() === 'Polish Test Pharmacy (fictional)' && t.split('Polish Test Pharmacy (fictional)').length === 2, 'pharmacy name shown once, in the header');
  ok(/2 services · Dose administration aids, Home delivery/.test(t), 'plan card counts 2 services');
  ok(/2 procedures to draft in Procedures/.test(t), 'plan card counts the procedures to draft');
  ok(/S8 stocktake/.test(t) && /Add your last stocktake date on Today/.test(t), 'plan card shows the S8 stocktake reminder');
  ok(await p.locator('main .btn.primary:visible').count() === 1, 'one primary button on the plan card');
  ok(await inView(p, 'main .btn.primary'), 'Open Today is visible without scrolling at 390 × 844');
  ok(await p.locator('nav.nav, .tabbar').count() === 0 || !(await p.locator('nav').first().isVisible()), 'no tab bar on the plan card');
  await tap(p, 'Open Today'); await p.waitForTimeout(300); t = await text(p);
  ok(/Set up services/.test(t) && !/Here’s your pharmacy plan/.test(t), 'Open Today opens Today');
  ok((await activePh(p)).settings.setupDone === true, 'pharmacy saved before the plan card');
  // Single-choice auto-advance
  await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /Answer/ }).count()) { await p.getByRole('button', { name: /Answer/ }).first().click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save'); }
  await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await p.waitForTimeout(250);
  // find a single-choice question (radio, no box to type in)
  let found = false;
  for (let i = 0; i < 12; i++) {
    if (await p.getByRole('button', { name: 'Answer now', exact: true }).count()) { await tap(p, 'Answer now'); await p.waitForTimeout(150); }
    if (await p.locator('form[data-form=next] input[type=radio]').count() && !(await p.locator('form[data-form=next] input[name=d]').count())) { found = true; break; }
    const ch = p.locator('form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } }
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(450);
  }
  ok(found, 'reached a single-choice question');
  const q1 = await qn(p);
  const opt = p.locator('form[data-form=next] label.choice').first(); const optText = (await opt.innerText()).trim();
  await opt.click(); await p.waitForTimeout(60);
  ok(await p.locator('label.choice.picked').count() === 1 && await qn(p) === q1, 'the tapped choice is highlighted before moving on');
  await p.waitForTimeout(300);
  ok(await qn(p) === q1 + 1, 'single choice moves on to the next question by itself (' + q1 + ' → ' + (await qn(p)) + ')');
  const ph1 = await activePh(p); ok(Object.values(ph1.services.daa.answers).some(v => String(v).startsWith(optText)), 'the auto-advanced answer is saved: ' + optText);
  // Previous goes back, with the answer still ticked
  await tap(p, 'Previous'); await p.waitForTimeout(250);
  ok(await qn(p) === q1, 'Previous goes back to the answered question');
  ok((await p.locator('form[data-form=next] label.choice:has(input:checked)').innerText()).trim() === optText, 'the earlier pick is still selected after Previous');
  await p.waitForTimeout(500); ok(await qn(p) === q1, 'going back does not move on by itself');
  // A quick Next straight after a pick never skips a question
  const other = p.locator('form[data-form=next] label.choice').nth(1); await other.click(); await p.waitForTimeout(200); await tap(p, 'Next'); await p.waitForTimeout(400);
  ok(await qn(p) === q1 + 1, 'a Next tap right after the automatic move does not skip a question (at ' + (await qn(p)) + ')');
  // Multi-select (ticks) waits for Next
  for (let i = 0; i < 25; i++) { if (await p.locator('form[data-form=next] label.tick input[name=m]').count() || /What happens next/.test(await text(p))) break;
    if (await p.getByRole('button', { name: 'Answer now', exact: true }).count()) { await tap(p, 'Answer now'); await p.waitForTimeout(150); continue; }
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(450); }
  if (await p.locator('form[data-form=next] label.tick input[name=m]').count()) { const qm = await qn(p); await p.locator('form[data-form=next] label.tick').first().click(); await p.waitForTimeout(500);
    ok(await qn(p) === qm, 'a tick question waits for Next'); } else ok(false, 'reached a tick question');
  // Keyboard-safe: "Where exactly?" on a short screen keeps Next in view
  await p.setViewportSize({ width: 390, height: 380 });
  for (let i = 0; i < 25; i++) { if (await p.locator('form[data-form=next] input[name=d]').count() && /Where exactly/.test(await text(p))) break;
    if (await p.getByRole('button', { name: 'Answer now', exact: true }).count()) { await tap(p, 'Answer now'); await p.waitForTimeout(150); continue; }
    if (/What happens next/.test(await text(p))) break; await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(450); }
  if (await p.locator('form[data-form=next] input[name=d]').count()) { await p.evaluate(() => window.scrollTo(0, 0)); await p.locator('form[data-form=next] input[name=d]').focus(); await p.waitForTimeout(250);
    ok(await inView(p, 'main .btnrow .btn.primary'), 'Next stays in view with “Where exactly?” focused at 390 × 380');
    ok(await p.evaluate(() => document.activeElement.getBoundingClientRect().top >= (document.querySelector('.bar')?.getBoundingClientRect().bottom || 0)), 'the focused box stays below the header'); }
  else ok(false, 'reached “Where exactly?”');
  await b.close();
  // Zero services, short screen: Step 1 Continue in view when the name box is focused; plan card falls back gracefully
  const s = await phone({ time: '2026-11-27T10:00:00+11:00', viewport: { width: 390, height: 300 } });
  await tap(s.p, 'Set up your pharmacy'); await s.p.locator('input[name=address]').focus(); await s.p.waitForTimeout(250);
  ok(await inView(s.p, 'form .dock-inline .btn.primary'), 'Step 1 Continue stays in view with a box focused at 390 × 300');
  await s.p.fill('input[name=name]', 'Empty Test Pharmacy (fictional)'); await tap(s.p, 'Continue'); await s.p.fill('input[name=owner0]', 'Sam Owner');
  await s.p.locator('input[name=owner0]').focus(); await s.p.waitForTimeout(250);
  ok(await inView(s.p, 'form .dock-inline .btn.primary'), 'Step 2 Continue stays in view with a box focused');
  ok(await s.p.evaluate(() => document.activeElement.closest('.field').getBoundingClientRect().top >= document.querySelector('.bar').getBoundingClientRect().bottom), 'Step 2: the focused box’s label stays below the header');
  await tap(s.p, 'Continue'); await s.p.getByRole('button', { name: 'Finish setup', exact: true }).click(); await s.p.waitForTimeout(400);
  t = await text(s.p);
  ok(/Here’s your pharmacy plan/.test(t) && /None yet\. Add them any time from More → Services\./.test(t) && /Drafted in Procedures once you add a service/.test(t), 'zero services: the plan card says so calmly');
  ok(!/\b0 service/.test(t), 'zero services: no “0 services”');
  await tap(s.p, 'Open Today'); await s.p.waitForTimeout(300);
  ok(!/Here’s your pharmacy plan/.test(await text(s.p)), 'zero services: Open Today opens Today');
  for (const e of s.errors) errors.push(e);
  await done(s.b, errors);
})();
