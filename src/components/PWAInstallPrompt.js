import { AnimatePresence, motion } from 'framer-motion';
import { Download, Plus, Share, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const PWAInstallPrompt = ({ darkMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceType, setDeviceType] = useState('unknown');

  // Détecter le type d'appareil et de navigateur
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isEdge = /edg/.test(userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;

    if (isStandalone) {
      return 'installed';
    } else if (isIOS && isSafari) {
      return 'ios-safari';
    } else if (isIOS) {
      return 'ios-other';
    } else if (isAndroid && isChrome) {
      return 'android-chrome';
    } else if (isAndroid) {
      return 'android-other';
    } else if (isChrome) {
      return 'desktop-chrome';
    } else if (isFirefox) {
      return 'desktop-firefox';
    } else if (isEdge) {
      return 'desktop-edge';
    } else {
      return 'desktop-other';
    }
  };

  useEffect(() => {
    const device = detectDevice();
    setDeviceType(device);

    // Si déjà installé, ne pas afficher le prompt
    if (device === 'installed') {
      return;
    }

    // Vérifier si le prompt a été récemment rejeté
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - dismissedTime < twentyFourHours) {
        return;
      }
    }

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = e => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Afficher le prompt après un délai
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      console.log('✅ PWA installée avec succès');
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-prompt-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Pour iOS et autres navigateurs, afficher le prompt après un délai
    if (
      device === 'ios-safari' ||
      device === 'desktop-firefox' ||
      device === 'desktop-edge'
    ) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Délai plus long pour iOS
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Installation native (Android/Chrome)
      setIsInstalling(true);

      try {
        deferredPrompt.prompt();
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
    } else {
      // Pour iOS et autres, ne pas fermer le prompt immédiatement
      // L'utilisateur doit suivre les instructions manuellement
      console.log("Instructions d'installation affichées");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Réafficher le prompt dans 24h
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios-safari':
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: "Ajoutez l'app à votre écran d'accueil",
          instructions: [
            { icon: Share, text: 'Appuyez sur le bouton Partager' },
            { icon: Plus, text: 'Sélectionnez "Sur l\'écran d\'accueil"' },
            { icon: Download, text: 'Appuyez sur "Ajouter"' },
          ],
          buttonText: 'Voir les instructions',
          showNativeButton: false,
        };

      case 'ios-other':
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: 'Ouvrez dans Safari pour installer',
          instructions: [
            { icon: Smartphone, text: 'Ouvrez cette page dans Safari' },
            { icon: Share, text: 'Appuyez sur Partager' },
            { icon: Plus, text: "Ajoutez à l'écran d'accueil" },
          ],
          buttonText: 'Ouvrir dans Safari',
          showNativeButton: false,
        };

      case 'android-chrome':
      case 'desktop-chrome':
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: 'Accès rapide depuis votre appareil',
          instructions: [],
          buttonText: isInstalling ? 'Installation...' : 'Installer',
          showNativeButton: true,
        };

      case 'desktop-firefox':
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: 'Ajoutez un raccourci sur votre bureau',
          instructions: [
            { icon: Download, text: 'Menu → Installer cette page' },
            { icon: Plus, text: 'Ou ajoutez aux favoris' },
          ],
          buttonText: 'Voir les instructions',
          showNativeButton: false,
        };

      case 'desktop-edge':
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: "Installez l'application",
          instructions: [
            {
              icon: Download,
              text: 'Menu (⋯) → Applications → Installer cette page',
            },
          ],
          buttonText: 'Voir les instructions',
          showNativeButton: false,
        };

      default:
        return {
          title: 'Installer Qui est dispo ?',
          subtitle: 'Ajoutez un raccourci pour un accès rapide',
          instructions: [
            { icon: Download, text: 'Ajoutez cette page aux favoris' },
            {
              icon: Smartphone,
              text: 'Ou créez un raccourci sur votre bureau',
            },
          ],
          buttonText: 'Compris',
          showNativeButton: false,
        };
    }
  };

  if (!showPrompt || deviceType === 'installed') return null;

  const installInfo = getInstallInstructions();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-xl shadow-lg p-4 max-w-sm mx-auto`}
      >
        <div className="flex items-start space-x-3">
          {/* Logo de l'app */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">QD</span>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {installInfo.title}
                </h3>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}
                >
                  {installInfo.subtitle}
                </p>

                {/* Instructions spécifiques */}
                {installInfo.instructions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {installInfo.instructions.map((instruction, index) => {
                      const Icon = instruction.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Icon
                            size={14}
                            className={
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }
                          />
                          <span
                            className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            {instruction.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bouton fermer */}
              <button
                onClick={handleDismiss}
                className={`p-1.5 rounded-lg transition-colors ml-2 ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-2 mt-4">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <Download size={16} />
                <span>{installInfo.buttonText}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
