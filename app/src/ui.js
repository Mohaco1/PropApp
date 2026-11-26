// Shared building blocks. One shell for every screen (design rule 4), thumb-sized controls (rule 11).
import { h, raw } from './util.js';
// The PharmLedger mark: Gemini's exact Option C geometry in the final "Top-right" colours (26 Nov): a Midnight Navy (#0f2942)
// ledger with a Warm Ivory (#fafaf8) spine cut, wrapping a right-edge cutout that holds the Deep Teal (#0f766e) plus, on a
// Warm Ivory tile (1px #dbe3ea edge on light headers). tools/make-icons.js draws the same MARK.
export const LOGO_MARK = '<path d="M7 6.5h11.5a2 2 0 0 1 2 2v2.2h-2.5a2.3 2.3 0 0 0-2.3 2.3v6a2.3 2.3 0 0 0 2.3 2.3h2.5v2.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z" fill="#0f2942"/><rect x="9.2" y="6.5" width="1.7" height="19" fill="#fafaf8"/><path d="M21 11.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" fill="#0f766e"/>';
export const logo = (size = 28) => raw(`<svg class="logo" width="${size}" height="${size}" viewBox="0 0 32 32" role="img" aria-label="PharmLedger" xmlns="http://www.w3.org/2000/svg"><rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="#fafaf8" stroke="#dbe3ea" stroke-width="1"/>${LOGO_MARK}</svg>`);
// How many pharmacies are on this device (set by app.js each render): the site switch is a pill only when there are several.
export const env = { sites: 1 };
const I = {
  today: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  reviews: '<path d="M9 11l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>',
  actions: '<path d="M5 12l4 4L19 6"/>',
  staff: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.5c2.4-.4 4.3 1 5 4"/>',
  more: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', history: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  box: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M8 7V5h8v2"/>', lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  visit: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', log: '<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  people: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>', backup: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', check: '<path d="M5 12l4 4L19 6"/>',
};
// Visual Polish spec: one 1.8-stroke icon per service, shown on Service and Procedure list rows.
const SV = {
  otp: '<path d="M7 4h10l-1.2 16H8.2z"/><path d="M7.6 9h8.8"/>',
  daa: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M4 14.5h16M9.3 5v14M14.7 5v14"/>',
  staged: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><circle cx="9" cy="15" r=".9"/><circle cx="15" cy="15" r=".9"/>',
  vaccination: '<path d="M17 3l4 4M15.5 4.5l4 4M17.5 6.5L9 15l-2.5.5.5-2.5L15.5 4.5"/><path d="M11 8.5l4.5 4.5M7 17l-3 3"/>',
  prescribing: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 18v-6h2.3a1.7 1.7 0 0 1 0 3.4H10M12 15.4l2.6 2.6"/>',
  reviews: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M9 13l2 2 4-4"/>',
  delivery: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  simple: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M14 11l5-7"/>',
  complex: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
  aged: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M12 17.5s-3-1.8-3-3.7a1.5 1.5 0 0 1 3-.3 1.5 1.5 0 0 1 3 .3c0 1.9-3 3.7-3 3.7z"/>',
  screening: '<path d="M3 12h4l2-4 3 8 2-4h7"/>',
  adherence: '<path d="M8.2 19.6a4 4 0 0 1-5.7-5.7l8.2-8.2a4 4 0 0 1 5.7 5.7z"/><path d="M6.6 9.8l5.7 5.7"/><path d="M17 15h4M19 13v4"/>',
  nsp: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 9v6M9 12h6"/>',
  certificates: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 15l2 2 4-4"/>',
  vaping: '<path d="M7 18a4 4 0 0 1-.6-8 5 5 0 0 1 9.7-1.3A3.6 3.6 0 0 1 17 18z"/>',
  cannabis: '<path d="M12 21v-6M12 15c-5 0-8-4-8-9 5 0 8 4 8 9zM12 15c5 0 8-4 8-9-5 0-8 4-8 9z"/>',
  funding: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.6c-.5-.9-1.4-1.4-2.5-1.4-1.4 0-2.5.8-2.5 1.9s1.1 1.6 2.5 1.9 2.5.8 2.5 1.9-1.1 1.9-2.5 1.9c-1.1 0-2-.5-2.5-1.4M12 6.6v1.6M12 15.8v1.6"/>',
};
export const svcIcon = id => raw(`<span class="row-ic" aria-hidden="true"><svg viewBox="0 0 24 24">${SV[id] || I.doc}</svg></span>`);
// Visual Polish spec: one bottom sheet for quick confirmations. One primary action; the backdrop and Cancel both dismiss.
export const sheet = ({ title, body = '', primary, cancel }) => h`<div class="sheet-wrap"><button type="button" class="sheet-back" data-act="${cancel}" aria-label="Cancel" tabindex="-1"></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${title}"><span class="sheet-handle" aria-hidden="true"></span><h2>${title}</h2>${body}<div class="btnrow">${primary}${btn('Cancel', cancel)}</div></div></div>`;
export const icon = (n, cls = '') => raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`);
// R07: \`site\` names the pharmacy on edit screens, only when there are 2 or more on the device (plain text, not a switch).
export function screen({ title, sub = '', back = null, saved = '', body, primary = null, wide = false, right = '', site = '' }) {
  return h`<div class="screen${wide ? ' wide' : ''}">
    <header class="bar">${back ? h`<button class="iconbtn" data-act="back" aria-label="Back">${icon('back')}</button>` : h`<span class="mark" aria-hidden="true">${logo(22)}</span>`}
      <h1 class="bar-title">${title}${site && !sub && env.sites > 1 ? h`<span class="ph-sub">${site}</span>` : ''}${sub ? (env.sites > 1 ? h`<button class="ph-sub ph-switch multi" data-act="go" data-to="pharmacies" aria-label="Pharmacy: ${sub}. Switch pharmacy"><span class="sw-pill">${sub} ▾</span></button>` : h`<button class="ph-sub ph-switch single" data-act="go" data-to="pharmacies" aria-label="Pharmacy: ${sub}. Add or switch pharmacy">${sub}</button>`) : ''}</h1>${saved ? h`<span class="saved" aria-live="polite">${saved}</span>` : ''}${right}</header>
    <main class="body">${body}</main>
    ${primary ? h`<div class="dock">${primary}</div>` : ''}
  </div>`;
}
export const btn = (label, act, { kind = 'secondary', data = {}, type = 'button', disabled = false, cls = '' } = {}) =>
  h`<button type="${type}" class="btn ${kind} ${cls}" ${act ? raw(`data-act="${act}"`) : ''} ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '))} ${disabled ? raw('disabled') : ''}>${label}</button>`;
