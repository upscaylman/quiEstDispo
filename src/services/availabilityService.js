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
        await updateDoc(userRef, {
          isAvailable: true,
          currentActivity: activity,
          availabilityId: availabilityRef.id,
          location: location,
          updatedAt: serverTimestamp(),
        });

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

        // 1. Supprimer les availabilities où cet utilisateur avait rejoint quelqu'un
        const joinedActivitiesQuery = query(
          collection(db, 'availabilities'),
          where('joinedByFriend', '==', userId),
          where('isActive', '==', true)
        );

        const joinedActivitiesSnapshot = await getDocs(joinedActivitiesQuery);
        if (joinedActivitiesSnapshot.size > 0) {
          const deleteJoinedPromises = joinedActivitiesSnapshot.docs.map(doc =>
            updateDoc(doc.ref, {
              joinedByFriend: null,
              joinedTimestamp: null,
              updatedAt: serverTimestamp(),
            })
          );
          await Promise.all(deleteJoinedPromises);
          console.log(
            `🧹 [DEBUG] ✅ ${joinedActivitiesSnapshot.size} activités rejointes nettoyées`
          );
        }

        // 2. Notifier les amis que leurs activités "en cours" sont annulées
        const friendsWhoJoinedQuery = query(
          collection(db, 'availabilities'),
          where('userId', '==', userId),
          where('isActive', '==', true)
        );

        const friendsWhoJoinedSnapshot = await getDocs(friendsWhoJoinedQuery);
        for (const activityDoc of friendsWhoJoinedSnapshot.docs) {
          const activityData = activityDoc.data();
          if (activityData.joinedByFriend) {
            console.log(
              `📢 [DEBUG] Notification d'annulation à ${activityData.joinedByFriend}`
            );
            // Note: La notification sera envoyée par la logique parent dans App.js
          }
        }

        // 🐛 FIX: Nettoyer les réponses de l'utilisateur qui s'arrête
        if (availabilityId && !availabilityId.startsWith('offline-')) {
          await this.cleanupResponsesForActivities([availabilityId]);
        }

        console.log(`🛑 [DEBUG] Mise à jour user ${userId}`);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isAvailable: false,
          currentActivity: null,
          availabilityId: null,
          updatedAt: serverTimestamp(),
        });
        console.log(`🛑 [DEBUG] ✅ User ${userId} mis à jour`);

        // Nettoyer TOUTES les invitations PENDING de cet utilisateur
        console.log(
          `🧹 [DEBUG] Nettoyage invitations PENDING de ${userId} (arrêt disponibilité)`
        );

        const invitationsQuery = await getDocs(
          query(
            collection(db, 'invitations'),
            where('fromUserId', '==', userId),
            where('status', '==', 'pending')
          )
        );

        if (invitationsQuery.size > 0) {
          const deletePromises = invitationsQuery.docs.map(doc =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);
          console.log(
            `🧹 [DEBUG] ✅ ${invitationsQuery.size} invitations PENDING supprimées`
          );
        } else {
          console.log(`🧹 [DEBUG] ℹ️ Aucune invitation PENDING à supprimer`);
        }

        console.log(`🛑 [DEBUG] === ARRÊT DISPONIBILITÉ TERMINÉ ===`);
      });
    } catch (error) {
      console.warn('⚠️ Stop availability error:', error);
      throw new Error(
        `Impossible d'arrêter la disponibilité: ${error.message}`
      );
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

      return onSnapshot(userRef, async userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendIds = userData.friends || [];

          if (friendIds.length === 0) {
            callback([]);
            return;
          }

          const q = query(
            collection(db, 'availabilities'),
            where('userId', 'in', friendIds),
            where('isActive', '==', true)
          );

          onSnapshot(q, async snapshot => {
            console.log(
              `👥 [DEBUG] onAvailableFriends: ${snapshot.docs.length} documents trouvés`
            );
            const availabilities = [];

            // Récupérer les réponses déjà données par l'utilisateur
            const responsesQuery = query(
              collection(db, 'activity_responses'),
              where('userId', '==', userId)
            );
            const responsesSnapshot = await getDocs(responsesQuery);
            const respondedActivityIds = new Set(
              responsesSnapshot.docs.map(doc => doc.data().activityId)
            );

            for (const docSnap of snapshot.docs) {
              const availability = { id: docSnap.id, ...docSnap.data() };
              console.log(
                `👥 [DEBUG] Traitement availability ${availability.id} de ${availability.userId} (${availability.activity})`
              );

              // Toujours inclure si cet ami nous a rejoint (réciprocité)
              const shouldIncludeForReciprocity =
                availability.joinedByFriend === userId;

              // Exclure seulement si on a déjà répondu ET que ce n'est pas un cas de réciprocité
              if (
                respondedActivityIds.has(availability.id) &&
                !shouldIncludeForReciprocity
              ) {
                console.log(
                  `👥 [DEBUG] Exclu ${availability.id} (déjà répondu)`
                );
                continue;
              }

              try {
                const friendRef = doc(db, 'users', availability.userId);
                const friendSnap = await getDoc(friendRef);

                if (friendSnap.exists()) {
                  availability.friend = friendSnap.data();

                  // Marquer comme réponse à invitation si on a rejoint cet ami
                  if (shouldIncludeForReciprocity) {
                    availability.isResponseToInvitation = true;
                    availability.respondingToUserId = userId;
                  }

                  console.log(
                    `👥 [DEBUG] Inclus ${availability.id} (${availability.friend.name})`
                  );
                  availabilities.push(availability);
                }
              } catch (error) {
                console.warn('Warning: Could not fetch friend data:', error);
              }
            }

            console.log(
              `👥 [DEBUG] Total à afficher: ${availabilities.length} cartes`
            );

            // Filtrer les activités expirées (plus de 45 minutes)
            const now = new Date().getTime();
            const durationMs = 45 * 60 * 1000; // 45 minutes
            const expiredActivityIds = [];
            const activeAvailabilities = availabilities.filter(availability => {
              if (!availability.createdAt) return true; // Garder si pas de date

              const createdTime = new Date(availability.createdAt).getTime();
              const expired = now - createdTime >= durationMs;

              if (expired) {
                console.log(
                  `⏰ [DEBUG] Availability ${availability.id} expirée (${availability.activity})`
                );
                expiredActivityIds.push(availability.id);
              }

              return !expired;
            });

            // 🐛 FIX: Nettoyer les réponses aux activités expirées pour permettre la ré-invitation
            if (expiredActivityIds.length > 0) {
              this.cleanupResponsesForActivities(expiredActivityIds, userId);
            }

            console.log(
              `👥 [DEBUG] Après filtrage expirées: ${activeAvailabilities.length} cartes`
            );

            // Trier par ordre chronologique (plus récent en premier)
            activeAvailabilities.sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime(); // Tri décroissant (plus récent d'abord)
            });

            callback(activeAvailabilities);
          });
        } else {
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error listening to friends:', error);
      callback([]);
      return () => {};
    }
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
      await retryWithBackoff(async () => {
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
}
