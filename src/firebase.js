// Configuration Firebase simplifiée pour qui est dispo
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import {
  disableNetwork,
  enableNetwork,
  enablePersistentCacheIndexAutoCreation,
  getFirestore,
  setLogLevel,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Réduire les logs d'erreur Firebase au minimum
setLogLevel('silent');

// Configuration Firebase - TEMPORAIREMENT HARDCODÉE pour contourner bug Vercel
const firebaseConfig = {
  apiKey: 'AIzaSyD6Hv0ruhvmWJoxaAtsqEM5nSWwU63c7dg',
  authDomain: 'qui-est-dispo.firebaseapp.com',
  projectId: 'qui-est-dispo',
  storageBucket: 'qui-est-dispo.firebasestorage.app',
  messagingSenderId: '640967592489',
  appId: '1:640967592489:web:0fce0b73d1a1cab0aeea38',
  measurementId: 'G-QPMNFQBJT7',
};

// Vérifier que les variables d'environnement sont définies
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
  console.error(
    '⚠️ Firebase configuration manquante ! Créez un fichier .env.local avec vos clés Firebase.'
  );
  console.error(
    'Consultez le fichier .env.example pour voir le format requis.'
  );
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser App Check pour protéger contre les abus
let appCheck = null;
try {
  // Vérifier si la clé reCAPTCHA est disponible
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY;

  if (recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_site_key_here') {
    // Configuration App Check avec reCAPTCHA v3
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      // Debug en développement
      isTokenAutoRefreshEnabled: true,
    });
    console.log('✅ Firebase App Check initialized with reCAPTCHA');
  } else {
    console.warn('⚠️ reCAPTCHA site key not configured, App Check disabled');
    console.warn(
      '📝 Pour activer App Check, ajoutez REACT_APP_RECAPTCHA_V3_SITE_KEY dans .env.local'
    );
  }
} catch (error) {
  console.warn(
    '⚠️ App Check initialization failed (normal en développement):',
    error
  );
}

// Services Firebase avec configuration optimisée
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { appCheck };

// Activer la persistance du cache et l'indexation automatique
try {
  enablePersistentCacheIndexAutoCreation(db);
  console.log('✅ Cache persistant Firebase activé');
} catch (error) {
  console.warn('⚠️ Cache persistant Firebase non supporté:', error);
}

// Configuration de la persistance d'authentification
// Par défaut, Firebase maintient l'état d'authentification dans le stockage local
// Cela permet à l'utilisateur de rester connecté après rechargement de page

// Initialiser messaging seulement si supporté
let messaging = null;
try {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Messaging not supported:', error);
}

export { messaging };

// Gérer la connectivité réseau avec retry limité
let networkRetryCount = 0;
const MAX_NETWORK_RETRIES = 3;

export const handleNetworkChange = async () => {
  try {
    if (navigator.onLine) {
      if (networkRetryCount < MAX_NETWORK_RETRIES) {
        await enableNetwork(db);
        console.log('🌐 Firebase reconnected');
        networkRetryCount = 0; // Reset counter on success
      }
    } else {
      await disableNetwork(db);
      console.log('📴 Firebase disconnected');
      networkRetryCount++;
    }
  } catch (error) {
    networkRetryCount++;
    if (networkRetryCount <= MAX_NETWORK_RETRIES) {
      console.warn(
        `Network change handling failed (attempt ${networkRetryCount}/${MAX_NETWORK_RETRIES}):`,
        error
      );
    }
  }
};

// Écouter les changements de connectivité
window.addEventListener('online', handleNetworkChange);
window.addEventListener('offline', handleNetworkChange);

// Configuration des notifications push
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (error) {
    console.warn('Notification permission failed:', error);
    return null;
  }
};

// Écouter les messages en premier plan
if (messaging) {
  onMessage(messaging, payload => {
    // Afficher la notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: payload.data?.type || 'default',
        });
      });
    }
  });
}

// Fonctions utilitaires pour Firestore
export const collections = {
  users: 'users',
  availabilities: 'availabilities',
  friendships: 'friendships',
  notifications: 'notifications',
};

export default app;
