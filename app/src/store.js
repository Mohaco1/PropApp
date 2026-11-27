// Saving on this device: IndexedDB (falls back to localStorage). One record per pharmacy, plus a directory and drafts.
// Drafts never overwrite a newer copy saved by another tab: the older copy is kept as a conflict copy instead.
import { clone } from './util.js';
import { migratePharmacy } from './model.js';
// D3-A: deleted pharmacies leave a tombstone under propapp:tomb:<id> and server-acked sync state lives under
// propapp:sync:<id>. Neither is ever stored under propapp:ph:*, so counting pharmacies stays a count of propapp:ph:* keys.
const PH = 'propapp:ph:', TOMB = 'propapp:tomb:', SYNC = 'propapp:sync:';
const isPh = k => String(k).startsWith(PH);
// Every pharmacy read from storage (or from a journal, a sync or another tab) is brought to schema 2 first.
const mig = (k, v) => (isPh(k) && v ? migratePharmacy(v) : v);
const DB = 'propapp', ST = 'kv';
let db = null, mem = new Map(), useLS = false;
function open() {
  return new Promise(res => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => { useLS = true; res(); };
    } catch { useLS = true; res(); }
  });
}
async function getAll() {
  // Stage 3D: storage that is switched off or blocked (SecurityError on localStorage itself, even reading .length) starts
  // the app with nothing loaded instead of rejecting startup.
  if (useLS || !db) { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('propapp:') && !pending.has(k) && !inflight.has(k)) try { const v = mig(k, JSON.parse(localStorage.getItem(k))); mem.set(k, v); if (k.startsWith('propapp:ph:') || k === 'propapp:dir') seen.set(k, clone(v)); } catch {} } } catch {} purgeResurrected(); return; }
  await new Promise(res => {
    const tx = db.transaction(ST), s = tx.objectStore(ST), r = s.openCursor();
    // A value this window hasn't saved yet, or is saving right now, stays as it is (and keeps its merge base), so the save
    // can merge both sides. (Gates flake, 26 Nov: reloading a key mid-save replaced this tab's copy with one missing its own
    // change, and its next save then merged that change away.)
    r.onsuccess = () => { const c = r.result; if (c) { if (!pending.has(c.key) && !inflight.has(c.key)) { const v = mig(c.key, c.value); mem.set(c.key, v); loadedAt.set(c.key, Date.now()); if (String(c.key).startsWith('propapp:ph:') || c.key === 'propapp:dir') seen.set(c.key, clone(v)); } c.continue(); } else res(); };
    r.onerror = () => res();
  });
  purgeResurrected();
}
const pending = new Map(); let timer = null;
// R06: what this window last read or wrote for each pharmacy. If storage has moved on since (another tab saved), the
// save merges both sides instead of overwriting: per field, per record, action and staff member (by id).
const seen = new Map();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x);
// D3-A: a scalar both sides changed goes to the side whose nearest parent has the later updatedAt (mine on a tie or
// when neither has one); `rev` is a scalar like any other, so it is taken from one side, never blended. A deletedAt
// tombstone wins over a concurrent or stale edit, unless the base already held that exact deletedAt and the live side
// undeleted it explicitly, with an updatedAt later than the deletion.
const later = (x, y) => String(x || '') > String(y || '');
export function merge3(b, m, t, at = {}) {
  if (same(m, b)) return t; if (same(t, b) || same(m, t)) return m;
  if (Array.isArray(m) && Array.isArray(t)) {
    const ided = xs => xs.every(x => plain(x) && x.id);
    if (ided(m) && ided(t) && (!Array.isArray(b) || ided(b))) { const B = new Map((b || []).map(x => [x.id, x])), M = new Map(m.map(x => [x.id, x])), T = new Map(t.map(x => [x.id, x]));
      const out = []; for (const id of new Set([...M.keys(), ...T.keys()])) { const r = merge3(B.get(id), M.get(id), T.get(id), at); if (r !== undefined) out.push(r); } return out; }
    const out = [...m]; for (const x of t) if (!out.some(y => same(x, y)) && !(b || []).some(y => same(x, y))) out.push(x); return out;
  }
  if (plain(m) && plain(t)) { const nat = { m: m.updatedAt ?? at.m, t: t.updatedAt ?? at.t }, pb = plain(b) ? b : undefined;
    const out = {}; for (const k of new Set([...Object.keys(m), ...Object.keys(t)])) { const r = merge3(pb ? pb[k] : undefined, m[k], t[k], nat); if (r !== undefined) out[k] = r; }
    if ('deletedAt' in m || 'deletedAt' in t) out.deletedAt = tombWinner(pb?.deletedAt || null, m, t);
    if (Array.isArray(out.versions) && typeof out.service === 'string') settleProcedure(out, m, t);
    return out; }
  // D3-C: both devices must pick the same side, so a tie (equal parent updatedAt, or neither has one) goes to the larger
  // JSON value rather than to "mine".
  if (m !== undefined && t !== undefined) { if (String(at.m ?? '') === String(at.t ?? '')) return JSON.stringify(m) >= JSON.stringify(t) ? m : t; if (later(at.t, at.m)) return t; }
  return m;
}
// D3-C: a procedure adopted on one device and edited on another. When both sides added versions, the merged list is put
// in time order (then id), so both devices hold the same order, and the status follows the latest version: adopted only
// if that version is the adopted one.
const vOrder = (a, b) => String(a?.at || '').localeCompare(String(b?.at || '')) || String(a?.id || '').localeCompare(String(b?.id || ''));
function settleProcedure(p, m, t) {
  if (!same(p.versions, m.versions) && !same(p.versions, t.versions)) p.versions = [...p.versions].sort(vOrder);
  if (p.versions.length) p.status = p.versions.at(-1)?.status === 'Adopted' ? 'adopted' : 'draft';
}
function tombWinner(db, m, t) {
  const dm = m.deletedAt || null, dt = t.deletedAt || null;
  if (dm && dt) return later(dt, dm) ? dt : dm;
  if (dt) return (db === dt && later(m.updatedAt, dt)) || restoreBeats(m, dt) ? null : dt;
  if (dm) return (db === dm && later(t.updatedAt, dm)) || restoreBeats(t, dm) ? null : dm;
  return null;
}
// D3-D: a confirmed restore over a deletion is stamped on the pharmacy itself (restoredAt, and restoredOver: the
// deletion and revision it superseded), so the stamp travels with the synced copy. A device still holding that older
// tombstone (or any deletion no later than the restore) takes the restored copy instead of deleting it again, even
// when the backup's own updatedAt is older than the deletion. A deletion made after the restore still wins.
export const restoreBeats = (live, deletedAt) => !!(plain(live) && deletedAt && typeof live.restoredAt === 'string' && !live.deletedAt
  && (live.restoredOver?.deletedAt === deletedAt || !later(deletedAt, live.restoredAt)));
