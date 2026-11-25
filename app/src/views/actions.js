// Actions: the fixes the owner closes themselves. Tapping a row opens the action directly (Gemini F-17).
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, row, btn, empty, icon, field, textInput, textArea, note } from '../ui.js';
import { actionCounts } from '../summary.js';
import { dueText, fmt, today, addDays, isDate } from '../dates.js';
import { newAction, closeAction, reopenAction, updateAction, waitOn, stopWaiting } from '../model.js';
import { otpPartsLeft } from './services.js';
import { saveFile } from '../ics.js';
import { copyText } from '../clip.js';
const F = [['open', 'Open'], ['overdue', 'Overdue'], ['closed', 'Closed'], ['all', 'All']];
register('actions', {
  tab: 'actions',
  render(c) {
    const n = actionCounts(c.ph), f = c.ui.actF || 'open', q = (c.ui.actQ || '').toLowerCase(), t = today();
    let list = Object.values(c.ph.actions).filter(a => f === 'all' || (f === 'closed' ? a.status === 'closed' : a.status === 'open' && (f === 'open' || (isDate(a.due) && a.due < t))));
    if (q) list = list.filter(a => (a.title + ' ' + (a.person || '')).toLowerCase().includes(q));
    list.sort((a, b) => f === 'closed' ? (b.closed?.date || '').localeCompare(a.closed?.date || '') : (a.due || '9').localeCompare(b.due || '9'));
    return screen({ title: 'Actions', right: h`<button class="iconbtn" data-act="add" aria-label="Add an action">${icon('plus')}</button>`, body: h`
      <p class="status">${n.open === 1 ? '1 open' : n.open + ' open'}${n.overdue ? h` · <span class="bad">${n.overdue} overdue</span>` : ''}. Only you close an action, once you've seen the fix.</p>
      <div class="tabs">${F.map(([k, l]) => h`<button class="${k === f ? 'on' : ''}" data-act="f" data-f="${k}">${l} <b>${k === 'overdue' ? n.overdue : n[k]}</b></button>`)}</div>
      <label class="search">${icon('search')}<input class="input" name="q" type="search" placeholder="Search actions" value="${c.ui.actQ || ''}" data-input="q" autocomplete="off"></label>
      <div class="list">${list.length ? list.map(a => row({ title: a.title, sub: [a.title.includes(a.person) ? '' : a.person, a.source?.label?.replace(/ · \d{4}-\d{2}-\d{2}$/, '')].filter(Boolean).join(' · ') || 'Action', right: a.status === 'closed' ? 'Closed ' + fmt(a.closed?.date) : a.waiting ? 'Waiting' : dueText(a.due), tone: a.status === 'open' && isDate(a.due) && a.due < t ? 'bad' : '', act: 'open', data: { id: a.id } })) : empty('No actions here.')}</div>` });
  },
  acts: { f: (c, d) => { c.ui.actF = d.f; c.rerender(); }, open: (c, d) => c.go('action', { id: d.id }), add: c => c.go('action-new') },
  inputs: { q: (c, el) => { c.ui.actQ = el.value; c.rerender(); } },
});
register('action-new', {
  tab: 'actions',
  render: c => screen({ title: 'New action', back: true, site: c.ph.name, body: h`<form data-form="new" class="form">
    ${field('What needs fixing', textInput('title', '', { required: true }), 'No patient names. For example: “Check fridge log” or “Service fire extinguisher”.')}${field('Due', textInput('due', addDays(today(), 14), { type: 'date' }))}
    <div class="dock-inline">${btn('Save action', null, { kind: 'primary', type: 'submit' })}</div></form>` }),
  forms: { new: (c, f) => { let id; c.change(ph => { id = newAction(ph, { title: f.title.trim(), due: f.due }).id; }, 'Action saved'); c.replace('action', { id }); } },
});
const histText = (ph, a) => [ph.name, 'Action: ' + a.title, a.source?.label ? 'From: ' + a.source.label : '', 'Due: ' + (fmt(a.due) || 'no date') + ' · ' + (a.status === 'closed' ? 'closed ' + fmt(a.closed?.date) : 'open'), '', ...(a.log || []).map(e => fmt(String(e.at).slice(0, 10)) + (e.by ? ' · ' + e.by : '') + ' · ' + e.text), a.closed?.what ? '\nWhat was seen: ' + a.closed.what : ''].filter(x => x !== '').join('\n');
const CHIPS = [['In 3 days', 3], ['In a week', 7], ['In 2 weeks', 14]];
register('action', {
  tab: 'actions',
  render(c, r) {
    const a = c.ph.actions[r.id]; if (!a) return screen({ title: 'Action', back: true, body: empty('This action no longer exists.') });
    const mode = c.ui.actMode?.[a.id] || '';
    const src = a.source?.type === 'visit' ? h`<p class="muted">Found at the ${a.source.label.toLowerCase().replace(/ · (\d{4}-\d{2}-\d{2})$/, (m, d) => ' on ' + fmt(d))}${a.source.item ? ' · ' + a.source.item : ''}</p>` : a.source?.label ? h`<p class="muted">From ${a.source.label}${a.person ? ' · ' + a.person : ''}</p>` : '';
    const open = a.status === 'open';
    let body = h`<h2 class="big-title">${a.title}</h2>${src}
      <p class="meta">${open ? (a.waiting ? 'Waiting · ' : '') + dueText(a.due) + (a.due && /Overdue/.test(dueText(a.due)) ? ' · ' + fmt(a.due) : '') : 'Closed ' + fmt(a.closed?.date)}</p>
      ${a.recheck?.length ? h`<div class="card"><p class="eyebrow">What to look at again · ${a.recheck.length}</p><ul class="plain">${a.recheck.map(x => h`<li>${x}</li>`)}</ul></div>` : ''}`;
    if (!open) body = h`${body}<div class="card"><p class="eyebrow">What you saw</p><p>${a.closed?.what || '—'}</p></div>${btn('Reopen', 'reopen')}`;
    else if (mode === 'close') body = h`${body}<form data-form="close" class="form">${field('What did you see?', textArea('what', '', { rows: 3, placeholder: 'For example: door closer adjusted, latches every time' }))}
      ${field('Date', textInput('date', today(), { type: 'date', max: today() }))}<div class="dock-inline">${btn('Close action', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'mode', { data: { m: '' } })}</div></form>`;
    else if (mode === 'wait') body = h`${body}<form data-form="wait" class="form">${field('What did you ask for, and from whom?', textArea('asked', '', { rows: 2 }))}
      <p class="field-label">Check back</p><div class="chips">${CHIPS.map(([l, n]) => h`<label class="chip"><input type="radio" name="cb" value="${addDays(today(), n)}" ${n === 7 ? h`checked` : ''}>${l}</label>`)}</div>
      <p class="hint">The due date stays as it is. The action stays open until you see it done.</p><div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'mode', { data: { m: '' } })}</div></form>`;
    else if (mode === 'edit') body = h`${body}<form data-form="edit" class="form">${field('Title', textInput('title', a.title, { required: true }), 'No patient names. For example: “Check fridge log” or “Service fire extinguisher”.')}${field('Due', textInput('due', a.due, { type: 'date' }))}${field('Progress note', textArea('progress', a.progress || ''))}
      <div class="dock-inline">${btn('Save', null, { kind: 'primary', type: 'submit' })}${btn('Cancel', 'mode', { data: { m: '' } })}</div></form>`;
    else body = h`${body}
      ${a.waiting ? h`<div class="card wait"><p class="eyebrow">Waiting on someone</p><p>Asked ${fmt(a.waiting.on)}: ${a.waiting.asked}. Check back ${fmt(a.waiting.checkBack)}.</p>
        <div class="btnrow">${btn('Got it · close it', 'mode', { kind: 'primary', data: { m: 'close' } })}${btn('Still waiting · new date', 'mode', { data: { m: 'wait' } })}${btn('Not waiting any more', 'unwait', { kind: 'link' })}</div></div>`
        : h`${btn('Seen the fix · close it', 'mode', { kind: 'primary', cls: 'block', data: { m: 'close' } })}${btn('Waiting on someone', 'mode', { cls: 'block', data: { m: 'wait' } })}`}
`;
    if (open && !mode && /Finish your OTP procedure|documented OTP procedures/.test(a.title) && c.ph.services.otp) { const o = otpPartsLeft(c.ph); body = h`${body}<div class="card"><p>${o.left} of ${o.total} OTP Standards parts to write.</p>${btn('Mark the parts', 'go', { data: { to: 'otp-parts' } })}</div>`; }
    const hist = [...(a.log || [])].reverse();
    return screen({ title: 'Action', back: true, site: c.ph.name, right: open && !mode ? h`<button class="btn link" data-act="mode" data-m="edit">Edit</button>` : '', body: h`${body}
      <details class="why"><summary>Full history · ${hist.length}</summary><ol class="timeline">${hist.map(e => h`<li><span class="muted">${fmt(String(e.at).slice(0, 10))}${e.by ? ' · ' + e.by : ''}</span><span>${e.text}</span></li>`)}</ol><div class="btnrow pad">${btn('Copy full history', 'cphist')}${btn('Download', 'dlhist')}</div></details>` });
  },
  acts: {
    mode: (c, d, el, r) => { c.ui.actMode = { ...(c.ui.actMode || {}), [r.id]: d.m }; c.rerender(); setTimeout(() => document.querySelector('form textarea, form input')?.focus(), 0); },
    reopen: (c, d, el, r) => c.change(ph => reopenAction(ph, r.id), 'Action reopened'),
    cphist: async (c, d, el, r) => { if (await copyText(histText(c.ph, c.ph.actions[r.id]))) { c.toast('Copied'); } else { c.toast('Copy didn’t work here.'); } },
    dlhist: (c, d, el, r) => { const a = c.ph.actions[r.id]; c.toast(saveFile(('Action ' + a.title).replace(/[^\w]+/g, '-').slice(0, 60) + '.txt', histText(c.ph, a)) ? 'History ready' : 'Downloads are blocked here.'); },
    unwait: (c, d, el, r) => c.change(ph => stopWaiting(ph, r.id, 'Not waiting any more'), 'Saved'),
  },
  forms: {
    close: (c, f, el, r) => { if (!f.what.trim()) { c.toast('Say what you saw, so the record shows it.'); return; } c.ui.actMode[r.id] = ''; c.change(ph => closeAction(ph, r.id, f.what.trim(), f.date), 'Action closed'); },
    wait: (c, f, el, r) => { if (!f.asked.trim()) return; c.ui.actMode[r.id] = ''; c.change(ph => waitOn(ph, r.id, f.asked.trim(), f.cb), 'Saved · check back ' + fmt(f.cb)); },
    edit: (c, f, el, r) => { c.ui.actMode[r.id] = ''; c.change(ph => { const a = ph.actions[r.id]; const ch = []; if (a.due !== f.due) ch.push('Due date changed to ' + (f.due || 'none')); if (a.title !== f.title.trim()) ch.push('Title changed'); if ((a.progress || '') !== f.progress) ch.push('Progress: ' + f.progress); updateAction(ph, r.id, { title: f.title.trim(), due: f.due, progress: f.progress }, ch.join(' · ') || 'Updated'); }, 'Saved'); },
  },
});
