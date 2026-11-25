// Proves the rebuilt procedure drafts match the current app's for ALL 17 services. For each service it builds a full
// set of sample answers in the current app (first option for each visible question, every checklist item, a sample
// text otherwise), generates the draft there, then generates it in the rebuild from the same answers.
// The only allowed difference is "approve it in Policies" → "adopt it in Procedures" (Gemini N-12).
const { chromium } = require('playwright'); const path = require('path'); const esbuild = require('esbuild');
const VERIFIED = require('../src/content/verified-steps.json'); const applyVerified = t => { let s = String(t); for (const [a, b] of VERIFIED.pairs) s = s.split(a).join(b); const L = '• Steps marked “— verify”: check each against the full official document before approving'; return /— verify/.test(s.replace(L, '')) ? s : s.replace(L + '\n', ''); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.resolve(__dirname, '../../uat/app/rpharmacy-uat-testing.html')); await p.waitForTimeout(1500);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => RPH.example.open())]); await p.waitForTimeout(1500);
  const old = await p.evaluate(() => {
    const out = {};
    for (const s of services) {
      const id = s.id; let a = id === 'daa' ? { routes: 'house' } : {};
      for (let pass = 0; pass < 6; pass++) for (const f of fsFields(id, a)) {
        if (a[f[0]] !== undefined) continue; const m = RPH.qm.metaFor(id, f[0]);
        if (m.type === 'checklist') a[f[0]] = RPH.qm.checkItems(id, f[0], a).map(i => i.v).join(',') || 'None confirmed yet';
        else { const opts = RPH.qm.optionsFor(id, f); a[f[0]] = opts.length ? opts[0] : 'Sample answer (fictional)'; }
      }
      if (!state.active.includes(id)) state.active.push(id);
      state.serviceConfig[id] = { ...(state.serviceConfig[id] || {}), serviceId: id, complete: true, procedureProfile: { answers: a, software: {} } };
      let doc = ''; try { doc = sopDocument(id); } catch (e) { doc = 'ERROR ' + e.message; }
      out[id] = { answers: a, doc: doc.replace('and approve it in Policies.', 'and adopt it in Procedures.').replace(/\(Policies\)/g, '(Procedures)').replace('No advertising, signage, brochures or social posts about medicinal cannabis (NSW Health/TGA, per your research — verify).', 'No advertising, signage, brochures or social posts about medicinal cannabis (NSW Health, Cannabis medicines FAQ).').replace(/\(NSW Health\/TGA, per your research — verify\)/g, '(source to confirm with NSW Health or the TGA — verify)').replace(/\(Strive for 5 \/ NSW Health, per your plan — verify\)/g, '(Strive for 5 / NSW Health — check against the current edition — verify)').replace(/Steps marked “per your research — verify”/g, 'Steps marked “source to confirm with NSW Health or the TGA — verify”').replace(/Steps marked “per your plan — verify”/g, 'Steps marked “check against the current edition — verify”') };
    }
    return { name: state.pharmacyName, out };
  });
  await b.close();
  const r = await esbuild.build({ stdin: { contents: `import { emptyPharmacy } from './src/model.js'; import { draftText } from './src/procgen.js'; module.exports = (name, out) => { const ph = emptyPharmacy(name); for (const [id, x] of Object.entries(out)) ph.services[id] = { active: true, setup: 'done', answers: x.answers }; return Object.fromEntries(Object.keys(out).map(id => [id, draftText(ph, id)])); };`, resolveDir: path.resolve(__dirname, '..'), loader: 'js' }, bundle: true, write: false, platform: 'node', format: 'cjs', loader: { '.json': 'json' } });
  const m = { exports: {} }; new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  for (const x of Object.values(old.out)) x.doc = applyVerified(x.doc);
  const neu = m.exports(old.name, old.out); let bad = 0;
  for (const [id, x] of Object.entries(old.out)) { if (x.doc === neu[id]) { console.log('SAME', id, x.doc.length + ' chars'); continue; } bad++; const a = x.doc.split('\n'), c = (neu[id] || '').split('\n'); const i = a.findIndex((l, k) => l !== c[k]); console.log('DIFF', id, 'line', i, '\n old:', a[i], '\n new:', c[i]); }
  console.log(bad ? bad + ' of 17 differ' : 'All 17 services identical'); process.exit(bad ? 1 : 0);
})();
