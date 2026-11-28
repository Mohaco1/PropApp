// Consolidated brief release gates (Section 1 acceptance tests, Section 2 items, Section 3 gates 1–4), by real taps on
// the standalone HTML file at 390×844 (and 320 where noted). Fails on any console error. Two tabs share one browser
// profile, as when the owner has the app open twice.
const { phone, ok, done, tap, text, saved, activePh, download } = require('./helpers.js'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const OUT = path.resolve(__dirname, '../handoff'), TMP = path.join(OUT, 'tmp-gates'); fs.mkdirSync(TMP, { recursive: true });
const lum = c => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
(async () => {
  const { b, p, errors } = await phone({ time: '2026-11-25T10:00:00+11:00', scale: 2 });
  const more = re => tap(p, 'More').then(() => p.getByRole('button', { name: re }).first().click());
  await tap(p, 'Try example'); await p.waitForTimeout(3300);
  const watch = pg => { pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };

  // ---- Bug 1: two tabs save at the same moment; both actions survive in both tabs
  const q = await b.contexts()[0].newPage(); watch(q); await q.goto(p.url()); await q.waitForTimeout(800);
  for (const [pg, t] of [[p, 'Coastal concurrent A – freezer log (fictional)'], [q, 'Coastal concurrent B – alarm log (fictional)']]) { await tap(pg, 'Actions'); await pg.getByRole('button', { name: 'Add an action' }).click(); await pg.fill('input[name=title]', t); }
  await Promise.all([tap(p, 'Save action'), tap(q, 'Save action')]); await p.waitForTimeout(1500);
  await Promise.all([p.reload(), q.reload()]); await p.waitForTimeout(900);
  const both = async pg => Object.values((await activePh(pg)).actions).map(a => a.title).filter(t => /concurrent [AB]/.test(t)).length;
  ok(await both(p) === 2 && await both(q) === 2, 'Bug 1 two tabs saving together: both actions are in both tabs after reloading');
  // ---- Bug 1: a confirmed restore replaces cleanly; an edit made in another tab after the backup isn't blended in
  await more(/^Backup and devices/); await p.waitForTimeout(200);
  const bk = await download(p, 'Download a backup'); ok(/Backup download requested/.test(await p.evaluate(() => document.querySelector('.toast')?.innerText || '')), 'Bug 2 the toast says “Backup download requested”'); const bkFile = path.join(TMP, 'wattle-backup.json'); fs.writeFileSync(bkFile, bk);
  // ---- Bug 2: honest backup wording
  let t = await text(p);
  ok(/Last requested 25 Nov/.test(t) && /0 changes since last request/.test(t) && !/Backup downloaded/.test(t) && !/Last backup/.test(t), 'Bug 2 a download says “Last requested 25 Nov” (local date) and “0 changes since last request”; never “Backup downloaded”');
  await tap(q, 'Actions'); await q.getByRole('button', { name: 'Add an action' }).click(); await q.fill('input[name=title]', 'Post-backup edit in tab two (fictional)'); await tap(q, 'Save action'); await q.waitForTimeout(800);
  for (let i = 0; i < 2; i++) { await p.locator('input[type=file]').setInputFiles(bkFile); await p.waitForTimeout(700); }
  await Promise.all([p.reload(), q.reload()]); await p.waitForTimeout(900);
  const titles = Object.values((await activePh(p)).actions).map(a => a.title);
  ok(!titles.includes('Post-backup edit in tab two (fictional)') && titles.filter(x => /concurrent [AB]/.test(x)).length === 2, 'Bug 1 a confirmed restore replaces the pharmacy: the later edit from another tab isn’t blended in');
  await q.close();
  // ---- Gate 1: damaged backup refused (R01) and a clean export → restore round trip
  const ph0 = await activePh(p); const bad = JSON.parse(bk); bad.pharmacy.staff = undefined; fs.writeFileSync(path.join(TMP, 'damaged.json'), JSON.stringify(bad));
  await more(/^Backup and devices/); await p.locator('input[type=file]').setInputFiles(path.join(TMP, 'damaged.json')); await p.waitForTimeout(500);
  ok(/This backup is damaged \(staff\)\. Nothing was changed\./.test(await text(p)), 'Gate 1 a damaged backup with an existing id is refused');
  await p.reload(); await p.waitForTimeout(800); const ph1 = await activePh(p);
  ok(ph1.staff.length === ph0.staff.length && ph1.records.length === ph0.records.length && Object.keys(ph1.actions).length === Object.keys(ph0.actions).length, 'Gate 1 after reload the records, actions and staff are intact');
  await more(/^Backup and devices/); const rt = await download(p, 'Download a backup'); fs.writeFileSync(path.join(TMP, 'rt.json'), rt);
  fs.copyFileSync(path.join(TMP, 'rt.json'), path.join(TMP, 'rt2.json')); for (const f of ['rt.json', 'rt2.json']) { await p.locator('input[type=file]').setInputFiles(path.join(TMP, f)); await p.waitForTimeout(700); }
  t = await text(p); const ph2 = await activePh(p);
  ok(/Restored/.test(t) && ph2.records.length === ph1.records.length && Object.keys(ph2.actions).length === Object.keys(ph1.actions).length && ph2.staff.length === ph1.staff.length, 'Gate 1 export → restore round trip: same records, actions and staff');

  // ---- Bug 3: S8 incomplete + completed; S8 detail; visit next due in Today and the pack
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await tap(p, 'Start review');
  await p.locator('label.choice', { hasText: /^Incomplete$/ }).click(); await p.fill('textarea[name=issue]', 'Interrupted count (fictional)'); await tap(p, 'Next');
  for (let i = 1; i < 9; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(40); }
  await tap(p, 'Save review'); await p.waitForTimeout(300);
  await tap(p, 'Reviews'); await p.getByRole('button', { name: /S8 stock check/ }).first().click(); await p.waitForTimeout(200); t = await text(p);
  ok(/Last proprietor review\s*25 Nov by Jordan Avery · stock check incomplete/.test(t) && /Last completed stocktake\s*\d{1,2} \w{3}/.test(t) && !/Last done/.test(t), 'Bug 3 S8 detail separates “Last proprietor review” (incomplete) from “Last completed stocktake”');
  await tap(p, 'Start review'); for (let i = 0; i < 9; i++) { await p.locator('label.choice').first().click(); await p.waitForTimeout(40); await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(40); }
  await p.fill('input[name=stockDate]', '2026-11-24'); await p.fill('input[name=stockBy]', 'Priya Sharma (fictional)'); await p.locator('input[name=stockBy]').blur(); await tap(p, 'Save review'); await p.waitForTimeout(300);
  await tap(p, 'Today'); await p.getByRole('button', { name: /Proprietor site visit/ }).first().click(); await tap(p, 'Start the checks');
  for (let i = 0; i < 16; i++) { if (await p.getByRole('button', { name: 'Save visit' }).count()) break; await p.locator('label.choice', { hasText: /^Satisfactory$/ }).first().click(); await p.waitForTimeout(40);
    if (await p.locator('input[name=vaccEvent]').count()) { await p.locator('label.choice', { hasText: /^No$/ }).first().click(); await p.locator('label.choice', { hasText: /^Yes$/ }).last().click(); await p.fill('input[name=vaccDate]', '2026-10-01'); await p.locator('input[name=vaccDate]').blur(); }
    if (await p.locator('label.choice', { hasText: 'Verified operational review' }).count()) await p.locator('label.choice', { hasText: 'Verified operational review' }).click();
    await p.getByRole('button', { name: /^(Next|Finish)$/ }).click(); await p.waitForTimeout(60); }
  const visitNext = await p.locator('input[name=next]').inputValue(); await tap(p, 'Save visit'); await p.waitForTimeout(400);
  await more(/^Evidence pack/); await p.waitForTimeout(300);
  const pk = await p.evaluate(() => { const secs = [...document.querySelectorAll('.psec')], s8 = secs.find(s => /^S8 stock checks/.test(s.querySelector('h2').innerText)), rv = secs[0];
    return { s8h: s8.querySelector('h2').innerText, s8rows: [...s8.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.innerText)), visit: [...rv.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.innerText)).find(r => /^Site visit|Proprietor site visit/.test(r[1])), revS8: [...rv.querySelectorAll('tbody tr')].map(r => r.cells[1].innerText).filter(x => /^S8/.test(x)) }; });
  ok(pk.revS8.filter(x => / \(incomplete\)$/.test(x)).length === 1, 'B1 the incomplete S8 review says “(incomplete)” in the Reviews table (' + pk.revS8.slice(0, 2).join(' / ') + ')');
  ok(/^S8 stock checks · \d+ completed stocktakes? · 1 incomplete review$/.test(pk.s8h) && pk.s8rows.some(r => r[1] === 'Incomplete review') && pk.s8rows.some(r => r[1] === 'Completed stocktake'), 'Bug 3 pack: “' + pk.s8h + '”, each row labelled Completed stocktake or Incomplete review');
  const dm = await import('file://' + path.resolve(__dirname, '../src/dates.js'));
  ok(pk.visit && pk.visit[4] === dm.fmt(visitNext), 'Bug 3 the new site visit’s Next due in the pack (' + (pk.visit?.[4] || 'blank') + ') matches what was saved (' + dm.fmt(visitNext) + ')');
  // ---- Section 2: demo S8 pharmacist
  ok(pk.s8rows.some(r => r[3] === 'Priya Sharma (fictional)') && !pk.s8rows.some(r => /filing cabinet/.test(r[3])), 'Section 2 Wattle Grove’s S8 pharmacist reads “Priya Sharma (fictional)”, not a cupboard');
  // ---- Gate 3: real A4 PDF of the pack
  await p.emulateMedia({ media: 'print' }); await p.pdf({ path: path.join(OUT, 'evidence-pack-example.pdf'), format: 'A4', printBackground: true }); await p.emulateMedia({ media: 'screen' });
  const pdfText = execFileSync('pdftotext', ['-layout', path.join(OUT, 'evidence-pack-example.pdf'), '-']).toString();
  ok(/completed stocktakes? · 1 incomplete review/.test(pdfText) && /Incomplete review/.test(pdfText) && /Staff checks closed/.test(pdfText) && /made 25 Nov 2026/.test(pdfText) && pdfText.includes(dm.fmt(visitNext).split(' ').slice(0, 2).join(' ')), 'Gate 3 A4 PDF: S8 split header and labels, visit next due, staff summary, 4-digit years');

  // ---- Bug 6 / F-LIVE-05: a source-change action has a short title and lists the places on the action
  await more(/^Law and sources/); await tap(p, 'Sources'); await p.getByRole('button', { name: 'This source changed' }).first().click(); await p.waitForTimeout(300);
  const src = Object.values((await activePh(p)).actions).find(a => /^Re-check after a change to/.test(a.title));
  ok(src && src.title.length < 90 && src.recheck?.length > 3, 'F-LIVE-05 “' + src?.title + '” (' + src?.recheck?.length + ' places listed on the action)');
  await tap(p, 'Today'); await p.locator('[aria-label=Search]').click(); await p.fill('input[name=q]', 'Re-check'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => [...document.querySelectorAll('#sr .row-title')].every(e => e.getBoundingClientRect().height <= 3 * 1.6 * parseFloat(getComputedStyle(e).fontSize))), 'F-LIVE-05 search results show at most 3 lines per title');
  await tap(p, 'Actions'); await p.getByRole('button', { name: /^Re-check after a change to/ }).first().click();
  ok(/What to look at again · \d+/i.test(await text(p)), 'F-LIVE-05 the action screen lists what to look at again');
  // ---- F-LIVE-08: adopted procedure body never says "Draft generated"
  await more(/^Procedures/); await p.getByRole('button', { name: /Staged supply/ }).click(); await tap(p, 'Adopt for use here'); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(300);
  t = await p.locator('.doc').first().innerText(); ok(!/Draft generated/.test(t) && /Adopted procedure \(version 1\.0, adopted 25 Nov\)/.test(t), 'F-LIVE-08 adopted v1.0 says “Adopted procedure (version 1.0, adopted 25 Nov)”, not “Draft generated”');
  // ---- Bug 5 + Codex #07: meeting banner only when something was filled in; privacy hint beside the patient-safety box
  await more(/^Meetings/); await p.getByRole('button', { name: /Proprietor check-in/ }).first().click(); await p.waitForTimeout(200);
  const m = await p.evaluate(() => ({ banner: /Filled in from your last meeting/.test(document.body.innerText), filled: [...document.querySelectorAll('input[name=who]')].some(x => x.checked) || [...document.querySelectorAll('textarea')].some(x => x.value.trim()), hint: document.querySelector('textarea[name=s0]')?.parentElement.querySelector('.hint')?.innerText }));
  ok(m.banner === m.filled, 'Bug 5 the “Filled in” banner shows only when something was filled in (banner ' + m.banner + ', filled ' + m.filled + ')');
  ok(m.hint === 'No patient names or identifiers.', 'Codex #07 “No patient names or identifiers.” sits beside the incidents and patient-safety box');
  await p.fill('textarea[name=s0]', 'Near miss: wrong strength picked, caught at check (fictional)'); await tap(p, 'Save meeting'); await p.waitForTimeout(300);
  await more(/^Meetings/); await p.getByRole('button', { name: /Proprietor check-in/ }).first().click(); await p.waitForTimeout(200);
  ok(/Filled in from your last meeting \(25 Nov\)/.test(await text(p)) && await p.locator('textarea[name=s0]').inputValue() === 'Near miss: wrong strength picked, caught at check (fictional)', 'Bug 5 a meeting that really carries notes over says so');
  // ---- F-LIVE-09 year plan legend; F-LIVE-10 copy
  await more(/^Calendar/); await tap(p, 'Year plan'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const l = document.querySelector('.yp-legend'); return /overdue/.test(l.innerText) && getComputedStyle(l.querySelector('.bad')).color !== getComputedStyle(l.querySelector('.due')).color; }), 'F-LIVE-09 the legend shows red overdue and blue due dots');
  await tap(p, 'Actions'); await p.getByRole('button', { name: /fire extinguisher/ }).click();
  ok(await p.getByRole('button', { name: 'Got it · close it' }).count() === 1, 'F-LIVE-10 the waiting action says “Got it · close it”');

  // ---- Section 2: archive and delete
  await tap(p, 'Today'); await p.locator('.ph-switch').click(); await tap(p, 'Set up another pharmacy'); await p.fill('input[name=name]', 'Zero Overdue Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.fill('input[name=owner0]', 'Sam'); await tap(p, 'Continue'); await p.locator('label.tick', { hasText: 'Home delivery' }).click(); await tap(p, 'Finish setup'); await p.waitForTimeout(400);
  // ---- Bug 4 + Gate 4: active All tile readable on a 0-overdue pharmacy, light and dark
  for (const scheme of ['light', 'dark']) { await p.emulateMedia({ colorScheme: scheme }); await p.waitForTimeout(150);
    // Stage 3G-B: the Today ruled index keeps the open tab transparent, so contrast is read against the first painted background behind it.
    const c = await p.evaluate(() => { const on = document.querySelector('.filters button.on'); let e = on, bg = 'rgb(255, 255, 255)'; while (e) { const x = getComputedStyle(e).backgroundColor; if (x && x !== 'transparent' && !/rgba\(.*, 0\)$/.test(x)) { bg = x; break; } e = e.parentElement; } return { f: on.dataset.f, bg, b: getComputedStyle(on.querySelector('b')).color, s: getComputedStyle(on.querySelector('span')).color }; });
    ok(c.f === 'all' && ratio(c.b, c.bg) >= 4.5 && ratio(c.s, c.bg) >= 4.5, 'Bug 4 phone in ' + scheme + ' mode (app is light only): active All tile count ' + ratio(c.b, c.bg).toFixed(1) + ':1 and label ' + ratio(c.s, c.bg).toFixed(1) + ':1 (≥ 4.5)');
    await p.screenshot({ path: path.join(OUT, scheme === 'dark' ? '13b_today_phone_dark_setting_390px.png' : '13_today_zero_overdue_390px.png') }); }
  // contrast sweep with the phone in dark mode (the app stays light): every visible text on a few screens has ≥ 4.5:1 against its background card or page (Gate 4)
  const sweep = async name => { const bad = await p.evaluate(() => { const L = c => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const bgOf = e => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return getComputedStyle(document.body).backgroundColor; };
      const out = []; for (const e of document.querySelectorAll('main *, .bar *, .nav *')) { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || !e.getClientRects().length) continue;
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < 0.5 || e.closest('button:disabled')) continue; const a = L(cs.color), b = L(bgOf(e)); const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); const big = parseFloat(cs.fontSize) >= 18.66 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 600);
        if (r < (big ? 3 : 4.5)) out.push(e.innerText.trim().slice(0, 30) + ' ' + r.toFixed(1)); } return out.slice(0, 5); });
    ok(bad.length === 0, 'Gate 4 (phone in dark mode, app light) ' + name + ': no text below AA contrast' + (bad.length ? ' (' + bad.join(' | ') + ')' : '')); };
  await sweep('Today (0 overdue)'); await tap(p, 'Reviews'); await sweep('Reviews'); await tap(p, 'More'); await sweep('More');
  await p.emulateMedia({ colorScheme: 'light' });
  await more(/^Pharmacies on this device/); await tap(p, 'Archive or delete a pharmacy');
  t = await text(p); ok(/Wattle Grove Pharmacy/.test(t) && !/Zero Overdue Test Pharmacy[\s\S]*Archive/.test(t.split('Wattle Grove')[0]), 'Section 2 the open pharmacy isn’t offered; others are');
  await p.getByRole('button', { name: 'Archive' }).first().click(); await p.waitForTimeout(300);
  await tap(p, 'Today'); ok(await p.locator('.siteline').count() === 0, 'Section 2 an archived pharmacy leaves the cross-pharmacy line and counts');
  await more(/^Pharmacies on this device/); t = await text(p); ok(/ARCHIVED · 1/i.test(t) && /Records kept/.test(t), 'Section 2 archived pharmacies are listed with their records kept');
  await p.getByRole('button', { name: /Wattle Grove Pharmacy[\s\S]*Unarchive/ }).click(); await p.waitForTimeout(200);
  ok(!/ARCHIVED ·/i.test(await text(p)), 'Section 2 unarchive brings it back');
  await p.getByRole('button', { name: /^Wattle Grove Pharmacy/ }).click(); await p.waitForTimeout(400); await more(/^Pharmacies on this device/);
  await tap(p, 'Archive or delete a pharmacy'); ok(await p.getByRole('button', { name: /^Delete/ }).count() === 1, 'Section 2 Delete is offered for the fictional pharmacy (after switching away from it)');
  await p.getByRole('button', { name: 'Delete', exact: true }).click(); await p.waitForTimeout(150);
  ok(/This can’t be undone/.test(await text(p)) && await p.getByRole('button', { name: 'Download its backup' }).count() === 1, 'Section 2 Delete asks again and offers a backup first');
  await p.getByRole('button', { name: 'Tap again to delete for good' }).click(); await p.waitForTimeout(400);
  const all = await saved(p); ok(all['propapp:dir'].ids.length === 1 && Object.keys(all).filter(k => k.startsWith('propapp:ph:')).length === 1, 'Section 2 the second tap deletes it from this device');
  fs.rmSync(TMP, { recursive: true, force: true });
  await done(b, errors);
})();