export const row = ({ title, sub = '', right = '', tone = '', act = '', data = {}, chev = true, legal = false, ic = '' }) =>
  h`<button class="row ${tone}${ic ? ' has-ic' : ''}" data-act="${act}" ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '))}>
    ${ic || ''}<span class="row-main"><span class="row-title">${title}</span>${sub || legal ? h`<span class="row-sub">${legal ? h`<span class="law">Required by law</span> ` : ''}${sub}</span>` : ''}</span>
    ${right ? h`<span class="row-right ${tone}">${right}</span>` : ''}${chev ? icon('chev', 'chev') : ''}</button>`;
export const section = (label, inner, extra = '') => h`<section class="sec"><div class="sec-head"><h2 class="sec-title">${label}</h2>${extra}</div>${inner}</section>`;
export const empty = text => h`<p class="empty">${text}</p>`;
export const note = (text, tone = 'info') => h`<p class="note ${tone}">${text}</p>`;
export const why = (summary, text) => h`<details class="why"><summary>${summary}</summary><div class="why-body">${text}</div></details>`;
export function seg(name, options, value) {
  return h`<div class="seg" role="tablist">${options.map(([v, l]) => h`<button role="tab" aria-selected="${String(v === value)}" class="${v === value ? 'on' : ''}" data-act="seg" data-name="${name}" data-value="${v}">${l}</button>`)}</div>`;
}
// Big tap-to-choose answers (rule 5): one control per question.
export function choice(name, options, value, { issueValues = [], inline = false } = {}) {
  return h`<div class="choices${inline ? ' inline' : ''}">${options.map(o => { const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
    return h`<label class="choice${v === value ? ' on' : ''}${issueValues.includes(v) ? ' issue' : ''}"><input type="radio" name="${name}" value="${v}" ${v === value ? raw('checked') : ''}><span>${l}</span></label>`; })}</div>`;
}
export const field = (label, input, hint = '') => h`<label class="field"><span class="field-label">${label}</span>${input}${hint ? h`<span class="hint">${hint}</span>` : ''}</label>`;
export const textInput = (name, value = '', { type = 'text', required = false, placeholder = '', max = '', min = '' } = {}) =>
  h`<input class="input" name="${name}" type="${type}" value="${value}" ${required ? raw('required') : ''} ${placeholder ? raw(`placeholder="${placeholder.replace(/"/g, '&quot;')}"`) : ''} ${max ? raw(`max="${max}"`) : ''} ${min ? raw(`min="${min}"`) : ''}>`;
export const textArea = (name, value = '', { rows = 3, noPatient = true, placeholder = '' } = {}) =>
  h`<textarea class="input" name="${name}" rows="${rows}" ${placeholder ? raw(`placeholder="${placeholder.replace(/"/g, '&quot;')}"`) : ''}>${value}</textarea>${noPatient ? h`<span class="hint">No patient names or identifiers.</span>` : ''}`;
export const select = (name, options, value = '') => h`<select class="input" name="${name}">${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return h`<option value="${v}" ${v === value ? raw('selected') : ''}>${l}</option>`; })}</select>`;
export const pill = (text, tone = '') => h`<span class="pill ${tone}">${text}</span>`;
export const NAV = [['today', 'Today'], ['reviews', 'Reviews'], ['actions', 'Actions'], ['staff', 'Staff'], ['more', 'More']];
export function nav(active) {
  return h`<nav class="nav" aria-label="Main">${NAV.map(([k, l]) => h`<button class="${k === active ? 'on' : ''}" data-act="tab" data-tab="${k}" ${k === active ? raw('aria-current="page"') : ''}>${icon(k)}<span>${l}</span></button>`)}</nav>`;
}
