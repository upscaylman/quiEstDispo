import { Minus, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import BaseMapView from './BaseMapView';
import {
  calculateMapBounds,
  createFriendMarkerElement,
  createUserMarkerElement,
} from './mapUtils';

const StandardRenderer = ({
  filteredFriends,
  userLocation,
  darkMode,
  selectedActivity,
  isAvailable,
  currentUser,
  onFriendSelect,
  onCenterUser,
}) => {
  const [mapCenter, setMapCenter] = useState(
    userLocation || { lat: 48.8566, lng: 2.3522 }
  );
  const [zoom, setZoom] = useState(14);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState('default');
  const mapRef = useRef(null);

  // Mettre à jour le centre de la carte
  useEffect(() => {
    if (!isFollowingUser) return;
    const bounds = calculateMapBounds(filteredFriends, userLocation);
    if (bounds.center) {
      setMapCenter(bounds.center);
    } else {
      setMapCenter(bounds); // Cas où on retourne juste une position par défaut
    }
  }, [filteredFriends, userLocation, isFollowingUser]);

  // Synchroniser le style de la carte avec le mode sombre
  useEffect(() => {
    setMapStyle(darkMode ? 'dark' : 'default');
  }, [darkMode]);

  // Convertir lat/lng en coordonnées pixel
  const latLngToPixel = (lat, lng) => {
    if (!mapRef.current) return { x: 0, y: 0 };

    const mapRect = mapRef.current.getBoundingClientRect();
    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;

    // Calcul simple de projection (approximation)
    const latRad = (lat * Math.PI) / 180;
    const mercatorY = Math.log(Math.tan(((90 + lat) * Math.PI) / 360));

    const x =
      (((lng - mapCenter.lng) * mapWidth) / 360) *
        Math.cos((mapCenter.lat * Math.PI) / 180) +
      mapWidth / 2;
    const y =
      mapHeight / 2 -
      ((mercatorY -
        Math.log(Math.tan(((90 + mapCenter.lat) * Math.PI) / 360))) *
        mapHeight) /
        (2 * Math.PI);

    return { x, y };
  };

  // Composant pour afficher un marqueur d'ami
  const MapPin = ({ friend, onClick, isSelected }) => {
    const lat =
      friend.location?.lat || friend.lat || friend.friend?.location?.lat;
    const lng =
      friend.location?.lng || friend.lng || friend.friend?.location?.lng;

    if (!lat || !lng) return null;

    const { x, y } = latLngToPixel(lat, lng);

    // Utiliser la fonction de création de marqueur partagée
    const friendMarkerEl = createFriendMarkerElement(friend, onClick);

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
          isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
        }`}
        style={{ left: x, top: y }}
        dangerouslySetInnerHTML={{ __html: friendMarkerEl.innerHTML }}
      />
    );
  };

  // Composant pour afficher le marqueur utilisateur
  const UserPin = ({
    lat,
    lng,
    onClick,
    isCurrentUser,
    hasLocationPermission,
  }) => {
    if (!lat || !lng || !hasLocationPermission) return null;

    const { x, y } = latLngToPixel(lat, lng);

    // Créer un marqueur utilisateur avec les bonnes données
    const userData = {
      ...currentUser,
      selectedActivity,
      isAvailable,
      activity: selectedActivity,
    };

    const userMarkerEl = createUserMarkerElement(
      userData,
      hasLocationPermission
    );

    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
        style={{ left: x, top: y }}
        onClick={() => onClick?.(userData)}
        dangerouslySetInnerHTML={{ __html: userMarkerEl.innerHTML }}
      />
    );
  };

  // Gestionnaires d'événements
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 1));

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(14);
      setIsFollowingUser(true);
    }
  };

  // Exposer la fonction de centrage
  useEffect(() => {
    window.standardCenterOnUser = handleCenterOnUser;
  }, [userLocation]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Carte de fond */}
      <div
        ref={mapRef}
        className={`w-full h-full transition-colors duration-300 ${
          mapStyle === 'dark'
            ? 'bg-gray-800'
            : 'bg-gradient-to-br from-blue-100 to-green-100'
        }`}
        onClick={() => setIsFollowingUser(false)}
      >
        {/* Grille de fond */}
        <div
          className={`absolute inset-0 opacity-20 ${
            mapStyle === 'dark' ? 'bg-gray-700' : 'bg-white'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(${mapStyle === 'dark' ? '#4a5568' : '#e2e8f0'} 1px, transparent 1px),
              linear-gradient(90deg, ${mapStyle === 'dark' ? '#4a5568' : '#e2e8f0'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Marqueur utilisateur */}
        <UserPin
          lat={userLocation?.lat || 0}
          lng={userLocation?.lng || 0}
          onClick={onFriendSelect}
          isCurrentUser={false}
          hasLocationPermission={!!userLocation}
        />

        {/* Marqueurs des amis (exclure l'utilisateur actuel) */}
        {filteredFriends
          .filter(friend => !friend.isCurrentUser)
          .map((friend, index) => (
            <MapPin
              key={friend.id || index}
              friend={friend}
              onClick={onFriendSelect}
            />
          ))}
      </div>

      {/* Contrôles de zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
            darkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Plus size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
            darkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Minus size={20} />
        </button>
      </div>

      {/* Indicateur de zoom */}
      <div
        className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
        } shadow-lg`}
      >
        Zoom: {zoom}x
      </div>
    </div>
  );
};

// Composant principal qui utilise BaseMapView
const StandardMapView = props => {
  return (
    <BaseMapView {...props}>
      <StandardRenderer
        onCenterUser={() => {
          if (window.standardCenterOnUser) {
            window.standardCenterOnUser();
          }
        }}
      />
    </BaseMapView>
  );
};

export default StandardMapView;
