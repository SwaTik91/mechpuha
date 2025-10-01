// MishpuchaTech Service Worker
// v4: убрали CSS из предкеша и сделали network-first для стилей

const CACHE_NAME = 'mishpucha-v4';
const PRECACHE = ['./', './index.html']; // CSS не предкешируем, чтобы не залипала старая версия

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Для CSS — network-first (при офлайне — из кэша)
  if (req.destination === 'style' || req.url.endsWith('.css')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || fetch(req);
      }
    })());
    return;
  }

  // Остальные запросы — cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
