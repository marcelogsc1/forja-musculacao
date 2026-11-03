/* Service worker do Forja
   - Página (index.html, config.js): rede primeiro, cópia local se estiver sem internet. Assim atualizações chegam rápido.
   - Scripts e estilos (com ?v=versão): cache primeiro. Ilustrações: guardadas na primeira vez que aparecem.
   - /api nunca passa pelo cache.
   Ao publicar nova versão, o build muda VERSION e o app se atualiza sozinho. */
const VERSION = 'forja-4.3.0';
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "css/base.css?v=4.3.0", "css/app.css?v=4.3.0", "fonts/archivo-latin-wdth-normal.woff2", "fonts/geist-latin-wght-normal.woff2", "fonts/geist-mono-latin-wght-normal.woff2", "icons/icon-192.png", "icons/icon-512.png", "js/util.js?v=4.3.0", "js/templates.js?v=4.3.0", "js/catalog.js?v=4.3.0", "js/programs.js?v=4.3.0", "js/bodydata.js?v=4.3.0", "js/body.js?v=4.3.0", "js/platform.js?v=4.3.0", "js/store.js?v=4.3.0", "js/app.js?v=4.3.0", "js/explore.js?v=4.3.0", "js/boot.js?v=4.3.0"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'forja-media').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  if (u.pathname.includes('/fig/') || u.pathname.includes('/img/')){
    e.respondWith(caches.open('forja-media').then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  const page = req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html') || u.pathname.endsWith('config.js') || u.pathname.endsWith('.webmanifest');
  if (page){
    e.respondWith(fetch(req).then(r => { if (r.ok){ const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(async () => (await caches.match(req)) || (await caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok){ const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })));
});
