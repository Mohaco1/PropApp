// D3-C: sync across devices (installable app only). Talks to the Sydney back end (phase-d3/server) with an emailed
// sign-in link. Strictly nothing happens unless this is the installable app with an API origin built in (canNetwork):
// the single-file app and claude.ai never reach this code's network calls. Records stay on the phone; the server keeps a
// copy per pharmacy so the owner's other devices match. Signing out never touches the records on this device.
import * as store from './store.js';
const API = () => String(window.PROPAPP_API || '').replace(/\/+$/, '');
export const canNetwork = () => Boolean(window.PROPAPP_PWA && window.PROPAPP_API);
const PM = 'propapp-pending-magic', SESSION = 'propapp-auth-session', ACCOUNT = 'propapp-sync-account';
const BACKOFF = [2000, 4000, 8000, 16000];
let pendingMagic = '', requestSeq = 0, activeController = null, verifying = false, tries = 0, retryTimer = null, listening = false, later = null;
const st = { state: 'idle', lastSyncAt: '', error: '' };
let onStatus = null; const topicControllers = new Set();
export const watch = fn => { onStatus = fn; };
const setState = (state, error = '') => { const was = st.state + st.error; st.state = state; st.error = error; if (was !== state + error) try { onStatus?.(); } catch {} };
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: k => { try { localStorage.removeItem(k); } catch {} } };
export function session() { try { const s = JSON.parse(ls.get(SESSION) || 'null'); if (!s || typeof s.sessionToken !== 'string') return null; if (s.expiresAt && Date.parse(s.expiresAt) <= Date.now()) { ls.del(SESSION); return null; } return s; } catch { return null; } }
const clearSession = () => ls.del(SESSION);
const clearPending = () => { pendingMagic = ''; tries = 0; clearTimeout(retryTimer); retryTimer = null; try { sessionStorage.removeItem(PM); } catch {} };
export const status = () => ({ network: canNetwork(), signedIn: !!session(), pending: !!pendingMagic, state: st.state, lastSyncAt: st.lastSyncAt, error: st.error });

// Runs synchronously at the very start of start(), before anything is awaited: a #magic=<token> link is read, cached
// (memory and this tab's sessionStorage, so a reload or being offline keeps it) and scrubbed from the address bar and
// history at once, so the token is never left in the URL, the history or a screenshot.
export function captureMagicHash() {
  try {
    const h = location.hash || '', m = /^#(?:.*&)?magic=([^&]*)/.exec(h);
    if (m) { const tok = decodeURIComponent(m[1]); const rest = h.slice(1).split('&').filter(x => !/^magic=/.test(x)).join('&');
      history.replaceState(history.state, '', location.pathname + location.search + (rest ? '#' + rest : ''));
      if (tok) { pendingMagic = tok; try { sessionStorage.setItem(PM, tok); } catch {} } }
    else if (!pendingMagic) { try { pendingMagic = sessionStorage.getItem(PM) || ''; } catch {} }
  } catch {}
  return !!pendingMagic;
}
const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;
const aborted = e => e?.name === 'AbortError';
function api(method, path, { body, token, signal, headers = {} } = {}) {
  const h = { ...headers }; if (body !== undefined) h['Content-Type'] = 'application/json'; if (token) h.Authorization = 'Bearer ' + token;
  return fetch(API() + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' });
}
// One controller for the work running now; a new sync, a disconnect or a pharmacy switch aborts it.
function fresh() { activeController?.abort(); activeController = new AbortController(); return activeController; }

// Retries come back on 'online' and when the app returns to the front, with a capped wait (2, 4, 8, 16 s) in between.
function listen(onChange) { if (listening || typeof addEventListener !== 'function') return; listening = true;
  addEventListener('online', () => { if (pendingMagic) verifyPendingMagic(onChange); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pendingMagic) verifyPendingMagic(onChange); }); }
function retry(onChange) { clearTimeout(retryTimer); if (!online()) return; const wait = BACKOFF[Math.min(tries, BACKOFF.length - 1)]; tries++; retryTimer = setTimeout(() => verifyPendingMagic(onChange), wait); }

