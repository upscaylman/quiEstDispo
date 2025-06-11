// Écran de gestion des notifications
import { motion } from 'framer-motion';
import React from 'react';

const NotificationsScreen = ({
  // Props de state
  notifications,
  darkMode,

  // Props de fonctions
  onFriendInvitationResponse,
  onMarkNotificationAsRead,
}) => {
  return (
    <div className="p-4 px-6">
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