// The directory's tombstones (id → deletedAt) are a union of both sides (a removal one side made from the base, as a
// restore does, stays removed), and a tombstoned id is never listed or archived.
function stripTombs(d) { if (!plain(d)) return d; const tb = plain(d.tombstones) ? d.tombstones : null; if (!tb || !Object.keys(tb).length) return d;
  return { ...d, ids: (d.ids || []).filter(x => !tb[x]), archived: (d.archived || []).filter(x => !tb[x]) }; }
// D3-C: a side that removed a tombstone the base held (a restore) only takes it away when that restore is later than the
// tombstone the other side holds now, so an older restore never erases a newer deletion. A restore is stamped in
// `restored` (id → time); without a stamp (older data) the removal stands only if the other side's tombstone is the base's.
export function mergeDir(b, m, t) { const out = merge3(b, m, t); const tb = x => (plain(x?.tombstones) ? x.tombstones : {}), rs = x => (plain(x?.restored) ? x.restored : {});
  const bt = tb(b), mt = tb(m), tt = tb(t), rm = rs(m), rt = rs(t);
  const tomb = {}; for (const [id, at, side] of [...Object.entries(mt).map(e => [...e, 'm']), ...Object.entries(tt).map(e => [...e, 't'])]) {
    const other = side === 'm' ? tt : mt, ra = side === 'm' ? rt[id] : rm[id];
    if ((id in bt) && !(id in other) && (ra ? later(ra, at) : at === bt[id])) continue;
    if (!tomb[id] || later(at, tomb[id])) tomb[id] = at; }
  if (Object.keys(tomb).length) out.tombstones = tomb; else delete out.tombstones; return stripTombs(out); }
// Real save state for the header: saving, saved, or failed (then retried with a growing wait).
let status = 'saved', onStatus = null, tries = 0;
const setStatus = s => { if (s !== status) { status = s; onStatus?.(s); } };
export const saveStatus = () => status;
export function watchStatus(fn) { onStatus = fn; }
// Chaos test fix 1: a change to a pharmacy or its drafts is also copied synchronously to localStorage (the journal) until
// the IndexedDB save completes, so reloading within milliseconds of a tap can't lose it; init replays any leftover.
// Hardening brief: one journal entry per tab (so one tab's finished save never clears another tab's), carrying the
// copy it started from (so two tabs' leftovers merge instead of overwriting), and a restore stamps the key so any
// older leftover is discarded rather than bringing back records the restore replaced.
const JOURNAL = 'propapp-journal:', RESTORED = 'propapp-restored:', TAB = Math.random().toString(36).slice(2, 10);
// Stage 3D: the directory is journaled too, so a pharmacy whose first save was interrupted is still listed in the picker.
const journaled = k => !useLS && (k.startsWith('propapp:ph:') || k.startsWith('propapp:drafts:') || k.startsWith(TOMB) || k === 'propapp:dir');
const merges = k => k.startsWith('propapp:ph:') || k === 'propapp:dir';
// Written only when the page is being hidden or closed, and only for changes not yet saved, so normal use never leaves
// journal entries for other tabs to trip over; a restore stamps its key at once.
function journal(k, v) { if (!journaled(k)) return; const jk = JOURNAL + TAB + ':' + k;
  try { if (v === undefined) { localStorage.removeItem(jk); return; } localStorage.setItem(jk, JSON.stringify({ v, base: seen.get(k) ?? null, at: Date.now(), baseAt: loadedAt.get(k) || 0, replace: replacing.has(k) })); } catch {} }
