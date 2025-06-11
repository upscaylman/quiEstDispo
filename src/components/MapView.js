import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Coffee,
  Crosshair,
  Film,
  Filter,
  MapPin as MapPinIcon,
  Minus,
  Music,
  Plus,
  Users,
  UtensilsCrossed,
  Wine,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const MapView = ({
  availableFriends = [],
  userLocation,
  darkMode = false,
  selectedActivity,
  isAvailable = false,
  showControls = true,
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 MapView rendered with:', {
      userLocation,
      availableFriends: availableFriends.length,
      darkMode,
      isAvailable,
      selectedActivity,
    });
  }
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

  const activities = [
    {
      id: 'coffee',
      name: 'Coffee',
      icon: Coffee,
      color: '#f59e0b',
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      id: 'lunch',
      name: 'Lunch',
      icon: UtensilsCrossed,
      color: '#10b981',
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      id: 'drinks',
      name: 'Drinks',
      icon: Wine,
      color: '#8b5cf6',
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      id: 'chill',
      name: 'Chill',
      icon: Users,
      color: '#3b82f6',
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      id: 'clubbing',
      name: 'Clubbing',
      icon: Music,
      color: '#ec4899',
      gradient: 'from-pink-400 to-rose-500',
    },
    {
      id: 'cinema',
      name: 'Cinema',
      icon: Film,
      color: '#6366f1',
      gradient: 'from-indigo-400 to-purple-500',
    },
  ];

  // Validation et nettoyage des données des amis
  const sanitizedFriends = availableFriends.filter(friend => {
    if (!friend) return false;
    const lat = friend.location?.lat || friend.lat;
    const lng = friend.location?.lng || friend.lng;
    return (
      lat &&
      lng &&
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  });

  // Filtrer les amis par activité
  const filteredFriends =
    activityFilter === 'all'
      ? sanitizedFriends
      : sanitizedFriends.filter(
          friend =>
            friend.activity && friend.activity.toLowerCase() === activityFilter
        );

  // Calculer les limites de la carte pour afficher tous les amis
  const calculateMapBounds = () => {
    if (filteredFriends.length === 0 && userLocation) return userLocation;

    const lats = [];
    const lngs = [];

    // Ajouter les positions des amis
    filteredFriends.forEach(friend => {
      const lat = friend.location?.lat || friend.lat;
      const lng = friend.location?.lng || friend.lng;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        lats.push(lat);
        lngs.push(lng);
      }
    });

    // Ajouter la position de l'utilisateur
    if (userLocation && userLocation.lat && userLocation.lng) {
      lats.push(userLocation.lat);
      lngs.push(userLocation.lng);
    }

    // Position par défaut si aucune donnée valide
    if (lats.length === 0) return { lat: 48.8566, lng: 2.3522 };

    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    return { lat: centerLat, lng: centerLng };
  };

  // Mettre à jour le centre de la carte
  useEffect(() => {
    if (!isFollowingUser) return;
    const bounds = calculateMapBounds();
    setMapCenter(bounds);
  }, [filteredFriends, userLocation, isFollowingUser]);

  // Synchroniser le style de la carte avec le mode sombre
  useEffect(() => {
    setMapStyle(darkMode ? 'dark' : 'default');
  }, [darkMode]);

  // Obtenir la couleur d'une activité
  const getActivityColor = activityName => {
    if (!activityName) return '#6b7280';
    const activity = activities.find(
      a => a.name.toLowerCase() === activityName.toLowerCase()
    );
    return activity ? activity.color : '#6b7280';
  };

  const getActivityGradient = activityName => {
    if (!activityName) return 'from-gray-400 to-gray-500';
    const activity = activities.find(
      a => a.name.toLowerCase() === activityName.toLowerCase()
    );
    return activity ? activity.gradient : 'from-gray-400 to-gray-500';
  };

  // Calculer la distance approximative
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
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
  };

  const formatDistance = distance => {
    if (!distance || isNaN(distance)) return '?';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

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

  // Composant Pin pour les amis
  const MapPin = ({ friend, onClick, isSelected }) => {
    const lat = friend.location?.lat || friend.lat;
    const lng = friend.location?.lng || friend.lng;
    const position = latLngToPixel(lat, lng);
    const activity = friend.activity || 'chill';

    const distance = userLocation
      ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
      : 0;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute cursor-pointer z-20"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        onClick={() => onClick(friend)}
      >
        {/* Pin animé */}
        <div className="relative">
          {/* Pulse ring si sélectionné */}
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              style={{
                width: '60px',
                height: '60px',
                left: '-10px',
                top: '-10px',
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Avatar avec couleur d'activité */}
          <div
            className={`w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm ${
              isSelected ? 'ring-2 ring-blue-400' : ''
            }`}
            style={{ backgroundColor: getActivityColor(activity) }}
          >
            {friend.avatar && friend.avatar.length === 1 ? friend.avatar : '👤'}
          </div>

          {/* Bulle d'info compacte */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute -top-16 left-1/2 transform -translate-x-1/2 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } px-3 py-2 rounded-lg shadow-lg border text-xs whitespace-nowrap`}
            >
              <div className="font-semibold">{friend.name}</div>
              <div className="text-xs opacity-75">
                {activity} • {formatDistance(distance)}
              </div>
              {/* Flèche */}
              <div
                className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                  darkMode ? 'border-t-gray-800' : 'border-t-white'
                }`}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // Composant Pin pour l'utilisateur
  const UserPin = ({ isAvailable, activity }) => {
    if (!userLocation) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ UserPin: Pas de localisation utilisateur');
      }
      return null;
    }

    const position = latLngToPixel(userLocation.lat, userLocation.lng);

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute z-30"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative">
          {/* Pulse animation si disponible */}
          {isAvailable && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              style={{
                width: '60px',
                height: '60px',
                left: '-10px',
                top: '-10px',
              }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Avatar utilisateur */}
          <div
            className={`w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold ${
              isAvailable ? 'ring-2 ring-blue-400' : ''
            }`}
            style={{
              backgroundColor: isAvailable
                ? getActivityColor(activity)
                : '#6b7280',
            }}
          >
            😊
          </div>

          {/* Indicateur de statut */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isAvailable ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Carte de fond stylisée */}
      <div
        ref={mapRef}
        className={`w-full h-full relative ${
          mapStyle === 'dark'
            ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
            : 'bg-gradient-to-br from-blue-200 via-green-100 to-purple-100'
        }`}
        style={{
          backgroundImage:
            mapStyle === 'dark'
              ? `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)`,
        }}
      >
        {/* Grille de fond pour effet carte */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
              linear-gradient(90deg, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Points d'intérêt décoratifs */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Routes stylisées */}
          <div
            className={`absolute ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } opacity-30`}
            style={{
              width: '100%',
              height: '2px',
              top: '30%',
              transform: 'rotate(-15deg)',
            }}
          />
          <div
            className={`absolute ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } opacity-30`}
            style={{
              width: '100%',
              height: '2px',
              top: '70%',
              transform: 'rotate(15deg)',
            }}
          />
        </div>

        {/* Pins des amis */}
        <AnimatePresence>
          {filteredFriends.map(friend => (
            <MapPin
              key={friend.id}
              friend={friend}
              onClick={setSelectedFriend}
              isSelected={selectedFriend?.id === friend.id}
            />
          ))}
        </AnimatePresence>

        {/* Pin utilisateur */}
        <UserPin isAvailable={isAvailable} activity={selectedActivity} />

        {/* Message si pas de localisation */}
        {!userLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div
              className={`${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } rounded-lg shadow-lg p-6`}
            >
              <MapPinIcon size={48} className="mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">
                Localisation requise
              </h3>
              <p className="text-sm opacity-75 mb-4">
                Autorisez la géolocalisation pour voir votre position sur la
                carte
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles de zoom */}
      {showControls && (
        <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoom(Math.min(18, zoom + 1))}
            className={`w-10 h-10 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
            } rounded-lg shadow-lg flex items-center justify-center`}
          >
            <Plus size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoom(Math.max(10, zoom - 1))}
            className={`w-10 h-10 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
            } rounded-lg shadow-lg flex items-center justify-center`}
          >
            <Minus size={20} />
          </motion.button>
        </div>
      )}

      {/* Bouton centrer sur utilisateur */}
      {showControls && userLocation && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setMapCenter(userLocation);
            setIsFollowingUser(true);
          }}
          className={`absolute bottom-20 right-4 z-40 w-12 h-12 ${
            isFollowingUser
              ? 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700'
          } rounded-full shadow-lg flex items-center justify-center`}
        >
          <Crosshair size={20} />
        </motion.button>
      )}

      {/* Bouton filtres */}
      {showControls && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute top-4 left-4 z-40 w-10 h-10 ${
            showFilters
              ? 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700'
          } rounded-lg shadow-lg flex items-center justify-center`}
        >
          <Filter size={20} />
        </motion.button>
      )}

      {/* Panel de filtres */}
      <AnimatePresence>
        {showControls && showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`absolute top-16 left-4 z-40 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg shadow-xl p-4 min-w-48`}
          >
            <h3
              className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Filtres
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActivityFilter('all')}
                className={`w-full text-left px-3 py-2 rounded ${
                  activityFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Toutes les activités
              </button>
              {activities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => setActivityFilter(activity.id)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center ${
                    activityFilter === activity.id
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <activity.icon size={16} className="mr-2" />
                  {activity.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informations de l'ami sélectionné */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
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
              <div className="flex items-center space-x-2">
                {selectedFriend.timeLeft && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    {selectedFriend.timeLeft}min
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedFriend(null)}
                  className={`w-8 h-8 ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  } rounded-full flex items-center justify-center`}
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
