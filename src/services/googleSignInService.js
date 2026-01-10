import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Service pour intégrer la nouvelle API Google Sign-In avec Firebase
 * Basé sur https://developers.google.com/identity/gsi/web/reference/html-reference?hl=fr
 */
export class GoogleSignInService {
  /**
   * Initialise Google Sign-In avec les paramètres fournis
   * @param {string} clientId - ID client Google OAuth 2.0
   * @param {Object} options - Options de configuration
   */
  static initialize(clientId, options = {}) {
    return new Promise((resolve, reject) => {
      // Attendre que la librairie soit chargée
      const checkGoogleReady = () => {
        if (
          window.google &&
          window.google.accounts &&
          window.google.accounts.id
        ) {
          try {
            // Vérifier que le callback est une fonction
            if (!options.callback || typeof options.callback !== 'function') {
              console.error(
                '❌ Google Sign-In: callback doit être une fonction'
              );
              reject(new Error('callback doit être une fonction'));
              return;
            }

            // Configuration par défaut selon la documentation
            const config = {
              client_id: clientId,
              callback: options.callback,
              auto_prompt: options.auto_prompt || false,
              cancel_on_tap_outside: options.cancel_on_tap_outside !== false,
              context: options.context || 'signin',
              ux_mode: options.ux_mode || 'popup',
              itp_support: options.itp_support !== false,
              use_fedcm_for_prompt: options.use_fedcm_for_prompt !== false,
            };

            // Initialiser Google Identity Services
            window.google.accounts.id.initialize(config);
            console.log('✅ Google Sign-In initialisé avec succès');
            resolve(true);
          } catch (error) {
            console.error(
              "❌ Erreur lors de l'initialisation Google Sign-In:",
              error
            );
            reject(error);
          }
        } else {
          // Réessayer après 100ms
          setTimeout(checkGoogleReady, 100);
        }
      };

      checkGoogleReady();
    });
  }

  /**
   * Connecte l'utilisateur avec Firebase en utilisant le credential Google
   * @param {string} credential - JWT credential de Google
   * @returns {Promise} Résultat de la connexion Firebase
   */
  static async signInWithFirebase(credential) {
    try {
      console.log('🔥 Connexion Firebase avec credential Google...');

      // Créer un credential Firebase à partir du JWT Google
      const googleCredential = GoogleAuthProvider.credential(credential);

      // Se connecter avec Firebase
      const result = await signInWithCredential(auth, googleCredential);

      console.log('✅ Connexion Firebase réussie:', result);

      // Créer le profil utilisateur si nécessaire
      if (result.user) {
        try {
          // Import dynamique pour éviter les dépendances circulaires
          const { AuthService } = await import('./firebaseService');
          await AuthService.createUserProfile(result.user);
        } catch (profileError) {
          console.warn(
            '⚠️ Erreur création profil (continuer quand même):',
            profileError
          );
        }
      }

      return {
        user: result.user,
        credential: googleCredential,
      };
    } catch (error) {
      console.error('❌ Erreur connexion Firebase:', error);

      let errorMessage = 'Erreur de connexion';
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Un compte existe déjà avec cette adresse email';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credential Google invalide';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Connexion Google non autorisée';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Compte utilisateur désactivé';
          break;
        default:
          errorMessage = error.message || 'Erreur de connexion inconnue';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Affiche la prompt "One Tap" si les conditions sont réunies
   */
  static promptOneTap() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt(notification => {
          console.log('📋 One Tap notification:', notification);

          if (notification.isNotDisplayed()) {
            console.log(
              '⚠️ One Tap non affiché:',
              notification.getNotDisplayedReason()
            );
          } else if (notification.isSkippedMoment()) {
            console.log('⏭️ One Tap ignoré:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.log('❌ One Tap fermé:', notification.getDismissedReason());
          }
        });
      } catch (error) {
        console.error('❌ Erreur One Tap:', error);
      }
    }
  }

  /**
   * Désactive/cache la prompt One Tap
   */
  static disableOneTap() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.cancel();
        console.log('✅ One Tap désactivé');
      } catch (error) {
        console.error('❌ Erreur désactivation One Tap:', error);
      }
    }
  }

  /**
   * Déconnexion Google (efface les sessions)
   */
  static signOut() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
        console.log('✅ Auto-sélection Google désactivée');
      } catch (error) {
        console.error('❌ Erreur déconnexion Google:', error);
      }
    }
  }

  /**
   * Révoque l'accès Google pour l'utilisateur
   * @param {string} accessToken - Token d'accès Google (optionnel)
   */
  static async revoke(accessToken) {
    if (
      window.google &&
      window.google.accounts &&
      window.google.accounts.oauth2
    ) {
      try {
        if (accessToken) {
          window.google.accounts.oauth2.revoke(accessToken, () => {
            console.log('✅ Accès Google révoqué');
          });
        }
      } catch (error) {
        console.error('❌ Erreur révocation Google:', error);
      }
    }
  }
}

export default GoogleSignInService;