function journalPending() { for (const [k, v] of inflight) if (!pending.has(k)) journal(k, v); for (const [k, v] of pending) journal(k, v); }
// When this tab last read each pharmacy from storage. A restore stamps the time it replaced a pharmacy, and a leftover
// journal entry based on an older read is discarded, so it can't bring back what the restore replaced. (Dropping live
// saves on the same test made two tabs saving together lose an action, so live saves merge as before.)
const loadedAt = new Map(), inflight = new Map();
const restoredAt = k => { try { return Number(localStorage.getItem(RESTORED + k) || 0); } catch { return 0; } };
async function replayJournal() { const keys = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(JOURNAL)) keys.push(k); } } catch {}
  const entries = keys.map(jk => { try { const rest = jk.slice(JOURNAL.length), k = rest.slice(rest.indexOf(':') + 1); return { jk, k, ...JSON.parse(localStorage.getItem(jk)) }; } catch { return null; } }).filter(Boolean).sort((a, b) => a.at - b.at);
  // Stage 3D: a leftover older than a restore of its key is discarded, a "replace" leftover included (it was saved before
  // that restore committed). The others are replayed, and their journal entries are removed only once IndexedDB has
  // committed the replayed copy (flushNow), so a failed or interrupted replay is tried again on the next start.
  for (const e of entries) {
    if ((e.replace ? e.at : (e.baseAt || e.at)) < restoredAt(e.k)) { try { localStorage.removeItem(e.jk); } catch {} continue; }
    // D3-C: a live copy no newer than this pharmacy's tombstone is what an interrupted delete left behind: not replayed.
    if (isPh(e.k) && e.v && !e.replace && tombWins(e.v, tombFor(e.k.slice(PH.length)))) { try { localStorage.removeItem(e.jk); } catch {} continue; }
    const cur = mem.get(e.k); let v = mig(e.k, e.v);
    if (e.replace) replacing.add(e.k); else if (e.base && cur && merges(e.k)) v = e.k === 'propapp:dir' ? mergeDir(e.base, v, cur) : merge3(mig(e.k, e.base), v, cur);
    (replayed.get(e.k) || replayed.set(e.k, []).get(e.k)).push(e.jk);
    mem.set(e.k, v); put(e.k, v); }
  purgeResurrected();
  if (entries.length || pending.size) await flush(); }
const replayed = new Map();
function put(k, v) {
  mem.set(k, v); pending.set(k, v); setStatus('saving');
  clearTimeout(timer); timer = setTimeout(flush, 120);
}
// Drafts: the revision each draft was based on when this window last changed it. At save time, if the stored copy has
// moved on (changed elsewhere), the stored copy is kept and this window's copy is saved beside it as a conflict copy.
const bases = new Map();
async function readStored(k) { if (useLS || !db) { try { return JSON.parse(localStorage.getItem(k)); } catch { return undefined; } }
  return await new Promise(res => { try { const r = db.transaction(ST).objectStore(ST).get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); } }); }
// Merges for one key, run with the stored value read inside the same write transaction (bug 1: no gap between read
// and write, so two tabs can't both read the old copy and overwrite each other).
let kept = false, merged3 = false;
function mergeDrafts(k, v, stored) {
  const base = bases.get(k) || {}; if (!stored) return v;
  const merged = { ...v };
  for (const [dk, sv] of Object.entries(stored)) { if (dk.includes('/conflict-')) { if (!(dk in v) && dk in base) continue; merged[dk] ??= sv; continue; } // R08: one this window saw and dismissed stays dismissed
    const mine = v[dk], b0 = base[dk];
    if (sv && sv.rev && sv.rev !== b0 && (!mine || mine.rev !== sv.rev)) { if (mine && mine.rev !== b0) { merged[dk + '/conflict-' + Date.now()] = { ...mine }; kept = true; } merged[dk] = sv; } }
  return merged;
}
// C-06: drafts the queued edit left alone take what was just written (another tab's newer copy included) and use it as
// their base; drafts it changed again keep the old base, so the next save still keeps the other tab's copy.
function rebaseDrafts(k, v, orig) { const later = pending.get(k), b = bases.get(k) || {}, nb = {};
  for (const dk of new Set([...Object.keys(b), ...Object.keys(v), ...Object.keys(later)])) { if (dk.includes('/conflict-')) continue;
    if (later[dk] === orig[dk]) { if (v[dk] === undefined) delete later[dk]; else later[dk] = v[dk]; nb[dk] = v[dk]?.rev; }
    // Batch 2B (hardening S8 Finish stall): a draft this window changed again whose own copy was just written (nothing
    // from another tab replaced it) takes that write as its base. Keeping the older base made the next save see "its own"
    // write as another tab's, so a quick Finish after the last answer became a conflict copy and the screen fell back.
    else nb[dk] = v[dk] === orig[dk] && v[dk] ? v[dk].rev : b[dk]; }
  bases.set(k, nb); }
