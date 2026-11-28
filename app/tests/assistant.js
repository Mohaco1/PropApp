// Counter Quick-Answer (28 Nov 2026): all ten questions against the live example pharmacy (Wattle Grove, fictional),
// by real taps at 390×844, plus the engine itself on edited copies for edge cases (takeover, no stock check, no staff,
// no OTP, carry-overs, dates after Sublocade ends). Checks it is read-only (nothing saved, the query never stored, no
// network), its guardrails (no banned terms, no scores) and its layout at 344×882 and 840×900. Fails on any console error.
const { phone, ok, done, tap, text, saved, activePh } = require('./helpers.js');
const path = require('path'); const fs = require('fs'); const os = require('os'); const esbuild = require('esbuild');
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const SRC = path.resolve(__dirname, '../src/assistant.js');
// The engine as a plain module for direct calls (same source the app bundles).
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pl-assistant-')), 'assistant.cjs');
esbuild.buildSync({ entryPoints: [SRC], bundle: true, format: 'cjs', platform: 'node', outfile: tmp, loader: { '.json': 'json' }, logLevel: 'silent' });
const E = require(tmp);
const T = '2026-11-28';
const IDS = ['s8', 'witness', 'emergency', 'creds', 'overdue', 'carry', 'otp', 'ocp', 'cannabis', 'inspect'];
const BANNED = /\bPIC\b|pharmacist in charge|responsible person/i, SCORE = /risk (score|rating)|compliance (score|rating)|\b\d{1,3} ?% ?(compliant|compliance)|score:/i;
const put = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph); await put(p, K, ph); await p.reload(); await p.waitForTimeout(900); };
const shot = (p, n, full = false) => p.screenshot({ path: path.join(SHOTS, 'assistant_' + n + '.png'), fullPage: full });
const freeze = o => { if (o && typeof o === 'object') { Object.freeze(o); for (const k of Object.keys(o)) freeze(o[k]); } return o; };
const clone = o => JSON.parse(JSON.stringify(o));
const chip = (p, name) => p.locator('.qa-chip', { hasText: name }).first().click().then(() => p.waitForTimeout(150));
const answerText = p => p.locator('.qa-answer .qa-text').innerText();
const title = p => p.locator('.pane-detail .bar-title, .bar-title').last().innerText();
const openAsk = async p => { await tap(p, 'Today'); await p.waitForTimeout(200); await p.getByRole('button', { name: 'Quick answers', exact: true }).first().click(); await p.waitForTimeout(300); };

