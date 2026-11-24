const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    state.active = ['daa'];
    const n = clone(); sopSet(n, 'daa', { routes: 'house,routeA', population: 'Community patients,Residential aged care residents', preparation: 'Technicians or assistants,Pharmacists', listCheck: 'Pharmacist verifies before packing', funded: 'PPA DAA Program', sampleFrequency: 'Quarterly' });
    const ok = commit(n, 'test');
    return { ok, saved: sopValues('daa'), doc: sopDocument('daa').slice(0,1800) };
  });
  console.log(JSON.stringify(r, null, 1), 'errors', errs);
  await browser.close();
})();
