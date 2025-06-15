// Écran de gestion des notifications avec nouvelle logique
import { motion } from 'framer-motion';
import { Bell, Coffee, MapPin, Trash2, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NotificationService } from '../../services/firebaseService';

const NotificationsScreen = ({
  // Props de state
  notifications,
  darkMode,

  // Props de fonctions
  onFriendInvitationResponse,
  onActivityInvitationResponse,
  onMarkNotificationAsRead, // Gardé pour compatibilité mais pas utilisé
  onMarkAllNotificationsAsRead, // Transformé en "tout supprimer"
}) => {
  const [swipedNotification, setSwipedNotification] = useState(null);
  const [deletingNotification, setDeletingNotification] = useState(null);
  // 🔧 FIX iPhone: État pour tracker les notifications en cours de traitement
  const [processingNotifications, setProcessingNotifications] = useState(
    new Set()
  );

  // Debug: Afficher les notifications reçues
  useEffect(() => {
    console.log(
      '🔔 NotificationsScreen - Notifications reçues:',
      notifications
    );
    console.log(
      '🔔 NotificationsScreen - Nombre de notifications:',
      notifications?.length || 0
    );
    if (notifications && notifications.length > 0) {
      console.log(
        '🔔 NotificationsScreen - Première notification:',
        notifications[0]
      );
    }
  }, [notifications]);

  // Marquer les notifications comme lues à la SORTIE du centre (comportement standard)
  useEffect(() => {
    let hasBeenMounted = false;

    // Marquer que le composant a été monté
    const timer = setTimeout(() => {
      hasBeenMounted = true;
    }, 100); // Petit délai pour s'assurer que le composant est bien monté

    // Fonction de nettoyage appelée quand le composant se démonte (sortie du centre)
    return () => {
      clearTimeout(timer);

      // Ne marquer comme lu que si le composant a été réellement monté et utilisé
      if (!hasBeenMounted) {
        console.log(
          '🐛 [DEBUG] Composant démonté trop rapidement, pas de marquage comme lu'
        );
        return;
      }

      const markAsReadOnExit = async () => {
        try {
          if (notifications.length > 0) {
            const userId = notifications[0].to;

            // Marquer TOUTES les notifications comme lues à la sortie (sauf celles déjà traitées)
            const notificationsToMarkAsRead = notifications.filter(
              notif => !notif.read
            );

            if (notificationsToMarkAsRead.length > 0) {
              // Marquer individuellement chaque notification
              for (const notif of notificationsToMarkAsRead) {
                await NotificationService.markAsRead(notif.id);
              }
              console.log(
                `✅ ${notificationsToMarkAsRead.length} notifications marquées comme lues à la sortie du centre`
              );
            }
          }
        } catch (error) {
          console.error('Erreur marquage à la sortie:', error);
        }
      };

      markAsReadOnExit();
    };
  }, []); // Pas de dépendances pour éviter les re-renders

  // Fonction pour trier les notifications par date (plus récentes en premier)
  const sortNotificationsByDate = notifications => {
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime; // Plus récentes en premier
    });
  };

  // Organiser les notifications par thème et les trier par date
  const friendInvitations = sortNotificationsByDate(
    notifications.filter(notif => notif.type === 'friend_invitation')
  );

  const friendNotifications = sortNotificationsByDate(
    notifications.filter(notif =>
      [
        'friend_invitation_accepted',
        'friend_added_confirmation',
        'friend_removed',
      ].includes(notif.type)
    )
  );

  const activityInvitations = sortNotificationsByDate(
    notifications.filter(notif => notif.type === 'invitation')
  );

  // 🐛 DEBUG: Logs pour débugger les invitations
  useEffect(() => {
    console.log('🐛 [DEBUG] NotificationsScreen - Analyse des invitations:');
    console.log('🐛 [DEBUG] Total notifications:', notifications.length);
    console.log(
      "🐛 [DEBUG] Invitations d'activité trouvées:",
      activityInvitations.length
    );

    if (activityInvitations.length > 0) {
      activityInvitations.forEach((invitation, index) => {
        console.log(`🐛 [DEBUG] Invitation ${index + 1}:`, {
          id: invitation.id,
          type: invitation.type,
          message: invitation.message,
          read: invitation.read,
          data: invitation.data,
          createdAt:
            invitation.createdAt?.toDate?.()?.toLocaleString() ||
            'Date invalide',
        });
      });
    } else {
      console.log("🐛 [DEBUG] ❌ Aucune invitation d'activité trouvée !");

      // Analyser tous les types de notifications présents
      const notificationTypes = notifications.map(n => n.type);
      const uniqueTypes = [...new Set(notificationTypes)];
      console.log('🐛 [DEBUG] Types de notifications présents:', uniqueTypes);

      // Afficher quelques notifications pour analyse
      if (notifications.length > 0) {
        console.log(
          '🐛 [DEBUG] Première notification pour analyse:',
          notifications[0]
        );
      }
    }
  }, [notifications, activityInvitations]);

  const activityResponses = sortNotificationsByDate(
    notifications.filter(notif =>
      [
        'invitation_response',
        'activity_accepted',
        'activity_declined',
        'activity_joined',
        'activity_cancelled',
        'activity_terminated',
      ].includes(notif.type)
    )
  );

  const otherNotifications = sortNotificationsByDate(
    notifications.filter(
      notif =>
        ![
          'friend_invitation',
          'friend_invitation_accepted',
          'friend_added_confirmation',
          'friend_removed',
          'invitation',
          'invitation_response',
          'activity_accepted',
          'activity_declined',
          'activity_joined',
          'activity_cancelled',
          'activity_terminated',
        ].includes(notif.type)
    )
  );

  // Supprimer une notification
  const handleDeleteNotification = async notificationId => {
    try {
      setDeletingNotification(notificationId);
      await NotificationService.deleteNotification(notificationId);
      setSwipedNotification(null);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    } finally {
      setDeletingNotification(null);
    }
  };

  // Gérer le swipe
  const handlePan = (event, info, notificationId) => {
    if (info.offset.x < -100) {
      setSwipedNotification(notificationId);
    } else if (info.offset.x > 50) {
      setSwipedNotification(null);
    }
  };

  // Fonction pour formater la date de manière lisible
  const formatNotificationDate = createdAt => {
    if (!createdAt) return 'Maintenant';

    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "À l'instant";
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Fonction pour rendre une notification avec gestes
  const renderNotification = notification => {
    const isRead = notification.read;
    const isSwiped = swipedNotification === notification.id;
    const isDeleting = deletingNotification === notification.id;

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -300 }}
        className="relative overflow-hidden"
      >
        {/* Arrière-plan rouge pour la suppression */}
        {isSwiped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 rounded-lg"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDeleteNotification(notification.id)}
              disabled={isDeleting}
              className="text-white p-2"
            >
              <Trash2 size={20} />
            </motion.button>
          </motion.div>
        )}

        {/* Contenu de la notification */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -150, right: 0 }}
          dragElastic={0.2}
          onPan={(event, info) => handlePan(event, info, notification.id)}
          data-notification={notification.id}
          className={`relative z-10 rounded-lg p-4 shadow transition-all cursor-grab active:cursor-grabbing ${
            isRead
              ? darkMode
                ? 'bg-gray-800/50 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200/50'
              : darkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
          } ${isSwiped ? 'transform -translate-x-20' : ''}`}
          style={{
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={`font-medium ${
                  isRead
                    ? darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                    : darkMode
                      ? 'text-white'
                      : 'text-gray-900'
                }`}
              >
                {notification.message}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isRead
                    ? darkMode
                      ? 'text-gray-600'
                      : 'text-gray-400'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                {formatNotificationDate(notification.createdAt)}
              </p>
            </div>

            {/* Indicateur de statut */}
            {!isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-3 mt-2 flex-shrink-0"></div>
            )}
          </div>

          {/* Boutons d'action pour les invitations d'amitié */}
          {(notification.type === 'friend_invitation' ||
            (notification.type === 'notification' &&
              notification.data?.actions?.includes('accept'))) &&
            !isRead && (
              <div className="flex space-x-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    // 🔧 FIX iPhone: Marquer immédiatement comme en traitement
                    setProcessingNotifications(
                      prev => new Set([...prev, notification.id])
                    );
                    try {
                      await onFriendInvitationResponse(
                        notification.data.invitationId,
                        'accepted',
                        notification.id
                      );
                    } finally {
                      setProcessingNotifications(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notification.id);
                        return newSet;
                      });
                    }
                  }}
                  disabled={processingNotifications.has(notification.id)}
                  className={`flex-1 ${
                    processingNotifications.has(notification.id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
                >
                  {processingNotifications.has(notification.id)
                    ? '⏳ ...'
                    : '✅ Accepter'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    // 🔧 FIX iPhone: Marquer immédiatement comme en traitement
                    setProcessingNotifications(
                      prev => new Set([...prev, notification.id])
                    );
                    try {
                      await onFriendInvitationResponse(
                        notification.data.invitationId,
                        'declined',
                        notification.id
                      );
                    } finally {
                      setProcessingNotifications(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notification.id);
                        return newSet;
                      });
                    }
                  }}
                  disabled={processingNotifications.has(notification.id)}
                  className={`flex-1 ${
                    processingNotifications.has(notification.id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
                >
                  {processingNotifications.has(notification.id)
                    ? '⏳ ...'
                    : '❌ Décliner'}
                </motion.button>
              </div>
            )}

          {/* Boutons d'action pour les invitations d'activité */}
          {notification.type === 'invitation' && !isRead && (
            <div className="flex space-x-2 mt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  // 🔧 FIX iPhone: Marquer immédiatement comme en traitement
                  setProcessingNotifications(
                    prev => new Set([...prev, notification.id])
                  );
                  try {
                    await onActivityInvitationResponse(
                      notification,
                      'accepted'
                    );
                  } finally {
                    setProcessingNotifications(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(notification.id);
                      return newSet;
                    });
                  }
                }}
                disabled={processingNotifications.has(notification.id)}
                className={`flex-1 ${
                  processingNotifications.has(notification.id)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
              >
                {processingNotifications.has(notification.id)
                  ? '⏳ ...'
                  : '✅ Accepter'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  // 🔧 FIX iPhone: Marquer immédiatement comme en traitement
                  setProcessingNotifications(
                    prev => new Set([...prev, notification.id])
                  );
                  try {
                    await onActivityInvitationResponse(
                      notification,
                      'declined'
                    );
                  } finally {
                    setProcessingNotifications(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(notification.id);
                      return newSet;
                    });
                  }
                }}
                disabled={processingNotifications.has(notification.id)}
                className={`flex-1 ${
                  processingNotifications.has(notification.id)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
              >
                {processingNotifications.has(notification.id)
                  ? '⏳ ...'
                  : '❌ Décliner'}
              </motion.button>
            </div>
          )}

          {/* Instructions de suppression pour les notifications lues */}
          {isRead && (
            <div className="mt-2">
              <p
                className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
              >
                Glissez vers la gauche pour supprimer
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // Fonction pour rendre une section de notifications
  const renderSection = (title, icon, notifications, color = 'blue') => {
    if (notifications.length === 0) return null;

    const Icon = icon;
    const unreadCount = notifications.filter(n => !n.read).length;

    const colorClasses = {
      blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      cyan: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
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
              className={`${
                color === 'blue'
                  ? 'text-blue-500'
                  : color === 'cyan'
                    ? 'text-cyan-500'
                    : color === 'green'
                      ? 'text-green-500'
                      : color === 'purple'
                        ? 'text-purple-500'
                        : 'text-orange-500'
              }`}
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
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
              {unreadCount} nouvelles
            </span>
          )}
          {/* Indicateur de date et heure */}
          <span
            className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} ml-auto`}
          >
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
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
                ? 'bg-red-700 hover:bg-red-600 text-red-300'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
          >
            <Trash2 size={16} />
            Tout supprimer
          </motion.button>
        </div>
      )}

      {/* Sections thématiques */}
      {notifications.length > 0 ? (
        <div className="space-y-6">
          {/* Section Demandes d'amitié */}
          {renderSection("Demandes d'amitié", Users, friendInvitations, 'blue')}

          {/* Section Notifications d'amis */}
          {renderSection('Amis', Users, friendNotifications, 'cyan')}

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
