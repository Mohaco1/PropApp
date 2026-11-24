// Backups: download (where the browser allows it), restore (new-format or old R.Pharmacy backups), and the example.
import { isLegacyBackup, importLegacy } from '../legacy.js';
import { addDays, daysBetween, today } from '../dates.js';
export function pharmacyBackup(c) { return { app: 'PropApp', format: 1, exportedAt: new Date().toISOString(), pharmacy: c.ph, drafts: c.drafts }; }
export function validate(b) {
  if (b?.app === 'PropApp' && b.format === 1 && b.pharmacy?.id && Array.isArray(b.pharmacy.records) && b.pharmacy.actions) return { pharmacy: b.pharmacy, drafts: b.drafts || {} };
  if (isLegacyBackup(b)) return importLegacy(b);
  throw Error('This file is not a PropApp or R.Pharmacy backup.');
}
const b2from = got => got.pharmacy.legacy ? 'an earlier R.Pharmacy backup' : 'a PropApp backup';
export async function importBackup(c, file) {
  if (!file) return;
  try {
    const got = validate(JSON.parse(await file.text()));
    const exists = c.store.pharmacy(got.pharmacy.id);
    if (exists && !confirmReplace(exists.name)) return;
    c.store.savePharmacy(got.pharmacy); c.store.setDrafts(got.pharmacy.id, got.drafts);
    await c.open(got.pharmacy.id); c.ui.receipt = { name: got.pharmacy.name, records: got.pharmacy.records.length, actions: Object.keys(got.pharmacy.actions).length, staff: got.pharmacy.staff.length, procedures: got.pharmacy.procedures.length, drafts: Object.keys(got.drafts || {}).length, from: b2from(got) }; c.go('receipt');
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
