const { chromium } = require('playwright');
const ids = ['daa','otp','delivery','reviews','staged','vaccination','prescribing','simple','complex','aged','screening','adherence','nsp','certificates','vaping','cannabis','funding'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file:///home/user/rpharmacy/dev/' + (process.env.APP || 'proprietor-hub.html'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate((ids) => { const n = clone(); n.active = ids; n.flags ??= {}; commit(n, 'test: activate all services'); }, ids);
  const report = {};
  for (const id of ids) {
    await page.evaluate((id) => { setDraft('fresh-config/' + id, null); fsCard(id); }, id);
    const seen = [];
    let done = false;
    for (let step = 0; step < 80 && !done; step++) {
      await page.waitForTimeout(60);
      const title = await page.locator('#dialog-title').textContent().catch(() => '');
      if (/Service setup complete/.test(title)) { done = true; break; }
      const st = await page.locator('#pe-content [role=status]').textContent().catch(() => '');
      const q = await page.evaluate(() => [...document.querySelectorAll('#pe-content > p')].map(p => p.textContent).filter(t => !/^(Question|Start here|Not sure|Choosing|Your answer|Or add)/.test(t))[0] || '');
      seen.push(st + ' | ' + q);
      const boxes = page.locator('#pe-content input[type=checkbox]');
      if (await boxes.count()) {
        if (!(await boxes.first().isChecked())) await boxes.first().check();
        const d = page.locator('#pe-content [id^=qm-describe] input, #pe-content [id^=qm-describe] textarea');
        if (await d.count()) await d.first().fill('Test description');
        await page.locator('#pe-content button', { hasText: /^(Continue|Save and continue)$/ }).click();
        continue;
      }
      const opts = page.locator('#pe-content button.fresh-option');
      if (await opts.count()) {
        await opts.first().click();
        const d = page.locator('#pe-content [id^=qm-describe] textarea, #pe-content [id^=qm-describe] input');
        if (await d.count()) { await d.first().fill('Test description'); await page.locator('#pe-content [id^=qm-describe] button', { hasText: 'Save' }).click(); }
        continue;
      }
      const field = page.locator('#pe-content input:not([type=checkbox]), #pe-content textarea');
      if (await field.count()) {
        await field.first().fill('Test location ' + step);
        const btn = page.locator('#pe-content button', { hasText: /^(Continue|Save new)$/ });
        await btn.first().click();
        continue;
      }
      seen.push('STUCK'); break;
    }
    const complete = await page.evaluate((id) => !!state.serviceConfig?.[id]?.complete, id);
    report[id] = { complete, steps: seen.length, questions: seen };
  }
  const summary = Object.fromEntries(Object.entries(report).map(([k, v]) => [k, (v.complete ? 'OK ' : 'FAIL ') + v.steps + ' screens']));
  console.log(JSON.stringify(summary, null, 1));
  require('fs').writeFileSync('/home/user/rpharmacy/uat/tests/out-dev/walk-all-report.json', JSON.stringify(report, null, 1));
  const after = await page.evaluate(() => ({
    tasks: Object.values(state.taskLedger || {}).filter(t => t.status === 'Outstanding').map(t => t.text),
    books: Object.values(state.locationBook || {}).length,
    daaDocHasUndefined: /undefined/.test(sopDocument('daa')), otpDocHasUndefined: /undefined/.test(sopDocument('otp')),
    deliveryDoc: (RPH.sop.document('delivery') || '').split('\n').filter(l => /Deliveries are made|Record the handover|Pack for transport/.test(l))
  }));
  console.log(JSON.stringify(after, null, 1));
  console.log('errors', errs.slice(0, 10));
  await browser.close();
})();
