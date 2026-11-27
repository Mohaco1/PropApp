// Stage 2 · safe v41 parity (M-06, M-07, L-02), by real taps on the fictional example at 390 × 844 (and the Staff
// chips at 344 px too); fails on any console error.
const { phone, ok, done, tap, text, saved, activePh, download } = require('./helpers.js');
const fs = require('fs'); const path = require('path');
const TIME = '2026-11-27T10:00:00+11:00', TODAY = '2026-11-27';
const TMP = path.resolve(__dirname, '../handoff/tmp'); fs.mkdirSync(TMP, { recursive: true });
const SHOT = n => path.resolve(__dirname, '../handoff/parity_' + n + '.png');
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(300); };
const put = (p, entries) => p.evaluate(async entries => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); for (const [k, v] of entries) tx.objectStore('kv').put(v, k); tx.oncomplete = res; }); }, entries);
const rowNames = p => p.evaluate(() => [...document.querySelectorAll('main .list .row-title')].map(x => x.innerText));
// Each Staff chip: one line, at least 44 px tall, inside the screen; all on one row.
const chipFit = p => p.evaluate(() => { const cs = [...document.querySelectorAll('.staff-chips .chip')], W = document.documentElement.clientWidth;
  const tops = new Set(cs.map(c => Math.round(c.getBoundingClientRect().top)));
  return { n: cs.length, oneRow: tops.size === 1, each: cs.every(c => { const r = c.getBoundingClientRect(), lh = parseFloat(getComputedStyle(c).lineHeight) || 20; return r.height >= 44 && r.right <= W && r.left >= 0 && c.scrollWidth <= c.clientWidth + 1 && [...c.childNodes].every(() => true) && c.getClientRects().length === 1 && (r.height - 16) < lh * 1.9; }), sideways: document.documentElement.scrollWidth > W }; });

