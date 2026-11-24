// Shared building blocks. One shell for every screen (design rule 4), thumb-sized controls (rule 11).
import { h, raw } from './util.js';
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
export const icon = (n, cls = '') => raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`);
export function screen({ title, sub = '', back = null, saved = '', body, primary = null, wide = false, right = '' }) {
  return h`<div class="screen${wide ? ' wide' : ''}">
    <header class="bar">${back ? h`<button class="iconbtn" data-act="back" aria-label="Back">${icon('back')}</button>` : h`<span class="mark" aria-hidden="true">R.</span>`}
      <h1 class="bar-title">${title}${sub ? h`<button class="ph-sub ph-switch" data-act="go" data-to="pharmacies" aria-label="Pharmacy: ${sub}. Switch pharmacy">${sub} ▾</button>` : ''}</h1>${saved ? h`<span class="saved" aria-live="polite">${saved}</span>` : ''}${right}</header>
    <main class="body">${body}</main>
    ${primary ? h`<div class="dock">${primary}</div>` : ''}
  </div>`;
}
export const btn = (label, act, { kind = 'secondary', data = {}, type = 'button', disabled = false, cls = '' } = {}) =>
  h`<button type="${type}" class="btn ${kind} ${cls}" ${act ? raw(`data-act="${act}"`) : ''} ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '))} ${disabled ? raw('disabled') : ''}>${label}</button>`;
export const row = ({ title, sub = '', right = '', tone = '', act = '', data = {}, chev = true, legal = false }) =>
  h`<button class="row ${tone}" data-act="${act}" ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '))}>
    <span class="row-main"><span class="row-title">${title}</span>${sub || legal ? h`<span class="row-sub">${legal ? h`<span class="law">Required by law</span> ` : ''}${sub}</span>` : ''}</span>
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
