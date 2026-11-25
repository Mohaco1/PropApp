// Sigil brief (rebrand, quarter balancer, ease-of-use), by real taps at 390×844; fails on any console error.
const { phone, ok, done, tap, text, activePh, saved, download, copied } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(require('os').tmpdir(), 'sigil-test'); fs.mkdirSync(TMP, { recursive: true });
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00', scale: 2, clip: true });
  // 1. Rebrand
  let t = await text(p);
  ok(await p.title() === 'Sigil' && /Sigil/.test(t) && /Built for the owner’s side of the counter\./.test(t) && !/R\.Pharmacy/.test(t), 'Sigil: title, wordmark and tagline on Welcome; no R.Pharmacy');
  await p.screenshot({ path: path.join(OUT, '30_sigil_welcome_390px.png') });
  const man = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../dist/pwa/manifest.webmanifest'), 'utf8'));
  ok(man.name === 'Sigil' && man.short_name === 'Sigil', 'Sigil: installable-app name and short name');
  await tap(p, 'Look around an example pharmacy (fictional)'); await p.waitForTimeout(3300);
  ok(await p.locator('header .mark').innerText() === 'S.', 'Sigil: “S.” badge in the header');
  await p.screenshot({ path: path.join(OUT, '31_sigil_today_390px.png') });
  ok(Object.keys(await saved(p)).some(k => k === 'propapp:dir'), 'Sigil: storage keys unchanged (propapp:dir), so saved data carries over');
  // a backup made now restores, and keeps the PropApp format marker that older versions read
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).click(); await p.waitForTimeout(300);
  const bk = await download(p, 'Download a backup'); const j = JSON.parse(bk);
  ok(j.app === 'PropApp' && j.product === 'Sigil' && j.format === 1, 'Sigil: backups keep their format marker (app PropApp, format 1) and name the product Sigil');
  fs.writeFileSync(path.join(TMP, 'sigil.json'), bk);
  fs.copyFileSync(path.join(TMP, 'sigil.json'), path.join(TMP, 'sigil2.json'));
  for (const f of ['sigil.json', 'sigil2.json']) { await p.locator('input[type=file]').setInputFiles(path.join(TMP, f)); await p.waitForTimeout(800); }
  ok(/Checked: every count matches the backup file/.test(await text(p)), 'Sigil: a new backup restores with every count matching');
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
  // tap to move
  const first = p.locator('.qcol[data-q="2"] .qpill').first(), name = await first.innerText(); await first.click(); await p.waitForTimeout(150);
  ok(await p.locator('.qbar').count() === 1, 'Balancer: tapping a service shows a 1-tap Feb · May · Aug · Nov bar');
  await p.locator('.qbar .chip', { hasText: 'Nov' }).click(); await p.waitForTimeout(250);
  ok(await p.locator('.qcol[data-q="11"] .qpill', { hasText: name }).count() === 1, 'Balancer: tap-to-move puts “' + name + '” in Nov');
  let ph = await activePh(p); ok(Object.values(ph.quarters || {}).includes(11) && ph.history.some(l => /Quarter Balancer/.test(l.what)), 'Balancer: the move is saved and logged');
  // drag and drop (desktop)
  const drag = p.locator('.qcol[data-q="5"] .qpill').first(), dn = await drag.innerText();
  await drag.dragTo(p.locator('.qcol[data-q="8"]')); await p.waitForTimeout(250);
  ok(await p.locator('.qcol[data-q="8"] .qpill', { hasText: dn }).count() === 1, 'Balancer: drag-and-drop moves “' + dn + '” to Aug');
  await done(b, errors);
})();
