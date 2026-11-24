// More: everything that isn't a daily job, grouped by the four modes: rules, proof, setup.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, row, icon, section, btn, empty, field, textInput, note } from '../ui.js';
import { fmt, today, dueText, weekStart, addDays, monthName, isDate } from '../dates.js';
import { items, ranked, bucket } from '../summary.js';
import { ics, saveFile } from '../ics.js';
import { historyRows, csv, printable } from '../export.js';
register('more', {
  tab: 'more',
  render(c) {
    const R = (t, s, to, ic) => h`<button class="row" data-act="go" data-to="${to}">${icon(ic)}<span class="row-main"><span class="row-title">${t}</span><span class="row-sub">${s}</span></span>${icon('chev', 'chev')}</button>`;
    return screen({ title: 'More', sub: c.ph.name, body: h`
      ${section('Plan', h`<div class="list">${R('Calendar', 'This week, next week and the year', 'calendar', 'cal')}${R('Meetings', 'Staff safety, check-ins, governance', 'meetings', 'people')}</div>`)}
      ${section('Rules', h`<div class="list">${R('S8 at a glance', 'Inventory, storage, register, keys and codes', 's8', 'lock')}${R('Legal obligations', 'Each Regulation section that applies here', 'obligations', 'shield')}${R('NSW Health dates and contacts', 'Who to call and when', 'contacts', 'bell')}${R('Procedures', 'Drafts from your setup answers, and adopted versions', 'procedures', 'doc')}</div>`)}
      ${section('Proof', h`<div class="list">${R('History', 'Everything recorded, with a readable export', 'history', 'history')}${R('My log', 'What you reported or sent, and to whom', 'mylog', 'log')}</div>`)}
      ${section('Your pharmacy', h`<div class="list">${R('Pharmacy details', c.ph.address || 'Name, address, owners', 'details', 'home')}${R('Services', Object.values(c.ph.services).filter(s => s.active).length + ' offered', 'services', 'box')}${R('Bought, selling or closing', 'What NSW Health requires', 'changes', 'gear')}${R('Backup and devices', c.ph.settings.lastBackup ? 'Last backup ' + fmt(c.ph.settings.lastBackup.slice(0, 10)) : 'No backup yet', 'backup', 'backup')}${c.store.dir().ids.length > 1 || true ? R('Pharmacies on this device', c.store.dir().ids.length + ' here', 'pharmacies', 'home') : ''}</div>`)}
      <p class="hint">Build ${window.PROPAPP_BUILD || 'dev'}</p>` });
  },
});
register('calendar', {
  tab: 'more',
  render(c) {
    const view = c.ui.calV || 'weeks', all = items(c.ph, c.drafts).flatMap(i => i.kind === 'person' ? i.parts.filter(p => isDate(p.date)).map(p => ({ ...i, title: p.title.includes(i.title) ? p.title : i.title + ' · ' + p.title, sub: 'Staff', date: p.date, bucket: bucket(p.date) })) : isDate(i.date) ? [i] : []);
    const t = today(), ws = weekStart(t);
    const grp = [['Overdue', all.filter(i => i.date < t)], ['This week', all.filter(i => i.date >= t && i.date < addDays(ws, 7))], ['Next week', all.filter(i => i.date >= addDays(ws, 7) && i.date < addDays(ws, 14))], ['Later', all.filter(i => i.date >= addDays(ws, 14))]];
    const months = {}; for (const i of all.filter(i => i.date >= t.slice(0, 7))) (months[i.date.slice(0, 7)] ??= []).push(i);
    const listOf = l => h`<div class="list">${ranked(l).sort((a, b) => a.date.localeCompare(b.date)).map(i => row({ title: i.title, legal: i.legal, sub: i.kind === 'action' ? 'Action' : i.sub, right: fmt(i.date, { weekday: true }), tone: i.date < t ? 'bad' : '', act: 'open', data: { key: i.key } }))}</div>`;
    return screen({ title: 'Calendar', back: true, body: h`
      <div class="seg">${[['weeks', 'Weeks'], ['year', 'Year']].map(([k, l]) => h`<button class="${k === view ? 'on' : ''}" data-act="v" data-v="${k}">${l}</button>`)}</div>
      ${view === 'weeks' ? grp.filter(([, l]) => l.length).map(([n, l]) => section(n + ' · ' + l.length, listOf(l))) : Object.entries(months).sort().map(([m, l]) => section(monthName(m + '-01'), listOf(l)))}
      ${all.length ? '' : empty('No dates yet.')}
      <div class="card"><h2>Put these dates in your phone calendar</h2><p class="muted">Download a calendar file and open it on your phone. Your due dates appear in your own calendar with a reminder the day before. Download it again when dates change.</p>${btn('Download calendar file', 'ics')}</div>` });
  },
  acts: { v: (c, d) => { c.ui.calV = d.v; c.rerender(); }, open: async (c, d) => { const { openItem } = await import('./today.js'); const it = items(c.ph, c.drafts).find(i => i.key === d.key); if (it) openItem(c, it); },
    ics: c => { const ok = saveFile(c.ph.name.replace(/\W+/g, '-') + '-due-dates.ics', ics(c.ph, c.drafts), 'text/calendar'); c.toast(ok ? 'Calendar file ready. If nothing downloads here, open PropApp in your phone’s browser.' : 'Downloads are blocked here.'); } },
});
register('history', {
  tab: 'more',
  render(c) {
    const q = (c.ui.histQ || '').toLowerCase(), type = c.ui.histT || 'all', all = historyRows(c.ph);
    const rows = all.filter(r => (type === 'all' || r.type === type) && (!q || (r.title + ' ' + r.detail + ' ' + r.by).toLowerCase().includes(q)));
    const types = ['all', ...new Set(all.map(r => r.type))], n = c.ui.histN || 40;
    return screen({ title: 'History', back: true, body: h`
      <label class="search">${icon('search')}<input class="input" name="q" placeholder="Search history" value="${c.ui.histQ || ''}" data-change="q"></label>
      <div class="chips">${types.map(t => h`<button class="chip ${t === type ? 'on' : ''}" data-act="t" data-t="${t}">${t === 'all' ? 'All' : t}</button>`)}</div>
      <p class="muted">${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} · kept on this device</p>
      <div class="btnrow">${btn('Download CSV', 'csv')}${btn('Copy as text', 'copy')}</div>
      <div class="list">${rows.slice(0, n).map(r => row({ title: r.title, sub: [r.type, r.status, r.detail].filter(Boolean).join(' · '), right: fmt(r.date), act: r.type === 'Action' ? 'act' : r.id ? 'rec' : '', data: { id: r.id }, chev: !!r.id }))}</div>
      ${rows.length > n ? btn('Show more', 'more', { kind: 'link' }) : ''}` });
  },
  changes: { q: (c, el) => { c.ui.histQ = el.value; c.rerender(); } },
  acts: { t: (c, d) => { c.ui.histT = d.t; c.rerender(); }, more: c => { c.ui.histN = (c.ui.histN || 40) + 60; c.rerender(); }, act: (c, d) => c.go('action', { id: d.id }), rec: (c, d) => c.go('record', { id: d.id }),
    csv: c => { const ok = saveFile('history-' + c.ph.name.replace(/\W+/g, '-') + '-' + today() + '.csv', csv(c.ph, historyRows(c.ph)), 'text/csv'); c.toast(ok ? 'CSV ready' : 'Downloads are blocked here. Use Copy as text.'); },
    copy: async c => { try { await navigator.clipboard.writeText(printable(c.ph, historyRows(c.ph))); c.toast('Copied'); } catch { c.toast('Copy didn’t work here.'); } } },
});
