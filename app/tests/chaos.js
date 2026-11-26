// Chaos-test fixes (10 issues Codex found on build 07775c5947), each reproduced by real touch taps at 390×844.
// Fails on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js');
const setup = async (p, name, svcs, owner = 'Sam Owner') => {
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', name); await tap(p, 'Continue'); await p.fill('input[name=owner0]', owner); await tap(p, 'Continue');
  for (const x of svcs) await p.locator('label.tick', { hasText: x }).first().tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(200); } };
const qn = async p => +(((await text(p)).match(/Question (\d+)/) || [])[1] || 0);
(async () => {
  const errors = [];
  const open = async (opts = {}) => { const s = await phone({ time: '2026-11-26T10:00:00+11:00', ...opts }); s.p.on('pageerror', e => errors.push(e.message)); s.errors.forEach(e => errors.push(e)); return s; };
  // 3. spaces-only owner name: refused with a message, no crash
  let { b, p } = await open();
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Chaos Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', '   '); await tap(p, 'Continue'); await p.waitForTimeout(200);
  ok(/Enter your name\./.test(await text(p)) && /Step 2 of 3/.test(await text(p)), 'Fix 3: a name of only spaces is refused with “Enter your name.” and setup stays on step 2');
  await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const x of ['Staged supply', 'Pharmacist prescribing', 'Dose administration aids']) await p.locator('label.tick', { hasText: x }).first().tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  ok(/Wed 26 Nov|Thu 26 Nov/.test(await text(p)) && (await activePh(p)).proprietors[0].name === 'Sam Owner', 'Fix 3: setup then finishes and reaches Today');
  await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  // 10. rapid double tap on Next moves one question only
  await p.getByRole('button', { name: /^Staged supply/ }).first().tap(); await p.waitForTimeout(300);
  await p.locator('main form label.choice, main form label.tick').first().tap(); await p.waitForTimeout(450);
  const q0 = await qn(p); const nx = p.getByRole('button', { name: /^(Next|Finish)$/ }).first(); await nx.tap(); await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap().catch(() => {}); await p.waitForTimeout(400);
  ok(await qn(p) === q0 + 1, 'Fix 10: a rapid double tap on Next moves one question (Q' + q0 + ' → Q' + await qn(p) + ')');
  // 1. type software, Next, reload at once: answer and step survive
  while (!(await p.locator('main form input[name=d]').count() && await p.locator('main form label.choice').count() === 0) && await qn(p) < 6) { await p.locator('main form label.choice, main form label.tick').first().tap(); await p.waitForTimeout(450); await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(450); }
  const qs = await qn(p); await p.locator('main form input[name=d]').tap(); await p.keyboard.type('Fictional system west', { delay: 10 });
  await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.reload(); await p.waitForTimeout(800);
  let ph = await activePh(p);
  ok(Object.values(ph.services.staged.answers).includes('Fictional system west') && ph.services.staged.pos === qs, 'Fix 1: reloading straight after Next keeps the typed software name and the step');
  // 2. QLD gate: Yes, tick a QLD condition, No → the QLD condition is removed
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Pharmacist prescribing/ }).first().tap(); await p.waitForTimeout(300);
  for (let i = 0; i < 10 && !/Does any pharmacist here hold the Queensland training/.test(await text(p)); i++) { await p.locator('main form label.choice, main form label.tick').first().tap(); await p.waitForTimeout(450); await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(450); }
  await p.getByRole('button', { name: 'Yes, show those conditions' }).tap(); await p.waitForTimeout(300);
  // 6. the toast never blocks a tap
  ok(await p.evaluate(() => { const t = document.querySelector('.toast'); return !t || getComputedStyle(t).pointerEvents === 'none'; }), 'Fix 6: the toast lets taps through (pointer-events: none)');
  await p.locator('main form label.tick', { hasText: 'Mild acute musculoskeletal pain' }).tap(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'No', exact: true }).tap(); await p.waitForTimeout(300);
  ph = await activePh(p);
  ok(ph.services.prescribing.qld === 'no' && !/Musculoskeletal pain/.test(ph.services.prescribing.answers.pathway || ''), 'Fix 2: switching Queensland training to No removes the Queensland-only condition (no contradictory state)');
  // 4. DAA "Other (describe)" text with commas survives Next/Previous
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).tap(); await p.getByRole('button', { name: /^Dose administration aids/ }).first().tap(); await p.waitForTimeout(300);
  let descOk = null;
  for (let i = 0; i < 14; i++) { const other = p.locator('main form label.tick', { hasText: /^Other.*\(describe\)/ });
    if (await other.count()) { await other.first().tap(); await p.waitForTimeout(300); await p.fill('main form input[name=d]', 'Rack, A: O\'Neil "West"'); await p.locator('main form input[name=d]').blur(); await p.waitForTimeout(300);
      await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(450); await p.getByRole('button', { name: 'Previous' }).tap(); await p.waitForTimeout(450);
      descOk = await p.locator('main form input[name=d]').inputValue(); break; }
    await p.locator('main form label.choice, main form label.tick').first().tap(); await p.waitForTimeout(450); await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(450); }
  ok(descOk === 'Rack, A: O\'Neil "West"', 'Fix 4: “Other (describe)” text with commas reads back whole (' + JSON.stringify(descOk) + ')');
  // 7–8. staff form: keeps the name when the role is missing; refuses a name of only spaces
  await tap(p, 'Staff'); await p.getByRole('button', { name: 'Add a staff member', exact: true }).first().tap(); await p.fill('input[name=name]', 'Pat Example (fictional)'); await tap(p, 'Save'); await p.waitForTimeout(200);
  ok(/Choose a role\./.test(await text(p)) && await p.locator('input[name=name]').inputValue() === 'Pat Example (fictional)', 'Fix 7: a missing role shows its message and keeps the typed name');
  await p.fill('input[name=name]', '   '); await p.selectOption('select[name=role]', { index: 1 }); await tap(p, 'Save'); await p.waitForTimeout(200);
  ok(/Enter a name\./.test(await text(p)) && !(await activePh(p)).staff.length, 'Fix 8: a staff name of only spaces is refused; nobody is added');
  // 9. 650 unbroken characters never widen the page
  const long = 'X'.repeat(650); await p.fill('input[name=name]', long); await tap(p, 'Save'); await p.waitForTimeout(300);
  const w1 = await p.evaluate(() => document.documentElement.scrollWidth);
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action' }).tap(); await p.fill('main input[name=title], main textarea[name=title]', 'Y'.repeat(650)); await tap(p, 'Save action'); await p.waitForTimeout(300);
  const w2 = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(w1 <= 391 && w2 <= 391, 'Fix 9: 650 unbroken characters wrap; the staff page (' + w1 + ' px) and action page (' + w2 + ' px) stay 390 px wide');
  await b.close();
  // 5. Today moves to the new day after Sydney midnight
  ({ b, p } = await open({ time: '2026-11-26T23:59:40+11:00' }));
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3000);
  const before = await p.locator('main h1, main .date, main').first().innerText();
  await p.clock.runFor(60000); await p.waitForTimeout(300);
  ok(/Thu 26 Nov/.test(before) && /Fri 27 Nov/.test(await text(p)), 'Fix 5: Today changes from Thu 26 Nov to Fri 27 Nov after Sydney midnight without navigating');
  await b.close();
  console.log(errors.length ? 'errors: ' + errors.slice(0, 3).join(' | ') : '');
  const fake = { close: async () => {} }; await done(fake, errors);
})();
