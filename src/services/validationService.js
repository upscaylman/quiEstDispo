// Service de validation avancée pour invitations - Phase 5
import { UserEventStatus } from '../types/eventTypes';
import { debugLog, prodError } from '../utils/logger';
import { EventStatusService } from './eventStatusService';
import { FriendsStatusService } from './friendsStatusService';
import { RelationshipService } from './relationshipService';

export class ValidationService {
  /**
   * Vérifie la disponibilité d'un utilisateur pour être invité
   * @param {string} userId - ID de l'utilisateur à vérifier
   * @param {string} invitingUserId - ID de l'utilisateur qui invite
   * @returns {Promise<Object>} - { available, reason, details }
   */
  static async checkUserAvailability(userId, invitingUserId) {
    try {
      debugLog(
        `🔍 [ValidationService] Vérification disponibilité ${userId} pour ${invitingUserId}`
      );

      // 🚨 MODE DÉVELOPPEMENT : Contourner les vérifications strictes temporairement
      if (process.env.NODE_ENV === 'development') {
        debugLog(`🔧 [DEV MODE] Contournement validation pour ${userId}`);
        return {
          available: true,
          reason: 'dev_mode_bypass',
          details: null,
          friendlyMessage: 'Disponible (mode dev)',
        };
      }

      // 1. Vérifier relation bilatérale
      const relationshipCheck = await RelationshipService.canUserInviteUser(
        invitingUserId,
        userId
      );
      if (!relationshipCheck.canInvite) {
        return {
          available: false,
          reason: 'relationship_conflict',
          relationshipReason: relationshipCheck.reason,
          details: relationshipCheck.details,
          friendlyMessage: this._getUnavailableMessage(
            relationshipCheck.reason,
            relationshipCheck
          ),
        };
      }

      // 2. Vérifier statut détaillé via FriendsStatusService
      const statusCheck = await FriendsStatusService.getFriendDetailedStatus(
        userId,
        invitingUserId
      );
      if (!statusCheck.available) {
        return {
          available: false,
          reason: 'status_busy',
          statusType: statusCheck.status,
          details: statusCheck.details,
          friendlyMessage: statusCheck.message,
        };
      }

      return {
        available: true,
        reason: 'available',
        details: null,
        friendlyMessage: 'Disponible pour invitation',
      };
    } catch (error) {
      prodError(
        '❌ [ValidationService] Erreur vérification disponibilité:',
        error
      );
      return {
        available: false,
        reason: 'error',
        details: error.message,
        friendlyMessage: 'Erreur de validation',
      };
    }
  }

  /**
   * Obtient une raison détaillée d'indisponibilité
   * @param {string} userId - ID de l'utilisateur
   * @param {string} checkingUserId - ID qui vérifie
   * @returns {Promise<string>} - Raison détaillée
   */
  static async getUnavailableReason(userId, checkingUserId) {
    const availability = await this.checkUserAvailability(
      userId,
      checkingUserId
    );
    return availability.friendlyMessage || 'Indisponible';
  }

  /**
   * Valide une liste de destinataires pour invitation multiple
   * @param {string} fromUserId - Expéditeur
   * @param {Array} recipientIds - Liste des destinataires
   * @param {Object} options - Options de validation
   * @returns {Promise<Object>} - Résultat de validation
   */
  static async validateInvitationRecipients(
    fromUserId,
    recipientIds,
    options = {}
  ) {
    if (!recipientIds?.length) {
      return {
        valid: [],
        invalid: [],
        blocked: [],
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          blocked: 0,
        },
        reasons: {},
      };
    }

