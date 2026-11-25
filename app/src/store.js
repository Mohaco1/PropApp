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
  if (useLS || !db) { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('propapp:') && !pending.has(k)) try { mem.set(k, JSON.parse(localStorage.getItem(k))); if (k.startsWith('propapp:ph:')) seen.set(k, JSON.parse(localStorage.getItem(k))); } catch {} } return; }
  await new Promise(res => {
    const tx = db.transaction(ST), s = tx.objectStore(ST), r = s.openCursor();
    // A value this window hasn't saved yet stays as it is (and keeps its merge base), so the save can merge both sides.
    r.onsuccess = () => { const c = r.result; if (c) { if (!pending.has(c.key)) { mem.set(c.key, c.value); if (String(c.key).startsWith('propapp:ph:')) seen.set(c.key, clone(c.value)); } c.continue(); } else res(); };
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
function put(k, v) {
  mem.set(k, v); pending.set(k, v); setStatus('saving');
  clearTimeout(timer); timer = setTimeout(flush, 120);
}
// Drafts: the revision each draft was based on when this window last changed it. At save time, if the stored copy has
// moved on (changed elsewhere), the stored copy is kept and this window's copy is saved beside it as a conflict copy.
const bases = new Map();
async function readStored(k) { if (useLS || !db) { try { return JSON.parse(localStorage.getItem(k)); } catch { return undefined; } }
  return await new Promise(res => { try { const r = db.transaction(ST).objectStore(ST).get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); } }); }
export async function flush() {
  clearTimeout(timer); if (!pending.size) return true;
  const batch = [...pending]; pending.clear(); let kept = false, merged3 = false;
  for (const item of batch) { const [k, v] = item; if (!k.startsWith('propapp:ph:') || !v || !seen.has(k)) continue;
    const stored = await readStored(k), base = seen.get(k); if (!stored || same(stored, base)) continue;
    const m = merge3(base, v, stored); item[1] = m; merged3 = true; if (mem.get(k) === v) mem.set(k, m); }
  for (const item of batch) { const [k, v] = item; if (!k.startsWith('propapp:drafts:') || !v || !bases.has(k)) continue;
    const stored = await readStored(k), base = bases.get(k); bases.delete(k); if (!stored) continue;
    const merged = { ...v };
    for (const [dk, sv] of Object.entries(stored)) { if (dk.includes('/conflict-')) { if (!(dk in v) && dk in base) continue; merged[dk] ??= sv; continue; } // R08: one this window saw and dismissed stays dismissed
      const mine = v[dk], b0 = base[dk];
      if (sv && sv.rev && sv.rev !== b0 && (!mine || mine.rev !== sv.rev)) { if (mine && mine.rev !== b0) { merged[dk + '/conflict-' + Date.now()] = { ...mine }; kept = true; } merged[dk] = sv; } }
    item[1] = merged; if (mem.get(k) === v) mem.set(k, merged); else if (pending.has(k)) { const later = pending.get(k); for (const [dk, x] of Object.entries(merged)) if (dk.includes('/conflict-') && !later[dk]) later[dk] = x; } }
  try {
    if (useLS || !db) { for (const [k, v] of batch) v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); }
    else await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST); for (const [k, v] of batch) v === undefined ? s.delete(k) : s.put(clone(v), k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    for (const [k, v] of batch) if (k.startsWith('propapp:ph:')) v === undefined ? seen.delete(k) : seen.set(k, clone(v));
    chan?.postMessage({ keys: batch.map(b => b[0]) });
    tries = 0; if (!pending.size) setStatus('saved');
    // A conflict copy was kept, or another tab's changes were merged in: show the result without a reload.
    if (kept || merged3) onChange?.();
    return true;
  } catch (e) { console.error(e); for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v); setStatus('failed'); tries++; clearTimeout(timer); timer = setTimeout(flush, Math.min(30000, 1000 * 2 ** tries)); return false; }
}
let chan = null, onChange = null;
export async function init(onExternalChange) {
  onChange = onExternalChange;
  await open(); await getAll();
  try { chan = new BroadcastChannel('propapp'); chan.onmessage = async () => { for (const k of [...mem.keys()]) if (!pending.has(k)) mem.delete(k); await getAll(); onExternalChange?.(); }; } catch {}
  addEventListener('pagehide', () => { flush(); });
}
export const dir = () => mem.get('propapp:dir') || { active: '', ids: [] };
export function setDir(d) { put('propapp:dir', d); }
export const pharmacy = id => mem.get('propapp:ph:' + id) || null;
export function savePharmacy(ph) { put('propapp:ph:' + ph.id, ph); const d = dir(); if (!d.ids.includes(ph.id)) { d.ids.push(ph.id); setDir(d); } }
export const drafts = id => mem.get('propapp:drafts:' + id) || {};
export function saveDraft(phId, key, value, readRev) {
  const all = { ...drafts(phId) }, cur = all[key], K = 'propapp:drafts:' + phId;
  if (!bases.has(K)) bases.set(K, Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v?.rev])));
  if (value === null) { delete all[key]; put('propapp:drafts:' + phId, all); return true; }
  if (cur && readRev !== undefined && cur.rev !== readRev) { all[key + '/conflict-' + Date.now()] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return false; }
  all[key] = { ...value, rev: Date.now() }; put('propapp:drafts:' + phId, all); return true;
}
export function setDrafts(phId, all) { put('propapp:drafts:' + phId, all); }
export function removePharmacy(id) { put('propapp:ph:' + id, undefined); put('propapp:drafts:' + id, undefined); const d = dir(); d.ids = d.ids.filter(x => x !== id); if (d.active === id) d.active = d.ids[0] || ''; setDir(d); }
export const getPref = k => mem.get('propapp:pref:' + k);
export const setPref = (k, v) => put('propapp:pref:' + k, v);
