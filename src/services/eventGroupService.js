/**
 * Service de gestion des groupes d'événements
 * Phase 2 - Task 2.2: EventGroupService
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  canGroupAcceptMember,
  createDefaultGroup,
  EVENT_CONSTANTS,
  getGroupProgress,
  getGroupSizeColor,
  getGroupSizeMessage,
  GroupEventType,
  GroupMemberStatus,
  isGroupSize,
  validateGroupStructure,
} from '../types/eventTypes';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline, retryWithBackoff } from './firebaseUtils';

export class EventGroupService {
  // ===========================
  // GESTION DES GROUPES
  // ===========================

  /**
   * Crée un nouveau groupe d'événement
   * @param {string} eventId - ID de l'événement
   * @param {string} creatorId - ID du créateur
   * @param {Array} initialMembers - Membres initiaux (incluant le créateur)
   * @param {string} activity - Type d'activité
   * @returns {Promise<Object>} Groupe créé
   */
  static async createGroup(
    eventId,
    creatorId,
    initialMembers = [],
    activity = ''
  ) {
    try {
      debugLog('🏗️ [EventGroupService] Création groupe:', {
        eventId,
        creatorId,
        activity,
      });

      if (!isOnline()) {
        throw new Error('Création de groupe impossible hors ligne');
      }

      // Validation des paramètres
      if (!eventId || !creatorId) {
        throw new Error('EventID et CreatorID requis');
      }

      if (!initialMembers.includes(creatorId)) {
        initialMembers.unshift(creatorId);
      }

      // Vérifier la limite de taille
      if (initialMembers.length > EVENT_CONSTANTS.MAX_GROUP_SIZE) {
        throw new Error(
          `Trop de membres (max ${EVENT_CONSTANTS.MAX_GROUP_SIZE})`
        );
      }

      // Créer le modèle de groupe
      const groupData = createDefaultGroup(eventId, creatorId, activity);
      groupData.members = [...new Set(initialMembers)]; // Supprime les doublons

      // Validation finale
      const validation = validateGroupStructure(groupData);
      if (!validation.valid) {
        throw new Error(`Groupe invalide: ${validation.error}`);
      }

      // Sauvegarder en base
      const groupRef = await retryWithBackoff(async () => {
        return await addDoc(collection(db, 'event_groups'), {
          ...groupData,
          createdAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
        });
      });

      // Mettre à jour l'ID avec celui généré par Firestore
      groupData.id = groupRef.id;
      await retryWithBackoff(async () => {
        await updateDoc(groupRef, { id: groupRef.id });
      });

      // Logger l'événement de création
      await this.logGroupEvent(groupData.id, GroupEventType.CREATED, {
        createdBy: creatorId,
        initialMemberCount: groupData.members.length,
        activity,
      });

      debugLog('✅ [EventGroupService] Groupe créé:', groupData);
      return groupData;
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur création groupe:', error);
      throw new Error(`Impossible de créer le groupe: ${error.message}`);
    }
  }

  /**
   * Ajoute un membre à un groupe existant
   * @param {string} groupId - ID du groupe
   * @param {string} userId - ID de l'utilisateur à ajouter
   * @returns {Promise<Object>} Groupe mis à jour
   */
  static async addMemberToGroup(groupId, userId) {
    try {
      debugLog('👥 [EventGroupService] Ajout membre au groupe:', {
        groupId,
        userId,
      });

      if (!isOnline()) {
        throw new Error('Ajout de membre impossible hors ligne');
      }

      if (!groupId || !userId) {
        throw new Error('GroupID et UserID requis');
      }

      const groupRef = doc(db, 'event_groups', groupId);
      const groupSnap = await retryWithBackoff(async () => {
        return await getDoc(groupRef);
      });

      if (!groupSnap.exists()) {
        throw new Error('Groupe non trouvé');
      }

      const groupData = groupSnap.data();

      // Vérifications
      if (!groupData.isActive) {
        throw new Error("Le groupe n'est plus actif");
      }

      if (groupData.members.includes(userId)) {
        throw new Error("L'utilisateur est déjà membre du groupe");
      }

      if (!canGroupAcceptMember(groupData.members.length)) {
        throw new Error('Le groupe est complet');
      }

      // Ajouter le membre
      const updatedMembers = [...groupData.members, userId];

      await retryWithBackoff(async () => {
        await updateDoc(groupRef, {
          members: updatedMembers,
          lastActivity: serverTimestamp(),
        });
      });

      // Logger l'événement
      await this.logGroupEvent(groupId, GroupEventType.MEMBER_JOINED, {
        userId,
        newMemberCount: updatedMembers.length,
      });

      const updatedGroup = { ...groupData, members: updatedMembers };
      debugLog('✅ [EventGroupService] Membre ajouté:', updatedGroup);
      return updatedGroup;
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur ajout membre:', error);
      throw new Error(`Impossible d'ajouter le membre: ${error.message}`);
    }
  }

  /**
   * Retire un membre d'un groupe
   * @param {string} groupId - ID du groupe
   * @param {string} userId - ID de l'utilisateur à retirer
   * @returns {Promise<Object>} Groupe mis à jour ou null si supprimé
   */
  static async removeMemberFromGroup(groupId, userId) {
    try {
      debugLog('👋 [EventGroupService] Retrait membre du groupe:', {
        groupId,
        userId,
      });

      if (!isOnline()) {
        throw new Error('Retrait de membre impossible hors ligne');
      }

      const groupRef = doc(db, 'event_groups', groupId);
      const groupSnap = await retryWithBackoff(async () => {
        return await getDoc(groupRef);
      });

      if (!groupSnap.exists()) {
        throw new Error('Groupe non trouvé');
      }

      const groupData = groupSnap.data();

      if (!groupData.members.includes(userId)) {
        throw new Error("L'utilisateur n'est pas membre du groupe");
      }

      // Retirer le membre
      const updatedMembers = groupData.members.filter(id => id !== userId);

      // Si c'était le dernier membre, supprimer le groupe
      if (updatedMembers.length === 0) {
        await retryWithBackoff(async () => {
          await deleteDoc(groupRef);
        });

        await this.logGroupEvent(groupId, GroupEventType.GROUP_ENDED, {
          reason: 'Dernier membre parti',
          lastMember: userId,
        });

        debugLog('🗑️ [EventGroupService] Groupe supprimé (plus de membres)');
        return null;
      }

      // Si le créateur part, désigner un nouveau créateur
      let newCreatedBy = groupData.createdBy;
      if (groupData.createdBy === userId) {
        newCreatedBy = updatedMembers[0]; // Premier membre restant devient créateur
      }

      await retryWithBackoff(async () => {
        await updateDoc(groupRef, {
          members: updatedMembers,
          createdBy: newCreatedBy,
          lastActivity: serverTimestamp(),
        });
      });

      // Logger l'événement
      await this.logGroupEvent(groupId, GroupEventType.MEMBER_LEFT, {
        userId,
        newMemberCount: updatedMembers.length,
        newCreator: newCreatedBy !== groupData.createdBy ? newCreatedBy : null,
      });

      const updatedGroup = {
        ...groupData,
        members: updatedMembers,
        createdBy: newCreatedBy,
      };

      debugLog('✅ [EventGroupService] Membre retiré:', updatedGroup);
      return updatedGroup;
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur retrait membre:', error);
      throw new Error(`Impossible de retirer le membre: ${error.message}`);
    }
  }

  /**
   * Obtient les membres d'un groupe avec leurs informations
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Array>} Liste des membres avec statuts
   */
  static async getGroupMembers(groupId) {
    try {
      debugLog('👥 [EventGroupService] Récupération membres groupe:', groupId);

      if (!groupId) {
        throw new Error('GroupID requis');
      }

      const groupRef = doc(db, 'event_groups', groupId);
      const groupSnap = await retryWithBackoff(async () => {
        return await getDoc(groupRef);
      });

      if (!groupSnap.exists()) {
        if (isOnline()) {
          throw new Error('Groupe non trouvé');
        }
        // Mode offline: retourner liste vide
        return [];
      }

      const groupData = groupSnap.data();
      const memberIds = groupData.members || [];

      // Récupérer les informations des membres
      const membersInfo = await Promise.all(
        memberIds.map(async memberId => {
          try {
            const userRef = doc(db, 'users', memberId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                userId: memberId,
                name: userData.name || 'Utilisateur',
                avatar: userData.avatar || '👤',
                isOnline: userData.isOnline || false,
                status: userData.isOnline
                  ? GroupMemberStatus.ACTIVE
                  : GroupMemberStatus.OFFLINE,
                isCreator: memberId === groupData.createdBy,
                joinedAt: groupData.createdAt, // Simplifié pour le moment
              };
            } else {
              return {
                userId: memberId,
                name: 'Utilisateur inconnu',
                avatar: '❓',
                isOnline: false,
                status: GroupMemberStatus.OFFLINE,
                isCreator: memberId === groupData.createdBy,
                joinedAt: groupData.createdAt,
              };
            }
          } catch (error) {
            debugLog(
              '⚠️ [EventGroupService] Erreur récupération membre:',
              memberId,
              error
            );
            return {
              userId: memberId,
              name: 'Erreur',
              avatar: '⚠️',
              isOnline: false,
              status: GroupMemberStatus.OFFLINE,
              isCreator: false,
              joinedAt: null,
            };
          }
        })
      );

      debugLog('✅ [EventGroupService] Membres récupérés:', membersInfo);
      return membersInfo;
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur récupération membres:', error);
      if (!isOnline()) {
        return []; // Fallback offline
      }
      throw new Error(`Impossible de récupérer les membres: ${error.message}`);
    }
  }

  /**
   * Vérifie si un groupe est plein
   * @param {string} groupId - ID du groupe
   * @returns {Promise<boolean>} True si le groupe est plein
   */
  static async isGroupFull(groupId) {
    try {
      if (!groupId) return false;

      const groupRef = doc(db, 'event_groups', groupId);
      const groupSnap = await retryWithBackoff(async () => {
        return await getDoc(groupRef);
      });

      if (!groupSnap.exists()) return true; // Considérer comme plein si non trouvé

      const groupData = groupSnap.data();
      return groupData.members.length >= EVENT_CONSTANTS.MAX_GROUP_SIZE;
    } catch (error) {
      debugLog(
        '⚠️ [EventGroupService] Erreur vérification groupe plein:',
        error
      );
      return true; // Considérer comme plein en cas d'erreur
    }
  }

  /**
   * Obtient les informations complètes d'un groupe
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Object>} Informations du groupe
   */
  static async getGroupInfo(groupId) {
    try {
      debugLog('📊 [EventGroupService] Récupération info groupe:', groupId);

      if (!groupId) {
        throw new Error('GroupID requis');
      }

      const groupRef = doc(db, 'event_groups', groupId);
      const groupSnap = await retryWithBackoff(async () => {
        return await getDoc(groupRef);
      });

      if (!groupSnap.exists()) {
        throw new Error('Groupe non trouvé');
      }

      const groupData = groupSnap.data();
      const members = await this.getGroupMembers(groupId);

      const groupInfo = {
        ...groupData,
        membersInfo: members,
        memberCount: groupData.members.length,
        isGroup: isGroupSize(groupData.members.length),
        isFull: groupData.members.length >= EVENT_CONSTANTS.MAX_GROUP_SIZE,
        progress: getGroupProgress(groupData.members.length),
        sizeMessage: getGroupSizeMessage(groupData.members.length),
        sizeColor: getGroupSizeColor(groupData.members.length),
        canAcceptMembers: canGroupAcceptMember(groupData.members.length),
      };

      debugLog('✅ [EventGroupService] Info groupe récupérées:', groupInfo);
      return groupInfo;
    } catch (error) {
      prodError(
        '❌ [EventGroupService] Erreur récupération info groupe:',
        error
      );
      throw new Error(
        `Impossible de récupérer les informations du groupe: ${error.message}`
      );
    }
  }

  // ===========================
  // UTILITAIRES ET LOGS
  // ===========================

  /**
   * Log un événement de groupe pour l'historique
   * @param {string} groupId - ID du groupe
   * @param {string} eventType - Type d'événement
   * @param {Object} eventData - Données de l'événement
   */
  static async logGroupEvent(groupId, eventType, eventData = {}) {
    try {
      if (!isOnline()) return; // Pas de log offline

      await addDoc(collection(db, 'group_events'), {
        groupId,
        eventType,
        eventData,
        timestamp: serverTimestamp(),
      });

      debugLog('📝 [EventGroupService] Événement loggé:', {
        groupId,
        eventType,
        eventData,
      });
    } catch (error) {
      debugLog('⚠️ [EventGroupService] Erreur log événement:', error);
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Nettoie les groupes inactifs
   * @returns {Promise<number>} Nombre de groupes nettoyés
   */
  static async cleanupInactiveGroups() {
    try {
      debugLog('🧹 [EventGroupService] Nettoyage groupes inactifs');

      if (!isOnline()) {
        debugLog('⚠️ [EventGroupService] Nettoyage impossible hors ligne');
        return 0;
      }

      const cutoffTime = new Date();
      cutoffTime.setHours(
        cutoffTime.getHours() - EVENT_CONSTANTS.GROUP_CLEANUP_HOURS
      );

      const groupsQuery = query(
        collection(db, 'event_groups'),
        where('lastActivity', '<', cutoffTime),
        where('isActive', '==', true)
      );

      const groupsSnap = await getDocs(groupsQuery);
      let cleanedCount = 0;

      for (const groupDoc of groupsSnap.docs) {
        await updateDoc(groupDoc.ref, {
          isActive: false,
          lastActivity: serverTimestamp(),
        });

        await this.logGroupEvent(groupDoc.id, GroupEventType.GROUP_ENDED, {
          reason: 'Inactivité prolongée',
          cleanupTime: new Date().toISOString(),
        });

        cleanedCount++;
      }

      debugLog(`✅ [EventGroupService] ${cleanedCount} groupes nettoyés`);
      return cleanedCount;
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur nettoyage:', error);
      return 0;
    }
  }

  /**
   * Écoute les changements en temps réel d'un groupe
   * @param {string} groupId - ID du groupe
   * @param {Function} callback - Callback appelé lors des changements
   * @returns {Function} Fonction de désabonnement
   */
  static subscribeToGroupChanges(groupId, callback) {
    try {
      if (!groupId || typeof callback !== 'function') {
        throw new Error('GroupID et callback requis');
      }

      const groupRef = doc(db, 'event_groups', groupId);

      return onSnapshot(
        groupRef,
        docSnap => {
          if (docSnap.exists()) {
            const groupData = docSnap.data();
            callback(groupData);
          } else {
            callback(null); // Groupe supprimé
          }
        },
        error => {
          prodError('❌ [EventGroupService] Erreur subscription:', error);
          callback(null);
        }
      );
    } catch (error) {
      prodError('❌ [EventGroupService] Erreur setup subscription:', error);
      return () => {}; // Fonction vide de désabonnement
    }
  }
}