    try {
      debugLog(
        `🔍 [ValidationService] Validation invitation multiple: ${recipientIds.length} destinataires`
      );

      const valid = [];
      const invalid = [];
      const blocked = [];
      const reasons = {};

      // Options par défaut
      const validationOptions = {
        allowSelfInvite: false,
        maxRecipients: 8,
        requireAllValid: false,
        ...options,
      };

      // 1. Validation basique
      if (recipientIds.length > validationOptions.maxRecipients) {
        return {
          valid: [],
          invalid: recipientIds,
          blocked: [],
          summary: {
            total: recipientIds.length,
            valid: 0,
            invalid: recipientIds.length,
            blocked: 0,
          },
          reasons: {
            global: `Maximum ${validationOptions.maxRecipients} destinataires autorisés`,
          },
        };
      }

      // 2. Éliminer auto-invitation
      const filteredRecipients = validationOptions.allowSelfInvite
        ? recipientIds
        : recipientIds.filter(id => id !== fromUserId);

      if (filteredRecipients.length !== recipientIds.length) {
        const selfIds = recipientIds.filter(id => id === fromUserId);
        selfIds.forEach(id => {
          blocked.push(id);
          reasons[id] = {
            category: 'blocked',
            reason: 'self_invite',
            message: 'Auto-invitation non autorisée',
          };
        });
      }

      // 3. Validation individuelle de chaque destinataire
      const validationPromises = filteredRecipients.map(async recipientId => {
        const availability = await this.checkUserAvailability(
          recipientId,
          fromUserId
        );

        return {
          recipientId,
          available: availability.available,
          reason: availability.reason,
          details: availability.details,
          message: availability.friendlyMessage,
        };
      });

      const results = await Promise.all(validationPromises);

      // 4. Classer les résultats
      results.forEach(result => {
        if (result.available) {
          valid.push(result.recipientId);
        } else {
          // Distinguer entre invalid (temporaire) et blocked (permanent)
          if (
            ['relationship_conflict', 'sender_in_activity'].includes(
              result.reason
            )
          ) {
            blocked.push(result.recipientId);
            reasons[result.recipientId] = {
              category: 'blocked',
              reason: result.reason,
              message: result.message,
              details: result.details,
            };
          } else {
            invalid.push(result.recipientId);
            reasons[result.recipientId] = {
              category: 'invalid',
              reason: result.reason,
              message: result.message,
              details: result.details,
            };
          }
        }
      });

      const summary = {
        total: recipientIds.length,
        valid: valid.length,
        invalid: invalid.length,
        blocked: blocked.length,
      };

      debugLog(`🔍 [ValidationService] ✅ Validation terminée:`, summary);

      return {
        valid,
        invalid,
        blocked,
        summary,
        reasons,
        canProceed:
          valid.length > 0 &&
          (!validationOptions.requireAllValid || invalid.length === 0),
      };
    } catch (error) {
      prodError(
        '❌ [ValidationService] Erreur validation destinataires:',
        error
      );
      return {
        valid: [],
        invalid: recipientIds,
        blocked: [],
        summary: {
          total: recipientIds.length,
          valid: 0,
          invalid: recipientIds.length,
          blocked: 0,
        },
        reasons: { global: 'Erreur de validation' },
      };
    }
  }

  /**
   * Filtre une liste d'amis pour ne garder que ceux disponibles
   * @param {Array} friendsList - Liste des amis
   * @param {string} currentUserId - ID utilisateur actuel
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} - { available, unavailable, summary }
   */
  static async filterAvailableFriends(
    friendsList,
    currentUserId,
    options = {}
  ) {
    if (!friendsList?.length) {
      return {
        available: [],
        unavailable: [],
        summary: { total: 0, available: 0, unavailable: 0 },
      };
    }

    try {
      debugLog(
        `🔍 [ValidationService] Filtrage ${friendsList.length} amis pour ${currentUserId}`
      );

      const available = [];
      const unavailable = [];

      // Options de filtrage
      const filterOptions = {
        includeReasons: true,
        sortByAvailability: true,
        ...options,
      };

      // Vérifier chaque ami
      const checkPromises = friendsList.map(async friend => {
        const availability = await this.checkUserAvailability(
          friend.id,
          currentUserId
        );

        const friendWithStatus = {
          ...friend,
          availability: {
            available: availability.available,
            reason: availability.reason,
            message: availability.friendlyMessage,
            details: availability.details,
          },
        };

        if (availability.available) {
          available.push(friendWithStatus);
        } else {
          if (filterOptions.includeReasons) {
            unavailable.push(friendWithStatus);
          }
        }

        return friendWithStatus;
      });

      await Promise.all(checkPromises);

      // Tri optionnel
      if (filterOptions.sortByAvailability) {
        available.sort((a, b) => a.name.localeCompare(b.name));
        unavailable.sort((a, b) => a.name.localeCompare(b.name));
      }

      const summary = {
        total: friendsList.length,
        available: available.length,
        unavailable: unavailable.length,
        percentage: Math.round((available.length / friendsList.length) * 100),
      };

      debugLog(
        `🔍 [ValidationService] ✅ Filtrage terminé: ${summary.available}/${summary.total} (${summary.percentage}%) disponibles`
      );

      return {
        available,
        unavailable,
        summary,
      };
    } catch (error) {
      prodError('❌ [ValidationService] Erreur filtrage amis:', error);
      return {
        available: [],
        unavailable: friendsList,
        summary: {
          total: friendsList.length,
          available: 0,
          unavailable: friendsList.length,
        },
      };
    }
  }

  /**
   * Vérifie si une action d'invitation est autorisée selon l'état utilisateur
   * @param {string} userId - ID utilisateur
   * @param {string} action - Type d'action ('send_invitation', 'accept_invitation', etc.)
   * @returns {Promise<Object>} - { allowed, reason, details }
   */
  static async validateActionByUserState(userId, action) {
    try {
      debugLog(
        `🔍 [ValidationService] Validation action ${action} pour ${userId}`
      );

      // Obtenir le statut événement de l'utilisateur directement (sans logique relationnelle)
      const userEventStatus =
        await EventStatusService.getUserEventStatus(userId);

      debugLog(
        `🔍 [ValidationService] Statut événement utilisateur: ${userEventStatus}`
      );

      // Créer un objet de statut simplifié
      const userStatus = {
        status: userEventStatus,
        available: userEventStatus === UserEventStatus.LIBRE,
      };

      // Règles d'autorisation par statut et action
      const actionRules = {
        send_invitation: {
          allowed: [UserEventStatus.LIBRE],
          blocked: [
            UserEventStatus.EN_PARTAGE,
            UserEventStatus.INVITATION_ENVOYEE,
          ],
          warning: [UserEventStatus.INVITATION_RECUE],
        },
        accept_invitation: {
          allowed: [UserEventStatus.LIBRE, UserEventStatus.INVITATION_RECUE],
          blocked: [UserEventStatus.EN_PARTAGE],
          warning: [UserEventStatus.INVITATION_ENVOYEE],
        },
        decline_invitation: {
          allowed: [UserEventStatus.LIBRE, UserEventStatus.INVITATION_RECUE],
          blocked: [],
          warning: [],
        },
        start_sharing: {
          allowed: [UserEventStatus.LIBRE],
          blocked: [UserEventStatus.EN_PARTAGE],
          warning: [
            UserEventStatus.INVITATION_ENVOYEE,
            UserEventStatus.INVITATION_RECUE,
          ],
        },
      };

      const rules = actionRules[action];
      if (!rules) {
        return {
          allowed: false,
          reason: 'unknown_action',
          details: { action },
        };
      }

      const currentStatus = userStatus.status;

      // Vérifier autorisation
      if (rules.allowed.includes(currentStatus)) {
        return {
          allowed: true,
          reason: 'state_allows',
          details: { currentStatus, action },
        };
      }

      // Vérifier blocage
      if (rules.blocked.includes(currentStatus)) {
        return {
          allowed: false,
          reason: 'state_blocks',
          details: {
            currentStatus,
            action,
            message: this._getBlockedActionMessage(currentStatus, action),
          },
        };
      }

      // Vérifier avertissement
      if (rules.warning.includes(currentStatus)) {
        return {
          allowed: true,
          reason: 'state_warns',
          warning: true,
          details: {
            currentStatus,
            action,
            message: this._getWarningActionMessage(currentStatus, action),
          },
        };
      }

      return {
        allowed: false,
        reason: 'state_unknown',
        details: { currentStatus, action },
      };
    } catch (error) {
      prodError('❌ [ValidationService] Erreur validation action:', error);
      return {
        allowed: false,
        reason: 'error',
        details: error.message,
      };
    }
  }

  // ===========================
  // MÉTHODES PRIVÉES
  // ===========================

  /**
   * Convertit une raison technique en message utilisateur
   * @private
   */
  static _getUnavailableMessage(reason, details = {}) {
    const messages = {
      relationship_conflict: 'Relation active avec cet ami',
      target_busy: 'Ami déjà occupé',
      sender_in_activity: 'Vous êtes déjà en activité',
      status_busy: 'Ami indisponible actuellement',
      pending_invitation: 'Invitation déjà en cours',
      location_sharing: 'Partage de localisation actif',
      error: 'Erreur de validation',
    };

    return messages[reason] || 'Indisponible';
  }

  /**
   * Messages pour actions bloquées
   * @private
   */
  static _getBlockedActionMessage(status, action) {
    const messages = {
      [`${UserEventStatus.EN_PARTAGE}_send_invitation`]:
        "Impossible d'inviter pendant le partage de localisation",
      [`${UserEventStatus.EN_PARTAGE}_accept_invitation`]:
        "Impossible d'accepter pendant le partage de localisation",
      [`${UserEventStatus.EN_PARTAGE}_start_sharing`]: 'Partage déjà en cours',
      [`${UserEventStatus.INVITATION_ENVOYEE}_send_invitation`]:
        'Invitation déjà envoyée, attendez une réponse',
    };

    return (
      messages[`${status}_${action}`] || 'Action non autorisée dans cet état'
    );
  }

  /**
   * Messages d'avertissement pour actions
   * @private
   */
  static _getWarningActionMessage(status, action) {
    const messages = {
      [`${UserEventStatus.INVITATION_RECUE}_send_invitation`]:
        'Vous avez des invitations en attente',
      [`${UserEventStatus.INVITATION_ENVOYEE}_accept_invitation`]:
        'Vous avez déjà envoyé des invitations',
      [`${UserEventStatus.INVITATION_RECUE}_start_sharing`]:
        'Cela annulera vos invitations reçues',
      [`${UserEventStatus.INVITATION_ENVOYEE}_start_sharing`]:
        'Cela annulera vos invitations envoyées',
    };

    return (
      messages[`${status}_${action}`] ||
      'Action possible mais attention à votre état actuel'
    );
  }
}
