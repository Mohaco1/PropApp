// Walks every screen by tapping, like a person, at phone size. Saves a screenshot of each and checks the measurable
// design rules: no console errors, no sideways scroll, nothing said twice, tap targets at least 44 px.
const { phone, ok, done, tap } = require('./helpers.js'); const fs = require('fs'); const path = require('path');
const OUT = path.resolve(__dirname, '../shots'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-24T10:00:00+11:00', scale: 2 });
  const shots = []; let n = 0;
  const shot = async name => {
    await p.waitForTimeout(250);
    const m = await p.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const small = [...document.querySelectorAll('button,a,summary,select,input:not([type=checkbox]):not([type=radio]):not([type=file])')].filter(e => vis(e) && !e.closest('.inline-link,.row-sub') && !e.classList.contains('inline-link')).map(e => { const r = e.getBoundingClientRect(); return { t: (e.innerText || e.name || e.getAttribute('aria-label') || '').trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) }; }).filter(x => x.h < 44 || x.w < 44);
      const lines = document.body.innerText.split(/\n+/).map(s => s.trim()).filter(s => s.length > 24);
      const dup = [...new Set(lines.filter((s, i) => lines.indexOf(s) !== i))];
      return { small, dup, over: document.documentElement.scrollWidth > innerWidth + 1, title: document.querySelector('.bar-title')?.innerText.split('\n')[0] || '' };
    });
    const file = String(++n).padStart(2, '0') + '.png'; await p.screenshot({ path: path.join(OUT, file) });
    shots.push({ n, name, file, ...m });
  };
  const back = () => p.getByRole('button', { name: 'Back' }).first().click();
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
    const ch = p.locator('form label.choice, form label.tick').first(); if (await ch.count()) { await ch.click(); await p.waitForTimeout(60); } else { const inp = p.locator('form input.input').first(); if (await inp.count()) { await inp.fill('Fictional answer'); await inp.blur(); } }
    if (i === 3) await shot('DAA setup · a later question');
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(60);
  }
  await shot('DAA · what happens next'); await p.getByRole('button', { name: /^Finish Dose/ }).click(); await p.waitForTimeout(300); await shot('DAA · service page');
  await p.getByRole('button', { name: /Draft its procedure|Open procedure/ }).click(); await shot('Procedure · first draft');
  // example pharmacy
  await tap(p, 'More'); await p.getByRole('button', { name: /Pharmacies on this device/ }).click(); await tap(p, 'Open the example pharmacy (fictional)'); await p.waitForTimeout(600);
  await shot('Today · example pharmacy');
  await tap(p, 'Reviews'); await shot('Reviews');
  await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await shot('S8 review · start');
  await tap(p, 'Start review'); await shot('S8 review · question 1');
  await back();
  await p.getByRole('button', { name: /^Done/ }).click(); await shot('Reviews · done');
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
  await tap(p, 'Today'); await p.getByRole('button', { name: 'Resume visit' }).click(); await shot('Visit · resumed check');
  await p.getByRole('button', { name: 'Back' }).click();
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(shots, null, 1));
  for (const s of shots) { if (s.over) ok(false, s.name + ': sideways scroll'); if (s.dup.length) console.log('NOTE', s.name, 'repeated text:', s.dup.slice(0, 2).join(' | ')); if (s.small.length) console.log('NOTE', s.name, 'small targets:', s.small.slice(0, 4).map(x => x.t + ' ' + x.w + 'x' + x.h).join(', ')); }
  ok(shots.every(s => !s.over), shots.length + ' screens, none scroll sideways');
  await done(b, errors);
})();
