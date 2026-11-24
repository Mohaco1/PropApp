// Today (mode 1, the weekly glance): the date and one sentence, one card on top, then the list. Counts come from summary.js.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, row, btn, empty, icon } from '../ui.js';
import { items, ranked, counts, sentence, inWeek } from '../summary.js';
import { fmt, dueText, today, daysBetween, isDate } from '../dates.js';
import { C } from '../content.js';
import { undated } from './services.js';
import { serviceName } from '../rules.js';
import { unreadUpdates } from './updates.js';
import { isPWA, standalone } from '../pwa.js';
const FILTERS = [['overdue', 'Overdue'], ['week', 'This week'], ['waiting', 'Waiting · to confirm'], ['all', 'All']];
export function openItem(c, it) {
  if (it.kind === 'visit') return c.go('visit-start', { extra: it.ref === 'extra' });
  if (it.kind === 'meeting') return c.go('meeting', { id: it.ref });
  if (it.kind === 'review') return c.go('review', { id: it.ref });
  if (it.kind === 'action') return c.go('action', { id: it.ref });
  if (it.kind === 'person') return c.go('person', { id: it.ref });
  if (it.kind === 'verify') return c.go('service', { id: it.ref });
  if (it.kind === 'procedure') return c.go('procedure', { id: it.ref });
}
function topCard(c, list) {
  const ph = c.ph;
  const vx = c.draft('visit/extra'), vq = c.draft('visit/quarterly');
  if (vq || vx) { const d = vq || vx, n = Object.values(d.items || {}).filter(s => s?.status).length;
    return h`<div class="card hero warm"><p class="eyebrow">Visit in progress</p><h2>${vq ? 'Quarterly visit' : 'Extra visit'} · ${n} checked</h2><p class="muted">Started ${fmt(d.date)}. Your answers are saved on this device.</p>${btn('Resume visit', 'resume-visit', { kind: 'primary', data: { extra: vq ? '' : '1' } })}</div>`; }
  const act = Object.entries(ph.services).filter(([, s]) => s.active), todo = act.filter(([, s]) => s.setup !== 'done');
  if (todo.length) return h`<div class="card hero"><p class="eyebrow">Finish setting up · ${todo.length} left</p>
    <ul class="checklist">${act.map(([id, s]) => h`<li class="${s.setup === 'done' ? 'done' : ''}"><span aria-hidden="true">${s.setup === 'done' ? '✓' : '○'}</span>${serviceName(id)}<span class="muted">${s.setup === 'done' ? 'Done' : s.setup === 'doing' ? 'In progress' : 'To do'}</span></li>`)}</ul>
    ${btn(todo.some(([, s]) => s.setup === 'doing') ? 'Carry on setting up' : 'Set up services', 'setupnext', { kind: 'primary', data: { id: (todo.find(([, s]) => s.setup === 'doing') || todo[0])[0] } })}</div>`;
  if (act.length && !ph.settings.allSetSeen) return h`<div class="card hero warm"><p class="eyebrow">All set up</p><h2>${ph.name} is set up</h2><p class="muted">Every service has its questions answered and a draft procedure. Today now shows what's due.</p>${btn('Got it', 'allset', { kind: 'primary' })}</div>`;
  const nd = undated(ph).length;
  if (nd) return h`<div class="card hero"><p class="eyebrow">Almost there</p><h2>${nd === 1 ? '1 review needs' : nd + ' reviews need'} a first date</h2><p class="muted">The app suggests dates. You check them and save.</p>${btn('Plan the dates', 'go', { kind: 'primary', data: { to: 'first-dates' } })}</div>`;
  const last = ph.settings.lastBackup, changes = ph.history.filter(x => !last || x.at > last).length;
  if (changes > 25 && (!last || daysBetween(last.slice(0, 10), today()) > 30)) return h`<div class="card"><h2>Save a backup</h2><p class="muted">${last ? 'Last backup ' + fmt(last.slice(0, 10)) : 'No backup yet'} · ${changes} changes since. Your records live only on this device.</p>${btn('Back up now', 'go', { data: { to: 'backup' } })}</div>`;
  const q1 = list.find(i => i.ref === 'Q1');
  if (q1 && (!isDate(q1.date) || daysBetween(today(), q1.date) <= 14)) return h`<div class="card hero"><p class="eyebrow">Site visit</p><h2>${q1.bucket === 'overdue' ? 'Your quarterly visit is overdue' : q1.date ? 'Quarterly visit due ' + fmt(q1.date) : 'Plan your first site visit'}</h2>${btn('Start a visit', 'go', { kind: 'primary', data: { to: 'visit-start' } })}</div>`;
  return '';
}
export function switcher(c) {
  const n = c.store.dir().ids.length;
  return h`<button class="iconbtn" data-act="go" data-to="search" aria-label="Search">${icon('search')}</button>`;
}
register('today', {
  tab: 'today',
  render(c) {
    const all = items(c.ph, c.drafts), n = counts(all), f = c.ui.todayFilter || (n.overdue ? 'overdue' : 'all');
    const pick = f === 'all' ? all.filter(i => i.bucket !== 'tocheck') : f === 'week' ? all.filter(inWeek) : f === 'waiting' ? all.filter(i => i.waiting || i.bucket === 'tocheck') : f === 'nodate' ? all.filter(i => i.bucket === 'nodate') : all.filter(i => i.bucket === f);
    const cnt = { overdue: n.overdue, week: all.filter(inWeek).length, waiting: n.waiting + n.tocheck, all: n.all - n.tocheck };
    const s = sentence(all);
    const list = ranked(pick);
    return screen({ title: 'Today', sub: c.ph.name, right: switcher(c), body: h`
      <p class="status"><span class="date">${fmt(today(), { weekday: true })}</span><span class="${s.tone}">${s.text}</span>${s.start && s.tone !== 'ok' ? h` Start with ${s.start.title}.` : ''}</p>
      ${(() => { const ids = c.store.dir().ids; if (ids.length < 2) return ''; const tot = ids.reduce((t, id) => { const p = c.store.pharmacy(id); return t + (p ? counts(items(p, c.store.drafts(id))).overdue : 0); }, 0);
        return h`<button class="siteline" data-act="go" data-to="allsites">${tot === 1 ? '1 overdue' : tot + ' overdue'} across your ${ids.length} pharmacies · see all</button>`; })()}
      ${isPWA() && !standalone() && !c.ph.flags?.installHintDone ? h`<div class="installline"><button class="quietline" data-act="go" data-to="backup">Add R.Pharmacy to your Home Screen before you enter records · how</button><button class="iconbtn" data-act="hideinstall" aria-label="Hide this">✕</button></div>` : ''}
      ${topCard(c, all)}
      <div class="filters" role="tablist">${FILTERS.map(([k, l]) => h`<button role="tab" aria-selected="${String(k === f)}" class="${k === f ? 'on' : ''}" data-act="filter" data-f="${k}"><b>${cnt[k]}</b><span>${l}</span></button>`)}</div>
      ${(u => u ? h`<button class="updline" data-act="go" data-to="updates">${icon('bell')}<span>${u === 1 ? '1 law update' : u + ' law updates'} to read</span>${icon('chev', 'chev')}</button>` : '')(unreadUpdates(c.ph).length)}
      ${n.nodate && f !== 'nodate' ? h`<button class="quietline" data-act="filter" data-f="nodate">${n.nodate === 1 ? '1 review has' : n.nodate + ' reviews have'} no date yet · show</button>` : ''}
      <div class="list">${list.length ? list.map(i => row({ title: i.title, sub: i.sub, legal: i.legal, right: i.bucket === 'started' ? 'In progress' : i.started ? 'Started · ' + dueText(i.date) : i.bucket === 'tocheck' ? 'When you can' : dueText(i.date), tone: i.bucket === 'overdue' ? 'bad' : i.bucket === 'today' ? 'warn' : '', act: 'open', data: { key: i.key } })) : empty(f === 'overdue' ? 'Nothing overdue.' : 'Nothing here.')}</div>` })

  },
  acts: {
    hideinstall: c => c.change(ph => { (ph.flags ??= {}).installHintDone = true; }),
    filter: (c, d) => { c.ui.todayFilter = d.f; c.rerender(); },
    open: (c, d) => { const it = items(c.ph, c.drafts).find(i => i.key === d.key); if (it) openItem(c, it); },
    'resume-visit': (c, d) => c.go('visit', { extra: !!d.extra }),
    setupnext: (c, d) => c.ph.services[d.id]?.setup === 'doing' ? c.go('service-setup', { id: d.id }) : c.go('services'),
    allset: c => c.change(ph => { ph.settings.allSetSeen = true; }),
  },
});
