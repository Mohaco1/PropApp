// Stage 3E (final pre-trial consolidation), by real taps at 390×844 (and the 344×882 Fold cover screen), on the
// fictional example pharmacy; fails on any unexpected console error. Pure rules are also checked straight from the
// source modules (bundled here), so Today, Calendar, the calendar file and History agree with what the screens show.
// 1. Cross-tab and arming: another tab switching pharmacy starts this tab on Today; a same-pharmacy reload keeps an
//    unsaved procedure edit; Back disarms a two-tap Stop/Delete; delete is only offered for real UAT/demo or empty
//    pharmacies ("Equator" is not "UAT"); a Later DAA item settles when its action closes; Sources can re-raise.
// 2. Staff: role typed on a failed Add stays with that form; an abandoned annual check can't overwrite a newer issue;
//    a blank last day is refused and a future one keeps the person current; role-qualified service checks.
// 3. Services, procedures: answers land on the question shown (s.pos); Next waits for an answer or Check later;
//    copying a pharmacy rebuilds its flags and keeps edited wording; blank procedure text is refused; Adopt checks the
//    draft it was opened for; a 1.1 draft keeps 1.0's annual review; 2.0 gets a fresh review date.
// 4. Reviews and visits: Save review follows the council receipt as it's typed; future review dates are refused;
//    a stopped service's review is preview only; the handover copy lists Check later items.
// 5. Dates, export, build: 29 Feb / 31 Feb aren't read as March; an extra visit doesn't tick the quarterly visit;
//    History CSV has every action event; the calendar file has staff dates beyond 30 days; a failed share isn't
//    reported as a backup; the build id covers the shell; test-all fails on a non-zero exit.
// 6. NSW wording, print and the 344 px cover: s 148 "or engaged", s 33(2)(b), s 111(3) takeover, cannabis Category 1,
//    Sublocade, mpox AIR, no "responsible person"; procedure print shows every section; History print has a thead;
//    the History date range fits 344 px.
const { phone, ok, done, tap, text, saved, activePh, download, copied } = require('./helpers.js');
const path = require('path'); const fs = require('fs'); const os = require('os'); const { execFileSync } = require('child_process');
const esbuild = require('esbuild');
const TIME = '2026-11-27T10:00:00+11:00', TODAY = '2026-11-27';
const SRC = path.resolve(__dirname, '../src'), ROOT = path.resolve(__dirname, '..');
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stage3e-'));
const ACT = async p => (await saved(p))['propapp:dir'].active;
const put = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); v === null ? tx.objectStore('kv').delete(K) : tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const patch = async (p, fn, reload = true) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph); await put(p, K, ph); if (reload) { await p.reload(); await p.waitForTimeout(900); } };
const patchDrafts = async (p, fn) => { const all = await saved(p), K = 'propapp:drafts:' + all['propapp:dir'].active, d = all[K] || {}; fn(d); await put(p, K, d); await p.reload(); await p.waitForTimeout(900); };
// What another tab does after saving: tell this tab, which reads storage again.
const ping = p => p.evaluate(() => { const ch = new BroadcastChannel('propapp'); ch.postMessage({ keys: [] }); ch.close(); });
const more = async (p, name) => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: new RegExp('^' + name) }).first().click(); await p.waitForTimeout(300); };
const back = async p => { await p.getByRole('button', { name: 'Back', exact: true }).first().click(); await p.waitForTimeout(300); };
const toast = p => p.evaluate(() => document.querySelector('.toast')?.innerText || '');
const title = p => p.evaluate(() => document.querySelector('.pane-detail .bar-title, .bar-title')?.innerText || '');
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, 'stage3e_' + n + '.png') });

// The source modules, bundled once for the pure checks (no browser needed for these).
async function modules() {
  const r = await esbuild.build({ stdin: { contents: "export * as D from './dates.js'; export * as S from './summary.js'; export * as M from './model.js'; export * as R from './rules.js'; export * as E from './export.js'; export * as I from './ics.js';", resolveDir: SRC, loader: 'js' },
    bundle: true, write: false, format: 'cjs', platform: 'node', loader: { '.json': 'json', '.css': 'text' }, logLevel: 'silent' });
  // Some modules reach views that register screens at load; a bare window and document are enough for that.
  const noop = () => {}; global.window ??= { addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }) }; global.document ??= { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] };
  const m = { exports: {} }; new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require); return m.exports;
}

