// Service Worker Version - MUSS BEI JEDER ÄNDERUNG ERHÖHT WERDEN!
const CACHE_NAME = 'meta-app-cache-v1.0.0';

// Eine Liste aller Dateien, die gecacht werden sollen (inkl. manifest.json)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js', 
  './manifest.json',
  // Hier alle Icons/Bilder eintragen, z.B.
  './images/icon-192x192.png',
  './images/icon-512x512.png'
];

// 1. INSTALLATION: Dateien in den Cache legen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker installiert. Caching statischer Assets.');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. AKTIVIERUNG: Alte Caches aufräumen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Lösche alle Caches, die NICHT der aktuellen Version entsprechen
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Alten Cache gelöscht:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// 3. FETCH: Dateien aus dem Cache liefern (Offline-Fähigkeit)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache Treffer: Liefere die gecachte Ressource
        if (response) {
          return response;
        }
        // Kein Cache Treffer: Hole die Ressource aus dem Netzwerk
        return fetch(event.request);
      })
  );
});
