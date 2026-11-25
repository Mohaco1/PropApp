// v3 checks, by real taps at 390×844: evidence pack (V3-03), multi-site view (V3-04). Fails on any console error.
const { phone, ok, done, tap, text, saved } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  // V3-03 evidence pack
  const before = JSON.stringify(await saved(p));
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).click(); await p.waitForTimeout(300);
  let t = await text(p);
  ok(/Wattle Grove Pharmacy · evidence pack/.test(t) && /Proprietor: Jordan Avery/.test(t) && /Designed for de-identified proprietor records/.test(t), 'V3-03 the pack has a header: pharmacy, proprietor, period, de-identified framing');
  const secs = await p.evaluate(() => [...document.querySelectorAll('.psec h2')].map(e => e.innerText));
  ok(['Reviews, visits and meetings', 'S8 stock checks', 'Open actions', 'Actions closed', 'Staff', 'Procedures'].every(s => secs.some(x => x.startsWith(s))), 'V3-03 sections with data are in the pack by default: reviews, S8 checks, open and closed actions, staff, procedures (evidence locations join once one is recorded, pre-trial B1)');
  ok(/S8 stock checks · [1-9]/.test(secs.join('|')) && /Open actions · [1-9]/.test(secs.join('|')) && /Staff · 4/.test(secs.join('|')), 'V3-03 it reads the example’s records (S8 checks, open actions, 4 staff)');
  ok(JSON.stringify(await saved(p)) === before, 'V3-03 opening the pack changes nothing');
  await p.screenshot({ path: path.join(OUT, '10_evidence_pack_390px.png') });
  await p.emulateMedia({ media: 'print' });
  const pr = await p.evaluate(() => { const vis = s => [...document.querySelectorAll(s)].some(e => getComputedStyle(e).display !== 'none'); return { nav: vis('.nav'), bar: vis('.bar'), btn: vis('main .btn'), uat: vis('#uat-btn'), pack: vis('.pack'), bg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.querySelector('.ptable td')).color }; });
  ok(!pr.nav && !pr.bar && !pr.btn && !pr.uat && pr.pack && pr.bg === 'rgb(255, 255, 255)' && pr.ink === 'rgb(17, 24, 39)', 'V3-03 printing: only the pack, white page, dark ink; bottom bar, header, buttons and UAT pill hidden');
  await p.pdf({ path: path.join(OUT, 'evidence-pack-example.pdf'), format: 'A4', printBackground: true });
  ok(fs.statSync(path.join(OUT, 'evidence-pack-example.pdf')).size > 20000, 'V3-03 Chromium makes an A4 PDF of it');
  await p.emulateMedia({ media: 'screen', colorScheme: 'dark' }); await p.emulateMedia({ media: 'print' });
  ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(255, 255, 255)', 'V3-03 printing from night mode still gives a white page');
  await p.emulateMedia({ media: 'screen', colorScheme: 'light' });
  // V3-04 multi-site view
  await tap(p, 'Today'); await p.waitForTimeout(150);
  ok(await p.locator('.siteline').count() === 0 || /Extra visit in progress/.test(await p.locator('.siteline').innerText()), 'V3-04 one pharmacy: no cross-pharmacy line on Today');
  const odEx = +(await p.locator('.filters [data-f=overdue] b').innerText());
  await p.locator('.ph-switch').click(); ok(await p.getByRole('button', { name: /^All pharmacies/ }).count() === 0, 'V3-04 one pharmacy: no “All pharmacies” row');
  await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Home delivery' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  const od2 = +(await p.locator('.filters [data-f=overdue] b').innerText());
  await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^All pharmacies/ }).click(); await p.waitForTimeout(200); t = await text(p);
  ok(t.includes((odEx + od2) + ' overdue and') && t.includes('across 2 pharmacies'), 'V3-04 All pharmacies: “' + t.split('\n').find(l => /across 2 pharmacies/.test(l)) + '” (each pharmacy’s own overdue count, added)');
  ok(/All pharmacies/.test(t) && new RegExp('Wattle Grove Pharmacy · ' + odEx + ' overdue', 'i').test(t) && /Second Test Pharmacy \(fictional\) · (nothing overdue|\d+ overdue)/i.test(t), 'V3-04 All pharmacies groups items under each pharmacy with its overdue count');
  await p.screenshot({ path: path.join(OUT, '11_all_pharmacies_390px.png') });
  await p.locator('[data-act=item][data-site]').first().click(); await p.waitForTimeout(400);
  ok(/S8 stock check/.test(await p.evaluate(() => document.querySelector('.bar-title')?.innerText || '')), 'V3-04 tapping an item opens it (the S8 review)');
  await tap(p, 'Today'); ok(/Wattle Grove Pharmacy/.test(await p.locator('.ph-sub').innerText()), 'V3-04 …in its own pharmacy (switched to Wattle Grove)');
  await p.setViewportSize({ width: 320, height: 568 }); await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^All pharmacies/ }).click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '320×568 All pharmacies: no sideways scroll');
  await p.setViewportSize({ width: 390, height: 844 });
  await done(b, errors);
})();
