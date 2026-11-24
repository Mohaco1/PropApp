// Services (mode 3): a checklist after core setup (To do / In progress / Done), then each service's questions one per
// screen, using the current app's question rules (procgen.js: options, wording, which questions show, how answers save).
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, row, field, textInput, textArea, choice, note, why, empty, pill } from '../ui.js';
import { C } from '../content.js';
import { RPH, visibleFields, tidyAnswers } from '../procgen.js';
import { catalog, applies, serviceName, suggestedNext } from '../rules.js';
import { today, addDays, fmt } from '../dates.js';
import { note as log } from '../model.js';
const NV = 'Needs verification';
const ROLE_SHOW = v => v === 'Pharmacist in charge' ? 'The pharmacist on duty' : v; // owner decision: no pharmacist-in-charge role
const show = (id, k, v) => ROLE_SHOW(RPH.qm.showFor(id, k, v));
const split = v => RPH.qm.split(v);
function fieldsFor(ph, id) { const a = ph.services[id]?.answers || {}; return visibleFields(ph, id, a).map(f => ({ key: f[0], label: f[1], options: f[2], section: f[3], extra: f[4] })); }
const ROUTES = [['house', 'We pack on site'], ['routeA', 'We dispense, an outside packer packs'], ['routeB', 'Another pharmacy dispenses and packs']];
function kindOf(id, f) {
  if (id === 'daa' && f.key === 'routes') return 'routes';
  const m = RPH.qm.metaFor(id, f.key);
  if (RPH.sq.PROC[id]?.[f.key]) return 'proc';
  if ((RPH.sq.REC[id] || []).includes(f.key) || m.type === 'location') return 'location';
  if (m.type) return m.type;
  return f.options ? 'single' : 'text';
}
const answered = (a, k) => a[k] !== undefined && String(a[k]).trim() !== '';
export function serviceProgress(ph, id) { const a = ph.services[id]?.answers || {}, fs = fieldsFor(ph, id); const n = fs.filter(f => answered(a, f.key)).length; return { n, total: fs.length, later: fs.filter(f => a[f.key] === NV).length }; }
register('services', {
  tab: 'more',
  render(c) {
    const S = c.ph.services, act = Object.keys(S).filter(k => S[k].active), off = C.services.services.filter(s => !S[s.id]?.active);
    const lead = needsLead(c.ph);
    return screen({ title: 'Services', back: true, body: h`
      <p class="muted">Each service asks a few questions about how your pharmacy does it. Your answers write its draft procedure and set its reviews.</p>
      ${lead ? h`<div class="card hero"><h2>Who runs your services day to day?</h2><p class="muted">Asked once and used for every service.</p>${btn('Answer', 'go', { kind: 'primary', data: { to: 'lead' } })}</div>` : ''}
      <div class="list">${act.length ? act.map(id => { const s = S[id], p = serviceProgress(c.ph, id); const st = s.setup === 'done' ? ['Done', 'ok'] : p.n ? ['In progress · ' + p.n + ' of ' + p.total, 'warn'] : ['To do', ''];
        return row({ title: serviceName(id), sub: p.later ? p.later + ' to check later' : '', right: st[0], tone: st[1], act: 'open', data: { id } }); }) : empty('No services yet.')}</div>
      ${why('Add a service · ' + off.length, h`<div class="list">${off.map(s => row({ title: s.name, sub: s.frequency, right: 'Add', act: 'add', data: { id: s.id } }))}</div>`)}` });
  },
  acts: {
    open: (c, d) => c.go(c.ph.services[d.id].setup === 'done' ? 'service' : 'service-setup', { id: d.id }),
    add: (c, d) => { c.change(ph => { ph.services[d.id] = { ...(ph.services[d.id] || { answers: {} }), active: true, setup: 'todo' }; log(ph, 'Service added · ' + serviceName(d.id)); }, serviceName(d.id) + ' added'); },
  },
});
function needsLead(ph) { return !ph.lead && Object.keys(ph.services).some(id => ph.services[id].active && (RPH.sq.LEAD[id] || []).length); }
register('lead', {
  tab: 'more',
  render(c) { const opts = ['Pharmacist in charge', 'Designated pharmacist', 'Proprietor', 'Someone else'];
    return screen({ title: 'Day to day', back: true, body: h`<h2 class="big-title">Who runs your services day to day?</h2><p class="muted">For example, who handles exceptions and escalations. You stay responsible overall.</p>
      <form class="form" data-form="save">${choice('lead', opts.map(v => ({ value: v, label: ROLE_SHOW(v) })), c.ph.lead || '')}${field('If someone else, who (role, not a name is fine)', textInput('other', ''))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f) => { if (!f.lead) return; c.change(ph => { ph.lead = f.lead === 'Someone else' && f.other ? 'Someone else: ' + f.other.trim() : f.lead; }, 'Saved'); c.back(); } },
});
register('service-setup', {
  tab: 'more',
  render(c, r) {
    const id = r.id, s = c.ph.services[id]; if (!s) return screen({ title: 'Service', back: true, body: empty('Not found.') });
    if (needsLead(c.ph) && (RPH.sq.LEAD[id] || []).length) return screen({ title: serviceName(id), back: true, body: h`<p>First, one question for all services.</p>${btn('Who runs your services day to day?', 'go', { kind: 'primary', data: { to: 'lead' } })}` });
    const fs = fieldsFor(c.ph, id), a = s.answers || {}, step = Math.min(c.ui['ss:' + id] ?? fs.findIndex(f => !answered(a, f.key)), fs.length);
    const idx = step < 0 ? fs.length : step;
    const prog = h`<div class="prog">${fs.map((f, i) => h`<i class="${i === idx ? 'cur' : answered(a, f.key) ? 'done' : ''}"></i>`)}</div>`;
    if (idx >= fs.length) return doneScreen(c, id, prog);
    const f = fs[idx], m = RPH.qm.metaFor(id, f.key), k = kindOf(id, f), v = a[f.key] || '', label = m.label || f.label;
    let input;
    if (k === 'single' || k === 'role') { const opts = RPH.qm.optionsFor(id, [f.key, f.label, f.options]); input = h`${choice('v', [...opts.map(o => ({ value: o, label: show(id, f.key, o) })), { value: NV, label: 'Check later' }], split(v)[0]?.split(':')[0] === v.split(':')[0] ? v.split(':')[0] : v)}
      ${(m.describe || ['Different local arrangement', 'Someone else']).some(o => v.startsWith(o)) ? field('Describe', textInput('d', v.includes(':') ? v.slice(v.indexOf(':') + 1).trim() : '')) : ''}`; }
    else if (k === 'multi') { const opts = RPH.qm.optionsFor(id, [f.key, f.label, f.options]); const on = split(v);
      input = h`<div class="ticks">${opts.map(o => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${on.some(x => x === o || x.startsWith(o + ':')) ? h`checked` : ''}><span>${show(id, f.key, o)}</span></label>`)}</div>
      ${(m.describe || []).some(o => on.some(x => x.startsWith(o))) ? field('Describe', textInput('d', (on.find(x => x.includes(':')) || '').split(':').slice(1).join(':').trim())) : ''}
      <label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'routes') { const on = split(v); input = h`<p class="muted">Tick each that applies.</p><div class="ticks">${ROUTES.map(([o, l]) => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${on.includes(o) ? h`checked` : ''}><span>${l}</span></label>`)}</div><label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'checklist') { const items = RPH.qm.checkItems(id, f.key, a); const on = split(v);
      input = h`${m.source ? h`<p class="muted">${m.source}</p>` : ''}<div class="ticks">${items.map(it => h`<label class="tick"><input type="checkbox" name="m" value="${it.v}" ${on.includes(it.v) ? h`checked` : ''}><span>${it.t}</span></label>`)}</div>
      <p class="hint">Tick only what is already in place. Anything not ticked becomes one action to confirm.</p>`; }
    else if (k === 'location') { const on = split(v.split(' — ')[0]); const detail = v.includes(' — ') ? v.slice(v.indexOf(' — ') + 3) : '';
      input = h`<div class="ticks">${RPH.sq.REC_BASE.map(o => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${on.includes(o) ? h`checked` : ''}><span>${o}</span></label>`)}</div>
      ${field('Where exactly? (optional)', textInput('d', detail, { placeholder: 'e.g. DAA consent folder, dispensary shelf 2' }), 'Used in the procedure so anyone can find it.')}
      <label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'proc') { const p = RPH.sq.PROC[id][f.key]; input = h`${choice('v', [{ value: 'Draft it for me', label: 'Draft it for me' }, { value: 'We have our own procedure', label: 'We have our own procedure' }, { value: NV, label: 'Check later' }], v.split(':')[0])}
      ${v.startsWith('We have our own') ? field('Where is it kept?', textInput('d', v.split(':').slice(1).join(':').trim())) : ''}${why('What “Draft it for me” writes', p.text)}`; }
    else input = h`${textInput('d', v === NV ? '' : v, { placeholder: 'Type your answer' })}<label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`;
    return screen({ title: serviceName(id), back: true, saved: 'Saved', body: h`${prog}<p class="steps">Question ${idx + 1} of ${fs.length}</p>
      <form class="form" data-form="next" data-change="ans"><p class="qtext">${label}</p>${m.note ? h`<p class="muted">${m.note}</p>` : ''}${input}</form>
      <div class="btnrow">${btn('Previous', 'step', { data: { s: idx - 1 }, disabled: idx === 0 })}${btn(idx === fs.length - 1 ? 'Finish' : 'Next', 'step', { kind: 'primary', data: { s: idx + 1 } })}</div>` });
  },
  changes: { ans: (c, el, r) => { const form = el.closest('form'), id = r.id, fs = fieldsFor(c.ph, id), a = c.ph.services[id].answers || {};
    const idx = Math.min(c.ui['ss:' + id] ?? fs.findIndex(f => !answered(a, f.key)), fs.length); const f = fs[idx < 0 ? 0 : idx]; if (!f) return;
    const k = kindOf(id, f), fd = new FormData(form), d = (fd.get('d') || '').toString().trim(), nv = fd.get('nv');
    let v;
    if (nv) v = NV;
    else if (k === 'routes') v = fd.getAll('m').join(',');
    else if (k === 'multi' || k === 'checklist') { const on = fd.getAll('m'); v = on.map(o => d && (RPH.qm.metaFor(id, f.key).describe || []).includes(o) ? o + ': ' + d : o).join(','); if (k === 'checklist' && !v) v = 'None confirmed yet'; }
    else if (k === 'location') { const on = fd.getAll('m'); v = on.join(',') + (d ? (on.length ? ' — ' : '') + d : ''); }
    else if (k === 'text') v = d;
    else { const ch = (fd.get('v') || '').toString(); v = d && (ch.startsWith('We have our own') || RPH.qm.describes(id, f.key, ch)) ? ch + ': ' + d : ch; }
    const before = a[f.key];
    c.change(ph => { const s = ph.services[id]; s.answers = { ...s.answers, [f.key]: v }; if (s.setup === 'todo') s.setup = 'doing';
      if (k === 'routes') { const r = split(v); ph.flags = { ...ph.flags, house: r.includes('house'), routeA: r.includes('routeA'), routeB: r.includes('routeB') }; } });
    c.ui['ss:' + id] = idx; if (before !== v) c.rerender(); } },
  acts: { step: (c, d, el, r) => { c.ui['ss:' + r.id] = Math.max(0, +d.s); c.rerender(); window.scrollTo(0, 0); },
    finish: (c, d, el, r) => finishService(c, r.id), dates: (c, d, el, r) => saveDates(c, r.id) },
});
function svcReviews(ph, id) { return catalog().filter(a => a.service === id); }
function doneScreen(c, id, prog) {
  const p = serviceProgress(c.ph, id), revs = svcReviews(c.ph, id);
  return screen({ title: serviceName(id), back: true, body: h`${prog}<h2 class="big-title">What happens next</h2>
    ${p.later ? note(p.later + (p.later === 1 ? ' answer is' : ' answers are') + ' marked “Check later”. They stay on Today until you confirm them.', 'warn') : note('Every question answered.', 'ok')}
    <section class="sec"><h2 class="sec-title">Its reviews</h2><div class="list">${revs.map(a => { const ap = applies({ ...c.ph, services: { ...c.ph.services, [id]: { ...c.ph.services[id], active: true } } }, a); return row({ title: a.name, sub: ap.applies ? a.frequency + (c.ph.schedule[a.id] ? ' · due ' + fmt(c.ph.schedule[a.id]) : ' · first due ' + fmt(suggestedNext(c.ph, a.id, today()) || today())) : ap.why, chev: false }); })}</div></section>
    <section class="sec"><h2 class="sec-title">Its procedure</h2><p class="muted">A draft is written from your answers in Procedures. Nothing is approved until you adopt it.</p></section>
    ${btn('Finish ' + serviceName(id), 'finish', { kind: 'primary', cls: 'block' })}` });
}
function finishService(c, id) {
  c.change(ph => { const s = ph.services[id]; s.answers = tidyAnswers(ph, id, { ...s.answers }); s.setup = 'done';
    for (const a of catalog().filter(x => x.service === id && !x.event)) if (!ph.schedule[a.id] && applies(ph, a).applies) ph.schedule[a.id] = suggestedNext(ph, a.id, today());
    log(ph, 'Setup finished · ' + serviceName(id)); }, serviceName(id) + ' set up. Its review dates are in the Calendar.');
  c.ui['ss:' + id] = undefined; c.replace('service', { id });
}
register('service', {
  tab: 'more',
  render(c, r) {
    const id = r.id, s = c.ph.services[id], fs = fieldsFor(c.ph, id), a = s.answers || {};
    const proc = c.ph.procedures.find(p => p.service === id);
    return screen({ title: serviceName(id), back: true, body: h`<p>${pill(s.setup === 'done' ? 'Set up' : 'Setup not finished', s.setup === 'done' ? 'ok' : 'warn')}</p>
      <div class="btnrow">${btn('Edit answers', 'edit')}${btn(proc ? 'Open procedure' : 'Draft its procedure', 'go', { data: { to: 'procedure', id } })}</div>
      <section class="sec"><h2 class="sec-title">Your answers</h2><div class="list">${fs.map((f, i) => row({ title: RPH.qm.metaFor(id, f.key).label || f.label, sub: a[f.key] === NV ? 'Check later' : a[f.key] ? split(a[f.key]).map(v => (ROUTES.find(r => r[0] === v) || [])[1] || show(id, f.key, v)).join(', ') : 'Not answered', tone: a[f.key] === NV ? 'warn' : '', act: 'q', data: { i } }))}</div></section>
      ${btn('Stop offering this service', 'stop', { kind: 'link' })}` });
  },
  acts: { edit: (c, d, el, r) => { c.ui['ss:' + r.id] = 0; c.go('service-setup', { id: r.id }); }, q: (c, d, el, r) => { c.ui['ss:' + r.id] = +d.i; c.go('service-setup', { id: r.id }); },
    stop: (c, d, el, r) => { if (c.ui.stopArmed !== r.id) { c.ui.stopArmed = r.id; c.toast('Tap again to stop offering ' + serviceName(r.id) + '. Past records stay.'); return; } c.ui.stopArmed = ''; c.change(ph => { ph.services[r.id].active = false; log(ph, 'Service stopped · ' + serviceName(r.id)); }, 'Stopped. Past records are kept.'); c.back(); } },
});

// First review dates (current app's "Review due dates" step): suggested, changed if you like, saved by you.
const FIRST = { B1: 14, Q1: 30 };
export function undated(ph) { return catalog().filter(a => !a.event && a.id !== 'A1' && applies(ph, a).applies && !ph.schedule[a.id]); }
register('first-dates', {
  tab: 'today',
  render(c) { const list = undated(c.ph);
    return screen({ title: 'Plan your first dates', back: true, body: h`<p class="muted">Suggested dates for each review's first time. Change any of them, then save. You can move a date later, with a reason.</p>
      <form class="form" data-form="save">${list.length ? list.map(a => field(a.name + (a.legal ? ' · required by law' : '') + ' · ' + a.frequency.toLowerCase(), textInput(a.id, FIRST[a.id] ? addDays(today(), FIRST[a.id]) : suggestedNext(c.ph, a.id, today()), { type: 'date', min: today() }))) : empty('Every review has a date.')}
      ${list.length ? h`<div class="dock-inline">${btn('Save these dates', null, { kind: 'primary', type: 'submit' })}</div>` : ''}</form>` }); },
  forms: { save: (c, f) => { c.change(ph => { let n = 0; for (const [k, v] of Object.entries(f)) if (v && !ph.schedule[k]) { ph.schedule[k] = v; n++; } log(ph, 'Review due dates saved · ' + n); }, 'Dates saved'); c.back(); } },
});
