// Service Worker Version - MUSS BEI JEDER ÄNDERUNG ERHÖHT WERDEN!
const CACHE_NAME = 'meta-app-cache-v1.0.2'; // ERHÖHT: Version für die neue Logik
const DATA_CACHE_NAME = 'meta-data-cache-v1'; // Separater Cache für dynamische Daten

// Eine Liste aller Dateien, die IMMER gecacht werden sollen (App-Shell)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js', 
  './manifest.json',
  // Font Awesome CSS
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  // Bilder/Icons
  './images/icon-192x192.png',
  './images/icon-512x512.png'
];

// 1. INSTALLATION: App-Shell Dateien in den Cache legen
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
          // Lösche alle Caches, die NICHT der aktuellen App-Shell-Version oder dem Daten-Cache entsprechen
          return cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME;
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
  const url = new URL(event.request.url);

  // Sonderbehandlung für die Metadaten: Stale-While-Revalidate
  if (url.pathname.endsWith('/meta-data.json')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        // 1. Liefere sofort die gecachte Version (falls vorhanden)
        return cache.match(event.request).then(cachedResponse => {
          // 2. Hole die neueste Version im Hintergrund vom Netzwerk
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // Speichere die neue Version für das nächste Mal
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(error => {
            console.error('Daten-Update fehlgeschlagen:', error);
            // Wenn Netzwerk fehlschlägt, den ursprünglichen Fehler weiterleiten, 
            // falls auch kein Cache vorhanden ist.
          });
          
          // Liefere entweder die gecachte Version sofort oder warte auf das Netzwerk
          return cachedResponse || fetchPromise;
        });
      })
    );
    return; // Wichtig, um die Standard-Logik zu überspringen
  }

  // Standard-Strategie für App-Shell (Cache-First)
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


