// Proves the rebuilt procedure drafts are word-for-word the same as the current app's, for the example pharmacy.
const { chromium } = require('playwright'); const path = require('path'); const esbuild = require('esbuild'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.resolve(__dirname, '../../uat/app/rpharmacy-uat-testing.html')); await p.waitForTimeout(1500);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => RPH.example.open())]); await p.waitForTimeout(1500);
  const old = await p.evaluate(() => Object.fromEntries(state.active.map(id => [id, sopDocument(id).replace('and approve it in Policies.', 'and adopt it in Procedures.').replace(/\(Policies\)/g, '(Procedures)')])));
  // The rebuild changes only "approve it in Policies" to "adopt it in Procedures" (Gemini N-12); everything else must match.
  const backup = await p.evaluate(() => portableBackup());
  await b.close();
  const r = await esbuild.build({ stdin: { contents: `import { importLegacy } from './src/legacy.js'; import { draftText } from './src/procgen.js'; module.exports = (bk) => { const { pharmacy } = importLegacy(bk); return Object.fromEntries(Object.keys(pharmacy.services).map(id => [id, draftText(pharmacy, id)])); };`, resolveDir: path.resolve(__dirname, '..'), loader: 'js' }, bundle: true, write: false, platform: 'node', format: 'cjs', loader: { '.json': 'json' } });
  const m = { exports: {} }; new Function('module', 'exports', 'require', 'crypto', r.outputFiles[0].text)(m, m.exports, require, require('crypto').webcrypto);
  const neu = m.exports(backup); let bad = 0;
  for (const id of Object.keys(old)) { const same = old[id] === neu[id]; if (!same) { bad++; const a = old[id].split('\n'), b2 = (neu[id] || '').split('\n'); const i = a.findIndex((l, k) => l !== b2[k]); console.log('DIFF', id, 'line', i, '\n old:', a[i], '\n new:', b2[i]); } else console.log('SAME', id, old[id].length + ' chars'); }
  process.exit(bad ? 1 : 0);
})();
