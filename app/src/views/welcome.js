// Welcome (owner, 28 Nov): Navy Split Editorial Cover. Setup is 3 short steps; services are set up afterwards.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, field, textInput, note, icon, logo } from '../ui.js';
import * as sync from '../sync.js';
import { SYNC_ERR } from './settings.js';
import { emptyPharmacy, note as log } from '../model.js';
import { C } from '../content.js';
import { uid } from '../util.js';
import { importBackup } from './backup.js';
import { activeServices, plan, serviceName } from '../rules.js';
import { reviewDue } from '../summary.js';
import { fmt } from '../dates.js';
import { plural } from '../util.js';
register('welcome', {
  noNav: true,
  render(c) {
    if (c.ui.setupStep === undefined) { const saved = c.store.getPref('setup-draft'); if (saved) { c.ui.setup = saved.setup; c.ui.setupStep = saved.step; } }
    const step = c.ui.setupStep || 0;
    // Option 1, Navy Split Editorial Cover (28 Nov, owner): a navy hero over a white sheet on phones, side by side from 700 px.
    if (step === 0) return cover(c);
    const d = c.ui.setup || (c.ui.setup = { name: '', address: '', owners: [''], services: [] });
    const head = h`<p class="steps">Step ${step} of 3</p>`;
    if (step === 1) return screen({ title: 'Your pharmacy', back: true, body: h`${head}
      <form data-form="s1" class="form">${field('Pharmacy name', textInput('name', d.name, { required: true }), c.ui.setupErr === 'name' ? h`<span class="err">Enter the pharmacy’s name.</span>` : '')}${field('Address', textInput('address', d.address))}
      ${window.PROPAPP_UAT ? h`<p class="hint">Fictional details only while testing.</p>` : ''}<div class="dock-inline">${btn('Continue', null, { kind: 'primary', type: 'submit' })}</div></form>` });
    if (step === 2) return screen({ title: 'Owners', back: true, body: h`${head}
      <p class="lead">Everyone with a financial interest in the pharmacy. You can add more later.</p>
      <form data-form="s2" class="form">${d.owners.map((o, i) => field(i ? 'Another owner' : 'Your name', textInput('owner' + i, o, { required: i === 0 }), !i && c.ui.setupErr === 'owner' ? h`<span class="err">Enter your name.</span>` : ''))}
      ${btn('+ Add another owner', 'add-owner', { kind: 'link' })}<div class="dock-inline">${btn('Continue', null, { kind: 'primary', type: 'submit' })}</div></form>` });
    return screen({ title: 'Services', back: true, body: h`${head}
      <p class="lead">Tick what this pharmacy offers. Each one gets a few setup questions later, from Today.</p>
      ${copyFrom(c, d)}
      <form data-form="s3" class="form"><div class="ticks">${C.services.services.map(s => h`<label class="tick"><input type="checkbox" name="svc" value="${s.id}" ${d.services.includes(s.id) ? h`checked` : ''}><span>${s.name}</span></label>`)}</div>
      <div class="dock-inline">${btn('Finish setup', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  acts: {
    // PharmLedger brief: copy setup from another pharmacy (services, their setup answers, procedures as drafts, quarter rhythm).
    copyfrom: (c, d) => { const s = c.ui.setup, src = d.id ? c.store.pharmacy(d.id) : null; s.copyFrom = src ? src.id : '';
      if (src) s.services = Object.entries(src.services).filter(([, v]) => v.active).map(([k]) => k); c.rerender(); },
    'start-setup': c => { c.ui.setupStep = 1; c.ui.signin = false; c.rerender(); },
    // D3: sign in on a fresh device. Installable app only (the single-file app never shows it, so it makes no network calls).
    'signin-open': c => { if (!sync.canNetwork()) return; c.ui.signin = true; c.rerender(); document.querySelector('form[data-form=welcomelink] input[name=email]')?.focus(); },
    'signin-close': c => { c.ui.signin = false; c.rerender(); },
    // C-03: Back from Step 1 while a pharmacy is open (Set up another pharmacy) returns to it, with the setup cleared.
    back: c => { if (c.ph && (c.ui.setupStep || 1) <= 1) { c.ui.setupStep = undefined; c.ui.setup = null; c.store.setPref('setup-draft', undefined); c.store.flush(); if (c.route.name === 'welcome') c.back(); else c.rerender(); return; }
      c.ui.setupStep = Math.max(0, (c.ui.setupStep || 1) - 1); c.rerender(); },
    backto: (c, d) => { c.ui.setupStep = undefined; c.ui.setup = null; c.store.setPref('setup-draft', undefined); c.open(d.id); },
    'add-owner': c => { const d = c.ui.setup; collect(d); d.owners.push(''); c.rerender(); },
    example: async c => { const { openExample } = await import('./backup.js'); openExample(c); },
  },
  changes: { restore: (c, el) => importBackup(c, el.files[0], el) },
  forms: {
    welcomelink: async (c, f) => { if (!sync.canNetwork()) return; const email = String(f.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { const inp = document.querySelector('form[data-form=welcomelink] input[name=email]'); if (inp && !inp.parentNode.querySelector('.err')) inp.insertAdjacentHTML('afterend', '<span class="err" role="alert">Enter your email address.</span>'); inp?.setAttribute('aria-invalid', 'true'); inp?.focus(); return; }
      await sync.requestMagicLink(email); c.rerender(); },
    // Chaos test fix 3: a name of only spaces is rejected with a message (it used to crash Finish setup).
    s1: (c, f) => { if (!f.name.trim()) { c.ui.setupErr = 'name'; c.rerender(); return; } c.ui.setupErr = ''; Object.assign(c.ui.setup, { name: f.name.trim(), address: f.address.trim() }); c.ui.setupStep = 2; keep(c); c.rerender(); },
    s2: (c, f) => { const owners = Object.keys(f).filter(k => k.startsWith('owner')).map(k => f[k].trim()).filter(Boolean); if (!owners.length) { c.ui.setupErr = 'owner'; c.rerender(); return; } c.ui.setupErr = ''; c.ui.setup.owners = owners; c.ui.setupStep = 3; keep(c); c.rerender(); },
    s3: async (c, f, form) => {
      const d = c.ui.setup; d.services = [...form.querySelectorAll('input[name=svc]:checked')].map(i => i.value);
      const ph = emptyPharmacy(d.name); ph.address = d.address;
      ph.proprietors = d.owners.map((n, i) => ({ id: uid(), name: n, primary: i === 0 })); ph.recordingAs = ph.proprietors[0].id;
      for (const s of d.services) ph.services[s] = { active: true, setup: 'todo', answers: {} };
      const src = d.copyFrom ? c.store.pharmacy(d.copyFrom) : null;
      if (src) copySetup(src, ph);
      ph.settings.setupDone = true; log(ph, 'Pharmacy set up · ' + ph.name + (src ? ' · setup copied from ' + src.name : ''));
      c.store.savePharmacy(ph); c.ui.setupStep = 0; c.ui.setup = null; c.store.setPref('setup-draft', undefined); await c.open(ph.id); c.go('plan-ready');
    },
  },
});
const STEPS = [['01', 'Add your pharmacy', 'takes 30 sec'], ['02', 'Tick services you offer', 'S8, DAA, Vacc, OTP'], ['03', 'Open Today', 'obligations & SOPs ready']];
function cover(c) {
  const first = !c.ph && c.store.activeIds().map(id => c.store.pharmacy(id)).find(Boolean);
  return h`<div class="welcome cover">
    <section class="cv-hero" aria-label="PharmLedger">
      <div class="cv-top"><span class="wm-mark" aria-hidden="true">${logo(36)}</span><span class="cv-name">PharmLedger</span><span class="cv-badge">NSW · NOV 2026</span></div>
      <div class="cv-copy"><h1 class="cv-head">Built for the owner’s side of the counter.</h1>
      <p class="cv-sub">S8 stocktakes, SOPs, staff credentials, and inspection records—organised on your phone in 5 minutes a week.</p></div>
    </section>
    <section class="cv-sheet"><div class="cv-inner">
      <ol class="cv-steps">${STEPS.map(([n, t, s]) => h`<li><span class="cv-n" aria-hidden="true">${n}</span><span class="cv-step"><span class="cv-t">${t}</span><span class="cv-s">${s}</span></span></li>`)}</ol>
      <div class="cv-dock">
        ${btn('Set up your pharmacy', 'start-setup', { kind: 'primary', cls: 'big' })}
        ${sync.canNetwork() ? signIn(c) : ''}
        <div class="cv-links">${window.PROPAPP_EXAMPLE ? h`${btn('Try example', 'example', { kind: 'link' })}<span aria-hidden="true">·</span>` : ''}<label class="linkbtn">Restore backup<input type="file" accept="application/json,.json" data-change="restore" class="vh-file"></label></div>
        ${first ? h`<div class="cv-links">${btn('Back to ' + first.name, 'backto', { kind: 'link', data: { id: first.id } })}</div>` : ''}
      </div>
    </div></section></div>`;
}
// The sign-in step on Welcome: the same emailed link as More › Backup and devices. Once it is tapped, the account's
// pharmacies come down and the app opens the first one by itself.
function signIn(c) {
  const st = sync.status();
  const msg = st.signedIn ? note(st.state === 'syncing' ? 'Signed in. Bringing your pharmacies onto this device…' : st.state === 'error' || st.state === 'partial' ? 'Signed in, but your pharmacies couldn’t come across just now. Try again shortly.' : 'Signed in. No pharmacies on this account yet: set one up and it syncs.', st.state === 'error' || st.state === 'partial' ? 'warn' : 'ok')
    : st.pending ? note(st.state === 'signing-in' ? 'Signing you in…' : 'Signing you in when you’re back online.', 'ok')
    : st.state === 'link-sent' ? note('Check your email on this phone and tap the link. It works once, for 15 minutes.', 'ok')
    : st.state === 'link-failed' ? note('That sign-in link was already used or has expired. Ask for a new one.', 'warn')
    : st.state === 'link-error' ? note(SYNC_ERR[st.error] || SYNC_ERR.server, 'warn') : '';
  if (st.signedIn || st.pending) return h`<div class="cv-sync" role="status">${msg}</div>`;
  if (!c.ui.signin && st.state !== 'link-sent' && st.state !== 'link-failed' && st.state !== 'link-error') return btn('Sign in to sync existing device', 'signin-open', { cls: 'big cv-signin' });
  return h`<div class="cv-sync"><div role="status">${msg}</div>
    <form class="form cv-form" data-form="welcomelink" novalidate>${field('Email you use on your other device', textInput('email', '', { type: 'email', placeholder: 'name@example.com' }))}
    <div class="cv-row">${btn(st.state === 'link-sent' ? 'Send another link' : 'Email me a sign-in link', null, { type: 'submit', cls: 'big' })}${btn('Cancel', 'signin-close', { kind: 'link' })}</div></form></div>`;
}
// Onboarding polish: one calm card straight after Finish setup, then Today. Counts come from the pharmacy itself.
register('plan-ready', {
  noNav: true,
  render(c) {
    const ph = c.ph, svcs = activeServices(ph), drafts = (ph.procedures || []).filter(p => p.status === 'draft').length;
    const s8 = plan(ph).some(a => a.id === 'B1') ? reviewDue(ph, 'B1') : null;
    const rows = [
      ['Services', svcs.length ? plural(svcs.length, 'service') + ' · ' + svcs.map(serviceName).join(', ') : 'None yet. Add them any time from More → Services.'],
      ['Procedures', drafts ? plural(drafts, 'draft') + ' waiting in Procedures for you to adopt' : svcs.length ? plural(svcs.length, 'procedure') + ' to draft in Procedures, once each service’s questions are answered' : 'Drafted in Procedures once you add a service'],
      ...(s8 !== null ? [['S8 stocktake', s8 ? 'Next due ' + fmt(s8) : 'Every 3 months. Add your last stocktake date on Today.']] : []),
    ];
    return screen({ title: ph.name, body: h`<div class="card plan-card"><h2 class="plan-name">Here’s your pharmacy plan</h2>
      <dl class="plan-list">${rows.map(([k, v]) => h`<div class="plan-row"><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></div>
      ${svcs.length ? h`<p class="muted">Each service has a few setup questions. You’ll find them at the top of Today.</p>` : ''}
      <div class="dock-inline">${btn('Open Today', 'plan-today', { kind: 'primary', cls: 'block' })}</div>` });
  },
  acts: { 'plan-today': c => c.tab('today') },
});
// Onboarding polish: on a short screen (or with the keyboard up) a focused box never hides the step's main button.
// The page scrolls just enough to show the button, without pushing the box above the header.
export function keepButtonInView() {
  if (window.__plKeep) return; window.__plKeep = true;
  document.addEventListener('focusin', e => {
    const t = e.target; if (!t.matches?.('input.input, textarea.input')) return;
    const fit = () => { if (document.activeElement !== t) return; const b = t.closest('form')?.querySelector('.dock-inline') || t.closest('main')?.querySelector('.btnrow'); if (!b) return;
      const vv = window.visualViewport, bottom = (vv ? vv.offsetTop + vv.height : innerHeight) - 12, need = b.getBoundingClientRect().bottom - bottom;
      const room = (t.closest('.field') || t).getBoundingClientRect().top - (document.querySelector('.bar')?.getBoundingClientRect().bottom || 0) - 12;
      if (need > 0 && room > 0) window.scrollBy(0, Math.min(need, room)); };
    setTimeout(fit, 60); window.visualViewport?.addEventListener('resize', fit, { once: true });
  });
}
keepButtonInView();
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
    const swap = t => String(t ?? '').split(src.name).join(ph.name), body = swap(v.body);
    // Stage 3E: hand-edited wording stays marked as edited (with the text it was written from), so a later redraft
    // patches it instead of replacing the owner's wording with a fresh draft.
    return { id: 'proc:' + p.service, service: p.service, title: p.title, status: 'draft', versions: [{ id: uid(), v: '0.1', body, generated: v.edited && v.generated ? swap(v.generated) : body, at, status: 'Draft', note: 'Copied from ' + src.name, ...(v.edited ? { edited: true } : {}) }] }; });
  // Stage 3E: the flags the copied answers drive (how DAAs are packed, the OTP 80-a-day threshold) are rebuilt from them,
  // so the plan here has the same reviews as the answers say.
  const routes = ph.services.daa?.active ? String(ph.services.daa.answers?.routes || '').split(',').filter(Boolean) : [];
  if (routes.length) ph.flags = { ...ph.flags, house: routes.includes('house'), routeA: routes.includes('routeA'), routeB: routes.includes('routeB') };
  const vb = ph.services.otp?.active ? ph.services.otp.answers?.volumeBand : undefined; if (vb !== undefined) ph.flags = { ...ph.flags, volume: vb === 'Yes' };
}
function keep(c) { c.store.setPref('setup-draft', { step: c.ui.setupStep, setup: c.ui.setup }); c.store.flush(); }
function collect(d) { document.querySelectorAll('[name^=owner]').forEach((i, n) => { d.owners[n] = i.value; }); }
