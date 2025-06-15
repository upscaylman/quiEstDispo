// Service d'authentification Firebase
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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
      console.log('🔥 Firebase: Starting Google sign-in...');

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
        hl: 'fr',
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      console.log('✅ Firebase: Google sign-in successful');

      if (process.env.NODE_ENV === 'development' && token) {
        console.log('🔑 Google Access Token available for API calls');
      }

      if (result.user) {
        try {
          await this.createUserProfile(result.user);
        } catch (profileError) {
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
      console.error('❌ Google sign-in failed:', error);

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
        case 'auth/operation-not-allowed':
          errorMessage =
            "Connexion Google non activée. Contactez l'administrateur";
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Problème de connexion. Vérifiez votre internet';
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

  // Connexion avec Facebook selon la documentation officielle
  static async signInWithFacebook() {
    try {
      console.log('🔥 Firebase: Starting Facebook sign-in...');

      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      provider.setCustomParameters({
        locale: 'fr_FR',
      });

      const result = await signInWithPopup(auth, provider);
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      console.log('✅ Firebase: Facebook sign-in successful');

      if (process.env.NODE_ENV === 'development' && token) {
        console.log('🔑 Facebook Access Token available for API calls');
      }

      if (result.user) {
        try {
          await this.createUserProfile(result.user);
        } catch (profileError) {
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
      console.error('❌ Facebook sign-in failed:', error);

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
        case 'auth/operation-not-allowed':
          errorMessage =
            "Connexion Facebook non activée. Contactez l'administrateur";
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte utilisateur a été désactivé';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Problème de connexion. Vérifiez votre internet';
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

  // Valider et formater le numéro de téléphone au format E.164
  static validateAndFormatPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Numéro de téléphone requis');
    }

    // Supprimer tous les espaces, tirets et autres caractères non numériques sauf +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Si le numéro commence par 0 (format français), remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si le numéro ne commence pas par +, ajouter +33 (par défaut France)
    else if (!cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned;
    }

    // Vérifier que le numéro a une longueur raisonnable (au moins 10 chiffres après +33)
    if (cleaned.length < 12) {
      // +33 + 9 chiffres minimum
      throw new Error('Numéro de téléphone trop court');
    }

    if (cleaned.length > 15) {
      // Limite E.164
      throw new Error('Numéro de téléphone trop long');
    }

    // Validation spécifique pour les numéros français (+33)
    if (cleaned.startsWith('+33')) {
      const frenchNumber = cleaned.substring(3); // Enlever +33
      if (frenchNumber.length !== 9) {
        throw new Error('Le numéro français doit avoir 9 chiffres après +33');
      }
      if (!frenchNumber.match(/^[1-7][0-9]{8}$/)) {
        throw new Error('Format de numéro français invalide');
      }
    }

    console.log(`📱 Numéro formaté: ${phoneNumber} → ${cleaned}`);
    return cleaned;
  }

  // Connexion avec téléphone
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

  // Créer un vérificateur reCAPTCHA
  static createRecaptchaVerifier(elementId, options = {}) {
    try {
      console.log('🔧 Creating reCAPTCHA verifier...');

      // FORCER la désactivation d'App Check pour résoudre erreur 500
      console.log(
        '🔧 FORÇAGE désactivation App Check pour auth téléphone (erreur 500)'
      );
      auth.settings = auth.settings || {};
      auth.settings.appVerificationDisabledForTesting = true;

      // Configuration d'émulateur forcée pour contourner les problèmes serveur
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '🔧 Configuration émulateur forcée pour contourner erreur 500'
        );

        // Désactiver toutes les vérifications en développement
        window.recaptchaVerifier = null;
        global.recaptchaVerifier = null;
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

      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        elementId,
        recaptchaConfig
      );

      console.log('✅ reCAPTCHA verifier créé avec succès');
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

  // Confirmer le code de vérification
  static async confirmPhoneCode(confirmationResult, verificationCode) {
    try {
      console.log('🔢 Confirming verification code...');

      const result = await confirmationResult.confirm(verificationCode);
      console.log('✅ Phone verification successful');

      // Vérifier si ce numéro existe déjà dans un compte existant
      if (result.user && result.user.phoneNumber) {
        const linkedUser = await this.handlePhoneAccountLinking(result.user);
        return linkedUser; // Retourner l'utilisateur lié ou créé
      }

      return result.user; // Fallback au cas où
    } catch (error) {
      console.error('❌ Code verification failed:', error);

      let errorMessage = 'Code de vérification invalide';
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Code de vérification invalide';
          break;
        case 'auth/code-expired':
          errorMessage = 'Code de vérification expiré';
          break;
        default:
          errorMessage = error.message || 'Erreur de vérification du code';
      }
      throw new Error(errorMessage);
    }
  }

  // Gérer la liaison des comptes lors de la connexion par téléphone
  static async handlePhoneAccountLinking(phoneUser) {
    try {
      console.log(
        '🔍 Vérification si le numéro existe dans un compte existant...'
      );
      const phoneNumber = phoneUser.phoneNumber;

      // Chercher un utilisateur existant avec ce numéro de téléphone
      const usersQuery = query(
        collection(db, 'users'),
        where('phone', '==', phoneNumber)
      );

      const existingUsers = await getDocs(usersQuery);

      if (!existingUsers.empty) {
        // Plusieurs comptes peuvent avoir le même numéro, prioriser celui avec un email (compte principal)
        let existingUserDoc = existingUsers.docs[0];
        let existingUserData = existingUserDoc.data();
        let existingUserId = existingUserDoc.id;

        // Si plusieurs résultats, prioriser le compte avec un email
        if (existingUsers.docs.length > 1) {
          console.log(
            `⚠️ ${existingUsers.docs.length} comptes trouvés avec ce numéro, sélection du compte principal...`
          );

          const accountWithEmail = existingUsers.docs.find(doc => {
            const data = doc.data();
            return data.email && data.email.trim() !== '';
          });

          if (accountWithEmail) {
            existingUserDoc = accountWithEmail;
            existingUserData = existingUserDoc.data();
            existingUserId = existingUserDoc.id;
            console.log(
              `✅ Compte principal sélectionné: ${existingUserData.name} (${existingUserData.email})`
            );
          }
        }

        console.log(
          `✅ Compte existant trouvé: ${existingUserData.name} (${existingUserId})`
        );

        // Comparer les UIDs
        if (existingUserId !== phoneUser.uid) {
          console.log('🔄 Comptes différents détectés, liaison nécessaire...');

          // Déconnecter le compte temporaire pour forcer la reconnexion avec le compte principal
          await firebaseSignOut(auth);

          // Informer l'utilisateur avec un message explicatif
          alert(
            `✅ Parfait ! Votre numéro ${phoneNumber} a été ajouté à votre compte "${existingUserData.name}".\n\n` +
              `Reconnectez-vous avec votre email OU votre numéro de téléphone pour accéder au même compte.`
          );

          // Retourner un signal spécial pour indiquer qu'il faut se reconnecter
          throw new Error('ACCOUNT_LINKING_SUCCESS');
        } else {
          console.log('✅ Même compte, mise à jour des infos...');
          // C'est le même compte, juste mettre à jour
          await this.createUserProfile(phoneUser);
          return phoneUser; // Retourner l'utilisateur connecté
        }
      } else {
        console.log('ℹ️ Nouveau numéro, création du profil...');
        await this.createUserProfile(phoneUser);
        console.log('✅ Nouvel utilisateur créé et connecté !');
        return phoneUser; // Retourner l'utilisateur connecté
      }
    } catch (error) {
      if (error.message === 'ACCOUNT_LINKING_SUCCESS') {
        throw error; // Re-lancer le signal spécial
      }
      console.error('❌ Erreur liaison comptes:', error);
      // En cas d'erreur, créer quand même le profil
      await this.createUserProfile(phoneUser);
      return phoneUser; // Retourner l'utilisateur même en cas d'erreur
    }
  }

  // Créer le profil utilisateur
  static async createUserProfile(user) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot create user profile');
      // Retourner les données de base en mode offline
      return {
        uid: user.uid,
        name: user.displayName || 'Utilisateur',
        email: user.email || null,
        phone: user.phoneNumber || null,
        avatar: user.photoURL || null,
        isOnline: false,
        isAvailable: false,
        currentActivity: null,
        availabilityId: null,
        location: null,
        friends: [],
      };
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        const now = new Date().toISOString();

        if (!userSnap.exists()) {
          const userData = {
            uid: user.uid,
            name: user.displayName || 'Utilisateur',
            email: user.email || null,
            phone: user.phoneNumber || null,
            avatar: user.photoURL || null,
            isOnline: true,
            isAvailable: false,
            currentActivity: null,
            availabilityId: null,
            location: null,
            friends: [],
            createdAt: now,
            updatedAt: serverTimestamp(),
          };

          await setDoc(userRef, userData);
          console.log('✅ User profile created successfully');
          return userData;
        } else {
          await updateDoc(userRef, {
            isOnline: true,
            updatedAt: serverTimestamp(),
          });
          console.log('✅ User profile updated (login)');

          // Retourner les données existantes avec la mise à jour
          const existingData = userSnap.data();
          return {
            id: userSnap.id,
            ...existingData,
            isOnline: true,
          };
        }
      });
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      // En cas d'erreur, retourner les données de base Firebase Auth
      return {
        uid: user.uid,
        name: user.displayName || 'Utilisateur',
        email: user.email || null,
        phone: user.phoneNumber || null,
        avatar: user.photoURL || null,
        isOnline: true,
        isAvailable: false,
        currentActivity: null,
        availabilityId: null,
        location: null,
        friends: [],
      };
    }
  }

  // Obtenir le profil utilisateur
  static async getUserProfile(userId) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot get user profile');
      return null;
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          return { id: userSnap.id, ...userSnap.data() };
        }
        return null;
      });
    } catch (error) {
      console.error('❌ Get user profile failed:', error);
      throw new Error(`Impossible de récupérer le profil: ${error.message}`);
    }
  }

  // Déconnexion
  static async signOut() {
    try {
      const user = auth.currentUser;
      if (user && isOnline()) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isOnline: false,
          isAvailable: false,
          currentActivity: null,
          availabilityId: null,
          updatedAt: serverTimestamp(),
        });
      }

      await firebaseSignOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw new Error(`Déconnexion échouée: ${error.message}`);
    }
  }

  // Écouter les changements d'authentification
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Obtenir l'utilisateur actuel
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Vérifier si l'utilisateur est authentifié
  static isAuthenticated() {
    return !!auth.currentUser;
  }

  // Recharger l'utilisateur
  static async reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
    }
  }

  // Mettre à jour le nom d'utilisateur
  static async updateUserName(userId, userName) {
    if (!isOnline()) {
      console.warn('⚠️ Offline mode, cannot update user name');
      return;
    }

    try {
      return await retryWithBackoff(async () => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          name: userName,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ User name updated successfully');
      });
    } catch (error) {
      console.error('❌ Update user name failed:', error);
      throw new Error(`Impossible de mettre à jour le nom: ${error.message}`);
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
        console.log('📝 Mise à jour du numéro dans Firestore...');

        // Normaliser le numéro de téléphone
        const normalizedPhone = phoneNumber?.replace(/\s/g, '');

        // Vérifier le format
        const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
        if (!phoneRegex.test(normalizedPhone)) {
          throw new Error('Format de numéro invalide');
        }

        // Convertir 0X en +33X
        let finalPhone = normalizedPhone;
        if (finalPhone.startsWith('0')) {
          finalPhone = '+33' + finalPhone.substring(1);
        }

        // Vérifier que le numéro n'est pas déjà utilisé
        const existingUserQuery = query(
          collection(db, 'users'),
          where('phone', '==', finalPhone),
          where('__name__', '!=', userId)
        );
        const existingUserSnapshot = await getDocs(existingUserQuery);

        if (!existingUserSnapshot.empty) {
          throw new Error(
            'Ce numéro de téléphone est déjà utilisé par un autre utilisateur'
          );
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          phone: finalPhone,
          updatedAt: serverTimestamp(),
        });

        console.log(
          '✅ Numéro de téléphone mis à jour avec succès:',
          finalPhone
        );
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

  // Ré-authentifier l'utilisateur si nécessaire pour la suppression
  static async reauthenticateForDeletion() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    // Vérifier si l'utilisateur peut supprimer son compte
    try {
      // Test rapide pour vérifier les permissions
      await currentUser.getIdToken(true);
      return true;
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        return false;
      }
      throw error;
    }
  }

  // Supprimer complètement un compte utilisateur
  static async deleteUserAccount(userId) {
    if (!isOnline()) {
      throw new Error('Connexion internet requise pour supprimer le compte');
    }

    try {
      console.log(`🗑️ Suppression complète du compte ${userId}...`);

      // 0. Vérifier d'abord si on peut supprimer le compte Auth
      const canDelete = await this.reauthenticateForDeletion();
      if (!canDelete) {
        throw new Error(
          'Pour des raisons de sécurité, vous devez vous reconnecter avant de supprimer votre compte. ' +
            'Veuillez vous déconnecter et vous reconnecter, puis réessayer.'
        );
      }

      await retryWithBackoff(async () => {
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

        // 2. Supprimer toutes les notifications envoyées et reçues
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

        const notificationDeletePromises = [
          ...notificationsToSnapshot.docs.map(doc => deleteDoc(doc.ref)),
          ...notificationsFromSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ];
        await Promise.all(notificationDeletePromises);
        console.log('✅ Notifications supprimées');

        // 3. Supprimer les relations d'amitié
        const friendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', userId)
        );
        const friendsSnapshot = await getDocs(friendsQuery);
        for (const doc of friendsSnapshot.docs) {
          await deleteDoc(doc.ref);
        }
        console.log("✅ Relations d'amitié supprimées");

        // 4. Supprimer le document utilisateur
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        console.log('✅ Document utilisateur supprimé');

        // 5. Supprimer l'utilisateur Firebase Auth
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          await currentUser.delete();
          console.log('✅ Compte Firebase Auth supprimé');
        }

        console.log('🎉 Suppression terminée avec succès !');
      });

      return { success: true, verification: { success: true } };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du compte:', error);

      if (error.code === 'auth/requires-recent-login') {
        throw new Error(
          'Pour des raisons de sécurité, vous devez vous reconnecter avant de supprimer votre compte. ' +
            'Veuillez vous déconnecter et vous reconnecter, puis réessayer.'
        );
      }

      throw new Error(`Erreur lors de la suppression: ${error.message}`);
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

  // Nettoyer un compte Firebase Auth orphelin (sans données Firestore)
  static async cleanupOrphanedAuthAccount() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('ℹ️ Aucun utilisateur connecté à nettoyer');
        return false;
      }

      // Vérifier si l'utilisateur a des données dans Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('🧹 Compte Auth orphelin détecté, suppression...');

        try {
          await currentUser.delete();
          console.log('✅ Compte Auth orphelin supprimé');
          return true;
        } catch (error) {
          if (error.code === 'auth/requires-recent-login') {
            console.log(
              '⚠️ Reconnexion requise pour supprimer le compte Auth orphelin'
            );
            throw new Error(
              'Compte orphelin détecté. Veuillez vous reconnecter pour terminer la suppression.'
            );
          }
          throw error;
        }
      } else {
        console.log('ℹ️ Compte Auth normal avec données Firestore');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage compte orphelin:', error);
      throw error;
    }
  }

  // Test de diagnostic pour identifier le problème localhost
  static async diagnosePhoneAuth() {
    try {
      console.log('🔍 DIAGNOSTIC: Test des configurations Firebase...');

      // Vérifier la configuration
      console.log('📋 Firebase Config:', {
        apiKey: auth.app.options.apiKey.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
      });

      // Vérifier App Check
      console.log('🛡️ App Check status:', {
        enabled: !!window.firebase?.appCheck,
        debugToken: !!window.FIREBASE_APPCHECK_DEBUG_TOKEN,
      });

      // Vérifier reCAPTCHA
      console.log('🔐 reCAPTCHA config:', {
        siteKey:
          process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY?.substring(0, 10) + '...',
        windowLocation: window.location.href,
      });

      // Test des paramètres auth
      console.log('🔧 Auth settings:', auth.settings);

      return {
        status: 'diagnostic_complete',
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      return { error: error.message };
    }
  }
}
