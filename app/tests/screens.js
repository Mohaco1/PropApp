// Walks every screen by tapping, like a person, at phone size. Saves a screenshot of each and checks the measurable
// design rules: no console errors, no sideways scroll, nothing said twice, tap targets at least 44 px.
const { phone, ok, done, tap, otherDeviceSaves } = require('./helpers.js'); const fs = require('fs'); const path = require('path');
const OUT = path.resolve(__dirname, '../shots'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  const shots = []; let n = 0;
  const shot = async name => {
    await p.waitForTimeout(250);
    const m = await p.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const small = [...document.querySelectorAll('button,a,summary,select,input:not([type=checkbox]):not([type=radio]):not([type=file])')].filter(e => vis(e) && e.id !== 'uat-btn' && !e.closest('#uat-dlg')).map(e => { const r = e.getBoundingClientRect(); return { t: (e.innerText || e.name || e.getAttribute('aria-label') || '').trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) }; }).filter(x => x.h < 44 || x.w < 44);
      // repeated sentences outside lists (rows of records may share wording, e.g. two meetings of the same name)
      const lines = [...document.querySelectorAll('main p, main h1, main h2, main label > span, .bar')].filter(e => !e.closest('.list,.row,.doc,.print-only,.timeline')).map(e => e.innerText.trim()).filter(s => s.length > 24);
      const dup = [...new Set(lines.filter((s, i) => lines.indexOf(s) !== i))];
      return { small, dup, over: document.documentElement.scrollWidth > innerWidth + 1, title: document.querySelector('.bar-title')?.innerText.split('\n')[0] || '' };
    });
    const file = String(++n).padStart(2, '0') + '.png'; await p.screenshot({ path: path.join(OUT, file) });
    shots.push({ n, name, file, ...m });
  };
  const back = () => p.getByRole('button', { name: 'Back', exact: true }).first().click();
  await shot('Welcome');
  await tap(p, 'Set up your pharmacy'); await shot('Setup · step 1');
  await p.fill('input[name=name]', 'Harbour Test Pharmacy (fictional)'); await tap(p, 'Continue'); await shot('Setup · step 2');
  await p.fill('input[name=owner0]', 'Alex Owner'); await tap(p, 'Continue'); await shot('Setup · step 3');
  for (const s of ['Dose administration aids', 'Home delivery']) await p.locator('label.tick', { hasText: s }).click();
  await tap(p, 'Finish setup'); await p.waitForTimeout(500); await shot('Today · new pharmacy');
  await tap(p, 'Set up services'); await shot('Services checklist');
  await p.getByRole('button', { name: /Answer/ }).first().click(); await shot('Who runs your services');
  await p.locator('label.choice').first().click(); await tap(p, 'Save'); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Dose administration aids/ }).click(); await shot('DAA setup · question 1');
  for (let i = 0; i < 40; i++) { // answer each question with its first option
    const t = await p.evaluate(() => document.body.innerText); if (/What happens next/.test(t)) break;
    if (await p.getByRole('button', { name: 'Answer now', exact: true }).count()) { await shot('DAA · records step'); await tap(p, 'Answer now'); }
    const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) { await ch.click(); await p.waitForTimeout(60); } else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional answer'); await inp.blur(); } }
    if (i === 3) await shot('DAA setup · a later question');
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(60);
  }
  await shot('DAA · what happens next'); await tap(p, 'Save dates and finish'); await p.waitForTimeout(300); await shot('Services · next service');
  await p.getByRole('button', { name: /^Dose administration aids/ }).click(); await shot('DAA · service page');
  await p.getByRole('button', { name: /Open procedure|Draft its procedure/ }).click(); await shot('Procedure · first draft');
  // example pharmacy
  await tap(p, 'More'); await p.getByRole('button', { name: /Pharmacies on this device/ }).click(); await tap(p, 'Open the example pharmacy (fictional)'); await p.waitForTimeout(600);
  await shot('Today · example pharmacy');
  await tap(p, 'Reviews'); await shot('Reviews');
  await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await shot('S8 review · start');
  await tap(p, 'Start review'); await shot('S8 review · question 1');
  await back();
  await p.getByRole('button', { name: /^Completed/ }).click(); await shot('Reviews · completed');
  await p.locator('.row').first().click(); await shot('Record · last review'); await back();
  await tap(p, 'Actions'); await shot('Actions');
  await p.getByRole('button', { name: /fire extinguisher/ }).click(); await shot('Action · waiting');
  await p.locator('summary', { hasText: 'Full history' }).click(); await shot('Action · full history');
  await tap(p, 'Staff'); await shot('Staff');
  await p.getByRole('button', { name: /Tom Nguyen/ }).click(); await shot('Person · Tom');
  await tap(p, 'Annual check'); await shot('Annual check · Tom'); await back(); await back();
  await p.getByRole('button', { name: /Ben Carter/ }).click(); await tap(p, 'Leaving'); await shot('Leaving · Ben'); await back(); await back();
  await p.getByRole('button', { name: /Locums/ }).click(); await tap(p, 'Locum on duty · quick check'); await shot('Locum check'); await back();
  await tap(p, 'More'); await shot('More');
  for (const [label, name] of [[/^Calendar/, 'Calendar'], [/^Meetings/, 'Meetings'], [/^S8 at a glance/, 'S8 at a glance'], [/^Legal obligations/, 'Legal obligations'], [/^NSW Health dates/, 'Dates and contacts'], [/^Procedures/, 'Procedures'], [/^History/, 'History'], [/^My log/, 'My log'], [/^Pharmacy details/, 'Pharmacy details'], [/^Services/, 'Services'], [/^Bought, selling/, 'Bought, selling or closing'], [/^Backup and devices/, 'Backup'], [/^Pharmacies on this device/, 'Pharmacies']]) {
    await p.getByRole('button', { name: label }).first().click(); await shot(name);
    if (name === 'Meetings') { await p.getByRole('button', { name: /Proprietor check-in/ }).first().click(); await shot('Meeting · check-in'); await back(); }
    if (name === 'Procedures') { await p.getByRole('button', { name: /Dose administration aids/ }).click(); await shot('Procedure · DAA'); await back(); }
    if (name === 'Bought, selling or closing') { await tap(p, 'Changing how DAAs are packed?'); await shot('Tell me once · DAA'); await back(); }
    await back();
  }
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await shot('Visit · resumed check');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(shots, null, 1));
  for (const s of shots) { if (s.dup.length) ok(false, s.name + ': repeated text: ' + s.dup.slice(0, 2).join(' | ')); if (s.small.length) ok(false, s.name + ': small targets: ' + s.small.slice(0, 4).map(x => x.t + ' ' + x.w + 'x' + x.h).join(', ')); if (s.over) ok(false, s.name + ': sideways scroll'); }
  ok(shots.every(s => !s.over && !s.dup.length && !s.small.length), shots.length + ' screens: no sideways scroll, no repeated sentences, every target at least 44 px');
  // 320×568: the five main tabs must not scroll sideways
  await p.setViewportSize({ width: 320, height: 568 });
  for (const t of ['Today', 'Reviews', 'Actions', 'Staff', 'More']) { await tap(p, t); await p.waitForTimeout(150); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '320×568 ' + t + ': no sideways scroll'); }
  // P-05: the dense secondary screens at 320×568 too
  const fits = async name => { await p.waitForTimeout(200); const m = await p.evaluate(() => ({ over: document.documentElement.scrollWidth > innerWidth + 1, wide: [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.scrollx'); }).map(e => e.className || e.tagName).slice(0, 3) }));
    ok(!m.over && !m.wide.length, '320×568 ' + name + ': no sideways scroll, nothing past the edge' + (m.wide.length ? ' (' + m.wide.join(', ') + ')' : '')); };
  await tap(p, 'Today'); await p.locator('[data-act=resume-visit]').first().click(); await p.waitForTimeout(200); await otherDeviceSaves(p);
  await p.locator('label.choice:not(:has(input:checked))').first().click(); await p.waitForTimeout(600); await p.getByRole('button', { name: 'Back', exact: true }).click();
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  ok(await p.getByRole('button', { name: 'Copy its answers' }).count() === 1, '320×568 Backup shows a conflict copy'); await fits('Backup and devices · conflict copy');
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 14; i++) { const t = await p.evaluate(() => document.body.innerText); await p.locator('label.choice', { hasText: /^Satisfactory$/ }).click(); await p.waitForTimeout(60);
    if (/Dose administration aids/.test(t.split('Check ')[1] || '')) break; await p.getByRole('button', { name: 'Next', exact: true }).click(); }
  ok(await p.locator('input[name=ref]').count() === 1, '320×568 site visit reached the service evidence panel'); await p.fill('input[name=ref]', 'Packing check log (fictional)'); await p.locator('input[name=ref]').blur(); await fits('Site visit · service evidence');
  await p.getByRole('button', { name: 'Back', exact: true }).click();
  await tap(p, 'More'); await p.getByRole('button', { name: /^Evidence locations/ }).click(); await fits('Evidence locations');
  await done(b, errors);
})();
