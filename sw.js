// MY STORE MANAGER — Service Worker v4.0
const CACHE_NAME = 'mystore-v4';
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
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('firestore.googleapis.com')) return;
  if(e.request.url.includes('firebase')) return;
  if(e.request.url.includes('googleapis.com')) return;
  if(e.request.url.includes('gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if(response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
      // Network first pour index.html — toujours charger la dernière version
      if(e.request.url.endsWith('/') || e.request.url.endsWith('index.html') || e.request.url.includes('mystore_manager')) {
        return fetchPromise.catch(() => cached);
      }
      return cached || fetchPromise;
    }).catch(() => {
      if(e.request.destination === 'document') {
        return caches.match('/STORE-MANAGER/index.html');
      }
    })
  );
});
