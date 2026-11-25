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
  await done(b, errors);
})();
