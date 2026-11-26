// "Onboard me": a short guide per service (unified 17-service spec, 26 Nov 2026). Opening it, or an official source,
// changes nothing; "Return to setup" goes back to the same question with what was typed. One optional follow-up can be
// saved as an action (an existing open one is shown instead of a duplicate). Nothing is ticked or adopted for the owner.
import { register } from '../app.js';
import { h } from '../util.js';
import { screen, btn, note } from '../ui.js';
import { ONBOARD, qsppNotice } from '../content/onboard.js';
import { serviceName } from '../rules.js';
import { addDays, today } from '../dates.js';
import { newAction, note as log } from '../model.js';
export const hasGuide = id => !!ONBOARD[id];
const followOf = (ph, id) => Object.values(ph.actions).find(a => a.status === 'open' && a.source?.type === 'onboard' && a.source.service === id);
// Dated or conditional notices for a service (also shown on its first setup question).
export function serviceNotices(ph, id) { const g = ONBOARD[id], out = [];
  if (g?.notice) out.push(note(h`<b>${g.notice[0]}:</b> ${g.notice[1]}`, 'warn'));
  const q = qsppNotice(id, ph.services?.[id]?.answers || {}); if (q) out.push(note(q, 'warn'));
  return out; }
register('onboard', {
  tab: 'more',
  render(c, r) { const g = ONBOARD[r.id]; if (!g) return screen({ title: 'Onboard me', back: true, body: h`<p class="muted">No guide for this service yet.</p>` });
    const f = followOf(c.ph, r.id);
    return screen({ title: 'Onboard me · ' + serviceName(r.id), back: true, body: h`
      <p class="whyask"><b>What this is:</b> ${g.what}</p>
      ${serviceNotices(c.ph, r.id)}
      <ol class="obsteps">${g.steps.map(([head, text, src]) => h`<li><p><b>${head}.</b> ${text}</p>${src.length ? h`<details class="obsrc"><summary>Official source${src.length > 1 ? 's' : ''}</summary><ul class="plain">${src.map(([l, u]) => h`<li><a href="${u}" target="_blank" rel="noopener noreferrer">${l} ↗</a></li>`)}</ul></details>` : ''}</li>`)}</ol>
      ${note(h`<b>Watch for:</b> ${g.watch}`, 'warn')}
      <div class="btnrow obacts">${f ? btn('Open your follow-up', 'go', { data: { to: 'action', id: f.id } }) : btn('Add a follow-up', 'follow', { data: { id: r.id } })}${btn('Return to setup', 'back', { kind: 'primary' })}</div>
      <p class="hint">${f ? 'Your follow-up “' + f.title + '” is open in Actions.' : 'Optional: saves one action, “' + g.follow + '”, that you can edit.'}</p>` }); },
  acts: {
    follow: (c, d) => { const g = ONBOARD[d.id]; if (!g || followOf(c.ph, d.id)) { c.rerender(); return; } let id;
      c.change(ph => { id = newAction(ph, { title: g.follow, due: addDays(today(), 30), source: { type: 'onboard', service: d.id, label: 'Onboard me · ' + serviceName(d.id) } }).id; log(ph, 'Onboarding follow-up added · ' + serviceName(d.id)); }, 'Follow-up added. You can edit it in Actions.'); },
  },
});
