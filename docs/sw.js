// R.Pharmacy offline worker (V3-01). It caches the app shell only. It never reads, clears or migrates saved records
// (IndexedDB and localStorage belong to the app). The page is network-first so updates arrive; icons and the manifest
// are cache-first. Old shell caches (propapp-shell-*) are removed when a new version activates.
const SHELL = 'propapp-shell-4f64f0558c';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('propapp-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // R11/F-V3-05: only the app page itself refreshes the cached shell, only from a good response, and the worker
    // stays alive until the copy is stored.
    const path = new URL(r.url).pathname, scope = new URL(self.registration.scope).pathname, shell = path === scope || path === scope + 'index.html';
    e.respondWith(fetch(r).then(res => { if (res.ok && shell) { const copy = res.clone(); e.waitUntil(caches.open(SHELL).then(c => c.put('./index.html', copy))); } return res; })
      .catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
});
