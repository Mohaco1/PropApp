// UAT only (not part of the real app): a "UAT notes" button that saves notes to the UAT page's shared store, in the
// same "uatnotes" collection and shape as the current app, so Claude can read them. Falls back to this browser.
import { esc } from './util.js';
import { copyText } from './clip.js';
import * as store from './store.js';
import { deletable } from './views/settings.js';
// C-05: Reset is for test copies only. It's blocked while any real pharmacy (not test or fictional, with records) is here.
export const realPharmacies = () => { try { return store.dir().ids.map(id => store.pharmacy(id)).filter(p => p && !deletable(p) && !p.flags?.example && !/\bFictional\b/i.test(p.address || '')); } catch { return []; } };
let db = null, notes = [], live = false, marks = {};
const KEY = 'propapp-uat-notes';
const local = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
export async function initUat(pageName) {
  const btn = document.createElement('button'); btn.id = 'uat-btn'; btn.type = 'button'; btn.textContent = 'UAT'; btn.setAttribute('aria-label', 'UAT notes'); document.body.append(btn);
  // R12: the button sits in each screen's header bar (never over rows); with no header (Welcome) it stays top right.
  const place = () => { const bar = document.querySelector('#app .bar'); if (bar) { if (btn.parentElement !== bar) bar.append(btn); btn.classList.add('inbar'); } else { if (btn.parentElement !== document.body) document.body.append(btn); btn.classList.remove('inbar'); } };
  new MutationObserver(place).observe(document.getElementById('app') || document.body, { childList: true, subtree: true }); place();
  const dlg = document.createElement('dialog'); dlg.id = 'uat-dlg'; document.body.append(dlg);
  const paint = () => { const open = notes.filter(n => n.status !== 'Closed' && n.status !== 'Parked').length; btn.textContent = 'UAT' + (open ? ' · ' + open : ''); };
  const draw = () => { const real = realPharmacies();
    dlg.innerHTML = `<div class="uat-h"><b>UAT notes</b><span class="hint">Build ${esc(window.PROPAPP_BUILD || '')} · ${live ? 'saved to your UAT page' : 'this browser only'}</span><button type="button" class="btn" data-x>Close</button></div>
      <label class="field"><span class="field-label">Note about: ${esc(pageName())}</span><textarea class="input" rows="4" maxlength="2000" placeholder="What did you expect, and what happened?"></textarea></label>
      <button type="button" class="btn primary" data-add>Add note</button>
      <div class="btnrow"><button type="button" class="btn" data-copy>Copy all</button><button type="button" class="btn" data-clear>${dlg.dataset.armClear ? 'Tap again to clear all notes' : 'Clear all'}</button>${real.length ? '' : `<button type="button" class="btn" data-reset>${dlg.dataset.armReset ? 'Tap again: delete all test data' : 'Reset test data'}</button>`}</div>
      ${real.length ? `<p class="note warn" data-resetblocked>Reset test data is off because ${real.length === 1 ? esc(real[0].name) + ' has' : real.length + ' pharmacies have'} real records here. Download a backup first, then delete test pharmacies one at a time in More › Pharmacies › Archive or delete a pharmacy.</p>` : '<p class="hint">Reset deletes every pharmacy and record in this browser for this test copy and returns to the welcome screen. Your UAT notes are kept.</p>'}
      <div class="uat-list">${notes.slice().reverse().map(n => `<p class="note"><b>${esc(n.status || 'Open')}</b> [${esc(n.page)}] ${esc(n.text)}${n.fix ? '<br><span class="hint">Fix: ' + esc(n.fix) + '</span>' : ''}</p>`).join('')}</div>`;
    dlg.querySelector('[data-x]').onclick = () => dlg.close();
    dlg.querySelector('[data-add]').onclick = async () => { const ta = dlg.querySelector('textarea'), text = ta.value.trim(); if (!text) return;
      const n = { kind: 'note', page: pageName(), text, type: '', status: 'Open', fix: '', createdAt: new Date().toISOString(), by: '', app: 'rebuild' };
      try { if (db) await db.collection('uatnotes').add(n); else { const l = local(); l.push(n); localStorage.setItem(KEY, JSON.stringify(l)); notes = l; } ta.value = ''; draw(); paint(); } catch (e) { ta.insertAdjacentHTML('afterend', '<p class="note bad">Not saved: ' + esc(e?.code || e?.message || e) + '</p>'); } };
    dlg.querySelector('[data-copy]').onclick = async () => { const t = 'PharmLedger UAT notes · build ' + (window.PROPAPP_BUILD || '') + '\n\n' + notes.map(n => '- [' + (n.status || 'Open') + '] [' + n.page + '] ' + n.text).join('\n') + (Object.keys(marks).length ? '\n\nSetup questions:\n' + Object.entries(marks).map(([k, m]) => '- ' + k + ': ' + m.choice + (m.note ? ' · ' + m.note : '')).join('\n') : '');
      if (await copyText(t)) { dlg.querySelector('[data-copy]').textContent = 'Copied'; } else { const ta = dlg.querySelector('textarea'); ta.value = t; ta.select(); } };
    dlg.querySelector('[data-clear]').onclick = async () => { if (!dlg.dataset.armClear) { dlg.dataset.armClear = '1'; draw(); return; } delete dlg.dataset.armClear;
      if (db) { for (const n of notes) if (n.id) { try { await db.collection('uatnotes').doc(n.id).delete(); } catch {} } } else { localStorage.removeItem(KEY); notes = []; } notes = db ? notes.filter(n => !n.id) : []; draw(); paint(); };
    const rb = dlg.querySelector('[data-reset]'); if (rb) rb.onclick = async () => { if (realPharmacies().length) { delete dlg.dataset.armReset; draw(); return; } if (!dlg.dataset.armReset) { dlg.dataset.armReset = '1'; draw(); return; }
      await new Promise(res => { try { const r = indexedDB.deleteDatabase('propapp'); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } });
      for (const k of Object.keys(localStorage)) if (k.startsWith('propapp:') || k.startsWith('propapp-journal:') || k.startsWith('propapp-restored:')) localStorage.removeItem(k); location.reload(); };
  };
  btn.onclick = () => { draw(); dlg.showModal(); };
  // Setup-question marks (UAT only): "Could be usual" / "Must always ask" / "No opinion", saved with the notes.
  window.uatMark = async (key, choice, note = '') => { marks[key] = { choice, note }; const doc = { key, choice, note, updatedAt: new Date().toISOString() };
    try { if (db) await db.collection('uatquestions').doc('q_' + key.replace(/[^A-Za-z0-9_-]/g, '_')).set(doc); else localStorage.setItem(KEY + '-q', JSON.stringify(marks)); } catch {} };
  window.uatMarkOf = key => marks[key]?.choice || '';
  try { marks = JSON.parse(localStorage.getItem(KEY + '-q') || '{}'); } catch {}
  notes = local(); paint();
  try { db = await window.claude?.use?.('db'); } catch { db = null; }
  if (db) { live = true; db.collection('uatnotes').onSnapshot(s => { notes = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))); paint(); if (dlg.open && !dlg.contains(document.activeElement)) draw(); }, () => {}); }
}
