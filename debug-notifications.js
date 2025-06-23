// Script de débogage pour les notifications
// À exécuter dans la console du navigateur

console.log('🧪 === DÉBOGAGE NOTIFICATIONS ===');

// Test 1: Vérifier Firebase
console.log('1. Test Firebase...');
if (typeof firebase !== 'undefined') {
  console.log('✅ Firebase disponible');
  console.log('Auth:', firebase.auth().currentUser);
} else {
  console.log('❌ Firebase non disponible');
}

// Test 2: Vérifier Firestore
console.log('2. Test Firestore...');
try {
  const db = firebase.firestore();
  console.log('✅ Firestore disponible');

  // Test 3: Récupérer les notifications
  console.log('3. Test récupération notifications...');
  const user = firebase.auth().currentUser;
  if (user) {
    console.log('✅ Utilisateur connecté:', user.uid);

    db.collection('notifications')
      .where('to', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get()
      .then(snapshot => {
        console.log(
          '✅ Requête réussie, nombre de notifications:',
          snapshot.size
        );
        snapshot.docs.forEach((doc, index) => {
          console.log(`📋 Notification ${index + 1}:`, doc.data());
        });

        if (snapshot.size === 0) {
          console.log(
            'ℹ️ Aucune notification trouvée - créons-en une de test...'
          );

          // Test 4: Créer une notification de test
          db.collection('notifications')
            .add({
              to: user.uid,
              from: user.uid,
              type: 'test',
              message:
                '🧪 Notification de test créée par le script de débogage',
              data: { testScript: true },
              read: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(docRef => {
              console.log('✅ Notification de test créée:', docRef.id);
              console.log('🔄 Relancez le script pour voir la notification');
            })
            .catch(error => {
              console.error('❌ Erreur création notification:', error);
            });
        }
      })
      .catch(error => {
        console.error('❌ Erreur requête notifications:', error);
        console.log('💡 Vérifiez les règles Firestore et les index');
      });
  } else {
    console.log('❌ Aucun utilisateur connecté');
  }
} catch (error) {
  console.error('❌ Erreur Firestore:', error);
}

// Fonction pour nettoyer les notifications de test persistantes
window.cleanupTestNotifications = async function () {
  console.log('🧹 Nettoyage des notifications de test...');

  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }

    // Récupérer toutes les notifications de l'utilisateur
    const notificationsRef = firebase.firestore().collection('notifications');
    const notificationsQuery = notificationsRef.where(
      'to',
      '==',
      currentUser.uid
    );
    const snapshot = await notificationsQuery.get();

    console.log(`🔍 ${snapshot.size} notifications trouvées`);

    let deletedCount = 0;
    const batch = firebase.firestore().batch();

    snapshot.forEach(doc => {
      const data = doc.data();
      const message = data.message || '';

      // Supprimer les notifications de test (contenant "Raph3", "Test User", etc.)
      if (
        message.includes('Raph3') ||
        message.includes('Test User') ||
        message.includes('🧪') ||
        (data.data && data.data.testData) ||
        (data.from &&
          (data.from.includes('test') || data.from === 'test-user-123'))
      ) {
        console.log(`🗑️ Suppression notification test: ${message}`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ ${deletedCount} notifications de test supprimées`);

      // Rafraîchir la page pour voir le changement
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('ℹ️ Aucune notification de test à supprimer');
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage notifications:', error);
  }
};

// 🔧 TEST CORRECTION RÉGRESSION: Vérifier compatibilité Legacy + Phase 3
window.testInvitationCompatibility = async function () {
  console.log('🔧 === TEST CORRECTION RÉGRESSION INVITATIONS ===');

  try {
    // 1. Vérifier l'utilisateur connecté
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }

    console.log('👤 Utilisateur connecté:', currentUser.uid);

    // 2. Test récupération invitations avec méthode corrigée
    console.log('📥 Test récupération invitations (Legacy + Phase 3)...');

    // Simuler les deux requêtes comme dans notre correction
    const legacyQuery = firebase
      .firestore()
      .collection('invitations')
      .where('toUserId', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc');

    const multipleQuery = firebase
      .firestore()
      .collection('invitations')
      .where('toUserIds', 'array-contains', currentUser.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc');

    // Exécuter les deux requêtes en parallèle
    console.log('🔍 Exécution des requêtes Legacy + Phase 3...');
    const [legacySnapshot, multipleSnapshot] = await Promise.all([
      legacyQuery.get(),
      multipleQuery.get(),
    ]);

    console.log(`📊 Résultats:`, {
      legacyInvitations: legacySnapshot.size,
      multipleInvitations: multipleSnapshot.size,
      total: legacySnapshot.size + multipleSnapshot.size,
    });

    // 3. Analyser les invitations legacy
    console.log('📋 === INVITATIONS LEGACY (toUserId) ===');
    legacySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Legacy ${index + 1}:`, {
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        activity: data.activity,
        status: data.status,
        type: 'LEGACY',
        createdAt:
          data.createdAt?.toDate?.()?.toLocaleString() || 'Date invalide',
      });
    });

    // 4. Analyser les invitations multiples
    console.log('📋 === INVITATIONS MULTIPLES (toUserIds) ===');
    multipleSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Multiple ${index + 1}:`, {
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserIds: data.toUserIds,
        activity: data.activity,
        status: data.status,
        type: 'PHASE3',
        isMultipleInvitation: data.isMultipleInvitation,
        totalRecipients: data.totalRecipients,
        acceptedByUserIds: data.acceptedByUserIds?.length || 0,
        createdAt:
          data.createdAt?.toDate?.()?.toLocaleString() || 'Date invalide',
      });
    });

    // 5. Test de la logique de détection automatique
    console.log('🧪 === TEST DÉTECTION AUTOMATIQUE ===');

    // Simuler une invitation legacy
    const mockLegacy = {
      id: 'test-legacy',
      toUserId: currentUser.uid,
      fromUserId: 'alice',
      activity: 'coffee',
      status: 'pending',
    };

    const isLegacy = !!mockLegacy.toUserId;
    const isMultiple = !!mockLegacy.toUserIds;
    console.log('🧪 Mock Legacy:', {
      isLegacy,
      isMultiple,
      correct: isLegacy && !isMultiple,
    });

    // Simuler une invitation multiple
    const mockMultiple = {
      id: 'test-multiple',
      toUserIds: [currentUser.uid, 'bob'],
      fromUserId: 'alice',
      activity: 'lunch',
      status: 'pending',
      isMultipleInvitation: true,
    };

    const isMultipleCheck = !!mockMultiple.toUserIds;
    const isLegacyCheck = !!mockMultiple.toUserId;
    console.log('🧪 Mock Multiple:', {
      isLegacy: isLegacyCheck,
      isMultiple: isMultipleCheck,
      correct: !isLegacyCheck && isMultipleCheck,
    });

    // 6. Test autorisations
    console.log('🔒 === TEST AUTORISATIONS ===');
    const canRespondLegacy = mockLegacy.toUserId === currentUser.uid;
    const canRespondMultiple = mockMultiple.toUserIds.includes(currentUser.uid);

    console.log('🔒 Autorisations:', {
      legacy: canRespondLegacy,
      multiple: canRespondMultiple,
      bothWork: canRespondLegacy && canRespondMultiple,
    });

    // 7. Comparer avec les notifications
    console.log('🔔 === COMPARAISON AVEC NOTIFICATIONS ===');
    const notifications = await firebase
      .firestore()
      .collection('notifications')
      .where('to', '==', currentUser.uid)
      .where('type', '==', 'invitation')
      .where('read', '==', false)
      .get();

    console.log(
      `🔔 Notifications d'invitation non lues: ${notifications.size}`
    );
    console.log(
      `📨 Invitations Firestore totales: ${legacySnapshot.size + multipleSnapshot.size}`
    );

    if (notifications.size !== legacySnapshot.size + multipleSnapshot.size) {
      console.warn(
        '⚠️ ATTENTION: Décalage entre notifications et invitations Firestore!'
      );
      console.warn(
        "Cela pourrait expliquer pourquoi les invitations ne s'affichent pas."
      );
    } else {
      console.log('✅ Cohérence notifications ↔ invitations vérifiée');
    }

    console.log('🔧 === FIN TEST CORRECTION RÉGRESSION ===');

    return {
      legacy: legacySnapshot.size,
      multiple: multipleSnapshot.size,
      notifications: notifications.size,
      coherent:
        notifications.size === legacySnapshot.size + multipleSnapshot.size,
    };
  } catch (error) {
    console.error('❌ Erreur test compatibilité:', error);
    return { error: error.message };
  }
};

// Ajouter un raccourci dans la console
console.log('🔧 Fonction disponible: testInvitationCompatibility()');

console.log('🧪 === FIN DÉBOGAGE ===');
