// Draft procedures from setup answers, using the current app's generator code unchanged (content/legacy-procgen.js).
import { install } from './content/legacy-procgen.js';
import { serviceName } from './rules.js';
import { C } from './content.js';
let cur = null;
const sopFields = Object.fromEntries(Object.entries(C.services.setupFields).map(([k, l]) => [k, l.map(f => [f.key, f.label, f.options, f.section, f.extra])]));
const env = { state: {}, sopValues: id => RPH.qm.migrate(id, { ...(cur?.ph.services[id]?.answers || {}) }), serviceName, sopFields };
const { RPH, fsFields, normalise } = install(env);
export function draftText(ph, id) {
  const t = RPH.proc.templates[id]; if (!t) return '';
  cur = { ph }; env.state.pharmacyName = ph.name; env.state.serviceLead = ph.lead || ''; env.state.siteScope = ph.siteScope || {}; env.state.active = Object.keys(ph.services).filter(k => ph.services[k].active);
  try { const text = RPH.proc.build(id, t); return text.split('\n').filter(l => !/Full Draft 0\.2|workflow handover/i.test(l)).join('\n'); } finally { cur = null; }
}
// Items still marked [Confirm: …] or "— verify": adoption is blocked while any remain (owner decision, current app).
export function blockers(text) {
  const out = []; for (const m of String(text).matchAll(/\[Confirm: ([^\]]+)\]/g)) if (!out.includes(m[1])) out.push(m[1]);
  if (/— verify/.test(text)) out.push('steps marked “— verify”');
  return out;
}
export const qm = RPH.qm;
// Which setup questions to show for these answers (same rule as the current app).
export function visibleFields(ph, id, answers) { cur = { ph }; env.state.siteScope = ph.siteScope || {}; env.state.serviceLead = ph.lead || ''; try { return fsFields(id, answers || {}); } finally { cur = null; } }

// Tidy answers the way the current app does when they are saved (leads, linked answers).
export function tidyAnswers(ph, id, values) { cur = { ph }; env.state.serviceLead = ph.lead || ''; try { return normalise(ph, id, values); } finally { cur = null; } }
export { RPH };
