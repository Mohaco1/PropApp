// D3-C: sync across devices (installable app only). Talks to the Sydney back end (phase-d3/server) with an emailed
// sign-in link. Strictly nothing happens unless this is the installable app with an API origin built in (canNetwork):
// the single-file app and claude.ai never reach this code's network calls. Records stay on the phone; the server keeps a
// copy per pharmacy so the owner's other devices match. Signing out never touches the records on this device.
import * as store from './store.js';
const API = () => String(window.PROPAPP_API || '').replace(/\/+$/, '');
export const canNetwork = () => Boolean(window.PROPAPP_PWA && window.PROPAPP_API);
const PM = 'propapp-pending-magic', SESSION = 'propapp-auth-session', ACCOUNT = 'propapp-sync-account';
const BACKOFF = [2000, 4000, 8000, 16000];
let pendingMagic = '', requestSeq = 0, authSeq = 0, activeController = null, verifyController = null, verifying = false, tries = 0, retryTimer = null, listening = false, later = null, pendingRetries = 0, lastOnChange = null;
// D3-E: `failed` holds the pharmacies the last pass couldn't sync (id → reason), `waiting` the ones whose changes the
// server hasn't acknowledged yet (a third 409, or saving on this phone didn't finish). Neither is ever "Up to date".
const st = { state: 'idle', lastSyncAt: '', error: '', failed: {}, waiting: [], synced: 0, total: 0 };
let onStatus = null; const topicControllers = new Set();
export const watch = fn => { onStatus = fn; };
const setState = (state, error = '') => { const was = st.state + st.error; st.state = state; st.error = error; if (was !== state + error) try { onStatus?.(); } catch {} };
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: k => { try { localStorage.removeItem(k); } catch {} } };
export function session() { try { const s = JSON.parse(ls.get(SESSION) || 'null'); if (!s || typeof s.sessionToken !== 'string') return null; if (s.expiresAt && Date.parse(s.expiresAt) <= Date.now()) { ls.del(SESSION); return null; } return s; } catch { return null; } }
const clearSession = () => { ls.del(SESSION); announce(); };
// D3-E: sign-in changes reach this app's other tabs (BroadcastChannel, and the storage event as a fallback). A tab that
// hears one stops whatever it was syncing for the old sign-in, and starts again only if it is now signed in.
const tokenOf = s => s?.sessionToken || '';
let heldToken = null, chan = null;
function announce() { try { chan?.postMessage({ kind: 'auth' }); } catch {} }
function authChanged() { const now = tokenOf(session()); if (heldToken === now) return; heldToken = now;
  requestSeq++; authSeq++; activeController?.abort(); activeController = null; clearTimeout(later); stopTopics();
  st.failed = {}; st.waiting = []; setState('idle'); if (now) syncAll(lastOnChange); else try { onStatus?.(); } catch {} }
function listenAuth() { if (chan !== null || typeof addEventListener !== 'function') return; heldToken = tokenOf(session());
  try { chan = new BroadcastChannel('propapp-auth'); chan.onmessage = () => authChanged(); } catch { chan = false; }
  addEventListener('storage', e => { if (e.key === SESSION || e.key === null) authChanged(); }); }
