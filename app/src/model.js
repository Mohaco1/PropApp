// The pharmacy record and the only functions that change it. Every change is logged in history with who and when.
import { uid } from './util.js';
import { today, addMonths, isDate, fmt } from './dates.js';
import { C } from './content.js';
export const SCHEMA = 2;
export function emptyPharmacy(name = '') {
  const now = new Date().toISOString();
  return {
    id: uid(), schema: SCHEMA, rev: 0, updatedAt: now, deletedAt: null, name, address: '', region: '', identifier: '',
    proprietors: [], recordingAs: '', services: {}, flags: {}, schedule: {},
    records: [], actions: {}, staff: [], procedures: [], documents: [], log: [], history: [],
    obligations: {}, settings: { created: now, setupDone: false },
  };
}
export const me = ph => ph.proprietors.find(p => p.id === ph.recordingAs) || ph.proprietors[0] || { id: '', name: 'Proprietor' };
export function note(ph, what) { ph.history.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, what }); }

// ---------- actions ----------
export function newAction(ph, { title, due = '', source = null, person = '' }) {
  const a = { id: uid(), title, due, status: 'open', created: today(), source, person, waiting: null, closed: null, log: [] };
  a.log.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, kind: 'raised', text: source?.label ? 'Raised from ' + source.label : 'Added' });
  ph.actions[a.id] = a; note(ph, 'Action raised · ' + title); return a;
}
export function closeAction(ph, id, what, date = today()) {
  const a = ph.actions[id]; if (!a || a.status !== 'open') return;
  a.status = 'closed'; a.closed = { date, what, by: me(ph).name }; a.waiting = null;
  a.log.push({ id: uid(), at: new Date().toISOString(), date, by: me(ph).name, kind: 'closed', text: 'Closed · ' + what }); note(ph, 'Action closed · ' + a.title);
}
export function reopenAction(ph, id, why) {
  const a = ph.actions[id]; if (!a || a.status === 'open') return;
  a.status = 'open'; a.closed = null; a.log.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, kind: 'reopened', text: 'Reopened' + (why ? ' · ' + why : '') }); note(ph, 'Action reopened · ' + a.title);
}
export function updateAction(ph, id, patch, text) {
  const a = ph.actions[id]; if (!a) return;
  Object.assign(a, patch); a.log.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, kind: 'updated', text }); note(ph, 'Action updated · ' + a.title);
}
export function waitOn(ph, id, asked, checkBack) {
  const a = ph.actions[id]; if (!a) return;
  a.waiting = { asked, on: today(), checkBack }; a.log.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, kind: 'asked', text: 'Asked for: ' + asked + (checkBack ? ' · check back ' + checkBack : '') }); note(ph, 'Waiting on · ' + asked);
}
export function stopWaiting(ph, id, text) {
  const a = ph.actions[id]; if (!a || !a.waiting) return;
  a.log.push({ id: uid(), at: new Date().toISOString(), by: me(ph).name, kind: 'asked', text }); a.waiting = null;
}

// ---------- records (completed reviews, visits, meetings, staff checks) ----------
export function addRecord(ph, rec) {
  const r = { id: uid(), at: new Date().toISOString(), by: me(ph).name, answers: [], fields: {}, notes: '', actionIds: [], ...rec };
  ph.records.push(r); note(ph, 'Recorded · ' + (r.title || r.type) + ' · ' + r.date); return r;
}

