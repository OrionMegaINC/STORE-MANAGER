// MY STORE MANAGER — Service Worker v2.0
// ORION MEGA INC — Togo

const CACHE_NAME = 'mystore-v2';
const ASSETS = [
  '/STORE-MANAGER/',
  '/STORE-MANAGER/index.html',
  '/STORE-MANAGER/manifest.json',
  '/STORE-MANAGER/icon-192.png',
  '/STORE-MANAGER/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
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
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore.googleapis.com')) return;
  if (e.request.url.includes('firebase')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/STORE-MANAGER/index.html');
        }
      });
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {title: 'MY STORE MANAGER', body: 'Notification'};
  e.waitUntil(
    self.registration.showNotification(data.title || 'MY STORE MANAGER', {
      body: data.body,
      icon: '/STORE-MANAGER/icon-192.png',
      badge: '/STORE-MANAGER/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
