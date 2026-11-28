// App state, navigation and the one way data changes: ctx.change(fn, message) edits a copy, saves it, logs it, redraws.
import * as store from './store.js';
import { clone, html } from './util.js';
import { nav, env } from './ui.js';
import { startPWA, askToKeep } from './pwa.js';
import { today } from './dates.js';
import { settleLeavers } from './model.js';
import * as sync from './sync.js';
const views = {};
// Visual Polish spec: a finished item's toast gets a check that settles in 150 ms.
const DONE = /\b(closed|saved|adopted|recorded|done|set up|checked|added|updated|confirmed)\b/i;
// Foldables (unfolded, 700 px or wider): a list screen and the record opened from it show side by side. The list is
// the route under the top of the stack (or the tab root); the record is the top. Only these list screens pair up, and
// these screens always stay a single centred pane. Below 700 px nothing changes.
const MASTER = new Set(['today', 'reviews', 'actions', 'staff', 'procedures', 'services', 'obligations', 'meetings', 'allsites', 'updates', 'sources', 'lawsources']);
const SOLO = new Set(['welcome', 'onboard', 'service-setup']);
const WIDE = typeof matchMedia === 'function' ? matchMedia('(min-width: 700px)') : { matches: false };
let pane = null; // { r: master route, depth: stack length that keeps the master on top }
// A tap in the list pane acts for the list screen: opening another record replaces the one shown, and Back there
// leaves the record too. The cut happens only when the act navigates.
let fromMaster = null; const fromMasterCut = () => { if (fromMaster != null) { S.stack.length = fromMaster; fromMaster = null; } };
function splitFor(r, v) { if (!WIDE.matches || !S.ph || !S.stack.length || v.noNav || SOLO.has(r.name)) return null;
  const pr = S.stack.length > 1 ? S.stack.at(-2) : { name: S.tab }; return MASTER.has(pr.name) && views[pr.name] && pr.name !== r.name ? { r: pr, depth: S.stack.length - 1 } : null; }
