// Inspector-ready History (Gemini F-02): one readable row per record, plain words, no internal codes.
import { reviewById } from './rules.js';
import { answerIsIssue } from './issues.js';
import { fmt, day, today } from './dates.js';
// opts.events (the CSV): every entry of each action's own log as a row too (raised, updated, asked, reopened, closed),
// so a closed-then-reopened action shows each step, not just where it ended.
export function historyRows(ph, { events = false } = {}) {
  const rows = [];
  for (const r of ph.records) {
    const name = r.extra ? 'Extra site visit' : r.title || reviewById(r.type)?.name || r.type;
    const issues = r.answers.filter(a => answerIsIssue(r, a));
    rows.push({ date: r.date, type: r.kind === 'visit' ? 'Site visit' : r.kind === 'meeting' ? 'Meeting' : r.kind === 'staff' ? 'Staff check' : r.kind === 'departure' ? 'Staff leaving' : 'Review',
      title: name, by: r.by || '', status: 'Recorded', due: '', done: r.date, detail: [Object.entries(r.fields?.serviceEvidence || {}).map(([s, e]) => s + ' evidence: ' + e.status + (e.ref ? ' (' + e.ref + ')' : '')).join('; '), issues.length ? issues.length + ' issue' + (issues.length === 1 ? '' : 's') + ': ' + issues.map(a => a.text + (a.note ? ' (' + a.note + ')' : '')).join('; ') : 'No issues', r.notes].filter(Boolean).join(' · '), id: r.id });
  }
  for (const a of Object.values(ph.actions)) {
    rows.push({ date: a.closed?.date || a.created, type: 'Action', title: a.title, by: a.closed?.by || (a.log || []).find(e => e.by)?.by || '', status: a.status === 'closed' ? 'Closed' : a.waiting ? 'Open · waiting' : 'Open', due: a.due || '', done: a.closed?.date || '',
      detail: [a.source?.label ? 'From ' + a.source.label.replace(/ · \d{4}-\d{2}-\d{2}$/, '') : '', a.closed?.what ? 'What was seen: ' + a.closed.what : '', a.waiting ? 'Asked for: ' + a.waiting.asked : ''].filter(Boolean).join(' · '), id: a.id });
  }
  if (events) for (const a of Object.values(ph.actions)) for (const e of a.log || []) rows.push({ date: day(e.at), type: 'Action event', title: a.title, by: e.by || '', status: { raised: 'Raised', closed: 'Closed', reopened: 'Reopened', asked: 'Waiting', updated: 'Updated' }[e.kind] || e.kind || '', due: '', done: e.kind === 'closed' ? closedOn(a, e) : '', detail: e.text || '', id: a.id });
  for (const l of ph.log || []) rows.push({ date: l.date, type: 'My log', title: l.what, by: l.by || '', status: '', due: '', done: '', detail: [l.kind, l.ref].filter(Boolean).join(' · '), id: '' });
  // M-07: every History event is in the export (procedures, services, evidence locations, DAA, calendar, staff, setup),
  // except the four already listed above from their own records: recorded reviews, raised and closed actions, My log.
  for (const x of (ph.history || []).filter(h => h && typeof h.what === 'string' && !DUP.test(h.what))) rows.push({ date: day(x.at), type: 'Change', title: x.what, by: x.by || '', status: '', due: '', done: '', detail: category(x.what), id: '' });
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
// Stage 3G-B: a close event's completion date is the date the owner gave when closing (as History shows), not the day
// it was typed in. Entries saved before 3G-B have no date: the action's own closed date is used for its latest close.
const closedOn = (a, e) => e.date || (a.status === 'closed' && e === (a.log || []).filter(x => x.kind === 'closed').at(-1) ? a.closed?.date : '') || day(e.at);
const DUP = /^(Recorded · |Action raised · |Action closed · |My log · )/;
// Second words in each group are the earlier R.Pharmacy app's wording, so restored history is labelled too.
const CATS = [[/^(Procedure|Updated OTP procedure|Local amendment|Saved unapproved procedure)/, 'Procedure'], [/^(Service (added|stopped)|Confirmed services|Saved reported arrangements)/, 'Service'], [/^Evidence/, 'Evidence'], [/^DAA/, 'DAA packing'],
  [/^(Due date|Review due dates|How often|Quarter|Due dates aligned|Reminder changed)/, 'Calendar'], [/^(Added staff|Updated staff|Restored to active staff|Saved staff profile|Recorded staff verification)/, 'Staff'],
  [/^(Pharmacy|Setup|Marked as|Onboarding|Saved pharmacy|Saved proprietors)/, 'Setup'], [/^(Action|Waiting on|Saved task)/, 'Action'], [/^Completed /, 'Review'], [/^Document reference/, 'Document'], [/^Law update/, 'Law update'], [/^Meeting/, 'Meeting']];
const category = what => (CATS.find(([re]) => re.test(what)) || [, 'Other'])[1];
// M-07: a cell that a spreadsheet would read as a formula (=, +, -, @, even after leading spaces, or a leading tab or
// return) starts with an apostrophe, so it shows as text.
const cell = v => { let t = String(v ?? ''); if (/^\s*[=+\-@]/.test(t) || /^[\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
export function csv(ph, rows) {
  const head = ['Pharmacy', 'Date', 'Type', 'What', 'Recorded or closed by', 'Status', 'Due', 'Completed', 'Details'];
  // M-07: UTF-8 byte order mark first, so Excel shows ’, · and – properly.
  return '\uFEFF' + [head, ...rows.map(r => [ph.name, r.date, r.type, r.title, r.by, r.status, r.due, r.done, r.detail])].map(r => r.map(cell).join(',')).join('\r\n');
}
export function printable(ph, rows) {
  return ph.name + ' · history · printed ' + fmt(today()) + '\n\n' + rows.map(r => [fmt(r.date), r.type, r.title, r.status, r.by && 'by ' + r.by, r.detail].filter(Boolean).join(' · ')).join('\n');
}
