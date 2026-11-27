// Stage 3F (final NSW 2026 wording, 2 URL fixes and the Swiss Clinical polish), by real taps at 390×844 on the
// fictional example pharmacy; fails on any console error.
// 1. Wording: no "responsible person" or "pharmacist in charge" in the law summary; the repealed Sch 5 and cl 12(2)
//    citations now read Health Practitioner Regulation (New South Wales) Regulation 2025 s 11(1)(e), Sch 4 s 1 and
//    s 11(2); retired Board guidelines name the 1 Oct 2026 consolidated guidelines; "Who runs this service day to day?";
//    the DAA draft's sources name the 1 Oct 2026 guidelines and the PSA DAA guidelines.
// 2. URLs: the compounding guide and the OCP protocol links point at the live pages.
// 3. Look: a white canvas, a 2 px navy rule under the top bar, tight headings, tabular due badges, open hairline lists
//    with no shadow, a 3 px navy bar on section heads, a 3 px teal bar on the next-up card; all taps ≥ 44 px.
// 4. Services: the question count only counts questions that can be shown ("of N" when nothing more can follow).
const { phone, ok, done, tap, text, saved } = require('./helpers.js');
const path = require('path'); const fs = require('fs');
const SRC = path.resolve(__dirname, '../src');
const SHOTS = path.resolve(__dirname, '../handoff'); fs.mkdirSync(SHOTS, { recursive: true });
const rd = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const put = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
const patch = async (p, fn) => { const all = await saved(p), K = 'propapp:ph:' + all['propapp:dir'].active, ph = all[K]; fn(ph); await put(p, K, ph); await p.reload(); await p.waitForTimeout(900); };
const more = async (p, name) => { await tap(p, 'More'); await p.waitForTimeout(200); await p.getByRole('button', { name: new RegExp('^' + name) }).first().click(); await p.waitForTimeout(300); };
const back = async p => { await p.getByRole('button', { name: 'Back', exact: true }).first().click(); await p.waitForTimeout(300); };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, 'stage3f_' + n + '.png') });

