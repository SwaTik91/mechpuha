// sw.js
const CACHE_STATIC = 'mt-static-v4'; // увеличь версию при каждом релизе

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll([
      // если сайт в подкаталоге, укажи относительные пути
      'index.html',
      'assets/css/style.css',
      'assets/icons/profile.svg',
      'assets/icons/tree.svg',
      'assets/icons/chat.svg',
      'assets/icons/feed.svg',
      'assets/icons/calendar.svg'
    ])).catch(()=>{})
  );
});

self.addEventListener('activate', (e)=>{
  clients.claim();
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_STATIC).map(k => caches.delete(k))
    ))
  );
});

// Стратегии:
// - HTML: Network-first (чтобы получать свежие версии), fallback на кэш
// - CSS: Network-first (как у тебя изначально)
// - Остальное: Stale-while-revalidate
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(()=>caches.match('index.html'))
    );
    return;
  }

  if (url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(req).then(r=>{
        const copy = r.clone();
        caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
        return r;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached=>{
      const fetchPromise = fetch(req).then(networkResp=>{
        caches.open(CACHE_STATIC).then(c=>c.put(req, networkResp.clone()));
        return networkResp;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
