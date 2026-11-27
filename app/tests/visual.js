// Visual Polish spec (26 Nov 2026, on build d192b6a64a): light only, 400/600 weights, hairline cards, service icons, the
// "You're all set" card, the bottom sheet and pill toasts. Real touch taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const weights = p => p.evaluate(() => [...new Set([...document.querySelectorAll('body *')].filter(e => e.getClientRects().length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => getComputedStyle(e).fontWeight))].sort());
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-26T10:00:00+11:00', scale: 2 });
  await p.emulateMedia({ colorScheme: 'dark' });
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Polish Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const x of ['Home delivery', 'Staged supply']) await p.locator('label.tick', { hasText: x }).first().tap();
  await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(255, 255, 255)', 'Light only: a phone in dark mode still gets the light page (Stage 3F: crisp #FFFFFF canvas)');
  ok((await weights(p)).every(w => w === '400' || w === '600'), 'Type: only 400 and 600 on Today (' + (await weights(p)).join(', ') + ')');
  const card = await p.evaluate(() => { const c = document.querySelector('main .card, main .list'); const cs = getComputedStyle(c); return { b: cs.borderTopColor, s: cs.boxShadow, r: cs.borderTopLeftRadius }; });
  ok(card.b === 'rgb(228, 232, 236)' && (card.s === 'none' || /^rgb\(15, 118, 110\) 3px 0px 0px 0px inset$/.test(card.s)), 'Stage 3F Swiss Clinical: hairline (1 px #E4E8EC) surfaces, no soft shadow (a 3 px teal bar on the next-up card) (' + card.b + ', ' + card.s + ', ' + card.r + ')');
  // service icons
  await tap(p, 'Set up services'); await p.waitForTimeout(250);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  const ics = await p.evaluate(() => [...document.querySelectorAll('.list .row .row-ic svg')].map(s => getComputedStyle(s).strokeWidth));
  ok(ics.length >= 2 && ics.every(w => w === '1.8px'), 'Services: each row has a 1.8-stroke icon (' + ics.length + ')');
  // finish one service → "set up" card, then the second → "You're all set"
  const finish = async name => { await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(250);
    for (let i = 0; i < 30 && !/What happens next/.test(await text(p)); i++) { const ch = p.locator('main form label.choice'), tk = p.locator('main form label.tick');
      if (await ch.count()) await ch.first().tap(); else if (await tk.count()) await tk.first().tap(); else { const d = p.locator('main form input[name=d]'); if (await d.count() && !(await d.inputValue())) { await d.tap(); await p.keyboard.type('Fictional', { delay: 5 }); } }
      await p.waitForTimeout(200); const nx = p.getByRole('button', { name: /^(Next|Finish|Answer now)$/ }).first(); if (await nx.count()) await nx.tap(); await p.waitForTimeout(200); }
    await p.getByRole('button', { name: /^(Save dates and finish|Finish setup)$/ }).first().tap(); await p.waitForTimeout(400); };
  await finish('Home delivery');
  ok(await p.locator('.toast.done').count() === 1 && await p.evaluate(() => { const r = document.querySelector('.toast').getBoundingClientRect(); return getComputedStyle(document.querySelector('.toast')).borderTopLeftRadius === '6px' && Math.abs(r.left - (innerWidth - r.right)) <= 1; }), 'Toast (Stage 3G-A): a centred, fit-content 6 px toast with a settling check when a service is set up');
  ok(await p.locator('.card.allset').count() === 1 && /Home delivery is set up/.test(await text(p)) && /1 of 2 services set up/.test(await text(p)) && await p.getByRole('button', { name: 'Set up Staged supply' }).count() === 1, 'Setup finish: the calm summary card says what happened and offers the next service');
  await p.screenshot({ path: path.join(OUT, '80_setup_summary_390px.png') });
  await tap(p, 'Set up Staged supply'); await p.waitForTimeout(250); await p.getByRole('button', { name: 'Back', exact: true }).first().tap().catch(() => {}); await p.waitForTimeout(200);
  if (!/What happens next|Question/.test(await text(p))) await p.getByRole('button', { name: /^Staged supply/ }).first().tap();
  await p.waitForTimeout(200); await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200);
  await finish('Staged supply');
  ok(/You’re all set/.test(await text(p)) && /2 of 2 services set up/.test(await text(p)), 'Setup finish: the last service shows “You’re all set”');
  // procedure list icons + adopt sheet
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.waitForTimeout(200);
  ok(await p.locator('.list .row .row-ic').count() >= 2, 'Procedures: rows carry the service icons');
  await p.screenshot({ path: path.join(OUT, '81_procedures_icons_390px.png') });
  let adoptable = null;
  for (const name of ['Home delivery', 'Staged supply']) { await p.locator('.list .row', { hasText: name }).first().tap(); await p.waitForTimeout(250);
    for (let k = 0; k < 10; k++) { const r = p.locator('.sec', { hasText: /To confirm/i }).locator('.row').first(); if (!(await r.count())) break; await r.tap(); await p.waitForTimeout(250);
      if (await p.getByRole('button', { name: 'I’ve checked it — remove this marker' }).count()) await tap(p, 'I’ve checked it — remove this marker'); else { await p.keyboard.type('Fictional pharmacy steps written by the owner.'); await tap(p, 'Save as new version'); } await p.waitForTimeout(300); }
    if (await p.getByRole('button', { name: 'Adopt for use here' }).isEnabled()) { adoptable = name; break; }
    await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200); }
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(250);
  const sh = await p.evaluate(() => { const s = document.querySelector('.sheet'), r = s?.getBoundingClientRect(), hd = s?.querySelector('.sheet-handle')?.getBoundingClientRect(); return s && { bottom: Math.round(r.bottom), prim: s.querySelectorAll('.btn.primary').length, back: getComputedStyle(document.querySelector('.sheet-back')).backgroundColor, handle: [hd.width, hd.height] }; });
  ok(sh && sh.bottom === 844 && sh.prim === 1 && sh.back === 'rgba(15, 23, 42, 0.36)' && sh.handle[0] === 36 && sh.handle[1] === 4, 'Adopt: a bottom sheet with one primary button, a 36×4 handle and a dimmed backdrop');
  await p.waitForTimeout(250); await p.screenshot({ path: path.join(OUT, '82_adopt_sheet_390px.png') });
  await p.mouse.click(195, 120); await p.waitForTimeout(250);
  ok(await p.locator('.sheet').count() === 0 && (await p.evaluate(() => document.querySelectorAll('.pill')[0]?.innerText)) !== 'Adopted', 'Adopt: tapping the backdrop dismisses the sheet and adopts nothing');
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(200); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(300);
  ok(/Adopted · version/.test(await text(p)) && await p.locator('.sheet').count() === 0, 'Adopt: “Yes, adopt it” in the sheet adopts (' + adoptable + ')');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No sideways scroll');
  await done(b, errors);
})();
