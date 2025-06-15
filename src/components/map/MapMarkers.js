import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MapPin as MapPinIcon, X } from 'lucide-react';
import React from 'react';

// Composant Pin pour les amis
const FriendPin = ({
  friend,
  onClick,
  isSelected,
  position,
  activity,
  distance,
  getActivityColor,
  formatDistance,
  darkMode,
}) => {
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

// Composant Pin pour l'utilisateur (style GPS préservé exactement)
const UserPin = ({
  userLocation,
  isAvailable,
  selectedActivity,
  position,
  getActivityColor,
}) => {
  if (!userLocation) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ UserPin: Pas de localisation utilisateur');
    }
    return null;
  }

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
        {/* Pulse animation si disponible - EXACTEMENT comme dans l'original */}
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

        {/* Avatar utilisateur - EXACTEMENT comme dans l'original */}
        <div
          className={`w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold ring-2 ring-blue-400`}
          style={{
            backgroundColor: isAvailable
              ? getActivityColor(selectedActivity)
              : '#3b82f6', // Bleu utilisateur au lieu de gris
          }}
        >
          😊
        </div>

        {/* Indicateur de statut - EXACTEMENT comme dans l'original */}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            isAvailable ? 'bg-green-400' : 'bg-gray-400'
          }`}
        />
      </div>
    </motion.div>
  );
};

// Composant de détails ami sélectionné
const FriendDetails = ({
  selectedFriend,
  onClose,
  darkMode,
  getActivityColor,
  userLocation,
  calculateDistance,
  formatDistance,
}) => {
  if (!selectedFriend) return null;

  return (
    <AnimatePresence>
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
              onClick={onClose}
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
    </AnimatePresence>
  );
};

// Message si pas de localisation
const NoLocationMessage = ({ darkMode, onRequestLocationPermission }) => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
    <div
      className={`${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } rounded-lg shadow-lg p-6`}
    >
      <MapPinIcon size={48} className="mx-auto mb-4 text-yellow-500" />
      <h3 className="text-lg font-semibold mb-2">Localisation requise</h3>
      <p className="text-sm opacity-75 mb-2">
        Autorisez la géolocalisation pour voir votre position sur la carte
      </p>
      <p className="text-xs opacity-60 mb-4 leading-relaxed">
        L'application a besoin de votre position GPS pour vous localiser sur la
        carte et permettre à vos amis de vous retrouver facilement.
      </p>
      <button
        onClick={() => {
          // Utiliser le callback approprié pour demander la permission de localisation
          if (onRequestLocationPermission) {
            onRequestLocationPermission();
          } else {
            console.warn('onRequestLocationPermission callback not available');
          }
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        Activer la localisation
      </button>
    </div>
  </div>
);

// Composant principal MapMarkers
const MapMarkers = ({
  // Props de données
  filteredFriends,
  userLocation,
  selectedFriend,
  darkMode,
  isAvailable,
  selectedActivity,

  // Props de fonctions
  latLngToPixel,
  calculateDistance,
  formatDistance,
  getActivityColor,
  onFriendSelect,
  onFriendDeselect,
  onRetryGeolocation,
  onRequestLocationPermission,
}) => {
  return (
    <>
      {/* Pins des amis */}
      <AnimatePresence>
        {filteredFriends.map(friend => {
          const lat = friend.location?.lat || friend.lat;
          const lng = friend.location?.lng || friend.lng;
          const position = latLngToPixel(lat, lng);
          const activity = friend.activity || 'chill';
          const distance = userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
            : 0;

          return (
            <FriendPin
              key={friend.id}
              friend={friend}
              onClick={onFriendSelect}
              isSelected={selectedFriend?.id === friend.id}
              position={position}
              activity={activity}
              distance={distance}
              getActivityColor={getActivityColor}
              formatDistance={formatDistance}
              darkMode={darkMode}
            />
          );
        })}
      </AnimatePresence>

      {/* Pin utilisateur */}
      {userLocation && (
        <UserPin
          userLocation={userLocation}
          isAvailable={isAvailable}
          selectedActivity={selectedActivity}
          position={latLngToPixel(userLocation.lat, userLocation.lng)}
          getActivityColor={getActivityColor}
        />
      )}

      {/* Message si pas de localisation */}
      {!userLocation && (
        <NoLocationMessage
          darkMode={darkMode}
          onRequestLocationPermission={onRequestLocationPermission}
        />
      )}

      {/* Informations de l'ami sélectionné */}
      {selectedFriend && (
        <FriendDetails
          selectedFriend={selectedFriend}
          onClose={onFriendDeselect}
          darkMode={darkMode}
          getActivityColor={getActivityColor}
          userLocation={userLocation}
          calculateDistance={calculateDistance}
          formatDistance={formatDistance}
        />
      )}
    </>
  );
};

export default MapMarkers;
