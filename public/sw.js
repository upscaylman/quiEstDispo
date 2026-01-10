// Service Worker pour "Qui est dispo" - Version améliorée
const VERSION = '1.5.0'; // Version mise à jour - fix clone Response
const CACHE_NAME = 'qui-est-dispo-v' + VERSION;
const STATIC_CACHE = 'qui-est-dispo-static-v4';
const DYNAMIC_CACHE = 'qui-est-dispo-dynamic-v4';
const API_CACHE = 'qui-est-dispo-api-v3';

// Ressources critiques à précharger
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
];

// Ressources statiques à mettre en cache
const STATIC_RESOURCES = [
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo192.png',
  '/logo512.png',
  '/logo192.svg',
  '/logo512.svg',
];

// Patterns d'URL à mettre en cache
const CACHE_PATTERNS = {
  // Firebase et APIs externes
  api: /^https:\/\/(firestore\.googleapis\.com|identitytoolkit\.googleapis\.com)/,
  // Images et assets
  images: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  // Fonts
  fonts: /\.(woff|woff2|eot|ttf|otf)$/,
  // CSS et JS
  assets: /\.(css|js)$/,
};

// Durées de cache
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 jours
  dynamic: 7 * 24 * 60 * 60 * 1000, // 7 jours
  api: 5 * 60 * 1000, // 5 minutes
  images: 14 * 24 * 60 * 60 * 1000, // 14 jours
};

// Installation du Service Worker améliorée
self.addEventListener('install', event => {
  console.log('🔧 Service Worker v' + VERSION + ': Installation en cours...');

  event.waitUntil(
    Promise.all([
      // Cache des ressources critiques
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Mise en cache des ressources critiques...');
        return cache.addAll(
          CRITICAL_RESOURCES.map(
            url =>
              new Request(url, {
                cache: 'no-cache',
                credentials: 'same-origin',
              })
          )
        );
      }),

      // Cache des ressources statiques (optionnel)
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Mise en cache des ressources statiques...');
        return cache
          .addAll(
            STATIC_RESOURCES.map(
              url =>
                new Request(url, {
                  cache: 'force-cache',
                  credentials: 'same-origin',
                })
            )
          )
          .catch(error => {
            console.warn('⚠️ Erreur cache statique (non critique):', error);
            // Ne pas faire échouer l'installation pour les ressources optionnelles
          });
      }),
    ])
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');

        // Notifier les clients qu'une nouvelle version est prête
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_READY',
            version: VERSION,
            timestamp: Date.now(),
          });
        });
      })
  );
});

// Activation améliorée avec nettoyage intelligent
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker v' + VERSION + ': Activation...');

  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        const currentCaches = [
          CACHE_NAME,
          STATIC_CACHE,
          DYNAMIC_CACHE,
          API_CACHE,
        ];
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Prendre le contrôle immédiatement
      self.clients.claim(),
    ])
      .then(() => {
        console.log('✅ Service Worker: Activation terminée');

        // Notifier l'activation
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_ACTIVE',
            version: VERSION,
            timestamp: Date.now(),
          });
        });
      })
  );
});

// Stratégie de cache intelligente
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les extensions de navigateur
  if (
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'moz-extension:'
  ) {
    return;
  }

  event.respondWith(handleFetchRequest(request));
});

// Gestionnaire de requêtes amélioré
async function handleFetchRequest(request) {
  const url = new URL(request.url);

  try {
    // 1. Navigation (HTML) - Network First
    if (request.mode === 'navigate') {
      return await networkFirstStrategy(request, CACHE_NAME);
    }

    // 2. API Firebase - Stale While Revalidate
    if (CACHE_PATTERNS.api.test(url.href)) {
      return await staleWhileRevalidateStrategy(
        request,
        API_CACHE,
        CACHE_DURATION.api
      );
    }

    // 3. Images - Cache First
    if (CACHE_PATTERNS.images.test(url.pathname)) {
      return await cacheFirstStrategy(
        request,
        STATIC_CACHE,
        CACHE_DURATION.images
      );
    }

    // 4. Fonts - Cache First (longue durée)
    if (CACHE_PATTERNS.fonts.test(url.pathname)) {
      return await cacheFirstStrategy(
        request,
        STATIC_CACHE,
        CACHE_DURATION.static
      );
    }

    // 5. Assets CSS/JS - Cache First
    if (CACHE_PATTERNS.assets.test(url.pathname)) {
      return await cacheFirstStrategy(
        request,
        STATIC_CACHE,
        CACHE_DURATION.static
      );
    }

    // 6. Autres requêtes - Network First
    return await networkFirstStrategy(request, DYNAMIC_CACHE);
  } catch (error) {
    console.warn('⚠️ Erreur fetch:', error);

    // Fallback vers le cache ou page offline
    return await getCachedResponseOrFallback(request);
  }
}

