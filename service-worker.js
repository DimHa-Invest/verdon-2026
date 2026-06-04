const CACHE_NAME = 'verdon-v4';
const REPO = '/verdon-2026'; // Verrouillage strict sur ton dépôt

const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('openweathermap')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Mise à jour silencieuse
        fetch(event.request).then(response => {
          if(response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
        }).catch(() => {});
        return cachedResponse;
      }
      
      return fetch(event.request).then(response => {
         if(response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
         }
         return response;
      }).catch(() => {
         // Fallback sur le chemin strict
         if (event.request.mode === 'navigate') {
            return caches.match(`${REPO}/index.html`);
         }
      });
    })
  );
});
