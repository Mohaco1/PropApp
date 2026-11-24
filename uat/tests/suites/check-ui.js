const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const res = await page.evaluate(() => {
    try { state.active = ['daa']; fsCard('daa'); } catch (e) { return { err: String(e) }; }
    const dlg = document.querySelector('.fresh-form');
    const pick = el => el ? getComputedStyle(el) : null;
    const opt = document.querySelector('.fresh-form .fresh-option');
    const act = [...document.querySelectorAll('.fresh-form button')].find(b => !b.classList.contains('fresh-option'));
    const cb = document.querySelector('.fresh-form input[type=checkbox]');
    return {
      hasDialog: !!dlg,
      status: document.querySelector('.fresh-form [role=status]')?.textContent,
      optClass: opt?.className, optBg: pick(opt)?.backgroundColor, optBorder: pick(opt)?.borderTopColor,
      actText: act?.textContent, actBg: pick(act)?.backgroundColor, actColor: pick(act)?.color,
      cbW: pick(cb)?.width, cbAccent: pick(cb)?.accentColor
    };
  });
  console.log(JSON.stringify(res, null, 2));
  console.log('pageerrors:', errors.slice(0, 5));
  await page.screenshot({ path: '/home/user/rpharmacy/uat/tests/out/daa-routes-390.png' });
  await browser.close();
})();
