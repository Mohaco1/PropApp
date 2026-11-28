// Counter Quick-Answer: a search box and ten question chips; one answer at a time with its legal basis in one line and
// one tap to the screen it's about. The words typed are kept only in memory for this screen (never saved), and the
// engine (../assistant.js) is read-only.
import { register } from '../app.js';
import { h, html } from '../util.js';
import { screen, icon, btn } from '../ui.js';
import { QUESTIONS, ask } from '../assistant.js';
import { today } from '../dates.js';

function answer(c) {
  const id = c.ui.askId || '', q = (c.ui.askQ || '').trim();
  if (!id && q.length < 2) return '';
  const a = ask(c.ph, id || q, today());
  if (!a) return h`<div class="qa-miss" role="status"><p>No quick answer for “${q}” yet. Tap a question below, or search everything.</p>${btn('Search reviews, actions, staff and rules', 'search', { kind: 'link' })}</div>`;
  const L = a.link;
  return h`<section class="qa-answer" aria-live="polite" aria-labelledby="qa-q"><h2 id="qa-q" class="qa-q">${a.q}</h2><p class="qa-text">${a.text}</p>
    <p class="qa-cite"><span class="qa-law">${a.cite.line}</span>${a.cite.url ? h`<a class="linkbtn" href="${a.cite.url}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ''}</p>
    ${btn(L.label, 'follow', { kind: 'primary', cls: 'qa-go', data: { to: L.to || '', id: L.id || '', tab: L.tab || '', filter: L.filter || '' } })}
    ${a.also?.length ? h`<p class="qa-also">Also: ${a.also.map(x => { const y = QUESTIONS.find(z => z.id === x); return h`<button class="linkbtn" data-act="pick" data-id="${x}">${y.chip}</button>`; })}</p>` : ''}</section>`;
}
register('ask', {
  tab: 'more',
  render(c) {
    const id = c.ui.askId || '';
    return screen({ title: 'Quick answers', back: true, body: h`
      <form class="qa-form" data-form="ask" role="search"><label class="search"><span class="sr-only">Ask a question</span>${icon('search')}<input class="input" name="q" type="search" enterkeyhint="search" placeholder="Ask, e.g. who can witness S8 destruction" value="${c.ui.askQ || ''}" data-input="q" autocomplete="off"></label>
      <span class="hint">No patient names. Nothing you type here is saved.</span></form>
      <div id="qa-out">${answer(c)}</div>
      <div class="qa-chips" role="group" aria-label="Common questions">${QUESTIONS.map(x => h`<button class="qa-chip${x.id === id ? ' on' : ''}" data-act="pick" data-id="${x.id}" aria-pressed="${String(x.id === id)}">${x.chip}</button>`)}</div>` });
  },
  inputs: { q: (c, el) => { c.ui.askQ = el.value; c.ui.askId = ''; for (const b of document.querySelectorAll('.qa-chip')) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); } document.getElementById('qa-out').innerHTML = html(answer(c)); } },
  forms: { ask: (c, f) => { c.ui.askQ = f.q || ''; c.ui.askId = ''; c.rerender(); } },
  acts: {
    pick: (c, d) => { c.ui.askId = c.ui.askId === d.id ? '' : d.id; c.ui.askQ = ''; c.rerender(); window.scrollTo(0, 0); },
    follow: (c, d) => { if (d.tab) { c.tab(d.tab); if (d.filter) { c.ui.todayFilter = d.filter; c.rerender(); } return; } c.go(d.to, d.id ? { id: d.id } : {}); },
    search: c => { c.ui.q = c.ui.askQ || ''; c.go('search'); },
  },
});
