const CACHE_NAME = 'lifeos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/offline.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/supabase-config.js',
  '/js/pwa.js',
  '/assets/icons/icon-192x192.png'
];

// 1. Install Service Worker & Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate & Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Network First, Fallback to Cache (Smart Strategy)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline.html');
        });
      })
  );
});

// 4. Handle Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'LifeOS Update', body: 'You have a new notification.' };
  
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    data: data.url || '/dashboard.html'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
