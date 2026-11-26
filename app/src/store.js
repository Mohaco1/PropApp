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
  if (useLS || !db) { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('propapp:') && !pending.has(k)) try { mem.set(k, JSON.parse(localStorage.getItem(k))); if (k.startsWith('propapp:ph:') || k === 'propapp:dir') seen.set(k, JSON.parse(localStorage.getItem(k))); } catch {} } return; }
  await new Promise(res => {
    const tx = db.transaction(ST), s = tx.objectStore(ST), r = s.openCursor();
    // A value this window hasn't saved yet stays as it is (and keeps its merge base), so the save can merge both sides.
    r.onsuccess = () => { const c = r.result; if (c) { if (!pending.has(c.key)) { mem.set(c.key, c.value); if (String(c.key).startsWith('propapp:ph:') || c.key === 'propapp:dir') seen.set(c.key, clone(c.value)); } c.continue(); } else res(); };
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
const JOURNAL = 'propapp-journal:', journaled = k => !useLS && (k.startsWith('propapp:ph:') || k.startsWith('propapp:drafts:'));
function journal(k, v) { if (!journaled(k)) return; try { v === undefined ? localStorage.removeItem(JOURNAL + k) : localStorage.setItem(JOURNAL + k, JSON.stringify(v)); } catch {} }
function put(k, v) {
  journal(k, v);
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
function mergeOne(k, v, stored) {
  if (!v) return v;
  if (k.startsWith('propapp:ph:') || k === 'propapp:dir') { if (replacing.has(k) || !seen.has(k) || !stored || same(stored, seen.get(k))) return v; merged3 = true; return merge3(seen.get(k), v, stored); } // C-01: the directory (ids, archived) merges the same way
  if (k.startsWith('propapp:drafts:') && bases.has(k)) return mergeDrafts(k, v, stored);
  return v;
}
const needsRead = (k, v) => !!v && (((k.startsWith('propapp:ph:') || k === 'propapp:dir') && seen.has(k) && !replacing.has(k)) || (k.startsWith('propapp:drafts:') && bases.has(k)));
// A restore the owner confirmed replaces the pharmacy outright: nothing from another tab is blended into it.
const replacing = new Set();
let running = null, quota = 0;
export function flush() { running = (running || Promise.resolve()).then(flushNow, flushNow); return running; }
async function flushNow() {
  clearTimeout(timer); if (!pending.size) return true;
  const batch = [...pending].map(([k, v]) => [k, v, v]); pending.clear(); kept = false; merged3 = false;
  try {
    if (useLS || !db) { for (const item of batch) { const [k, v] = item; let stored; try { stored = JSON.parse(localStorage.getItem(k)); } catch {} item[1] = needsRead(k, v) ? mergeOne(k, v, stored) : v; item[1] === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(item[1])); } }
    else await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST);
      const write = item => item[1] === undefined ? s.delete(item[0]) : s.put(clone(item[1]), item[0]);
      for (const item of batch) { const [k, v] = item; if (!needsRead(k, v)) { write(item); continue; }
        const g = s.get(k); g.onsuccess = () => { item[1] = mergeOne(k, v, g.result); write(item); }; }
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    for (const [k, v, orig] of batch) { if (k.startsWith('propapp:ph:') || k === 'propapp:dir') v === undefined ? seen.delete(k) : seen.set(k, clone(v)); replacing.delete(k); bases.delete(k);
      if (v !== orig) { if (mem.get(k) === orig) mem.set(k, v); else if (pending.has(k) && k.startsWith('propapp:drafts:')) { const later = pending.get(k); for (const [dk, x] of Object.entries(v)) if (dk.includes('/conflict-') && !later[dk]) later[dk] = x; } } }
    for (const [k] of batch) if (!pending.has(k)) try { localStorage.removeItem(JOURNAL + k); } catch {}
    chan?.postMessage({ keys: batch.map(b => b[0]) });
    tries = 0; quota = 0; if (!pending.size) setStatus('saved');
    // A conflict copy was kept, or another tab's changes were merged in: show the result without a reload.
    if (kept || merged3) onChange?.();
    return true;
  } catch (e) { console.error(e); for (const [k, , orig] of batch) if (!pending.has(k)) pending.set(k, orig);
    // Storage full: stop retrying after 5 attempts and ask for a backup (the records stay in this window meanwhile).
    if (e?.name === 'QuotaExceededError' && ++quota >= 5) { setStatus('full'); return false; }
    setStatus('failed'); tries++; clearTimeout(timer); timer = setTimeout(flush, Math.min(30000, 1000 * 2 ** tries)); return false; }
}
let chan = null, onChange = null;
export async function init(onExternalChange) {
  onChange = onExternalChange;
  await open(); await getAll();
  if (!useLS) { const left = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(JOURNAL)) left.push(k); } } catch {}
    for (const jk of left) { try { const k = jk.slice(JOURNAL.length), v = JSON.parse(localStorage.getItem(jk)); mem.set(k, v); pending.set(k, v); } catch {} }
    if (left.length) await flush(); }
  try { chan = new BroadcastChannel('propapp'); chan.onmessage = async () => { for (const k of [...mem.keys()]) if (!pending.has(k)) mem.delete(k); await getAll(); onExternalChange?.(); }; } catch {}
  addEventListener('pagehide', () => { flush(); });
}
export const dir = () => mem.get('propapp:dir') || { active: '', ids: [] };
// F-LIVE-07: archived pharmacies keep every record but leave switching, All pharmacies and the counts.
export const activeIds = () => { const d = dir(); return d.ids.filter(id => !(d.archived || []).includes(id)); };
export function setArchived(id, on) { const d = { ...dir() }; const a = new Set(d.archived || []); on ? a.add(id) : a.delete(id); d.archived = [...a]; setDir(d); }
export function setDir(d) { put('propapp:dir', d); }
export const pharmacy = id => mem.get('propapp:ph:' + id) || null;
export function savePharmacy(ph, { replace = false } = {}) { if (replace) replacing.add('propapp:ph:' + ph.id); put('propapp:ph:' + ph.id, ph); const d = clone(dir()); if (!d.ids.includes(ph.id)) { d.ids.push(ph.id); setDir(d); } }
export const drafts = id => mem.get('propapp:drafts:' + id) || {};
export function saveDraft(phId, key, value, readRev) {
  const all = { ...drafts(phId) }, cur = all[key], K = 'propapp:drafts:' + phId;
  if (!bases.has(K)) bases.set(K, Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v?.rev])));
  if (value === null) { delete all[key]; put('propapp:drafts:' + phId, all); return true; }
  if (cur && readRev !== undefined && cur.rev !== readRev) { all[key + '/conflict-' + Date.now()] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return false; }
  all[key] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return true;
}
export function setDrafts(phId, all, { replace = false } = {}) { if (replace) bases.delete('propapp:drafts:' + phId); put('propapp:drafts:' + phId, all); }
export function removePharmacy(id) { put('propapp:ph:' + id, undefined); put('propapp:drafts:' + id, undefined); const d = clone(dir()); d.ids = d.ids.filter(x => x !== id); d.archived = (d.archived || []).filter(x => x !== id); if (d.active === id) d.active = d.ids[0] || ''; setDir(d); }
export const getPref = k => mem.get('propapp:pref:' + k);
export const setPref = (k, v) => put('propapp:pref:' + k, v);
