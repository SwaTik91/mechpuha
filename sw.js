// sw.js
const CACHE_STATIC = 'mt-static-v4'; // ← обнови версию
self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_STATIC).then(cache => cache.addAll([
    '/',             // если деплой из корня; для подкаталога укажи правильный путь
    '/index.html',
    '/assets/css/style.css',
    // минимум критичных ассетов; не клади сюда app.js, чтобы не залипал
  ])));
});
self.addEventListener('activate', (e)=>{
  clients.claim();
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE_STATIC).map(k=>caches.delete(k))
  )));
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);

  // HTML всегда тянем из сети (с фолбэком из кэша)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(()=>caches.match('/index.html'))
    );
    return;
  }

  // CSS — network-first (как у тебя было — ок)
  if (url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(e.request).then(r=>{
        const copy = r.clone();
        caches.open(CACHE_STATIC).then(c=>c.put(e.request, copy));
        return r;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }

  // Остальное — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(networkResp=>{
        caches.open(CACHE_STATIC).then(c=>c.put(e.request, networkResp.clone()));
        return networkResp;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
