import {
  FacebookAuthProvider,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';
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
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Utilitaire pour vérifier la connectivité (amélioré)
const isOnline = () => {
  // navigator.onLine peut être peu fiable, on assume connecté par défaut
  if (typeof navigator === 'undefined') return true;

  // Si navigator.onLine dit offline, on fait confiance
  if (!navigator.onLine) return false;

  // Sinon on assume connecté (Firebase gèrera les erreurs réseau)
  return true;
};

// Messages d'erreur réseau simplifiés avec debug (moins verbeux)
const getNetworkErrorMessage = (defaultMessage = 'Erreur de connexion') => {
  const onlineStatus = isOnline();

  // Seulement log si réellement offline
  if (!onlineStatus) {
    console.log('🌐 Network status: offline detected');
    return 'Pas de connexion internet détectée';
  }
  return 'Problème de réseau temporaire, réessayez';
};

// Utilitaire pour retry avec backoff optimisé
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 500) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        const delay = baseDelay * Math.pow(1.5, i); // Moins agressif
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Service d'authentification ultra-simplifié avec App Check
export class AuthService {
  // Connexion avec Google selon la documentation officielle
  static async signInWithGoogle() {
    try {
      // eslint-disable-next-line no-console
      console.log('🔥 Firebase: Starting Google sign-in...');

      const provider = new GoogleAuthProvider();

      // Configuration selon la documentation Firebase
      provider.addScope('email');
      provider.addScope('profile');

      // Paramètres optionnels recommandés
      provider.setCustomParameters({
        // Forcer la sélection de compte pour permettre de changer d'utilisateur
        prompt: 'select_account',
        // Langue française pour l'interface Google
        hl: 'fr',
      });

      const result = await signInWithPopup(auth, provider);

      // Récupérer les credentials Google selon la documentation
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      // eslint-disable-next-line no-console
      console.log('✅ Firebase: Google sign-in successful');

      if (process.env.NODE_ENV === 'development' && token) {
        console.log('🔑 Google Access Token available for API calls');
      }

      // Créer le profil utilisateur avec les informations Google
      if (result.user) {
        try {
          await this.createUserProfile(result.user);
        } catch (profileError) {
          // eslint-disable-next-line no-console
          console.warn(
            '⚠️ Profile creation failed, continuing anyway:',
            profileError
          );
        }
      }

      return {
        user: result.user,
        credential,
        token,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Google sign-in failed:', error);

      // Gestion d'erreurs spécifiques selon la documentation Firebase
      let errorMessage = 'Connexion Google échouée';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Connexion annulée par l'utilisateur";
          break;
        case 'auth/popup-blocked':
          errorMessage =
            'Popup bloquée par le navigateur. Autorisez les popups pour ce site';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage =
            'Demande de connexion annulée. Une autre connexion est en cours';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage =
            'Un compte existe déjà avec cette adresse email mais un autre fournisseur';
          break;
        case 'auth/auth-domain-config-required':
          errorMessage = 'Configuration de domaine manquante dans Firebase';
          break;
        case 'auth/credential-already-in-use':
          errorMessage =
            'Ces identifiants sont déjà utilisés par un autre compte';
          break;
        case 'auth/operation-not-allowed':
          errorMessage =
            "Connexion Google non activée. Contactez l'administrateur";
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Problème de connexion. Vérifiez votre internet';
          break;
        case 'auth/internal-error':
          errorMessage = 'Erreur interne. Réessayez dans quelques instants';
          break;
        case 'auth/invalid-api-key':
          errorMessage = 'Configuration Firebase incorrecte';
          break;
        default:
          errorMessage = error.message || 'Connexion Google échouée';
      }

      throw new Error(errorMessage);
    }
  }

  // Connexion Google avec redirection (alternative pour appareils mobiles)
  static async signInWithGoogleRedirect() {
    try {
      console.log('🔄 Starting Google sign-in with redirect...');

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
        hl: 'fr',
      });

      // Import dynamique pour éviter les erreurs si non disponible
      const { signInWithRedirect } = await import('firebase/auth');

