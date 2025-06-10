// Service de notifications push avec Firebase Messaging
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';

export class PushNotificationService {
  static isSupported =
    'serviceWorker' in navigator && 'PushManager' in window && !!messaging;

  // Détecter si on est sur mobile
  static isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Vérifier le support complet des notifications
  static checkNotificationSupport() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasNotification = 'Notification' in window;
    const hasPushManager = 'PushManager' in window;
    const hasMessaging = !!messaging;
    const isMobile = this.isMobile();

    console.log('🔍 Support notifications:', {
      hasServiceWorker,
      hasNotification,
      hasPushManager,
      hasMessaging,
      isMobile,
      userAgent: navigator.userAgent,
    });

    return {
      hasServiceWorker,
      hasNotification,
      hasPushManager,
      hasMessaging,
      isMobile,
      supported: hasServiceWorker && hasNotification && hasPushManager,
    };
  }

  // Demander la permission pour les notifications
  static async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Les notifications push ne sont pas supportées');
    }

    const permission = await Notification.requestPermission();
    console.log('📱 Permission notifications:', permission);

    if (permission === 'granted') {
      return this.getFirebaseToken();
    } else if (permission === 'denied') {
      throw new Error('Permission refusée pour les notifications');
    } else {
      throw new Error("Permission par défaut - utilisateur n'a pas répondu");
    }
  }

  // Obtenir le token Firebase pour les notifications
  static async getFirebaseToken() {
    if (!messaging) {
      throw new Error('Firebase Messaging non initialisé');
    }

    try {
      // Vérifier si on a une clé VAPID configurée
      const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

      if (!vapidKey || vapidKey === 'your_vapid_key_here') {
        console.warn(
          '⚠️ Clé VAPID non configurée, utilisation de notifications locales uniquement'
        );
        return this.enableLocalNotifications();
      }

      console.log('🔔 Récupération token Firebase...');
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
      });

      if (token) {
        console.log(
          '✅ Token Firebase obtenu:',
          token.substring(0, 20) + '...'
        );
        return { type: 'firebase', token };
      } else {
        console.warn(
          '⚠️ Pas de token Firebase, fallback vers notifications locales'
        );
        return this.enableLocalNotifications();
      }
    } catch (error) {
      console.error('❌ Erreur token Firebase:', error);
      console.warn('⚠️ Fallback vers notifications locales');
      return this.enableLocalNotifications();
    }
  }

  // Activer les notifications locales comme fallback
  static async enableLocalNotifications() {
    if (Notification.permission !== 'granted') {
      throw new Error('Permission requise pour les notifications');
    }

    console.log('📱 Notifications locales activées');
    return { type: 'local', enabled: true };
  }

  // Vérifier le statut des notifications
  static async checkStatus() {
    const support = this.checkNotificationSupport();

    if (!support.supported) {
      return {
        supported: false,
        permission: 'not-supported',
        subscribed: false,
        isMobile: support.isMobile,
        debug: support,
      };
    }

    const permission = Notification.permission;
    let subscribed = false;

    console.log('📱 Permission actuelle:', permission);

    if (permission === 'granted') {
      try {
        // Vérifier si on a un token Firebase ou des notifications locales activées
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

        if (vapidKey && vapidKey !== 'your_vapid_key_here' && messaging) {
          console.log('🔑 Tentative récupération token Firebase...');
          // Essayer d'obtenir un token Firebase
          const token = await getToken(messaging, { vapidKey });
          subscribed = !!token;
          console.log('🔥 Token Firebase:', subscribed ? 'Obtenu' : 'Échec');
        } else {
          console.log('📱 Mode notifications locales (pas de VAPID)');
          // Mode notifications locales
          subscribed = true; // Si permission accordée, on peut faire des notifications locales
        }
      } catch (error) {
        console.warn('⚠️ Erreur vérification abonnement:', error);
        subscribed = true; // Mode dégradé avec notifications locales
      }
    }

    return {
      supported: true,
      permission,
      subscribed,
      isMobile: support.isMobile,
      debug: support,
    };
  }

  // Envoyer une notification test locale
  static async showTestNotification(title, body, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('Notifications non autorisées');
      return;
    }

    const notificationOptions = {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    };

    try {
      // Détecter si on est sur mobile/service worker requis
      const isMobile = this.isMobile();
      const support = this.checkNotificationSupport();

      console.log(
        `📱 Envoi notification - Mobile: ${isMobile}, Support SW: ${support.hasServiceWorker}`
      );

      if (isMobile || !window.Notification || 'serviceWorker' in navigator) {
        // Utiliser le Service Worker (obligatoire sur mobile)
        console.log(
          '📱 Envoi notification via Service Worker (mobile/sécurisé)'
        );

        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);

        console.log('✅ Notification envoyée via Service Worker');
        return;
      } else {
        // Fallback pour desktop (peu probable d'arriver ici maintenant)
        console.log('💻 Envoi notification directe (desktop)');

        const notification = new Notification(title, notificationOptions);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('✅ Notification envoyée directement');
        return notification;
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);

      // Fallback ultime : essayer l'autre méthode
      try {
        if ('serviceWorker' in navigator) {
          console.log('🔄 Tentative fallback via Service Worker...');
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, notificationOptions);
          console.log('✅ Notification fallback réussie');
        }
      } catch (fallbackError) {
        console.error('❌ Échec notification fallback:', fallbackError);
        throw new Error(
          "Impossible d'envoyer la notification sur cet appareil"
        );
      }
    }
  }

  // Simuler l'envoi d'une notification (pour test)
  static async sendTestPushNotification() {
    try {
      const status = await this.checkStatus();

      if (!status.subscribed) {
        await this.requestPermission();
      }

      // Envoyer une notification de test locale
      await this.showTestNotification(
        '🎉 Qui est dispo',
        'Test de notification - tout fonctionne !',
        {
          tag: 'test-notification',
          requireInteraction: true,
          icon: '/logo192.png',
          badge: '/logo192.png',
        }
      );

      console.log('✅ Notification test envoyée');
    } catch (error) {
      console.error('❌ Erreur notification test:', error);
      throw error;
    }
  }

  // Envoyer une notification push à un utilisateur spécifique
  static async sendPushToUser(userId, notificationData) {
    try {
      console.log(
        `📱 Tentative envoi push à l'utilisateur ${userId}:`,
        notificationData
      );

      // Pour l'instant, on ne peut envoyer que des notifications locales
      // car on n'a pas de backend pour gérer les tokens utilisateurs
      // TODO: Implémenter un système de tokens utilisateurs côté serveur

      // Vérifier si c'est l'utilisateur actuel (seul cas qu'on peut gérer)
      const currentUser = this.getCurrentUserId();

      if (currentUser && currentUser === userId) {
        console.log("📱 Envoi notification push à l'utilisateur actuel");

        // Vérifier les permissions
        if (Notification.permission !== 'granted') {
          console.warn('⚠️ Permissions notifications non accordées');
          return { sent: false, reason: 'no_permission' };
        }

        // Envoyer la notification locale
        await this.showTestNotification(
          notificationData.title || 'Qui est dispo',
          notificationData.body ||
            notificationData.message ||
            'Nouvelle notification',
          {
            tag: notificationData.tag || 'app-notification',
            icon: '/logo192.png',
            badge: '/logo192.png',
            data: notificationData.data || {},
            requireInteraction: notificationData.requireInteraction || false,
          }
        );

        console.log("✅ Notification push envoyée à l'utilisateur actuel");
        return { sent: true, method: 'local' };
      } else {
        console.log(
          'ℹ️ Notification pour autre utilisateur - stockage Firestore uniquement'
        );
        // Pour les autres utilisateurs, la notification sera visible quand ils ouvriront l'app
        return { sent: false, reason: 'other_user' };
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification push:', error);
      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Obtenir l'ID de l'utilisateur actuel (helper)
  static getCurrentUserId() {
    try {
      // Essayer de récupérer depuis Firebase Auth
      const { auth } = require('../firebase');
      return auth?.currentUser?.uid || null;
    } catch (error) {
      console.warn("⚠️ Impossible de récupérer l'utilisateur actuel:", error);
      return null;
    }
  }

  // Méthode unifiée pour créer notification Firestore + Push
  static async createNotificationWithPush(notificationData) {
    try {
      console.log(
        '📱 Création notification complète (Firestore + Push):',
        notificationData
      );

      // 1. Créer la notification dans Firestore (via NotificationService)
      const { NotificationService } = await import('./firebaseService');

      await NotificationService.createNotification(
        notificationData.toUserId,
        notificationData.fromUserId,
        notificationData.type,
        notificationData.message,
        notificationData.data || {}
      );

      // 2. Envoyer notification push si possible
      const pushResult = await this.sendPushToUser(notificationData.toUserId, {
        title: notificationData.title,
        body: notificationData.message,
        tag: notificationData.type,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction || false,
      });

      console.log('✅ Notification complète créée:', {
        firestore: true,
        push: pushResult,
      });

      return {
        success: true,
        firestore: true,
        push: pushResult,
      };
    } catch (error) {
      console.error('❌ Erreur création notification complète:', error);
      throw error;
    }
  }
}

export default PushNotificationService;