function mergeOne(k, v, stored) {
  if (!v) return v;
  if (k === 'propapp:dir') { if (replacing.has(k) || !seen.has(k) || !stored || same(stored, seen.get(k))) return stripTombs(v); merged3 = true; return mergeDir(seen.get(k), v, stored); }
  if (isPh(k)) { const st = mig(k, stored); if (replacing.has(k) || !seen.has(k) || !st || same(st, seen.get(k))) return v; merged3 = true; return merge3(seen.get(k), v, st); } // C-01: the directory (ids, archived) merges the same way
  if (k.startsWith('propapp:drafts:') && bases.has(k) && !replacing.has(k)) return mergeDrafts(k, v, stored);
  return v;
}
const needsRead = (k, v) => !!v && (((k.startsWith('propapp:ph:') || k === 'propapp:dir') && seen.has(k) && !replacing.has(k)) || (k.startsWith('propapp:drafts:') && bases.has(k)));
// A restore the owner confirmed replaces the pharmacy outright: nothing from another tab is blended into it.
const replacing = new Set();
let running = null, quota = 0;
// D3-A: a write of a pharmacy that has a tombstone (stored, or written in the same batch) is a stale write and is
// dropped, unless it is a confirmed restore (replace) or the same batch clears the tombstone (the owner re-created it).
// Stale: this window had the pharmacy loaded before it was deleted, or the copy is no newer than the deletion.
const guarded = (k, v) => !!v && isPh(k) && !replacing.has(k);
const staleWrite = (k, v, tomb) => !!(tomb && tomb.deletedAt) && !restoreBeats(v, tomb.deletedAt) && (seen.has(k) || !later(v.updatedAt, tomb.deletedAt));
// D3-D: a confirmed restore records the tombstone this tab saw (deletedAt, or none). Inside the write transaction the
// stored tombstone is read first; if storage holds a deletion later than the one seen (another tab or a sync deleted
// it again meanwhile), the pharmacy, its drafts, the tombstone and the directory are all left as stored, together.
const guards = new Map(), rejected = new Set(), REJECT = Symbol('rejected');
const guardKeys = id => [PH + id, 'propapp:drafts:' + id, TOMB + id, 'propapp:dir'];
const staleRestore = (g, tombRec, dirRec) => { const at = (plain(tombRec) && tombRec.deletedAt) || (plain(dirRec) && plain(dirRec.tombstones) && dirRec.tombstones[g.id]) || null; return !!at && (!g.seen || later(at, g.seen)); };
let dropped = false;
export function flush() { running = (running || Promise.resolve()).then(flushNow, flushNow); return running; }
async function flushNow() {
  clearTimeout(timer); if (!pending.size) return true;
  let batch = [...pending].map(([k, v]) => [k, v, v]); pending.clear(); kept = false; merged3 = false; dropped = false;
  const inBatch = new Map(batch.map(b => [b[0], b[1]])), tombKey = k => TOMB + k.slice(PH.length);
  const settle = (k, v, stored, tomb) => { let out = needsRead(k, v) ? mergeOne(k, v, stored) : v; if (guarded(k, v) && staleWrite(k, out, inBatch.has(tombKey(k)) ? inBatch.get(tombKey(k)) : tomb)) { out = undefined; dropped = true; } return out; };
  if (!batch.length) { setStatus('saved'); return true; }
  const gs = [...guards.values()].filter(g => inBatch.has(PH + g.id)); for (const g of gs) guards.delete(g.id);
  const rejectAll = () => { const ks = new Set(gs.flatMap(g => guardKeys(g.id))); for (const item of batch) if (ks.has(item[0])) item[1] = REJECT; for (const g of gs) rejected.add(g.id); };
  for (const [k, v] of batch) inflight.set(k, v);
  try {
    if (useLS || !db) { const lsWrite = () => { if (gs.length) { let dr; try { dr = JSON.parse(localStorage.getItem('propapp:dir')); } catch {} if (gs.some(g => { let tr; try { tr = JSON.parse(localStorage.getItem(TOMB + g.id)); } catch {} return staleRestore(g, tr, dr); })) rejectAll(); }
      for (const item of batch) { if (item[1] === REJECT) continue; const [k, v] = item; let stored; try { stored = JSON.parse(localStorage.getItem(k)); } catch {} let tomb; if (guarded(k, v) && !inBatch.has(tombKey(k))) try { tomb = JSON.parse(localStorage.getItem(tombKey(k))); } catch {} item[1] = settle(k, v, stored, tomb); item[1] === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(item[1])); } };
      // Stage 3D: two tabs on the localStorage fallback read, merge and write one at a time (Web Locks), so neither
      // writes over the other's save between its read and its write.
      if (navigator.locks?.request) await navigator.locks.request('propapp-ls-write', async () => lsWrite()); else lsWrite(); }
    else await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST);
      const write = item => item[1] === undefined ? s.delete(item[0]) : s.put(clone(item[1]), item[0]);
      const run = () => { for (const item of batch) { const [k, v] = item; if (v === REJECT) continue; const rd = needsRead(k, v), rt = guarded(k, v) && !inBatch.has(tombKey(k));
        if (!rd && !rt) { item[1] = settle(k, v); write(item); continue; }
        let stored, tomb, n = (rd ? 1 : 0) + (rt ? 1 : 0); const step = () => { if (--n === 0) { item[1] = settle(k, v, stored, tomb); write(item); } };
        if (rd) { const g = s.get(k); g.onsuccess = () => { stored = g.result; step(); }; }
        if (rt) { const g = s.get(tombKey(k)); g.onsuccess = () => { tomb = g.result; step(); }; } } };
      if (!gs.length) run();
      else { const tr = {}; let dr, n = gs.length + 1; const step = () => { if (--n === 0) { if (gs.some(g => staleRestore(g, tr[g.id], dr))) rejectAll(); run(); } };
        const gd = s.get('propapp:dir'); gd.onsuccess = () => { dr = gd.result; step(); };
        for (const g of gs) { const gt = s.get(TOMB + g.id); gt.onsuccess = () => { tr[g.id] = gt.result; step(); }; } }
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    for (const [k, v, orig] of batch) { if (v === REJECT) { replacing.delete(k); continue; } const isPh = k.startsWith('propapp:ph:') || k === 'propapp:dir', queued = pending.has(k) && mem.get(k) !== orig;
      // C-06: a later edit of this window (queued while this save was merging another tab's change in) was made from
      // `orig`, not from what was written. Keep `orig` as its merge base so the next save merges it against what was
      // written, instead of finding storage "unchanged" and writing it over the other tab's save.
      if (isPh) v === undefined ? seen.delete(k) : seen.set(k, clone(queued && v !== orig ? orig : v));
      // Stage 3D: a restore stamps its keys (pharmacy and drafts) only now, after the write has committed.
      if (replacing.has(k) && journaled(k)) try { localStorage.setItem(RESTORED + k, String(Date.now())); } catch {} replacing.delete(k);
      if (queued && k.startsWith('propapp:drafts:') && v && orig) rebaseDrafts(k, v, orig); else bases.delete(k);
      if (v !== orig) { if (mem.get(k) === orig) mem.set(k, v); else if (pending.has(k) && k.startsWith('propapp:drafts:')) { const later = pending.get(k); for (const [dk, x] of Object.entries(v)) if (dk.includes('/conflict-') && !later[dk]) later[dk] = x; } } }
    for (const [k] of batch) { inflight.delete(k); loadedAt.set(k, Date.now()); if (!pending.has(k)) try { localStorage.removeItem(JOURNAL + TAB + ':' + k); } catch {}
      for (const jk of replayed.get(k) || []) try { localStorage.removeItem(jk); } catch {} replayed.delete(k); }
    chan?.postMessage({ keys: batch.map(b => b[0]) });
    tries = 0; quota = 0; if (!pending.size) setStatus('saved');
    // A conflict copy was kept, or another tab's changes were merged in: show the result without a reload.
    if (kept || merged3 || dropped) onChange?.();
    return true;
  } catch (e) { console.error(e); for (const g of gs) { rejected.delete(g.id); guards.set(g.id, g); } for (const [k, , orig] of batch) { inflight.delete(k); if (!pending.has(k)) pending.set(k, orig); }
    // Storage full: stop retrying after 5 attempts and ask for a backup (the records stay in this window meanwhile).
    if (e?.name === 'QuotaExceededError' && ++quota >= 5) { setStatus('full'); return false; }
    setStatus('failed'); tries++; clearTimeout(timer); timer = setTimeout(flush, Math.min(30000, 1000 * 2 ** tries)); return false; }
}
let chan = null, onChange = null;
export async function init(onExternalChange) {
  onChange = onExternalChange;
  await open(); await getAll();
  if (!useLS) await replayJournal();
  try { chan = new BroadcastChannel('propapp'); chan.onmessage = async () => { for (const k of [...mem.keys()]) if (!pending.has(k) && !inflight.has(k)) mem.delete(k); await getAll(); onExternalChange?.(); }; } catch {}
  addEventListener('pagehide', () => { journalPending(); flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { journalPending(); flush(); } });
}
export const dir = () => mem.get('propapp:dir') || { active: '', ids: [] };
// F-LIVE-07: archived pharmacies keep every record but leave switching, All pharmacies and the counts.
export const activeIds = () => { const d = dir(); return d.ids.filter(id => !(d.archived || []).includes(id)); };
export function setArchived(id, on) { const d = { ...dir() }; const a = new Set(d.archived || []); on ? a.add(id) : a.delete(id); d.archived = [...a]; setDir(d); }
export function setDir(d) { put('propapp:dir', d); }
export const pharmacy = id => mem.get('propapp:ph:' + id) || null;
export function savePharmacy(ph, { replace = false } = {}) { const K = 'propapp:ph:' + ph.id;
  // D3-A: saving a pharmacy this window doesn't have loaded, over a tombstone, is the owner creating it again (opening
  // the example after deleting it, say): the tombstone goes in the same batch. An edit of a loaded copy never does.
  const revive = (replace || (mem.get(K) == null && !seen.has(K))) && hasTomb(ph.id);
  if (replace) replacing.add(K); put(K, ph); if (revive) clearTomb(ph.id); const d = clone(dir()); if (!d.ids.includes(ph.id)) { d.ids.push(ph.id); setDir(d);
  // Stage 3D: a new pharmacy's first save is journaled at once, with the directory that lists it, so a tab closed or
  // killed before IndexedDB commits still finds it (and the picker lists it) on the next start.
  journal(K, ph); journal('propapp:dir', d); } }
