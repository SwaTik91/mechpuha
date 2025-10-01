
self.addEventListener('install', e=>{
  e.waitUntil(caches.open('mishpucha-v3').then(c=>c.addAll(['./','./index.html','./assets/css/style.css'])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
