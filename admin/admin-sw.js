// ════════════════════════════════════════
//   Admin Service Worker — OmniService TG
// ════════════════════════════════════════
const CACHE_NAME = 'omniservice-admin-v1';

// Ressources à mettre en cache (shell de l'app admin)
const STATIC_ASSETS = [
  './',
  './index.html',
  '../assets/logo.png'
];

// ── Installation : mise en cache du shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[Admin SW] Certaines ressources non mises en cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activation : nettoyage des anciens caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : Network-first (admin doit toujours avoir des données fraîches) ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requêtes Firebase / API externes
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('fonts.') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre à jour le cache avec la réponse fraîche
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si réseau indisponible
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Page offline de secours pour l'admin
          if (event.request.destination === 'document') {
            return new Response(
              `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Admin — Hors ligne</title>
              <style>body{font-family:sans-serif;background:#0a1220;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:16px;text-align:center}
              h1{font-size:24px;margin:0}p{color:rgba(255,255,255,.5);font-size:13px}
              button{background:#1E6FBE;color:#fff;border:none;border-radius:999px;padding:12px 24px;font-size:14px;cursor:pointer;margin-top:8px}</style></head>
              <body><div style="font-size:48px">🛡️</div><h1>Administration hors ligne</h1>
              <p>Vérifiez votre connexion internet pour accéder au panneau admin.</p>
              <button onclick="location.reload()">↻ Réessayer</button></body></html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          }
        });
      })
  );
});
