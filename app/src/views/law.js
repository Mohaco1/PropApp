// Rules (mode 1 and 4): S8 at a glance, legal obligations (where the evidence is and when you last saw it),
// NSW Health dates and contacts, My log, and buying, selling or closing. Wording comes from content/law.json.
import { register } from '../app.js';
import { h, uid } from '../util.js';
import { screen, btn, row, field, textInput, textArea, select, note, why, empty, section } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, dueText, isDate, day } from '../dates.js';
import { s8Limit, latestStockCheck, activeServices, serviceName, s8Takeover } from '../rules.js';
import { RPH } from '../procgen.js';
import { questionLabel, s8Answers } from './services.js';
import { reviewDue } from '../summary.js';
import { note as log, me } from '../model.js';
const L = C.law;
// Phone numbers and emails as tap-to-call / tap-to-email links (they may do nothing inside some app views, so the text stays too).
function links(t) { const out = [];
  for (const m of String(t).matchAll(/\b(1[38]00[\s\d]{6,9}\d|\(?0\d\)?[\s\d]{8,10}\d|13\s?\d{2}\s?\d{2})\b/g)) out.push(h`<a class="btn secondary" href="tel:${m[1].replace(/[^\d]/g, '')}">Call ${m[1].trim()}</a>`);
  for (const m of String(t).matchAll(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g)) out.push(h`<a class="btn secondary" href="mailto:${m[0]}">Email</a>`);
  return out; }
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
        ${s8Takeover(c.ph) ? note('You’ve taken over this pharmacy: make an S8 inventory in the drug register now (s 111(3)). The previous owner’s 3-month date doesn’t apply.', 'warn') : lim ? h`<p class="muted">The law’s latest date is ${fmt(lim)}: 3 months after the last stock check.</p>` : ''}${btn('S8 stock check', 'go', { kind: 'primary', data: { to: 'review', id: 'B1' } })}</div>
      ${s8acts.length ? section('Open S8 actions · ' + s8acts.length, h`<div class="list">${s8acts.map(a => row({ title: a.title, right: dueText(a.due), act: 'go', data: { to: 'action', id: a.id } }))}</div>`) : ''}
      ${section('The rules, and where your records are', h`<div class="list">${rows.map(o => obRow(c.ph, o))}</div>`)}
      ${s8Setup(c.ph)}
      ${why('Safe and storage standard', (L.ADD.B1 || []).join('\n\n'))}` });
  },
});
// L-02: how this pharmacy set up S8, from its service setup answers (where things are kept, who holds the keys, which
// register). Tapping one opens that question to change it. Nothing here is ticked for the owner.
function s8Setup(ph) { const a = s8Answers(ph); if (!a.length) return '';
  return section('Your S8 setup · ' + a.length, h`<div class="list">${a.map(x => row({ title: x.label, sub: x.service + ' · ' + x.value, act: 'go', data: { to: 'service', id: x.sid } }))}</div>`); }
function obRow(ph, o) { const ev = ph.obligations?.[o[0]] || {};
  const s8 = /S8|drug register|s 1(0[89]|1[0-9]|2[0-2])\b/.test(o[1] + ' ' + o[2]), lastB1 = s8 ? ph.records.filter(r => r.type === 'B1').map(r => r.date).sort().at(-1) : '';
  return row({ title: o[2], sub: o[1] + (ev.where ? ' · kept: ' + ev.where : '') + (lastB1 ? ' · last S8 review ' + fmt(lastB1) : ''), right: ev.date ? 'Seen ' + fmt(ev.date) : 'Not seen yet', tone: ev.date ? '' : 'warn', act: 'go', data: { to: 'obligation', id: o[0] } }); }
register('obligations', {
  tab: 'more',
  render(c) { const rows = L.OBL.filter(o => applies(c.ph, o)), seen = rows.filter(o => c.ph.obligations?.[o[0]]?.date).length;
    return screen({ title: 'Legal obligations', back: true, body: h`<p class="muted">One line for each section of the ${L.REG} that applies here. You record where the evidence is kept and when you last saw it. ${seen} of ${rows.length} seen.</p>
      <div class="list">${rows.map(o => obRow(c.ph, o))}</div>` }); },
});
register('obligation', {
  tab: 'more',
  render(c, r) { const o = L.OBL.find(x => x[0] === r.id), ev = c.ph.obligations?.[r.id] || {};
    return screen({ title: o[2], back: true, body: h`<p class="muted">${L.REG}, ${o[1]}</p><div class="card"><p>${o[3]}</p></div>${String(o[4] || '').trim() ? why('What the section says about who', o[4]) : ''}
      <form class="form" data-form="save">${field('Where is the evidence kept?', textInput('where', ev.where || '', { placeholder: 'e.g. drug register, dispensary safe shelf' }))}${field('When did you last see it?', textInput('date', ev.date || '', { type: 'date', max: today() }))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form><p class="hint">Read the section itself before relying on this summary.</p>` }); },
  forms: { save: (c, f, el, r) => { c.change(ph => { (ph.obligations ??= {})[r.id] = { where: f.where.trim(), date: f.date, by: me(ph).name, at: new Date().toISOString() }; log(ph, 'Evidence recorded · ' + r.id); }, 'Saved'); c.back(); } },
});
register('contacts', {
  tab: 'more',
  render(c) { const act = activeServices(c.ph), dates = L.DATES.filter(d => !d[3]?.length || d[3].some(s => act.includes(s))).sort((a, b) => a[0].localeCompare(b[0]));
    return screen({ title: 'NSW Health dates and contacts', back: true, body: h`
      ${section('Dates that affect you', h`<div class="list">${dates.map(d => row({ title: d[1], sub: d[2], right: fmt(d[0]), tone: d[0] < today() ? '' : '', chev: false }))}</div>`)}
      ${section('Contacts', h`<div class="list">${L.CONTACTS.map(x => h`<div class="row static"><span class="row-main"><span class="row-title">${x[0]}</span><span class="row-sub sel">${x[1]}</span><span class="btnrow">${links(x[1])}</span></span></div>`)}</div>`)}
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
  render(c) { return screen({ title: 'Bought, selling or closing', back: true, body: h`<p class="muted">What NSW Health and the Pharmacy Council require when a pharmacy changes hands or closes.</p>
    ${L.OWN.map(([t, xs]) => section(t, h`<div class="card"><ul class="plain">${xs.map(x => h`<li>${x}</li>`)}</ul></div>`))}
    ${btn('Changing how DAAs are packed?', 'go', { kind: 'link', data: { to: 'tellmeonce' } })}
    ${c.ph.inherited ? note('Marked as a newly bought pharmacy. Your next site visit asks you to confirm what the previous owner recorded.', 'ok') : btn('I’ve just bought this pharmacy', 'bought')}` }); },
  acts: { bought: c => c.change(ph => { ph.inherited = { since: today() }; log(ph, 'Marked as a newly bought pharmacy'); }, 'Marked. Make an S8 inventory now (s 111(3)); it’s on Today. Your next visit asks you to confirm what the previous owner recorded.') },
});

