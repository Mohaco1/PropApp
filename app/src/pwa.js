// Installable app (V3-01; owner: prepared, not deployed). Only active in the dist/pwa build served over https (or
// localhost): registers the offline worker and asks the browser to keep this site's storage. Does nothing in the
// single-file app or inside claude.ai.
export const isPWA = () => !!window.PROPAPP_PWA && ('serviceWorker' in navigator) && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
export const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
export function startPWA() {
  if (!isPWA()) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
let asked = false;
// Called after the first saved change: browsers that allow it keep this site's records even when space is short.
export function askToKeep() { if (asked || !isPWA() || !navigator.storage?.persist) return; asked = true; navigator.storage.persist().catch(() => {}); }
export async function keptStatus() { try { return navigator.storage?.persisted ? await navigator.storage.persisted() : null; } catch { return null; } }
