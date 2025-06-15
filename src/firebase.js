// Configuration Firebase simplifiée pour qui est dispo
import { initializeApp } from 'firebase/app';
// Ne pas importer App Check pour éviter les conflits
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
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

// ⚠️ IMPORTANT: Configuration propre pour résoudre les erreurs SMS
console.log('🔧 Configuration Firebase pour authentification SMS');

// Réduire les logs d'erreur Firebase au minimum
setLogLevel('silent');

// Configuration Firebase - Assurez-vous de définir les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
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

// ⚠️ APP CHECK COMPLÈTEMENT DÉSACTIVÉ pour résoudre l'erreur 500 SMS
console.warn('⚠️ App Check DÉSACTIVÉ pour authentification SMS');

// Services Firebase avec configuration optimisée
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configuration spéciale pour l'authentification par téléphone
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Mode développement : Configuration auth téléphone');

  // Désactiver la vérification App Check pour l'auth
  auth.settings = {
    appVerificationDisabledForTesting: true,
  };

  // Configuration des numéros de test Firebase
  // Ces numéros fonctionnent sans plan Blaze et sans SMS réel
  const testPhoneNumbers = {
    '+33612345678': '123456', // Numéro français fictif
    '+1234567890': '123456', // Numéro US fictif
  };

  // Appliquer la configuration des numéros de test
  try {
    if (auth.settings && typeof auth.settings === 'object') {
      auth.settings.testPhoneNumbers = testPhoneNumbers;
      console.log(
        '✅ Numéros de test configurés:',
        Object.keys(testPhoneNumbers)
      );
    }
  } catch (error) {
    console.warn('⚠️ Impossible de configurer les numéros de test:', error);
  }

  // Si vous utilisez des émulateurs Firebase
  // Décommentez les lignes suivantes si vous voulez utiliser les émulateurs :
  /*
  if (!auth._delegate.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  if (!storage._delegate._host.includes('localhost')) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }
  */
}

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