const clearPending = () => { pendingMagic = ''; tries = 0; clearTimeout(retryTimer); retryTimer = null; try { sessionStorage.removeItem(PM); } catch {} };
export const status = () => ({ network: canNetwork(), signedIn: !!session(), pending: !!pendingMagic, state: st.state, lastSyncAt: st.lastSyncAt, error: st.error, failed: { ...st.failed }, waiting: [...st.waiting], synced: st.synced, total: st.total });

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
  listen(onChange); listenAuth(); if (onChange) lastOnChange = onChange;
  if (verifying) return false;
  if (!online()) { setState('waiting'); return false; }
  // D3-E: the link has its own controller and sequence number: an ordinary sync starting meanwhile (an older sign-in
  // still on this device) can't abort it or make its answer look stale. Only Disconnect or another tab's sign-in can.
  const seq = authSeq, ac = new AbortController(), token = pendingMagic; verifyController = ac; verifying = true; setState('signing-in');
  const stale = () => seq !== authSeq || ac.signal.aborted;
  try {
    const r = await api('POST', '/v1/auth/verify', { body: { token }, signal: ac.signal });
    if (stale()) return false;
    if (r.status === 200) { const j = await r.json(); if (stale()) return false;
      if (typeof j?.sessionToken !== 'string') { verifying = false; retry(onChange); return false; }
      // D3-D: signing in to another account than the one this device last synced with: everything already on this
      // device (pharmacies, tombstones, changes not yet synced) stays bound to that earlier account and is never
      // uploaded to this one. Attaching it is an explicit step (attachOtherAccount).
      const prev = ls.get(ACCOUNT);
      if (prev && prev !== j.accountId) for (const id of store.syncIds()) if (!store.boundTo(id)) store.bindAccount(id, prev);
      // A sync still running for an earlier sign-in stops: its answers belong to that session.
      requestSeq++; activeController?.abort(); activeController = null;
      ls.set(SESSION, JSON.stringify({ sessionToken: j.sessionToken, accountId: j.accountId, expiresAt: j.expiresAt })); ls.set(ACCOUNT, j.accountId); heldToken = j.sessionToken; announce();
      clearPending(); st.failed = {}; st.waiting = []; setState('idle'); verifying = false; onChange?.(); syncAll(onChange); return true; }
    if (r.status === 400 || r.status === 401) { clearPending(); setState('link-failed'); verifying = false; if (session()) syncAll(onChange); return false; }
    verifying = false; setState('waiting'); retry(onChange); return false;
  } catch (e) { if (aborted(e) || stale()) return false; verifying = false; setState('waiting'); retry(onChange); return false; }
  finally { if (verifyController === ac) { verifying = false; verifyController = null; } }
}
// D3-E: startup and reconnect. A sign-in link waiting to be checked goes first (it starts the sync itself once it is
// settled); otherwise the ordinary sync runs.
export function resume(onChange) { if (!canNetwork()) return; listenAuth(); if (onChange) lastOnChange = onChange; if (pendingMagic) verifyPendingMagic(onChange); else syncAll(onChange); }
export async function requestMagicLink(email) {
  if (!canNetwork()) return { ok: false, status: 0 };
  const seq = authSeq;
  try { const r = await api('POST', '/v1/auth/magic-link', { body: { email: String(email || '').trim() } });
    if (seq !== authSeq) return { ok: false, status: 0 };
    if (r.status === 202) setState('link-sent'); else setState('link-error', r.status === 429 ? 'busy' : r.status === 400 ? 'email' : 'server');
    return { ok: r.status === 202, status: r.status, retryAfter: Number(r.headers.get('Retry-After')) || 0 };
  } catch { if (seq === authSeq) setState('link-error', 'offline'); return { ok: false, status: 0 }; }
}
// Sign out on this device: stops anything running, forgets the sign-in (and any link not yet used) and tells the server,
// best effort. The records on this device are kept as they are.
export function disconnect() {
  requestSeq++; authSeq++; activeController?.abort(); activeController = null; verifyController?.abort(); verifyController = null; verifying = false; clearTimeout(later); stopTopics();
  const s = session(); heldToken = ''; clearSession(); clearPending(); st.failed = {}; st.waiting = []; setState('idle');
  if (s && canNetwork()) api('POST', '/v1/auth/logout', { token: s.sessionToken, headers: {} }).catch(() => {});
}
// D3-E: UAT "Reset test data": disconnect, then forget the account this device synced with and any link not yet used,
// so the reloaded test copy starts signed out with nothing bound.
export function forgetAll() { disconnect(); ls.del(ACCOUNT); ls.del(SESSION); try { sessionStorage.removeItem(PM); } catch {} pendingMagic = ''; }

// Canonical JSON (keys sorted), so two copies that differ only in key order compare equal.
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v));
const noRev = x => { if (!x || typeof x !== 'object') return x; const { rev, ...rest } = x; return rest; };
const sameDoc = (a, b) => canon(noRev(a)) === canon(noRev(b));
const remoteDoc = (id, j) => (j.pharmacy ? j.pharmacy : { id, schema: 2, updatedAt: j.deletedAt || j.updatedAt, deletedAt: j.deletedAt });
const localDoc = id => { const live = store.pharmacy(id); if (live) return { live: noRev(live) }; const t = store.pharmacyTombstone(id) || (store.dir().tombstones?.[id] ? { id, schema: 2, updatedAt: store.dir().tombstones[id], deletedAt: store.dir().tombstones[id] } : null); return t ? { tomb: t } : null; };

