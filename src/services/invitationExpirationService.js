// Service de gestion automatique de l'expiration des invitations
// Phase 3 - Timer expiration automatique + notifications
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { EVENT_CONSTANTS } from '../types/eventTypes';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline } from './firebaseUtils';
import { NotificationService } from './notificationService';

export class InvitationExpirationService {
  static intervalId = null;
  static isRunning = false;
  static listeners = new Map(); // Pour les listeners temps réel

  /**
   * Démarre le service d'expiration automatique
   * @param {number} intervalMinutes - Intervalle de vérification en minutes
   */
  static startExpirationTimer(
    intervalMinutes = EVENT_CONSTANTS.EXPIRATION_CHECK_INTERVAL_MINUTES
  ) {
    if (this.isRunning) {
      console.log("⏰ [EXPIRATION] Timer d'expiration déjà en cours");
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000; // Convertir en millisecondes

    console.log(
      `🚀 [EXPIRATION] Démarrage timer expiration (${intervalMinutes}min) - Intervalle: ${intervalMs}ms`
    );

    this.isRunning = true;

    // Première vérification immédiate
    console.log('🔍 [EXPIRATION] Première vérification immédiate...');
    this.checkAndExpireInvitations();

    // Puis vérifications périodiques
    this.intervalId = setInterval(() => {
      console.log('🔄 [EXPIRATION] Vérification périodique...');
      this.checkAndExpireInvitations();
    }, intervalMs);
  }

  /**
   * Arrête le service d'expiration automatique
   */
  static stopExpirationTimer() {
    if (!this.isRunning) {
      debugLog("⏰ [PHASE 3] Timer d'expiration déjà arrêté");
      return;
    }

    debugLog('🛑 [PHASE 3] Arrêt timer expiration');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    // Nettoyer tous les listeners
    this.cleanupListeners();
  }

  /**
   * Vérifie et expire les invitations obsolètes
   */
  static async checkAndExpireInvitations() {
    if (!isOnline()) {
      console.log('⚠️ [EXPIRATION] Mode offline, skip vérification expiration');
      return 0;
    }

    try {
      console.log('🔍 [EXPIRATION] Vérification invitations expirées...');

      const now = new Date();
      console.log('🕐 [EXPIRATION] Date actuelle:', now.toISOString());

      // Rechercher toutes les invitations pending qui ont expiré
      const expiredQuery = query(
        collection(db, 'invitations'),
        where('status', '==', 'pending'),
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(expiredQuery);
      console.log(
        `📊 [EXPIRATION] Trouvé ${snapshot.size} invitations expirées à traiter`
      );

      let expiredCount = 0;
      const notificationPromises = [];

      for (const docSnapshot of snapshot.docs) {
        const invitationData = docSnapshot.data();
        const invitationId = docSnapshot.id;

        try {
          // Marquer comme expirée
          await updateDoc(docSnapshot.ref, {
            status: 'expired',
            autoExpired: true,
            expiredAt: serverTimestamp(),
            expiredReason: 'Expiration automatique par timer',
            updatedAt: serverTimestamp(),
          });

          // Programmer les notifications
          if (!invitationData.expirationNotificationSent) {
            notificationPromises.push(
              this._notifyExpirationToSender(invitationId, invitationData)
            );
            notificationPromises.push(
              this._notifyExpirationToRecipients(invitationId, invitationData)
            );
          }

          expiredCount++;
          debugLog(
            `⏰ [PHASE 3] Invitation ${invitationId} expirée automatiquement`
          );
        } catch (error) {
          prodError(
            `❌ [PHASE 3] Erreur expiration invitation ${invitationId}:`,
            error
          );
        }
      }

      // Envoyer toutes les notifications en parallèle
      if (notificationPromises.length > 0) {
        await Promise.allSettled(notificationPromises);
      }

      if (expiredCount > 0) {
        debugLog(
          `✅ [PHASE 3] ${expiredCount} invitations expirées automatiquement`
        );
      }

      return expiredCount;
    } catch (error) {
      prodError('❌ [PHASE 3] Erreur vérification expiration:', error);
      return 0;
    }
  }

  /**
   * Configure un listener temps réel pour une invitation spécifique
   * @param {string} invitationId - ID de l'invitation à surveiller
   * @param {Function} callback - Fonction appelée lors de l'expiration
   */
  static watchInvitationExpiration(invitationId, callback) {
    if (!isOnline()) {
      debugLog(
        '⚠️ [PHASE 3] Mode offline, impossible de surveiller expiration'
      );
      return null;
    }

    try {
      const invitationRef = doc(db, 'invitations', invitationId);

      const unsubscribe = onSnapshot(
        invitationRef,
        docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            // Vérifier si l'invitation vient d'expirer
            if (data.status === 'expired' && data.autoExpired) {
              debugLog(
                `⏰ [PHASE 3] Invitation ${invitationId} expirée (listener temps réel)`
              );

              if (callback && typeof callback === 'function') {
                callback({
                  invitationId,
                  expiredAt: data.expiredAt,
                  reason: data.expiredReason,
                });
              }

              // Nettoyer le listener après expiration
              this.stopWatchingInvitation(invitationId);
            }
          }
        },
        error => {
          prodError(
            `❌ [PHASE 3] Erreur listener invitation ${invitationId}:`,
            error
          );
        }
      );

      // Stocker le listener pour nettoyage ultérieur
      this.listeners.set(invitationId, unsubscribe);

      debugLog(
        `👀 [PHASE 3] Surveillance expiration activée pour invitation ${invitationId}`
      );

      return unsubscribe;
    } catch (error) {
      prodError(
        `❌ [PHASE 3] Erreur création listener invitation ${invitationId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Arrête la surveillance d'une invitation spécifique
   * @param {string} invitationId - ID de l'invitation
   */
  static stopWatchingInvitation(invitationId) {
    const unsubscribe = this.listeners.get(invitationId);

    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(invitationId);
      debugLog(
        `🛑 [PHASE 3] Surveillance expiration arrêtée pour invitation ${invitationId}`
      );
    }
  }

  /**
   * Nettoie tous les listeners actifs
   */
  static cleanupListeners() {
    debugLog(
      `🧹 [PHASE 3] Nettoyage ${this.listeners.size} listeners expiration`
    );

    this.listeners.forEach((unsubscribe, invitationId) => {
      try {
        unsubscribe();
        debugLog(`🧹 [PHASE 3] Listener ${invitationId} nettoyé`);
      } catch (error) {
        prodError(
          `❌ [PHASE 3] Erreur nettoyage listener ${invitationId}:`,
          error
        );
      }
    });

    this.listeners.clear();
  }

  /**
   * Expire manuellement une invitation spécifique
   * @param {string} invitationId - ID de l'invitation
   * @param {string} reason - Raison de l'expiration
   */
  static async expireInvitationManually(
    invitationId,
    reason = 'Expiration manuelle'
  ) {
    if (!isOnline()) {
      throw new Error("Mode offline, impossible d'expirer l'invitation");
    }

    try {
      debugLog(
        `⏰ [PHASE 3] Expiration manuelle invitation ${invitationId}: ${reason}`
      );

      const invitationRef = doc(db, 'invitations', invitationId);

      await updateDoc(invitationRef, {
        status: 'expired',
        autoExpired: false,
        expiredAt: serverTimestamp(),
        expiredReason: reason,
        updatedAt: serverTimestamp(),
      });

      // Arrêter la surveillance si active
      this.stopWatchingInvitation(invitationId);

      debugLog(`✅ [PHASE 3] Invitation ${invitationId} expirée manuellement`);
    } catch (error) {
      prodError(
        `❌ [PHASE 3] Erreur expiration manuelle invitation ${invitationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtient le statut du service d'expiration
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      activeListeners: this.listeners.size,
      intervalMinutes: EVENT_CONSTANTS.EXPIRATION_CHECK_INTERVAL_MINUTES,
    };
  }

  /**
   * Obtient les statistiques d'expiration
   */
  static async getExpirationStats() {
    if (!isOnline()) {
      return {
        totalExpired: 0,
        autoExpired: 0,
        manualExpired: 0,
        recentExpired: 0,
      };
    }

    try {
      // Récupérer toutes les invitations expirées
      const expiredQuery = query(
        collection(db, 'invitations'),
        where('status', '==', 'expired')
      );

      const snapshot = await getDocs(expiredQuery);

      let autoExpired = 0;
      let manualExpired = 0;
      let recentExpired = 0;

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      snapshot.forEach(doc => {
        const data = doc.data();

        if (data.autoExpired) {
          autoExpired++;
        } else {
          manualExpired++;
        }

        // Vérifier si expiré dans les dernières 24h
        if (data.expiredAt) {
          const expiredAt = data.expiredAt.toDate
            ? data.expiredAt.toDate()
            : new Date(data.expiredAt);

          if (expiredAt > last24Hours) {
            recentExpired++;
          }
        }
      });

      return {
        totalExpired: snapshot.size,
        autoExpired,
        manualExpired,
        recentExpired,
      };
    } catch (error) {
      prodError('❌ [PHASE 3] Erreur récupération stats expiration:', error);
      return {
        totalExpired: 0,
        autoExpired: 0,
        manualExpired: 0,
        recentExpired: 0,
      };
    }
  }

  // ===========================
  // MÉTHODES PRIVÉES
  // ===========================

  /**
   * Notifie l'expéditeur de l'expiration
   * @private
   */
  static async _notifyExpirationToSender(invitationId, invitationData) {
    try {
      console.log(
        `📧 [EXPIRATION] Notification expéditeur pour ${invitationId}`,
        {
          fromUserId: invitationData.fromUserId,
          activity: invitationData.activity,
        }
      );

      const activities = {
        coffee: 'Coffee',
        lunch: 'Lunch',
        drinks: 'Drinks',
        chill: 'Chill',
        clubbing: 'Clubbing',
        cinema: 'Cinema',
      };

      const activityLabel =
        activities[invitationData.activity] || invitationData.activity;
      const acceptedCount = invitationData.acceptedByUserIds?.length || 0;
      const totalRecipients = invitationData.totalRecipients || 1;

      // Récupérer les noms des destinataires qui n'ont pas répondu
      const pendingRecipients = (invitationData.toUserIds || []).filter(
        userId =>
          !(invitationData.acceptedByUserIds || []).includes(userId) &&
          !(invitationData.declinedByUserIds || []).includes(userId)
      );

      // Utiliser les noms stockés dans l'invitation si disponibles
      const recipientNames = invitationData.toUserNames || [];
      const pendingNames = pendingRecipients.map(
        (id, idx) => recipientNames[idx] || 'Un ami'
      );

      let message;
      if (invitationData.isMultipleInvitation) {
        if (acceptedCount > 0) {
          message = `Votre invitation ${activityLabel} a expiré (${acceptedCount}/${totalRecipients} avaient accepté)`;
        } else if (pendingNames.length === 1) {
          message = `${pendingNames[0]} n'a pas répondu à votre invitation ${activityLabel}`;
        } else {
          message = `${pendingNames.length} ami(s) n'ont pas répondu à votre invitation ${activityLabel}`;
        }
      } else {
        const recipientName = pendingNames[0] || 'Votre ami';
        message = `${recipientName} n'a pas répondu à votre invitation ${activityLabel}`;
      }

      await NotificationService.createNotification(
        invitationData.fromUserId,
        'system',
        'invitation_expired',
        message,
        {
          invitationId,
          activity: invitationData.activity,
          activityLabel,
          totalRecipients,
          acceptedCount,
          expiredAt: new Date().toISOString(),
        }
      );

      // Marquer la notification comme envoyée
      await updateDoc(doc(db, 'invitations', invitationId), {
        expirationNotificationSent: true,
      });

      debugLog(
        `📧 [PHASE 3] Notification expiration envoyée à l'expéditeur pour ${invitationId}`
      );
    } catch (error) {
      prodError(
        `❌ [PHASE 3] Erreur notification expéditeur ${invitationId}:`,
        error
      );
    }
  }

  /**
   * Notifie les destinataires de l'expiration
   * @private
   */
  static async _notifyExpirationToRecipients(invitationId, invitationData) {
    try {
      console.log(
        `📧 [EXPIRATION] Notification destinataires pour ${invitationId}`,
        {
          toUserIds: invitationData.toUserIds,
          acceptedByUserIds: invitationData.acceptedByUserIds,
          declinedByUserIds: invitationData.declinedByUserIds,
        }
      );

      // Notifier seulement les destinataires qui n'ont pas encore répondu
      const pendingRecipients = (invitationData.toUserIds || []).filter(
        userId =>
          !(invitationData.acceptedByUserIds || []).includes(userId) &&
          !(invitationData.declinedByUserIds || []).includes(userId)
      );

      console.log(
        `📧 [EXPIRATION] ${pendingRecipients.length} destinataires en attente:`,
        pendingRecipients
      );

      if (pendingRecipients.length === 0) {
        console.log(
          `📧 [EXPIRATION] Aucun destinataire à notifier, tous ont déjà répondu`
        );
        return; // Tous ont déjà répondu
      }

      const activities = {
        coffee: 'Coffee',
        lunch: 'Lunch',
        drinks: 'Drinks',
        chill: 'Chill',
        clubbing: 'Clubbing',
        cinema: 'Cinema',
      };

      const activityLabel =
        activities[invitationData.activity] || invitationData.activity;

      // Utiliser le nom de l'expéditeur stocké dans l'invitation
      const senderName = invitationData.fromUserName || 'Un ami';
      const message = `Vous n'avez pas donné suite à ${senderName} pour ${activityLabel}`;

      // 🎯 NOUVEAU: Marquer les anciennes notifications d'invitation comme lues pour les destinataires
      const markAsReadPromises = pendingRecipients.map(async recipientId => {
        try {
          // Chercher les notifications d'invitation non lues pour ce destinataire et cette invitation
          const notifQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', recipientId),
            where('type', '==', 'invitation'),
            where('read', '==', false)
          );

          const notifSnapshot = await getDocs(notifQuery);
          const updatePromises = [];

          notifSnapshot.forEach(notifDoc => {
            const notifData = notifDoc.data();
            // Vérifier si c'est bien la notification de cette invitation
            if (notifData.data?.invitationId === invitationId) {
              updatePromises.push(
                updateDoc(notifDoc.ref, {
                  read: true,
                  expiredAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              );
            }
          });

          await Promise.all(updatePromises);
        } catch (err) {
          debugLog(
            `⚠️ Erreur marquage notification lue pour ${recipientId}:`,
            err
          );
        }
      });

      await Promise.all(markAsReadPromises);

      // Créer des notifications pour les destinataires en attente
      const notificationPromises = pendingRecipients.map(recipientId =>
        NotificationService.createNotification(
          recipientId,
          'system',
          'invitation_expired',
          message,
          {
            invitationId,
            activity: invitationData.activity,
            activityLabel,
            fromUserId: invitationData.fromUserId,
            expiredAt: new Date().toISOString(),
          }
        )
      );

      await Promise.all(notificationPromises);

      debugLog(
        `📧 [PHASE 3] Notifications expiration envoyées à ${pendingRecipients.length} destinataires pour ${invitationId}`
      );
    } catch (error) {
      prodError(
        `❌ [PHASE 3] Erreur notifications destinataires ${invitationId}:`,
        error
      );
    }
  }
}

// Démarrage automatique du service (production ET développement)
if (typeof window !== 'undefined') {
  // Démarrer le timer après un délai pour laisser l'app s'initialiser
  setTimeout(() => {
    console.log(
      "🚀 [EXPIRATION] Démarrage automatique du service d'expiration"
    );
    InvitationExpirationService.startExpirationTimer();
  }, 5000); // 5 secondes de délai
}

export default InvitationExpirationService;
