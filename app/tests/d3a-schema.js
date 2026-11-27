// Batch D3-A (L-03 local schema v2, deterministic migration and tombstone merge). Fails on any console error.
// 1. migratePharmacy is pure, synchronous and deterministic (no uid(), no clock), idempotent, and gives two devices the
//    same ids for the same legacy record; duplicate procedures for one service become one "proc:<service>".
// 2. merge3: a deletedAt tombstone wins over a concurrent or stale edit, unless the base held that deletedAt and the live
//    side undeleted it later; a scalar both sides changed follows the parent's updatedAt; rev is never blended.
// 3. Storage (IndexedDB, two tabs): deleting writes propapp:tomb:<id> (never propapp:ph:*), a stale tab can't bring the
//    pharmacy back, re-creating or restoring clears the tombstone, propapp:sync:<id> is kept apart from the local merge
//    base, remote copies and loaded records are migrated.
// 4. Real taps: format 1 backups (PropApp, Sigil, PharmLedger) and an R.Pharmacy (version 2) backup restore as schema
//    2; deleting a pharmacy in More leaves a tombstone and no propapp:ph:* key.
const esbuild = require('esbuild'); const path = require('path'); const fs = require('fs'); const os = require('os');
const { chromium } = require('playwright');
const { phone, ok, done, tap, text, saved } = require('./helpers.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'd3a-'));
const SRC = path.resolve(__dirname, '../src');
const bundle = async (format, globalName) => (await esbuild.build({ stdin: { contents: "export * from './model.js'; export * as store from './store.js';", resolveDir: SRC, loader: 'js' }, bundle: true, write: false, format, globalName, loader: { '.css': 'text', '.json': 'json' }, target: 'es2020', logLevel: 'silent' })).outputFiles[0].text;
const J = x => JSON.stringify(x);

// A schema 1 record as an earlier build saved it: no ids on history, action logs, procedure versions or reviews,
// two procedures for one service, repeated identical history lines.
const legacyPh = () => ({
  id: 'ph-d3a', schema: 1, name: 'Banksia Test Pharmacy (fictional)', address: '', region: '', identifier: '',
  proprietors: [{ id: 'o1', name: 'Alex Test' }], recordingAs: 'o1', services: { daa: { active: true, setup: 'done', answers: {} } }, flags: {}, schedule: {},
  records: [{ id: 'r1', type: 'B1', kind: 'review', date: '2026-10-01', at: '2026-10-01T02:00:00.000Z', answers: [], fields: {}, notes: '', actionIds: [] }],
  actions: { a1: { id: 'a1', title: 'Fix the fridge log (fictional)', due: '2026-12-01', status: 'open', created: '2026-10-01', log: [
    { at: '2026-10-01T02:00:00.000Z', by: 'Alex Test', kind: 'raised', text: 'Added' }, { at: '2026-10-02T02:00:00.000Z', by: 'Alex Test', kind: 'updated', text: 'Called' }] } },
  staff: [], documents: [{ title: 'Fridge manual' }], log: [{ date: '2026-10-03', what: 'Noted a thing' }],
  history: [{ at: '2026-10-01T02:00:00.000Z', by: 'Alex Test', what: 'Saved' }, { at: '2026-10-01T02:00:00.000Z', by: 'Alex Test', what: 'Saved' }, { at: '2026-11-20T05:30:00.000Z', by: 'Alex Test', what: 'Recorded · B1' }],
  procedures: [
    { id: 'old-1', service: 'daa', title: 'DAA procedure', status: 'adopted', versions: [{ v: '0.1', body: 'one', at: '2026-09-01T00:00:00.000Z', status: 'Draft' }, { v: '1.0', body: 'one', at: '2026-09-02T00:00:00.000Z', status: 'Adopted' }], reviews: [{ date: '2026-10-05', by: 'Alex Test', version: '1.0', note: '' }] },
    { id: 'old-2', service: 'daa', title: 'DAA procedure', status: 'draft', versions: [{ v: '1.0', body: 'one', at: '2026-09-02T00:00:00.000Z', status: 'Adopted' }, { v: '1.1', body: 'two', at: '2026-11-01T00:00:00.000Z', status: 'Draft' }] },
    { id: 'old-3', service: 'otp', title: 'OTP procedure', status: 'draft', versions: [{ v: '0.2', body: 'b', at: '2026-08-02T00:00:00.000Z', status: 'Draft' }, { v: '0.1', body: 'a', at: '2026-08-01T00:00:00.000Z', status: 'Draft' }] },
  ],
  obligations: {}, settings: { created: '2026-09-01T00:00:00.000Z', setupDone: true },
});

(async () => {
  // ── 1. migratePharmacy (pure, in Node, with the clock and random ids switched off so any call would throw)
  const modFile = path.join(TMP, 'model.cjs'); fs.writeFileSync(modFile, await bundle('cjs')); const M = require(modFile);
  ok(M.SCHEMA === 2, '1. SCHEMA is 2');
  const e = M.emptyPharmacy('X'); ok(e.schema === 2 && e.rev === 0 && e.deletedAt === null && typeof e.updatedAt === 'string', '1. emptyPharmacy has schema 2, rev 0, updatedAt and deletedAt null');
  const RealDate = Date, realUUID = crypto.randomUUID; let clockCalls = 0;
  global.Date = class extends RealDate { constructor(...a) { if (!a.length) clockCalls++; super(...a); } static now() { clockCalls++; return RealDate.now(); } };
  crypto.randomUUID = () => { clockCalls++; return 'x'; };
  const input = legacyPh(), before = J(input);
  const devA = M.migratePharmacy(input), devB = M.migratePharmacy(JSON.parse(before));
  global.Date = RealDate; crypto.randomUUID = realUUID;
  ok(clockCalls === 0, '1. migratePharmacy never reads the clock or makes a random id (' + clockCalls + ' calls)');
  ok(J(input) === before, '1. migratePharmacy does not change its input');
  ok(J(devA) === J(devB), '1. two devices migrating the same record get identical output, ids included');
  ok(J(M.migratePharmacy(devA)) === J(devA), '1. migrating twice changes nothing (idempotent)');
  const hids = devA.history.map(x => x.id);
  ok(hids.every(Boolean) && new Set(hids).size === 3 && /^h:ph-d3a:[0-9a-f]{16}$/.test(hids[0]), '1. history entries get distinct 64-bit ids, repeated identical lines included');
  ok(devA.actions.a1.log.every(x => /^al:a1:[0-9a-f]{16}$/.test(x.id)) && devA.log[0].id && devA.documents[0].id && devA.proprietors[0].id === 'o1' && devA.records[0].id === 'r1', '1. action logs, owner log and documents get ids; existing ids are kept');
  ok(devA.schema === 2 && devA.rev === 0 && devA.deletedAt === null && devA.updatedAt === '2026-11-20T05:30:00.000Z', '1. schema 2, rev 0, deletedAt null and updatedAt from the latest timestamp in the record');
  const bare = M.migratePharmacy({ id: 'e', rev: -3, deletedAt: 'soon', history: [] });
  ok(bare.updatedAt === '1970-01-01T00:00:00.000Z' && bare.rev === 0 && bare.deletedAt === null, '1. no timestamps: updatedAt falls back to 1970; a bad rev becomes 0 and a bad deletedAt null');
  ok(M.migratePharmacy({ id: 'e', deletedAt: '2026-11-01T00:00:00Z' }).deletedAt === '2026-11-01T00:00:00.000Z', '1. a real deletedAt is kept (as an ISO time)');
  // duplicates for one service
  const daa = devA.procedures.filter(p => p.service === 'daa');
  ok(devA.procedures.length === 2 && daa.length === 1 && daa[0].id === 'proc:daa', '1. two procedures for one service become one with id proc:daa');
  ok(J(daa[0].versions.map(v => v.v)) === J(['0.1', '1.0', '1.1']) && daa[0].versions.every(v => /^ver:daa:/.test(v.id)), '1. their versions are deduplicated (the shared 1.0 once) and sorted, each with an id');
  ok(daa[0].reviews.length === 1 && /^prv:daa:/.test(daa[0].reviews[0].id) && daa[0].status === 'adopted', '1. the review is kept with an id and the adopted status stays');
  const otp = devA.procedures.find(p => p.service === 'otp');
  ok(otp.id === 'proc:otp' && J(otp.versions.map(v => v.v)) === J(['0.2', '0.1']), '1. a procedure alone for its service keeps its versions in their original order');
  const swapped = legacyPh(); swapped.procedures = [swapped.procedures[1], swapped.procedures[0], swapped.procedures[2]];
  ok(J(M.migratePharmacy(swapped).procedures[0].versions) === J(daa[0].versions), '1. the merged versions are the same whichever duplicate came first');

  // ── 2. merge3
  const S = M.store, T0 = '2026-11-01T00:00:00.000Z', T1 = '2026-11-02T00:00:00.000Z', T2 = '2026-11-03T00:00:00.000Z';
  const live = { id: 'p', name: 'A', updatedAt: T0, deletedAt: null, rev: 1 };
  let r = S.merge3(live, { ...live, name: 'B', updatedAt: T2 }, { ...live, deletedAt: T1, updatedAt: T1 });
  ok(r.deletedAt === T1, '2. a deletion wins over a concurrent edit, even a later one');
  r = S.merge3(live, { ...live, deletedAt: T1, updatedAt: T1 }, { ...live, name: 'C', updatedAt: T2, rev: 4 });
  ok(r.deletedAt === T1 && r.name === 'C', '2. it wins from either side (the other side’s edit is still merged in)');
  const dead = { ...live, deletedAt: T1, updatedAt: T1 };
  r = S.merge3(dead, { ...dead, deletedAt: null, updatedAt: T2 }, { ...dead });
  ok(r.deletedAt === null, '2. undeleting after the deletion, from a base that held it, keeps it live');
  r = S.merge3(dead, { ...dead, deletedAt: null, updatedAt: T0 }, { ...dead, name: 'Z' });
  ok(r.deletedAt === T1, '2. an undelete no later than the deletion loses');
  r = S.merge3(live, { ...live, deletedAt: null, updatedAt: T2 }, { ...live, deletedAt: T1, updatedAt: T1 });
  ok(r.deletedAt === T1, '2. a base that never held the deletion can’t undelete it');
  r = S.merge3(live, { ...live, name: 'B', updatedAt: T1, rev: 2 }, { ...live, name: 'C', updatedAt: T2, rev: 7 });
  ok(r.name === 'C' && r.rev === 7 && r.updatedAt === T2, '2. a scalar both sides changed follows the later parent updatedAt; rev is taken whole');
  r = S.merge3(live, { ...live, name: 'B', updatedAt: T2, rev: 2 }, { ...live, name: 'C', updatedAt: T1, rev: 7 });
  ok(r.name === 'B' && r.rev === 2, '2. …and the other way round (rev never blended, e.g. never max or sum)');
  const hb = { history: [{ id: 'h1', what: 'x' }] };
  r = S.merge3(hb, { history: [...hb.history, { id: 'h2', what: 'mine' }] }, { history: [...hb.history, { id: 'h3', what: 'theirs' }] });
  ok(J(r.history.map(x => x.id)) === J(['h1', 'h2', 'h3']), '2. new history lines from both sides are kept, by id');

  // ── 3. Storage in a real browser (IndexedDB), two tabs
  const harness = path.join(TMP, 'store.html');
  fs.writeFileSync(harness, '<!doctype html><meta charset="utf-8"><script>' + (await bundle('iife', 'D3')).replace(/<\/script/gi, '<\\/script') + '</script>');
  const br = await chromium.launch(), bctx = await br.newContext(); const errs = [];
  const tab = async () => { const p = await bctx.newPage(); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + harness); await p.evaluate(() => D3.store.init(() => { window.changed = (window.changed || 0) + 1; })); return p; };
  const idb = p => p.evaluate(async () => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    return await new Promise(res => { const s = db.transaction('kv').objectStore('kv'), g = s.getAll(), k = s.getAllKeys(); g.onsuccess = () => k.onsuccess = () => res(Object.fromEntries(k.result.map((key, i) => [key, g.result[i]]))); }); });
  const putIdb = (p, K, v) => p.evaluate(async ({ K, v }) => { const r = indexedDB.open('propapp'); const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
    await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); v === null ? tx.objectStore('kv').delete(K) : tx.objectStore('kv').put(v, K); tx.oncomplete = res; }); }, { K, v });
  const phKeys = all => Object.keys(all).filter(k => k.startsWith('propapp:ph:'));
  const A = await tab();
  // a legacy schema 1 record already stored is migrated when loaded
  await putIdb(A, 'propapp:ph:ph-d3a', legacyPh()); await putIdb(A, 'propapp:dir', { active: 'ph-d3a', ids: ['ph-d3a'] });
  await A.reload(); await A.evaluate(() => D3.store.init(() => {}));
  const loaded = await A.evaluate(() => D3.store.pharmacy('ph-d3a'));
  ok(loaded.schema === 2 && loaded.history.every(x => x.id) && loaded.procedures.length === 2 && J(loaded.history) === J(devA.history), '3. a stored schema 1 record is migrated on load, with the same ids as any other device');
  // two pharmacies; tab B loads both
  await A.evaluate(async () => { const p = D3.emptyPharmacy('Second (fictional)'); p.id = 'ph-two'; D3.store.savePharmacy(p); await D3.store.flush(); });
  const B = await tab();
  ok(await B.evaluate(() => { window.keep = D3.store.pharmacy('ph-two'); return !!window.keep; }), '3. a second tab has both pharmacies loaded');
  await A.evaluate(async () => { D3.store.removePharmacy('ph-two'); await D3.store.flush(); });
  let all = await idb(A); const tomb = all['propapp:tomb:ph-two'];
  ok(!all['propapp:ph:ph-two'] && !all['propapp:drafts:ph-two'] && phKeys(all).length === 1, '3. delete removes propapp:ph:<id> and its drafts (one propapp:ph:* key left)');
  ok(tomb && tomb.id === 'ph-two' && tomb.schema === 2 && Number.isInteger(tomb.rev) && tomb.deletedAt && tomb.updatedAt === tomb.deletedAt, '3. it writes propapp:tomb:<id> { id, schema 2, rev, updatedAt, deletedAt }');
  ok(all['propapp:dir'].tombstones?.['ph-two'] === tomb.deletedAt && !all['propapp:dir'].ids.includes('ph-two'), '3. the directory records the tombstone and no longer lists the pharmacy');
  ok(await A.evaluate(() => JSON.stringify(D3.store.tombstoneIds())) === '["ph-two"]' && await A.evaluate(() => D3.store.pharmacyTombstone('ph-two')?.deletedAt) === tomb.deletedAt, '3. pharmacyTombstone and tombstoneIds report it');
  // tab B still holds its older copy and saves an edit (as ctx.change would, stamped now)
  await B.evaluate(async () => { const p = JSON.parse(JSON.stringify(D3.store.pharmacy('ph-two') || window.keep)); p.name = 'Stale edit'; p.updatedAt = new Date().toISOString(); D3.store.savePharmacy(p); await D3.store.flush(); });
  all = await idb(A);
  ok(!all['propapp:ph:ph-two'] && all['propapp:tomb:ph-two'] && !all['propapp:dir'].ids.includes('ph-two'), '3. a stale tab’s later edit does not bring the deleted pharmacy back');
  // a stale journal leftover (written before the delete) is not replayed back in either
  await A.evaluate(t => localStorage.setItem('propapp-journal:zzz:propapp:ph:ph-two', JSON.stringify({ v: { id: 'ph-two', schema: 2, name: 'Old', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null, history: [], records: [], staff: [], procedures: [], actions: {}, services: {} }, base: null, at: 1, baseAt: 0 })), tomb);
  const C2 = await tab(); await C2.waitForTimeout(300); all = await idb(A);
  ok(!all['propapp:ph:ph-two'] && !(await A.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('propapp-journal:')).length)), '3. a journal leftover from before the delete is dropped, not replayed');
  // re-creating it on purpose (no loaded copy in this tab) clears the tombstone
  const C = await tab();
  await C.evaluate(async () => { const p = D3.emptyPharmacy('Second again (fictional)'); p.id = 'ph-two'; D3.store.savePharmacy(p); await D3.store.flush(); });
  all = await idb(C);
  ok(all['propapp:ph:ph-two']?.name === 'Second again (fictional)' && !all['propapp:tomb:ph-two'] && !all['propapp:dir'].tombstones?.['ph-two'] && all['propapp:dir'].ids.includes('ph-two'), '3. creating it again on purpose clears the tombstone');
  // restore (replace) clears a tombstone too
  await C.evaluate(async () => { D3.store.removePharmacy('ph-two'); await D3.store.flush(); });
  const okRestore = await C.evaluate(async () => { const p = D3.emptyPharmacy('Restored (fictional)'); p.id = 'ph-two'; p.deletedAt = '2026-11-01T00:00:00.000Z'; return await D3.store.restorePharmacy(p, {}, { replace: true }); });
  all = await idb(C);
  ok(okRestore && all['propapp:ph:ph-two']?.name === 'Restored (fictional)' && all['propapp:ph:ph-two'].deletedAt === null && !all['propapp:tomb:ph-two'] && !all['propapp:dir'].tombstones && all['propapp:dir'].ids.includes('ph-two'), '3. restorePharmacy (replace) clears the tombstone and the restored copy is live');
  // sync state is separate from the local merge base
  await C.evaluate(async () => { const p = JSON.parse(JSON.stringify(D3.store.pharmacy('ph-two'))); const base0 = JSON.parse(JSON.stringify(p));
    p.actions.x1 = { id: 'x1', title: 'Action A (fictional)', status: 'open', log: [] }; D3.store.savePharmacy(p); await D3.store.flush();
    D3.store.commitSyncAck('ph-two', { rev: 3, base: base0, ackedAt: '2026-11-27T00:00:00.000Z' }); await D3.store.flush(); });
  all = await idb(C); const sy = all['propapp:sync:ph-two'];
  ok(sy && sy.rev === 3 && sy.ackedAt === '2026-11-27T00:00:00.000Z' && !sy.base.actions.x1 && phKeys(all).length === 2, '3. commitSyncAck stores propapp:sync:<id> { rev, base, ackedAt }, not under propapp:ph:*');
  // another tab deletes action A in storage; this tab then renames: the merge base is this tab's own last save, so A stays deleted
  const stored = all['propapp:ph:ph-two']; delete stored.actions.x1; await putIdb(C, 'propapp:ph:ph-two', stored);
  await C.evaluate(async () => { const p = JSON.parse(JSON.stringify(D3.store.pharmacy('ph-two'))); p.name = 'Renamed (fictional)'; p.updatedAt = new Date().toISOString(); D3.store.savePharmacy(p); await D3.store.flush(); });
  all = await idb(C);
  ok(all['propapp:ph:ph-two'].name === 'Renamed (fictional)' && !all['propapp:ph:ph-two'].actions.x1, '3. local merges use this tab’s own last read (seen), not the sync base: another tab’s delete stands');
  ok(await C.evaluate(() => D3.store.syncState('ph-two').rev) === 3, '3. syncState reads it back');
  // a remote copy is migrated and merged; a remote deletion becomes a tombstone
  const remote = { ...legacyPh(), id: 'ph-two', name: 'From server (fictional)', updatedAt: '2027-01-01T00:00:00.000Z' };
  const res = await C.evaluate(async r => { const out = D3.store.applyRemoteSync('ph-two', r, 9); await D3.store.flush(); return out; }, remote);
  all = await idb(C);
  ok(res.rev === 9 && res.schema === 2 && res.name === 'From server (fictional)' && all['propapp:ph:ph-two'].history.every(x => x.id) && all['propapp:sync:ph-two'].rev === 9 && all['propapp:sync:ph-two'].base.history.every(x => x.id), '3. applyRemoteSync migrates the remote copy, merges it, takes the server rev and updates the sync base');
  const gone = await C.evaluate(async r => { const out = D3.store.applyRemoteSync('ph-two', { ...r, deletedAt: '2027-01-02T00:00:00.000Z', updatedAt: '2027-01-02T00:00:00.000Z' }, 10); await D3.store.flush(); return out; }, remote);
  all = await idb(C);
  ok(gone.deletedAt && !all['propapp:ph:ph-two'] && all['propapp:tomb:ph-two']?.rev === 10 && phKeys(all).length === 1, '3. a remote deletion becomes a local tombstone (propapp:tomb:<id>), the record is removed');
  ok(errs.length === 0, '3. no console errors in the storage tabs' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
  await br.close();

  // ── 4. Real taps in the built app
  const { b, p, errors } = await phone();
  const pick = async f => { await p.locator('input[type=file]').first().setInputFiles(f); await p.waitForTimeout(1200); };
  const write = (n, o) => { const f = path.join(TMP, n); fs.writeFileSync(f, J(o)); return f; };
  for (const [app, id] of [['PropApp', 'ph-fmt-propapp'], ['Sigil', 'ph-fmt-sigil'], ['PharmLedger', 'ph-fmt-pharmledger']]) {
    const ph = { ...legacyPh(), id, name: app + ' backup pharmacy (fictional)' };
    if (await p.getByRole('button', { name: 'More', exact: true }).count()) { await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).first().click(); await p.waitForTimeout(300); }
    await pick(write(app + '.json', { app, format: 1, exportedAt: '2026-11-20T00:00:00.000Z', pharmacy: ph, drafts: {} }));
    const st = (await saved(p))['propapp:ph:' + id];
    ok(st && st.schema === 2 && st.procedures.length === 2 && st.procedures[0].id === 'proc:daa' && st.history.every(x => x.id) && /Restored|restored/.test(await text(p)), '4. a format 1 ' + app + ' backup restores as schema 2 (procedures reconciled, history ids)');
  }
  const E = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../uat/demo/wattle-grove.json'), 'utf8'));
  await tap(p, 'More'); await p.getByRole('button', { name: /^Backup and devices/ }).first().click(); await p.waitForTimeout(300);
  await pick(write('rpharmacy.json', E.backup));
  const wg = Object.values(await saved(p)).find(v => v && v.legacy && v.schema === 2);
  ok(wg && wg.history.length > 0 && wg.history.every(x => /^h:/.test(x.id)) && new Set(wg.procedures.map(x => x.id)).size === wg.procedures.length && wg.procedures.every(x => x.id === 'proc:' + x.service), '4. an R.Pharmacy (version 2) backup restores through importLegacy as schema 2');
  // delete one in More › Pharmacies (two taps), after switching away from it
  await tap(p, 'More'); await p.getByRole('button', { name: /^Pharmacies on this device/ }).first().click(); await p.waitForTimeout(300);
  await tap(p, 'Archive or delete a pharmacy'); await p.waitForTimeout(200);
  const before4 = phKeys(await saved(p)).length;
  await p.getByRole('button', { name: 'Delete', exact: true }).first().click(); await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Tap again to delete for good' }).click(); await p.waitForTimeout(500);
  all = await saved(p); const tk = Object.keys(all).filter(k => k.startsWith('propapp:tomb:'));
  ok(phKeys(all).length === before4 - 1 && tk.length === 1 && all['propapp:dir'].ids.length === before4 - 1 && all['propapp:dir'].tombstones?.[tk[0].slice(13)], '4. Delete (two taps) leaves one fewer propapp:ph:* key and a propapp:tomb:<id> tombstone');
  await p.reload(); await p.waitForTimeout(600);
  ok(phKeys(await saved(p)).length === before4 - 1, '4. after a reload the deleted pharmacy stays deleted');
  fs.rmSync(TMP, { recursive: true, force: true });
  await done(b, errors);
})();
