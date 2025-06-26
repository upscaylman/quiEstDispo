/**
 * Service de gestion centralisée des états utilisateur dans le système d'événements
 * Phase 1 - Task 1.2: EventStatusService
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  EVENT_CONSTANTS,
  InvitationStatus,
  UserEventStatus,
  canReceiveInvitations,
  canSendInvitations,
  getStatusColor,
  getStatusMessage,
  isValidStatusTransition,
} from '../types/eventTypes';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline, retryWithBackoff } from './firebaseUtils';

export class EventStatusService {
  // ===========================
  // GESTION DES ÉTATS UTILISATEUR
  // ===========================

  /**
   * Obtient l'état actuel d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} - État actuel de l'utilisateur
   */
  static async getUserEventStatus(userId) {
    if (!isOnline()) {
      debugLog('⚠️ Mode offline, retour état par défaut LIBRE');
      return UserEventStatus.LIBRE;
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, EVENT_CONSTANTS.COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          return userData.eventStatus || UserEventStatus.LIBRE;
        }

        debugLog(`⚠️ Utilisateur ${userId} non trouvé, état par défaut LIBRE`);
        return UserEventStatus.LIBRE;
      });
    } catch (error) {
      prodError('❌ Erreur récupération état utilisateur:', error);
      return UserEventStatus.LIBRE; // Fallback safe
    }
  }

  /**
   * Change l'état d'un utilisateur avec validation
   * @param {string} userId - ID de l'utilisateur
   * @param {string} newStatus - Nouvel état souhaité
   * @param {Object} metadata - Métadonnées additionnelles
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async setUserEventStatus(userId, newStatus, metadata = {}) {
    if (!isOnline()) {
      debugLog("⚠️ Mode offline, impossible de changer l'état");
      return false;
    }

    try {
      return await retryWithBackoff(async () => {
        // Récupérer l'état actuel
        const currentStatus = await this.getUserEventStatus(userId);

        // Valider la transition
        if (!isValidStatusTransition(currentStatus, newStatus)) {
          throw new Error(
            `Transition d'état invalide: ${currentStatus} → ${newStatus}`
          );
        }

        // Préparer les données de mise à jour
        const updateData = {
          eventStatus: newStatus,
          lastEventStatusChange: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...metadata,
        };

        // Nettoyer les propriétés selon le nouvel état
        await this._cleanupStateProperties(userId, newStatus, updateData);

        // Mettre à jour l'utilisateur
        const userRef = doc(db, EVENT_CONSTANTS.COLLECTIONS.USERS, userId);
        await updateDoc(userRef, updateData);

        debugLog(
          `✅ État utilisateur ${userId}: ${currentStatus} → ${newStatus}`
        );
        return true;
      });
    } catch (error) {
      prodError('❌ Erreur changement état utilisateur:', error);
      throw new Error(`Impossible de changer l'état: ${error.message}`);
    }
  }

  /**
   * Nettoie les propriétés selon le nouvel état
   * @private
   */
  static async _cleanupStateProperties(userId, newStatus, updateData) {
    switch (newStatus) {
      case UserEventStatus.LIBRE:
        // Retour à l'état libre = nettoyage complet
        updateData.currentEventId = null;
        updateData.currentGroupId = null;
        updateData.pendingInvitations = [];
        updateData.isAvailable = false;
        updateData.currentActivity = null;
        updateData.availabilityId = null;
        updateData.location = null;
        updateData.locationShared = false;
        break;

      case UserEventStatus.INVITATION_ENVOYEE:
        // Garde currentEventId, nettoie le reste
        updateData.currentGroupId = null;
        break;

      case UserEventStatus.INVITATION_RECUE:
        // État minimal, garde les invitations en attente
        break;

      case UserEventStatus.EN_PARTAGE:
        // État de partage actif
        updateData.locationShared = true;
        updateData.lastLocationUpdate = serverTimestamp();
        break;

      default:
        // État non reconnu - reset vers LIBRE
        debugLog(`⚠️ État non reconnu ${newStatus}, reset vers LIBRE`);
        updateData.currentEventId = null;
        updateData.currentGroupId = null;
        updateData.pendingInvitations = [];
        updateData.isAvailable = false;
        updateData.currentActivity = null;
        updateData.availabilityId = null;
        updateData.location = null;
        updateData.locationShared = false;
        break;
    }
  }

  /**
   * Force le retour à l'état LIBRE (nettoyage d'urgence)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} reason - Raison du reset
   */
  static async forceResetToLibre(userId, reason = 'Reset manuel') {
    try {
      debugLog(`🔄 Reset forcé vers LIBRE pour ${userId}: ${reason}`);

      await this.setUserEventStatus(userId, UserEventStatus.LIBRE, {
        resetReason: reason,
        resetAt: serverTimestamp(),
      });

      // Nettoyer aussi les invitations obsolètes
      await this.cleanupUserInvitations(userId);

      debugLog(`✅ Reset vers LIBRE terminé pour ${userId}`);
    } catch (error) {
      prodError('❌ Erreur reset forcé:', error);
    }
  }

  // 🎯 TASK 1.4 - VALIDATION UN SEUL ÉTAT PAR USER
  /**
   * Valide qu'un utilisateur n'a qu'un seul état actif et corrige les incohérences
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{valid: boolean, correctedIssues: string[], currentState: string}>}
   */
  static async validateSingleUserState(userId) {
    if (!isOnline()) {
      return {
        valid: true,
        correctedIssues: [],
        currentState: UserEventStatus.LIBRE,
      };
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, EVENT_CONSTANTS.COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          debugLog(`⚠️ Utilisateur ${userId} non trouvé pour validation`);
          return {
            valid: true,
            correctedIssues: [],
            currentState: UserEventStatus.LIBRE,
          };
        }

        const userData = userSnap.data();
        const currentState = userData.eventStatus || UserEventStatus.LIBRE;
        const correctedIssues = [];

        // 🔍 DÉTECTION INCOHÉRENCES MULTIPLES ÉTATS
        let hasMultipleStates = false;
        const activeStates = [];

        // Vérifier les états simultanés invalides
        if (userData.isAvailable && userData.currentActivity) {
          activeStates.push('EN_PARTAGE');
        }
        if (
          userData.pendingInvitations &&
          userData.pendingInvitations.length > 0
        ) {
          activeStates.push('INVITATION_RECUE');
        }
        if (
          userData.currentEventId &&
          currentState === UserEventStatus.INVITATION_ENVOYEE
        ) {
          activeStates.push('INVITATION_ENVOYEE');
        }

        // Détecter conflits d'états
        if (activeStates.length > 1) {
          hasMultipleStates = true;
          correctedIssues.push(
            `États multiples détectés: ${activeStates.join(', ')}`
          );
        }

        // 🔍 DÉTECTION INCOHÉRENCES ÉTAT vs DONNÉES
        const stateDataInconsistencies = [];

        switch (currentState) {
          case UserEventStatus.LIBRE:
            if (userData.isAvailable || userData.currentActivity) {
              stateDataInconsistencies.push('État LIBRE mais isAvailable=true');
            }
            if (userData.pendingInvitations?.length > 0) {
              stateDataInconsistencies.push(
                'État LIBRE mais pendingInvitations existe'
              );
            }
            break;

          case UserEventStatus.EN_PARTAGE:
            if (!userData.isAvailable || !userData.currentActivity) {
              stateDataInconsistencies.push(
                'État EN_PARTAGE mais isAvailable=false'
              );
            }
            break;

          case UserEventStatus.INVITATION_ENVOYEE:
            if (!userData.currentEventId) {
              stateDataInconsistencies.push(
                'État INVITATION_ENVOYEE mais pas currentEventId'
              );
            }
            break;

          case UserEventStatus.INVITATION_RECUE:
            if (!userData.pendingInvitations?.length) {
              stateDataInconsistencies.push(
                'État INVITATION_RECUE mais pas pendingInvitations'
              );
            }
            break;

          default:
            debugLog(`⚠️ État non reconnu "${currentState}" pour ${userId}`);
            stateDataInconsistencies.push(`État non reconnu: ${currentState}`);
            break;
        }

        // 🔧 AUTO-CORRECTION si incohérences détectées
        if (hasMultipleStates || stateDataInconsistencies.length > 0) {
          debugLog(`🔧 [VALIDATION] Correction incohérences pour ${userId}:`, {
            currentState,
            hasMultipleStates,
            stateDataInconsistencies,
            activeStates,
          });

          // Reset complet vers LIBRE
          await this.forceResetToLibre(
            userId,
            'Correction validation état unique'
          );

          correctedIssues.push(...stateDataInconsistencies);
          correctedIssues.push('Auto-correction vers LIBRE effectuée');

          return {
            valid: false,
            correctedIssues,
            currentState: UserEventStatus.LIBRE,
            wasAutoFixed: true,
          };
        }

        debugLog(
          `✅ [VALIDATION] État utilisateur ${userId} cohérent: ${currentState}`
        );
        return { valid: true, correctedIssues: [], currentState };
      });
    } catch (error) {
      prodError('❌ [VALIDATION] Erreur validation état unique:', error);
      return {
        valid: false,
        correctedIssues: [`Erreur validation: ${error.message}`],
        currentState: UserEventStatus.LIBRE,
      };
    }
  }

  // ===========================
  // VALIDATION DES ACTIONS
  // ===========================

  /**
   * Vérifie si un utilisateur peut envoyer des invitations
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{canSend: boolean, reason?: string}>}
   */
  static async canUserSendInvitations(userId) {
    try {
      const currentStatus = await this.getUserEventStatus(userId);
      const canSend = canSendInvitations(currentStatus);

      if (!canSend) {
        return {
          canSend: false,
          reason: `État actuel "${getStatusMessage(currentStatus)}" ne permet pas d'envoyer des invitations`,
        };
      }

      return { canSend: true };
    } catch (error) {
      prodError('❌ Erreur vérification envoi invitations:', error);
      return { canSend: false, reason: 'Erreur de vérification' };
    }
  }

  /**
   * Vérifie si un utilisateur peut recevoir des invitations
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{canReceive: boolean, reason?: string}>}
   */
  static async canUserReceiveInvitations(userId) {
    try {
      const currentStatus = await this.getUserEventStatus(userId);
      const canReceive = canReceiveInvitations(currentStatus);

      if (!canReceive) {
        return {
          canReceive: false,
          reason: `État actuel "${getStatusMessage(currentStatus)}" ne permet pas de recevoir des invitations`,
        };
      }

      return { canReceive: true };
    } catch (error) {
      prodError('❌ Erreur vérification réception invitations:', error);
      return { canReceive: false, reason: 'Erreur de vérification' };
    }
  }

  /**
   * Obtient les informations d'état formatées pour l'interface
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Informations d'état formatées
   */
  static async getUserStatusInfo(userId) {
    try {
      const userRef = doc(db, EVENT_CONSTANTS.COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return {
          eventStatus: UserEventStatus.LIBRE,
          message: getStatusMessage(UserEventStatus.LIBRE),
          color: getStatusColor(UserEventStatus.LIBRE),
          canSendInvitations: true,
          canReceiveInvitations: true,
        };
      }

      const userData = userSnap.data();
      const eventStatus = userData.eventStatus || UserEventStatus.LIBRE;

      return {
        eventStatus,
        message: getStatusMessage(eventStatus, userData.currentActivity),
        color: getStatusColor(eventStatus),
        canSendInvitations: canSendInvitations(eventStatus),
        canReceiveInvitations: canReceiveInvitations(eventStatus),
        currentActivity: userData.currentActivity,
        currentEventId: userData.currentEventId,
        currentGroupId: userData.currentGroupId,
        pendingInvitations: userData.pendingInvitations || [],
        lastStatusChange: userData.lastEventStatusChange,
      };
    } catch (error) {
      prodError('❌ Erreur récupération infos état:', error);
      throw new Error(
        `Impossible de récupérer les infos d'état: ${error.message}`
      );
    }
  }

  // ===========================
  // NETTOYAGE ET MAINTENANCE
  // ===========================

  /**
   * Nettoie les invitations obsolètes d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  static async cleanupUserInvitations(userId) {
    if (!isOnline()) {
      debugLog('⚠️ Mode offline, impossible de nettoyer les invitations');
      return;
    }

    try {
      debugLog(`🧹 Nettoyage invitations obsolètes pour ${userId}`);

      // Récupérer les invitations expirées ou traitées
      const expiredQuery = query(
        collection(db, EVENT_CONSTANTS.COLLECTIONS.INVITATIONS),
        where('toUserId', '==', userId),
        where('status', 'in', [
          InvitationStatus.EXPIRED,
          InvitationStatus.DECLINED,
        ])
      );

      const expiredSnapshot = await getDocs(expiredQuery);

      if (!expiredSnapshot.empty) {
        const expiredIds = expiredSnapshot.docs.map(doc => doc.id);

        // Mettre à jour le profil utilisateur
        const userRef = doc(db, EVENT_CONSTANTS.COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const cleanedInvitations = (userData.pendingInvitations || []).filter(
            id => !expiredIds.includes(id)
          );

          await updateDoc(userRef, {
            pendingInvitations: cleanedInvitations,
            updatedAt: serverTimestamp(),
          });

          debugLog(
            `🧹 ✅ ${expiredIds.length} invitations obsolètes nettoyées pour ${userId}`
          );
        }
      }
    } catch (error) {
      prodError('❌ Erreur nettoyage invitations:', error);
    }
  }

  /**
   * Nettoie les états obsolètes de tous les utilisateurs (job de maintenance)
   */
  static async cleanupObsoleteStates() {
    if (!isOnline()) {
      debugLog('⚠️ Mode offline, impossible de nettoyer les états obsolètes');
      return;
    }

    try {
      debugLog('🧹 Démarrage nettoyage états obsolètes...');

      // Chercher les utilisateurs avec des états potentiellement obsolètes
      const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 heure ago

      const usersQuery = query(
        collection(db, EVENT_CONSTANTS.COLLECTIONS.USERS),
        where('eventStatus', 'in', [
          UserEventStatus.INVITATION_ENVOYEE,
          UserEventStatus.INVITATION_RECUE,
        ])
      );

      const usersSnapshot = await getDocs(usersQuery);
      let cleanedUsers = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const lastChange =
          userData.lastEventStatusChange?.toDate?.() ||
          new Date(userData.lastEventStatusChange);

        if (lastChange < cutoffTime) {
          await this.forceResetToLibre(
            userDoc.id,
            'Nettoyage automatique - état obsolète'
          );
          cleanedUsers++;
        }
      }

      debugLog(
        `🧹 ✅ Nettoyage terminé: ${cleanedUsers} utilisateurs nettoyés`
      );
    } catch (error) {
      prodError('❌ Erreur nettoyage états obsolètes:', error);
    }
  }

  // ===========================
  // UTILITAIRES
  // ===========================

  /**
   * Obtient les statistiques d'états pour le monitoring
   * @returns {Promise<Object>} - Statistiques des états
   */
  static async getStatusStatistics() {
    try {
      const usersSnapshot = await getDocs(
        collection(db, EVENT_CONSTANTS.COLLECTIONS.USERS)
      );

      const stats = {
        [UserEventStatus.LIBRE]: 0,
        [UserEventStatus.INVITATION_ENVOYEE]: 0,
        [UserEventStatus.INVITATION_RECUE]: 0,
        [UserEventStatus.EN_PARTAGE]: 0,
        total: usersSnapshot.size,
      };

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const status = userData.eventStatus || UserEventStatus.LIBRE;
        stats[status]++;
      });

      return stats;
    } catch (error) {
      prodError('❌ Erreur récupération statistiques:', error);
      return null;
    }
  }
}
