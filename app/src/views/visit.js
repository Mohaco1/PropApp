// Site visit (mode 2). Quarterly and extra visits are saved separately, so one never blocks the other (Gemini F-03).
// One check per screen, big answers, "Last time" and "still open" from earlier visits, finish lists what's missing.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, field, textInput, textArea, choice, note, why, row, empty, select } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, addDays, addMonths, dueText, isDate } from '../dates.js';
import { activeServices } from '../rules.js';
import { addRecord, newAction } from '../model.js';
import { reviewDue } from '../summary.js';
import { questionIndex, questionLabel } from './services.js';
import { copyText } from '../clip.js';
const DISPLAY = 'Displayed names (Council Guide Note 24): owner names at or near the main entrance; the name of the pharmacist on duty next to the dispensing area (it can change day to day).';
// Track C: what to look at for equipment (best practice, no legal claim); the OTP pump only when the pharmacy runs OTP.
const EQUIP = ['Fridge thermometers or data loggers: calibration certificate in date, or checked against a reference thermometer', 'Dispensary and compounding scales: checked with test weights, and serviced as the maker says', 'Screening devices (such as blood pressure monitors): serviced or calibrated as the maker says'];
const EQUIP_OTP = 'OTP dosing pump: calibrated and checked as the maker and your OTP procedure say, with each check recorded';
export function visitItems(ph) {
  const act = activeServices(ph);
  return C.visit.items.filter(i => i.core || act.includes(i.service)).map(i => i.key === 'premises' ? { ...i, guide: i.guide + ' ' + DISPLAY, block: ['Equipment calibration · best practice', [...EQUIP, ...(act.includes('otp') ? [EQUIP_OTP] : [])]] } : i);
}
const ANS = [['ok', 'Satisfactory'], ['issue', 'Issue'], ['verify', 'Check later'], ['na', 'N/A']];
const key = extra => extra ? 'visit/extra' : 'visit/quarterly';
function lastVisitIssue(ph, itemKey) {
  const visits = ph.records.filter(r => r.type === 'Q1').sort((a, b) => b.date.localeCompare(a.date));
  for (const v of visits) { const a = v.answers.find(x => x.item === itemKey); if (a && a.answer === 'Issue') {
    const act = Object.values(ph.actions).find(x => x.source?.recordId === v.id && (x.source.item === v.answers.find(y => y.item === itemKey)?.text || x.title === a.note));
    return { date: v.date, text: a.note, closed: act?.status === 'closed' ? act.closed.date : '', open: act?.status === 'open' ? act : null }; } }
  return null;
}
function openFromVisits(ph) { return Object.values(ph.actions).filter(a => a.status === 'open' && a.source?.type === 'visit'); }
function worthSeeing(ph) {
  const out = openFromVisits(ph).map(a => ({ title: a.title, why: 'Found at the ' + fmt(a.source.label.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '') + ' visit · see if it’s fixed', act: 'action', id: a.id }));
  for (const p of ph.staff.filter(x => x.active !== false)) { const n = Object.values(ph.actions).filter(a => a.status === 'open' && a.source?.staffId === p.id).length; if (n) out.push({ title: p.name + '’s checks', why: n + ' to look at', act: 'person', id: p.id }); }
  for (const a of Object.values(ph.actions).filter(a => a.status === 'open' && !a.source?.staffId && a.source?.type !== 'visit' && isDate(a.due) && a.due <= addDays(today(), 7))) out.push({ title: a.title, why: dueText(a.due), act: 'action', id: a.id });
  return out;
}
// First visit after buying (current app's change.js): confirm what the previous owner recorded while you're there.
function inheritedRows(c) {
  const ph = c.ph; if (!ph.inherited) return [];
  const out = [], skip = c.ui.inhSkip || [];
  if (ph.services.daa?.active && !(ph.changes || []).length && !skip.includes('daa')) out.push({ id: 'daa', title: 'DAAs: ' + (ph.services.daa.answers?.routes || 'house').split(',').map(k => ({ house: 'we pack on site', routeA: 'an outside packer packs', routeB: 'another pharmacy dispenses and packs' }[k] || k)).join(' + '), q: 'Is that still how this pharmacy runs?' });
  for (const [sid, s] of Object.entries(ph.services)) for (const [k, v] of Object.entries(s.answers || {})) if (s.active && v === 'Needs verification' && out.length < 3 && !skip.includes(sid + '/' + k)) out.push({ id: sid + '/' + k, sid, k, title: questionLabel(ph, sid, k), q: 'Recorded by the previous owner · check it while you’re here' });
  return out;
}
function inheritedBox(c) { const rows = inheritedRows(c); if (!rows.length) return '';
  return h`<section class="sec"><h2 class="sec-title">From the previous owner · confirm while you’re here</h2><div class="list">${rows.map(r => h`<div class="row static"><span class="row-main"><span class="row-title">${r.title}</span><span class="row-sub">${r.q}</span><span class="btnrow">${r.id === 'daa' ? h`${btn('Confirm', 'inh', { data: { id: 'daa', a: 'ok' } })}${btn('Correct', 'go', { data: { to: 'tellmeonce' } })}` : btn('Check now', 'inh', { data: { id: r.id, a: 'go' } })}${btn('Leave open', 'inh', { kind: 'link', data: { id: r.id, a: 'skip' } })}</span></span></div>`)}</div></section>`; }
