// Service réel pour statuts d'amis - Phase 4 FINALISÉE
import { UserEventStatus } from '../types/eventTypes';
import { debugLog, prodError } from '../utils/logger';
import { EventStatusService } from './eventStatusService';
import { RelationshipService } from './relationshipService';
import { ValidationService } from './validationService';

export class FriendsStatusService {
  /**
   * Calcule le statut d'affichage pour un ami spécifique
   */
  static async calculateFriendStatus(friendId, currentUserId) {
    try {
      // Vérifier relations bilatérales actives
      const hasRelation = await RelationshipService.hasActiveRelationship(
        currentUserId,
        friendId
      );

      if (hasRelation.hasRelation) {
        return {
          status:
            hasRelation.type === 'sharing' ? 'en_partage' : 'invitation_cours',
          message:
            hasRelation.type === 'sharing'
              ? 'En partage de localisation'
              : hasRelation.type === 'invitation_received'
                ? 'Invitation reçue en attente'
                : 'Invitation envoyée en attente',
          color:
            hasRelation.type === 'sharing'
              ? 'bg-red-500 text-white'
              : 'bg-orange-500 text-white',
          available: false,
          details: hasRelation,
        };
      }

      // Vérifier disponibilité de l'ami (logique existante)
      const validationResult = await ValidationService.canUserInviteUser(
        currentUserId,
        friendId
      );

      return {
        status: validationResult.canInvite ? 'libre' : 'occupe',
        message: validationResult.canInvite
          ? 'Disponible pour activité'
          : validationResult.reason || 'Non disponible',
        color: validationResult.canInvite
          ? 'bg-green-500 text-white'
          : 'bg-orange-500 text-white',
        available: validationResult.canInvite,
        details: validationResult,
      };
    } catch (error) {
      console.error('❌ Erreur calcul statut ami:', error);
      return {
        status: 'erreur',
        message: 'Erreur de chargement',
        color: 'bg-gray-500 text-white',
        available: false,
        details: { error: error.message },
      };
    }
  }

  /**
   * Calcule les statuts pour une liste d'amis
   */
  static async calculateFriendsStatuses(friends, currentUserId) {
    if (!friends || friends.length === 0) {
      return {};
    }

    try {
      const statusPromises = friends.map(friend =>
        this.calculateFriendStatus(friend.id, currentUserId)
      );

      const statusResults = await Promise.all(statusPromises);

      // Créer un map friendId -> status
      const statusMap = {};
      friends.forEach((friend, index) => {
        statusMap[friend.id] = statusResults[index];
      });

      return statusMap;
    } catch (error) {
      console.error('❌ Erreur calcul statuts amis:', error);
      return {};
    }
  }

  /**
   * Obtient le statut détaillé d'un ami spécifique
   * @param {string} friendId - ID de l'ami
   * @param {string} currentUserId - ID utilisateur actuel
   * @returns {Promise<Object>} - Statut avec message, couleur, disponibilité
   */
  static async getFriendDetailedStatus(friendId, currentUserId) {
    try {
      debugLog(`🔍 [FriendsStatusService] Calcul statut pour ${friendId}`);

      // 1. Obtenir le statut événement de l'ami
      const friendEventStatus =
        await EventStatusService.getUserEventStatus(friendId);

      // 2. Vérifier la relation entre l'utilisateur actuel et cet ami
      const relationship = await RelationshipService.hasActiveRelationship(
        currentUserId,
        friendId
      );

      // 3. Vérifier la disponibilité générale de l'ami
      const availability = await ValidationService.checkUserAvailability(
        friendId,
        currentUserId
      );

      // 4. Calculer le statut d'affichage selon la logique métier
      const displayStatus = this._calculateDisplayStatus(
        friendEventStatus,
        relationship,
        availability,
        friendId
      );

      debugLog(
        `🔍 [FriendsStatusService] ✅ Statut calculé pour ${friendId}:`,
        displayStatus
      );

      return displayStatus;
    } catch (error) {
      prodError(`❌ [FriendsStatusService] Erreur statut ${friendId}:`, error);

      // Fallback en cas d'erreur
      return {
        status: UserEventStatus.LIBRE,
        message: 'Statut indisponible',
        color: 'bg-gray-500 text-white',
        available: false,
        details: { error: error.message },
      };
    }
  }

