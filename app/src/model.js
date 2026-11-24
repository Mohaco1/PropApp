// The pharmacy record and the only functions that change it. Every change is logged in history with who and when.
import { uid } from './util.js';
import { today, addMonths, isDate } from './dates.js';
import { C } from './content.js';
export const SCHEMA = 1;
export function emptyPharmacy(name = '') {
  return {
    id: uid(), schema: SCHEMA, name, address: '', region: '', identifier: '',
    proprietors: [], recordingAs: '', services: {}, flags: {}, schedule: {},
    records: [], actions: {}, staff: [], procedures: [], documents: [], log: [], history: [],
    obligations: {}, settings: { created: new Date().toISOString(), setupDone: false },
  };
}
export const me = ph => ph.proprietors.find(p => p.id === ph.recordingAs) || ph.proprietors[0] || { id: '', name: 'Proprietor' };
export function note(ph, what) { ph.history.push({ at: new Date().toISOString(), by: me(ph).name, what }); }

// ---------- actions ----------
export function newAction(ph, { title, due = '', source = null, person = '' }) {
  const a = { id: uid(), title, due, status: 'open', created: today(), source, person, waiting: null, closed: null, log: [] };
  a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'raised', text: source?.label ? 'Raised from ' + source.label : 'Added' });
  ph.actions[a.id] = a; note(ph, 'Action raised · ' + title); return a;
}
export function closeAction(ph, id, what, date = today()) {
  const a = ph.actions[id]; if (!a || a.status !== 'open') return;
  a.status = 'closed'; a.closed = { date, what, by: me(ph).name }; a.waiting = null;
  a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'closed', text: 'Closed · ' + what }); note(ph, 'Action closed · ' + a.title);
}
export function reopenAction(ph, id, why) {
  const a = ph.actions[id]; if (!a || a.status === 'open') return;
  a.status = 'open'; a.closed = null; a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'reopened', text: 'Reopened' + (why ? ' · ' + why : '') }); note(ph, 'Action reopened · ' + a.title);
}
export function updateAction(ph, id, patch, text) {
  const a = ph.actions[id]; if (!a) return;
  Object.assign(a, patch); a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'updated', text }); note(ph, 'Action updated · ' + a.title);
}
export function waitOn(ph, id, asked, checkBack) {
  const a = ph.actions[id]; if (!a) return;
  a.waiting = { asked, on: today(), checkBack }; a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'asked', text: 'Asked for: ' + asked + (checkBack ? ' · check back ' + checkBack : '') }); note(ph, 'Waiting on · ' + asked);
}
export function stopWaiting(ph, id, text) {
  const a = ph.actions[id]; if (!a || !a.waiting) return;
  a.log.push({ at: new Date().toISOString(), by: me(ph).name, kind: 'asked', text }); a.waiting = null;
}

// ---------- records (completed reviews, visits, meetings, staff checks) ----------
export function addRecord(ph, rec) {
  const r = { id: uid(), at: new Date().toISOString(), by: me(ph).name, answers: [], fields: {}, notes: '', actionIds: [], ...rec };
  ph.records.push(r); note(ph, 'Recorded · ' + (r.title || r.type) + ' · ' + r.date); return r;
}

// ---------- staff ----------
export function requirements(person) {
  const R = C.staff.requirements[person.role] || C.staff.requirements.Pharmacist;
  const out = [...R.base];
  for (const s of person.services || []) for (const r of R.services[s] || []) if (!out.some(x => x.id === r.id)) out.push(r);
  return out;
}
// Latest check for one requirement: { result: 'ok' | 'issue' | 'na', date, method, expiry, ref, note } or null.
export const lastCheck = (person, reqId) => person.checks?.[reqId] || null;
export function credentialState(person, reqId) {
  const c = lastCheck(person, reqId);
  if (!c) return { state: 'none', label: 'Not checked yet' };
  if (c.result === 'issue') return { state: 'issue', label: 'Needs review' };
  if (c.result === 'na') return { state: 'na', label: 'Not applicable' };
  if (isDate(c.expiry) && c.expiry < today()) return { state: 'expired', label: 'Expired ' + c.expiry, expiry: c.expiry };
  return { state: 'ok', label: 'Verified', expiry: c.expiry || '' };
}
export function annualCheck(ph, personId, date, items, next) {
  const p = ph.staff.find(x => x.id === personId); if (!p) return null;
  p.checks ??= {};
  const answers = [];
  for (const it of items) {
    p.checks[it.id] = { result: it.result, date, method: it.method || '', expiry: it.expiry || '', ref: it.ref || '', note: it.note || '' };
    answers.push({ id: it.id, text: it.label, answer: it.result, note: it.note || '', expiry: it.expiry || '' });
  }
  p.lastCheck = date; p.annualDue = next || addMonths(date, 12);
  return addRecord(ph, { type: 'A1', kind: 'staff', title: 'Annual check · ' + p.name, date, answers, fields: { personId, next: p.annualDue } });
}