      // Démarrer la redirection
      await signInWithRedirect(auth, provider);
      // Note: La page va être rechargée, le résultat sera traité par getGoogleRedirectResult()
    } catch (error) {
      console.error('❌ Google redirect sign-in failed:', error);
      throw new Error(`Redirection Google échouée: ${error.message}`);
    }
  }

  // Récupérer le résultat de la redirection Google
  static async getGoogleRedirectResult() {
    try {
      console.log('🔍 Checking for Google redirect result...');

      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(auth);

      if (result) {
        console.log('✅ Google redirect sign-in successful');

        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        // Créer le profil utilisateur
        if (result.user) {
          await this.createUserProfile(result.user);
        }

        return {
          user: result.user,
          credential,
          token,
        };
      }

      return null; // Pas de redirection en cours
    } catch (error) {
      console.error('❌ Google redirect result failed:', error);
      throw new Error(`Récupération redirection échouée: ${error.message}`);
    }
  }

  // Connexion avec Facebook selon la documentation officielle
  static async signInWithFacebook() {
    try {
      // eslint-disable-next-line no-console
      console.log('🔥 Firebase: Starting Facebook sign-in...');

      const provider = new FacebookAuthProvider();

      // Configuration selon la documentation Firebase
      provider.addScope('email');
      provider.addScope('public_profile');

      // Paramètres optionnels recommandés
      provider.setCustomParameters({
        // Langue française pour l'interface Facebook
        locale: 'fr_FR',
      });

      const result = await signInWithPopup(auth, provider);

      // Récupérer les credentials Facebook selon la documentation
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      // eslint-disable-next-line no-console
      console.log('✅ Firebase: Facebook sign-in successful');

      if (process.env.NODE_ENV === 'development' && token) {
        console.log('🔑 Facebook Access Token available for API calls');
      }

      // Créer le profil utilisateur avec les informations Facebook
      if (result.user) {
        try {
          await this.createUserProfile(result.user);
        } catch (profileError) {
          // eslint-disable-next-line no-console
          console.warn(
            '⚠️ Profile creation failed, continuing anyway:',
            profileError
          );
        }
      }

      return {
        user: result.user,
        credential,
        token,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Facebook sign-in failed:', error);

      // Gestion d'erreurs spécifiques selon la documentation Firebase
      let errorMessage = 'Connexion Facebook échouée';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Connexion annulée par l'utilisateur";
          break;
        case 'auth/popup-blocked':
          errorMessage =
            'Popup bloquée par le navigateur. Autorisez les popups pour ce site';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage =
            'Demande de connexion annulée. Une autre connexion est en cours';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage =
            'Un compte existe déjà avec cette adresse email mais un autre fournisseur';
          break;
        case 'auth/auth-domain-config-required':
          errorMessage = 'Configuration de domaine manquante dans Firebase';
          break;
        case 'auth/credential-already-in-use':
          errorMessage =
            'Ces identifiants sont déjà utilisés par un autre compte';
          break;
        case 'auth/operation-not-allowed':
          errorMessage =
            "Connexion Facebook non activée. Contactez l'administrateur";
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte utilisateur a été désactivé';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Utilisateur non trouvé';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Problème de connexion. Vérifiez votre internet';
          break;
        case 'auth/internal-error':
          errorMessage = 'Erreur interne. Réessayez dans quelques instants';
          break;
        case 'auth/invalid-api-key':
          errorMessage = 'Configuration Firebase incorrecte';
          break;
        default:
          errorMessage = error.message || 'Connexion Facebook échouée';
      }

      throw new Error(errorMessage);
    }
  }

  // Connexion Facebook avec redirection (alternative pour appareils mobiles)
  static async signInWithFacebookRedirect() {
    try {
      console.log('🔄 Starting Facebook sign-in with redirect...');

      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      provider.setCustomParameters({
        locale: 'fr_FR',
      });

      // Import dynamique pour éviter les erreurs si non disponible
      const { signInWithRedirect } = await import('firebase/auth');

      // Démarrer la redirection
      await signInWithRedirect(auth, provider);
      // Note: La page va être rechargée, le résultat sera traité par getFacebookRedirectResult()
    } catch (error) {
      console.error('❌ Facebook redirect sign-in failed:', error);
      throw new Error(`Redirection Facebook échouée: ${error.message}`);
    }
  }

  // Récupérer le résultat de la redirection Facebook
  static async getFacebookRedirectResult() {
    try {
      console.log('🔍 Checking for Facebook redirect result...');

      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(auth);

      if (result) {
        console.log('✅ Facebook redirect sign-in successful');

        const credential = FacebookAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        // Créer le profil utilisateur
        if (result.user) {
          await this.createUserProfile(result.user);
        }

        return {
          user: result.user,
          credential,
          token,
        };
      }

      return null; // Pas de redirection en cours
    } catch (error) {
      console.error('❌ Facebook redirect result failed:', error);
      throw new Error(
        `Récupération redirection Facebook échouée: ${error.message}`
      );
    }
  }

  // Connexion avec numéro de téléphone
  // Connexion avec numéro de téléphone selon la documentation Firebase
  static async signInWithPhone(phoneNumber, recaptchaVerifier) {
    try {
      console.log('📱 Starting phone authentication...');

      // Formatter le numéro de téléphone selon les standards E.164
      const formattedNumber = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+33${phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber}`;

      console.log('📞 Formatted phone number:', formattedNumber);

      // Envoyer le SMS selon la documentation Firebase
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        recaptchaVerifier
      );

      console.log('✅ SMS sent successfully');
      return confirmationResult;
    } catch (error) {
      console.error('❌ Phone sign-in error:', error);
      let errorMessage = "Erreur lors de l'envoi du SMS";

      // Gestion d'erreurs complète selon la documentation Firebase
      switch (error.code) {
        case 'auth/billing-not-enabled':
          errorMessage =
            '🔄 Authentification SMS non activée. Pour utiliser de vrais numéros :\n\n' +
            '1. Allez sur https://console.firebase.google.com\n' +
            '2. Sélectionnez votre projet\n' +
            '3. Cliquez "Upgrade" → "Blaze plan"\n' +
            '4. Ajoutez une carte de crédit\n\n' +
            '💡 En attendant, utilisez +33612345678 avec code 123456 pour tester';
          break;
        case 'auth/invalid-phone-number':
          errorMessage =
            'Numéro de téléphone invalide. Format requis: +33XXXXXXXXX';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez dans quelques minutes';
          break;
        case 'auth/captcha-check-failed':
          errorMessage =
            'Vérification reCAPTCHA échouée. Rechargez la page et réessayez';
          break;
        case 'auth/quota-exceeded':
          errorMessage = "Quota SMS dépassé pour aujourd'hui";
          break;
        case 'auth/missing-phone-number':
          errorMessage = 'Numéro de téléphone manquant';
          break;
        case 'auth/app-not-authorized':
          errorMessage =
            'Application non autorisée pour Firebase Auth. Vérifiez la configuration';
          break;
        case 'auth/operation-not-allowed':
          errorMessage =
            'Authentification par téléphone non activée dans Firebase Console';
          break;
        case 'auth/network-request-failed':
          errorMessage =
            'Problème de connexion. Vérifiez votre connexion internet';
          break;
        case 'auth/internal-error':
          errorMessage =
            'Erreur interne Firebase. Réessayez dans quelques instants';
          break;
        default:
          errorMessage = error.message || "Erreur lors de l'envoi du SMS";
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Tester l'authentification SMS avec des numéros fictifs
   * Selon la documentation: https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers
   */
  static async testPhoneAuth(
    testPhoneNumber = '+33612345678',
    testCode = '123456'
  ) {
    try {
      console.log('🧪 Testing phone auth with fictional numbers...');

      // Activer le mode test selon la documentation
      auth.settings = auth.settings || {};
      auth.settings.appVerificationDisabledForTesting = true;

      // Créer un reCAPTCHA fictif pour les tests
      const recaptchaVerifier = this.createRecaptchaVerifier(
        'recaptcha-container',
        {
          testMode: true,
          size: 'invisible',
        }
      );

      // Effectuer la connexion de test
      const confirmationResult = await this.signInWithPhone(
        testPhoneNumber,
        recaptchaVerifier
      );

      // Confirmer avec le code de test
      const result = await confirmationResult.confirm(testCode);

      console.log('✅ Test phone auth successful');
      return result.user;
    } catch (error) {
      console.error('❌ Test phone auth failed:', error);
      throw new Error(`Test d'authentification échoué: ${error.message}`);
    }
  }

  // Gérer la liaison des comptes lors de la connexion par téléphone
  static async handlePhoneAccountLinking(phoneUser) {
    try {
      console.log(
        '🔍 Vérification si le numéro existe dans un compte existant...'
      );
      const phoneNumber = phoneUser.phoneNumber;

      // DEBUG TEMPORAIRE
      await this.debugPhoneAccountLinking(phoneNumber);

      // Chercher un utilisateur existant avec ce numéro de téléphone
      const usersQuery = query(
        collection(db, 'users'),
        where('phone', '==', phoneNumber)
      );

      const existingUsers = await getDocs(usersQuery);

      if (!existingUsers.empty) {
        // Un compte existant a ce numéro
        const existingUserDoc = existingUsers.docs[0];
        const existingUserData = existingUserDoc.data();
        const existingUserId = existingUserDoc.id;

        console.log(
          `✅ Compte existant trouvé: ${existingUserData.name} (${existingUserId})`
        );

        // Comparer les UIDs
        if (existingUserId !== phoneUser.uid) {
          console.log('🔄 Comptes différents détectés, liaison nécessaire...');

          // Lier le numéro de téléphone au compte existant
          await this.linkPhoneToExistingAccount(
            phoneUser.phoneNumber,
            existingUserId,
            existingUserData
          );

          // Lier le numéro au compte existant
          console.log('✅ Numéro lié au compte existant !');

          // Déconnecter le compte temporaire pour forcer la reconnexion avec le compte principal
          await firebaseSignOut(auth);

          // Nettoyer le compte temporaire
          await this.cleanupTemporaryPhoneAccount(phoneUser.uid);

          // Informer l'utilisateur avec un message explicatif
          alert(
            `✅ Parfait ! Votre numéro ${phoneNumber} a été ajouté à votre compte "${existingUserData.name}".\n\n` +
              `Vous pouvez maintenant vous connecter avec votre email OU votre numéro de téléphone pour accéder au même compte.`
          );

          // Retourner un signal spécial pour indiquer qu'il faut se reconnecter
          throw new Error('ACCOUNT_LINKING_SUCCESS');
        } else {
          console.log('✅ Même compte, mise à jour des infos...');
          // C'est le même compte, juste mettre à jour
          await this.createUserProfile(phoneUser);
        }
      } else {
        console.log("📱 Nouveau numéro, création d'un nouveau compte...");
        // Nouveau numéro, créer un nouveau profil normalement
        await this.createUserProfile(phoneUser);
      }

      return phoneUser.uid;
    } catch (error) {
      if (
        error.message === 'ACCOUNT_LINKING_SUCCESS' ||
        error.message === 'ACCOUNT_LINKING_REQUIRED'
      ) {
        // Relancer l'erreur spéciale pour la gestion dans l'UI
        throw error;
      }

      console.error('❌ Erreur lors de la liaison des comptes:', error);
      // En cas d'erreur, créer le profil normalement
      await this.createUserProfile(phoneUser);
      return phoneUser.uid;
    }
  }

  // Lier un numéro de téléphone à un compte existant
  static async linkPhoneToExistingAccount(
    phoneNumber,
    existingUserId,
    existingUserData
  ) {
    try {
      console.log(
        `🔗 Liaison du numéro ${phoneNumber} au compte ${existingUserId}`
      );

      // Mettre à jour le compte existant avec la vérification téléphone
      await updateDoc(doc(db, 'users', existingUserId), {
        phoneVerified: true,
        phone: phoneNumber, // S'assurer que le numéro est bien enregistré
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Numéro de téléphone lié au compte existant');
    } catch (error) {
      console.error('❌ Erreur liaison numéro au compte:', error);
      throw error;
    }
  }

  // Nettoyer le compte temporaire créé par Firebase Auth
  static async cleanupTemporaryPhoneAccount(tempUid) {
    try {
      // Supprimer le document utilisateur temporaire s'il existe
      const tempUserRef = doc(db, 'users', tempUid);
      const tempUserSnap = await getDoc(tempUserRef);

      if (tempUserSnap.exists()) {
        await deleteDoc(tempUserRef);
        console.log('🧹 Compte temporaire supprimé de Firestore');
      }

      // Note: On ne peut pas supprimer l'utilisateur Firebase Auth depuis le client
      // Il faudrait une Cloud Function pour cela, mais ce n'est pas critique
      console.log(
        '⚠️ Compte Firebase Auth temporaire non supprimé (nécessite Cloud Function)'
      );
    } catch (error) {
      console.warn(
        '⚠️ Erreur nettoyage compte temporaire (non critique):',
        error
      );
    }
  }

  // Supprimer complètement un compte utilisateur
  static async deleteUserAccount(userId) {
    if (!isOnline()) {
      throw new Error('Connexion internet requise pour supprimer le compte');
    }

    try {
      console.log(`🗑️ Suppression complète du compte ${userId}...`);

      // 1. Supprimer toutes les disponibilités de l'utilisateur
      const availabilitiesQuery = query(
        collection(db, 'availabilities'),
        where('userId', '==', userId)
      );
      const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
      for (const doc of availabilitiesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      console.log('✅ Disponibilités supprimées');

      // 2. Supprimer toutes les réponses aux activités
      const responsesQuery = query(
        collection(db, 'activity_responses'),
        where('userId', '==', userId)
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      for (const doc of responsesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      console.log('✅ Réponses aux activités supprimées');

      // 3. Supprimer toutes les notifications envoyées et reçues
      const notificationsToQuery = query(
        collection(db, 'notifications'),
        where('to', '==', userId)
      );
      const notificationsFromQuery = query(
        collection(db, 'notifications'),
        where('from', '==', userId)
      );

      const [notificationsToSnapshot, notificationsFromSnapshot] =
        await Promise.all([
          getDocs(notificationsToQuery),
          getDocs(notificationsFromQuery),
        ]);

      for (const doc of [
        ...notificationsToSnapshot.docs,
        ...notificationsFromSnapshot.docs,
      ]) {
        await deleteDoc(doc.ref);
      }
      console.log('✅ Notifications supprimées');

      // 4. Supprimer toutes les invitations d'amitié
      const friendInvitationsToQuery = query(
        collection(db, 'friend_invitations'),
        where('toUserId', '==', userId)
      );
      const friendInvitationsFromQuery = query(
        collection(db, 'friend_invitations'),
        where('fromUserId', '==', userId)
      );

      const [invitationsToSnapshot, invitationsFromSnapshot] =
        await Promise.all([
          getDocs(friendInvitationsToQuery),
          getDocs(friendInvitationsFromQuery),
        ]);

      for (const doc of [
        ...invitationsToSnapshot.docs,
        ...invitationsFromSnapshot.docs,
      ]) {
        await deleteDoc(doc.ref);
      }
      console.log("✅ Invitations d'amitié supprimées");

      // 5. Retirer l'utilisateur de toutes les listes d'amis
      const allUsersQuery = query(
        collection(db, 'users'),
        where('friends', 'array-contains', userId)
      );
      const usersWithFriendship = await getDocs(allUsersQuery);

      for (const userDoc of usersWithFriendship.docs) {
        const userData = userDoc.data();
        const updatedFriends = userData.friends.filter(
          friendId => friendId !== userId
        );
        await updateDoc(userDoc.ref, { friends: updatedFriends });
      }
      console.log('✅ Amitiés supprimées des autres utilisateurs');

      // 6. Supprimer le document utilisateur principal
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log('✅ Document utilisateur supprimé');

      // 7. Supprimer l'utilisateur Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await currentUser.delete();
        console.log('✅ Compte Firebase Auth supprimé');
      }

      console.log('🎉 Compte supprimé complètement !');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du compte:', error);

      // Messages d'erreur spécifiques
      if (error.code === 'auth/requires-recent-login') {
        throw new Error(
          'Pour des raisons de sécurité, vous devez vous reconnecter avant de supprimer votre compte. ' +
            'Veuillez vous déconnecter et vous reconnecter, puis réessayer.'
        );
      }

      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  // Créer un reCAPTCHA verifier selon la documentation Firebase
  static createRecaptchaVerifier(elementId, options = {}) {
    try {
      console.log('🔧 Creating reCAPTCHA verifier...');

      // Activer le mode debug pour les tests selon la documentation
      if (process.env.NODE_ENV === 'development' || options.testMode) {
        console.log('🔧 Activation du mode debug reCAPTCHA pour les tests');
        // Désactiver la validation d'app pour les tests selon la documentation
        // https://firebase.google.com/docs/auth/web/phone-auth#integration_testing
        auth.settings = auth.settings || {};
        auth.settings.appVerificationDisabledForTesting = true;
      }

      // Configuration reCAPTCHA pour l'authentification téléphone
      const recaptchaConfig = {
        size: options.size || 'invisible', // invisible par défaut pour une meilleure UX
        callback: response => {
          // reCAPTCHA résolu
          console.log('✅ reCAPTCHA resolved');
          if (options.onSuccess) options.onSuccess(response);
        },
        'expired-callback': () => {
          // reCAPTCHA expiré
          console.log('⚠️ reCAPTCHA expired');
          if (options.onExpired) options.onExpired();
        },
        'error-callback': error => {
          // Erreur reCAPTCHA
          console.error('❌ reCAPTCHA error:', error);
          if (options.onError) options.onError(error);
        },
      };

      // En développement, utiliser un reCAPTCHA simplifié
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '🔧 Mode développement: configuration reCAPTCHA simplifiée'
        );
        // Firebase utilisera un reCAPTCHA par défaut en mode développement
      }

      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        elementId,
        recaptchaConfig
      );

      // Rendu automatique en mode test selon la documentation
      if (process.env.NODE_ENV === 'development' || options.testMode) {
        console.log('🔧 Mode test: reCAPTCHA sera résolu automatiquement');
        // Le reCAPTCHA se résoudra automatiquement en mode test
      }

      return recaptchaVerifier;
    } catch (error) {
      console.error('❌ Error creating reCAPTCHA verifier:', error);
      console.error('❌ Details:', {
        elementId,
        options,
        nodeEnv: process.env.NODE_ENV,
        authSettings: auth.settings,
      });
      throw new Error(
        `Impossible de créer le vérificateur reCAPTCHA: ${error.message}`
      );
    }
  }

  // Confirmer le code SMS
  static async confirmPhoneCode(confirmationResult, verificationCode) {
    try {
      const result = await confirmationResult.confirm(verificationCode);

      // Vérifier si ce numéro existe déjà dans un compte existant
      if (result.user && result.user.phoneNumber) {
        await this.handlePhoneAccountLinking(result.user);
      }

      return result.user;
    } catch (error) {
      console.error('❌ Code confirmation error:', error);
      let errorMessage = 'Code de vérification invalide';

      // Gestion d'erreurs selon la documentation Firebase
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage =
            'Code de vérification invalide. Vérifiez les 6 chiffres';
          break;
        case 'auth/code-expired':
          errorMessage = 'Le code a expiré. Demandez un nouveau code SMS';
          break;
        case 'auth/session-expired':
          errorMessage =
            'Session expirée. Recommencez le processus de connexion';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Attendez avant de réessayer';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Problème de connexion. Vérifiez votre internet';
          break;
        case 'auth/internal-error':
          errorMessage = 'Erreur interne. Réessayez dans quelques instants';
          break;
        default:
          errorMessage = error.message || 'Code de vérification invalide';
      }

      throw new Error(errorMessage);
    }
  }

  // Créer le profil utilisateur dans Firestore
  static async createUserProfile(user) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔥 Creating user profile for:', user.uid);
      console.log('📱 Phone number from Firebase Auth:', user.phoneNumber);
    }

    // Données utilisateur selon les bonnes pratiques Firebase
    const userData = {
      uid: user.uid,
      name: user.displayName || 'Utilisateur',
      phone: user.phoneNumber || '',
      email: user.email || '',
      avatar: user.photoURL || '',
      // Informations d'authentification
      emailVerified: user.emailVerified || false,
      phoneVerified: !!user.phoneNumber,
      // Métadonnées
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      // Statut
      isOnline: true,
      lastSeen: new Date().toISOString(),
      // Fonctionnalités app
      location: null,
      isAvailable: false,
      currentActivity: null,
      friends: [],
      // Préférences utilisateur
      preferences: {
        darkMode: false,
        notifications: true,
        defaultRadius: 5, // km
      },
    };

    // Toujours essayer de créer le profil, même si isOnline() est incertain
    // Firebase gèrera les erreurs réseau si nécessaire

    try {
      await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // eslint-disable-next-line no-console
          console.log('📝 Creating new user document...');
          await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
          });
        } else {
          // eslint-disable-next-line no-console
          console.log('🔄 Updating existing user...');
          // Mise à jour selon les bonnes pratiques Firebase
          await updateDoc(userRef, {
            // Statut de connexion
            isOnline: true,
            lastSeen: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Mettre à jour les infos de profil si elles ont changé
            name: user.displayName || userData.name,
            email: user.email || userData.email,
            avatar: user.photoURL || userData.avatar,
            emailVerified: user.emailVerified || false,
            phoneVerified: !!user.phoneNumber,
          });
        }
      });

      // eslint-disable-next-line no-console
      console.log('✅ User profile created/updated successfully');

      // Récupérer les données réelles depuis Firestore
      const freshUserData = await this.getUserProfile(user.uid);
      return freshUserData || userData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Firestore error, using local data:', error);
      return userData;
    }
  }

  // Récupérer le profil utilisateur depuis Firestore
  static async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log('✅ User profile fetched from Firestore:', data);
        return {
          uid: userId,
          ...data,
        };
      } else {
        console.warn('⚠️ User profile not found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  // Debug: Vérifier les données utilisateur dans Firestore
  static async debugUserData(userId) {
    try {
      console.log(
        '🔍 Debug: Vérification des données utilisateur pour ID:',
        userId
      );

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        // Afficher les données importantes en tableau
        console.table({
          Nom: data.name || 'Non défini',
          Email: data.email || 'Non défini',
          Téléphone: data.phone || '❌ AUCUN NUMÉRO',
          Avatar: data.avatar || 'Non défini',
          'Créé le': data.createdAt || 'Non défini',
          'Mis à jour le': data.updatedAt || 'Non défini',
        });

        // Log spécifique pour le téléphone
        if (data.phone) {
          console.log('✅ TÉLÉPHONE TROUVÉ:', data.phone);
        } else {
          console.log('❌ AUCUN NUMÉRO DE TÉLÉPHONE DANS LA BASE !');
        }

        // Log des données complètes
        console.log(
          '📊 Données utilisateur complètes:',
          JSON.stringify(data, null, 2)
        );

        return data;
      } else {
        console.warn('⚠️ Aucun document utilisateur trouvé pour ID:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des données:', error);
      throw error;
    }
  }

  // Déconnexion
  static async signOut() {
    console.log('🚪 AuthService.signOut() appelé');
    try {
      const currentUserId = auth.currentUser?.uid;

      if (currentUserId) {
        console.log('👤 Utilisateur connecté trouvé:', currentUserId);

        // Essayer la mise à jour Firestore de manière non-bloquante
        if (isOnline()) {
          console.log('🌐 Tentative rapide de mise à jour du statut...');
          // Fire and forget - ne pas attendre la réponse
          updateDoc(doc(db, 'users', currentUserId), {
            isOnline: false,
            lastSeen: serverTimestamp(),
          })
            .then(() => {
              console.log('✅ Statut offline mis à jour (async)');
            })
            .catch(error => {
              console.warn(
                '⚠️ Mise à jour statut échouée (ignorée):',
                error.message
              );
            });
        }
      }

      console.log('🔥 Appel de firebaseSignOut...');
      await firebaseSignOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur dans AuthService.signOut:', error);
      throw new Error(`Déconnexion échouée: ${error.message}`);
    }
  }

  // Écouter les changements d'authentification
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Fonctions utilitaires pour la gestion des utilisateurs selon la documentation Firebase

  // Obtenir l'utilisateur actuel
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated() {
    return !!auth.currentUser;
  }

  // Recharger les données utilisateur
  static async reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser;
    }
    return null;
  }

  // Mettre à jour le profil utilisateur
  static async updateUserProfile(displayName, photoURL) {
    if (!auth.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(auth.currentUser, {
        displayName: displayName || auth.currentUser.displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });

      // Mettre à jour aussi dans Firestore
      if (isOnline()) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          name: displayName || auth.currentUser.displayName,
          avatar: photoURL || auth.currentUser.photoURL,
          updatedAt: serverTimestamp(),
        });
      }

      return auth.currentUser;
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw new Error(
        `Impossible de mettre à jour le profil: ${error.message}`
      );
    }
  }

  // Mettre à jour le numéro de téléphone d'un utilisateur
  static async updateUserPhone(userId, phoneNumber) {
    console.log('🔄 updateUserPhone appelée avec:', { userId, phoneNumber });

    if (!isOnline()) {
      throw new Error('Connexion requise pour mettre à jour le téléphone');
    }

    try {
      await retryWithBackoff(async () => {
        console.log("🔍 Vérification de l'unicité du numéro...");

        // Vérifier que le numéro n'est pas déjà utilisé par un autre utilisateur
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        console.log('📊 Résultats de la vérification:', {
          found: !querySnapshot.empty,
          count: querySnapshot.size,
        });

        // Si le numéro existe déjà, vérifier que c'est le même utilisateur
        if (!querySnapshot.empty) {
          const existingUser = querySnapshot.docs[0];
          const existingUserData = existingUser.data();

          console.log('👤 Utilisateur existant trouvé:', {
            existingUserId: existingUser.id,
            currentUserId: userId,
            isSameUser: existingUser.id === userId,
            existingUserName: existingUserData.name,
          });

          if (existingUser.id !== userId) {
            throw new Error(
              'Ce numéro de téléphone est déjà utilisé par un autre utilisateur'
            );
          }
        }

        console.log('📝 Mise à jour du document utilisateur...');

        // Mettre à jour le numéro dans Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          phone: phoneNumber,
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Document mis à jour avec succès');

        // Vérifier que la mise à jour a été effectuée
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const updatedData = updatedDoc.data();
          console.log('🔍 Vérification post-mise à jour:', {
            phoneInDoc: updatedData.phone,
            expectedPhone: phoneNumber,
            match: updatedData.phone === phoneNumber,
          });
        }

        console.log('✅ Numéro de téléphone mis à jour:', phoneNumber);
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour téléphone:', error);
      throw new Error(
        `Impossible de mettre à jour le téléphone: ${error.message}`
      );
    }
  }

  // Supprimer le numéro de téléphone d'un utilisateur
  static async removeUserPhone(userId) {
    console.log('🗑️ removeUserPhone appelée pour userId:', userId);

    if (!isOnline()) {
      throw new Error('Connexion requise pour supprimer le téléphone');
    }

    try {
      await retryWithBackoff(async () => {
        console.log('📝 Suppression du numéro dans Firestore...');

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          phone: '',
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Numéro de téléphone supprimé avec succès');
      });
    } catch (error) {
      console.error('❌ Erreur suppression téléphone:', error);
      throw new Error(`Impossible de supprimer le téléphone: ${error.message}`);
    }
  }

  // Mettre à jour le nom d'un utilisateur
  static async updateUserName(userId, userName) {
    console.log('🔄 updateUserName appelée avec:', { userId, userName });

    if (!isOnline()) {
      throw new Error('Connexion requise pour mettre à jour le nom');
    }

    try {
      await retryWithBackoff(async () => {
        console.log('📝 Mise à jour du nom dans Firestore...');

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          name: userName,
          updatedAt: serverTimestamp(),
        });

        // Mettre à jour aussi dans Firebase Auth si c'est l'utilisateur connecté
        if (auth.currentUser && auth.currentUser.uid === userId) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(auth.currentUser, {
            displayName: userName,
          });
        }

        console.log('✅ Nom mis à jour avec succès:', userName);
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour nom:', error);
      throw new Error(`Impossible de mettre à jour le nom: ${error.message}`);
    }
  }

  // Upload d'une photo de profil
  static async uploadUserPhoto(userId, file) {
    console.log('📷 uploadUserPhoto appelée avec:', {
      userId,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!isOnline()) {
      throw new Error('Connexion requise pour uploader la photo');
    }

    try {
      // Import dynamique Firebase Storage
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import(
        'firebase/storage'
      );
      const storage = getStorage();

      // Créer une référence unique pour la photo
      const timestamp = Date.now();
      const photoRef = ref(storage, `users/${userId}/profile_${timestamp}.jpg`);

      console.log('⬆️ Upload du fichier...');

      // Upload du fichier
      const snapshot = await uploadBytes(photoRef, file);
      console.log('✅ Fichier uploadé:', snapshot.metadata.fullPath);

      // Récupérer l'URL de téléchargement
      const downloadURL = await getDownloadURL(photoRef);
      console.log('🔗 URL de téléchargement obtenue:', downloadURL);

      await retryWithBackoff(async () => {
        // Mettre à jour Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          avatar: downloadURL,
          updatedAt: serverTimestamp(),
        });

        // Mettre à jour Firebase Auth si c'est l'utilisateur connecté
        if (auth.currentUser && auth.currentUser.uid === userId) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          });
        }

        console.log('✅ Photo de profil mise à jour avec succès');
      });

      return downloadURL;
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      throw new Error(`Impossible d'uploader la photo: ${error.message}`);
    }
  }

  /**
   * Effectuer une requête sécurisée vers un backend personnalisé avec App Check
   * Selon la documentation Firebase : https://firebase.google.com/docs/app-check/web/custom-resource
   * @param {string} url - URL du backend
   * @param {Object} options - Options de la requête
   * @param {boolean} limitedUse - Utiliser un jeton à usage limité
   */
  static async secureBackendCall(url, options = {}, limitedUse = false) {
    try {
      console.log('🔐 Making secure backend call with App Check...');

      // Import dynamique pour éviter les dépendances circulaires
      const { AppCheckService } = await import('./appCheckService');
      return await AppCheckService.secureApiCall(url, options, limitedUse);
    } catch (error) {
      console.error('❌ Secure backend call failed:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'état d'App Check
   */
  static async checkAppCheckStatus() {
    try {
      const { AppCheckService } = await import('./appCheckService');
      const isAvailable = await AppCheckService.isAppCheckAvailable();
      console.log(
        `🔐 App Check status: ${isAvailable ? 'Available' : 'Not available'}`
      );
      return isAvailable;
    } catch (error) {
      console.error('❌ App Check status check failed:', error);
      return false;
    }
  }

  /**
   * Vérifier si le plan Blaze est activé
   */
  static async checkBlazePlanStatus() {
    try {
      // Tenter d'envoyer un SMS à un numéro de test pour vérifier le plan
      const testNumber = '+33612345678';
      const testElement = document.createElement('div');
      testElement.id = 'blaze-test-recaptcha';
      testElement.style.display = 'none';
      document.body.appendChild(testElement);

      const testRecaptcha = this.createRecaptchaVerifier(
        'blaze-test-recaptcha',
        {
          size: 'invisible',
          testMode: true,
        }
      );

      await signInWithPhoneNumber(auth, testNumber, testRecaptcha);

      // Nettoyer
      testRecaptcha.clear();
      document.body.removeChild(testElement);

      return {
        blazeEnabled: true,
        message: '✅ Plan Blaze activé - SMS réels disponibles',
      };
    } catch (error) {
      if (error.code === 'auth/billing-not-enabled') {
        return {
          blazeEnabled: false,
          message: '⚠️ Plan Spark - Seuls les numéros de test sont disponibles',
        };
      }
      return {
        blazeEnabled: null,
        message: `❓ Statut inconnu: ${error.message}`,
      };
    }
  }

  // Debug temporaire : vérifier tous les comptes existants
  static async debugPhoneAccountLinking(phoneNumber) {
    try {
      console.log('🔍 DEBUG: Recherche de compte avec numéro:', phoneNumber);

      // 1. Lister tous les utilisateurs pour voir leurs numéros
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log('📊 Tous les comptes dans la base:');

      allUsersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(
          `- ${doc.id}: name="${data.name}", phone="${data.phone}", email="${data.email}"`
        );
      });

      // 2. Recherche spécifique par numéro
      const usersQuery = query(
        collection(db, 'users'),
        where('phone', '==', phoneNumber)
      );
      const existingUsers = await getDocs(usersQuery);

      console.log(
        `🔍 Recherche pour numéro ${phoneNumber}:`,
        existingUsers.size,
        'résultats'
      );

      return existingUsers;
    } catch (error) {
      console.error('❌ Erreur debug:', error);
    }
  }
}

