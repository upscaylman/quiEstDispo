import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Vérifier si on est dans un navigateur et que les service workers sont supportés
    if ('serviceWorker' in navigator) {
      let currentVersion = null;

      // Fonction pour vérifier les mises à jour
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;

          // Vérifier s'il y a un service worker en attente
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
            return;
          }

          // Écouter les nouveaux service workers
          registration.addEventListener('updatefound', () => {
            console.log('🔍 Nouvelle version détectée...');
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('✅ Nouvelle version prête à installer');
                // Nouvelle version disponible
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          });

          // Vérifier manuellement les mises à jour (important pour mobile)
          registration.update().then(() => {
            console.log('🔄 Vérification de mise à jour effectuée');
          });

          // Demander la version actuelle au service worker
          if (registration.active) {
            registration.active.postMessage({ type: 'GET_VERSION' });
          }
        } catch (error) {
          console.warn(
            'Erreur lors de la vérification des mises à jour:',
            error
          );
        }
      };

      // Écouter les messages du service worker
      const handleMessage = event => {
        if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
          console.log(
            '📢 Service Worker demande une vérification de mise à jour'
          );
          checkForUpdates();
        }

        if (event.data && event.data.type === 'CURRENT_VERSION') {
          const swVersion = event.data.version;
          if (currentVersion && currentVersion !== swVersion) {
            console.log(
              `🆕 Nouvelle version détectée: ${currentVersion} → ${swVersion}`
            );
            setShowUpdate(true);
          }
          currentVersion = swVersion;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Vérifier immédiatement
      checkForUpdates();

      // Vérifier périodiquement (plus fréquent sur mobile)
      const interval = setInterval(checkForUpdates, 60 * 1000); // Toutes les minutes

      // Vérifier aussi lors du focus de la fenêtre (mobile)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log(
            '📱 Application revenue au premier plan, vérification...'
          );
          setTimeout(checkForUpdates, 1000);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      };
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Dire au service worker en attente de prendre le contrôle
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Recharger la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Fallback: forcer le rechargement
      window.location.reload();
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Réafficher dans 5 minutes
    setTimeout(
      () => {
        if (waitingWorker) {
          setShowUpdate(true);
        }
      },
      5 * 60 * 1000
    );
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-4 right-4 z-[9999] mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <RefreshCw size={20} className="text-white animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Nouvelle version !</h4>
                <p className="text-xs text-blue-100">
                  Améliorations et corrections disponibles
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpdate}
                className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
              >
                Mettre à jour
              </motion.button>
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                title="Rappeler plus tard"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
