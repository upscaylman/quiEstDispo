import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { MapboxControls } from './MapControls';
import { createFriendMarkerElement, createUserMarkerElement } from './mapUtils';
import useMapLogic from './useMapLogic';

// Configuration Mapbox
if (process.env.REACT_APP_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
}

const MapboxMapView = ({
  availableFriends = [],
  userLocation,
  darkMode = false,
  selectedActivity,
  isAvailable = false,
  currentUser,
  showControls = true,
  onRetryGeolocation,
  onRequestLocationPermission,
}) => {
  // Utiliser le hook de logique métier (même que MapView)
  const {
    // États
    selectedFriend,
    mapCenter,
    zoom,
    showFilters,
    activityFilter,
    isFollowingUser,

    // Données calculées
    filteredFriends,

    // Fonctions utilitaires
    calculateDistance,
    formatDistance,
    getActivityColor,

    // Gestionnaires d'événements
    handleCenterOnUser,
    handleToggleFilters,
    handleFilterChange,
    handleFriendSelect,
    handleFriendDeselect,

    // Constantes
    activities,
  } = useMapLogic({
    availableFriends,
    userLocation,
    darkMode,
    selectedActivity,
    isAvailable,
  });

  // État local pour contrôler le suivi utilisateur
  const [localIsFollowingUser, setLocalIsFollowingUser] = useState(true);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const friendMarkers = useRef([]);
  const userMarker = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 🔥 CORRECTION: Ref stable pour handleFriendSelect
  const handleFriendSelectRef = useRef(handleFriendSelect);
  handleFriendSelectRef.current = handleFriendSelect;

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!process.env.REACT_APP_MAPBOX_TOKEN) {
      console.error(
        'Mapbox token manquant ! Ajoutez REACT_APP_MAPBOX_TOKEN dans .env.local'
      );
      return;
    }

    const initializeMap = () => {
      // Valider les coordonnées avant l'initialisation
      const hasValidLocation =
        userLocation &&
        typeof userLocation.lng === 'number' &&
        typeof userLocation.lat === 'number' &&
        !isNaN(userLocation.lng) &&
        !isNaN(userLocation.lat);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: darkMode
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12',
        center: hasValidLocation
          ? [userLocation.lng, userLocation.lat]
          : [2.3522, 48.8566], // Paris par défaut
        zoom: 13,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      // Désactiver le suivi utilisateur quand l'utilisateur bouge la carte manuellement
      map.current.on('dragstart', () => {
        setLocalIsFollowingUser(false);
      });

      map.current.on('zoomstart', () => {
        setLocalIsFollowingUser(false);
      });

      map.current.on('pitchstart', () => {
        setLocalIsFollowingUser(false);
      });

      map.current.on('rotatestart', () => {
        setLocalIsFollowingUser(false);
      });

      // Ajouter les contrôles de navigation Mapbox (en bas à droite)
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Changer le style de la carte selon le mode sombre
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.setStyle(
      darkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12'
    );
  }, [darkMode, mapLoaded]);

  // Helper pour valider les coordonnées
  const isValidCoordinate = location => {
    return (
      location &&
      typeof location.lng === 'number' &&
      typeof location.lat === 'number' &&
      !isNaN(location.lng) &&
      !isNaN(location.lat)
    );
  };

  // Centrer sur l'utilisateur seulement au premier chargement
  useEffect(() => {
    if (!map.current || !mapLoaded || !localIsFollowingUser) return;
    if (!isValidCoordinate(userLocation)) return;

    // Centrer seulement si on suit l'utilisateur ET que c'est le premier chargement
    map.current.setCenter([userLocation.lng, userLocation.lat]);
  }, [userLocation, mapLoaded, localIsFollowingUser]);

  // Fonction de centrage utilisateur intégrée
  const handleMapCenterOnUser = () => {
    if (map.current && isValidCoordinate(userLocation)) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
      });
    }
    setLocalIsFollowingUser(true); // Réactiver le suivi
    handleCenterOnUser(); // Appeler la logique commune
  };

  // Mettre à jour le marqueur utilisateur
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (!isValidCoordinate(userLocation)) return;

    // Supprimer l'ancien marqueur utilisateur
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Créer le marqueur utilisateur avec le même style que MapView
    const userElement = createUserMarkerElement(
      {
        name: currentUser?.name || currentUser?.displayName || 'Vous',
        avatar:
          currentUser?.avatar ||
          currentUser?.photoURL ||
          currentUser?.profilePicture ||
          '',
        photoURL: currentUser?.photoURL,
        profilePicture: currentUser?.profilePicture,
        selectedActivity,
        isAvailable,
      },
      true
    );

    userMarker.current = new mapboxgl.Marker(userElement)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
  }, [
    userLocation,
    isAvailable,
    selectedActivity,
    currentUser?.name,
    currentUser?.avatar,
    mapLoaded,
  ]);

  // Mettre à jour les marqueurs d'amis
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Nettoyer les anciens marqueurs d'amis
    friendMarkers.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    friendMarkers.current = [];

    // Ajouter les nouveaux marqueurs d'amis
    filteredFriends.forEach(friend => {
      const lat = friend.location?.lat ?? friend.lat;
      const lng = friend.location?.lng ?? friend.lng;

      // Validation robuste des coordonnées
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        isNaN(lat) ||
        isNaN(lng)
      ) {
        return;
      }

      // Créer le marqueur ami avec le même style que MapView
      const friendElement = createFriendMarkerElement(friend, () => {
        // 🔥 CORRECTION: Passer directement l'ami sans recherche
        handleFriendSelectRef.current(friend);
      });

      const marker = new mapboxgl.Marker(friendElement)
        .setLngLat([lng, lat])
        .addTo(map.current);

      friendMarkers.current.push(marker);
    });
  }, [filteredFriends, mapLoaded]);

  return (
    <div className="h-full relative overflow-hidden">
      {/* Carte Mapbox */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Contrôles Mapbox réorganisés */}
      <MapboxControls
        showControls={showControls}
        userLocation={userLocation}
        darkMode={darkMode}
        showFilters={showFilters}
        activityFilter={activityFilter}
        isFollowingUser={localIsFollowingUser}
        activities={activities}
        onCenterUser={handleMapCenterOnUser}
        onToggleFilters={handleToggleFilters}
        onFilterChange={handleFilterChange}
      />

      {/* Message d'erreur si pas de token */}
      {!process.env.REACT_APP_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-sm mx-4`}
          >
            <h3
              className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Token Mapbox manquant
            </h3>
            <p
              className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              Ajoutez votre token Mapbox dans le fichier .env.local :
            </p>
            <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              REACT_APP_MAPBOX_TOKEN=votre_token_ici
            </code>
          </div>
        </div>
      )}

      {/* Détails de l'ami sélectionné (même que MapView) */}
      {selectedFriend && (
        <div
          className={`absolute bottom-20 left-4 right-4 z-40 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-xl p-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold mr-3"
                style={{
                  backgroundColor: getActivityColor(selectedFriend.activity),
                }}
              >
                {selectedFriend.avatar || '👤'}
              </div>
              <div>
                <h3
                  className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {selectedFriend.name}
                </h3>
                <p
                  className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Dispo pour {selectedFriend.activity}
                </p>
                {userLocation && (
                  <p
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    À{' '}
                    {formatDistance(
                      calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        selectedFriend.location?.lat || selectedFriend.lat,
                        selectedFriend.location?.lng || selectedFriend.lng
                      )
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleFriendDeselect}
              className={`w-8 h-8 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              } rounded-full flex items-center justify-center`}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMapView;
