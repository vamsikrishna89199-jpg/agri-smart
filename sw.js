const CACHE_NAME = 'agrismart-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/login.html',
    '/assets/style.css',
    '/assets/main-optimized.css',
    '/js/app-optimized.js',
    '/js/firebase-config.js',
    '/js/voice.js',
    '/js/voice_actions.js',
    '/js/disease_scan.js',
    '/js/market_adviser.js',
    '/js/commandProcessor.js',
    '/js/commandContext.js',
    '/js/actionEngine.js'
    // Note: Do not cache API endpoints heavily, just static assets
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests from the same origin
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // Basic network-first strategy for local API calls, cache-first for static assets
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).catch(() => {
                    // Fallback for failed navigation/asset fetch
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return null;
                });
            })
        );
    }
});
