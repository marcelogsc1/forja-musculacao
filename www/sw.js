/* Service worker do Forja
   - Página (index.html, config.js): rede primeiro, cópia local se estiver sem internet. Assim atualizações chegam rápido.
   - Scripts e estilos (com ?v=versão): cache primeiro. Ilustrações: guardadas na primeira vez que aparecem.
   - /api nunca passa pelo cache.
   Ao publicar nova versão, o build muda VERSION e o app se atualiza sozinho. */
const VERSION = 'forja-4.33.0';
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "css/base.css?v=4.33.0", "css/app.css?v=4.33.0", "fonts/archivo-latin-wdth-normal.woff2", "fonts/geist-latin-wght-normal.woff2", "fonts/geist-mono-latin-wght-normal.woff2", "icons/icon-192.png", "icons/icon-512.png", "js/util.js?v=4.33.0", "js/templates.js?v=4.33.0", "js/catalog.js?v=4.33.0", "js/figs.js?v=4.33.0", "js/anim.js?v=4.33.0", "js/instructions.js?v=4.33.0", "js/programs.js?v=4.33.0", "js/bodydata.js?v=4.33.0", "js/body.js?v=4.33.0", "js/platform.js?v=4.33.0", "js/store.js?v=4.33.0", "js/app.js?v=4.33.0", "js/explore.js?v=4.33.0", "js/nutrition.js?v=4.33.0", "js/motion.js?v=4.33.0", "js/notes.js?v=4.33.0", "js/foods.js?v=4.33.0", "js/menu.js?v=4.33.0", "js/corpo.js?v=4.33.0", "js/progress.js?v=4.33.0", "js/ptr.js?v=4.33.0", "js/boot.js?v=4.33.0"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
/* atlas de miniaturas em uso (o nome muda com o conteúdo); os antigos saem do cache de mídia */
const ATLAS = ["t-83e4007f24.webp", "t-a5179d88ba.webp"];
const oldAtlas = u => /\/anim\/[mf]\/(thumbs\.webp|t-[^/]+\.webp)$/.test(u) && !ATLAS.some(n => u.endsWith('/' + n));
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'forja-media').map(k => caches.delete(k))))
  .then(() => caches.open('forja-media')).then(c => c.keys().then(rs => Promise.all(rs.filter(r => oldAtlas(new URL(r.url).pathname)).map(r => c.delete(r))))).catch(() => {}).then(() => self.clients.claim())); });
/* v4.32: fim do descanso com o app em segundo plano. A página manda a hora; o service worker espera
   (até ~5 min, limite do navegador) e mostra a notificação com som e vibração, só se o app não estiver na tela. */
let restTok = 0;
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'rest-cancel'){ restTok++; e.waitUntil(self.registration.getNotifications({tag: 'forja-rest'}).then(ns => ns.forEach(n => n.close())).catch(() => {})); return; }
  if (d.type !== 'rest-at') return;
  const tok = ++restTok; const ms = Math.max(0, (+d.at || 0) - Date.now());
  if (ms > 295000) return;
  e.waitUntil(new Promise(r => setTimeout(r, ms)).then(async () => {
    if (tok !== restTok) return;
    const cs = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    if (cs.some(c => c.visibilityState === 'visible')) return;
    return self.registration.showNotification(d.title || 'Descanso concluído', {body: d.body || 'Hora da próxima série', tag: 'forja-rest', renotify: true, silent: false, vibrate: [300, 120, 300, 120, 400], icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', timestamp: +d.at, data: {url: './'}});
  }).catch(() => {}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => { const c = cs.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./'); }));
});
self.addEventListener('fetch', e => {
  const req = e.request; const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  if (u.pathname.includes('/anim/') && u.pathname.endsWith('.mp4')) return;  // vídeo: o navegador pede por partes, fica fora do cache
  if (u.pathname.includes('/fig/') || u.pathname.includes('/figf/') || u.pathname.includes('/img/') || u.pathname.includes('/anim/')){
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