// ---------- staff ----------
export function requirements(person) {
  const R = C.staff.requirements[/\bPIC\b|in charge/i.test(person.role || '') ? 'Pharmacist on duty' : person.role] || C.staff.requirements.Pharmacist;
  const out = [...R.base];
  for (const s of person.services || []) for (const r of R.services[s] || []) if (!out.some(x => x.id === r.id)) out.push(r);
  return out;
}
// Latest check for one requirement: { result: 'ok' | 'issue' | 'na', date, method, expiry, ref, note } or null.
export const lastCheck = (person, reqId) => person.checks?.[reqId] || null;
// Stage 3E: pharmacists and support staff have different checks under the same id (service/prescribing is a pharmacist's
// own prescribing authority, but an intern's supervised support duties). A check recorded under the other kind of role
// never counts for the role the person has now.
export const roleGroup = role => /^Pharmacist\b|\bPIC\b|in charge/i.test(role || '') ? 'pharmacist' : 'support';
export function credentialState(person, reqId) {
  const c = lastCheck(person, reqId);
  if (!c) return { state: 'none', label: 'Not checked yet' };
  if (c.role && roleGroup(c.role) !== roleGroup(person.role)) return { state: 'none', label: 'Not checked for this role' };
  if (c.result === 'issue') return { state: 'issue', label: 'Needs review' };
  if (c.result === 'na') return { state: 'na', label: 'Not applicable' };
  if (isDate(c.expiry) && c.expiry < today()) return { state: 'expired', label: 'Expired ' + fmt(c.expiry), expiry: c.expiry };
  return { state: 'ok', label: 'Verified', expiry: c.expiry || '' };
}
export function annualCheck(ph, personId, date, items, next) {
  const p = ph.staff.find(x => x.id === personId); if (!p) return null;
  p.checks ??= {};
  const answers = [];
  for (const it of items) {
    p.checks[it.id] = { result: it.result, date, method: it.method || '', expiry: it.expiry || '', ref: it.ref || '', note: it.note || '', role: it.role || p.role || '' };
    answers.push({ id: it.id, text: it.label, answer: it.result, isIssue: it.result === 'issue', note: it.note || '', expiry: it.expiry || '' });
  }
  p.lastCheck = date; p.annualDue = next || addMonths(date, 12);
  return addRecord(ph, { type: 'A1', kind: 'staff', title: 'Annual check · ' + p.name, date, answers, fields: { personId, next: p.annualDue } });
}
// Stage 3E: someone whose last day was set in advance stays in current staff until that day, then moves to former staff.
export function settleLeavers(ph, t = today()) { let n = 0; for (const p of ph?.staff || []) if (p.leaving && p.leaving <= t && p.active !== false) { p.active = false; p.end = p.leaving; delete p.leaving; note(ph, 'Moved to former staff (last day ' + fmt(p.end) + ') · ' + p.name); n++; } return n; }

