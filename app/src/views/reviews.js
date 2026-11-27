// Reviews (rules → checks). One shell for every review (design rule 4): legal line + "Why?", one question per screen,
// big answers, then a finish screen with the note and next date. Issues become actions linked to the review.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, row, field, textInput, textArea, choice, note, why, empty, select, icon } from '../ui.js';
import { C } from '../content.js';
import { catalog, reviewById, applies, suggestedNext, s8Limit, s8Max, S8_GRACE_DAYS, LEGAL, serviceName, stockIncomplete, latestStockCheck } from '../rules.js';
import { s8Hint } from './services.js';
import { addMonths } from '../dates.js';
import { reviewDue, bucket } from '../summary.js';
import { fmt, today, addDays, dueText, isDate } from '../dates.js';
import { addRecord, newAction, note as log } from '../model.js';
import { saveFile } from '../ics.js';
import { copyText } from '../clip.js';
// Review-specific fields, from the current app's forms.
const EXTRA = {
  B1: [['stockDate', 'Date the pharmacist did the stock check', 'date', true], ['stockBy', 'Pharmacist who did the stock check', 'text']],
  A3: [['exerciseDate', 'Continuity exercise date', 'date'], ['exerciseScenario', 'Exercise scenario', 'text'], ['exerciseResult', 'Outcome and follow-up', 'text'], ['mhr', 'Does this pharmacy take part in My Health Record?', ['', 'Yes', 'No', 'To confirm']]],
  'CO-P': [['receipt', 'Council receipt reference', 'text', true]],
  'otp-full': [['methadone', 'Methadone patients (number only)', 'number'], ['bupSL', 'Sublingual buprenorphine patients (number only)', 'number'], ['laib', 'Long-acting injectable buprenorphine patients (number only)', 'number'], ['threshold', 'Did 80 or more patients receive supervised dosing on any one day?', ['', 'No', 'Yes'], true]],
  'service-otp': [['opDate', 'Date of the operational review you looked at', 'date'], ['opBy', 'Who did that review', 'text'], ['sampled', 'Number of files or records sampled (optional)', 'number'], ['extRef', 'External reference (optional, de-identified)', 'text']],
};
const OTP_MONTHLY = [
  { text: 'OTP records: what did you verify this month?', options: [{ value: 'Verified operational review', issue: false }, { value: 'No new verification', issue: false }, { value: 'Gap identified', issue: true }, { value: 'Unable to verify', issue: true }] },
  { text: 'Dosing equipment (pump or measuring device)', options: [{ value: 'No update', issue: false }, { value: 'Equipment evidence checked', issue: false }, { value: 'Fault or gap', issue: true }] },
  { text: 'Any new OTP incident since last month?', options: [{ value: 'No', issue: false }, { value: 'Yes', issue: true }] },
];
// Content v2 (C2-03): added to the end of A3 (earlier answers keep their positions). Pharmacy Board newsletter, Oct 2026,
// and National Boards' interim guidance on conflicts of interest (uat/research/content-v2-sources-2026-11-25.md).
// V3-05 wording fixes, checked 25 Nov against the NSW Pharmacist Vaccination Standards (5 Nov 2026) and NSW Health's
// cold chain page: the logger must alarm outside +2 to +8 °C; at least two staff who manage vaccines must complete the
// cold-chain module (the old text said every staff member: that is NSW Health's recommendation, not the rule).
const FIX_Q = { A3: { 0: 'Your oversight this year: you visited regularly, met the team, and know how each service is run day to day (your visits, meetings and reviews here are the record).',
  3: 'A “what if” walk-through: this year you talked the team through one scenario (for example, the dispensing system goes down, the vaccine fridge fails, or the regular pharmacist is away), checked the plan would work, and noted anything to fix.' },
  'vacc-ready': { 3: 'Purpose-built vaccine fridge with a continuous temperature data logger set to alarm outside +2°C to +8°C; twice-daily temperature recording, cold chain and emergency backup arrangements confirmed (NSW Pharmacist Vaccination Standards).',
  7: 'People (NSW Pharmacist Vaccination Standards; NSW Health): a named vaccine coordinator and a backup; at least two staff who manage vaccines have completed the NSW Health Vaccine Storage and Cold Chain Management module (recommended for everyone who handles vaccines), with certificates kept on file; each immuniser’s NSW Pharmacist Immuniser Declaration Form is kept on the premises.' } };
