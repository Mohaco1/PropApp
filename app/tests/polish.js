// Post-parity polish brief acceptance checks (P-02, P-04), by real taps at 390×844, plus the brief's screenshots.
const { phone, ok, done, tap, text } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const answerOne = async p => { const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } await p.waitForTimeout(50); };
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  // P-04: the toast after "Skip for now" in DAA setup sits clear of the UAT notes pill
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Harbour Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Alex Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Dose administration aids' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(300);
  await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Dose administration aids/ }).click();
  let skipped = false;
  for (let i = 0; i < 40 && !skipped; i++) { if (await p.getByRole('button', { name: 'Skip for now', exact: true }).count()) { await tap(p, 'Skip for now'); skipped = true; break; } await answerOne(p); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); }
  await p.waitForTimeout(150);
  const g = await p.evaluate(() => { const t = document.querySelector('.toast')?.getBoundingClientRect(), u = document.querySelector('#uat-btn')?.getBoundingClientRect(); if (!t || !u) return null;
    return { text: document.querySelector('.toast').innerText, gap: Math.round(u.top - t.bottom), overlap: !(t.bottom <= u.top || t.top >= u.bottom || t.right <= u.left || t.left >= u.right), inView: t.top >= 0 && t.bottom <= innerHeight }; });
  ok(skipped && g && !g.overlap && g.inView, 'P-04 the DAA skip toast (“' + (g?.text || 'none') + '”) has 0 px overlap with the UAT notes pill (' + (g ? g.gap + ' px clear above it' : 'not shown') + ')');
  await p.screenshot({ path: path.join(OUT, 'p04-daa-skip-toast.png') });
  // P-02: Year plan fits at least 6 month columns in view; long review names wrap; the Find placeholder isn't clipped
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Open the example pharmacy (fictional)'); await p.waitForTimeout(600);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click(); await tap(p, 'Year plan'); await p.waitForTimeout(200);
  const y = await p.evaluate(() => { const box = document.querySelector('.scrollx').getBoundingClientRect(), head = document.querySelector('.yearplan th[scope=row]').getBoundingClientRect();
    const months = [...document.querySelectorAll('.yearplan thead th')].slice(1).filter(th => { const r = th.getBoundingClientRect(); return r.left >= head.right - 1 && r.right <= box.right + 1; }).length;
    const rows = [...document.querySelectorAll('.yearplan th[scope=row]')].map(th => th.getBoundingClientRect().width);
    return { months, maxHead: Math.round(Math.max(...rows)), wrapped: [...document.querySelectorAll('.yearplan th[scope=row]')].some(th => th.getBoundingClientRect().height > 30), page: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(y.months >= 6, 'P-02 Year plan shows ' + y.months + ' month columns fully in view at 390 px (needs 6)');
  ok(y.maxHead <= 150 && y.wrapped, 'P-02 review names stay within 150 px (' + y.maxHead + ' px) and long ones wrap');
  ok(y.page, 'P-02 no sideways page scroll on Year plan');
  await p.evaluate(() => document.querySelector('.yearplan')?.scrollIntoView({ block: 'center' })); await p.screenshot({ path: path.join(OUT, 'p02-year-plan-390.png') });
  await tap(p, 'Weeks').catch(() => {}); await p.waitForTimeout(150);
  const ph = await p.evaluate(() => { const i = document.querySelector('input[name=find]'); if (!i) return null; const c = document.createElement('canvas').getContext('2d'); const st = getComputedStyle(i); c.font = st.fontSize + ' ' + st.fontFamily;
    return { text: i.placeholder, fits: c.measureText(i.placeholder).width <= i.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) }; });
  ok(ph && ph.text === 'e.g. 1 Dec, next Friday' && ph.fits, 'P-02 Find a date placeholder is “' + (ph?.text || '') + '” and fits the box');
  ok(!/\(Policies\)/.test(await text(p)), 'P-01 no "(Policies)" on screen');
  await done(b, errors);
})();
