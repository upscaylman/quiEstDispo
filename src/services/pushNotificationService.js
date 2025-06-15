// Service de notifications push avec Firebase Messaging
import { getMessaging, getToken } from 'firebase/messaging';
import { app, messaging } from '../firebase';
import {
  debugError,
  debugLog,
  debugWarn,
  prodError,
  prodWarn,
} from '../utils/logger';

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
    const support = {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
    };

    debugLog('🔍 Support notifications:', {
      notifications: support.notifications,
      serviceWorker: support.serviceWorker,
      pushManager: support.pushManager,
      overall:
        support.notifications && support.serviceWorker && support.pushManager,
    });

    return support;
  }

  // Demander la permission pour les notifications
  static async requestPermission() {
    try {
      if (!('Notification' in window)) {
        throw new Error('Ce navigateur ne supporte pas les notifications');
      }

      const permission = await Notification.requestPermission();
      debugLog('📱 Permission notifications:', permission);

      return {
        permission,
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
      };
    } catch (error) {
      prodError('❌ Erreur demande permission notifications:', error);
      return {
        permission: 'denied',
        granted: false,
        denied: true,
        default: false,
        error: error.message,
      };
    }
  }

  // Obtenir le token Firebase pour les notifications
  static async getFirebaseToken() {
    try {
      debugLog('🔔 Récupération token Firebase...');

      const messaging = getMessaging(app);
      const vapidKey = process.env.REACT_APP_VAPID_KEY;

      if (!vapidKey) {
        debugLog('⚠️ VAPID key manquante - notifications locales seulement');
        return { token: null, subscribed: false, localOnly: true };
      }

      const token = await getToken(messaging, { vapidKey });

      if (token) {
        debugLog('🔥 Token Firebase obtenu avec succès');
        return { token, subscribed: true, localOnly: false };
      } else {
        debugLog('⚠️ Aucun token Firebase - notifications locales');
        return { token: null, subscribed: false, localOnly: true };
      }
    } catch (error) {
      prodWarn('⚠️ Erreur récupération token Firebase:', error);
      return {
        token: null,
        subscribed: false,
        localOnly: true,
        error: error.message,
      };
    }
  }

  // Activer les notifications locales comme fallback
  static async enableLocalNotifications() {
    try {
      const permission = await this.requestPermission();
      if (permission.granted) {
        debugLog('📱 Notifications locales activées');
        return { success: true, permission: permission.permission };
      } else {
        return { success: false, permission: permission.permission };
      }
    } catch (error) {
      prodError('❌ Erreur activation notifications locales:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier le statut des notifications
  static async checkStatus() {
    try {
      const support = this.checkNotificationSupport();
      const permission = Notification.permission;

      debugLog('📱 Permission actuelle:', permission);

      if (permission === 'granted') {
        const tokenResult = await this.getFirebaseToken();
        debugLog('🔑 Tentative récupération token Firebase...');

        const subscribed = tokenResult.subscribed;
        debugLog('🔥 Token Firebase:', subscribed ? 'Obtenu' : 'Échec');
      } else {
        debugLog('📱 Mode notifications locales (pas de VAPID)');
      }

      return {
        supported: support.notifications && support.serviceWorker,
        permission,
        subscribed: permission === 'granted',
        support,
      };
    } catch (error) {
      prodError('❌ Erreur vérification statut notifications:', error);
      return {
        supported: false,
        permission: 'denied',
        subscribed: false,
        error: error.message,
      };
    }
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

      debugLog(
        `📱 Envoi notification - Mobile: ${isMobile}, Support SW: ${support.serviceWorker}`
      );

      if (isMobile || !window.Notification || 'serviceWorker' in navigator) {
        // Utiliser le Service Worker (obligatoire sur mobile)
        debugLog('📱 Envoi notification via Service Worker (mobile/sécurisé)');

        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);

        debugLog('✅ Notification envoyée via Service Worker');
        return;
      } else {
        // Fallback pour desktop (peu probable d'arriver ici maintenant)
        debugLog('💻 Envoi notification directe (desktop)');

        const notification = new Notification(title, notificationOptions);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        debugLog('✅ Notification envoyée directement');
        return notification;
      }
    } catch (error) {
      debugError('❌ Erreur envoi notification:', error);

      // Fallback ultime : essayer l'autre méthode
      try {
        if ('serviceWorker' in navigator) {
          debugLog('🔄 Tentative fallback via Service Worker...');
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, notificationOptions);
          debugLog('✅ Notification fallback réussie');
        }
      } catch (fallbackError) {
        debugError('❌ Échec notification fallback:', fallbackError);
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

      debugLog('✅ Notification test envoyée');
    } catch (error) {
      debugError('❌ Erreur notification test:', error);
      throw error;
    }
  }

  // Envoyer une notification push à un utilisateur spécifique
  static async sendPushToUser(userId, notificationData) {
    try {
      debugLog(
        `📱 Tentative envoi push à l'utilisateur ${userId}:`,
        notificationData
      );

      // Pour l'instant, on ne peut envoyer que des notifications locales
      // car on n'a pas de backend pour gérer les tokens utilisateurs
      // TODO: Implémenter un système de tokens utilisateurs côté serveur

      // Vérifier si c'est l'utilisateur actuel (seul cas qu'on peut gérer)
      const currentUser = this.getCurrentUserId();

      debugLog(`🔍 Utilisateur actuel: ${currentUser}, Cible: ${userId}`);

      if (currentUser && currentUser === userId) {
        debugLog("📱 Envoi notification push à l'utilisateur actuel");

        // Vérifier les permissions
        const permission = Notification.permission;
        debugLog(`🔍 Permission notifications: ${permission}`);

        if (permission !== 'granted') {
          debugWarn('⚠️ Permissions notifications non accordées');
          return { sent: false, reason: 'no_permission' };
        }

        // Vérifier si les notifications sont supportées
        const support = this.checkNotificationSupport();
        debugLog('🔍 Support notifications:', support);

        // Envoyer la notification locale
        debugLog('📤 Envoi de la notification...');
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

        debugLog("✅ Notification push envoyée à l'utilisateur actuel");
        return { sent: true, method: 'local' };
      } else {
        debugLog(
          `ℹ️ Notification pour autre utilisateur (${userId} ≠ ${currentUser}) - stockage Firestore uniquement`
        );
        // Pour les autres utilisateurs, la notification sera visible quand ils ouvriront l'app
        return { sent: false, reason: 'other_user' };
      }
    } catch (error) {
      debugError('❌ Erreur envoi notification push:', error);
      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Obtenir l'ID de l'utilisateur actuel (helper)
  static getCurrentUserId() {
    try {
      // Essayer plusieurs méthodes pour récupérer l'utilisateur actuel

      // Méthode 1: Via Firebase Auth direct
      if (
        window.firebase &&
        window.firebase.auth &&
        window.firebase.auth().currentUser
      ) {
        debugLog('🔍 Utilisateur trouvé via window.firebase');
        return window.firebase.auth().currentUser.uid;
      }

      // Méthode 2: Via import dynamique
      try {
        const { auth } = require('../firebase');
        if (auth?.currentUser?.uid) {
          debugLog('🔍 Utilisateur trouvé via require');
          return auth.currentUser.uid;
        }
      } catch (requireError) {
        debugWarn('⚠️ Erreur require firebase:', requireError);
      }

      // Méthode 3: Via localStorage/sessionStorage (si disponible)
      const storageUserId =
        localStorage.getItem('currentUserId') ||
        sessionStorage.getItem('currentUserId');
      if (storageUserId) {
        debugLog('🔍 Utilisateur trouvé via storage');
        return storageUserId;
      }

      debugWarn('⚠️ Aucun utilisateur actuel trouvé');
      return null;
    } catch (error) {
      debugWarn("⚠️ Impossible de récupérer l'utilisateur actuel:", error);
      return null;
    }
  }

  // Méthode unifiée pour créer notification Firestore + Push
  static async createNotificationWithPush(notificationData) {
    try {
      debugLog(
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

      debugLog('✅ Notification complète créée:', {
        firestore: true,
        push: pushResult,
      });

      return {
        success: true,
        firestore: true,
        push: pushResult,
      };
    } catch (error) {
      debugError('❌ Erreur création notification complète:', error);
      throw error;
    }
  }
}

export default PushNotificationService;
