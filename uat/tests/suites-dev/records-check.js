const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///home/user/rpharmacy/dev/proprietor-hub.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => { state.active = ['daa']; setDraft('fresh-config/daa', { base: JSON.stringify(sopProfile('daa')), answers: { routes: 'house', population: 'Community patients', preparation: 'Pharmacists', listCheck: 'Pharmacist verifies before packing' }, key: 'signoff' }); fsCard('daa'); });
  await page.waitForTimeout(300);
  console.log('status:', await page.evaluate(() => document.querySelector('#pe-content [role=status]')?.textContent), '| record format shown:', await page.evaluate(() => /record format/i.test(document.getElementById('pe-content').textContent)), '| errors:', errs);
  await browser.close();
})();