function routeFor(el) { const r = S.ph ? ctx.route : { name: 'welcome' }; if (pane && el?.closest?.('.pane-master')) return { r: pane.r, v: views[pane.r.name] || {}, depth: pane.depth }; return { r, v: views[r.name] || {}, depth: null }; }
export const register = (name, v) => { views[name] = v; };
// C-02: screens can listen for navigation (a pending "choose the file again" restore is disarmed by it).
// Stage 3E: a two-tap confirmation (Delete, Discard, Stop offering, the Adopt sheet) is disarmed by any navigation, Back
// included, and by any successful save, so an old first tap can never confirm a later, different act.
const ARMED = /^(delArmed|discardArmed|armed|stopArmed|ad:.*)$/;
const disarm = () => { for (const k of Object.keys(S.ui)) if (ARMED.test(k)) delete S.ui[k]; };
const navigated = () => { nextScreen(); disarm(); try { window.dispatchEvent(new Event('pl:navigate')); } catch {} };
// D3-C: every navigation, pharmacy switch and outside reload is a new screen. Anything a screen asked the network for
// (a law topic) is aborted when the screen changes, and a late answer is never shown on the next screen.
let screenSeq = 0, screenAbort = null;
function nextScreen() { screenSeq++; screenAbort?.abort(); screenAbort = null; }
function screenSignal() { if (!screenAbort) screenAbort = new AbortController(); return screenAbort.signal; }
async function topic(id) { const seq = screenSeq, got = await sync.fetchTopic(id, { signal: screenSignal() }); return seq === screenSeq ? got : null; }
export const SAVE_FAILED = 'Couldn’t save on this device just now (storage may be full). Nothing was changed; free some space or download a backup, then try again.';
const S = { ph: null, drafts: {}, stack: [], tab: 'today', toast: '', ui: {} };
export const ctx = {
  get ph() { return S.ph; }, get drafts() { return S.drafts; }, get route() { return S.stack.at(-1) || { name: S.tab }; }, ui: S.ui,
  // R09: remember which row opened a screen (its data-* attributes), focus the new screen's heading, and on Back
  // put focus back on that row, so keyboard and screen-reader users keep their place.
  go(name, params = {}) { navigated(); S.toast = ''; fromMasterCut(); const cur = S.stack.at(-1) || { name: S.tab, tabRoot: true }; cur.from = trigger(); if (cur.tabRoot) S.tabFrom = cur.from; S.stack.push({ name, ...params }); render(true); focusTitle(); },
  replace(name, params = {}) { navigated(); S.stack.pop(); S.stack.push({ name, ...params }); render(true); },
  back() { navigated(); S.toast = ''; fromMasterCut(); S.stack.pop(); render(true); const from = (S.stack.at(-1) || {}).from ?? (S.stack.length ? '' : S.tabFrom); if (!refocus(from)) focusTitle(); },
  tab(name) { navigated(); S.toast = ''; S.tab = name; S.stack = []; render(true); },
  // opts.redraw false: save without redrawing (a typed answer, so the button the owner is tapping isn't replaced mid-tap).
  change(fn, message, opts = {}) {
    const next = clone(S.ph); const r = fn(next); if (r === false) return false;
    next.updatedAt = new Date().toISOString(); // D3-A: every saved change stamps the pharmacy
    S.ph = next; store.savePharmacy(next); disarm(); askToKeep(); sync.schedule(reload); if (message) ctx.toast(message); if (opts.redraw !== false) render(); return true;
  },
  draft(key) { return S.drafts[key] || null; },
  saveDraft(key, value) { const rev = S.drafts[key]?.rev; store.saveDraft(S.ph.id, key, value, rev); S.drafts = store.drafts(S.ph.id); },
  toast(m) { S.toast = m; clearTimeout(S.tt);
    // Show it now, even when no re-render follows (Copy buttons); a later render re-creates it from S.toast.
    let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); root.appendChild(el); } el.textContent = m; el.classList.toggle('done', DONE.test(m)); S.tt = setTimeout(() => { S.toast = ''; const t = document.querySelector('.toast'); if (t) t.remove(); }, 3000); },
  // Stage 3D: open only switches once the choice is saved; if storage refuses the write, the screen stays as it was,
  // says so, and open returns false (a restore then shows an error, not a receipt).
  async open(id) { const d = clone(store.dir()), was = d.active; d.active = id; store.setDir(d);
    if (await store.flush() === false) { if (was !== id) store.setDir({ ...clone(store.dir()), active: was }); ctx.toast(SAVE_FAILED); render(); return false; }
    nextScreen(); load(); S.stack = []; S.tab = 'today'; for (const k of Object.keys(S.ui)) delete S.ui[k]; render(true); sync.restart(reload); },
  load, store, sync, topic, get screenSeq() { return screenSeq; }, rerender: () => render(), SAVE_FAILED,
};
function load() {
  const d = store.dir(); S.ph = d.active ? store.pharmacy(d.active) : null; S.drafts = S.ph ? store.drafts(S.ph.id) : {};
  if (S.ph?.staff?.some(p => p.leaving && p.leaving <= today() && p.active !== false)) { const n = clone(S.ph); settleLeavers(n); n.updatedAt = new Date().toISOString(); S.ph = n; store.savePharmacy(n); }
}
// Stage 3E: another tab saved. If it switched the open pharmacy, this tab starts again on Today with no screen state or
// confirmation left over from the other pharmacy. Otherwise the screen redraws and anything typed but not yet saved here
// (a procedure being edited, a note) is put back as it was, with the cursor.
function reload() { nextScreen(); const was = S.ph?.id || '', keep = typed(el => el.tagName === 'TEXTAREA' || /^(text|search|)$/.test(el.type || '')); load();
  if ((S.ph?.id || '') !== was) { S.stack = []; S.tab = 'today'; for (const k of Object.keys(S.ui)) delete S.ui[k]; render(true); return; }
  render(); retype(keep); }