register('visit-start', {
  tab: 'today',
  render(c, r) {
    const extra = c.ui.visitExtra ?? !!r.extra, d = c.draft(key(extra)), q1 = reviewDue(c.ph, 'Q1'), ws = worthSeeing(c.ph), all = c.ui.wsAll;
    return screen({ title: 'Start a visit', back: true, body: h`
      <div class="seg">${[[false, 'Quarterly visit'], [true, 'Extra visit']].map(([v, l]) => h`<button class="${v === extra ? 'on' : ''}" data-act="kind" data-v="${v ? 1 : ''}">${l}</button>`)}</div>
      <p class="muted">${extra ? 'An extra visit doesn’t change your quarterly date' + (q1 ? ' (' + fmt(q1) + ')' : '') + '.' : 'This counts as your quarterly visit' + (q1 ? ' (due ' + fmt(q1) + ')' : '') + '. You set the next one when you finish.'}</p>
      ${d ? note(h`You started this visit on ${fmt(d.date)}. Your answers are saved.`, 'ok') : ''}
      ${inheritedBox(c)}
      ${ws.length ? h`<section class="sec"><h2 class="sec-title">Worth seeing while you’re there</h2><div class="list">${(all ? ws : ws.slice(0, 3)).map(w => row({ title: w.title, sub: w.why, act: 'ws', data: { a: w.act, id: w.id } }))}</div>${ws.length > 3 && !all ? btn('Show all ' + ws.length, 'wsall', { kind: 'link' }) : ''}</section>` : ''}
      ${btn(d ? 'Resume the checks' : 'Start the checks', 'begin', { kind: 'primary', cls: 'block' })}
      ${btn('Copy a list for the pharmacist on duty', 'copy', { kind: 'link' })}` });
  },
  acts: {
    kind: (c, d) => { c.ui.visitExtra = !!d.v; c.rerender(); }, wsall: c => { c.ui.wsAll = true; c.rerender(); },
    inh: (c, d) => { if (d.a === 'skip') { c.ui.inhSkip = [...(c.ui.inhSkip || []), d.id]; c.rerender(); return; }
      if (d.id === 'daa') { c.change(ph => { (ph.changes ??= []).push({ id: 'confirm-' + Date.now(), type: 'confirm', service: 'daa', from: [], to: (ph.services.daa.answers?.routes || 'house').split(','), items: {}, at: new Date().toISOString() }); }, 'Confirmed'); return; }
      const [sid, k] = d.id.split('/'); c.ui['ss:' + sid] = Math.max(0, questionIndex(c.ph, sid, k)); c.go('service-setup', { id: sid }); },
    ws: (c, d) => c.go(d.a, { id: d.id }),
    begin: (c, d, el, r) => { const extra = c.ui.visitExtra ?? !!r.extra; c.ui.visitExtra = undefined; if (!c.draft(key(extra))) c.saveDraft(key(extra), { date: today(), items: {}, vacc: {}, notes: '', next: '', step: 0 }); c.replace('visit', { extra }); },
    copy: async c => { const ws = worthSeeing(c.ph); const t = c.ph.name + ' · site visit ' + fmt(today()) + '\n' + (ws.length ? ws.map(w => '- ' + w.title + ' (' + w.why + ')').join('\n') : 'Nothing open from earlier visits.') + '\nNo patient names or identifiers, please.';
      if (await copyText(t)) { c.toast('Copied. Paste it into a message.'); } else { c.toast('Copy didn’t work here. Long-press to select the list instead.'); } },
  },
});
register('visit', {
  tab: 'today',
  render(c, r) {
    const k = key(r.extra), d = c.draft(k); if (!d) return screen({ title: 'Site visit', back: true, body: empty('This visit has finished.') });
    const items = visitItems(c.ph), first = items.findIndex(it => !d.items[it.key]?.status), step = Math.min(d.step ?? (first < 0 ? items.length : first), items.length);
    const prog = h`<div class="prog">${items.map((it, i) => h`<i class="${i === step ? 'cur' : d.items[it.key]?.status === 'issue' ? 'bad' : d.items[it.key]?.status ? 'done' : ''}"></i>`)}</div>`;
    const title = r.extra ? 'Extra visit' : 'Quarterly visit';
    if (step >= items.length) return finish(c, r, d, items, prog, title);
    const it = items[step], a = d.items[it.key] || {}, last = lastVisitIssue(c.ph, it.key);
    const stillOpen = openFromVisits(c.ph).filter(x => x.source.item === it.title);
    return screen({ title, back: true, saved: 'Saved', body: h`${prog}
      <p class="steps">Check ${step + 1} of ${items.length}</p><h2 class="big-title">${it.title}</h2>
      ${why('What to check', it.guide)}
      ${last ? note(h`Last time (${fmt(last.date)}): ${last.text}${last.closed ? ' · fixed ' + fmt(last.closed) : ''}`, last.closed ? 'ok' : 'warn') : ''}
      ${stillOpen.map(x => h`<div class="card wait"><p class="eyebrow">Still open from an earlier visit</p><p>${x.title}</p>${btn('Seen the fix? Close it', 'ws', { data: { id: x.id } })}</div>`)}
      <form data-form="ans" class="form" data-change="ans">${choice('status', ANS.map(([v, l]) => ({ value: v, label: l })), a.status || '', { issueValues: ['issue'] })}
        ${a.status === 'issue' ? h`${field('What did you find?', textArea('text', a.text || '', { rows: 2 }))}${field('Fix by', textInput('due', a.due || addDays(today(), 30), { type: 'date' }))}
          ${(() => { const open = Object.values(c.ph.actions).filter(x => x.status === 'open'); return open.length ? field('Already an open action for this?', select('link', [['', 'No, raise a new action'], ...open.map(x => [x.id, 'Link to: ' + x.title.slice(0, 70)])], a.link || '')) : ''; })()}` : ''}
        ${it.block ? h`<div class="card"><p class="eyebrow">${it.block[0]}</p><ul class="plain">${it.block[1].map(x => h`<li>${x}</li>`)}</ul></div>` : ''}
        ${a.status === 'verify' ? field('What do you need to check?', textArea('text', a.text || '', { rows: 2 })) : ''}
        ${!it.core && a.status && a.status !== 'na' ? h`<div class="card"><p class="field-label">${it.service === 'daa' ? 'DAA operational sample since the last visit' : 'Evidence you looked at'}</p>
          ${choice('ev', (it.service === 'daa' ? ['Verified operational review', 'No new verification', 'Gap identified'] : ['Evidence reviewed', 'Issue identified', 'Unable to verify']).map(v => ({ value: v, label: v })), a.ev || '', { issueValues: ['Gap identified', 'Issue identified'] })}
          ${field('Evidence reference (optional, no patient details)', textInput('ref', a.ref || '', { placeholder: it.service === 'daa' ? 'e.g. packing check log, week of 10 Nov' : 'e.g. fridge log folder' }))}</div>` : ''}
        ${it.service === 'vaccination' ? vacc(d.vacc || {}) : ''}
      </form>
      <div class="btnrow">${btn('Previous', 'step', { data: { s: step - 1 }, disabled: step === 0 })}${btn(step === items.length - 1 ? 'Finish' : 'Next', 'step', { kind: 'primary', data: { s: step + 1 } })}</div>` });
  },
  changes: {
    ans: (c, el, r) => { const form = el.closest('form'); const k = key(r.extra), d = structuredClone(c.draft(k)); const its = visitItems(c.ph), f0 = its.findIndex(x => !d.items[x.key]?.status), it = its[d.step ?? (f0 < 0 ? 0 : f0)]; const f = Object.fromEntries(new FormData(form));
      d.items[it.key] = { ...(d.items[it.key] || {}), status: f.status || '', text: f.text ?? d.items[it.key]?.text ?? '', due: f.due ?? d.items[it.key]?.due ?? '', ref: f.ref ?? d.items[it.key]?.ref ?? '', link: f.link ?? d.items[it.key]?.link ?? '', ev: f.ev ?? d.items[it.key]?.ev ?? '' };
      if ('vaccEvent' in f || 'vaccSighted' in f) d.vacc = { event: f.vaccEvent || '', sighted: f.vaccSighted || '', auditDate: f.vaccDate || '' };
      d.step = its.indexOf(it);
      const redraw = (f.ev || '') !== (c.draft(k).items[it.key]?.ev || '') || (f.status || '') !== (c.draft(k).items[it.key]?.status || '') || ('vaccSighted' in f && f.vaccSighted !== c.draft(k).vacc?.sighted);
      c.saveDraft(k, d); if (redraw) c.rerender(); },
  },
  acts: {
    step: (c, dd, el, r) => { const k = key(r.extra), d = structuredClone(c.draft(k)); d.step = Math.max(0, +dd.s); c.saveDraft(k, d); c.rerender(); window.scrollTo(0, 0); },
    ws: (c, d) => c.go('action', { id: d.id }),
    save: (c, d, el, r) => save(c, r),
    discard: (c, d, el, r) => { if (c.ui.discardArmed !== r.extra) { c.ui.discardArmed = r.extra; c.toast('Tap “Discard this visit” again to delete its answers.'); return; } c.ui.discardArmed = undefined; c.saveDraft(key(r.extra), null); c.back(); c.toast('Visit discarded'); },
  },
  forms: { fin: () => {} },
});
function vacc(v) {
  return h`<div class="card"><p class="field-label">Since the last visit, was there a cold-chain breach or fridge failure?</p>${choice('vaccEvent', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], v.event || '', { inline: true })}
    <p class="field-label">Did you see this year’s vaccine storage self-audit?</p>${choice('vaccSighted', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }], v.sighted || '', { inline: true })}
    ${v.sighted === 'yes' ? field('Self-audit date', textInput('vaccDate', v.auditDate || '', { type: 'date', max: today() })) : ''}</div>`;
}
function finish(c, r, d, items, prog, title) {
  const missing = items.map((it, i) => ({ it, i, a: d.items[it.key] || {} })).filter(x => !x.a.status || (x.a.status === 'issue' && !x.a.text?.trim()));
  const issues = items.filter(it => d.items[it.key]?.status === 'issue').length;
  const q1 = reviewDue(c.ph, 'Q1'), next = d.next || (r.extra ? '' : addMonths(today(), 3));
  return screen({ title, back: true, saved: 'Saved', body: h`${prog}<h2 class="big-title">Finish the visit</h2>
    ${missing.length ? h`<section class="sec"><h2 class="sec-title">Still to answer · ${missing.length}</h2><div class="list">${missing.map(x => row({ title: x.it.title, sub: x.a.status === 'issue' ? 'Say what you found' : 'Not answered yet', act: 'step', data: { s: x.i } }))}</div></section>`
      : note(issues ? issues + (issues === 1 ? ' issue becomes an action.' : ' issues become actions.') + ' You close each one once you’ve seen it fixed.' : 'Every check answered. No issues.', issues ? 'warn' : 'ok')}
    <form class="form" data-form="fin" data-change="fin">${field('Visit note (optional)', textArea('notes', d.notes || '', { rows: 3 }))}
      ${r.extra ? note('Your quarterly visit date stays ' + (q1 ? fmt(q1) : 'unset') + '.') : field('Next quarterly visit', textInput('next', next, { type: 'date', min: today() }))}</form>
    ${btn('Save visit', 'save', { kind: 'primary', cls: 'block', disabled: missing.length > 0 })}
    ${btn('Discard this visit', 'discard', { kind: 'link' })}` });
}
register('visit-fin-hook', { render: () => '' });
function save(c, r) {
  const k = key(r.extra), d = c.draft(k), items = visitItems(c.ph);
  const form = document.querySelector('form[data-form=fin]'); const f = form ? Object.fromEntries(new FormData(form)) : {};
  if (items.some(it => !d.items[it.key]?.status)) return;
  c.change(ph => {
    const rec = addRecord(ph, { type: 'Q1', kind: 'visit', extra: !!r.extra, title: r.extra ? 'Extra site visit' : 'Site visit', date: d.date, notes: (f.notes || '').trim(), next: r.extra ? '' : f.next,
      answers: items.map(it => { const a = d.items[it.key]; return { item: it.key, text: it.title, answer: C.visit.answerText[a.status] || a.status, isIssue: a.status === 'issue', note: (a.text || '').trim(), ref: a.ref || '' }; }),
      fields: { vacc: d.vacc || {}, serviceEvidence: Object.fromEntries(items.filter(it => !it.core && d.items[it.key]?.ev).map(it => [it.service, { status: d.items[it.key].ev, ref: d.items[it.key].ref || '' }])) } });
    for (const it of items) { const a = d.items[it.key]; if (a.status !== 'issue') continue;
      if (a.link && ph.actions[a.link]?.status === 'open') { const la = ph.actions[a.link]; la.log.push({ at: new Date().toISOString(), by: rec.by, kind: 'updated', text: 'Seen again at the ' + (r.extra ? 'extra visit' : 'site visit') + ' on ' + d.date + ': ' + a.text.trim() }); rec.actionIds.push(la.id); continue; }
      const ac = newAction(ph, { title: a.text.trim(), due: a.due, source: { type: 'visit', recordId: rec.id, label: (r.extra ? 'Extra visit' : 'Site visit') + ' · ' + d.date, item: it.title } }); rec.actionIds.push(ac.id); }
    if (!r.extra && isDate(f.next)) ph.schedule.Q1 = f.next;
  }, 'Visit saved');
  c.saveDraft(k, null); c.tab('today');
}
