import { motion } from 'framer-motion';
import { Clock, MapPin, Smartphone, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInService from '../services/googleSignInService';
import GoogleSignInButton from './GoogleSignInButton';

const LoginScreen = () => {
  const {
    signInWithGoogle,
    signInWithFacebook,
    checkGoogleRedirectResult,
    checkFacebookRedirectResult,
    signInWithPhone,
    confirmPhoneCode,
    createRecaptchaVerifier,
    testPhoneAuth,
    loading,
    setLoading,
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('phone');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [showFacebookRedirect, setShowFacebookRedirect] = useState(false);
  const [googleSignInReady, setGoogleSignInReady] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Initialiser la nouvelle API Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        // Remplacez par votre vrai Client ID Google
        const clientId =
          process.env.REACT_APP_GOOGLE_CLIENT_ID || 'VOTRE_CLIENT_ID_GOOGLE';

        if (clientId && clientId !== 'VOTRE_CLIENT_ID_GOOGLE') {
          await GoogleSignInService.initialize(clientId, {
            context: 'signin',
            ux_mode: 'popup',
            auto_prompt: false, // Désactiver One Tap sur la page de connexion
            callback: 'handleGoogleSignInCallback', // Nom unique pour éviter les conflits
          });
          setGoogleSignInReady(true);
          console.log('✅ Google Sign-In nouvelle API initialisée');
        } else {
          console.warn(
            '⚠️ Client ID Google non configuré. Ajoutez REACT_APP_GOOGLE_CLIENT_ID dans votre .env'
          );
          // On garde googleSignInReady à false pour afficher le fallback avec message informatif
        }
      } catch (error) {
        console.error('❌ Erreur initialisation Google Sign-In:', error);
      }
    };

    initializeGoogleSignIn();
  }, []);

  // Handler pour la nouvelle API Google Sign-In
  const handleNewGoogleSignIn = async response => {
    try {
      setError('');
      setLoading(true);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('🎯 Nouvelle API Google Sign-In - credential reçu');

      // Connecter avec Firebase en utilisant le credential
      const result = await GoogleSignInService.signInWithFirebase(
        response.credential
      );

      console.log('✅ Connexion réussie avec la nouvelle API:', result);
    } catch (error) {
      console.error('❌ Erreur nouvelle API Google:', error);
      setError(error.message || 'Erreur de connexion avec Google');
      setLoading(false);
    }
  };

  // Fonction pour formater le numéro de téléphone au fur et à mesure de la saisie
  const formatPhoneInput = value => {
    // Supprimer tous les caractères non-numériques sauf +
    let cleaned = value.replace(/[^\d+]/g, '');

    // Si l'utilisateur commence par 0, remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si l'utilisateur ne commence pas par +, ajouter +33
    else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned;
    }

    // Formater avec des espaces pour la lisibilité : +33 6 12 34 56 78
    if (cleaned.startsWith('+33') && cleaned.length > 3) {
      const number = cleaned.substring(3);
      let formatted = '+33';

      for (let i = 0; i < number.length; i++) {
        if (i === 1 || i === 3 || i === 5 || i === 7) {
          formatted += ' ';
        }
        formatted += number[i];
      }

      return formatted;
    }

    return cleaned;
  };

  // Fonction pour valider le numéro avant envoi
  const validatePhoneNumber = phone => {
    const cleaned = phone.replace(/[^\d+]/g, '');

    if (!cleaned) {
      throw new Error('Numéro de téléphone requis');
    }

    // Vérifier le format français
    if (cleaned.startsWith('+33')) {
      const frenchNumber = cleaned.substring(3);
      if (frenchNumber.length !== 9) {
        throw new Error('Le numéro français doit avoir 9 chiffres');
      }
      if (!frenchNumber.match(/^[1-7][0-9]{8}$/)) {
        throw new Error('Numéro français invalide (doit commencer par 01-07)');
      }
    }

    return cleaned;
  };

  const handleGoogleSignIn = async (useRedirect = false) => {
    try {
      setError('');
      const result = await signInWithGoogle(useRedirect);

      if (useRedirect && result === null) {
        // Redirection en cours, pas de résultat immédiat
        console.log('Redirection Google en cours...');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      const errorMessage =
        error.message || 'Erreur de connexion Google. Réessayez.';
      setError(errorMessage);

      // Si popup bloquée, proposer la redirection
      if (error.message.includes('popup') || error.message.includes('Popup')) {
        setShowRedirectOption(true);
      }
    }
  };

  const handleFacebookSignIn = async (useRedirect = false) => {
    try {
      setError('');
      const result = await signInWithFacebook(useRedirect);

      if (useRedirect && result === null) {
        // Redirection en cours, pas de résultat immédiat
        console.log('Redirection Facebook en cours...');
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      const errorMessage =
        error.message || 'Erreur de connexion Facebook. Réessayez.';
      setError(errorMessage);

      // Si popup bloquée, proposer la redirection
      if (error.message.includes('popup') || error.message.includes('Popup')) {
        setShowFacebookRedirect(true);
      }
    }
  };

  // Vérifier les résultats de redirection au chargement (une seule fois)
  useEffect(() => {
    if (redirectChecked) return; // Éviter les appels répétitifs

    const checkForRedirectResult = async () => {
      try {
        setRedirectChecked(true); // Marquer comme vérifié

        // Vérifier Google
        const googleResult = await checkGoogleRedirectResult();
        if (googleResult) {
          console.log('✅ Redirection Google terminée avec succès');
          return;
        }

        // Vérifier Facebook
        const facebookResult = await checkFacebookRedirectResult();
        if (facebookResult) {
          console.log('✅ Redirection Facebook terminée avec succès');
        }
      } catch (error) {
        setError('Erreur lors de la finalisation de la connexion');
        console.error('❌ Redirect result error:', error);
      }
    };

    checkForRedirectResult();
  }, [checkGoogleRedirectResult, checkFacebookRedirectResult, redirectChecked]);

  const handlePhoneSignIn = async () => {
    try {
      setError('');
      setLoading(true);

      // Valider le numéro de téléphone avant envoi
      const validatedPhone = validatePhoneNumber(phoneNumber);
      console.log('📱 Numéro validé:', validatedPhone);

      // Créer un nouveau verifier si nécessaire
      if (!recaptchaVerifier) {
        try {
          console.log('🔐 Creating reCAPTCHA verifier...');
          const verifier = createRecaptchaVerifier('recaptcha-container', {
            size: 'invisible',
          });
          setRecaptchaVerifier(verifier);
          console.log('✅ reCAPTCHA verifier created');

          // Procéder directement à l'envoi SMS sans rendre manuellement
          console.log('📱 Sending SMS with phone number:', validatedPhone);
          const result = await signInWithPhone(validatedPhone, verifier);
          console.log('✅ SMS sent, confirmation result:', result);
          setConfirmationResult(result);
          return;
        } catch (verifierError) {
          console.error('❌ Error creating reCAPTCHA verifier:', verifierError);
          setLoading(false); // Important: arrêter le loading

          if (
            verifierError.message &&
            verifierError.message.includes('sitekey')
          ) {
            throw new Error(
              'Configuration reCAPTCHA manquante. En mode développement, utilisez le bouton "🧪 Test SMS" ci-dessous.'
            );
          } else {
            throw new Error(`Erreur reCAPTCHA: ${verifierError.message}`);
          }
        }
      }

      // Envoyer le SMS avec le verifier existant
      console.log('📱 Sending SMS with existing verifier...');
      const result = await signInWithPhone(validatedPhone, recaptchaVerifier);
      console.log('✅ SMS sent successfully');
      setConfirmationResult(result);
    } catch (error) {
      console.error('❌ Complete phone sign-in error:', error);
      setError(error.message || 'Erreur envoi SMS. Vérifiez le numéro.');
      setLoading(false); // Critical: toujours arrêter le loading

      // Réinitialiser le reCAPTCHA en cas d'erreur
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (clearError) {
          console.warn('Warning: Could not clear reCAPTCHA:', clearError);
        }
        setRecaptchaVerifier(null);
      }
    }
  };

  const handleVerifyCode = async () => {
    try {
      setError('');
      if (confirmationResult && verificationCode) {
        await confirmPhoneCode(confirmationResult, verificationCode);
      }
    } catch (error) {
      if (error.message === 'ACCOUNT_LINKING_SUCCESS') {
        // Cas spécial : le numéro a été lié avec succès à un compte existant
        // L'utilisateur a été déconnecté et l'interface va se mettre à jour automatiquement
        console.log(
          '✅ Liaison de comptes réussie - reconnexion automatique en cours...'
        );
        setError('');
        resetPhoneAuth();
        // Pas besoin d'afficher d'erreur, le message de succès a déjà été affiché
      } else {
        console.error('❌ Erreur lors de la vérification du code:', error);
        setError(error.message || 'Code incorrect. Réessayez.');
      }
    }
  };

  const resetPhoneAuth = () => {
    setConfirmationResult(null);
    setVerificationCode('');
    setError('');
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      setRecaptchaVerifier(null);
    }
  };

  const handleTestPhoneAuth = async () => {
    try {
      setError('');
      await testPhoneAuth();
    } catch (error) {
      console.error('Test phone auth error:', error);
      setError(error.message || 'Erreur lors du test SMS');
    }
  };

  const features = [
    {
      icon: MapPin,
      title: 'Géolocalisation',
      description: 'Partage ta position avec tes amis',
    },
    {
      icon: Users,
      title: 'Amis proches',
      description: 'Vois qui est disponible autour de toi',
    },
    {
      icon: Clock,
      title: 'Temps réel',
      description: 'Notifications instantanées',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-16 pb-8"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Qui est dispo ?</h1>
        <p className="text-blue-100 text-lg">
          Organisez vos sorties spontanées entre amis
        </p>
      </motion.div>

      {/* Features */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <feature.icon className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-blue-100 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Auth Form */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-6"
      >
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Connexion
          </h2>

          {/* Auth Method Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
                authMethod === 'phone'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Téléphone
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
                authMethod === 'google'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Google
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {authMethod === 'phone' ? (
            <div className="space-y-4">
              {!confirmationResult ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <Smartphone
                        className="absolute left-3 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e =>
                          setPhoneNumber(formatPhoneInput(e.target.value))
                        }
                        placeholder="+33 6 12 34 56 78"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format accepté : +33 6 12 34 56 78 ou 06 12 34 56 78
                    </p>
                  </div>
                  <div id="recaptcha-container"></div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePhoneSignIn}
                    disabled={loading || !phoneNumber}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-medium transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Envoyer le code SMS'
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code de vérification
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyCode}
                    disabled={loading || !verificationCode}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-medium transition-colors mb-3"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Vérifier le code'
                    )}
                  </motion.button>

                  <div className="space-y-2">
                    <button
                      onClick={resetPhoneAuth}
                      disabled={loading}
                      className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 text-sm font-medium transition-colors"
                    >
                      ← Changer de numéro
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTestPhoneAuth}
                        disabled={loading}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                        ) : (
                          '🧪 Test SMS (+33612345678)'
                        )}
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {googleSignInReady ? (
                /* Nouveau bouton Google Sign-In officiel */
                <div className="space-y-3">
                  <GoogleSignInButton
                    onSignIn={handleNewGoogleSignIn}
                    type="standard"
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="300"
                    disabled={loading}
                    className="w-full flex justify-center"
                  />

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={loading}
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center text-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <>
                        <span className="mr-2">🔄</span>
                        Méthode alternative
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                /* Design moderne pour la méthode classique */
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={loading}
                    className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-800 py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continuer avec Google
                      </>
                    )}
                  </motion.button>

                  {showRedirectOption && (
                    <motion.button
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGoogleSignIn(true)}
                      disabled={loading}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center text-sm"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span className="mr-2">🔄</span>
                          Essayer avec redirection
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-6">
            En te connectant, tu acceptes nos conditions d'utilisation et notre
            politique de confidentialité.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
