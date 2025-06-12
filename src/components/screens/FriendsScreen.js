// Écran de gestion des amis
import { motion } from 'framer-motion';
import { Check, UserMinus, UserPlus } from 'lucide-react';
import React from 'react';

const FriendsScreen = ({
  // Props de state
  friends,
  darkMode,
  isOnline,
  user,
  notifications,
  newFriendsNotificationsCount,

  // Props de fonctions
  onAddFriend,
  onRemoveFriend,
  onMarkAllFriendsNotificationsAsRead,
  onDebugFriends,
  onCreateTestFriendships,
  onLoadMockData,
}) => {
  return (
    <div className="p-4 px-6 relative min-h-full">
      {/* Header avec bouton de notifications uniquement */}
      <div className="flex items-center justify-between mb-4">
        {/* Bouton "Marquer notifications amis comme lues" */}
        {newFriendsNotificationsCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMarkAllFriendsNotificationsAsRead}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Check size={16} />
            Marquer notif. amis lues ({newFriendsNotificationsCount})
          </motion.button>
        )}

        {/* Spacer */}
        <div></div>
      </div>

      {/* Liste des amis */}
      <div className="space-y-3">
        {friends.map(friend => (
          <div
            key={friend.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 flex items-center shadow`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              {friend.avatar && friend.avatar.startsWith('http') ? (
                <img
                  src={friend.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl">{friend.avatar || '👤'}</span>
              )}
            </div>

            {/* Informations de l'ami */}
            <div className="flex-1">
              <h3
                className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {friend.name}
              </h3>
              <p
                className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {friend.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
              </p>
            </div>

            {/* Bouton de suppression */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRemoveFriend(friend.id, friend.name)}
              className={`p-2 rounded-full ${
                darkMode
                  ? 'bg-red-700 hover:bg-red-600 text-red-300'
                  : 'bg-red-100 hover:bg-red-200 text-red-600'
              } transition-colors ml-2`}
              title={`Supprimer ${friend.name} de vos amis`}
            >
              <UserMinus size={16} />
            </motion.button>
          </div>
        ))}

        {/* État vide */}
        {friends.length === 0 && (
          <div className="text-center py-8">
            <UserPlus
              size={48}
              className={`mx-auto mb-4 opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            />
            <p
              className={`text-lg mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
            >
              Aucun ami pour l'instant
            </p>
            <p
              className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Ajoutez vos premiers amis pour commencer !
            </p>

            {/* Boutons de debug en mode développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-3 mt-6 max-w-sm mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    🛠️ Outils de debug (développement)
                  </h4>
                  <p className="text-xs text-yellow-700 mb-3">
                    Des utilisateurs dans la base mais pas d'amis visibles ?
                  </p>

                  <div className="space-y-2">
                    {/* Debug Firebase */}
                    <button
                      onClick={onDebugFriends}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                      disabled={!isOnline}
                    >
                      🔍 Debug Firebase
                    </button>

                    {/* Créer amitiés de test */}
                    <button
                      onClick={onCreateTestFriendships}
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                      disabled={!isOnline}
                    >
                      🧪 Créer amitiés Firebase
                    </button>

                    {/* Charger données fictives */}
                    <button
                      onClick={onLoadMockData}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                    >
                      📊 Charger données fictives
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton flottant d'ajout d'ami */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddFriend}
        className={`fixed bottom-20 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-[60] ${
          darkMode
            ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
        } text-white`}
        title="Ajouter un ami"
      >
        <UserPlus size={24} />
      </motion.button>
    </div>
  );
};

export default FriendsScreen;
