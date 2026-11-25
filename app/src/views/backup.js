// Backups: download (where the browser allows it), restore (new-format or old R.Pharmacy backups), and the example.
import { isLegacyBackup, importLegacy } from '../legacy.js';
import { addDays, daysBetween, today } from '../dates.js';
import { saveFile } from '../ics.js';
// Sigil rebrand: the backup keeps its PropApp format marker so every earlier backup and every new one restore the same way.
export function pharmacyBackup(c) { return { app: 'PropApp', product: 'Sigil', format: 1, exportedAt: new Date().toISOString(), pharmacy: c.ph, drafts: c.drafts }; }
// R01: a restore is checked in full before anything is written, so a damaged file can never overwrite a pharmacy.
const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
export function checkPharmacy(p, drafts) {
  const bad = [];
  if (!obj(p)) bad.push('pharmacy');
  else {
    if (typeof p.id !== 'string' || !p.id) bad.push('id'); if (typeof p.name !== 'string' || !p.name.trim()) bad.push('name');
    for (const k of ['records', 'staff', 'procedures', 'history']) if (!Array.isArray(p[k])) bad.push(k);
    for (const k of ['actions', 'services']) if (!obj(p[k])) bad.push(k);
    if (p.proprietors !== undefined && !Array.isArray(p.proprietors)) bad.push('proprietors');
    if (Array.isArray(p.records) && p.records.some(r => !obj(r) || typeof r.date !== 'string' || !Array.isArray(r.answers ?? []))) bad.push('records (an entry is damaged)');
    if (obj(p.actions) && Object.values(p.actions).some(a => !obj(a) || typeof a.title !== 'string')) bad.push('actions (an entry is damaged)');
    if (Array.isArray(p.staff) && p.staff.some(x => !obj(x) || typeof x.name !== 'string')) bad.push('staff (an entry is damaged)');
  }
  if (drafts !== undefined && !obj(drafts)) bad.push('drafts');
  if (bad.length) throw Error('This backup is damaged (' + bad.join(', ') + '). Nothing was changed.');
}
export function validate(b) {
  let got;
  if ((b?.app === 'PropApp' || b?.app === 'Sigil') && b.format === 1) got = { pharmacy: b.pharmacy, drafts: b.drafts || {} };
  else if (isLegacyBackup(b)) got = importLegacy(b);
  else throw Error('This file is not a Sigil backup (or one from PropApp or R.Pharmacy).');
  checkPharmacy(got.pharmacy, got.drafts);
  return got;
}
// A1: one backup action (Backup screen and the Today nudge). On phones that can, it opens the share sheet so the file
// goes straight to iCloud Drive, Google Drive or email; otherwise it downloads.
export function backupNow(c) {
  const ok = saveFile(c.ph.name.replace(/\W+/g, '-') + '-backup-' + today() + '.json', JSON.stringify(pharmacyBackup(c)), 'application/json');
  if (ok) c.change(ph => { ph.settings.lastBackup = new Date().toISOString(); if (ph.flags) delete ph.flags.backupSnooze; }, 'Backup download requested');
  return ok;
}
// Counts used to check a restore against its own file (A1: drafts and staff checks included).
export const tally = (ph, drafts) => ({ records: ph.records.length, actions: Object.keys(ph.actions).length, staff: ph.staff.length, checks: ph.staff.reduce((t, p) => t + Object.keys(p.checks || {}).length, 0), procedures: ph.procedures.length, drafts: Object.keys(drafts || {}).filter(k => !k.includes('/conflict-')).length });
const b2from = got => got.pharmacy.legacy ? 'a backup from the earlier R.Pharmacy app' : 'a Sigil backup';
export async function importBackup(c, file) {
  if (!file) return;
  try {
    const got = validate(JSON.parse(await file.text()));
    const exists = c.store.pharmacy(got.pharmacy.id);
    if (exists && !confirmReplace(exists.name)) return;
    // The receipt is built from the checked backup first; the pharmacy, its drafts and the directory are then queued
    // together and written in one storage transaction (store.flush), so nothing is half-restored.
    const receipt = { name: got.pharmacy.name, from: b2from(got), want: tally(got.pharmacy, got.drafts) };
    c.store.savePharmacy(got.pharmacy, { replace: true }); c.store.setDrafts(got.pharmacy.id, got.drafts, { replace: true });
    await c.open(got.pharmacy.id); receipt.got = tally(c.ph, c.drafts); c.ui.receipt = receipt; c.go('receipt');
  } catch (e) { c.toast(e.message); c.rerender(); }
}
// Replacing a pharmacy that is already here is the one destructive restore; it needs a second tap (no browser dialogs).
let armed = '';
function confirmReplace(name) { if (armed === name) { armed = ''; return true; } armed = name; alertInline('“' + name + '” is already on this device. Choose the file again to replace it with the backup.'); return false; }
function alertInline(t) { const n = document.createElement('p'); n.className = 'note warn'; n.textContent = t; document.querySelector('main, .welcome')?.prepend(n); }
// The fictional example: dates move so the day it was made becomes today. It opens as its own pharmacy.
export function shiftDates(obj, days) { return JSON.parse(JSON.stringify(obj).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m, y, mo, d) => { const t = Date.UTC(+y, +mo - 1, +d); return isNaN(t) ? m : new Date(t + days * 864e5).toISOString().slice(0, 10); })); }
export async function openExample(c) {
  const E = window.PROPAPP_EXAMPLE; if (!E) return;
  const got = importLegacy(shiftDates(E.backup, daysBetween(E.generated, today())));
  if (!c.store.pharmacy(got.pharmacy.id)) { c.store.savePharmacy(got.pharmacy); c.store.setDrafts(got.pharmacy.id, got.drafts); }
  await c.open(got.pharmacy.id); c.toast('Opened Wattle Grove Pharmacy (fictional)');
}
export { addDays };
