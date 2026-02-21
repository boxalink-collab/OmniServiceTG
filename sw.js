const CACHE_NAME = 'v1_OmniServiceTG';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css', // remplacez par vos fichiers
  '/script.js'
];

// Installation du Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Récupération des ressources
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
