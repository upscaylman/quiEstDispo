// Écran de gestion des notifications organisé par thèmes
import { motion } from 'framer-motion';
import { Bell, Check, Coffee, MapPin, Users } from 'lucide-react';
import React from 'react';

const NotificationsScreen = ({
  // Props de state
  notifications,
  darkMode,

  // Props de fonctions
  onFriendInvitationResponse,
  onActivityInvitationResponse,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}) => {
  // Organiser les notifications par thème
  const friendInvitations = notifications.filter(
    notif => notif.type === 'friend_invitation'
  );

  const activityInvitations = notifications.filter(
    notif => notif.type === 'invitation'
  );

  const activityResponses = notifications.filter(notif =>
    [
      'invitation_response',
      'activity_joined',
      'activity_declined',
      'activity_cancelled',
    ].includes(notif.type)
  );

  const otherNotifications = notifications.filter(
    notif =>
      ![
        'friend_invitation',
        'invitation',
        'invitation_response',
        'activity_joined',
        'activity_declined',
        'activity_cancelled',
      ].includes(notif.type)
  );

  // Fonction pour rendre une notification
  const renderNotification = notification => (
    <div
      key={notification.id}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow transition-all hover:shadow-md`}
    >
      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
              ❌ Décliner
            </motion.button>
          </div>
        )}

      {/* Boutons d'action pour les invitations d'activité */}
      {notification.type === 'invitation' && (
        <div className="flex space-x-2 mt-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onActivityInvitationResponse(notification, 'accepted')
            }
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ✅ Accepter
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onActivityInvitationResponse(notification, 'declined')
            }
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ❌ Décliner
          </motion.button>
        </div>
      )}

      {/* Bouton simple pour les autres types de notifications */}
      {notification.type !== 'friend_invitation' &&
        notification.type !== 'invitation' && (
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
  );

  // Fonction pour rendre une section de notifications
  const renderSection = (title, icon, notifications, color = 'blue') => {
    if (notifications.length === 0) return null;

    const Icon = icon;
    const colorClasses = {
      blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      green: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* Header de section */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon
              size={20}
              className={`${color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`}
            />
          </div>
          <h3
            className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {notifications.length}
          </span>
        </div>

        {/* Liste des notifications de cette section */}
        <div className="space-y-3">{notifications.map(renderNotification)}</div>
      </motion.div>
    );
  };

  return (
    <div className="px-responsive py-4">
      {/* Bouton "Tout supprimer" en haut */}
      {notifications.length > 0 && (
        <div className="flex justify-end mb-4">
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

      {/* Sections thématiques */}
      {notifications.length > 0 ? (
        <div className="space-y-6">
          {/* Section Demandes d'amitié */}
          {renderSection("Demandes d'amitié", Users, friendInvitations, 'blue')}

          {/* Section Invitations d'activités */}
          {renderSection(
            "Invitations d'activités",
            Coffee,
            activityInvitations,
            'green'
          )}

          {/* Section Réponses d'activités */}
          {renderSection(
            "Réponses d'activités",
            MapPin,
            activityResponses,
            'purple'
          )}

          {/* Section Autres notifications */}
          {renderSection(
            'Autres notifications',
            Bell,
            otherNotifications,
            'orange'
          )}
        </div>
      ) : (
        /* État vide */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div
            className={`mx-auto w-16 h-16 rounded-full mb-4 flex items-center justify-center ${
              darkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Bell
              size={32}
              className={darkMode ? 'text-gray-600' : 'text-gray-400'}
            />
          </div>
          <p
            className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Aucune notification
          </p>
          <p
            className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            Vous serez notifié ici pour les invitations et les mises à jour
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationsScreen;
