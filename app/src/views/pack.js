// Evidence pack (V3-03; owner un-deferred the inspector pack, 25 Nov 2026): one printable, de-identified summary of the
// proprietor's oversight for the last 12 months. What's on screen is what prints (A4, via the browser's print or
// "Save as PDF"). Nothing is marked done or changed; it only reads what the owner recorded. No patient information.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, logo } from '../ui.js';
import { C } from '../content.js';
import { fmt, fullDate, today, addMonths, isDate, daysBetween, day } from '../dates.js';
import { reviewById, activeServices, serviceName, stockIncomplete } from '../rules.js';
import { UPDATES } from '../content/updates.js';
import { items, counts } from '../summary.js';
import { requirements, credentialState } from '../model.js';
import { issueCount } from '../issues.js';
import { ARCHIVES, locationRows } from './law.js';
import { isPWA } from '../pwa.js';
const L = C.law;
// Bug 3: one reading of a record's next due date (reviews keep it in fields.next, visits on the record itself).
const nextOf = r => { const n = r.fields?.next || r.next || ''; return isDate(n) ? full(n) : ''; };
const s8Count = rows => { const done = rows.filter(r => r[1] !== 'Incomplete review').length, inc = rows.length - done;
  return [done === 1 ? '1 completed stocktake' : done + ' completed stocktakes', inc ? (inc === 1 ? '1 incomplete review' : inc + ' incomplete reviews') : ''].filter(Boolean).join(' · '); };
