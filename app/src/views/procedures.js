// Procedures: drafts written from setup answers by the current app's generator (identical wording). Two buttons:
// Edit and Adopt (Gemini F-08). Each "[Confirm: …]" gap links to the question that fills it. Adopting is blocked while
// any remain (owner decision). Nothing is approved for the owner.
import { register } from '../app.js';
import { h, uid, raw } from '../util.js';
import { screen, btn, row, field, textArea, textInput, note, empty, pill, why, sheet, svcIcon } from '../ui.js';
import { draftText, blockers, procWording, visibleFields, RPH } from '../procgen.js';
import { serviceName } from '../rules.js';
import { fmt, today, day } from '../dates.js';
import { note as log, newAction } from '../model.js';
import { addDays, addMonths } from '../dates.js';
import { questionIndex } from './services.js';
const current = p => p?.versions?.at(-1);
// Annual procedure review: 12 months after the last review, or after adoption.
// F-LIVE-08: an adopted version never calls itself a draft. Only how it's shown changes; the stored text is untouched.
export const adoptedWording = (v, t) => v.status !== 'Adopted' ? t : String(t).replace(/Draft generated from (.+?)’s setup answers and the sources listed at the end\. Review it, adjust it to how you work, and (?:adopt it in Procedures|approve it in Policies)\./,
  (m, who) => 'Adopted procedure (version ' + v.v + ', adopted ' + fmt(day(v.adoptedAt || v.at)) + '), prepared from ' + who + '’s setup answers and the sources listed at the end.');
export const procReviewDue = p => addMonths(day((p.reviews || []).at(-1)?.date || p.versions.filter(v => v.status === 'Adopted').at(-1)?.adoptedAt || p.versions.at(-1).at), 12);
// Which setup question fills a "[Confirm: …]" gap: the unanswered or "Check later" question sharing the most words.
const words = t => new Set(String(t).toLowerCase().match(/[a-z0-9]{4,}/g) || []);
// Owner trial: which setup answer a gap belongs to, and whether it's already answered (then the gap is something to
// check in the text, not a question to answer again).
// The exact setup answer the generator recorded for this gap (RPH.proc.gapKey), if it's a question currently shown.
const gapKey = (ph, id, gap) => { const k = RPH.proc.gapKey?.[id + '|' + gap]; return k ? { k, shown: visibleFields(ph, id, ph.services[id]?.answers || {}).some(f => f[0] === k) } : null; };
function bestKey(ph, id, gap) { const g0 = gapKey(ph, id, gap); if (g0) return g0.shown ? g0.k : ''; const fs = visibleFields(ph, id, ph.services[id]?.answers || {}), a = ph.services[id]?.answers || {}, g = words(gap);
  let best = '', score = 0; fs.forEach(f => { const w = words(f[1]), sc = [...g].filter(x => w.has(x)).length + (!a[f[0]] || a[f[0]] === 'Needs verification' ? 0.5 : 0); if (sc > score) { score = sc; best = f[0]; } }); return score >= 1 ? best : ''; }
const answeredFor = (ph, id, gap) => { const k = bestKey(ph, id, gap), v = k ? ph.services[id]?.answers?.[k] : ''; return !!v && v !== 'Needs verification'; };
function bestQuestion(ph, id, gap) { const g0 = gapKey(ph, id, gap); if (g0?.shown) return questionIndex(ph, id, g0.k); const fs = visibleFields(ph, id, ph.services[id]?.answers || {}), a = ph.services[id]?.answers || {}, g = words(gap);
  let best = '', score = 0; fs.forEach(f => { const w = words(f[1]), s = [...g].filter(x => w.has(x)).length + (!a[f[0]] || a[f[0]] === 'Needs verification' ? 0.5 : 0); if (s > score) { score = s; best = f[0]; } }); return score >= 1 ? questionIndex(ph, id, best) : -1; }
