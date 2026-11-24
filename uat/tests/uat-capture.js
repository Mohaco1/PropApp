// UAT v28 regression capture. Fictional data only. Compares main-area controls with the v27 baseline.
const { chromium } = require('playwright');
const fs = require('fs');
const APP = process.env.APP || '/home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html';
const OUT = process.env.OUT || '/home/user/rpharmacy/uat/tests/out';
const SEED = process.env.SEED || 'basic'; // basic = same seed as baseline; rich = staff, dates, reviews
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const report = {};
  for (const [dev, w, h] of [['desktop', 1280, 860], ['mobile', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.addInitScript(()=>{try{localStorage.setItem('rph-uat-view','laptop')}catch(e){}}); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 300))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
    await p.goto('file://' + APP); await p.waitForTimeout(1500); await p.evaluate(()=>{try{if(D.phone){D.applyView(false);render();}}catch(e){}});
    await p.evaluate((seed) => {
      const n = clone(); n.freshSite = true; n.freshProprietors = true; n.freshSelection = true; n.pharmacyName = 'Harbourview Test Pharmacy';
      n.proprietors = [{ id: 'p1', name: 'Test Owner', membership: 'Not invited', primary: true }]; n.currentReviewer = 'p1';
      n.active = ['daa', 'otp', 'vaccination', 'delivery', 'prescribing'];
      if (seed === 'rich') {
        const t = today(), add = (d) => addInterval(t, d, 'days');
        n.schedule = n.schedule || {};
        n.schedule.B1 = add(-5);
        const ids = catalog().filter(a => a.service && n.active.includes(a.service) && !a.eventOnly).map(a => a.id);
        ids.slice(0, 3).forEach((id, i) => n.schedule[id] = add(2 + i * 3));
        ids.slice(3, 9).forEach((id, i) => n.schedule[id] = '2026-12-' + String(7 + i * 3).padStart(2, '0'));
        n.schedule.M2 = add(9);
        n.staff = [
          { id: 's1', person: 'Alex Fictional', role: 'Pharmacist', status: '', start: '2025-02-01', end: '', active: true, services: ['vaccination'], documents: '', annualDue: add(-3), credentials: [{ id: 'c1', title: 'Immuniser certificate', reference: 'TEST-001', expiry: add(20) }] },
          { id: 's2', person: 'Sam Example', role: 'Pharmacy assistant', status: '', start: '2024-06-01', end: '', active: true, services: [], documents: '', annualDue: add(120), credentials: [] },
          { id: 's3', person: 'Jo Sample', role: 'Intern', status: '', start: '2026-01-10', end: '', active: true, services: ['daa'], documents: '', annualDue: add(40), credentials: [{ id: 'c2', title: 'First aid', reference: 'TEST-002', expiry: add(-10) }] }
        ];
      }
      commit(n, 'UAT test setup (fictional)');
    }, SEED);
    await p.waitForTimeout(800);
    const pages = ['overview', 'audits', 'planner', 'actions', 'staff', 'documents', 'meetings', 'services', 'history'];
    for (const pg of pages) {
      await p.evaluate(x => { if (x === 'planner') { page = 'planner'; render(); } else gotoPage(x); }, pg); await p.waitForTimeout(500);
      const info = await p.evaluate(() => ({
        h1: (document.querySelector('main h1:not([hidden])') || {}).textContent || '',
        buttons: [...document.querySelectorAll('main button')].map(x => x.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean),
        inputs: [...document.querySelectorAll('main input,main select,main textarea')].map(x => (x.labels && x.labels[0] ? x.labels[0].textContent.trim().slice(0, 40) : x.name || x.id || x.type)),
        nav: [...document.querySelectorAll('body>nav button')].map(x => x.textContent.trim()),
        current: document.querySelector('body>nav [aria-current=page]')?.dataset.page || '',
        hscroll: document.documentElement.scrollWidth > window.innerWidth + 1
      }));
      report[dev + ':' + pg] = info;
      await p.screenshot({ path: `${OUT}/${SEED}-${dev}-${pg}.png`, fullPage: dev === 'desktop' });
      if (pg === 'planner') for (const tab of ['Year', 'Month']) {
        await p.evaluate(t => { plannerTab = t; render(); }, tab); await p.waitForTimeout(300);
        report[dev + ':planner-' + tab] = await p.evaluate(() => ({ h1: 'Calendar', buttons: [...document.querySelectorAll('main button')].length, hscroll: document.documentElement.scrollWidth > window.innerWidth + 1 }));
        await p.screenshot({ path: `${OUT}/${SEED}-${dev}-planner-${tab}.png`, fullPage: dev === 'desktop' });
      }
      if (pg === 'planner') await p.evaluate(() => { plannerTab = 'Weekly'; });
    }
    report[dev + ':errors'] = errs;
    await p.close();
  }
  fs.writeFileSync(`${OUT}/${SEED}-report.json`, JSON.stringify(report, null, 1));
  // Compare with baseline (same seed only)
  if (SEED === 'basic') {
    const base = JSON.parse(fs.readFileSync('/home/user/rpharmacy/uat/baseline/baseline-report.json', 'utf8'));
    for (const k of Object.keys(base)) {
      if (k.endsWith(':errors')) continue; const a = base[k], c = report[k]; if (!c) { console.log('MISSING', k); continue; }
      const missB = a.buttons.filter(x => !c.buttons.includes(x)), missI = a.inputs.filter(x => !c.inputs.includes(x));
      console.log(k.padEnd(20), 'h1', JSON.stringify(a.h1) === JSON.stringify(c.h1) ? 'same' : a.h1 + ' -> ' + c.h1, '| buttons', a.buttons.length, '->', c.buttons.length, missB.length ? 'MISSING ' + JSON.stringify(missB) : '', '| fields', a.inputs.length, '->', c.inputs.length, missI.length ? 'MISSING ' + JSON.stringify(missI) : '');
    }
  }
  for (const [k, v] of Object.entries(report)) if (k.endsWith(':errors')) console.log(k, JSON.stringify(v)); else if (v.hscroll) console.log('HSCROLL', k);
  await b.close();
})();
