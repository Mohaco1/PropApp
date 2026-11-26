// Evidence pack (V3-03; owner un-deferred the inspector pack, 25 Nov 2026): one printable, de-identified summary of the
// proprietor's oversight for the last 12 months. What's on screen is what prints (A4, via the browser's print or
// "Save as PDF"). Nothing is marked done or changed; it only reads what the owner recorded. No patient information.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, logo } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, addMonths, isDate, daysBetween, day } from '../dates.js';
import { reviewById, activeServices, serviceName, stockIncomplete } from '../rules.js';
import { UPDATES } from '../content/updates.js';
import { items, counts } from '../summary.js';
import { requirements, credentialState } from '../model.js';
import { issueCount } from '../issues.js';
import { ARCHIVES } from './law.js';
const L = C.law;
// Bug 3: one reading of a record's next due date (reviews keep it in fields.next, visits on the record itself).
const nextOf = r => { const n = r.fields?.next || r.next || ''; return isDate(n) ? fmt(n) : ''; };
const s8Count = rows => { const done = rows.filter(r => r[1] === 'Completed stocktake').length, inc = rows.length - done;
  return [done === 1 ? '1 completed stocktake' : done + ' completed stocktakes', inc ? (inc === 1 ? '1 incomplete review' : inc + ' incomplete reviews') : ''].filter(Boolean).join(' · '); };
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
    // B1: an S8 review that wasn't a completed stocktake says so here too.
    reviews: recs.filter(r => r.kind !== 'staff' && r.kind !== 'departure').map(r => [fmt(r.date), (r.extra ? 'Extra site visit' : r.title || reviewById(r.type)?.name || r.type) + (r.type === 'B1' && stockIncomplete(r) ? ' (incomplete)' : ''), r.by || '', String(issueCount(r)), nextOf(r)]),
    // Bug 3: completed and incomplete S8 entries are both shown, each labelled, and counted separately.
    s8: ph.records.filter(r => r.type === 'B1' && r.date >= from).sort((a, b) => b.date.localeCompare(a.date)).map(r => [fmt(r.date), stockIncomplete(r) ? 'Incomplete review' : 'Completed stocktake', isDate(r.fields?.stockDate) ? fmt(r.fields.stockDate) : '—', r.fields?.stockBy || r.fields?.stockPharmacist || '—', nextOf(r)]),
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
    // B1: only obligations with a recorded location are listed; the rest are one footer line.
    obligations: L.OBL.filter(o => (!o[5].length || o[5].some(s => activeServices(ph).includes(s))) && ph.obligations?.[o[0]]?.where).map(o => [o[1] + ' · ' + o[2], ph.obligations[o[0]].where, isDate(ph.obligations[o[0]].date) ? fmt(ph.obligations[o[0]].date) : '']),
    archives: ARCHIVES.filter(([id]) => ph.archives?.[id]?.where).map(([id, g, t]) => [t, ph.archives[id].where, '']),
    unrecorded: L.OBL.filter(o => (!o[5].length || o[5].some(s => activeServices(ph).includes(s))) && !ph.obligations?.[o[0]]?.where).length,
    procedures: activeServices(ph).map(id => { const p = ph.procedures.find(x => x.service === id), v = p?.versions?.at(-1), adopted = p?.versions?.filter(x => x.status === 'Adopted').at(-1);
      return [serviceName(id), v ? v.v : 'Not drafted', adopted ? 'Adopted ' + fmt(day(adopted.adoptedAt || adopted.at)) : (v ? 'Draft' : ''), p?.reviews?.length ? fmt(String(p.reviews.at(-1).date).slice(0, 10)) : '']; }),
  };
}
// E1: the period to print; B1: which sections to include (on by default only where there's something recorded).
const RANGES = [['12', 'Last 12 months'], ['24', 'Last 24 months'], ['all', 'All']];
const SECS = [['rev', 'Reviews, visits and meetings'], ['s8', 'S8 stock checks'], ['act', 'Actions'], ['staff', 'Staff'], ['obl', 'Evidence locations'], ['proc', 'Procedures']];
const has = d => ({ rev: d.reviews.length > 0, s8: d.s8.length > 0, act: d.open.length + d.closed.length + d.staffClosed.length > 0, staff: d.staff.length > 0, obl: d.obligations.length + d.archives.length > 0, proc: d.procedures.length > 0 });
// Sigil brief: "Show on screen (read-only)". The same pack, with the period and sections already chosen, on its own
// screen with no edit controls or tab bar, to hand the phone to an inspector.
register('inspect', { tab: 'more', noNav: true, render: c => packScreen(c, true) });
register('pack', {
  tab: 'more',
  render: c => packScreen(c, false),
  changes: { sec: (c, el) => { c.ui.pack.on[el.dataset.k] = el.checked; c.rerender(); } },
  acts: { print: () => window.print(), inspect: c => c.go('inspect'), range: (c, d) => { c.ui.pack.range = d.r; c.rerender(); } },
});
function packScreen(c, inspect) {
  {
    const ph = c.ph, ui = c.ui.pack ||= { range: '12', on: {} }, range = ui.range;
    const d = packData(ph, c.drafts, range === 'all' ? '0000-00-00' : addMonths(today(), -Number(range)));
    const hasData = has(d), on = k => ui.on[k] ?? hasData[k];
    const sec = (k, title, inner) => on(k) ? h`<section class="psec"><h2>${title}</h2>${inner}</section>` : '';
    const period = range === 'all' ? 'all records' : 'the last ' + range + ' months';
    const first = range === 'all' ? ph.records.map(r => r.date).filter(isDate).sort()[0] : d.from;
    const controls = inspect ? h`<p class="note ok no-print">Read-only view of what you’ve recorded (${period}). Nothing can be changed from here.</p>` : h`<p class="muted no-print">What you’ve recorded, for an inspector or your own records. Check your notes for patient details before sharing it.</p>
      <div class="chips no-print" role="group" aria-label="Period">${RANGES.map(([k, l]) => h`<button class="chip ${k === range ? 'on' : ''}" data-act="range" data-r="${k}">${l}</button>`)}</div>
      <fieldset class="field no-print"><legend class="field-label">Include</legend><div class="ticks pticks">${SECS.map(([k, l]) => h`<label class="tick"><input type="checkbox" data-change="sec" data-k="${k}" ${on(k) ? h`checked` : ''}><span>${l}${hasData[k] ? '' : h` <span class="meta">· nothing yet</span>`}</span></label>`)}</div></fieldset>
      <div class="dock-inline no-print">${btn('Print or save as PDF', 'print', { kind: 'primary', cls: 'block' })}${btn('Show on screen (read-only)', 'inspect', { kind: 'link' })}</div>
      <p class="hint no-print">Printing isn’t available inside the claude.ai preview: open the app file in your phone’s browser.</p>`;
    return screen({ title: inspect ? 'Inspector view' : 'Evidence pack', back: true, body: h`${controls}
      <div class="pack print-only${inspect ? ' inspect' : ''}">
        <header class="phead"><h1><span class="plogo">${logo(28)}</span> ${ph.name} · evidence pack</h1>
          <p>${[ph.address, ph.identifier && 'Pharmacy ' + ph.identifier].filter(Boolean).join(' · ')}</p>
          <p>Proprietor${ph.proprietors.length === 1 ? '' : 's'}: ${ph.proprietors.map(p => p.name).join(', ') || '—'}</p>
          <p>${first ? 'From ' + full(first) + ' to ' + full(today()) : 'No records yet'} (${period}) · made ${full(today())}</p>
          <p>Proprietor oversight record only: statutory S8 registers, dispensing records and cold-chain logs stay in their primary pharmacy systems.</p>
          <p>Made with Sigil · built for the owner’s side of the counter. Designed for de-identified proprietor records: check your notes before sharing.</p>
          <p>Today: ${d.n.overdue === 1 ? '1 item overdue' : d.n.overdue + ' items overdue'} · ${d.n.all - d.n.tocheck === 1 ? '1 item' : (d.n.all - d.n.tocheck) + ' items'} in the plan · law and practice updates read: ${d.updatesRead} of ${UPDATES.length}</p></header>
        ${sec('rev', 'Reviews, visits and meetings · ' + d.reviews.length, table(['Date', 'What', 'Recorded by', 'Issues', 'Next due'], d.reviews, 'None recorded in this period.'))}
        ${sec('s8', 'S8 stock checks · ' + s8Count(d.s8), table(['Reviewed', 'Outcome', 'Stock check', 'Pharmacist', 'Next due'], d.s8, 'None recorded in this period.'))}
        ${sec('act', 'Open actions · ' + d.open.length, table(['Action', 'Raised', 'Due', 'Status'], d.open, 'No open actions.'))}
        ${sec('act', 'Actions closed · ' + d.closed.length, d.closed.some(r => r[3]) ? table(['Action', 'Closed', 'What was seen', 'By'], d.closed, 'None closed in this period.') : table(['Action', 'Closed', 'What was seen'], d.closed.map(r => r.slice(0, 3)), 'None closed in this period.'))}
        ${d.staffClosed.length ? sec('act', 'Staff checks closed', table(['Person', 'What', 'Latest'], d.staffClosed, '')) : ''}
        ${sec('staff', 'Staff · ' + d.staff.length, table(['Name', 'Role', 'Annual check due', 'Next expiry', 'Checks'], d.staff, 'No staff recorded.'))}
        ${sec('obl', 'Legal obligations: where the evidence is', h`${table(['Section', 'Where it’s kept', 'Last seen'], [...d.obligations, ...d.archives], 'No evidence locations recorded yet.')}${d.unrecorded ? h`<p class="meta pfoot">${d.unrecorded === 1 ? '1 other obligation' : d.unrecorded + ' other obligations'} not yet recorded in Evidence locations.</p>` : ''}`)}
        ${sec('proc', 'Procedures', table(['Service', 'Version', 'Status', 'Last reviewed'], d.procedures, 'No services set up.'))}
      </div>` });
  }
}
