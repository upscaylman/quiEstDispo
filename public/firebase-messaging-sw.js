// Import Firebase scripts for service worker
importScripts(
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js'
);

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: 'AIzaSyDiJPl1w8HOXCXHaLxP4uJ_rWDBMmDfWt8',
  authDomain: 'qui-est-dispo.firebaseapp.com',
  projectId: 'qui-est-dispo',
  storageBucket: 'qui-est-dispo.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
};

firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log('📱 Message reçu en arrière-plan:', payload);

  const notificationTitle =
    payload.notification?.title || payload.data?.title || 'Qui est dispo';
  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      'Nouvelle notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.tag || 'app-notification',
    data: payload.data || {},
    requireInteraction: payload.data?.requireInteraction === 'true',
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  console.log('🔔 Clic sur notification:', event);

  event.notification.close();

  // Open/focus the app window
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('qui-est-dispo') && 'focus' in client) {
            return client.focus();
          }
        }

        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
