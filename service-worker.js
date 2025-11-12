// Service Worker Version - MUSS BEI JEDER ÄNDERUNG ERHÖHT WERDEN!
const CACHE_NAME = 'meta-app-cache-v1.1.2';
const DATA_CACHE_NAME = 'meta-data-cache-v1';

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
    console.log('Service Worker installiert. Cache-Name:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. AKTIVIERUNG: Sofortige Kontrolle übernehmen & Alte Caches aufräumen
self.addEventListener('activate', event => {
    console.log('Service Worker aktiviert.');
    
    // KORREKTUR für PWA-Updates: Entferne den direkten self.skipWaiting() Aufruf hier.
    // Die Aktivierung wird durch die postMessage-Nachricht bei Klick auf "Neu laden" gesteuert.
    // self.skipWaiting(); 

    // Erzwingt die sofortige Übernahme der Kontrolle über alle Clients
    event.waitUntil(self.clients.claim()); 

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
                        // Wenn Netzwerk fehlschlägt, den ursprünglichen Fehler weiterleiten
                        throw error;
                    });
                    
                    // Liefere entweder die gecachte Version sofort oder warte auf das Netzwerk
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
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

// 4. Nachrichten-Handler (WICHTIG für das Update):
// Ermöglicht dem Hauptskript, den Service Worker zur sofortigen Übernahme (skipWaiting) zu zwingen.
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('Service Worker: skipWaiting-Befehl empfangen. Erzwinge Aktivierung...');
        self.skipWaiting();
    }
});















