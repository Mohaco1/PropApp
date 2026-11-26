// Services (mode 3): a checklist after core setup (To do / In progress / Done), then each service's questions one per
// screen, using the current app's question rules (procgen.js: options, wording, which questions show, how answers save).
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, row, field, textInput, textArea, choice, note, why, empty, pill } from '../ui.js';
import { C } from '../content.js';
import { QLD_OPTS, RPH, visibleFields, tidyAnswers, draftText } from '../procgen.js';
import { uid } from '../util.js';
import { catalog, applies, serviceName, suggestedNext, reviewById } from '../rules.js';
import { today, addDays, fmt } from '../dates.js';
import { note as log, newAction } from '../model.js';
const NV = 'Needs verification';
const procWord = t => String(t).replace(/\(Policies\)/g, '(Procedures)').replace(/\bin Policies\b/g, 'in Procedures');
const ROLE_SHOW = v => v === 'Pharmacist in charge' ? 'The pharmacist on duty' : v; // owner decision: no pharmacist-in-charge role
const show = (id, k, v) => ROLE_SHOW(RPH.qm.showFor(id, k, v));
const split = v => RPH.qm.split(v);
// Owner trial (26 Nov): an option whose own name has a comma ("Creams, ointments and gels") was split in two when read
// back, so its tick never showed. Ticked options are matched against the whole stored list instead.
// Trial batch 1: "Places & systems". Everything already typed for a software, system or "where exactly" question in
// this pharmacy is offered as a one-tap chip under the next such box. Tapping fills the box (it's then saved like typing);
// nothing is filled on its own.
// Trial batch 1: plainer wording for questions the owner found unclear, with one line on why it's asked.
// [new question, why we ask, hide the old note]
const ABOUT = { adherence: 'Medicine adherence support means structured help for patients to take their medicines as prescribed, such as dose administration aids (DAAs) and MedsCheck reviews.' };
const COPY = {
  'Does your pharmacy’s NSW Health approval to dose OTP patients have any special conditions? (optional)': ['Does your NSW Health letter approving OTP dosing here list any extra conditions? Most don’t: leave it blank if yours doesn’t.', 'If it does (for example, a maximum number of patients), the procedure lists them so whoever is dosing follows them.', true],
  'Software used to record doses': ['Which software records OTP doses?', 'The procedure names it, so a locum knows where to record each dose. Tap one you’ve used before, or type it.'],
  'How often are OTP patient files reviewed?': ['How often do you review OTP patient files?', 'No fixed legal interval has been found for this. Quarterly is suggested because it fits your four quarters; every six months or yearly is fine if that suits you.', true],
  'Do you supply THC-containing (Schedule 8) medicinal cannabis products?': ['Do you supply any Schedule 8 medicinal cannabis? That’s anything with THC, including CBD-dominant (Category 2) products.', 'Only CBD-only products with 98% or more CBD (TGA Category 1) are Schedule 4. Anything else is Schedule 8, so your S8 storage and register apply. A Schedule 3 low-dose CBD entry exists, but no product is registered under it (TGA).', true],
  'Software used for OTP patient files': ['Which software holds OTP patient files?', 'The procedure tells staff where to find a patient’s OTP file.'],
};
function places(ph, skip) { const out = new Set();
  for (const [sid, s] of Object.entries(ph.services || {})) { if (!s.active) continue; for (const f of fieldsFor(ph, sid)) { const k = kindOf(sid, f), v = s.answers?.[f.key];
    if (!v || v === NV || (sid + '/' + f.key) === skip) continue;
    if (k === 'text' && v.length <= 60) out.add(v.trim());
    if (k === 'location' && v.includes(' — ')) { const d = v.slice(v.indexOf(' — ') + 3).trim(); if (d && d.length <= 60) out.add(d); }
    if (k === 'proc' && v.startsWith('We have our own:')) { const d = v.split(':').slice(1).join(':').trim(); if (d && d.length <= 60) out.add(d); } } }
  return [...out].slice(0, 8); }