// Trial batch 1: the procedure shown as tappable sections ("1. Purpose", "4. Procedure"…), the first one open. The
// wording is exactly the procedure's text; only the layout changes. "Open all" shows everything at once.
export function docView(text) {
  const lines = String(text).split('\n'), parts = []; let cur = { head: '', body: [] };
  for (let i = 0; i < lines.length; i++) { const l = lines[i];
    if (/^\d+\. [A-Z][^.]{0,50}$/.test(l.trim()) && (i === 0 || !lines[i - 1].trim())) { parts.push(cur); cur = { head: l.trim(), body: [] }; } else cur.body.push(l); }
  parts.push(cur);
  if (parts.length < 3) return h`<div class="doc">${text}</div>`;
  const [pre, ...secs] = parts;
  return h`<div class="docwrap"><div class="doc docpre">${pre.body.join('\n').trim()}</div>
    <p class="docall"><button type="button" class="linkbtn" data-act="docall">Open all sections</button></p>
    ${secs.map((x, i) => h`<details class="docsec"${i === 0 ? raw(' open') : ''}><summary>${x.head}</summary><div class="doc">${x.body.join('\n').trim()}</div></details>`)}</div>`;
}
register('procedures', {
  tab: 'more',
  render(c) {
    const act = Object.keys(c.ph.services).filter(k => c.ph.services[k].active);
    return screen({ title: 'Procedures', back: true, body: h`<p class="muted">Drafts are written from your setup answers and cite their sources. You adopt each one when it matches how you work.</p>
      <div class="list">${act.map(id => { const p = c.ph.procedures.find(x => x.service === id), v = current(p), b = v ? blockers(v.body) : [];
        return row({ title: serviceName(id), sub: !p ? (c.ph.services[id].setup === 'done' ? 'Ready to draft' : 'Finish its setup first') : p.status === 'adopted' ? 'Adopted · version ' + v.v : 'Draft ' + v.v + (p.versions.some(x => x.status === 'Adopted') ? ' · version ' + p.versions.filter(x => x.status === 'Adopted').at(-1).v + ' in use' : '') + (b.length ? ' · ' + b.length + ' to confirm' : ''), ic: svcIcon(id), right: p?.status === 'adopted' ? 'Adopted' : p ? 'Draft' : '', tone: p?.status === 'adopted' ? 'ok' : b.length ? 'warn' : '', act: 'go', data: { to: 'procedure', id } }); })}</div>
      <section class="sec"><h2 class="sec-title">Other documents · ${c.ph.documents.length}</h2><p class="muted">Where your other policies and templates are kept: a link or a reference, never the document itself.</p>
        ${c.ph.documents.length ? h`<div class="list">${c.ph.documents.map(d => row({ title: d.title, sub: [d.ref, d.version && 'version ' + d.version, d.reviewDate && 'review ' + fmt(d.reviewDate)].filter(Boolean).join(' · '), act: 'go', data: { to: 'docref', id: d.id } }))}</div>` : ''}
        ${btn('+ Add a document reference', 'go', { kind: 'link', data: { to: 'docref', id: '' } })}</section>` });
  },
});
const VIEW = {
  tab: 'more',
  render(c, r) {
    const id = r.id, p = c.ph.procedures.find(x => x.service === id), v = current(p), fresh = c.ph.services[id]?.setup === 'done' ? draftText(c.ph, id) : '';
    const mode = c.ui['pm:' + id] || '';
    if (!p) return screen({ title: serviceName(id), back: true, body: fresh ? h`<p class="muted">Here is the draft written from your answers. Save it to keep it as version 0.1.</p>${btn('Save this draft', 'save', { kind: 'primary', cls: 'block' })}<div class="doc">${fresh}</div>` : note('Finish this service’s setup questions first.', 'warn') });
    const b = blockers(v.body), changed = fresh && fresh !== v.generated;
    // C-04: the adopted version a newer draft would replace. It stays in use (and in the history) until the owner adopts the draft.
    const inUse = p.status !== 'adopted' ? p.versions.filter(x => x.status === 'Adopted').at(-1) : null;
    // Owner trial: a "Write the steps …" item can't be answered by a setup question (the clinical steps are the
    // pharmacy's to write), so it opens here with the placeholder selected, or points to "We have our own procedure".
    const finding = c.ui['pmfind:' + id];
    if (mode === 'edit') return screen({ title: 'Edit wording', back: true, body: h`${finding ? (/^\[Confirm: write the steps/i.test(finding) ? h`<div class="note warn"><p><b>${finding.replace(/^\[Confirm: |\]$/g, '')}.</b> The highlighted line is a placeholder: replace it with your pharmacy’s steps, following current NSW OTP guidance, then tap Save as new version. Adopt unlocks when no “[Confirm: …]” lines are left.</p>${btn('We already have our own written procedure for this', 'fixq', { kind: 'link', data: { q: finding.replace(/^\[Confirm: |\]$/g, '') } })}</div>`
      : h`<div class="note warn"><p><b>To check: ${finding.replace(/^\[Confirm: |\]$/g, '')}.</b> Read the highlighted step against its source (listed at the end of the procedure). Change the wording here if anything differs. When you’re satisfied, remove the marker.</p>${btn('I’ve checked it — remove this marker', 'checked', { cls: 'block' })}${btn('Change my setup answer instead', 'fixq', { kind: 'link', data: { q: finding.replace(/^\[Confirm: |\]$/g, '') } })}</div>`) : ''}<form class="form" data-form="edit">${field('Procedure text', textArea('body', v.body, { rows: 18, noPatient: true }))}<div class="dock-inline">${btn('Save as new version', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'mode', { data: { m: '' } })}</div></form>` });
    return screen({ title: serviceName(id) + ' procedure', back: true, body: h`
      <p>${pill(p.status === 'adopted' ? 'Adopted · version ' + v.v : 'Draft ' + v.v, p.status === 'adopted' ? 'ok' : 'warn')} <span class="muted">${fmt(day(v.at))}</span></p>
      ${inUse ? note('Version ' + inUse.v + ', adopted ' + fmt(day(inUse.adoptedAt || inUse.at)) + ', stays in use until you adopt this draft.', 'ok') : ''}
      ${changed ? note(h`Your setup answers changed since this draft. ${btn('Update the draft', 'regen', { kind: 'link' })}`, 'warn') : ''}
      ${b.length && p.status !== 'adopted' ? h`<section class="sec"><h2 class="sec-title">To confirm before adopting · ${b.length}</h2><div class="list">${b.map(x => /^write the steps/i.test(x) ? row({ title: x.charAt(0).toUpperCase() + x.slice(1), sub: 'Write the steps yourself in Edit (PharmLedger doesn’t write clinical steps), or say you have your own procedure', act: 'fixwrite', data: { q: x } })
          : row({ title: x.charAt(0).toUpperCase() + x.slice(1), sub: 'Check it in the text, then confirm', act: 'fixwrite', data: { q: x } }))}</div></section>` : ''}
      <div class="btnrow">${btn('Edit', 'mode', { data: { m: 'edit' } })}${p.status !== 'adopted' ? btn('Adopt for use here', 'adopt', { kind: 'primary', disabled: b.length > 0 }) : ''}</div>
      ${c.ui['ad:' + id] ? sheet({ title: 'Adopt version ' + adoptVersion(p) + ' for use here?', body: h`<p class="muted">This records that you, ${c.ph.proprietors.find(x => x.id === c.ph.recordingAs)?.name || 'the proprietor'}, have read it and it matches how your pharmacy works. You can change it later; earlier versions are kept.</p>`, primary: btn('Yes, adopt it', 'adoptyes', { kind: 'primary' }), cancel: 'adoptno' }) : ''}
      ${b.length && p.status !== 'adopted' ? h`<p class="hint">Adopt unlocks when nothing is left to confirm.</p>` : ''}
      ${p.status === 'adopted' ? h`<section class="sec"><h2 class="sec-title">Using it</h2><div class="card">
        <p class="meta">${(p.reviews || []).length ? 'Last reviewed ' + fmt(p.reviews.at(-1).date) + ' by ' + p.reviews.at(-1).by : 'Adopted ' + fmt(day(v.adoptedAt || v.at))} · next review ${fmt(procReviewDue(p))}</p>
        ${c.ui['rv:' + id] ? h`<form class="form" data-form="reviewed">${field('Anything you noticed (optional)', textArea('note', '', { rows: 2 }))}<div class="btnrow">${btn('Record review', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'rvno')}</div></form>` : btn('Record that I reviewed it', 'rv')}
        ${p.amendment ? h`<p class="eyebrow">Local amendment</p><p>${p.amendment}</p>` : ''}
        ${c.ui['am:' + id] ? h`<form class="form" data-form="amend">${field('Local amendment (how your pharmacy does this differently)', textArea('amendment', p.amendment || '', { rows: 3 }))}<div class="btnrow">${btn('Save amendment', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'amno')}</div></form>` : btn(p.amendment ? 'Change the local amendment' : 'Add a local amendment', 'am', { kind: 'link' })}
        </div></section>` : ''}
      ${(() => { const acts = Object.values(c.ph.actions).filter(a => a.source?.type === 'procedure' && a.source.service === id); return h`<section class="sec"><h2 class="sec-title">Actions for this procedure · ${acts.length}</h2>${acts.length ? h`<div class="list">${acts.map(a => row({ title: a.title, right: a.status === 'closed' ? 'Closed' : 'Open', act: 'go', data: { to: 'action', id: a.id } }))}</div>` : ''}${btn('+ Add an action for this procedure', 'linkact', { kind: 'link' })}</section>`; })()}
      ${docView(adoptedWording(v, v.edited ? v.body : procWording(v.body)))}
      ${p.versions.length > 1 ? why('Version history · ' + p.versions.length, h`<div class="list">${p.versions.slice().reverse().map((x, i) => row({ title: 'Version ' + x.v + (i === 0 ? ' (current)' : ''), sub: [x.status, fmt(day(x.at)), x.adoptedBy && 'adopted by ' + x.adoptedBy, x.edited && 'wording edited'].filter(Boolean).join(' · '), chev: false }))}</div>`) : ''}` });
  },
  after: (c, r) => { const f = c.ui['pmfind:' + r.id], ta = document.querySelector('textarea[name=body]'); if (!f || !ta || ta.dataset.sel) return; const i = ta.value.indexOf(f); if (i < 0) return; ta.dataset.sel = '1'; ta.focus({ preventScroll: true }); ta.setSelectionRange(i, i + f.length);
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22; ta.scrollTop = Math.max(0, ta.value.slice(0, i).split('\n').length - 3) * lh; },
  acts: { docall: () => document.querySelectorAll('details.docsec').forEach(d => { d.open = true; }),
    mode: (c, d, el, r) => { c.ui['pm:' + r.id] = d.m; if (d.m !== 'edit') c.ui['pmfind:' + r.id] = ''; c.rerender(); },
    fixq: (c, d, el, r) => { c.ui['pm:' + r.id] = ''; c.ui['pmfind:' + r.id] = ''; VIEW.acts.fix(c, d, el, r); },
    // The owner's tap confirms the check: the marker is removed in a new version (nothing is confirmed for them).
    checked: (c, d, el, r) => { const f = c.ui['pmfind:' + r.id]; if (!f) return; const ta = document.querySelector('textarea[name=body]');
      c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), v = p?.versions.at(-1); if (!v) return false; const body = (ta ? ta.value : v.body).split(' ' + f).join('').split(f).join(''); const m = String(v.v).match(/^(\d+)\.(\d+)/);
        p.versions.push({ ...v, v: m ? m[1] + '.' + (+m[2] + 1) : '0.1', body, generated: draftText(ph, r.id) || v.generated, at: new Date().toISOString(), status: 'Draft', edited: true }); log(ph, 'Procedure check confirmed · ' + serviceName(r.id) + ' · ' + f.replace(/^\[Confirm: |\]$/g, '')); }, 'Checked. Marker removed.');
      c.ui['pm:' + r.id] = ''; c.ui['pmfind:' + r.id] = ''; c.rerender(); },
    fixwrite: (c, d, el, r) => { c.ui['pm:' + r.id] = 'edit'; c.ui['pmfind:' + r.id] = '[Confirm: ' + d.q + ']'; c.rerender(); window.scrollTo(0, 0); },
    rv: (c, d, el, r) => { c.ui['rv:' + r.id] = true; c.rerender(); }, rvno: (c, d, el, r) => { c.ui['rv:' + r.id] = false; c.rerender(); },
    am: (c, d, el, r) => { c.ui['am:' + r.id] = true; c.rerender(); }, amno: (c, d, el, r) => { c.ui['am:' + r.id] = false; c.rerender(); },
    linkact: (c, d, el, r) => { let id; c.change(ph => { id = newAction(ph, { title: 'Update ' + serviceName(r.id) + ' procedure: ', due: addDays(today(), 30), source: { type: 'procedure', service: r.id, label: serviceName(r.id) + ' procedure' } }).id; }); c.ui.actMode = { ...(c.ui.actMode || {}), [id]: 'edit' }; c.go('action', { id }); },
    fix: (c, d, el, r) => { c.ui.fixFind = { id: r.id, find: '[Confirm: ' + d.q + ']' }; const i = bestQuestion(c.ph, r.id, d.q); if (i < 0) { c.go('service', { id: r.id }); return; } c.ui['ss:' + r.id] = i; c.ui.returnTo = { id: r.id }; c.go('service-setup', { id: r.id }); },
    save: (c, d, el, r) => c.change(ph => { ph.procedures.push({ id: uid(), service: r.id, title: serviceName(r.id) + ' procedure', status: 'draft', versions: [{ v: '0.1', body: draftText(ph, r.id), generated: draftText(ph, r.id), at: new Date().toISOString(), status: 'Draft' }] }); log(ph, 'Procedure drafted · ' + serviceName(r.id)); }, 'Draft saved'),
    regen: (c, d, el, r) => c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), t = draftText(ph, r.id); p.versions.push({ v: next(current(p).v), body: t, generated: t, at: new Date().toISOString(), status: 'Draft' }); p.status = 'draft'; log(ph, 'Procedure redrafted · ' + serviceName(r.id)); }, 'Draft updated', { redraw: true }),
    adopt: (c, d, el, r) => { const p = c.ph.procedures.find(x => x.service === r.id); if (blockers(current(p).body).length) return; c.ui['ad:' + r.id] = true; c.rerender(); },
    adoptno: (c, d, el, r) => { c.ui['ad:' + r.id] = false; c.rerender(); },
    adoptyes: (c, d, el, r) => { c.ui['ad:' + r.id] = false;
      c.change(ph => { const q = ph.procedures.find(x => x.service === r.id), v = current(q), nv = adoptVersion(q), by = ph.proprietors.find(x => x.id === ph.recordingAs)?.name || '';
        q.versions.push({ ...v, v: nv, status: 'Adopted', at: new Date().toISOString(), adoptedAt: new Date().toISOString(), adoptedBy: by, from: v.v }); q.status = 'adopted'; log(ph, 'Procedure adopted · ' + serviceName(r.id) + ' · version ' + nv + ' (from draft ' + v.v + ') by ' + by); }, 'Adopted as version ' + adoptVersion(c.ph.procedures.find(x => x.service === r.id))); },
  },
  forms: {
    reviewed: (c, f, el, r) => { c.ui['rv:' + r.id] = false; c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), by = ph.proprietors.find(x => x.id === ph.recordingAs)?.name || ''; (p.reviews ??= []).push({ date: today(), by, version: p.versions.at(-1).v, note: f.note.trim() }); log(ph, 'Procedure reviewed · ' + serviceName(r.id) + ' · version ' + p.versions.at(-1).v + (f.note.trim() ? ' · ' + f.note.trim() : '')); }, 'Review recorded'); },
    amend: (c, f, el, r) => { c.ui['am:' + r.id] = false; c.change(ph => { const p = ph.procedures.find(x => x.service === r.id); p.amendment = f.amendment.trim(); log(ph, 'Local amendment · ' + serviceName(r.id) + ' · ' + (p.amendment || 'removed')); }, 'Amendment saved'); },
    edit: (c, f, el, r) => { c.ui['pm:' + r.id] = ''; c.change(ph => { const p = ph.procedures.find(x => x.service === r.id), v = current(p); p.versions.push({ v: next(v.v), body: f.body, generated: v.generated, at: new Date().toISOString(), status: 'Draft', edited: true }); p.status = 'draft'; log(ph, 'Procedure wording edited · ' + serviceName(r.id)); }, 'Saved as a new version'); } },
};
register('procedure', VIEW);
// Adopted versions are whole numbers: the first adoption is 1.0, the next 2.0. Drafts in between are 1.1, 1.2…
const adoptVersion = p => (Math.max(0, ...p.versions.filter(x => x.status === 'Adopted').map(x => parseInt(x.v, 10) || 0)) + 1) + '.0';
const next = v => { const m = String(v).match(/^(\d+)\.(\d+)/); return m ? m[1] + '.' + (+m[2] + 1) : '0.1'; };

