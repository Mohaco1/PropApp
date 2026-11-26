// App state, navigation and the one way data changes: ctx.change(fn, message) edits a copy, saves it, logs it, redraws.
import * as store from './store.js';
import { clone, html } from './util.js';
import { nav, env } from './ui.js';
import { startPWA, askToKeep } from './pwa.js';
const views = {};
export const register = (name, v) => { views[name] = v; };
const S = { ph: null, drafts: {}, stack: [], tab: 'today', toast: '', ui: {} };
export const ctx = {
  get ph() { return S.ph; }, get drafts() { return S.drafts; }, get route() { return S.stack.at(-1) || { name: S.tab }; }, ui: S.ui,
  // R09: remember which row opened a screen (its data-* attributes), focus the new screen's heading, and on Back
  // put focus back on that row, so keyboard and screen-reader users keep their place.
  go(name, params = {}) { S.toast = ''; const cur = S.stack.at(-1) || { name: S.tab, tabRoot: true }; cur.from = trigger(); if (cur.tabRoot) S.tabFrom = cur.from; S.stack.push({ name, ...params }); render(true); focusTitle(); },
  replace(name, params = {}) { S.stack.pop(); S.stack.push({ name, ...params }); render(true); },
  back() { S.toast = ''; S.stack.pop(); render(true); const from = (S.stack.at(-1) || {}).from ?? (S.stack.length ? '' : S.tabFrom); if (!refocus(from)) focusTitle(); },
  tab(name) { S.toast = ''; S.tab = name; S.stack = []; render(true); },
  // opts.redraw false: save without redrawing (a typed answer, so the button the owner is tapping isn't replaced mid-tap).
  change(fn, message, opts = {}) {
    const next = clone(S.ph); const r = fn(next); if (r === false) return false;
    S.ph = next; store.savePharmacy(next); askToKeep(); if (message) ctx.toast(message); if (opts.redraw !== false) render(); return true;
  },
  draft(key) { return S.drafts[key] || null; },
  saveDraft(key, value) { const rev = S.drafts[key]?.rev; store.saveDraft(S.ph.id, key, value, rev); S.drafts = store.drafts(S.ph.id); },
  toast(m) { S.toast = m; clearTimeout(S.tt);
    // Show it now, even when no re-render follows (Copy buttons); a later render re-creates it from S.toast.
    let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); root.appendChild(el); } el.textContent = m; S.tt = setTimeout(() => { S.toast = ''; const t = document.querySelector('.toast'); if (t) t.remove(); }, 3000); },
  async open(id) { const d = store.dir(); d.active = id; store.setDir(d); await store.flush(); load(); S.stack = []; S.tab = 'today'; for (const k of Object.keys(S.ui)) delete S.ui[k]; render(true); },
  load, store, rerender: () => render(),
};
function load() {
  const d = store.dir(); S.ph = d.active ? store.pharmacy(d.active) : null; S.drafts = S.ph ? store.drafts(S.ph.id) : {};
}
let root;
// R06: the header's saved indicator says what storage really did: Saving…, Saved, or Save failed (retrying).
const SAVE = { saving: 'Saving…', saved: 'Saved', failed: 'Save failed · retrying', full: 'Storage full · back up now' };
function showSave(s) { for (const el of document.querySelectorAll('.saved')) { el.textContent = SAVE[s]; el.classList.toggle('bad', s === 'failed' || s === 'full'); } }
let lastTap = null;
function trigger() { const el = (lastTap && lastTap.isConnected ? lastTap : null) || document.activeElement?.closest?.('[data-act]'); if (!el) return ''; return [...el.attributes].filter(a => a.name.startsWith('data-')).map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join(''); }
function refocus(sel) { if (!sel) return false; const el = root.querySelector(sel); if (!el) return false; el.focus({ preventScroll: false }); return true; }
function focusTitle() { const t = root.querySelector('.bar-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
export function render(scrollTop = false) {
  env.sites = store.activeIds().length;
  const r = S.ph ? ctx.route : { name: 'welcome' };
  const v = views[r.name] || views.today;
  let out = '';
  try { out = html(v.render(ctx, r)); } catch (e) { console.error(e); out = '<div class="screen"><main class="body"><p class="note bad">Something went wrong showing this screen. Your records are safe. Go back and try again.</p><button class="btn secondary" data-act="back">Back</button></main></div>'; }
  const showNav = S.ph && !v.noNav;
  const ae = document.activeElement, focusName = ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && !['radio', 'checkbox', 'file'].includes(ae.type) ? ae.name : '', caret = focusName ? ae.selectionStart : 0;
  root.innerHTML = out + (showNav ? html(nav(S.stack.length ? (v.tab || S.tab) : S.tab)) : '') + (S.toast ? `<div class="toast" role="status">${S.toast.replace(/[<>&]/g, '')}</div>` : '');
  root.classList.toggle('has-nav', !!showNav);
  if (scrollTop) window.scrollTo(0, 0);
  if (focusName && !scrollTop) { const el = root.querySelector(`[name="${focusName}"]`); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch {} } }
  showSave(store.saveStatus());
  v.after?.(ctx, r, root);
}
function handle(e, type) {
  const el = e.target.closest(type === 'submit' ? 'form[data-form]' : '[data-act]'); if (!el) return;
  const r = S.ph ? ctx.route : { name: 'welcome' }; const v = views[r.name] || {};
  if (type === 'submit') { e.preventDefault(); const fn = v.forms?.[el.dataset.form] || common.forms[el.dataset.form]; fn?.(ctx, Object.fromEntries(new FormData(el)), el, r, e); return; }
  const act = el.dataset.act; const fn = v.acts?.[act] || common.acts[act]; if (!fn) return;
  if (el.tagName === 'A') e.preventDefault();
  fn(ctx, el.dataset, el, r, e);
}
const common = { acts: {
  back: c => c.back(), tab: (c, d) => c.tab(d.tab), go: (c, d) => c.go(d.to, { id: d.id || '', ...(d.from ? { from: d.from } : {}) }),
  seg: (c, d) => { c.ui[d.name] = d.value; render(); },
}, forms: {} };
export async function start(el) {
  root = el;
  await store.init(() => { load(); render(); });
  store.watchStatus(s => { showSave(s); if (s === 'failed') ctx.toast('Couldn’t save just now. Trying again; keep this page open.'); if (s === 'full') ctx.toast('Storage full: download a backup now (More → Backup and devices). Keep this page open.'); });
  startPWA();
  load();
  document.addEventListener('click', e => { lastTap = e.target.closest?.('[data-act]') || null; handle(e, 'click'); });
  document.addEventListener('submit', e => handle(e, 'submit'));
  document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (!el) return; const r = S.ph ? ctx.route : { name: 'welcome' }; const v = views[r.name] || {}; v.inputs?.[el.dataset.input]?.(ctx, el, r, e); });
  document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (!el) return; const r = S.ph ? ctx.route : { name: 'welcome' }; const v = views[r.name] || {}; v.changes?.[el.dataset.change]?.(ctx, el, r, e); });
  render();
}
