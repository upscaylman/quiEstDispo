// Service de notifications push
export class PushNotificationService {
  static vapidKey = 'YOUR_VAPID_KEY'; // À remplacer par votre clé VAPID
  static isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Demander la permission pour les notifications
  static async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Les notifications push ne sont pas supportées');
    }

    const permission = await Notification.requestPermission();
    console.log('📱 Permission notifications:', permission);

    if (permission === 'granted') {
      return this.getSubscription();
    } else if (permission === 'denied') {
      throw new Error('Permission refusée pour les notifications');
    } else {
      throw new Error("Permission par défaut - utilisateur n'a pas répondu");
    }
  }

  // Obtenir ou créer un abonnement push
  static async getSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('🔔 Création nouvel abonnement push...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
        });
      }

      console.log('✅ Abonnement push obtenu:', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Erreur abonnement push:', error);
      throw error;
    }
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
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.warn('Erreur vérification abonnement:', error);
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

  // Convertir clé VAPID en format utilisable
  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Simuler l'envoi d'une notification (pour test)
  static async sendTestPushNotification() {
    try {
      const status = await this.checkStatus();

      if (!status.subscribed) {
        await this.requestPermission();
      }

      // Pour un vrai serveur, vous enverriez les données d'abonnement à votre backend
      // Ici on simule avec une notification locale
      this.showTestNotification(
        '🎉 Qui est dispo',
        "Nouvelle invitation d'ami reçue !",
        {
          tag: 'friend-invitation',
          requireInteraction: true,
          actions: [
            { action: 'accept', title: 'Accepter' },
            { action: 'decline', title: 'Refuser' },
          ],
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
