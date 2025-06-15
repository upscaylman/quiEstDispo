// Script de débogage pour les invitations d'activité
// À exécuter dans la console du navigateur

console.log('🐛 DÉBOGAGE INVITATIONS - Script chargé');

// Fonction pour débugger les invitations
window.debugInvitations = async function () {
  console.log('🔍 === DÉBUT DÉBOGAGE INVITATIONS ===');

  try {
    // 1. Vérifier l'utilisateur connecté
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }

    console.log('👤 Utilisateur connecté:', {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName,
    });

    // 2. Récupérer toutes les notifications
    console.log('📥 Récupération des notifications...');
    const notifications = await firebase
      .firestore()
      .collection('notifications')
      .where('to', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`📊 Total notifications trouvées: ${notifications.size}`);

    // 3. Filtrer les invitations d'activité
    const invitations = [];
    notifications.forEach(doc => {
      const data = doc.data();
      if (data.type === 'invitation') {
        invitations.push({
          id: doc.id,
          ...data,
        });
      }
    });

    console.log(`🎯 Invitations d'activité trouvées: ${invitations.length}`);

    // 4. Analyser chaque invitation
    invitations.forEach((invitation, index) => {
      console.log(`📋 Invitation ${index + 1}:`, {
        id: invitation.id,
        message: invitation.message,
        type: invitation.type,
        read: invitation.read,
        from: invitation.from,
        to: invitation.to,
        data: invitation.data,
        createdAt:
          invitation.createdAt?.toDate?.()?.toLocaleString() || 'Date invalide',
      });
    });

    // 5. Vérifier les invitations dans Firestore
    console.log('📨 Vérification des invitations Firestore...');
    const firestoreInvitations = await firebase
      .firestore()
      .collection('invitations')
      .where('toUserId', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .get();

    console.log(
      `📨 Invitations Firestore pending: ${firestoreInvitations.size}`
    );

    firestoreInvitations.forEach(doc => {
      const data = doc.data();
      console.log('📨 Invitation Firestore:', {
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        activity: data.activity,
        status: data.status,
        createdAt:
          data.createdAt?.toDate?.()?.toLocaleString() || 'Date invalide',
      });
    });

    // 6. Tester la création d'une invitation de test
    console.log('🧪 Test création invitation...');
    const testFriends = await firebase
      .firestore()
      .collection('users')
      .where('friends', 'array-contains', currentUser.uid)
      .limit(1)
      .get();

    if (testFriends.size > 0) {
      const friend = testFriends.docs[0];
      console.log('👥 Ami trouvé pour test:', friend.data().name);

      // Créer une invitation de test
      const testInvitation = {
        fromUserId: currentUser.uid,
        toUserId: friend.id,
        activity: 'cafe',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };

      const invitationRef = await firebase
        .firestore()
        .collection('invitations')
        .add(testInvitation);

      console.log('✅ Invitation test créée:', invitationRef.id);

      // Créer la notification correspondante
      const testNotification = {
        to: friend.id,
        from: currentUser.uid,
        type: 'invitation',
        message: `🎉 ${currentUser.displayName || 'Un ami'} vous invite pour Café`,
        data: {
          activity: 'cafe',
          fromUserId: currentUser.uid,
          fromUserName: currentUser.displayName || 'Un ami',
          activityLabel: 'Café',
          invitationId: invitationRef.id,
        },
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const notificationRef = await firebase
        .firestore()
        .collection('notifications')
        .add(testNotification);

      console.log('✅ Notification test créée:', notificationRef.id);
    } else {
      console.log('⚠️ Aucun ami trouvé pour créer une invitation de test');
    }
  } catch (error) {
    console.error('❌ Erreur pendant le débogage:', error);
  }

  console.log('🔍 === FIN DÉBOGAGE INVITATIONS ===');
};

// Fonction pour créer une invitation de test vers soi-même
window.createTestInvitation = async function () {
  console.log('🧪 Création invitation de test vers soi-même...');

  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }

    // Créer une invitation vers soi-même pour test
    const testInvitation = {
      fromUserId: 'test-user-123',
      toUserId: currentUser.uid,
      activity: 'cafe',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const invitationRef = await firebase
      .firestore()
      .collection('invitations')
      .add(testInvitation);

    console.log('✅ Invitation test créée:', invitationRef.id);

    // Créer la notification correspondante
    const testNotification = {
      to: currentUser.uid,
      from: 'test-user-123',
      type: 'invitation',
      message: `🎉 Test User vous invite pour Café`,
      data: {
        activity: 'cafe',
        fromUserId: 'test-user-123',
        fromUserName: 'Test User',
        activityLabel: 'Café',
        invitationId: invitationRef.id,
      },
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const notificationRef = await firebase
      .firestore()
      .collection('notifications')
      .add(testNotification);

    console.log('✅ Notification test créée:', notificationRef.id);
    console.log(
      "🎯 Allez dans le centre de notifications pour voir l'invitation !"
    );
  } catch (error) {
    console.error('❌ Erreur création invitation test:', error);
  }
};

console.log(`
🚀 COMMANDES DISPONIBLES:

1. debugInvitations() - Analyser toutes les invitations
2. createTestInvitation() - Créer une invitation de test

Exécutez ces fonctions dans la console pour débugger.
`);
