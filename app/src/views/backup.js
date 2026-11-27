// Backups: download (where the browser allows it), restore (new-format or old R.Pharmacy backups), and the example.
import { isLegacyBackup, importLegacy } from '../legacy.js';
import { addDays, daysBetween, today } from '../dates.js';
import { saveFile } from '../ics.js';
import { SAVE_FAILED } from '../app.js';
// Rebrands (Sigil, then PharmLedger): the backup keeps its PropApp format marker so every earlier backup and every new one restore the same way.
export function pharmacyBackup(c) { return { app: 'PropApp', product: 'PharmLedger', format: 1, exportedAt: new Date().toISOString(), pharmacy: c.ph, drafts: c.drafts }; }
// R01: a restore is checked in full before anything is written, so a damaged file can never overwrite a pharmacy.
const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
// Stage 3D: a plain object only (what JSON makes), never a class instance or an array.
const plainObj = x => obj(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
// Keys that could reach an object's prototype are never let in, at any depth.
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);
const unsafeKey = (x, depth = 0) => { if (!x || typeof x !== 'object' || depth > 60) return false; for (const k of Object.keys(x)) if (UNSAFE.has(k) || unsafeKey(x[k], depth + 1)) return true; return false; };
// A conflict copy is named "<draft>/conflict-<time in ms>". Its time must be a real date.
export const conflictTime = k => { const m = /\/conflict-(\d{1,15})$/.exec(k); if (!m) return null; const d = new Date(Number(m[1])); return isNaN(d.getTime()) ? null : d; };
export function checkPharmacy(p, drafts) {
  const bad = [];
  if (unsafeKey(p) || unsafeKey(drafts)) bad.push('unsafe names inside');
  if (!obj(p)) bad.push('pharmacy');
  else {
    if (typeof p.id !== 'string' || !p.id) bad.push('id'); if (typeof p.name !== 'string' || !p.name.trim()) bad.push('name');
    for (const k of ['records', 'staff', 'procedures', 'history']) if (!Array.isArray(p[k])) bad.push(k);
    for (const k of ['actions', 'services']) if (!obj(p[k])) bad.push(k);
    // M-07: the other parts every screen reads. Each may be missing in an older backup (it is filled in empty), but if
    // it is there it must have the right shape, so nothing half-damaged gets in.
    for (const k of ['settings', 'schedule', 'obligations', 'flags', 'archives']) if (p[k] !== undefined && p[k] !== null && !obj(p[k])) bad.push(k);
    if (obj(p.schedule) && Object.values(p.schedule).some(v => v !== '' && v !== null && typeof v !== 'string')) bad.push('schedule (a date is damaged)');
    for (const k of ['proprietors', 'documents', 'log']) if (p[k] !== undefined && !Array.isArray(p[k])) bad.push(k);
    if (Array.isArray(p.proprietors) && p.proprietors.some(x => !obj(x) || typeof (x.name ?? '') !== 'string')) bad.push('proprietors (an entry is damaged)');
    if (Array.isArray(p.documents) && p.documents.some(x => !obj(x) || typeof (x.title ?? '') !== 'string')) bad.push('documents (an entry is damaged)');
    if (Array.isArray(p.log) && p.log.some(x => !obj(x) || typeof (x.what ?? '') !== 'string')) bad.push('log (an entry is damaged)');
    if (Array.isArray(p.history) && p.history.some(x => !obj(x) || typeof (x.what ?? '') !== 'string')) bad.push('history (an entry is damaged)');
    if (Array.isArray(p.procedures) && p.procedures.some(x => !obj(x) || !Array.isArray(x.versions) || x.versions.some(v => !obj(v) || typeof (v.body ?? '') !== 'string'))) bad.push('procedures (versions are damaged)');
    if (obj(p.services) && Object.values(p.services).some(x => !obj(x) || (x.answers !== undefined && !obj(x.answers)))) bad.push('services (an entry is damaged)');
    if (Array.isArray(p.records) && p.records.some(r => !obj(r) || typeof r.date !== 'string' || !Array.isArray(r.answers ?? []) || (r.answers || []).some(a => !obj(a)))) bad.push('records (an entry is damaged)');
    if (obj(p.actions) && Object.values(p.actions).some(a => !obj(a) || typeof a.title !== 'string')) bad.push('actions (an entry is damaged)');
    if (Array.isArray(p.staff) && p.staff.some(x => !obj(x) || typeof x.name !== 'string' || !Array.isArray(x.services))) bad.push('staff (an entry is damaged)');
  }
  if (drafts !== undefined && !plainObj(drafts)) bad.push('drafts');
  else if (drafts && Object.entries(drafts).some(([k, v]) => (v !== null && !plainObj(v)) || (k.includes('/conflict-') && !conflictTime(k)))) bad.push('drafts (an entry is damaged)');
  if (bad.length) throw Error('This backup is damaged (' + bad.join(', ') + '). Nothing was changed.');
}
export function validate(b) {
  let got;
  if ((b?.app === 'PropApp' || b?.app === 'Sigil' || b?.app === 'PharmLedger') && b.format === 1) got = { pharmacy: b.pharmacy, drafts: b.drafts || {} };
  else if (isLegacyBackup(b)) got = importLegacy(b);
  else throw Error('This file is not a PharmLedger backup (or one from Sigil, PropApp or R.Pharmacy).');
  checkPharmacy(got.pharmacy, got.drafts);
  // Parts an older backup may not have are added empty (the backup format itself is unchanged).
  const ph = got.pharmacy; for (const k of ['proprietors', 'documents', 'log']) ph[k] ??= []; for (const k of ['schedule', 'obligations', 'flags']) ph[k] ??= {}; ph.settings ??= { setupDone: true };
  return got;
}
// A1: one backup action (Backup screen and the Today nudge). On phones that can, it opens the share sheet so the file
// goes straight to iCloud Drive, Google Drive or email; otherwise it downloads.
export async function backupNow(c) {
  const ok = await saveFile(c.ph.name.replace(/\W+/g, '-') + '-backup-' + today() + '.json', JSON.stringify(pharmacyBackup(c)), 'application/json');
  if (ok) c.change(ph => { ph.settings.lastBackup = new Date().toISOString(); if (ph.flags) delete ph.flags.backupSnooze; }, 'Backup download requested');
  else c.toast('The backup wasn’t saved (the download or share didn’t go through). Try again, or open the app in your phone’s browser.');
  return ok;
}
// Counts used to check a restore against its own file (A1: drafts and staff checks included).
export const tally = (ph, drafts) => ({ records: ph.records.length, actions: Object.keys(ph.actions).length, staff: ph.staff.length, checks: ph.staff.reduce((t, p) => t + Object.keys(p.checks || {}).length, 0), procedures: ph.procedures.length, drafts: Object.keys(drafts || {}).filter(k => !k.includes('/conflict-')).length });
const b2from = got => got.pharmacy.legacy ? 'a backup from the earlier R.Pharmacy app' : 'a PharmLedger backup';
// C-02: the file input (el) is cleared after every pick (armed, restored or failed), so choosing the same file again
// still fires "change" and the second pick confirms the replace.
export async function importBackup(c, file, el) {
  if (!file) return;
  const reset = () => { if (el) el.value = ''; };
  try {
    const got = validate(JSON.parse(await file.text()));
    const exists = c.store.pharmacy(got.pharmacy.id);
    if (exists && !confirmReplace(exists.id, exists.name)) { reset(); return; }
    reset();
    // The receipt is built from the checked backup first; the pharmacy, its drafts and the directory (unarchived and
    // open) are then written in one storage transaction. Stage 3D: if that write fails, nothing is changed and the
    // screen says so instead of showing a receipt.
    const receipt = { name: got.pharmacy.name, from: b2from(got), want: tally(got.pharmacy, got.drafts) };
    if (!(await c.store.restorePharmacy(got.pharmacy, got.drafts))) throw Error(SAVE_FAILED);
    if ((await c.open(got.pharmacy.id)) === false) throw Error(SAVE_FAILED);
    receipt.got = tally(c.ph, c.drafts); c.ui.receipt = receipt; c.go('receipt');
  } catch (e) { armed = ''; reset(); c.toast(e.message); c.rerender(); }
}
// Replacing a pharmacy that is already here is the one destructive restore; it needs a second tap (no browser dialogs).
let armed = '';
// Any navigation away (another screen, or Back) disarms the replace: it only counts on the same screen.
export const disarmReplace = () => { armed = ''; };
if (typeof window !== 'undefined') window.addEventListener('pl:navigate', disarmReplace);
// Stage 3D: the second pick must be the same pharmacy (by its id; two pharmacies can share a name).
function confirmReplace(id, name) { if (armed === id) { armed = ''; return true; } armed = id; alertInline('“' + name + '” is already on this device. Choose the file again to replace it with the backup.'); return false; }
function alertInline(t) { const n = document.createElement('p'); n.className = 'note warn'; n.textContent = t; document.querySelector('main, .welcome')?.prepend(n); }
// The fictional example: dates move so the day it was made becomes today. It opens as its own pharmacy.
export function shiftDates(obj, days) { return JSON.parse(JSON.stringify(obj).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m, y, mo, d) => { const t = Date.UTC(+y, +mo - 1, +d); return isNaN(t) ? m : new Date(t + days * 864e5).toISOString().slice(0, 10); })); }
export async function openExample(c) {
  const E = window.PROPAPP_EXAMPLE; if (!E) return;
  const got = importLegacy(shiftDates(E.backup, daysBetween(E.generated, today())));
  (got.pharmacy.flags ??= {}).example = true; // C-05: the example is fictional, so it never blocks Reset test data
  if (!c.store.pharmacy(got.pharmacy.id)) { c.store.savePharmacy(got.pharmacy); c.store.setDrafts(got.pharmacy.id, got.drafts); }
  await c.open(got.pharmacy.id); c.toast('Opened Wattle Grove Pharmacy (fictional)');
}
export { addDays };
