import { useCallback, useEffect, useRef, useState } from 'react';

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

  // Hook pour les notifications GPS (temporairement désactivé)
  // const { notifyGPSEnabled, notifyGPSDisabled, notifyGPSUpdating } = useGPSNotifications();
  const notifyGPSEnabled = () => {};
  const notifyGPSDisabled = () => {};
  const notifyGPSUpdating = () => {};

  // Utiliser useRef pour éviter les re-renders infinis
  const isRequesting = useRef(false);
  const lastLocationTime = useRef(0);
  const lastErrorType = useRef(null);
  const stableLocationRef = useRef(null);
  const requestCount = useRef(0);
  const lastRequestTime = useRef(0); // 🔥 NOUVEAU: Timestamp de la dernière requête
  const isStabilizing = useRef(true); // Nouveau: éviter le clignotement initial
  const lastTimeoutLog = useRef(0); // 🔥 NOUVEAU: Timestamp du dernier log de timeout

  // 🔥 CORRECTION: Ref stable pour requestGeolocation
  const requestGeolocationRef = useRef(() => {});

  // Position par défaut à Paris
  const defaultLocation = {
    lat: 48.8566,
    lng: 2.3522,
    accuracy: null,
    timestamp: Date.now(),
    isDefault: true,
  };

  // Fonction principale de géolocalisation
  const requestGeolocation = useCallback(() => {
    if (isRequesting.current) {
      console.log('⏳ Geolocation already in progress...');
      return;
    }

    // Limitation basée sur le temps
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    const MIN_INTERVAL = 10000; // 10 secondes minimum entre les requêtes

    if (timeSinceLastRequest < MIN_INTERVAL) {
      console.warn(
        `⚠️ Requête GPS trop récente, attendre ${Math.ceil((MIN_INTERVAL - timeSinceLastRequest) / 1000)}s`
      );
      return;
    }

    // Reset automatique du compteur après 2 minutes
    if (timeSinceLastRequest > 120000) {
      requestCount.current = 0;
    }

    // Limiter le nombre total de requêtes
    requestCount.current += 1;
    if (requestCount.current > 3) {
      console.warn(
        '⚠️ Trop de requêtes GPS, limitation temporaire (max 3 par 2min)'
      );
      return;
    }

    lastRequestTime.current = now;
    console.log('🌍 Requesting geolocation... (#' + requestCount.current + ')');

    isRequesting.current = true;
    setLoading(true);

    // Si géolocalisation non supportée
    if (!navigator.geolocation) {
      console.log('📍 Geolocation not supported, using Paris');
      setLocation(defaultLocation);
      stableLocationRef.current = defaultLocation;
      setError('Géolocalisation non supportée');
      setLoading(false);
      isRequesting.current = false;
      isStabilizing.current = false;
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

        console.log('✅ Location obtained:', newLocation);

        const isFirstLocation =
          !stableLocationRef.current || stableLocationRef.current.isDefault;
        // 🔥 CORRECTION: Accéder à error via ref pour éviter dépendance
        const wasError = stableLocationRef.current?.error !== null;

        if ((isFirstLocation || wasError) && !isStabilizing.current) {
          notifyGPSEnabled();
        }

        setLocation(newLocation);
        stableLocationRef.current = newLocation;
        setError(null);
        lastLocationTime.current = Date.now();
        lastErrorType.current = null;
      } catch (err) {
        console.error('Error processing location:', err);
        setLocation(defaultLocation);
        stableLocationRef.current = defaultLocation;
        setError('Erreur de traitement de la position');
      } finally {
        setLoading(false);
        isRequesting.current = false;
        isStabilizing.current = false;
      }
    };

    const handleError = error => {
      let errorMessage = "Impossible d'obtenir la position";

      switch (error.code) {
        case 1:
          errorMessage = 'Accès à la localisation refusé';
          if (lastErrorType.current !== 'denied' && !isStabilizing.current) {
            notifyGPSDisabled();
          }
          lastErrorType.current = 'denied';
          break;
        case 2:
          errorMessage = 'Position indisponible';
          lastErrorType.current = 'unavailable';
          break;
        case 3:
          errorMessage = "Délai d'attente dépassé";
          lastErrorType.current = 'timeout';
          break;
        default:
          errorMessage = 'Erreur de géolocalisation';
          lastErrorType.current = 'unknown';
          break;
      }

      console.warn('⚠️ Geolocation error, using Paris:', errorMessage);

      setError(errorMessage);
      setLocation(defaultLocation);
      stableLocationRef.current = defaultLocation;
      setLoading(false);
      isRequesting.current = false;
      isStabilizing.current = false;
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    };

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (err) {
      console.error('Error requesting geolocation:', err);
      handleError({ code: 999, message: "Erreur d'initialisation" });
    }
  }, [notifyGPSEnabled, notifyGPSDisabled]); // 🔥 GARDER seulement les fonctions stables

  // 🔥 CORRECTION: Mettre à jour la ref à chaque fois
  requestGeolocationRef.current = requestGeolocation;

  // Première demande au montage du composant + watch position continue
  useEffect(() => {
    // 🔥 CORRECTION: Version locale de requestGeolocation pour éviter dépendances
    const localRequestGeolocation = () => {
      if (isRequesting.current) {
        console.log('⏳ Geolocation already in progress...');
        return;
      }

      // Limitation basée sur le temps
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      const MIN_INTERVAL = 10000; // 10 secondes minimum entre les requêtes

      if (timeSinceLastRequest < MIN_INTERVAL) {
        console.warn(
          `⚠️ Requête GPS trop récente, attendre ${Math.ceil((MIN_INTERVAL - timeSinceLastRequest) / 1000)}s`
        );
        return;
      }

      // Reset automatique du compteur après 2 minutes
      if (timeSinceLastRequest > 120000) {
        requestCount.current = 0;
      }

      // Limiter le nombre total de requêtes
      requestCount.current += 1;
      if (requestCount.current > 3) {
        console.warn(
          '⚠️ Trop de requêtes GPS, limitation temporaire (max 3 par 2min)'
        );
        return;
      }

      lastRequestTime.current = now;
      console.log(
        '🌍 Requesting geolocation... (#' + requestCount.current + ')'
      );

      isRequesting.current = true;
      setLoading(true);

      // Si géolocalisation non supportée
      if (!navigator.geolocation) {
        console.log('📍 Geolocation not supported, using Paris');
        setLocation(defaultLocation);
        stableLocationRef.current = defaultLocation;
        setError('Géolocalisation non supportée');
        setLoading(false);
        isRequesting.current = false;
        isStabilizing.current = false;
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

          console.log('✅ Location obtained:', newLocation);

          const isFirstLocation =
            !stableLocationRef.current || stableLocationRef.current.isDefault;
          const wasError = error !== null;

          if ((isFirstLocation || wasError) && !isStabilizing.current) {
            notifyGPSEnabled();
          }

          setLocation(newLocation);
          stableLocationRef.current = newLocation;
          setError(null);
          lastLocationTime.current = Date.now();
          lastErrorType.current = null;
        } catch (err) {
          console.error('Error processing location:', err);
          setLocation(defaultLocation);
          stableLocationRef.current = defaultLocation;
          setError('Erreur de traitement de la position');
        } finally {
          setLoading(false);
          isRequesting.current = false;
          isStabilizing.current = false;
        }
      };

      const handleError = error => {
        let errorMessage = "Impossible d'obtenir la position";

        // 🔧 DÉVELOPPEMENT WINDOWS: Fallback automatique vers Paris après timeout
        const isDev = process.env.NODE_ENV === 'development';
        const isWindows = navigator.userAgent.includes('Windows');

        switch (error.code) {
          case 1:
            errorMessage = 'Accès à la localisation refusé';
            if (lastErrorType.current !== 'denied' && !isStabilizing.current) {
              notifyGPSDisabled();
            }
            lastErrorType.current = 'denied';
            break;
          case 2:
            errorMessage = 'Position indisponible';
            lastErrorType.current = 'unavailable';
            break;
          case 3:
            errorMessage = "Délai d'attente dépassé";
            lastErrorType.current = 'timeout';
            // 🔧 DÉVELOPPEMENT WINDOWS: Fallback silencieux vers Paris
            if (isDev && isWindows) {
              console.warn(
                '⚠️ Timeout GPS initial sur Windows - Fallback automatique vers Paris'
              );
              const parisLocation = {
                lat: 48.8566,
                lng: 2.3522,
                accuracy: 1000,
                timestamp: Date.now(),
                isDefault: true,
              };
              setLocation(parisLocation);
              stableLocationRef.current = parisLocation;
              setError(null);
              lastLocationTime.current = Date.now();
              lastErrorType.current = null;
              setLoading(false);
              isRequesting.current = false;
              isStabilizing.current = false;
              return; // Éviter le fallback vers Paris normal
            }
            break;
          default:
            errorMessage = 'Erreur de géolocalisation';
            lastErrorType.current = 'unknown';
            break;
        }

        console.warn('⚠️ Geolocation error, using Paris:', errorMessage);

        setError(errorMessage);
        setLocation(defaultLocation);
        stableLocationRef.current = defaultLocation;
        setLoading(false);
        isRequesting.current = false;
        isStabilizing.current = false;
      };

      // 🔧 DÉVELOPPEMENT WINDOWS: Configuration adaptée pour éviter les timeouts
      const isDev = process.env.NODE_ENV === 'development';
      const isWindows = navigator.userAgent.includes('Windows');

      const options = {
        enableHighAccuracy: isDev && isWindows ? false : true, // Moins strict en dev Windows
        timeout: isDev && isWindows ? 8000 : 15000, // 8s timeout en dev Windows
        maximumAge: isDev && isWindows ? 300000 : 30000, // 5 min cache en dev Windows
      };

      console.log(
        `🔧 GPS Initial Config - Dev: ${isDev}, Windows: ${isWindows}`,
        options
      );

      try {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleError,
          options
        );
      } catch (err) {
        console.error('Error requesting geolocation:', err);
        handleError({ code: 999, message: "Erreur d'initialisation" });
      }
    };

    // Période de stabilisation initiale de 3 secondes
    setTimeout(() => {
      isStabilizing.current = false;
      console.log('🎯 Période de stabilisation terminée');
    }, 3000);

    requestGeolocationRef.current();

    // Suivi de position en temps réel (watchPosition)
    let watchId = null;
    let permissionCheckInterval = null;
    let visibilityCheckTimeout = null;

    if (navigator.geolocation) {
      // 🔧 DÉVELOPPEMENT WINDOWS: Configuration adaptée pour éviter les timeouts
      const isDev = process.env.NODE_ENV === 'development';
      const isWindows = navigator.userAgent.includes('Windows');

      const watchOptions = {
        enableHighAccuracy: isDev && isWindows ? false : true, // Moins strict en dev Windows
        timeout: isDev && isWindows ? 10000 : 30000, // 10s timeout en dev Windows
        maximumAge: isDev && isWindows ? 300000 : 60000, // 5 min cache en dev Windows
      };

      console.log(
        `🔧 GPS Config - Dev: ${isDev}, Windows: ${isWindows}`,
        watchOptions
      );

      const handleWatchSuccess = position => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          isDefault: false,
        };

        // 🔥 NOUVELLE LOGIQUE: Log seulement si mouvement significatif (>10m) ou temps écoulé (>120s)
        const timeSinceLastLog = Date.now() - lastLocationTime.current;
        const hasSignificantMovement =
          lastLocationTime.current > 0 &&
          stableLocationRef.current &&
          calculateDistance(
            stableLocationRef.current.lat,
            stableLocationRef.current.lng,
            newLocation.lat,
            newLocation.lng
          ) > 0.01; // 10 mètres minimum

        if (timeSinceLastLog > 120000 || hasSignificantMovement) {
          console.log('📍 Position mise à jour (watchPosition):', newLocation);
        }

        // Notifier la mise à jour seulement si c'est significatif et qu'on n'est plus en stabilisation
        const timeSinceLastUpdate = Date.now() - lastLocationTime.current;
        if (timeSinceLastUpdate > 300000 && !isStabilizing.current) {
          // 🔥 NOUVEAU: 5 minutes au lieu de 1 minute
          notifyGPSUpdating();
        }

        setLocation(newLocation);
        stableLocationRef.current = newLocation;
        setError(null);
        lastLocationTime.current = Date.now();
        lastErrorType.current = null;
      };

      const handleWatchError = error => {
        // 🔧 DÉVELOPPEMENT WINDOWS: Fallback automatique vers Paris après timeout ou position indisponible
        if (error.code === 3 || error.code === 2) {
          // TIMEOUT ou POSITION_UNAVAILABLE
          const now = Date.now();

          // En développement Windows, fallback automatique vers Paris
          if (isDev && isWindows) {
            // Log seulement une fois
            if (
              !lastTimeoutLog.current ||
              now - lastTimeoutLog.current > 60000
            ) {
              console.warn(
                '⚠️ GPS indisponible sur Windows dev - Utilisation Paris par défaut'
              );
              console.log(
                '💡 Utilisez window.testLocations.paris() pour tester différents lieux'
              );
              lastTimeoutLog.current = now;
            }

            // Définir Paris si pas de location stable
            if (
              !stableLocationRef.current ||
              stableLocationRef.current.isDefault
            ) {
              const parisLocation = {
                lat: 48.8566,
                lng: 2.3522,
                accuracy: 1000,
                timestamp: Date.now(),
                isDefault: true,
              };
              setLocation(parisLocation);
              stableLocationRef.current = parisLocation;
              setError(null);
              lastLocationTime.current = Date.now();
              lastErrorType.current = null;
            }
            return; // Éviter le spam de logs
          }

          // Log timeout seulement toutes les 5 minutes pour éviter le spam
          if (
            !lastTimeoutLog.current ||
            now - lastTimeoutLog.current > 300000
          ) {
            console.warn(
              '⚠️ Timeout GPS watchPosition (normal sur certains appareils)'
            );
            lastTimeoutLog.current = now;
          }
          // Ne pas définir d'erreur pour les timeouts, ce n'est pas critique
          return;
        }

        // 🔧 Limiter les logs d'erreur watchPosition (1 seul par type d'erreur)
        if (lastErrorType.current !== `watch_${error.code}`) {
          console.warn(
            '⚠️ Erreur watchPosition:',
            error.message || `Code ${error.code}`
          );
          lastErrorType.current = `watch_${error.code}`;
        }

        // Si c'est une erreur de permission, essayer de détecter un changement
        if (error.code === 1) {
          if (lastErrorType.current !== 'denied' && !isStabilizing.current) {
            notifyGPSDisabled();
          }
          lastErrorType.current = 'denied';
          setError('Accès à la localisation refusé');
        }
      };

      // Démarrer le suivi après 3 secondes pour laisser le temps à la stabilisation
      setTimeout(() => {
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            handleWatchSuccess,
            handleWatchError,
            watchOptions
          );
          console.log('🔄 WatchPosition démarré (ID:', watchId, ')');
        }
      }, 3000);

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
                  requestGeolocationRef.current();
                }, 800);
              } else if (permission.state === 'denied') {
                console.log('❌ GPS refusé');
                if (!isStabilizing.current) {
                  notifyGPSDisabled();
                }
                setError('Accès à la localisation refusé');
              }
            });
          } catch (err) {
            console.log('⚠️ API Permissions non disponible:', err.message);
          }
        };

        checkPermissions();
      }

      // Surveillance périodique de l'état GPS (fallback) - après stabilisation
      setTimeout(() => {
        permissionCheckInterval = setInterval(() => {
          // 🔥 NOUVELLE LOGIQUE: Test silencieux SEULEMENT si problème ET si dernière vérification > 5 minutes
          if (!isStabilizing.current) {
            const currentHasError =
              lastErrorType.current === 'denied' ||
              lastErrorType.current === 'unavailable';
            const currentIsDefault =
              stableLocationRef.current?.isDefault === true;
            const timeSinceLastCheck = Date.now() - lastRequestTime.current;

            // Vérifier seulement si problème ET pas de check récent (5 min minimum)
            if (
              (currentHasError || currentIsDefault) &&
              timeSinceLastCheck > 300000
            ) {
              console.log(
                '🔄 Vérification GPS périodique (5min+) - Test silencieux'
              );
              requestGeolocationRef.current();
            }
          }
        }, 120000); // 🔥 NOUVEAU: Vérifier toutes les 2 MINUTES au lieu de 12 secondes
      }, 10000); // 🔥 NOUVEAU: Commencer après 10 secondes au lieu de 5
    }

    // Surveillance de la visibilité de l'application
    const handleVisibilityChange = () => {
      if (!document.hidden && !isStabilizing.current) {
        const hasError =
          lastErrorType.current === 'denied' ||
          lastErrorType.current === 'unavailable';
        const hasDefaultLocation =
          stableLocationRef.current?.isDefault === true;
        const timeSinceLastCheck = Date.now() - lastRequestTime.current;

        // 🔥 NOUVELLE LOGIQUE: Vérifier GPS SEULEMENT si problème ET pas de check récent (2 min minimum)
        if ((hasError || hasDefaultLocation) && timeSinceLastCheck > 120000) {
          console.log('🔄 App visible - Vérification GPS (2min+)');
          // Délai pour laisser le temps à l'utilisateur d'activer le GPS
          visibilityCheckTimeout = setTimeout(() => {
            requestGeolocationRef.current();
          }, 2000); // 🔥 NOUVEAU: 2 secondes au lieu de 1.5s
        }
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
  }, []); // 🔥 CORRECTION: Vide pour éviter boucle infinie - ne s'exécute qu'au montage

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
        if (!isStabilizing.current) {
          notifyGPSEnabled();
        }

        setLocation(newLocation);
        stableLocationRef.current = newLocation;
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
          if (!isStabilizing.current) {
            notifyGPSDisabled();
          }
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

  // 🔧 DÉVELOPPEMENT: Fonction pour forcer une localisation de test
  const setTestLocation = useCallback((lat, lng, name = 'Test Location') => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ setTestLocation disponible uniquement en développement');
      return;
    }

    const testLocation = {
      lat: lat,
      lng: lng,
      accuracy: 10,
      timestamp: Date.now(),
      isDefault: false,
      isTest: true,
      name: name,
    };

    console.log(`🧪 Test location forcée: ${name} (${lat}, ${lng})`);
    setLocation(testLocation);
    stableLocationRef.current = testLocation;
    setError(null);
    lastLocationTime.current = Date.now();
    lastErrorType.current = null;
  }, []);

  // 🔧 DÉVELOPPEMENT: Force la permission GPS avec popup native
  const forceGPSPermission = useCallback(() => {
    console.log('🚨 Force GPS permission - Affichage popup native...');

    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non supportée');
      return Promise.reject(new Error('Géolocalisation non supportée'));
    }

    return new Promise((resolve, reject) => {
      // Forcer une nouvelle demande avec maximumAge: 0
      navigator.geolocation.getCurrentPosition(
        position => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            isDefault: false,
          };
          console.log('✅ GPS autorisé! Position:', newLocation);
          setLocation(newLocation);
          stableLocationRef.current = newLocation;
          setError(null);
          setLoading(false);
          resolve(newLocation);
        },
        err => {
          // GeolocationPositionError n'a pas toujours un message lisible
          let errorMessage = 'Erreur de géolocalisation';
          switch (err.code) {
            case 1:
              errorMessage = 'Permission refusée';
              break;
            case 2:
              errorMessage = 'Position indisponible';
              break;
            case 3:
              errorMessage = 'Timeout dépassé';
              break;
            default:
              errorMessage = err.message || 'Erreur inconnue';
          }
          console.error(
            '❌ Erreur GPS:',
            errorMessage,
            '(code:',
            err.code,
            ')'
          );
          if (err.code === 1) {
            console.log(
              '💡 Conseil: Ouvrez les paramètres du navigateur pour autoriser la localisation'
            );
            console.log('💡 Chrome: chrome://settings/content/location');
            console.log('💡 Firefox: about:preferences#privacy');
            // Ouvrir automatiquement les paramètres
            openDeviceLocationSettings();
          }
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Force une nouvelle demande
        }
      );
    });
  }, []);

  // 🔧 DÉVELOPPEMENT: Exposer setTestLocation sur window pour tests manuels
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.setTestLocation = setTestLocation;
      window.getLocationInfo = () => ({
        current: location,
        stable: stableLocationRef.current,
        error: error,
        loading: loading,
      });

      // 🔧 NOUVEAU: Force GPS permission
      window.forceGPS = forceGPSPermission;

      // 🔧 NOUVEAU: Emplacements de test prédéfinis
      window.testLocations = {
        paris: () => setTestLocation(48.8566, 2.3522, 'Paris Centre'),
        republique: () => setTestLocation(48.8676, 2.3638, 'République'),
        bastille: () => setTestLocation(48.8531, 2.3693, 'Bastille'),
        montmartre: () => setTestLocation(48.8867, 2.3431, 'Montmartre'),
        eiffel: () => setTestLocation(48.8584, 2.2945, 'Tour Eiffel'),
        lyon: () => setTestLocation(45.764, 4.8357, 'Lyon'),
        marseille: () => setTestLocation(43.2965, 5.3698, 'Marseille'),
        custom: (lat, lng, name) => setTestLocation(lat, lng, name || 'Custom'),
      };

      // 🔧 NOUVEAU: Vérifier l'état des permissions
      window.checkGPSPermission = async () => {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({
            name: 'geolocation',
          });
          console.log('🔐 État permission GPS:', result.state);
          console.log('   - granted: autorisé');
          console.log(
            '   - denied: refusé (doit être changé dans les paramètres navigateur)'
          );
          console.log('   - prompt: va demander');
          return result.state;
        }
        console.warn('⚠️ API Permissions non disponible');
        return 'unknown';
      };

      console.log('🧪 Fonctions test GPS disponibles:');
      console.log('   - window.setTestLocation(lat, lng, name)');
      console.log('   - window.forceGPS() - Force popup permission');
      console.log(
        '   - window.testLocations.paris() / .republique() / .bastille() etc.'
      );
      console.log(
        "   - window.checkGPSPermission() - Vérifie l'état permission"
      );
      console.log('   - window.getLocationInfo() - Info localisation actuelle');
    }
  }, [setTestLocation, forceGPSPermission, location, error, loading]);

  return {
    location,
    error,
    loading,
    retryGeolocation,
    requestLocationPermission,
    forceGPSPermission:
      process.env.NODE_ENV === 'development' ? forceGPSPermission : undefined,
    setTestLocation:
      process.env.NODE_ENV === 'development' ? setTestLocation : undefined,
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
