// THE one place that decides what is due, overdue, started or undated. Every count on every screen comes from here
// (design rule 8), so Today, Reviews, Actions, Calendar and Staff always agree.
import { plan, reviewById, s8Limit, s8Takeover, latestStockCheck } from './rules.js';
import { today, addDays, addMonths, isDate, daysBetween, day, fmt, dueText } from './dates.js';
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
// Walk-In Briefing (28 Nov, owner brief): at most three lines on top of Today for the moment the owner walks in.
// Strictly read-only: it reads ph and never changes it, saves nothing and sends nothing.
//   s8: the S8 inventory (s 111), from s8Limit() and s8Takeover() (never s8Max(), whose grace window would hide an
//       overdue limit). A planned S8 review earlier than the limit is labelled as the owner's own plan, separately.
//   job: the one other job that matters most, from items() so it agrees with every other count on Today.
//   handover: the oldest visit answer still marked "Needs verification" at the latest visit that looked at it.
//   quiet: one calm line, only when all three are empty.
const BRIEF_CLEARS = new Set(['Checked', 'Issue', 'N/A']);
// [rank, date] for one job or one part of a person's row, or null when it isn't worth a line today.
function jobRank(x, t) {
  const n = isDate(x.date) ? daysBetween(t, x.date) : null;
  if (n !== null && n < 0) return [0, x.date];
  if (n === 0) return [1, x.date];
  // waiting on someone: a future check-back holds back any early nudge; once it arrives, check back
  if (x.waiting && isDate(x.checkBack)) return x.checkBack <= t ? [2, x.checkBack] : null;
  if (n !== null && n <= 7) return [3, x.date];
  if (x.type === 'expiry' && n !== null && n >= 8 && n <= 30) return [4, x.date];
  return null;
}
function rightFor(rank, date, x) {
  if (rank === 2) return 'Check back today';
  if (rank === 4 || (x.type === 'expiry' && rank === 3)) return 'Expires ' + fmt(date);
  if (x.type === 'expiry' && rank === 0) return 'Expired ' + fmt(date);
  return dueText(date);
}
export function briefing(ph, t = today()) {
  const out = { s8: null, job: null, handover: null, quiet: null };
  // ── S8
  const since = ph.inherited?.since, take = s8Takeover(ph), last = latestStockCheck(ph);
  const inv = take ? s8Limit({ ...ph, inherited: undefined }) : s8Limit(ph), soon = d => isDate(d) && daysBetween(t, d) <= 7;
  const planned = ph.schedule?.B1 || '';
  if (take && since <= t) out.s8 = { kind: 'takeover', title: 'S8 inventory after the takeover', sub: 'Make it in the drug register now · s 111(3)', date: since, right: dueText(since), tone: since < t ? 'bad' : 'warn' };
  else if (soon(inv)) out.s8 = { kind: 'inventory', title: 'S8 stock check', sub: 'Inventory limit · 3 months after the count on ' + fmt(last), date: inv, right: dueText(inv), tone: inv < t ? 'bad' : inv === t ? 'warn' : '' };
  else if (take && soon(since)) out.s8 = { kind: 'takeover-soon', title: 'S8 inventory on the takeover day', sub: 'Make it in the drug register that day · s 111(3)', date: since, right: dueText(since), tone: '' };
  else if (!last && !take) out.s8 = { kind: 'missing', title: 'Add your last S8 stocktake date', sub: 'The 3-month limit counts from your last completed count', date: '', right: '', tone: '' };
  else if (isDate(planned) && (!inv || planned < inv) && soon(planned)) out.s8 = { kind: 'planned', title: 'Planned S8 review', sub: 'Your own date · the inventory limit is ' + fmt(inv), date: planned, right: dueText(planned), tone: planned < t ? 'bad' : planned === t ? 'warn' : '' };
  if (out.s8) out.s8.key = 'review/B1';
  // ── one job
  let best = null;
  const consider = (it, x, partId) => { const r = jobRank(x, t); if (!r) return;
    const c = { rank: r[0], date: r[1], id: it.key + '/' + partId, it, x };
    if (!best || (c.rank - best.rank || c.date.localeCompare(best.date) || c.id.localeCompare(best.id)) < 0) best = c; };
  for (const it of items(ph, {}, t)) {
    if (it.key === 'review/B1' || it.bucket === 'tocheck') continue;
    if (it.kind === 'person') { for (const pt of it.parts || []) consider(it, pt, pt.type + ':' + pt.id); continue; }
    const cb = it.kind === 'action' ? ph.actions[it.ref]?.waiting?.checkBack || '' : '';
    consider(it, { type: it.kind, date: it.date, waiting: !!it.waiting, checkBack: cb }, '');
  }
  if (best) { const { it, x, rank, date } = best;
    const sub = it.kind !== 'person' ? (it.legal ? 'Required by law' : it.kind === 'action' ? (x.waiting ? 'Waiting on someone' : 'Action') : it.sub || '')
      : x.type === 'expiry' ? x.title : x.type === 'annual' ? 'Annual check' : x.title;
    out.job = { kind: it.kind, key: it.key, title: it.title, sub, date, right: rightFor(rank, date, x), tone: rank === 0 ? 'bad' : rank <= 2 ? 'warn' : '' }; }
  // ── handover: walk the visits oldest first; a substantive answer clears an earlier "Needs verification"
  const open = new Map();
  const visits = (ph.records || []).filter(r => r.type === 'Q1' && isDate(r.date)).sort((a, b) => a.date.localeCompare(b.date) || String(a.at || '').localeCompare(String(b.at || '')));
  for (const v of visits) for (const a of v.answers || []) {
    if (!a?.item) continue;
    if (BRIEF_CLEARS.has(a.answer)) open.delete(a.item);
    else if (a.answer === 'Needs verification' && !open.has(a.item)) open.set(a.item, { item: a.item, title: a.text || a.item, since: v.date });
  }
  const carry = [...open.values()].sort((a, b) => a.since.localeCompare(b.since) || a.item.localeCompare(b.item));
  if (carry.length) out.handover = { kind: 'handover', title: 'Still to verify · ' + carry[0].title, sub: 'From the ' + fmt(carry[0].since) + ' visit' + (carry.length > 1 ? ' · ' + (carry.length - 1) + ' more' : ''), date: carry[0].since, right: '', tone: '' };
  if (!out.s8 && !out.job && !out.handover) out.quiet = { kind: 'quiet', title: 'A quiet day. Nothing needs you this week.' };
  return out;
}
