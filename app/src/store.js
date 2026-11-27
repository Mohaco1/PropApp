// Saving on this device: IndexedDB (falls back to localStorage). One record per pharmacy, plus a directory and drafts.
// Drafts never overwrite a newer copy saved by another tab: the older copy is kept as a conflict copy instead.
import { clone } from './util.js';
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
  if (useLS || !db) { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('propapp:') && !pending.has(k) && !inflight.has(k)) try { mem.set(k, JSON.parse(localStorage.getItem(k))); if (k.startsWith('propapp:ph:') || k === 'propapp:dir') seen.set(k, JSON.parse(localStorage.getItem(k))); } catch {} } } catch {} return; }
  await new Promise(res => {
    const tx = db.transaction(ST), s = tx.objectStore(ST), r = s.openCursor();
    // A value this window hasn't saved yet, or is saving right now, stays as it is (and keeps its merge base), so the save
    // can merge both sides. (Gates flake, 26 Nov: reloading a key mid-save replaced this tab's copy with one missing its own
    // change, and its next save then merged that change away.)
    r.onsuccess = () => { const c = r.result; if (c) { if (!pending.has(c.key) && !inflight.has(c.key)) { mem.set(c.key, c.value); loadedAt.set(c.key, Date.now()); if (String(c.key).startsWith('propapp:ph:') || c.key === 'propapp:dir') seen.set(c.key, clone(c.value)); } c.continue(); } else res(); };
    r.onerror = () => res();
  });
}
const pending = new Map(); let timer = null;
// R06: what this window last read or wrote for each pharmacy. If storage has moved on since (another tab saved), the
// save merges both sides instead of overwriting: per field, per record, action and staff member (by id).
const seen = new Map();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x);
export function merge3(b, m, t) {
  if (same(m, b)) return t; if (same(t, b) || same(m, t)) return m;
  if (Array.isArray(m) && Array.isArray(t)) {
    const ided = xs => xs.every(x => plain(x) && x.id);
    if (ided(m) && ided(t) && (!Array.isArray(b) || ided(b))) { const B = new Map((b || []).map(x => [x.id, x])), M = new Map(m.map(x => [x.id, x])), T = new Map(t.map(x => [x.id, x]));
      const out = []; for (const id of new Set([...M.keys(), ...T.keys()])) { const r = merge3(B.get(id), M.get(id), T.get(id)); if (r !== undefined) out.push(r); } return out; }
    const out = [...m]; for (const x of t) if (!out.some(y => same(x, y)) && !(b || []).some(y => same(x, y))) out.push(x); return out;
  }
  if (plain(m) && plain(t)) { const out = {}; for (const k of new Set([...Object.keys(m), ...Object.keys(t)])) { const r = merge3(plain(b) ? b[k] : undefined, m[k], t[k]); if (r !== undefined) out[k] = r; } return out; }
  return m;
}
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
const journaled = k => !useLS && (k.startsWith('propapp:ph:') || k.startsWith('propapp:drafts:') || k === 'propapp:dir');
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
    const cur = mem.get(e.k); let v = e.v;
    if (e.replace) replacing.add(e.k); else if (e.base && cur && merges(e.k)) v = merge3(e.base, e.v, cur);
    (replayed.get(e.k) || replayed.set(e.k, []).get(e.k)).push(e.jk);
    mem.set(e.k, v); put(e.k, v); }
  if (entries.length) await flush(); }
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
  if (k.startsWith('propapp:ph:') || k === 'propapp:dir') { if (replacing.has(k) || !seen.has(k) || !stored || same(stored, seen.get(k))) return v; merged3 = true; return merge3(seen.get(k), v, stored); } // C-01: the directory (ids, archived) merges the same way
  if (k.startsWith('propapp:drafts:') && bases.has(k) && !replacing.has(k)) return mergeDrafts(k, v, stored);
  return v;
}
const needsRead = (k, v) => !!v && (((k.startsWith('propapp:ph:') || k === 'propapp:dir') && seen.has(k) && !replacing.has(k)) || (k.startsWith('propapp:drafts:') && bases.has(k)));
// A restore the owner confirmed replaces the pharmacy outright: nothing from another tab is blended into it.
const replacing = new Set();
let running = null, quota = 0;
export function flush() { running = (running || Promise.resolve()).then(flushNow, flushNow); return running; }
async function flushNow() {
  clearTimeout(timer); if (!pending.size) return true;
  let batch = [...pending].map(([k, v]) => [k, v, v]); pending.clear(); kept = false; merged3 = false;
  if (!batch.length) { setStatus('saved'); return true; }
  for (const [k, v] of batch) inflight.set(k, v);
  try {
    if (useLS || !db) { const lsWrite = () => { for (const item of batch) { const [k, v] = item; let stored; try { stored = JSON.parse(localStorage.getItem(k)); } catch {} item[1] = needsRead(k, v) ? mergeOne(k, v, stored) : v; item[1] === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(item[1])); } };
      // Stage 3D: two tabs on the localStorage fallback read, merge and write one at a time (Web Locks), so neither
      // writes over the other's save between its read and its write.
      if (navigator.locks?.request) await navigator.locks.request('propapp-ls-write', async () => lsWrite()); else lsWrite(); }
    else await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST);
      const write = item => item[1] === undefined ? s.delete(item[0]) : s.put(clone(item[1]), item[0]);
      for (const item of batch) { const [k, v] = item; if (!needsRead(k, v)) { write(item); continue; }
        const g = s.get(k); g.onsuccess = () => { item[1] = mergeOne(k, v, g.result); write(item); }; }
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    for (const [k, v, orig] of batch) { const isPh = k.startsWith('propapp:ph:') || k === 'propapp:dir', queued = pending.has(k) && mem.get(k) !== orig;
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
    if (kept || merged3) onChange?.();
    return true;
  } catch (e) { console.error(e); for (const [k, , orig] of batch) { inflight.delete(k); if (!pending.has(k)) pending.set(k, orig); }
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
export function savePharmacy(ph, { replace = false } = {}) { const K = 'propapp:ph:' + ph.id; if (replace) replacing.add(K); put(K, ph); const d = clone(dir()); if (!d.ids.includes(ph.id)) { d.ids.push(ph.id); setDir(d);
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
export async function restorePharmacy(ph, all) {
  const keys = ['propapp:ph:' + ph.id, 'propapp:drafts:' + ph.id, 'propapp:dir'], NONE = {};
  const before = keys.map(k => ({ k, mem: mem.has(k) ? mem.get(k) : NONE, pend: pending.has(k) ? pending.get(k) : NONE, rep: replacing.has(k), base: bases.get(k) }));
  savePharmacy(ph, { replace: true }); setDrafts(ph.id, all, { replace: true });
  const d = clone(dir()); if (!d.ids.includes(ph.id)) d.ids.push(ph.id); d.archived = (d.archived || []).filter(x => x !== ph.id); d.active = ph.id; setDir(d);
  if (await flush()) return true;
  for (const b of before) { b.mem === NONE ? mem.delete(b.k) : mem.set(b.k, b.mem); b.pend === NONE ? pending.delete(b.k) : pending.set(b.k, b.pend);
    b.rep ? replacing.add(b.k) : replacing.delete(b.k); b.base === undefined ? bases.delete(b.k) : bases.set(b.k, b.base);
    try { localStorage.removeItem(JOURNAL + TAB + ':' + b.k); } catch {} }
  if (!pending.size) { clearTimeout(timer); tries = 0; quota = 0; setStatus('saved'); }
  return false;
}
export function removePharmacy(id) { put('propapp:ph:' + id, undefined); put('propapp:drafts:' + id, undefined); const d = clone(dir()); d.ids = d.ids.filter(x => x !== id); d.archived = (d.archived || []).filter(x => x !== id); if (d.active === id) d.active = d.ids[0] || ''; setDir(d); }
export const getPref = k => mem.get('propapp:pref:' + k);
export const setPref = (k, v) => put('propapp:pref:' + k, v);