register('docref', {
  tab: 'more',
  render(c, r) { const d = c.ph.documents.find(x => x.id === r.id) || {};
    return screen({ title: r.id ? 'Document reference' : 'Add a document reference', back: true, body: h`<form class="form" data-form="save">
      ${field('Title', textInput('title', d.title || '', { required: true }))}${field('Link (optional)', textInput('url', d.url || '', { type: 'url', placeholder: 'https://' }))}
      ${field('Where it is kept or its reference', textInput('ref', d.ref || ''))}${field('Version (optional)', textInput('version', d.version || ''))}
      ${field('Kept by (optional)', textInput('owner', d.owner || ''))}${field('Review date (optional)', textInput('reviewDate', d.reviewDate || '', { type: 'date' }))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f, el, r) => { if (f.url && !/^https?:\/\//.test(f.url)) { c.toast('Use a web link starting with https://'); return; }
    c.change(ph => { let d = ph.documents.find(x => x.id === r.id); if (!d) { d = { id: uid() }; ph.documents.push(d); } Object.assign(d, { title: f.title.trim(), url: f.url.trim(), ref: f.ref.trim(), version: f.version.trim(), owner: f.owner.trim(), reviewDate: f.reviewDate }); log(ph, 'Document reference saved · ' + d.title); }, 'Saved'); c.back(); } },
});
