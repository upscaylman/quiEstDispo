import { motion } from 'framer-motion';
import { Clock, MapPin, Smartphone, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

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
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('google');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [showFacebookRedirect, setShowFacebookRedirect] = useState(false);

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

  // Vérifier les résultats de redirection au chargement
  React.useEffect(() => {
    const checkForRedirectResult = async () => {
      try {
        // Vérifier Google
        const googleResult = await checkGoogleRedirectResult();
        if (googleResult) {
          console.log('Redirection Google terminée avec succès');
          return;
        }

        // Vérifier Facebook
        const facebookResult = await checkFacebookRedirectResult();
        if (facebookResult) {
          console.log('Redirection Facebook terminée avec succès');
        }
      } catch (error) {
        setError('Erreur lors de la finalisation de la connexion');
        console.error('Redirect result error:', error);
      }
    };

    checkForRedirectResult();
  }, [checkGoogleRedirectResult, checkFacebookRedirectResult]);

  const handlePhoneSignIn = async () => {
    try {
      setError('');

      // Créer le reCAPTCHA verifier s'il n'existe pas
      if (!recaptchaVerifier) {
        console.log('🔧 Creating new reCAPTCHA verifier...');

        try {
          const verifier = createRecaptchaVerifier('recaptcha-container', {
            size: 'invisible', // Invisible pour éviter les problèmes de configuration
            onSuccess: () => {
              console.log('✅ reCAPTCHA résolu avec succès');
            },
            onExpired: () => {
              setError('reCAPTCHA expiré. Veuillez réessayer.');
            },
            onError: error => {
              console.error('❌ reCAPTCHA error:', error);
              if (error.message && error.message.includes('sitekey')) {
                setError(
                  'Mode développement: utilisez le bouton de test SMS ci-dessous'
                );
              } else {
                setError('Erreur reCAPTCHA. Rechargez la page.');
              }
            },
          });

          setRecaptchaVerifier(verifier);
          console.log('✅ reCAPTCHA verifier created');

          // Procéder directement à l'envoi SMS sans rendre manuellement
          const result = await signInWithPhone(phoneNumber, verifier);
          setConfirmationResult(result);
          console.log('✅ SMS sent');
          return;
        } catch (verifierError) {
          console.error('❌ Error creating reCAPTCHA verifier:', verifierError);

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

      // Envoyer le SMS
      const result = await signInWithPhone(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (error) {
      setError(error.message || 'Erreur envoi SMS. Vérifiez le numéro.');
      // Réinitialiser le reCAPTCHA en cas d'erreur
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
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
      setError(error.message || 'Code incorrect. Réessayez.');
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
        <h1 className="text-4xl font-bold text-white mb-2">Qui Est Dispo</h1>
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
              onClick={() => setAuthMethod('google')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
                authMethod === 'google'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setAuthMethod('facebook')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
                authMethod === 'facebook'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Facebook
            </button>
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
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {authMethod === 'google' ? (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGoogleSignIn(false)}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
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
          ) : authMethod === 'facebook' ? (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFacebookSignIn(false)}
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span className="mr-2">📘</span>
                    Continuer avec Facebook
                  </>
                )}
              </motion.button>

              {showFacebookRedirect && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFacebookSignIn(true)}
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
          ) : (
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
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
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
