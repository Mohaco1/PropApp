// Walk-In Briefing (28 Nov, owner brief): the read-only strip on top of Today. Real taps on the fictional example
// pharmacy, with its saved data rewritten between scenes (as another device would); fails on any console error.
// Covers: the S8 slot (takeover, inventory limit from s8Limit() and never s8Max(), takeover soon, missing stocktake,
// planned review, an incomplete count never resetting the clock), the one-job slot (overdue, due today, check-back,
// next 7 days, credential 8–30 days, a waiting check-back holding back an early nudge, one row per person), the
// handover slot ("Needs verification" cleared by Checked / Issue / N/A, left open by a skipped item), the quiet day,
// that the strip changes nothing, and the Swiss Clinical layout at 390×844, 344×882 and 840×900.
const { phone, ok, done, saved, activePh } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const TODAY = '2026-11-26';
const add = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const put = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph); await put(p, K, ph); await p.reload(); await p.waitForTimeout(900); };
const brief = p => p.evaluate(() => { const o = {}; for (const b of document.querySelectorAll('.brief [data-slot]')) o[b.dataset.slot] = { title: b.querySelector('.brief-title')?.innerText || b.innerText, sub: b.querySelector('.brief-sub')?.innerText || '', right: b.querySelector('.brief-date')?.innerText || '', key: b.dataset.key || '' }; return o; });
const stock = (id, date, extra = {}) => ({ id, type: 'B1', kind: 'review', title: 'S8', date, at: date + 'T01:00:00.000Z', by: 'Test Owner (fictional)', answers: [{ text: 'Stock', answer: extra.incomplete ? 'Incomplete' : 'Completed' }], fields: { stockDate: date, ...(extra.incomplete ? { stockIncomplete: true } : {}) }, notes: '', actionIds: [] });
const visit = (id, date, answers) => ({ id, type: 'Q1', kind: 'visit', title: 'Site visit', date, at: date + 'T02:00:00.000Z', by: 'Test Owner (fictional)', notes: '', actionIds: [], fields: {}, answers: answers.map(([item, text, answer]) => ({ item, text, answer, isIssue: answer === 'Issue', note: '', ref: '' })) });
const action = (id, title, due, waiting) => ({ id, title, status: 'open', due, created: TODAY + 'T00:00:00.000Z', source: { type: 'manual' }, log: [], ...(waiting ? { waiting: { who: 'Supplier (fictional)', checkBack: waiting } } : {}) });
// A calm baseline: a completed count 10 days ago, every review two months off, no actions, staff, procedures or visits.
const calm = ph => { delete ph.inherited; ph.records = ph.records.filter(r => !['B1', 'Q1'].includes(r.type)); ph.records.push(stock('s8base', add(TODAY, -10)));
  for (const k of Object.keys(ph.schedule || {})) ph.schedule[k] = add(TODAY, 60); ph.actions = {}; ph.staff = []; ph.procedures = []; };

