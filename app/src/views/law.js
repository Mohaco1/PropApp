// Rules (mode 1 and 4): S8 at a glance, legal obligations (where the evidence is and when you last saw it),
// NSW Health dates and contacts, My log, and buying, selling or closing. Wording comes from content/law.json.
import { register } from '../app.js';
import { h, uid } from '../util.js';
import { screen, btn, row, field, textInput, textArea, select, note, why, empty, section } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, dueText, isDate } from '../dates.js';
import { s8Limit, latestStockCheck, activeServices } from '../rules.js';
import { reviewDue } from '../summary.js';
import { note as log, me } from '../model.js';
const L = C.law;
const applies = (ph, o) => !o[5].length || o[5].some(s => activeServices(ph).includes(s));
register('s8', {
  tab: 'more',
  render(c) {
    const last = latestStockCheck(c.ph), lim = s8Limit(c.ph), due = reviewDue(c.ph, 'B1');
    const s8acts = Object.values(c.ph.actions).filter(a => a.status === 'open' && /\bS8\b|Schedule 8|drug register|\bsafe\b/i.test(a.title));
    const rows = L.OBL.filter(o => /S8|drug register|safe|s 1(0[89]|1[0-9]|2[0-2])/i.test(o[1] + ' ' + o[2]) && applies(c.ph, o));
    return screen({ title: 'S8 at a glance', back: true, body: h`
      <div class="card"><p class="eyebrow"><span class="law">Required by law</span> Inventory every 3 months (s 111)</p>
        <p>${last ? 'Last stock check ' + fmt(last) : 'No stock check recorded yet'} · ${due ? dueText(due) + ' (' + fmt(due) + ')' : 'no date set'}</p>
        ${lim ? h`<p class="muted">The law’s latest date is ${fmt(lim)}: 3 months after the last stock check.</p>` : ''}${btn('S8 stock check', 'go', { kind: 'primary', data: { to: 'review', id: 'B1' } })}</div>
      ${s8acts.length ? section('Open S8 actions · ' + s8acts.length, h`<div class="list">${s8acts.map(a => row({ title: a.title, right: dueText(a.due), act: 'go', data: { to: 'action', id: a.id } }))}</div>`) : ''}
      ${section('The rules, and where your records are', h`<div class="list">${rows.map(o => obRow(c.ph, o))}</div>`)}
      ${why('Safe and storage standard', (L.ADD.B1 || []).join('\n\n'))}` });
  },
});
function obRow(ph, o) { const ev = ph.obligations?.[o[0]] || {};
  return row({ title: o[2], sub: o[1] + (ev.where ? ' · kept: ' + ev.where : ''), right: ev.date ? 'Seen ' + fmt(ev.date) : 'Not seen yet', tone: ev.date ? '' : 'warn', act: 'go', data: { to: 'obligation', id: o[0] } }); }
register('obligations', {
  tab: 'more',
  render(c) { const rows = L.OBL.filter(o => applies(c.ph, o)), seen = rows.filter(o => c.ph.obligations?.[o[0]]?.date).length;
    return screen({ title: 'Legal obligations', back: true, body: h`<p class="muted">One line for each section of the ${L.REG} that applies here. You record where the evidence is kept and when you last saw it. ${seen} of ${rows.length} seen.</p>
      <div class="list">${rows.map(o => obRow(c.ph, o))}</div>` }); },
});
register('obligation', {
  tab: 'more',
  render(c, r) { const o = L.OBL.find(x => x[0] === r.id), ev = c.ph.obligations?.[r.id] || {};
    return screen({ title: o[2], back: true, body: h`<p class="muted">${L.REG}, ${o[1]}</p><div class="card"><p>${o[3]}</p></div>${why('What the section says about who', o[4])}
      <form class="form" data-form="save">${field('Where is the evidence kept?', textInput('where', ev.where || '', { placeholder: 'e.g. drug register, dispensary safe shelf' }))}${field('When did you last see it?', textInput('date', ev.date || '', { type: 'date', max: today() }))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form><p class="hint">Read the section itself before relying on this summary.</p>` }); },
  forms: { save: (c, f, el, r) => { c.change(ph => { (ph.obligations ??= {})[r.id] = { where: f.where.trim(), date: f.date, by: me(ph).name, at: new Date().toISOString() }; log(ph, 'Evidence recorded · ' + r.id); }, 'Saved'); c.back(); } },
});
register('contacts', {
  tab: 'more',
  render(c) { const act = activeServices(c.ph), dates = L.DATES.filter(d => !d[3]?.length || d[3].some(s => act.includes(s))).sort((a, b) => a[0].localeCompare(b[0]));
    return screen({ title: 'NSW Health dates and contacts', back: true, body: h`
      ${section('Dates that affect you', h`<div class="list">${dates.map(d => row({ title: d[1], sub: d[2], right: fmt(d[0]), tone: d[0] < today() ? '' : '', chev: false }))}</div>`)}
      ${section('Contacts', h`<div class="list">${L.CONTACTS.map(x => h`<div class="row static"><span class="row-main"><span class="row-title">${x[0]}</span><span class="row-sub sel">${x[1]}</span></span></div>`)}</div>`)}
      <p class="hint">Contact details are shown as text: copy them into your phone or email.</p>` }); },
});
register('mylog', {
  tab: 'more',
  render(c) { return screen({ title: 'My log', back: true, body: h`<p class="muted">What you reported or sent, and to whom. For your memory only. No patient details.</p>
    <form class="form" data-form="add">${field('What happened', textInput('what', '', { required: true }))}${field('Who you told', select('kind', L.KINDS.map(k => [k, k])))}${field('Reference (optional)', textInput('ref', ''))}${field('Date', textInput('date', today(), { type: 'date', max: today() }))}
    <div class="dock-inline">${btn('Add to log', null, { kind: 'primary', type: 'submit' })}</div></form>
    <div class="list">${c.ph.log.length ? [...c.ph.log].sort((a, b) => b.date.localeCompare(a.date)).map(x => row({ title: x.what, sub: [x.kind, x.ref].filter(Boolean).join(' · '), right: fmt(x.date), chev: false })) : empty('Nothing logged yet.')}</div>` }); },
  forms: { add: (c, f, el) => { c.change(ph => { ph.log.push({ id: uid(), date: f.date, what: f.what.trim(), kind: f.kind, ref: f.ref.trim(), by: me(ph).name }); log(ph, 'My log · ' + f.what.trim()); }, 'Added'); el.reset(); } },
});
register('changes', {
  tab: 'more',
  render(c) { return screen({ title: 'Bought, selling or closing', back: true, body: h`<p class="muted">What NSW Health requires when a pharmacy changes hands or closes.</p>
    ${L.OWN.map(([t, xs]) => section(t, h`<div class="card"><ul class="plain">${xs.map(x => h`<li>${x}</li>`)}</ul></div>`))}
    ${btn('Changing how DAAs are packed?', 'go', { kind: 'link', data: { to: 'tellmeonce' } })}
    ${c.ph.inherited ? note('Marked as a newly bought pharmacy. Your next site visit asks you to confirm what the previous owner recorded.', 'ok') : btn('I’ve just bought this pharmacy', 'bought')}` }); },
  acts: { bought: c => c.change(ph => { ph.inherited = { since: today() }; log(ph, 'Marked as a newly bought pharmacy'); }, 'Your next visit will ask you to confirm what the previous owner recorded.') },
});
