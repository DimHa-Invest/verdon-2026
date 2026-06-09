const CACHE_NAME = 'verdon-cache-v25';

const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web',
    'img/j1.webp',
    'img/j2.webp',
    'img/j3.webp',
    'img/j4.webp',
    'img/j5.webp',
    'img/j6.webp',
    'img/j7.webp',
    'img/j8.webp',
    'img/j9.webp',
    'img/j10.webp',
    'img/j11.webp',
    'img/j12.webp',
    'img/j13.webp',
    'img/j14.webp',
    'img/j15.webp'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 [Service Worker] Mise en cache complète (Interface + Photos)');
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
