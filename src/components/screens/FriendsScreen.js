// Écran de gestion des amis
import { motion } from 'framer-motion';
import { Check, UserMinus, UserPlus } from 'lucide-react';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import StatusBadge from '../StatusBadge';

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
  onFriendInvitationResponse,
  onDebugFriends,
  onCreateTestFriendships,
  onLoadMockData,
}) => {
  // 🎨 [PHASE 4] Hook pour les statuts temps réel
  const {
    friendsStatus,
    loading: statusLoading,
    error: statusError,
  } = useFriendsStatus(friends, user?.uid);

  // Filtrer les notifications d'amis non lues
  const getFriendInvitations = () => {
    if (!notifications) return [];

    return notifications.filter(notification => {
      return !notification.read && notification.type === 'friend_invitation';
    });
  };

  const friendInvitations = getFriendInvitations();

  return (
    <div className="px-responsive py-4 relative min-h-full">
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

        {/* 🎨 [PHASE 4] Indicateur de statut des amis */}
        {statusLoading && (
          <div
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            🔄 Actualisation statuts...
          </div>
        )}

        {/* Spacer */}
        <div></div>
      </div>

      {/* 🎨 [PHASE 4] Erreur statuts */}
      {statusError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm">
            ⚠️ Erreur statuts: {statusError}
          </p>
        </div>
      )}

      {/* Section Invitations d'amis */}
      {friendInvitations.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}
          >
            🤝 Invitations d'amitié
          </h3>
          <div className="space-y-3">
            {friendInvitations.map(notification => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}
              >
                <p
                  className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {notification.message}
                </p>
                <p
                  className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {notification.createdAt?.toDate?.()?.toLocaleTimeString() ||
                    'Maintenant'}
                </p>

                {/* Boutons d'action pour les invitations d'amitié */}
                {notification.data?.actions && (
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onFriendInvitationResponse?.(
                          notification.data.invitationId,
                          'accepted',
                          notification.id
                        )
                      }
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      ✅ Accepter
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onFriendInvitationResponse?.(
                          notification.data.invitationId,
                          'declined',
                          notification.id
                        )
                      }
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      ❌ Refuser
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Liste des amis */}
      <div className="space-y-3">
        {friends.map(friend => (
          <div
            key={friend.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 flex items-center shadow`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              {friend.avatar &&
              (friend.avatar.startsWith('http') ||
                friend.avatar.startsWith('data:')) ? (
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
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {friend.name}
                </h3>
                {/* 🎨 [PHASE 4] Badge de statut temps réel */}
                {friendsStatus[friend.id] && (
                  <StatusBadge
                    status={friendsStatus[friend.id].status}
                    message={friendsStatus[friend.id].message}
                    color={friendsStatus[friend.id].color}
                    size="xs"
                    showIcon={false}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {friend.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                </p>
                {/* 🎨 [PHASE 4] Indicateur de disponibilité pour invitation */}
                {friendsStatus[friend.id] && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      friendsStatus[friend.id].available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {friendsStatus[friend.id].available
                      ? '✓ Invitable'
                      : '✗ Occupé'}
                  </span>
                )}
              </div>
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
        className={`fixed bottom-20 right-4 sm:right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-[60] ${
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