export const drafts = id => mem.get('propapp:drafts:' + id) || {};
export function saveDraft(phId, key, value, readRev) {
  const all = { ...drafts(phId) }, cur = all[key], K = 'propapp:drafts:' + phId;
  if (!bases.has(K)) bases.set(K, Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v?.rev])));
  if (value === null) { delete all[key]; put('propapp:drafts:' + phId, all); return true; }
  if (cur && readRev !== undefined && cur.rev !== readRev) { all[key + '/conflict-' + Date.now()] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return false; }
  all[key] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return true;
}
export function setDrafts(phId, all, { replace = false } = {}) { const K = 'propapp:drafts:' + phId; if (replace) { bases.delete(K); replacing.add(K); } put(K, all); }
// Stage 3D: a confirmed restore. The pharmacy, its drafts and the directory (listing it, unarchived, open) are written in
// one transaction. If that write fails (storage full, for example) everything this restore queued is taken back, so
// the device keeps exactly what it had, and false is returned for the screen to say so.
// D3-D: restoring over a tombstone stamps restoredAt and restoredOver (the deletion it supersedes) on the pharmacy, and
// the write is checked atomically against the stored tombstone (see guards): a deletion this tab didn't see rejects the
// whole restore, and restoreRejected() then says so.
let lastRejected = false;
export const restoreRejected = () => lastRejected;
export async function restorePharmacy(ph, all, { replace = true } = {}) {
  const keys = guardKeys(ph.id), NONE = {}; lastRejected = false;
  const before = keys.map(k => ({ k, mem: mem.has(k) ? mem.get(k) : NONE, pend: pending.has(k) ? pending.get(k) : NONE, rep: replacing.has(k), base: bases.get(k) }));
  const seenTomb = tombFor(ph.id);
  if (replace && (ph.deletedAt || seenTomb)) { ph = { ...ph, deletedAt: null }; delete ph.restoredAt; delete ph.restoredOver;
    // The revision of the deletion: the server's, once that tombstone was acked (or arrived from the server).
    const ss = syncState(ph.id), delRev = Math.max(Number.isInteger(seenTomb?.rev) ? seenTomb.rev : 0, ss?.base?.deletedAt && ss.base.deletedAt === seenTomb?.deletedAt ? ss.rev : 0);
    if (seenTomb) ph = { ...ph, restoredAt: new Date().toISOString(), restoredOver: { deletedAt: seenTomb.deletedAt, rev: delRev } }; }
  guards.set(ph.id, { id: ph.id, seen: seenTomb?.deletedAt || null }); rejected.delete(ph.id);
  savePharmacy(ph, { replace }); setDrafts(ph.id, all, { replace });
  const d = clone(dir()); if (replace && d.tombstones?.[ph.id]) { d.tombstones = { ...d.tombstones }; delete d.tombstones[ph.id]; if (!Object.keys(d.tombstones).length) delete d.tombstones; d.restored = { ...(d.restored || {}), [ph.id]: new Date().toISOString() }; } if (!d.ids.includes(ph.id)) d.ids.push(ph.id); d.archived = (d.archived || []).filter(x => x !== ph.id); d.active = ph.id; setDir(d);
  const saved = await flush(), refused = rejected.delete(ph.id); guards.delete(ph.id);
  if (saved && !refused) return true;
  for (const b of before) { b.mem === NONE ? mem.delete(b.k) : mem.set(b.k, b.mem); b.pend === NONE ? pending.delete(b.k) : pending.set(b.k, b.pend);
    b.rep ? replacing.add(b.k) : replacing.delete(b.k); b.base === undefined ? bases.delete(b.k) : bases.set(b.k, b.base);
    try { localStorage.removeItem(JOURNAL + TAB + ':' + b.k); } catch {} }
  if (!pending.size) { clearTimeout(timer); tries = 0; quota = 0; setStatus('saved'); } else { clearTimeout(timer); timer = setTimeout(flush, 120); }
  // Refused: this tab takes what storage holds now (the newer deletion) for these keys.
  if (refused) { lastRejected = true; for (const k of keys) { if (pending.has(k) || inflight.has(k)) continue; const v = await readStored(k);
    if (v == null) { mem.delete(k); seen.delete(k); } else { const m = mig(k, v); mem.set(k, m); if (isPh(k) || k === 'propapp:dir') seen.set(k, clone(m)); } loadedAt.set(k, Date.now()); }
    onChange?.(); }
  return false;
}
// D3-A: deleting leaves a tombstone (journaled), recorded in the directory too, so no stale copy from another tab, a
// leftover journal entry or a later sync can bring the pharmacy back. Its record and drafts are deleted.
export function removePharmacy(id) { const ph = pharmacy(id), now = new Date().toISOString(), s0 = syncState(id);
  const rev = Math.max(Number.isInteger(ph?.rev) ? ph.rev : 0, Number.isInteger(s0?.rev) ? s0.rev : 0);
  writeTomb({ id, schema: 2, rev, updatedAt: now, deletedAt: now }); put(PH + id, undefined); put('propapp:drafts:' + id, undefined); }
