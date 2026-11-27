// Meetings (staff safety, proprietor check-in, governance). Minutes pre-fill the next meeting (owner decision).
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, row, field, textInput, textArea, empty, note } from '../ui.js';
import { reviewById, catalog, suggestedNext } from '../rules.js';
import { reviewDue } from '../summary.js';
import { fmt, today, dueText, addDays, isDate } from '../dates.js';
import { addRecord, newAction } from '../model.js';
const BASE = ['Incidents and patient safety', 'Previous actions and whether they worked', 'Staffing, resources and decisions'];
// Track C: the quarterly governance meeting also looks at complaints and feedback as themes (no names or details).
const sectionsFor = id => id === 'Q4' ? [...BASE, 'Complaints and feedback themes (no names): what keeps coming up, and what changed'] : BASE;
register('meetings', {
  tab: 'more',
  render(c) {
    const ms = catalog().filter(a => a.kind === 'meeting');
    const past = c.ph.records.filter(r => r.kind === 'meeting').sort((a, b) => b.date.localeCompare(a.date));
    return screen({ title: 'Meetings', back: true, body: h`
      <div class="list">${ms.map(a => { const d = reviewDue(c.ph, a.id); return row({ title: a.name, sub: a.frequency, right: d ? dueText(d) : 'No date', tone: d && d < today() ? 'bad' : '', act: 'go', data: { to: 'meeting', id: a.id } }); })}</div>
      <section class="sec"><h2 class="sec-title">Recorded · ${past.length}</h2><div class="list">${past.length ? past.slice(0, 30).map(r => row({ title: reviewById(r.type)?.name || r.title, sub: (r.fields.attendees || []).join(', '), right: fmt(r.date), act: 'go', data: { to: 'meeting-rec', id: r.id } })) : empty('No meetings recorded yet.')}</div></section>` });
  },
});
register('meeting', {
  tab: 'more',
  render(c, r) {
    const a = reviewById(r.id), last = c.ph.records.filter(x => x.type === r.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    const prev = Object.fromEntries((last?.fields?.sections || []).map(s => [s.heading, s.text]));
    const openActs = Object.values(c.ph.actions).filter(x => x.status === 'open' && x.source?.recordId && x.source.recordId === last?.id);
    const staff = c.ph.staff.filter(p => p.active !== false);
    // M-01: what's typed so far is kept as a draft, so opening an open item or reloading loses nothing.
    const dr = c.draft(mkey(r.id)), val = (n, d0) => dr && n in dr ? dr[n] : d0, who = dr ? dr.who || [] : last?.fields?.attendees || [];
    // Bug 5: say "filled in" only when something really was (an attendee still on staff, or some discussion text).
    const filled = !!last && (staff.some(p => (last.fields?.attendees || []).includes(p.name)) || Object.values(prev).some(t => String(t || '').trim()));
    return screen({ title: a.name, back: true, body: h`<p class="muted">${a.frequency}${reviewDue(c.ph, r.id) ? ' · ' + dueText(reviewDue(c.ph, r.id)) : ''}${last ? ' · last ' + fmt(last.date) : ''}</p>
      ${filled ? note('Filled in from your last meeting (' + fmt(last.date) + '). Change anything that’s different.', 'ok') : ''}
      ${openActs.length ? h`<section class="sec"><h2 class="sec-title">Still open from last time</h2><div class="list">${openActs.map(x => row({ title: x.title, right: dueText(x.due), act: 'go', data: { to: 'action', id: x.id } }))}</div></section>` : ''}
      <form class="form" data-form="save" data-input="draft" data-change="draft">${field('Date', textInput('date', val('date', today()), { type: 'date', max: today() }))}
        ${staff.length ? h`<fieldset class="field"><legend class="field-label">Who was there</legend><div class="ticks">${staff.map(p => h`<label class="tick"><input type="checkbox" name="who" value="${p.name}" ${who.includes(p.name) ? h`checked` : ''}><span>${p.name}</span></label>`)}</div></fieldset>` : ''}
        ${field('Others there (optional)', textInput('others', val('others', '')), 'Staff or visitors only. No patient names.')}
        ${sectionsFor(r.id).map((s, i) => field(s, textArea('s' + i, val('s' + i, prev[s] || ''), { rows: 3, noPatient: i === 0 || i === 3 })))}
        ${field('New action from this meeting (optional)', textInput('action', val('action', '')), 'No patient names.')}
        ${field('Next meeting', textInput('next', val('next', suggestedNext(c.ph, r.id, today())), { type: 'date' }))}
        <div class="dock-inline">${btn('Save meeting', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  forms: { save: (c, f, el, r) => { const who = [...el.querySelectorAll('input[name=who]:checked')].map(i => i.value).concat(f.others ? [f.others.trim()] : []);
    c.change(ph => { const rec = addRecord(ph, { type: r.id, kind: 'meeting', title: reviewById(r.id).name, date: f.date, next: f.next, fields: { attendees: who, sections: sectionsFor(r.id).map((s, i) => ({ heading: s, text: f['s' + i] || '' })) }, answers: [] });
      if (f.action?.trim()) rec.actionIds.push(newAction(ph, { title: f.action.trim(), due: addDays(today(), 30), source: { type: 'meeting', recordId: rec.id, label: rec.title + ' · ' + f.date } }).id);
      if (isDate(f.next)) ph.schedule[r.id] = f.next; }, 'Meeting saved'); c.saveDraft(mkey(r.id), null); c.back(); } },
  inputs: { draft: (c, el, r) => saveMeetingDraft(c, el, r) }, changes: { draft: (c, el, r) => saveMeetingDraft(c, el, r) },
});
const mkey = id => 'meeting/' + id;
function saveMeetingDraft(c, el, r) { const form = el.closest('form'); if (!form) return; const f = Object.fromEntries(new FormData(form)); delete f.who;
  const d = { ...f, who: [...form.querySelectorAll('input[name=who]:checked')].map(i => i.value) }, cur = c.draft(mkey(r.id));
  if (cur) { const { rev, ...rest } = cur; if (JSON.stringify(rest) === JSON.stringify(d)) return; } c.saveDraft(mkey(r.id), d); }
register('meeting-rec', {
  tab: 'more',
  render(c, r) { const rec = c.ph.records.find(x => x.id === r.id); if (!rec) return screen({ title: 'Meeting', back: true, body: empty('Not found.') });
    return screen({ title: reviewById(rec.type)?.name || 'Meeting', back: true, body: h`<p class="meta">${fmt(rec.date)} · ${rec.by}</p>${(rec.fields.attendees || []).length ? h`<p>Who was there: ${rec.fields.attendees.join(', ')}</p>` : ''}
      ${(rec.fields.sections || []).filter(s => s.text).map(s => h`<div class="card"><p class="eyebrow">${s.heading}</p><p>${s.text}</p></div>`)}${rec.notes ? h`<div class="card"><p>${rec.notes}</p></div>` : ''}` }); },
});
