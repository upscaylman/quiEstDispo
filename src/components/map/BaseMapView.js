// BaseMapView component

import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Crosshair,
  Filter,
  MapPin as MapPinIcon,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  activities,
  calculateDistance,
  filterFriendsByActivity,
  formatDistance,
  getActivityColor,
  sanitizeFriendsData,
} from './mapUtils';

const BaseMapView = ({
  availableFriends = [],
  userLocation,
  darkMode = false,
  selectedActivity,
  isAvailable = false,
  currentUser,
  showControls = true,
  children, // Le composant de carte spécifique (Mapbox ou Standard)
}) => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');

  // Ajouter l'utilisateur actuel aux amis disponibles s'il est en mode disponible ET si la géolocalisation est active
  const allFriends = [...availableFriends];
  if (isAvailable && currentUser && userLocation && selectedActivity) {
    console.log('🔍 Ajout utilisateur à la carte:', {
      isAvailable,
      currentUser: currentUser?.uid || currentUser?.name,
      userLocation,
      selectedActivity,
    });
    const currentUserAsFriend = {
      id: currentUser.uid || 'current-user',
      name: currentUser.displayName || currentUser.name || 'Moi',
      avatar:
        currentUser.profilePicture ||
        currentUser.avatar ||
        currentUser.photoURL,
      activity: selectedActivity,
      lat: userLocation.lat,
      lng: userLocation.lng,
      location: { lat: userLocation.lat, lng: userLocation.lng },
      isCurrentUser: true,
    };
    allFriends.push(currentUserAsFriend);
    console.log('✅ Utilisateur ajouté comme ami:', currentUserAsFriend);
  } else {
    console.log('❌ Conditions non remplies pour marqueur utilisateur:', {
      isAvailable,
      hasCurrentUser: !!currentUser,
      hasUserLocation: !!userLocation,
      hasSelectedActivity: !!selectedActivity,
    });
  }

  // Nettoyer et filtrer les données des amis
  const sanitizedFriends = sanitizeFriendsData(allFriends);
  const filteredFriends = filterFriendsByActivity(
    sanitizedFriends,
    activityFilter
  );

  // Gestionnaire pour centrer sur l'utilisateur
  const handleCenterOnUser = () => {
    // Cette fonction sera fournie par le composant enfant via une ref ou callback
    if (children?.props?.onCenterUser) {
      children.props.onCenterUser();
    }
  };

  // Gestionnaire pour sélectionner un ami
  const handleFriendSelect = friend => {
    setSelectedFriend(friend);
  };

  // Fonction de déclinaison supprimée - plus de boutons Rejoindre/Décliner

  return (
    <div
      className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Carte - Le composant enfant gère l'affichage spécifique */}
      <div className="flex-1 relative">
        {React.cloneElement(children, {
          filteredFriends,
          userLocation,
          darkMode,
          selectedActivity,
          isAvailable,
          currentUser,
          onFriendSelect: handleFriendSelect,
          onCenterUser: handleCenterOnUser,
        })}

        {/* Contrôles sur la carte */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {/* Bouton filtres */}
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

            {/* Bouton centrer sur utilisateur */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCenterOnUser}
              className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
                darkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Crosshair size={20} />
            </motion.button>
          </div>
        )}

        {/* Panel de filtres */}
        <AnimatePresence>
          {showControls && showFilters && (
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
                {/* Bouton "Tous" */}
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
                  Tous ({sanitizedFriends.length})
                </button>

                {/* Boutons par activité */}
                {activities.map(activity => {
                  const count = sanitizedFriends.filter(
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

        {/* Détails de l'ami sélectionné - Positionné dans le conteneur de carte */}
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
                  {/* Avatar de l'ami - version corrigée */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-500 flex items-center justify-center border-2 border-white shadow-md">
                    {(() => {
                      // Gérer les multiples sources d'avatar
                      const avatarUrl =
                        selectedFriend.friend?.avatar ||
                        selectedFriend.avatar ||
                        selectedFriend.friend?.profilePicture ||
                        selectedFriend.profilePicture ||
                        selectedFriend.friend?.photoURL ||
                        selectedFriend.photoURL;

                      const friendName =
                        selectedFriend.friend?.name ||
                        selectedFriend.name ||
                        selectedFriend.friend?.displayName ||
                        selectedFriend.displayName ||
                        'Ami';

                      if (avatarUrl && avatarUrl.startsWith('http')) {
                        return (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={e => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = `<span class="text-white font-bold text-lg">${friendName.substring(0, 2).toUpperCase()}</span>`;
                            }}
                          />
                        );
                      } else {
                        return (
                          <span className="text-white font-bold text-lg">
                            {friendName.substring(0, 2).toUpperCase()}
                          </span>
                        );
                      }
                    })()}
                  </div>

                  {/* Informations de l'ami */}
                  <div>
                    <h3
                      className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {selectedFriend.friend?.name ||
                        selectedFriend.name ||
                        'Ami'}
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

                {/* Bouton fermer */}
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

              {/* Actions - SUPPRIMÉ le bouton Décliner */}
              <div className="flex items-center space-x-3">
                {/* Badge activité */}
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

                {/* Temps restant */}
                <div
                  className={`flex items-center space-x-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <Clock size={14} />
                  <span>{selectedFriend.timeLeft || 0} min restantes</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BaseMapView;