function writeTomb(t) { const id = t.id, K = TOMB + id; put(K, t); journal(K, t); tombDir(id, t.deletedAt); }
function tombDir(id, deletedAt) { const d0 = dir(); if (!d0.ids.includes(id) && !(d0.archived || []).includes(id) && d0.tombstones?.[id] === deletedAt) return;
  const d = clone(d0); d.tombstones = { ...(d.tombstones || {}), [id]: deletedAt }; d.ids = d.ids.filter(x => x !== id); d.archived = (d.archived || []).filter(x => x !== id);
  if (d.active === id) d.active = d.ids.find(x => !d.archived.includes(x)) || ''; setDir(d); } // Stage 3E: never an archived one
const hasTomb = id => !!mem.get(TOMB + id) || !!dir().tombstones?.[id];
// D3-C: the tombstone for a pharmacy (its propapp:tomb:<id> record, else the directory's entry), and whether it wins over
// a live copy: it does when the live copy is no newer than the deletion.
const tombFor = id => { const t = mem.get(TOMB + id); if (t?.deletedAt) return t; const at = dir().tombstones?.[id]; return at ? { id, schema: 2, rev: 0, updatedAt: at, deletedAt: at } : null; };
const tombWins = (live, tomb) => !!(live && tomb?.deletedAt) && !later(live.updatedAt, tomb.deletedAt) && !restoreBeats(live, tomb.deletedAt);
// An interrupted delete (tab closed after the tombstone was journaled, before the record was removed) can leave both a
// tombstone and a live record no newer than it. The tombstone wins: the record and its drafts are purged and the
// directory stops listing it. Run after every load and replay, and before a remote copy is merged.
function purgeOne(id) { const K = PH + id, live = mem.get(K), tomb = tombFor(id); if (!tombWins(live, tomb) || pending.has(K) || inflight.has(K)) return null;
  // A confirmed restore later than the deletion (stamped in the directory) is the owner bringing it back: the leftover
  // tombstone record goes instead.
  const ra = dir().restored?.[id]; if (ra && later(ra, tomb.deletedAt)) { if (mem.get(TOMB + id)) put(TOMB + id, undefined); return null; }
  put(K, undefined); if (mem.get('propapp:drafts:' + id)) put('propapp:drafts:' + id, undefined);
  if (!mem.get(TOMB + id)) put(TOMB + id, { id, schema: 2, rev: Number.isInteger(live.rev) ? live.rev : 0, updatedAt: tomb.deletedAt, deletedAt: tomb.deletedAt });
  tombDir(id, tomb.deletedAt); return mem.get(TOMB + id); }