(async () => {
  // ── 1–2. Source wording and links.
  const LAW = rd('content/law.json'), RV = rd('content/reviews.json'), SV = rd('content/services.json'), VS = JSON.parse(rd('content/verified-steps.json')), SJ = rd('content/sources.js'), OB = rd('content/onboard.js');
  ok(!/responsible person|pharmacist in charge/i.test(LAW), '1. law summary: no “responsible person” or “pharmacist in charge”');
  ok(/You, as proprietor \(s 112\)/.test(LAW) && /must ensure it is made \(s 111\(1\)\)/.test(LAW) && /the pharmacist on duty \(s 122\(2\)\)/.test(LAW), '1. s 111(1), s 112 and s 122(2) read as the proprietor and the pharmacist on duty');
  const HPR = 'Health Practitioner Regulation (New South Wales) Regulation 2025';
  for (const [n, t] of [['law', LAW], ['reviews', RV]]) {
    ok(!/Sch 5|cl 12\(2\)|list of reference texts|proprietor guidelines/.test(t), '1. ' + n + ': no repealed Sch 5 / cl 12(2) or retired Board guideline names');
    ok(t.includes(HPR + ' s 11(1)(e), Sch 4 s 1') && t.includes(HPR + ' s 11(2)') && t.includes('Guidelines on the safe provision of pharmacy services including medicines and advice (1 Oct 2026)'), '1. ' + n + ': premises equipment, dispensary and references cite the 2025 Regulation and the 1 Oct 2026 guidelines');
  }
  ok(/Check consent, procedures and pharmacist-on-duty escalation/.test(RV) && !/responsible staff/.test(RV), '1. staged supply review: “pharmacist-on-duty escalation”');
  ok(/at least two staff who manage vaccines have completed the NSW Health Vaccine Storage/.test(RV) && !/every staff member handling vaccine storage/.test(RV), '1. vaccination review: at least two staff who manage vaccines (cold-chain module)');
  ok((SV.match(/Who runs this service day to day\?/g) || []).length === 11 && !/Who is responsible for this service/.test(SV), '1. 11 services ask “Who runs this service day to day?”');
  const daa = VS.pairs.find(([a]) => /Pharmacy Board of Australia guidelines on DAAs/.test(a));
  ok(daa && /Guidelines on the safe provision of pharmacy services including medicines and advice \(1 Oct 2026\)/.test(daa[1]) && /PSA Guidelines for pharmacists providing dose administration aid services/.test(daa[1]), '1. DAA draft sources: the 1 Oct 2026 guidelines and the PSA DAA guidelines (rewrite pair appended)');
  ok(/\['pba', 'Pharmacy Board of Australia: Guidelines on the safe provision of pharmacy services including medicines and advice \(1 Oct 2026\)'/.test(SJ), '1. Sources list names the 1 Oct 2026 guidelines');
  ok(OB.includes("'https://www.hpca.nsw.gov.au/resources/ten-tips-quality-compounding'") && !/complex_compounding_september_2019/.test(OB), '2. compounding: the Council’s Ten tips page replaces the dead 2019 PDF');
  ok(!/oral-contraceptive-pill-initiation\.aspx/.test(OB + SJ) && SJ.includes('/pharmaceutical/pharmacists/Documents/protocol-initiation-oral-contraceptive-pill.pdf'), '2. OCP: the protocol PDF replaces the superseded page');

  // ── 3. The look, by real taps on the example pharmacy.
  const { b, p, errors } = await phone({ time: '2026-11-27T10:00:00+11:00', scale: 2 });
  ok(await p.locator('.welcome.calm .calm-name', { hasText: 'PharmLedger' }).count() === 1 && await p.locator('.welcome.calm .btn.primary').count() === 1, '3. welcome stays Centered Calm (one primary button)');
  await shot(p, 'welcome_390px');
  await tap(p, 'Try example'); await p.waitForTimeout(800);
  await p.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 6000 });
  const look = await p.evaluate(() => { const cs = (s, pe) => { const e = document.querySelector(s); return e && getComputedStyle(e, pe); };
    const bar = cs('.bar'), date = cs('.status .date'), list = cs('main .list'), rr = cs('.row-right'), hero = cs('.card.hero');
    return { body: getComputedStyle(document.body).backgroundColor, bw: bar.borderBottomWidth, bc: bar.borderBottomColor, strip: cs('.bar', '::before').height, ls: date.letterSpacing, fs: date.fontSize,
      ls2: getComputedStyle(document.querySelector('.bar-title')).letterSpacing, lsh: list.boxShadow, lbl: list.borderLeftWidth, lbt: list.borderTopWidth, num: rr.fontVariantNumeric, hero: hero ? hero.boxShadow : 'none-present' }; });
  ok(look.body === 'rgb(255, 255, 255)', '3. crisp #FFFFFF canvas (' + look.body + ')');
  ok(look.bw === '2px' && look.bc === 'rgb(15, 41, 66)' && look.strip === '3.5px', '3. top bar: 2 px navy bottom rule, navy-to-teal strip kept (' + look.bw + ' ' + look.bc + ')');
  ok(Math.abs(parseFloat(look.ls) / parseFloat(look.fs) + 0.025) < 0.002 && parseFloat(look.ls2) < 0, '3. tight headings: letter-spacing −0.025em (' + look.ls + ' at ' + look.fs + ')');
  ok(look.lsh === 'none' && look.lbl === '0px' && look.lbt === '1px', '3. open lists: hairline above and below, no side box, no shadow');
  ok(/tabular-nums/.test(look.num), '3. due badges in tabular numbers (' + look.num + ')');
  const rails = await p.evaluate(() => [...document.querySelectorAll('.list .row')].map(r => ({ t: r.classList.contains('bad') ? 'bad' : r.classList.contains('warn') ? 'warn' : '', c: getComputedStyle(r, '::before').content })));
  ok(rails.some(r => r.t === 'bad') && rails.every(r => r.t || r.c === 'none'), '3. urgency rails still only on overdue and due-soon rows');
  const small = await p.evaluate(() => [...document.querySelectorAll('main button, main a, .nav button, .bar button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(r => r.width && (r.height < 43.5 || r.width < 43.5)).length);
  ok(small === 0, '3. Today: every tap target at least 44 px (' + small + ' smaller)');
  const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(wide, '3. Today: no sideways scroll');
  await shot(p, 'today_390px');
  await tap(p, 'More'); await p.waitForTimeout(300);
  const sec = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.sec-title')); return [s.borderLeftWidth, s.borderLeftColor]; });
  ok(sec[0] === '3px' && sec[1] === 'rgb(15, 41, 66)', '3. section heads: a 3 px navy bar (' + sec.join(' ') + ')');
  await shot(p, 'more_390px');
  await tap(p, 'Staff'); await p.waitForTimeout(300); await shot(p, 'staff_390px');
  await tap(p, 'Reviews'); await p.waitForTimeout(300); await shot(p, 'reviews_390px');

  // ── 4. Services: "of N" counts only questions that can be shown.
  await patch(p, ph => { ph.services.screening = { active: true, setup: 'todo', answers: {} }; });
  await more(p, 'Services'); await p.locator('[data-act=open][data-id=screening]').click(); await p.waitForTimeout(400);
  if (await p.getByRole('heading', { name: /Who runs your services/ }).count()) { await p.locator('label', { hasText: 'The pharmacist on duty' }).first().click(); await tap(p, 'Save'); await p.waitForTimeout(400); }
  const t = await text(p);
  ok(/Question 1 of \d+/.test(t) && !/more may follow/.test(t), '4. a service with no conditional questions shows “Question 1 of N”, not “more may follow” (' + (t.match(/Question 1[^\n]*/) || [''])[0] + ')');
  await shot(p, 'service_question_390px');
  await back(p);
  await done(b, errors);
})();
