// CODIGIX EXECUTIVE OS - Service Worker
const CACHE_NAME = 'codigix-exec-os-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.png'
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

// ── Notification Click Event for Mobile & Desktop ──
// Handles tapping notifications on mobile lock screen / status bar, focuses PWA and signals task popup
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/planner';
  
  if (data.type === 'nextDayPrep' || data.isPrep) {
    targetUrl = `/planner?openNextDayPrep=1&openDay=${encodeURIComponent(data.day || '')}`;
  } else if (data.mealId) {
    targetUrl = `/planner?openDietMealId=${encodeURIComponent(data.mealId)}&openDay=${encodeURIComponent(data.day || '')}`;
  } else if (data.taskId) {
    targetUrl = `/planner?openTaskId=${encodeURIComponent(data.taskId)}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and broadcast message
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.postMessage) {
            client.postMessage({
              type: data.type === 'nextDayPrep' ? 'nextDayPrep' : 'NOTIFICATION_TASK_CLICKED',
              taskId: data.taskId,
              mealId: data.mealId,
              day: data.day,
              notificationType: data.type,
              data: data,
              action: event.action
            });
          }
          return;
        }
      }

      // If no window is currently open, open a new window directly with the task param
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Optional Web Push Event
self.addEventListener('push', (event) => {
  let payload = { title: 'Task Reminder', body: 'You have a scheduled reminder.' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    payload.body = event.data ? event.data.text() : payload.body;
  }

  const options = {
    body: payload.body,
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    vibrate: [300, 100, 300, 100, 300],
    data: payload.data || {},
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});
