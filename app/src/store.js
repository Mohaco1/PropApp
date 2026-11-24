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
  if (useLS || !db) { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('propapp:')) try { mem.set(k, JSON.parse(localStorage.getItem(k))); } catch {} } return; }
  await new Promise(res => {
    const tx = db.transaction(ST), s = tx.objectStore(ST), r = s.openCursor();
    r.onsuccess = () => { const c = r.result; if (c) { mem.set(c.key, c.value); c.continue(); } else res(); };
    r.onerror = () => res();
  });
}
const pending = new Map(); let timer = null;
function put(k, v) {
  mem.set(k, v); pending.set(k, v);
  clearTimeout(timer); timer = setTimeout(flush, 120);
}
// Drafts: the revision each draft was based on when this window last changed it. At save time, if the stored copy has
// moved on (changed elsewhere), the stored copy is kept and this window's copy is saved beside it as a conflict copy.
const bases = new Map();
async function readStored(k) { if (useLS || !db) { try { return JSON.parse(localStorage.getItem(k)); } catch { return undefined; } }
  return await new Promise(res => { try { const r = db.transaction(ST).objectStore(ST).get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); } }); }
export async function flush() {
  clearTimeout(timer); if (!pending.size) return true;
  const batch = [...pending]; pending.clear(); let kept = false;
  for (const item of batch) { const [k, v] = item; if (!k.startsWith('propapp:drafts:') || !v || !bases.has(k)) continue;
    const stored = await readStored(k), base = bases.get(k); bases.delete(k); if (!stored) continue;
    const merged = { ...v };
    for (const [dk, sv] of Object.entries(stored)) { if (dk.includes('/conflict-')) { merged[dk] ??= sv; continue; }
      const mine = v[dk], b0 = base[dk];
      if (sv && sv.rev && sv.rev !== b0 && (!mine || mine.rev !== sv.rev)) { if (mine && mine.rev !== b0) { merged[dk + '/conflict-' + Date.now()] = { ...mine }; kept = true; } merged[dk] = sv; } }
    item[1] = merged; if (mem.get(k) === v) mem.set(k, merged); else if (pending.has(k)) { const later = pending.get(k); for (const [dk, x] of Object.entries(merged)) if (dk.includes('/conflict-') && !later[dk]) later[dk] = x; } }
  try {
    if (useLS || !db) { for (const [k, v] of batch) v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); return true; }
    await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST); for (const [k, v] of batch) v === undefined ? s.delete(k) : s.put(clone(v), k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    chan?.postMessage({ keys: batch.map(b => b[0]) });
    // A conflict copy was kept: this window now shows the newer copy, and Backup lists ours, without a reload.
    if (kept) onChange?.();
    return true;
  } catch (e) { console.error(e); for (const [k, v] of batch) pending.set(k, v); return false; }
}
let chan = null, onChange = null;
export async function init(onExternalChange) {
  onChange = onExternalChange;
  await open(); await getAll();
  try { chan = new BroadcastChannel('propapp'); chan.onmessage = async () => { mem.clear(); await getAll(); onExternalChange?.(); }; } catch {}
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
