// Law and practice updates (Content v2, C2-04): what changed and what's no longer required, each with its source.
// "I've read this" is kept per pharmacy (it is not a compliance tick). Today shows one quiet line while any are unread.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, section } from '../ui.js';
import { fmt, today } from '../dates.js';
import { UPDATES } from '../content/updates.js';
import { sourceByKey } from '../content/sources.js';
import { note as log } from '../model.js';
export const unreadUpdates = ph => UPDATES.filter(u => !ph.flags?.updatesRead?.[u[0]]);
const list = xs => h`<ul class="plain">${xs.map(x => h`<li>${x}</li>`)}</ul>`;
register('updates', {
  tab: 'more',
  render(c) {
    const read = c.ph.flags?.updatesRead || {}, n = unreadUpdates(c.ph).length;
    const card = ([id, date, title, src, changed, gone, where]) => h`<article class="card upd${read[id] ? ' read' : ''}" id="upd-${id}">
      <p class="eyebrow">From ${fmt(date)}${read[id] ? ' · read ' + fmt(read[id]) : ''}</p><h2 class="upd-title">${title}</h2>
      <p class="sec-title">What changed</p>${list(changed)}
      ${gone.length ? h`<p class="sec-title">No longer required</p>${list(gone)}` : ''}
      <p class="meta">In the app: ${where}</p>
      <p class="src-acts">${src.map(k => sourceByKey(k)).filter(Boolean).map(s => h`<a class="linkbtn" href="${s[4]}" target="_blank" rel="noopener noreferrer">${s[1]} ↗</a>`)}</p>
      ${read[id] ? '' : btn('I’ve read this', 'read', { data: { id } })}</article>`;
    return screen({ title: 'Law and practice updates', back: true, body: h`<p class="muted">${n ? (n === 1 ? '1 update to read.' : n + ' updates to read.') : 'All read.'} Each is from the official page linked under it.</p>
      ${UPDATES.filter(u => !read[u[0]]).map(card)}
      ${UPDATES.some(u => read[u[0]]) ? section('Read', UPDATES.filter(u => read[u[0]]).map(card)) : ''}` });
  },
  acts: {
    read: (c, d) => c.change(ph => { ((ph.flags ??= {}).updatesRead ??= {})[d.id] = today(); log(ph, 'Law update read · ' + UPDATES.find(u => u[0] === d.id)[2]); }, 'Marked as read'),
  },
});

// A2: one "Law and sources" entry on More, holding the updates (with their unread count) and the sources list.
register('lawsources', {
  tab: 'more',
  render(c) { const u = unreadUpdates(c.ph).length;
    return screen({ title: 'Law and sources', back: true, body: h`<div class="list">
      <button class="row" data-act="go" data-to="updates"><span class="row-main"><span class="row-title">Law and practice updates</span><span class="row-sub">${u ? (u === 1 ? '1 to read' : u + ' to read') : 'All read'}</span></span>${u ? h`<span class="badge">${u} new</span>` : ''}</button>
      <button class="row" data-act="go" data-to="sources"><span class="row-main"><span class="row-title">Sources</span><span class="row-sub">Where each rule comes from, with links</span></span></button></div>` }); },
});
