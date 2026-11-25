// Welcome (owner's note): wordmark, one line, one button. Setup is 3 short steps; services are set up afterwards.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, field, textInput, note, icon } from '../ui.js';
import { emptyPharmacy, note as log } from '../model.js';
import { C } from '../content.js';
import { uid } from '../util.js';
import { importBackup } from './backup.js';
register('welcome', {
  noNav: true,
  render(c) {
    if (c.ui.setupStep === undefined) { const saved = c.store.getPref('setup-draft'); if (saved) { c.ui.setup = saved.setup; c.ui.setupStep = saved.step; } }
    const step = c.ui.setupStep || 0;
    if (step === 0) return h`<div class="welcome">
      <div class="wm" aria-label="Sigil"><span class="wm-mark" aria-hidden="true">S.</span>Sigil</div>
      <p class="wm-line">Built for the owner’s side of the counter.</p>
      <p class="muted wm-sub">Your legal and best-practice duties as a pharmacy owner, in one calm place.</p>
      ${btn('Set up your pharmacy', 'start-setup', { kind: 'primary', cls: 'big' })}
      <div class="welcome-more">
        <label class="linkbtn">Restore a backup<input type="file" accept="application/json,.json" data-change="restore" hidden></label>
        ${window.PROPAPP_EXAMPLE ? btn('Look around an example pharmacy (fictional)', 'example', { kind: 'link' }) : ''}
      </div></div>`;
    const d = c.ui.setup || (c.ui.setup = { name: '', address: '', owners: [''], services: [] });
    const head = h`<p class="steps">Step ${step} of 3</p>`;
    if (step === 1) return screen({ title: 'Your pharmacy', back: true, body: h`${head}
      <form data-form="s1" class="form">${field('Pharmacy name', textInput('name', d.name, { required: true }))}${field('Address', textInput('address', d.address))}
      <p class="hint">Fictional details only while testing.</p><div class="dock-inline">${btn('Continue', null, { kind: 'primary', type: 'submit' })}</div></form>` });
    if (step === 2) return screen({ title: 'Owners', back: true, body: h`${head}
      <p class="lead">Everyone with a financial interest in the pharmacy. You can add more later.</p>
      <form data-form="s2" class="form">${d.owners.map((o, i) => field(i ? 'Another owner' : 'Your name', textInput('owner' + i, o, { required: i === 0 })))}
      ${btn('+ Add another owner', 'add-owner', { kind: 'link' })}<div class="dock-inline">${btn('Continue', null, { kind: 'primary', type: 'submit' })}</div></form>` });
    return screen({ title: 'Services', back: true, body: h`${head}
      <p class="lead">Tick what this pharmacy offers. Each one gets a few setup questions later, from Today.</p>
      ${copyFrom(c, d)}
      <form data-form="s3" class="form"><div class="ticks">${C.services.services.map(s => h`<label class="tick"><input type="checkbox" name="svc" value="${s.id}" ${d.services.includes(s.id) ? h`checked` : ''}><span>${s.name}</span></label>`)}</div>
      <div class="dock-inline">${btn('Finish setup', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  acts: {
    // Sigil brief: copy setup from another pharmacy (services, their setup answers, procedures as drafts, quarter rhythm).
    copyfrom: (c, d) => { const s = c.ui.setup, src = d.id ? c.store.pharmacy(d.id) : null; s.copyFrom = src ? src.id : '';
      if (src) s.services = Object.entries(src.services).filter(([, v]) => v.active).map(([k]) => k); c.rerender(); },
    'start-setup': c => { c.ui.setupStep = 1; c.rerender(); },
    back: c => { c.ui.setupStep = Math.max(0, (c.ui.setupStep || 1) - 1); c.rerender(); },
    'add-owner': c => { const d = c.ui.setup; collect(d); d.owners.push(''); c.rerender(); },
    example: async c => { const { openExample } = await import('./backup.js'); openExample(c); },
  },
  changes: { restore: (c, el) => importBackup(c, el.files[0]) },
  forms: {
    s1: (c, f) => { Object.assign(c.ui.setup, { name: f.name.trim(), address: f.address.trim() }); c.ui.setupStep = 2; keep(c); c.rerender(); },
    s2: (c, f) => { c.ui.setup.owners = Object.keys(f).filter(k => k.startsWith('owner')).map(k => f[k].trim()).filter(Boolean); c.ui.setupStep = 3; keep(c); c.rerender(); },
    s3: async (c, f, form) => {
      const d = c.ui.setup; d.services = [...form.querySelectorAll('input[name=svc]:checked')].map(i => i.value);
      const ph = emptyPharmacy(d.name); ph.address = d.address;
      ph.proprietors = d.owners.map((n, i) => ({ id: uid(), name: n, primary: i === 0 })); ph.recordingAs = ph.proprietors[0].id;
      for (const s of d.services) ph.services[s] = { active: true, setup: 'todo', answers: {} };
      const src = d.copyFrom ? c.store.pharmacy(d.copyFrom) : null;
      if (src) copySetup(src, ph);
      ph.settings.setupDone = true; log(ph, 'Pharmacy set up · ' + ph.name + (src ? ' · setup copied from ' + src.name : ''));
      c.store.savePharmacy(ph); c.ui.setupStep = 0; c.ui.setup = null; c.store.setPref('setup-draft', undefined); await c.open(ph.id); c.toast('Set up. Next: your services, from Today.');
    },
  },
});
function copyFrom(c, d) {
  const others = c.store.activeIds().map(id => c.store.pharmacy(id)).filter(Boolean); if (!others.length) return '';
  return h`<div class="card"><p class="field-label">Copy setup from another pharmacy?</p><p class="muted">Copies its services, their setup answers, its procedures (as drafts for you to adopt here) and its quarter rhythm. Records, S8 dates, actions and staff start empty.</p>
    <div class="chips">${others.map(o => h`<button type="button" class="chip ${d.copyFrom === o.id ? 'on' : ''}" data-act="copyfrom" data-id="${o.id}">${o.name}</button>`)}${d.copyFrom ? h`<button type="button" class="chip" data-act="copyfrom" data-id="">Start fresh</button>` : ''}</div></div>`;
}
// Only setup carries over. Procedures arrive as drafts (adopting is always the owner's tap, per pharmacy); the other
// pharmacy's name in their text becomes this one's.
function copySetup(src, ph) {
  for (const [id, v] of Object.entries(src.services)) if (v.active && ph.services[id]) ph.services[id] = { ...ph.services[id], setup: v.setup, answers: structuredClone(v.answers || {}) };
  if (src.intervals) ph.intervals = structuredClone(src.intervals);
  if (src.quarters) ph.quarters = structuredClone(src.quarters);
  if (src.lead) ph.lead = src.lead;
  const at = new Date().toISOString();
  ph.procedures = (src.procedures || []).filter(p => ph.services[p.service]).map(p => { const v = p.versions.filter(x => x.status === 'Adopted').at(-1) || p.versions.at(-1);
    const body = String(v.body).split(src.name).join(ph.name);
    return { id: uid(), service: p.service, title: p.title, status: 'draft', versions: [{ v: '0.1', body, generated: body, at, status: 'Draft', note: 'Copied from ' + src.name }] }; });
}
function keep(c) { c.store.setPref('setup-draft', { step: c.ui.setupStep, setup: c.ui.setup }); c.store.flush(); }
function collect(d) { document.querySelectorAll('[name^=owner]').forEach((i, n) => { d.owners[n] = i.value; }); }
