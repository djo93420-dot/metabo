const CACHE_NAME = 'metabo-v4';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))))
      .catch(() => caches.open(CACHE_NAME).then(cache => cache.add('./index.html')))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Pour les requêtes locales (HTML, CSS, etc.) -> Network First
  // Pour les API externes (OpenFoodFacts, Fonts) -> Network First aussi (plus simple et efficace pour la dev)
  
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Mettre en cache la nouvelle version
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => {
        // En cas de mode hors-ligne, retourner la version en cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.destination === 'document' || e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Notifications push (pour les rappels planifiés)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
