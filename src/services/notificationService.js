// Service de gestion des notifications
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isOnline, retryWithBackoff } from './firebaseUtils';

export class NotificationService {
  // Écouter les notifications
  static onNotifications(userId, callback) {
    console.log('🔔 [DEBUG] onNotifications appelé pour userId:', userId);

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no notifications');
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        orderBy('createdAt', 'desc')
      );

      console.log('🔔 [DEBUG] Création du listener onSnapshot...');

      return onSnapshot(
        q,
        snapshot => {
          console.log(
            '🔔 [DEBUG] onSnapshot déclenché, taille:',
            snapshot.size
          );

          const notifications = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date();
              const bTime = b.createdAt?.toDate?.() || new Date();
              return bTime - aTime;
            });

          console.log(
            '🔔 [DEBUG] Notifications traitées:',
            notifications.length
          );
          notifications.forEach((notif, index) => {
            console.log(`🔔 [DEBUG] Notification ${index + 1}:`, {
              id: notif.id,
              type: notif.type,
              message: notif.message,
              read: notif.read,
              createdAt: notif.createdAt?.toDate?.()?.toLocaleString(),
            });
          });

          callback(notifications);
        },
        error => {
          console.error('🔔 [DEBUG] Erreur onSnapshot:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.warn('Warning: Could not listen to notifications:', error);
      callback([]);
      return () => {};
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot mark notification as read');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          read: true,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.warn('Warning: Could not mark notification as read:', error);
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot mark all notifications as read');
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('ℹ️ Aucune notification à marquer comme lue');
        return;
      }

      const updatePromises = querySnapshot.docs.map(docRef =>
        retryWithBackoff(() =>
          updateDoc(docRef.ref, {
            read: true,
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(updatePromises);

      console.log(
        `✅ ${querySnapshot.docs.length} notification(s) marquée(s) comme lue(s)`
      );
    } catch (error) {
      console.warn('Warning: Could not mark all notifications as read:', error);
    }
  }

  // Marquer toutes les notifications liées aux amis comme lues
  static async markAllFriendsNotificationsAsRead(userId) {
    if (!isOnline()) {
      console.warn(
        '⚠️ Offline mode, cannot mark friends notifications as read'
      );
      return;
    }

    try {
      const friendsNotificationTypes = [
        'friend_invitation',
        'friend_invitation_accepted',
        'friend_removed',
      ];

      // Créer une requête pour chaque type de notification d'ami
      const queries = friendsNotificationTypes.map(type =>
        query(
          collection(db, 'notifications'),
          where('to', '==', userId),
          where('type', '==', type),
          where('read', '==', false)
        )
      );

      const queryResults = await Promise.all(queries.map(q => getDocs(q)));

      // Fusionner tous les documents
      const allDocs = queryResults.flatMap(snapshot => snapshot.docs);

      if (allDocs.length === 0) {
        console.log("ℹ️ Aucune notification d'ami à marquer comme lue");
        return;
      }

      const updatePromises = allDocs.map(docRef =>
        retryWithBackoff(() =>
          updateDoc(docRef.ref, {
            read: true,
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(updatePromises);

      console.log(
        `✅ ${allDocs.length} notification(s) d'ami marquée(s) comme lue(s)`
      );
    } catch (error) {
      console.warn(
        'Warning: Could not mark friends notifications as read:',
        error
      );
    }
  }

  // Créer une notification générique
  static async createNotification(
    toUserId,
    fromUserId,
    type,
    message,
    data = {}
  ) {
    console.log('🔔 [DEBUG] createNotification appelé:', {
      toUserId,
      fromUserId,
      type,
      message,
      data,
    });

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot create notification');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        console.log('🔔 [DEBUG] Ajout du document dans Firestore...');

        const docRef = await addDoc(collection(db, 'notifications'), {
          to: toUserId,
          from: fromUserId,
          type,
          message,
          data,
          read: false,
          createdAt: serverTimestamp(),
        });

        console.log('🔔 [DEBUG] Notification créée avec ID:', docRef.id);
      });
    } catch (error) {
      console.error('🔔 [DEBUG] Erreur createNotification:', error);
      console.warn('Warning: Could not create notification:', error);
    }
  }

  // Créer une notification pour une invitation
  static async createInvitationNotification(toUserId, fromUserId, activity) {
    try {
      console.log(`🔔 [DEBUG] === DÉBUT CRÉATION NOTIFICATION ===`);
      console.log(
        `🔔 [DEBUG] createInvitationNotification appelée: ${fromUserId} -> ${toUserId} pour ${activity}`
      );

      // Récupérer le nom de l'expéditeur
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

      // Créer la notification d'invitation
      const notification = {
        to: toUserId,
        from: fromUserId,
        type: 'invitation',
        message: `🎉 ${fromUserName} vous invite pour ${activityLabel}`,
        data: {
          activity,
          fromUserId,
          fromUserName,
          activityLabel,
        },
        read: false,
        createdAt: serverTimestamp(),
      };

      const result = await addDoc(
        collection(db, 'notifications'),
        notification
      );

      console.log(
        `🔔 [DEBUG] Notification d'invitation créée: ${result.id} pour ${activityLabel}`
      );
      console.log(`🔔 [DEBUG] === FIN CRÉATION NOTIFICATION ===`);

      return result;
    } catch (error) {
      console.error('❌ Erreur création notification invitation:', error);
      // Ne pas faire échouer l'invitation si la notification échoue
    }
  }

  // Créer une notification pour une invitation avec ID d'invitation
  static async createInvitationNotificationWithId(
    toUserId,
    fromUserId,
    activity,
    invitationId
  ) {
    try {
      console.log(`🔔 [DEBUG] === DÉBUT CRÉATION NOTIFICATION AVEC ID ===`);
      console.log(
        `🔔 [DEBUG] createInvitationNotificationWithId appelée: ${fromUserId} -> ${toUserId} pour ${activity} (invitation: ${invitationId})`
      );

      // Récupérer le nom de l'expéditeur
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

      // Créer la notification d'invitation avec l'ID
      const notification = {
        to: toUserId,
        from: fromUserId,
        type: 'invitation',
        message: `🎉 ${fromUserName} vous invite pour ${activityLabel}`,
        data: {
          activity,
          fromUserId,
          fromUserName,
          activityLabel,
          invitationId, // Ajouter l'ID de l'invitation
        },
        read: false,
        createdAt: serverTimestamp(),
      };

      const result = await addDoc(
        collection(db, 'notifications'),
        notification
      );

      console.log(
        `🔔 [DEBUG] Notification d'invitation créée: ${result.id} pour ${activityLabel} (invitation: ${invitationId})`
      );
      console.log(`🔔 [DEBUG] === FIN CRÉATION NOTIFICATION AVEC ID ===`);

      return result;
    } catch (error) {
      console.error(
        '❌ Erreur création notification invitation avec ID:',
        error
      );
      // Ne pas faire échouer l'invitation si la notification échoue
    }
  }

  // Récupérer les notifications d'un utilisateur
  static async getNotifications(userId) {
    console.log('🔔 [DEBUG] getNotifications appelé pour userId:', userId);

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no notifications');
      return [];
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        orderBy('createdAt', 'desc')
      );

      console.log('🔔 [DEBUG] Exécution de la requête getDocs...');
      const querySnapshot = await getDocs(q);

      console.log('🔔 [DEBUG] Requête terminée, taille:', querySnapshot.size);

      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('🔔 [DEBUG] Notifications récupérées:', notifications.length);
      notifications.forEach((notif, index) => {
        console.log(`🔔 [DEBUG] Notification ${index + 1}:`, {
          id: notif.id,
          type: notif.type,
          message: notif.message,
          read: notif.read,
          createdAt: notif.createdAt?.toDate?.()?.toLocaleString(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('🔔 [DEBUG] Erreur getNotifications:', error);
      console.warn('Warning: Could not get notifications:', error);
      return [];
    }
  }

  // Supprimer définitivement une notification
  static async deleteNotification(notificationId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot delete notification');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await deleteDoc(notificationRef);
      });
      console.log(`✅ Notification ${notificationId} supprimée`);
    } catch (error) {
      console.warn('Warning: Could not delete notification:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues (sans les supprimer)
  static async markAllAsReadOnVisit(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot mark notifications as read');
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('ℹ️ Aucune notification non lue à marquer');
        return;
      }

      const updatePromises = querySnapshot.docs.map(docRef =>
        retryWithBackoff(() =>
          updateDoc(docRef.ref, {
            read: true,
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(updatePromises);

      console.log(
        `✅ ${querySnapshot.docs.length} notification(s) marquée(s) comme lue(s) lors de la visite`
      );
    } catch (error) {
      console.warn(
        'Warning: Could not mark notifications as read on visit:',
        error
      );
    }
  }

  // Supprimer les notifications d'invitation pour une activité spécifique
  static async removeInvitationNotification(toUserId, fromUserId, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot remove invitation notification');
      return;
    }

    try {
      console.log(
        `🗑️ Suppression notification invitation: ${fromUserId} -> ${toUserId} pour ${activity}`
      );

      const q = query(
        collection(db, 'notifications'),
        where('to', '==', toUserId),
        where('from', '==', fromUserId),
        where('type', '==', 'invitation'),
        where('data.activity', '==', activity)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`ℹ️ Aucune notification d'invitation trouvée à supprimer`);
        return;
      }

      const deletePromises = querySnapshot.docs.map(doc =>
        retryWithBackoff(() => deleteDoc(doc.ref))
      );

      await Promise.all(deletePromises);

      console.log(
        `✅ ${querySnapshot.docs.length} notification(s) d'invitation supprimée(s)`
      );
    } catch (error) {
      console.error('❌ Erreur suppression notification invitation:', error);
    }
  }

  // Alias pour listenToNotifications (compatibilité)
  static listenToNotifications(userId, callback) {
    return this.onNotifications(userId, callback);
  }

  // Annuler les notifications d'invitation envoyées par un utilisateur pour une activité
  static async cancelInvitationNotifications(fromUserId, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot cancel invitation notifications');
      return;
    }

    try {
      console.log(
        `🚫 Annulation des notifications d'invitation de ${fromUserId} pour ${activity}...`
      );

      // Chercher toutes les notifications d'invitation (lues ET non lues) envoyées par cet utilisateur pour cette activité
      const invitationNotificationsQuery = query(
        collection(db, 'notifications'),
        where('from', '==', fromUserId),
        where('type', '==', 'invitation'),
        where('data.activity', '==', activity)
      );

      const snapshot = await getDocs(invitationNotificationsQuery);

      if (snapshot.empty) {
        console.log(
          `ℹ️ Aucune notification d'invitation à annuler pour ${activity}`
        );
        return { cancelled: 0 };
      }

      console.log(
        `🚫 Suppression de ${snapshot.docs.length} notifications d'invitation...`
      );

      // Supprimer toutes les notifications d'invitation
      const deletePromises = snapshot.docs.map(doc => {
        console.log(
          `🗑️ Suppression notification: ${doc.id} (read: ${doc.data().read})`
        );
        return retryWithBackoff(() => deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      console.log(
        `✅ ${snapshot.docs.length} notification(s) d'invitation annulée(s) pour ${activity}`
      );

      return { cancelled: snapshot.docs.length };
    } catch (error) {
      console.error('❌ Erreur annulation notifications invitation:', error);
      throw error;
    }
  }

  // Nettoyer toutes les notifications liées à une activité
  static async cleanupActivityNotifications(userId, activity) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot cleanup activity notifications');
      return;
    }

    try {
      console.log(
        `🧹 Nettoyage notifications d'activité ${activity} pour ${userId}...`
      );

      // Nettoyer les notifications envoyées par cet utilisateur (invitations)
      const sentNotificationsQuery = query(
        collection(db, 'notifications'),
        where('from', '==', userId),
        where('type', '==', 'invitation'),
        where('data.activity', '==', activity)
      );

      // Nettoyer les notifications reçues par cet utilisateur pour cette activité
      const receivedNotificationsQuery = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        where('type', '==', 'invitation'),
        where('data.activity', '==', activity)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentNotificationsQuery),
        getDocs(receivedNotificationsQuery),
      ]);

      const allNotifications = [...sentSnapshot.docs, ...receivedSnapshot.docs];

      if (allNotifications.length > 0) {
        const deletePromises = allNotifications.map(doc =>
          retryWithBackoff(() => deleteDoc(doc.ref))
        );

        await Promise.all(deletePromises);

        console.log(
          `✅ ${allNotifications.length} notification(s) d'activité supprimée(s) pour ${activity}`
        );
      } else {
        console.log(
          `ℹ️ Aucune notification d'activité trouvée pour ${activity}`
        );
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications activité:', error);
    }
  }
}
