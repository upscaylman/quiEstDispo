// Écran de gestion des notifications
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import React from 'react';

const NotificationsScreen = ({
  // Props de state
  notifications,
  darkMode,

  // Props de fonctions
  onFriendInvitationResponse,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}) => {
  return (
    <div className="p-4 px-6">
      {/* Header avec bouton "Tout supprimer" */}
      {notifications.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Notifications ({notifications.length})
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMarkAllNotificationsAsRead}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Check size={16} />
            Tout supprimer
          </motion.button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow`}
          >
            <p
              className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {notification.message}
            </p>
            <p
              className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {notification.createdAt?.toDate?.()?.toLocaleTimeString() ||
                'Maintenant'}
            </p>

            {/* Boutons d'action pour les invitations d'amitié */}
            {notification.type === 'friend_invitation' &&
              notification.data?.actions && (
                <div className="flex space-x-2 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      onFriendInvitationResponse(
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
                      onFriendInvitationResponse(
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

            {/* Bouton simple pour les autres types de notifications */}
            {notification.type !== 'friend_invitation' && (
              <div className="mt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onMarkNotificationAsRead(notification.id)}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Marquer comme lu
                </motion.button>
              </div>
            )}
          </div>
        ))}

        {/* État vide */}
        {notifications.length === 0 && (
          <div className="text-center py-8">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Aucune notification
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