// Service de disponibilité ultra-simplifié
export class AvailabilityService {
  // Définir sa disponibilité
  static async setAvailability(userId, activity, location, duration = 45) {
    // eslint-disable-next-line no-console
    console.log('🔥 Setting availability:', { userId, activity, location });

    if (!isOnline()) {
      // eslint-disable-next-line no-console
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

        // eslint-disable-next-line no-console
        console.log('✅ Availability set successfully');
        return availabilityRef.id;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Availability service error:', error);
      throw new Error(
        `Impossible de définir la disponibilité: ${error.message}`
      );
    }
  }

  // Arrêter sa disponibilité
  static async stopAvailability(userId, availabilityId) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Offline mode, cannot stop availability');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        if (availabilityId && !availabilityId.startsWith('offline-')) {
          await deleteDoc(doc(db, 'availabilities', availabilityId));
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isAvailable: false,
          currentActivity: null,
          availabilityId: null,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Stop availability error:', error);
      throw new Error(
        `Impossible d'arrêter la disponibilité: ${error.message}`
      );
    }
  }

  // Écouter les disponibilités des amis
  static onAvailableFriends(userId, callback) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
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

              // Exclure les activités auxquelles on a déjà répondu
              if (respondedActivityIds.has(availability.id)) {
                continue;
              }

              try {
                const friendRef = doc(db, 'users', availability.userId);
                const friendSnap = await getDoc(friendRef);

                if (friendSnap.exists()) {
                  availability.friend = friendSnap.data();
                  availabilities.push(availability);
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Warning: Could not fetch friend data:', error);
              }
            }

            callback(availabilities);
          });
        } else {
          callback([]);
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
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

        if (existingResponses.empty) {
          // Aucune réponse existante, créer une nouvelle
          await addDoc(collection(db, 'activity_responses'), {
            userId,
            activityId,
            responseType, // 'joined' ou 'declined'
            createdAt: serverTimestamp(),
          });
        } else {
          // Mettre à jour la réponse existante
          const responseDoc = existingResponses.docs[0];
          await updateDoc(responseDoc.ref, {
            responseType,
            updatedAt: serverTimestamp(),
          });
        }
      });

      console.log(
        `💾 Réponse ${responseType} enregistrée pour activité ${activityId}`
      );
    } catch (error) {
      console.error('Erreur enregistrement réponse:', error);
      throw error;
    }
  }

  // Nettoyer les réponses aux activités inactives (optionnel)
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

  // Notifier les amis de sa disponibilité
  static async notifyFriends(userId, activity) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Offline mode, cannot notify friends');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const friendIds = userData.friends || [];

          // Créer une notification pour chaque ami
          for (const friendId of friendIds) {
            await addDoc(collection(db, 'notifications'), {
              to: friendId,
              from: userId,
              type: 'availability',
              activity: activity,
              message: `${userData.name} is down for ${activity}!`,
              createdAt: serverTimestamp(),
              read: false,
            });
          }
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur notification amis:', error);
      throw error;
    }
  }

  // Répondre à une invitation
  static async respondToInvitation(userId, friendId, response) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Offline mode, cannot respond to invitation');
      return;
    }

    try {
      await retryWithBackoff(async () => {
        await addDoc(collection(db, 'notifications'), {
          to: friendId,
          from: userId,
          type: 'response',
          response: response, // 'joined' ou 'declined'
          message:
            response === 'joined'
              ? `${auth.currentUser.displayName} joined your meetup!`
              : `${auth.currentUser.displayName} declined your invitation`,
          createdAt: serverTimestamp(),
          read: false,
        });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur réponse invitation:', error);
      throw error;
    }
  }
}