// Incident steps (S4-04): the current app's "If something goes wrong" cards, word for word (uat/layers/inspection.js),
// from NSW Health Pharmaceutical Services pages current Nov 2026.
const INCIDENTS = [
  ['S8 or S4D missing or stolen', ['Unexplained loss or theft: notify NSW Pharmaceutical Services immediately, using their online form for lost or stolen S8 and S4D medicines.', 'Keep a copy of the submitted form.', 'Record the loss in the drug register.', 'If more details come to light, submit the form again with them.', 'An explained loss (for example dead space in a syringe, or a witnessed spill) is recorded in the drug register; it is not notified.'], 'NSW Health · Notifying the loss or theft of medicines', 'https://www.health.nsw.gov.au/pharmaceutical/Pages/lost-stolen-drugs.aspx'],
  ['Drug register lost or destroyed', ['This includes missing pages, or an electronic register you can no longer open (for example after a system failure or ransomware).', 'Notify NSW Pharmaceutical Services immediately, in writing, with what happened (s 112). Keep a copy.', 'Make an accurate inventory of all S8 held and enter it in a new drug register (s 112).', 'Try to find out what happened and recover the register or pages if you can.', 'If S8 is also missing, notify that separately using the lost or stolen form.'], 'NSW Health · Loss or destruction of a drug register', 'https://www.health.nsw.gov.au/pharmaceutical/Pages/lost-stolen-drug-register.aspx'],
  ['Destroying S8 at the pharmacy', ['Use an independent witness: a pharmacist, medical practitioner or nurse practitioner who is not employed or engaged at the pharmacy (locums and contractors count as engaged), not a family member, and (if a pharmacist) has no financial interest in it (s 148(2)(a)(i)).', 'Patient returns go in the register on receipt; expired stock is moved to a separate “for destruction” page.', 'Render it unusable (never down a sink or toilet) and record the date, medicine and quantity, and both names, registration numbers and signatures.'], 'NSW Health · Destruction of S8 medicines at community pharmacies', 'https://www.health.nsw.gov.au/pharmaceutical/pharmacists/Pages/schedule8-destruction.aspx'],
  // Content v2 (C2-02): exact steps from My Health Records Act 2012 s 75, My Health Records Rules 2026 r 21(4)(e),
  // and Privacy Act 1988 ss 26WH–26WL (read 25 Nov 2026; uat/research/content-v2-sources-2026-11-25.md).
  ['Privacy or My Health Record data breach', ['Contain it as far as you reasonably can: for example, suspend a user account that may be compromised or stop the access (My Health Records Rules 2026 r 21(4)(e)).',
    'If it involves My Health Record (even if it only may have happened): as soon as practicable, notify both the System Operator (the Australian Digital Health Agency) and the Information Commissioner (OAIC) (My Health Records Act 2012 s 75(2)).',
    'Assess the risks. If the effects might be serious for anyone, ask the System Operator to notify the people affected; the System Operator does the notifying (s 75(5)–(6)). Then take steps to stop it happening again.',
    'If it involves only the pharmacy’s own records: if you suspect an eligible data breach, assess it quickly and within 30 days (Privacy Act 1988 s 26WH). If there are reasonable grounds to believe it is one, give the Commissioner a statement as soon as practicable and tell the people it affects (ss 26WK–26WL).',
    'The Privacy Act’s small-business exemption doesn’t apply here: an organisation that provides a health service and holds health information is covered, so the notifiable data breach rules apply whatever the pharmacy’s turnover (Privacy Act 1988 s 6D(4)(b)).',
    'Note what happened and what you reported in My log, without patient names, and review your security and access policy.'],
    'My Health Records Act 2012 s 75 · Privacy Act 1988 Part IIIC', 'https://www.legislation.gov.au/C2012A00063/latest/text'],
  // Track D: Ahpra and Pharmacy Board guidelines for mandatory notifications (read 25 Nov 2026).
  ['Concern about a registered practitioner', ['By law, registered health practitioners and employers must make a mandatory notification to Ahpra in some limited circumstances (Ahpra).',
    'There are four concerns that may trigger one, depending on the risk of harm to the public: impairment, intoxication while practising, significant departure from accepted professional standards, and sexual misconduct (Pharmacy Board guidelines for mandatory notifications).',
    'Deciding can be difficult: read the guidelines, which explain who can help you decide and how notifiers are legally protected. Anyone can make a voluntary notification.',
    'Note in My log that you notified and when, without patient names.'],
    'Pharmacy Board of Australia · Guidelines for mandatory notifications', 'https://www.ahpra.gov.au/Notifications/mandatorynotifications/Mandatory-notifications.aspx'],
];
register('incidents', {
  tab: 'more',
  render(c) { const cs = L.CONTACTS.filter(x => /Pharmaceutical Services|Lost or stolen|Public health unit|indemnity|e-prescription fraud|Privacy|OAIC|Digital Health/i.test(x[0]));
    return screen({ title: 'If something goes wrong', back: true, body: h`<p class="muted">Steps from NSW Health and the law itself, each with its source. Read the source if you're unsure.</p>
      ${INCIDENTS.map(([t, steps, src, url]) => h`<details class="why"><summary>${t}</summary><div class="why-body"><ol class="plain">${steps.map(x => h`<li>${x}</li>`)}</ol><p class="hint">Source: <a class="srclink" href="${url}" target="_blank" rel="noopener noreferrer">${src}</a></p></div></details>`)}
      ${section('Who to contact', h`<div class="list">${cs.map(x => h`<div class="row static"><span class="row-main"><span class="row-title">${x[0]}</span><span class="row-sub sel">${x[1]}</span><span class="btnrow">${links(x[1])}</span></span></div>`)}</div>`)}
      ${btn('Log what you reported', 'go', { kind: 'link', data: { to: 'mylog' } })}` }); },
});
// Evidence locations (S4-05): one place for where every record is kept, from setup answers and legal obligations.
register('locations', {
  tab: 'more',
  render(c) { const ph = c.ph, rows = locationRows(ph);
    return screen({ title: 'Evidence locations', back: true, body: h`<p class="muted">Where each record is kept, so you (or an inspector) can find it. The records themselves stay where they are.</p>
      <div class="list">${rows.map(r => row({ title: r.title, sub: r.group + (r.where ? '' : ' · not recorded yet'), right: r.where || 'Add', tone: r.where ? '' : 'warn', act: 'edit', data: { k: r.k } }))}</div>` }); },
  acts: { edit: (c, d) => c.go('location', { id: d.k }) },
});
export function locationRows(ph) { const out = [];
  for (const [sid, s] of Object.entries(ph.services)) if (s.active) for (const k of [...(RPH.sq.REC[sid] || [])]) { const v = s.answers?.[k]; out.push({ k: 'svc:' + sid + ':' + k, group: serviceName(sid), title: questionLabel(ph, sid, k), where: v && v !== 'Needs verification' ? v : '' }); }
  for (const o of L.OBL.filter(o => applies(ph, o))) out.push({ k: 'obl:' + o[0], group: 'Legal obligation · ' + o[1], title: o[2], where: ph.obligations?.[o[0]]?.where || '' });
  for (const [id, group, title] of ARCHIVES) out.push({ k: 'arch:' + id, group, title, where: ph.archives?.[id]?.where || '' });
  return out; }
