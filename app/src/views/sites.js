// All pharmacies (V3-04; owner un-deferred the multi-store summary, 25 Nov 2026). Only reachable with 2 or more
// pharmacies on the device. Each pharmacy's overdue and this-week items, counted the same way as its own Today
// (summary.js), grouped by pharmacy. Tapping a pharmacy or an item switches to it. Nothing is done across sites.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, row, section } from '../ui.js';
import { items, ranked, counts, inWeek } from '../summary.js';
import { dueText } from '../dates.js';
import { openItem } from './today.js';
export function siteSummaries(c) {
  return c.store.activeIds().map(id => { const p = c.store.pharmacy(id); if (!p) return null; const all = items(p, c.store.drafts(id)), n = counts(all);
    return { id, name: p.name, overdue: n.overdue, week: all.filter(i => i.bucket !== 'overdue' && inWeek(i)).length, list: ranked(all.filter(i => i.bucket === 'overdue' || inWeek(i))) }; }).filter(Boolean);
}
register('allsites', {
  tab: 'today',
  render(c) {
    const s = siteSummaries(c), od = s.reduce((t, x) => t + x.overdue, 0), wk = s.reduce((t, x) => t + x.week, 0);
    return screen({ title: 'All pharmacies', back: true, body: h`<p class="status">${od === 1 ? '1 overdue' : od + ' overdue'} and ${wk} more this week, across ${s.length} pharmacies.</p>
      ${s.map(x => section(x.name + ' · ' + (x.overdue ? x.overdue + ' overdue' : 'nothing overdue'), h`<div class="list">
        ${x.list.slice(0, 6).map(i => row({ title: i.title, sub: i.sub, legal: i.legal, right: i.bucket === 'started' ? 'In progress' : dueText(i.date), tone: i.bucket === 'overdue' ? 'bad' : 'warn', act: 'item', data: { site: x.id, key: i.key } }))}
        ${x.list.length > 6 ? row({ title: 'Open ' + x.name, sub: (x.list.length - 6) + ' more', act: 'site', data: { site: x.id } }) : ''}
        ${x.list.length ? '' : row({ title: 'Open ' + x.name, sub: 'Nothing due this week', act: 'site', data: { site: x.id }, tone: 'ok' })}</div>`))}` });
  },
  acts: {
    site: async (c, d) => { await c.open(d.site); c.tab('today'); },
    item: async (c, d) => { await c.open(d.site); c.tab('today'); const it = items(c.ph, c.drafts).find(i => i.key === d.key); if (it) openItem(c, it); },
  },
});