// Service d'amis ultra-simplifié
export class FriendsService {
  // Normaliser un numéro de téléphone au format international
  static normalizePhoneNumber(phoneNumber) {
    // Supprimer tous les espaces, tirets, etc.
    let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

    // Si commence par 0, remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si commence par 33, ajouter +
    else if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    // Si ne commence ni par + ni par 33, ajouter +33
    else if (!cleaned.startsWith('+') && !cleaned.startsWith('33')) {
      cleaned = '+33' + cleaned;
    }

    return cleaned;
  }

  // Fonction de debug pour lister tous les utilisateurs (à supprimer en production)
  static async debugListAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      console.log('📋 Tous les utilisateurs dans la base:');
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name}: ${data.phone} (uid: ${doc.id})`);
      });
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erreur debug:', error);
      return [];
    }
  }

  // Debug complet des relations d'amitié
  static async debugFriendshipData(currentUserId) {
    try {
      console.log("\n🔍 === DEBUG RELATIONS D'AMITIÉ ===");

      // 1. Informations utilisateur actuel
      const userRef = doc(db, 'users', currentUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log(
          `👤 Utilisateur actuel: ${userData.name} (${currentUserId})`
        );
        console.log(`📱 Téléphone: ${userData.phone}`);
        console.log(`👥 Liste amis dans profil:`, userData.friends || []);
        console.log(`📊 Nombre d'amis: ${(userData.friends || []).length}`);
      }

      // 2. Tous les utilisateurs disponibles
      const allUsers = await this.debugListAllUsers();
      console.log(`\n📋 Total utilisateurs dans la base: ${allUsers.length}`);

      // 3. Vérifier chaque utilisateur et ses relations
      console.log('\n🔗 Relations détaillées:');
      for (const user of allUsers) {
        const friends = user.friends || [];
        const isFriendOfCurrent = friends.includes(currentUserId);
        const isCurrentFriendOf = (userSnap.data()?.friends || []).includes(
          user.id
        );

        console.log(`\n- ${user.name} (${user.id})`);
        console.log(`  📱 Téléphone: ${user.phone}`);
        console.log(`  👥 Ses amis: [${friends.join(', ')}]`);
        console.log(
          `  ↔️ Est ami avec moi: ${isFriendOfCurrent ? '✅' : '❌'}`
        );
        console.log(
          `  ↔️ Je suis ami avec lui: ${isCurrentFriendOf ? '✅' : '❌'}`
        );
        console.log(
          `  🔄 Relation mutuelle: ${isFriendOfCurrent && isCurrentFriendOf ? '✅' : '❌'}`
        );
      }

      // 4. Résumé du problème
      console.log('\n📊 === RÉSUMÉ ===');
      const myFriends = userSnap.data()?.friends || [];
      const potentialFriends = allUsers.filter(u => u.id !== currentUserId);

      console.log(`✅ Mes amis déclarés: ${myFriends.length}`);
      console.log(`👥 Utilisateurs disponibles: ${potentialFriends.length}`);
      console.log(`🔗 Relations mutuelles: ${myFriends.length}`);

      if (myFriends.length === 0 && potentialFriends.length > 0) {
        console.log('\n⚠️ PROBLÈME IDENTIFIÉ:');
        console.log('- Vous avez des utilisateurs dans la base');
        console.log("- Mais aucune relation d'amitié n'est configurée");
        console.log(
          '- Utilisez addTestFriendship() pour créer des relations de test'
        );
      }

      return {
        currentUser: userSnap.data(),
        allUsers,
        myFriends,
        potentialFriends,
      };
    } catch (error) {
      console.error('❌ Erreur debug friendship:', error);
      return null;
    }
  }

  // Créer des relations d'amitié de test (mode développement uniquement)
  static async addTestFriendships(currentUserId) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        "⚠️ Cette fonction n'est disponible qu'en mode développement"
      );
      return;
    }

    try {
      console.log("🧪 Création de relations d'amitié de test...");

      const allUsers = await this.debugListAllUsers();
      const otherUsers = allUsers.filter(u => u.id !== currentUserId);

      if (otherUsers.length === 0) {
        console.log('❌ Aucun autre utilisateur trouvé pour créer des amitiés');
        return;
      }

      // Créer des amitiés avec tous les autres utilisateurs (pour les tests)
      const friendships = [];
      for (const user of otherUsers.slice(0, 3)) {
        // Limiter à 3 amis max
        try {
          await this.addMutualFriendship(currentUserId, user.id);
          friendships.push(user.name);
          console.log(`✅ Amitié créée avec: ${user.name}`);
        } catch (error) {
          console.log(`❌ Échec amitié avec ${user.name}:`, error.message);
        }
      }

      console.log(
        `🎉 ${friendships.length} amitiés de test créées:`,
        friendships
      );
      return friendships;
    } catch (error) {
      console.error('❌ Erreur création amitiés test:', error);
      return [];
    }
  }

  // Ajouter un ami par numéro de téléphone (maintenant création d'invitation)
  static async addFriendByPhone(currentUserId, phoneNumber) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour envoyer des invitations');
    }

    try {
      return await retryWithBackoff(async () => {
        // Normaliser le numéro de téléphone
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
        console.log('🔍 Recherche utilisateur avec numéro:', normalizedPhone);

        // Debug: lister tous les utilisateurs
        await this.debugListAllUsers();

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', normalizedPhone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const friendDoc = querySnapshot.docs[0];
          const friendId = friendDoc.id;
          const friendData = friendDoc.data();

          // Vérifier qu'on ne s'ajoute pas soi-même
          if (friendId === currentUserId) {
            throw new Error('Vous ne pouvez pas vous ajouter vous-même');
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

          // Vérifier s'ils sont déjà amis
          const currentUserRef = doc(db, 'users', currentUserId);
          const currentUserSnap = await getDoc(currentUserRef);
          if (currentUserSnap.exists()) {
            const currentUserFriends = currentUserSnap.data().friends || [];
            if (currentUserFriends.includes(friendId)) {
              throw new Error('Vous êtes déjà amis avec cette personne');
            }
          }

          // Créer l'invitation d'amitié
          await this.createFriendInvitation(currentUserId, friendId);

          console.log("✅ Invitation d'amitié envoyée à:", friendData.name);
          return { ...friendData, invitationSent: true };
        } else {
          // Essayer aussi avec des variantes du format
          const phoneVariants = [
            normalizedPhone,
            phoneNumber, // Format original
            phoneNumber.replace(/\s+/g, ''), // Sans espaces
          ];

          console.log('🔍 Recherche avec variantes:', phoneVariants);

          for (const variant of phoneVariants) {
            if (variant !== normalizedPhone) {
              const qVariant = query(usersRef, where('phone', '==', variant));
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

          throw new Error(
            "Utilisateur non trouvé avec ce numéro. Assurez-vous que cette personne s'est déjà connectée à l'application."
          );
        }
      });
    } catch (error) {
      console.error('❌ Erreur envoi invitation:', error);
      throw new Error(`Impossible d'envoyer l'invitation: ${error.message}`);
    }
  }

  // Récupérer la liste des amis
  static async getFriends(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no friends data');
      return [];
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const friendIds = userData.friends || [];

          if (friendIds.length === 0) {
            return [];
          }

          const friendsData = [];
          for (const friendId of friendIds) {
            const friendRef = doc(db, 'users', friendId);
            const friendSnap = await getDoc(friendRef);
            if (friendSnap.exists()) {
              friendsData.push({
                id: friendId,
                ...friendSnap.data(),
              });
            }
          }

          return friendsData;
        }
        return [];
      });
    } catch (error) {
      console.error('❌ Erreur récupération amis:', error);
      return [];
    }
  }

  // Écouter les changements dans la liste d'amis de l'utilisateur
  static onUserFriendsChange(userId, callback) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, no friends listener');
      return () => {};
    }

    try {
      const userRef = doc(db, 'users', userId);
      return onSnapshot(userRef, doc => {
        if (doc.exists()) {
          const userData = doc.data();
          const currentFriends = userData.friends || [];
          console.log(
            "👥 Changement détecté dans la liste d'amis:",
            currentFriends.length
          );
          callback(currentFriends);
        }
      });
    } catch (error) {
      console.warn('Warning: Could not listen to user friends changes:', error);
      return () => {};
    }
  }

  // Créer une invitation d'amitié
  static async createFriendInvitation(fromUserId, toUserId) {
    try {
      console.log(
        `🔍 [DEBUG] createFriendInvitation appelée: ${fromUserId} -> ${toUserId}`
      );

      // Récupérer les données de l'expéditeur
      const fromUserRef = doc(db, 'users', fromUserId);
      const fromUserSnap = await getDoc(fromUserRef);

      if (!fromUserSnap.exists()) {
        throw new Error('Utilisateur expéditeur non trouvé');
      }

      const fromUserData = fromUserSnap.data();

      // Créer l'invitation
      const invitation = {
        fromUserId,
        toUserId,
        status: 'pending', // pending, accepted, declined
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };

      const invitationRef = await addDoc(
        collection(db, 'friend_invitations'),
        invitation
      );

      // Créer la notification avec boutons d'action
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

      const notificationRef = await addDoc(
        collection(db, 'notifications'),
        notificationData
      );
      console.log(
        `🔍 [DEBUG] Notification Firestore créée: ${notificationRef.id}`
      );

      // 🔔 NOUVEAU : Envoyer notification push automatiquement
      try {
        const { default: PushNotificationService } = await import(
          './pushNotificationService'
        );

        await PushNotificationService.sendPushToUser(toUserId, {
          title: "👥 Nouvelle demande d'ami",
          body: `${fromUserData.name} souhaite vous ajouter en ami`,
          tag: 'friend-invitation',
          data: {
            type: 'friend_invitation',
            fromUserId,
            fromUserName: fromUserData.name,
            invitationId: invitationRef.id,
          },
          requireInteraction: true,
        });

        console.log("🔔 Notification push envoyée pour demande d'ami");
      } catch (pushError) {
        console.warn('⚠️ Erreur notification push (non critique):', pushError);
      }

      console.log(`✅ Invitation d'amitié créée pour ${fromUserData.name}`);
      return invitationRef.id;
    } catch (error) {
      console.error('❌ Erreur création invitation:', error);
      throw error;
    }
  }

  // Répondre à une invitation d'amitié
  static async respondToFriendInvitation(invitationId, response, userId) {
    if (!['accepted', 'declined'].includes(response)) {
      throw new Error('Réponse invalide. Utilisez "accepted" ou "declined"');
    }

    try {
      const invitationRef = doc(db, 'friend_invitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        throw new Error('Invitation non trouvée');
      }

      const invitationData = invitationSnap.data();

      // Vérifier que c'est bien le destinataire qui répond
      if (invitationData.toUserId !== userId) {
        throw new Error('Vous ne pouvez pas répondre à cette invitation');
      }

      // Vérifier que l'invitation est encore en attente
      if (invitationData.status !== 'pending') {
        throw new Error('Cette invitation a déjà été traitée');
      }

      // Mettre à jour l'invitation
      await updateDoc(invitationRef, {
        status: response,
        respondedAt: serverTimestamp(),
      });

      if (response === 'accepted') {
        // Créer l'amitié mutuelle
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

        // 🔔 NOUVEAU : Envoyer notification push automatiquement
        try {
          const { default: PushNotificationService } = await import(
            './pushNotificationService'
          );

          await PushNotificationService.sendPushToUser(
            invitationData.fromUserId,
            {
              title: "✅ Demande d'ami acceptée !",
              body: `${toUserName} a accepté votre demande d'ami`,
              tag: 'friend-accepted',
              data: {
                type: 'friend_invitation_accepted',
                friendId: userId,
                friendName: toUserName,
              },
              requireInteraction: false,
            }
          );

          console.log("🔔 Notification push envoyée pour acceptation d'ami");
        } catch (pushError) {
          console.warn(
            '⚠️ Erreur notification push (non critique):',
            pushError
          );
        }
      }

      console.log(`✅ Invitation ${response}`);
      return { success: true, status: response };
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      throw error;
    }
  }

  // Créer une amitié mutuelle
  static async addMutualFriendship(userId1, userId2) {
    if (!isOnline()) {
      throw new Error('Connexion requise pour ajouter des amis');
    }

    try {
      await retryWithBackoff(async () => {
        const user1Ref = doc(db, 'users', userId1);
        const user2Ref = doc(db, 'users', userId2);

        const [user1Snap, user2Snap] = await Promise.all([
          getDoc(user1Ref),
          getDoc(user2Ref),
        ]);

        if (user1Snap.exists() && user2Snap.exists()) {
          const user1Data = user1Snap.data();
          const user2Data = user2Snap.data();
          const user1Friends = user1Data.friends || [];
          const user2Friends = user2Data.friends || [];

          const updates = [];

          if (!user1Friends.includes(userId2)) {
            updates.push(
              updateDoc(user1Ref, {
                friends: [...user1Friends, userId2],
                updatedAt: serverTimestamp(),
              })
            );
          }

          if (!user2Friends.includes(userId1)) {
            updates.push(
              updateDoc(user2Ref, {
                friends: [...user2Friends, userId1],
                updatedAt: serverTimestamp(),
              })
            );
          }

          await Promise.all(updates);
          console.log(
            `✅ Amitié créée entre ${user1Data.name} et ${user2Data.name}`
          );
        }
      });
    } catch (error) {
      throw new Error(`Impossible de créer l'amitié: ${error.message}`);
    }
  }
}

