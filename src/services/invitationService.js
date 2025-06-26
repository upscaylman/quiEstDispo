// Service de gestion des invitations
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline, retryWithBackoff } from './firebaseUtils';
import { NotificationService } from './notificationService';

export class InvitationService {
  /**
   * 🧹 Nettoyage rapide des invitations obsolètes (>24h)
   */
  static async quickCleanupOldInvitations() {
    if (!isOnline() || process.env.NODE_ENV !== 'development') {
      return { cleaned: 0 };
    }

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24);

      const oldQuery = query(
        collection(db, 'invitations'),
        where('createdAt', '<', cutoffTime)
      );

      const snapshot = await getDocs(oldQuery);
      if (snapshot.empty) return { cleaned: 0 };

      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      debugLog(
        `🧹 [QuickCleanup] ${snapshot.size} invitations obsolètes supprimées`
      );

      return { cleaned: snapshot.size };
    } catch (error) {
      prodError('❌ [QuickCleanup] Erreur:', error);
      return { cleaned: 0 };
    }
  }

  // Vérifier s'il existe une invitation en cours
  static async checkExistingInvitation(userId1, userId2, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot check existing invitations');
      return false;
    }

    try {
      console.log(
        `🔍 [DEBUG] Vérification invitation PENDING: ${userId1} <-> ${userId2} pour ${activity}`
      );

      // 🧹 CLEANUP: Nettoyer seulement les invitations vraiment expirées (pas les actives récentes)
      console.log(
        `🧹 [CLEANUP] Nettoyage des invitations expirées pour ${userId1} <-> ${userId2}`
      );
      await this.cleanupExpiredInvitationsOnly(userId1, userId2, activity);

      // Maintenant re-vérifier après nettoyage - DANS LES DEUX SENS
      // Vérifier les invitations PENDING (qui bloquent)
      const pendingQuery1 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity),
          where('status', '==', 'pending')
        )
      );

      const pendingQuery2 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity),
          where('status', '==', 'pending')
        )
      );

      // Vérifier aussi les invitations ACCEPTED récentes (relation bilatérale active)
      const acceptedQuery1 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity),
          where('status', '==', 'accepted')
        )
      );

      const acceptedQuery2 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity),
          where('status', '==', 'accepted')
        )
      );

      const totalPending = pendingQuery1.size + pendingQuery2.size;
      const totalAccepted = acceptedQuery1.size + acceptedQuery2.size;

      console.log(
        `🔍 [DEBUG] Après nettoyage: ${totalPending} pending, ${totalAccepted} accepted`
      );

      if (totalPending > 0) {
        console.log(`🔍 [DEBUG] ⚠️ BLOCKED: invitation PENDING existe déjà`);
        return true; // true = invitation active = BLOQUER
      } else if (totalAccepted > 0) {
        console.log(
          `🔍 [DEBUG] ⚠️ BLOCKED: relation bilatérale ACCEPTED active`
        );
        return true; // true = relation bilatérale = BLOQUER aussi
      } else {
        console.log(
          `🔍 [DEBUG] ✅ AUTORISÉ: aucune invitation/relation active`
        );
        return false; // false = pas d'invitation active = AUTORISER
      }
    } catch (error) {
      console.error('❌ Erreur vérification invitation existante:', error);
      return false; // En cas d'erreur, autoriser l'invitation
    }
  }

  // Nettoyer SEULEMENT les invitations vraiment expirées (pas les actives récentes)
  static async cleanupExpiredInvitationsOnly(userId1, userId2, activity) {
    if (!isOnline()) return;

    try {
      console.log(`🧹 [EXPIRED ONLY] === DÉBUT NETTOYAGE EXPIRÉ SEULEMENT ===`);
      console.log(
        `🧹 [EXPIRED ONLY] Nettoyage expiré ${userId1} <-> ${userId2} pour ${activity}`
      );

      const cutoffTime = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes
      console.log(`🧹 [EXPIRED ONLY] Cutoff time: ${cutoffTime.toISOString()}`);

      // Chercher toutes les invitations pour cette activité entre ces 2 utilisateurs
      const oldInvitationsQuery1 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity)
        )
      );

      const oldInvitationsQuery2 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity)
        )
      );

      console.log(
        `🧹 [EXPIRED ONLY] Invitations trouvées ${userId1}->${userId2}: ${oldInvitationsQuery1.size}`
      );
      console.log(
        `🧹 [EXPIRED ONLY] Invitations trouvées ${userId2}->${userId1}: ${oldInvitationsQuery2.size}`
      );

      const deletePromises = [];
      let deletedCount = 0;
      let keptCount = 0;

      [...oldInvitationsQuery1.docs, ...oldInvitationsQuery2.docs].forEach(
        doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          const isOld = createdAt <= cutoffTime;
          const status = data.status;

          console.log(
            `🧹 [EXPIRED ONLY] Analyse invitation ${doc.id}: créée ${createdAt.toISOString()}, status: ${status}, expirée: ${isOld}`
          );

          // SUPPRIMER SEULEMENT si : vraiment expiré (>45min) ET (declined/expired) OU si accepted (pas utile de garder)
          // GARDER les invitations pending récentes et les accepted récentes (pour les relations bilatérales)
          if (isOld && ['declined', 'expired'].includes(status)) {
            console.log(
              `🧹 [EXPIRED ONLY] ✅ SUPPRESSION invitation expirée: ${doc.id} (${status})`
            );
            deletePromises.push(deleteDoc(doc.ref));
            deletedCount++;
          } else if (status === 'accepted' && isOld) {
            // Garder les accepted récentes mais supprimer les très anciennes
            const veryOldCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 heures
            if (createdAt <= veryOldCutoff) {
              console.log(
                `🧹 [EXPIRED ONLY] ✅ SUPPRESSION invitation accepted très ancienne: ${doc.id}`
              );
              deletePromises.push(deleteDoc(doc.ref));
              deletedCount++;
            } else {
              console.log(
                `🧹 [EXPIRED ONLY] ⚠️ CONSERVATION invitation accepted récente: ${doc.id}`
              );
              keptCount++;
            }
          } else {
            console.log(
              `🧹 [EXPIRED ONLY] ⚠️ CONSERVATION invitation: ${doc.id} (${status}, ${isOld ? 'ancienne' : 'récente'})`
            );
            keptCount++;
          }
        }
      );

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🧹 [EXPIRED ONLY] ✅ ${deletedCount} invitation(s) expirée(s) supprimée(s), ${keptCount} conservée(s)`
        );
      } else {
        console.log(
          `🧹 [EXPIRED ONLY] ℹ️ Aucune invitation expirée à supprimer (${keptCount} conservées)`
        );
      }

      console.log(`🧹 [EXPIRED ONLY] === FIN NETTOYAGE EXPIRÉ SEULEMENT ===`);
    } catch (error) {
      console.error('❌ Erreur nettoyage invitations expirées:', error);
      // Ne pas faire échouer la vérification si le nettoyage échoue
    }
  }

  // Nettoyer les anciennes invitations
  static async cleanupOldInvitations(userId1, userId2, activity) {
    if (!isOnline()) return;

    try {
      console.log(`🧹 [DEBUG] === DÉBUT NETTOYAGE ===`);
      console.log(
        `🧹 [DEBUG] Nettoyage ${userId1} <-> ${userId2} pour ${activity}`
      );

      const cutoffTime = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes (même durée que les availabilities)
      console.log(`🧹 [DEBUG] Cutoff time: ${cutoffTime.toISOString()}`);

      // Chercher toutes les invitations pour cette activité entre ces 2 utilisateurs
      const oldInvitationsQuery1 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity)
        )
      );

      const oldInvitationsQuery2 = await getDocs(
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity)
        )
      );

      console.log(
        `🧹 [DEBUG] Invitations trouvées ${userId1}->${userId2}: ${oldInvitationsQuery1.size}`
      );
      console.log(
        `🧹 [DEBUG] Invitations trouvées ${userId2}->${userId1}: ${oldInvitationsQuery2.size}`
      );

      const deletePromises = [];
      let deletedCount = 0;
      let keptCount = 0;

      [...oldInvitationsQuery1.docs, ...oldInvitationsQuery2.docs].forEach(
        doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          const isOld = createdAt <= cutoffTime;
          const status = data.status;

          console.log(
            `🧹 [DEBUG] Analyse invitation ${doc.id}: créée ${createdAt.toISOString()}, status: ${status}, ancienne: ${isOld}`
          );

          // SUPPRIMER si : ancien OU déjà répondu (declined/accepted/expired)
          if (isOld || ['accepted', 'declined', 'expired'].includes(status)) {
            console.log(
              `🧹 [DEBUG] ✅ SUPPRESSION invitation: ${doc.id} (${isOld ? 'ancienne' : status})`
            );
            deletePromises.push(deleteDoc(doc.ref));
            deletedCount++;
          } else {
            console.log(
              `🧹 [DEBUG] ⚠️ CONSERVATION invitation: ${doc.id} (récente, ${status})`
            );
            keptCount++;
          }
        }
      );

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🧹 [DEBUG] ✅ ${deletedCount} invitation(s) supprimée(s), ${keptCount} conservée(s)`
        );
      } else {
        console.log(
          `🧹 [DEBUG] ℹ️ Aucune invitation à supprimer (${keptCount} conservées)`
        );
      }

      console.log(`🧹 [DEBUG] === FIN NETTOYAGE ===`);
    } catch (error) {
      console.error('❌ Erreur nettoyage invitations:', error);
      // Ne pas faire échouer la vérification si le nettoyage échoue
    }
  }

  // Envoyer des invitations à plusieurs amis pour une activité
  static async sendInvitations(fromUserId, activity, friendIds, location) {
    try {
      console.log(`🔥 [INVITATION SERVICE] === DÉBUT ENVOI INVITATIONS ===`);
      console.log(`🔥 [INVITATION SERVICE] Paramètres:`, {
        fromUserId,
        activity,
        friendIds,
        location,
      });

      debugLog(`🔍 [DEBUG] === DÉBUT ENVOI INVITATIONS ===`);
      debugLog(
        `🔍 [DEBUG] sendInvitations appelé: ${fromUserId} -> [${friendIds.join(', ')}] pour ${activity}`
      );

      console.log(
        `📨 Envoi d'invitations ${activity} à ${friendIds.length} amis`
      );

      if (!isOnline()) {
        throw new Error('Connexion requise pour envoyer des invitations');
      }

      const batch = [];
      const invitationTime = new Date();

      console.log(`🔍 [DEBUG] Amis pour envoi:`, friendIds);
      console.log(
        `🔍 [DEBUG] Nombre d'invitations à envoyer: ${friendIds.length}`
      );

      // 🔥 PROTECTION ANTI-DOUBLON: Vérifier chaque ami individuellement
      let successCount = 0;
      let blockedCount = 0;

      for (const friendId of friendIds) {
        console.log(`🔥 [INVITATION SERVICE] Traitement ami ${friendId}...`);

        // 🔥 VÉRIFICATION STRICTE: Blocage total si invitation/relation active
        console.log(
          `🔥 [INVITATION SERVICE] Vérification anti-doublon pour ${friendId}...`
        );
        const isDuplicate = await this.checkExistingInvitation(
          fromUserId,
          friendId,
          activity
        );
        console.log(
          `🔥 [INVITATION SERVICE] Résultat anti-doublon: ${isDuplicate ? 'BLOQUÉ' : 'AUTORISÉ'}`
        );

        if (isDuplicate) {
          console.log(
            `🔥 [INVITATION SERVICE] ⚠️ BLOCKED: invitation/relation existe déjà pour ${friendId}`
          );
          debugLog(
            `🔍 [DEBUG] ⚠️ BLOCKED: invitation/relation existe déjà pour ${friendId}`
          );
          blockedCount++;
          continue; // Passer à l'ami suivant
        }
        console.log(
          `🔥 [INVITATION SERVICE] ✅ AUTORISÉ: aucune invitation/relation active pour ${friendId}`
        );
        debugLog(
          `🔍 [DEBUG] ✅ AUTORISÉ: aucune invitation/relation active pour ${friendId}`
        );

        // Créer une invitation
        const invitationData = {
          fromUserId,
          toUserId: friendId,
          activity,
          location,
          status: 'pending', // pending, accepted, declined, expired
          createdAt: serverTimestamp(),
          expiresAt: new Date(invitationTime.getTime() + 45 * 60 * 1000), // 45 minutes (cohérent avec availabilities)
        };

        // Ajouter l'invitation à la collection et récupérer l'ID
        const invitationRef = await addDoc(
          collection(db, 'invitations'),
          invitationData
        );

        console.log(
          `🔥 [INVITATION CRÉÉE] ID: ${invitationRef.id}, de: ${fromUserId}, à: ${friendId}, activité: ${activity}, status: pending`
        );

        // Créer une notification pour l'ami avec l'ID de l'invitation
        await NotificationService.createInvitationNotificationWithId(
          friendId,
          fromUserId,
          activity,
          invitationRef.id
        );

        console.log(
          `🔥 [INVITATION CRÉÉE] ✅ Notification envoyée pour invitation ${invitationRef.id}`
        );

        successCount++;
      }

      console.log(
        `✅ ${successCount} invitations envoyées pour ${activity} (${blockedCount} bloquées)`
      );

      // 🎯 NOUVEAU: Déclencher mise à jour statuts amis temps réel
      if (successCount > 0) {
        window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
        debugLog('📡 [INVITATION SERVICE] Événement friendsStatusUpdate émis');
      }

      return {
        success: true,
        count: successCount,
        blocked: blockedCount,
        totalRequested: friendIds.length,
      };
    } catch (error) {
      prodError('❌ Erreur envoi invitations:', error);
      throw new Error(
        `Erreur lors de l'envoi des invitations: ${error.message}`
      );
    }
  }

  // Répondre à une invitation - Compatible Legacy + Phase 3
  static async respondToInvitation(invitationId, userId, response) {
    if (!isOnline()) {
      throw new Error("Connexion requise pour répondre à l'invitation");
    }

    try {
      return await retryWithBackoff(async () => {
        const invitationRef = doc(db, 'invitations', invitationId);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
          throw new Error('Invitation non trouvée');
        }

        const invitationData = invitationSnap.data();
        debugLog(`🔧 [UNIFIED] Type d'invitation détecté:`, {
          hasToUserId: !!invitationData.toUserId,
          hasToUserIds: !!invitationData.toUserIds,
          isMultiple: invitationData.isMultipleInvitation || false,
        });

        // 🔧 DÉTECTION AUTOMATIQUE: Legacy vs Phase 3
        const isLegacyInvitation = !!invitationData.toUserId;
        const isMultipleInvitation = !!invitationData.toUserIds;

        // Vérifier l'autorisation selon le type
        if (isLegacyInvitation) {
          // Format legacy: toUserId (string)
          if (invitationData.toUserId !== userId) {
            throw new Error(
              "Vous n'êtes pas autorisé à répondre à cette invitation legacy"
            );
          }
        } else if (isMultipleInvitation) {
          // Format Phase 3: toUserIds (array)
          if (!invitationData.toUserIds.includes(userId)) {
            throw new Error(
              "Vous n'êtes pas autorisé à répondre à cette invitation multiple"
            );
          }
        } else {
          throw new Error("Format d'invitation non reconnu");
        }

        if (invitationData.status !== 'pending') {
          throw new Error('Cette invitation a déjà été traitée');
        }

        // 🔧 TRAITEMENT UNIFIÉ: Legacy vs Phase 3
        if (isLegacyInvitation) {
          // === TRAITEMENT LEGACY (SIMPLE) ===
          debugLog(`🔧 [LEGACY] Traitement invitation legacy pour ${userId}`);

          await updateDoc(invitationRef, {
            status: response,
            respondedAt: serverTimestamp(),
          });

          // Notification de réponse pour expéditeur (format legacy)
          await InvitationService.createResponseNotification(
            invitationData.fromUserId,
            userId,
            invitationData.activity,
            response === 'accepted'
          );

          debugLog(`✅ [LEGACY] Réponse ${response} enregistrée`);

          // 🎯 NOUVEAU: Déclencher mise à jour statuts amis temps réel
          window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
          debugLog(
            '📡 [INVITATION SERVICE] Événement friendsStatusUpdate émis (legacy response)'
          );
        } else if (isMultipleInvitation) {
          // === TRAITEMENT PHASE 3 (MULTIPLE) ===
          debugLog(`🔧 [PHASE3] Traitement invitation multiple pour ${userId}`);

          // Utiliser la méthode Phase 3 spécialisée
          return await this.respondToMultipleInvitation(
            invitationId,
            userId,
            response
          );
        }

        return response;
      });
    } catch (error) {
      prodError('❌ [UNIFIED] Respond to invitation failed:', error);
      throw new Error(
        `Impossible de répondre à l'invitation: ${error.message}`
      );
    }
  }

  // Nettoyer les invitations expirées
  static async cleanupExpiredInvitations() {
    if (!isOnline()) return;

    try {
      const now = new Date();
      const expiredInvitationsQuery = query(
        collection(db, 'invitations'),
        where('status', '==', 'pending'),
        orderBy('createdAt'),
        limit(100)
      );

      const expiredInvitations = await getDocs(expiredInvitationsQuery);

      const toDelete = expiredInvitations.docs.filter(doc => {
        const data = doc.data();
        const expiresAt =
          data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        return expiresAt < now;
      });

      if (toDelete.length > 0) {
        const deletePromises = toDelete.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        debugLog(`🧹 Supprimé ${toDelete.length} invitations expirées`);
        return toDelete.length;
      }
    } catch (error) {
      prodError('❌ Cleanup expired invitations error (non critique):', error);
      return 0;
    }
  }

  // Nettoyer les invitations entre deux utilisateurs
  static async cleanupInvitationsBetweenUsers(userId1, userId2, activity) {
    if (!isOnline()) return;

    try {
      console.log(
        `🧹 Nettoyage invitations entre ${userId1} et ${userId2} pour ${activity}`
      );

      const queries = [
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity)
        ),
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity)
        ),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const allInvitations = snapshots.flatMap(snapshot => snapshot.docs);

      if (allInvitations.length > 0) {
        const deletePromises = allInvitations.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`✅ ${allInvitations.length} invitations nettoyées`);
      }
    } catch (error) {
      console.warn('⚠️ Cleanup invitations error (non critique):', error);
    }
  }

  // Nettoyer les très anciennes invitations
  static async cleanupVeryOldInvitations(userId1, userId2, activity) {
    if (!isOnline()) return;

    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - 7); // Supprimer les invitations de plus d'une semaine

      const queries = [
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId1),
          where('toUserId', '==', userId2),
          where('activity', '==', activity)
        ),
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId2),
          where('toUserId', '==', userId1),
          where('activity', '==', activity)
        ),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const allInvitations = snapshots.flatMap(snapshot => snapshot.docs);

      const veryOldInvitations = allInvitations.filter(doc => {
        const data = doc.data();
        const createdAt =
          data.createdAt?.toDate?.() || new Date(data.createdAt);
        return createdAt < cutoffTime;
      });

      if (veryOldInvitations.length > 0) {
        const deletePromises = veryOldInvitations.map(doc =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        console.log(
          `🧹 Supprimé ${veryOldInvitations.length} très anciennes invitations`
        );
      }
    } catch (error) {
      console.warn(
        '⚠️ Cleanup very old invitations error (non critique):',
        error
      );
    }
  }

  // Nettoyer les invitations d'un utilisateur pour une activité
  static async cleanupUserInvitations(userId, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot cleanup user invitations');
      return;
    }

    try {
      debugLog(
        `🧹 Nettoyage des invitations pour ${userId} et activité ${activity}...`
      );

      const queries = [
        query(
          collection(db, 'invitations'),
          where('fromUserId', '==', userId),
          where('activity', '==', activity)
        ),
        query(
          collection(db, 'invitations'),
          where('toUserId', '==', userId),
          where('activity', '==', activity)
        ),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const allInvitations = snapshots.flatMap(snapshot => snapshot.docs);

      if (allInvitations.length > 0) {
        const deletePromises = allInvitations.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        debugLog(
          `✅ ${allInvitations.length} invitations supprimées pour ${userId} (${activity})`
        );
        return allInvitations.length;
      } else {
        debugLog(`ℹ️ Aucune invitation trouvée pour ${userId} (${activity})`);
        return 0;
      }
    } catch (error) {
      prodError('❌ Erreur nettoyage invitations utilisateur:', error);
      return 0;
    }
  }

  // Debug : nettoyer les invitations d'un utilisateur
  static async debugCleanupUserInvitations(userId) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        '⚠️ Cette fonction est disponible uniquement en développement'
      );
      return;
    }

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot cleanup user invitations');
      return;
    }

    try {
      console.log(`🧹 [DEBUG] Nettoyage invitations utilisateur ${userId}...`);

      const queries = [
        query(collection(db, 'invitations'), where('fromUserId', '==', userId)),
        query(collection(db, 'invitations'), where('toUserId', '==', userId)),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const allInvitations = snapshots.flatMap(snapshot => snapshot.docs);

      if (allInvitations.length > 0) {
        const deletePromises = allInvitations.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(
          `✅ [DEBUG] ${allInvitations.length} invitations supprimées pour ${userId}`
        );
      } else {
        console.log(`ℹ️ [DEBUG] Aucune invitation trouvée pour ${userId}`);
      }
    } catch (error) {
      console.error(
        '❌ [DEBUG] Erreur nettoyage invitations utilisateur:',
        error
      );
    }
  }

  // Récupérer les invitations pour un utilisateur (reçues) - Compatible Phase 1-3
  static async getInvitationsForUser(userId) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour récupérer les invitations');
    }

    try {
      debugLog(
        `🔍 [LEGACY+PHASE3] Récupération des invitations pour l'utilisateur ${userId}...`
      );

      // 🔧 CORRECTION RÉGRESSION: Récupérer les deux formats d'invitations
      // Format legacy: toUserId (string) - Phase 1/2
      const legacyQuery = query(
        collection(db, 'invitations'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      // Format Phase 3: toUserIds (array) - Invitations multiples
      const multipleQuery = query(
        collection(db, 'invitations'),
        where('toUserIds', 'array-contains', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      // Exécuter les deux requêtes en parallèle
      const [legacySnapshot, multipleSnapshot] = await Promise.all([
        getDocs(legacyQuery),
        getDocs(multipleQuery),
      ]);

      const invitations = [];

      // Traiter les invitations legacy (toUserId)
      legacySnapshot.forEach(doc => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
          // Marquer comme invitation legacy
          isLegacyInvitation: true,
          invitationType: 'legacy',
        });
      });

      // Traiter les invitations multiples (toUserIds)
      multipleSnapshot.forEach(doc => {
        const data = doc.data();

        // Éviter les doublons si une invitation existe dans les deux formats
        const alreadyExists = invitations.some(inv => inv.id === doc.id);
        if (!alreadyExists) {
          invitations.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
            // Marquer comme invitation multiple
            isLegacyInvitation: false,
            invitationType: 'multiple',
            // Ajouter des informations calculées pour Phase 3
            hasUserResponded:
              (data.acceptedByUserIds || []).includes(userId) ||
              (data.declinedByUserIds || []).includes(userId),
            acceptanceRate: data.totalRecipients
              ? (data.acceptedByUserIds || []).length / data.totalRecipients
              : 0,
            timeRemaining: this._getTimeRemaining(data.expiresAt),
          });
        }
      });

      // Trier par date de création (plus récentes en premier)
      invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      debugLog(
        `✅ [LEGACY+PHASE3] ${invitations.length} invitations récupérées pour ${userId} (${legacySnapshot.size} legacy + ${multipleSnapshot.size} multiples)`
      );

      return invitations;
    } catch (error) {
      prodError('❌ Erreur lors de la récupération des invitations:', error);
      return [];
    }
  }

  // Créer une notification de réponse à une invitation
  static async createResponseNotification(
    toUserId,
    fromUserId,
    activity,
    accepted
  ) {
    try {
      const fromUser = await getDoc(doc(db, 'users', fromUserId));
      const fromUserName = fromUser.exists() ? fromUser.data().name : 'Un ami';

      const activities = {
        coffee: 'Coffee',
        lunch: 'Lunch',
        drinks: 'Drinks',
        chill: 'Chill',
        clubbing: 'Clubbing',
        cinema: 'Cinema',
      };

      const activityLabel = activities[activity] || activity;
      const message = accepted
        ? `✅ ${fromUserName} a accepté votre invitation pour ${activityLabel} !`
        : `❌ ${fromUserName} a décliné votre invitation pour ${activityLabel}`;

      const notification = {
        to: toUserId,
        from: fromUserId,
        type: 'invitation_response',
        message,
        data: {
          activity,
          accepted,
          fromUserId,
          fromUserName,
          activityLabel,
        },
        read: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'notifications'), notification);

      console.log(
        `🔔 Notification de réponse créée: ${accepted ? 'acceptée' : 'déclinée'} pour ${activityLabel}`
      );
    } catch (error) {
      console.error('❌ Erreur notification réponse:', error);
    }
  }

  // ===========================
  // PHASE 3 - INVITATIONS MULTIPLES INTELLIGENTES
  // ===========================

  /**
   * Envoie une invitation à plusieurs destinataires simultanément
   * @param {string} fromUserId - ID de l'expéditeur
   * @param {string} activity - Type d'activité
   * @param {string[]} recipientUserIds - IDs des destinataires
   * @param {Object} location - Position géographique
   * @param {Object} options - Options avancées (priorité, groupId, etc.)
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  static async sendMultipleInvitation(
    fromUserId,
    activity,
    recipientUserIds,
    location,
    options = {}
  ) {
    if (!isOnline()) {
      throw new Error("Mode offline, impossible d'envoyer des invitations");
    }

    try {
      debugLog(
        `🚀 [PHASE 3] Envoi invitation multiple: ${fromUserId} -> ${recipientUserIds.length} destinataires pour ${activity}`
      );

      // Validation des paramètres
      const validation = await this._validateMultipleInvitation(
        fromUserId,
        recipientUserIds,
        activity,
        options
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Vérifier les conflits pour chaque destinataire
      const conflictResults = await this._checkRecipientsConflicts(
        fromUserId,
        recipientUserIds,
        activity
      );

      // Filtrer les destinataires valides
      const validRecipients = conflictResults
        .filter(r => r.canReceive)
        .map(r => r.userId);
      const blockedRecipients = conflictResults.filter(r => !r.canReceive);

      if (validRecipients.length === 0) {
        throw new Error(
          "Aucun destinataire disponible pour recevoir l'invitation"
        );
      }

      // Créer l'invitation principale
      const invitationData = await this._createMultipleInvitationData(
        fromUserId,
        activity,
        validRecipients,
        location,
        options
      );

      const invitationRef = await addDoc(
        collection(db, 'invitations'),
        invitationData
      );
      const invitationId = invitationRef.id;

      // Créer les notifications pour chaque destinataire valide
      await this._sendMultipleInvitationNotifications(
        invitationId,
        fromUserId,
        activity,
        validRecipients
      );

      // Programmer l'expiration automatique
      this._scheduleInvitationExpiration(
        invitationId,
        invitationData.expiresAt
      );

      debugLog(
        `✅ [PHASE 3] Invitation multiple créée: ${invitationId} pour ${validRecipients.length} destinataires`
      );

      return {
        success: true,
        invitationId,
        sentToCount: validRecipients.length,
        blockedCount: blockedRecipients.length,
        sentToUsers: validRecipients,
        blockedUsers: blockedRecipients,
        expiresAt: invitationData.expiresAt,
      };
    } catch (error) {
      prodError('❌ [PHASE 3] Erreur envoi invitation multiple:', error);
      throw error;
    }
  }

  /**
   * Répond à une invitation multiple (accepter/décliner)
   * @param {string} invitationId - ID de l'invitation
   * @param {string} userId - ID de l'utilisateur qui répond
   * @param {string} response - 'accepted' ou 'declined'
   * @returns {Promise<Object>} - Résultat de la réponse
   */
  static async respondToMultipleInvitation(invitationId, userId, response) {
    if (!isOnline()) {
      throw new Error('Mode offline, impossible de répondre');
    }

    try {
      debugLog(
        `🎯 [PHASE 3] Réponse invitation multiple: ${userId} -> ${response} pour ${invitationId}`
      );

      // Récupérer l'invitation
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        throw new Error('Invitation non trouvée');
      }

      const invitationData = invitationSnap.data();

      // Vérifier que l'utilisateur peut répondre
      if (!invitationData.toUserIds.includes(userId)) {
        throw new Error(
          'Utilisateur non autorisé à répondre à cette invitation'
        );
      }

      // Vérifier si l'invitation n'a pas expiré
      if (this._isInvitationExpired(invitationData)) {
        await this._expireInvitation(invitationId, 'Invitation expirée');
        throw new Error('Cette invitation a expiré');
      }

      // Vérifier si l'utilisateur n'a pas déjà répondu
      if (
        invitationData.acceptedByUserIds.includes(userId) ||
        invitationData.declinedByUserIds.includes(userId)
      ) {
        throw new Error('Vous avez déjà répondu à cette invitation');
      }

      // Mettre à jour l'invitation selon la réponse
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      if (response === 'accepted') {
        updateData.acceptedByUserIds = [
          ...invitationData.acceptedByUserIds,
          userId,
        ];

        // Si tous les destinataires ont accepté, marquer comme complètement acceptée
        if (
          updateData.acceptedByUserIds.length === invitationData.totalRecipients
        ) {
          updateData.status = 'fully_accepted';
        }
      } else if (response === 'declined') {
        updateData.declinedByUserIds = [
          ...invitationData.declinedByUserIds,
          userId,
        ];

        // Si tous les destinataires ont décliné, marquer comme déclinée
        const totalResponded =
          updateData.declinedByUserIds.length +
          invitationData.acceptedByUserIds.length;
        if (
          totalResponded === invitationData.totalRecipients &&
          invitationData.acceptedByUserIds.length === 0
        ) {
          updateData.status = 'declined';
        }
      }

      // Sauvegarder la mise à jour
      await updateDoc(invitationRef, updateData);

      // Notifier l'expéditeur de la réponse
      await this._notifyInvitationResponse(
        invitationData.fromUserId,
        userId,
        invitationData.activity,
        response,
        invitationData.totalRecipients,
        updateData.acceptedByUserIds?.length ||
          invitationData.acceptedByUserIds.length
      );

      // Gérer les conflits et transitions d'état si accepté
      if (response === 'accepted') {
        await this._resolveInvitationConflicts(userId, invitationId);

        // 🎯 CORRECTION CRITIQUE: Passer les deux utilisateurs en EN_PARTAGE quand invitation acceptée
        await this._transitionUsersToSharing(userId, invitationData);
      }

      debugLog(
        `✅ [PHASE 3] Réponse enregistrée: ${response} pour invitation ${invitationId}`
      );

      // 🎯 NOUVEAU: Déclencher mise à jour statuts amis temps réel
      window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
      debugLog(
        '📡 [INVITATION SERVICE] Événement friendsStatusUpdate émis (multiple response)'
      );

      return {
        success: true,
        response,
        invitationId,
        updatedStatus: updateData.status || invitationData.status,
      };
    } catch (error) {
      prodError('❌ [PHASE 3] Erreur réponse invitation multiple:', error);
      throw error;
    }
  }

  /**
   * Récupère les invitations en attente pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des invitations en attente
   */
  static async getUserPendingInvitations(userId) {
    if (!isOnline()) {
      return [];
    }

    try {
      const pendingQuery = query(
        collection(db, 'invitations'),
        where('toUserIds', 'array-contains', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(pendingQuery);
      const invitations = [];

      snapshot.forEach(doc => {
        const data = doc.data();

        // Filtrer les invitations expirées
        if (!this._isInvitationExpired(data)) {
          invitations.push({
            id: doc.id,
            ...data,
            // Ajouter des informations calculées
            hasUserResponded:
              data.acceptedByUserIds.includes(userId) ||
              data.declinedByUserIds.includes(userId),
            acceptanceRate:
              data.acceptedByUserIds.length / data.totalRecipients,
            timeRemaining: this._getTimeRemaining(data.expiresAt),
          });
        }
      });

      return invitations;
    } catch (error) {
      prodError(
        '❌ [PHASE 3] Erreur récupération invitations en attente:',
        error
      );
      return [];
    }
  }

  /**
   * Expire automatiquement les invitations obsolètes
   * @returns {Promise<number>} - Nombre d'invitations expirées
   */
  static async expireOldInvitations() {
    if (!isOnline()) {
      return 0;
    }

    try {
      debugLog('🧹 [PHASE 3] Nettoyage invitations expirées...');

      const now = new Date();
      const expiredQuery = query(
        collection(db, 'invitations'),
        where('status', '==', 'pending'),
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(expiredQuery);
      let expiredCount = 0;

      for (const docSnapshot of snapshot.docs) {
        const invitationData = docSnapshot.data();

        // Marquer comme expirée
        await updateDoc(docSnapshot.ref, {
          status: 'expired',
          autoExpired: true,
          expiredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Notifier l'expéditeur si pas encore fait
        if (!invitationData.expirationNotificationSent) {
          await this._notifyInvitationExpired(docSnapshot.id, invitationData);
        }

        expiredCount++;
      }

      debugLog(`✅ [PHASE 3] ${expiredCount} invitations expirées nettoyées`);
      return expiredCount;
    } catch (error) {
      prodError('❌ [PHASE 3] Erreur expiration invitations:', error);
      return 0;
    }
  }

  // ===========================
  // MÉTHODES PRIVÉES PHASE 3
  // ===========================

  /**
   * Valide une invitation multiple
   * @private
   */
  static async _validateMultipleInvitation(
    fromUserId,
    recipientUserIds,
    activity,
    options
  ) {
    // Vérifier les paramètres de base
    if (!fromUserId || !activity || !Array.isArray(recipientUserIds)) {
      return { isValid: false, error: 'Paramètres manquants ou invalides' };
    }

    if (recipientUserIds.length === 0) {
      return { isValid: false, error: 'Au moins un destinataire requis' };
    }

    if (recipientUserIds.length > 8) {
      // EVENT_CONSTANTS.MAX_MULTIPLE_RECIPIENTS
      return { isValid: false, error: 'Maximum 8 destinataires autorisés' };
    }

    // Vérifier que l'expéditeur n'est pas dans la liste
    if (recipientUserIds.includes(fromUserId)) {
      return { isValid: false, error: "Impossible de s'inviter soi-même" };
    }

    // TODO: Ajouter vérification du cooldown anti-spam
    // TODO: Ajouter vérification du statut de l'expéditeur

    return { isValid: true };
  }

  /**
   * Vérifie les conflits pour chaque destinataire
   * @private
   */
  static async _checkRecipientsConflicts(
    fromUserId,
    recipientUserIds,
    activity
  ) {
    const results = [];

    for (const recipientId of recipientUserIds) {
      try {
        // Vérifier les invitations existantes
        const hasConflict = await this.checkExistingInvitation(
          fromUserId,
          recipientId,
          activity
        );

        // TODO: Ajouter vérification du statut du destinataire
        // TODO: Ajouter vérification des relations bilatérales

        results.push({
          userId: recipientId,
          canReceive: !hasConflict,
          reason: hasConflict ? 'Invitation ou relation déjà active' : null,
        });
      } catch (error) {
        results.push({
          userId: recipientId,
          canReceive: false,
          reason: `Erreur vérification: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Crée les données d'une invitation multiple
   * @private
   */
  static async _createMultipleInvitationData(
    fromUserId,
    activity,
    validRecipients,
    location,
    options
  ) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    return {
      fromUserId,
      toUserIds: validRecipients,
      activity,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt,
      updatedAt: serverTimestamp(),

      // Propriétés Phase 3
      isMultipleInvitation: validRecipients.length > 1,
      totalRecipients: validRecipients.length,
      acceptedByUserIds: [],
      declinedByUserIds: [],
      priority: options.priority || 'normal',
      conflictsWith: [],
      autoExpired: false,
      expirationNotificationSent: false,

      // Métadonnées
      location: location || null,
      groupId: options.groupId || null,
      invitationType: options.groupId ? 'group' : 'individual',
    };
  }

  /**
   * Envoie les notifications pour invitation multiple
   * @private
   */
  static async _sendMultipleInvitationNotifications(
    invitationId,
    fromUserId,
    activity,
    validRecipients
  ) {
    // Récupérer les infos de l'expéditeur
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserName = fromUserDoc.exists()
      ? fromUserDoc.data().name
      : 'Un ami';

    const activities = {
      coffee: 'Coffee',
      lunch: 'Lunch',
      drinks: 'Drinks',
      chill: 'Chill',
      clubbing: 'Clubbing',
      cinema: 'Cinema',
    };

    const activityLabel = activities[activity] || activity;

    // Créer une notification pour chaque destinataire
    const notificationPromises = validRecipients.map(async recipientId => {
      const message =
        validRecipients.length > 1
          ? `🎉 ${fromUserName} vous invite pour ${activityLabel} (${validRecipients.length} invités)`
          : `🎉 ${fromUserName} vous invite pour ${activityLabel}`;

      return NotificationService.createNotification(
        recipientId,
        fromUserId,
        'invitation',
        message,
        {
          invitationId,
          activity,
          activityLabel,
          fromUserName,
          isMultipleInvitation: validRecipients.length > 1,
          totalRecipients: validRecipients.length,
        }
      );
    });

    await Promise.all(notificationPromises);
  }

  /**
   * Vérifie si une invitation est expirée
   * @private
   */
  static _isInvitationExpired(invitationData) {
    if (!invitationData.expiresAt) return false;

    const expirationTime = invitationData.expiresAt.toDate
      ? invitationData.expiresAt.toDate().getTime()
      : new Date(invitationData.expiresAt).getTime();

    return Date.now() > expirationTime;
  }

  /**
   * Calcule le temps restant avant expiration
   * @private
   */
  static _getTimeRemaining(expiresAt) {
    if (!expiresAt) return null;

    const expirationTime = expiresAt.toDate
      ? expiresAt.toDate().getTime()
      : new Date(expiresAt).getTime();

    const remaining = expirationTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Programme l'expiration automatique d'une invitation
   * @private
   */
  static _scheduleInvitationExpiration(invitationId, expiresAt) {
    const expirationTime = expiresAt.getTime
      ? expiresAt.getTime()
      : new Date(expiresAt).getTime();

    const delay = expirationTime - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        try {
          // Vérifier si l'invitation existe encore et n'est pas déjà expirée
          const invitationRef = doc(db, 'invitations', invitationId);
          const invitationSnap = await getDoc(invitationRef);

          if (invitationSnap.exists()) {
            const data = invitationSnap.data();
            if (data.status === 'pending') {
              await this._expireInvitation(
                invitationId,
                'Expiration automatique'
              );
            }
          }
        } catch (error) {
          prodError('❌ Erreur expiration automatique:', error);
        }
      }, delay);
    }
  }

  /**
   * Expire une invitation et notifie
   * @private
   */
  static async _expireInvitation(invitationId, reason) {
    const invitationRef = doc(db, 'invitations', invitationId);

    await updateDoc(invitationRef, {
      status: 'expired',
      autoExpired: true,
      expiredAt: serverTimestamp(),
      expiredReason: reason,
      updatedAt: serverTimestamp(),
    });

    debugLog(`⏰ [PHASE 3] Invitation ${invitationId} expirée: ${reason}`);
  }

  /**
   * Notifie l'expéditeur qu'une invitation a expiré
   * @private
   */
  static async _notifyInvitationExpired(invitationId, invitationData) {
    try {
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
      const message = invitationData.isMultipleInvitation
        ? `⏰ Votre invitation pour ${activityLabel} (${invitationData.totalRecipients} destinataires) a expiré`
        : `⏰ Votre invitation pour ${activityLabel} a expiré`;

      await NotificationService.createNotification(
        invitationData.fromUserId,
        'system',
        'invitation_expired',
        message,
        {
          invitationId,
          activity: invitationData.activity,
          activityLabel,
          totalRecipients: invitationData.totalRecipients,
          acceptedCount: invitationData.acceptedByUserIds.length,
        }
      );

      // Marquer la notification d'expiration comme envoyée
      await updateDoc(doc(db, 'invitations', invitationId), {
        expirationNotificationSent: true,
      });
    } catch (error) {
      prodError('❌ Erreur notification expiration:', error);
    }
  }

  /**
   * Notifie l'expéditeur d'une réponse à invitation
   * @private
   */
  static async _notifyInvitationResponse(
    fromUserId,
    respondingUserId,
    activity,
    response,
    totalRecipients,
    acceptedCount
  ) {
    try {
      // Récupérer le nom de celui qui répond
      const respondingUserDoc = await getDoc(
        doc(db, 'users', respondingUserId)
      );
      const respondingUserName = respondingUserDoc.exists()
        ? respondingUserDoc.data().name
        : 'Un ami';

      const activities = {
        coffee: 'Coffee',
        lunch: 'Lunch',
        drinks: 'Drinks',
        chill: 'Chill',
        clubbing: 'Clubbing',
        cinema: 'Cinema',
      };

      const activityLabel = activities[activity] || activity;

      let message;
      if (totalRecipients > 1) {
        if (response === 'accepted') {
          message = `✅ ${respondingUserName} a accepté votre invitation pour ${activityLabel} (${acceptedCount}/${totalRecipients} ont accepté)`;
        } else {
          message = `❌ ${respondingUserName} a décliné votre invitation pour ${activityLabel}`;
        }
      } else {
        message =
          response === 'accepted'
            ? `✅ ${respondingUserName} a accepté votre invitation pour ${activityLabel} !`
            : `❌ ${respondingUserName} a décliné votre invitation pour ${activityLabel}`;
      }

      await NotificationService.createNotification(
        fromUserId,
        respondingUserId,
        'invitation_response',
        message,
        {
          activity,
          activityLabel,
          accepted: response === 'accepted',
          respondingUserId,
          respondingUserName,
          totalRecipients,
          acceptedCount,
        }
      );
    } catch (error) {
      prodError('❌ Erreur notification réponse:', error);
    }
  }

  /**
   * Résout les conflits d'invitations quand un utilisateur accepte
   * @private
   */
  static async _resolveInvitationConflicts(userId, acceptedInvitationId) {
    try {
      // Récupérer toutes les autres invitations pending pour cet utilisateur
      const conflictingQuery = query(
        collection(db, 'invitations'),
        where('toUserIds', 'array-contains', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(conflictingQuery);

      for (const docSnapshot of snapshot.docs) {
        // Ignorer l'invitation acceptée
        if (docSnapshot.id === acceptedInvitationId) continue;

        // Marquer les autres comme en conflit ou déclinées automatiquement
        await updateDoc(docSnapshot.ref, {
          conflictsWith: [acceptedInvitationId],
          status: 'auto_declined',
          autoDeclinedReason: 'Utilisateur a accepté une autre invitation',
          declinedByUserIds: [userId],
          updatedAt: serverTimestamp(),
        });

        debugLog(
          `🚫 [PHASE 3] Invitation ${docSnapshot.id} auto-déclinée à cause de conflit`
        );
      }
    } catch (error) {
      prodError('❌ Erreur résolution conflits:', error);
    }
  }

  /**
   * Fait la transition des utilisateurs vers l'état EN_PARTAGE quand une invitation est acceptée
   * @private
   */
  static async _transitionUsersToSharing(acceptingUserId, invitationData) {
    try {
      // Import statique en haut du fichier pour éviter problèmes linting
      const EventStatusService =
        require('./eventStatusService').EventStatusService;
      const { UserEventStatus } = require('../types/eventTypes');

      debugLog(`🔄 [STATUT] Transition EN_PARTAGE pour acceptation invitation`);

      // 1. Passer l'utilisateur qui accepte en EN_PARTAGE
      await EventStatusService.setUserEventStatus(
        acceptingUserId,
        UserEventStatus.EN_PARTAGE,
        {
          acceptedInvitationId: invitationData.id,
          acceptedActivity: invitationData.activity,
          acceptedFromUserId: invitationData.fromUserId,
        }
      );
      debugLog(`✅ [STATUT] ${acceptingUserId} → EN_PARTAGE (acceptation)`);

      // 2. Passer l'expéditeur en EN_PARTAGE aussi (partage mutuel)
      await EventStatusService.setUserEventStatus(
        invitationData.fromUserId,
        UserEventStatus.EN_PARTAGE,
        {
          invitationAcceptedBy: acceptingUserId,
          sharedActivity: invitationData.activity,
        }
      );
      debugLog(
        `✅ [STATUT] ${invitationData.fromUserId} → EN_PARTAGE (mutuel)`
      );

      debugLog(
        `🎯 [STATUT] Transition complète: ${acceptingUserId} ↔ ${invitationData.fromUserId} → EN_PARTAGE`
      );
    } catch (error) {
      prodError('❌ [STATUT] Erreur transition EN_PARTAGE:', error);
    }
  }
}
