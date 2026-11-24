// Functional checks for the Concept D layer. Fictional data only.
const { chromium } = require('playwright');
const APP = process.env.APP || '/home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html';
const OUT = '/home/user/rpharmacy/uat/tests/out';
const results = []; const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass, detail }); };
(async () => {
  const b = await chromium.launch();
  for (const [dev, w, h] of [['desktop', 1280, 860], ['mobile', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); await p.addInitScript(()=>{try{localStorage.setItem('rph-uat-view','laptop')}catch(e){}}); const errs = [];
    p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Content Security Policy')) errs.push(m.text()); });
    await p.goto('file://' + APP); await p.waitForTimeout(1500); await p.evaluate(()=>{try{if(D.phone){D.applyView(false);render();}}catch(e){}});
    // 1. Onboarding: fresh store shows landing; open services step via existing flow
    await p.evaluate(() => { const n = clone(); n.freshSite = true; n.onboarded = true; n.freshProprietors = true; n.pharmacyName = 'Harbourview Test Pharmacy'; n.proprietors = [{ id: 'p1', name: 'Test Owner', primary: true }]; n.currentReviewer = 'p1'; n.active = []; commit(n, 'fictional setup'); fsServicesSelect(); });
    await p.waitForTimeout(300);
    const tiles = await p.evaluate(() => ({ tiles: document.querySelectorAll('#editor .d-tiles>label').length, plan: document.querySelector('#editor .d-plan h3')?.textContent, prog: !!document.querySelector('#editor [role=progressbar]') }));
    ok(dev + ' onboarding tiles shown (17 services)', tiles.tiles === 17, JSON.stringify(tiles));
    await p.locator('#editor .d-tiles>label', { hasText: 'Vaccination' }).first().click();
    await p.locator('#editor .d-tiles>label', { hasText: 'Home delivery' }).first().click();
    const planText = await p.evaluate(() => document.querySelector('#editor .d-plan').textContent);
    ok(dev + ' plan so far updates', /Vaccination/.test(planText) && /delivery/i.test(planText), planText.slice(0, 160));
    const before = await p.evaluate(() => JSON.stringify(state.active));
    ok(dev + ' ticking tiles does not save', before === '[]', before);
    await p.locator('#editor button', { hasText: 'Save service selection' }).click(); await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ active: state.active, sel: state.freshSelection }));
    ok(dev + ' saving activates the chosen services through the existing flow', after.active.length === 2 && after.active.includes('vaccination') && after.active.includes('delivery') && after.sel === true, JSON.stringify(after));
    await p.evaluate(() => { if ($('editor').open) $('editor').close(); });
    // 2. Calendar page via nav (desktop) / More (mobile)
    if (dev === 'desktop') await p.click('body>nav [data-page=planner]');
    else { await p.click('.mobilebar button:nth-child(4)'); await p.waitForTimeout(200); await p.locator('#more-pages button', { hasText: 'Calendar' }).click(); }
    await p.waitForTimeout(300);
    ok(dev + ' Calendar opens from navigation', await p.evaluate(() => page === 'planner' && document.querySelector('main h1')?.textContent === 'Calendar'));
    // Seed a schedule for B1 and a meeting through existing data (fictional)
    await p.evaluate(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 20, 'days'); commit(n, 'fictional date'); render(); });
    const snapshot = await p.evaluate(() => JSON.stringify({ s: state.schedule, r: state.reviews.length, h: state.history.length }));
    for (const t of ['Year', 'Month', 'Weekly']) { await p.locator('.d-tabs button', { hasText: t === 'Weekly' ? 'Weekly' : t === 'Year' ? 'Year plan' : 'Month' }).click(); await p.waitForTimeout(200); }
    const snapshot2 = await p.evaluate(() => JSON.stringify({ s: state.schedule, r: state.reviews.length, h: state.history.length }));
    ok(dev + ' viewing calendar tabs changes no data', snapshot === snapshot2);
    const s8week = await p.evaluate(() => [...document.querySelectorAll('.d-week')].find(s => s.textContent.includes('S8 stock check'))?.querySelector('h2')?.textContent || '');
    ok(dev + ' S8 appears once in the weekly view', (await p.evaluate(() => [...document.querySelectorAll('.d-week td button')].filter(b => b.textContent.startsWith('S8 stock check')).length)) === 1, s8week);
    // 3. Plain words → existing dialog prefilled, nothing saved until confirm
    await p.locator('.d-tabs button', { hasText: 'Month' }).click(); await p.waitForTimeout(200);
    await p.fill('#d-plain-form input', 'S8 check 1st Dec morning'); await p.click('#d-plain-form button'); await p.waitForTimeout(200);
    const preview = await p.evaluate(() => document.querySelector('.d-preview').textContent);
    ok(dev + ' plain words finds S8 and 1 Dec', /S8 stock check/.test(preview) && /1 Dec 2026/.test(preview), preview.slice(0, 200));
    await p.locator('.d-preview button', { hasText: 'Add' }).click(); await p.waitForTimeout(300);
    const dlg = await p.evaluate(() => ({ open: $('editor').open, date: $('editor').querySelector('input[type=date]')?.value, title: $('editor').textContent.includes('Change due date') }));
    ok(dev + ' Add opens existing due-date dialog prefilled', dlg.open && dlg.title && dlg.date === '2026-12-01', JSON.stringify(dlg));
    const unchanged = await p.evaluate(() => state.schedule.B1 === addInterval(today(), 20, 'days') ? 'same' : state.schedule.B1);
    ok(dev + ' nothing saved before confirming', unchanged === 'same', unchanged);
    await p.locator('#editor button', { hasText: 'Save new due date' }).click(); await p.waitForTimeout(400);
    const saved = await p.evaluate(() => ({ d: state.schedule.B1, meta: state.scheduleMeta?.B1?.changes?.length || 0 }));
    ok(dev + ' earlier date saves through existing rules (logged)', saved.d === '2026-12-01' && saved.meta >= 1, JSON.stringify(saved));
    // Postponing needs a reason (existing rule still enforced)
    await p.fill('#d-plain-form input', 'S8 on 20 Dec'); await p.click('#d-plain-form button'); await p.waitForTimeout(200);
    await p.locator('.d-preview button', { hasText: 'Add' }).click(); await p.waitForTimeout(200);
    await p.locator('#editor button', { hasText: 'Save new due date' }).click(); await p.waitForTimeout(200);
    const blocked = await p.evaluate(() => ({ d: state.schedule.B1, err: $('editor').querySelector('[role=alert]')?.textContent }));
    ok(dev + ' postponing without a reason is still refused', blocked.d === '2026-12-01' && /reason/i.test(blocked.err || ''), JSON.stringify(blocked));
    await p.evaluate(() => $('editor').close());
    // Legal limit: S8 date beyond 3 months from plain words? (existing dialog has no 3-month check; we only report)
    // 4. Staff matrix and pane
    await p.evaluate(() => { const n = clone(); n.staff = [{ id: 's1', person: 'Alex Fictional', role: 'Pharmacist', status: '', start: '2025-02-01', end: '', active: true, services: ['vaccination'], documents: '', annualDue: addInterval(today(), -3, 'days'), credentials: [{ id: 'c1', title: 'Immuniser certificate', reference: 'TEST-001', expiry: addInterval(today(), 20, 'days') }] }]; commit(n, 'fictional staff'); gotoPage('staff'); });
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => ({ rows: document.querySelectorAll('#d-staff-grid tbody tr').length, cells: [...document.querySelectorAll('#d-staff-grid tbody tr td')].map(t => t.textContent.trim()) }));
    ok(dev + ' staff matrix row per person', m.rows === 1, JSON.stringify(m.cells));
    await p.fill('#staff-search', 'zzz'); await p.waitForTimeout(150);
    ok(dev + ' staff search still filters', /No matching staff/.test(await p.evaluate(() => $('staff-rows').textContent)));
    await p.fill('#staff-search', 'alex'); await p.waitForTimeout(150);
    if (dev === 'desktop') { await p.click('#d-staff-grid tbody tr td:nth-child(2)'); await p.waitForTimeout(150); ok(dev + ' row opens detail pane', await p.evaluate(() => !!document.querySelector('.d-pane h2') && document.querySelector('.d-pane h2').textContent === 'Alex Fictional')); }
    await p.click('#d-staff-grid td.name button'); await p.waitForTimeout(300);
    ok(dev + ' name opens existing staff record', await p.evaluate(() => page === 'staff-profile'));
    // 5. Jump search
    await p.evaluate(() => { gotoPage('overview'); }); await p.waitForTimeout(200);
    await p.keyboard.press('Control+k'); await p.waitForTimeout(150);
    ok(dev + ' Ctrl+K opens jump search', await p.evaluate(() => !!$('d-jump')));
    await p.keyboard.type('History'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    ok(dev + ' jump search opens page', await p.evaluate(() => page === 'history' && !$('d-jump')));
    // 6. Editor as side pane / sheet and Esc closes
    await p.evaluate(() => { gotoPage('meetings'); }); await p.waitForTimeout(200);
    await p.locator('main button', { hasText: 'Add Meeting' }).click(); await p.waitForTimeout(200);
    const box = await p.evaluate(() => { const r = $('editor').getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height }; });
    ok(dev + ' editor layout (' + (dev === 'desktop' ? 'side pane' : 'full sheet') + ')', dev === 'desktop' ? box.x > 600 && box.h >= h - 2 : box.w >= w - 2, JSON.stringify(box));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    ok(dev + ' Esc closes the editor', await p.evaluate(() => !$('editor').open));
    // 7. Pharmacy switcher (two fictional sites)
    await p.evaluate(() => { try { addSite('Kensal Street Test Pharmacy', 'Test Owner'); } catch (e) { window.__siteErr = e.message; } });
    await p.waitForTimeout(1500);
    const sw = await p.evaluate(() => ({ name: state.pharmacyName, opts: [...document.querySelectorAll('.d-site option')].map(o => o.textContent), err: window.__siteErr || '' }));
    ok(dev + ' header switcher lists both pharmacies', sw.opts.length === 2, JSON.stringify(sw));
    if (sw.opts.length === 2) {
      const other = await p.evaluate(() => [...document.querySelectorAll('.d-site option')].find(o => !o.selected).value);
      await p.selectOption('.d-site select', other); await p.waitForTimeout(1800);
      const nm = await p.evaluate(() => state.pharmacyName);
      ok(dev + ' switching changes pharmacy', nm !== sw.name, sw.name + ' -> ' + nm);
    }
    // horizontal scroll check on each page
    for (const pg of ['overview', 'audits', 'planner', 'actions', 'staff', 'documents', 'meetings', 'services', 'history']) {
      await p.evaluate(x => { if (x === 'planner') { page = 'planner'; render(); } else gotoPage(x); }, pg); await p.waitForTimeout(200);
      const hs = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (hs) ok(dev + ' no sideways page scroll · ' + pg, false);
    }
    ok(dev + ' no script errors', errs.length === 0, errs.join(' | ').slice(0, 400));
    await p.screenshot({ path: `${OUT}/functional-${dev}-end.png` });
    await ctx.close();
  }
  for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' · ' + r.detail));
  console.log(results.filter(r => r.pass).length + '/' + results.length + ' passed');
  require('fs').writeFileSync(OUT + '/functional-results.json', JSON.stringify(results, null, 1));
  await b.close();
})();