// ---------- D3-A: schema 2 migration ----------
// migratePharmacy(ph) brings any stored, restored or synced pharmacy to schema 2. It is pure, synchronous and
// deterministic: the same input gives the same output on every device (it never calls uid() or new Date() to fill a
// legacy field), so two phones migrating one backup get identical ids and can merge entry by entry later.
// FNV-1a over UTF-16 code units, run twice with different offsets, gives a 64-bit (16 hex) id.
function fnv(str, h) { for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
const hex8 = n => n.toString(16).padStart(8, '0');
// detId(prefix, tuple, seenCounts): the nth identical tuple in one array gets occurrence n, so duplicates stay distinct.
export function detId(prefix, tuple, seenCounts) {
  const t = JSON.stringify(tuple), n = seenCounts ? (seenCounts.get(t) || 0) : 0; if (seenCounts) seenCounts.set(t, n + 1);
  const s = prefix + '\u0001' + t + '\u0001' + n;
  return prefix + ':' + hex8(fnv(s, 0x811c9dc5)) + hex8(fnv(s, 0x050c5d1f ^ 0x9e3779b9));
}
const EPOCH = '1970-01-01T00:00:00.000Z';
const isoOk = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(s) && !isNaN(Date.parse(s));
const iso = s => new Date(Date.parse(s)).toISOString();
// The latest timestamp anywhere in the record (keys ending in "at"/"At" or "created"), never the clock.
function latest(x, depth = 0, best = EPOCH) {
  if (!x || typeof x !== 'object' || depth > 40) return best;
  for (const [k, v] of Object.entries(x)) {
    if (typeof v === 'string') { if ((/(^at$|At$|^created$)/.test(k)) && k !== 'importedAt' && k !== 'deletedAt' && isoOk(v)) { const t = iso(v); if (t > best) best = t; } }
    else if (v && typeof v === 'object') best = latest(v, depth + 1, best);
  }
  return best;
}
const pobj = x => !!x && typeof x === 'object' && !Array.isArray(x);
// Backfills `.id` on entries that lack one, from the entry's own content (minus any id) and its occurrence count.
function backfill(arr, prefix, key) {
  if (!Array.isArray(arr)) return arr; const counts = new Map();
  return arr.map(x => { if (!pobj(x) || (typeof x.id === 'string' && x.id)) return x; const { id, ...rest } = x; return { id: detId(prefix, key ? key(rest) : rest, counts), ...rest }; });
}
const vKey = v => [v.v ?? '', v.at ?? '', v.status ?? '', v.body ?? ''];
const vSort = (a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.v ?? '').localeCompare(String(b.v ?? ''), undefined, { numeric: true }) || String(a.id).localeCompare(String(b.id));
const rSort = (a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id).localeCompare(String(b.id));
function dedupe(xs) { const out = [], ids = new Set(); for (const x of xs) { if (!pobj(x)) continue; if (ids.has(x.id)) continue; ids.add(x.id); out.push(x); } return out; }
function procIds(p, prefixKey) {
  const versions = backfill(p.versions || [], 'ver:' + prefixKey, vKey), reviews = Array.isArray(p.reviews) ? backfill(p.reviews, 'prv:' + prefixKey) : undefined;
  return { ...p, versions, ...(reviews ? { reviews } : {}) };
}
// Procedures: one per service, id "proc:<service>". Legacy duplicates for one service become one, their versions and
// reviews deduplicated and sorted deterministically; a procedure that was already alone keeps its versions verbatim.
function reconcileProcedures(list) {
  if (!Array.isArray(list)) return list;
  const groups = new Map(), order = [];
  for (const p of list) { if (!pobj(p)) continue; const svc = typeof p.service === 'string' && p.service ? p.service : null; const key = svc ? 'proc:' + svc : (p.id || detId('proc', p));
    if (!groups.has(key)) { groups.set(key, []); order.push(key); } groups.get(key).push(procIds(p, svc || key)); }
  return order.map(key => { const g = groups.get(key), svc = g[0].service;
    if (g.length === 1) return { ...g[0], id: svc ? key : g[0].id || key };
    const versions = dedupe(g.flatMap(p => p.versions)).sort(vSort), rvs = g.some(p => Array.isArray(p.reviews)) ? dedupe(g.flatMap(p => p.reviews || [])).sort(rSort) : undefined;
    // Fields other than versions/reviews come from the procedure holding the latest version (ties: the later in the list).
    const lastAt = p => p.versions.reduce((m, v) => (String(v.at || '') > m ? String(v.at || '') : m), '');
    let lead = g[0]; for (const p of g) if (lastAt(p) >= lastAt(lead)) lead = p;
    const status = g.some(p => p.status === 'adopted') && versions.some(v => v.status === 'Adopted') ? 'adopted' : lead.status;
    return { ...lead, id: key, status, versions, ...(rvs ? { reviews: rvs } : {}) }; });
}
export function migratePharmacy(input) {
  if (!pobj(input)) return input;
  const ph = JSON.parse(JSON.stringify(input));
  const pid = typeof ph.id === 'string' ? ph.id : '';
  ph.history = backfill(ph.history, 'h:' + pid);
  if (pobj(ph.actions)) for (const [aid, a] of Object.entries(ph.actions)) if (pobj(a) && Array.isArray(a.log)) a.log = backfill(a.log, 'al:' + aid);
  ph.procedures = reconcileProcedures(ph.procedures);
  for (const k of ['log', 'documents', 'proprietors', 'records', 'staff', 'changes']) if (Array.isArray(ph[k])) ph[k] = backfill(ph[k], k + ':' + pid);
  ph.schema = SCHEMA;
  ph.rev = Number.isInteger(ph.rev) && ph.rev >= 0 ? ph.rev : 0;
  ph.deletedAt = isoOk(ph.deletedAt) ? iso(ph.deletedAt) : null;
  if (!isoOk(ph.updatedAt)) { delete ph.updatedAt; ph.updatedAt = latest(ph); } else ph.updatedAt = iso(ph.updatedAt);
  return ph;
}