  /**
   * Obtient les statuts de tous les amis
   * @param {Array} friends - Liste des amis
   * @param {string} currentUserId - ID utilisateur actuel
   * @returns {Promise<Object>} - Map des statuts par friendId
   */
  static async getAllFriendsStatus(friends, currentUserId) {
    try {
      debugLog(
        `🔍 [FriendsStatusService] Calcul statuts pour ${friends.length} amis`
      );

      if (!friends || friends.length === 0) {
        debugLog('🔍 [FriendsStatusService] Aucun ami trouvé');
        return {};
      }

      const statusMap = {};

      // Calculer les statuts en parallèle pour optimiser les performances
      const statusPromises = friends.map(async friend => {
        const status = await this.getFriendDetailedStatus(
          friend.id,
          currentUserId
        );
        return { friendId: friend.id, status };
      });

      const results = await Promise.allSettled(statusPromises);

      // Assembler les résultats
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { friendId, status } = result.value;
          statusMap[friendId] = status;
        } else {
          // En cas d'erreur pour cet ami spécifique
          const friend = friends[index];
          statusMap[friend.id] = {
            status: UserEventStatus.LIBRE,
            message: 'Erreur statut',
            color: 'bg-gray-400 text-white',
            available: false,
            details: { error: true },
          };
          prodError(
            `❌ [FriendsStatusService] Erreur ami ${friend.id}:`,
            result.reason
          );
        }
      });

      debugLog(
        `🔍 [FriendsStatusService] ✅ ${Object.keys(statusMap).length} statuts calculés`
      );

      return statusMap;
    } catch (error) {
      prodError('❌ [FriendsStatusService] Erreur calcul général:', error);
      return {};
    }
  }

  /**
   * Filtre les amis disponibles selon leurs statuts
   * @param {Array} friends - Liste des amis
   * @param {Object} friendsStatus - Map des statuts
   * @returns {Array} - Amis disponibles pour invitation
   */
  static filterAvailableFriends(friends, friendsStatus) {
    if (!friends?.length || !friendsStatus) {
      return [];
    }

    const available = friends.filter(friend => {
      const status = friendsStatus[friend.id];
      return status?.available === true;
    });

    debugLog(
      `🔍 [FriendsStatusService] ${available.length}/${friends.length} amis disponibles`
    );
    return available;
  }

  /**
   * Obtient les amis indisponibles avec raisons détaillées
   * @param {Array} friends - Liste des amis
   * @param {string} currentUserId - ID utilisateur actuel
   * @returns {Promise<Array>} - Amis indisponibles avec raisons
   */
  static async getUnavailableFriendsWithReasons(friends, currentUserId) {
    try {
      const friendsStatus = await this.getAllFriendsStatus(
        friends,
        currentUserId
      );

      const unavailable = friends
        .filter(friend => {
          const status = friendsStatus[friend.id];
          return status && !status.available;
        })
        .map(friend => ({
          ...friend,
          statusInfo: friendsStatus[friend.id],
          reason: friendsStatus[friend.id]?.message || 'Indisponible',
        }));

      debugLog(
        `🔍 [FriendsStatusService] ${unavailable.length} amis indisponibles identifiés`
      );

      return unavailable;
    } catch (error) {
      prodError(
        '❌ [FriendsStatusService] Erreur calcul indisponibles:',
        error
      );
      return [];
    }
  }

  // ===========================
  // MÉTHODES PRIVÉES
  // ===========================

  /**
   * Calcule le statut d'affichage selon la logique métier
   * @private
   */
  static _calculateDisplayStatus(
    eventStatus,
    relationship,
    availability,
    friendId
  ) {
    // Priorité 1: Si relation active avec l'utilisateur actuel
    if (relationship.hasRelation) {
      return this._getRelationshipStatus(relationship);
    }

    // Priorité 2: Si ami indisponible pour d'autres raisons
    if (!availability.available) {
      return this._getUnavailabilityStatus(availability);
    }

    // Priorité 3: Statut selon l'état événement de l'ami
    return this._getEventStatus(eventStatus);
  }

  /**
   * Statut pour relation active avec l'utilisateur
   * @private
   */
  static _getRelationshipStatus(relationship) {
    switch (relationship.type) {
      case 'pending_invitation':
        return {
          status: UserEventStatus.INVITATION_RECUE,
          message: 'Invitation en cours entre vous',
          color: 'bg-blue-500 text-white',
          available: false,
          details: { relationship: true, type: relationship.type },
        };

      case 'location_sharing':
        return {
          status: UserEventStatus.EN_PARTAGE,
          message: 'Partage actif avec vous',
          color: 'bg-red-500 text-white',
          available: false,
          details: { relationship: true, type: relationship.type },
        };

      default:
        return {
          status: UserEventStatus.INVITATION_ENVOYEE,
          message: 'Relation active',
          color: 'bg-orange-500 text-white',
          available: false,
          details: { relationship: true, type: relationship.type },
        };
    }
  }

  /**
   * Statut pour ami indisponible
   * @private
   */
  static _getUnavailabilityStatus(availability) {
    const reason = availability.reason || 'Occupé';

    if (reason.includes('invitation')) {
      return {
        status: UserEventStatus.INVITATION_RECUE,
        message: 'A des invitations en attente',
        color: 'bg-blue-500 text-white',
        available: false,
        details: { unavailable: true, reason },
      };
    }

    if (reason.includes('partage') || reason.includes('sharing')) {
      return {
        status: UserEventStatus.EN_PARTAGE,
        message: "En activité avec quelqu'un",
        color: 'bg-red-500 text-white',
        available: false,
        details: { unavailable: true, reason },
      };
    }

    return {
      status: UserEventStatus.INVITATION_ENVOYEE,
      message: 'Temporairement occupé',
      color: 'bg-orange-500 text-white',
      available: false,
      details: { unavailable: true, reason },
    };
  }

  /**
   * Statut selon l'état événement de l'ami
   * @private
   */
  static _getEventStatus(eventStatus) {
    switch (eventStatus) {
      case UserEventStatus.LIBRE:
        return {
          status: UserEventStatus.LIBRE,
          message: 'Disponible pour activité',
          color: 'bg-green-500 text-white',
          available: true,
          details: { eventStatus },
        };

      case UserEventStatus.INVITATION_ENVOYEE:
        return {
          status: UserEventStatus.INVITATION_ENVOYEE,
          message: 'En attente de partage',
          color: 'bg-red-500 text-white', // Même couleur que EN_PARTAGE
          available: false,
          details: { eventStatus },
        };

      case UserEventStatus.INVITATION_RECUE:
        return {
          status: UserEventStatus.INVITATION_RECUE,
          message: 'A reçu des invitations',
          color: 'bg-blue-500 text-white',
          available: false,
          details: { eventStatus },
        };

      case UserEventStatus.EN_PARTAGE:
        return {
          status: UserEventStatus.EN_PARTAGE,
          message: 'En partage de localisation',
          color: 'bg-red-500 text-white',
          available: false,
          details: { eventStatus },
        };

      default:
        return {
          status: UserEventStatus.LIBRE,
          message: 'Disponible',
          color: 'bg-green-500 text-white',
          available: true,
          details: { eventStatus },
        };
    }
  }
}
