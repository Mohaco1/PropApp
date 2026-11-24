// Procedures: drafts written from setup answers by the current app's generator (identical wording). Two buttons:
// Edit and Adopt (Gemini F-08). Each "[Confirm: …]" gap links to the question that fills it. Adopting is blocked while
// any remain (owner decision). Nothing is approved for the owner.
import { register } from '../app.js';
import { h, uid } from '../util.js';
import { screen, btn, row, field, textArea, note, empty, pill, why } from '../ui.js';
import { draftText, blockers, procWording, visibleFields } from '../procgen.js';
import { serviceName } from '../rules.js';
import { fmt, today } from '../dates.js';
import { note as log } from '../model.js';
import { questionIndex } from './services.js';
const current = p => p?.versions?.at(-1);
// Which setup question fills a "[Confirm: …]" gap: the unanswered or "Check later" question sharing the most words.
const words = t => new Set(String(t).toLowerCase().match(/[a-z0-9]{4,}/g) || []);
function bestQuestion(ph, id, gap) { const fs = visibleFields(ph, id, ph.services[id]?.answers || {}), a = ph.services[id]?.answers || {}, g = words(gap);
  let best = '', score = 0; fs.forEach(f => { const w = words(f[1]), s = [...g].filter(x => w.has(x)).length + (!a[f[0]] || a[f[0]] === 'Needs verification' ? 0.5 : 0); if (s > score) { score = s; best = f[0]; } }); return score >= 1 ? questionIndex(ph, id, best) : -1; }