const EXTRA_Q = { B1: ['Invoice spot-check (Pharmacy Council, Supporting resources for managing S8, S4B and S4D medicines: recommended): a few wholesaler S8 invoices since the last review were compared with the register’s receipt entries, and they match.',
  'Destruction (NSW Health, Management of Schedule 8 medicines): any S8 destroyed since the last review was destroyed by a pharmacist in the presence of an independent witness, and recorded in the drug register.'],
  A3: ['Cultural safety (Pharmacy Board guidelines, Oct 2026): the pharmacy’s services and team practices support culturally safe care.',
  'Conflicts of interest (National Boards’ interim guidance): clinical decisions and patient choice stay independent of financial or commercial pressures.',
  'SafeScript NSW (NSW Health, Privacy and security): each pharmacist uses their own login with multi-factor authentication, no logins are shared, and staff know that unauthorised access, use or disclosure carries penalties under the Regulation (logins from outside Australia are blocked).',
  'IT backups (best practice): a restore from the dispensing and business system backups was tested this year, the backup is kept off the premises or in the cloud, and the result was recorded.',
  'Workers compensation (icare): the NSW workers compensation policy is current, and at renewal the actual wages paid in the last policy period were declared (icare: a legal requirement).',
  'Digital certificates (Services Australia): the NASH PKI certificate (valid for 2 years) is in date, and the PRODA B2B device the dispensing and claiming software use has been reactivated in the last 6 months (it must be reactivated at least every 6 months), with both dates noted.'] };
