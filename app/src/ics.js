// Calendar feed (owner decision: reminders yes). An .ics file of due dates the owner adds to their phone calendar.
// Inside a pharmacy only: no patient data. Each event says what's due; nothing is marked done.
import { items } from './summary.js';
import { isDate, addDays } from './dates.js';
const esc = s => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
export function ics(ph, drafts) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PropApp//Due dates//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + esc(ph.name + ' · due dates')];
  for (const it of items(ph, drafts)) {
    // One event per part, each with its own UID (a person can have several items due the same day).
    const dates = it.kind === 'person' ? it.parts.filter(x => isDate(x.date)).map((x, i) => [x.date, it.title + ' · ' + x.title, '-' + (x.key || i)]) : isDate(it.date) ? [[it.date, it.title, '']] : [];
    for (const [d, rawTitle, part] of dates) {
      // R04: an action's own words can contain anything, so the calendar only says an action is due.
      const title = it.kind === 'action' ? 'PropApp action due · ' + ph.name : rawTitle;
      const day = d.replace(/-/g, ''), next = addDays(d, 1).replace(/-/g, '');
      L.push('BEGIN:VEVENT', 'UID:' + esc(ph.id + '-' + it.key + part + '-' + d) + '@propapp', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        'DTSTART;VALUE=DATE:' + day, 'DTEND;VALUE=DATE:' + next, 'SUMMARY:' + esc((it.legal ? '[Required by law] ' : '') + title), 'DESCRIPTION:' + esc('Due at ' + ph.name + '. Open PropApp to record it.'),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-P7D', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
    }
  }
  L.push('END:VCALENDAR'); return L.join('\r\n');
}
// Save a file. In the claude.ai viewer downloads are blocked, so the text is also offered to copy.
let dl;
try { window.claude?.use?.('downloads').then(x => { dl = x; }).catch(() => {}); } catch {}
export function saveFile(name, text, type = 'text/plain') {
  if (dl) { dl.save({ filename: name, data: new Blob([text], { type }) }).catch(() => {}); return true; }
  // V3-02: a calendar file goes to the phone's share sheet where it can (iPhone: tap Calendar to add the events).
  if (/calendar/.test(type) && navigator.canShare) { try { const f = new File([text], name, { type: 'text/calendar;charset=utf-8' }); if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(() => {}); return true; } } catch {} }
  try { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); return true; } catch { return false; }
}
