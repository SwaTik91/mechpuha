// sw.js — безопасный pass-through, ничего не кэшируем
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  clients.claim();
});
// Ничего не перехватываем, пусть браузер сам ходит в сеть
self.addEventListener('fetch', (e) => {
  // Важно: ничего не делать здесь
});
