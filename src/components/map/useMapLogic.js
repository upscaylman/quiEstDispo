import { useEffect, useRef, useState } from 'react';
import {
  activities,
  calculateDistance,
  calculateMapBounds,
  filterFriendsByActivity,
  formatDistance,
  getActivityColor,
  getActivityGradient,
  sanitizeFriendsData,
} from './mapUtils';

export const useMapLogic = ({
  availableFriends = [],
  userLocation,
  darkMode = false,
  selectedActivity,
  isAvailable = false,
}) => {
  // États locaux
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [mapCenter, setMapCenter] = useState(
    userLocation || { lat: 48.8566, lng: 2.3522 }
  );
  const [zoom, setZoom] = useState(14);
  const [showFilters, setShowFilters] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState('default');
  const mapRef = useRef(null);

  // Debug en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 MapView rendered with:', {
      userLocation,
      availableFriends: availableFriends.length,
      darkMode,
      isAvailable,
      selectedActivity,
    });
  }

  // Validation et nettoyage des données des amis
  const sanitizedFriends = sanitizeFriendsData(availableFriends);

  // Filtrer les amis par activité
  const filteredFriends = filterFriendsByActivity(
    sanitizedFriends,
    activityFilter
  );

  // Convertir les coordonnées géographiques en coordonnées pixel sur notre carte
  const latLngToPixel = (lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return { x: 50, y: 50 };

    const mapWidth = 100; // Pourcentage
    const mapHeight = 100; // Pourcentage

    // Définir les limites de notre zone (Paris élargi)
    const bounds = {
      north: 48.87,
      south: 48.84,
      east: 2.38,
      west: 2.32,
    };

    // Ajuster selon le zoom
    const zoomFactor = Math.pow(2, zoom - 14);
    const latRange = (bounds.north - bounds.south) / zoomFactor;
    const lngRange = (bounds.east - bounds.west) / zoomFactor;

    // Centrer sur mapCenter
    const adjustedBounds = {
      north: mapCenter.lat + latRange / 2,
      south: mapCenter.lat - latRange / 2,
      east: mapCenter.lng + lngRange / 2,
      west: mapCenter.lng - lngRange / 2,
    };

    // Convertir lat/lng en pourcentage
    const x =
      ((lng - adjustedBounds.west) /
        (adjustedBounds.east - adjustedBounds.west)) *
      100;
    const y =
      ((adjustedBounds.north - lat) /
        (adjustedBounds.north - adjustedBounds.south)) *
      100;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  // Gestionnaires d'événements
  const handleZoomIn = () => setZoom(Math.min(18, zoom + 1));
  const handleZoomOut = () => setZoom(Math.max(10, zoom - 1));

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setIsFollowingUser(true);
    }
  };

  const handleToggleFilters = () => setShowFilters(!showFilters);

  const handleFilterChange = filter => setActivityFilter(filter);

  const handleFriendSelect = friend => setSelectedFriend(friend);

  const handleFriendDeselect = () => setSelectedFriend(null);

  // Effets
  useEffect(() => {
    if (!isFollowingUser) return;
    const bounds = calculateMapBounds(filteredFriends, userLocation);
    if (bounds && bounds.lat && bounds.lng) {
      setMapCenter(bounds);
    }
  }, [filteredFriends, userLocation, isFollowingUser]);

  useEffect(() => {
    setMapStyle(darkMode ? 'dark' : 'default');
  }, [darkMode]);

  // Retourner toutes les données et fonctions nécessaires
  return {
    // États
    selectedFriend,
    mapCenter,
    zoom,
    showFilters,
    activityFilter,
    isFollowingUser,
    mapStyle,
    mapRef,

    // Données calculées
    sanitizedFriends,
    filteredFriends,

    // Fonctions utilitaires
    latLngToPixel,
    calculateDistance,
    formatDistance,
    getActivityColor,
    getActivityGradient,

    // Gestionnaires d'événements
    handleZoomIn,
    handleZoomOut,
    handleCenterOnUser,
    handleToggleFilters,
    handleFilterChange,
    handleFriendSelect,
    handleFriendDeselect,

    // Constantes
    activities,
  };
};

export default useMapLogic;
