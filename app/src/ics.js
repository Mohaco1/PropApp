// Calendar feed (owner decision: reminders yes). An .ics file of due dates the owner adds to their phone calendar.
// Inside a pharmacy only: no patient data. Each event says what's due; nothing is marked done.
import { items } from './summary.js';
import { isDate, addDays } from './dates.js';
const esc = s => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
export function ics(ph, drafts) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PropApp//Due dates//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + esc(ph.name + ' · due dates')];
  for (const it of items(ph, drafts)) {
    const dates = it.kind === 'person' ? it.parts.filter(x => isDate(x.date)).map(x => [x.date, it.title + ' · ' + x.title]) : isDate(it.date) ? [[it.date, it.title]] : [];
    for (const [d, title] of dates) {
      const day = d.replace(/-/g, ''), next = addDays(d, 1).replace(/-/g, '');
      L.push('BEGIN:VEVENT', 'UID:' + esc(ph.id + '-' + it.key + '-' + d) + '@propapp', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        'DTSTART;VALUE=DATE:' + day, 'DTEND;VALUE=DATE:' + next, 'SUMMARY:' + esc((it.legal ? '[Required by law] ' : '') + title), 'DESCRIPTION:' + esc('Due at ' + ph.name + '. Open PropApp to record it.'),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
    }
  }
  L.push('END:VCALENDAR'); return L.join('\r\n');
}
// Save a file. In the claude.ai viewer downloads are blocked, so the text is also offered to copy.
export function saveFile(name, text, type = 'text/plain') {
  try { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); return true; } catch { return false; }
}
