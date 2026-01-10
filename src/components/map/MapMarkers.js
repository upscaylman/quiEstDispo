import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MapPin as MapPinIcon, X } from 'lucide-react';

// Composant Pin pour les amis (avec avatar réel)
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
  // Récupérer l'avatar de l'ami
  const avatarUrl =
    friend.avatar ||
    friend.photoURL ||
    friend.profilePicture ||
    friend.friend?.avatar ||
    friend.friend?.photoURL ||
    friend.friend?.profilePicture;
  const hasValidAvatar =
    avatarUrl &&
    (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'));
  const friendName =
    friend.name || friend.displayName || friend.friend?.name || 'Ami';

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

        {/* Avatar avec image réelle ou initiales */}
        <div
          className={`w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center overflow-hidden ${
            isSelected ? 'ring-2 ring-blue-400' : ''
          }`}
          style={{ backgroundColor: getActivityColor(activity) }}
        >
          {hasValidAvatar ? (
            <img
              src={avatarUrl}
              alt={friendName}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span
            className="text-white font-bold text-sm"
            style={{ display: hasValidAvatar ? 'none' : 'flex' }}
          >
            {friendName.substring(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Bulle d'info compacte */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] px-3 py-2 rounded-lg shadow-lg border border-[var(--md-sys-color-outline-variant)] text-xs whitespace-nowrap"
          >
            <div className="font-semibold">{friendName}</div>
            <div className="text-xs opacity-75">
              {activity} • {formatDistance(distance)}
            </div>
            {/* Flèche */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--md-sys-color-surface-container)]" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Composant Pin pour l'utilisateur (avec avatar réel)
const UserPin = ({
  userLocation,
  isAvailable,
  selectedActivity,
  position,
  getActivityColor,
  currentUser,
}) => {
  if (!userLocation) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ UserPin: Pas de localisation utilisateur');
    }
    return null;
  }

  // Récupérer l'avatar de l'utilisateur
  const avatarUrl =
    currentUser?.avatar || currentUser?.photoURL || currentUser?.profilePicture;
  const hasValidAvatar =
    avatarUrl &&
    (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'));
  const userName = currentUser?.name || currentUser?.displayName || 'Moi';

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
            className="absolute rounded-full border-2 border-blue-400"
            style={{
              width: '60px',
              height: '60px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Avatar utilisateur avec image réelle */}
        <div
          className={`w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden ring-2 ring-blue-400`}
          style={{
            backgroundColor: isAvailable
              ? getActivityColor(selectedActivity)
              : '#3b82f6',
          }}
        >
          {hasValidAvatar ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span
            className="text-white font-bold text-lg"
            style={{ display: hasValidAvatar ? 'none' : 'flex' }}
          >
            {userName.substring(0, 2).toUpperCase()}
          </span>
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

  // Récupérer l'avatar de l'ami
  const avatarUrl =
    selectedFriend.avatar ||
    selectedFriend.photoURL ||
    selectedFriend.profilePicture ||
    selectedFriend.friend?.avatar ||
    selectedFriend.friend?.photoURL ||
    selectedFriend.friend?.profilePicture;
  const hasValidAvatar =
    avatarUrl &&
    (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'));
  const friendName =
    selectedFriend.name ||
    selectedFriend.displayName ||
    selectedFriend.friend?.name ||
    'Ami';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="absolute bottom-20 left-4 right-4 z-40 bg-[var(--md-sys-color-surface-container)] rounded-lg shadow-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden mr-3"
              style={{
                backgroundColor: getActivityColor(selectedFriend.activity),
              }}
            >
              {hasValidAvatar ? (
                <img
                  src={avatarUrl}
                  alt={friendName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {friendName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">
                {friendName}
              </h3>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                Dispo pour {selectedFriend.activity}
              </p>
              {userLocation && (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
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
              className="w-8 h-8 bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] rounded-full flex items-center justify-center"
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
    <div className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] rounded-lg shadow-lg p-6">
      <MapPinIcon
        size={48}
        className="mx-auto mb-4 text-[var(--md-sys-color-warning)]"
      />
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
        className="bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] px-4 py-2 rounded-lg text-sm font-medium"
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
  currentUser,

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
          currentUser={currentUser}
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
