// Micro-patch 1 (owner brief, 25 Nov 2026): "Align to 4 quarters". Snaps UPCOMING recurring due dates onto the first
// Monday of Feb, May, Aug and Nov. Overdue and undated items are left alone, statutory fixed dates (premises renewal,
// financial-interest declaration) are never touched, and the S8 review (B1) is never moved past its s 111 limit.
// It only changes due dates (nothing is marked done) and keeps the previous dates so the owner can undo it.
import { today, addDays, isDate, daysBetween } from './dates.js';
import { plan, monthsFor, s8Limit } from './rules.js';
import { reviewDue } from './summary.js';
export const QUARTER_MONTHS = [2, 5, 8, 11];
// First Monday of a month (the "first week" anchor).
export function anchor(y, m) { let d = y + '-' + String(m).padStart(2, '0') + '-01'; while (new Date(d + 'T00:00:00Z').getUTCDay() !== 1) d = addDays(d, 1); return d; }
const anchors = (t, months) => { const y = +t.slice(0, 4), out = []; for (let k = y - 1; k <= y + 2; k++) for (const m of months) out.push(anchor(k, m)); return out.sort(); };
const nearest = (list, d) => list.reduce((best, a) => best === null || Math.abs(daysBetween(d, a)) < Math.abs(daysBetween(d, best)) ? a : best, null);
const FIXED = ['CO-P', 'CO-F'];
// Which quarter each annual job belongs to: staff checks in Feb (before flu season), governance in May (before the
// 30 June renewal), service reviews in Aug.
function target(a, ph) {
  if (['B1', 'Q1', 'Q4'].includes(a.id)) return QUARTER_MONTHS;
  if (monthsFor(ph, a) !== 12 || FIXED.includes(a.id)) return null;
  if (a.id === 'A3') return [5];
  if (a.service) return [8];
  return null;
}
export function alignPlan(ph, t = today()) {
  const out = [];
  for (const a of plan(ph).filter(a => !a.event)) {
    const months = target(a, ph), from = reviewDue(ph, a.id); if (!months || !isDate(from) || from < t) continue;
    let cands = anchors(t, months).filter(x => x >= t);
    if (a.id === 'B1') { const lim = s8Limit(ph); if (lim) cands = cands.filter(x => x <= lim); }
    const to = nearest(cands, from); if (to && to !== from) out.push({ kind: 'review', id: a.id, name: a.name, from, to });
  }
  for (const p of ph.staff.filter(p => p.active !== false && isDate(p.annualDue) && p.annualDue >= t)) {
    const to = nearest(anchors(t, [2]).filter(x => x >= t), p.annualDue); if (to && to !== p.annualDue) out.push({ kind: 'staff', id: p.id, name: p.name, from: p.annualDue, to });
  }
  return out;
}
export function applyAlign(ph, changes) {
  for (const x of changes) { if (x.kind === 'review') (ph.schedule ??= {})[x.id] = x.to; else { const p = ph.staff.find(s => s.id === x.id); if (p) p.annualDue = x.to; } }
  (ph.flags ??= {}).alignUndo = { at: today(), changes };
}
export function undoAlign(ph) {
  const u = ph.flags?.alignUndo; if (!u) return 0;
  for (const x of u.changes) { if (x.kind === 'review') { if (ph.schedule?.[x.id] === x.to) ph.schedule[x.id] = x.from; } else { const p = ph.staff.find(s => s.id === x.id); if (p && p.annualDue === x.to) p.annualDue = x.from; } }
  delete ph.flags.alignUndo; return u.changes.length;
}
