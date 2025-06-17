// Service de gestion des disponibilités
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
import { db, isOnline, retryWithBackoff } from './firebaseUtils';

export class AvailabilityService {
  // Définir sa disponibilité
  static async setAvailability(
    userId,
    activity,
    location,
    metadata = {},
    duration = 45
  ) {
    console.log('🔥 Setting availability:', {
      userId,
      activity,
      location,
      metadata,
    });

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, creating local availability');
      return 'offline-' + Date.now();
    }

    try {
      return await retryWithBackoff(async () => {
        const availabilityData = {
          userId,
          activity,
          location,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + duration * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          ...metadata, // Ajouter les metadata (isResponseToInvitation, respondingToUserId, etc.)
        };

        const availabilityRef = await addDoc(
          collection(db, 'availabilities'),
          availabilityData
        );

        const userRef = doc(db, 'users', userId);
        const updateData = {
          isAvailable: true,
          currentActivity: activity,
          availabilityId: availabilityRef.id,
          updatedAt: serverTimestamp(),
        };

        // 🔥 TOUJOURS sauvegarder la location dans l'availability (pour récupération ultérieure)
        // Mais partager dans le profil SEULEMENT si c'est une réponse à invitation
        if (metadata.isResponseToInvitation) {
          updateData.location = location;
          updateData.locationShared = true; // 🔥 NOUVEAU: Marqueur explicite de partage actif
          updateData.lastLocationUpdate = serverTimestamp();
          console.log(
            "📍 Location partagée dans profil car acceptation d'invitation"
          );
        } else {
          // 🔥 NOUVEAU: Pour créateur d'activité, la location sera partagée seulement lors d'acceptation mutuelle
          console.log(
            "🔒 Location stockée dans availability - partage en attente d'acceptation mutuelle"
          );
        }

        await updateDoc(userRef, updateData);

        console.log('✅ Availability set successfully');
        return availabilityRef.id;
      });
    } catch (error) {
      console.warn('⚠️ Availability service error:', error);
      throw new Error(
        `Impossible de définir la disponibilité: ${error.message}`
      );
    }
  }

  // 🔥 NOUVEAU: Nettoyer les availabilities expirées
  static async cleanupExpiredAvailabilities() {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot cleanup expired availabilities');
      return;
    }

    try {
      console.log('🧹 [DEBUG] Nettoyage des availabilities expirées...');

      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 45 * 60 * 1000); // 45 minutes ago

      const expiredQuery = query(
        collection(db, 'availabilities'),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(expiredQuery);
      const deletePromises = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt =
          data.createdAt?.toDate?.() || new Date(data.createdAt);

        if (createdAt < cutoffTime) {
          console.log(
            `🧹 [DEBUG] Suppression availability expirée: ${doc.id} (créée: ${createdAt.toISOString()})`
          );
          deletePromises.push(deleteDoc(doc.ref));
        }
      });

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🧹 [DEBUG] ✅ ${deletePromises.length} availabilities expirées supprimées`
        );
      } else {
        console.log(`🧹 [DEBUG] ℹ️ Aucune availability expirée trouvée`);
      }

      return deletePromises.length;
    } catch (error) {
      console.error('❌ Erreur nettoyage availabilities expirées:', error);
      return 0;
    }
  }

  // Arrêter sa disponibilité
  static async stopAvailability(userId, availabilityId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot stop availability');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        console.log(
          `🛑 [DEBUG] Arrêt availability ${availabilityId} pour ${userId}`
        );

        // 🔥 NOUVEAU: Notifier les amis AVANT de supprimer
        await this.notifyFriendsOfDeparture(userId, availabilityId);

        // 🔥 NOUVEAU: Arrêter le partage mutuel de géolocalisation
        await this.disableMutualLocationSharing(userId);

        if (availabilityId && !availabilityId.startsWith('offline-')) {
          console.log(
            `🛑 [DEBUG] Suppression document availability ${availabilityId}`
          );
          await deleteDoc(doc(db, 'availabilities', availabilityId));
          console.log(
            `🛑 [DEBUG] ✅ Document availability ${availabilityId} supprimé`
          );
        }

        // Nettoyer TOUTES les activités en cours où cet utilisateur était impliqué
        console.log(
          `🧹 [DEBUG] Nettoyage activités en cours impliquant ${userId}`
        );

        // 🔥 ULTRA SIMPLE: Quand user arrête → SEULE sa position disparaît (comme WhatsApp)
        // Pas de suppression des autres availabilities, chacun gère la sienne !
        console.log(
          `🔥 [ULTRA SIMPLE] ${userId} arrête → seule SA position disparaît de la carte`
        );

        // 🔥 NOUVEAU BUG #1 FIX: Forcer le nettoyage immédiat de la position sur la carte
        // Mettre à jour le profil utilisateur avec nettoyage explicite de la location
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isAvailable: false,
          currentActivity: null,
          availabilityId: null,
          location: null, // 🔥 IMPORTANT: Nettoyer la location partagée
          locationShared: false, // 🔥 NOUVEAU: Marquer comme non partagée explicitement
          lastLocationUpdate: serverTimestamp(), // 🔥 NOUVEAU: Forcer la détection de changement
          positionShared: false, // 🔥 SUPPRIMÉ: Doublon avec locationShared
          updatedAt: serverTimestamp(),
        });

        // 🚨 CORRECTION: Nettoyage INDIVIDUEL uniquement (pas bilatéral)
        // Selon le scénario en 8 étapes: quand Jack arrête, SEUL Jack disparaît de la carte
        // Paul continue son activité et reste visible pour les autres
        console.log(
          `🧹 [NETTOYAGE INDIVIDUEL] Seul ${userId} sera retiré de la carte`
        );

        console.log(
          `🛑 [DEBUG] ✅ Arrêt de disponibilité terminé pour ${userId} - Position cachée sur carte`
        );
      });
    } catch (error) {
      console.warn('⚠️ Stop availability error:', error);
      throw new Error(
        `Impossible d'arrêter la disponibilité: ${error.message}`
      );
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Notifier les amis du départ
  static async notifyFriendsOfDeparture(userId, availabilityId) {
    try {
      console.log(`📢 [DEBUG] Notification départ pour ${userId}`);

      // Récupérer l'availability pour obtenir l'activité et les détails
      const availabilityRef = doc(db, 'availabilities', availabilityId);
      const availabilitySnap = await getDoc(availabilityRef);

      if (!availabilitySnap.exists()) {
        console.log(`📢 [DEBUG] Availability ${availabilityId} n'existe plus`);
        return;
      }

      const availabilityData = availabilitySnap.data();
      const activity = availabilityData.activity;

      // Récupérer le nom de l'utilisateur qui part
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists()
        ? userSnap.data().displayName || userSnap.data().name || 'Un ami'
        : 'Un ami';

      // Trouver tous les amis qui avaient rejoint cette activité
      const activeParticipantsQuery = query(
        collection(db, 'availabilities'),
        where('joinedByFriend', '==', userId),
        where('isActive', '==', true)
      );

      const participantsSnapshot = await getDocs(activeParticipantsQuery);

      console.log(
        `📢 [DEBUG] ${participantsSnapshot.size} participants à notifier`
      );

      // Notifier chaque participant
      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        const participantUserId = participantData.userId;

        console.log(`📢 [DEBUG] Notification à ${participantUserId}`);

        // Créer notification de départ
        await addDoc(collection(db, 'notifications'), {
          to: participantUserId,
          from: userId,
          type: 'friend_left_activity',
          message: `👋 ${userName} a quitté l'activité ${activity}`,
          data: {
            activity,
            leftUserId: userId,
            leftUserName: userName,
          },
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      console.log(`📢 [DEBUG] ✅ Notifications de départ envoyées`);
    } catch (error) {
      console.error('❌ Erreur notification départ:', error);
      // Ne pas faire échouer l'arrêt de disponibilité
    }
  }

  // 🐛 FIX: Récupérer une availability spécifique par ID (pour restauration après refresh)
  static async getAvailability(availabilityId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot get availability');
      return null;
    }

    try {
      const availabilityRef = doc(db, 'availabilities', availabilityId);
      const availabilitySnap = await getDoc(availabilityRef);

      if (availabilitySnap.exists()) {
        return { id: availabilitySnap.id, ...availabilitySnap.data() };
      } else {
        console.warn(`⚠️ Availability ${availabilityId} not found`);
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Get availability error:', error);
      return null;
    }
  }

  // Écouter les disponibilités des amis
  static onAvailableFriends(userId, callback) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no friends available');
      callback([]);
      return () => {};
    }

    try {
      const userRef = doc(db, 'users', userId);
      let friendListeners = new Map(); // Map pour stocker les listeners de chaque ami
      let currentFriendIds = [];
      let isCollecting = false; // Éviter les collectes multiples simultanées

      // 🔥 FONCTION RÉCURSIVE: Se rappelle elle-même pour éviter les problèmes de scope
      const collectAndUpdate = async friendIds => {
        if (isCollecting) {
          console.log('🔄 [TEMPS RÉEL] Collecte déjà en cours, ignorée');
          return;
        }

        isCollecting = true;

        try {
          console.log(
            `🔍 [STYLE WHATSAPP V3] Vérification partage pour ${friendIds.length} amis`
          );

          const friendsWithActiveSharing = [];

          for (const friendId of friendIds) {
            try {
              // Vérifier le profil de l'ami pour son statut de partage
              const friendRef = doc(db, 'users', friendId);
              const friendSnap = await getDoc(friendRef);

              if (!friendSnap.exists()) continue;

              const friendData = friendSnap.data();

              // 🔥 LOGIQUE WHATSAPP: L'ami est visible s'il partage activement sa position
              const isActivelySharing =
                friendData.locationShared === true &&
                friendData.location &&
                friendData.location.lat &&
                friendData.location.lng;

              console.log(
                `🔍 [DEBUG] ${friendData.name || friendId} isActivelySharing: ${isActivelySharing}`
              );

              if (isActivelySharing) {
                // Chercher l'availability correspondante pour les détails d'activité
                const availabilityQuery = query(
                  collection(db, 'availabilities'),
                  where('userId', '==', friendId),
                  where('isActive', '==', true)
                );

                const availabilitySnapshot = await getDocs(availabilityQuery);

                let availability;
                if (!availabilitySnapshot.empty) {
                  const availabilityDoc = availabilitySnapshot.docs[0];
                  availability = {
                    id: availabilityDoc.id,
                    ...availabilityDoc.data(),
                  };
                } else {
                  // 🔥 CORRECTION CRITIQUE: Même sans availability active, on peut partager sa position !
                  availability = {
                    id: `profile-${friendId}`,
                    userId: friendId,
                    activity:
                      friendData.mutualSharingActivity ||
                      friendData.currentActivity ||
                      'partage position',
                    location: friendData.location,
                    isActive: true,
                    createdAt:
                      friendData.lastLocationUpdate || new Date().toISOString(),
                  };
                }

                // Ajouter les données d'ami
                availability['friend'] = friendData;
                availability['location'] = friendData.location;
                availability['isActiveParticipant'] = true;

                friendsWithActiveSharing.push(availability);

                console.log(
                  `📍 [WHATSAPP V3] ${friendData.name || 'Ami'} partage activement sa position`
                );
              }
            } catch (error) {
              console.warn('Erreur vérification ami:', error);
            }
          }

          // Filtrer les activités expirées
          const now = new Date().getTime();
          const durationMs = 45 * 60 * 1000;
          const activeFriends = friendsWithActiveSharing.filter(friend => {
            if (!friend.createdAt) return true;
            const createdTime = new Date(friend.createdAt).getTime();
            return now - createdTime < durationMs;
          });

          console.log(
            `🔥 [WHATSAPP V3] ${activeFriends.length} amis avec partage actif`
          );
          callback(activeFriends);
        } finally {
          isCollecting = false;
        }
      };

      const unsubscribeUser = onSnapshot(userRef, async userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendIds = userData.friends || [];

          // 🔥 TEMPS RÉEL CORRIGÉ: Nettoyer les anciens listeners d'amis qui ne sont plus amis
          const removedFriends = currentFriendIds.filter(
            id => !friendIds.includes(id)
          );
          removedFriends.forEach(friendId => {
            if (friendListeners.has(friendId)) {
              friendListeners.get(friendId)(); // Désinscrire
              friendListeners.delete(friendId);
              console.log(
                `🔇 [TEMPS RÉEL] Listener retiré pour ex-ami ${friendId}`
              );
            }
          });

          currentFriendIds = friendIds;

          if (friendIds.length === 0) {
            callback([]);
            return;
          }

          // 🔥 TEMPS RÉEL CORRIGÉ: Créer des listeners pour chaque nouveau ami
          const newFriends = friendIds.filter(id => !friendListeners.has(id));

          newFriends.forEach(friendId => {
            const friendRef = doc(db, 'users', friendId);

            // Créer un listener pour ce profil d'ami spécifique
            const unsubscribeFriend = onSnapshot(friendRef, () => {
              console.log(
                `🔄 [TEMPS RÉEL] Changement détecté pour ami ${friendId}`
              );
              // Relancer la collecte complète quand n'importe quel ami change
              collectAndUpdate(friendIds);
            });

            friendListeners.set(friendId, unsubscribeFriend);
            console.log(`🔊 [TEMPS RÉEL] Listener créé pour ami ${friendId}`);
          });

          // Lancer la collecte initiale
          await collectAndUpdate(friendIds);
        } else {
          callback([]);
        }
      });

      // 🔥 RETOURNER UNE FONCTION DE NETTOYAGE COMPLÈTE
      return () => {
        console.log('🧹 [NETTOYAGE] Désabonnement de tous les listeners');
        unsubscribeUser();
        friendListeners.forEach((unsubscribe, friendId) => {
          unsubscribe();
          console.log(`🔇 [NETTOYAGE] Listener retiré pour ami ${friendId}`);
        });
        friendListeners.clear();
      };
    } catch (error) {
      console.error('Error listening to friends:', error);
      callback([]);
      return () => {};
    }
  }

  // Obtenir les amis disponibles de façon synchrone (Promise)
  static async getAvailableFriends(userId) {
    return new Promise((resolve, reject) => {
      if (!isOnline()) {
        console.warn('⚠️ Offline mode, no friends available');
        resolve([]);
        return;
      }

      try {
        // Utiliser onAvailableFriends avec un callback qui résout la Promise
        const unsubscribe = this.onAvailableFriends(
          userId,
          availableFriends => {
            // Désinscrire immédiatement après avoir reçu les données
            unsubscribe();
            resolve(availableFriends);
          }
        );

        // Timeout de sécurité
        setTimeout(() => {
          unsubscribe();
          resolve([]);
        }, 5000);
      } catch (error) {
        console.error('❌ Erreur getAvailableFriends:', error);
        reject(error);
      }
    });
  }

  // Enregistrer une réponse à une activité
  static async recordActivityResponse(userId, activityId, responseType) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot record response');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        // Vérifier si une réponse existe déjà
        const existingResponseQuery = query(
          collection(db, 'activity_responses'),
          where('userId', '==', userId),
          where('activityId', '==', activityId)
        );

        const existingResponses = await getDocs(existingResponseQuery);

        if (!existingResponses.empty) {
          console.log('Response already exists for this activity');
          return;
        }

        // Créer la nouvelle réponse
        const responseData = {
          userId,
          activityId,
          responseType, // 'join' ou 'decline'
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'activity_responses'), responseData);
        console.log('✅ Activity response recorded');
      });
    } catch (error) {
      console.warn('⚠️ Record response error:', error);
      throw new Error(`Impossible d'enregistrer la réponse: ${error.message}`);
    }
  }

  // Nettoyer les réponses aux activités inactives
  static async cleanupInactiveResponses() {
    if (!isOnline()) return;

    try {
      // Récupérer toutes les activités inactives
      const inactiveActivitiesQuery = query(
        collection(db, 'availabilities'),
        where('isActive', '==', false)
      );

      const inactiveActivities = await getDocs(inactiveActivitiesQuery);
      const inactiveIds = inactiveActivities.docs.map(doc => doc.id);

      if (inactiveIds.length === 0) return;

      // Supprimer les réponses aux activités inactives
      const responsesToCleanQuery = query(
        collection(db, 'activity_responses'),
        where('activityId', 'in', inactiveIds)
      );

      const responsesToClean = await getDocs(responsesToCleanQuery);
      const deletePromises = responsesToClean.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🧹 ${deletePromises.length} réponses d'activités inactives supprimées`
        );
      }
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage réponses (non critique):', error);
    }
  }

  // 🐛 FIX: Nettoyer les réponses pour des activités spécifiques
  static async cleanupResponsesForActivities(activityIds, userId = null) {
    if (!isOnline() || activityIds.length === 0) return;

    try {
      // Si un userId est spécifié, ne nettoyer que ses réponses, sinon toutes les réponses
      let responsesToCleanQuery;
      if (userId) {
        responsesToCleanQuery = query(
          collection(db, 'activity_responses'),
          where('activityId', 'in', activityIds),
          where('userId', '==', userId)
        );
      } else {
        responsesToCleanQuery = query(
          collection(db, 'activity_responses'),
          where('activityId', 'in', activityIds)
        );
      }

      const responsesToClean = await getDocs(responsesToCleanQuery);
      const deletePromises = responsesToClean.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🐛 [FIX] ${deletePromises.length} réponses d'activités expirées supprimées${userId ? ` pour user ${userId}` : ''} - ré-invitation possible`
        );
      }
    } catch (error) {
      console.warn(
        '⚠️ Erreur nettoyage réponses expirées (non critique):',
        error
      );
    }
  }

  // Notifier les amis de sa disponibilité
  static async notifyFriends(userId, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot notify friends');
      return;
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error('User not found');
        }

        const userData = userSnap.data();
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
          console.log('No friends to notify');
          return;
        }

        console.log(
          `📢 Notifying ${friendIds.length} friends about ${activity} activity`
        );

        // Ici on pourrait ajouter la logique de notification push
        // Pour l'instant, on log juste
      });
    } catch (error) {
      console.warn('⚠️ Notify friends error:', error);
      throw new Error(`Impossible de notifier les amis: ${error.message}`);
    }
  }

  // Alias pour compatibilité avec l'ancienne API
  static listenToAvailableFriends(userId, callback) {
    return this.onAvailableFriends(userId, callback);
  }

  // Répondre à une invitation
  static async respondToInvitation(userId, friendId, response) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot respond to invitation');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        // Enregistrer la réponse
        await this.recordActivityResponse(userId, friendId, response);
        console.log(`✅ Responded to invitation: ${response}`);
      });
    } catch (error) {
      console.warn('⚠️ Respond to invitation error:', error);
      throw new Error(
        `Impossible de répondre à l'invitation: ${error.message}`
      );
    }
  }

  // Marquer qu'un ami a rejoint notre activité (pour affichage réciproque)
  static async markAsJoinedByFriend(availabilityId, friendUserId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot mark as joined');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        const availabilityRef = doc(db, 'availabilities', availabilityId);
        await updateDoc(availabilityRef, {
          joinedByFriend: friendUserId,
          joinedTimestamp: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });

        console.log(
          `✅ Availability ${availabilityId} marquée comme rejointe par ${friendUserId}`
        );
      });
    } catch (error) {
      console.warn('⚠️ Mark as joined error:', error);
    }
  }

  // Terminer manuellement une activité en cours
  static async terminateActivity(availabilityId, userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot terminate activity');
      return;
    }

    try {
      return await retryWithBackoff(async () => {
        console.log(
          `🏁 [DEBUG] Terminer activité ${availabilityId} par ${userId}`
        );

        // Récupérer les infos de l'activité pour notifier l'autre participant
        const availabilityRef = doc(db, 'availabilities', availabilityId);
        const availabilitySnap = await getDoc(availabilityRef);

        if (availabilitySnap.exists()) {
          const activityData = availabilitySnap.data();
          const otherUserId =
            activityData.joinedByFriend === userId
              ? activityData.userId
              : activityData.joinedByFriend;

          // Supprimer l'activité
          await deleteDoc(availabilityRef);

          // 🐛 FIX: Nettoyer les réponses liées à cette activité terminée
          await this.cleanupResponsesForActivities([availabilityId]);

          // Remettre à jour l'utilisateur qui a créé l'activité si c'est lui qui termine
          if (activityData.userId === userId) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              isAvailable: false,
              currentActivity: null,
              availabilityId: null,
              updatedAt: serverTimestamp(),
            });
          }

          console.log(
            `🏁 [DEBUG] ✅ Activité ${availabilityId} terminée avec succès (réponses nettoyées)`
          );

          // Retourner les infos pour notification
          return {
            activity: activityData.activity,
            otherUserId,
            terminatedBy: userId,
          };
        } else {
          console.warn(`⚠️ Activité ${availabilityId} non trouvée`);
          return null;
        }
      });
    } catch (error) {
      console.warn('⚠️ Terminate activity error:', error);
      throw new Error(`Impossible de terminer l'activité: ${error.message}`);
    }
  }

  // Partager la localisation quand quelqu'un accepte l'invitation
  static async shareLocationOnAcceptance(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot share location');
      return;
    }

    try {
      console.log(`📍 [RÉCIPROCITÉ] Partage de location pour ${userId}`);

      // Récupérer la location actuelle depuis l'availability
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn('⚠️ User not found for location sharing');
        return;
      }

      const userData = userSnap.data();
      const availabilityId = userData.availabilityId;

      if (!availabilityId) {
        console.warn('⚠️ No availability ID found');
        return;
      }

      // Récupérer l'availability pour obtenir la location
      const availabilityRef = doc(db, 'availabilities', availabilityId);
      const availabilitySnap = await getDoc(availabilityRef);

      if (!availabilitySnap.exists()) {
        console.warn('⚠️ Availability not found');
        return;
      }

      const availabilityData = availabilitySnap.data();
      const location = availabilityData.location;

      if (!location) {
        console.warn('⚠️ No location found in availability');
        return;
      }

      // 🔥 RÉCIPROCITÉ CORRIGÉE: Partager la location dans le profil utilisateur avec marqueurs explicites
      await updateDoc(userRef, {
        location: location,
        locationShared: true, // 🔥 NOUVEAU: Marqueur explicite de partage actif
        lastLocationUpdate: serverTimestamp(), // 🔥 NOUVEAU: Timestamp de mise à jour
        updatedAt: serverTimestamp(),
      });

      console.log(
        `📍 [RÉCIPROCITÉ] ✅ Location partagée pour ${userId} suite à acceptation`
      );
    } catch (error) {
      console.error('❌ Erreur partage location:', error);
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Gérer le partage mutuel de géolocalisation (style WhatsApp)
  static async enableMutualLocationSharing(userId1, userId2, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot enable mutual sharing');
      return;
    }

    try {
      console.log(
        `🔄 [RÉCIPROCITÉ MUTUELLE] Activation partage entre ${userId1} ↔ ${userId2} pour ${activity}`
      );

      // Récupérer les availabilities des deux utilisateurs pour obtenir leurs locations
      const user1AvailabilityQuery = query(
        collection(db, 'availabilities'),
        where('userId', '==', userId1),
        where('isActive', '==', true)
      );

      const user2AvailabilityQuery = query(
        collection(db, 'availabilities'),
        where('userId', '==', userId2),
        where('isActive', '==', true)
      );

      const [user1AvailabilitySnap, user2AvailabilitySnap] = await Promise.all([
        getDocs(user1AvailabilityQuery),
        getDocs(user2AvailabilityQuery),
      ]);

      let user1Location = null;
      let user2Location = null;

      // Récupérer la location de l'utilisateur 1
      if (!user1AvailabilitySnap.empty) {
        const user1Availability = user1AvailabilitySnap.docs[0].data();
        user1Location = user1Availability.location;
      }

      // Récupérer la location de l'utilisateur 2
      if (!user2AvailabilitySnap.empty) {
        const user2Availability = user2AvailabilitySnap.docs[0].data();
        user2Location = user2Availability.location;
      }

      if (!user1Location || !user2Location) {
        console.warn(
          '⚠️ Impossible de récupérer les locations pour le partage mutuel'
        );
        return;
      }

      // Activer le partage pour les deux utilisateurs simultanément avec leurs locations
      const user1Ref = doc(db, 'users', userId1);
      const user2Ref = doc(db, 'users', userId2);

      const timestamp = serverTimestamp();
      const mutualSharingData1 = {
        location: user1Location, // 🔥 IMPORTANT: Copier la location dans le profil
        locationShared: true,
        lastLocationUpdate: timestamp,
        mutualSharingWith: userId2,
        mutualSharingActivity: activity,
        updatedAt: timestamp,
      };

      const mutualSharingData2 = {
        location: user2Location, // 🔥 IMPORTANT: Copier la location dans le profil
        locationShared: true,
        lastLocationUpdate: timestamp,
        mutualSharingWith: userId1,
        mutualSharingActivity: activity,
        updatedAt: timestamp,
      };

      // Mise à jour simultanée pour garantir la réciprocité
      await Promise.all([
        updateDoc(user1Ref, mutualSharingData1),
        updateDoc(user2Ref, mutualSharingData2),
      ]);

      console.log(
        `🔄 [RÉCIPROCITÉ MUTUELLE] ✅ Partage mutuel activé entre ${userId1} ↔ ${userId2} avec locations copiées`
      );
    } catch (error) {
      console.error('❌ Erreur partage mutuel:', error);
      throw new Error(
        `Impossible d'activer le partage mutuel: ${error.message}`
      );
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Arrêter le partage mutuel quand quelqu'un quitte
  static async disableMutualLocationSharing(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot disable mutual sharing');
      return;
    }

    try {
      console.log(
        `🛑 [RÉCIPROCITÉ MUTUELLE] Désactivation partage pour ${userId}`
      );

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn('⚠️ User not found for disabling mutual sharing');
        return;
      }

      const userData = userSnap.data();
      const otherUserId = userData.mutualSharingWith;

      // Nettoyer le partage pour l'utilisateur qui quitte
      await updateDoc(userRef, {
        locationShared: false,
        location: null,
        mutualSharingWith: null,
        mutualSharingActivity: null,
        lastLocationUpdate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 🔥 CORRECTION CRITIQUE: NE PAS nettoyer l'autre utilisateur !
      // L'autre utilisateur continue à partager sa position pour d'autres participants potentiels
      if (otherUserId) {
        const otherUserRef = doc(db, 'users', otherUserId);

        // ✅ SEULEMENT supprimer la référence vers celui qui quitte
        // ❌ NE PAS nettoyer sa location ni son statut de partage
        await updateDoc(otherUserRef, {
          mutualSharingWith: null, // Il ne partage plus spécifiquement avec celui qui quitte
          mutualSharingActivity: null, // L'activité mutuelle spécifique est terminée
          lastLocationUpdate: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // 🔥 IMPORTANT: Conserver locationShared=true et location pour les autres participants !
        });

        console.log(
          `🛑 [RÉCIPROCITÉ INDIVIDUELLE] ✅ ${userId} a quitté, ${otherUserId} continue son partage pour d'autres`
        );
      }
    } catch (error) {
      console.error('❌ Erreur désactivation partage mutuel:', error);
    }
  }
}
