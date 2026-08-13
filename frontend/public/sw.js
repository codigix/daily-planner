// CODIGIX EXECUTIVE OS - Service Worker
const CACHE_NAME = 'codigix-exec-os-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  '/pwa-maskable-512x512.svg'
];

// Install Event - Precache core static shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching core application shell');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[PWA SW] Pre-cache non-fatal warning:', err);
      });
    })
  );
});

// Activate Event - Claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Deleting legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with Cache fallback for navigation and static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API requests / Chrome extensions
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid responses for static assets
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (event.request.destination === 'script' || 
           event.request.destination === 'style' || 
           event.request.destination === 'image' || 
           event.request.destination === 'font')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        
        // For HTML navigation requests, fallback to root index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      })
  );
});
