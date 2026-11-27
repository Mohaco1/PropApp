// Installable app (V3-01; owner: prepared, not deployed). Only active in the dist/pwa build served over https (or
// localhost): registers the offline worker and asks the browser to keep this site's storage. Does nothing in the
// single-file app or inside claude.ai.
import { flush } from './store.js';
export const isPWA = () => !!window.PROPAPP_PWA && ('serviceWorker' in navigator) && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
export const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
// Which build a worker serves (it answers on a message channel); '' if it doesn't say within 3 s.
const workerBuild = w => new Promise(res => { if (!w) return res(''); const ch = new MessageChannel(), t = setTimeout(() => res(''), 3000);
  ch.port1.onmessage = e => { clearTimeout(t); res(String(e.data || '')); }; try { w.postMessage('propapp-build', [ch.port2]); } catch { clearTimeout(t); res(''); } });
export function startPWA() {
  if (!isPWA()) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
  // Stage 3D: when a new worker takes over a tab that is still running an older build, the tab saves what is queued and
  // reloads once into the new build, so page and worker never run different versions. One reload per build at most.
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    const b = await workerBuild(navigator.serviceWorker.controller); if (!b || b === window.PROPAPP_BUILD) return;
    try { if (sessionStorage.getItem('propapp-sw-reload') === b) return; sessionStorage.setItem('propapp-sw-reload', b); } catch {}
    try { await flush(); } catch {} location.reload();
  });
}
let asked = false;
// Called after the first saved change: browsers that allow it keep this site's records even when space is short.
export function askToKeep() { if (asked || !navigator.storage?.persist) return; asked = true; navigator.storage.persist().catch(() => {}); }
export async function keptStatus() { try { return navigator.storage?.persisted ? await navigator.storage.persisted() : null; } catch { return null; } }
