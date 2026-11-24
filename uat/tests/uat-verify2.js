// Second verification: walks the preservation checklist independently of uat-functional.js. Fictional data only.
const { chromium } = require('playwright');
const APP = '/home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html', OUT = '/home/user/rpharmacy/uat/tests/out';
const res = []; const ok = (n, p, d = '') => res.push({ n, p: !!p, d });
(async () => {
  const b = await chromium.launch();
  for (const [dev, w, h] of [['desktop', 1280, 860], ['mobile', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.addInitScript(()=>{try{localStorage.setItem('rph-uat-view','laptop')}catch(e){}}); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('file://' + APP); await p.waitForTimeout(1500); await p.evaluate(()=>{try{if(D.phone){D.applyView(false);render();}}catch(e){}});
    // Fresh store: landing page still first, nav inert
    ok(dev + ' first-use landing still shown on a new store', await p.evaluate(() => !state.freshSite && document.body.classList.contains('first-use')));
    await p.screenshot({ path: `${OUT}/v2-${dev}-landing.png` });
    await p.evaluate(() => { const n = clone(); Object.assign(n, { freshSite: true, onboarded: true, freshProprietors: true, freshSelection: true, pharmacyName: 'Harbourview Test Pharmacy', proprietors: [{ id: 'p1', name: 'Test Owner', primary: true }], currentReviewer: 'p1', active: ['daa', 'otp', 'vaccination'] }); n.schedule.B1 = addInterval(today(), 3, 'days'); n.schedule.M1 = addInterval(today(), 1, 'days'); commit(n, 'fictional'); gotoPage('overview'); });
    await p.waitForTimeout(400);
    // Shell
    const nav = await p.evaluate(() => [...document.querySelectorAll('body>nav [data-page]')].map(b => b.dataset.page));
    ok(dev + ' all original pages still in navigation', ['overview', 'audits', 'actions', 'staff', 'documents', 'meetings', 'services', 'history', 'setup'].every(x => nav.includes(x)), nav.join(','));
    ok(dev + ' Recording-as chip present', await p.evaluate(() => !!$('rph-header-actor')));
    // Audits: tabs and Calendar tab still work; returning resets to Due Now
    await p.evaluate(() => gotoPage('audits'));
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#review-tabs button')].map(b => b.textContent));
    ok(dev + ' Audits tabs unchanged', tabs.join('|') === 'Due Now|Upcoming|Completed|All Audits|Calendar', tabs.join('|'));
    // Planner Month then go to Audits → Audits tab state must not stick to Calendar
    await p.evaluate(() => { page = 'planner'; plannerTab = 'Month'; render(); });
    ok(dev + ' Month tab shows the existing month grid', await p.evaluate(() => !!document.querySelector('#calendar-month .wq-month')));
    await p.evaluate(() => { calendarDay = addInterval(today(), 1, 'days'); render(); });
    const dayList = await p.evaluate(() => $('cal-rows').textContent);
    ok(dev + ' selected day lists the scheduled meeting', /Staff safety meeting/.test(dayList), dayList.slice(0, 120));
    await p.locator('#calendar-month button', { hasText: 'Schedule meeting on' }).click(); await p.waitForTimeout(200);
    ok(dev + ' Schedule meeting dialog opens from Calendar', await p.evaluate(() => !!$('plan-meeting')));
    await p.evaluate(() => $('editor').close());
    await p.evaluate(() => { page = 'audits'; render(); });
    ok(dev + ' leaving Calendar restores the Audits tab', await p.evaluate(() => reviewTab !== 'Calendar' || false), await p.evaluate(() => reviewTab));
    await p.evaluate(() => { plannerTab = 'Weekly'; });
    // Review editor opens from Calendar weekly row
    await p.evaluate(() => { page = 'planner'; render(); });
    await p.locator('.d-week td button', { hasText: 'S8 stock check' }).click(); await p.waitForTimeout(300);
    ok(dev + ' review opens from Calendar row (existing editor)', await p.evaluate(() => $('editor').open && /S8/.test($('editor').textContent)));
    await p.evaluate(() => $('editor').close());
    // Tasks, policies, meetings, history, services, setup still render their headings
    for (const [pg, re] of [['actions', /Task/], ['documents', /Polic/], ['meetings', /Meeting/], ['history', /History/], ['services', /Service/]]) {
      await p.evaluate(x => gotoPage(x), pg); await p.waitForTimeout(200);
      ok(dev + ' ' + pg + ' renders', re.test(await p.evaluate(() => document.querySelector('main h1')?.textContent || '')));
    }
    await p.evaluate(() => gotoPage('history'));
    ok(dev + ' history exports present', await p.evaluate(() => [...document.querySelectorAll('main button')].some(b => /CSV/i.test(b.textContent))));
    await p.evaluate(() => beginSetup()); await p.waitForTimeout(300);
    ok(dev + ' Pharmacy setup opens', await p.evaluate(() => page === 'setup'));
    await p.screenshot({ path: `${OUT}/v2-${dev}-setup.png`, fullPage: dev === 'desktop' });
    // Storage: no new saved keys from the layer
    const keys = await p.evaluate(() => Object.keys(JSON.parse(JSON.stringify(state))).sort().join(','));
    ok(dev + ' state has no layer-specific fields', !/planner|conceptD|d-/.test(keys));
    // Onboarding dialog screenshot
    await p.evaluate(() => fsServicesSelect()); await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/v2-${dev}-onboarding.png` });
    await p.evaluate(() => $('editor').close());
    ok(dev + ' no script errors', !errs.length, errs.join('|').slice(0, 300));
    await p.close();
  }
  for (const r of res) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' · ' + r.d));
  console.log(res.filter(r => r.p).length + '/' + res.length + ' passed');
  require('fs').writeFileSync(OUT + '/verify2-results.json', JSON.stringify(res, null, 1));
  await b.close();
})();
