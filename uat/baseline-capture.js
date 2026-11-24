// Baseline capture of the CURRENT app (dev v27) with fictional seed data. Read-only use of the app file.
const { chromium } = require('playwright');
const APP = process.env.APP || '/home/user/rpharmacy/dev/proprietor-hub.html';
const OUT = process.env.OUT || '/home/user/rpharmacy/uat/baseline';
(async () => {
  const b = await chromium.launch(); const report = {};
  for (const [dev, w, h] of [['desktop', 1280, 860], ['mobile', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await p.goto('file://' + APP); await p.waitForTimeout(1500);
    await p.evaluate(() => { const n = clone(); n.freshSite = true; n.freshProprietors = true; n.freshSelection = true; n.pharmacyName = 'Harbourview Test Pharmacy'; n.proprietors = [{ id: 'p1', name: 'Test Owner', membership: 'Not invited', primary: true }]; n.currentReviewer = 'p1'; n.active = ['daa', 'otp', 'vaccination', 'delivery', 'prescribing']; commit(n, 'baseline test setup (fictional)'); });
    await p.waitForTimeout(800);
    const pages = ['overview', 'audits', 'actions', 'staff', 'documents', 'meetings', 'services', 'history'];
    for (const pg of pages) {
      await p.evaluate(x => gotoPage(x), pg); await p.waitForTimeout(500);
      const info = await p.evaluate(() => ({
        h1: (document.querySelector('main h1') || {}).textContent || '',
        buttons: [...document.querySelectorAll('main button')].map(x => x.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean),
        inputs: [...document.querySelectorAll('main input,main select,main textarea')].map(x => (x.labels && x.labels[0] ? x.labels[0].textContent.trim().slice(0, 40) : x.name || x.id || x.type)),
        nav: [...document.querySelectorAll('body>nav button')].map(x => x.textContent.trim())
      }));
      report[dev + ':' + pg] = info;
      await p.screenshot({ path: `${OUT}/${dev}-${pg}.png`, fullPage: dev === 'desktop' });
    }
    report[dev + ':errors'] = errs;
    await p.close();
  }
  require('fs').writeFileSync(OUT + '/baseline-report.json', JSON.stringify(report, null, 1));
  console.log(Object.entries(report).map(([k, v]) => k + ' ' + (v.h1 !== undefined ? v.h1 + ' · ' + v.buttons.length + ' buttons · ' + v.inputs.length + ' fields' : JSON.stringify(v))).join('\n'));
  await b.close();
})();
