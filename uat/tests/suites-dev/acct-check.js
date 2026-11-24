const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + require('path').resolve(__dirname, '../../../dev/proprietor-hub.html'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(async () => { backupPanel(); await new Promise(r => setTimeout(r, 300));
    const box = document.getElementById('account-copy');
    let saveErr = ''; try { await RPH.acct.save(); } catch (e) { saveErr = e.message; }
    return { panel: !!box, buttons: [...box.querySelectorAll('button')].map(b => b.textContent), status: box.querySelector('#account-status').textContent, saveErr }; });
  // simulate the artifact runtime with an in-memory db to test the save/restore round trip and chunking
  const rt = await page.evaluate(async () => {
    const store = new Map();
    const mk = path => ({ get: async () => ({ exists: store.has(path), data: () => store.get(path) }), set: async d => { if (JSON.stringify(d).length > 256 * 1024) throw { code: 'invalid_argument' }; store.set(path, JSON.parse(JSON.stringify(d))); }, delete: async () => store.delete(path) });
    window.claude = { use: async n => n === 'db' ? { collection: c => ({ doc: id => mk(c + '/' + id) }) } : n === 'user' ? { id: async () => 'u_test' } : null };
    const n0 = clone(); n0.freshSite = true; n0.pharmacyName = 'Test Pharmacy'; n0.proprietors = [{ id: 'p1', name: 'Test Owner', membership: 'Not invited', primary: true }]; n0.currentReviewer = 'p1'; n0.active = ['daa']; commit(n0, 'test setup');
    RPH.acct.CHUNK = 400; // force several parts
    const before = JSON.stringify(portableBackup().data.active);
    const s = await RPH.acct.save();
    const { meta, backup } = await RPH.acct.load();
    return { parts: s.count, metaCount: meta.count, keys: [...store.keys()].length, sameActive: JSON.stringify(backup.data.active) === before };
  });
  console.log(JSON.stringify({ r, rt }, null, 1), 'errors', errs);
  await browser.close();
})();
