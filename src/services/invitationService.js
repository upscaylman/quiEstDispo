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
} from 'firebase/firestore';
import { debugLog, prodError } from '../utils/logger';
import { db, isOnline, retryWithBackoff } from './firebaseUtils';
import { NotificationService } from './notificationService';

export class InvitationService {
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

  // Répondre à une invitation
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

        if (invitationData.toUserId !== userId) {
          throw new Error(
            "Vous n'êtes pas autorisé à répondre à cette invitation"
          );
        }

        if (invitationData.status !== 'pending') {
          throw new Error('Cette invitation a déjà été traitée');
        }

        // Mettre à jour le statut de l'invitation
        await updateDoc(invitationRef, {
          status: response,
          respondedAt: serverTimestamp(),
        });

        // Créer une notification de réponse pour l'expéditeur
        await InvitationService.createResponseNotification(
          invitationData.fromUserId,
          userId,
          invitationData.activity,
          response === 'accepted'
        );

        debugLog(`✅ Réponse à l'invitation enregistrée: ${response}`);
        return response;
      });
    } catch (error) {
      prodError('❌ Respond to invitation failed:', error);
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

  // Récupérer les invitations pour un utilisateur (reçues)
  static async getInvitationsForUser(userId) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour récupérer les invitations');
    }

    try {
      debugLog(
        `🔍 Récupération des invitations pour l'utilisateur ${userId}...`
      );

      const q = query(
        collection(db, 'invitations'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invitations = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        });
      });

      debugLog(
        `✅ ${invitations.length} invitations récupérées pour ${userId}`
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
}
