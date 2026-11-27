// Batch 3 (H-07, M-08, L-01): foldable and final visual polish, by real touch taps on the example pharmacy at fold
// sizes (344 cover, 768 unfolded, 390 phone); fails on any console error.
const { phone, ok, done, tap, saved } = require('./helpers.js');
const path = require('path');
const TIME = '2026-11-27T10:00:00+11:00';
const SHOT = n => path.resolve(__dirname, '../handoff/batch3_' + n + '.png');
const more = async (p, name) => { await tap(p, 'More'); await p.getByRole('button', { name: new RegExp('^' + name) }).first().tap(); await p.waitForTimeout(300); };
const put = (p, entries) => p.evaluate(async entries => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); for (const [k, v] of entries) tx.objectStore('kv').put(v, k); tx.oncomplete = res; }); }, entries);
// Words in these elements that the browser split across two lines (a mid-word break).
const midWord = (p, sel) => p.evaluate(sel => { const bad = [];
  for (const el of document.querySelectorAll(sel)) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const re = /\S+/g; let m; while ((m = re.exec(n.data))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const tops = new Set([...r.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top))); if (tops.size > 1) bad.push(m[0]); } } }
  return bad; }, sel);
const linkColours = p => p.evaluate(() => [...document.querySelectorAll('a')].filter(a => a.getBoundingClientRect().width).map(a => getComputedStyle(a).color));
const chevron = (p, sel) => p.evaluate(sel => { const s = document.querySelector(sel); if (!s) return null; const a = getComputedStyle(s, '::after'), m = getComputedStyle(s);
  return { has: a.content !== 'none' && a.content !== '' && parseFloat(a.width) > 0 && a.borderRightStyle === 'solid', marker: m.listStyleType, open: a.transform }; }, sel);