// The sign-in link is kept until the server answers it for good: 200 signs in; 400 or 401 (used, expired or not a
// link) drops it. Offline, 429 and 5xx keep it and try again.
export async function verifyPendingMagic(onChange) {
  if (!canNetwork() || !pendingMagic) return false;
  listen(onChange);
  if (verifying) return false;
  if (!online()) { setState('waiting'); return false; }
  const seq = requestSeq, ac = new AbortController(), token = pendingMagic; activeController = ac; verifying = true; setState('signing-in');
  try {
    const r = await api('POST', '/v1/auth/verify', { body: { token }, signal: ac.signal });
    if (seq !== requestSeq || ac.signal.aborted) return false;
    if (r.status === 200) { const j = await r.json(); if (seq !== requestSeq || ac.signal.aborted) return false;
      if (typeof j?.sessionToken !== 'string') { retry(onChange); return false; }
      // D3-D: signing in to another account than the one this device last synced with: everything already on this
      // device (pharmacies, tombstones, changes not yet synced) stays bound to that earlier account and is never
      // uploaded to this one. Attaching it is an explicit step (attachOtherAccount).
      const prev = ls.get(ACCOUNT);
      if (prev && prev !== j.accountId) for (const id of store.syncIds()) if (!store.boundTo(id)) store.bindAccount(id, prev);
      ls.set(SESSION, JSON.stringify({ sessionToken: j.sessionToken, accountId: j.accountId, expiresAt: j.expiresAt })); ls.set(ACCOUNT, j.accountId);
      clearPending(); setState('idle'); verifying = false; onChange?.(); syncAll(onChange); return true; }
    if (r.status === 400 || r.status === 401) { clearPending(); setState('link-failed'); return false; }
    setState('waiting'); retry(onChange); return false;
  } catch (e) { if (aborted(e) || seq !== requestSeq) return false; setState('waiting'); retry(onChange); return false; }
  finally { verifying = false; }
}
export async function requestMagicLink(email) {
  if (!canNetwork()) return { ok: false, status: 0 };
  const seq = requestSeq;
  try { const r = await api('POST', '/v1/auth/magic-link', { body: { email: String(email || '').trim() } });
    if (seq !== requestSeq) return { ok: false, status: 0 };
    if (r.status === 202) setState('link-sent'); else setState('link-error', r.status === 429 ? 'busy' : r.status === 400 ? 'email' : 'server');
    return { ok: r.status === 202, status: r.status, retryAfter: Number(r.headers.get('Retry-After')) || 0 };
  } catch { if (seq === requestSeq) setState('link-error', 'offline'); return { ok: false, status: 0 }; }
}
// Sign out on this device: stops anything running, forgets the sign-in (and any link not yet used) and tells the server,
// best effort. The records on this device are kept as they are.
export function disconnect() {
  requestSeq++; activeController?.abort(); activeController = null; clearTimeout(later); stopTopics();
  const s = session(); clearSession(); clearPending(); setState('idle');
  if (s && canNetwork()) api('POST', '/v1/auth/logout', { token: s.sessionToken, headers: {} }).catch(() => {});
}

// Canonical JSON (keys sorted), so two copies that differ only in key order compare equal.
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v));
const noRev = x => { if (!x || typeof x !== 'object') return x; const { rev, ...rest } = x; return rest; };
const sameDoc = (a, b) => canon(noRev(a)) === canon(noRev(b));
const remoteDoc = (id, j) => (j.pharmacy ? j.pharmacy : { id, schema: 2, updatedAt: j.deletedAt || j.updatedAt, deletedAt: j.deletedAt });
const localDoc = id => { const live = store.pharmacy(id); if (live) return { live: noRev(live) }; const t = store.pharmacyTombstone(id) || (store.dir().tombstones?.[id] ? { id, schema: 2, updatedAt: store.dir().tombstones[id], deletedAt: store.dir().tombstones[id] } : null); return t ? { tomb: t } : null; };