(async () => {
  const { b, p, errors } = await phone({ time: TODAY + 'T10:00:00+11:00', scale: 2 });
  await p.getByRole('button', { name: 'Try example' }).click(); await p.waitForTimeout(3300);

  // ── Quiet day: one quiet line, and only when all three slots are empty.
  await patch(p, calm);
  let r = await brief(p);
  ok(Object.keys(r).join() === 'quiet' && /quiet day/i.test(r.quiet.title), 'Quiet day: a single quiet line and nothing else (' + Object.keys(r).join() + ')');
  await p.screenshot({ path: path.join(SHOTS, 'briefing_quiet_390px.png') });

  // ── S8: inventory limit overdue. s8Limit() (1 Nov) is shown, not s8Max()'s planning window (10 Dec).
  await patch(p, ph => { calm(ph); ph.records = ph.records.filter(x => x.id !== 's8base'); ph.records.push(stock('s8old', '2026-08-01')); });
  r = await brief(p);
  ok(r.s8?.title === 'S8 stock check' && /^Overdue 25 days$/.test(r.s8.right) && !/10 Dec/.test(r.s8.right + r.s8.sub), 'S8: an overdue inventory limit reads from s8Limit() (Overdue 25 days), never s8Max()’s 14-day window (' + r.s8?.right + ')');
  ok(!r.quiet, 'S8: the quiet line goes once any slot has something');
  // an incomplete count yesterday never resets the clock
  await patch(p, ph => { ph.records.push(stock('s8inc', add(TODAY, -1), { incomplete: true })); });
  r = await brief(p);
  ok(/^Overdue 25 days$/.test(r.s8?.right || ''), 'S8: an incomplete stock check never resets the 3-month clock (' + r.s8?.right + ')');
  // tapping the S8 line opens the S8 review
  await p.locator('.brief [data-slot=s8]').click(); await p.waitForTimeout(400);
  ok(/S8/.test(await p.locator('.bar-title').first().innerText()), 'S8: tapping the line opens the S8 review');
  await p.getByRole('button', { name: 'Back', exact: true }).first().click().catch(() => {}); await p.waitForTimeout(300);

  // ── S8: inventory limit within 7 days.
  await patch(p, ph => { calm(ph); ph.records = ph.records.filter(x => x.id !== 's8base'); ph.records.push(stock('s8sep', '2026-09-01')); });
  r = await brief(p);
  ok(r.s8?.title === 'S8 stock check' && /1 Dec/.test(r.s8.right) && /1 Sept?|1 Sep/.test(r.s8.sub), 'S8: a limit 5 days out shows its date and the count it runs from (' + r.s8?.right + ' · ' + r.s8?.sub + ')');

  // ── S8: outstanding takeover beats a limit that is also due.
  await patch(p, ph => { ph.inherited = { since: add(TODAY, -2), at: add(TODAY, -2) + 'T00:00:00.000Z' }; });
  r = await brief(p);
  ok(r.s8?.title === 'S8 inventory after the takeover' && /Overdue 2 days/.test(r.s8.right) && /s 111\(3\)/.test(r.s8.sub), 'S8: an outstanding takeover comes first, due on the takeover day (' + r.s8?.right + ')');
  // takeover within 7 days, while the inventory limit is far off
  await patch(p, ph => { calm(ph); ph.inherited = { since: add(TODAY, 3), at: TODAY + 'T00:00:00.000Z' }; });
  r = await brief(p);
  ok(r.s8?.title === 'S8 inventory on the takeover day' && /29 Nov/.test(r.s8.right), 'S8: a takeover 3 days away gets its own line (' + r.s8?.right + ')');

  // ── S8: no completed count recorded. The strip carries the one stocktake prompt on Today.
  await patch(p, ph => { calm(ph); ph.records = ph.records.filter(x => x.id !== 's8base'); ph.records.push(stock('s8inc2', add(TODAY, -3), { incomplete: true })); });
  r = await brief(p);
  ok(r.s8?.title === 'Add your last S8 stocktake date' && await p.getByRole('button', { name: 'Add your last S8 stocktake date' }).count() === 1, 'S8: with no completed count, one stocktake prompt on Today, in the strip');

  // ── S8: the owner's planned review, earlier than the limit, labelled separately.
  await patch(p, ph => { calm(ph); ph.schedule.B1 = add(TODAY, 4); });
  r = await brief(p);
  ok(r.s8?.title === 'Planned S8 review' && /Your own date/.test(r.s8.sub) && /16 Feb 2027/.test(r.s8.sub), 'S8: a planned review 4 days out is labelled as the owner’s plan, apart from the inventory limit (' + r.s8?.sub + ')');

  // ── One job: overdue beats due today beats check-back beats this week; earliest date, then ids, break ties.
  const rid = (await activePh(p)).schedule ? Object.keys((await activePh(p)).schedule).find(k => k !== 'B1' && k !== 'Q1') : '';
  await patch(p, ph => { calm(ph); ph.actions = { a1: action('a1', 'Fix the fridge seal (fictional)', TODAY), a2: action('a2', 'Replace the lock (fictional)', add(TODAY, -3)), a3: action('a3', 'Order signage (fictional)', add(TODAY, -3)) }; });
  r = await brief(p);
  ok(r.job?.key === 'action/a2' && /Overdue 3 days/.test(r.job.right), 'Job: overdue first; two on the same date fall back to the stable id (' + r.job?.key + ')');
  await patch(p, ph => { delete ph.actions.a2; delete ph.actions.a3; ph.actions.a4 = action('a4', 'Chase the courier (fictional)', add(TODAY, 20), add(TODAY, -1)); });
  r = await brief(p);
  ok(r.job?.key === 'action/a1' && r.job.right === 'Due today', 'Job: due today beats a check-back that is due (' + r.job?.key + ')');
  await patch(p, ph => { delete ph.actions.a1; ph.actions.a5 = action('a5', 'Book the scale service (fictional)', add(TODAY, 2)); });
  r = await brief(p);
  ok(r.job?.key === 'action/a4' && r.job.right === 'Check back today' && /Waiting/.test(r.job.sub), 'Job: a check-back that is due beats a job due this week (' + r.job?.key + ')');
  // a future check-back holds back the early nudge, unless the real due date has come
  await patch(p, ph => { ph.actions = { a6: action('a6', 'Await the locksmith (fictional)', add(TODAY, 2), add(TODAY, 3)) }; });
  r = await brief(p);
  ok(!r.job, 'Job: waiting with a check-back in 3 days, a due date in 2 days doesn’t nudge early (' + JSON.stringify(r.job || null) + ')');
  await patch(p, ph => { ph.actions.a6.due = add(TODAY, -1); });
  r = await brief(p);
  ok(r.job?.key === 'action/a6' && /Overdue 1 day$/.test(r.job.right), 'Job: once the real due date has passed, it shows despite the future check-back (' + r.job?.right + ')');

  // ── One job: a credential expiring in 8–30 days, on one row for the person, naming that credential.
  await patch(p, ph => { calm(ph); ph.staff = [{ id: 'bp1', name: 'Alex Example (fictional)', role: 'Pharmacist', active: true, services: [],
    checks: { registration: { result: 'ok', date: '2026-01-05', expiry: add(TODAY, 20) }, insurance: { result: 'ok', date: '2026-01-05', expiry: add(TODAY, 25) } } }]; });
  r = await brief(p);
  const personLines = await p.locator('.brief [data-key="person/bp1"]').count();
  ok(r.job?.key === 'person/bp1' && /registration/i.test(r.job.sub) && /Expires 16 Dec/.test(r.job.right) && personLines === 1, 'Job: a credential 20 days out shows as one tap target for the person, naming the earliest credential (' + r.job?.sub + ' · ' + r.job?.right + ')');
  await patch(p, ph => { ph.staff[0].checks.registration.expiry = add(TODAY, 40); ph.staff[0].checks.insurance.expiry = add(TODAY, 40); });
  r = await brief(p);
  ok(!r.job, 'Job: credentials more than 30 days out stay off the strip');

  // ── One job: a review overdue; tapping the line opens it (read-only: nothing saved by the strip).
  if (rid) { await patch(p, ph => { calm(ph); ph.schedule[rid] = add(TODAY, -2); }); r = await brief(p);
    ok(r.job?.key === 'review/' + rid && /Overdue 2 days/.test(r.job.right), 'Job: an overdue review fills the slot (' + r.job?.title + ')');
    const before = JSON.stringify(await saved(p));
    await p.locator('.brief [data-slot=job]').click(); await p.waitForTimeout(400);
    ok(await p.locator('.brief').count() === 0 && await p.getByRole('button', { name: 'Back', exact: true }).count() > 0, 'Job: tapping the line opens the review');
    await p.getByRole('button', { name: 'Back', exact: true }).first().click(); await p.waitForTimeout(400);
    const after = JSON.stringify(await saved(p));
    ok(before === after, 'Read-only: showing and tapping the strip changes no saved data'); }

  // ── Handover: the latest substantive answer clears an earlier "Needs verification"; a skipped item stays open.
  await patch(p, ph => { calm(ph); ph.records.push(
    visit('v1', '2026-08-12', [['core/fridge', 'Fridge temperature log', 'Needs verification'], ['core/signage', 'Opening-hours signage', 'Needs verification'], ['core/lock', 'Dispensary lock', 'Needs verification']]),
    visit('v2', '2026-09-20', [['core/fridge', 'Fridge temperature log', 'Checked'], ['core/signage', 'Opening-hours signage', 'Not reviewed this visit'], ['core/lock', 'Dispensary lock', 'Needs verification']]),
    visit('v3', '2026-10-30', [['core/fridge', 'Fridge temperature log', 'Needs verification'], ['core/signage', 'Opening-hours signage', 'Not reviewed this visit']])); });
  r = await brief(p);
  ok(r.handover?.title === 'Still to verify · Dispensary lock' && /12 Aug/.test(r.handover.sub) && /2 more/.test(r.handover.sub), 'Handover: the oldest still-open carryover first; a skipped or absent item stays open, Checked clears (' + r.handover?.title + ' · ' + r.handover?.sub + ')');
  ok(Object.keys(r).join() === 'handover', 'Handover: S8 and job slots stay empty on a calm day, and there is no quiet line');
  await p.screenshot({ path: path.join(SHOTS, 'briefing_handover_390px.png') });
  await patch(p, ph => { ph.records.push(visit('v4', '2026-11-20', [['core/lock', 'Dispensary lock', 'N/A'], ['core/signage', 'Opening-hours signage', 'Issue'], ['core/fridge', 'Fridge temperature log', 'Checked']])); });
  r = await brief(p);
  ok(!r.handover && r.quiet, 'Handover: N/A, Issue and Checked each clear an earlier "Needs verification"; the line goes and the quiet line returns');
  await b.close();

  // ── Layout: all three slots, Swiss Clinical, at 390×844, 344×882 and 840×900.
  const banned = /\bPIC\b|pharmacist in charge|responsible person|score/i;
  for (const [w, hgt] of [[390, 844], [344, 882], [840, 900]]) {
    const { b: b2, p: q, errors: e2 } = await phone({ time: TODAY + 'T10:00:00+11:00', viewport: { width: w, height: hgt }, scale: 2 });
    await q.getByRole('button', { name: 'Try example' }).click(); await q.waitForTimeout(3300);
    await patch(q, ph => { calm(ph); ph.inherited = { since: add(TODAY, -1), at: add(TODAY, -1) + 'T00:00:00.000Z' };
      ph.actions = { a1: action('a1', 'Replace the cracked dispensary bench lock before the inspector visit (fictional)', add(TODAY, -4)) };
      ph.records.push(visit('v1', '2026-08-12', [['core/fridge', 'Fridge temperature log and data logger download', 'Needs verification']])); });
    const L = await q.evaluate(() => { const s = document.querySelector('.brief'), cs = getComputedStyle(s), lines = [...s.querySelectorAll('.brief-line')];
      return { n: lines.length, bar: cs.borderLeftWidth + ' ' + cs.borderLeftStyle, radius: cs.borderTopLeftRadius + ' ' + cs.borderBottomLeftRadius, shadow: cs.boxShadow, bg: cs.backgroundColor,
        min: Math.min(...lines.map(l => l.getBoundingClientRect().height)), fit: lines.every(l => l.getBoundingClientRect().right <= innerWidth + 0.5 && l.scrollWidth <= l.clientWidth + 1),
        tab: lines.every(l => /tabular-nums/.test(getComputedStyle(l.querySelector('.brief-date') || l).fontVariantNumeric) || !l.querySelector('.brief-date')),
        muted: getComputedStyle(s.querySelector('.brief-sub')).color, cards: s.querySelectorAll('.card').length, page: document.documentElement.scrollWidth <= innerWidth + 1,
        top: s.getBoundingClientRect().bottom <= innerHeight, text: s.innerText }; });
    const tag = w + '×' + hgt;
    ok(L.n === 3, tag + ': all three slots shown (' + L.n + ')');
    ok(L.bar === '3px solid' && L.radius === '0px 0px' && L.shadow === 'none' && L.bg === 'rgba(0, 0, 0, 0)' && L.cards === 0, tag + ': an open ruled strip, straight 3 px left bar, no card (' + L.bar + ', ' + L.radius + ')');
    ok(L.min >= 44, tag + ': every line is a 44 px+ tap target (' + L.min + ')');
    ok(L.fit && L.page, tag + ': nothing overflows the strip or the page');
    ok(L.tab, tag + ': dates are tabular');
    ok(L.muted === 'rgb(82, 101, 117)', tag + ': secondary text is #526575 (' + L.muted + ')');
    ok(L.top, tag + ': the strip is in view without scrolling');
    ok(!banned.test(L.text), tag + ': no banned terms or compliance scores in the strip');
    await q.mouse.move(1, 1); await q.screenshot({ path: path.join(SHOTS, 'briefing_' + w + 'x' + hgt + '.png') });
    e2.forEach(x => errors.push(x)); await b2.close();
  }
  await done({ close: async () => {} }, errors);
})().catch(e => { console.error(e); process.exit(1); });