const placeChips = (ph, skip, cur) => { const xs = places(ph, skip).filter(x => x !== cur); return xs.length ? h`<div class="chips placechips" role="group" aria-label="Used before">${xs.map(x => h`<button type="button" class="chip" data-act="place" data-v="${x}">${x}</button>`)}</div>` : ''; };
// Chaos test fix 4: the text typed for an "Other (describe)" option can contain commas, so it's read back whole (up to
// the next real option, if any) instead of being cut at its first comma.
function descOf(v, describe, opts) { const s = String(v || ''); for (const o of describe) { const i = s.indexOf(o + ':'); if (i < 0) continue;
  let rest = s.slice(i + o.length + 1), cut = rest.length;
  for (const x of opts) { if (x === o) continue; const j = rest.indexOf(',' + x); if (j >= 0 && j < cut && (rest[j + 1 + x.length] === undefined || rest[j + 1 + x.length] === ',' || rest[j + 1 + x.length] === ':')) cut = j; }
  return rest.slice(0, cut).trim(); } return ''; }
const norm = x => String(x || '').split(',').map(y => y.trim()).join(',');
const has = (v, o) => { const s = ',' + norm(v) + ',', n = norm(o); return s.includes(',' + n + ',') || s.includes(',' + n + ':'); };
function fieldsFor(ph, id) { const a = ph.services[id]?.answers || {}; const all = visibleFields(ph, id, a).map(f => ({ key: f[0], label: f[1], options: f[2], section: f[3], extra: f[4] }));
  // Record-location questions come last, as an optional step (overnight brief S3-04).
  return [...all.filter(f => kindOf(id, f) !== 'location'), ...all.filter(f => kindOf(id, f) === 'location')]; }
