import { useCallback, useState } from 'react';

export const useGPSNotifications = () => {
  const [gpsStatus, setGpsStatus] = useState(null);

  // Fonction pour afficher une notification GPS
  const showGPSNotification = useCallback((type, message = null) => {
    const notification = {
      type,
      message,
      timestamp: Date.now(),
    };

    console.log('🔔 Notification GPS:', notification);
    setGpsStatus(notification);

    // Auto-clear après 5 secondes
    setTimeout(() => {
      setGpsStatus(null);
    }, 5000);
  }, []);

  // Fonction pour notifier quand le GPS est activé
  const notifyGPSEnabled = useCallback(() => {
    showGPSNotification('gps_enabled');
  }, [showGPSNotification]);

  // Fonction pour notifier quand le GPS est désactivé
  const notifyGPSDisabled = useCallback(() => {
    showGPSNotification('gps_disabled');
  }, [showGPSNotification]);

  // Fonction pour notifier quand le GPS est en cours de mise à jour
  const notifyGPSUpdating = useCallback(() => {
    showGPSNotification('gps_updating');
  }, [showGPSNotification]);

  return {
    gpsStatus,
    notifyGPSEnabled,
    notifyGPSDisabled,
    notifyGPSUpdating,
    showGPSNotification,
  };
};