(async () => {
  // ── H-07: typing in a form while unfolded (768 px, list + record), then folding to 390 px, keeps every keystroke.
  { const { b, p, errors } = await phone({ time: TIME, viewport: { width: 768, height: 882 }, scale: 2 });
    await tap(p, 'Try example'); await p.waitForTimeout(3400);
    await tap(p, 'Actions'); await p.waitForTimeout(250); await p.locator('[aria-label="Add an action"]').first().tap(); await p.waitForTimeout(300);
    ok(await p.locator('.split .pane-detail input[name=title]').count() === 1, 'H-07 setup: New action opens beside the Actions list at 768 px');
    const title = p.locator('.pane-detail input[name=title]'); await title.tap(); await title.fill('Service the fire extinguisher'); await p.locator('.pane-detail input[name=due]').fill('2026-12-15');
    await title.tap(); await p.evaluate(() => { const i = document.querySelector('.pane-detail input[name=title]'); i.focus(); i.setSelectionRange(8, 8); });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const after = await p.evaluate(() => { const t = document.querySelector('input[name=title]'), d = document.querySelector('input[name=due]'); return { split: !!document.querySelector('.split'), t: t?.value, d: d?.value, focus: document.activeElement === t, caret: t?.selectionStart }; });
    ok(!after.split && after.t === 'Service the fire extinguisher' && after.d === '2026-12-15', 'H-07 folding 768 → 390 px keeps the typed action and its due date (' + after.t + ' · ' + after.d + ')');
    ok(after.focus && after.caret === 8, 'H-07 the cursor stays in the field where it was (position ' + after.caret + ')');
    await p.setViewportSize({ width: 768, height: 882 }); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.querySelector('.pane-detail input[name=title]')?.value) === 'Service the fire extinguisher', 'H-07 unfolding again (390 → 768 px) still keeps it');
    await p.locator('.pane-detail').getByRole('button', { name: 'Save action' }).tap(); await p.waitForTimeout(400);
    const acts = Object.values((await saved(p))['propapp:ph:' + (await saved(p))['propapp:dir'].active].actions);
    ok(acts.some(a => a.title === 'Service the fire extinguisher' && a.due === '2026-12-15'), 'H-07 Save action then saves what was typed before the folds');

    // H-07: service names wrap between words in the 300 px list pane
    await more(p, 'Services'); const firstSvc = p.locator('main .row[data-act]').first(); await firstSvc.tap(); await p.waitForTimeout(300);
    const mw = p.locator('.pane-master').count(); const bad = await midWord(p, '.pane-master .row-title, .pane-master .row-sub');
    const names = await p.evaluate(() => [...document.querySelectorAll('.pane-master .row-title')].map(x => x.innerText));
    ok(await mw === 1 && names.some(n => /Vaccination/.test(n)) && bad.length === 0, 'H-07 unfolded Services list (' + names.length + ' rows, Vaccination included): no word breaks mid-word' + (bad.length ? ': ' + bad.join(', ') : ''));
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.pane-master .row-title')).overflowWrap) === 'break-word', 'H-07 row titles use overflow-wrap: break-word');
    await p.screenshot({ path: SHOT('services_split_768px') });

    // M-08: a record opened from Today is highlighted in Today's list
    await tap(p, 'Today'); await p.waitForTimeout(300); await p.locator('main .list .row[data-key]').first().tap(); await p.waitForTimeout(350);
    ok(await p.locator('.pane-master .row.active[aria-current="true"]').count() === 1, 'M-08 unfolded Today: the open row is highlighted beside its record');
    await p.screenshot({ path: SHOT('today_split_768px') });
    const mc = await p.evaluate(() => [...document.querySelectorAll('.pane-master .filters button')].map(bt => { const s = bt.querySelector('span'), r = bt.getBoundingClientRect(), sr = s.getBoundingClientRect(); return s.scrollWidth <= s.clientWidth + 1 && sr.left >= r.left - 1 && sr.right <= r.right + 1 && r.height >= 44; }));
    ok(mc.length === 4 && mc.every(Boolean), 'M-08 unfolded Today: the four filter labels fit their chips in the list pane (“Waiting · to confirm” included)');

    // H-07: the hinge rules (the test browser can't emulate two screen segments, so the stylesheet is checked)
    const hinge = await p.evaluate(() => { const out = []; for (const sh of document.styleSheets) for (const r of sh.cssRules) if (r.media && /horizontal-viewport-segments/.test(r.media.mediaText)) out.push(r.cssText); return out.join('\n'); });
    ok(/\.qgrid\s*\{[^}]*repeat\(2/.test(hinge) && /\.welcome\.calm\s*\{[^}]*viewport-segment-width 1 0/.test(hinge) && /\.sheet-wrap\s*\{[^}]*viewport-segment-left 1 0/.test(hinge), 'H-07 on a hinged screen: Quarter Balancer 2 columns, welcome and bottom sheet inside one segment (stylesheet rules present)');
    await b.close(); errors.forEach(e => console.log('console: ' + e)); if (errors.length) ok(false, 'no console errors (unfolded)'); }

  // ── 344 px cover screen and 390 px phone
  { const { b: b0, p, errors: errors0 } = await phone({ time: TIME, viewport: { width: 344, height: 882 }, scale: 2 }); global.E0 = errors0;
  // L-01: the welcome logo box is exactly the 56 px logo and sits centred
  const wm = await p.evaluate(() => { const m = document.querySelector('.wm-mark').getBoundingClientRect(), l = document.querySelector('.wm-mark .logo').getBoundingClientRect(), s = document.querySelector('.calm-stack').getBoundingClientRect();
    return { w: m.width, h: m.height, same: Math.abs(l.left - m.left) < 1 && Math.abs(l.top - m.top) < 1 && Math.abs(l.width - m.width) < 1 && Math.abs(l.height - m.height) < 1, centred: Math.abs((m.left + m.right) / 2 - (s.left + s.right) / 2) < 1 }; });
  ok(wm.w === 56 && wm.h === 56 && wm.same && wm.centred, 'L-01 welcome .wm-mark is 56×56, the logo fills it exactly, centred (' + wm.w + '×' + wm.h + ')');
  await p.screenshot({ path: SHOT('welcome_344px') });
  // L-01: the testing hint shows only in the UAT build
  await tap(p, 'Set up your pharmacy'); await p.waitForTimeout(200);
  const uat = await p.evaluate(() => !!window.PROPAPP_UAT), hint = await p.getByText('Fictional details only while testing.').count();
  ok(uat ? hint === 1 : hint === 0, 'L-01 “Fictional details only while testing.” shows only in the UAT build (UAT ' + uat + ', shown ' + hint + ')');
  // L-01: finishing setup with no services says where to add them
  await p.locator('input[name=name]').fill('Banksia Test Pharmacy'); await tap(p, 'Continue'); await p.waitForTimeout(200);
  await p.locator('input[name=owner0]').fill('Sam Example'); await tap(p, 'Continue'); await p.waitForTimeout(200);
  await tap(p, 'Finish setup'); await p.waitForTimeout(600);
  const toast = await p.evaluate(() => document.querySelector('.toast')?.innerText || '');
  ok(/More → Services/.test(toast) && !/your services, from Today/.test(toast), 'L-01 setup with 0 services: the toast points to More → Services (“' + toast + '”)');

  await b0.close(); }
  // Example pharmacy on the cover screen
  const { b, p, errors: e1 } = await phone({ time: TIME, viewport: { width: 344, height: 882 }, scale: 2 }); const errors = e1; global.E0.forEach(e => errors.push(e));
  await tap(p, 'Try example'); await p.waitForTimeout(3400);
  // M-08: Today's four filter chips fit the 344 px cover screen, “Waiting · to confirm” included
  const chips = await p.evaluate(() => [...document.querySelectorAll('.filters button')].map(bt => { const s = bt.querySelector('span'), r = bt.getBoundingClientRect(); return { t: s.innerText, clip: s.scrollWidth > s.clientWidth + 1 || s.getBoundingClientRect().right > r.right + 1 || s.getBoundingClientRect().left < r.left - 1, h: r.height, w: r.width }; }));
  ok(chips.length === 4 && chips.some(c => /Waiting/.test(c.t)) && chips.every(c => !c.clip && c.h >= 44 && c.w >= 44), 'M-08 at 344 px every Today filter label fits its chip, 44 px+ (' + chips.map(c => c.t.replace(/\n/g, ' ')).join(' | ') + ')');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'M-08 at 344 px Today has no sideways scroll');
  await p.screenshot({ path: SHOT('today_344px') });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);

  // M-08: links use the final colour tokens, never the browser's default blue or purple
  const DEFAULT = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'];
  await more(p, 'Law and sources'); await p.getByRole('button', { name: /^Sources/ }).first().tap(); await p.waitForTimeout(300);
  let cols = await linkColours(p); ok(cols.length > 0 && cols.every(c => !DEFAULT.includes(c)) && cols.includes('rgb(15, 118, 110)'), 'M-08 Sources: ' + cols.length + ' links, all Deep Teal or token-styled, none browser blue');
  const su = await chevron(p, '.src-used>summary'); ok(su && su.has && su.marker === 'none', 'M-08 Sources “Where it’s used” has a chevron and no browser triangle');
  await p.locator('.src-used>summary').first().tap(); await p.waitForTimeout(200); const su2 = await chevron(p, '.src-used[open]>summary'); ok(su2 && su2.open !== su.open, 'M-08 the chevron turns when the section opens');
  await p.screenshot({ path: SHOT('sources_390px') });
  const acc = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()); ok(acc === '#0f766e', 'M-08 --accent is Deep Teal #0f766e (' + acc + ')');
  await more(p, 'Procedures'); await p.locator('main .row[data-id]').first().tap(); await p.waitForTimeout(300);
  const ds = await chevron(p, '.docsec>summary'); ok(ds && ds.has && ds.marker === 'none', 'M-08 procedure sections have chevrons');
  cols = await linkColours(p); ok(cols.every(c => !DEFAULT.includes(c)), 'M-08 procedure screen links (' + cols.length + ') are not browser blue');
  await p.screenshot({ path: SHOT('procedure_390px') });
  await more(p, 'Services'); await p.locator('main .row[data-act]').filter({ hasText: 'Vaccination' }).first().tap(); await p.waitForTimeout(300); if (await p.getByRole('button', { name: 'Edit answers' }).count()) await tap(p, 'Edit answers'); await p.waitForTimeout(250); await p.getByRole('button', { name: /Onboard me/ }).first().tap().catch(() => {}); await p.waitForTimeout(300); const ob = p.locator('.obsrc>summary'); if (await ob.count()) { const oc = await chevron(p, '.obsrc>summary'); ok(oc && oc.has && oc.marker === 'none', 'M-08 Onboard me “Official source” has a chevron'); await ob.first().tap(); await p.waitForTimeout(150); cols = await linkColours(p); ok(cols.length && cols.every(c => !DEFAULT.includes(c)), 'M-08 Onboard me source links are not browser blue'); } else ok(false, 'M-08 Onboard me has source sections');

  // M-08: “shown above” only when the Quarter Balancer is on screen
  await more(p, 'Calendar'); await p.getByRole('button', { name: 'Year plan' }).tap(); await p.waitForTimeout(250);
  let cal = await p.evaluate(() => ({ bal: !!document.querySelector('.qbal'), t: document.querySelector('.card.align')?.innerText || '' }));
  ok(!cal.bal && cal.t && !/shown above/.test(cal.t) && /the quarter each is due/.test(cal.t), 'M-08 the example’s Year plan has no Quarter Balancer, so the Align card says “the quarter each is due”, not “shown above”');
  const all = await saved(p), id = all['propapp:dir'].active, K = 'propapp:ph:' + id;
  // ── H-07: a second pharmacy on this device (a copy under another fictional name); the open one keeps its services
  const ph2 = JSON.parse(JSON.stringify(all[K])); ph2.id = id + 'b'; ph2.name = 'Banksia Bay Pharmacy';
  const dir = { ...all['propapp:dir'], ids: [...all['propapp:dir'].ids, ph2.id] };
  await put(p, [[K, all[K]], ['propapp:ph:' + ph2.id, ph2], ['propapp:dir', dir]]); await p.reload(); await p.waitForTimeout(900);
  const name = all[K].name, label = async () => p.evaluate(() => document.querySelector('.bar-title .ph-sub')?.innerText || '');
  const seen = [];
  for (const [n, go] of [['Reviews', () => tap(p, 'Reviews')], ['Actions', () => tap(p, 'Actions')], ['Staff', () => tap(p, 'Staff')], ['Procedures', () => more(p, 'Procedures')], ['Meetings', () => more(p, 'Meetings')],
    ['Visit', async () => { await tap(p, 'Reviews'); await p.waitForTimeout(200); await p.locator('main .row[data-id="Q1"]').first().tap(); }]]) {
    await go(); await p.waitForTimeout(300); const l = await label(); seen.push(n + ': ' + (l || '—')); ok(l === name, 'H-07 two pharmacies: ' + n + ' shows the open pharmacy (“' + l + '”) under its title'); if (n === 'Reviews') await p.screenshot({ path: SHOT('reviews_two_pharmacies_390px') });
  }
  await done(b, errors);
})();
