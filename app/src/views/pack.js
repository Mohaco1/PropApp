// Evidence pack (V3-03; owner un-deferred the inspector pack, 25 Nov 2026): one printable, de-identified summary of the
// proprietor's oversight for the last 12 months. What's on screen is what prints (A4, via the browser's print or
// "Save as PDF"). Nothing is marked done or changed; it only reads what the owner recorded. No patient information.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, addMonths, isDate, daysBetween } from '../dates.js';
import { reviewById, activeServices, serviceName } from '../rules.js';
import { UPDATES } from '../content/updates.js';
import { items, counts } from '../summary.js';
import { requirements, credentialState } from '../model.js';
import { issueCount } from '../issues.js';
const L = C.law;
const closedBy = a => a.closed?.by || [...(a.log || [])].reverse().find(e => e.kind === 'closed' && e.by)?.by || '';
// F-V3-04: the pack's own dates always carry the year.
const full = s => { const f = fmt(s); return /\d{4}$/.test(f) ? f : f + ' ' + String(s).slice(0, 4); };
const table = (head, rows, empty) => rows.length ? h`<table class="ptable"><thead><tr>${head.map(x => h`<th>${x}</th>`)}</tr></thead><tbody>${rows.map(r => h`<tr>${r.map(x => h`<td>${x}</td>`)}</tr>`)}</tbody></table>` : h`<p class="meta">${empty}</p>`;
export function packData(ph, drafts, from = addMonths(today(), -12)) {
  const recs = ph.records.filter(r => r.date >= from).sort((a, b) => b.date.localeCompare(a.date));
  const acts = Object.values(ph.actions);
  const n = counts(items(ph, drafts));
  return {
    from, n,
    reviews: recs.filter(r => r.kind !== 'staff' && r.kind !== 'departure').map(r => [fmt(r.date), r.extra ? 'Extra site visit' : r.title || reviewById(r.type)?.name || r.type, r.by || '', String(issueCount(r)), isDate(r.fields?.next) ? fmt(r.fields.next) : '']),
    s8: ph.records.filter(r => r.type === 'B1' && r.date >= from).sort((a, b) => b.date.localeCompare(a.date)).map(r => [fmt(r.date), isDate(r.fields?.stockDate) ? fmt(r.fields.stockDate) : '', r.fields?.stockBy || r.fields?.stockPharmacist || '', isDate(r.fields?.next) ? fmt(r.fields.next) : '']),
    open: acts.filter(a => a.status !== 'closed').sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).map(a => [a.title, fmt(a.created), a.due ? fmt(a.due) : '', a.waiting ? 'Waiting · ' + a.waiting.asked : (a.due && a.due < today() ? 'Overdue' : 'Open')]),
    // F-V3-02: who closed it (from the close itself, or the log of an older record). F-V3-03: routine staff-check
    // actions are one line per person, so the real fixes stand out.
    closed: acts.filter(a => a.status === 'closed' && (a.closed?.date || '') >= from && a.source?.type !== 'staff').sort((a, b) => b.closed.date.localeCompare(a.closed.date)).map(a => [a.title, fmt(a.closed.date), a.closed.what || '', closedBy(a)]),
    staffClosed: Object.values(acts.filter(a => a.status === 'closed' && (a.closed?.date || '') >= from && a.source?.type === 'staff').reduce((g, a) => { const who = a.person || ph.staff.find(p => p.id === a.source.staffId)?.name || 'Staff'; (g[who] ??= { who, n: 0, last: '' }); g[who].n++; if (a.closed.date > g[who].last) g[who].last = a.closed.date; return g; }, {}))
      .sort((x, y) => x.who.localeCompare(y.who)).map(x => [x.who, 'Staff checks: ' + x.n + (x.n === 1 ? ' item' : ' items') + ' verified and closed', fmt(x.last)]),
    updatesRead: Object.keys(ph.flags?.updatesRead || {}).length,
    staff: ph.staff.filter(p => p.active !== false).map(p => { const st = requirements(p).map(q => ({ q, s: credentialState(p, q.id) }));
      const exp = st.filter(x => x.s.expiry).sort((a, b) => a.s.expiry.localeCompare(b.s.expiry))[0];
      const attention = st.filter(x => x.s.state === 'expired' || x.s.state === 'issue' || x.s.state === 'none' || (x.s.expiry && daysBetween(today(), x.s.expiry) <= 30)).length;
      return [p.name, p.role || '', isDate(p.annualDue) ? fmt(p.annualDue) : '', exp ? exp.q.label + ' · ' + fmt(exp.s.expiry) : '', attention ? attention + ' to look at' : 'Current']; }),
    obligations: L.OBL.filter(o => !o[5].length || o[5].some(s => activeServices(ph).includes(s))).map(o => [o[1] + ' · ' + o[2], ph.obligations?.[o[0]]?.where || 'Not recorded', isDate(ph.obligations?.[o[0]]?.date) ? fmt(ph.obligations[o[0]].date) : '']),
    procedures: activeServices(ph).map(id => { const p = ph.procedures.find(x => x.service === id), v = p?.versions?.at(-1), adopted = p?.versions?.filter(x => x.status === 'Adopted').at(-1);
      return [serviceName(id), v ? v.v : 'Not drafted', adopted ? 'Adopted ' + fmt(String(adopted.adoptedAt || adopted.at).slice(0, 10)) : (v ? 'Draft' : ''), p?.reviews?.length ? fmt(String(p.reviews.at(-1).date).slice(0, 10)) : '']; }),
  };
}
register('pack', {
  tab: 'more',
  render(c) {
    const ph = c.ph, d = packData(ph, c.drafts);
    const sec = (title, inner) => h`<section class="psec"><h2>${title}</h2>${inner}</section>`;
    return screen({ title: 'Evidence pack', back: true, body: h`<p class="muted no-print">A summary of what you’ve recorded over the last 12 months, for an inspector or your own records. Check your notes for patient details before sharing it.</p>
      <div class="dock-inline no-print">${btn('Print or save as PDF', 'print', { kind: 'primary', cls: 'block' })}</div>
      <p class="hint no-print">Printing isn’t available inside the claude.ai preview: open the app file in your phone’s browser.</p>
      <div class="pack print-only">
        <header class="phead"><h1>${ph.name} · evidence pack</h1>
          <p>${[ph.address, ph.identifier && 'Pharmacy ' + ph.identifier].filter(Boolean).join(' · ')}</p>
          <p>Proprietor${ph.proprietors.length === 1 ? '' : 's'}: ${ph.proprietors.map(p => p.name).join(', ') || '—'}</p>
          <p>From ${full(d.from)} to ${full(today())} · made ${full(today())}</p>
          <p>Proprietor oversight record only: statutory S8 registers, dispensing records and cold-chain logs stay in their primary pharmacy systems.</p>
          <p>Designed for de-identified proprietor records: check your notes before sharing.</p>
          <p>Today: ${d.n.overdue === 1 ? '1 item overdue' : d.n.overdue + ' items overdue'} · ${d.n.all - d.n.tocheck === 1 ? '1 item' : (d.n.all - d.n.tocheck) + ' items'} in the plan · law and practice updates read: ${d.updatesRead} of ${UPDATES.length}</p></header>
        ${sec('Reviews, visits and meetings · ' + d.reviews.length, table(['Date', 'What', 'Recorded by', 'Issues', 'Next due'], d.reviews, 'None recorded in this period.'))}
        ${sec('S8 stock checks · ' + d.s8.length, table(['Reviewed', 'Stock check', 'Pharmacist', 'Next due'], d.s8, 'None recorded in this period.'))}
        ${sec('Open actions · ' + d.open.length, table(['Action', 'Raised', 'Due', 'Status'], d.open, 'No open actions.'))}
        ${sec('Actions closed · ' + d.closed.length, d.closed.some(r => r[3]) ? table(['Action', 'Closed', 'What was seen', 'By'], d.closed, 'None closed in this period.') : table(['Action', 'Closed', 'What was seen'], d.closed.map(r => r.slice(0, 3)), 'None closed in this period.'))}
        ${d.staffClosed.length ? sec('Staff checks closed', table(['Person', 'What', 'Latest'], d.staffClosed, '')) : ''}
        ${sec('Staff · ' + d.staff.length, table(['Name', 'Role', 'Annual check due', 'Next expiry', 'Checks'], d.staff, 'No staff recorded.'))}
        ${sec('Legal obligations: where the evidence is', table(['Section', 'Where it’s kept', 'Last seen'], d.obligations, ''))}
        ${sec('Procedures', table(['Service', 'Version', 'Status', 'Last reviewed'], d.procedures, 'No services set up.'))}
      </div>` });
  },
  acts: { print: () => window.print() },
});
