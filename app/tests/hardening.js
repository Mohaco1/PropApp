// Final pre-trial hardening (Gemini/Codex brief on 9344592463), by real touch taps at 390×844, including two tabs in
// one browser. Fails on any console error.
const { phone, ok, done, tap, text, activePh, saved, download, APP } = require('./helpers.js'); const path = require('path'); const fs = require('fs'); const os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sigil-hard-'));
const qn = async p => +(((await text(p)).match(/Question (\d+)/) || [])[1] || 0);
const next = p => p.getByRole('button', { name: /^(Next|Finish)$/ }).first();
(async () => {
  const errors = [];
  const open = async (opts = {}) => { const s = await phone({ time: '2026-11-26T10:00:00+11:00', ...opts }); s.p.on('pageerror', e => errors.push(e.message)); return s; };
  const tab2 = async p => { const q = await p.context().newPage(); q.on('pageerror', e => errors.push(e.message)); q.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); await q.goto(APP); await q.waitForTimeout(900); return q; };
  const actionsOf = async p => Object.values((await activePh(p)).actions).map(a => a.title);
  const addAction = async (p, title) => { await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action', exact: true }).first().tap(); await p.fill('input[name=title]', title); await p.getByRole('button', { name: 'Save action' }).tap(); await p.waitForTimeout(150); };

  // ── 1. Previous straight after Next; corrected answer survives; a cleared software name stays clear
  let { b, p } = await open();
  await tap(p, 'Set up your pharmacy'); await p.fill('input[name=name]', 'Hardening Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue');
  await p.locator('label.tick', { hasText: 'Staged supply' }).first().tap(); await tap(p, 'Finish setup'); await p.waitForTimeout(400); await tap(p, 'Set up services'); await p.waitForTimeout(200);
  if (await p.getByRole('button', { name: /^Answer$/ }).count()) { await p.getByRole('button', { name: /^Answer$/ }).tap(); await p.locator('label.choice').nth(2).tap(); await tap(p, 'Save'); await p.waitForTimeout(200); }
  await p.getByRole('button', { name: /^Staged supply/ }).first().tap(); await p.waitForTimeout(300);
  const ticks = p.locator('main form label.tick'); await ticks.first().tap(); await p.waitForTimeout(300);
  await next(p).tap(); await p.getByRole('button', { name: 'Previous' }).tap(); await p.waitForTimeout(300);
  ok(await qn(p) === 1, 'Item 0: Previous straight after Next goes back on the first tap');
  const firstVal = (await activePh(p)).services.staged.answers.funding; await ticks.first().tap(); await ticks.nth(1).tap(); await p.waitForTimeout(300);
  await next(p).tap(); await p.waitForTimeout(450);
  const corrected = (await activePh(p)).services.staged.answers.funding;
  await p.locator('main form input[name=d]').tap(); await p.keyboard.type('Fictional Soft', { delay: 10 }); await next(p).tap(); await p.waitForTimeout(450);
  await p.getByRole('button', { name: 'Previous' }).tap(); await p.waitForTimeout(400); await p.fill('main form input[name=d]', ''); await next(p).tap(); await p.waitForTimeout(450);
  await p.reload(); await p.waitForTimeout(900);
  let ph = await activePh(p);
  ok(corrected !== firstVal && ph.services.staged.answers.funding === corrected, 'Item 6: a corrected answer after Previous survives a reload (' + firstVal + ' → ' + corrected + ')');
  ok(!Object.values(ph.services.staged.answers).includes('Fictional Soft'), 'Item 6: a software name cleared on purpose stays clear after a reload');
  // cold start Today copy
  await tap(p, 'Today'); ok(/No overdue items with known dates\./.test(await text(p)) && await p.getByRole('button', { name: 'Add your last S8 stocktake date' }).count() === 1, 'Cold start: “No overdue items with known dates.” with “Add your last S8 stocktake date” under it');
  await b.close();

  // ── 2. Restore never resurrects a discarded edit (two tabs, reload in either order)
  ({ b, p } = await open());
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  const bk = await download(p, 'Download a backup'); fs.writeFileSync(path.join(TMP, 'old.json'), bk); fs.writeFileSync(path.join(TMP, 'old2.json'), bk);
  let q = await tab2(p); await addAction(q, 'Newer edit in tab B (fictional)'); await q.waitForTimeout(400);
  ok((await actionsOf(q)).includes('Newer edit in tab B (fictional)'), 'Item 1 setup: tab B saved a newer action');
  for (const f of ['old.json', 'old2.json']) { await p.locator('input[type=file]').setInputFiles(path.join(TMP, f)); await p.waitForTimeout(800); }
  const receipt = await text(p);
  await q.reload(); await q.waitForTimeout(900); await p.reload(); await p.waitForTimeout(900);
  ok(!(await actionsOf(p)).includes('Newer edit in tab B (fictional)') && !(await actionsOf(q)).includes('Newer edit in tab B (fictional)') && /Checked: every count matches the backup file/.test(receipt), 'Item 1: the restored copy stays restored in both tabs (B reloaded first); the receipt matched');
  await p.reload(); await p.waitForTimeout(700); await q.reload(); await q.waitForTimeout(700);
  ok(!(await actionsOf(p)).includes('Newer edit in tab B (fictional)'), 'Item 1: still restored after reloading in the other order');

  // ── 3. Two tabs save different actions; one closes at once; both survive
  await addAction(p, 'Tab A action (fictional)'); await addAction(q, 'Tab B action (fictional)'); await q.close();
  await p.reload(); await p.waitForTimeout(1200);
  let t = await actionsOf(p);
  ok(t.includes('Tab A action (fictional)') && t.includes('Tab B action (fictional)'), 'Item 2: both tabs’ actions survive when one tab closes straight after saving');

  // ── 4. Double taps on final buttons record once
  const before = (await activePh(p)); const nAct = Object.keys(before.actions).length;
  await tap(p, 'Actions'); await p.getByRole('button', { name: 'Add an action', exact: true }).first().tap(); await p.fill('input[name=title]', 'Double save (fictional)');
  await p.getByRole('button', { name: 'Save action' }).tap(); await p.mouse.click(195, 400).catch(() => {}); await p.waitForTimeout(300);
  ph = await activePh(p); ok(Object.keys(ph.actions).length === nAct + 1, 'Item 3: a double tap on Save action records one action');
  await tap(p, 'Seen the fix · close it'); await p.waitForTimeout(200); await p.fill('textarea[name=what], input[name=what]', 'Checked in person (fictional)').catch(() => {});
  const cl = p.getByRole('button', { name: 'Close action' }); await cl.tap(); await cl.tap({ timeout: 500 }).catch(() => {}); await p.waitForTimeout(300);
  ph = await activePh(p); const da = Object.values(ph.actions).find(a => a.title === 'Double save (fictional)');
  ok(da.status === 'closed' && da.log.filter(l => l.kind === 'closed').length === 1, 'Item 3: a double tap on Close action closes once (one closure in the log)');
  // Save review twice (S8)
  const nRec = ph.records.length;
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await tap(p, 'Start review'); await p.getByRole('button', { name: 'Answer as a list' }).tap(); await p.waitForTimeout(200);
  for (let i = 0; i < 9; i++) await p.locator('.qlist-item').nth(i).locator('.chip:not(.issue)').first().tap();
  await tap(p, 'Finish'); await p.waitForTimeout(200); await p.fill('input[name=stockDate]', '2026-11-20'); await p.fill('input[name=stockBy]', 'Priya Sharma (fictional)'); await p.locator('input[name=stockBy]').blur();
  const sr = p.getByRole('button', { name: 'Save review' }); await sr.tap(); await sr.tap({ timeout: 500 }).catch(() => {}); await p.waitForTimeout(400);
  ph = await activePh(p); ok(ph.records.length === nRec + 1, 'Item 3: a double tap on Save review records one review');

  // ── 5. S8: a completed stocktake then a later incomplete review; every screen uses the completed one
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await tap(p, 'Start review'); await p.waitForTimeout(200);
  await p.locator('label.choice', { hasText: /^Incomplete$/ }).tap(); await p.fill('textarea[name=issue]', 'Count interrupted (fictional)'); await p.waitForTimeout(100); await tap(p, 'Next');
  // wait for each question to change rather than a fixed pause (the fixed pauses were what made earlier S8 runs flaky)
  for (let i = 1; i < 9; i++) { const n = await qn(p); await p.locator('label.choice').first().tap(); await p.waitForTimeout(80); await next(p).tap();
    await p.waitForFunction(k => !document.body.innerText.includes('Question ' + k + ' of'), n, { timeout: 5000 }).catch(() => {}); }
  await p.getByRole('button', { name: 'Save review' }).waitFor({ timeout: 5000 }); await tap(p, 'Save review'); await p.waitForTimeout(400);
  ph = await activePh(p); const due = ph.schedule.B1;
  ok(due <= '2027-02-20', 'Item 5: the S8 deadline still comes from the completed 20 Nov stocktake (due ' + due + ', limit 20 Feb 2027)');
  await tap(p, 'More'); await p.getByRole('button', { name: /^S8 at a glance/ }).tap(); await p.waitForTimeout(200); t = await text(p);
  ok(/20 Nov/.test(t), 'Item 5: S8 at a glance shows the 20 Nov completed stocktake');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Calendar/ }).first().tap(); await p.waitForTimeout(200); const cal = await download(p, 'Download calendar file');
  const ev = cal.split('BEGIN:VEVENT').find(e => /S8 stock check/.test(e)) || '';
  ok(ev.includes('DTSTART;VALUE=DATE:' + due.replace(/-/g, '')), 'Item 5: the calendar file has the same S8 date (' + due + ')');
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence pack/ }).tap(); await p.waitForTimeout(200);
  const s8h = await p.evaluate(() => [...document.querySelectorAll('.psec h2')].map(x => x.innerText).find(x => /^S8 stock checks/.test(x)) || '');
  ok(/completed stocktakes? · 1 incomplete review/.test(s8h), 'Item 5: the evidence pack shows completed and incomplete separately (' + s8h + ')');
  ok(await p.locator('.rowwrap', { hasText: 'S8 stock check' }).count() === 0, 'Item 5: the S8 review can’t be deferred');
  // a future stocktake date is refused
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().tap(); await tap(p, 'Start review'); await p.getByRole('button', { name: 'Answer as a list' }).tap(); await p.waitForTimeout(200);
  for (let i = 0; i < 9; i++) await p.locator('.qlist-item').nth(i).locator('.chip:not(.issue)').first().tap();
  await tap(p, 'Finish'); await p.waitForTimeout(200); await p.fill('input[name=stockDate]', '2026-12-20'); await p.locator('input[name=stockDate]').blur(); await p.waitForTimeout(200);
  const n2 = (await activePh(p)).records.length; await p.getByRole('button', { name: 'Save review' }).tap().catch(() => {}); await p.waitForTimeout(300);
  ok((await activePh(p)).records.length === n2, 'Item 5: a stocktake dated in the future is not saved');
  await p.getByRole('button', { name: 'Back', exact: true }).click().catch(() => {});

  // ── 4b. Mid-form pharmacy switching: a note typed at Store A never shows at Store B
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Store B (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam Owner'); await tap(p, 'Continue'); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^Wattle Grove Pharmacy/ }).first().click(); await p.waitForTimeout(500);
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await tap(p, 'Start review');
  await p.locator('label.choice', { hasText: /^Checked$/ }).first().tap(); await p.waitForTimeout(100); await p.locator('textarea[name=note]').fill('STORE-A-ONLY note (fictional)'); await p.waitForTimeout(300);
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^Store B/ }).first().click(); await p.waitForTimeout(500);
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await p.waitForTimeout(200);
  ok(!/STORE-A-ONLY/.test(await text(p)) && await p.getByRole('button', { name: 'Start review' }).count() === 1, 'Item 4: Store A’s typed note never appears at Store B (B starts fresh)');
  await p.reload(); await p.waitForTimeout(800); await tap(p, 'Today'); await p.locator('.ph-switch').click(); await p.getByRole('button', { name: /^Wattle Grove Pharmacy/ }).first().click(); await p.waitForTimeout(500);
  await tap(p, 'Reviews'); await p.locator('.chip', { hasText: /^All/ }).first().click(); await p.getByRole('button', { name: /Governance, access and continuity/ }).first().click(); await p.waitForTimeout(300);
  if (await p.getByRole('button', { name: /^(Carry on|Resume|Continue)/ }).count()) await p.getByRole('button', { name: /^(Carry on|Resume|Continue)/ }).first().click();
  await p.waitForTimeout(300);
  ok(/STORE-A-ONLY note \(fictional\)/.test(await p.evaluate(() => [...document.querySelectorAll('textarea')].map(x => x.value).join(' '))) || /STORE-A-ONLY/.test(JSON.stringify(Object.values(await saved(p)).filter(x => x && typeof x === 'object' && !x.records))), 'Item 4: back at Store A after a reload, its draft note is still there');
  await b.close();
  // ── Owner trial (26 Nov): "Write the steps …" items in a procedure no longer loop back to the setup question
  ({ b, p } = await open());
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.getByRole('button', { name: /^Opioid Treatment Program/ }).first().tap(); await p.waitForTimeout(300);
  if (await p.getByRole('button', { name: 'Update the draft' }).count()) { await tap(p, 'Update the draft'); await p.waitForTimeout(300); }
  const nConf = async () => +(((await text(p)).match(/TO CONFIRM BEFORE ADOPTING · (\d+)/i) || [0, 0])[1]);
  const c0 = await nConf();
  await p.locator('.row', { hasText: 'missed doses' }).first().tap(); await p.waitForTimeout(300);
  const sel = await p.evaluate(() => { const t = document.querySelector('textarea[name=body]'); return t ? t.value.slice(t.selectionStart, t.selectionEnd) : ''; });
  ok(/^\[Confirm: write the steps for missed doses/.test(sel), 'Procedure fix: “Write the steps…” opens Edit with that placeholder selected');
  await p.keyboard.type('Missed doses: follow current NSW OTP guidance (fictional pharmacy steps).'); await tap(p, 'Save as new version'); await p.waitForTimeout(400);
  const c1 = await nConf();
  await p.locator('.row', { hasText: 'film doses' }).first().tap(); await p.waitForTimeout(300); await tap(p, 'We already have our own written procedure for this'); await p.waitForTimeout(300);
  await p.locator('label.choice', { hasText: 'We have our own procedure' }).tap(); await p.waitForTimeout(300); await p.fill('main form input[name=d]', 'OTP folder, dispensary (fictional)'); await p.locator('main form input[name=d]').blur(); await p.waitForTimeout(300);
  await tap(p, 'Save and back to the procedure'); await p.waitForTimeout(500);
  const c2 = await nConf(), t2 = await text(p);
  ok(c0 === 3 && c1 === 2 && c2 === 1 && /Opioid Treatment Program procedure/.test(t2) && !/Update the draft/.test(t2), 'Procedure fix: writing the steps (3 → 2) or choosing “we have our own procedure” (2 → 1) clears each item, back on the procedure, edits kept');
  await b.close();
  // ── Owner trial (26 Nov): a "to confirm" check with no setup question ("Steps match the current Handbook") is
  // confirmed by the owner's own tap in the text, instead of looping back to the service screen
  ({ b, p } = await open());
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  await tap(p, 'More'); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); await p.getByRole('button', { name: /^Vaccination/ }).first().tap(); await p.waitForTimeout(300);
  if (await p.getByRole('button', { name: 'Update the draft' }).count()) { await tap(p, 'Update the draft'); await p.waitForTimeout(300); }
  const vrow = p.locator('.row', { hasText: 'Steps match the current Handbook' }).first();
  ok(/Check it in the text, then confirm/.test(await vrow.innerText()) && await p.getByRole('button', { name: 'Adopt for use here' }).isDisabled(), 'Procedure fix: a check item says “Check it in the text, then confirm”; Adopt waits');
  await vrow.tap(); await p.waitForTimeout(300); await tap(p, 'I’ve checked it — remove this marker'); await p.waitForTimeout(400);
  ok(/Vaccination procedure/.test(await text(p)) && !/TO CONFIRM BEFORE ADOPTING/i.test(await text(p)) && !(await p.getByRole('button', { name: 'Adopt for use here' }).isDisabled()) && (await activePh(p)).procedures.find(x => x.service === 'vaccination').status !== 'adopted', 'Procedure fix: the owner’s tap removes the marker and unlocks Adopt (nothing adopted for them)');
  await b.close();
  await done({ close: async () => {} }, errors);
})();
