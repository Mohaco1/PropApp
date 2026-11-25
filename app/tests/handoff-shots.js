// The six phone screenshots Gemini asked for, after Sprint 1 and 2. Real taps, 390×844 at 2×.
const { phone, tap } = require('./helpers.js'); const path = require('path');
const OUT = path.resolve(__dirname, '../handoff');
(async () => { const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  const s = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(700); await s('1-today');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).click(); await p.waitForTimeout(200); await s('2-calendar');
  await tap(p, 'Staff'); await p.getByRole('button', { name: /Tom Nguyen/ }).click(); await tap(p, 'Annual check'); await p.waitForTimeout(200); await s('3-annual-check');
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.locator('label.choice', { hasText: /^Issue$/ }).click(); await p.waitForTimeout(200); await s('4-site-visit-issue');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).click(); await p.getByRole('button', { name: /Staged supply/ }).click(); await tap(p, 'Adopt for use here'); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(3300); await s('5-procedure-adopted');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.getByRole('button', { name: /^History/ }).click(); await p.waitForTimeout(200); await s('6-history');
  console.log('errors', errors); await b.close(); })();
