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

  // Utiliser useRef pour éviter les re-renders infinis
  const isRequesting = useRef(false);

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
        setLocation(newLocation);
        setError(null);
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
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Position indisponible';
          break;
        case 3: // TIMEOUT
          errorMessage = "Délai d'attente dépassé";
          break;
        default:
          errorMessage = 'Erreur de géolocalisation';
          break;
      }

      // eslint-disable-next-line no-console
      console.warn('⚠️ Geolocation error, using Paris:', errorMessage);

      setError(errorMessage);
      setLocation(defaultLocation);
      setLoading(false);
      isRequesting.current = false;
    };

    // Options de géolocalisation optimisées pour la précision
    const options = {
      enableHighAccuracy: true, // Activer la haute précision
      timeout: 10000, // 10 secondes pour avoir le temps d'obtenir une position précise
      maximumAge: 60000, // Cache de 1 minute seulement
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
  }, []);

  // Première demande au montage du composant
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

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
        setLocation(newLocation);
        setError(null);
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
  }, []);

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
