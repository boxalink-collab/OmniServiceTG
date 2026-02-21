/* ══════════════════════════════════════════
   OmniService TG — Service Worker (PWA)
   v5
   ══════════════════════════════════════════ */

const CACHE_NAME = 'omniservice-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://boxalink-collab.github.io/OmniServiceTG/assets/logo.png',
  'https://boxalink-collab.github.io/OmniServiceTG/assets/icon-any-192.png',
  'https://boxalink-collab.github.io/OmniServiceTG/assets/icon-any-512.png',
  'https://boxalink-collab.github.io/OmniServiceTG/assets/icon-maskable-192.png',
  'https://boxalink-collab.github.io/OmniServiceTG/assets/icon-maskable-512.png'
];

// ── Installation ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Non mis en cache :', url, err)
          )
        )
      )
    ).then(() => {
      console.log('[SW] Installation terminée');
      return self.skipWaiting();
    })
  );
});

// ── Activation ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Suppression ancien cache :', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : Network-First avec fallback cache ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Firebase / API → toujours réseau
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('cloudfunctions.net')
  ) {
    return;
  }

  // Google Fonts → Cache-First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Tout le reste → Network-First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
