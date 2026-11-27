// Stage 3B (final main polish), by real taps and real key presses on the example pharmacy; fails on any console error.
// 1. On the Galaxy Z Fold cover screen (344 px), a long pharmacy name in the header is cut with "…": the page never
//    gets wider than the screen.
// 2. Keyboard: Restore backup (welcome) and Choose a backup file (Backup and devices) are reached with Tab; a chip
//    whose radio has keyboard focus shows a focus ring; the Adopt sheet takes focus, keeps Tab inside, closes on Escape
//    and gives focus back to Adopt; its backdrop is not a second "Cancel" button.
// 3. Evidence locations and the Evidence pack never show a raw key name (cannabis, vaping, NSP), and no screen, the
//    lead question or a drafted procedure says "pharmacist in charge".
const { phone, ok, done, tap, text, saved, activePh } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const TIME = '2026-11-27T10:00:00+11:00';
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph);
  await p.evaluate(async ({ K, ph }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, K); tx.oncomplete = res; }); }, { K, ph });
  await p.reload(); await p.waitForTimeout(900); };
const tabTo = async (p, test, max = 40) => { for (let i = 0; i < max; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(test)) return i + 1; } return 0; };
const focusRing = p => p.evaluate(() => { const l = document.activeElement?.closest('label'); if (!l) return ''; const s = getComputedStyle(l); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 ? s.outlineWidth : ''; });