(async () => {
  // ── 0. Pure rules from the source.
  const { D, S, M, R, E, I } = await modules(); D.setToday(TODAY);
  ok(!D.isDate('2026-02-29') && !D.isDate('2026-02-31') && !D.isDate('2026-13-01') && D.isDate('2028-02-29') && D.isDate('2026-11-27T10:00:00Z'), '5. isDate: 29 Feb 2026 and 31 Feb are not dates; 29 Feb 2028 is');
  const base = () => { const ph = M.emptyPharmacy('Unit Test Pharmacy (fictional)'); ph.proprietors = [{ id: 'o1', name: 'Test Owner', primary: true }]; ph.recordingAs = 'o1'; return ph; };
  { const ph = base(); ph.staff.push({ id: 's1', name: 'Alex Test', role: 'Pharmacist', active: true, services: ['prescribing'], checks: { 'service/prescribing': { result: 'ok', date: '2026-10-01', role: 'Intern' }, registration: { result: 'ok', date: '2026-10-01' } }, annualDue: '2027-03-01' });
    ok(M.credentialState(ph.staff[0], 'service/prescribing').state === 'none' && M.credentialState(ph.staff[0], 'registration').state === 'ok', '2. an Intern’s supervised prescribing-support check doesn’t verify a Pharmacist’s prescribing authority (an older check without a role still counts)');
    ok(S.items(ph).every(i => i.kind !== 'person'), '5. on screen, an annual check 94 days away isn’t on Today yet');
    const cal = I.ics(ph, {}); ok(/staff check due/.test(cal) && cal.includes('DTSTART;VALUE=DATE:20270301'), '5. the calendar file has the staff annual check 94 days ahead (more than 30)');
    const a = M.newAction(ph, { title: 'Check Alex’s CPD (fictional)', due: '2026-12-20', source: { type: 'staff', staffId: 's1', label: 'Annual check' } }); M.waitOn(ph, a.id, 'Certificate from Alex', TODAY);
    const row = S.items(ph).find(i => i.key === 'person/s1');
    ok(row && row.checkBackDue && /check back today/.test(row.sub) && row.parts.some(x => x.checkBack === TODAY), '2. a waiting staff action’s check-back date shows on the person’s Today row (' + row?.sub + ')');
    M.closeAction(ph, a.id, 'Seen it (fictional)'); M.reopenAction(ph, a.id, 'Wrong year (fictional)');
    const ev = E.historyRows(ph, { events: true }).filter(r => r.type === 'Action event').map(r => r.status);
    ok(['Raised', 'Waiting', 'Closed', 'Reopened'].every(s => ev.includes(s)) && !E.historyRows(ph).some(r => r.type === 'Action event'), '5. History CSV rows carry every action event (raised, waiting, closed, reopened); the screen list doesn’t (' + ev.join(', ') + ')');
    ok(/Reopened/.test(E.csv(ph, E.historyRows(ph, { events: true }))), '5. the CSV text includes the reopened event'); }
  { const ph = base(); ph.services.daa = { active: true, setup: 'done', answers: {} };
    ph.procedures.push({ id: 'p1', service: 'daa', title: 'DAA procedure', status: 'draft', versions: [{ v: '0.1', body: 'x', status: 'Draft', at: '2026-01-05T00:00:00Z' }, { v: '1.0', body: 'x', status: 'Adopted', at: '2026-01-10T00:00:00Z', adoptedAt: '2026-01-10T00:00:00Z' }, { v: '1.1', body: 'y', status: 'Draft', at: '2026-11-20T00:00:00Z' }] });
    const it = S.items(ph).find(i => i.key === 'procedure/daa'); ok(it && it.date === '2027-01-10', '3. saving a 1.1 draft keeps 1.0’s annual review on Today and Calendar (' + it?.date + ')');
    ph.procedures[0].reviews = [{ date: '2026-06-01', by: 'Test Owner', version: '1.0' }]; ph.procedures[0].versions.push({ v: '2.0', body: 'y', status: 'Adopted', at: '2026-11-25T00:00:00Z', adoptedAt: '2026-11-25T00:00:00Z' }); ph.procedures[0].status = 'adopted';
    ok(S.procReviewDue(ph.procedures[0]) === '2026-11-25'.replace('2026', '2027'), '3. adopting 2.0 starts a fresh 12 months (' + S.procReviewDue(ph.procedures[0]) + '), not 12 months from 1.0’s review'); }
  { const ph = base(); ph.records.push({ id: 'r1', type: 'B1', kind: 'review', date: '2026-10-01', answers: [{ answer: 'Completed' }], fields: { stockDate: '2026-10-01' } });
    ok(S.reviewDue(ph, 'B1') === '2027-01-01', '6. without a takeover the S8 check is 3 months after the last stock check');
    ph.inherited = { since: '2026-11-20' }; ok(R.s8Takeover(ph) && S.reviewDue(ph, 'B1') === '2026-11-20', '6. after a takeover (s 111(3)) the S8 inventory is due at once, not on the previous owner’s 3-month date (' + S.reviewDue(ph, 'B1') + ')');
    ph.records.push({ id: 'r2', type: 'B1', kind: 'review', date: '2026-11-22', answers: [{ answer: 'Completed' }], fields: { stockDate: '2026-11-21' } }); ok(!R.s8Takeover(ph) && S.reviewDue(ph, 'B1') === '2027-02-21', '6. once the takeover inventory is recorded, the 3-month rhythm starts from it'); }

  // ── 6. Content (wording supplied in the owner's 27 Nov brief; official pages couldn't be read from this session).
  const LAW = fs.readFileSync(path.join(SRC, 'content/law.json'), 'utf8'), RVJ = fs.readFileSync(path.join(SRC, 'content/reviews.json'), 'utf8'), VS = fs.readFileSync(path.join(SRC, 'content/verified-steps.json'), 'utf8'), LJS = fs.readFileSync(path.join(SRC, 'views/law.js'), 'utf8');
  ok(/not employed or engaged at, or financially interested in, the pharmacy/.test(LAW) && /s 148\(2\)\(a\)\(i\)/.test(LAW) && /not employed or engaged at the pharmacy \(locums and contractors count as engaged\)/.test(LJS), '6. S8 destruction witness: “or engaged” (s 148(2)(a)(i)), in Legal obligations and If something goes wrong');
  ok(/smallest pack on the market only for an aerosol or inhaler, anovulant tablets, a cream, a liquid or an ointment \(s 33\(2\)\(b\)\); never S4D or S8/.test(LAW), '6. s 33(2)(b): the smallest pack applies only to those forms, never S4D or S8');
  ok(!/responsible person/i.test(LAW) && /You, as proprietor \(the holder of a financial interest in the pharmacy, s 108\(1\)\(i\)\)/.test(LAW) && /pharmacist on duty keeps the S8 store locked/.test(LAW), '6. (Stage 3F) no “responsible person” left: s 108 reads as the proprietor; s 122(2) reads as the pharmacist on duty and the proprietor overall');
  ok(/98% or more CBD and no more than 2% other cannabinoids; Schedule 4/.test(VS) && /Categories 2–5/.test(VS) && /discontinued on 31 Dec 2026/.test(VS) && /final orders by 11 Dec 2026/.test(VS), '6. cannabis Category 1 (≥98% CBD, ≤2% other) is S4, Categories 2–5 S8; Sublocade has no new starts and ends 31 Dec 2026 (final orders 11 Dec)');
  ok(/mpox vaccine \(JYNNEOS\) opts out of AIR reporting, record the vaccination in a separate vaccine-use record/.test(RVJ) && /JYNNEOS/.test(LAW), '6. vaccination records: the mpox (JYNNEOS) AIR opt-out exception is in the review and the law summary');
  const SH = fs.readFileSync(path.join(ROOT, 'tools/test-all.sh'), 'utf8');
  ok(/rc=\$\?/.test(SH) && /exit \$status/.test(SH) && /stage3e/.test(SH), '5. test-all.sh records each suite’s exit code, fails overall on any failure, and runs stage3e');

  const { b, p, errors } = await phone({ time: TIME, clip: true });
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  const PH = await ACT(p);

  // ── 5a. Calendar: "29 Feb" (no 29 Feb in 2027) and "31 Feb" aren't read as March; "28 Feb" is.
  await more(p, 'Calendar');
  for (const [txt, good] of [['29 Feb', false], ['31 Feb', false], ['28 Feb', true]]) { await p.locator('input[name=find]').fill(txt); await tap(p, 'Find'); await p.waitForTimeout(900);
    const t = await text(p); ok(good ? /28 Feb/.test(t) && !/couldn’t read that date/.test(t) : /couldn’t read that date/.test(t) && !/\b(1|2|3) Mar\b/.test(t.split('Find a date')[1].slice(0, 120)), '5. Calendar “Find a date”: “' + txt + '” ' + (good ? 'is read' : 'is refused, not rolled into March')); }
  await back(p);

  // ── 5b. Year plan: an extra visit this month doesn't tick the overdue quarterly visit.
  await patch(p, ph => { ph.schedule.Q1 = '2026-11-22'; ph.records.push({ id: 'xv1', type: 'Q1', kind: 'visit', extra: true, title: 'Extra site visit', date: '2026-11-25', at: '2026-11-25T01:00:00Z', by: 'Test', answers: [], fields: {}, notes: '', actionIds: [] }); });
  await more(p, 'Calendar'); await p.locator('[data-act=v][data-v=year]').click(); await p.waitForTimeout(300);
  const q1cell = await p.evaluate(() => { const tr = [...document.querySelectorAll('table.yearplan tbody tr')].find(r => /site visit/i.test(r.querySelector('th').innerText)); return tr ? tr.querySelectorAll('td')[5].innerText : 'none'; });
  ok(q1cell === '●', '5. Year plan: the quarterly visit due in November shows ● (an extra visit on 25 Nov is not a ✓) (' + q1cell + ')');
  await back(p); await patch(p, ph => { ph.records = ph.records.filter(r => r.id !== 'xv1'); });

  // ── 1a. Back disarms "Stop offering this service".
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=delivery]').click(); await p.waitForTimeout(300);
  await tap(p, 'Stop offering this service'); await p.waitForTimeout(200); ok(/Tap again/.test(await toast(p)), '1. the first tap on Stop offering asks for a second tap');
  await back(p); await p.locator('[data-act=open][data-id=delivery]').click(); await p.waitForTimeout(300);
  await tap(p, 'Stop offering this service'); await p.waitForTimeout(300);
  ok((await activePh(p)).services.delivery.active === true && /Tap again/.test(await toast(p)), '1. after Back, one more tap only arms it again: the service is still offered');
  await back(p); await back(p);

  // ── 2a. Staff: a failed Add keeps its role there only; another person's edit shows their own role.
  await tap(p, 'Staff'); await p.waitForTimeout(250); await p.locator('[aria-label="Add a staff member"]').click(); await p.waitForTimeout(300);
  await p.locator('input[name=name]').fill('New Person (fictional)'); await tap(p, 'Save'); await p.waitForTimeout(300);
  ok(/Choose a role/.test(await text(p)) && await p.locator('input[name=name]').inputValue() === 'New Person (fictional)', '2. a failed Add (no role) keeps what was typed on that form');
  await back(p); await p.getByRole('button', { name: /^Tom Nguyen/ }).first().click(); await p.waitForTimeout(300); await tap(p, 'Edit details'); await p.waitForTimeout(300);
  ok(await p.locator('select[name=role]').inputValue() === 'Pharmacist', '2. Tom’s edit form shows his own role, not the blank role from the failed Add (' + await p.locator('select[name=role]').inputValue() + ')');
  await back(p);

  // ── 2b. An abandoned annual check can't save "Current" over a newer credential issue.
  await tap(p, 'Annual check'); await p.waitForTimeout(300);
  const bulk = p.getByRole('button', { name: /^Confirm these \d+ unchanged/ }); if (await bulk.count()) { await bulk.click(); await p.waitForTimeout(300); }
  const sameId = await p.evaluate(() => document.querySelector('input[type=radio][value=same]:checked')?.name.split(':')[1] || '');
  ok(!!sameId, '2. the annual check’s “Confirm unchanged” marks checks as Current (' + sameId + ')');
  await back(p);
  const tom = (await activePh(p)).staff.find(s => s.name === 'Tom Nguyen');
  await p.locator(`[data-to=cred][data-id="${tom.id}~${sameId}"]`).click(); await p.waitForTimeout(300);
  await p.locator('label', { hasText: /^Issue$/ }).first().click(); await p.waitForTimeout(300); await p.locator('input[name=n]').fill('Certificate copy unreadable (fictional)'); await tap(p, 'Save'); await p.waitForTimeout(500);
  await tap(p, 'Annual check'); await p.waitForTimeout(300);
  const stillSame = await p.evaluate(id => !!document.querySelector(`input[name="r:${id}"][value=same]:checked`), sameId);
  await tap(p, 'Save annual check'); await p.waitForTimeout(400);
  const tom2 = (await activePh(p)).staff.find(s => s.name === 'Tom Nguyen');
  ok(!stillSame && tom2.checks[sameId].result === 'issue' && /still need|needs an answer/.test(await toast(p)), '2. back in the annual check, that item is no longer “Current”, Save asks for it, and the issue stays recorded (' + tom2.checks[sameId].result + ')');
  // Update → Issue keeps the Next annual check date typed.
  const anyOk = await p.locator('input[type=radio][value=ok]').first().getAttribute('name'); await p.locator(`input[name="${anyOk}"][value=ok]`).check({ force: true }); await p.waitForTimeout(300);
  await p.locator('input[name=next]').fill('2027-10-15'); await p.locator('input[name=next]').dispatchEvent('change'); await p.waitForTimeout(200);
  await p.locator(`input[name="${anyOk}"][value=issue]`).check({ force: true }); await p.waitForTimeout(300);
  ok(await p.locator('input[name=next]').inputValue() === '2027-10-15' && await p.locator(`input[name="x:${anyOk.split(':')[1]}"]`).count() === 0, '2. changing Update to Issue redraws without the expiry box and keeps the Next annual check date');
  await back(p);

  // ── 2c. Leaving: a blank last day is refused (no crash); a future last day keeps them in current staff.
  await back(p); await p.getByRole('button', { name: /^Ben Carter/ }).first().click(); await p.waitForTimeout(300); await tap(p, 'Leaving'); await p.waitForTimeout(300);
  for (const card of await p.locator('form .card').all()) await card.locator('label', { hasText: /^Done$/ }).first().click();
  await p.locator('input[name=end]').fill(''); await tap(p, 'Move to former staff'); await p.waitForTimeout(300);
  ok(/Enter their last day/.test(await toast(p)) && (await activePh(p)).staff.find(s => s.name === 'Ben Carter').active !== false, '2. a blank last day is refused with a message, and nothing breaks');
  await p.locator('input[name=end]').fill('2026-12-05'); await tap(p, 'Move to former staff'); await p.waitForTimeout(500);
  let ben = (await activePh(p)).staff.find(s => s.name === 'Ben Carter');
  ok(ben.active !== false && ben.leaving === '2026-12-05' && /Ben Carter/.test(await text(p)), '2. a last day still to come keeps Ben in current staff until 5 Dec (' + ben.leaving + ')');
  await shot(p, 'staff_future_leaving_390px');

  // ── 3a. Services: Next waits for an answer or Check later; an answer lands on the question shown (s.pos).
  await patch(p, ph => { ph.services.aged = { active: true, setup: 'todo', answers: {} }; });
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=aged]').click(); await p.waitForTimeout(400);
  if (await p.getByRole('heading', { name: /Who runs your services/ }).count()) { await p.locator('label', { hasText: 'The pharmacist on duty' }).first().click(); await tap(p, 'Save'); await p.waitForTimeout(400); }
  await p.locator('main [data-act=step].primary').click(); await p.waitForTimeout(300);
  ok(/Question 1/.test(await text(p)) && await p.locator('main .err').count() === 1, '3. Next on a blank question stays put and says to answer it or tick Check later');
  await shot(p, 'services_blank_next_390px');
  await patch(p, ph => { ph.services.aged.pos = 2; ph.services.aged.answers = {}; });
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=aged]').click(); await p.waitForTimeout(400);
  ok(/Question 3/.test(await text(p)), '3. the setup opens at its saved place (question 3)');
  if (await p.locator('form[data-form=next] input[type=radio][name=v]').count()) await p.locator('form[data-form=next] label.choice').first().click();
  else { await p.locator('form[data-form=next] input[name=d]').fill('Fictional answer'); await p.locator('form[data-form=next] input[name=d]').dispatchEvent('change'); }
  await p.waitForTimeout(600);
  const ans = (await activePh(p)).services.aged.answers, dots = await p.evaluate(() => [...document.querySelectorAll('.prog i')].map(i => i.className));
  ok(Object.keys(ans).length === 1 && dots[0] !== 'done' && dots[1] !== 'done', '3. the answer is saved to question 3, not to the first unanswered question (' + dots.slice(0, 4).join(',') + ')');
  await back(p); await back(p);

  // ── 3b. Procedures: blank text refused; Adopt checks the draft it was opened for.
  await more(p, 'Procedures'); await p.getByRole('button', { name: /^Staged supply/ }).first().click(); await p.waitForTimeout(400);
  // Print: every section shows, and the procedure isn't blank.
  await p.emulateMedia({ media: 'print' }); await p.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await p.waitForTimeout(200);
  const pr = await p.evaluate(() => ({ wrap: getComputedStyle(document.querySelector('.docwrap, .doc.print-keep')).display, closed: [...document.querySelectorAll('details.docsec')].filter(d => !d.open).length, n: document.querySelectorAll('details.docsec').length, h: document.querySelector('h1.print-only') && getComputedStyle(document.querySelector('h1.print-only')).display, len: document.querySelector('.docwrap, .doc.print-keep').innerText.length }));
  ok(pr.wrap !== 'none' && pr.closed === 0 && pr.n > 2 && pr.h === 'block' && pr.len > 500, '6. printing a procedure shows its text with every section open and a title (' + JSON.stringify(pr) + ')');
  await p.pdf({ path: path.join(TMP, 'procedure.pdf') }).catch(() => {}); await p.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await p.emulateMedia({ media: 'screen' });
  ok(await p.evaluate(() => [...document.querySelectorAll('details.docsec')].filter(d => d.open).length) === 1, '6. after printing, the sections close again as they were');
  await tap(p, 'Edit'); await p.waitForTimeout(300); const nv0 = (await activePh(p)).procedures.find(x => x.service === 'staged').versions.length;
  await p.locator('textarea[name=body]').fill('   \n  '); await tap(p, 'Save as new version'); await p.waitForTimeout(400);
  ok(await p.locator('main .err').count() === 1 && (await activePh(p)).procedures.find(x => x.service === 'staged').versions.length === nv0, '3. a procedure of only spaces is refused, and no version is saved');
  await shot(p, 'procedure_blank_refused_390px');
  // 1b. Same pharmacy, another tab saves: the unsaved edit here stays.
  await p.locator('textarea[name=body]').fill('My unsaved wording (fictional)'); await p.waitForTimeout(100);
  await patch(p, ph => { ph.address = '9 Other Tab Street (fictional)'; }, false); await ping(p); await p.waitForTimeout(900);
  ok(await p.locator('textarea[name=body]').inputValue() === 'My unsaved wording (fictional)' && /9 Other Tab Street/.test((await activePh(p)).address), '1. another tab’s save of the same pharmacy redraws this one but keeps the unsaved procedure text');
  await tap(p, 'Cancel'); await p.waitForTimeout(300); await back(p);
  await patch(p, ph => { const q = ph.procedures.find(x => x.service === 'vaccination'); q.versions.push({ v: '0.9', body: 'Vaccination procedure (fictional), checked.\n', generated: q.versions.at(-1).generated, at: '2026-11-26T01:00:00.000Z', status: 'Draft', edited: true }); });
  await more(p, 'Procedures'); await p.getByRole('button', { name: /^Vaccination/ }).first().click(); await p.waitForTimeout(400);
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(300); ok(await p.locator('.sheet').count() === 1, '3. Adopt opens the bottom sheet for draft 0.9');
  await patch(p, ph => { const q = ph.procedures.find(x => x.service === 'vaccination'); q.versions.push({ ...q.versions.at(-1), v: '0.10', body: 'Vaccination [Confirm: who checks the fridge] (fictional)\n', at: '2026-11-27T00:30:00.000Z' }); }, false); await ping(p); await p.waitForTimeout(900);
  if (await p.locator('.sheet').count()) { await tap(p, 'Yes, adopt it'); await p.waitForTimeout(400); }
  let vq = (await activePh(p)).procedures.find(x => x.service === 'vaccination');
  ok(vq.status === 'draft' && !vq.versions.some(v => v.status === 'Adopted'), '3. a newer draft with a marker saved in between is not adopted by the old sheet’s “Yes, adopt it” (' + vq.versions.at(-1).v + ', ' + vq.status + ')');
  await patch(p, ph => { const q = ph.procedures.find(x => x.service === 'vaccination'); q.versions.push({ ...q.versions.at(-1), v: '0.11', body: 'Vaccination procedure (fictional), all checked.\n', at: '2026-11-27T00:40:00.000Z' }); });
  await more(p, 'Procedures'); await p.getByRole('button', { name: /^Vaccination/ }).first().click(); await p.waitForTimeout(400);
  // Back from the header while the sheet is up (a keyboard or screen-reader user can reach it).
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('.bar [data-act=back]').click()); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Vaccination/ }).first().click(); await p.waitForTimeout(400);
  ok(await p.locator('.sheet').count() === 0, '1. Back closes the Adopt sheet’s arming: reopening the procedure shows no sheet');
  await tap(p, 'Adopt for use here'); await p.waitForTimeout(300); await tap(p, 'Yes, adopt it'); await p.waitForTimeout(500);
  vq = (await activePh(p)).procedures.find(x => x.service === 'vaccination'); ok(vq.status === 'adopted' && vq.versions.at(-1).v === '1.0', '3. the owner’s own tap on the current draft adopts it as 1.0');
  const it10 = await p.evaluate(() => document.body.innerText.match(/next review ([^\n·]+)/)?.[1] || ''); ok(/27 Nov 2027/.test(it10), '3. 1.0 shows its next review 12 months on (' + it10.trim() + ')');
  await back(p); await back(p);

  // ── 4a. Reviews: Save review follows the council receipt as typed; a future review date is refused.
  const COP = require('../src/content/reviews.json').forms['CO-P'].questions;
  await patchDrafts(p, d => { d['review/CO-P'] = { date: TODAY, answers: Object.fromEntries(COP.map((q, i) => [i, 'Checked'])), step: COP.length, rev: Date.now() }; });
  await tap(p, 'Reviews'); await p.waitForTimeout(300); await p.locator('[data-act=open][data-id="CO-P"]').click(); await p.waitForTimeout(400);
  const saveBtn = p.getByRole('button', { name: 'Save review', exact: true });
  ok(await saveBtn.isDisabled(), '4. Save review is off until the council receipt reference is entered');
  await p.locator('input[name=receipt]').pressSequentially('RC-1234', { delay: 20 }); await p.waitForTimeout(300);
  ok(!(await saveBtn.isDisabled()) && await p.evaluate(() => document.activeElement?.name) === 'receipt', '4. typing the receipt turns Save review on straight away, with the cursor still in the box');
  await p.locator('input[name=date]').fill('2026-12-30'); await p.locator('input[name=date]').dispatchEvent('change'); await p.waitForTimeout(400);
  ok(await saveBtn.isDisabled() && /review date can’t be in the future/.test(await text(p)), '4. a future review date turns Save review off and says why');
  await shot(p, 'review_future_date_390px');
  await p.locator('input[name=date]').fill(TODAY); await p.locator('input[name=date]').dispatchEvent('change'); await p.waitForTimeout(400); await saveBtn.click(); await p.waitForTimeout(500);
  ok((await activePh(p)).records.some(r => r.type === 'CO-P' && r.fields.receipt === 'RC-1234'), '4. with the receipt and today’s date, the review saves');
  // 4b. Stopped service with an old draft: preview only.
  await patchDrafts(p, d => { d['review/service-otp'] = { date: TODAY, answers: { 0: 'No new verification', 1: 'No update', 2: 'No' }, step: 3, rev: Date.now() }; });
  await patch(p, ph => { ph.services.otp.active = false; });
  await tap(p, 'Reviews'); await p.waitForTimeout(300); await p.locator('[data-act=v], [data-change=inactive]').last().check({ force: true }).catch(() => {}); await p.waitForTimeout(300);
  await p.locator('[data-act=open][data-id="service-otp"]').first().click(); await p.waitForTimeout(400);
  ok(/Preview only/.test(await text(p)) && await p.getByRole('button', { name: 'Save review', exact: true }).count() === 0 && await p.getByRole('button', { name: 'Start review', exact: true }).count() === 0, '4. a stopped service’s review with an old draft is preview only: no Save review or Start');
  await patch(p, ph => { ph.services.otp.active = true; });

  // ── 4c. Visit handover copy lists Check later items and evidence to follow up.
  const VIS = require('../src/content/visit.json').items;
  await patchDrafts(p, d => { d['visit/quarterly'] = { date: TODAY, items: Object.fromEntries(VIS.map(i => [i.key, { status: 'ok', ev: i.core ? '' : 'Evidence reviewed' }])), vacc: { event: 'no', sighted: 'yes', auditDate: '2026-11-01' }, notes: '', next: '', step: 99, rev: Date.now() };
    d['visit/quarterly'].items.premises = { status: 'verify', text: 'Check the fridge log for October (fictional)' }; d['visit/quarterly'].items['service/daa'] = { status: 'ok', ev: 'Gap identified', ref: 'packing check log (fictional)' }; });
  await tap(p, 'Today'); await p.waitForTimeout(300); await p.getByRole('button', { name: /site visit/i }).first().click(); await p.waitForTimeout(400);
  if (await p.getByRole('button', { name: /Resume the checks/ }).count()) { await tap(p, 'Resume the checks'); await p.waitForTimeout(400); }
  const vs = await copied(p, 'Copy summary for the pharmacist on duty');
  ok(/To check later:\n- .*Check the fridge log for October/.test(vs.clip) && /Evidence to follow up:\n- .*Gap identified/.test(vs.clip) && !/No issues found/.test(vs.clip), '4. the handover copy lists Check later items and evidence gaps, and never says “No issues found” with them open');
  await back(p).catch(() => {}); await patchDrafts(p, d => { delete d['visit/quarterly']; });

  // ── 5c. History CSV export has the action events; the print table has a thead.
  await patch(p, ph => { const a = Object.values(ph.actions).find(x => x.status === 'open' && !x.source?.type); a.status = 'closed'; a.closed = { date: '2026-11-25', what: 'Serviced (fictional)', by: 'Test' }; a.log.push({ at: '2026-11-25T01:00:00Z', by: 'Test', kind: 'closed', text: 'Closed · Serviced (fictional)' }, { at: '2026-11-26T01:00:00Z', by: 'Test', kind: 'reopened', text: 'Reopened · tag missing (fictional)' }); a.status = 'open'; a.closed = null; });
  await more(p, 'History'); const csvT = await download(p, 'Download CSV');
  ok(/"Action event"/.test(csvT) && /"Reopened"/.test(csvT) && /tag missing/.test(csvT), '5. History CSV includes each action event, the reopen included');
  ok(await p.locator('.print-only table.cal thead th').count() === 6 && await p.locator('.print-only table.cal colgroup col').count() === 6, '6. the History print table has a header row (thead) and set column widths');
  await back(p);

  // ── 6a. Takeover: marking the pharmacy as just bought puts an immediate S8 inventory first.
  await patch(p, ph => { ph.schedule.B1 = '2026-12-10'; ph.records.push({ id: 's8x', type: 'B1', kind: 'review', title: 'S8', date: '2026-11-10', at: '2026-11-10T01:00:00Z', by: 'Previous owner (fictional)', answers: [{ text: 'Stock', answer: 'Completed' }], fields: { stockDate: '2026-11-10' }, notes: '', actionIds: [] }); });
  await more(p, 'Bought, selling or closing'); await tap(p, 'I’ve just bought this pharmacy'); await p.waitForTimeout(400); await back(p);
  await more(p, 'S8 at a glance'); const s8t = await text(p);
  ok(/make an S8 inventory in the drug register now \(s 111\(3\)\)/.test(s8t) && /Due today/.test(s8t), '6. after a takeover, S8 at a glance asks for the inventory now (s 111(3)), due today (' + s8t.slice(0, 300).replace(/\n/g, ' | ') + ')');
  await shot(p, 's8_takeover_390px'); await back(p);
  await patch(p, ph => { delete ph.inherited; ph.records = ph.records.filter(r => r.id !== 's8x'); });

  // ── 1c. Tell me once: a Later item settles when its action is closed. Sources can be raised again.
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=daa]').click(); await p.waitForTimeout(300); await tap(p, 'Change how DAAs are packed'); await p.waitForTimeout(300);
  await p.locator('input[name=to][value=routeA]').check({ force: true }); await tap(p, 'Show what changes'); await p.waitForTimeout(400);
  await p.getByRole('button', { name: 'Later', exact: true }).first().click(); await p.waitForTimeout(400);
  ok(/Later · an action was raised/.test(await text(p)), '1. Later raises an action and says so');
  await patch(p, ph => { const ch = ph.changes.at(-1), k = Object.keys(ch.items).find(x => ch.items[x].status === 'later'), a = ph.actions[ch.items[k].actionId]; a.status = 'closed'; a.closed = { date: TODAY, what: 'Done (fictional)', by: 'Test' }; });
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=daa]').click(); await p.waitForTimeout(300); await tap(p, 'Change how DAAs are packed'); await p.waitForTimeout(300);
  ok(!/Later · an action was raised/.test(await text(p)), '1. once its action is closed, the Later item shows as done (no longer stuck)');
  await back(p); await back(p); await back(p);
  await more(p, 'Law and sources'); await tap(p, 'Sources'); await p.waitForTimeout(400);
  const srcK = await p.locator('[data-act=changed]').first().getAttribute('data-k'); await p.locator(`[data-act=changed][data-k="${srcK}"]`).click(); await p.waitForTimeout(400);
  ok(await p.locator(`[data-act=changed][data-k="${srcK}"]`).count() === 0 && /Re-check raised/.test(await text(p)), '1. “This source changed” raises one re-check');
  await patch(p, ph => { const a = Object.values(ph.actions).find(x => x.source?.kind === 'source' && x.status === 'open'); a.status = 'closed'; a.closed = { date: TODAY, what: 'Re-checked (fictional)', by: 'Test' }; });
  await more(p, 'Law and sources'); await tap(p, 'Sources'); await p.waitForTimeout(400);
  ok(await p.locator(`[data-act=changed][data-k="${srcK}"]`).count() === 1, '1. after that re-check is closed, the same source can be raised again');
  await back(p); await back(p);

  // ── 1d. Delete is offered only for UAT/demo or truly empty pharmacies; another tab switching pharmacy resets this one.
  const dir = (await saved(p))['propapp:dir'], E1 = 'stage3e-equator', E2 = 'stage3e-blank', E3 = 'stage3e-uat';
  const blankPh = (id, name, extra = {}) => ({ id, schema: 1, name, address: '', region: '', identifier: '', proprietors: [{ id: 'o-' + id, name: 'Test Owner', primary: true }], recordingAs: 'o-' + id, services: {}, flags: {}, schedule: {}, records: [], actions: {}, staff: [], procedures: [], documents: [], log: [], history: [], obligations: {}, settings: { created: '2026-11-27T00:00:00Z', setupDone: true }, ...extra });
  await put(p, 'propapp:ph:' + E1, blankPh(E1, 'Equator Pharmacy', { log: [{ id: 'l1', date: '2026-11-20', what: 'Reported a recall (fictional)', by: 'Test Owner' }] }));
  await put(p, 'propapp:ph:' + E2, blankPh(E2, 'Blank Street Pharmacy')); await put(p, 'propapp:ph:' + E3, blankPh(E3, 'Harbour UAT copy'));
  await put(p, 'propapp:dir', { ...dir, ids: [...dir.ids, E1, E2, E3] }); await p.reload(); await p.waitForTimeout(900);
  await more(p, 'Pharmacies on this device'); await tap(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(300);
  const delFor = name => p.evaluate(n => { const r = [...document.querySelectorAll('.row.static')].find(x => x.querySelector('.row-title')?.innerText === n); return r ? [...r.querySelectorAll('button')].some(b => /Delete/.test(b.innerText)) : null; }, name);
  ok(await delFor('Equator Pharmacy') === false && await delFor('Blank Street Pharmacy') === true && await delFor('Harbour UAT copy') === true, '1. Delete: not for “Equator Pharmacy” (has a log entry; “uat” inside a word isn’t UAT), yes for an empty one and a UAT copy');
  await p.locator('.row.static', { hasText: 'Blank Street Pharmacy' }).getByRole('button', { name: 'Delete' }).click(); await p.waitForTimeout(300);
  ok(/Tap again to delete for good/.test(await text(p)), '1. the first Delete tap arms it');
  const p2 = await p.context().newPage(); await p2.goto(p.url()); await p2.waitForTimeout(1200);
  await tap(p2, 'More'); await p2.waitForTimeout(200); await p2.getByRole('button', { name: /^Pharmacies on this device/ }).first().click(); await p2.waitForTimeout(300);
  await p2.locator('[data-act=sw][data-id="' + E1 + '"]').click(); await p2.waitForTimeout(1500);
  await p.waitForTimeout(800);
  const t1 = await text(p);
  ok(/Equator Pharmacy/.test(t1) && !/Tap again to delete for good/.test(t1) && await p.locator('[data-act=back]').count() === 0, '1. another tab switching to Equator brings this tab to Equator’s Today, with no screen or armed Delete left from Wattle Grove (' + await title(p) + ')');
  await p2.close();
  await shot(p, 'crosstab_switch_today_390px');
  await p.evaluate(() => {}); const dir2 = (await saved(p))['propapp:dir']; await put(p, 'propapp:dir', { ...dir2, active: PH, ids: dir2.ids.filter(x => ![E1, E2, E3].includes(x)) }); for (const k of [E1, E2, E3]) await put(p, 'propapp:ph:' + k, null);
  await p.reload(); await p.waitForTimeout(900);

  // ── 3c. Copying a pharmacy's setup rebuilds its DAA and OTP flags and keeps edited procedure wording.
  await patch(p, ph => { const q = ph.procedures.find(x => x.service === 'daa'); q.versions.at(-1).edited = true; q.versions.at(-1).body = q.versions.at(-1).body + '\nOur own extra line (fictional).'; });
  const src = await activePh(p);
  await more(p, 'Pharmacies on this device'); await tap(p, 'Set up another pharmacy'); await p.waitForTimeout(400);
  await p.locator('input[name=name]').fill('Copy Test Pharmacy (fictional)'); await tap(p, 'Continue'); await p.waitForTimeout(300);
  await p.locator('input[name=owner0]').fill('Test Owner'); await tap(p, 'Continue'); await p.waitForTimeout(300);
  for (const s of ['daa', 'otp']) await p.locator(`input[name=svc][value=${s}]`).check({ force: true });
  await p.getByRole('button', { name: 'Wattle Grove Pharmacy', exact: true }).first().click(); await p.waitForTimeout(300);
  await tap(p, 'Finish setup'); await p.waitForTimeout(1200);
  const cp = await activePh(p);
  ok(cp.name === 'Copy Test Pharmacy (fictional)' && cp.flags.volume === src.flags.volume && cp.flags.house === src.flags.house && cp.flags.volume === true, '3. a pharmacy set up by copying gets the flags its copied answers drive (OTP 80-a-day: ' + cp.flags.volume + ', DAA on site: ' + cp.flags.house + ')');
  const cd = cp.procedures.find(x => x.service === 'daa').versions[0];
  ok(cd.edited === true && /Our own extra line/.test(cd.body), '3. a copied hand-edited procedure stays marked as edited, so a redraft won’t wipe its wording');
  await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: /^Pharmacies on this device/ }).first().click(); await p.waitForTimeout(300); await p.locator('[data-act=sw][data-id="' + PH + '"]').click(); await p.waitForTimeout(900);

  // ── 5d. A cancelled share or failed download isn't reported as a backup.
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  const q = await ctx2.newPage(); const qerr = []; q.on('pageerror', e => qerr.push(e.message));
  await q.addInitScript(() => { Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true }); Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('Share cancelled', 'AbortError')), configurable: true }); });
  await q.goto(require('./helpers.js').APP); await q.waitForTimeout(400); await tap(q, 'Try example'); await q.waitForTimeout(3400);
  await tap(q, 'More'); await q.waitForTimeout(200); await q.getByRole('button', { name: /^Backup and devices/ }).first().click(); await q.waitForTimeout(300);
  await tap(q, 'Download a backup'); await q.waitForTimeout(500);
  ok(/wasn’t saved/.test(await toast(q)) && !(await activePh(q)).settings.lastBackup, '5. a cancelled share sheet shows “wasn’t saved” and records no backup');
  ok(!qerr.length, '5. no page errors in the share test'); await ctx2.close();

  // ── 6b. Fold cover (344 × 882): the History date range fits without sideways scroll.
  await p.setViewportSize({ width: 344, height: 882 }); await p.waitForTimeout(300);
  await more(p, 'History'); await p.waitForTimeout(300);
  const hw = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cols: getComputedStyle(document.querySelector('.daterange')).gridTemplateColumns.split(' ').length, r: Math.max(...[...document.querySelectorAll('.daterange input')].map(i => i.getBoundingClientRect().right)) }));
  ok(hw.sw <= 344 && hw.cols === 1 && hw.r <= 344, '6. at 344 px the History date range stacks and nothing scrolls sideways (' + JSON.stringify(hw) + ')');
  await shot(p, 'history_daterange_344px');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await more(p, 'History');
  const hw2 = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cols: getComputedStyle(document.querySelector('.daterange')).gridTemplateColumns.split(' ').length }));
  ok(hw2.sw <= 390 && hw2.cols === 2, '6. at 390 px the From and Through boxes sit side by side');

  // ── 5e. The build id covers the HTML shell and the UAT flag, not just the script.
  const idOf = args => execFileSync('node', [path.join(ROOT, 'tools/build.js'), ...args], { cwd: ROOT }).toString().match(/built (\w+)/)[1];
  const plainId = idOf([]), uatId = idOf(['--uat']);
  const pwa = fs.readFileSync(path.join(ROOT, 'dist/pwa/index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'dist/pwa/sw.js'), 'utf8');
  ok(plainId !== uatId && pwa.includes('content="' + uatId + '"') && sw.includes(uatId) && /hash\.update\(part\)/.test(fs.readFileSync(path.join(ROOT, 'tools/build.js'), 'utf8')), '5. the build id changes with the UAT flag and is the same in the page and the offline worker (' + plainId + ' / ' + uatId + ')');

  await done(b, errors);
})().catch(e => { console.error(e); console.log('FAIL crashed: ' + e.message); process.exit(1); });