// Stratégie Network First
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stratégie Cache First
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);

  // Vérifier si le cache est encore valide
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const isExpired = Date.now() - cachedDate.getTime() > maxAge;

    if (!isExpired) {
      return cachedResponse;
    }
  }

  // Fetch depuis le réseau
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidateStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);

  // Toujours essayer de fetch en arrière-plan
  const networkResponsePromise = fetch(request)
    .then(async response => {
      if (response && response.status === 200) {
        // Cloner la réponse AVANT de l'utiliser
        const responseToCache = response.clone();
        const cache = await caches.open(cacheName);
        await cache.put(request, responseToCache);
      }
      return response;
    })
    .catch(() => null);

  // Si on a une réponse en cache et qu'elle est récente, la retourner immédiatement
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const isRecent = Date.now() - cachedDate.getTime() < maxAge;

    if (isRecent) {
      return cachedResponse;
    }
  }

  // Sinon, attendre la réponse réseau
  const networkResponse = await networkResponsePromise;
  return networkResponse || cachedResponse;
}

// Fallback pour les erreurs
async function getCachedResponseOrFallback(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Pour les navigations, retourner la page d'accueil en cache
  if (request.mode === 'navigate') {
    const homeResponse = await caches.match('/');
    if (homeResponse) {
      return homeResponse;
    }
  }

  // Réponse d'erreur générique
  return new Response(
    JSON.stringify({
      error: 'Contenu non disponible hors ligne',
      timestamp: Date.now(),
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Vérification des mises à jour améliorée
let updateCheckInterval;

function startUpdateChecks() {
  if (updateCheckInterval) return;

  updateCheckInterval = setInterval(
    () => {
      self.clients.matchAll().then(clients => {
        if (clients && clients.length > 0) {
          clients.forEach(client => {
            client.postMessage({
              type: 'CHECK_FOR_UPDATES',
              version: VERSION,
              timestamp: Date.now(),
            });
          });
        }
      });
    },
    3 * 60 * 1000
  ); // Toutes les 3 minutes
}

function stopUpdateChecks() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}

// Démarrer les vérifications quand des clients sont actifs
self.addEventListener('message', event => {
  const { data } = event;

  if (!data) return;

  switch (data.type) {
    case 'GET_VERSION':
      event.source.postMessage({
        type: 'CURRENT_VERSION',
        version: VERSION,
        timestamp: Date.now(),
      });
      break;

    case 'SKIP_WAITING':
      console.log("⚡ Service Worker: Activation forcée par l'utilisateur");
      self.skipWaiting().then(() => {
        console.log('✅ Service Worker: skipWaiting() terminé');
      });
      break;

    case 'START_UPDATE_CHECKS':
      startUpdateChecks();
      break;

    case 'STOP_UPDATE_CHECKS':
      stopUpdateChecks();
      break;

    case 'CLEAR_CACHE':
      // Nettoyer le cache sur demande
      caches
        .keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.source.postMessage({
            type: 'CACHE_CLEARED',
            timestamp: Date.now(),
          });
        });
      break;
  }
});

// Gestion des notifications push améliorée
self.addEventListener('push', event => {
  console.log('📱 Service Worker: Notification push reçue');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('⚠️ Erreur parsing notification:', e);
    data = {
      title: 'Qui est dispo',
      body: event.data?.text() || 'Nouvelle notification',
    };
  }

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: Date.now(),
    actions: data.actions || [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/logo192.png',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Qui est dispo', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('🔔 Clic sur notification:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Ouvrir l'application
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Si l'app est déjà ouverte, la mettre au premier plan
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }

      // Sinon ouvrir une nouvelle fenêtre
      return self.clients.openWindow('/');
    })
  );
});

// Démarrer automatiquement les vérifications
startUpdateChecks();

console.log('🚀 Service Worker v' + VERSION + ' initialisé');
