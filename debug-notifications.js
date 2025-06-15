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

console.log('🧪 === FIN DÉBOGAGE ===');
