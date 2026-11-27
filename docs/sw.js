// R.Pharmacy offline worker (V3-01). It caches the app shell only. It never reads, clears or migrates saved records
// (IndexedDB and localStorage belong to the app). The page is network-first so updates arrive; icons and the manifest
// are cache-first. Old shell caches (propapp-shell-*) are removed when a new version activates.
const SHELL = 'propapp-shell-61a4df8cc0';
const BUILD = '61a4df8cc0';
const FILES = ['./manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
// Stage 3D: a page is stored as the shell only if it is this worker's own build (its propapp-build marker matches), so
// an error page, a half-deployed copy or another build is never what opens offline.
const marker = t => (/<meta name="propapp-build" content="([0-9a-f]+)"/.exec(t) || [])[1] || '';
const keepShell = async (c, res) => { const t = await res.clone().text(); if (marker(t) !== BUILD) return false; await c.put('./index.html', res.clone()); await c.put('./', res); return true; };
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(async c => { await c.addAll(FILES);
  const res = await fetch('./index.html', { cache: 'reload' }); if (!res.ok || !(await keepShell(c, res))) throw Error('shell is not build ' + BUILD); }).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('propapp-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// The page asks which build this worker serves, so a tab running an older build can reload when this one takes over.
self.addEventListener('message', e => { if (e.data === 'propapp-build') e.ports[0]?.postMessage(BUILD); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // R11/F-V3-05: only the app page itself refreshes the cached shell, only from a good response of this build, and
    // the worker stays alive until the copy is stored. Stage 3D: a server error (503 and the like) opens the cached
    // shell too, as being offline does.
    const path = new URL(r.url).pathname, scope = new URL(self.registration.scope).pathname, shell = path === scope || path === scope + 'index.html';
    const cached = () => caches.match('./index.html');
    e.respondWith(fetch(r).then(async res => { if (!res.ok) return (await cached()) || res;
      if (shell) e.waitUntil(caches.open(SHELL).then(c => keepShell(c, res.clone())).catch(() => {})); return res; })
      .catch(() => cached())); return; }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
});
