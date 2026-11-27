// Staff (modes 1 and 3). One row per person. Annual check is a quick confirm: each item shows last time's answer and
// you tap "Still current", "Update" or "Issue" (Gemini F-09). Leaving adds the S8 items from the Medicine Storage Standards.
import { register } from '../app.js';
import { h, uid } from '../util.js';
import { screen, btn, row, field, textInput, textArea, select, choice, note, why, empty, icon, pill } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, addMonths, addDays, dueText, isDate, daysBetween } from '../dates.js';
import { requirements, credentialState, annualCheck, newAction, addRecord, note as log } from '../model.js';
import { serviceName } from '../rules.js';
const METHODS = C.staff.methods.filter(m => !['On file only', 'Not available', 'Applicability assessed'].includes(m));
function personStatus(p) {
  const rs = requirements(p).map(r => credentialState(p, r.id));
  if (rs.some(s => s.state === 'expired' || s.state === 'issue')) return ['Needs review', 'bad'];
  if (rs.some(s => s.state === 'none')) return ['Checks to do', 'warn'];
  const soon = rs.filter(s => s.expiry && daysBetween(today(), s.expiry) <= 30);
  if (soon.length || (isDate(p.annualDue) && daysBetween(today(), p.annualDue) <= 30)) return ['Coming up', 'warn'];
  return ['Current', 'ok'];
}
// M-06: Staff list filters. "Needs review" is anyone with an expired credential, an issue, or checks not done yet;
// "Coming up" is a credential or the annual check due in the next 30 days. Counts come from personStatus (one source).
const STATUS_F = [['all', 'All'], ['review', 'Needs review'], ['soon', 'Coming up']];
const statusGroup = p => { if (p.active === false) return ''; const t = personStatus(p)[0]; return t === 'Needs review' || t === 'Checks to do' ? 'review' : t === 'Coming up' ? 'soon' : ''; };
register('staff', {
  tab: 'staff',
  render(c) {
    const f = c.ui.staffF || 'active', all = c.ph.staff, sf = f === 'former' ? 'all' : c.ui.staffS || 'all', q = (c.ui.staffQ || '').trim().toLowerCase();
    const inTab = all.filter(p => f === 'former' ? p.active === false : f === 'locum' ? p.active !== false && p.engagement === 'Locum' : p.active !== false);
    const stCount = Object.fromEntries(STATUS_F.map(([k]) => [k, inTab.filter(p => statusGroup(p) === k || k === 'all').length]));
    const list = inTab.filter(p => (sf === 'all' || statusGroup(p) === sf) && (!q || (p.name + ' ' + p.role + ' ' + (p.engagement || '')).toLowerCase().includes(q)));
    return screen({ title: 'Staff', site: c.ph.name, right: h`<button class="iconbtn" data-act="go" data-to="person-edit" aria-label="Add a staff member">${icon('plus')}</button>`, body: h`
      <div class="tabs">${[['active', 'Active'], ['locum', 'Locums'], ['former', 'Former']].map(([k, l]) => h`<button class="${k === f ? 'on' : ''}" data-act="f" data-f="${k}">${l} <b>${all.filter(p => k === 'former' ? p.active === false : k === 'locum' ? p.active !== false && p.engagement === 'Locum' : p.active !== false).length}</b></button>`)}</div>
      ${f !== 'former' && inTab.length ? h`<div class="chips staff-chips" role="group" aria-label="Show">${STATUS_F.map(([k, l]) => h`<button type="button" class="chip${k === sf ? ' on' : ''}" aria-pressed="${String(k === sf)}" data-act="sf" data-f="${k}">${l} <b>${stCount[k]}</b></button>`)}</div>` : ''}
      ${inTab.length > 1 || q ? h`<label class="search">${icon('search')}<input class="input" name="q" type="search" placeholder="Search staff" aria-label="Search staff" value="${c.ui.staffQ || ''}" data-input="q" autocomplete="off"></label>` : ''}
      <div class="list">${!list.length && inTab.length ? empty(q ? 'Nobody matches “' + c.ui.staffQ.trim() + '”.' : sf === 'review' ? 'Nobody needs review.' : 'Nothing coming up in the next 30 days.') : list.length ? list.map(p => { const [s, t] = p.active === false ? ['Left ' + fmt(p.end), ''] : personStatus(p); return row({ title: p.name, sub: p.role + (p.engagement && p.engagement !== 'Regular' ? ' · ' + p.engagement : ''), right: s, tone: t, act: 'go', data: { to: 'person', id: p.id } }); }) : (f === 'active' ? h`<div class="empty-card"><b>No staff yet</b><span class="muted">Add pharmacists and support staff to keep track of registrations, training and their annual check.</span>${btn('+ Add a staff member', 'go', { kind: 'primary', data: { to: 'person-edit' } })}</div>` : empty(f === 'locum' ? 'No locums recorded. Use the locum quick check below.' : 'Nobody here yet.'))}</div>
      ${f === 'locum' ? btn('Locum on duty · quick check', 'go', { kind: 'secondary', cls: 'block', data: { to: 'locum' } }) : ''}
      <p class="hint">Dates come from your records. Check registrations yourself on the public register.</p>` });
  },
  acts: { f: (c, d) => { c.ui.staffF = d.f; c.rerender(); }, sf: (c, d) => { c.ui.staffS = d.f; c.rerender(); } },
  inputs: { q: (c, el) => { c.ui.staffQ = el.value; c.rerender(); } },
});
register('person', {
  tab: 'staff',
  render(c, r) {
    const p = c.ph.staff.find(x => x.id === r.id); if (!p) return screen({ title: 'Staff', back: true, body: empty('Not found.') });
    const reqs = requirements(p), [st, tone] = p.active === false ? ['Former staff', ''] : personStatus(p);
    const acts = Object.values(c.ph.actions).filter(a => a.status === 'open' && a.source?.staffId === p.id);
    return screen({ title: p.name, back: true, site: c.ph.name, body: h`<p class="muted">${p.role}${p.engagement ? ' · ' + p.engagement : ''}${p.start ? ' · started ' + fmt(p.start) : ''}</p>
      <p>${pill(st, tone)} ${p.active !== false && p.annualDue ? h`<span class="muted">Annual check: ${dueText(p.annualDue)}</span>` : ''}</p>
      ${p.active !== false ? btn('Annual check', 'go', { kind: 'primary', cls: 'block', data: { to: 'annual', id: p.id } }) : ''}
      ${acts.length ? h`<section class="sec"><h2 class="sec-title">Open actions · ${acts.length}</h2><div class="list">${acts.map(a => row({ title: a.title.replace(' · ' + p.name, ''), right: dueText(a.due), tone: a.due < today() ? 'bad' : '', act: 'go', data: { to: 'action', id: a.id } }))}</div></section>` : ''}
      <section class="sec"><h2 class="sec-title">Checks · ${reqs.length}</h2><div class="list">${reqs.map(q => { const s = credentialState(p, q.id); return row({ title: q.label, sub: s.expiry ? (s.state === 'expired' ? 'Expired ' : 'Valid until ') + fmt(s.expiry) : '', right: s.state === 'ok' ? 'Verified' : s.label, tone: s.state === 'expired' || s.state === 'issue' ? 'bad' : s.state === 'none' ? 'warn' : '', ...(p.active !== false ? { act: 'go', data: { to: 'cred', id: p.id + '~' + q.id } } : { chev: false }) }); })}</div></section>
      ${p.active !== false ? suggested(c, p) : ''}
      <p class="hint">${p.services?.length ? 'Services: ' + p.services.map(serviceName).join(', ') : 'No services ticked.'}</p>
      <div class="btnrow">${btn('Edit details', 'go', { data: { to: 'person-edit', id: p.id } })}${p.active !== false ? btn('Leaving', 'go', { data: { to: 'leaving', id: p.id } }) : btn('Restore to active staff', 'restore')}</div>` });
  },
  // H-10: moving someone to Former staff can be undone (they came back, or it was a mistake). Their leaving record stays
  // in the history; nothing is marked done or checked for them.
  acts: { restore: (c, d, el, r) => c.change(ph => { const p = ph.staff.find(x => x.id === r.id); if (!p) return; p.active = true; p.end = ''; log(ph, 'Restored to active staff · ' + p.name); }, 'Restored to active staff') },
});
// M-06: one credential, checked on its own (an expired AHPRA registration, a new vaccination certificate) without
// running the whole annual check. Saves that one check, records it in History, and raises an action for an issue.
// It doesn't move the annual check date, and nothing is ticked for the owner.
register('cred', {
  tab: 'staff',
  render(c, r) {
    const [pid, qid] = String(r.id).split('~'), p = c.ph.staff.find(x => x.id === pid), q = p && requirements(p).find(x => x.id === qid);
    if (!q) return screen({ title: 'Staff', back: true, body: empty('Not found.') });
    const s = credentialState(p, q.id), last = p.checks?.[q.id], a = c.ui.cred?.[r.id] || {};
    const lastTxt = last ? s.label + (last.date ? ' · checked ' + fmt(last.date) : '') + (last.method ? ' · ' + last.method : '') + (last.ref ? ' · ' + last.ref : '') : 'Not checked before';
    return screen({ title: q.label, back: true, site: c.ph.name, body: h`<p class="muted">${p.name} · ${p.role}</p>
      <p class="lasttime"><span class="eyebrow">Last time</span> ${lastTxt}</p>
      <form class="form" data-form="save" data-change="ans">
        ${choice('r', [{ value: 'ok', label: last ? 'Seen it · update' : 'Verified' }, { value: 'issue', label: 'Issue' }, { value: 'na', label: 'N/A' }], a.r || '', { issueValues: ['issue'] })}
        ${a.r === 'ok' ? h`${field('How did you check?', select('m', [['', 'Choose…'], ...METHODS.map(m => [m, m])], a.m ?? last?.method ?? ''))}${field('Valid until (if it expires)', textInput('x', a.x ?? (s.state === 'expired' ? '' : last?.expiry ?? ''), { type: 'date' }))}${field('Reference (optional)', textInput('f', a.f ?? last?.ref ?? ''))}` : ''}
        ${a.r === 'issue' || a.r === 'na' ? field(a.r === 'issue' ? 'What needs sorting?' : 'Why not applicable?', textInput('n', a.n || ''), 'No patient names.') : ''}
        <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>
      <p class="hint">This updates one check only. The annual check date doesn’t change${p.annualDue ? ' (' + dueText(p.annualDue).replace(/^\w/, x => x.toLowerCase()) + ')' : ''}.</p>` });
  },
  changes: { ans: (c, el, r) => { const f = Object.fromEntries(new FormData(el.closest('form'))), before = c.ui.cred?.[r.id]?.r; c.ui.cred = { ...(c.ui.cred || {}), [r.id]: f }; if (before !== f.r) c.rerender(); } },
  forms: { save: (c, f, el, r) => {
    const [pid, qid] = String(r.id).split('~'), p = c.ph.staff.find(x => x.id === pid), q = requirements(p).find(x => x.id === qid);
    if (!f.r) { c.toast('Choose an answer.'); return; }
    if (f.r === 'ok' && !f.m) { c.toast('Say how you checked it.'); return; }
    if ((f.r === 'issue' || f.r === 'na') && !String(f.n || '').trim()) { c.toast(f.r === 'issue' ? 'Say what needs sorting.' : 'Say why it doesn’t apply.'); return; }
    if (f.r === 'ok' && isDate(f.x) && f.x < today()) { c.toast('That date has already passed. Mark it as an issue instead.'); return; }
    c.change(ph => { const x = ph.staff.find(y => y.id === pid); x.checks ??= {};
      const it = { result: f.r, date: today(), method: f.r === 'ok' ? f.m : '', expiry: f.r === 'ok' ? f.x || '' : '', ref: f.r === 'ok' ? (f.f || '').trim() : '', note: f.r === 'ok' ? '' : f.n.trim() };
      x.checks[q.id] = it;
      const rec = addRecord(ph, { type: 'A1', kind: 'staff', title: 'Credential check · ' + q.label + ' · ' + x.name, date: today(), answers: [{ id: q.id, text: q.label, answer: f.r, isIssue: f.r === 'issue', note: it.note, expiry: it.expiry }], fields: { personId: x.id, single: q.id } });
      if (f.r === 'issue') rec.actionIds.push(newAction(ph, { title: q.label + ' · ' + x.name + ': ' + it.note, due: addDays(today(), 30), source: { type: 'staff', staffId: x.id, req: q.id, label: 'Credential check' } }).id);
    }, 'Saved'); if (c.ui.cred) c.ui.cred[r.id] = null; c.back(); } },
});
register('person-edit', {
  tab: 'staff',
  render(c, r) {
    // Chaos test fixes 7–8: a failed Save keeps everything typed (c.ui.personTry), and a name of only spaces is refused.
    const p = { ...(c.ph.staff.find(x => x.id === r.id) || { name: '', role: '', engagement: 'Regular', start: '', services: [], annualDue: '' }), ...(c.ui.personTry?.id === (r.id || '') ? c.ui.personTry.v : {}) };
    const act = Object.entries(c.ph.services).filter(([, s]) => s.active).map(([id]) => id);
    return screen({ title: r.id ? 'Edit ' + p.name : 'Add staff member', back: true, body: h`<form class="form" data-form="save">
      ${field('Name', textInput('name', p.name, { required: true }), c.ui.nameErr ? h`<span class="err">Enter a name.</span>` : '')}${field('Role', select('role', [['', 'Choose…'], ...C.staff.roles.filter(x => !/in charge|on duty/i.test(x)).map(x => [x, x])], c.ui.roleTry ?? p.role), c.ui.roleErr ? h`<span class="err">Choose a role.</span>` : '')}
      ${field('Engagement', select('engagement', C.staff.engagements.map(x => [x, x]), p.engagement))}${field('Start date (optional)', textInput('start', p.start, { type: 'date' }))}
      ${act.length ? h`<fieldset class="field"><legend class="field-label">Services they do</legend><div class="ticks">${act.map(s => h`<label class="tick"><input type="checkbox" name="svc" value="${s}" ${p.services.includes(s) ? h`checked` : ''}><span>${serviceName(s)}</span></label>`)}</div></fieldset>` : ''}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  forms: { save: (c, f, el, r) => { f.name = (f.name || '').trim(); c.ui.nameErr = !f.name; c.ui.roleErr = !f.role;
      if (c.ui.nameErr || c.ui.roleErr) { c.ui.personTry = { id: r.id || '', v: { name: f.name, engagement: f.engagement, start: f.start, services: [...el.querySelectorAll('input[name=svc]:checked')].map(i => i.value) } }; c.ui.roleTry = f.role || ''; c.rerender(); document.querySelector(c.ui.nameErr ? 'input[name=name]' : 'select[name=role]')?.focus(); return; }
      c.ui.personTry = null; c.ui.roleTry = undefined; const svcs = [...el.querySelectorAll('input[name=svc]:checked')].map(i => i.value); let id = r.id;
    c.change(ph => { let p = ph.staff.find(x => x.id === r.id);
      if (!p) { p = { id: uid(), name: '', role: '', engagement: 'Regular', start: '', end: '', active: true, services: [], annualDue: '', checks: {} }; ph.staff.push(p); id = p.id; }
      const changed = p.role && (p.role !== f.role || p.engagement !== f.engagement);
      Object.assign(p, { name: f.name.trim(), role: f.role, engagement: f.engagement, start: f.start, services: svcs });
      if (!p.annualDue) p.annualDue = addDays(today(), 30);
      log(ph, (r.id ? 'Updated staff · ' : 'Added staff · ') + p.name);
      if (changed) newAction(ph, { title: 'Check ' + p.name + '’s checks after their role change', due: addDays(today(), 14), source: { type: 'staff', staffId: p.id, label: 'Role change' } });
    }, 'Saved'); c.replace('person', { id }); } },
});
register('annual', {
  tab: 'staff',
  render(c, r) {
    const p = c.ph.staff.find(x => x.id === r.id), reqs = requirements(p), A = c.ui.annual?.[p.id] || {};
    const soon = q => { const s = credentialState(p, q.id); return s.state === 'expired' || s.state === 'issue' || (s.expiry && daysBetween(today(), s.expiry) <= 30); };
    const urgent = reqs.filter(soon), steady = reqs.filter(q => !soon(q)), bulk = steady.filter(q => credentialState(p, q.id).state === 'ok' && !A[q.id]);
    const lastLine = q => { const s = credentialState(p, q.id), last = p.checks?.[q.id]; return last ? s.label + (last.date ? ' · ' + fmt(last.date) : '') + (last.method ? ' · ' + last.method : '') : 'Not checked before'; };
    const freq = {}; reqs.forEach(q => { const l = lastLine(q); freq[l] = (freq[l] || 0) + 1; }); const common = Object.entries(freq).sort((x, y) => y[1] - x[1])[0]?.[0] || '';
    const card = q => { const s = credentialState(p, q.id), last = p.checks?.[q.id], a = A[q.id] || {}, hot = soon(q);
      const exp = s.expiry ? (s.state === 'expired' ? 'Expired ' + fmt(s.expiry) : 'Valid until ' + fmt(s.expiry) + (daysBetween(today(), s.expiry) <= 30 ? ' · expires in ' + daysBetween(today(), s.expiry) + (daysBetween(today(), s.expiry) === 1 ? ' day' : ' days') : '')) : '';
      return h`<div class="card${hot ? ' wait' : ''}"><p class="field-label">${q.label}</p>${lastLine(q) !== common || freq[common] === 1 ? h`<p class="meta">Last: ${lastLine(q)}</p>` : ''}${exp ? h`<p class="${hot ? 'warn' : 'meta'}"><b>${exp}</b></p>` : ''}
        ${choice('r:' + q.id, [...(last && s.state === 'ok' && !hot ? [{ value: 'same', label: 'Current' }] : []), { value: 'ok', label: last ? 'Update' : 'Verified' }, { value: 'issue', label: 'Issue' }, { value: 'na', label: 'N/A' }], a.r || '', { issueValues: ['issue'], inline: true })}
        ${a.r === 'ok' ? h`${field('How did you check?', select('m:' + q.id, [['', 'Choose…'], ...METHODS.map(m => [m, m])], a.m || last?.method || ''))}${field('Valid until (if it expires)', textInput('x:' + q.id, a.x ?? (hot ? '' : last?.expiry ?? ''), { type: 'date' }))}${field('Reference (optional)', textInput('f:' + q.id, a.f ?? last?.ref ?? ''))}` : ''}
        ${a.r === 'issue' || a.r === 'na' ? field(a.r === 'issue' ? 'What needs sorting?' : 'Why not applicable?', textInput('n:' + q.id, a.n || ''), 'No patient names.') : ''}</div>`; };
    return screen({ title: 'Annual check · ' + p.name, back: true, body: h`
      ${freq[common] > 1 ? h`<p class="muted">Last time, unless it says otherwise below: ${common}.</p>` : ''}
      <form class="form" data-form="save" data-change="ans">
      ${urgent.length ? h`<section class="sec"><h2 class="sec-title">Expired or expiring soon · ${urgent.length}</h2><p class="muted">Check each of these yourself. Enter the new date when you've seen it.</p>${urgent.map(card)}</section>` : ''}
      <section class="sec"><h2 class="sec-title">${urgent.length ? 'Everything else' : 'Checks'} · ${steady.length}</h2>
        ${bulk.length > 1 ? btn('Confirm these ' + bulk.length + ' unchanged', 'all', { cls: 'block' }) : ''}${steady.map(card)}</section>
        ${field('Next annual check', textInput('next', addMonths(today(), 12), { type: 'date' }))}
        <div class="dock-inline">${btn('Save annual check', null, { kind: 'primary', type: 'submit' })}</div></form>` });
  },
  changes: { ans: (c, el, r) => { const f = Object.fromEntries(new FormData(el.closest('form'))); const A = {}; for (const [k, v] of Object.entries(f)) { const [t, id] = k.split(':'); if (!id) continue; (A[id] ??= {})[t] = v; } const before = JSON.stringify(Object.fromEntries(Object.entries(c.ui.annual?.[r.id] || {}).map(([k, v]) => [k, v.r]))); c.ui.annual = { ...(c.ui.annual || {}), [r.id]: A }; if (before !== JSON.stringify(Object.fromEntries(Object.entries(A).map(([k, v]) => [k, v.r])))) c.rerender(); } },
  acts: { all: (c, d, el, r) => { const p = c.ph.staff.find(x => x.id === r.id), A = { ...(c.ui.annual?.[r.id] || {}) };
    for (const q of requirements(p)) { const s = credentialState(p, q.id); if (!A[q.id] && s.state === 'ok' && !(s.expiry && daysBetween(today(), s.expiry) <= 30)) A[q.id] = { r: 'same' }; }
    c.ui.annual = { ...(c.ui.annual || {}), [r.id]: A }; c.rerender(); } },
  forms: { save: (c, f, el, r) => {
    const p = c.ph.staff.find(x => x.id === r.id), reqs = requirements(p), A = c.ui.annual?.[p.id] || {};
    const missing = reqs.filter(q => !A[q.id]?.r || (A[q.id].r === 'ok' && !A[q.id].m) || (['issue', 'na'].includes(A[q.id].r) && !A[q.id].n?.trim()));
    if (missing.length) { c.toast(missing.length === 1 ? 'One item still needs an answer: ' + missing[0].label : missing.length + ' items still need an answer.'); return; }
    const expired = reqs.filter(q => A[q.id].r === 'ok' && isDate(A[q.id].x) && A[q.id].x < today());
    if (expired.length) { c.toast('“' + expired[0].label + '” has already expired. Mark it as an issue instead.'); return; }
    c.change(ph => { const items = reqs.map(q => { const a = A[q.id], last = p.checks?.[q.id] || {};
        return a.r === 'same' ? { id: q.id, label: q.label, result: 'ok', method: last.method, expiry: last.expiry, ref: last.ref } : { id: q.id, label: q.label, result: a.r, method: a.m || '', expiry: a.x || '', ref: a.f || '', note: a.n || '' }; });
      const rec = annualCheck(ph, p.id, today(), items, f.next);
      for (const it of items.filter(i => i.result === 'issue')) rec.actionIds.push(newAction(ph, { title: it.label + ' · ' + p.name + ': ' + it.note, due: addDays(today(), 30), source: { type: 'staff', staffId: p.id, req: it.id, label: 'Annual check' } }).id);
    }, 'Annual check saved'); c.ui.annual[p.id] = null; c.back(); } },
});
// Leaving: keys, IT access, handover, plus S8 items (NSW Medicine Storage Standards via uat/NSW-HEALTH-GAP-ANALYSIS.md G1).
const LEAVE = [['keys', 'Keys and physical access returned'], ['access', 'IT accounts and service access removed'], ['s8codes', 'Personal S8 safe codes or biometrics removed (NSW Medicine Storage Standards)'], ['eregister', 'Electronic drug register login removed, if one is used'], ['codes', 'Shared codes changed and keys accounted for: safe, alarm and door codes the person knew (best practice)'], ['handover', 'Open actions and records handed over']];
register('leaving', {
  tab: 'staff',
  render(c, r) { const p = c.ph.staff.find(x => x.id === r.id);
    return screen({ title: p.name + ' is leaving', back: true, body: h`<form class="form" data-form="save">${field('Last day', textInput('end', today(), { type: 'date' }))}
      ${LEAVE.map(([k, l]) => h`<div class="card"><p class="field-label">${l}</p>${choice(k, [{ value: 'done', label: 'Done' }, { value: 'later', label: 'Not yet' }, { value: 'na', label: 'Not applicable' }], '', { inline: true })}</div>`)}
      <p class="hint">Anything marked “Not yet” becomes an action.</p><div class="dock-inline">${btn('Move to former staff', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f, el, r) => { if (LEAVE.some(([k]) => !f[k])) { c.toast('Answer each item.'); return; }
    c.change(ph => { const p = ph.staff.find(x => x.id === r.id); p.active = false; p.end = f.end;
      const rec = addRecord(ph, { type: 'A1', kind: 'departure', title: 'Leaving · ' + p.name, date: f.end, answers: LEAVE.map(([k, l]) => ({ item: k, text: l, answer: { done: 'Done', later: 'Not yet', na: 'N/A' }[f[k]], isIssue: f[k] === 'later' })), fields: { personId: p.id } });
      for (const [k, l] of LEAVE.filter(([k]) => f[k] === 'later')) rec.actionIds.push(newAction(ph, { title: l.replace(/ \(.*\)$/, '') + ' · ' + p.name, due: addDays(f.end, 1), source: { type: 'leaving', recordId: rec.id, label: 'Leaving · ' + p.name } }).id);
    }, 'Moved to former staff'); c.tab('staff'); } },
});
const LOCUM = [['register', 'Checked their registration on the public register'], ['access', 'Given only the drug register and dispensing access they need'], ['keys', 'Agreed how keys or S8 codes come back at the end']];
register('locum', {
  tab: 'staff',
  render(c) { return screen({ title: 'Locum quick check', back: true, body: h`<p class="muted">For a locum covering a shift. Takes about 30 seconds.</p><form class="form" data-form="save">
    ${field('Locum’s name', textInput('name', '', { required: true }))}${field('Date', textInput('date', today(), { type: 'date' }))}
    ${LOCUM.map(([k, l]) => h`<div class="card"><p class="field-label">${l}</p>${choice(k, [{ value: 'yes', label: 'Done' }, { value: 'no', label: 'Not yet' }], '', { inline: true })}</div>`)}
    <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f) => { if (!String(f.name || '').trim()) { c.toast('Enter the locum’s name.'); document.querySelector('main input[name=name]')?.focus(); return; } if (LOCUM.some(([k]) => !f[k])) { c.toast('Answer each item.'); return; }
    c.change(ph => { let p = ph.staff.find(x => x.name === f.name.trim() && x.engagement === 'Locum'); if (!p) { p = { id: uid(), name: f.name.trim(), role: 'Pharmacist', engagement: 'Locum', start: f.date, end: '', active: true, services: [], annualDue: '', checks: {} }; ph.staff.push(p); }
      const rec = addRecord(ph, { type: 'A1', kind: 'staff', title: 'Locum check · ' + p.name, date: f.date, answers: LOCUM.map(([k, l]) => ({ item: k, text: l, answer: f[k] === 'yes' ? 'Done' : 'Not yet', isIssue: f[k] !== 'yes' })), fields: { personId: p.id } });
      for (const [k, l] of LOCUM.filter(([k]) => f[k] === 'no')) rec.actionIds.push(newAction(ph, { title: l + ' · ' + p.name, due: f.date, source: { type: 'staff', staffId: p.id, label: 'Locum check' } }).id);
    }, 'Locum check saved'); c.back(); } },
});

// Suggested credentials for the services a person does (current app's helpers layer). Nothing is recorded for them.
function suggested(c, p) {
  const list = C.law.SUGGEST.filter(x => (!x[1] && /Pharmacist|Intern/.test(p.role)) || (x[1] && p.services?.includes(x[1])));
  return list.length ? why('Credentials worth keeping on file · ' + list.length, h`<ul class="plain">${list.map(x => h`<li><b>${x[2]}</b> · ${x[3]}</li>`)}</ul>`) : '';
}
