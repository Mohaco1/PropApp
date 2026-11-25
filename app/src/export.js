// Inspector-ready History (Gemini F-02): one readable row per record, plain words, no internal codes.
import { reviewById } from './rules.js';
import { answerIsIssue } from './issues.js';
import { fmt } from './dates.js';
export function historyRows(ph) {
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
  for (const l of ph.log || []) rows.push({ date: l.date, type: 'My log', title: l.what, by: l.by || '', status: '', due: '', done: '', detail: [l.kind, l.ref].filter(Boolean).join(' · '), id: '' });
  for (const x of ph.history.filter(h => /^(Due date|Pharmacy set up|Added staff|Updated staff|Setup)/.test(h.what))) rows.push({ date: String(x.at).slice(0, 10), type: 'Change', title: x.what, by: x.by || '', status: '', due: '', done: '', detail: '', id: '' });
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
const cell = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
export function csv(ph, rows) {
  const head = ['Pharmacy', 'Date', 'Type', 'What', 'Recorded or closed by', 'Status', 'Due', 'Completed', 'Details'];
  return [head, ...rows.map(r => [ph.name, r.date, r.type, r.title, r.by, r.status, r.due, r.done, r.detail])].map(r => r.map(cell).join(',')).join('\r\n');
}
export function printable(ph, rows) {
  return ph.name + ' · history · printed ' + fmt(new Date().toISOString().slice(0, 10)) + '\n\n' + rows.map(r => [fmt(r.date), r.type, r.title, r.status, r.by && 'by ' + r.by, r.detail].filter(Boolean).join(' · ')).join('\n');
}