export function questionsFor(id) {
  if (id === 'service-otp') return OTP_MONTHLY;
  const base = C.reviews.forms[id]?.questions || [];
  return [...base.map((q, i) => FIX_Q[id]?.[i] ? { ...q, text: FIX_Q[id][i] } : q), ...(EXTRA_Q[id] || []).map(text => ({ text, options: base.at(-1).options }))].map(q => ({ text: q.text, options: q.options.map(o => ({ value: o.value, label: o.value === 'Needs verification' ? 'Check later' : o.value, issue: o.issue && o.value !== 'Needs verification' })) }));
}
export function legalLine(a) { return a.legal?.line || (a.event ? 'When you start or change this service' : a.frequency + (a.service ? ' · ' + serviceName(a.service) : '')); }
const whyText = a => [a.check, ...(C.reviews.forms[a.id]?.notes || []).filter(n => n !== a.check && n.length > 40)].join('\n\n');
const F = [['all', 'All'], ['overdue', 'Overdue'], ['soon', 'Due soon'], ['ontrack', 'On track'], ['nodate', 'No date'], ['law', 'Required by law'], ['done', 'Completed']];
register('reviews', {
  tab: 'reviews',
  render(c) {
    const f = c.ui.revF || 'all', q = (c.ui.revQ || '').toLowerCase(), inactive = !!c.ui.revInactive;
    const base = catalog().filter(a => a.id !== 'A1' && a.kind !== 'meeting' && (inactive || applies(c.ph, a).applies));
    const rows = base.map(a => { const ap = applies(c.ph, a), date = ap.applies ? reviewDue(c.ph, a.id) : ''; return { a, ap, date, started: a.id === 'Q1' ? !!c.draft('visit/quarterly') : !!c.draft('review/' + a.id), b: ap.applies ? bucket(date) : 'inactive' }; });
    const done = [...c.ph.records].filter(r => r.kind === 'review' || r.kind === 'visit').sort((a, b) => b.date.localeCompare(a.date));
    const pick = { all: x => true, overdue: x => x.b === 'overdue', soon: x => ['today', 'week'].includes(x.b) || (x.date && x.date <= addDays(today(), 30) && x.b !== 'overdue'), ontrack: x => x.date && x.date > addDays(today(), 30), nodate: x => x.ap.applies && !x.date && !x.a.event, law: x => !!x.a.legal };
    const n = Object.fromEntries(F.map(([k]) => [k, k === 'done' ? done.length : rows.filter(pick[k]).length]));
    const list = f === 'done' ? [] : rows.filter(pick[f]).filter(x => !q || (x.a.name + ' ' + x.a.frequency).toLowerCase().includes(q)).sort((x, y) => (x.b === 'inactive') - (y.b === 'inactive') || (x.date || '9').localeCompare(y.date || '9'));
    const doneList = done.filter(r => !q || ((reviewById(r.type)?.name || r.title) + ' ' + r.by).toLowerCase().includes(q));
    return screen({ title: 'Reviews', body: h`<p class="muted tabsub">Every check in your plan and when it’s next due. Today shows only what needs doing now.</p>
      <label class="search">${icon('search')}<input class="input" name="q" type="search" placeholder="Search reviews" value="${c.ui.revQ || ''}" data-input="q" autocomplete="off"></label>
      <div class="chips">${F.map(([k, l]) => h`<button class="chip ${k === f ? 'on' : ''}" data-act="f" data-f="${k}">${l} · ${n[k]}</button>`)}</div>
      ${f === 'done' ? h`<div class="list">${doneList.length ? doneList.map(r => row({ title: r.extra ? 'Extra site visit' : reviewById(r.type)?.name || r.title, sub: r.by + (r.actionIds?.length ? ' · ' + r.actionIds.length + (r.actionIds.length === 1 ? ' action' : ' actions') : ''), right: fmt(r.date), act: 'rec', data: { id: r.id } })) : empty('Nothing recorded yet.')}</div>`
        : h`<div class="list">${list.length ? list.map(x => row({ title: x.a.name, sub: x.b === 'inactive' ? 'Not in your plan · ' + x.ap.why : x.a.frequency, legal: !!x.a.legal, right: x.b === 'inactive' ? '' : x.started ? 'In progress' : x.a.event ? 'When needed' : dueText(x.date), tone: x.b === 'overdue' ? 'bad' : x.b === 'today' ? 'warn' : '', act: 'open', data: { id: x.a.id } })) : empty('Nothing here.')}</div>`}
      <label class="tick"><input type="checkbox" data-change="inactive" ${inactive ? h`checked` : ''}><span>Include reviews not in your plan</span></label>` });
  },
  inputs: { q: (c, el) => { c.ui.revQ = el.value; c.rerender(); } },
  changes: { inactive: (c, el) => { c.ui.revInactive = el.checked; c.rerender(); } },
  acts: { f: (c, d) => { c.ui.revF = d.f; c.rerender(); }, open: (c, d) => d.id === 'Q1' && applies(c.ph, reviewById('Q1')).applies ? c.go('visit-start') : c.go('review', { id: d.id }), rec: (c, d) => c.go('record', { id: d.id }) },
});
const dkey = id => 'review/' + id;
register('review', {
  tab: 'reviews',
  render(c, r) {
    const a = reviewById(r.id); if (!a) return screen({ title: 'Review', back: true, body: empty('Unknown review.') });
    if (a.kind === 'meeting') return screen({ title: a.name, back: true, body: btn('Open this meeting', 'go', { kind: 'primary', data: { to: 'meeting', id: a.id } }) });
    const ap = applies(c.ph, a), d = c.draft(dkey(a.id)), qs = questionsFor(a.id), due = reviewDue(c.ph, a.id);
    const last = c.ph.records.filter(x => x.type === a.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    if (!d) return screen({ title: a.name, back: true, site: c.ph.name, body: h`
      <p class="muted">${a.legal ? h`<span class="law">Required by law</span> ` : ''}${legalLine(a)}</p>${why('Why?', whyText(a))}
      ${!ap.applies ? note('Preview only: ' + ap.why + '.', 'warn') : ''}
      <dl class="facts"><dt>How often</dt><dd>${c.ph.intervals?.[a.id] || a.frequency}</dd>${a.id === 'B1' ? (() => { const done = c.ph.records.filter(x => x.type === 'B1' && !stockIncomplete(x)).sort((x, y) => x.date.localeCompare(y.date)).at(-1), stock = latestStockCheck(c.ph);
          return h`<dt>Last proprietor review</dt><dd>${last ? fmt(last.date) + ' by ' + last.by + (stockIncomplete(last) ? ' · stock check incomplete' : '') : 'Not yet'}</dd><dt>Last completed stocktake</dt><dd>${stock ? fmt(stock) + (done?.fields?.stockBy ? ' · ' + done.fields.stockBy : '') : 'None on record'}</dd>`; })() : h`<dt>Last done</dt><dd>${last ? fmt(last.date) + ' by ' + last.by : 'Not yet'}</dd>`}
        <dt>Set by</dt><dd>${a.legal ? 'The law (' + a.legal.line.replace(/^.*\((.*)\)$/, '$1') + ')' : c.ph.intervals?.[a.id] ? 'You' : a.service ? 'Your ' + serviceName(a.service) + ' service' : 'Good practice for proprietors'}</dd>
        <dt>Why it's here</dt><dd>${ap.applies ? (a.service ? 'You offer ' + serviceName(a.service) + '.' : 'Every pharmacy.') : ap.why + '.'}</dd></dl>
      <div class="card"><p class="meta">${a.event ? 'Done when you start or change the service.' : due ? dueText(due) + (dueText(due).includes(fmt(due)) ? '' : ' · ' + fmt(due)) : 'No date yet'}</p>
        ${ap.applies ? btn('Start review', 'start', { kind: 'primary', cls: 'block' }) : ''}${!a.event ? btn('Change due date', 'go', { kind: 'link', data: { to: 'due-date', id: a.id } }) : ''}${!a.event && !a.legal ? btn('How often: ' + (c.ph.intervals?.[a.id] || a.frequency), 'go', { kind: 'link', data: { to: 'interval', id: a.id } }) : ''}</div>
      ${last ? btn('See the last one', 'go', { kind: 'link', data: { to: 'record', id: last.id } }) : ''}
      <section class="sec"><h2 class="sec-title">What it asks · ${qs.length}</h2><ol class="qlist">${qs.map(q => h`<li>${q.text}</li>`)}</ol></section>` });
    const step = d.step || 0, total = qs.length;
    const prog = h`<div class="prog">${qs.map((q, i) => h`<i class="${i === step ? 'cur' : d.answers[i] ? (q.options.find(o => o.value === d.answers[i])?.issue ? 'bad' : 'done') : ''}"></i>`)}<i class="${step >= total ? 'cur' : ''}"></i></div>`;
    if (step >= total) return finishReview(c, a, d, qs, prog);
    // Trial batch 1: "Answer as a list" for routine reviews. Every question on one screen, one tap per answer, nothing
    // pre-answered. An issue answer goes back to the step view at that question so the owner can say what needs fixing.
    if (d.list) { const left = qs.filter((q, i) => !d.answers[i]).length;
      return screen({ title: a.name, back: true, site: c.ph.name, saved: 'Saved', body: h`${prog}<p class="steps">${left ? (left === 1 ? '1 question left' : left + ' questions left') : 'All answered'} · tap one answer for each</p>
        ${qs.map((q, i) => h`<div class="card qlist-item"><p class="qtext">${i + 1}. ${q.text}</p><div class="chips">${q.options.map(o => h`<button type="button" class="chip ${d.answers[i] === o.value ? 'on' : ''} ${o.issue ? 'issue' : ''}" data-act="qa" data-i="${i}" data-v="${o.value}" aria-pressed="${d.answers[i] === o.value}">${o.label || o.value}</button>`)}</div></div>`)}
        <div class="btnrow">${btn('One at a time', 'qlist', { data: { on: '' } })}${btn('Finish', 'step', { kind: 'primary', data: { s: total }, disabled: left > 0 })}</div>` }); }
    const q = qs[step], ans = d.answers[step] || '', isIssue = q.options.find(o => o.value === ans)?.issue;
    // PharmLedger brief: the previous record's answer for this question, shown (never selected for the owner). Its note,
    // which often says where the evidence is kept, can be copied into this answer's note with one tap.
    const prevRec = c.ph.records.filter(x => x.type === a.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    const prevAns = prevRec?.answers?.find(x => x.text === q.text) || (prevRec?.answers?.length === total ? prevRec.answers[step] : null);
    return screen({ title: a.name, back: true, site: c.ph.name, saved: 'Saved', body: h`${prog}<p class="steps">Question ${step + 1} of ${total}</p>
      <form class="form" data-form="q" data-change="q" data-input="qi"><p class="qtext">${q.text}</p>
        ${prevAns ? h`<p class="lasttime"><span class="eyebrow">Last time · ${fmt(prevRec.date)}</span> ${prevAns.answer}${prevAns.note ? ' · ' + prevAns.note : ''}${prevAns.ref ? ' · kept: ' + prevAns.ref : ''}</p>` : ''}
        ${choice('ans', q.options.map(o => ({ value: o.value, label: o.label || o.value })), ans, { issueValues: q.options.filter(o => o.issue).map(o => o.value) })}
        ${isIssue ? h`${field('What needs fixing?', textArea('issue', d.issues?.[step]?.text || '', { rows: 2 }))}${field('Fix by', textInput('due', d.issues?.[step]?.due || addDays(today(), 30), { type: 'date' }))}` : ''}
        ${ans && !isIssue ? h`${field('Note (optional)', textArea('note', d.notesQ?.[step] || '', { rows: 2 }))}${prevAns?.note && !d.notesQ?.[step] ? btn('Use last time’s note', 'uselast', { kind: 'link', data: { s: step } }) : ''}` : ''}</form>
      <div class="btnrow">${btn('Previous', 'step', { data: { s: step - 1 }, disabled: step === 0 })}${btn(step === total - 1 ? 'Finish' : 'Next', 'step', { kind: 'primary', data: { s: step + 1 } })}</div>
      ${total > 3 ? btn('Answer as a list', 'qlist', { kind: 'link', data: { on: '1' } }) : ''}` });
  },
  // R09: notes and issue text are kept as they're typed (not only when the box loses focus), so a reload or a phone
  // call mid-sentence loses nothing. Typing never redraws the screen.
  inputs: {
    qi: (c, el, r, e) => { if (e.target.type === 'radio') return; const d = structuredClone(c.draft(dkey(r.id))); const f = Object.fromEntries(new FormData(el.closest('form'))); const s = d.step || 0; d.issues ??= {}; d.notesQ ??= {};
      if ('issue' in f) d.issues[s] = { text: f.issue, due: f.due }; if ('note' in f) d.notesQ[s] = f.note; c.saveDraft(dkey(r.id), d); },
    fini: (c, el, r, e) => { if (e.target.type === 'date') return; const d = structuredClone(c.draft(dkey(r.id))); d.fields = { ...(d.fields || {}), ...Object.fromEntries(new FormData(el.closest('form'))) }; c.saveDraft(dkey(r.id), d); },
  },
  changes: {
    q: (c, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); const f = Object.fromEntries(new FormData(el.closest('form'))); const s = d.step || 0; const before = d.answers[s];
      d.answers[s] = f.ans || ''; d.issues ??= {}; d.notesQ ??= {}; if ('issue' in f) d.issues[s] = { text: f.issue, due: f.due }; if ('note' in f) d.notesQ[s] = f.note;
      c.saveDraft(dkey(r.id), d); if (before !== d.answers[s]) c.rerender();
      // B5: a clean answer moves on by itself after a moment; Issue or Incomplete waits for a note. Only if you're still
      // on this question with this answer (a quick tap on Next never skips one).
      const ans = d.answers[s], o = questionsFor(r.id)[s]?.options.find(x => x.value === ans);
      if (before !== ans && o && !o.issue && !/^Incomplete$/.test(ans)) setTimeout(() => { const cur = c.draft(dkey(r.id)), rt = c.route;
        if (rt?.name === 'review' && rt.id === r.id && cur && (cur.step || 0) === s && cur.answers?.[s] === ans) { const n = structuredClone(cur); n.step = s + 1; c.saveDraft(dkey(r.id), n); c.rerender(); window.scrollTo(0, 0); } }, 600); },
    fin: (c, el, r, e) => { const d = structuredClone(c.draft(dkey(r.id))); d.fields = { ...(d.fields || {}), ...Object.fromEntries(new FormData(el.closest('form'))) }; c.saveDraft(dkey(r.id), d); if (r.id === 'B1' && e?.target?.name === 'stockDate') c.rerender(); }, // el is the form; the changed field is e.target
  },
  acts: {
    qlist: (c, dd, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); d.list = !!dd.on; c.saveDraft(dkey(r.id), d); c.rerender(); window.scrollTo(0, 0); },
    qa: (c, dd, el, r) => { const d = structuredClone(c.draft(dkey(r.id))), qs = questionsFor(r.id), i = +dd.i, o = qs[i]?.options.find(x => x.value === dd.v); if (!o) return;
      d.answers[i] = o.value; if (o.issue) { d.list = false; d.step = i; } c.saveDraft(dkey(r.id), d); c.rerender(); },
    start: (c, d, el, r) => { c.saveDraft(dkey(r.id), { date: today(), answers: {}, step: 0 }); c.rerender(); },
    uselast: (c, dd, el, r) => { const a = reviewById(r.id), qs = questionsFor(r.id), s = +dd.s, prev = c.ph.records.filter(x => x.type === r.id).sort((x, y) => y.date.localeCompare(x.date))[0];
      const pa = prev?.answers?.find(x => x.text === qs[s]?.text) || (prev?.answers?.length === qs.length ? prev.answers[s] : null); if (!pa?.note) return;
      const d = structuredClone(c.draft(dkey(r.id))); (d.notesQ ??= {})[s] = pa.note; c.saveDraft(dkey(r.id), d); c.rerender(); },
    step: (c, dd, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); d.step = Math.max(0, +dd.s); c.saveDraft(dkey(r.id), d); c.rerender(); window.scrollTo(0, 0); },
    save: (c, d, el, r) => saveReview(c, r.id),
    discard: (c, d, el, r) => { if (c.ui.armed !== r.id) { c.ui.armed = r.id; c.toast('Tap “Discard” again to delete this review’s answers.'); return; } c.ui.armed = ''; c.saveDraft(dkey(r.id), null); c.rerender(); c.toast('Discarded'); },
  },
});
// C-01: a 3-month limit that has already passed becomes a short planning window (today to +14 days), never a max in the past.
const s8Window = l => l && l < today() ? addDays(today(), S8_GRACE_DAYS) : l;
function finishReview(c, a, d, qs, prog) {
  const fields = d.fields || {}, missing = qs.map((q, i) => i).filter(i => !d.answers[i] || (qs[i].options.find(o => o.value === d.answers[i])?.issue && !d.issues?.[i]?.text?.trim()));
  const issues = qs.filter((q, i) => q.options.find(o => o.value === d.answers[i])?.issue).length;
  // R02/R05: an incomplete stock check doesn't move the S8 deadline (the last completed one still sets it); every date
  // here uses the one calendar-month helper (addMonths), so screens agree across month ends and daylight saving.
  const inc = a.id === 'B1' && d.answers[0] === 'Incomplete', future = a.id === 'B1' && isDate(fields.stockDate) && fields.stockDate > today();
  const lim = a.id !== 'B1' ? '' : inc ? s8Limit(c.ph) : isDate(fields.stockDate) && !future ? addMonths(fields.stockDate, 3) : '';
  const max = a.id !== 'B1' ? '' : inc ? s8Max(c.ph) : s8Window(lim), past = !!lim && lim < today();
  const sug = a.months ? (a.id === 'B1' ? (past ? max : lim) : suggestedNext(c.ph, a.id, d.date)) : '';
  const ex = (EXTRA[a.id] || []).filter(([k]) => !(inc && (k === 'stockDate' || k === 'stockBy'))), needs = ex.filter(([k, , , req]) => req && !String(fields[k] || '').trim());
  return screen({ title: a.name, back: true, site: c.ph.name, saved: 'Saved', body: h`${prog}<h2 class="big-title">Finish the review</h2>
    ${missing.length ? h`<div class="list">${missing.map(i => row({ title: qs[i].text, sub: d.answers[i] ? 'Say what needs fixing' : 'Not answered yet', act: 'step', data: { s: i } }))}</div>` : note(issues ? issues + (issues === 1 ? ' issue becomes an action.' : ' issues become actions.') : 'Every question answered.', issues ? 'warn' : 'ok')}
    <form class="form" data-form="fin" data-change="fin" data-input="fini">
      ${field('Review date', textInput('date', fields.date || d.date, { type: 'date', max: today() }))}
      ${ex.map(([k, l, t, req]) => field(l + (req ? '' : ''), Array.isArray(t) ? select(k, t.map(o => [o, o || 'Choose…']), fields[k] || '') : textInput(k, fields[k] || '', { type: t, max: t === 'date' ? today() : '' })))}
      ${field('Note (optional)', textArea('notes', fields.notes || '', { rows: 2 }))}
      ${a.months ? field('Next due', textInput('next', fields.next || (sug && max && sug > max ? max : sug), { type: 'date', max: max || '' }), a.id === 'B1' ? (inc ? (lim ? 'The stock check wasn’t finished, so the deadline stays 3 months after the last completed one (' + fmt(lim) + ').' : 'The stock check wasn’t finished and there’s no completed one on record: arrange it as soon as you can.') + (past ? ' That date has passed: plan it on or before ' + fmt(max) + '.' : '') : lim ? 'The law sets the latest date: 3 months after the stock check (' + fmt(lim) + ').' + (past ? ' That date has passed: plan it on or before ' + fmt(max) + '.' : '') : 'Enter the stock-check date first. The next date can’t be more than 3 months after it.') : '') : ''}
    </form>
    ${future ? note('The stock-check date can’t be in the future.', 'warn') : ''}
    ${needs.length ? note('Still needed: ' + needs.map(x => x[1]).join(', ') + '.', 'warn') : ''}
    ${btn('Save review', 'save', { kind: 'primary', cls: 'block', disabled: missing.length > 0 || needs.length > 0 || future })}${btn('Discard', 'discard', { kind: 'link' })}` });
}
function saveReview(c, id) {
  const a = reviewById(id), d = c.draft(dkey(id)), qs = questionsFor(id);
  const form = document.querySelector('form[data-form=fin]'); const f = { ...(d.fields || {}), ...(form ? Object.fromEntries(new FormData(form)) : {}) };
  if (id === 'B1') { const inc = d.answers[0] === 'Incomplete';
    if (!inc && isDate(f.stockDate) && f.stockDate > today()) { c.toast('The stock-check date can’t be in the future.'); return; }
    if (inc) { f.stockIncomplete = true; delete f.stockDate; delete f.stockBy; }
    const lim = inc ? s8Max(c.ph) : isDate(f.stockDate) ? s8Window(addMonths(f.stockDate, 3)) : ''; if (lim && f.next > lim) f.next = lim; }
  c.change(ph => {
    const date = f.date || d.date;
    const rec = addRecord(ph, { type: id, kind: 'review', title: a.name, date, notes: (f.notes || '').trim(), next: f.next || '',
      answers: qs.map((q, i) => ({ text: q.text, answer: d.answers[i], isIssue: !!q.options.find(o => o.value === d.answers[i])?.issue, note: (q.options.find(o => o.value === d.answers[i])?.issue ? d.issues?.[i]?.text : d.notesQ?.[i]) || '' })), fields: { ...f } });
    qs.forEach((q, i) => { if (!q.options.find(o => o.value === d.answers[i])?.issue) return; const it = d.issues[i];
      rec.actionIds.push(newAction(ph, { title: it.text.trim(), due: it.due, source: { type: 'review', recordId: rec.id, label: a.name + ' · ' + date, item: q.text } }).id); });
    if (a.months && isDate(f.next)) ph.schedule[id] = f.next;
    if (id === 'otp-full' && f.threshold) ph.flags.volume = f.threshold === 'Yes';
  }, 'Review saved');
  c.saveDraft(dkey(id), null); c.back();
}
// A readable summary of one record, for an inspector or your own files.
export function recordText(ph, rec) { const a = reviewById(rec.type), acts = (rec.actionIds || []).map(id => ph.actions[id]).filter(Boolean);
  return [ph.name + (ph.address ? ' · ' + ph.address : ''), (rec.extra ? 'Extra site visit' : a?.name || rec.title), 'Date: ' + fmt(rec.date) + ' · recorded by ' + (rec.by || '—'), '',
    ...rec.answers.map(x => '• ' + x.text + ': ' + x.answer + (x.note ? ' (' + x.note + ')' : '')),
    ...Object.entries(rec.fields?.serviceEvidence || {}).map(([s, e]) => '• ' + serviceName(s) + ' evidence: ' + e.status + (e.ref ? ' (' + e.ref + ')' : '')),
    rec.notes ? '\nNote: ' + rec.notes : '', acts.length ? '\nActions:\n' + acts.map(x => '• ' + x.title + ' · ' + (x.status === 'closed' ? 'closed ' + fmt(x.closed?.date) + (x.closed?.what ? ': ' + x.closed.what : '') : 'open, due ' + fmt(x.due))).join('\n') : '', '', 'From R.Pharmacy. Records stay in the pharmacy’s own systems; no patient details.'].join('\n'); }