(async () => {
  const { b, p, errors } = await phone({ time: T + 'T10:00:00+11:00', scale: 2 });
  const net = []; p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) net.push(r.url()); });
  await tap(p, 'Try example'); await p.waitForTimeout(3300);
  const ph0 = await activePh(p), before = JSON.stringify(ph0);

  // ── Entry points: Today's header and More.
  const todayOver = +(await p.locator('.filters.today-index button[data-f=overdue] b').innerText());
  await p.getByRole('button', { name: 'Quick answers', exact: true }).first().click(); await p.waitForTimeout(300);
  ok(await title(p) === 'Quick answers', 'Today header: the Quick answers button opens the screen');
  ok(await p.locator('.qa-chip').count() === 10, '10 question chips are shown');
  ok(!(await p.locator('.qa-answer').count()), 'No answer until a question is asked');
  await shot(p, 'empty_390px');
  await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: /^Quick answers/ }).first().click(); await p.waitForTimeout(300);
  ok(await title(p) === 'Quick answers', 'More: the Quick answers row opens the screen');

  // ── All ten chips against live state: the screen shows exactly what the engine says for this pharmacy today.
  const ph = freeze(clone(ph0)); const seen = [];
  for (const [i, id] of IDS.entries()) {
    const want = E.ask(ph, id, T); await chip(p, E.QUESTIONS[i].chip);
    const got = await answerText(p), law = await p.locator('.qa-answer .qa-law').innerText(), href = await p.locator('.qa-answer a.linkbtn').getAttribute('href'), go = await p.locator('.qa-answer .qa-go').innerText();
    seen.push(got + ' ' + law + ' ' + go);
    ok(got === want.text && law === want.cite.line && /^https:\/\//.test(href) && go === want.link.label, `Q${i + 1} ${id}: answer, one-line legal basis, official link and deep link shown (${got.slice(0, 70)}…)`);
    const sentences = want.text.split(/(?<=[.!?])\s+(?=[A-Z])/).length; ok(sentences <= 3, `Q${i + 1} ${id}: crisp (${sentences} sentences)`);
    if (id === 's8') await shot(p, 's8_390px');
  }
  // Specific facts, grounded in this pharmacy's records.
  const A = id => E.ask(ph, id, T);
  ok(/22 Nov/.test(A('s8').text) && /6 days overdue/.test(A('s8').text) && /22 Aug/.test(A('s8').text) && /s 111$/.test(A('s8').cite.line), 'Q1 S8: due by 22 Nov (3 months after the 22 Aug stock check), 6 days overdue, s 111');
  ok(/employed or engaged/.test(A('witness').text) && /locums and contractors/.test(A('witness').text) && /s 148\(2\)\(a\)\(i\)/.test(A('witness').cite.line), 'Q2 witness: excludes employed or engaged (locums, contractors), s 148(2)(a)(i)');
  const nPh = ph.staff.filter(x => x.active !== false && /^Pharmacist\b/i.test(x.role || '')).length;
  ok(nPh ? A('witness').text.includes(nPh === 1 ? '1 pharmacist' : nPh + ' pharmacists') : true, 'Q2 witness: counts the pharmacists on this staff list (' + nPh + ')');
  ok(/7 days/.test(A('emergency').text) && /30 days/.test(A('emergency').text) && /smallest pack/.test(A('emergency').text) && /inhaler/.test(A('emergency').text) && /S4D or S8/.test(A('emergency').text) && /s 33\(2\)\(b\)/.test(A('emergency').cite.line), 'Q3 emergency supply: 7 days, smallest pack for inhalers/creams/liquids, never S4D or S8, s 33(2)(b)');
  // Credentials: worked out here independently from the stored checks.
  const exp = []; for (const s of ph.staff.filter(x => x.active !== false)) for (const [k, c] of Object.entries(s.checks || {})) if (c.result !== 'issue' && c.result !== 'na' && /^\d{4}-\d{2}-\d{2}$/.test(c.expiry || '') && c.expiry <= '2027-01-27') exp.push(s.name);
  const cr = A('creds');
  ok(exp.length > 0 && [...new Set(exp)].every(n => cr.text.includes(n)) && (cr.rows || []).length === exp.length, 'Q4 credentials: names everyone with a credential expiring by 27 Jan 2027 (' + [...new Set(exp)].join(', ') + ')');
  ok(A('overdue').counts.overdue === todayOver && A('overdue').text.startsWith(todayOver + ' things are overdue'), 'Q5 overdue: the same count as Today (' + todayOver + ')');
  ok(A('overdue').counts.waiting >= 1 && /waiting on someone/.test(A('overdue').text), 'Q5 overdue: waiting check-backs counted (' + A('overdue').counts.waiting + ')');
  ok(/Check later/.test(A('carry').text), 'Q6 carry-overs: answered from the visit records');
  ok(/11 Dec \(13 days\)/.test(A('otp').text) && /31 Dec 2026/.test(A('otp').text) && /Buvidal/.test(A('otp').text) && /below 25°C/.test(A('otp').text), 'Q7 OTP: Sublocade final order 11 Dec (13 days), discontinued 31 Dec 2026, Buvidal below 25°C');
  ok(ph.flags?.volume ? /80 or more/.test(A('otp').text) : /fewer than 80/.test(A('otp').text), 'Q7 OTP: the 80+ amenity line follows this pharmacy’s dosing volume');
  ok(/s 37A/.test(A('ocp').cite.line) && /James Cook|JCU/.test(A('ocp').text) && /UTS/.test(A('ocp').text) && /Newcastle/.test(A('ocp').text) && /Intention form/.test(A('ocp').text) && /18–39/.test(A('ocp').text), 'Q8 OCP: s 37A, JCU/UoN/UTS, Intention form, aged 18–39');
  ok(/Category 1/.test(A('cannabis').text) && /Schedule 4/.test(A('cannabis').text) && /Categories 2–5/.test(A('cannabis').text) && /Schedule 8/.test(A('cannabis').text) && /no emergency supply of unregistered S8/.test(A('cannabis').text), 'Q9 cannabis: Cat 1 = S4, Cat 2–5 = S8, no emergency supply of unregistered S8');
  ok(/eTG/.test(A('inspect').text) && /AMH/.test(A('inspect').text) && /sink with hot and cold/.test(A('inspect').text) && /30 June, 214 days away/.test(A('inspect').text), 'Q10 inspection: eTG/AMH, hot and cold sink, declaration by 30 June (214 days away)');

  // ── Deep links: one tap to the screen each answer is about.
  await chip(p, 'Next S8 inventory'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok(/S8/.test(await title(p)), 'Deep link: S8 answer opens the S8 review (' + await title(p) + ')'); await openAsk(p);
  await chip(p, 'S8 destruction witness'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok(await title(p) === 'S8 destruction at the pharmacy', 'Deep link: witness answer opens the s 148 obligation'); await openAsk(p);
  await chip(p, 'Credentials expiring'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok(/Staff|Priya|Tom/.test(await title(p)), 'Deep link: credentials answer opens Staff (' + await title(p) + ')'); await openAsk(p);
  await chip(p, 'Overdue and waiting'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok((await title(p)).startsWith('Today') && await p.locator('.filters.today-index button.on[data-f=overdue]').count() === 1, 'Deep link: overdue answer opens Today on Overdue'); await openAsk(p);
  await chip(p, 'Sublocade and OTP 80+'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok(/Opioid/.test(await title(p)), 'Deep link: OTP answer opens the OTP service (' + await title(p) + ')'); await openAsk(p);
  await chip(p, 'Inspection quick-check'); await p.locator('.qa-go').click(); await p.waitForTimeout(300);
  ok(await title(p) === 'Start a visit', 'Deep link: inspection answer opens Start a visit'); await openAsk(p);

  // ── Typed questions.
  const typed = async (q, id) => { await p.fill('input[name=q]', q); await p.waitForTimeout(150); const t = await p.locator('#qa-out').innerText(); ok(t.includes(E.ask(ph, id, T).text), `Typed “${q}” → ${id}`); };
  await typed('who can witness destruction', 'witness'); await typed('is cbd s4 or s8?', 'cannabis'); await typed('when is the S8 stocktake due', 's8');
  await typed('emergency supply of an inhaler without a script', 'emergency'); await typed('Sublocade', 'otp'); await typed('ahpra renewals coming up', 'creds');
  await typed('can we start the pill', 'ocp'); await typed('what will the inspector check', 'inspect'); await typed('anything carried over from the visit?', 'carry'); await typed('what is overdue', 'overdue');
  await p.fill('input[name=q]', 'florbix quantum'); await p.waitForTimeout(150);
  ok(/No quick answer/.test(await p.locator('#qa-out').innerText()) && !(await p.locator('.qa-answer').count()), 'No match: a calm “No quick answer” and a way to search');
  await p.getByRole('button', { name: 'Search reviews, actions, staff and rules' }).click(); await p.waitForTimeout(300);
  ok(await title(p) === 'Search' && await p.inputValue('input[name=q]') === 'florbix quantum', 'No match: Search opens with the words carried over');
  await openAsk(p); await p.fill('input[name=q]', 'Jane Citizen DOB 1/2/80 needs oxycodone'); await p.waitForTimeout(200);

  // ── Read-only, nothing stored, offline.
  const all = await saved(p), after = JSON.stringify(await activePh(p));
  ok(after === before, 'Read-only: the pharmacy record is unchanged after every question and deep link');
  ok(!JSON.stringify(all).includes('Jane Citizen') && !JSON.stringify(all).includes('florbix'), 'Nothing typed in the box is saved on the device');
  ok(net.length === 0, 'No network requests (' + net.slice(0, 2).join(', ') + ')');
  const src = fs.readFileSync(SRC, 'utf8');
  ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|indexedDB|localStorage|\.change\(|saveDraft/.test(src), 'Engine source makes no network call and touches no storage');
  const fz = freeze(clone(ph0)); let threw = ''; try { for (const id of IDS) E.ask(fz, id, T); for (const q of ['s8', 'witness destruction', 'cbd', 'x']) E.ask(fz, q, T); } catch (e) { threw = e.message; }
  ok(!threw, 'Engine: every question runs on a frozen record (no mutation)' + (threw ? ': ' + threw : ''));
  ok(!/patient|dob|medicare/i.test(JSON.stringify(IDS.map(id => E.ask(ph, id, T).rows || []))), 'Answers carry no patient data');

  // ── Guardrails.
  ok(!seen.some(s => BANNED.test(s)) && !BANNED.test(src.replace(/^\/\/.*$/gm, '')), 'No banned terms (PIC, pharmacist in charge, responsible person) in any answer or the engine');
  ok(!seen.some(s => SCORE.test(s)), 'No compliance or risk scores in any answer');

  // ── Edge cases on edited copies.
  const v = fn => { const x = clone(ph0); fn(x); return freeze(x); };
  const tk = E.ask(v(x => { x.inherited = { since: '2026-11-20', at: '2026-11-20T01:00:00.000Z' }; }), 's8', T);
  ok(/immediately/.test(tk.text) && /20 Nov/.test(tk.text) && /s 111\(3\)/.test(tk.cite.line), 'Edge: after a takeover with no stock check since, the S8 inventory is due immediately (s 111(3))');
  const none = E.ask(v(x => { x.records = x.records.filter(r => r.type !== 'B1'); delete x.inherited; }), 's8', T);
  ok(/No completed S8 stock check/.test(none.text) && none.link.id === 'B1', 'Edge: no S8 stock check recorded → asks for the last one');
  const inc = E.ask(v(x => { delete x.inherited; x.records.push({ id: 'inc', type: 'B1', date: '2026-11-27', answers: [{ answer: 'Incomplete' }], fields: { stockDate: '2026-11-27', stockIncomplete: true } }); }), 's8', T);
  ok(/22 Nov/.test(inc.text), 'Edge: an incomplete stock check never moves the S8 date');
  const fresh = E.ask(v(x => { delete x.inherited; x.records.push({ id: 'ok', type: 'B1', date: '2026-11-27', answers: [{ answer: 'Completed' }], fields: { stockDate: '2026-11-27' } }); }), 's8', T);
  ok(/due by 27 Feb 2027, in 91 days/.test(fresh.text), 'Edge: a completed stock check on 27 Nov → due by 27 Feb 2027 (' + fresh.text.slice(0, 60) + ')');
  ok(/No staff/.test(E.ask(v(x => { x.staff = []; }), 'creds', T).text), 'Edge: no staff → nothing to count');
  ok(/No recorded credential expires/.test(E.ask(v(x => { for (const s of x.staff) s.checks = {}; }), 'creds', T).text), 'Edge: no expiry dates → none expiring');
  const gone = E.ask(v(x => { x.staff = x.staff.map(s => ({ ...s, active: false })); }), 'creds', T); ok(/No staff/.test(gone.text), 'Edge: former staff are not listed');
  const late = E.ask(v(() => {}), 'otp', '2026-12-20'), after31 = E.ask(v(() => {}), 'otp', '2027-01-05');
  ok(/closed on 11 Dec/.test(late.text) && /was discontinued on 31 Dec 2026/.test(after31.text), 'Edge: Sublocade wording follows the date (after 11 Dec; after 31 Dec)');
  ok(/don’t offer OTP/.test(E.ask(v(x => { x.services.otp && (x.services.otp.active = false); }), 'otp', T).text), 'Edge: OTP not offered → says it doesn’t apply');
  ok(/fewer than 80/.test(E.ask(v(x => { x.flags = { ...x.flags, volume: false }; }), 'otp', T).text), 'Edge: under 80 a day → the 80+ amenity rules don’t apply');
  ok(/30 June, today/.test(E.ask(v(() => {}), 'inspect', '2027-06-30').text) && /30 June, 365 days away/.test(E.ask(v(() => {}), 'inspect', '2027-07-01').text), 'Edge: the declaration countdown rolls to next 30 June after the day');
  ok(/Nothing is overdue/.test(E.ask(v(x => { x.actions = {}; x.schedule = {}; x.records = []; x.staff = []; x.procedures = []; }), 'overdue', T).text), 'Edge: nothing overdue');
  // Carry-overs: the latest substantive answer decides.
  const Q = (id, date, answer) => ({ id, type: 'Q1', date, answers: [{ item: 'recalls', text: 'Recalls and alerts', answer }] });
  const c1 = E.carryovers(v(x => { x.records = [Q('a', '2026-08-01', 'Checked'), Q('b', '2026-11-01', 'Needs verification')]; }));
  ok(c1.length === 1 && c1[0].title === 'Recalls and alerts' && c1[0].date === '2026-11-01', 'Edge: a check left “Check later” at the latest visit carries over');
  ok(E.carryovers(v(x => { x.records = [Q('b', '2026-11-01', 'Needs verification'), Q('c', '2026-11-20', 'Checked')]; })).length === 0, 'Edge: checked at a later visit → resolved');
  ok(E.carryovers(v(x => { x.records = [Q('b', '2026-11-01', 'Needs verification'), Q('c', '2026-11-20', 'N/A'), Q('d', '2026-11-25', 'Not reviewed this visit')]; })).length === 1, 'Edge: a later N/A or “not reviewed” doesn’t resolve it');
  ok(/No site visit is recorded/.test(E.ask(v(x => { x.records = []; }), 'carry', T).text), 'Edge: no visits → nothing carried over');
  ok(E.ask(ph, '', T) === null && E.ask(ph, 'x', T) === null && E.ask(null, 's8', T) === null, 'Edge: empty, one-letter or no pharmacy → no answer');
  ok(E.match('s8 destruction witness')[0] === 'witness' && E.match('cannabis s8')[0] === 'cannabis' && E.match('s8 inventory')[0] === 's8', 'Edge: overlapping words pick the right question');
  // Live UI carry-over: a visit left "Check later" shows on the screen.
  await patch(p, x => { x.records.push({ id: 'qa-v', type: 'Q1', kind: 'visit', title: 'Site visit', date: '2026-11-27', at: '2026-11-27T01:00:00.000Z', answers: [{ item: 'recalls', text: 'Recalls and alerts', answer: 'Needs verification', note: '' }], fields: {}, notes: '', actionIds: [] }); });
  await openAsk(p); await chip(p, 'Visit carry-overs');
  ok(/Recalls and alerts \(27 Nov\)/.test(await answerText(p)), 'Q6 live: a visit check left “Check later” is listed with its date'); await shot(p, 'carry_390px');

  // ── Layout: Swiss Clinical bar, 44 px targets, no sideways scroll.
  const lay = await p.evaluate(() => { const a = getComputedStyle(document.querySelector('.qa-answer'));
    const small = [...document.querySelectorAll('main button, main a, main input')].filter(e => e.getClientRects().length && e.getBoundingClientRect().height < 44).map(e => e.textContent.trim().slice(0, 30));
    return { bw: a.borderLeftWidth, bs: a.borderLeftStyle, bc: a.borderLeftColor, r: a.borderTopLeftRadius, sh: a.boxShadow, cards: document.querySelectorAll('main .card').length, small, sw: document.documentElement.scrollWidth, w: innerWidth }; });
  ok(lay.bw === '3px' && lay.bs === 'solid' && lay.bc === 'rgb(15, 41, 66)' && lay.r === '0px' && lay.sh === 'none', 'Answer: straight 3 px Navy bar, radius 0, no shadow (' + [lay.bw, lay.bc, lay.r].join(', ') + ')');
  ok(lay.cards === 0, 'Zero card-soup: no cards on the screen');
  ok(!lay.small.length, 'Every tap target is at least 44 px' + (lay.small.length ? ': ' + lay.small.join(' | ') : ''));
  await b.close();
  for (const [w, hh] of [[344, 882], [840, 900]]) {
    const r = await phone({ time: T + 'T10:00:00+11:00', viewport: { width: w, height: hh }, scale: 2 }); r.errors.forEach(e => errors.push(e)); r.p.on('pageerror', e => errors.push(e.message));
    await r.p.getByRole('button', { name: 'Try example' }).click(); await r.p.waitForTimeout(3300);
    await r.p.getByRole('button', { name: 'Quick answers', exact: true }).first().click(); await r.p.waitForTimeout(300);
    for (const c of ['Credentials expiring', 'Inspection quick-check', 'Sublocade and OTP 80+']) { await r.p.locator('.qa-chip', { hasText: c }).first().click(); await r.p.waitForTimeout(150);
      const m = await r.p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, out: [...document.querySelectorAll('.qa-answer *, .qa-chip')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length,
        small: [...document.querySelectorAll('.qa-chip, .qa-go, .qa-answer a')].filter(e => e.getBoundingClientRect().height < 44).length }));
      ok(m.sw <= m.w + 1 && !m.out && !m.small, `${w}×${hh} ${c}: no overflow, 44 px targets`); }
    await r.p.mouse.move(1, 1); await r.p.screenshot({ path: path.join(SHOTS, `assistant_${w}px.png`) });
    await r.b.close();
  }
  console.log(); // done() closes an already-closed browser harmlessly
  await done({ close: async () => {} }, errors);
})().catch(e => { console.error(e); console.log('FAIL crashed: ' + e.message); process.exit(1); });
