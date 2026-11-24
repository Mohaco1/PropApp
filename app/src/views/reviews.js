// Reviews (rules → checks). One shell for every review (design rule 4): legal line + "Why?", one question per screen,
// big answers, then a finish screen with the note and next date. Issues become actions linked to the review.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, row, field, textInput, textArea, choice, note, why, empty, select } from '../ui.js';
import { C } from '../content.js';
import { catalog, reviewById, applies, suggestedNext, s8Limit, LEGAL, serviceName } from '../rules.js';
import { reviewDue, bucket } from '../summary.js';
import { fmt, today, addDays, dueText, isDate } from '../dates.js';
import { addRecord, newAction, note as log } from '../model.js';
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
export function questionsFor(id) {
  if (id === 'service-otp') return OTP_MONTHLY;
  return (C.reviews.forms[id]?.questions || []).map(q => ({ text: q.text, options: q.options.map(o => ({ value: o.value, label: o.value === 'Needs verification' ? 'Check later' : o.value, issue: o.issue && o.value !== 'Needs verification' })) }));
}
export function legalLine(a) { return a.legal?.line || (a.event ? 'When you start or change this service' : a.frequency + (a.service ? ' · ' + serviceName(a.service) : '')); }
const whyText = a => [a.check, ...(C.reviews.forms[a.id]?.notes || []).filter(n => n !== a.check && n.length > 40)].join('\n\n');
const F = [['due', 'To do'], ['law', 'Required by law'], ['nodate', 'No date'], ['done', 'Done']];
register('reviews', {
  tab: 'reviews',
  render(c) {
    const f = c.ui.revF || 'due', all = catalog().filter(a => a.id !== 'A1' && a.kind !== 'meeting' && applies(c.ph, a).applies);
    const rows = all.map(a => ({ a, date: reviewDue(c.ph, a.id), started: a.id === 'Q1' ? !!(c.draft('visit/quarterly') || c.draft('visit/extra')) : !!c.draft('review/' + a.id) })).map(x => ({ ...x, b: bucket(x.date) }));
    const done = [...c.ph.records].filter(r => r.kind === 'review' || r.kind === 'visit').sort((a, b) => b.date.localeCompare(a.date));
    let list = f === 'law' ? rows.filter(x => x.a.legal) : f === 'nodate' ? rows.filter(x => !x.date && !x.a.event) : rows.filter(x => x.date || x.started);
    list.sort((x, y) => (x.date || '9').localeCompare(y.date || '9'));
    const n = { due: rows.filter(x => x.date || x.started).length, law: rows.filter(x => x.a.legal).length, nodate: rows.filter(x => !x.date && !x.a.event).length, done: done.length };
    const other = catalog().filter(a => a.id !== 'A1' && a.kind !== 'meeting' && !applies(c.ph, a).applies);
    return screen({ title: 'Reviews', body: h`
      <div class="tabs">${F.map(([k, l]) => h`<button class="${k === f ? 'on' : ''}" data-act="f" data-f="${k}">${l} <b>${n[k]}</b></button>`)}</div>
      ${f === 'done' ? h`<div class="list">${done.length ? done.map(r => row({ title: r.extra ? 'Extra site visit' : reviewById(r.type)?.name || r.title, sub: r.by + (r.actionIds?.length ? ' · ' + r.actionIds.length + (r.actionIds.length === 1 ? ' action' : ' actions') : ''), right: fmt(r.date), act: 'rec', data: { id: r.id } })) : empty('Nothing recorded yet.')}</div>`
        : h`<div class="list">${list.length ? list.map(x => row({ title: x.a.name, sub: x.a.frequency, legal: !!x.a.legal, right: x.started ? 'In progress' : x.a.event ? 'When needed' : dueText(x.date), tone: x.b === 'overdue' ? 'bad' : x.b === 'today' ? 'warn' : '', act: 'open', data: { id: x.a.id } })) : empty('Nothing here.')}</div>
        ${f === 'due' && other.length ? why('Not in your plan · ' + other.length, h`<div class="list">${other.map(a => row({ title: a.name, sub: applies(c.ph, a).why, act: 'open', data: { id: a.id }, chev: true }))}</div>`) : ''}`}` });
  },
  acts: { f: (c, d) => { c.ui.revF = d.f; c.rerender(); }, open: (c, d) => d.id === 'Q1' ? c.go('visit-start') : c.go('review', { id: d.id }), rec: (c, d) => c.go('record', { id: d.id }) },
});
const dkey = id => 'review/' + id;
register('review', {
  tab: 'reviews',
  render(c, r) {
    const a = reviewById(r.id); if (!a) return screen({ title: 'Review', back: true, body: empty('Unknown review.') });
    if (a.kind === 'meeting') return screen({ title: a.name, back: true, body: btn('Open this meeting', 'go', { kind: 'primary', data: { to: 'meeting', id: a.id } }) });
    const ap = applies(c.ph, a), d = c.draft(dkey(a.id)), qs = questionsFor(a.id), due = reviewDue(c.ph, a.id);
    const last = c.ph.records.filter(x => x.type === a.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    if (!d) return screen({ title: a.name, back: true, body: h`
      <p class="muted">${a.legal ? h`<span class="law">Required by law</span> ` : ''}${legalLine(a)}</p>${why('Why?', whyText(a))}
      ${!ap.applies ? note('Preview only: ' + ap.why + '.', 'warn') : ''}
      <div class="card"><p class="meta">${a.event ? 'Done when you start or change the service.' : due ? dueText(due) + ' · ' + fmt(due) : 'No date yet'}${last ? ' · last done ' + fmt(last.date) : ''}</p>
        ${ap.applies ? btn('Start review', 'start', { kind: 'primary', cls: 'block' }) : ''}${!a.event ? btn('Change due date', 'go', { kind: 'link', data: { to: 'due-date', id: a.id } }) : ''}</div>
      ${last ? btn('See the last one', 'go', { kind: 'link', data: { to: 'record', id: last.id } }) : ''}
      <section class="sec"><h2 class="sec-title">What it asks · ${qs.length}</h2><ol class="qlist">${qs.map(q => h`<li>${q.text}</li>`)}</ol></section>` });
    const step = d.step || 0, total = qs.length;
    const prog = h`<div class="prog">${qs.map((q, i) => h`<i class="${i === step ? 'cur' : d.answers[i] ? (q.options.find(o => o.value === d.answers[i])?.issue ? 'bad' : 'done') : ''}"></i>`)}<i class="${step >= total ? 'cur' : ''}"></i></div>`;
    if (step >= total) return finishReview(c, a, d, qs, prog);
    const q = qs[step], ans = d.answers[step] || '', isIssue = q.options.find(o => o.value === ans)?.issue;
    return screen({ title: a.name, back: true, saved: 'Saved', body: h`${prog}<p class="steps">Question ${step + 1} of ${total}</p>
      <form class="form" data-form="q" data-change="q"><p class="qtext">${q.text}</p>
        ${choice('ans', q.options.map(o => ({ value: o.value, label: o.label || o.value })), ans, { issueValues: q.options.filter(o => o.issue).map(o => o.value) })}
        ${isIssue ? h`${field('What needs fixing?', textArea('issue', d.issues?.[step]?.text || '', { rows: 2 }))}${field('Fix by', textInput('due', d.issues?.[step]?.due || addDays(today(), 30), { type: 'date' }))}` : ''}
        ${ans && !isIssue ? field('Note (optional)', textArea('note', d.notesQ?.[step] || '', { rows: 2 })) : ''}</form>
      <div class="btnrow">${btn('Previous', 'step', { data: { s: step - 1 }, disabled: step === 0 })}${btn(step === total - 1 ? 'Finish' : 'Next', 'step', { kind: 'primary', data: { s: step + 1 } })}</div>` });
  },
  changes: {
    q: (c, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); const f = Object.fromEntries(new FormData(el.closest('form'))); const s = d.step || 0; const before = d.answers[s];
      d.answers[s] = f.ans || ''; d.issues ??= {}; d.notesQ ??= {}; if ('issue' in f) d.issues[s] = { text: f.issue, due: f.due }; if ('note' in f) d.notesQ[s] = f.note;
      c.saveDraft(dkey(r.id), d); if (before !== d.answers[s]) c.rerender(); },
    fin: (c, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); d.fields = { ...(d.fields || {}), ...Object.fromEntries(new FormData(el.closest('form'))) }; c.saveDraft(dkey(r.id), d); if (r.id === 'B1' && el.name === 'stockDate') c.rerender(); },
  },
  acts: {
    start: (c, d, el, r) => { c.saveDraft(dkey(r.id), { date: today(), answers: {}, step: 0 }); c.rerender(); },
    step: (c, dd, el, r) => { const d = structuredClone(c.draft(dkey(r.id))); d.step = Math.max(0, +dd.s); c.saveDraft(dkey(r.id), d); c.rerender(); window.scrollTo(0, 0); },
    save: (c, d, el, r) => saveReview(c, r.id),
    discard: (c, d, el, r) => { if (c.ui.armed !== r.id) { c.ui.armed = r.id; c.toast('Tap “Discard” again to delete this review’s answers.'); return; } c.ui.armed = ''; c.saveDraft(dkey(r.id), null); c.rerender(); c.toast('Discarded'); },
  },
});
function finishReview(c, a, d, qs, prog) {
  const fields = d.fields || {}, missing = qs.map((q, i) => i).filter(i => !d.answers[i] || (qs[i].options.find(o => o.value === d.answers[i])?.issue && !d.issues?.[i]?.text?.trim()));
  const issues = qs.filter((q, i) => q.options.find(o => o.value === d.answers[i])?.issue).length;
  const lim = a.id === 'B1' && isDate(fields.stockDate) ? (() => { const x = new Date(fields.stockDate); x.setMonth(x.getMonth() + 3); return x.toISOString().slice(0, 10); })() : '';
  const sug = a.months ? (a.id === 'B1' ? lim : suggestedNext(c.ph, a.id, d.date)) : '';
  const ex = EXTRA[a.id] || [], needs = ex.filter(([k, , , req]) => req && !String(fields[k] || '').trim());
  return screen({ title: a.name, back: true, saved: 'Saved', body: h`${prog}<h2 class="big-title">Finish the review</h2>
    ${missing.length ? h`<div class="list">${missing.map(i => row({ title: qs[i].text, sub: d.answers[i] ? 'Say what needs fixing' : 'Not answered yet', act: 'step', data: { s: i } }))}</div>` : note(issues ? issues + (issues === 1 ? ' issue becomes an action.' : ' issues become actions.') : 'Every question answered.', issues ? 'warn' : 'ok')}
    <form class="form" data-form="fin" data-change="fin">
      ${field('Review date', textInput('date', fields.date || d.date, { type: 'date', max: today() }))}
      ${ex.map(([k, l, t, req]) => field(l + (req ? '' : ''), Array.isArray(t) ? select(k, t.map(o => [o, o || 'Choose…']), fields[k] || '') : textInput(k, fields[k] || '', { type: t, max: t === 'date' ? today() : '' })))}
      ${field('Note (optional)', textArea('notes', fields.notes || '', { rows: 2 }))}
      ${a.months ? field('Next due', textInput('next', fields.next || sug, { type: 'date', max: lim || '' }), a.id === 'B1' ? (lim ? 'The law sets the latest date: 3 months after the stock check (' + fmt(lim) + ').' : 'Enter the stock-check date first. The next date can’t be more than 3 months after it.') : '') : ''}
    </form>
    ${needs.length ? note('Still needed: ' + needs.map(x => x[1]).join(', ') + '.', 'warn') : ''}
    ${btn('Save review', 'save', { kind: 'primary', cls: 'block', disabled: missing.length > 0 || needs.length > 0 })}${btn('Discard', 'discard', { kind: 'link' })}` });
}
function saveReview(c, id) {
  const a = reviewById(id), d = c.draft(dkey(id)), qs = questionsFor(id);
  const form = document.querySelector('form[data-form=fin]'); const f = { ...(d.fields || {}), ...(form ? Object.fromEntries(new FormData(form)) : {}) };
  if (id === 'B1' && isDate(f.stockDate)) { const lim = (() => { const x = new Date(f.stockDate); x.setMonth(x.getMonth() + 3); return x.toISOString().slice(0, 10); })(); if (f.next > lim) f.next = lim; }
  c.change(ph => {
    const date = f.date || d.date;
    const rec = addRecord(ph, { type: id, kind: 'review', title: a.name, date, notes: (f.notes || '').trim(), next: f.next || '',
      answers: qs.map((q, i) => ({ text: q.text, answer: d.answers[i], note: (q.options.find(o => o.value === d.answers[i])?.issue ? d.issues?.[i]?.text : d.notesQ?.[i]) || '' })), fields: { ...f } });
    qs.forEach((q, i) => { if (!q.options.find(o => o.value === d.answers[i])?.issue) return; const it = d.issues[i];
      rec.actionIds.push(newAction(ph, { title: it.text.trim(), due: it.due, source: { type: 'review', recordId: rec.id, label: a.name + ' · ' + date, item: q.text } }).id); });
    if (a.months && isDate(f.next)) ph.schedule[id] = f.next;
    if (id === 'otp-full' && f.threshold) ph.flags.volume = f.threshold === 'Yes';
  }, 'Review saved');
  c.saveDraft(dkey(id), null); c.back();
}
register('record', {
  tab: 'reviews',
  render(c, r) {
    const rec = c.ph.records.find(x => x.id === r.id); if (!rec) return screen({ title: 'Record', back: true, body: empty('Not found.') });
    const a = reviewById(rec.type);
    const acts = (rec.actionIds || []).map(id => c.ph.actions[id]).filter(Boolean);
    return screen({ title: rec.extra ? 'Extra site visit' : a?.name || rec.title, back: true, body: h`
      <p class="meta">${fmt(rec.date)} · recorded by ${rec.by || '—'}</p>
      ${acts.length ? h`<section class="sec"><h2 class="sec-title">Actions from this</h2><div class="list">${acts.map(x => row({ title: x.title, right: x.status === 'closed' ? 'Closed' : dueText(x.due), tone: x.status === 'open' && x.due < today() ? 'bad' : '', act: 'go', data: { to: 'action', id: x.id } }))}</div></section>` : ''}
      ${!rec.answers.length ? note('Recorded on ' + fmt(rec.date) + ' in the earlier app. Its details are kept with the record.', 'info') : ''}<section class="sec" ${rec.answers.length ? '' : h`hidden`}><h2 class="sec-title">Answers</h2><div class="list">${rec.answers.map(x => h`<div class="row static"><span class="row-main"><span class="row-title">${x.text}</span>${x.note ? h`<span class="row-sub">${x.note}</span>` : ''}</span><span class="row-right ${/Issue|Outstanding|Yes|Gap|Incomplete/.test(x.answer) && !/^No/.test(x.answer) ? 'bad' : ''}">${x.answer}</span></div>`)}</div></section>
      ${rec.notes ? h`<div class="card"><p class="eyebrow">Note</p><p>${rec.notes}</p></div>` : ''}
      ${Object.entries(rec.fields || {}).filter(([k, v]) => v && typeof v !== 'object' && !['date', 'notes', 'next', 'personId'].includes(k)).length ? h`<div class="card">${Object.entries(rec.fields).filter(([k, v]) => v && typeof v !== 'object' && !['date', 'notes', 'next', 'personId'].includes(k)).map(([k, v]) => h`<p class="meta">${label(rec.type, k)}: ${isDate(v) ? fmt(v) : v}</p>`)}</div>` : ''}` });
  },
});
const label = (type, k) => (EXTRA[type] || []).find(x => x[0] === k)?.[1] || { stockPharmacist: 'Pharmacist who did the stock check', stockDate: 'Stock-check date', stockBy: 'Pharmacist who did the stock check' }[k] || k;
register('due-date', {
  tab: 'reviews',
  render(c, r) {
    const a = reviewById(r.id), cur = c.ph.schedule[r.id] || '', lim = r.id === 'B1' ? s8Limit(c.ph) : '';
    return screen({ title: 'Change due date', back: true, body: h`<h2 class="big-title">${a.name}</h2><form class="form" data-form="due">
      ${field('Due date', textInput('date', cur, { type: 'date', max: lim }), lim ? 'Latest allowed by law: ' + fmt(lim) + ' (3 months after the last stock check).' : '')}
      ${cur ? field('Why are you moving it?', textInput('why', '', { required: true })) : ''}
      <div class="dock-inline">${btn('Save date', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  forms: { due: (c, f, el, r) => { const lim = r.id === 'B1' ? s8Limit(c.ph) : ''; if (lim && f.date > lim) { c.toast('The law doesn’t allow a date after ' + fmt(lim) + '.'); return; }
    c.change(ph => { const old = ph.schedule[r.id]; ph.schedule[r.id] = f.date; log(ph, 'Due date · ' + reviewById(r.id).name + ' · ' + (old || 'none') + ' → ' + f.date + (f.why ? ' · ' + f.why : '')); }, 'Date saved'); c.back(); } },
});
