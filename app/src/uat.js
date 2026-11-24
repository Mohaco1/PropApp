// UAT only (not part of the real app): a "UAT notes" button that saves notes to the UAT page's shared store, in the
// same "uatnotes" collection and shape as the current app, so Claude can read them. Falls back to this browser.
import { esc } from './util.js';
let db = null, notes = [], live = false;
const KEY = 'propapp-uat-notes';
const local = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
export async function initUat(pageName) {
  const btn = document.createElement('button'); btn.id = 'uat-btn'; btn.type = 'button'; btn.textContent = 'UAT notes'; document.body.append(btn);
  const dlg = document.createElement('dialog'); dlg.id = 'uat-dlg'; document.body.append(dlg);
  const paint = () => { const open = notes.filter(n => n.status !== 'Closed' && n.status !== 'Parked').length; btn.textContent = 'UAT notes' + (open ? ' · ' + open : ''); };
  const draw = () => {
    dlg.innerHTML = `<div class="uat-h"><b>UAT notes</b><span class="hint">Build ${esc(window.PROPAPP_BUILD || '')} · ${live ? 'saved to your UAT page' : 'this browser only'}</span><button type="button" class="btn" data-x>Close</button></div>
      <label class="field"><span class="field-label">Note about: ${esc(pageName())}</span><textarea class="input" rows="4" maxlength="2000" placeholder="What did you expect, and what happened?"></textarea></label>
      <button type="button" class="btn primary" data-add>Add note</button>
      <div class="uat-list">${notes.slice().reverse().map(n => `<p class="note"><b>${esc(n.status || 'Open')}</b> [${esc(n.page)}] ${esc(n.text)}${n.fix ? '<br><span class="hint">Fix: ' + esc(n.fix) + '</span>' : ''}</p>`).join('')}</div>`;
    dlg.querySelector('[data-x]').onclick = () => dlg.close();
    dlg.querySelector('[data-add]').onclick = async () => { const ta = dlg.querySelector('textarea'), text = ta.value.trim(); if (!text) return;
      const n = { kind: 'note', page: pageName(), text, type: '', status: 'Open', fix: '', createdAt: new Date().toISOString(), by: '', app: 'rebuild' };
      try { if (db) await db.collection('uatnotes').add(n); else { const l = local(); l.push(n); localStorage.setItem(KEY, JSON.stringify(l)); notes = l; } ta.value = ''; draw(); paint(); } catch (e) { ta.insertAdjacentHTML('afterend', '<p class="note bad">Not saved: ' + esc(e?.code || e?.message || e) + '</p>'); } };
  };
  btn.onclick = () => { draw(); dlg.showModal(); };
  notes = local(); paint();
  try { db = await window.claude?.use?.('db'); } catch { db = null; }
  if (db) { live = true; db.collection('uatnotes').onSnapshot(s => { notes = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))); paint(); if (dlg.open && !dlg.contains(document.activeElement)) draw(); }, () => {}); }
}
