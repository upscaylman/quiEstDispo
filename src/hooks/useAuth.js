import { useEffect, useState } from 'react';
import { AuthService } from '../services/firebaseService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = AuthService.onAuthStateChanged(async firebaseUser => {
      // eslint-disable-next-line no-console
      console.log(
        '🔥 Auth state changed:',
        firebaseUser ? 'User logged in' : 'User logged out'
      );

      if (!isMounted) return;

      if (firebaseUser) {
        // Créer d'abord les données utilisateur de base
        const fallbackUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || '',
          phone: firebaseUser.phoneNumber || '',
        };

        if (isMounted) {
          // Mettre à jour immédiatement avec les données de base
          setUser(fallbackUser);
          setLoading(false);
        }

        // Ensuite essayer de créer/mettre à jour le profil Firestore en arrière-plan
        try {
          // eslint-disable-next-line no-console
          console.log('🔥 Creating/updating user profile in background...');
          const userData = await AuthService.createUserProfile(firebaseUser);
          // eslint-disable-next-line no-console
          console.log('✅ User profile updated:', userData);

          if (isMounted) {
            // Mettre à jour avec les données complètes si disponibles
            setUser(userData);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            '⚠️ Profile creation failed, keeping fallback data:',
            error
          );
          // Garder les données de fallback, pas de re-render nécessaire
        }
      } else if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (useRedirect = false) => {
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('🔥 Starting Google sign-in...');

      let result;
      if (useRedirect) {
        // Utiliser la redirection pour mobile ou si popup bloquée
        await AuthService.signInWithGoogleRedirect();
        // La page va se recharger, pas de résultat immédiat
        return null;
      } else {
        // Utiliser popup par défaut
        result = await AuthService.signInWithGoogle();
      }

      // eslint-disable-next-line no-console
      console.log('✅ Google sign-in successful:', result);
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Google sign-in error:', error);

      // Si popup bloquée, proposer la redirection
      if (error.message.includes('popup') || error.message.includes('Popup')) {
        throw new Error(
          error.message + ' - Vous pouvez essayer le mode redirection.'
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async (useRedirect = false) => {
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('🔥 Starting Facebook sign-in...');

      let result;
      if (useRedirect) {
        // Utiliser la redirection pour mobile ou si popup bloquée
        await AuthService.signInWithFacebookRedirect();
        // La page va se recharger, pas de résultat immédiat
        return null;
      } else {
        // Utiliser popup par défaut
        result = await AuthService.signInWithFacebook();
      }

      // eslint-disable-next-line no-console
      console.log('✅ Facebook sign-in successful:', result);
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Facebook sign-in error:', error);

      // Si popup bloquée, proposer la redirection
      if (error.message.includes('popup') || error.message.includes('Popup')) {
        throw new Error(
          error.message + ' - Vous pouvez essayer le mode redirection.'
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleRedirectResult = async () => {
    try {
      const result = await AuthService.getGoogleRedirectResult();
      if (result) {
        console.log('✅ Google redirect sign-in completed:', result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('❌ Google redirect result error:', error);
      throw error;
    }
  };

  const checkFacebookRedirectResult = async () => {
    try {
      const result = await AuthService.getFacebookRedirectResult();
      if (result) {
        console.log('✅ Facebook redirect sign-in completed:', result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('❌ Facebook redirect result error:', error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('📱 Starting phone sign-in...');
      const confirmationResult = await AuthService.signInWithPhone(
        phoneNumber,
        recaptchaVerifier
      );
      // eslint-disable-next-line no-console
      console.log('✅ SMS sent successfully');
      return confirmationResult;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Phone sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneCode = async (confirmationResult, verificationCode) => {
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('🔢 Confirming verification code...');
      const result = await AuthService.confirmPhoneCode(
        confirmationResult,
        verificationCode
      );
      // eslint-disable-next-line no-console
      console.log('✅ Phone sign-in successful');
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Code confirmation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createRecaptchaVerifier = (elementId, options = {}) => {
    try {
      return AuthService.createRecaptchaVerifier(elementId, options);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ reCAPTCHA verifier creation error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 useAuth.signOut() appelé');
    try {
      setLoading(true);
      console.log('🔄 Appel de AuthService.signOut...');
      await AuthService.signOut();
      console.log('✅ AuthService.signOut terminé');
    } catch (error) {
      console.error('❌ Erreur dans useAuth.signOut:', error);
      throw error;
    } finally {
      setLoading(false);
      console.log('🔄 setLoading(false) terminé');
    }
  };

  const testPhoneAuth = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing phone authentication...');
      const result = await AuthService.testPhoneAuth();
      console.log('✅ Test phone auth successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Test phone auth error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkBlazePlanStatus = async () => {
    try {
      return await AuthService.checkBlazePlanStatus();
    } catch (error) {
      console.error('❌ Blaze status check error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    setLoading,
    signInWithGoogle,
    signInWithFacebook,
    checkGoogleRedirectResult,
    checkFacebookRedirectResult,
    signInWithPhone,
    confirmPhoneCode,
    createRecaptchaVerifier,
    testPhoneAuth,
    checkBlazePlanStatus,
    signOut,
  };
};

export default useAuth;
