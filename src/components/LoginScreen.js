import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInService from '../services/googleSignInService';
import GoogleSignInButton from './GoogleSignInButton';
import MD3Button from './common/MD3Button';

/** @type {Window & { handleGoogleSignInCallback?: Function }} */
const windowWithCallback = window;

const LoginScreen = () => {
  const { signInWithGoogle, checkGoogleRedirectResult, loading, setLoading } =
    useAuth();
  const [error, setError] = useState('');
  const [googleSignInReady, setGoogleSignInReady] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Handler pour la callback Google Sign-In
  const handleGoogleCallback = async response => {
    try {
      setError('');
      setLoading(true);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('🎯 Google Sign-In - credential reçu');
      const result = await GoogleSignInService.signInWithFirebase(
        response.credential
      );
      console.log('✅ Connexion réussie:', result);
    } catch (err) {
      console.error('❌ Erreur Google:', err);
      setError(err.message || 'Erreur de connexion avec Google');
      setLoading(false);
    }
  };

  // Initialiser Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        const clientId =
          process.env.REACT_APP_GOOGLE_CLIENT_ID || 'VOTRE_CLIENT_ID_GOOGLE';

        if (clientId && clientId !== 'VOTRE_CLIENT_ID_GOOGLE') {
          windowWithCallback.handleGoogleSignInCallback = handleGoogleCallback;

          await GoogleSignInService.initialize(clientId, {
            context: 'signin',
            ux_mode: 'popup',
            auto_prompt: false,
            callback: handleGoogleCallback,
          });
          setGoogleSignInReady(true);
          console.log('✅ Google Sign-In initialisé');
        } else {
          console.warn(
            '⚠️ Client ID Google non configuré. Ajoutez REACT_APP_GOOGLE_CLIENT_ID dans .env'
          );
        }
      } catch (err) {
        console.error('❌ Erreur initialisation Google Sign-In:', err);
      }
    };

    initializeGoogleSignIn();

    return () => {
      if (windowWithCallback.handleGoogleSignInCallback) {
        delete windowWithCallback.handleGoogleSignInCallback;
      }
    };
  }, []);

  // Vérifier les résultats de redirection
  useEffect(() => {
    if (redirectChecked) return;

    const checkForRedirectResult = async () => {
      try {
        setRedirectChecked(true);
        const googleResult = await checkGoogleRedirectResult();
        if (googleResult) {
          console.log('✅ Redirection Google terminée');
        }
      } catch (err) {
        setError('Erreur lors de la finalisation de la connexion');
        console.error('❌ Redirect result error:', err);
      }
    };

    checkForRedirectResult();
  }, [checkGoogleRedirectResult, redirectChecked]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle(false);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Erreur de connexion Google. Réessayez.');
    }
  };

  const features = [
    {
      icon: MapPin,
      title: 'Géolocalisation',
      description: 'Partage ta position en temps réel',
      color: 'var(--md-sys-color-primary)',
    },
    {
      icon: Users,
      title: 'Amis proches',
      description: 'Vois qui est disponible autour de toi',
      color: 'var(--md-sys-color-secondary)',
    },
    {
      icon: Zap,
      title: 'Instantané',
      description: 'Notifications en temps réel',
      color: 'var(--md-sys-color-tertiary)',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ========== LEFT PANEL - Decorative (hidden on small screens) ========== */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 lg:min-h-screen relative overflow-hidden flex-col p-8 items-center"
        style={{
          backgroundSize: '400% 400%',
          backgroundImage:
            'linear-gradient(135deg, #111827 0%, color-mix(in srgb, var(--md-sys-color-tertiary) 70%, black) 25%, color-mix(in srgb, var(--md-sys-color-secondary) 75%, black) 50%, #111827 75%, color-mix(in srgb, var(--md-sys-color-tertiary) 60%, black) 100%)',
        }}
        initial={{ opacity: 0, x: -50 }}
        animate={{
          opacity: 1,
          x: 0,
          backgroundPosition: [
            '0% 0%',
            '100% 100%',
            '0% 50%',
            '50% 100%',
            '100% 0%',
            '0% 0%',
          ],
        }}
        transition={{
          opacity: { duration: 0.6 },
          x: { duration: 0.6 },
          backgroundPosition: {
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Floating Shapes */}
        <motion.div
          className="absolute w-32 h-32 bg-white/15 rounded-full blur-3xl"
          animate={{
            top: ['10%', '70%', '30%', '80%', '20%', '60%', '10%'],
            left: ['5%', '60%', '80%', '20%', '70%', '10%', '5%'],
            scale: [1, 1.3, 0.8, 1.2, 0.9, 1.4, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' }}
        />
        <motion.div
          className="absolute w-40 h-40 bg-white/10 rounded-full blur-3xl"
          animate={{
            top: ['60%', '20%', '75%', '10%', '50%', '85%', '60%'],
            right: ['10%', '70%', '30%', '80%', '15%', '55%', '10%'],
            scale: [1, 0.7, 1.4, 0.9, 1.2, 0.8, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' }}
        />
        <motion.div
          className="absolute w-36 h-36 bg-violet-500/25 rounded-full blur-3xl"
          animate={{
            top: ['40%', '85%', '15%', '65%', '5%', '50%', '40%'],
            left: ['20%', '75%', '40%', '5%', '85%', '30%', '20%'],
            scale: [1, 1.5, 0.7, 1.3, 0.85, 1.2, 1],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' }}
        />
        <motion.div
          className="absolute w-28 h-28 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            top: ['25%', '80%', '5%', '55%', '90%', '35%', '25%'],
            right: ['25%', '5%', '65%', '85%', '40%', '70%', '25%'],
            scale: [1, 0.9, 1.6, 0.75, 1.3, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' }}
        />
        <motion.div
          className="absolute w-24 h-24 bg-pink-500/25 rounded-full blur-3xl"
          animate={{
            top: ['75%', '10%', '60%', '30%', '85%', '45%', '75%'],
            left: ['50%', '15%', '80%', '35%', '65%', '5%', '50%'],
            scale: [1, 1.4, 0.8, 1.2, 0.7, 1.5, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' }}
        />

        {/* Logo + Name - Top Left */}
        <motion.div
          className="flex items-center gap-3 self-start"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center justify-center p-3 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20"
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
          <span className="text-xl font-bold text-white">Qui est dispo ?</span>
        </motion.div>

        {/* Hero Content - Center */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <motion.div
            className="max-w-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Big Slogan */}
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Retrouvez vos amis{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300">
                spontanément
              </span>
            </h1>

            {/* Explanatory Text */}
            <p className="text-lg lg:text-xl text-white/80 mb-8 leading-relaxed">
              Plus besoin de planifier. Voyez en un instant{' '}
              <span className="text-cyan-300 font-semibold">
                qui est disponible
              </span>{' '}
              autour de vous et{' '}
              <span className="text-pink-300 font-semibold">rejoignez-les</span>{' '}
              en temps réel.
            </p>
          </motion.div>
        </div>

        {/* Features Cards - Bottom */}
        <motion.div
          className="relative z-10 flex flex-col gap-3 w-full max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div className="p-3 bg-white/20 rounded-xl">
                <feature.icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-white">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ========== RIGHT PANEL - Login Form (full screen on mobile) ========== */}
      <motion.div
        className="w-full lg:w-1/2 min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center p-6 lg:p-8 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Floating Shapes - Mobile Only */}
        <motion.div
          className="absolute top-[10%] left-[5%] w-32 h-32 bg-[var(--md-sys-color-primary)]/20 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, 150, -30, 100, 0],
            scale: [1, 1.3, 0.8, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[60%] right-[10%] w-40 h-40 bg-[var(--md-sys-color-secondary)]/15 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, -80, 60, -40, 0],
            y: [0, -100, 50, -60, 0],
            scale: [1, 0.7, 1.4, 0.9, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] left-[20%] w-36 h-36 bg-violet-500/25 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, 120, -80, 60, 0],
            y: [0, 80, -60, 40, 0],
            scale: [1, 1.5, 0.7, 1.3, 1],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[25%] right-[25%] w-28 h-28 bg-blue-500/30 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, -60, 90, -30, 0],
            y: [0, 100, -40, 80, 0],
            scale: [1, 0.9, 1.6, 0.75, 1],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[75%] left-[50%] w-24 h-24 bg-pink-500/25 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, -70, 50, -90, 0],
            y: [0, -120, 60, -40, 0],
            scale: [1, 1.4, 0.8, 1.2, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[50%] left-[70%] w-32 h-32 bg-green-500/25 rounded-full blur-3xl lg:hidden pointer-events-none"
          animate={{
            x: [0, -90, 70, -50, 0],
            y: [0, 80, -90, 50, 0],
            scale: [1, 1.2, 0.9, 1.4, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Welcome Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Logo - Mobile Only */}
            <div className="lg:hidden mb-6">
              <motion.div
                className="inline-flex items-center justify-center p-4 bg-[var(--md-sys-color-primary-container)] rounded-2xl"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-10 h-10 text-[var(--md-sys-color-on-primary-container)]" />
                </motion.div>
              </motion.div>
            </div>
            {/* Sparkles icon - Desktop Only */}
            <motion.div
              className="hidden lg:inline-flex items-center justify-center p-4 bg-[var(--md-sys-color-primary-container)] rounded-2xl mb-6"
              whileHover={{ scale: 1.1 }}
            >
              <Sparkles className="w-8 h-8 text-[var(--md-sys-color-on-primary-container)]" />
            </motion.div>
            <h2 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)] mb-3">
              Bienvenue
            </h2>
            <p className="text-lg text-[var(--md-sys-color-on-surface-variant)]">
              Connectez-vous pour continuer
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-2xl text-sm flex items-start gap-3"
            >
              <div className="mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="whitespace-pre-line font-medium">{error}</div>
            </motion.div>
          )}

          {/* Login Card */}
          <motion.div
            className="bg-[var(--md-sys-color-surface-container)] rounded-[28px] p-8 shadow-[var(--md-sys-elevation-level2)] border border-[var(--md-sys-color-outline-variant)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Google Button */}
            <div className="space-y-4">
              {googleSignInReady ? (
                <GoogleSignInButton
                  onSignIn={handleGoogleCallback}
                  width="100%"
                  shape="pill"
                />
              ) : (
                <MD3Button
                  variant="filled"
                  icon={
                    <svg viewBox="0 0 24 24" width="22" height="22">
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
                  }
                  onClick={handleGoogleSignIn}
                  loading={loading}
                  fullWidth
                  size="large"
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md"
                >
                  Continuer avec Google
                </MD3Button>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--md-sys-color-outline-variant)]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[var(--md-sys-color-surface-container)] text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  Connexion sécurisée
                </span>
              </div>
            </div>

            {/* Info */}
            <p className="text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
              En continuant, vous acceptez nos{' '}
              <span className="text-[var(--md-sys-color-primary)] font-medium cursor-pointer hover:underline">
                conditions d'utilisation
              </span>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              © 2026 Qui Est Dispo. Tous droits réservés.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
