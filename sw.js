
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('mishpucha-v1').then(cache => cache.addAll([
    './','./index.html','./manifest.webmanifest',
    './assets/css/style.css',
    './assets/js/app.js','./assets/js/ui.js','./assets/js/data.js',
    './assets/js/feed.js','./assets/js/tree.js','./assets/js/calendar.js',
    './assets/js/groups.js','./assets/js/events.js','./assets/js/synagogues.js',
    './assets/js/admin.js','./assets/js/profile.js'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
