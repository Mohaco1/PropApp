// Audit Wave 2 (R07, R09, R10, R11, R12, F-V3-01 to F-V3-06), by real taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff');
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00', scale: 2 });
  await tap(p, 'Try example'); await p.waitForTimeout(3300);
  // R12: the UAT button is in the header bar, 44 px, and never over a row
  const u = await p.evaluate(() => { const b = document.querySelector('#uat-btn'), r = b.getBoundingClientRect(); const rows = [...document.querySelectorAll('.row')].map(x => x.getBoundingClientRect()); return { inBar: b.parentElement.classList.contains('bar'), w: r.width, h: r.height, overlap: rows.some(x => !(x.bottom <= r.top || x.top >= r.bottom || x.right <= r.left || x.left >= r.right)) }; });
  ok(u.inBar && u.w >= 44 && u.h >= 44 && !u.overlap, 'R12 UAT notes is a 44 px button in the header bar, clear of every row');
  await p.screenshot({ path: path.join(OUT, '01_today_390px.png') });
  // R09: an issue typed in a review survives a reload without leaving the box
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click();
  ok(await p.evaluate(() => document.activeElement?.classList.contains('bar-title')), 'R09 opening a screen puts focus on its heading'); await tap(p, 'Start review');
  await p.locator('label.choice', { hasText: /^Completed with issues$/ }).click(); await p.waitForTimeout(150);
  await p.locator('textarea[name=issue]').click(); await p.keyboard.type('Two ampoules short, recount booked (fictional)'); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(900); await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await p.waitForTimeout(300);
  if (await p.getByRole('button', { name: /^(Carry on|Resume|Continue)/ }).count()) await p.getByRole('button', { name: /^(Carry on|Resume|Continue)/ }).first().click();
  await p.waitForTimeout(300);
  ok(await p.locator('textarea[name=issue]').inputValue().catch(() => '') === 'Two ampoules short, recount booked (fictional)', 'R09 text typed into a review is kept through a reload, without leaving the box');
  // R09: Back returns focus to the row that opened the screen
  await tap(p, 'Actions'); const row = p.getByRole('button', { name: /fire extinguisher/ }); await row.click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => /fire extinguisher/.test(document.activeElement?.innerText || '')), 'R09 Back puts focus on the row you came from');
  // R10: calendar file folded at 75 bytes, ends CRLF, an action keeps its UID when its date changes
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().click(); await p.waitForTimeout(200);
  const dl = async () => { const [d] = await Promise.all([p.waitForEvent('download'), tap(p, 'Download calendar file')]); return fs.readFileSync(await d.path(), 'utf8'); };
  const ics1 = await dl(); const ph = await activePh(p); const act = Object.values(ph.actions).find(a => a.status === 'open' && a.due && /extinguisher/.test(a.title));
  const uidOf = s => (s.replace(/\r\n /g, '').match(new RegExp('UID:[^\\r]*' + act.id + '[^\\r]*')) || [])[0];
  await tap(p, 'Actions'); await p.getByRole('button', { name: /fire extinguisher/ }).click(); await p.getByRole('button', { name: 'Edit' }).click(); await p.fill('input[name=due]', '2027-01-15'); await tap(p, 'Save'); await p.waitForTimeout(300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().click(); await p.waitForTimeout(200); const ics2 = await dl();
  ok(uidOf(ics1) && uidOf(ics1) === uidOf(ics2) && /DTSTART;VALUE=DATE:20270115/.test(ics2.replace(/\r\n /g, '')), 'R10 moving an action’s due date keeps its calendar UID (the event moves, no duplicate)');
  ok(ics2.endsWith('\r\n') && ics2.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75), 'R10 every line ≤ 75 bytes; file ends with CRLF');
  // F-V3-02/03/04 evidence pack
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).click(); await p.waitForTimeout(300); const t = await text(p);
  ok(/From \d{1,2} \w{3} 2025 to 25 Nov 2026 \(the last 12 months\) · made 25 Nov 2026/.test(t), 'F-V3-04 the pack’s period and made-on dates carry the year');
  ok(/Proprietor oversight record only: statutory S8 registers, dispensing records and cold-chain logs stay in their primary pharmacy systems\./.test(t) && /law and practice updates read: \d+ of \d+/.test(t), 'F-V3-04 inspector framing line and updates-read count');
  const pk = await p.evaluate(() => { const secs = [...document.querySelectorAll('.psec')]; const closed = secs.find(s => /^Actions closed/.test(s.querySelector('h2').innerText)), staff = secs.find(s => /^Staff checks closed/.test(s.querySelector('h2').innerText));
    const heads = [...closed.querySelectorAll('th')].map(x => x.innerText), byIdx = heads.indexOf('By'), rows = [...closed.querySelectorAll('tbody tr')];
    return { heads, emptyBy: byIdx < 0 ? 0 : rows.filter(r => !r.cells[byIdx].innerText.trim()).length, staffRows: staff ? staff.querySelectorAll('tbody tr').length : 0, staffInClosed: rows.filter(r => /· (Ben Carter|Tom Nguyen|Priya|Alex)/.test(r.innerText) && /^Review /.test(r.innerText)).length }; });
  ok(pk.emptyBy === 0, 'F-V3-02 “By” is filled for every closed action (or the column is left out): ' + pk.heads.join(', '));
  ok(pk.staffRows > 0 && pk.staffInClosed === 0, 'F-V3-03 routine staff checks are one line per person (' + pk.staffRows + '), not mixed into Actions closed');
  await p.screenshot({ path: path.join(OUT, '10_evidence_pack_390px.png') });
  // F-V3-01: every external link on the incident and source screens has rel="noopener noreferrer"
  await tap(p, 'More'); await p.getByRole('button', { name: /^If something goes wrong/ }).click();
  ok(await p.evaluate(() => [...document.querySelectorAll('main a[href^="https://"]')].every(a => a.target === '_blank' && /noopener/.test(a.rel) && /noreferrer/.test(a.rel))), 'F-V3-01 incident links open in a new tab with noopener noreferrer');
  // R07: with two pharmacies, edit screens name the pharmacy
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Second Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam'); await tap(p, 'Continue'); await p.locator('label.tick', { hasText: 'Home delivery' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action' }).click();
  ok(await p.locator('.bar .ph-sub').innerText() === 'Second Test Pharmacy (fictional)', 'R07 New action names the pharmacy when there are two');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click();
  ok(await p.locator('.bar .ph-sub').innerText() === 'Second Test Pharmacy (fictional)', 'R07 the S8 review names the pharmacy');
  await done(b, errors);
})();