const isLoc = (id, f) => kindOf(id, f) === 'location';
const ROUTES = [['house', 'We pack on site'], ['routeA', 'We dispense, an outside packer packs'], ['routeB', 'Another pharmacy dispenses and packs']];
function kindOf(id, f) {
  if (id === 'daa' && f.key === 'routes') return 'routes';
  const m = RPH.qm.metaFor(id, f.key);
  if (RPH.sq.PROC[id]?.[f.key]) return 'proc';
  if ((RPH.sq.REC[id] || []).includes(f.key) || m.type === 'location') return 'location';
  // Owner trial: "software" questions are typed answers. They were drawn as a text box but saved as if they had options,
  // so the typed name was lost and Next stayed put (Staged supply Q2, Vaccination Q3, OTP dose and file software).
  if (m.type === 'software') return 'text';
  if (m.type) return m.type;
  return f.options ? 'single' : 'text';
}
const answered = (a, k) => a[k] !== undefined && String(a[k]).trim() !== '';
export function questionIndex(ph, id, key) { return fieldsFor(ph, id).findIndex(f => f.key === key); }
export function questionLabel(ph, id, key) { const f = fieldsFor(ph, id).find(x => x.key === key); return f ? (RPH.qm.metaFor(id, key).label || f.label) : key; }
export function serviceProgress(ph, id) { const a = ph.services[id]?.answers || {}, fs = fieldsFor(ph, id); const n = fs.filter(f => answered(a, f.key)).length; return { n, total: fs.length, later: fs.filter(f => a[f.key] === NV).length }; }
register('services', {
  tab: 'more',
  render(c) {
    const S = c.ph.services, act = Object.keys(S).filter(k => S[k].active), off = C.services.services.filter(s => !S[s.id]?.active);
    const lead = needsLead(c.ph);
    return screen({ title: 'Services', back: true, body: h`
      <p class="muted">Each service asks a few questions about how your pharmacy does it. Your answers write its draft procedure and set its reviews.</p>
      ${c.ui.justDone && act.some(k => S[k].setup !== 'done') ? (() => { const nx = act.find(k => S[k].setup !== 'done'); return h`<div class="card hero"><p class="eyebrow">${serviceName(c.ui.justDone)} is set up</p><h2>Next: ${serviceName(nx)}</h2><div class="btnrow">${btn('Set up ' + serviceName(nx), 'open', { kind: 'primary', data: { id: nx } })}${btn('Back to Today', 'tab', { data: { tab: 'today' } })}</div></div>`; })() : c.ui.justDone ? note('All your services are set up.', 'ok') : ''}
      ${lead ? h`<div class="card hero"><h2>Who runs your services day to day?</h2><p class="muted">Asked once and used for every service.</p>${btn('Answer', 'go', { kind: 'primary', data: { to: 'lead' } })}</div>` : ''}
      <div class="list">${act.length ? act.map(id => { const s = S[id], p = serviceProgress(c.ph, id); const st = s.setup === 'done' ? ['Done', 'ok'] : p.n && p.n >= p.total ? ['Answered · tap to finish', 'warn'] : p.n ? ['In progress', 'warn'] : ['To do', ''];
        return row({ title: serviceName(id), sub: p.later ? p.later + ' to check later' : '', right: st[0], tone: st[1], act: 'open', data: { id } }); }) : empty('No services yet.')}</div>
      ${why('Add a service · ' + off.length, h`<div class="list">${off.map(s => row({ title: s.name, sub: s.frequency, right: 'Add', act: 'add', data: { id: s.id } }))}</div>`)}` });
  },
  acts: {
    open: (c, d) => { c.ui.justDone = null; c.go(c.ph.services[d.id].setup === 'done' ? 'service' : 'service-setup', { id: d.id }); },
    add: (c, d) => { c.change(ph => { ph.services[d.id] = { ...(ph.services[d.id] || { answers: {} }), active: true, setup: 'todo' }; log(ph, 'Service added · ' + serviceName(d.id)); }, serviceName(d.id) + ' added'); },
  },
});
function needsLead(ph) { return !ph.lead && Object.keys(ph.services).some(id => ph.services[id].active && (RPH.sq.LEAD[id] || []).length); }
// C-09: the "who runs your services" question, shown in place on the first service's setup (no extra screen).
function leadScreen(c, from) { const opts = ['Pharmacist in charge', 'Designated pharmacist', 'Proprietor', 'Someone else'];
  return screen({ title: 'Day to day', back: true, body: h`<h2 class="big-title">Who runs your services day to day?</h2>${from ? h`<p class="note ok">Asked once for all your services. Then you’ll carry on with ${serviceName(from)}.</p>` : ''}<p class="muted">For example, who handles exceptions and escalations. You stay responsible overall.</p><p class="whyask"><b>Why we ask:</b> each procedure names this person as the one staff go to when something unusual happens. It doesn’t change who’s responsible: that’s always you.</p>
      <form class="form" data-form="leadsave">${choice('lead', opts.map(v => ({ value: v, label: ROLE_SHOW(v) })), c.ph.lead || '')}${field('If someone else, who (role, not a name is fine)', textInput('other', ''))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` });
}
const leadSave = (c, f, after) => { if (!f.lead) return; c.change(ph => { ph.lead = f.lead === 'Someone else' && f.other ? 'Someone else: ' + f.other.trim() : f.lead; }, 'Saved'); after(); };
register('lead', {
  tab: 'more',
  render(c, r) { return leadScreen(c, r?.from); },
  forms: { leadsave: (c, f) => leadSave(c, f, () => c.back()) },
});
const SETUP = {
  tab: 'more',
  render(c, r) {
    const id = r.id, s = c.ph.services[id]; if (!s) return screen({ title: 'Service', back: true, body: empty('Not found.') });
    if (needsLead(c.ph) && (RPH.sq.LEAD[id] || []).length) return leadScreen(c, id);
    const fs = fieldsFor(c.ph, id), a = s.answers || {}, step = Math.min(c.ui['ss:' + id] ?? s.pos ?? fs.findIndex(f => !answered(a, f.key)), fs.length);
    const idx = step < 0 ? fs.length : step;
    const prog = h`<div class="prog">${fs.map((f, i) => h`<i class="${i === idx ? 'cur' : answered(a, f.key) ? 'done' : ''}"></i>`)}</div>`;
    if (idx >= fs.length) return doneScreen(c, id, prog);
    const f = fs[idx], m = RPH.qm.metaFor(id, f.key), k = kindOf(id, f), v = a[f.key] || '', label = m.label || f.label;
    const locs = fs.filter(x => isLoc(id, x));
    if (k === 'location' && idx === fs.indexOf(locs[0]) && !s.recIntro && c.ui.returnTo?.id !== id) return screen({ title: serviceName(id), back: true, body: h`${prog}
      ${ABOUT[id] ? h`<p class="whyask"><b>What this is:</b> ${ABOUT[id]}</p>` : ''}
      <h2 class="big-title">Where you keep records · optional now</h2><p class="muted">${locs.length === 1 ? '1 question' : locs.length + ' questions'} about where records are kept, so a procedure can tell someone where to look. Answer them now, or skip and confirm them later from Today.</p>
      <div class="list">${locs.map(x => row({ title: procWord(RPH.qm.metaFor(id, x.key).label || x.label), sub: a[x.key] ? (a[x.key] === NV ? 'Check later' : a[x.key]) : '', chev: false }))}</div>
      <div class="btnrow">${btn('Answer now', 'recnow', { kind: 'primary' })}${btn('Skip for now', 'recskip')}</div>` });
    let input;
    if (k === 'single' || k === 'role') { let opts = RPH.qm.optionsFor(id, [f.key, f.label, f.options]);
      // Trial batch 1: for OTP file reviews, Quarterly is listed first as the suggestion (it fits the four quarters); nothing is picked for the owner.
      if (id === 'otp' && f.key === 'fileFrequency' && opts.includes('Quarterly')) opts = ['Quarterly', ...opts.filter(o => o !== 'Quarterly')]; input = h`${choice('v', [...opts.map(o => ({ value: o, label: show(id, f.key, o) })), { value: NV, label: 'Check later' }], split(v)[0]?.split(':')[0] === v.split(':')[0] ? v.split(':')[0] : v)}
      ${(m.describe || ['Different local arrangement', 'Someone else']).some(o => v.startsWith(o)) ? field('Describe', textInput('d', v.includes(':') ? v.slice(v.indexOf(':') + 1).trim() : '')) : ''}`; }
    else if (k === 'multi' && id === 'vaccination' && f.key === 'vaccines') { const on = split(v);
      input = h`${RPH.sq.VGROUPS.map(([g, list]) => h`<fieldset class="field vgroup"><legend class="field-label">${g}</legend>${btn('Select all', 'vall', { kind: 'link', data: { g } })}<div class="ticks">${list.map(o => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${has(v, o) ? h`checked` : ''}><span>${o}</span></label>`)}</div></fieldset>`)}
      <label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'multi') { const qldGate = id === 'prescribing' && f.key === 'pathway', qld = s.qld === 'yes';
      const opts = RPH.qm.optionsFor(id, [f.key, f.label, f.options]).filter(o => !qldGate || qld || !QLD_OPTS.has(o) || has(v, o)); const on = split(v);
      input = h`${qldGate ? h`<div class="card qldgate"><p class="field-label">Does any pharmacist here hold Queensland-pathway training (the expanded conditions, or JCU training for starting the pill)?</p><div class="chips">${[['yes', 'Yes, show those conditions'], ['no', 'No']].map(([k2, l]) => h`<button type="button" class="chip ${(s.qld || 'no') === k2 ? 'on' : ''}" data-act="qld" data-v="${k2}">${l}</button>`)}</div></div>` : ''}<div class="ticks">${opts.map(o => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${has(v, o) ? h`checked` : ''}><span>${show(id, f.key, o)}</span></label>`)}</div>
      ${(m.describe || []).some(o => has(v, o)) ? field('Describe', textInput('d', descOf(v, m.describe || [], opts))) : ''}
      <label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'routes') { const on = split(v); input = h`<p class="muted">Tick each that applies.</p><div class="ticks">${ROUTES.map(([o, l]) => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${has(v, o) ? h`checked` : ''}><span>${l}</span></label>`)}</div><label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'checklist') { const items = RPH.qm.checkItems(id, f.key, a); const on = split(v);
      input = h`${m.source ? h`<p class="muted">${m.source}</p>` : ''}<div class="ticks">${items.map(it => h`<label class="tick"><input type="checkbox" name="m" value="${it.v}" ${has(v, it.v) ? h`checked` : ''}><span>${it.t}</span></label>`)}</div>
      <p class="hint">Tick only what is already in place. Anything not ticked becomes one action to confirm.</p>`; }
    else if (k === 'location') { const on = split(v.split(' — ')[0]); const detail = v.includes(' — ') ? v.slice(v.indexOf(' — ') + 3) : '';
      input = h`<div class="ticks">${RPH.sq.REC_BASE.map(o => h`<label class="tick"><input type="checkbox" name="m" value="${o}" ${has(v.split(' — ')[0], o) ? h`checked` : ''}><span>${o}</span></label>`)}</div>
      ${field('Where exactly? (optional)', textInput('d', detail, { placeholder: 'e.g. DAA consent folder, dispensary shelf 2' }), 'Used in the procedure so anyone can find it.')}${placeChips(c.ph, id + '/' + f.key, detail)}
      <label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`; }
    else if (k === 'proc') { const p = RPH.sq.PROC[id][f.key]; input = h`${choice('v', [{ value: 'Draft it for me', label: 'Draft it for me' }, { value: 'We have our own procedure', label: 'We have our own procedure' }, { value: NV, label: 'Check later' }], v.split(':')[0])}
      ${v.startsWith('We have our own') ? h`${field('Where is it kept?', textInput('d', v.split(':').slice(1).join(':').trim()))}${placeChips(c.ph, id + '/' + f.key, v.split(':').slice(1).join(':').trim())}` : ''}${why('What “Draft it for me” writes', procWord(p.text))}`; }
    else input = h`${textInput('d', v === NV ? '' : v, { placeholder: 'Type your answer' })}${placeChips(c.ph, id + '/' + f.key, v)}<label class="tick"><input type="checkbox" name="nv" value="1" ${v === NV ? h`checked` : ''}><span>Check later</span></label>`;
    const maxQ = (C.services.setupFields[id] || []).length;
    return screen({ title: serviceName(id), back: true, saved: 'Saved', body: h`${prog}<p class="steps">Question ${idx + 1}${maxQ > fs.length ? ' · more may follow, depending on your answers' : ' of ' + fs.length}</p>
      ${window.PROPAPP_UAT ? h`<div class="uatq"><span>UAT · this question:</span>${['Could be usual', 'Must always ask', 'No opinion'].map(x => h`<button class="chip ${window.uatMarkOf?.(id + '/' + f.key) === x ? 'on' : ''}" data-act="uatq" data-k="${id + '/' + f.key}" data-v="${x}">${x}</button>`)}</div>` : ''}
      ${idx === 0 && ABOUT[id] ? h`<p class="whyask"><b>What this is:</b> ${ABOUT[id]}</p>` : ''}<form class="form" data-form="next" data-change="ans"><p class="qtext">${procWord(COPY[label]?.[0] || label)}</p>${COPY[label]?.[1] ? h`<p class="whyask"><b>Why we ask:</b> ${COPY[label][1]}</p>` : ''}${m.note && !COPY[label]?.[2] ? h`<p class="muted">${procWord(m.note)}</p>` : ''}${input}</form>
      ${c.ui.returnTo?.id === id ? h`<div class="btnrow">${btn('Save and back to the procedure', 'ret', { kind: 'primary', cls: 'block' })}</div>` : h`<div class="btnrow">${btn('Previous', 'step', { data: { s: idx - 1 }, disabled: idx === 0 })}${btn(idx === fs.length - 1 ? 'Finish' : 'Next', 'step', { kind: 'primary', data: { s: idx + 1 } })}</div>`}` });
  },
  changes: { ans: (c, el, r, ev, quiet) => { if (!quiet) c.ui.answerAt = Date.now(); const form = el.closest('form'), id = r.id, fs = fieldsFor(c.ph, id), a = c.ph.services[id].answers || {};
    const idx = Math.min(c.ui['ss:' + id] ?? fs.findIndex(f => !answered(a, f.key)), fs.length); const f = fs[idx < 0 ? 0 : idx]; if (!f) return;
    // A real answer always replaces "Check later"; ticking "Check later" itself sets it.
    const k = kindOf(id, f), fd = new FormData(form), d = (fd.get('d') || '').toString().trim(), nv = ev?.target?.name === 'nv' ? fd.get('nv') : (ev?.target?.name ? null : fd.get('nv'));
    let v;
    if (nv) v = NV;
    else if (k === 'routes') v = fd.getAll('m').join(',');
    else if (k === 'multi' || k === 'checklist') { const on = fd.getAll('m'); v = on.map(o => d && (RPH.qm.metaFor(id, f.key).describe || []).includes(o) ? o + ': ' + d : o).join(','); if (k === 'checklist' && !v) v = 'None confirmed yet'; }
    else if (k === 'location') { const on = fd.getAll('m'); v = on.join(',') + (d ? (on.length ? ' — ' : '') + d : ''); }
    else if (k === 'text') v = d;
    else { const ch = (fd.get('v') || '').toString(); v = d && (ch.startsWith('We have our own') || RPH.qm.describes(id, f.key, ch)) ? ch + ': ' + d : ch; }
    const before = a[f.key];
    // A typed box (software, "where exactly", where a procedure is kept) is saved without redrawing: nothing on screen
    // depends on it, and redrawing as the box loses focus swallowed the owner's tap on Next.
    const typed = ev?.target?.name === 'd' && (k === 'text' || k === 'location' || k === 'proc' || k === 'multi' || k === 'single');
    c.change(ph => { const s = ph.services[id]; s.answers = { ...s.answers, [f.key]: v }; if (s.setup === 'todo') s.setup = 'doing';
      if (k === 'routes') { const r = split(v); ph.flags = { ...ph.flags, house: r.includes('house'), routeA: r.includes('routeA'), routeB: r.includes('routeB') }; } }, '', { redraw: !(typed || quiet) });
    c.ui['ss:' + id] = idx; if (before !== v && !quiet && !typed) c.rerender(); } },
  // Owner trial: Next or Previous saves whatever is typed in the box first, so a typed answer is never lost.

  forms: { fin: (c, f, el, r) => finishService(c, r.id, f), leadsave: (c, f) => leadSave(c, f, () => c.rerender()) },
  // Chaos test fix 2: switching the Queensland question to No also removes any Queensland-only conditions already ticked,
  // so "no Queensland training" and a Queensland condition can't both be saved.
  acts: { qld: (c, d) => c.change(ph => { const sv = ph.services.prescribing; sv.qld = d.v; if (d.v === 'no' && sv.answers?.pathway) sv.answers = { ...sv.answers, pathway: split(sv.answers.pathway).filter(o => !QLD_OPTS.has(o)).join(',') }; }, d.v === 'yes' ? 'Queensland-pathway conditions shown' : 'Queensland-pathway conditions hidden'),
    place: (c, d, el) => { const form = el.closest('form'), inp = form?.querySelector('input[name=d]'); if (!inp) return; inp.value = d.v; inp.dispatchEvent(new Event('change', { bubbles: true })); },
    uatq: async (c, d) => { await window.uatMark?.(d.k, d.v); c.rerender(); },
    vall: (c, d, el) => { const fs = el.closest('fieldset'); fs.querySelectorAll('input[type=checkbox]').forEach(i => { i.checked = true; }); fs.closest('form').dispatchEvent(new Event('change', { bubbles: true })); },
    // Chaos test fixes: a second forward tap on Next within 400 ms, with no answer given in between, is ignored (10);
    // Previous is never blocked (hardening brief); and the answer and step are written
    // to storage straight away, so reloading right after Next loses nothing (1).
    step: (c, d, el, r) => { const now = Date.now(), fwd = +d.s > (c.ui['ss:' + r.id] ?? -1); if (fwd && now - (c.ui.stepAt || 0) < 400 && (c.ui.answerAt || 0) < c.ui.stepAt) return; if (fwd) c.ui.stepAt = now;
      const form = document.querySelector('main form[data-form=next]'), inp = form?.querySelector('input[name=d]'); if (inp && inp.value.trim()) SETUP.changes.ans(c, form, r, { target: inp }, true);
      const s = Math.max(0, +d.s); c.ui['ss:' + r.id] = s; c.change(ph => { ph.services[r.id].pos = s; }); c.store.flush(); window.scrollTo(0, 0); },
    recnow: (c, d, el, r) => c.change(ph => { ph.services[r.id].recIntro = 'now'; }),
    recskip: (c, d, el, r) => { const fs = fieldsFor(c.ph, r.id); c.change(ph => { const s = ph.services[r.id]; s.recIntro = 'skipped'; for (const f of fs.filter(x => isLoc(r.id, x))) if (!answered(s.answers, f.key)) s.answers[f.key] = NV; s.pos = fs.length; if (s.setup === 'todo') s.setup = 'doing'; }, 'Skipped. They are on Today under “To confirm”.'); c.ui['ss:' + r.id] = fs.length; c.rerender(); },
    finish: (c, d, el, r) => finishService(c, r.id),
    ret: (c, d, el, r) => { c.ui.returnTo = null; c.ui['ss:' + r.id] = undefined;
      c.change(ph => { const p = ph.procedures.find(x => x.service === r.id); if (!p || p.status === 'adopted') return; const v = p.versions.at(-1), t = draftText(ph, r.id);
        if (!v.edited && t && t !== v.generated) { const m = String(v.v).match(/^(\d+)\.(\d+)/); p.versions.push({ v: m ? m[1] + '.' + (+m[2] + 1) : '0.1', body: t, generated: t, at: new Date().toISOString(), status: 'Draft' }); log(ph, 'Procedure redrafted from a setup answer · ' + serviceName(r.id)); } }, 'Saved. The draft is updated.');
      c.back(); } },
};
register('service-setup', SETUP);
function svcReviews(ph, id) { return catalog().filter(a => a.service === id); }
function doneScreen(c, id, prog) {
  const p = serviceProgress(c.ph, id), probe = { ...c.ph, services: { ...c.ph.services, [id]: { ...c.ph.services[id], active: true } } };
  let revs = svcReviews(c.ph, id).filter(a => !a.event && applies(probe, a).applies); const events = svcReviews(c.ph, id).filter(a => a.event);
  const inVisit = svcReviews(c.ph, id).some(a => !a.event && /site visit/.test(applies(probe, a).why || ''));
  if (inVisit) revs = [{ ...reviewById('Q1'), name: 'Proprietor site visit (' + serviceName(id) + ' is checked here)' }, ...revs];
  return screen({ title: serviceName(id), back: true, body: h`${prog}<h2 class="big-title">What happens next</h2>
    ${p.later ? note(p.later + (p.later === 1 ? ' answer is' : ' answers are') + ' marked “Check later”. They stay on Today until you confirm them.', 'warn') : note('Every question answered.', 'ok')}
    <form class="form" data-form="fin">
    ${revs.length ? h`<section class="sec"><h2 class="sec-title">Its reviews · first dates</h2><p class="muted">Suggested dates. Change any of them.</p>${revs.map(a => field(a.name + ' · ' + a.frequency.toLowerCase(), textInput('d:' + a.id, c.ph.schedule[a.id] || suggestedNext(c.ph, a.id, today()), { type: 'date', min: today() })))}</section>` : ''}
    ${events.length ? h`<p class="muted">${events.map(a => a.name).join(', ')}: done when you start or change the service.</p>` : ''}
    <section class="sec"><h2 class="sec-title">Its procedure</h2><p class="muted">Finishing writes a draft procedure from your answers (version 0.1) in Procedures. Nothing is adopted until you say so.</p></section>
    <div class="dock-inline">${btn(revs.length ? 'Save dates and finish' : 'Finish setup', null, { kind: 'primary', type: 'submit', cls: 'block' })}</div></form>` });
}
// Setup actions (current app's "setup-answer-tasks" rule): a 2026 checklist with unticked items raises one action, and
// some answers raise a follow-up. Due in 30 days (otp-parts rule). Never raised twice while one is open.
export function setupActions(ph, id) {
  const a = ph.services[id].answers || {};
  const open = k => Object.values(ph.actions).some(t => t.status === 'open' && t.source?.type === 'service' && t.source.service === id && t.source.issue === k);
  for (const f of visibleFields(ph, id, a)) { const k = f[0], m = RPH.qm.metaFor(id, k);
    if (m.type === 'checklist' && m.checkTask) { const missing = RPH.qm.checkItems(id, k, a).filter(i => !split(a[k]).includes(i.v));
      if (missing.length && !open(k)) { const t = newAction(ph, { title: m.checkTask + ' · ' + serviceName(id), due: addDays(today(), 30), source: { type: 'service', service: id, issue: k, label: serviceName(id) + ' setup' } }); t.log.push({ at: new Date().toISOString(), by: '', kind: 'updated', text: 'Not yet confirmed: ' + missing.map(i => i.t).join('; ') + (m.source ? ' · Source: ' + m.source : '') }); }
      continue; }
    for (const [value, text] of Object.entries(m.task || {})) if (RPH.qm.has(a[k], value) && !open(k)) newAction(ph, { title: text + ' · ' + serviceName(id), due: addDays(today(), 30), source: { type: 'service', service: id, issue: k, label: serviceName(id) + ' setup' } });
  }
}
function finishService(c, id, f = {}) {
  c.change(ph => { const s = ph.services[id]; s.answers = tidyAnswers(ph, id, { ...s.answers }); s.setup = 'done'; setupActions(ph, id);
    for (const a of catalog().filter(x => x.service === id && !x.event)) { if (!applies(ph, a).applies) continue; const v = f['d:' + a.id]; if (v) ph.schedule[a.id] = v; else if (!ph.schedule[a.id]) ph.schedule[a.id] = suggestedNext(ph, a.id, today()); }
    if (f['d:Q1']) ph.schedule.Q1 = f['d:Q1'];
    if (!ph.procedures.some(p => p.service === id)) { const t = draftText(ph, id); if (t) ph.procedures.push({ id: uid(), service: id, title: serviceName(id) + ' procedure', status: 'draft', versions: [{ v: '0.1', body: t, generated: t, at: new Date().toISOString(), status: 'Draft' }] }); }
    log(ph, 'Setup finished · ' + serviceName(id)); }, serviceName(id) + ' set up. Its draft procedure is in Procedures.');
  c.ui['ss:' + id] = undefined; c.ui.justDone = id; c.replace('services');
}
register('service', {
  tab: 'more',
  render(c, r) {
    const id = r.id, s = c.ph.services[id], fs = fieldsFor(c.ph, id), a = s.answers || {};
    const proc = c.ph.procedures.find(p => p.service === id);
    return screen({ title: serviceName(id), back: true, body: h`<p>${pill(s.setup === 'done' ? 'Set up' : 'Setup not finished', s.setup === 'done' ? 'ok' : 'warn')}</p>
      <div class="btnrow">${btn('Edit answers', 'edit')}${btn(proc ? 'Open procedure' : 'Draft its procedure', 'go', { data: { to: 'procedure', id } })}</div>
      ${id === 'daa' ? btn('Change how DAAs are packed', 'go', { kind: 'link', data: { to: 'tellmeonce' } }) : ''}
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

// "Your OTP procedure": one screen for the OTP Standards item 1 parts (current app's otp-parts layer).
const SHORT = { 'Pharmacist responsibilities': 'Pharmacist responsibilities', 'Accounting and records': 'Accounting and records', 'Secure storage': 'Secure storage (incl. LAIB cold chain)', 'Clinical interventions': 'Clinical interventions and communication', 'Equipment maintenance': 'Dosing equipment maintenance', 'Takeaway doses': 'Takeaway doses', 'Staff training records': 'Staff training records' };
function otpParts(ph) { const a = ph.services.otp?.answers || {}, items = RPH.qm.checkItems('otp', 'otpGovernance', a), have = split(a.otpGovernance);
  const local = [['incidents', 'Missed doses and intoxicated patients'], ['incidentProcess', 'Reporting and notifying OTP incidents'], ...(visibleFields(ph, 'otp', a).some(f => f[0] === 'films') ? [['films', 'Supervising film doses']] : [])];
  return [...items.map(it => ({ key: 'g:' + it.v, title: SHORT[it.v] || it.v, sub: it.t, on: have.includes(it.v) })), ...local.map(([k, l]) => ({ key: 'l:' + k, title: l, sub: 'Your own steps, following current NSW OTP guidance.', on: String(a[k] || '').startsWith('We have our own') }))]; }
export const otpPartsLeft = ph => { const p = otpParts(ph); return { left: p.filter(x => !x.on).length, total: p.length }; };
register('otp-parts', {
  tab: 'actions',
  render(c) { const parts = otpParts(c.ph), sel = c.ui.otpSel || Object.fromEntries(parts.map(p => [p.key, p.on])); c.ui.otpSel = sel; const n = Object.values(sel).filter(Boolean).length;
    return screen({ title: 'Your OTP procedure', back: true, body: h`<p class="status">${n} of ${parts.length} parts written</p>
      <p class="muted">The OTP Standards (November 2026, item 1) require these to be clearly documented at the pharmacy. Mark each part when your written procedure covers it. Nothing is marked for you.</p>
      <div class="list">${parts.map(p => h`<div class="row static"><span class="row-main"><span class="row-title">${p.title}</span><span class="row-sub">${p.sub}</span></span><span class="seg mini">${[[true, 'Written'], [false, 'To write']].map(([v, l]) => h`<button class="${sel[p.key] === v ? 'on' : ''}" data-act="mark" data-k="${p.key}" data-v="${v ? 1 : ''}">${l}</button>`)}</span></div>`)}</div>
      ${btn('Save', 'save', { kind: 'primary', cls: 'block' })}` }); },
  acts: { mark: (c, d) => { c.ui.otpSel[d.k] = !!d.v; c.rerender(); },
    save: c => { const sel = c.ui.otpSel; c.change(ph => { const s = ph.services.otp, a = s.answers, items = RPH.qm.checkItems('otp', 'otpGovernance', a), g = items.filter(it => sel['g:' + it.v]).map(it => it.v);
      const next = { ...a, otpGovernance: g.length ? g.join(',') : 'None confirmed yet' }; for (const k of ['incidents', 'incidentProcess', 'films']) if ('l:' + k in sel) next[k] = sel['l:' + k] ? (String(a[k] || '').startsWith('We have our own') ? a[k] : 'We have our own procedure: In our OTP procedure') : 'Draft it for me';
      s.answers = tidyAnswers(ph, 'otp', next); log(ph, 'Updated OTP procedure parts'); }, Object.values(sel).every(Boolean) ? 'Saved. Every part is written: close the action when you’re happy with it.' : 'Saved'); c.ui.otpSel = null; c.back(); } },
});