let root;
// R06: the header's saved indicator says what storage really did: Saving…, Saved, or Save failed (retrying).
const SAVE = { saving: 'Saving…', saved: 'Saved', failed: 'Save failed · retrying', full: 'Storage full · back up now' };
function showSave(s) { for (const el of document.querySelectorAll('.saved')) { el.textContent = SAVE[s]; el.classList.toggle('bad', s === 'failed' || s === 'full'); } }
let lastTap = null;
function trigger() { const el = (lastTap && lastTap.isConnected ? lastTap : null) || document.activeElement?.closest?.('[data-act]'); if (!el) return ''; return [...el.attributes].filter(a => a.name.startsWith('data-')).map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join(''); }
function refocus(sel) { if (!sel) return false; const el = root.querySelector(sel); if (!el) return false; el.focus({ preventScroll: false }); return true; }
function focusTitle() { const t = root.querySelector('.pane-detail .bar-title') || root.querySelector('.bar-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
export function render(scrollTop = false) {
  env.sites = store.activeIds().length;
  const r = S.ph ? ctx.route : { name: 'welcome' };
  const v = views[r.name] || views.today;
  let out = '';
  const sp = splitFor(r, v); let master = '';
  if (sp) try { master = html(views[sp.r.name].render(ctx, sp.r)); } catch (e) { console.error(e); master = ''; }
  try { out = html(v.render(ctx, r)); } catch (e) { console.error(e); out = '<div class="screen"><main class="body"><p class="note bad">Something went wrong showing this screen. Your records are safe. Go back and try again.</p><button class="btn secondary" data-act="back">Back</button></main></div>'; }
  const showNav = S.ph && !v.noNav;
  const hadSheet = !!root.querySelector('.sheet'), opener = hadSheet ? '' : trigger();
  const ae = document.activeElement, focusName = ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && !['radio', 'checkbox', 'file'].includes(ae.type) ? ae.name : '', caret = focusName ? ae.selectionStart : 0;
  const mEl = root.querySelector('.pane-master'), keep = mEl && pane && sp && pane.r.name === sp.r.name && pane.depth === sp.depth ? mEl.scrollTop : 0;
  pane = sp && master ? sp : null;
  if (pane) out = `<div class="split"><section class="pane-master" aria-label="List">${master}</section><section class="pane-detail" aria-label="Details">${out}</section></div>`;
  root.innerHTML = out + (showNav ? html(nav(S.stack.length ? (v.tab || S.tab) : S.tab)) : '') + (S.toast ? `<div class="toast${DONE.test(S.toast) ? ' done' : ''}" role="status">${S.toast.replace(/[<>&]/g, '')}</div>` : '');
  root.classList.toggle('has-nav', !!showNav);
  if (scrollTop) window.scrollTo(0, 0);
  if (pane) { const m = root.querySelector('.pane-master'), d = root.querySelector('.pane-detail'); m.scrollTop = keep; if (scrollTop) d.scrollTop = 0;
    // M-08: Today's rows carry a key such as review/S8 or person/<id>; the record opened from it is highlighted too.
    const id = r.id ?? r.key; if (id) for (const el of m.querySelectorAll('[data-id],[data-key]')) { const k = el.dataset.id || el.dataset.key || '';
      if (k === String(id) || (pane.r.name === 'today' && (k === r.name + '/' + id || k.split('/')[1] === String(id)))) { el.classList.add('active'); el.setAttribute('aria-current', 'true'); } } }
  if (focusName && !scrollTop) { const el = root.querySelector(`[name="${focusName}"]`); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch {} } }
  showSave(store.saveStatus());
  v.after?.(ctx, r, pane ? root.querySelector('.pane-detail') : root);
  sheetFocus(hadSheet, opener);
}
// Stage 3B: a bottom sheet takes focus when it opens (its primary button); when it closes, focus goes back to the button
// that opened it (or the screen title if that button is gone, e.g. after adopting).
let sheetFrom = '';
function sheetFocus(hadSheet, opener) { const sh = root.querySelector('.sheet');
  if (sh && !hadSheet) { sheetFrom = opener; (sh.querySelector('.btn.primary:not([disabled])') || sh.querySelector('button,[href],input,textarea,select'))?.focus({ preventScroll: true }); }
  else if (!sh && hadSheet) { const from = sheetFrom; sheetFrom = ''; if (!refocus(from)) focusTitle(); } }
function sheetKeys(e) { const sh = root.querySelector('.sheet'); if (!sh) return;
  if (e.key === 'Escape') { e.preventDefault(); sh.querySelector('.sheet-cancel')?.click(); return; }
  if (e.key !== 'Tab') return; const f = [...sh.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
  if (!f.length) return; const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); } }
// H-07: folding or unfolding the phone redraws the screen (one pane or two). Anything typed or picked but not yet saved
// is read off the form fields first and put back afterwards, with the cursor where it was, so a fold never wipes a form.
function fieldKeys() { const seen = {}; return [...root.querySelectorAll('input,textarea,select')].filter(el => el.name && el.type !== 'file').map(el => {
  const k = (el.closest('.pane-master') ? 'm' : 'd') + '|' + (el.form?.dataset.form || '') + '|' + el.name + '|' + (/^(radio|checkbox)$/.test(el.type) ? el.value : ''); seen[k] = (seen[k] || 0) + 1; return [k + '|' + seen[k], el]; }); }
function typed(only) { const out = new Map(); let focus = null; for (const [k, el] of fieldKeys()) { if (only && !only(el)) continue;
    if (el === document.activeElement) focus = { k, s: el.selectionStart, e: el.selectionEnd };
    if (/^(radio|checkbox)$/.test(el.type)) { if (el.checked !== el.defaultChecked) out.set(k, { checked: el.checked }); }
    else if (el.tagName === 'SELECT') { if ([...el.options].some(o => o.selected !== o.defaultSelected)) out.set(k, { value: el.value }); }
    else if (el.value !== el.defaultValue) out.set(k, { value: el.value }); }
  return { out, focus }; }