function purgeResurrected() { const ids = new Set(Object.keys(dir().tombstones || {})); for (const [k, v] of mem) if (k.startsWith(TOMB) && v) ids.add(k.slice(TOMB.length)); for (const id of ids) purgeOne(id); }
function clearTomb(id) { if (mem.get(TOMB + id)) put(TOMB + id, undefined); const d = dir(); if (d.tombstones?.[id]) { const n = clone(d); delete n.tombstones[id]; if (!Object.keys(n.tombstones).length) delete n.tombstones; n.restored = { ...(n.restored || {}), [id]: new Date().toISOString() }; setDir(n); } }
export const pharmacyTombstone = id => mem.get(TOMB + id) || null;
export const tombstoneIds = () => { const out = new Set(Object.keys(dir().tombstones || {})); for (const [k, v] of mem) if (k.startsWith(TOMB) && v) out.add(k.slice(TOMB.length)); return [...out].sort(); };
// Server-acked sync state, kept apart from `seen` (which is only ever this window's last local read or write, for
// merging with other tabs). `base` is the copy the server last acknowledged, the base for merging the next remote copy.
export const syncState = id => mem.get(SYNC + id) || null;
const revOf = id => syncState(id)?.rev || 0;
const noRev = x => { if (!plain(x)) return x; const { rev, ...rest } = x; return rest; };
// D3-C: an ack older than the one already kept (a late reply to an earlier push) changes nothing and returns null. When
// this device's copy is still exactly what was acked, it takes the server's rev too.
export function commitSyncAck(id, { rev, base, ackedAt, account } = {}) { const r = Number.isInteger(rev) && rev >= 0 ? rev : 0; if (r < revOf(id)) return null;
  const s = { id, rev: r, base: base ? migratePharmacy(base) : null, ackedAt: ackedAt || null, account: account || boundTo(id) || null }; put(SYNC + id, s);
  const live = pharmacy(id); if (live && s.base && !s.base.deletedAt && live.rev !== r && same(noRev(live), noRev(s.base))) put(PH + id, { ...live, rev: r });
  return s; }