// Service de notifications ultra-simplifié
// Service d'invitations pour les activités
export class InvitationService {
  // Envoyer des invitations à plusieurs amis pour une activité
  static async sendInvitations(fromUserId, activity, friendIds, location) {
    try {
      console.log(
        `📨 Envoi d'invitations ${activity} à ${friendIds.length} amis`
      );

      if (!isOnline()) {
        throw new Error('Connexion requise pour envoyer des invitations');
      }

      const batch = [];
      const invitationTime = new Date();

      for (const friendId of friendIds) {
        // Créer une invitation
        const invitationData = {
          fromUserId,
          toUserId: friendId,
          activity,
          location,
          status: 'pending', // pending, accepted, declined, expired
          createdAt: serverTimestamp(),
          expiresAt: new Date(invitationTime.getTime() + 15 * 60 * 1000), // 15 minutes
        };

        // Ajouter l'invitation à la collection
        const invitationPromise = addDoc(
          collection(db, 'invitations'),
          invitationData
        );

        // Créer une notification pour l'ami
        const notificationPromise = this.createInvitationNotification(
          friendId,
          fromUserId,
          activity
        );

        batch.push(invitationPromise);
        batch.push(notificationPromise);
      }

      // Exécuter toutes les opérations en parallèle
      await Promise.all(batch);

      console.log(
        `✅ ${friendIds.length} invitations envoyées pour ${activity}`
      );
      return { success: true, count: friendIds.length };
    } catch (error) {
      console.error('❌ Erreur envoi invitations:', error);
      throw new Error(
        `Erreur lors de l'envoi des invitations: ${error.message}`
      );
    }
  }