// Syncs every pharmacy on this device, live and deleted, one at a time. A newer sync (or a disconnect) makes this one
// stop: the sequence number, the abort signal and the sign-in it started with are checked after every await, so a late
// answer meant for another session or account is never applied. A 401 forgets that sign-in only.
// D3-D: first asks the server which pharmacies this account has (GET /v1/vault), so a fresh or empty device finds
// them, and one created later on another device turns up here too. Pharmacies bound to another account are skipped.
// D3-E: one pharmacy the server refuses (413, the account limit, a server error) is noted and the others still sync
// ("partial"). A pharmacy stays "waiting" (never "Up to date") until the server has acknowledged exactly what this
// device holds and saving on this phone has finished.
export async function syncAll(onChange) {
  listenAuth(); if (onChange) lastOnChange = onChange;
  const s = canNetwork() ? session() : null; if (!s) return { ok: false, skipped: true };
  // D3-E: a sign-in link still being checked goes first; it starts the sync itself once it is settled.
  if (pendingMagic) { if (!verifying) verifyPendingMagic(onChange); return { ok: false, deferred: true }; }
  if (!online()) { setState('offline'); return { ok: false, offline: true }; }
  const seq = ++requestSeq, ac = fresh(), { signal } = ac, acct = s.accountId, tok = s.sessionToken;
  const stale = () => seq !== requestSeq || signal.aborted || tokenOf(session()) !== tok;
  const failed = {}, done = []; let applied = false; setState('syncing');
  const acked = id => { const mine = localDoc(id), b = store.syncState(id)?.base; if (!mine) return true; return !!b && (mine.live ? !b.deletedAt && sameDoc(mine.live, b) : !!b.deletedAt && b.deletedAt === mine.tomb.deletedAt); };
  const why = (r, j) => (r.status === 413 ? 'too-big' : r.status === 403 && j?.error === 'vault_limit' ? 'limit' : 'server');
  try {
    const lr = await api('GET', '/v1/vault', { token: tok, signal });
    if (stale()) return { ok: false, aborted: true };
    if (lr.status === 401) return unauthorised(tok);
    let remote = [];
    if (lr.status === 200) { const j = await lr.json().catch(() => ({})); if (stale()) return { ok: false, aborted: true };
      remote = (Array.isArray(j?.vaults) ? j.vaults : []).filter(v => v && typeof v.pharmacyId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v.pharmacyId) && !v.deletedAt).map(v => v.pharmacyId); }
    const found = remote.filter(id => !store.boundTo(id) || store.boundTo(id) === acct);
    for (const id of [...new Set([...store.syncIds(acct), ...found])]) {
      if (stale()) return { ok: false, aborted: true };
      if (store.boundTo(id) && store.boundTo(id) !== acct) continue;
      let mine = localDoc(id); if (!mine && !found.includes(id)) continue;
      let ss = store.syncState(id); done.push(id);
      const unchanged = () => { const b = ss?.base; return !!b && (mine.live ? !b.deletedAt && sameDoc(mine.live, b) : !!b.deletedAt && b.deletedAt === mine.tomb.deletedAt); };
      // Nothing known from the server yet (rev 0): pull first, so a device restored from the same backup merges in
      // rather than overwriting. Nothing changed here since the last ack: just ask whether the server moved on.
      if (!mine || !ss || ss.rev === 0 || unchanged()) {
        const r = await api('GET', '/v1/sync/' + encodeURIComponent(id), { token: tok, signal, headers: ss?.rev ? { 'If-None-Match': '"rev-' + ss.rev + '"' } : {} });
        if (stale()) return { ok: false, aborted: true };
        if (r.status === 401) return unauthorised(tok);
        if (r.status === 200) { const j = await r.json(); if (stale()) return { ok: false, aborted: true };
          if (j.rev > (ss?.rev || 0)) { const out = store.applyRemoteSync(id, remoteDoc(id, j), j.rev, acct); if (out) applied = true; } }
        else if (r.status !== 304) { failed[id] = why(r); continue; }
        mine = localDoc(id); ss = store.syncState(id); if (!mine || unchanged()) continue;
      }
      for (let round = 0; round < 3; round++) {
        mine = localDoc(id); ss = store.syncState(id); if (!mine) break;
        const body = mine.live ? { baseRev: ss?.rev || 0, pharmacy: mine.live, deletedAt: null } : { baseRev: ss?.rev || 0, pharmacy: null, deletedAt: mine.tomb.deletedAt };
        const r = await api('POST', '/v1/sync/' + encodeURIComponent(id), { token: tok, signal, body });
        if (stale()) return { ok: false, aborted: true };
        if (r.status === 401) return unauthorised(tok);
        const j = await r.json().catch(() => ({})); if (stale()) return { ok: false, aborted: true };
        if (r.status === 200) { store.commitSyncAck(id, { rev: j.rev, base: mine.live || mine.tomb, ackedAt: j.updatedAt, account: acct }); break; }
        if (r.status === 409) { const remote = remoteDoc(id, j), out = store.applyRemoteSync(id, remote, j.rev, acct); if (out) applied = true;
          // Merged copy is what the server already has: done. Otherwise push the merge on top of the server's head.
          if (!out || (out.deletedAt ? !!remote.deletedAt && remote.deletedAt === out.deletedAt : !remote.deletedAt && sameDoc(out, remote))) break; continue; }
        failed[id] = why(r, j); break; // D3-E: noted for this pharmacy only; the others still sync
      }
    }
    const saved = await store.flush(); if (stale()) return { ok: false, aborted: true };
    // D3-E: waiting = what the server hasn't acknowledged as this device's copy (a third 409 in a row, or an edit made
    // while the push was on its way), and everything when saving on this phone didn't finish.
    const waiting = done.filter(id => !failed[id] && (saved === false || !acked(id)));
    const nFail = Object.keys(failed).length, okN = done.length - nFail - waiting.length;
    st.failed = failed; st.waiting = waiting; st.synced = okN; st.total = done.length;
    if (nFail) setState(okN || waiting.length ? 'partial' : 'error', failed[Object.keys(failed)[0]]);
    else if (waiting.length) setState('pending');
    else { st.lastSyncAt = new Date().toISOString(); pendingRetries = 0; setState('synced'); }
    if (waiting.length && pendingRetries < 3) { pendingRetries++; schedule(onChange, 4000 * pendingRetries); }
    if (applied) onChange?.();
    return { ok: !nFail && !waiting.length, applied, failed, waiting };
  } catch (e) { if (aborted(e) || stale()) return { ok: false, aborted: true }; setState('offline'); return { ok: false, error: true }; }
  finally { if (activeController === ac && seq === requestSeq) activeController = null; }
}
// D3-D: pharmacies on this device that are bound to another account (signed in with a different email before). They
// stay on this device and are not synced until the owner taps to add them to this account.
export const otherAccountCount = () => { const s = session(); return s ? store.otherAccountIds(s.accountId).length : 0; };
export async function attachOtherAccount(onChange) { const s = canNetwork() ? session() : null; if (!s) return 0;
  const ids = store.attachOtherAccount(s.accountId); if (ids.length) { await store.flush(); await syncAll(onChange); } return ids.length; }
// D3-E: only the session that got the 401 is forgotten; a newer sign-in (another tab, another account) is kept.
function unauthorised(tok) { if (tokenOf(session()) === tok) { heldToken = ''; clearSession(); st.failed = {}; st.waiting = []; setState('signed-out'); } return { ok: false, status: 401 }; }
// After a saved change: sync a moment later (changes in quick succession go in one sync).
export function schedule(onChange, wait = 1500) { if (!canNetwork() || !session()) return; clearTimeout(later); later = setTimeout(async () => { if ((await store.flush()) !== false) syncAll(onChange); else { st.waiting = [...new Set([...st.waiting, ...store.syncIds(session()?.accountId)])]; setState('pending'); } }, wait); }
// Stops the sync running now (a pharmacy switch) and starts a fresh one.
export function restart(onChange) { if (!canNetwork() || !session()) return; pendingRetries = 0; syncAll(onChange); }

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
