// Service pour la gestion des relations bilatérales - Phase 5
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline } from './firebaseUtils';

export class RelationshipService {
  /**
   * Vérifie si deux utilisateurs ont une relation active
   * @param {string} userId1 - Premier utilisateur
   * @param {string} userId2 - Deuxième utilisateur
   * @returns {Promise<Object>} - { hasRelation, type, details }
   */
  static async hasActiveRelationship(userId1, userId2) {
    if (!isOnline()) {
      return { hasRelation: false, type: null, reason: 'offline' };
    }

    try {
      debugLog(
        `🔍 [RelationshipService] Vérification relation ${userId1} ↔ ${userId2}`
      );

      // 1. Vérifier invitations pending entre les deux utilisateurs
      const pendingInvitations = await this._checkPendingInvitations(
        userId1,
        userId2
      );
      if (pendingInvitations.hasRelation) {
        return pendingInvitations;
      }

      // 2. Vérifier partage de localisation actif
      const locationSharing = await this._checkLocationSharing(
        userId1,
        userId2
      );
      if (locationSharing.hasRelation) {
        return locationSharing;
      }

      // 3. Vérifier disponibilité partagée commune
      const sharedAvailability = await this._checkSharedAvailability(
        userId1,
        userId2
      );
      if (sharedAvailability.hasRelation) {
        return sharedAvailability;
      }

      return { hasRelation: false, type: null, reason: 'no_active_relation' };
    } catch (error) {
      prodError(
        '❌ [RelationshipService] Erreur vérification relation:',
        error
      );
      return { hasRelation: false, type: 'error', reason: error.message };
    }
  }

  /**
   * Détermine le type de relation active
   * @param {string} userId1 - Premier utilisateur
   * @param {string} userId2 - Deuxième utilisateur
   * @returns {Promise<string|null>} - Type de relation ou null
   */
  static async getActiveRelationshipType(userId1, userId2) {
    const relationship = await this.hasActiveRelationship(userId1, userId2);
    return relationship.type;
  }

  /**
   * Vérifie si un utilisateur peut inviter un autre
   * @param {string} fromUserId - Utilisateur qui invite
   * @param {string} toUserId - Utilisateur à inviter
   * @returns {Promise<Object>} - { canInvite, reason, details }
   */
  static async canUserInviteUser(fromUserId, toUserId) {
    try {
      debugLog(
        `🔍 [RelationshipService] Vérification invitation ${fromUserId} → ${toUserId}`
      );

      // 1. Vérifier relation existante
      const relationship = await this.hasActiveRelationship(
        fromUserId,
        toUserId
      );
      if (relationship.hasRelation) {
        return {
          canInvite: false,
          reason: 'active_relationship',
          relationshipType: relationship.type,
          details: relationship.details,
        };
      }

      // 2. Vérifier si l'utilisateur cible est déjà occupé
      const targetStatus = await this._getUserBusyStatus(toUserId);
      if (targetStatus.isBusy) {
        return {
          canInvite: false,
          reason: 'target_busy',
          busyType: targetStatus.type,
          details: targetStatus.details,
        };
      }

      // 3. Vérifier si l'expéditeur peut envoyer des invitations
      const senderStatus = await this._getUserBusyStatus(fromUserId);
      if (senderStatus.isBusy && senderStatus.type === 'location_sharing') {
        return {
          canInvite: false,
          reason: 'sender_in_activity',
          details: senderStatus.details,
        };
      }

      return {
        canInvite: true,
        reason: 'allowed',
        details: null,
      };
    } catch (error) {
      prodError(
        '❌ [RelationshipService] Erreur validation invitation:',
        error
      );
      return {
        canInvite: false,
        reason: 'error',
        details: error.message,
      };
    }
  }

  /**
   * Récupère la liste des amis indisponibles pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Array} friendsList - Liste des amis
   * @returns {Promise<Array>} - Amis indisponibles avec raisons
   */
  static async getUnavailableFriendsForUser(userId, friendsList) {
    if (!friendsList?.length) {
      return [];
    }

    try {
      debugLog(
        `🔍 [RelationshipService] Calcul amis indisponibles pour ${userId} (${friendsList.length} amis)`
      );

      const unavailableFriends = [];

      // Vérifier chaque ami en parallèle
      const checkPromises = friendsList.map(async friend => {
        const canInvite = await this.canUserInviteUser(userId, friend.id);

        if (!canInvite.canInvite) {
          return {
            ...friend,
            unavailable: true,
            reason: canInvite.reason,
            relationshipType: canInvite.relationshipType,
            busyType: canInvite.busyType,
            details: canInvite.details,
            friendlyReason: this._getFriendlyReason(canInvite),
          };
        }
        return null;
      });

      const results = await Promise.all(checkPromises);

      // Filtrer les résultats non-null
      results.forEach(result => {
        if (result) {
          unavailableFriends.push(result);
        }
      });

      debugLog(
        `🔍 [RelationshipService] ✅ ${unavailableFriends.length}/${friendsList.length} amis indisponibles`
      );
      return unavailableFriends;
    } catch (error) {
      prodError(
        '❌ [RelationshipService] Erreur calcul amis indisponibles:',
        error
      );
      return [];
    }
  }

