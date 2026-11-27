// THE one place that decides what is due, overdue, started or undated. Every count on every screen comes from here
// (design rule 8), so Today, Reviews, Actions, Calendar and Staff always agree.
import { plan, reviewById, s8Limit, latestStockCheck } from './rules.js';
import { today, addDays, addMonths, isDate, daysBetween, day, fmt } from './dates.js';
import { requirements, credentialState } from './model.js';
import { plural } from './util.js';
export function bucket(date, t = today()) {
  if (!isDate(date)) return 'nodate';
  if (date < t) return 'overdue';
  if (date === t) return 'today';
  if (date <= addDays(t, 7)) return 'week';
  return 'later';
}
export function reviewDue(ph, id) {
  let d = ph.schedule?.[id] || '';
  if (id === 'B1') { const lim = s8Limit(ph); if (lim && (!d || lim < d)) d = lim; }
  return d;
}
const visitStarted = (drafts, extra) => !!drafts?.[extra ? 'visit/extra' : 'visit/quarterly'];
// Everything the owner might need to do, one entry per job.
// opts.ahead: how many days ahead a staff expiry or annual check joins its person's row (30 on screen; the calendar
// file passes Infinity so every known staff date reaches the phone's calendar).
export function items(ph, drafts = {}, t = today(), { ahead = 30 } = {}) {
  const out = [];
  // reviews in this pharmacy's plan
  for (const a of plan(ph)) {
    if (a.event) continue;
    const date = reviewDue(ph, a.id);
    const started = a.id === 'Q1' ? visitStarted(drafts, false) : !!drafts['review/' + a.id];
    out.push({ key: 'review/' + a.id, kind: a.kind === 'visit' ? 'visit' : a.kind === 'meeting' ? 'meeting' : 'review', ref: a.id, title: a.name, date, bucket: bucket(date, t), started, legal: !!a.legal, sub: a.frequency });
  }
  if (visitStarted(drafts, true)) out.push({ key: 'visit/extra', kind: 'visit', ref: 'extra', title: 'Extra visit', date: drafts['visit/extra'].date || '', bucket: 'started', started: true, legal: false, sub: 'In progress' });
  // open actions not about a person
  const people = new Map();
  for (const ac of Object.values(ph.actions)) {
    if (ac.status !== 'open') continue;
    // H-10: a staff action joins its person's row only while that person is active staff; otherwise (former staff, or
    // someone removed) it is its own row, so Today and Actions always count the same open actions.
    const pid = ac.source?.type === 'staff' && ph.staff.some(p => p.id === ac.source.staffId && p.active !== false) ? ac.source.staffId : '';
    const cb = ac.waiting?.checkBack;
    // Stage 3E: a staff action that is waiting on someone carries its check-back date on the person's row too.
    if (pid) { (people.get(pid) || people.set(pid, []).get(pid)).push({ type: 'action', date: ac.due, title: ac.title, id: ac.id, waiting: !!ac.waiting, checkBack: cb || '', checkBackDue: !!(cb && cb <= t) }); continue; }
    out.push({ key: 'action/' + ac.id, kind: 'action', ref: ac.id, title: ac.title, date: ac.due, bucket: bucket(ac.due, t), legal: false,
      sub: ac.waiting ? (cb && cb <= t ? 'Check back today' : 'Waiting · check back ' + fmt(cb)) : 'Action', waiting: !!ac.waiting, checkBackDue: !!(cb && cb <= t) });
  }
  // staff: one row per person (design rule 10)
  for (const p of ph.staff.filter(x => x.active !== false)) {
    const list = people.get(p.id) || [];
    for (const r of requirements(p)) {
      const cs = credentialState(p, r.id);
      if (cs.expiry && daysBetween(t, cs.expiry) <= ahead) list.push({ type: 'expiry', date: cs.expiry, title: r.label, id: r.id });
    }
    if (isDate(p.annualDue) && daysBetween(t, p.annualDue) <= ahead) list.push({ type: 'annual', date: p.annualDue, title: 'Annual check', id: 'annual' });
    if (!list.length) continue;
    list.sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
    const date = list.find(x => isDate(x.date))?.date || '';
    const n = list.length, cbDue = list.some(x => x.checkBackDue), waiting = list.filter(x => x.waiting), cbNext = waiting.map(x => x.checkBack).filter(isDate).sort()[0];
    out.push({ key: 'person/' + p.id, kind: 'person', ref: p.id, title: p.name, date, bucket: bucket(date, t), legal: false, sub: (n === 1 ? list[0].title : plural(n, 'check')) + (cbDue ? ' · check back today' : cbNext ? ' · waiting, check back ' + fmt(cbNext) : ''), parts: list, waiting: waiting.length > 0, checkBackDue: cbDue });
  }
  // adopted procedures: annual review
  // Stage 3E: a newer draft (1.1) doesn't hide the review of the version still in use (1.0); a newly adopted version
  // (2.0) starts its own 12 months.
  for (const p of ph.procedures || []) { if (!(p.versions || []).some(v => v.status === 'Adopted')) continue; const date = procReviewDue(p);
    out.push({ key: 'procedure/' + p.service, kind: 'procedure', ref: p.service, title: p.title.replace(/ SOP$/, '') + ' · annual review', date, bucket: bucket(date, t), legal: false, sub: 'Procedure' }); }
  // setup answers still to confirm
  for (const [sid, s] of Object.entries(ph.services)) {
    if (!s.active) continue;
    const n = Object.values(s.answers || {}).filter(v => /Needs verification/.test(String(v))).length;
    if (n) out.push({ key: 'verify/' + sid, kind: 'verify', ref: sid, title: 'Setup answers to confirm', date: '', bucket: 'tocheck', legal: false, sub: plural(n, 'answer') });
  }
  return out;
}
// Order: required by law first, then overdue oldest first, today, started, this week, later, undated, to check.
const ORDER = { overdue: 0, today: 1, started: 2, week: 3, later: 4, nodate: 5, tocheck: 6 };
export function ranked(list) {
  return [...list].sort((a, b) => (b.legal && ['overdue', 'today'].includes(b.bucket) ? 1 : 0) - (a.legal && ['overdue', 'today'].includes(a.bucket) ? 1 : 0)
    || (ORDER[a.bucket] - ORDER[b.bucket]) || ((b.legal ? 1 : 0) - (a.legal ? 1 : 0)) || (a.date || '9').localeCompare(b.date || '9') || a.title.localeCompare(b.title));
}
// "This week" on Today and across pharmacies: due today or this week, started, or started and not yet overdue.
export const inWeek = i => ['today', 'week', 'started'].includes(i.bucket) || (i.started && i.bucket !== 'overdue');
export function counts(list) {
  const c = { overdue: 0, today: 0, started: 0, week: 0, nodate: 0, tocheck: 0, waiting: 0, all: list.length, actionsOpen: 0, actionsOverdue: 0 };
  for (const i of list) {
    if (i.bucket in c) c[i.bucket]++;
    if (i.started && i.bucket !== 'started') c.started++;
    if (i.waiting) c.waiting++;
  }
  return c;
}
// Action counts for the Actions screen, including staff actions (they are actions too).
export function actionCounts(ph, t = today()) {
  const open = Object.values(ph.actions).filter(a => a.status === 'open');
  return { open: open.length, overdue: open.filter(a => isDate(a.due) && a.due < t).length, closed: Object.values(ph.actions).length - open.length, all: Object.values(ph.actions).length };
}
// C-01: pass ph and the S8 prompt (s8) stays until a real stock-check date is recorded, even once a due date is set.
export function sentence(list, ph) {
  const r = ranked(list), over = r.filter(i => i.bucket === 'overdue'), due = r.filter(i => i.bucket === 'today');
  const s8i = r.find(i => i.key === 'review/B1'), s8 = s8i && (!isDate(s8i.date) || (ph && !latestStockCheck(ph))) ? s8i : undefined;
  if (over.length) return { tone: 'bad', text: (over.length === 1 ? '1 thing is overdue.' : over.length + ' things are overdue.'), start: over[0], s8 };
  if (due.length) return { tone: 'warn', text: 'Nothing overdue. ' + due.length + ' due today.', start: due[0], s8 };
  const next = r.find(i => isDate(i.date));
  // Hardening brief: with no S8 stocktake date yet, "Nothing overdue" overstates it.
  if (s8) return { tone: 'ok', text: 'No overdue items with known dates.', start: next || null, s8 };
  return { tone: 'ok', text: 'Nothing overdue.', start: next || null };
}
export { reviewById };
// Stage 3E: the one reading of a procedure's next annual review: 12 months after its last review or the adoption of the
// version in use, whichever is later.
export function procReviewDue(p) { const ad = (p.versions || []).filter(v => v.status === 'Adopted').at(-1), rv = (p.reviews || []).at(-1)?.date || '';
  const base = [day(ad?.adoptedAt || ad?.at || p.versions?.at(-1)?.at || ''), day(rv)].filter(isDate).sort().at(-1); return base ? addMonths(base, 12) : ''; }
