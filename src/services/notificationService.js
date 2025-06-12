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
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no notifications');
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId)
      );

      return onSnapshot(q, snapshot => {
        const notifications = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(notif => !notif.read)
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date();
            const bTime = b.createdAt?.toDate?.() || new Date();
            return bTime - aTime;
          });

        callback(notifications);
      });
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
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot create notification');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        await addDoc(collection(db, 'notifications'), {
          to: toUserId,
          from: fromUserId,
          type,
          message,
          data,
          read: false,
          createdAt: serverTimestamp(),
        });
      });
    } catch (error) {
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
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no notifications');
      return [];
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn('Warning: Could not get notifications:', error);
      return [];
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

      // Chercher toutes les notifications d'invitation non lues envoyées par cet utilisateur pour cette activité
      const invitationNotificationsQuery = query(
        collection(db, 'notifications'),
        where('from', '==', fromUserId),
        where('type', '==', 'invitation'),
        where('data.activity', '==', activity),
        where('read', '==', false)
      );

      const snapshot = await getDocs(invitationNotificationsQuery);

      if (snapshot.empty) {
        console.log(
          `ℹ️ Aucune notification d'invitation à annuler pour ${activity}`
        );
        return { cancelled: 0 };
      }

      // Supprimer toutes les notifications d'invitation
      const deletePromises = snapshot.docs.map(doc =>
        retryWithBackoff(() => deleteDoc(doc.ref))
      );

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
