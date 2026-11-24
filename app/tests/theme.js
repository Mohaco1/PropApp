// P-06 E+++ Coastal Precision acceptance checks and F-P06-01 Copy fallback, by real taps at 390×844, plus the brief's
// 4 screenshots. Theme checks read computed styles; nothing is called directly.
const { phone, ok, done, tap, text } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const rgb = hex => 'rgb(' + hex.match(/\w\w/g).map(x => parseInt(x, 16)).join(', ') + ')';
(async () => {
  // F-P06-01: no clipboard API at all (as when the app file is opened from a phone's files); the old copy command is
  // watched so the test can read what it copied.
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  await p.addInitScript(() => { try { delete Navigator.prototype.clipboard; } catch {} Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    window.__legacy = []; const orig = document.execCommand.bind(document);
    document.execCommand = (cmd, ...a) => { if (cmd === 'copy') { const el = document.activeElement; window.__legacy.push(el && el.tagName === 'TEXTAREA' ? el.value.slice(el.selectionStart, el.selectionEnd) : String(getSelection())); orig(cmd, ...a); return true; } return orig(cmd, ...a); }; });
  await p.reload(); await p.waitForTimeout(400);
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(600);
  // 1. tokens, header strip, monogram badge
  const look = await p.evaluate(() => { const cs = e => getComputedStyle(e); const bar = document.querySelector('.bar'), strip = getComputedStyle(bar, '::before'), mark = document.querySelector('.mark').getBoundingClientRect();
    return { bg: cs(document.body).backgroundColor, bar: cs(bar).backgroundColor, strip: strip.height, grad: strip.backgroundImage, mark: [Math.round(mark.width), Math.round(mark.height)], markText: document.querySelector('.mark').innerText, font: cs(document.body).fontFamily }; });
  ok(look.bg === rgb('F2F6F8') && look.bar === rgb('FFFFFF'), 'P-06 canvas #F2F6F8 and white header');
  ok(look.strip === '3.5px' && /^linear-gradient\(90deg, rgb\(0, 139, 130\) 0%, rgb\(0, 87, 146\) 100%\)$/.test(look.grad), 'P-06 3.5px teal-to-ocean strip on the header');
  ok(look.mark[0] === 22 && look.mark[1] === 22 && look.markText === 'R.', 'P-06 22×22 “R.” monogram badge');
  ok(/^"?Public Sans"?, "?Inter"?/.test(look.font), 'P-06 font stack starts Public Sans, Inter');
  // 2. one pharmacy: no pill switch
  ok(await p.locator('.sw-pill').count() === 0, 'P-06 one pharmacy: the site switch pill is hidden');
  // 3. editorial date, tinted chips, tabular numbers
  const top = await p.evaluate(() => { const d = getComputedStyle(document.querySelector('.status .date')), o = document.querySelector('.filters [data-f=overdue]'), w = document.querySelector('.filters [data-f=week]');
    return { w: d.fontWeight, ls: d.letterSpacing, size: d.fontSize, o: getComputedStyle(o).backgroundColor, wk: getComputedStyle(w).backgroundColor, num: getComputedStyle(document.querySelector('.filters')).fontVariantNumeric }; });
  ok(top.w === '600' && top.ls !== 'normal', 'P-06 date header in 600 weight with tight letter-spacing (' + top.size + ', ' + top.ls + ')');
  ok(top.o === rgb('FDF1F3') && top.wk === rgb('FEF6EB') && top.num === 'tabular-nums', 'P-06 Overdue and This week chips tinted; counts in tabular numbers');
  // 4. rails only on overdue and due-soon rows
  const rails = await p.evaluate(() => [...document.querySelectorAll('.list .row')].map(r => ({ tone: r.classList.contains('bad') ? 'bad' : r.classList.contains('warn') ? 'warn' : '', rail: getComputedStyle(r, '::before').content !== 'none' ? getComputedStyle(r, '::before').backgroundColor : '' })));
  ok(rails.some(r => r.tone === 'bad') && rails.every(r => (r.tone === 'bad' ? r.rail === rgb('B81D3A') : r.tone === 'warn' ? r.rail === rgb('A84B00') : r.rail === '')), 'P-06 urgency rail only on overdue (#B81D3A) and due-soon (#A84B00) rows (' + rails.length + ' rows)');
  // 6. bottom bar indicator
  const nav = await p.evaluate(() => { const on = document.querySelector('.nav button.on'), i = getComputedStyle(on, '::before'), r = [...document.querySelectorAll('.nav button')].map(b => b.getBoundingClientRect());
    return { w: i.width, h: i.height, stroke: getComputedStyle(on.querySelector('.ic')).strokeWidth, small: r.filter(x => x.width < 44 || x.height < 44).length, n: r.length }; });
  ok(nav.n === 5 && nav.w === '22px' && nav.h === '2.5px' && nav.stroke === '1.85px' && nav.small === 0, 'P-06 5 tabs, 1.85 strokes, 22×2.5 gradient pill on the active tab, all ≥ 44 px');
  // 5. no 700/800 weights anywhere on screen
  const heavy = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && +getComputedStyle(e).fontWeight >= 700 && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => e.className || e.tagName).slice(0, 4));
  ok(heavy.length === 0, 'P-06 no text heavier than 600 on Today' + (heavy.length ? ' (' + heavy.join(', ') + ')' : ''));
  await p.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 5000 }); await p.screenshot({ path: path.join(OUT, '01_today_390px.png') });
  // F-P06-01 on a real Copy button: review "Copy as text"
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^Completed/ }).click(); await p.locator('.row', { hasText: 'Proprietor site visit' }).first().click();
  ok(await p.evaluate(() => navigator.clipboard === undefined), 'F-P06-01 the clipboard API is absent in this test');
  await tap(p, 'Copy as text'); await p.waitForTimeout(200);
  const leg = await p.evaluate(() => window.__legacy[window.__legacy.length - 1] || '');
  ok(/Proprietor site visit/.test(leg) && /Checked/.test(leg), 'F-P06-01 fallback selected the full summary in a hidden text box and ran the copy command');
  ok(/Copied/.test(await p.evaluate(() => document.querySelector('.toast')?.innerText || '')), 'F-P06-01 “Copied” shows after the fallback');
  ok(await p.evaluate(() => !document.querySelector('body > textarea')), 'F-P06-01 the hidden text box is removed afterwards');
  // 04: Actions with rails
  await tap(p, 'Actions'); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, '04_actions_view.png') });
  // 03: Year plan
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click(); await tap(p, 'Year plan'); await p.waitForTimeout(200);
  const yp = await p.evaluate(() => { const box = document.querySelector('.scrollx').getBoundingClientRect(), head = document.querySelector('.yearplan th[scope=row]').getBoundingClientRect();
    return { months: [...document.querySelectorAll('.yearplan thead th')].slice(1).filter(th => { const r = th.getBoundingClientRect(); return r.left >= head.right - 1 && r.right <= box.right + 1; }).length, num: getComputedStyle(document.querySelector('.yearplan')).fontVariantNumeric }; });
  ok(yp.months >= 6 && yp.num === 'tabular-nums', 'P-06 Year plan still shows ' + yp.months + ' months at 390 px, tabular numbers');
  await p.evaluate(() => document.querySelector('.yearplan')?.scrollIntoView({ block: 'center' })); await p.screenshot({ path: path.join(OUT, '03_year_plan_390px.png') });
  // 02: site visit service evidence
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 14; i++) { const t = await text(p); await p.locator('label.choice', { hasText: /^Satisfactory$/ }).click(); await p.waitForTimeout(60);
    if (/Dose administration aids/.test(t.split('Check ')[1] || '')) break; await p.getByRole('button', { name: 'Next', exact: true }).click(); }
  await p.locator('label.choice', { hasText: 'Verified operational review' }).click(); await p.fill('input[name=ref]', 'Packing check log, week of 10 Nov (fictional)'); await p.locator('input[name=ref]').blur(); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector('input[name=ref]').closest('.card,.sec,form')?.scrollIntoView({ block: 'center' })); await p.screenshot({ path: path.join(OUT, '02_site_visit_evidence.png') });
  // 2. two pharmacies: the pill switch appears
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy');
  await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await p.locator('label.tick', { hasText: 'Home delivery' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const sw = await p.evaluate(() => { const b = document.querySelector('.ph-switch.multi'), s = b?.querySelector('.sw-pill'); if (!s) return null; const r = b.getBoundingClientRect(), cs = getComputedStyle(s);
    return { h: Math.round(r.height), color: cs.color, weight: cs.fontWeight, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(sw && sw.h >= 44 && sw.color === rgb('005792') && sw.weight === '600' && !sw.over, 'P-06 two pharmacies: the site switch is an ocean pill on a soft track, 44 px tap area');
  await p.setViewportSize({ width: 320, height: 568 });
  for (const t of ['Today', 'Reviews', 'Actions', 'Staff', 'More']) { await tap(p, t); await p.waitForTimeout(120); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'P-06 320×568 ' + t + ': no sideways scroll'); }
  await done(b, errors);
})();
