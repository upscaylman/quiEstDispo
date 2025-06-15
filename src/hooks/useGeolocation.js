import { useCallback, useEffect, useRef, useState } from 'react';
import { useGPSNotifications } from './useGPSNotifications';

// Fonction pour ouvrir les paramètres de localisation selon la plateforme
const openDeviceLocationSettings = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  try {
    if (userAgent.includes('android')) {
      // Android - Ouvrir les paramètres de localisation
      window.open(
        'android-app://com.android.settings/.LocationSettings',
        '_blank'
      );
      // Fallback pour les navigateurs qui ne supportent pas android-app://
      setTimeout(() => {
        window.open(
          'https://support.google.com/android/answer/3467281',
          '_blank'
        );
      }, 1000);
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iOS - Ouvrir les paramètres de confidentialité
      window.open('App-prefs:Privacy&path=LOCATION', '_blank');
      // Fallback pour les versions iOS récentes
      setTimeout(() => {
        window.open('https://support.apple.com/fr-fr/102283', '_blank');
      }, 1000);
    } else if (userAgent.includes('windows')) {
      // Windows - Paramètres de confidentialité
      window.open('ms-settings:privacy-location', '_blank');
      // Fallback
      setTimeout(() => {
        window.open(
          'https://support.microsoft.com/fr-fr/windows/localisation-et-confidentialit%C3%A9-dans-windows-31a7f3b5-1396-88ae-5bb5-bb4d68ba4e36',
          '_blank'
        );
      }, 1000);
    } else if (userAgent.includes('mac')) {
      // macOS - Préférences système
      window.open(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices',
        '_blank'
      );
      // Fallback
      setTimeout(() => {
        window.open(
          'https://support.apple.com/fr-fr/guide/mac-help/mh35873/mac',
          '_blank'
        );
      }, 1000);
    } else {
      // Navigateur desktop générique - Guide d'aide
      window.open('https://support.google.com/chrome/answer/142065', '_blank');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur ouverture paramètres:', error);
    // Fallback ultime - guide général
    window.open('https://support.google.com/chrome/answer/142065', '_blank');
  }
};

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook pour les notifications GPS
  const { notifyGPSEnabled, notifyGPSDisabled, notifyGPSUpdating } =
    useGPSNotifications();

  // Utiliser useRef pour éviter les re-renders infinis
  const isRequesting = useRef(false);
  const lastLocationTime = useRef(0);
  const lastErrorType = useRef(null);

  // Fonction principale de géolocalisation
  const requestGeolocation = useCallback(() => {
    if (isRequesting.current) {
      // eslint-disable-next-line no-console
      console.log('⏳ Geolocation already in progress...');
      return;
    }

    // eslint-disable-next-line no-console
    console.log('🌍 Requesting geolocation...');

    isRequesting.current = true;
    setLoading(true);
    setError(null);

    // Position par défaut à Paris
    const defaultLocation = {
      lat: 48.8566,
      lng: 2.3522,
      accuracy: null,
      timestamp: Date.now(),
      isDefault: true,
    };

    // Si géolocalisation non supportée
    if (!navigator.geolocation) {
      // eslint-disable-next-line no-console
      console.log('📍 Geolocation not supported, using Paris');
      setLocation(defaultLocation);
      setError('Géolocalisation non supportée');
      setLoading(false);
      isRequesting.current = false;
      return;
    }

    const handleSuccess = position => {
      try {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          isDefault: false,
        };

        // eslint-disable-next-line no-console
        console.log('✅ Location obtained:', newLocation);

        // Notifier si c'est la première position ou si on récupère une position après une erreur
        const isFirstLocation = !location;
        const wasError = error !== null;

        if (isFirstLocation || wasError) {
          notifyGPSEnabled();
        }

        setLocation(newLocation);
        setError(null);
        lastLocationTime.current = Date.now();
        lastErrorType.current = null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error processing location:', err);
        setLocation(defaultLocation);
        setError('Erreur de traitement de la position');
      } finally {
        setLoading(false);
        isRequesting.current = false;
      }
    };

    const handleError = error => {
      let errorMessage = "Impossible d'obtenir la position";

      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Accès à la localisation refusé';
          // Notifier seulement si c'est un changement d'état
          if (lastErrorType.current !== 'denied') {
            notifyGPSDisabled();
            lastErrorType.current = 'denied';
          }
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Position indisponible';
          lastErrorType.current = 'unavailable';
          break;
        case 3: // TIMEOUT
          errorMessage = "Délai d'attente dépassé";
          lastErrorType.current = 'timeout';
          break;
        default:
          errorMessage = 'Erreur de géolocalisation';
          lastErrorType.current = 'unknown';
          break;
      }

      // eslint-disable-next-line no-console
      console.warn('⚠️ Geolocation error, using Paris:', errorMessage);

      setError(errorMessage);
      setLocation(defaultLocation);
      setLoading(false);
      isRequesting.current = false;
    };

    // Options de géolocalisation optimisées pour la précision maximale
    const options = {
      enableHighAccuracy: true, // Activer GPS + réseau + WiFi
      timeout: 15000, // 15 secondes pour GPS plus lent
      maximumAge: 30000, // Cache de 30 secondes seulement pour position récente
    };

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error requesting geolocation:', err);
      handleError({ code: 999, message: "Erreur d'initialisation" });
    }
  }, [location, error, notifyGPSEnabled, notifyGPSDisabled]);

  // Première demande au montage du composant + watch position continue
  useEffect(() => {
    requestGeolocation();

    // Suivi de position en temps réel (watchPosition)
    let watchId = null;
    let permissionCheckInterval = null;
    let visibilityCheckTimeout = null;

    if (navigator.geolocation) {
      const watchOptions = {
        enableHighAccuracy: true,
        timeout: 30000, // Plus de temps pour watchPosition
        maximumAge: 10000, // Position récente de 10 secondes max
      };

      const handleWatchSuccess = position => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          isDefault: false,
        };

        console.log('📍 Position mise à jour (watchPosition):', newLocation);

        // Notifier la mise à jour seulement si c'est significatif
        const timeSinceLastUpdate = Date.now() - lastLocationTime.current;
        if (timeSinceLastUpdate > 60000) {
          // Plus d'1 minute
          notifyGPSUpdating();
        }

        setLocation(newLocation);
        setError(null);
        lastLocationTime.current = Date.now();
        lastErrorType.current = null;
      };

      const handleWatchError = error => {
        console.warn('⚠️ Erreur watchPosition:', error.message);

        // Si c'est une erreur de permission, essayer de détecter un changement
        if (error.code === 1) {
          if (lastErrorType.current !== 'denied') {
            notifyGPSDisabled();
            lastErrorType.current = 'denied';
          }
          setError('Accès à la localisation refusé');
        } else if (error.code === 2) {
          setError('Position indisponible');
          lastErrorType.current = 'unavailable';
        }
      };

      // Démarrer le suivi après 2 secondes pour laisser le temps à getCurrentPosition
      setTimeout(() => {
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            handleWatchSuccess,
            handleWatchError,
            watchOptions
          );
          console.log('🔄 WatchPosition démarré (ID:', watchId, ')');
        }
      }, 2000);

      // Surveillance des permissions avec l'API Permissions (si disponible)
      if ('permissions' in navigator) {
        const checkPermissions = async () => {
          try {
            const permission = await navigator.permissions.query({
              name: 'geolocation',
            });

            // Surveiller les changements de permission
            permission.addEventListener('change', () => {
              console.log('🔄 Permission GPS changée:', permission.state);
              if (permission.state === 'granted') {
                console.log('✅ GPS autorisé - Relance géolocalisation');
                // Petit délai pour laisser le GPS s'activer
                setTimeout(() => {
                  requestGeolocation();
                }, 500);
              } else if (permission.state === 'denied') {
                console.log('❌ GPS refusé');
                notifyGPSDisabled();
                setError('Accès à la localisation refusé');
              }
            });
          } catch (err) {
            console.log('⚠️ API Permissions non disponible:', err.message);
          }
        };

        checkPermissions();
      }

      // Surveillance périodique de l'état GPS (fallback)
      permissionCheckInterval = setInterval(() => {
        // Test silencieux pour détecter les changements de GPS
        navigator.geolocation.getCurrentPosition(
          position => {
            // Si on récupère une position et qu'on avait une erreur, réessayer
            if (
              error &&
              (error.includes('refusé') || error.includes('indisponible'))
            ) {
              console.log('🔄 GPS semble réactivé - Relance géolocalisation');
              requestGeolocation();
            }
          },
          err => {
            // Erreur silencieuse, on ne fait rien
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      }, 15000); // Vérifier toutes les 15 secondes
    }

    // Surveillance de la visibilité de l'application (en dehors du if navigator.geolocation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 App visible - Vérification GPS');
        // Délai pour laisser le temps à l'utilisateur d'activer le GPS
        visibilityCheckTimeout = setTimeout(() => {
          requestGeolocation();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Nettoyage à la destruction du composant
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log('⏹️ WatchPosition arrêté');
      }
      if (permissionCheckInterval) {
        clearInterval(permissionCheckInterval);
        console.log('⏹️ Surveillance permissions arrêtée');
      }
      if (visibilityCheckTimeout) {
        clearTimeout(visibilityCheckTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [requestGeolocation, error, notifyGPSDisabled, notifyGPSUpdating]);

  // Fonction pour retry (utilise la même fonction que l'initialisation)
  const retryGeolocation = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🔄 Retrying geolocation...');
    requestGeolocation();
  }, [requestGeolocation]);

  // Fonction pour demander explicitement la permission et relancer la géolocalisation
  const requestLocationPermission = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🚨 Forcing location permission request...');

    // Forcer une nouvelle demande de permission en appelant directement getCurrentPosition
    // Cela déclenchera TOUJOURS la popup native du navigateur/appareil
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée sur cet appareil');
      return;
    }

    // Ne pas toucher à loading pour éviter l'effet de bord
    // setLoading(true); // Supprimé
    // setError(null); // Gardé pour ne pas effacer l'erreur avant le résultat

    const handleSuccess = position => {
      try {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          isDefault: false,
        };

        // eslint-disable-next-line no-console
        console.log('✅ Permission accordée, location obtenue:', newLocation);

        // Notifier que le GPS est maintenant activé
        notifyGPSEnabled();

        setLocation(newLocation);
        setError(null);
        lastLocationTime.current = Date.now();
        lastErrorType.current = null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error processing location:', err);
        setError('Erreur de traitement de la position');
      } finally {
        setLoading(false);
      }
    };

    const handleError = error => {
      let errorMessage;

      switch (error.code) {
        case 1: // PERMISSION_DENIED
          // Rediriger vers les paramètres système de l'appareil
          setTimeout(() => {
            openDeviceLocationSettings();
          }, 500);
          errorMessage = 'Redirection vers les paramètres de localisation...';
          notifyGPSDisabled();
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage =
            'Position indisponible. Vérifiez votre connexion et les paramètres de localisation.';
          break;
        case 3: // TIMEOUT
          errorMessage = "Délai d'attente dépassé. Réessayez.";
          break;
        default:
          errorMessage = 'Erreur de géolocalisation inconnue.';
          break;
      }

      // eslint-disable-next-line no-console
      console.warn('⚠️ Permission error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    };

    // Options pour forcer une demande de haute précision (popup garantie)
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // Pas de cache - force une nouvelle demande
    };

    // Appel direct pour déclencher la popup native avec un petit délai
    setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    }, 100);
  }, [notifyGPSEnabled, notifyGPSDisabled]);

  return {
    location,
    error,
    loading,
    retryGeolocation,
    requestLocationPermission,
  };
};

// Fonction utilitaire pour calculer la distance entre deux points
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error calculating distance:', error);
    return 0;
  }
};

// Fonction pour formater la distance
export const formatDistance = distance => {
  try {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting distance:', error);
    return 'Distance inconnue';
  }
};

// Fonction pour obtenir l'adresse approximative (simulation)
export const getApproximateAddress = (lat, lng) => {
  try {
    // En production, utiliser une API de reverse geocoding comme Google Maps
    const parisLocations = [
      'République',
      'Le Marais',
      'Bastille',
      'Montmartre',
      'Latin Quarter',
      'Saint-Germain',
      'Champs-Élysées',
      'Louvre',
      'Trocadéro',
      'Belleville',
      'Pigalle',
      'Oberkampf',
      'Canal Saint-Martin',
      'Père Lachaise',
      'Nation',
    ];

    return parisLocations[Math.floor(Math.random() * parisLocations.length)];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting approximate address:', error);
    return 'Paris';
  }
};

export default useGeolocation;
