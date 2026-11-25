// Sources (current app's Sources screen, codex-fixes.js; Content v2 C2-01): every source the app's rules come from,
// where each is used here, a link to the page itself, and "This source changed", which raises one action listing what
// to look at again. Nothing is changed for the owner, and adopted procedures keep their versions.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, section } from '../ui.js';
import { C } from '../content.js';
import { fmt, today, addDays } from '../dates.js';
import { catalog, applies, activeServices, serviceName } from '../rules.js';
import { draftText } from '../procgen.js';
import { questionsFor } from './reviews.js';
import { newAction } from '../model.js';
import { SOURCES } from '../content/sources.js';
const L = C.law;
// Where each source is used in this pharmacy: its procedures, the reviews that apply, and the legal obligations.
export function usedBy(ph) {
  const out = Object.fromEntries(SOURCES.map(([k]) => [k, []])), hit = (text, where) => { for (const [k, , , re] of SOURCES) if (re.test(text)) out[k].push(where); };
  for (const id of activeServices(ph)) { let t = ''; try { t = draftText(ph, id) || ''; } catch {} hit(t, serviceName(id) + ' procedure'); }
  for (const a of catalog().filter(a => applies(ph, a).applies)) hit([a.name, a.check, ...questionsFor(a.id).map(q => q.text)].join(' '), a.name + ' (review)');
  for (const o of L.OBL.filter(o => !o[5].length || o[5].some(s => activeServices(ph).includes(s)))) hit(o.slice(1, 4).join(' '), 'Legal obligations · ' + o[2]);
  for (const k in out) out[k] = [...new Set(out[k])];
  return out;
}
const link = url => h`<a class="linkbtn" href="${url}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`;
register('sources', {
  tab: 'more',
  render(c) {
    const used = usedBy(c.ph), raised = c.ph.flags?.sourceChecks || {};
    const card = ([k, title, read, , url]) => { const u = used[k];
      return h`<div class="row static src"><span class="row-main"><span class="row-title">${title}</span><span class="row-sub">${read === 'quoted' ? 'Quoted by the 25 Nov independent review (this site blocks automated reading here)' : read ? 'Last read ' + fmt(read) : 'Link from the 25 Nov review, not yet checked'}${u.length ? ' · used in ' + u.length + (u.length === 1 ? ' place' : ' places') : ''}</span>
        ${u.length ? h`<details class="src-used"><summary>Where it’s used</summary><ul class="plain">${u.map(x => h`<li>${x}</li>`)}</ul></details>` : ''}
        <span class="src-acts">${link(url)}${u.length ? (raised[k] ? h`<span class="meta">Re-check raised ${fmt(raised[k])}</span>` : btn('This source changed', 'changed', { kind: 'link', data: { k } })) : ''}</span></span></div>`; };
    const inUse = SOURCES.filter(s => used[s[0]].length), other = SOURCES.filter(s => !used[s[0]].length);
    return screen({ title: 'Sources', back: true, body: h`<p class="muted">Every rule in the app comes from one of these. If one changes, tap “This source changed”: you get one action listing what to look at again. Nothing is changed for you.</p>
      ${section('Used in your pharmacy · ' + inUse.length, h`<div class="list">${inUse.map(card)}</div>`)}
      ${other.length ? section('Other sources', h`<div class="list">${other.map(card)}</div>`) : ''}
      <p class="hint">Links open the official page in your browser. Everything else in the app works without a connection.</p>` });
  },
  acts: {
    changed: (c, d) => { const s = SOURCES.find(x => x[0] === d.k), u = usedBy(c.ph)[d.k];
      c.change(ph => { const act = newAction(ph, { title: 'Re-check after a change to ' + s[1], due: addDays(today(), 30), source: { kind: 'source', label: 'Sources · ' + s[1] } }); act.recheck = u; // F-LIVE-05: short title; the places are listed on the action
        ((ph.flags ??= {}).sourceChecks ??= {})[d.k] = today(); }, 'Action raised. It’s in Actions.'); },
  },
});
