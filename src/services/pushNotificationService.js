// Service de notifications push avec Firebase Messaging
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';

export class PushNotificationService {
  static isSupported =
    'serviceWorker' in navigator && 'PushManager' in window && !!messaging;

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
    if (!this.isSupported) {
      return {
        supported: false,
        permission: 'not-supported',
        subscribed: false,
      };
    }

    const permission = Notification.permission;
    let subscribed = false;

    if (permission === 'granted') {
      try {
        // Vérifier si on a un token Firebase ou des notifications locales activées
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

        if (vapidKey && vapidKey !== 'your_vapid_key_here' && messaging) {
          // Essayer d'obtenir un token Firebase
          const token = await getToken(messaging, { vapidKey });
          subscribed = !!token;
        } else {
          // Mode notifications locales
          subscribed = true; // Si permission accordée, on peut faire des notifications locales
        }
      } catch (error) {
        console.warn('Erreur vérification abonnement:', error);
        subscribed = true; // Mode dégradé avec notifications locales
      }
    }

    return {
      supported: true,
      permission,
      subscribed,
    };
  }

  // Envoyer une notification test locale
  static showTestNotification(title, body, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('Notifications non autorisées');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  // Simuler l'envoi d'une notification (pour test)
  static async sendTestPushNotification() {
    try {
      const status = await this.checkStatus();

      if (!status.subscribed) {
        await this.requestPermission();
      }

      // Envoyer une notification de test locale
      this.showTestNotification(
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
}

export default PushNotificationService;
