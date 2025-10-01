
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('mishpucha-v2').then(cache => cache.addAll([
    './','./index.html','./manifest.webmanifest',
    './assets/css/style.css'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