(async () => {
  // ── M-06 chips at the 344 px cover screen
  { const { b, p, errors } = await phone({ time: TIME, viewport: { width: 344, height: 882 }, scale: 2 });
    await tap(p, 'Try example'); await p.waitForTimeout(3400); await tap(p, 'Staff'); await p.waitForTimeout(300);
    const f = await chipFit(p); ok(f.n === 3 && f.oneRow && f.each && !f.sideways, 'M-06 344 px: All / Needs review / Coming up chips are on one row, single-line, 44 px+, no sideways scroll');
    await p.screenshot({ path: SHOT('staff_344px') });
    await b.close(); if (errors.length) ok(false, 'no console errors (344 px): ' + errors.slice(0, 3).join(' | ')); }

  const { b, p, errors } = await phone({ time: TIME, scale: 2 });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);

  // ── M-06: Staff filters and search
  await tap(p, 'Staff'); await p.waitForTimeout(300);
  const f390 = await chipFit(p); ok(f390.n === 3 && f390.oneRow && f390.each && !f390.sideways, 'M-06 390 px: the three chips fit on one row, single-line, 44 px+');
  const chipText = await p.evaluate(() => [...document.querySelectorAll('.staff-chips .chip')].map(c => c.innerText.replace(/\s+/g, ' ').trim()));
  ok(chipText.join('|') === 'All 4|Needs review 1|Coming up 2', 'M-06 chips show counts (' + chipText.join(', ') + ')');
  await p.screenshot({ path: SHOT('staff_filters_390px') });
  await p.locator('.staff-chips .chip', { hasText: 'Needs review' }).tap(); await p.waitForTimeout(200);
  ok((await rowNames(p)).join() === 'Ben Carter', 'M-06 “Needs review” shows only the person with checks to do (' + (await rowNames(p)).join(', ') + ')');
  await p.locator('.staff-chips .chip', { hasText: 'Coming up' }).tap(); await p.waitForTimeout(200);
  ok((await rowNames(p)).sort().join() === 'Priya Sharma,Tom Nguyen', 'M-06 “Coming up” shows the two people with something due within 30 days');
  await p.locator('.staff-chips .chip', { hasText: 'All' }).first().tap(); await p.waitForTimeout(200);
  await p.locator('main input[name=q]').fill('grace'); await p.waitForTimeout(250);
  ok((await rowNames(p)).join() === 'Grace Li', 'M-06 search “grace” finds Grace Li only');
  ok(await p.evaluate(() => document.activeElement?.name === 'q'), 'M-06 the search box keeps focus while typing');
  await p.locator('main input[name=q]').fill('zzz'); await p.waitForTimeout(250);
  ok(/Nobody matches “zzz”/.test(await text(p)), 'M-06 a search with no match says so');
  await p.locator('main input[name=q]').fill(''); await p.waitForTimeout(250);
  ok((await rowNames(p)).length === 4, 'M-06 clearing the search shows everyone again');

  // ── M-06: verify one credential without the annual check
  const before = (await activePh(p)).staff.find(x => x.name === 'Tom Nguyen');
  await p.getByRole('button', { name: /^Tom Nguyen/ }).click(); await p.waitForTimeout(300);
  const credRows = p.locator('main .sec .list .row[data-to="cred"]');
  ok(await credRows.count() >= 3, 'M-06 each credential row on Tom’s page is tappable (' + await credRows.count() + ' rows)');
  const credSizes = await credRows.evaluateAll(rs => rs.map(r => r.getBoundingClientRect().height)); ok(credSizes.every(x => x >= 44), 'M-06 credential rows are 44 px+ tall');
  const label = (await credRows.first().locator('.row-title').innerText()).trim(); await credRows.first().tap(); await p.waitForTimeout(300);
  ok((await p.locator('.bar-title').innerText()).startsWith(label), 'M-06 tapping “' + label + '” opens that one credential');
  ok(/last time/i.test(await text(p)) && /annual check date doesn’t change/i.test(await text(p)), 'M-06 the screen shows last time’s check and says the annual check is unchanged');
  await p.screenshot({ path: SHOT('credential_390px') });
  await tap(p, 'Save'); await p.waitForTimeout(250); ok(/Choose an answer/.test(await text(p)), 'M-06 Save with no answer asks for one (nothing saved)');
  await p.locator('main label.choice', { hasText: /Seen it|Verified/ }).tap(); await p.waitForTimeout(250);
  await p.selectOption('main select[name=m]', { index: 1 }); await p.fill('main input[name=x]', '2027-11-30'); await p.fill('main input[name=f]', 'Register checked');
  await p.waitForTimeout(900); await tap(p, 'Save'); await p.waitForTimeout(400);
  const after = (await activePh(p)), tom = after.staff.find(x => x.name === 'Tom Nguyen'), qid = Object.keys(tom.checks).find(k => tom.checks[k].date === TODAY && tom.checks[k].ref === 'Register checked');
  ok(!!qid && tom.checks[qid].result === 'ok' && tom.checks[qid].expiry === '2027-11-30', 'M-06 saving updates only that credential (verified today, valid until 30 Nov 2027)');
  ok(tom.annualDue === before.annualDue && Object.keys(tom.checks).filter(k => k !== qid).every(k => JSON.stringify(tom.checks[k]) === JSON.stringify(before.checks?.[k])), 'M-06 the other checks and the annual check date are unchanged');
  ok(after.records.some(r => r.title === 'Credential check · ' + label + ' · Tom Nguyen' && r.date === TODAY && r.answers.length === 1), 'M-06 a one-item credential check is recorded for History');
  ok((await p.locator('.bar-title').innerText()).startsWith('Tom Nguyen'), 'M-06 Save returns to Tom’s page');
  // an issue on a single credential raises one action
  await p.locator('main .sec .list .row[data-to="cred"]').nth(1).tap(); await p.waitForTimeout(300);
  const label2 = (await p.locator('.bar-title').innerText()).trim();
  await p.locator('main label.choice', { hasText: 'Issue' }).tap(); await p.waitForTimeout(250); await p.fill('main input[name=n]', 'Certificate copy missing'); await tap(p, 'Save'); await p.waitForTimeout(400);
  const acts = Object.values((await activePh(p)).actions).filter(a => a.status === 'open' && a.title === label2 + ' · Tom Nguyen: Certificate copy missing');
  ok(acts.length === 1, 'M-06 an issue on one credential raises one action');

  // ── L-02: document references with a link and who keeps them
  await more(p, /^Procedures/); await tap(p, '+ Add a document reference'); await p.waitForTimeout(300);
  await p.fill('main input[name=title]', 'Cold chain policy'); await p.fill('main input[name=url]', 'javascript:alert(1)'); await p.fill('main input[name=owner]', 'Practice manager');
  await tap(p, 'Save'); await p.waitForTimeout(300); ok(/starting with https:\/\//.test(await text(p)) && !(await activePh(p)).documents.some(d => d.title === 'Cold chain policy'), 'L-02 a javascript: link is refused (nothing saved)');
  await p.fill('main input[name=url]', 'http://example.org/policy'); await tap(p, 'Save'); await p.waitForTimeout(300);
  ok(!(await activePh(p)).documents.some(d => d.title === 'Cold chain policy'), 'L-02 an http:// link is refused too');
  await p.fill('main input[name=url]', 'https://example.org/cold-chain'); await tap(p, 'Save'); await p.waitForTimeout(400);
  const docRow = p.locator('main .rowwrap', { hasText: 'Cold chain policy' });
  ok(/kept by Practice manager/.test(await docRow.innerText()), 'L-02 the document row shows who keeps it');
  const a = await docRow.locator('a.doclink').evaluate(x => ({ href: x.href, t: x.target, rel: x.rel, hgt: x.getBoundingClientRect().height, wid: x.getBoundingClientRect().width, txt: x.innerText }));
  ok(a.href === 'https://example.org/cold-chain' && a.t === '_blank' && /noopener/.test(a.rel) && a.hgt >= 44 && a.wid >= 44 && a.txt === 'Open link', 'L-02 “Open link” is an https link, new tab, rel=noopener, 44 px+ (' + Math.round(a.wid) + '×' + Math.round(a.hgt) + ')');
  await p.screenshot({ path: SHOT('procedures_docref_390px') });
  await docRow.locator('.row').tap(); await p.waitForTimeout(300);
  ok(await p.locator('main .lasttime a.doclink[href="https://example.org/cold-chain"]').count() === 1, 'L-02 the document reference screen has the same Open link');
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.waitForTimeout(250);

  // ── L-02: S8 at a glance shows the S8 setup answers
  await more(p, /^S8 at a glance/);
  const s8 = await text(p);
  ok(/Your S8 setup · \d+/i.test(s8) && /Who places S8 medicines into packs\?/.test(s8) && /Pharmacist physically places S8 medicines in packs/.test(s8), 'L-02 S8 at a glance lists the S8 setup answers (DAA: who places S8 in packs)');
  ok(/Are controlled medicines delivered\?/.test(s8) && /Home delivery · Yes/.test(s8), 'L-02 the summary covers every service that has S8 answers (home delivery)');
  ok(await p.getByRole('button', { name: 'S8 stock check' }).isVisible(), 'L-02 the S8 stock check button is still the main button');
  await p.locator('main .row', { hasText: 'Who places S8 medicines into packs?' }).scrollIntoViewIfNeeded(); await p.screenshot({ path: SHOT('s8_setup_390px') });
  await p.locator('main .row', { hasText: 'Who places S8 medicines into packs?' }).tap(); await p.waitForTimeout(300);
  ok(/Dose administration aids/.test(await p.locator('.bar-title').innerText()), 'L-02 tapping an S8 answer opens that service');

  // ── M-07: History CSV is complete, has a BOM and guards formulas
  const ph1 = await activePh(p);
  ph1.log.push({ id: 'f1', date: TODAY, what: '  =HYPERLINK("http://x")', kind: 'Other', ref: '\t-2+3', by: '' }, { id: 'f2', date: TODAY, what: '@SUM(1)', kind: 'Other', ref: '', by: '' });
  await put(p, [['propapp:ph:' + ph1.id, ph1]]); await p.reload(); await p.waitForTimeout(800);
  await more(p, /^History/);
  const csv = await download(p, 'Download CSV'), lines = csv.split('\r\n');
  ok(csv.charCodeAt(0) === 0xFEFF && lines[0].slice(1).startsWith('"Pharmacy","Date"'), 'M-07 the CSV starts with a UTF-8 BOM, then the header');
  ok(lines.some(l => l.includes('"\'  =HYPERLINK(""http://x"")"')) && lines.some(l => l.includes('"\'@SUM(1)"')), 'M-07 = and @ cells are guarded, even after leading spaces');
  ok(lines.some(l => /"'Other · \t-2\+3"|"Other · \t-2\+3"/.test(l)) && !lines.some(l => /,"[=+\-@]/.test(l) || /,"\s+[=+\-@]/.test(l)), 'M-07 no cell starts with a formula character (with or without leading spaces)');
  const ph2 = await activePh(p), DUP = /^(Recorded · |Action raised · |Action closed · |My log · )/;
  const want = ph2.history.filter(x => typeof x.what === 'string' && !DUP.test(x.what)).length, got = lines.filter(l => /^"[^"]*","[^"]*","Change"/.test(l.replace(/^﻿/, ''))).length;
  ok(want > 0 && got === want, 'M-07 every History event that isn’t already a review, action or log row is in the CSV (' + got + ' of ' + want + ')');
  for (const [re, cat] of [[/Procedure (adopted|drafted|reviewed|wording edited)|Saved unapproved procedure draft/, 'Procedure'], [/Service (added|stopped)|Confirmed services provided/, 'Service'], [/Evidence location saved/, 'Evidence'], [/Reminder changed|Due date · /, 'Calendar'], [/Document reference saved/, 'Document']]) {
    const inHist = ph2.history.some(x => re.test(x.what)); if (!inHist) continue;
    ok(lines.some(l => re.test(l) && l.includes('"' + cat + '"')), 'M-07 ' + cat + ' events are in the CSV, labelled ' + cat);
  }
  ok(lines.some(l => /Document reference saved · Cold chain policy/.test(l)), 'M-07 the document saved in this test is in the CSV');

  // ── M-07: checkPharmacy refuses damaged parts (nothing changed)
  const base = await activePh(p), mk = (name, patch) => { const f = path.join(TMP, 'parity-' + name + '.json'); fs.writeFileSync(f, JSON.stringify({ app: 'PropApp', format: 1, exportedAt: new Date().toISOString(), pharmacy: { ...JSON.parse(JSON.stringify(base)), ...patch }, drafts: {} })); return f; };
  for (const [name, patch, msg] of [['documents', { documents: 'x' }, 'documents'], ['settings', { settings: [] }, 'settings'], ['schedule', { schedule: { B1: 5 } }, 'schedule (a date is damaged)'],
    ['proprietors', { proprietors: [1] }, 'proprietors (an entry is damaged)'], ['log', { log: {} }, 'log'], ['versions', { procedures: [{ service: 'daa', versions: 'x' }] }, 'procedures (versions are damaged)'],
    ['answers', { records: [{ ...base.records[0], answers: [null] }] }, 'records (an entry is damaged)']]) {
    await more(p, /^Backup and devices/); await p.locator('input[type=file]').setInputFiles(mk(name, patch)); await p.waitForTimeout(500);
    const t = await text(p), same = JSON.stringify(await activePh(p)) === JSON.stringify(base);
    ok(t.includes('This backup is damaged (' + msg + '). Nothing was changed.') && same, 'M-07 a backup with damaged ' + name + ' is refused and nothing changes');
  }
  // an older backup without documents or log still restores (they are added empty)
  const old = JSON.parse(JSON.stringify(base)); delete old.documents; delete old.log; old.id = 'parity-old'; old.name = 'Older backup pharmacy';
  const fOld = path.join(TMP, 'parity-old.json'); fs.writeFileSync(fOld, JSON.stringify({ app: 'PropApp', format: 1, exportedAt: new Date().toISOString(), pharmacy: old, drafts: {} }));
  await more(p, /^Backup and devices/); await p.locator('input[type=file]').setInputFiles(fOld); await p.waitForTimeout(900);
  const restored = (await saved(p))['propapp:ph:parity-old'];
  ok(!!restored && Array.isArray(restored.documents) && Array.isArray(restored.log), 'M-07 an older backup without documents or log still restores (added empty)');
  await done(b, errors);
})().catch(e => { console.log('FAIL crashed: ' + e.message); process.exit(1); });
