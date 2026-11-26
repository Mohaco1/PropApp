// PharmLedger brief (rebrand, quarter balancer, ease-of-use), by real taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh, saved, download, copied } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(require('os').tmpdir(), 'sigil-test'); fs.mkdirSync(TMP, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00', scale: 2, clip: true });
  // 1. Rebrand
  let t = await text(p);
  ok(await p.title() === 'PharmLedger' && /PharmLedger/.test(t) && /For the owner’s side of the counter\./.test(t) && !/R\.Pharmacy/.test(t), 'PharmLedger: title, wordmark and tagline on Welcome; no R.Pharmacy');
  await p.screenshot({ path: path.join(OUT, '30_sigil_welcome_390px.png') });
  const man = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../dist/pwa/manifest.webmanifest'), 'utf8'));
  ok(man.name === 'PharmLedger' && man.short_name === 'PharmLedger', 'PharmLedger: installable-app name and short name');
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  ok(await p.locator('header .mark svg.logo path').count() === 1 && await p.locator('.wm-mark svg').count() === 0, 'PharmLedger: the S-loop logo in the header');
  await p.screenshot({ path: path.join(OUT, '31_sigil_today_390px.png') });
  ok(Object.keys(await saved(p)).some(k => k === 'propapp:dir'), 'PharmLedger: storage keys unchanged (propapp:dir), so saved data carries over');
  // a backup made now restores, and keeps the PropApp format marker that older versions read
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  const bk = await download(p, 'Download a backup'); const j = JSON.parse(bk);
  ok(j.app === 'PropApp' && j.product === 'PharmLedger' && j.format === 1, 'PharmLedger: backups keep their format marker (app PropApp, format 1) and name the product PharmLedger');
  fs.writeFileSync(path.join(TMP, 'sigil.json'), bk);
  fs.copyFileSync(path.join(TMP, 'sigil.json'), path.join(TMP, 'sigil2.json'));
  for (const f of ['sigil.json', 'sigil2.json']) { await p.locator('input[type=file]').setInputFiles(path.join(TMP, f)); await p.waitForTimeout(800); }
  ok(/Checked: every count matches the backup file/.test(await text(p)), 'PharmLedger: a new backup restores with every count matching');
  // 2. Quarter Balancer: a pharmacy with every service
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'All Services Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  for (const l of await p.locator('form label.tick').all()) await l.click();
  await tap(p, 'Finish setup'); await p.waitForTimeout(500);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().click(); await tap(p, 'Year plan'); await p.waitForTimeout(300);
  const loads = async () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.qcol')].map(c => [c.querySelector('b').innerText, c.querySelectorAll('.qpill').length])));
    let L = await loads(), v = Object.values(L), n = v.reduce((a, x) => a + x, 0);
  ok(Object.keys(L).join() === 'Feb,May,Aug,Nov' && n >= 8 && Math.max(...v) - Math.min(...v) <= 1, 'Balancer: ' + n + ' service annual reviews spread evenly ' + JSON.stringify(L));
  ok(/Feb · \d+ services?/.test(await text(p)), 'Balancer: each quarter shows its load count');
  ok(await p.locator('.qcol[data-q="5"] .qpill', { hasText: /Home delivery|Residential aged care|Medicines reviews/ }).count() >= 2 && await p.locator('.qcol[data-q="11"] .qpill', { hasText: /cannabis|vaping|Needle/i }).count() === 3, 'Balancer: seasonal defaults (PPA supply programs in May; NSP, vaping and cannabis in Nov)');
  await p.locator('.qbal').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(OUT, '32_quarter_balancer_390px.png') });
  // drag and drop (desktop)
  const drag = p.locator('.qcol[data-q="5"] .qpill').first(), dn = await drag.locator('.qname').innerText();
  await drag.dragTo(p.locator('.qcol[data-q="8"]'), { sourcePosition: { x: 10, y: 10 } }); await p.waitForTimeout(250);
  ok(await p.locator('.qcol[data-q="8"] .qpill', { hasText: dn }).count() === 1, 'Balancer: drag-and-drop moves “' + dn + '” to Aug');
  // tap to move
  const first = p.locator('.qcol[data-q="2"] .qpill').first(), name = await first.locator('.qname').innerText(); await first.locator('.qmovebtn').tap(); await p.waitForTimeout(150);
  ok(await p.locator('.qbar').count() === 1, 'Balancer: each service has a visible Move button; tapping it shows a 1-tap Feb · May · Aug · Nov bar');
  await p.locator('.qbar .chip', { hasText: 'Nov' }).click(); await p.waitForTimeout(250);
  ok(await p.locator('.qcol[data-q="11"] .qpill', { hasText: name }).count() === 1, 'Balancer: tap-to-move puts “' + name + '” in Nov');
  let ph = await activePh(p); ok(Object.values(ph.quarters || {}).includes(11) && ph.history.some(l => /Quarter Balancer/.test(l.what)), 'Balancer: the move is saved and logged');
  // 3. Copy setup from another pharmacy (Wattle Grove → a new store)
  const wg = Object.values(await saved(p)).find(x => x?.name === 'Wattle Grove Pharmacy');
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Second Store Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  ok(/Copy setup from another pharmacy\?/.test(await text(p)), 'Clone: setup offers “Copy setup from another pharmacy?”');
  await p.locator('.chip', { hasText: 'Wattle Grove Pharmacy' }).click(); await p.waitForTimeout(150);
  const wgSvc = Object.entries(wg.services).filter(([, v]) => v.active).map(([k]) => k).sort();
  ok(JSON.stringify((await p.locator('input[name=svc]:checked').evaluateAll(xs => xs.map(x => x.value))).sort()) === JSON.stringify(wgSvc), 'Clone: choosing Wattle Grove ticks its services (' + wgSvc.join(', ') + ')');
  await tap(p, 'Finish setup'); await p.waitForTimeout(500);
  ph = await activePh(p);
  ok(ph.name === 'Second Store Pharmacy (fictional)' && wgSvc.every(k => ph.services[k]?.active && JSON.stringify(ph.services[k].answers) === JSON.stringify(wg.services[k].answers)), 'Clone: services and their setup answers are copied');
  ok(ph.procedures.length === wg.procedures.filter(x => wg.services[x.service]?.active).length && ph.procedures.every(x => x.status === 'draft' && x.versions.length === 1 && !/Wattle Grove/.test(x.versions[0].body)), 'Clone: procedures arrive as drafts to adopt here (never adopted for you), with this pharmacy’s name');
  ok(!ph.records.length && !ph.staff.length && !Object.keys(ph.actions).length && !Object.keys(ph.schedule || {}).length, 'Clone: records, staff, actions and S8 dates start empty');
  // 4. Ease of use, on Wattle Grove
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^Wattle Grove Pharmacy/ }).first().click(); await p.waitForTimeout(600);
  // Defer 3 days: only on overdue or due-today rows that aren't required by law
  const defers = await p.evaluate(() => [...document.querySelectorAll('.rowwrap')].map(w => ({ legal: /Required by law/.test(w.innerText), t: w.querySelector('.row-title')?.innerText })));
  ok(defers.length >= 1 && defers.every(x => !x.legal), 'Defer: “+3 days” only on rows not required by law (' + defers.map(x => x.t).join(', ') + ')');
  ok(await p.locator('.row', { hasText: 'S8 stock check' }).count() === 1 && await p.locator('.rowwrap', { hasText: 'S8 stock check' }).count() === 0, 'Defer: never on the S8 stock check (its s 111 limit stands)');
  const fridge = p.locator('.rowwrap', { hasText: 'Fridge min/max' }); const before3 = Object.values((await activePh(p)).actions).find(a => /Fridge min\/max/.test(a.title)).due;
  await fridge.locator('.defer').click(); await p.waitForTimeout(300);
  ph = await activePh(p); const fa = Object.values(ph.actions).find(a => /Fridge min\/max/.test(a.title));
  ok(fa.due === '2026-11-28' && fa.status === 'open' && fa.log.some(l => l.kind === 'deferred') && before3 < '2026-11-25', 'Defer: the overdue fridge action moves to 28 Nov, stays open, and the deferral is in its log');
  ok(!/Fridge min\/max[\s\S]{0,80}Overdue/.test(await text(p)), 'Defer: no overdue badge on it now');
  // Copy summary for the pharmacist on duty (Actions)
  await tap(p, 'Actions'); const cp = await copied(p, 'Copy summary for the pharmacist on duty');
  ok(/^Wattle Grove Pharmacy · open actions · 25 Nov/.test(cp.clip) && /- Fridge min\/max readings not recorded on two weekends · due 28 Nov/.test(cp.clip) && /No patient names or identifiers, please\.$/.test(cp.clip), 'Copy summary: open actions with due dates, de-identified reminder');
  // Inspector view
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).first().click(); await tap(p, 'Show on screen (read-only)'); await p.waitForTimeout(300);
  t = await text(p);
  ok(/Inspector view/.test(t) && /Read-only view/.test(t) && await p.locator('.nav').count() === 0 && await p.locator('main input, main .chip, main .btn.primary').count() === 0 && /Wattle Grove Pharmacy · evidence pack/.test(t), 'Inspector view: the pack on screen, read-only, with no edit controls or tab bar');
  await p.screenshot({ path: path.join(OUT, '33_inspector_view_390px.png') });
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  // Pre-fill from last time: shown, never selected
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click();
  await tap(p, 'Start review'); await p.waitForTimeout(200);
  const lt = await p.locator('.lasttime').count(), checked = await p.locator('input[name=ans]:checked').count();
  ok(checked === 0 && (lt === 0 || /Last time ·/i.test(await p.locator('.lasttime').innerText())), 'Pre-fill: last time’s answer is shown when there is one, and nothing is selected for you');
  // site visit summary: answer every check, then copy
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 20; i++) { if (await p.getByRole('button', { name: 'Save visit' }).count()) break; await p.locator('label.choice', { hasText: /^Satisfactory$/ }).first().click(); await p.waitForTimeout(40);
    if (await p.locator('input[name=vaccEvent]').count()) { await p.locator('label.choice', { hasText: /^No$/ }).first().click(); await p.locator('label.choice', { hasText: /^Yes$/ }).last().click(); await p.fill('input[name=vaccDate]', '2026-10-01'); await p.locator('input[name=vaccDate]').blur(); }
    if (await p.locator('label.choice', { hasText: 'Verified operational review' }).count()) await p.locator('label.choice', { hasText: 'Verified operational review' }).click();
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(60); }
  const vs = await copied(p, 'Copy summary for the pharmacist on duty');
  ok(/^Wattle Grove Pharmacy · site visit 25 Nov/.test(vs.clip) && /No issues found\.|To fix:/.test(vs.clip) && /other checks fine\./.test(vs.clip) && /No patient names or identifiers, please\.$/.test(vs.clip), 'Copy summary: the finished visit’s findings, de-identified');
  // Owner trial 26 Nov: a tick whose option name has a comma ("Creams, ointments and gels") stays ticked (real touch taps)
  { const s3 = await phone({ time: '2026-11-26T10:00:00+11:00' }); const q = s3.p; q.on('pageerror', e => errors.push(e.message));
    await tap(q, 'Set up your pharmacy'); await q.fill('input[name=name]', 'Tick Test Pharmacy (fictional)'); await tap(q, 'Continue'); await q.fill('input[name=owner0]', 'Sam Owner'); await tap(q, 'Continue');
    await q.locator('label.tick', { hasText: 'Simple compounding' }).first().tap(); await tap(q, 'Finish setup'); await q.waitForTimeout(400); await tap(q, 'Set up services'); await q.waitForTimeout(300);
    if (await q.getByRole('button', { name: /^Answer/ }).count()) { await q.getByRole('button', { name: /^Answer/ }).tap(); await q.locator('label.choice').nth(2).tap(); await tap(q, 'Save'); await q.waitForTimeout(200); }
    await q.getByRole('button', { name: /^Simple compounding/ }).first().tap(); await q.waitForTimeout(300);
    for (const x of ['Creams, ointments and gels', 'Capsules']) { await q.locator('main form label.tick', { hasText: x }).tap(); await q.waitForTimeout(400); }
    ok(await q.locator('main form label.tick', { hasText: 'Creams, ointments and gels' }).locator('input').isChecked() && await q.locator('main form label.tick', { hasText: 'Capsules' }).locator('input').isChecked(), 'Trial fix: “Creams, ointments and gels” stays ticked after a tap (commas in an option name)');
    await s3.b.close(); }
  await done(b, errors);
})();
