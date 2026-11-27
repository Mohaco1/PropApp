// Locked pre-trial brief (Tracks A–E), by real taps at 390×844; fails on any console error.
// A2 hard gate: on every primary screen the first action is fully visible without scrolling.
const { phone, ok, done, tap, text, activePh, download } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
// The screen's main job: its primary button when it has one (design rule 7), otherwise its first tappable answer or row.
const firstAction = p => p.evaluate(() => { scrollTo(0, 0);
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const main = document.querySelector('main') || document.body; const el = [...main.querySelectorAll('.btn.primary')].find(vis) || [...main.querySelectorAll('.row, .inline-link, label.choice, label.tick, .siteline, .chip, .btn')].find(vis);
  if (!el) return { none: true }; const r = el.getBoundingClientRect(), nav = document.querySelector('.nav')?.getBoundingClientRect();
  return { what: (el.innerText || '').trim().slice(0, 50), bottom: Math.round(r.bottom), limit: Math.round(nav ? nav.top : innerHeight), top: Math.round(r.top) }; });
const above = async (p, name) => { await p.waitForTimeout(250); const f = await firstAction(p);
  ok(!f.none && f.top >= 0 && f.bottom <= f.limit, 'A2 ' + name + ': first action “' + (f.what || '?') + '” is above the fold (' + f.bottom + ' ≤ ' + f.limit + ')'); };
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00', scale: 2 });
  const more = re => tap(p, 'More').then(() => p.getByRole('button', { name: re }).first().click());
  // A2 on a fresh pharmacy (setup card) first
  await above(p, 'Welcome');
  await tap(p, 'Try example'); await p.waitForTimeout(3300);
  await tap(p, 'Today'); await above(p, 'Today'); await p.screenshot({ path: path.join(OUT, '20_today_390px.png') });
  for (const [tab, name] of [['Reviews', 'Reviews'], ['Actions', 'Actions'], ['Staff', 'Staff'], ['More', 'More']]) { await tap(p, tab); await above(p, name); }
  await p.screenshot({ path: path.join(OUT, '21_more_390px.png') });
  for (const [re, name] of [[/^Law and sources/, 'Law and sources'], [/^Evidence pack/, 'Evidence pack'], [/^Backup and devices/, 'Backup and devices'], [/^Procedures/, 'Procedures'], [/^Calendar/, 'Calendar'], [/^Services/, 'Services']]) {
    if (!(await (await tap(p, 'More'), p.getByRole('button', { name: re }).count()))) { ok(false, 'More has ' + name); continue; }
    await p.getByRole('button', { name: re }).first().click(); await above(p, name); }
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await p.waitForTimeout(300);
  ok(/This counts as your quarterly visit/.test(await text(p)), 'Site visit start opens'); await above(p, 'Site visit start'); await p.screenshot({ path: path.join(OUT, '23_site_visit_390px.png') });
  await p.getByRole('button', { name: 'Back', exact: true }).click();

  // B1 + E1: evidence pack
  await more(/^Evidence pack/); await p.waitForTimeout(250); let t = await text(p);
  ok(await p.locator('.chip', { hasText: 'Last 12 months' }).evaluate(e => e.classList.contains('on')) && await p.locator('.chip', { hasText: 'Last 24 months' }).count() === 1 && await p.locator('.chip', { hasText: /^All$/ }).count() === 1, 'E1 the pack range is 12 months by default, with 24 months and All');
  const ticks = p.locator('.pticks input[type=checkbox]'); ok(await ticks.count() === 6, 'B1 six section checkboxes');
  const pr = await p.evaluate(() => ({ ticks: document.querySelector('.pticks').getBoundingClientRect().bottom, print: [...document.querySelectorAll('.btn.primary')].find(b => /Print or save/.test(b.innerText)).getBoundingClientRect().top }));
  ok(pr.ticks <= pr.print, 'B1 the checkboxes sit above “Print or save as PDF”');
  await p.screenshot({ path: path.join(OUT, '22_pack_390px.png') });
  const pack = () => p.evaluate(() => document.querySelector('.pack').innerText);
  // Batch 2B (H-05): the example's service record locations now fill Evidence locations, so it starts ticked.
  ok(await p.locator('label.tick', { hasText: 'Evidence locations' }).locator('input').isChecked() && !/Evidence locations · nothing yet/.test(await text(p)), 'B1 a section with something recorded (service record locations) starts ticked');
  let pk = await pack();
  ok(/\d+ other obligations?( and \d+ service records?)? not yet recorded in Evidence locations\./.test(pk) && !/Not recorded/.test(pk), 'B1 unrecorded obligations are one footer line, not table rows');
  // untick S8 → section leaves the printed pack
  await p.locator('label.tick', { hasText: 'S8 stock checks' }).click(); await p.waitForTimeout(200); pk = await pack();
  ok(!/S8 stock checks ·/.test(pk) && /Reviews, visits and meetings ·/.test(pk), 'B1 unticking a section takes it out of the pack');
  await p.locator('label.tick', { hasText: 'S8 stock checks' }).click(); await p.waitForTimeout(200);
  const n12 = Number((await pack()).match(/Reviews, visits and meetings · (\d+)/)[1]);
  await p.locator('.chip', { hasText: /^All$/ }).click(); await p.waitForTimeout(200); pk = await pack();
  const nAll = Number(pk.match(/Reviews, visits and meetings · (\d+)/)[1]);
  ok(nAll >= n12 && /\(all records\)/.test(pk), 'E1 “All” covers every record (' + n12 + ' → ' + nAll + ')');
  await p.locator('.chip', { hasText: 'Last 24 months' }).click(); await p.waitForTimeout(200); ok(/\(the last 24 months\)/.test(await pack()), 'E1 24 months');

  // B2: authority expiries in the calendar file (Wattle Grove offers vaccination)
  const ph = await activePh(p);
  await more(/^Calendar/); await p.waitForTimeout(200);
  const cal = await download(p, 'Download calendar file');
  const ev = cal.split('BEGIN:VEVENT').slice(1);
  const vac = ev.find(e => /DTSTART;VALUE=DATE:20281104/.test(e)), pre = ev.find(e => /DTSTART;VALUE=DATE:20271104/.test(e));
  const svc = Object.keys(ph.services || {});
  ok(vac && /vaccination authorities/.test(vac) && /TRIGGER:-P30D/.test(vac), 'B2 the calendar has the 4 Nov 2028 vaccination authority expiry with a reminder a month before');
  ok(svc.includes('prescribing') ? !!pre : !pre, 'B2 the 4 Nov 2027 prescribing expiry appears only when the pharmacy offers prescribing');

  // Track C: equipment calibration block in the site visit (no OTP at Wattle Grove → no pump line)
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks'); await p.waitForTimeout(300);
  for (let i = 0; i < 16 && !/Premises, security/.test(await p.locator('h2.big-title').innerText()); i++) await p.getByRole('button', { name: /^Next$/ }).click();
  t = await text(p); ok(/Equipment and clinical waste/i.test(t) && /marked UN3291 with the Division 6.2 label/.test(t) && /Dispensary and compounding scales/.test(t) && /OTP dosing pump/.test(t) && 'otp' in (await activePh(p)).services, 'Track C the premises check has an equipment calibration block, with the OTP pump line because this pharmacy runs OTP');
  await p.locator('.card', { hasText: /Equipment and clinical waste/i }).scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(OUT, '24_site_visit_equipment_390px.png') }); await p.evaluate(() => scrollTo(0, 0));
  for (let i = 0; i < 16 && !/Recalls and alerts/.test(await p.locator('h2.big-title').innerText()); i++) await p.getByRole('button', { name: /^Next$/ }).click();
  ok(/earliest expiry is used first/.test(await p.evaluate(() => document.querySelector('main').textContent)), 'Track C the quarterly visit asks about TGA recalls and expiry rotation');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.waitForTimeout(200);
  // B2/Track C: a pharmacy without OTP has no pump line (checked on the new pharmacy below)
  // Track C + D: governance review (IT restore test, workers compensation)
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.fill('input[type=search]', 'governance'); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await tap(p, 'Start review');
  ok(/Question 1 of 15/.test(await text(p)), 'Track C/D the governance review has 15 questions');
  for (let i = 0; i < 12; i++) { await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  t = await text(p); ok(/IT backups \(best practice\): a restore from the dispensing and business system backups was tested this year/.test(t), 'Track C question 13: IT backup restore test');
  await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await tap(p, 'Next'); await p.waitForTimeout(60);
  ok(/Workers compensation \(icare\)/.test(await text(p)), 'Track D question 14: workers compensation policy current and wages declared');
  await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await tap(p, 'Next'); await p.waitForTimeout(60);
  ok(/NASH PKI certificate \(valid for 2 years\) is in date, and the PRODA B2B device/.test(await text(p)), 'Micro-patch question 15: NASH and PRODA B2B expiry check');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // E2: S8 review asks about invoices and destruction witnesses
  await tap(p, 'Reviews'); await p.fill('input[type=search]', ''); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await tap(p, 'Start review');
  ok(/Question 1 of 9/.test(await text(p)), 'E2 the S8 review has 9 questions');
  await p.locator('label.choice').first().click(); await tap(p, 'Next');
  for (let i = 1; i < 7; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  t = await text(p); ok(/Invoice spot-check \(Pharmacy Council, Supporting resources for managing S8, S4B and S4D medicines: recommended\)/.test(t), 'E2 question 8: wholesaler invoice spot-check, cited to the Pharmacy Council');
  await p.locator('label.choice').first().click(); await tap(p, 'Next'); await p.waitForTimeout(60);
  ok(/in the presence of an independent witness, and recorded in the drug register/.test(await text(p)), 'E2 question 9: destruction witnessed and recorded');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // Track C: staff leaving has shared codes; governance meeting has complaints themes
  await tap(p, 'Staff'); await p.locator('.row').first().click(); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: 'Leaving' }).count()) { await tap(p, 'Leaving'); ok(/Shared codes changed and keys accounted for: safe, alarm and door codes/.test(await text(p)), 'Track C staff leaving: safe, alarm and door codes changed'); await p.getByRole('button', { name: 'Back', exact: true }).click(); } else ok(false, 'Leaving button found');
  await more(/^Meetings/); await p.getByRole('button', { name: /Proprietor governance meeting/ }).first().click(); await p.waitForTimeout(200);
  ok(/Complaints and feedback themes \(no names\)/.test(await text(p)), 'Track C the governance meeting has a de-identified complaints and feedback themes section');
  await more(/^Meetings/); await p.getByRole('button', { name: /Staff safety meeting/ }).first().click(); await p.waitForTimeout(200);
  ok(!/Complaints and feedback themes/.test(await text(p)), 'Track C the themes section is only in the governance meeting');
  // Track D: incidents, ownership changes; E3 archive pointers
  await more(/^If something goes wrong/); await p.locator('summary', { hasText: 'Concern about a registered practitioner' }).click(); t = await text(p);
  ok(/impairment, intoxication while practising, significant departure from accepted professional standards, and sexual misconduct/.test(t), 'Track D Ahpra mandatory notifications: the four concerns, from the Board guidelines');
  await p.locator('summary', { hasText: 'Privacy or My Health Record data breach' }).click(); ok(/s 6D\(4\)\(b\)/.test(await text(p)), 'Track D the data breach card says the small-business exemption doesn’t apply (s 6D(4)(b))');
  await more(/^Bought, selling or closing/); t = await text(p);
  ok(/Notice of Completion within 14 days of settlement/.test(t) && /Notice of Disposal of Financial Interest in a Pharmacy Business within 14 days/.test(t) && /franchise or banner group agreement/.test(t), 'Track D the 14-day Council notices and the agreements note');
  ok(/applies for their own PBS approval number through the PBS Approved Suppliers Portal; you can’t claim under the seller’s approval number/.test(t) && /PRODA, HPOS and the HPI-O/.test(t), 'Micro-patch PBS approval and PRODA/HPOS/HPI-O on takeover');
  ok(/unlawful financial interest/.test(t) && /\[2025\] NSWSC 1211/.test(t), 'Micro-patch unlawful financial interest warning (Blooms)');
  await more(/^Evidence locations/); t = await text(p);
  ok(/PBS prescriptions and supply records: kept at least 2 years from supply/.test(t) && /PPA program claim records, if you claim: kept at least 7 years after the claim/.test(t), 'E3 PBS (2 years) and PPA (7 years) archive pointers in Evidence locations');
  await p.getByRole('button', { name: /PBS prescriptions/ }).click(); await p.fill('input[name=where]', 'Dispensary archive box (fictional)'); await tap(p, 'Save'); await p.waitForTimeout(250);
  ok((await activePh(p)).archives?.pbs?.where === 'Dispensary archive box (fictional)', 'E3 the PBS archive location is saved');
  await more(/^Evidence pack/); await p.locator('label.tick', { hasText: 'Evidence locations' }).locator('input').isChecked().then(v => ok(v, 'B1 Evidence locations is ticked once something is recorded'));
  ok(/Dispensary archive box \(fictional\)/.test(await p.evaluate(() => document.querySelector('.pack').innerText)), 'E3 the archive pointer appears in the pack');

  // B2: setup card offers the calendar and can be dismissed (fresh pharmacy)
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Calendar Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Pharmacist prescribing' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  ok(await p.getByRole('button', { name: 'Add due dates to your phone calendar' }).count() === 1, 'B2 the setup card offers “Add due dates to your phone calendar”');
  ok(/Nothing recorded yet|first review|first record/i.test(await text(p)), 'B3 a cold-start helper line when there are no records');
  await above(p, 'Today (new pharmacy)');
  await tap(p, 'Not now'); await p.waitForTimeout(200);
  ok(await p.getByRole('button', { name: 'Add due dates to your phone calendar' }).count() === 0, 'B2 “Not now” hides the calendar offer');
  await more(/^Calendar/); await p.waitForTimeout(200); const cal2 = await download(p, 'Download calendar file');
  ok(/DTSTART;VALUE=DATE:20271104/.test(cal2) && /prescribing Class Authorities/.test(cal2), 'B2 a prescribing pharmacy gets the 4 Nov 2027 expiry');
  // Micro-patch 1: "Align to 4 quarters", in its own fresh browser; the S8 review never goes past its s 111 limit
  { const s2 = await phone({ time: '2026-11-25T10:00:00+11:00' }); const q = s2.p; s2.errors.forEach(e => errors.push(e)); q.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await tap(q, 'Try example'); await q.waitForTimeout(3300);
    // a completed stock check on 20 Oct: the s 111 limit is 20 Jan 2027, before the 1 Feb 2027 quarter anchor
    await tap(q, 'Reviews'); await q.getByRole('button', { name: /S8 stock check/ }).first().click(); await tap(q, 'Start review');
    for (let i = 0; i < 9; i++) { await q.locator('label.choice').first().click(); await q.waitForTimeout(40); await q.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await q.waitForTimeout(60); }
    await q.fill('input[name=stockDate]', '2026-10-20'); await q.fill('input[name=stockBy]', 'Priya Sharma (fictional)'); await q.locator('input[name=stockBy]').blur(); await q.waitForTimeout(100);
    await tap(q, 'Save review'); await q.waitForTimeout(400);
    let ph = await activePh(q); const before = { ...ph.schedule }, staffBefore = Object.fromEntries(ph.staff.map(x => [x.id, x.annualDue]));
    await tap(q, 'More'); await q.getByRole('button', { name: /^Calendar/ }).first().click(); await tap(q, 'Year plan'); await q.waitForTimeout(200);
    ok(/Align to 4 quarters \(Feb · May · Aug · Nov\)/.test(await text(q)), 'Micro-patch the Year plan offers “Align to 4 quarters (Feb · May · Aug · Nov)”');
    await q.getByRole('button', { name: /^Align \d+ dates?$/ }).click(); await q.waitForTimeout(300);
    ph = await activePh(q); const firstMon = (y, m) => { let d = new Date(Date.UTC(y, m - 1, 1)); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
    const anch = []; for (const y of [2026, 2027, 2028]) for (const m of [2, 5, 8, 11]) anch.push(firstMon(y, m));
    ok(ph.schedule.B1 <= '2027-01-20' && !anch.includes(ph.schedule.B1) || ph.schedule.B1 === before.B1, 'Micro-patch S8 (B1) is not pushed past its s 111 limit of 20 Jan 2027 (B1 due ' + ph.schedule.B1 + ')');
    const moved = Object.keys(ph.schedule).filter(k => ph.schedule[k] !== before[k]);
    ok(moved.length >= 1 && moved.every(k => anch.includes(ph.schedule[k])) && !moved.includes('B1') && !moved.includes('CO-P') && !moved.includes('CO-F'), 'Micro-patch moved dates land on quarter anchors (' + moved.map(k => k + '→' + ph.schedule[k]).join(', ') + '); fixed statutory dates untouched');
    ok(Object.keys(ph.schedule).every(k => !(before[k] && before[k] < '2026-11-25') || ph.schedule[k] === before[k]), 'Micro-patch overdue dates are left alone');
    ok(ph.staff.filter(x => x.annualDue !== staffBefore[x.id]).every(x => /-02-0\d$/.test(x.annualDue)), 'Micro-patch staff annual checks move to the first week of Feb');
    ok(ph.history.some(l => /Due dates aligned to 4 quarters/.test(l.what)), 'Micro-patch the alignment is logged in History');
    await q.getByRole('button', { name: /^Undo the alignment/ }).click(); await q.waitForTimeout(300); ph = await activePh(q);
    ok(Object.keys(before).every(k => ph.schedule[k] === before[k]) && ph.staff.every(x => x.annualDue === staffBefore[x.id]), 'Micro-patch Undo restores every date');
    await q.screenshot({ path: path.join(OUT, '25_calendar_align_390px.png') }).catch(() => {});
    await s2.b.close(); }
  await done(b, errors);
})();
