const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const out = {};
    out.daaFinal = sopFields.daa.find(f => f[0] === 'finalCheck')[1];
    out.genericSimple = sopFields.simple.map(f => f[1]);
    out.genericNsp = sopFields.nsp.map(f => f[1]);
    out.otpRecords = sopFields.otp.find(f => f[0] === 'records')[1];
    out.otpRecordsOpts = sopFields.otp.find(f => f[0] === 'records')[2].join(' | ');
    out.sopGenericUntouched = sopGeneric.map(f => f[1]);
    out.routes = fsRouteOptions.map(r => r[1]);
    // procedure text for DAA with multi-select answers
    state.active = ['daa', 'otp', 'delivery'];
    const n = clone(); sopSet(n, 'daa', { routes: 'house,routeA', population: 'Community patients,Residential aged care residents', preparation: 'Technicians or assistants,Pharmacists', listCheck: 'Pharmacist verifies before packing', funded: 'PPA DAA Program', sampleFrequency: 'Quarterly' });
    commit(n, 'test');
    const doc = sopDocument('daa');
    out.docPopulation = doc.split('\n').find(l => /population/i.test(l));
    out.docPrep = doc.split('\n').find(l => /prepar/i.test(l) && /Pharmacists/.test(l));
    out.docRoutes = doc.split('\n').find(l => /How are your DAAs packed/.test(l));
    out.consentCondVisible = fsFields('daa', sopValues('daa')).some(f => f[0] === 'fundedConsent');
    out.daaSchedule = assuranceMonths(sopValues('daa').sampleFrequency);
    out.delivery = typeof RPH.sop.document('delivery');
    // card renders with new label
    state.active = ['daa']; setDraft('fresh-config/daa', { base: JSON.stringify(sopProfile('daa')), answers: sopValues('daa'), key: 'finalCheck' }); fsCard('daa');
    out.cardLabel = [...document.querySelectorAll('#pe-content p')].map(p => p.textContent).find(t => /Final check/.test(t));
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors', errs);
  await browser.close();
})();
