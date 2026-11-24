// One setup flow (hybrid of Express and Detailed, owner decision 20 Nov 2026). Fictional data.
// Intro per service → pharmacy-specific questions numbered honestly → "What most pharmacies do" summary the
// proprietor confirms, changes or marks "Check later". Evidence and legal checklists are never filled in.
const { chromium } = require('playwright');
const APP = 'file:///home/user/rpharmacy/uat/app/' + (process.env.FILE || 'rpharmacy-uat-testing.html');
const res = []; const ok = (n, p, d = '') => res.push({ n, p: !!p, d: String(d).slice(0, 300) });
const snap = p => p.evaluate(() => { const ed = $('editor'); if (!ed.open) return { closed: true }; return { t: ed.querySelector('#dialog-title')?.textContent || '', st: ed.querySelector('.rph-question p[role=status]')?.textContent || '', opts: [...ed.querySelectorAll('.fresh-option')].map(b => b.textContent.trim()), checks: ed.querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').length, inputs: [...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i => i.offsetParent && !i.closest('.uat-q')).length, buttons: [...ed.querySelectorAll('button')].map(b => b.textContent.trim()), sum: !!ed.querySelector('.hy-sum'), intro: !!ed.querySelector('.hy-intro') }; });
async function answer(p, x) {
  if (x.checks) { await p.evaluate(() => $('editor').querySelector('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').click()); }
  else if (x.opts.length) { const pick = x.opts.find(o => /Draft it for me/.test(o)) || x.opts.find(o => !/Needs verification|Different local|Other|Someone else|our own/.test(o)) || x.opts[0]; await p.locator('#editor .fresh-option', { hasText: pick }).first().click(); await p.waitForTimeout(200); return; }
  else if (x.inputs) { await p.evaluate(() => { for (const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i => i.offsetParent && !i.closest('.uat-q'))) { i.value = 'Test value'; i.dispatchEvent(new Event('input', { bubbles: true })); } }); }
  const c = x.buttons.find(y => /^(Continue|Save|Next)/.test(y)); if (!c) throw new Error('No Continue on: ' + JSON.stringify(x).slice(0, 600)); await p.locator('#editor button', { hasText: c }).first().click(); await p.waitForTimeout(200);
}
async function start(b, oneByOne) {
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP); await p.waitForTimeout(1500); await p.evaluate(() => { if (D.phone) { D.applyView(false); render(); } });
  await p.locator('main button', { hasText: 'Set up your pharmacy' }).click(); await p.waitForTimeout(300);
  await p.fill('#editor input >> nth=0', 'Harbourview Test Pharmacy'); await p.fill('#editor input >> nth=1', '1 Test Street'); await p.locator('#editor button', { hasText: 'Continue' }).click(); await p.waitForTimeout(300);
  await p.fill('#editor input >> nth=0', 'Alex Owner'); await p.locator('#editor button', { hasText: 'Continue' }).click(); await p.waitForTimeout(300);
  const how = await p.evaluate(() => ({ how: document.querySelector('#setup-how')?.textContent || '', radios: document.querySelectorAll('#editor input[name=setup-mode]').length }));
  if (oneByOne) await p.evaluate(() => RPH.express.set(false));
  for (const s of ['Dose administration aids', 'Opioid Treatment Program', 'Home delivery']) await p.locator('#editor .d-tiles>label', { hasText: s }).first().click();
  await p.locator('#editor button', { hasText: 'Save service selection' }).click(); await p.waitForTimeout(400);
  return { p, errs, how };
}
(async () => {
  const b = await chromium.launch();
  // ---------- one-flow setup ----------
  const { p, errs, how } = await start(b);
  ok('no mode to choose; the services step says what happens next', how.radios === 0 && /usual arrangements to check/.test(how.how), JSON.stringify(how));
  let x = await snap(p);
  ok('each service starts with a short intro (what it is for, nothing marked as checked)', x.intro && /Setting up Dose administration aids/.test(await p.evaluate(() => $('editor').innerText)) && /Nothing is marked as checked or compliant/.test(await p.evaluate(() => $('editor').innerText)), x.st);
  await p.locator('#editor button', { hasText: /^Start$/ }).click(); await p.waitForTimeout(250);
  // answer DAA's own questions and collect the numbering
  const nums = []; let guard = 0;
  while (guard++ < 30) { x = await snap(p); if (x.sum || x.closed) break; const m = /Question (\d+) of (\d+)/.exec(x.st); if (m) nums.push([+m[1], +m[2]]); await answer(p, x); }
  const consecutive = nums.every((n, i) => i === 0 || n[0] === nums[i - 1][0] + 1);
  ok('questions are numbered honestly (1, 2, 3 … with no gaps)', nums.length >= 3 && nums[0][0] === 1 && consecutive, JSON.stringify(nums));
  ok('then "What most pharmacies do" lists the usual arrangements in plain words', x.sum && /What most pharmacies do/.test(await p.evaluate(() => $('editor').innerText)) && await p.evaluate(() => /Pharmacist verifies before packing/.test(document.querySelector('#editor .hy-list').innerText)), JSON.stringify(x.buttons));
  ok('the service is not saved until the proprietor confirms', await p.evaluate(() => !state.serviceConfig?.daa?.complete));
  ok('evidence and record locations are listed as "to check later", not answered', await p.evaluate(() => /to check later \(evidence or record locations, never filled in for you\)/.test(document.querySelector('#editor details.hy-ev summary')?.textContent || '')));
  // Change one line
  await p.evaluate(() => { const li = [...document.querySelectorAll('#editor .hy-list li')].find(l => /Medication list check/.test(l.innerText)); li.querySelector('button').click(); });
  await p.waitForTimeout(300);
  const card = await p.evaluate(() => [...$('editor').querySelectorAll('.fresh-option')].map(b => b.textContent.trim()));
  ok('Change opens that one question', card.some(c => /No documented check yet/.test(c)), JSON.stringify(card));
  await p.locator('#editor .fresh-option', { hasText: 'No documented check yet' }).first().click(); await p.waitForTimeout(400);
  x = await snap(p);
  ok('after changing it you are back on the summary, with the new answer shown', x.sum && await p.evaluate(() => /No documented check yet/.test(document.querySelector('#editor .hy-list').innerText)), x.t);
  // Check later on another line
  await p.evaluate(() => { const li = [...document.querySelectorAll('#editor .hy-list li')].find(l => /Final check of completed packs/.test(l.innerText)); [...li.querySelectorAll('button')].find(b => /Check later/.test(b.textContent)).click(); });
  await p.waitForTimeout(300);
  ok('"Check later" marks that line (with Undo)', await p.evaluate(() => { const li = [...document.querySelectorAll('#editor .hy-list li')].find(l => /Final check of completed packs/.test(l.innerText)); return li.classList.contains('hy-later') && /Undo/.test(li.innerText) && /Check later/.test(li.querySelector('.hy-t').innerText); }));
  // Confirm
  await p.locator('#editor button', { hasText: /That.s how we do it/ }).click(); await p.waitForTimeout(400);
  const daa = await p.evaluate(() => ({ done: !!state.serviceConfig.daa.complete, assumed: state.serviceConfig.daa.assumed || [], v: sopValues('daa'), msg: $('editor').innerText }));
  ok('"That\'s how we do it" saves the service with nothing left as "assumed"', daa.done && daa.assumed.length === 0, JSON.stringify(daa.assumed));
  ok('the changed answer and the "check later" line are saved as chosen', daa.v.listCheck === 'No documented check yet' && daa.v.finalCheck === 'Needs verification', daa.v.listCheck + ' / ' + daa.v.finalCheck);
  ok('the other usual arrangements are saved as confirmed', daa.v.changes === 'Pharmacist reviews medication and hospital discharge changes', daa.v.changes);
  ok('the saved screen says what happens next: set up, services done, procedure, to check later', /Dose administration aids is set up/.test(daa.msg) && /services done/.test(daa.msg) && /Your procedure/.test(daa.msg) && /To check later/.test(daa.msg), daa.msg.slice(0, 300));
  ok('a missing medication list check still raises a follow-up action', await p.evaluate(() => Object.values(state.taskLedger || {}).some(t => /medication list check/i.test(t.text))));
  // OTP: leave at the summary, come back
  await p.locator('#editor button', { hasText: 'Continue to next section' }).click(); await p.waitForTimeout(300);
  await p.locator('#editor button', { hasText: /^Start$/ }).click(); await p.waitForTimeout(250);
  guard = 0; while (guard++ < 30) { x = await snap(p); if (x.sum || x.closed) break; await answer(p, x); }
  ok('OTP also reaches its summary', x.sum, x.t);
  await p.evaluate(() => $('editor').close()); await p.waitForTimeout(200);
  ok('leaving at the summary saves nothing yet', await p.evaluate(() => !state.serviceConfig?.otp?.complete));
  await p.evaluate(() => fsCard('otp')); await p.waitForTimeout(300);
  ok('coming back reopens the summary with the answers kept', (await snap(p)).sum);
  const otp0 = await p.evaluate(() => [...document.querySelectorAll('#editor .hy-list li .hy-t span')].map(s => s.textContent));
  await p.locator('#editor button', { hasText: /That.s how we do it/ }).click(); await p.waitForTimeout(400);
  const otp = await p.evaluate(() => ({ v: sopValues('otp'), a: state.serviceConfig.otp.assumed || [] }));
  ok('OTP: usual arrangements confirmed, evidence still "Needs verification"', otp.a.length === 0 && otp.v.registration === 'Needs verification' && otp.v.pbs === 'Needs verification', JSON.stringify([otp.v.registration, otp.v.pbs, otp0.length]));
  ok('legal checklists are never ticked for you', otp.v.otpGovernance === 'Needs verification', otp.v.otpGovernance);
  // delivery: one by one from the intro
  await p.locator('#editor button', { hasText: 'Continue to next section' }).click(); await p.waitForTimeout(300);
  await p.locator('#editor button', { hasText: 'Go through every question one by one' }).click(); await p.waitForTimeout(300);
  let n1 = 0; guard = 0; while (guard++ < 40) { x = await snap(p); if (x.closed || /Service setup complete|Pharmacy setup complete/.test(x.t)) break; n1++; await answer(p, x); }
  const del = await p.evaluate(() => ({ done: !!state.serviceConfig.delivery?.complete, a: state.serviceConfig.delivery?.assumed || [], v: sopValues('delivery') }));
  ok('"Go through every question one by one" asks every question and assumes nothing', del.done && del.a.length === 0 && n1 >= 6 && del.v.failure, JSON.stringify({ n1, a: del.a, failure: del.v.failure }));
  // approval still blocked while assumptions remain (e.g. after an older Express setup)
  const blocked = await p.evaluate(() => { const n0 = clone(); n0.serviceConfig.daa.assumed = ['changes']; commit(n0, 'test: old assumed answer'); const cat = servicePolicyIds('daa')[0]; const n = clone(); n.documents = [...(n.documents || []), { id: 'doc-test', scope: 'pharmacy', group: 'Policies & procedures', title: 'DAA procedure (test)', catalogueId: cat, lifecycle: 'Draft', version: '', updatedAt: new Date().toISOString() }]; commit(n, 'draft'); const m = clone(); m.documents.find(x => x.id === 'doc-test').lifecycle = 'Approved'; return { r: commit(m, 'approve'), still: state.documents.find(x => x.id === 'doc-test').lifecycle }; });
  ok('a procedure still cannot be approved while its service has unconfirmed assumptions', blocked.r === false && blocked.still === 'Draft', JSON.stringify(blocked));
  ok('backup is valid after this setup', await p.evaluate(() => { try { validateBackup(portableBackup()); return true; } catch (e) { return e.message; } }) === true);
  ok('no script errors', !errs.length, errs.join(' | '));
  // ---------- question by question for every service (test switch) asks more ----------
  const d = await start(b, true); let n2 = 0; guard = 0;
  while (guard++ < 120) { x = await snap(d.p); if (x.closed || /Pharmacy setup complete/.test(x.t)) break; if (/Service setup complete/.test(x.t)) { const nx = x.buttons.find(y => /Continue to next section|Finish pharmacy setup/.test(y)); await d.p.locator('#editor button', { hasText: nx }).first().click(); await d.p.waitForTimeout(250); continue; } n2++; await answer(d.p, x); }
  ok('question by question asks more screens than the one-flow setup (for comparison)', n2 > nums.length + 10, 'one-by-one screens ' + n2);
  for (const r of res) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' · ' + r.d));
  console.log(res.filter(r => r.p).length + '/' + res.length + ' passed');
  require('fs').writeFileSync('/home/user/rpharmacy/uat/tests/out/express-results.json', JSON.stringify(res, null, 1));
  await b.close();
})();
