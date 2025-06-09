// Service Worker pour "Qui est dispo" avec mise à jour automatique
const VERSION = '1.0.11'; // Incrémenter à chaque déploiement
const CACHE_NAME = 'qui-est-dispo-v' + VERSION;
const STATIC_CACHE = 'qui-est-dispo-static-v1';

// Ressources à mettre en cache
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installation en cours...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cache ouvert');
        return cache.addAll(
          urlsToCache.map(url => new Request(url, { cache: 'no-cache' }))
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ressources mises en cache');
        // Prendre le contrôle immédiatement (skipWaiting)
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activation...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Supprimer les anciens caches
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log(
                "🗑️ Service Worker: Suppression de l'ancien cache:",
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Prêt et actif');
        // Prendre le contrôle de toutes les pages immédiatement
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si la ressource est en cache, la retourner
      if (response) {
        // En parallèle, vérifier s'il y a une version plus récente
        fetch(event.request)
          .then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          })
          .catch(() => {
            // Ignorer les erreurs réseau
          });

        return response;
      }

      // Si pas en cache, faire la requête réseau
      return fetch(event.request).then(response => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Notification périodique pour vérifier les mises à jour
setInterval(
  () => {
    self.clients.matchAll().then(clients => {
      if (clients && clients.length > 0) {
        // Envoyer un message aux clients pour vérifier les mises à jour
        clients.forEach(client => {
          client.postMessage({
            type: 'CHECK_FOR_UPDATES',
            version: VERSION,
          });
        });
      }
    });
  },
  2 * 60 * 1000
); // Vérifier toutes les 2 minutes

// Écouter les demandes de vérification de version
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source.postMessage({
      type: 'CURRENT_VERSION',
      version: VERSION,
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log("⚡ Service Worker: Activation forcée par l'utilisateur");
    self.skipWaiting();
  }
});