register('procedures', {
  tab: 'more',
  render(c) {
    const act = Object.keys(c.ph.services).filter(k => c.ph.services[k].active);
    return screen({ title: 'Procedures', back: true, body: h`<p class="muted">Drafts are written from your setup answers and cite their sources. You adopt each one when it matches how you work.</p>
      <div class="list">${act.map(id => { const p = c.ph.procedures.find(x => x.service === id), v = current(p), b = v ? blockers(v.body) : [];
        return row({ title: serviceName(id), sub: !p ? (c.ph.services[id].setup === 'done' ? 'Ready to draft' : 'Finish its setup first') : p.status === 'adopted' ? 'Adopted · version ' + v.v : 'Draft ' + v.v + (b.length ? ' · ' + b.length + ' to confirm' : ''), right: p?.status === 'adopted' ? 'Adopted' : p ? 'Draft' : '', tone: p?.status === 'adopted' ? 'ok' : b.length ? 'warn' : '', act: 'go', data: { to: 'procedure', id } }); })}</div>
      ${c.ph.documents.length ? h`<section class="sec"><h2 class="sec-title">Other documents</h2><div class="list">${c.ph.documents.map(d => row({ title: d.title, sub: [d.ref, d.version].filter(Boolean).join(' · '), chev: false }))}</div></section>` : ''}` });
  },
});
register('procedure', {
  tab: 'more',
  render(c, r) {
    const id = r.id, p = c.ph.procedures.find(x => x.service === id), v = current(p), fresh = c.ph.services[id]?.setup === 'done' ? draftText(c.ph, id) : '';
    const mode = c.ui['pm:' + id] || '';
    if (!p) return screen({ title: serviceName(id), back: true, body: fresh ? h`<p class="muted">Here is the draft written from your answers. Save it to keep it as version 0.1.</p>${btn('Save this draft', 'save', { kind: 'primary', cls: 'block' })}<div class="doc">${fresh}</div>` : note('Finish this service’s setup questions first.', 'warn') });
    const b = blockers(v.body), changed = fresh && fresh !== v.generated && p.status !== 'adopted';
    if (mode === 'edit') return screen({ title: 'Edit wording', back: true, body: h`<form class="form" data-form="edit">${field('Procedure text', textArea('body', v.body, { rows: 18, noPatient: true }))}<div class="dock-inline">${btn('Save as new version', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'mode', { data: { m: '' } })}</div></form>` });
    return screen({ title: serviceName(id) + ' procedure', back: true, body: h`
      <p>${pill(p.status === 'adopted' ? 'Adopted · version ' + v.v : 'Draft ' + v.v, p.status === 'adopted' ? 'ok' : 'warn')} <span class="muted">${fmt(String(v.at).slice(0, 10))}</span></p>
      ${changed ? note(h`Your setup answers changed since this draft. ${btn('Update the draft', 'regen', { kind: 'link' })}`, 'warn') : ''}
      ${b.length && p.status !== 'adopted' ? h`<section class="sec"><h2 class="sec-title">To confirm before adopting · ${b.length}</h2><div class="list">${b.map(x => row({ title: x.charAt(0).toUpperCase() + x.slice(1), sub: 'Tap to answer it now', act: 'fix', data: { q: x } }))}</div></section>` : ''}
      ${c.ui['ad:' + id] ? h`<div class="card hero"><h2>Adopt version ${adoptVersion(p)} for use here?</h2><p class="muted">This records that you, ${c.ph.proprietors.find(x => x.id === c.ph.recordingAs)?.name || 'the proprietor'}, have read it and it matches how your pharmacy works. You can change it later; earlier versions are kept.</p><div class="btnrow">${btn('Yes, adopt it', 'adoptyes', { kind: 'primary' })}${btn('Cancel', 'adoptno')}</div></div>`
        : h`<div class="btnrow">${btn('Edit', 'mode', { data: { m: 'edit' } })}${p.status !== 'adopted' ? btn('Adopt for use here', 'adopt', { kind: 'primary', disabled: b.length > 0 }) : ''}</div>`}
      ${b.length && p.status !== 'adopted' ? h`<p class="hint">Adopt unlocks when nothing is left to confirm.</p>` : ''}
      <div class="doc">${v.edited ? v.body : procWording(v.body)}</div>
      ${p.versions.length > 1 ? why('Earlier versions · ' + (p.versions.length - 1), h`<div class="list">${p.versions.slice(0, -1).reverse().map(x => row({ title: 'Version ' + x.v, sub: (x.status || '') + ' · ' + fmt(String(x.at).slice(0, 10)), chev: false }))}</div>`) : ''}` });
  },
  acts: {
    mode: (c, d, el, r) => { c.ui['pm:' + r.id] = d.m; c.rerender(); },
    fix: (c, d, el, r) => { const i = bestQuestion(c.ph, r.id, d.q); if (i < 0) { c.go('service', { id: r.id }); return; } c.ui['ss:' + r.id] = i; c.ui.returnTo = { id: r.id }; c.go('service-setup', { id: r.id }); },
    save: (c, d, el, r) => c.change(ph => { ph.procedures.push({ id: uid(), service: r.id, title: serviceName(r.id) + ' procedure', status: 'draft', versions: [{ v: '0.1', body: draftText(ph, r.id), generated: draftText(ph, r.id), at: new Date().toISOString(), status: 'Draft' }] }); log(ph, 'Procedure drafted · ' + serviceName(r.id)); }, 'Draft saved'),
    regen: (c, d, el, r) => c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), t = draftText(ph, r.id); p.versions.push({ v: next(current(p).v), body: t, generated: t, at: new Date().toISOString(), status: 'Draft' }); p.status = 'draft'; log(ph, 'Procedure redrafted · ' + serviceName(r.id)); }, 'Draft updated'),
    adopt: (c, d, el, r) => { const p = c.ph.procedures.find(x => x.service === r.id); if (blockers(current(p).body).length) return; c.ui['ad:' + r.id] = true; c.rerender(); },
    adoptno: (c, d, el, r) => { c.ui['ad:' + r.id] = false; c.rerender(); },
    adoptyes: (c, d, el, r) => { c.ui['ad:' + r.id] = false;
      c.change(ph => { const q = ph.procedures.find(x => x.service === r.id), v = current(q), nv = adoptVersion(q), by = ph.proprietors.find(x => x.id === ph.recordingAs)?.name || '';
        q.versions.push({ ...v, v: nv, status: 'Adopted', at: new Date().toISOString(), adoptedAt: new Date().toISOString(), adoptedBy: by, from: v.v }); q.status = 'adopted'; log(ph, 'Procedure adopted · ' + serviceName(r.id) + ' · version ' + nv + ' (from draft ' + v.v + ') by ' + by); }, 'Adopted as version ' + adoptVersion(c.ph.procedures.find(x => x.service === r.id))); },
  },
  forms: { edit: (c, f, el, r) => { c.ui['pm:' + r.id] = ''; c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), v = current(p); p.versions.push({ v: next(v.v), body: f.body, generated: v.generated, at: new Date().toISOString(), status: 'Draft', edited: true }); p.status = 'draft'; log(ph, 'Procedure wording edited · ' + serviceName(r.id)); }, 'Saved as a new version'); } },
});
// Adopted versions are whole numbers: the first adoption is 1.0, the next 2.0. Drafts in between are 1.1, 1.2…
const adoptVersion = p => (Math.max(0, ...p.versions.filter(x => x.status === 'Adopted').map(x => parseInt(x.v, 10) || 0)) + 1) + '.0';
const next = v => { const m = String(v).match(/^(\d+)\.(\d+)/); return m ? m[1] + '.' + (+m[2] + 1) : '0.1'; };
