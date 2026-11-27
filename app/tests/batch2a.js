// Batch 2A (H-01, H-02, H-03, H-06, M-03), by real touch taps at 390×844 on the example pharmacy; fails on any console error.
// Where the example has no data for a check (a prescribing answer, an old-brand procedure body), that data is written
// into the phone's storage first, as an earlier version of the app would have saved it, and then read through the screens.
const { phone, ok, done, tap, text, activePh, saved, copied } = require('./helpers.js');
const path = require('path');
const TIME = '2026-11-27T10:00:00+11:00';
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const otpService = async p => { await more(p, 'Services'); await p.locator('[data-id="otp"]').first().tap(); await p.waitForTimeout(300); };
// Change the stored pharmacy as an earlier app version would have left it, then reload.
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph);
  await p.evaluate(async ({ K, ph }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ph, K); tx.oncomplete = res; }); }, { K, ph });
  await p.reload(); await p.waitForTimeout(900); };
const OLD = /cold chain for LAIB|LAIB cold chain/;
const BUV = /Buvidal below 25°C/, SUB = /Sublocade refrigerated at 2°C–8°C/;

(async () => {
  const { b, p, errors } = await phone({ time: TIME, clip: true });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  const shot = n => p.screenshot({ path: path.resolve(__dirname, '../handoff/batch2a_' + n + '_390px.png') });

  // ── H-02: the "80 or more patients on one day" answer switches the OTP amenity review on and off.
  await otpService(p);
  const volRow = () => p.getByRole('button', { name: /Have 80 or more supervised patients/ }).first();
  await volRow().tap(); await p.waitForTimeout(300);
  await p.locator('main form label.choice', { hasText: /^No$/ }).first().tap(); await p.waitForTimeout(400);
  let ph = await activePh(p);
  ok(ph.services.otp.answers.volumeBand === 'No' && ph.flags.volume === false, 'H-02 answering No sets the volume flag off');
  await tap(p, 'Reviews'); await p.waitForTimeout(300);
  ok(!/OTP daily-volume threshold review/.test(await text(p)), 'H-02 with No, Reviews has no OTP daily-volume threshold review');
  await otpService(p); await volRow().tap(); await p.waitForTimeout(300);
  await p.locator('main form label.choice', { hasText: /^Yes$/ }).first().tap(); await p.waitForTimeout(400);
  ph = await activePh(p);
  ok(ph.services.otp.answers.volumeBand === 'Yes' && ph.flags.volume === true, 'H-02 answering Yes sets the volume flag on');

  // ── H-01: walk the rest of OTP setup, adding LAIB; the storage item and the draft name each brand's storage.
  await otpService(p); await tap(p, 'Edit answers'); await p.waitForTimeout(300);
  let seenItem = false, seenOld = false;
  for (let i = 0; i < 40 && !/What happens next/.test(await text(p)); i++) {
    const t = await text(p); seenOld = seenOld || OLD.test(t);
    if (BUV.test(t) && SUB.test(t)) seenItem = true;
    const laib = p.locator('main form label.tick', { hasText: /Long-acting injectable buprenorphine/ });
    if (await laib.count() && !(await laib.first().locator('input').isChecked())) { await laib.first().tap(); await p.waitForTimeout(250); }
    const ch = p.locator('main form label.choice').filter({ hasNotText: /^Check later$/ });
    if (await ch.count() && !(await p.locator('main form label.choice input:checked').count())) { await ch.first().tap(); await p.waitForTimeout(250); }
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).first().tap(); await p.waitForTimeout(250);
  }
  ph = await activePh(p);
  ok(/LAIB/.test(ph.services.otp.answers.medicines), 'H-01 setup: LAIB ticked as one of the OTP medicines');
  ok(seenItem && !seenOld, 'H-01 the secure-storage item gives Buvidal (below 25°C, never refrigerated) and Sublocade (2°C–8°C) storage, with no “cold chain for LAIB”');
  let t = await text(p); if (!/What happens next/.test(t)) console.log(t.slice(0, 1500));
  ok(/What happens next/.test(t) && /OTP daily-volume threshold review/.test(t), 'H-02 “What happens next” lists the OTP daily-volume threshold review');
  await shot('h02_whatnext');
  await tap(p, 'Save dates and finish'); await p.waitForTimeout(500);
  ph = await activePh(p);
  ok(!!ph.schedule['otp-amenity'], 'H-02 finishing setup gives the amenity review a first date (' + ph.schedule['otp-amenity'] + ')');
  await tap(p, 'Reviews'); await p.waitForTimeout(300);
  ok(/OTP daily-volume threshold review/.test(await text(p)), 'H-02 Reviews lists the OTP daily-volume threshold review');
  await tap(p, 'Today'); await p.waitForTimeout(300); await p.locator('[data-f=all]').tap().catch(() => {}); await p.waitForTimeout(200);
  ok(/OTP daily-volume threshold review/.test(await text(p)), 'H-02 Today lists the OTP daily-volume threshold review');
  await more(p, 'Calendar'); await tap(p, 'Year plan'); await p.waitForTimeout(300); ok(/OTP daily-volume threshold/.test(await text(p)), 'H-02 the Year plan lists the OTP daily-volume threshold review');

  await more(p, 'Procedures'); await p.locator('[data-id="otp"]').first().tap(); await p.waitForTimeout(300);
  for (const name of ['Update the draft', 'Save this draft']) if (await p.getByRole('button', { name }).count()) { await tap(p, name); await p.waitForTimeout(400); }
  if (await p.getByRole('button', { name: 'Open all sections' }).count()) { await tap(p, 'Open all sections'); await p.waitForTimeout(300); }
  t = await text(p);
  ok(/Buvidal below 25°C and never refrigerated or frozen/.test(t) && /Sublocade refrigerated at 2°C–8°C in the S8 safe or fridge \(or up to 7 days below 25°C\)/.test(t) && !OLD.test(t), 'H-01 the OTP draft gives each LAIB brand’s storage, with no “Schedule 8 cold chain for LAIB”');
  await shot('h01_otp_draft');

  // ── M-03: a "Yes" that is the good answer is not shown in red on the record.
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /OTP daily-volume threshold review/ }).first().tap(); await p.waitForTimeout(300);
  await tap(p, 'Start review'); await p.waitForTimeout(300);
  await p.locator('main label.choice, main .chip', { hasText: /^Yes$/ }).first().tap(); await p.waitForTimeout(300);
  for (let i = 0; i < 4 && !(await p.getByRole('button', { name: 'Save review' }).count()); i++) { const nx = p.getByRole('button', { name: /^(Next|Finish)$/ }).first(); if (await nx.count()) await nx.tap(); await p.waitForTimeout(300); }
  await tap(p, 'Save review'); await p.waitForTimeout(500);
  ph = await activePh(p); const rec = ph.records.filter(r => r.type === 'otp-amenity').at(-1);
  ok(rec && rec.answers[0].answer === 'Yes' && rec.answers[0].isIssue === false, 'M-03 the threshold review is saved with “Yes” (not an issue)');
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /OTP daily-volume threshold review/ }).first().tap(); await p.waitForTimeout(300);
  await tap(p, 'See the last one'); await p.waitForTimeout(300);
  ok(await p.locator('.row-right', { hasText: /^Yes$/ }).count() === 1 && await p.locator('.row-right.bad', { hasText: /^Yes$/ }).count() === 0, 'M-03 the record shows the good “Yes” without red');
  await shot('m03_record');
  // An older record whose answer is a real issue word is still shown in red.
  await patch(p, ph => { const r = ph.records.find(x => x.id === rec.id); r.answers[0] = { text: r.answers[0].text, answer: 'Issue', note: 'Fictional' }; });
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /OTP daily-volume threshold review/ }).first().tap(); await p.waitForTimeout(300);
  await tap(p, 'See the last one'); await p.waitForTimeout(300);
  ok(await p.locator('.row-right.bad', { hasText: /^Issue$/ }).count() === 1, 'M-03 a real issue on an older record is still shown in red');
  // H-06: the record summary is from PharmLedger.
  const c = await copied(p, 'Copy as text');
  ok(/From PharmLedger\./.test(c.clip) && !/R\.Pharmacy/.test(c.clip), 'H-06 the record summary ends “From PharmLedger.”');

  // ── M-03: "Why?" shows real sentences only, not screen labels read off the example.
  const whyOf = async name => { await tap(p, 'Reviews'); await p.getByRole('button', { name }).first().tap(); await p.waitForTimeout(300);
    await p.locator('summary, button', { hasText: /^Why\?$/ }).first().tap(); await p.waitForTimeout(200); return text(p); };
  const LABELS = /Recommended proprietor oversight interval|record exceptions and follow-up|Preview only|Wattle Grove Pharmacy/;
  t = await whyOf(/^Governance, access and continuity/);
  ok(/Keep each version for five years/.test(t) && !LABELS.test(t), 'M-03 “Why?” keeps the real notes (governance review)');
  t = await whyOf(/^Home delivery/);
  ok(!LABELS.test(t), 'M-03 “Why?” drops screen labels read off the example (home delivery)');
  await shot('m03_why');

  // ── H-03: the OCP update names all three universities and the private cost; answers show wording, not stored values.
  await more(p, 'Law and sources'); await tap(p, 'Law and practice updates'); await p.waitForTimeout(300);
  const up = p.getByRole('button', { name: /Class Authorities and who can do what/ }); if (await up.count()) { await up.first().tap(); await p.waitForTimeout(300); }
  t = await text(p);
  ok(/James Cook University, the University of Newcastle or UTS/.test(t) && /private \(non-PBS\) cost/.test(t), 'H-03 the prescribing update lists JCU, Newcastle and UTS and the private (non-PBS) cost');
  await shot('h03_update');
  await patch(p, ph => { ph.services.prescribing = { active: true, setup: 'done', answers: { pathway: 'Contraception,OCP initiation', prescribing2026: 'OCP initiation (JCU-trained),Working with Children Check,Contraception limits,Authorities expire 4 Nov 2027' } }; });
  await more(p, 'Services'); await p.locator('[data-id="prescribing"]').first().tap(); await p.waitForTimeout(300); t = await text(p);
  ok(/approved pharmacist” under the NSW protocol/.test(t) && /Working with Children Check is held/.test(t) && !/JCU-trained|Contraception limits|Authorities expire 4 Nov 2027/.test(t), 'H-03 “Your answers” shows each prescribing item’s wording, never its stored value');
  await shot('h03_answers');

  // ── H-06: an old-brand procedure body is shown and edited with PharmLedger wording.
  await patch(p, ph => { const pr = ph.procedures.find(x => x.service === 'otp'), v = pr.versions.at(-1);
    pr.versions.push({ ...v, v: '9.1', body: 'Written by R.Pharmacy (fictional test line). Review it and approve it in Policies.\n' + v.body, edited: true, status: 'Draft' }); pr.status = 'draft'; });
  await more(p, 'Procedures'); await p.locator('[data-id="otp"]').first().tap(); await p.waitForTimeout(300); t = await text(p);
  ok(/Written by PharmLedger/.test(t) && /adopt it in Procedures/.test(t) && !/R\.Pharmacy|approve it in Policies/.test(t), 'H-06 an edited procedure is shown with PharmLedger and “adopt it in Procedures”');
  await tap(p, 'Edit'); await p.waitForTimeout(300); ok(/Edit wording/.test(await text(p)), 'H-06 Edit opens “Edit wording”');
  const body = await p.locator('textarea[name=body]').inputValue();
  ok(/Written by PharmLedger/.test(body) && /adopt it in Procedures/.test(body) && !/R\.Pharmacy|approve it in Policies/.test(body), 'H-06 Edit wording opens with PharmLedger and “adopt it in Procedures”');
  await p.locator('.dock-inline button', { hasText: /Cancel/ }).first().tap(); await p.waitForTimeout(200);

  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390×844: no sideways scroll');
  await done(b, errors);
})();