register('record', {
  tab: 'reviews',
  acts: { dlrec: (c, d) => { const rec = c.ph.records.find(x => x.id === d.id); const ok = saveFile((c.ph.name + ' ' + (reviewById(rec.type)?.name || rec.title) + ' ' + rec.date).replace(/[^\w]+/g, '-') + '.txt', recordText(c.ph, rec)); c.toast(ok ? 'Summary ready' : 'Downloads are blocked here. Use Copy as text.'); },
    copyrec: async (c, d) => { const rec = c.ph.records.find(x => x.id === d.id); const t = recordText(c.ph, rec);
    if (await copyText(t)) { c.toast('Copied'); } else { c.toast('Copy didn’t work here.'); } } },
  render(c, r) {
    const rec = c.ph.records.find(x => x.id === r.id); if (!rec) return screen({ title: 'Record', back: true, body: empty('Not found.') });
    const a = reviewById(rec.type);
    const acts = (rec.actionIds || []).map(id => c.ph.actions[id]).filter(Boolean);
    return screen({ title: rec.extra ? 'Extra site visit' : a?.name || rec.title, back: true, body: h`
      <p class="meta">${fmt(rec.date)} · recorded by ${rec.by || '—'}</p>
      ${acts.length ? h`<section class="sec"><h2 class="sec-title">Actions from this</h2><div class="list">${acts.map(x => row({ title: x.title, right: x.status === 'closed' ? 'Closed' : dueText(x.due), tone: x.status === 'open' && x.due < today() ? 'bad' : '', act: 'go', data: { to: 'action', id: x.id } }))}</div></section>` : ''}
      ${!rec.answers.length ? note('Recorded on ' + fmt(rec.date) + ' in the earlier app. Its details are kept with the record.', 'info') : ''}<section class="sec" ${rec.answers.length ? '' : h`hidden`}><h2 class="sec-title">Answers</h2><div class="list">${rec.answers.map(x => h`<div class="row static"><span class="row-main"><span class="row-title">${x.text}</span>${x.note ? h`<span class="row-sub">${x.note}</span>` : ''}</span><span class="row-right ${/Issue|Outstanding|Yes|Gap|Incomplete/.test(x.answer) && !/^No/.test(x.answer) ? 'bad' : ''}">${x.answer}</span></div>`)}</div></section>
      ${Object.keys(rec.fields?.serviceEvidence || {}).length ? h`<section class="sec"><h2 class="sec-title">Service evidence</h2><div class="list">${Object.entries(rec.fields.serviceEvidence).map(([s, e]) => h`<div class="row static"><span class="row-main"><span class="row-title">${serviceName(s)}</span>${e.ref ? h`<span class="row-sub">${e.ref}</span>` : ''}</span><span class="row-right ${/Gap|Issue|Unable/.test(e.status) ? 'bad' : ''}">${e.status}</span></div>`)}</div></section>` : ''}
      ${rec.fields?.vacc?.sighted ? h`<p class="meta">Vaccine storage self-audit ${rec.fields.vacc.sighted === 'yes' ? 'seen' + (rec.fields.vacc.auditDate ? ' · dated ' + fmt(rec.fields.vacc.auditDate) : '') : 'not seen yet'} · cold-chain breach since last visit: ${rec.fields.vacc.event || '—'}</p>` : ''}
      ${rec.notes ? h`<div class="card"><p class="eyebrow">Note</p><p>${rec.notes}</p></div>` : ''}<div class="btnrow">${btn('Download summary', 'dlrec', { data: { id: rec.id } })}${btn('Copy as text', 'copyrec', { data: { id: rec.id } })}</div>
      ${Object.entries(rec.fields || {}).filter(([k, v]) => v && typeof v !== 'object' && !['date', 'notes', 'next', 'personId'].includes(k)).length ? h`<div class="card">${Object.entries(rec.fields).filter(([k, v]) => v && typeof v !== 'object' && !['date', 'notes', 'next', 'personId'].includes(k)).map(([k, v]) => h`<p class="meta">${label(rec.type, k)}: ${isDate(v) ? fmt(v) : v}</p>`)}</div>` : ''}` });
  },
});
const label = (type, k) => (EXTRA[type] || []).find(x => x[0] === k)?.[1] || { owner: 'Who follows it up', stockPharmacist: 'Pharmacist who did the stock check', stockDate: 'Stock-check date', stockBy: 'Pharmacist who did the stock check' }[k] || k;
register('due-date', {
  tab: 'reviews',
  render(c, r) {
    const a = reviewById(r.id), cur = c.ph.schedule[r.id] || '', lim = r.id === 'B1' ? s8Max(c.ph) : '';
    return screen({ title: 'Change due date', back: true, body: h`<h2 class="big-title">${a.name}</h2><form class="form" data-form="due">
      ${field('Due date', textInput('date', cur, { type: 'date', max: lim }), lim ? s8Hint(c.ph) : '')}
      ${cur ? field('Why are you moving it?', textInput('why', '', { required: true })) : ''}
      <div class="dock-inline">${btn('Save date', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  forms: { due: (c, f, el, r) => { const lim = r.id === 'B1' ? s8Max(c.ph) : ''; if (lim && f.date > lim) { c.toast(s8Hint(c.ph)); return; }
    c.change(ph => { const old = ph.schedule[r.id]; ph.schedule[r.id] = f.date; log(ph, 'Due date · ' + reviewById(r.id).name + ' · ' + (old || 'none') + ' → ' + f.date + (f.why ? ' · ' + f.why : '')); }, 'Date saved'); c.back(); } },
});

// How often (current app's "Adjust intervals"). The S8 review stays every 3 months: that's the law.
register('interval', {
  tab: 'reviews',
  render(c, r) { const a = reviewById(r.id), cur = c.ph.intervals?.[r.id] || a.frequency;
    return screen({ title: 'How often', back: true, body: h`<h2 class="big-title">${a.name}</h2><p class="muted">The suggested interval is ${a.frequency.toLowerCase()}. Choose what suits your pharmacy.</p>
      <form class="form" data-form="save">${choice('f', ['Monthly', 'Quarterly', 'Six-monthly', 'Annual'], cur)}${field('Why (optional)', textInput('why', ''))}<div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f, el, r) => { if (!f.f) return; c.change(ph => { (ph.intervals ??= {})[r.id] = f.f; log(ph, 'How often · ' + reviewById(r.id).name + ' · ' + f.f + (f.why ? ' · ' + f.why : '')); }, 'Saved'); c.back(); } },
});
