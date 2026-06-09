const CACHE_NAME = 'verdon-cache-v2';

const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web'
    // Les photos sont exclues pour la phase de test
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 [Service Worker] Mise en cache du squelette (sans photos)');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🧹 [Service Worker] Nettoyage de l\'ancien cache :', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.hostname === 'api.open-meteo.com') {
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.log('🌩️ [Service Worker] API Météo inaccessible (Mode Hors-ligne).');
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    throw error;
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return networkResponse;
            }).catch(() => {
                console.log('🚫 [Service Worker] Requête échouée hors-ligne :', event.request.url);
            });
        })
    );
});
