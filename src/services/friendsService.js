// Service de gestion des amis
import {
  addDoc,
  arrayRemove,
  arrayUnion,
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

export class FriendsService {
  // Normaliser un numéro de téléphone
  static normalizePhoneNumber(phoneNumber) {
    // Supprimer tous les espaces, tirets et parenthèses
    let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Si le numéro commence par 0, le remplacer par +33
    if (normalized.startsWith('0')) {
      normalized = '+33' + normalized.substring(1);
    }

    // Si le numéro ne commence pas par +, ajouter +33
    if (!normalized.startsWith('+')) {
      normalized = '+33' + normalized;
    }

    return normalized;
  }

  // Debug : lister tous les utilisateurs
  static async debugListAllUsers() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        '⚠️ Cette fonction est disponible uniquement en développement'
      );
      return [];
    }

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot list users');
      return [];
    }

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('👥 Tous les utilisateurs:', users);
      return users;
    } catch (error) {
      console.error('❌ Error listing users:', error);
      return [];
    }
  }

  // Debug : analyser les données d'amitié
  static async debugFriendshipData(currentUserId) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        '⚠️ Cette fonction est disponible uniquement en développement'
      );
      return;
    }

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot debug friendship data');
      return;
    }

    try {
      console.log("🔍 [DEBUG] Analyse des relations d'amitié Firebase...");

      // 1. Analyser l'utilisateur actuel
      const currentUserRef = doc(db, 'users', currentUserId);
      const currentUserSnap = await getDoc(currentUserRef);

      if (currentUserSnap.exists()) {
        const currentUserData = currentUserSnap.data();
        console.log('👤 [DEBUG] Utilisateur actuel:', {
          id: currentUserId,
          name: currentUserData.name,
          friends: currentUserData.friends || [],
          friendsCount: (currentUserData.friends || []).length,
        });
      }

      // 2. Lister tous les utilisateurs
      const allUsers = await this.debugListAllUsers();
      console.log(`👥 [DEBUG] Total utilisateurs en base: ${allUsers.length}`);

      // 3. Analyser les amitiés mutuelles
      const friendshipQuery = query(collection(db, 'friendships'));
      const friendshipSnapshot = await getDocs(friendshipQuery);

      console.log(
        `🤝 [DEBUG] Relations d'amitié en base: ${friendshipSnapshot.size}`
      );

      friendshipSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('🤝 [DEBUG] Relation:', {
          id: doc.id,
          user1: data.user1,
          user2: data.user2,
          status: data.status,
          createdAt: data.createdAt,
        });
      });
    } catch (error) {
      console.error('❌ [DEBUG] Erreur analyse amitié:', error);
    }
  }

  // Ajouter des amitiés de test
  static async addTestFriendships(currentUserId) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        '⚠️ Cette fonction est disponible uniquement en développement'
      );
      return [];
    }

    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot add test friendships');
      return [];
    }

    try {
      const allUsers = await this.debugListAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUserId);

      if (otherUsers.length === 0) {
        console.log(
          'ℹ️ [DEBUG] Aucun autre utilisateur trouvé pour créer des amitiés'
        );
        return [];
      }

      const friendships = [];

      // Créer une amitié avec les 2 premiers autres utilisateurs
      const usersToAddAsFriends = otherUsers.slice(0, 2);

      for (const user of usersToAddAsFriends) {
        try {
          await this.addMutualFriendship(currentUserId, user.id);
          friendships.push({
            id: user.id,
            name: user.name,
          });
          console.log(`✅ [DEBUG] Amitié créée avec ${user.name} (${user.id})`);
        } catch (error) {
          console.warn(
            `⚠️ [DEBUG] Erreur création amitié avec ${user.name}:`,
            error
          );
        }
      }

      return friendships;
    } catch (error) {
      console.error('❌ [DEBUG] Erreur création amitiés de test:', error);
      return [];
    }
  }

  // Ajouter un ami par numéro de téléphone
  static async addFriendByPhone(currentUserId, phoneNumber) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot add friend');
      throw new Error('Connexion requise pour ajouter un ami');
    }

    try {
      return await retryWithBackoff(async () => {
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
        console.log(
          '📱 Recherche utilisateur avec téléphone:',
          normalizedPhone
        );

        // Chercher l'utilisateur par numéro de téléphone
        const usersQuery = query(
          collection(db, 'users'),
          where('phone', '==', normalizedPhone)
        );

        const usersSnapshot = await getDocs(usersQuery);

        if (!usersSnapshot.empty) {
          // L'utilisateur existe dans l'app
          const friendDoc = usersSnapshot.docs[0];
          const friendId = friendDoc.id;
          const friendData = friendDoc.data();

          if (friendId === currentUserId) {
            throw new Error('Vous ne pouvez pas vous ajouter comme ami');
          }

          // Vérifier si une invitation existe déjà
          const existingInvitationQuery = query(
            collection(db, 'friend_invitations'),
            where('fromUserId', '==', currentUserId),
            where('toUserId', '==', friendId),
            where('status', '==', 'pending')
          );
          const existingInvitations = await getDocs(existingInvitationQuery);

          if (!existingInvitations.empty) {
            throw new Error(
              'Une invitation est déjà en cours pour cet utilisateur'
            );
          }

          // Vérifier si l'amitié existe déjà
          const currentUserRef = doc(db, 'users', currentUserId);
          const currentUserSnap = await getDoc(currentUserRef);

          if (currentUserSnap.exists()) {
            const currentUserData = currentUserSnap.data();
            const friends = currentUserData.friends || [];

            if (friends.includes(friendId)) {
              throw new Error('Cette personne est déjà dans vos amis');
            }
          }

          // Créer l'invitation d'amitié (pas l'amitié directe)
          await this.createFriendInvitation(currentUserId, friendId);

          console.log("✅ Invitation d'amitié envoyée à:", friendData.name);
          return {
            id: friendId,
            ...friendData,
            invitationSent: true, // Invitation envoyée, pas ami direct
          };
        } else {
          // Essayer avec des variantes du format (comme dans l'ancienne version)
          const phoneVariants = [
            normalizedPhone,
            phoneNumber, // Format original
            phoneNumber.replace(/\s+/g, ''), // Sans espaces
          ];

          console.log('🔍 Recherche avec variantes:', phoneVariants);

          for (const variant of phoneVariants) {
            if (variant !== normalizedPhone) {
              const qVariant = query(
                collection(db, 'users'),
                where('phone', '==', variant)
              );
              const variantSnapshot = await getDocs(qVariant);

              if (!variantSnapshot.empty) {
                const friendDoc = variantSnapshot.docs[0];
                const friendId = friendDoc.id;
                const friendData = friendDoc.data();

                if (friendId === currentUserId) {
                  throw new Error('Vous ne pouvez pas vous ajouter vous-même');
                }

                // Même vérifications que ci-dessus
                const existingInvitationQuery = query(
                  collection(db, 'friend_invitations'),
                  where('fromUserId', '==', currentUserId),
                  where('toUserId', '==', friendId),
                  where('status', '==', 'pending')
                );
                const existingInvitations = await getDocs(
                  existingInvitationQuery
                );

                if (!existingInvitations.empty) {
                  throw new Error(
                    'Une invitation est déjà en cours pour cet utilisateur'
                  );
                }

                await this.createFriendInvitation(currentUserId, friendId);
                console.log(
                  '✅ Invitation trouvée avec variante:',
                  friendData.name
                );
                return { ...friendData, invitationSent: true };
              }
            }
          }

          // COMPORTEMENT CORRECT : Si l'utilisateur n'existe pas, erreur explicite
          throw new Error(
            "Utilisateur non trouvé avec ce numéro. Assurez-vous que cette personne s'est déjà connectée à l'application."
          );
        }
      });
    } catch (error) {
      console.error('❌ Add friend by phone failed:', error);
      throw new Error(`Impossible d'ajouter cet ami: ${error.message}`);
    }
  }

  // Ajouter un ami par ID utilisateur (pour QR code ou lien direct)
  static async addFriendByUserId(currentUserId, friendUserId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot add friend');
      throw new Error('Connexion requise pour ajouter un ami');
    }

    try {
      return await retryWithBackoff(async () => {
        console.log('🆔 Ajout ami par ID utilisateur:', friendUserId);

        if (friendUserId === currentUserId) {
          throw new Error('Vous ne pouvez pas vous ajouter comme ami');
        }

        // Vérifier que l'utilisateur cible existe
        const friendRef = doc(db, 'users', friendUserId);
        const friendSnap = await getDoc(friendRef);

        if (!friendSnap.exists()) {
          throw new Error('Utilisateur non trouvé');
        }

        const friendData = friendSnap.data();

        // Vérifier si l'amitié existe déjà
        const currentUserRef = doc(db, 'users', currentUserId);
        const currentUserSnap = await getDoc(currentUserRef);

        if (currentUserSnap.exists()) {
          const currentUserData = currentUserSnap.data();
          const friends = currentUserData.friends || [];

          if (friends.includes(friendUserId)) {
            throw new Error('Cette personne est déjà dans vos amis');
          }
        }

        // Créer l'amitié mutuelle
        await this.addMutualFriendship(currentUserId, friendUserId);

        console.log('✅ Ami ajouté avec succès par ID');
        return {
          id: friendUserId,
          ...friendData,
          invitationSent: false,
        };
      });
    } catch (error) {
      console.error('❌ Add friend by user ID failed:', error);
      throw new Error(`Impossible d'ajouter cet ami: ${error.message}`);
    }
  }

  // Obtenir la liste des amis
  static async getFriends(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, returning empty friends list');
      return [];
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn('User not found');
          return [];
        }

        const userData = userSnap.data();
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
          return [];
        }

        // Récupérer les données de tous les amis
        const friendsData = [];
        for (const friendId of friendIds) {
          try {
            const friendRef = doc(db, 'users', friendId);
            const friendSnap = await getDoc(friendRef);

            if (friendSnap.exists()) {
              friendsData.push({
                id: friendSnap.id,
                ...friendSnap.data(),
              });
            }
          } catch (error) {
            console.warn(`Could not fetch friend ${friendId}:`, error);
          }
        }

        return friendsData;
      });
    } catch (error) {
      console.error('❌ Get friends failed:', error);
      return [];
    }
  }

  // Écouter les changements d'amis
  static onUserFriendsChange(userId, callback) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no friends updates');
      callback([]);
      return () => {};
    }

    try {
      const userRef = doc(db, 'users', userId);

      return onSnapshot(userRef, async doc => {
        if (doc.exists()) {
          const userData = doc.data();
          const friendIds = userData.friends || [];

          // Récupérer les données des amis
          const friends = await this.getFriends(userId);
          callback(friends);
        } else {
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error listening to friends changes:', error);
      callback([]);
      return () => {};
    }
  }

  // Alias pour compatibilité avec l'ancienne API
  static listenToFriends(userId, callback) {
    return this.onUserFriendsChange(userId, callback);
  }

  // Créer une invitation d'amitié
  static async createFriendInvitation(fromUserId, toUserId) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour envoyer une invitation');
    }

    try {
      return await retryWithBackoff(async () => {
        // Vérifier si une invitation existe déjà
        const existingInvitationQuery = query(
          collection(db, 'friend_invitations'),
          where('fromUserId', '==', fromUserId),
          where('toUserId', '==', toUserId),
          where('status', '==', 'pending')
        );

        const existingInvitations = await getDocs(existingInvitationQuery);

        if (!existingInvitations.empty) {
          throw new Error(
            'Une invitation est déjà en attente pour cet utilisateur'
          );
        }

        // Récupérer les données de l'expéditeur pour la notification
        const fromUserRef = doc(db, 'users', fromUserId);
        const fromUserSnap = await getDoc(fromUserRef);

        if (!fromUserSnap.exists()) {
          throw new Error('Utilisateur expéditeur non trouvé');
        }

        const fromUserData = fromUserSnap.data();

        // Créer la nouvelle invitation
        const invitationData = {
          fromUserId,
          toUserId,
          status: 'pending',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        };

        const invitationRef = await addDoc(
          collection(db, 'friend_invitations'),
          invitationData
        );

        // Créer la notification pour le destinataire
        const notificationData = {
          to: toUserId,
          from: fromUserId,
          type: 'friend_invitation',
          message: `👥 ${fromUserData.name} souhaite vous ajouter en ami`,
          data: {
            invitationId: invitationRef.id,
            fromUserName: fromUserData.name,
            fromUserId: fromUserId,
            actions: ['accept', 'decline'],
          },
          read: false,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'notifications'), notificationData);

        console.log('✅ Friend invitation created with notification');
        return invitationRef.id;
      });
    } catch (error) {
      console.error('❌ Create friend invitation failed:', error);
      throw new Error(`Impossible d'envoyer l'invitation: ${error.message}`);
    }
  }

  // Répondre à une invitation d'amitié
  static async respondToFriendInvitation(invitationId, response, userId) {
    if (!isOnline()) {
      throw new Error("Connexion requise pour répondre à l'invitation");
    }

    try {
      return await retryWithBackoff(async () => {
        const invitationRef = doc(db, 'friend_invitations', invitationId);
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

        // Si acceptée, créer l'amitié mutuelle
        if (response === 'accepted') {
          await this.addMutualFriendship(
            invitationData.fromUserId,
            invitationData.toUserId
          );

          // Notifier l'expéditeur de l'acceptation
          const toUserRef = doc(db, 'users', userId);
          const toUserSnap = await getDoc(toUserRef);
          const toUserName = toUserSnap.exists()
            ? toUserSnap.data().name
            : 'Un utilisateur';

          const acceptNotificationData = {
            to: invitationData.fromUserId,
            from: userId,
            type: 'friend_invitation_accepted',
            message: `✅ ${toUserName} a accepté votre demande d'ami !`,
            data: {
              friendId: userId,
              friendName: toUserName,
            },
            read: false,
            createdAt: serverTimestamp(),
          };

          await addDoc(collection(db, 'notifications'), acceptNotificationData);
        }

        console.log('✅ Friend invitation response recorded');
        return response;
      });
    } catch (error) {
      console.error('❌ Respond to friend invitation failed:', error);
      throw new Error(
        `Impossible de répondre à l'invitation: ${error.message}`
      );
    }
  }

  // Ajouter une amitié mutuelle
  static async addMutualFriendship(userId1, userId2) {
    if (!isOnline()) {
      throw new Error("Connexion requise pour créer l'amitié");
    }

    try {
      return await retryWithBackoff(async () => {
        // Créer le document de relation d'amitié
        const friendshipData = {
          user1: userId1,
          user2: userId2,
          status: 'accepted',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'friendships'), friendshipData);

        // Ajouter chaque utilisateur dans la liste d'amis de l'autre
        const user1Ref = doc(db, 'users', userId1);
        const user2Ref = doc(db, 'users', userId2);

        await updateDoc(user1Ref, {
          friends: arrayUnion(userId2),
          updatedAt: serverTimestamp(),
        });

        await updateDoc(user2Ref, {
          friends: arrayUnion(userId1),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Mutual friendship created');
      });
    } catch (error) {
      console.error('❌ Add mutual friendship failed:', error);
      throw new Error(`Impossible de créer l'amitié: ${error.message}`);
    }
  }

  // Supprimer un ami
  static async removeFriend(currentUserId, friendId) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour supprimer un ami');
    }

    try {
      return await retryWithBackoff(async () => {
        // Supprimer de la liste d'amis de chaque utilisateur
        const currentUserRef = doc(db, 'users', currentUserId);
        const friendRef = doc(db, 'users', friendId);

        await updateDoc(currentUserRef, {
          friends: arrayRemove(friendId),
          updatedAt: serverTimestamp(),
        });

        await updateDoc(friendRef, {
          friends: arrayRemove(currentUserId),
          updatedAt: serverTimestamp(),
        });

        // Supprimer la relation d'amitié dans la collection friendships
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('user1', 'in', [currentUserId, friendId]),
          where('user2', 'in', [currentUserId, friendId])
        );

        const friendshipsSnapshot = await getDocs(friendshipsQuery);
        const deletePromises = friendshipsSnapshot.docs.map(doc =>
          deleteDoc(doc.ref)
        );

        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
        }

        console.log('✅ Friend removed successfully');
      });
    } catch (error) {
      console.error('❌ Remove friend failed:', error);
      throw new Error(`Impossible de supprimer cet ami: ${error.message}`);
    }
  }
}