// Forget what the server acked for a pharmacy.
export function forgetSync(id) { if (mem.get(SYNC + id)) put(SYNC + id, undefined); }
// D3-D: every pharmacy on this device (live or deleted, with any change not yet synced) is bound to the account it
// syncs with, in its sync state's `account`. One that isn't bound yet is taken by the account that syncs it first.
// Records bound to another account are never uploaded: attachOtherAccount (an explicit step the owner taps) moves a
// live one to this account, starting again from revision 0. Another account's tombstones are never attached.
export const boundTo = id => syncState(id)?.account || '';
export function bindAccount(id, account, { reset = false } = {}) { if (!account) return; const s = syncState(id); if (!reset && s?.account === account) return;
  put(SYNC + id, reset || !s ? { id, rev: 0, base: null, ackedAt: null, account } : { ...s, account }); }
export const syncIds = account => [...new Set([...dir().ids, ...tombstoneIds()])].filter(id => !account || !boundTo(id) || boundTo(id) === account);
export const otherAccountIds = account => dir().ids.filter(id => !!pharmacy(id) && !!boundTo(id) && boundTo(id) !== account);
export function attachOtherAccount(account) { const ids = otherAccountIds(account); for (const id of ids) bindAccount(id, account, { reset: true }); return ids; }
// A copy arriving from the server: migrated, merged three ways with the acked base and this device's copy (or its
// tombstone), and saved. `rev` is the server's. A tombstone on either side wins as merge3 says. Returns the result, or
// null when the copy is older than the revision already acked (D3-C: revisions only move forward).
export function applyRemoteSync(id, remoteDoc, remoteRev, account) {
  const remote = migratePharmacy(remoteDoc); if (!remote || typeof remote !== 'object') return null;
  const s0 = syncState(id); if (account && s0?.account && s0.account !== account) return null; // D3-D: never across accounts
  if (Number.isInteger(remoteRev) && remoteRev < (s0?.rev || 0)) return null;
  const rev = Number.isInteger(remoteRev) && remoteRev >= 0 ? remoteRev : (s0?.rev || 0), base = s0?.base || undefined;
  // D3-C: a live copy left behind by an interrupted delete gives way to its tombstone before anything is merged.
  const local = purgeOne(id) || pharmacy(id) || pharmacyTombstone(id);
  // D3-C: the server undeleted a pharmacy this device holds only as a tombstone (the deletion was acked, then another
  // device restored it later): the server's copy is taken whole, not field-merged against the compact tombstone.
  // D3-D: or a restore stamped on the server's copy supersedes the tombstone this device holds.
  const explicitUndelete = !!local && !!local.deletedAt && !pharmacy(id) && !remote.deletedAt && ((later(remote.updatedAt, local.deletedAt) && base?.deletedAt === local.deletedAt) || restoreBeats(remote, local.deletedAt));
  const merged = { ...(explicitUndelete ? migratePharmacy(clone(remote)) : local ? merge3(base, local, remote) : remote), id, schema: 2, rev };
  put(SYNC + id, { id, rev, base: remote, ackedAt: s0?.ackedAt || null, account: account || s0?.account || null });
  if (merged.deletedAt) { writeTomb({ id, schema: 2, rev, updatedAt: merged.updatedAt || merged.deletedAt, deletedAt: merged.deletedAt }); if (pharmacy(id)) { put(PH + id, undefined); put('propapp:drafts:' + id, undefined); } }
  else { if (hasTomb(id)) clearTomb(id); put(PH + id, merged); const d = clone(dir()); if (!d.ids.includes(id)) { d.ids.push(id); if (!d.active) d.active = id; setDir(d); } } // D3-D: a fresh device opens what it found
  onChange?.(); return merged;
}
export const getPref = k => mem.get('propapp:pref:' + k);
export const setPref = (k, v) => put('propapp:pref:' + k, v);