  // Créer une notification pour une invitation
  static async createInvitationNotification(toUserId, fromUserId, activity) {
    try {
      console.log(
        `🔍 [DEBUG] createInvitationNotification appelée: ${fromUserId} -> ${toUserId} pour ${activity}`
      );

      // Récupérer le nom de l'expéditeur
      const fromUser = await getDoc(doc(db, 'users', fromUserId));
      const fromUserName = fromUser.exists() ? fromUser.data().name : 'Un ami';

      const activities = {
        coffee: 'Coffee ☕',
        lunch: 'Lunch 🍽️',
        drinks: 'Drinks 🍻',
        chill: 'Chill 😎',
      };

      const activityLabel = activities[activity] || activity;

      // 🔧 COPIER EXACTEMENT LE SCHÉMA DES INVITATIONS D'AMITIÉ (qui fonctionnent)
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
        `🔍 [DEBUG] Notification d'invitation créée: ${result.id} pour ${activityLabel}`
      );

      // 🔔 NOUVEAU : Envoyer notification push automatiquement
      try {
        const { default: PushNotificationService } = await import(
          './pushNotificationService'
        );

        await PushNotificationService.sendPushToUser(toUserId, {
          title: `🎉 Invitation pour ${activityLabel}`,
          body: `${fromUserName} vous invite pour ${activityLabel}`,
          tag: 'activity-invitation',
          data: {
            type: 'invitation',
            activity,
            fromUserId,
            fromUserName,
          },
          requireInteraction: true,
        });

        console.log(
          `🔔 Notification push envoyée pour invitation ${activityLabel}`
        );
      } catch (pushError) {
        console.warn('⚠️ Erreur notification push (non critique):', pushError);
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur création notification invitation:', error);
      // Ne pas faire échouer l'invitation si la notification échoue
    }
  }

