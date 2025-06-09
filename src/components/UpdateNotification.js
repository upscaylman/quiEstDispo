import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Vérifier si on est dans un navigateur et que les service workers sont supportés
    if ('serviceWorker' in navigator) {
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
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // Nouvelle version disponible
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          });

          // Vérifier manuellement les mises à jour
          registration.update();
        } catch (error) {
          console.warn(
            'Erreur lors de la vérification des mises à jour:',
            error
          );
        }
      };

      // Vérifier immédiatement
      checkForUpdates();

      // Vérifier périodiquement (toutes les 2 minutes)
      const interval = setInterval(checkForUpdates, 2 * 60 * 1000);

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
          setShowUpdate(true);
        }
      });

      return () => clearInterval(interval);
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