  /**
   * Valide une liste de destinataires pour invitation multiple
   * @param {string} fromUserId - Expéditeur
   * @param {Array} recipientIds - IDs des destinataires
   * @returns {Promise<Object>} - { valid, invalid, reasons }
   */
  static async validateInvitationRecipients(fromUserId, recipientIds) {
    if (!recipientIds?.length) {
      return { valid: [], invalid: [], reasons: {} };
    }

    try {
      debugLog(
        `🔍 [RelationshipService] Validation ${recipientIds.length} destinataires`
      );

      const valid = [];
      const invalid = [];
      const reasons = {};

      // Vérifier chaque destinataire
      const validationPromises = recipientIds.map(async recipientId => {
        const validation = await this.canUserInviteUser(
          fromUserId,
          recipientId
        );

        if (validation.canInvite) {
          valid.push(recipientId);
        } else {
          invalid.push(recipientId);
          reasons[recipientId] = {
            reason: validation.reason,
            friendlyMessage: this._getFriendlyReason(validation),
            details: validation.details,
          };
        }
      });

      await Promise.all(validationPromises);

      debugLog(
        `🔍 [RelationshipService] ✅ Validation: ${valid.length} valides, ${invalid.length} invalides`
      );

      return { valid, invalid, reasons };
    } catch (error) {
      prodError(
        '❌ [RelationshipService] Erreur validation destinataires:',
        error
      );
      return { valid: [], invalid: recipientIds, reasons: {} };
    }
  }

  // ===========================
  // MÉTHODES PRIVÉES
  // ===========================