  // Répondre à une invitation
  static async respondToInvitation(invitationId, userId, response) {
    try {
      console.log(`📝 Réponse à l'invitation ${invitationId}: ${response}`);

      if (!['accepted', 'declined'].includes(response)) {
        throw new Error('Réponse invalide. Utilisez "accepted" ou "declined"');
      }

      // Mettre à jour le statut de l'invitation
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: response,
        respondedAt: serverTimestamp(),
      });

      // Si acceptée, créer une notification de retour
      if (response === 'accepted') {
        const invitation = await getDoc(doc(db, 'invitations', invitationId));
        if (invitation.exists()) {
          const invitationData = invitation.data();
          await this.createResponseNotification(
            invitationData.fromUserId,
            userId,
            invitationData.activity,
            true
          );
        }
      }

      console.log(`✅ Réponse ${response} enregistrée`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      throw new Error(`Erreur lors de la réponse: ${error.message}`);
    }
  }

  // Créer une notification de réponse
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
        coffee: 'Coffee ☕',
        lunch: 'Lunch 🍽️',
        drinks: 'Drinks 🍻',
        chill: 'Chill 😎',
      };

      const activityLabel = activities[activity] || activity;
      const message = accepted
        ? `${fromUserName} a accepté votre invitation pour ${activityLabel} !`
        : `${fromUserName} a décliné votre invitation pour ${activityLabel}`;

      // 🔧 COPIER EXACTEMENT LE SCHÉMA DES INVITATIONS D'AMITIÉ (qui fonctionnent)
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

      // 🔔 NOUVEAU : Envoyer notification push automatiquement
      try {
        const { default: PushNotificationService } = await import(
          './pushNotificationService'
        );

        const title = accepted
          ? '✅ Invitation acceptée !'
          : '❌ Invitation déclinée';

        await PushNotificationService.sendPushToUser(toUserId, {
          title,
          body: message,
          tag: 'invitation-response',
          data: {
            type: 'invitation_response',
            activity,
            accepted,
            fromUserId,
            fromUserName,
          },
          requireInteraction: false,
        });

        console.log(
          `🔔 Notification push envoyée pour réponse ${accepted ? 'acceptée' : 'déclinée'}`
        );
      } catch (pushError) {
        console.warn('⚠️ Erreur notification push (non critique):', pushError);
      }
    } catch (error) {
      console.error('❌ Erreur notification réponse:', error);
    }
  }

  // Nettoyer les invitations expirées
  static async cleanupExpiredInvitations() {
    try {
      const now = new Date();
      const expiredQuery = query(
        collection(db, 'invitations'),
        where('expiresAt', '<', now),
        where('status', '==', 'pending')
      );

      const expiredInvitations = await getDocs(expiredQuery);
      const deletePromises = [];

      expiredInvitations.forEach(doc => {
        deletePromises.push(updateDoc(doc.ref, { status: 'expired' }));
      });

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(
          `🧹 ${deletePromises.length} invitations expirées nettoyées`
        );
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage invitations:', error);
    }
  }
}

export class NotificationService {
  // Écouter les notifications
  static onNotifications(userId, callback) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.warn('Warning: Could not listen to notifications:', error);
      callback([]);
      return () => {};
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.warn('Warning: Could not mark notification as read:', error);
    }
  }

  static async createNotification(
    toUserId,
    fromUserId,
    type,
    message,
    data = {}
  ) {
    if (!isOnline()) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.warn('Warning: Could not create notification:', error);
    }
  }

  // Récupérer les notifications (méthode manquante)
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
}

// Export du service App Check pour utilisation externe
export { AppCheckService } from './appCheckService';