// E3: where older claim records are archived (a pointer only; the records stay where they are).
export const ARCHIVES = [['pbs', 'Archive · National Health (Pharmaceutical Benefits) Regulations 2017 s 59', 'PBS prescriptions and supply records: kept at least 2 years from supply'],
  ['ppa', 'Archive · PPA Program Rules (for example DAA Program Rules s 9)', 'PPA program claim records, if you claim: kept at least 7 years after the claim']];
register('location', {
  tab: 'more',
  render(c, r) { const row0 = locationRows(c.ph).find(x => x.k === r.id) || {};
    const [kind, id] = r.id.split(':'), prev = kind === 'obl' ? c.ph.obligations?.[id] : kind === 'arch' ? c.ph.archives?.[id] : null;
    return screen({ title: 'Where is it kept?', back: true, body: h`<h2 class="big-title">${row0.title}</h2><p class="muted">${row0.group}</p>
      ${row0.where ? h`<p class="lasttime"><span class="eyebrow">Last saved${prev?.at ? ' · ' + fmt(day(prev.at)) : ''}</span> ${row0.where}</p>` : ''}
      <form class="form" data-form="save">${field('Where it is kept', textInput('where', row0.where || '', { required: true, placeholder: 'e.g. Dispensary office, drawer 2' }))}<div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f, el, r) => { const [kind, a, b] = r.id.split(':'), where = f.where.trim(); if (!where) return;
    c.change(ph => { if (kind === 'svc') ph.services[a].answers = { ...ph.services[a].answers, [b]: where }; else if (kind === 'arch') (ph.archives ??= {})[a] = { where, by: me(ph).name, at: new Date().toISOString() }; else (ph.obligations ??= {})[a] = { ...(ph.obligations?.[a] || {}), where, by: me(ph).name, at: new Date().toISOString() };
      log(ph, 'Evidence location saved · ' + (kind === 'svc' ? serviceName(a) + ' · ' + b : a) + ' · ' + where); }, 'Saved'); c.back(); } },
});