  /**
   * Vérifie les invitations pending entre deux utilisateurs
   * @private
   */
  static async _checkPendingInvitations(userId1, userId2) {
    try {
      // Invitations dans les deux sens
      const queries = [
        // userId1 → userId2 (legacy)
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('status', '==', 'pending'),
          limit(1)
        ),
        // userId2 → userId1 (legacy)
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('status', '==', 'pending'),
          limit(1)
        ),
        // Invitations multiples contenant les deux
        query(
          collection(db, 'invitations'),
          where('toUserIds', 'array-contains', userId1),
          where('status', '==', 'pending'),
          limit(5)
        ),
        query(
          collection(db, 'invitations'),
          where('toUserIds', 'array-contains', userId2),
          where('status', '==', 'pending'),
          limit(5)
        ),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));

      // Analyser les résultats
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];

        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            const data = doc.data();

            // Vérifier si c'est bien une relation entre nos deux utilisateurs
            if (i < 2) {
              // Legacy queries
              return {
                hasRelation: true,
                type: 'pending_invitation',
                details: {
                  invitationId: doc.id,
                  from: data.fromUserId,
                  to: data.toUserId,
                  activity: data.activity,
                  direction: i === 0 ? 'outgoing' : 'incoming',
                },
              };
            } else {
              // Multiple queries
              if (
                data.toUserIds?.includes(userId1) &&
                data.toUserIds?.includes(userId2)
              ) {
                return {
                  hasRelation: true,
                  type: 'multiple_invitation',
                  details: {
                    invitationId: doc.id,
                    from: data.fromUserId,
                    recipients: data.toUserIds,
                    activity: data.activity,
                  },
                };
              }
            }
          });
        }
      }

      return { hasRelation: false };
    } catch (error) {
      prodError('❌ Erreur vérification invitations pending:', error);
      return { hasRelation: false };
    }
  }

  /**
   * Vérifie le partage de localisation entre deux utilisateurs
   * @private
   */
  static async _checkLocationSharing(userId1, userId2) {
    try {
      // Vérifier si les deux utilisateurs partagent leur localisation
      const availabilityQuery = query(
        collection(db, 'availabilities'),
        where('userId', 'in', [userId1, userId2]),
        where('isAvailable', '==', true),
        where('locationShared', '==', true)
      );

      const snapshot = await getDocs(availabilityQuery);

      if (snapshot.size >= 2) {
        // Les deux partagent - vérifier s'ils sont dans le même événement
        const activities = [];
        snapshot.forEach(doc => {
          activities.push({ userId: doc.data().userId, data: doc.data() });
        });

        // Si même activité et même timeframe → relation active
        const user1Activity = activities.find(a => a.userId === userId1);
        const user2Activity = activities.find(a => a.userId === userId2);

        if (user1Activity && user2Activity) {
          return {
            hasRelation: true,
            type: 'location_sharing',
            details: {
              activity: user1Activity.data.activity,
              both_sharing: true,
              user1_availability: user1Activity.data,
              user2_availability: user2Activity.data,
            },
          };
        }
      }

      return { hasRelation: false };
    } catch (error) {
      prodError('❌ Erreur vérification partage localisation:', error);
      return { hasRelation: false };
    }
  }

  /**
   * Vérifie la disponibilité partagée commune
   * @private
   */
  static async _checkSharedAvailability(userId1, userId2) {
    // Pour l'instant, considérons que le partage de localisation couvre ce cas
    // Peut être étendu plus tard pour d'autres types de disponibilité partagée
    return { hasRelation: false };
  }

  /**
   * Vérifie le statut d'occupation d'un utilisateur
   * @private
   */
  static async _getUserBusyStatus(userId) {
    try {
      // 1. Vérifier invitations pending envoyées
      const sentInvitationsQuery = query(
        collection(db, 'invitations'),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        limit(5)
      );

      // 2. Vérifier invitations pending reçues
      const receivedInvitationsQuery = query(
        collection(db, 'invitations'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        limit(5)
      );

      // 3. Vérifier invitations multiples
      const multipleInvitationsQuery = query(
        collection(db, 'invitations'),
        where('toUserIds', 'array-contains', userId),
        where('status', '==', 'pending'),
        limit(5)
      );

      // 4. Vérifier partage de localisation
      const locationSharingQuery = query(
        collection(db, 'availabilities'),
        where('userId', '==', userId),
        where('isAvailable', '==', true),
        where('locationShared', '==', true),
        limit(1)
      );

      const [sentSnap, receivedSnap, multipleSnap, locationSnap] =
        await Promise.all([
          getDocs(sentInvitationsQuery),
          getDocs(receivedInvitationsQuery),
          getDocs(multipleInvitationsQuery),
          getDocs(locationSharingQuery),
        ]);

      // Analyser les résultats par priorité

      // Priorité 1: Partage de localisation actif
      if (!locationSnap.empty) {
        const locationData = locationSnap.docs[0].data();
        return {
          isBusy: true,
          type: 'location_sharing',
          details: {
            activity: locationData.activity,
            availabilityId: locationSnap.docs[0].id,
          },
        };
      }

      // Priorité 2: Invitations reçues
      if (!receivedSnap.empty || !multipleSnap.empty) {
        return {
          isBusy: true,
          type: 'pending_invitations_received',
          details: {
            receivedCount: receivedSnap.size,
            multipleCount: multipleSnap.size,
          },
        };
      }

      // Priorité 3: Invitations envoyées (moins bloquant)
      if (!sentSnap.empty) {
        return {
          isBusy: true,
          type: 'pending_invitations_sent',
          details: {
            sentCount: sentSnap.size,
          },
        };
      }

      return { isBusy: false, type: null };
    } catch (error) {
      prodError('❌ Erreur vérification statut utilisateur:', error);
      return { isBusy: false, type: 'error' };
    }
  }

  /**
   * Convertit une raison technique en message utilisateur
   * @private
   */
  static _getFriendlyReason(validation) {
    const reasonMessages = {
      active_relationship: 'Relation active en cours',
      target_busy: 'Ami déjà occupé',
      sender_in_activity: 'Vous êtes en activité',
      pending_invitation: 'Invitation en attente',
      location_sharing: 'Partage de localisation actif',
      multiple_invitation: 'Invitation multiple en cours',
      error: 'Erreur de validation',
    };

    const baseReason = reasonMessages[validation.reason] || 'Indisponible';

    // Ajouter des détails selon le type
    if (validation.relationshipType) {
      return `${baseReason} (${validation.relationshipType})`;
    }

    if (validation.busyType) {
      return `${baseReason} (${validation.busyType})`;
    }

    return baseReason;
  }
}
