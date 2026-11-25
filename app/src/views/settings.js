// Your pharmacy (mode 3): details and owners, backup and restore, pharmacies on this device, and "Tell me once" for a
// change to how DAAs are packed (current app's change.js wording and sources).
import { isPWA, standalone, keptStatus } from '../pwa.js';
import { register } from '../app.js';
import { h, uid } from '../util.js';
import { screen, btn, row, field, textInput, choice, note, why, empty, section, pill } from '../ui.js';
import { fmt, today, addDays } from '../dates.js';
import { note as log, me, newAction } from '../model.js';
import { pharmacyBackup, importBackup, openExample } from './backup.js';
import { saveFile } from '../ics.js';
import { items, counts } from '../summary.js';
import { copyText } from '../clip.js';
register('details', {
  tab: 'more',
  render(c) { const ph = c.ph;
    return screen({ title: 'Pharmacy details', back: true, body: h`<form class="form" data-form="save">${field('Pharmacy name', textInput('name', ph.name, { required: true }))}${field('Address', textInput('address', ph.address))}${field('Pharmacy identifier (optional)', textInput('identifier', ph.identifier))}
      <fieldset class="field"><legend class="field-label">Owners (everyone with a financial interest)</legend>${ph.proprietors.map((p, i) => textInput('owner' + i, p.name))}${textInput('ownerNew', '', { placeholder: 'Add another owner' })}</fieldset>
      ${ph.proprietors.length > 1 ? h`<fieldset class="field"><legend class="field-label">Recording as</legend>${choice('recordingAs', ph.proprietors.map(p => ({ value: p.id, label: p.name })), ph.recordingAs)}</fieldset>` : ''}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f) => { c.change(ph => { const ch = []; for (const k of ['name', 'address', 'identifier']) if ((ph[k] || '') !== f[k].trim()) { ch.push(k); ph[k] = f[k].trim(); }
    ph.proprietors.forEach((p, i) => { const n = (f['owner' + i] || '').trim(); if (n && n !== p.name) { ch.push('owner'); p.name = n; } });
    if (f.ownerNew?.trim()) { ph.proprietors.push({ id: uid(), name: f.ownerNew.trim(), primary: false }); ch.push('owner added'); }
    if (f.recordingAs) ph.recordingAs = f.recordingAs; log(ph, 'Pharmacy details saved' + (ch.length ? ' · ' + ch.join(', ') : '')); }, 'Pharmacy details saved'); c.back(); } },
});
register('backup', {
  tab: 'more',
  render(c) { const last = c.ph.settings.lastBackup, n = c.ph.history.filter(x => !last || x.at > last).length;
    return screen({ title: 'Backup and devices', back: true, body: h`
      <div class="card"><h2>${last ? 'Last requested ' + fmt(last.slice(0, 10)) : 'No backup yet'}</h2><p class="muted">${last ? (n === 1 ? '1 change' : n + ' changes') + ' since last request.' : ''} A browser can’t tell the app whether the file was saved, so check it’s in your files. Your records are kept only in this browser on this device, so keep a backup somewhere safe (for example your email or cloud drive).</p>
        ${btn('Download a backup', 'dl', { kind: 'primary', cls: 'block' })}</div>
      ${isPWA() ? h`<div class="card" id="device"><h2>This device</h2><p class="muted">${standalone() ? 'Opened from your Home Screen.' : 'Opened in the browser. Add it to your Home Screen so your phone keeps your records: on iPhone, tap Share, then Add to Home Screen; on Android, tap ⋮, then Install app.'}</p>
        ${standalone() ? '' : h`<p class="note warn">On iPhone, the Home Screen app keeps its own records, separate from Safari. If you’ve already entered records here, download a backup first, then restore it in the Home Screen app.</p>`}
        <p class="meta">${c.ui.kept === true ? 'This browser has agreed to keep this app’s records.' : c.ui.kept === false ? 'This browser may clear the records if the phone runs short of space: keep backups.' : ''}</p></div>` : ''}
      <div class="card"><h2>Restore</h2><p class="muted">Open an R.Pharmacy backup (from this app or the earlier version). If the pharmacy is already here you’re asked before anything is replaced.</p>
        <label class="btn secondary block" style="display:grid;place-items:center">Choose a backup file<input type="file" accept="application/json,.json" data-change="restore" hidden></label></div>
      ${(() => { const cf = Object.entries(c.drafts).filter(([k]) => k.includes('/conflict-')); return h`<section class="sec"><h2 class="sec-title">Conflict copies · ${cf.length}</h2><p class="muted">If the same draft was changed in two places (for example two tabs), the newer one is kept and the other is saved here instead of being lost.</p>
        ${cf.length ? h`<div class="list">${cf.map(([k, v]) => { const n = Object.values(v.items || v.answers || {}).filter(x => x && (x.status || typeof x === 'string')).length; return h`<div class="row static"><span class="row-main"><span class="row-title">${k.startsWith('visit/') ? (k.startsWith('visit/extra') ? 'Extra visit' : 'Quarterly visit') : 'Review ' + k.split('/')[1]} · copy from ${fmt(new Date(+k.split('conflict-')[1]).toISOString().slice(0, 10))}</span><span class="row-sub">${n} answer${n === 1 ? '' : 's'}${v.notes ? ' · note: ' + v.notes : ''}${v.date ? ' · visit date ' + fmt(v.date) : ''}</span><span class="btnrow">${btn('Copy its answers', 'cfcopy', { data: { k } })}${btn('Dismiss', 'cfdel', { kind: 'link', data: { k } })}</span></span></div>`; })}</div>` : h`<p class="muted">None.</p>`}</section>`; })()}
      <section class="sec"><h2 class="sec-title">Storage on this device</h2><div class="card" id="storage"><p class="muted">Checking…</p></div></section>
      <p class="hint">If nothing downloads (some previews block files), open the app file in your phone’s browser.</p>` }); },
  after: async c => { if (isPWA() && c.ui.kept === undefined) { c.ui.kept = null; keptStatus().then(k => { c.ui.kept = k; c.rerender(); }); }
    const el = document.getElementById('storage'); if (!el) return; let txt = 'This browser doesn’t report storage details.';
    try { const e = await navigator.storage?.estimate?.(), pers = await navigator.storage?.persisted?.(); if (e) txt = 'Using ' + (e.usage / 1048576).toFixed(1) + ' MB of about ' + Math.round(e.quota / 1048576) + ' MB available. ' + (pers ? 'The browser has agreed to keep this data.' : 'The browser may clear it if the device runs short of space: keep backups.'); } catch {}
    el.innerHTML = ''; const p = document.createElement('p'); p.textContent = txt; el.append(p); },
  acts: { cfdel: (c, d) => { c.saveDraft(d.k, null); c.rerender(); c.toast('Conflict copy dismissed'); },
    cfcopy: async (c, d) => { if (await copyText(JSON.stringify(c.drafts[d.k], null, 1))) { c.toast('Copied'); } else { c.toast('Copy didn’t work here.'); } },
    dl: c => { const ok = saveFile(c.ph.name.replace(/\W+/g, '-') + '-backup-' + today() + '.json', JSON.stringify(pharmacyBackup(c)), 'application/json'); if (ok) c.change(ph => { ph.settings.lastBackup = new Date().toISOString(); }, 'Backup download requested'); } },
  changes: { restore: (c, el) => importBackup(c, el.files[0]) },
});
register('pharmacies', {
  tab: 'more',
  render(c) { const d = c.store.dir();
    return screen({ title: 'Pharmacies', back: true, body: h`${d.ids.length > 1 ? h`<div class="list">${row({ title: 'All pharmacies', sub: 'Overdue and this week, side by side', act: 'go', data: { to: 'allsites' } })}</div>` : ''}<div class="list">${d.ids.map(id => { const p = c.store.pharmacy(id); if (!p) return ''; const n = counts(items(p, c.store.drafts(id))).overdue; return row({ title: p.name, sub: (n ? n + ' overdue' : 'Nothing overdue') + (p.address ? ' · ' + p.address : ''), right: id === c.ph.id ? 'Open now' : 'Switch', tone: id === c.ph.id ? 'ok' : '', act: 'sw', data: { id } }); })}</div>
      ${btn('Set up another pharmacy', 'add')}${window.PROPAPP_EXAMPLE ? btn('Open the example pharmacy (fictional)', 'ex', { kind: 'link' }) : ''}` }); },
  acts: { sw: (c, d) => c.open(d.id), ex: c => openExample(c), add: async c => { const dd = c.store.dir(); dd.active = ''; c.store.setDir(dd); await c.store.flush(); c.ui.setupStep = 1; c.ui.setup = null; c.load(); c.rerender(); } },
});
// Tell me once: change to how DAAs are packed. Items and sources from the current app (uat/layers/change.js).
const ROUTES = [['house', 'We pack on site', 'We dispense and pack in this pharmacy'], ['routeA', 'We dispense, an outside packer packs', 'The packer works from our instructions; we stay the supplying pharmacy'], ['routeB', 'Another pharmacy dispenses and packs', 'That pharmacy becomes the supplying pharmacy']];
const SRC = { daa: 'NSW Health · Dose Administration Aids (4 Sep 2026)', faq: 'NSW Health · Pharmacists FAQ', reg: 'Medicines, Poisons and Therapeutic Goods Regulation 2026' };
function itemsFor(from, to) { const add = to.filter(k => !from.includes(k)), out = [];
  if (add.includes('routeA')) out.push({ key: 'instructions', tag: 'law', title: 'Packing instructions match each prescription', text: 'Give the packer manufacturing instructions listing each medicine, its dose and directions. You’re responsible for their accuracy.', src: SRC.daa },
    { key: 'reference', tag: 'law', title: 'Reference number on every pack', text: 'Each pack needs a reference number (a barcode or QR code is fine) linking the pack, the instructions and the prescriptions, as well as the date packed and date of birth.', src: SRC.daa + ' · ' + SRC.reg + ' s 136' },
    { key: 'supplier', tag: 'law', title: 'You’re still the supplying pharmacy', text: 'Counselling, labelling, dispensing and packing records, and packs that name this pharmacy all stay with you.', src: SRC.daa },
    { key: 'licence', tag: 'check', title: 'The packer’s TGA manufacturing licence', text: 'The FAQ says third-party packers need a TGA GMP licence; the DAA page says to ask the TGA (GMP@health.gov.au) if unsure. Note where you keep a copy.', src: SRC.faq + ' · ' + SRC.daa },
    { key: 'consent3p', tag: 'rec', title: 'Ask patients before a third party packs', text: 'NSW Health says the supplying pharmacy should get patient consent.', src: SRC.daa });
  if (add.includes('routeB')) out.push({ key: 'consentRx', tag: 'law', title: 'Patient consent before prescriptions move', text: 'Get each patient’s consent before their prescriptions go to the other pharmacy.', src: SRC.daa },
    { key: 'label', tag: 'law', title: 'Don’t label as the supplying pharmacy', text: 'The pharmacy that dispenses and packs becomes the supplying pharmacy. Packs must not show this pharmacy as supplier.', src: SRC.daa });
  out.push({ key: 'procedure', tag: 'setup', title: 'Update your DAA procedure answers', text: 'Opens the DAA setup questions, starting with how packs are made. Any new procedure wording is a draft; your current adopted version stays in use until you adopt the new one.', src: 'Your DAA procedure' });
  return out; }
const TAG = { law: 'Required by law', check: 'Check', rec: 'Recommended', setup: 'Your procedure' };
const nowRoutes = ph => (ph.services.daa?.answers?.routes ? ph.services.daa.answers.routes.split(',') : ['house']).filter(Boolean);
register('tellmeonce', {
  tab: 'more',
  render(c) {
    if (!c.ph.services.daa?.active) return screen({ title: 'DAA packing change', back: true, body: note('Dose administration aids isn’t one of your services.', 'warn') });
    const open = (c.ph.changes || []).find(x => Object.values(x.items).some(i => i.status !== 'done'));
    if (open) { const items = itemsFor(open.from, open.to);
      return screen({ title: 'DAA packing change', back: true, body: h`<p class="muted">From ${open.start ? fmt(open.start) : 'now'}: ${open.to.map(k => ROUTES.find(r => r[0] === k)[1]).join(' + ')}${open.packer ? ' · ' + open.packer : ''}.</p>
        ${note('Kept as it is: open actions, past reviews and review dates.', 'ok')}
        <div class="list">${items.map(i => { const st = open.items[i.key]?.status; return h`<div class="row static"><span class="row-main"><span class="row-title">${i.title}</span><span class="row-sub"><span class="law">${TAG[i.tag]}</span> ${i.text}</span><span class="row-sub">${i.src}</span>
          ${st === 'done' ? pill('Done', 'ok') : st === 'later' ? pill('Later · an action was raised', 'warn') : h`<span class="btnrow">${btn(i.key === 'procedure' ? 'Open DAA questions' : 'Done', 'item', { data: { k: i.key, s: 'done' } })}${i.key !== 'procedure' ? btn('Later', 'item', { kind: 'link', data: { k: i.key, s: 'later' } }) : ''}</span>`}</span></div>`; })}</div>` }); }
    const cur = nowRoutes(c.ph);
    return screen({ title: 'DAA packing change', back: true, body: h`<p class="muted">Now: ${cur.map(k => ROUTES.find(r => r[0] === k)?.[1]).join(' + ')}. Tell the app once and it lists only what depends on the change.</p>
      <form class="form" data-form="start"><fieldset class="field"><legend class="field-label">How packs will be made</legend><div class="ticks">${ROUTES.map(([k, l, s]) => h`<label class="tick"><input type="checkbox" name="to" value="${k}" ${cur.includes(k) ? h`checked` : ''}><span>${l}<span class="hint">${s}</span></span></label>`)}</div></fieldset>
      ${field('Packer or other pharmacy (optional)', textInput('packer', ''))}${field('Starting', textInput('start', today(), { type: 'date' }))}
      <div class="dock-inline">${btn('Show what changes', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  forms: { start: (c, f, el) => { const to = [...el.querySelectorAll('input[name=to]:checked')].map(i => i.value); if (!to.length) { c.toast('Tick at least one.'); return; }
    c.change(ph => { const from = nowRoutes(ph); ph.changes ??= []; const items = Object.fromEntries(itemsFor(from, to).map(i => [i.key, { status: 'open' }]));
      ph.changes.push({ id: uid(), service: 'daa', from, to, packer: f.packer.trim(), start: f.start, items, at: new Date().toISOString() });
      ph.services.daa.answers = { ...ph.services.daa.answers, routes: to.join(',') }; ph.flags = { ...ph.flags, house: to.includes('house'), routeA: to.includes('routeA'), routeB: to.includes('routeB') };
      log(ph, 'DAA packing change recorded · ' + to.join(' + ')); }, 'Saved'); } },
  acts: { item: (c, d) => { const open = (c.ph.changes || []).find(x => Object.values(x.items).some(i => i.status !== 'done'));
    if (d.k === 'procedure') { c.change(ph => { ph.changes.find(x => x.id === open.id).items.procedure.status = 'done'; ph.services.daa.setup = 'doing'; }); c.ui['ss:daa'] = 0; c.go('service-setup', { id: 'daa' }); return; }
    const it = itemsFor(open.from, open.to).find(i => i.key === d.k);
    c.change(ph => { const ch = ph.changes.find(x => x.id === open.id); ch.items[d.k].status = d.s; if (d.s === 'later') newAction(ph, { title: it.title + ' (DAA packing change)', due: addDays(today(), 14), source: { type: 'change', label: 'DAA packing change' } }); }, d.s === 'done' ? 'Marked done' : 'An action was raised'); } },
});

register('receipt', {
  tab: 'today',
  render(c) { const r = c.ui.receipt || {};
    return screen({ title: 'Restored', back: true, body: h`<div class="card"><h2>${r.name}</h2><p class="muted">Restored from ${r.from}.</p>
      <ul class="plain"><li>${r.records} recorded reviews, visits and meetings</li><li>${r.actions} actions</li><li>${r.staff} staff</li><li>${r.procedures} procedures</li><li>${r.drafts} drafts in progress</li></ul></div>
      ${btn('Go to Today', 'tab', { kind: 'primary', cls: 'block', data: { tab: 'today' } })}` }); },
});
