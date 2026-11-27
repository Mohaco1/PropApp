// Calendar feed (owner decision: reminders yes). An .ics file of due dates the owner adds to their phone calendar.
// Inside a pharmacy only: no patient data. Each event says what's due; nothing is marked done.
import { items } from './summary.js';
import { isDate, addDays, today } from './dates.js';
import { C } from './content.js';
import { activeServices } from './rules.js';
const esc = s => String(s).replace(/\r\n?/g, '\n').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
// R10: RFC 5545 lines are folded at 75 octets (UTF-8 bytes, never splitting a character), continuing with CRLF + space.
function fold(line) { const enc = new TextEncoder(); if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = '', n = 0, max = 75;
  for (const ch of line) { const b = enc.encode(ch).length; if (n + b > max) { out.push(cur); cur = ''; n = 0; max = 74; } cur += ch; n += b; }
  out.push(cur); return out.join('\r\n '); }
export function ics(ph, drafts) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PharmLedger//Due dates//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + esc(ph.name + ' · due dates')];
  for (const it of items(ph, drafts)) {
    // One event per part, each with its own UID (a person can have several items due the same day).
    // H-08: a part's UID comes from its id (an action id, requirement id or "annual"), never its position, so it stays
    // the same when other checks come and go. A staff action is an action: its words and the person's name stay out.
    const dates = it.kind === 'person' ? it.parts.filter(x => isDate(x.date)).map((x, i) => [x.date, it.title + ' · ' + x.title, '-' + (x.id || i), x.type === 'action']) : isDate(it.date) ? [[it.date, it.title, '', it.kind === 'action']] : [];
    for (const [d, rawTitle, part, isAction] of dates) {
      // R04: an action's own words can contain anything, so the calendar only says an action is due.
      const title = isAction ? 'PharmLedger action due · ' + ph.name : rawTitle;
      const day = d.replace(/-/g, ''), next = addDays(d, 1).replace(/-/g, '');
      L.push('BEGIN:VEVENT', 'UID:' + esc(ph.id + '-' + (isAction && it.kind === 'person' ? 'action/' + part.slice(1) : it.key + part) + (isAction ? '' : '-' + d)) + '@propapp', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        'DTSTART;VALUE=DATE:' + day, 'DTEND;VALUE=DATE:' + next, 'SUMMARY:' + esc((it.legal ? '[Required by law] ' : '') + title), 'DESCRIPTION:' + esc('Due at ' + ph.name + '. Open PharmLedger to record it.'),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-P7D', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
    }
  }
  // B2: the NSW authorities the pharmacy's services rely on (prescribing 4 Nov 2027, vaccination 4 Nov 2028), from the
  // law key dates, with a reminder about a month before (calendar alarms can't count months, so 30 days).
  const act = activeServices(ph);
  for (const [d, what, src, svc] of C.law.DATES.filter(x => /authorit/i.test(x[1]) && x[3]?.some(s => act.includes(s)) && x[0] >= today())) {
    const t = what + ' · ' + ph.name;
    L.push('BEGIN:VEVENT', 'UID:' + esc(ph.id + '-authority-' + d) + '@propapp', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;VALUE=DATE:' + d.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(d, 1).replace(/-/g, ''), 'SUMMARY:' + esc('[Required by law] ' + t), 'DESCRIPTION:' + esc('Check the replacement authority is in place (' + src + '). Open PharmLedger for details.'),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(t), 'TRIGGER:-P30D', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(t), 'TRIGGER:-P7D', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(t), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
  }
  // R10: an action keeps one UID (its id), so a new due date moves the existing event; the file ends with CRLF.
  L.push('END:VCALENDAR'); return L.map(fold).join('\r\n') + '\r\n';
}
// Save a file. In the claude.ai viewer downloads are blocked, so the text is also offered to copy.
let dl;
try { window.claude?.use?.('downloads').then(x => { dl = x; }).catch(() => {}); } catch {}
export function saveFile(name, text, type = 'text/plain') {
  if (dl) { dl.save({ filename: name, data: new Blob([text], { type }) }).catch(() => {}); return true; }
  // V3-02: a calendar file goes to the phone's share sheet where it can (iPhone: tap Calendar to add the events).
  if (/calendar|json/.test(type) && navigator.canShare) { try { const f = new File([text], name, { type: /json/.test(type) ? 'application/json' : 'text/calendar;charset=utf-8' }); if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(() => {}); return true; } } catch {} }
  try { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); return true; } catch { return false; }
}
