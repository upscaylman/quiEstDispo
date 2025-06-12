import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const PWAInstallPrompt = ({ darkMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = e => {
      // Empêcher le prompt automatique
      e.preventDefault();

      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e);

      // Vérifier si l'app n'est pas déjà installée
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        // Attendre un peu avant d'afficher le prompt
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Afficher après 3 secondes
      }
    };

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      console.log('✅ PWA installée avec succès');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Afficher le prompt d'installation
      deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log("✅ Utilisateur a accepté l'installation");
      } else {
        console.log("❌ Utilisateur a refusé l'installation");
      }
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
    } finally {
      setIsInstalling(false);
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Réafficher le prompt dans 24h
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Vérifier si le prompt a été récemment rejeté
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - dismissedTime < twentyFourHours) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-xl shadow-lg p-4`}
      >
        <div className="flex items-center space-x-3">
          {/* Logo de l'app */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">QD</span>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={`font-semibold text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Installer Qui est dispo ?
                </h3>
                <p
                  className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  } truncate`}
                >
                  qui-est-dispo.vercel.app
                </p>
              </div>

              {/* Boutons */}
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={handleDismiss}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X size={16} />
                </button>

                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
                >
                  <Download size={16} />
                  <span>{isInstalling ? 'Installation...' : 'Installer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
