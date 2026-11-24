// Draft procedures from setup answers, using the current app's generator code unchanged (content/legacy-procgen.js).
import { install } from './content/legacy-procgen.js';
import { serviceName } from './rules.js';
import { C } from './content.js';
let cur = null;
const sopFields = Object.fromEntries(Object.entries(C.services.setupFields).map(([k, l]) => [k, l.map(f => [f.key, f.label, f.options, f.section, f.extra])]));
const env = { state: {}, sopValues: id => RPH.qm.migrate(id, { ...(cur?.ph.services[id]?.answers || {}) }), serviceName, sopFields };
const { RPH, fsFields, normalise } = install(env);
// Same adjustments the current app's otp-parts layer makes: one OTP procedure action, no per-part actions.
(() => { const M = RPH.qm.meta.otp; if (M.otpGovernance) M.otpGovernance.checkTask = 'Finish your OTP procedure (OTP Standards, item 1)'; for (const k of ['incidents', 'incidentProcess', 'films', 'takeawayControls', 'maintenance']) if (M[k]) delete M[k].task; })();
// Content v2 (C2-05): pharmacist prescribing items checked against NSW Health pages read 20 Nov 2026
// (uat/research/nsw-health-site-findings: p026 expanded scope, p108 FAQ, p010/p027 Queensland-trained pharmacists,
// Class Authorities). Added after the current app's lists, so its own options and items are unchanged.
(() => { const M = RPH.qm.meta.prescribing; if (!M?.pathway || !M.prescribing2026) return;
  const QLD = [['Musculoskeletal pain', 'Mild acute musculoskeletal pain (Queensland-trained pharmacists only)'], ['Reflux', 'Reflux (GOR or GORD) (Queensland-trained pharmacists only)'], ['Rhinitis', 'Allergic or non-allergic rhinitis (Queensland-trained pharmacists only)'], ['Acne', 'Mild to moderate acne (Queensland-trained pharmacists only)'], ['Nausea and vomiting', 'Acute nausea and vomiting (Queensland-trained pharmacists only)']];
  for (const [v, t] of QLD) if (!M.pathway.options.includes(v)) { M.pathway.options.push(v); M.pathway.display[v] = t; }
  M.prescribing2026.items.push(
    { v: 'Contraception limits', t: 'Contraception: vaginal rings are supplied only, and DMPA injections are given only by a pharmacist with the PSA injection course and indemnity cover' },
    { v: 'Working with Children Check', t: 'A Working with Children Check is held where one is needed (for example, pharmacists who treat under-18s)' },
    { v: 'Intention form (Queensland-trained)', t: 'Queensland-trained pharmacists providing the extra conditions have submitted NSW Health’s “Intention to provide expanded community pharmacy services” form (again if their place of practice changes)' },
    { v: 'Authorities expire 4 Nov 2027', t: 'The Class Authorities expire on 4 November 2027: check NSW Health for their replacements before then' });
})();
// The only wording change from the current app: drafts are adopted in Procedures (not "approved in Policies").
export const procWording = t => String(t).replace('and approve it in Policies.', 'and adopt it in Procedures.').replace(/\(Policies\)/g, '(Procedures)');
export function draftText(ph, id) {
  const t = RPH.proc.templates[id]; if (!t) return '';
  cur = { ph }; env.state.pharmacyName = ph.name; env.state.serviceLead = ph.lead || ''; env.state.siteScope = ph.siteScope || {}; env.state.active = Object.keys(ph.services).filter(k => ph.services[k].active);
  try { const text = RPH.proc.build(id, t); return procWording(text.split('\n').filter(l => !/Full Draft 0\.2|workflow handover/i.test(l)).join('\n')); } finally { cur = null; }
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
