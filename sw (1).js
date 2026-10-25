// MY STORE MANAGER — Service Worker v5.0
// Les données ne sont jamais mises en cache ici : elles vivent sur le compte Google (Firestore).
// On garde seulement l'application et ses bibliothèques pour pouvoir l'ouvrir sans internet.
const CACHE_NAME = 'mystore-v5';
const ASSETS = [
  '/STORE-MANAGER/',
  '/STORE-MANAGER/index.html',
  '/STORE-MANAGER/manifest.json',
  '/STORE-MANAGER/icon-192.png',
  '/STORE-MANAGER/icon-512.png'
];
// Bibliothèques versionnées (ne changent jamais) : cache d'abord
const CDN = [
  'https://www.gstatic.com/firebasejs/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/',
  'https://images.unsplash.com/'
];
// Services en ligne (connexion Google, base de données) : jamais en cache
const NETWORK_ONLY = ['firestore.googleapis.com','identitytoolkit.googleapis.com','securetoken.googleapis.com',
  'firebaseinstallations.googleapis.com','fcmregistrations.googleapis.com','www.googleapis.com',
  'accounts.google.com','apis.google.com','firebaseapp.com','google-analytics.com','googletagmanager.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = req.url;
  if(NETWORK_ONLY.some(h => url.includes(h))) return;

  if(CDN.some(p => url.startsWith(p))){
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if(res && (res.ok || res.type === 'opaque')){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }))
    );
    return;
  }

  if(!url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if(res.ok && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      });
      // Page principale : réseau d'abord (dernière version), cache si hors ligne
      if(req.mode === 'navigate' || url.endsWith('/') || url.endsWith('index.html')) return net.catch(() => cached || caches.match('/STORE-MANAGER/index.html'));
      return cached || net;
    })
  );
});