(async () => {
  // ── 1. Z Fold cover screen, 344 × 882, with a very long pharmacy name.
  const errors = [];
  {
    const { b, p, errors: e } = await phone({ time: TIME, viewport: { width: 344, height: 882 }, scale: 2 }); e.forEach(x => errors.push(x)); p.on('pageerror', x => errors.push(x.message));
    await tap(p, 'Try example'); await p.waitForTimeout(3400);
    const LONG = 'Wattle Grove Community Pharmacy and Compounding Centre of Greater Western Sydney (fictional)';
    await patch(p, ph => { ph.name = LONG; });
    const wide = [];
    for (const t of ['Today', 'Reviews', 'Actions', 'Staff', 'More']) { await tap(p, t); await p.waitForTimeout(250);
      const m = await p.evaluate(() => { const s = document.querySelector('button.ph-switch.single'); const r = s?.getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, sw2: s ? s.scrollWidth : 0, right: r ? Math.round(r.right) : 0, of: s ? getComputedStyle(s).overflow + '/' + getComputedStyle(s).textOverflow : '', has: !!s }; });
      if (m.sw > 344 || m.bw > 344 || (m.has && m.right > 344)) wide.push(t + ' ' + JSON.stringify(m));
      if (t === 'Today') { ok(m.has, '1. Today shows the pharmacy name as the header switch'); ok(m.of === 'hidden/ellipsis', '1. the name is cut with an ellipsis (overflow ' + m.of + ')'); ok(m.sw2 > 0 && m.right <= 344, '1. the switch ends inside the 344 px screen (right edge ' + m.right + ')');
        const hb = await p.locator('button.ph-switch.single').boundingBox(); ok(hb && hb.height >= 44, '1. the switch is still a 44 px tap target (' + Math.round(hb?.height || 0) + ')');
        await p.screenshot({ path: path.join(SHOTS, 'stage3b_fold_cover_long_name_344px.png') }); }
    }
    ok(!wide.length, '1. no tab is wider than 344 px with the long name' + (wide.length ? ': ' + wide.join(' | ') : ''));
    const vp = await p.evaluate(() => document.querySelector('meta[name=viewport]')?.content || '');
    ok(/width=device-width/.test(vp), '1. the viewport stays device-width (no zoom-out): ' + vp);
    await b.close();
  }

  const { b, p, errors: e2 } = await phone({ time: TIME }); e2.forEach(x => errors.push(x)); p.on('pageerror', x => errors.push(x.message));
  // ── 2a. Welcome: Tab reaches the Restore backup file chooser.
  const n1 = await tabTo(p, () => document.activeElement?.matches('input[type=file][data-change=restore]'));
  ok(n1 > 0, '2. on the welcome screen, Tab reaches “Restore backup” (' + n1 + ' Tab presses)');
  ok(await p.evaluate(() => document.activeElement?.closest('label')?.innerText.trim()) === 'Restore backup', '2. the focused file chooser is the “Restore backup” link');
  ok(!!(await focusRing(p)), '2. “Restore backup” shows a focus ring when reached by keyboard');
  ok(await p.evaluate(() => !document.querySelector('input[type=file][hidden]')), '2. no backup file input is hidden from the keyboard');
  const rb = await p.locator('label.linkbtn', { hasText: 'Restore backup' }).boundingBox(); ok(rb && rb.height >= 44, '2. “Restore backup” is still 44 px tall (' + Math.round(rb?.height || 0) + ')');
  await p.screenshot({ path: path.join(SHOTS, 'stage3b_welcome_restore_focus_390px.png') });

  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  // ── 2b. Backup and devices: Tab reaches Choose a backup file.
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).tap(); await p.waitForTimeout(300);
  const n2 = await tabTo(p, () => document.activeElement?.matches('input[type=file][data-change=restore]'), 60);
  ok(n2 > 0 && /Choose a backup file/.test(await p.evaluate(() => document.activeElement?.closest('label')?.innerText || '')), '2. on Backup and devices, Tab reaches “Choose a backup file” (' + n2 + ' presses)');
  ok(!!(await focusRing(p)), '2. “Choose a backup file” shows a focus ring');
  await p.screenshot({ path: path.join(SHOTS, 'stage3b_backup_choose_focus_390px.png') });

  // ── 2c. Chip focus ring: Actions → an open action → Waiting on someone → Check back chips by keyboard.
  await tap(p, 'Actions'); await p.waitForTimeout(250);
  await p.locator('.list .row').first().tap(); await p.waitForTimeout(300);
  const waitBtn = p.getByRole('button', { name: /^(Waiting on someone|Still waiting · new date)$/ }).first();
  if (await waitBtn.count()) { await waitBtn.tap(); await p.waitForTimeout(300);
    await p.locator('textarea[name=asked]').tap(); await p.keyboard.type('Asked the landlord for a quote (fictional)');
    const n3 = await tabTo(p, () => document.activeElement?.matches('.chip input'), 10);
    ok(n3 > 0, '2. Tab reaches the Check back chips (' + n3 + ' presses)');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
    ok(!!(await focusRing(p)), '2. the focused chip shows a focus ring (' + (await focusRing(p)) + ')');
    await p.screenshot({ path: path.join(SHOTS, 'stage3b_chip_focus_390px.png') });
    await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(250);
  } else ok(false, '2. an open action offers “Waiting on someone” for the chip check');

  // ── 2d. Adopt sheet: focus moves in, Tab stays in, Escape closes, focus returns to Adopt.
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.waitForTimeout(250);
  let adoptable = null;
  for (const name of ['Home delivery', 'Staged supply', 'Dose administration aids']) { const r0 = p.locator('.list .row', { hasText: name }).first(); if (!(await r0.count())) continue; await r0.tap(); await p.waitForTimeout(250);
    for (let k = 0; k < 12; k++) { const r = p.locator('.sec', { hasText: /To confirm/i }).locator('.row').first(); if (!(await r.count())) break; await r.tap(); await p.waitForTimeout(250);
      if (await p.getByRole('button', { name: 'I’ve checked it — remove this marker' }).count()) await tap(p, 'I’ve checked it — remove this marker'); else { await p.keyboard.type('Fictional pharmacy steps written by the owner.'); await tap(p, 'Save as new version'); } await p.waitForTimeout(300); }
    const ad = p.getByRole('button', { name: 'Adopt for use here' }); if (await ad.count() && await ad.isEnabled()) { adoptable = name; break; }
    await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200); }
  ok(!!adoptable, '2. a procedure is ready to adopt (' + adoptable + ')');
  // Keyboard open: focus the Adopt button and press Enter.
  await p.getByRole('button', { name: 'Adopt for use here' }).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok(await p.locator('.sheet').count() === 1, '2. Enter on Adopt opens the sheet');
  ok(await p.evaluate(() => !!document.activeElement?.closest('.sheet')), '2. focus moves into the sheet when it opens (' + (await p.evaluate(() => document.activeElement?.innerText)) + ')');
  ok(await p.getByRole('button', { name: 'Cancel', exact: true }).count() === 1, '2. the sheet has exactly one “Cancel” button for screen readers (the backdrop is not a second one)');
  let inside = true; for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement?.closest('.sheet')))) inside = false; }
  for (let i = 0; i < 3; i++) { await p.keyboard.press('Shift+Tab'); if (!(await p.evaluate(() => !!document.activeElement?.closest('.sheet')))) inside = false; }
  ok(inside, '2. Tab and Shift+Tab stay inside the sheet');
  await p.screenshot({ path: path.join(SHOTS, 'stage3b_adopt_sheet_focus_390px.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.locator('.sheet').count() === 0, '2. Escape closes the sheet');
  ok(await p.evaluate(() => document.activeElement?.dataset?.act) === 'adopt', '2. after Escape, focus is back on “Adopt for use here”');
  ok((await activePh(p)).procedures.every(x => x.service !== { 'Home delivery': 'delivery', 'Staged supply': 'staged', 'Dose administration aids': 'daa' }[adoptable] || x.status !== 'adopted'), '2. Escape adopts nothing');
  await p.waitForTimeout(900); await tap(p, 'Adopt for use here'); await p.waitForTimeout(300); await tap(p, 'Cancel'); await p.waitForTimeout(300);
  ok(await p.locator('.sheet').count() === 0 && await p.evaluate(() => document.activeElement?.dataset?.act) === 'adopt', '2. Cancel closes the sheet and gives focus back to Adopt');
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(300); await p.mouse.click(195, 120); await p.waitForTimeout(300);
  ok(await p.locator('.sheet').count() === 0, '2. tapping the backdrop still closes the sheet');

  // ── 3. Evidence locations and the pack: no raw key names, and cannabis, vaping and NSP rows only where they ask.
  await patch(p, ph => { for (const id of ['cannabis', 'vaping', 'nsp']) ph.services[id] = { ...(ph.services[id] || { answers: {} }), active: true, setup: 'done', answers: { ...(ph.services[id]?.answers || {}) } }; });
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence locations/ }).first().tap(); await p.waitForTimeout(300);
  const titles = await p.locator('.list .row .row-title').allInnerTexts();
  const rawRows = titles.filter(t => /^[a-z][A-Za-z]+$/.test(t.trim()));
  ok(!rawRows.length, '3. Evidence locations shows no raw key names' + (rawRows.length ? ': ' + rawRows.join(', ') : '') + ' (' + titles.length + ' rows)');
  const subs = await p.locator('.list .row .row-sub').allInnerTexts();
  for (const n of ['Medicinal cannabis', 'Vaping', 'Needle and syringe']) { const i = subs.findIndex(s => s.startsWith(n)); ok(i < 0 || !/^[a-z]/.test(titles[i]), '3. ' + n + ' has no raw-key evidence row'); }
  await p.screenshot({ path: path.join(SHOTS, 'stage3b_evidence_locations_390px.png') });
  await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Evidence pack/ }).first().tap(); await p.waitForTimeout(500);
  const pack = await text(p);
  ok(!/· (scopeEvidence|records|safety|thc)\b/.test(pack), '3. the Evidence pack shows no raw key names');
  ok(!/pharmacist in charge/i.test(pack), '3. the Evidence pack never says “pharmacist in charge”');
  await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200);

  // ── 3b. The lead question offers "The pharmacist on duty" and saves it as "Pharmacist on duty" (never "in charge").
  await patch(p, ph => { delete ph.lead; });
  await tap(p, 'More'); await p.getByRole('button', { name: /^Services/ }).first().tap(); await p.waitForTimeout(250);
  await p.locator('[data-to="lead"]').first().tap(); await p.waitForTimeout(300);
  const lt = await text(p);
  ok(/Who runs your services day to day/.test(lt) && !/pharmacist in charge/i.test(lt) && /The pharmacist on duty/.test(lt), '3. the lead question says “The pharmacist on duty”, never “pharmacist in charge”');
  await p.locator('label', { hasText: 'The pharmacist on duty' }).first().tap(); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(SHOTS, 'stage3b_lead_question_390px.png') });
  await tap(p, 'Save'); await p.waitForTimeout(400);
  ok((await activePh(p)).lead === 'Pharmacist on duty', '3. saving stores “Pharmacist on duty” (' + (await activePh(p)).lead + ')');

  // ── 3c. Drafted procedures and setup summaries never say "pharmacist in charge"; neither do the shown laws or reviews.
  await patch(p, ph => { ph.lead = 'Pharmacist in charge'; });
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.waitForTimeout(250);
  const procRows = await p.locator('.list .row').count(); const leaks = [];
  for (let i = 0; i < procRows; i++) { const r = p.locator('.list .row').nth(i); const nm = (await r.innerText()).split('\n')[0]; await r.tap(); await p.waitForTimeout(250);
    if (await p.getByRole('button', { name: /^(Draft it|Save draft|Draft this procedure)/ }).count()) { await p.getByRole('button', { name: /^(Draft it|Save draft|Draft this procedure)/ }).first().tap(); await p.waitForTimeout(300); }
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
    if (/pharmacist in charge/i.test(await text(p))) leaks.push(nm);
    await p.getByRole('button', { name: 'Back', exact: true }).first().tap(); await p.waitForTimeout(200); }
  ok(procRows > 0 && !leaks.length, '3. none of the ' + procRows + ' procedures says “pharmacist in charge”' + (leaks.length ? ': ' + leaks.join(', ') : ''));
  ok(!/pharmacist in charge/i.test(JSON.stringify((await activePh(p)).procedures || [])), '3. no saved procedure text says “pharmacist in charge”');
  const law = require('../src/content/law.json'), rv = require('../src/content/reviews.json');
  const dn = x => JSON.stringify(x).match(/Displayed names \(Council Guide Note 24\)[^"]*/g) || [];
  ok(dn(law).length === 1 && dn(rv).length === 1 && [...dn(law), ...dn(rv)].every(t => /name of the pharmacist on duty next to the dispensing area/.test(t) && !/in charge/.test(t)), '3. the displayed-names rule (law and site visit) says “the pharmacist on duty”');

  ok(true, 'screens saved to app/handoff/stage3b_*.png');
  await done(b, errors);
})();
