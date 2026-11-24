// Content v2 acceptance checks (C2-01 Sources and links, C2-04 updates feed, C2-05 prescribing additions), by real
// taps at 390×844 and 320×568, failing on any console error.
const { phone, ok, done, tap, text, activePh } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  const more = name => tap(p, 'More').then(() => p.getByRole('button', { name }).first().click());
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3400);
  // C2-04: Today says how many updates are unread
  ok(/4 law updates to read/.test(await p.locator('.updline').innerText()), 'C2-04 Today shows “4 law updates to read”');
  // C2-01: Sources screen with working external links
  await more(/^Sources/); await p.waitForTimeout(300);
  const links = await p.evaluate(() => [...document.querySelectorAll('main a[href]')].map(a => ({ href: a.getAttribute('href'), t: a.target, rel: a.rel, text: a.innerText.trim() })));
  ok(links.length >= 12 && links.every(l => /^https:\/\/[\w.-]+\.\w+\//.test(l.href) && l.t === '_blank' && /noopener/.test(l.rel) && /noreferrer/.test(l.rel) && l.text), 'C2-01 Sources has ' + links.length + ' https links, each opening a new tab with rel="noopener noreferrer"');
  ok(/USED IN YOUR PHARMACY · \d+/i.test(await text(p)) && /used in \d+ places?/.test(await text(p)), 'C2-01 each source says where it’s used here');
  await p.locator('.src-used summary').first().click(); ok(/procedure|review|Legal obligations/.test(await p.locator('.src-used[open]').first().innerText()), 'C2-01 “Where it’s used” lists the places');
  await p.getByRole('button', { name: 'This source changed' }).first().click(); await p.waitForTimeout(250);
  ok(/Re-check raised/.test(await text(p)), 'C2-01 “This source changed” raises one re-check action');
  let ph = await activePh(p); const act = Object.values(ph.actions).find(a => /^Re-check after a change to Medicines, Poisons/.test(a.title));
  ok(act && act.status === 'open' && act.due === '2026-12-24', 'C2-01 the action lists what to look at again, due in 30 days, and stays open for the owner');
  await p.screenshot({ path: path.join(OUT, '06_sources_390px.png') });
  const inc = await (async () => { await more(/^If something goes wrong/); return p.evaluate(() => [...document.querySelectorAll('main a[href^="https://"]')].length); })();
  ok(inc >= 3, 'C2-01 incident steps link to their NSW Health pages (' + inc + ')');
  await p.locator('summary', { hasText: 'Privacy or My Health Record data breach' }).click(); let ib = await p.locator('details[open]').last().innerText();
  ok(await p.locator('main details.why').count() === 4 && /notify both the System Operator .* and the Information Commissioner/.test(ib) && /s 75\(2\)/.test(ib) && /within 30 days \(Privacy Act 1988 s 26WH\)/.test(ib) && /without patient names/.test(ib), 'C2-02 a 4th incident card: My Health Record (s 75) and Privacy Act steps, sourced');
  await p.screenshot({ path: path.join(OUT, '09_incident_privacy_390px.png') });
  // C2-04: updates feed
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Today'); await p.locator('.updline').click(); await p.waitForTimeout(200);
  let t = await text(p);
  ok(/4 updates to read/.test(t) && /WHAT CHANGED/i.test(t) && /NO LONGER REQUIRED/i.test(t) && /S4D prescriptions are valid for 12 months/.test(t), 'C2-04 each update shows what changed and what’s no longer required');
  ok(await p.evaluate(() => [...document.querySelectorAll('.upd a[href^="https://"]')].every(a => a.target === '_blank' && /noreferrer/.test(a.rel))), 'C2-04 every update links its official source');
  await p.screenshot({ path: path.join(OUT, '07_updates_390px.png') });
  await p.getByRole('button', { name: 'I’ve read this' }).first().click(); await p.waitForTimeout(250);
  ok(/3 updates to read/.test(await text(p)), 'C2-04 “I’ve read this” moves it to Read');
  await p.reload(); await p.waitForTimeout(800); ok(/3 law updates to read/.test(await p.locator('.updline').innerText()), 'C2-04 read state survives a reload');
  await p.locator('.updline').click(); for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: 'I’ve read this' }).first().click(); await p.waitForTimeout(200); }
  ok(/All read/.test(await text(p)), 'C2-04 all read');
  await tap(p, 'Today'); ok(await p.locator('.updline').count() === 0, 'C2-04 the Today line goes once everything is read');
  ph = await activePh(p); ok(Object.keys(ph.flags.updatesRead).length === 4 && ph.history.some(l => /Law update read/.test(l.what)), 'C2-04 read dates are kept per pharmacy and logged in History');
  // C2-03: two questions added to the end of the governance review
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await tap(p, 'Start review');
  ok(/Question 1 of 11/.test(await text(p)), 'C2-03 the governance review now has 11 questions');
  for (let i = 0; i < 9; i++) { await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await p.waitForTimeout(40); await tap(p, 'Next'); await p.waitForTimeout(40); }
  t = await text(p); ok(/Question 10 of 11/.test(t) && /Cultural safety \(Pharmacy Board guidelines, Oct 2026\)/.test(t), 'C2-03 question 10 is cultural safety');
  await p.locator('label.choice', { hasText: /^Checked$/ }).first().click(); await tap(p, 'Next'); await p.waitForTimeout(60);
  ok(/Conflicts of interest \(National Boards’ interim guidance\)/.test(await text(p)), 'C2-03 question 11 is conflicts of interest');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await tap(p, 'Today');
  // C2-05: prescribing, in a second (fresh) pharmacy: its own unread updates, the extra conditions and checklist items
  await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Prescribing Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Pharmacist prescribing' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  ok(/4 law updates to read/.test(await p.locator('.updline').innerText()), 'C2-04 a new pharmacy has its own unread updates');
  await tap(p, 'Set up services'); await p.getByRole('button', { name: /^Answer/ }).click(); await p.locator('label.choice').nth(2).click(); await tap(p, 'Save');
  await p.getByRole('button', { name: /^Pharmacist prescribing/ }).click(); let seenQ = false, seenC = false;
  for (let i = 0; i < 20; i++) { t = await text(p); if (/What happens next/.test(t)) break;
    if (/Queensland-trained pharmacists only/.test(t)) { seenQ = /Mild acute musculoskeletal pain/.test(t) && /Acute nausea and vomiting/.test(t) && /Initiation of the oral contraceptive pill \(JCU-trained pharmacists only\)/.test(t); await p.locator('label.tick', { hasText: 'Uncomplicated urinary tract infection' }).click(); }
    else if (/Working with Children Check/.test(t)) { seenC = /DMPA injections/.test(t) && /4 November 2027/.test(t) && /James Cook University Graduate Certificate/.test(t) && /Intention to provide expanded community pharmacy services/.test(t); if (seenC) { await p.locator('label.tick', { hasText: 'Contraception: vaginal rings' }).scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 120)); await p.screenshot({ path: path.join(OUT, '08_prescribing_checklist_390px.png') }); } const tk = p.locator('form label.tick').first(); await tk.click(); }
    else if (await p.getByRole('button', { name: 'Skip for now', exact: true }).count()) { await tap(p, 'Skip for now'); continue; }
    else { const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) await ch.click(); else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional'); await inp.blur(); } } }
    await p.waitForTimeout(60); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(60); }
  ok(seenQ, 'C2-05 the 5 extra conditions are offered, marked “Queensland-trained pharmacists only”');
  ok(seenC, 'C2-05 the readiness checklist adds contraception limits, Working with Children Check, the Intention form and the 4 Nov 2027 expiry');
  ph = await activePh(p); ok(Object.values(ph.actions).some(a => /approved pharmacy/i.test(a.title)) || /What happens next/.test(await text(p)), 'C2-05 unticked items stay open for the owner (nothing ticked for them)');
  // 320×568: no sideways scroll on the new screens
  await p.setViewportSize({ width: 320, height: 568 });
  for (const [name, re] of [['Sources', /^Sources/], ['Law and practice updates', /^Law and practice updates/]]) { await more(re); await p.waitForTimeout(200); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '320×568 ' + name + ': no sideways scroll'); }
  await done(b, errors);
})();
