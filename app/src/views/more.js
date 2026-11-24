// More: everything that isn't a daily job, grouped by the four modes: rules, proof, setup.
import { register } from '../app.js';
import { h, html } from '../util.js';
import { screen, row, icon, section, btn, empty, field, textInput, note, choice } from '../ui.js';
import { fmt, today, dueText, weekStart, addDays, addMonths, monthName, isDate } from '../dates.js';
import { items, ranked, bucket, reviewDue } from '../summary.js';
import { plan, monthsFor, reviewById } from '../rules.js';
import { note as log } from '../model.js';
import { ics, saveFile } from '../ics.js';
import { historyRows, csv, printable } from '../export.js';
register('more', {
  tab: 'more',
  render(c) {
    const R = (t, s, to, ic) => h`<button class="row" data-act="go" data-to="${to}">${icon(ic)}<span class="row-main"><span class="row-title">${t}</span><span class="row-sub">${s}</span></span>${icon('chev', 'chev')}</button>`;
    return screen({ title: 'More', sub: c.ph.name, body: h`
      ${section('Plan', h`<div class="list">${R('Calendar', 'This week, next week and the year', 'calendar', 'cal')}${R('Meetings', 'Staff safety, check-ins, governance', 'meetings', 'staff')}</div>`)}
      ${section('Rules', h`<div class="list">${R('S8 at a glance', 'Inventory, storage, register, keys and codes', 's8', 'lock')}${R('Legal obligations', 'Each Regulation section that applies here', 'obligations', 'shield')}${R('NSW Health dates and contacts', 'Who to call and when', 'contacts', 'bell')}${R('Procedures', 'Drafts from your setup answers, and adopted versions', 'procedures', 'doc')}${R('If something goes wrong', 'Lost or stolen S8, lost drug register, S8 destruction', 'incidents', 'bell')}${R('Evidence locations', 'Where every record is kept', 'locations', 'box')}</div>`)}
      ${section('Proof', h`<div class="list">${R('History', 'Everything recorded, with a readable export', 'history', 'history')}${R('My log', 'What you reported or sent, and to whom', 'mylog', 'log')}</div>`)}
      ${section('Your pharmacy', h`<div class="list">${R('Pharmacy details', c.ph.address || 'Name, address, owners', 'details', 'home')}${R('Services', Object.values(c.ph.services).filter(s => s.active).length + ' offered', 'services', 'box')}${R('Bought, selling or closing', 'What NSW Health requires', 'changes', 'gear')}${R('Backup and devices', c.ph.settings.lastBackup ? 'Last backup ' + fmt(c.ph.settings.lastBackup.slice(0, 10)) : 'No backup yet', 'backup', 'backup')}${c.store.dir().ids.length > 1 || true ? R('Pharmacies on this device', c.store.dir().ids.length + ' here', 'pharmacies', 'home') : ''}</div>`)}
      <p class="hint">Build ${window.PROPAPP_BUILD || 'dev'}</p>` });
  },
});
// Plain-words dates: "1 Dec", "1st December", "tomorrow", "next Friday", "in 2 weeks", "2027-01-15".
const MONS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'], DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
export function parsePlain(txt, t = today()) {
  const s = String(txt).toLowerCase().trim(); if (!s) return '';
  if (isDate(s)) return s.slice(0, 10);
  if (s === 'today') return t; if (s === 'tomorrow') return addDays(t, 1);
  let m = s.match(/^in (\d+) (day|week|month)s?$/); if (m) return m[2] === 'month' ? addMonths(t, +m[1]) : addDays(t, +m[1] * (m[2] === 'week' ? 7 : 1));
  m = s.match(/^(next )?(sun|mon|tue|wed|thu|fri|sat)[a-z]*$/); if (m) { const dow = new Date(t + 'T00:00:00Z').getUTCDay(), want = DAYS.indexOf(m[2]); let d = (want - dow + 7) % 7 || 7; if (m[1] && d < 7) d += 0; return addDays(t, d); }
  m = s.match(/^(\d{1,2})(st|nd|rd|th)?\s+([a-z]{3})[a-z]*(\s+(\d{4}))?$/) || s.match(/^([a-z]{3})[a-z]*\s+(\d{1,2})(st|nd|rd|th)?(\s+(\d{4}))?$/);
  if (m) { const day = +(isNaN(+m[1]) ? m[2] : m[1]), mon = MONS.indexOf(isNaN(+m[1]) ? m[1] : m[3]), yr = m[5] ? +m[5] : +t.slice(0, 4); if (mon < 0 || day < 1 || day > 31) return '';
    let d = yr + '-' + String(mon + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'); if (!m[5] && d < t) d = (yr + 1) + d.slice(4); return d; }
  return '';
}
register('calendar', {
  tab: 'more',
  render(c) {
    const view = c.ui.calV || 'weeks', every = items(c.ph, c.drafts), all = every.filter(i => isDate(i.date) && i.bucket !== 'started'), prog = every.filter(i => i.bucket === 'started');
    const t = today(), ws = weekStart(t);
    const listOf = l => h`<div class="list">${ranked(l).sort((a, b) => (a.bucket === 'overdue' && b.bucket === 'overdue' ? 0 : (a.date || '').localeCompare(b.date || ''))).map(i => row({ title: i.title, legal: i.legal, sub: i.kind === 'action' ? 'Action' : i.sub, right: i.bucket === 'started' ? 'In progress' : fmt(i.date, { weekday: true }), tone: i.bucket === 'overdue' ? 'bad' : '', act: 'open', data: { key: i.key } }))}</div>`;
    let body;
    if (view === 'weeks') {
      const grp = [['In progress', prog], ['Overdue', all.filter(i => i.bucket === 'overdue')], ['This week', all.filter(i => i.date >= t && i.date < addDays(ws, 7))], ['Next week', all.filter(i => i.date >= addDays(ws, 7) && i.date < addDays(ws, 14))], ['Later', all.filter(i => i.date >= addDays(ws, 14))]];
      body = h`${grp.filter(([, l]) => l.length).map(([n, l]) => section(n + ' · ' + l.length, listOf(l)))}${all.length || prog.length ? '' : empty('No dates yet.')}`;
    } else if (view === 'month') {
      const m = c.ui.calM || t.slice(0, 7), first = m + '-01', start = weekStart(first), inMonth = all.filter(i => i.date.slice(0, 7) === m), sel = c.ui.calDay;
      const cells = []; for (let d = start; d.slice(0, 7) <= m || cells.length % 7; d = addDays(d, 1)) { cells.push(d); if (cells.length > 42) break; }
      body = h`<div class="monthnav">${btn('‹', 'mon', { data: { d: -1 } })}<h2>${monthName(first)}</h2>${btn('›', 'mon', { data: { d: 1 } })}</div>
        <div class="month" role="grid">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => h`<span class="dow">${x}</span>`)}${cells.map(d => { const n = all.filter(i => i.date === d), out = d.slice(0, 7) !== m;
          return h`<button class="day${out ? ' out' : ''}${d === t ? ' today' : ''}${d === sel ? ' sel' : ''}${n.some(i => i.bucket === 'overdue') ? ' bad' : ''}" data-act="day" data-d="${d}" aria-label="${fmt(d, { weekday: true })}${n.length ? ', ' + n.length + ' due' : ''}">${+d.slice(8)}${n.length ? h`<i>${n.length}</i>` : ''}</button>`; })}</div>
        ${sel ? section(fmt(sel, { weekday: true }), all.filter(i => i.date === sel).length ? listOf(all.filter(i => i.date === sel)) : empty('Nothing due that day.'), btn('Schedule a meeting', 'go', { kind: 'link', data: { to: 'schedule', id: sel } })) : section('Due in ' + monthName(first) + ' · ' + inMonth.length, inMonth.length ? listOf(inMonth) : empty('Nothing due this month.'))}`;
    } else {
      // Year plan: each review across the next 12 months. ● due, ✓ done, ○ expected repeat.
      const months = Array.from({ length: 12 }, (_, k) => addMonths(t.slice(0, 7) + '-01', k - 5).slice(0, 7));
      const revs = plan(c.ph).filter(a => !a.event);
      const mark = (a, m) => { const done = c.ph.records.some(r => r.type === a.id && r.date.slice(0, 7) === m), due = reviewDue(c.ph, a.id); if (done) return ['✓', 'done']; if (due && due.slice(0, 7) === m) return ['●', due < t ? 'bad' : 'due'];
        const mo = monthsFor(c.ph, a); if (due && mo && m > due.slice(0, 7)) { const diff = (+m.slice(0, 4) - +due.slice(0, 4)) * 12 + (+m.slice(5) - +due.slice(5, 7)); if (diff % mo === 0) return ['○', 'rep']; } return ['', '']; };
      body = h`<p class="muted">● due · ○ expected repeat · ✓ done · from ${monthName(months[0] + '-01')} to ${monthName(months[11] + '-01')}</p><div class="scrollx"><table class="yearplan"><thead><tr><th>Review</th>${months.map(m => h`<th>${['J','F','M','A','M','J','J','A','S','O','N','D'][+m.slice(5) - 1]}</th>`)}</tr></thead>
        <tbody>${revs.map(a => h`<tr><th scope="row">${a.name}</th>${months.map(m => { const [s, k] = mark(a, m); return h`<td class="${k}">${s}</td>`; })}</tr>`)}</tbody></table></div>`;
    }
    const found = c.ui.calFind ? parsePlain(c.ui.calFind) : '';
    return screen({ title: 'Calendar', back: true, body: h`
      <div class="seg">${[['weeks', 'Weeks'], ['month', 'Month'], ['year', 'Year plan']].map(([k, l]) => h`<button class="${k === view ? 'on' : ''}" data-act="v" data-v="${k}">${l}</button>`)}</div>
      <form class="form findrow" data-form="find"><label class="field"><span class="field-label">Find a date</span><input class="input" name="find" placeholder="e.g. 1 Dec, next Friday, in 2 weeks" value="${c.ui.calFind || ''}"></label>${btn('Find', null, { type: 'submit' })}</form>
      ${c.ui.calFind ? (found ? h`<div class="card"><p><b>${fmt(found, { weekday: true })}</b> · ${all.filter(i => i.date === found).length ? all.filter(i => i.date === found).map(i => i.title).join(', ') : 'nothing due'}</p>${btn('Schedule a meeting on this date', 'go', { data: { to: 'schedule', id: found } })}</div>` : note('I couldn’t read that date. Try “1 Dec” or “next Friday”.', 'warn')) : ''}
      ${body}
      ${btn('Schedule a meeting', 'go', { kind: 'link', data: { to: 'schedule', id: '' } })}
      <div class="card"><h2>Put these dates in your phone calendar</h2><p class="muted">Download a calendar file and open it on your phone. Your due dates appear in your own calendar with a reminder the day before. Download it again when dates change.</p>${btn('Download calendar file', 'ics')}</div>` });
  },
  forms: { find: (c, f) => { c.ui.calFind = f.find.trim(); c.rerender(); } },
  acts: { v: (c, d) => { c.ui.calV = d.v; c.rerender(); }, open: async (c, d) => { const { openItem } = await import('./today.js'); const it = items(c.ph, c.drafts).find(i => i.key === d.key); if (it) openItem(c, it); },
    mon: (c, d) => { c.ui.calM = addMonths((c.ui.calM || today().slice(0, 7)) + '-01', +d.d).slice(0, 7); c.ui.calDay = ''; c.rerender(); }, day: (c, d) => { c.ui.calDay = c.ui.calDay === d.d ? '' : d.d; c.rerender(); },
    ics: c => { const ok = saveFile(c.ph.name.replace(/\W+/g, '-') + '-due-dates.ics', ics(c.ph, c.drafts), 'text/calendar'); c.toast(ok ? 'Calendar file ready. If nothing downloads here, open the app in your phone’s browser.' : 'Downloads are blocked here.'); } },
});
register('schedule', {
  tab: 'more',
  render(c, r) { const ms = catalog().filter(a => a.kind === 'meeting');
    return screen({ title: 'Schedule a meeting', back: true, body: h`<form class="form" data-form="save">${choice('m', ms.map(a => ({ value: a.id, label: a.name + ' · ' + a.frequency.toLowerCase() + (reviewDue(c.ph, a.id) ? ' · now ' + fmt(reviewDue(c.ph, a.id)) : '') })), '')}
      ${field('Date', textInput('date', r.id || addDays(today(), 7), { type: 'date', min: today() }))}<div class="dock-inline">${btn('Schedule', null, { kind: 'primary', type: 'submit' })}</div></form>` }); },
  forms: { save: (c, f) => { if (!f.m || !f.date) { c.toast('Choose a meeting and a date.'); return; } c.change(ph => { ph.schedule[f.m] = f.date; log(ph, 'Meeting scheduled · ' + reviewById(f.m).name + ' · ' + f.date); }, reviewById(f.m).name + ' scheduled for ' + fmt(f.date)); c.back(); } },
});
const filtered = c => { const q = (c.ui.histQ || '').toLowerCase(), type = c.ui.histT || 'all', from = c.ui.histFrom || '', thru = c.ui.histThru || ''; return historyRows(c.ph).filter(r => (type === 'all' || r.type === type) && (!q || (r.title + ' ' + r.detail + ' ' + r.by).toLowerCase().includes(q)) && (!from || r.date >= from) && (!thru || r.date <= thru)); };
register('history', {
  tab: 'more',
  render(c) {
    const q = (c.ui.histQ || '').toLowerCase(), type = c.ui.histT || 'all', all = historyRows(c.ph);
    const from = c.ui.histFrom || '', thru = c.ui.histThru || '';
    const rows = all.filter(r => (type === 'all' || r.type === type) && (!q || (r.title + ' ' + r.detail + ' ' + r.by).toLowerCase().includes(q)) && (!from || r.date >= from) && (!thru || r.date <= thru));
    const types = ['all', ...new Set(all.map(r => r.type))], n = c.ui.histN || 40;
    return screen({ title: 'History', back: true, body: h`
      <label class="search">${icon('search')}<input class="input" name="q" type="search" placeholder="Search history" value="${c.ui.histQ || ''}" data-input="q" autocomplete="off"></label>
      <div class="chips">${types.map(t => h`<button class="chip ${t === type ? 'on' : ''}" data-act="t" data-t="${t}">${t === 'all' ? 'All' : t}</button>`)}</div>
      <div class="daterange">${field('From', h`<input class="input" type="date" name="from" value="${from}" data-change="from">`)}${field('Through', h`<input class="input" type="date" name="thru" value="${thru}" data-change="thru">`)}</div>
      <p class="muted">${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} · kept on this device</p>
      <div class="btnrow">${btn('Download CSV', 'csv')}${btn('Print or save as PDF', 'print')}${btn('Copy as text', 'copy')}</div>
      <div class="print-only"><h1>${c.ph.name} · history${from || thru ? ' · ' + (from ? fmt(from) : 'start') + ' to ' + (thru ? fmt(thru) : 'today') : ''}</h1><table class="cal"><tr><th>Date</th><th>Type</th><th>What</th><th>Status</th><th>By</th><th>Details</th></tr>${rows.map(r => h`<tr><td>${fmt(r.date)}</td><td>${r.type}</td><td>${r.title}</td><td>${r.status}</td><td>${r.by}</td><td>${r.detail}</td></tr>`)}</table></div>
      <div class="list">${rows.slice(0, n).map(r => row({ title: r.title, sub: [r.type, r.status, r.detail].filter(Boolean).join(' · '), right: fmt(r.date), act: r.type === 'Action' ? 'act' : r.id ? 'rec' : '', data: { id: r.id }, chev: !!r.id }))}</div>
      ${rows.length > n ? btn('Show more', 'more', { kind: 'link' }) : ''}` });
  },
  inputs: { q: (c, el) => { c.ui.histQ = el.value; c.rerender(); } },
  changes: { from: (c, el) => { c.ui.histFrom = el.value; c.rerender(); }, thru: (c, el) => { c.ui.histThru = el.value; c.rerender(); } },
  acts: { t: (c, d) => { c.ui.histT = d.t; c.rerender(); }, more: c => { c.ui.histN = (c.ui.histN || 40) + 60; c.rerender(); }, act: (c, d) => c.go('action', { id: d.id }), rec: (c, d) => c.go('record', { id: d.id }),
    print: c => { try { window.print(); } catch {} setTimeout(() => c.toast('If no print window opened, open the app file in your browser to print or save a PDF.'), 400); },
    csv: c => { const ok = saveFile('history-' + c.ph.name.replace(/\W+/g, '-') + '-' + today() + '.csv', csv(c.ph, filtered(c)), 'text/csv'); c.toast(ok ? 'CSV ready' : 'Downloads are blocked here. Use Copy as text.'); },
    copy: async c => { try { await navigator.clipboard.writeText(printable(c.ph, filtered(c))); c.toast('Copied'); } catch { c.toast('Copy didn’t work here.'); } } },
});

// Search or jump to: reviews, actions, staff, procedures, legal obligations and setup questions, in one box.
import { catalog } from '../rules.js';
import { C } from '../content.js';
function searchResults(c) { const q = (c.ui.q || '').trim().toLowerCase(), R = [];
  if (q.length < 2) return h`<p class="muted">Type at least two letters.</p>`;
  for (const a of catalog()) if (a.name.toLowerCase().includes(q)) R.push({ t: a.name, s: 'Review · ' + a.frequency, to: a.kind === 'visit' ? 'visit-start' : a.kind === 'meeting' ? 'meeting' : 'review', id: a.id });
  for (const a of Object.values(c.ph.actions)) if ((a.title + ' ' + (a.closed?.what || '') + ' ' + (a.progress || '')).toLowerCase().includes(q)) R.push({ t: a.title, s: 'Action · ' + (a.status === 'open' ? 'open' : 'closed'), to: 'action', id: a.id });
  for (const p of c.ph.staff) if (p.name.toLowerCase().includes(q)) R.push({ t: p.name, s: 'Staff · ' + p.role, to: 'person', id: p.id });
  for (const [id, s] of Object.entries(c.ph.services)) { const nm = C.services.services.find(x => x.id === id)?.name || id; if (s.active && nm.toLowerCase().includes(q)) R.push({ t: nm, s: 'Service', to: 'service', id }); }
  for (const p of c.ph.procedures) if ((p.title + ' ' + (p.versions.at(-1)?.body || '')).toLowerCase().includes(q)) R.push({ t: p.title, s: 'Procedure', to: 'procedure', id: p.service });
  for (const o of C.law.OBL) if ((o[2] + ' ' + o[1] + ' ' + o[3]).toLowerCase().includes(q)) R.push({ t: o[2], s: 'Legal obligation · ' + o[1], to: 'obligation', id: o[0] });
  return h`<div class="list">${R.length ? R.slice(0, 40).map(x => row({ title: x.t, sub: x.s, act: 'go', data: { to: x.to, id: x.id } })) : empty('Nothing matches “' + q + '”.')}</div>`; }
register('search', {
  tab: 'today',
  render(c) { return screen({ title: 'Search', back: true, body: h`<label class="search">${icon('search')}<input class="input" name="q" type="search" placeholder="Search reviews, actions, staff, rules" value="${c.ui.q || ''}" data-input="q" autocomplete="off"></label><div id="sr">${searchResults(c)}</div>` }); },
  after: () => { const i = document.querySelector('input[name=q]'); if (i && document.activeElement !== i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } },
  inputs: { q: (c, el) => { c.ui.q = el.value; document.getElementById('sr').innerHTML = html(searchResults(c)); } },
});