function retype({ out, focus }) { for (const [k, el] of fieldKeys()) { const v = out.get(k); if (v) { if ('checked' in v) el.checked = v.checked; else el.value = v.value; }
    if (focus && focus.k === k) { el.focus({ preventScroll: true }); try { el.setSelectionRange(focus.s, focus.e); } catch {} } } }
let lastFinal = { key: '', at: 0 };
function handle(e, type) {
  const el = e.target.closest(type === 'submit' ? 'form[data-form]' : '[data-act]'); if (!el) return;
  const { r, v, depth } = routeFor(el); fromMaster = depth;
  try { run(e, type, el, r, v); } finally { fromMaster = null; }
}
function run(e, type, el, r, v) {
  // Hardening brief: a second tap on the same final button (a form submit or a primary button) within 800 ms is ignored,
  // so Save review, Save visit, Save action and Close action can't record twice.
  if (type === 'submit' || el.classList?.contains('primary')) { const key = (r.name || '') + '|' + (r.id || '') + '|' + (type === 'submit' ? 'f:' + el.dataset.form : 'a:' + el.dataset.act), now = Date.now();
    if (lastFinal.key === key && now - lastFinal.at < 800 && el.dataset.act !== 'step' && !document.querySelector('main .err')) { if (type === 'submit') e.preventDefault(); return; } lastFinal = { key, at: now }; }
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
  sync.captureMagicHash(); // D3-C: first, before anything is awaited, so a sign-in link never stays in the address bar
  root = el;
  await store.init(() => reload());
  store.watchStatus(s => { showSave(s); if (s === 'failed') ctx.toast('Couldn’t save just now. Trying again; keep this page open.'); if (s === 'full') ctx.toast('Storage full: download a backup now (More → Backup and devices). Keep this page open.'); });
  startPWA();
  load();
  // Chaos test fix 5: when the date rolls over (Sydney midnight) while Today is showing, Today redraws with the new date.
  // Checked every 30 s and whenever the app comes back to the front. Stage 3E: Calendar redraws too (it has no form to
  // lose); other screens are never redrawn under the owner.
  let shownDay = today(); const dayCheck = () => { const t = today(); if (t === shownDay) return; shownDay = t; if (S.ph?.staff?.some(p => p.leaving && p.leaving <= t)) load(); if (S.ph && ((!S.stack.length && S.tab === 'today') || ctx.route.name === 'calendar')) render(); };
  setInterval(dayCheck, 30000); document.addEventListener('visibilitychange', () => { if (!document.hidden) dayCheck(); });
  document.addEventListener('click', e => { lastTap = e.target.closest?.('[data-act]') || null; handle(e, 'click'); });
  document.addEventListener('submit', e => handle(e, 'submit'));
  document.addEventListener('keydown', sheetKeys);
  // Stage 3E: printing a procedure prints every section, opened for the print and closed again afterwards.
  addEventListener('beforeprint', () => { for (const d of document.querySelectorAll('details.docsec:not([open])')) { d.open = true; d.dataset.printOpen = '1'; } });
  addEventListener('afterprint', () => { for (const d of document.querySelectorAll('details.docsec[data-print-open]')) { d.open = false; delete d.dataset.printOpen; } });
  document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (!el) return; const { r, v } = routeFor(el); v.inputs?.[el.dataset.input]?.(ctx, el, r, e); });
  document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (!el) return; const { r, v } = routeFor(el); v.changes?.[el.dataset.change]?.(ctx, el, r, e); });
  WIDE.addEventListener?.('change', () => { const keep = typed(); render(); retype(keep); });
  render();
  // D3-C: sign in with a pending link, and sync, at start and whenever the phone comes back online (installable app only).
  // The sync section of Backup and devices redraws when the sign-in or sync state changes.
  sync.watch(() => { if (S.ph && ctx.route.name === 'backup') { const keep = typed(); render(); retype(keep); } });
  sync.resume(reload); // D3-E: a sign-in link waiting to be checked settles first, then the ordinary sync runs
  addEventListener('online', () => sync.resume(reload));
  addEventListener('hashchange', () => { if (sync.captureMagicHash()) sync.verifyPendingMagic(reload); }); // a link opened in this same tab
  if (window.PROPAPP_UAT && sync.canNetwork()) window.pharmledgerTest = { topic }; // UAT build only: lets tests ask for a topic
}
