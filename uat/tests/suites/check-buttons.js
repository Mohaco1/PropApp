const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    state.active = ['daa'];
    const list = () => [...document.querySelectorAll('.fresh-form button, .fresh-form label')].map(e => e.textContent.trim());
    fsCard('daa'); const routes = { status: document.querySelector('.fresh-form [role=status]')?.textContent, items: list() };
    const cfg = 'fresh-config/daa';
    setDraft(cfg, { base: JSON.stringify(sopProfile('daa')), answers: { routes: 'house' }, key: 'packing' });
    fsCard('daa'); const packing = { status: document.querySelector('.fresh-form [role=status]')?.textContent, items: list() };
    return { routes, packing };
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
