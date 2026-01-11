// Service de validation avancée pour invitations - Phase 5
import { UserEventStatus } from '../types/eventTypes';
import { EventStatusService } from './eventStatusService';
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
      // 🚨 MODE DÉVELOPPEMENT : Contourner les vérifications strictes temporairement
      // TEMPORAIREMENT DÉSACTIVÉ pour debug statuts
      if (false && process.env.NODE_ENV === 'development') {
        console.log(`🔧 [DEV MODE] Contournement validation pour ${userId}`);
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

      // 2. Vérifier statut événement directement (évite dépendance circulaire avec FriendsStatusService)
      const eventStatus = await EventStatusService.getUserEventStatus(userId);

      // Si l'utilisateur est en partage ou occupé, il n'est pas disponible
      if (
        eventStatus === UserEventStatus.EN_PARTAGE ||
        eventStatus === UserEventStatus.OCCUPE
      ) {
        return {
          available: false,
          reason: 'status_busy',
          statusType: eventStatus,
          details: { eventStatus },
          friendlyMessage:
            eventStatus === UserEventStatus.EN_PARTAGE
              ? 'Déjà en partage de localisation'
              : 'Actuellement occupé',
        };
      }

      return {
        available: true,
        reason: 'available',
        details: null,
        friendlyMessage: 'Disponible pour invitation',
      };
    } catch (error) {
      console.error('❌ Erreur vérification disponibilité:', error);
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
      // 1. Validation basique
      if (recipientIds.length > 8) {
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
            global: 'Maximum 8 destinataires autorisés',
          },
        };
      }

      // 2. Éliminer auto-invitation
      const filteredRecipients =
        fromUserId === recipientIds[0]
          ? recipientIds
          : recipientIds.filter(id => id !== fromUserId);

      if (filteredRecipients.length !== recipientIds.length) {
        const selfIds = recipientIds.filter(id => id === fromUserId);
        selfIds.forEach(id => {
          return {
            valid: [],
            invalid: recipientIds,
            blocked: [id],
            summary: {
              total: recipientIds.length,
              valid: 0,
              invalid: recipientIds.length,
              blocked: 1,
            },
            reasons: {
              global: 'Auto-invitation non autorisée',
            },
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
      const valid = [];
      const invalid = [];
      const blocked = [];
      const reasons = {};

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

      return {
        valid,
        invalid,
        blocked,
        summary,
        reasons,
        canProceed: valid.length > 0 && invalid.length === 0,
      };
    } catch (error) {
      console.error('❌ Erreur validation destinataires:', error);
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

      return {
        available,
        unavailable,
        summary,
      };
    } catch (error) {
      console.error('❌ Erreur filtrage amis:', error);
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
      // 🚨 MODE DÉVELOPPEMENT : Contourner aussi les vérifications d'état
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `🔧 [DEV MODE] Contournement validation état pour ${userId}`
        );
        return {
          allowed: true,
          reason: 'dev_mode_bypass',
          details: { action, userMessage: 'Autorisé (mode développement)' },
          userMessage: 'Autorisé en mode développement',
        };
      }

      // Obtenir le statut événement de l'utilisateur directement (sans logique relationnelle)
      const userEventStatus =
        await EventStatusService.getUserEventStatus(userId);

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
          userMessage: 'Action non reconnue',
        };
      }

      const currentStatus = userStatus.status;

      // Vérifier autorisation
      if (rules.allowed.includes(currentStatus)) {
        return {
          allowed: true,
          reason: 'state_allows',
          details: { currentStatus, action },
          userMessage: 'Action autorisée',
        };
      }

      // Vérifier blocage
      if (rules.blocked.includes(currentStatus)) {
        const message = this._getBlockedActionMessage(currentStatus, action);
        return {
          allowed: false,
          reason: 'state_blocks',
          details: {
            currentStatus,
            action,
            message: message,
          },
          userMessage: message,
        };
      }

      // Vérifier avertissement
      if (rules.warning.includes(currentStatus)) {
        const message = this._getWarningActionMessage(currentStatus, action);
        return {
          allowed: true,
          reason: 'state_warns',
          warning: true,
          details: {
            currentStatus,
            action,
            message: message,
          },
          userMessage: message,
        };
      }

      return {
        allowed: false,
        reason: 'state_unknown',
        details: { currentStatus, action },
        userMessage: `État non reconnu: ${currentStatus}`,
      };
    } catch (error) {
      console.error('❌ Erreur validation action:', error);
      return {
        allowed: false,
        reason: 'error',
        details: error.message,
        userMessage: 'Erreur lors de la validation',
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
        "Impossible d'inviter pendant le partage de localisation. Arrêtez d'abord votre partage.",
      [`${UserEventStatus.EN_PARTAGE}_accept_invitation`]:
        "Impossible d'accepter pendant le partage de localisation. Arrêtez d'abord votre partage.",
      [`${UserEventStatus.EN_PARTAGE}_start_sharing`]: 'Partage déjà en cours',
      [`${UserEventStatus.INVITATION_ENVOYEE}_send_invitation`]:
        "Invitation déjà envoyée, attendez une réponse avant d'en envoyer une nouvelle",
    };

    return (
      messages[`${status}_${action}`] ||
      `Action "${action}" non autorisée dans l'état "${status}"`
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

  /**
   * Vérifie si un utilisateur peut inviter un autre utilisateur
   */
  static async canUserInviteUser(invitingUserId, userId) {
    try {
      // Utiliser RelationshipService qui a déjà la logique complète avec filtrage d'expiration
      return await RelationshipService.canUserInviteUser(
        invitingUserId,
        userId
      );
    } catch (error) {
      console.error('❌ Erreur validation utilisateur:', error);
      return {
        canInvite: false,
        reason: 'Erreur de validation',
        details: { error: error.message },
      };
    }
  }
}