// Syncs every pharmacy on this device, live and deleted, one at a time. A newer sync (or a disconnect) makes this one
// stop: the sequence number and the abort signal are checked after every await. A 401 forgets the sign-in only.
// D3-D: first asks the server which pharmacies this account has (GET /v1/vault), so a fresh or empty device finds
// them, and one created later on another device turns up here too. Pharmacies bound to another account are skipped.
export async function syncAll(onChange) {
  const s = canNetwork() ? session() : null; if (!s) return { ok: false, skipped: true };
  if (!online()) { setState('offline'); return { ok: false, offline: true }; }
  const seq = ++requestSeq, ac = fresh(), { signal } = ac, stale = () => seq !== requestSeq || signal.aborted, acct = s.accountId;
  let applied = false; setState('syncing');
  try {
    const lr = await api('GET', '/v1/vault', { token: s.sessionToken, signal });
    if (stale()) return { ok: false, aborted: true };
    if (lr.status === 401) return unauthorised();
    let remote = [];
    if (lr.status === 200) { const j = await lr.json().catch(() => ({})); if (stale()) return { ok: false, aborted: true };
      remote = (Array.isArray(j?.vaults) ? j.vaults : []).filter(v => v && typeof v.pharmacyId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v.pharmacyId) && !v.deletedAt).map(v => v.pharmacyId); }
    const found = remote.filter(id => !store.boundTo(id) || store.boundTo(id) === acct);
    for (const id of [...new Set([...store.syncIds(acct), ...found])]) {
      if (stale()) return { ok: false, aborted: true };
      if (store.boundTo(id) && store.boundTo(id) !== acct) continue;
      let mine = localDoc(id); if (!mine && !found.includes(id)) continue;
      let ss = store.syncState(id);
      const unchanged = () => { const b = ss?.base; return !!b && (mine.live ? !b.deletedAt && sameDoc(mine.live, b) : !!b.deletedAt && b.deletedAt === mine.tomb.deletedAt); };
      // Nothing known from the server yet (rev 0): pull first, so a device restored from the same backup merges in
      // rather than overwriting. Nothing changed here since the last ack: just ask whether the server moved on.
      if (!mine || !ss || ss.rev === 0 || unchanged()) {
        const r = await api('GET', '/v1/sync/' + encodeURIComponent(id), { token: s.sessionToken, signal, headers: ss?.rev ? { 'If-None-Match': '"rev-' + ss.rev + '"' } : {} });
        if (stale()) return { ok: false, aborted: true };
        if (r.status === 401) return unauthorised();
        if (r.status === 200) { const j = await r.json(); if (stale()) return { ok: false, aborted: true };
          if (j.rev > (ss?.rev || 0)) { const out = store.applyRemoteSync(id, remoteDoc(id, j), j.rev, acct); if (out) applied = true; } }
        else if (r.status !== 304) { setState('error', 'server'); return { ok: false, status: r.status }; }
        mine = localDoc(id); ss = store.syncState(id); if (!mine || unchanged()) continue;
      }
      for (let round = 0; round < 3; round++) {
        mine = localDoc(id); ss = store.syncState(id); if (!mine) break;
        const body = mine.live ? { baseRev: ss?.rev || 0, pharmacy: mine.live, deletedAt: null } : { baseRev: ss?.rev || 0, pharmacy: null, deletedAt: mine.tomb.deletedAt };
        const r = await api('POST', '/v1/sync/' + encodeURIComponent(id), { token: s.sessionToken, signal, body });
        if (stale()) return { ok: false, aborted: true };
        if (r.status === 401) return unauthorised();
        const j = await r.json().catch(() => ({})); if (stale()) return { ok: false, aborted: true };
        if (r.status === 200) { store.commitSyncAck(id, { rev: j.rev, base: mine.live || mine.tomb, ackedAt: j.updatedAt, account: acct }); break; }
        if (r.status === 409) { const remote = remoteDoc(id, j), out = store.applyRemoteSync(id, remote, j.rev, acct); if (out) applied = true;
          // Merged copy is what the server already has: done. Otherwise push the merge on top of the server's head.
          if (!out || (out.deletedAt ? !!remote.deletedAt && remote.deletedAt === out.deletedAt : !remote.deletedAt && sameDoc(out, remote))) break; continue; }
        setState('error', r.status === 413 ? 'too-big' : r.status === 403 && j?.error === 'vault_limit' ? 'limit' : 'server'); return { ok: false, status: r.status };
      }
    }
    await store.flush(); if (stale()) return { ok: false, aborted: true };
    st.lastSyncAt = new Date().toISOString(); setState('synced'); if (applied) onChange?.();
    return { ok: true, applied };
  } catch (e) { if (aborted(e) || stale()) return { ok: false, aborted: true }; setState('offline'); return { ok: false, error: true }; }
  finally { if (activeController === ac && !stale()) activeController = null; }
}
// D3-D: pharmacies on this device that are bound to another account (signed in with a different email before). They
// stay on this device and are not synced until the owner taps to add them to this account.
export const otherAccountCount = () => { const s = session(); return s ? store.otherAccountIds(s.accountId).length : 0; };
export async function attachOtherAccount(onChange) { const s = canNetwork() ? session() : null; if (!s) return 0;
  const ids = store.attachOtherAccount(s.accountId); if (ids.length) { await store.flush(); await syncAll(onChange); } return ids.length; }
function unauthorised() { clearSession(); setState('signed-out'); return { ok: false, status: 401 }; }
// After a saved change: sync a moment later (changes in quick succession go in one sync).
export function schedule(onChange, wait = 1500) { if (!canNetwork() || !session()) return; clearTimeout(later); later = setTimeout(async () => { if ((await store.flush()) !== false) syncAll(onChange); }, wait); }
// Stops the sync running now (a pharmacy switch) and starts a fresh one.
export function restart(onChange) { if (!canNetwork() || !session()) return; syncAll(onChange); }

// A law topic from the server (GET /v1/topics/:id). Aborted by the caller's signal (the screen changed) or a
// disconnect. Returns the topic, or null.
export async function fetchTopic(topicId, { signal } = {}) {
  if (!canNetwork() || !/^[a-z0-9-]{1,64}$/.test(String(topicId))) return null;
  const ac = new AbortController(), seq = requestSeq; topicControllers.add(ac);
  const stop = () => ac.abort(); if (signal) { if (signal.aborted) return null; signal.addEventListener('abort', stop, { once: true }); }
  try { const r = await api('GET', '/v1/topics/' + topicId, { signal: ac.signal }); if (ac.signal.aborted || seq !== requestSeq || r.status !== 200) return null;
    const j = await r.json(); return ac.signal.aborted || seq !== requestSeq ? null : j; }
  catch { return null; }
  finally { topicControllers.delete(ac); signal?.removeEventListener('abort', stop); }
}
function stopTopics() { for (const c of topicControllers) c.abort(); topicControllers.clear(); }
