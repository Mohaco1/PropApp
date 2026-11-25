// One date style for the whole app (design rule 9): "21 Aug" this year, "21 Aug 2025" otherwise.
let fixedToday = null; // tests and the example can pin "today"
export const setToday = d => { fixedToday = d; };
// A stored timestamp (ISO, UTC) as the local calendar day: Sydney is ahead of UTC, so slicing the ISO string would
// show yesterday before 10 or 11 am. Plain dates pass through unchanged.
export function day(s) { if (!s) return ''; const t = String(s); if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; const d = new Date(t); if (isNaN(d)) return t.slice(0, 10);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
export function today() {
  if (fixedToday) return fixedToday;
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const parse = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const iso = dt => dt.toISOString().slice(0, 10);
export const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').slice(0, 10));
export const addDays = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export function addMonths(s, n) {
  const d = parse(s), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return iso(d);
}
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function fmt(s, { weekday = false } = {}) {
  if (!isDate(s)) return '';
  const d = parse(s), t = parse(today());
  const base = d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + (d.getUTCFullYear() === t.getUTCFullYear() ? '' : ' ' + d.getUTCFullYear());
  return weekday ? DOW[d.getUTCDay()] + ' ' + base : base;
}
// "today", "tomorrow", "Fri 28 Nov" within a week, otherwise fmt()
export function soonText(s) {
  if (!isDate(s)) return '';
  const n = daysBetween(today(), s);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n > 1 && n < 7) return fmt(s, { weekday: true });
  return fmt(s);
}
// "Overdue 6 days", "Due today", "Due Fri 28 Nov"
export function dueText(s) {
  if (!isDate(s)) return 'No date';
  const n = daysBetween(today(), s);
  if (n < 0) return 'Overdue ' + (-n) + (n === -1 ? ' day' : ' days');
  if (n === 0) return 'Due today';
  return 'Due ' + soonText(s);
}
export const weekStart = s => { const d = parse(s); const dow = (d.getUTCDay() + 6) % 7; return addDays(s, -dow); };
export const monthName = s => { const d = parse(s); return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