const closedBy = a => a.closed?.by || [...(a.log || [])].reverse().find(e => e.kind === 'closed' && e.by)?.by || '';
// F-V3-04: the pack's own dates always carry the year.
const full = fullDate;
const table = (head, rows, empty) => rows.length ? h`<div class="pscroll"><table class="ptable"><thead><tr>${head.map(x => h`<th>${x}</th>`)}</tr></thead><tbody>${rows.map(r => h`<tr>${r.map(x => h`<td>${x}</td>`)}</tr>`)}</tbody></table></div>` : h`<p class="meta">${empty}</p>`;
export function packData(ph, drafts, from = addMonths(today(), -12)) {
  const recs = ph.records.filter(r => r.date >= from).sort((a, b) => b.date.localeCompare(a.date));
  const acts = Object.values(ph.actions);
  const n = counts(items(ph, drafts));
  return {
    from, n,
    // B1: an S8 review that wasn't a completed stocktake says so here too.
    reviews: recs.filter(r => r.kind !== 'staff' && r.kind !== 'departure').map(r => [full(r.date), (r.extra ? 'Extra site visit' : r.title || reviewById(r.type)?.name || r.type) + (r.type === 'B1' && stockIncomplete(r) ? ' (incomplete)' : ''), r.by || '', String(issueCount(r)), nextOf(r)]),
    // Bug 3: completed and incomplete S8 entries are both shown, each labelled, and counted separately.
    s8: ph.records.filter(r => r.type === 'B1' && r.date >= from).sort((a, b) => b.date.localeCompare(a.date)).map(r => [full(r.date), stockIncomplete(r) ? 'Incomplete review' : issueCount(r) > 0 ? 'Completed with issues' : 'Completed stocktake', isDate(r.fields?.stockDate) ? full(r.fields.stockDate) : '—', r.fields?.stockBy || r.fields?.stockPharmacist || '—', nextOf(r)]),
    open: acts.filter(a => a.status !== 'closed').sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).map(a => [a.title, full(a.created), a.due ? full(a.due) : '', a.waiting ? 'Waiting · ' + a.waiting.asked : (a.due && a.due < today() ? 'Overdue' : 'Open')]),
    // F-V3-02: who closed it (from the close itself, or the log of an older record). F-V3-03: routine staff-check
    // actions are one line per person, so the real fixes stand out.
    closed: acts.filter(a => a.status === 'closed' && (a.closed?.date || '') >= from && a.source?.type !== 'staff').sort((a, b) => b.closed.date.localeCompare(a.closed.date)).map(a => [a.title, full(a.closed.date), a.closed.what || '', closedBy(a)]),
    staffClosed: Object.values(acts.filter(a => a.status === 'closed' && (a.closed?.date || '') >= from && a.source?.type === 'staff').reduce((g, a) => { const who = a.person || ph.staff.find(p => p.id === a.source.staffId)?.name || 'Staff'; (g[who] ??= { who, n: 0, last: '' }); g[who].n++; if (a.closed.date > g[who].last) g[who].last = a.closed.date; return g; }, {}))
      .sort((x, y) => x.who.localeCompare(y.who)).map(x => [x.who, 'Staff checks: ' + x.n + (x.n === 1 ? ' item' : ' items') + ' verified and closed', full(x.last)]),
    updatesRead: Object.keys(ph.flags?.updatesRead || {}).length,
    staff: ph.staff.filter(p => p.active !== false).map(p => { const st = requirements(p).map(q => ({ q, s: credentialState(p, q.id) }));
      const exp = st.filter(x => x.s.expiry).sort((a, b) => a.s.expiry.localeCompare(b.s.expiry))[0];
      const attention = st.filter(x => x.s.state === 'expired' || x.s.state === 'issue' || x.s.state === 'none' || (x.s.expiry && daysBetween(today(), x.s.expiry) <= 30)).length;
      return [p.name, p.role || '', isDate(p.annualDue) ? full(p.annualDue) : '', exp ? exp.q.label + ' · ' + full(exp.s.expiry) : '', attention ? attention + ' to look at' : 'Current']; }),
    // B1: only obligations with a recorded location are listed; the rest are one footer line.
    obligations: L.OBL.filter(o => (!o[5].length || o[5].some(s => activeServices(ph).includes(s))) && ph.obligations?.[o[0]]?.where).map(o => [o[1] + ' · ' + o[2], ph.obligations[o[0]].where, isDate(ph.obligations[o[0]].date) ? full(ph.obligations[o[0]].date) : '']),
    // H-05: where each active service keeps its records (the same rows as More → Evidence locations).
    svcLocations: locationRows(ph).filter(r => r.k.startsWith('svc:') && r.where).map(r => [r.group + ' · ' + r.title, r.where, '']),
    svcUnrecorded: locationRows(ph).filter(r => r.k.startsWith('svc:') && !r.where).length,
    archives: ARCHIVES.filter(([id]) => ph.archives?.[id]?.where).map(([id, g, t]) => [t, ph.archives[id].where, '']),
    unrecorded: L.OBL.filter(o => (!o[5].length || o[5].some(s => activeServices(ph).includes(s))) && !ph.obligations?.[o[0]]?.where).length,
    // Stage 3A: the version in use (adopted, when and by whom) is kept apart from a newer draft still waiting to be adopted.
    procedures: activeServices(ph).map(id => { const p = ph.procedures.find(x => x.service === id), v = p?.versions?.at(-1), adopted = p?.versions?.filter(x => x.status === 'Adopted').at(-1);
      const pending = v && v.status !== 'Adopted' ? v : null;
      return [serviceName(id), adopted ? adopted.v : v ? 'None adopted' : 'Not drafted', adopted ? ['Adopted ' + full(day(adopted.adoptedAt || adopted.at)), adopted.adoptedBy && 'by ' + adopted.adoptedBy].filter(Boolean).join(' ') : '', pending ? 'Draft ' + pending.v + ' · ' + full(day(pending.at)) : '', p?.reviews?.length ? full(String(p.reviews.at(-1).date).slice(0, 10)) : '']; }),
    amendments: activeServices(ph).map(id => [id, ph.procedures.find(x => x.service === id)]).filter(([, p]) => p?.amendment?.trim()).map(([id, p]) => [serviceName(id), p.amendment.trim()]),
    // Stage 3A: the owner's own log and where other documents are kept (references only, never the document).
    log: (ph.log || []).filter(x => isDate(x.date) && x.date >= from).sort((a, b) => b.date.localeCompare(a.date)).map(x => [full(x.date), x.what || '', x.kind || '', x.ref || '', x.by || '']),
    documents: (ph.documents || []).map(x => [x.title || '', [x.ref, x.url].filter(Boolean).join(' · '), x.version || '', isDate(x.reviewDate) ? full(x.reviewDate) : '', x.owner || '']),
  };
}
// E1: the period to print; B1: which sections to include (on by default only where there's something recorded).
const RANGES = [['12', 'Last 12 months'], ['24', 'Last 24 months'], ['all', 'All']];
const SECS = [['rev', 'Reviews, visits and meetings'], ['s8', 'S8 stock checks'], ['act', 'Actions'], ['staff', 'Staff'], ['obl', 'Evidence locations'], ['proc', 'Procedures'], ['log', 'My log'], ['docs', 'Other documents']];
const has = d => ({ rev: d.reviews.length > 0, s8: d.s8.length > 0, act: d.open.length + d.closed.length + d.staffClosed.length > 0, staff: d.staff.length > 0, obl: d.obligations.length + d.svcLocations.length + d.archives.length > 0, proc: d.procedures.length > 0, log: d.log.length > 0, docs: d.documents.length > 0 });
// PharmLedger brief: "Show on screen (read-only)". The same pack, with the period and sections already chosen, on its own
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
      ${isPWA() ? '' : h`<p class="hint no-print">Printing isn’t available inside the claude.ai preview: open the app file in your phone’s browser.</p>`}`;
    return screen({ title: inspect ? 'Inspector view' : 'Evidence pack', back: true, body: h`${controls}
      <div class="pack print-only${inspect ? ' inspect' : ''}">
        <header class="phead"><h1><span class="plogo">${logo(28)}</span> ${ph.name} · evidence pack</h1>
          <p>${[ph.address, ph.identifier && 'Pharmacy ' + ph.identifier].filter(Boolean).join(' · ')}</p>
          <p>Proprietor${ph.proprietors.length === 1 ? '' : 's'}: ${ph.proprietors.map(p => p.name).join(', ') || '—'}</p>
          <p>${first ? 'From ' + full(first) + ' to ' + full(today()) : 'No records yet'} (${period}) · made ${full(today())}</p>
          <p>Proprietor oversight record only: statutory S8 registers, dispensing records and cold-chain logs stay in their primary pharmacy systems.</p>
          <p>Made with PharmLedger · for the owner’s side of the counter. Designed for de-identified proprietor records: check your notes before sharing.</p>
          <p>Today: ${d.n.overdue === 1 ? '1 item overdue' : d.n.overdue + ' items overdue'} · ${d.n.all - d.n.tocheck === 1 ? '1 item' : (d.n.all - d.n.tocheck) + ' items'} in the plan · law and practice updates read: ${d.updatesRead} of ${UPDATES.length}</p></header>
        ${sec('rev', 'Reviews, visits and meetings · ' + d.reviews.length, table(['Date', 'What', 'Recorded by', 'Issues', 'Next due'], d.reviews, 'None recorded in this period.'))}
        ${sec('s8', 'S8 stock checks · ' + s8Count(d.s8), table(['Reviewed', 'Outcome', 'Stock check', 'Pharmacist', 'Next due'], d.s8, 'None recorded in this period.'))}
        ${sec('act', 'Open actions · ' + d.open.length, table(['Action', 'Raised', 'Due', 'Status'], d.open, 'No open actions.'))}
        ${sec('act', 'Actions closed · ' + d.closed.length, d.closed.some(r => r[3]) ? table(['Action', 'Closed', 'What was seen', 'By'], d.closed, 'None closed in this period.') : table(['Action', 'Closed', 'What was seen'], d.closed.map(r => r.slice(0, 3)), 'None closed in this period.'))}
        ${d.staffClosed.length ? sec('act', 'Staff checks closed', table(['Person', 'What', 'Latest'], d.staffClosed, '')) : ''}
        ${sec('staff', 'Staff · ' + d.staff.length, table(['Name', 'Role', 'Annual check due', 'Next expiry', 'Checks'], d.staff, 'No staff recorded.'))}
        ${sec('obl', 'Legal obligations: where the evidence is', h`${table(['Section', 'Where it’s kept', 'Last seen'], [...d.obligations, ...d.svcLocations, ...d.archives], 'No evidence locations recorded yet.')}${d.unrecorded + d.svcUnrecorded ? h`<p class="meta pfoot">${[d.unrecorded && (d.unrecorded === 1 ? '1 other obligation' : d.unrecorded + ' other obligations'), d.svcUnrecorded && (d.svcUnrecorded === 1 ? '1 service record' : d.svcUnrecorded + ' service records')].filter(Boolean).join(' and ')} not yet recorded in Evidence locations.</p>` : ''}`)}
        ${sec('proc', 'Procedures', h`${table(['Service', 'Version in use', 'Adopted', 'Pending draft', 'Last reviewed'], d.procedures, 'No services set up.')}${d.amendments.length ? h`<h3 class="psub">Local amendments</h3>${table(['Service', 'How this pharmacy does it differently'], d.amendments, '')}` : ''}`)}
        ${sec('log', 'My log · ' + d.log.length, table(['Date', 'What', 'Kind', 'Reference', 'By'], d.log, 'Nothing logged in this period.'))}
        ${sec('docs', 'Other documents · ' + d.documents.length, table(['Document', 'Where it’s kept', 'Version', 'Review date', 'Kept by'], d.documents, 'No other documents recorded.'))}
      </div>` });
  }
}
