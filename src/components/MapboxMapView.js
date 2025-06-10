import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Coffee,
  Crosshair,
  Filter,
  MapPin as MapPinIcon,
  Users,
  UtensilsCrossed,
  Wine,
  X,
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';

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
  onDeclineFriend,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const friendMarkers = useRef([]);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [mapLoaded, setMapLoaded] = useState(false);

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
  ];

  const getActivityColor = activityName => {
    const activity = activities.find(
      a => a.name.toLowerCase() === activityName?.toLowerCase()
    );
    return activity ? activity.color : '#6b7280';
  };

  // Filtrer les amis par activité
  const filteredFriends =
    activityFilter === 'all'
      ? availableFriends
      : availableFriends.filter(
          friend => friend.activity?.toLowerCase() === activityFilter
        );

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!process.env.REACT_APP_MAPBOX_TOKEN) {
      console.error(
        'Mapbox token manquant ! Ajoutez REACT_APP_MAPBOX_TOKEN dans .env.local'
      );
      return;
    }

    const initializeMap = () => {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: darkMode
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12',
        center: userLocation
          ? [userLocation.lng, userLocation.lat]
          : [2.3522, 48.8566],
        zoom: 13,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      // Ajouter les contrôles de navigation
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

  // Mettre à jour le marqueur de l'utilisateur
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Supprimer l'ancien marqueur
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Créer l'élément HTML pour le marqueur
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '50px';
    el.style.height = '50px';
    el.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <div style="
          width: 100%;
          height: 100%;
          background: ${isAvailable ? getActivityColor(selectedActivity) : '#6b7280'};
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          overflow: hidden;
        ">
          ${
            currentUser?.avatar && currentUser.avatar.startsWith('http')
              ? `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Avatar" />`
              : `<span style="font-size: 20px;">${currentUser?.avatar || '😊'}</span>`
          }
        </div>
        ${
          isAvailable
            ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            bottom: -4px;
            left: -4px;
            border: 3px solid #3B82F6;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        `
            : ''
        }
      </div>
    `;

    // Ajouter l'animation CSS
    if (!document.querySelector('#mapbox-pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'mapbox-pulse-animation';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Créer le nouveau marqueur
    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

    // Centrer la carte sur l'utilisateur
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
    });
  }, [userLocation, isAvailable, selectedActivity, mapLoaded]);

  // Mettre à jour les marqueurs des amis
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Supprimer les anciens marqueurs
    friendMarkers.current.forEach(marker => marker.remove());
    friendMarkers.current = [];

    // Ajouter les nouveaux marqueurs
    filteredFriends.forEach(friend => {
      const lat =
        friend.location?.lat || friend.lat || friend.friend?.location?.lat;
      const lng =
        friend.location?.lng || friend.lng || friend.friend?.location?.lng;

      if (!lat || !lng) return;

      const el = document.createElement('div');
      el.className = 'friend-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.cursor = 'pointer';

      const ActivityIcon =
        activities.find(
          a => a.name.toLowerCase() === friend.activity?.toLowerCase()
        )?.icon || Users;

      el.innerHTML = `
        <div style="
          position: relative;
          width: 100%;
          height: 100%;
          background: ${getActivityColor(friend.activity)};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            ${
              friend.activity === 'coffee'
                ? '<path d="M3 14c0 1.3.84 2.4 2 2.82V17H3v2h12v-2h-2v-.18c1.16-.42 2-1.52 2-2.82v-4H3v4zm2 0v-2h8v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2zm13-4h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2v-5zM3 8h12c0-1.86-1.28-3.41-3-3.86V2H6v2.14C4.28 4.59 3 6.14 3 8z"/>'
                : friend.activity === 'lunch'
                  ? '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>'
                  : friend.activity === 'drinks'
                    ? '<path d="M3 14c0 1.3.84 2.4 2 2.82V17c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-.18c1.16-.42 2-1.52 2-2.82v-3H3v3zM7 17v-1h6v1H7zM19.23 7L20 3h-8l.77 4M9.72 7L9 3H5v2h2.23l.77 4"/>'
                    : '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'
            }
          </svg>
        </div>
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: #374151;
          overflow: hidden;
        ">
          ${
            (friend.friend?.avatar || friend.avatar) &&
            (friend.friend?.avatar || friend.avatar).startsWith('http')
              ? `<img src="${friend.friend?.avatar || friend.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Avatar" />`
              : `<span style="font-size: 8px;">${friend.friend?.avatar || friend.avatar || (friend.friend?.name || friend.name || 'A').substring(0, 2).toUpperCase()}</span>`
          }
        </div>
        <div style="
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.75);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${friend.friend?.name || friend.name || 'Ami'}
        </div>
      `;

      el.onclick = () => {
        setSelectedFriend({
          ...friend,
          name: friend.friend?.name || friend.name || 'Ami',
          avatar: friend.friend?.avatar || friend.avatar || '👤',
        });
      };

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current);

      friendMarkers.current.push(marker);
    });

    // Ajuster la vue pour inclure tous les marqueurs
    if (filteredFriends.length > 0 && userLocation) {
      const bounds = new mapboxgl.LngLatBounds();

      // Ajouter la position de l'utilisateur
      bounds.extend([userLocation.lng, userLocation.lat]);

      // Ajouter les positions des amis
      filteredFriends.forEach(friend => {
        const lat =
          friend.location?.lat || friend.lat || friend.friend?.location?.lat;
        const lng =
          friend.location?.lng || friend.lng || friend.friend?.location?.lng;
        if (lat && lng) {
          bounds.extend([lng, lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 50 },
        maxZoom: 15,
      });
    }
  }, [filteredFriends, mapLoaded]);

  const centerOnUser = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
      });
    }
  };

  // Calculer la distance
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = distance => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div
      className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Carte Mapbox */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Contrôles sur la carte */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
              activityFilter !== 'all' || showFilters
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter size={20} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={centerOnUser}
            className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
              darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Crosshair size={20} />
          </motion.button>
        </div>

        {/* Panel de filtres */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className={`absolute top-4 left-4 z-40 ${
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
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activityFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tous ({availableFriends.length})
                </button>
                {activities.map(activity => {
                  const count = availableFriends.filter(
                    f => f.activity?.toLowerCase() === activity.id
                  ).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={activity.id}
                      onClick={() => setActivityFilter(activity.id)}
                      className={`w-full text-left px-3 py-2 rounded flex items-center transition-colors ${
                        activityFilter === activity.id
                          ? 'bg-blue-500 text-white'
                          : darkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <activity.icon size={16} className="mr-2" />
                      {activity.name} ({count})
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!process.env.REACT_APP_MAPBOX_TOKEN && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
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
      </div>

      {/* Détails de l'ami sélectionné */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className={`absolute bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-3xl shadow-2xl p-6 z-30 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {selectedFriend.avatar &&
                  selectedFriend.avatar.startsWith('http') ? (
                    <img
                      src={selectedFriend.avatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">
                      {selectedFriend.avatar ||
                        (selectedFriend.name || 'A')
                          .substring(0, 2)
                          .toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {selectedFriend.name}
                  </h3>
                  <div
                    className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <MapPinIcon size={14} />
                    <span>À proximité</span>
                    {userLocation &&
                      selectedFriend.lat &&
                      selectedFriend.lng && (
                        <>
                          <span>•</span>
                          <span>
                            {formatDistance(
                              calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                selectedFriend.lat,
                                selectedFriend.lng
                              )
                            )}{' '}
                            de distance
                          </span>
                        </>
                      )}
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedFriend(null)}
                className={`p-2 rounded-full transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-4 py-2 rounded-full text-white text-sm font-medium flex items-center space-x-2`}
                  style={{
                    backgroundColor: getActivityColor(selectedFriend.activity),
                  }}
                >
                  {React.createElement(
                    activities.find(
                      a =>
                        a.name.toLowerCase() ===
                        selectedFriend.activity?.toLowerCase()
                    )?.icon || Users,
                    { size: 16 }
                  )}
                  <span>{selectedFriend.activity}</span>
                </span>

                <div
                  className={`flex items-center space-x-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <Clock size={14} />
                  <span>{selectedFriend.timeLeft || 0} min restantes</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (onDeclineFriend) {
                    onDeclineFriend(selectedFriend);
                  }
                  setSelectedFriend(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors shadow-lg"
              >
                <X size={16} />
                <span>Décliner</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapboxMapView;
