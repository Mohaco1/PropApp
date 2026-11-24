// What each review is, how often it falls due, whether it applies to this pharmacy, and the S8 limit (s 111).
import { C } from './content.js';
import { addMonths, isDate } from './dates.js';
const MONTHS = { Monthly: 1, Quarterly: 3, 'Six-monthly': 6, Annual: 12 };
export const LEGAL = {
  B1: { line: 'Every 3 months · required by law (Regulation 2026, s 111)', short: 'Required by law' },
};
// Reviews whose checks are covered inside the site visit for a new pharmacy (same rule as the current app).
const IN_VISIT = new Set(['service-vaccination', 'service-staged', 'vacc-storage']);
export function catalog() {
  return C.reviews.catalog.map(a => ({
    ...a,
    months: MONTHS[a.frequency] || 0,
    event: !!a.eventOnly || !MONTHS[a.frequency],
    legal: LEGAL[a.id] || null,
    kind: a.id === 'Q1' ? 'visit' : ['M1', 'M2', 'Q4'].includes(a.id) ? 'meeting' : a.id === 'A1' ? 'staff' : 'review',
  }));
}
export const reviewById = id => catalog().find(a => a.id === id);
export function serviceName(id) { return C.services.services.find(s => s.id === id)?.name || id; }
export function activeServices(ph) { return Object.entries(ph.services || {}).filter(([, s]) => s.active).map(([id]) => id); }
export function daaRoute(ph) { return ph.services?.daa?.answers?.routes || ''; }
// Does this review apply here? Returns { applies, why }.
export function applies(ph, a) {
  if (!a.service) return { applies: a.id !== 'A1', why: a.id === 'A1' ? 'Staff checks live in Staff' : '' };
  const active = activeServices(ph);
  if (!active.includes(a.service)) return { applies: false, why: serviceName(a.service) + ' is not offered here' };
  if (IN_VISIT.has(a.id)) return { applies: false, why: 'Covered inside the site visit' };
  if (a.service === 'daa') {
    const r = daaRoute(ph);
    if (a.id === 'daa-house' && r && !/house/.test(r)) return { applies: false, why: 'Packs are not made here' };
    if (a.id === 'daa-external' && !/routeA|external/.test(r)) return { applies: false, why: 'No outside packer' };
    if (a.id === 'daa-external-b' && !/routeB|pharmacy/.test(r)) return { applies: false, why: 'Another pharmacy does not dispense' };
    if (a.id === 'daa-house' && /house/.test(r)) return { applies: false, why: 'Covered inside the site visit' };
  }
  if (a.id === 'otp-amenity' && !ph.flags?.volume) return { applies: false, why: 'Fewer than 80 a day' };
  return { applies: true, why: '' };
}
export function plan(ph) { return catalog().filter(a => a.id !== 'A1' && applies(ph, a).applies); }
// Latest stock-check (inventory) date from S8 reviews.
export function latestStockCheck(ph) {
  return (ph.records || []).filter(r => r.type === 'B1' && isDate(r.fields?.stockDate)).map(r => r.fields.stockDate).sort().at(-1) || '';
}
// s 111: the next S8 inventory can't be later than 3 months after the latest stock-check date.
export function s8Limit(ph) { const d = latestStockCheck(ph); return d ? addMonths(d, 3) : ''; }
export function suggestedNext(ph, id, from) {
  const a = reviewById(id); if (!a || !a.months) return '';
  const d = addMonths(from, a.months);
  if (id === 'B1') { const lim = s8Limit(ph); if (lim && lim < d) return lim; }
  return d;
}
