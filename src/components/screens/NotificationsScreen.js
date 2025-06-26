// Écran de gestion des notifications avec logique de regroupement intelligent
import { motion } from 'framer-motion';
import { Bell, Coffee, MapPin, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationService } from '../../services/firebaseService';
import { NotificationGroupingService } from '../../services/notificationGroupingService';

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

  // 🔥 MARQUER AUTOMATIQUEMENT LES NOTIFICATIONS DE DÉPART COMME LUES
  useEffect(() => {
    const markDepartureNotificationsAsRead = async () => {
      if (!notifications || notifications.length === 0) return;

      // Trouver les notifications de départ non lues
      const unreadDepartureNotifications = notifications.filter(
        notif => ['friend_stopped_sharing'].includes(notif.type) && !notif.read
      );

      if (unreadDepartureNotifications.length === 0) return;

      console.log(
        `📢 [AUTO-READ] Marquage automatique de ${unreadDepartureNotifications.length} notifications de départ comme lues`
      );

      // Marquer chaque notification comme lue
      for (const notification of unreadDepartureNotifications) {
        try {
          await NotificationService.markAsRead(notification.id);
          console.log(
            `📢 [AUTO-READ] ✅ Notification ${notification.id} marquée comme lue`
          );
        } catch (error) {
          console.error(
            `📢 [AUTO-READ] ❌ Erreur marquage ${notification.id}:`,
            error
          );
        }
      }
    };

    // Marquer les notifications avec un délai pour éviter les spams
    const timeoutId = setTimeout(markDepartureNotificationsAsRead, 1000);
    return () => clearTimeout(timeoutId);
  }, [notifications]);

  // Grouper les notifications avec protection d'erreur
  const groupedNotifications =
    notifications && notifications.length > 0
      ? NotificationGroupingService.groupNotificationsByEvent(notifications)
      : [];

  // 🎯 PHASE 4 - TASK 4.3: Fonctions de regroupement déplacées dans le service
  const generateGroupedMessage = group => {
    return NotificationGroupingService.generateGroupedMessage(group);
  };

  const getGroupDetails = group => {
    return NotificationGroupingService.getGroupDetails(group);
  };

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
    (notifications || []).filter(notif => notif.type === 'friend_invitation')
  );

  const friendNotifications = sortNotificationsByDate(
    (notifications || []).filter(notif =>
      [
        'friend_invitation_accepted',
        'friend_added_confirmation',
        'friend_removed',
      ].includes(notif.type)
    )
  );

  const activityInvitations = sortNotificationsByDate(
    (notifications || []).filter(notif => notif.type === 'invitation')
  );

  // 🐛 DEBUG: Logs pour débugger les invitations
  useEffect(() => {
    console.log('🐛 [DEBUG] NotificationsScreen - Analyse des invitations:');
    console.log('🐛 [DEBUG] Total notifications:', notifications?.length || 0);
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
      const notificationTypes = (notifications || []).map(n => n.type);
      const uniqueTypes = [...new Set(notificationTypes)];
      console.log('🐛 [DEBUG] Types de notifications présents:', uniqueTypes);

      // Afficher quelques notifications pour analyse
      if (notifications && notifications.length > 0) {
        console.log(
          '🐛 [DEBUG] Première notification pour analyse:',
          notifications[0]
        );
      }
    }

    // 🎯 DEBUG: Notifications groupées
    console.log('🎯 [DEBUG] Notifications groupées:', groupedNotifications);
  }, [notifications, activityInvitations, groupedNotifications]);

  const activityResponses = sortNotificationsByDate(
    (notifications || []).filter(notif =>
      [
        'invitation_response',
        'activity_accepted',
        'activity_declined',
        'activity_joined',
        'activity_cancelled',
        'activity_terminated',
        'friend_stopped_sharing', // 🔔 Notifications d'arrêt de partage par d'autres utilisateurs
      ].includes(notif.type)
    )
  );

  const otherNotifications = sortNotificationsByDate(
    (notifications || []).filter(
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

  // Supprimer une notification avec animation Instagram-style
  const handleDeleteNotification = async notificationId => {
    try {
      setDeletingNotification(notificationId);
      // Animation rapide et directe
      setTimeout(async () => {
        await NotificationService.deleteNotification(notificationId);
        setSwipedNotification(null);
      }, 100);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      setSwipedNotification(null);
    } finally {
      setDeletingNotification(null);
    }
  };

  // 🎯 PHASE 4: Répondre à un groupe d'invitations
  const handleGroupInvitationResponse = async (group, response) => {
    // Protection contre les données invalides
    if (!group || !group.notifications || !Array.isArray(group.notifications)) {
      console.error(
        '🚨 [NotificationsScreen] Groupe invalide pour réponse:',
        group
      );
      return;
    }

    setProcessingNotifications(prev => {
      const newSet = new Set(prev);
      group.notifications.forEach(notif => newSet.add(notif.id));
      return newSet;
    });

    try {
      // Répondre à toutes les invitations du groupe
      for (const notification of group.notifications) {
        if (!notification.read) {
          await onActivityInvitationResponse(notification, response);
        }
      }
    } finally {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        group.notifications.forEach(notif => newSet.delete(notif.id));
        return newSet;
      });
    }
  };

  // Supprimer toutes les notifications SAUF les invitations
  const handleDeleteAllNonInvitations = async () => {
    try {
      const notificationsToDelete = (notifications || []).filter(
        n => !['friend_invitation', 'invitation'].includes(n.type)
      );

      for (const notif of notificationsToDelete) {
        await NotificationService.deleteNotification(notif.id);
      }
    } catch (error) {
      console.error('Erreur suppression en masse:', error);
    }
  };

  // Gérer le swipe Instagram-style : révéler les boutons d'action
  const handlePan = (event, info, notificationId) => {
    const offsetX = Number(info?.offset?.x) || 0;

    // Trouver la notification pour vérifier son type
    const notification = (notifications || []).find(
      n => n.id === notificationId
    );

    // Ne pas permettre le swipe pour les invitations
    if (
      notification &&
      ['friend_invitation', 'invitation'].includes(notification.type)
    ) {
      return;
    }

    // Swipe Instagram : révéler les boutons si swipe > 60px vers la gauche
    if (offsetX < -60) {
      setSwipedNotification(notificationId);
    } else if (offsetX > -20) {
      // Reset si on revient vers la position initiale
      setSwipedNotification(null);
    }
  };

  // Fonction pour formater la date de manière lisible
  const formatNotificationDate = createdAt => {
    if (!createdAt) return 'Maintenant';

    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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

  // 🎯 PHASE 4: Rendu d'une notification individuelle (ancien système)
  const renderNotification = notification => {
    const isRead = notification.read;
    const isSwiped = swipedNotification === notification.id;
    const isDeleting = deletingNotification === notification.id;
    const isProcessing = processingNotifications.has(notification.id);

    // Ne pas afficher les notifications en cours de traitement pour éviter les doublons
    if (isProcessing) {
      return null;
    }

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -300 }}
        className="relative overflow-hidden"
      >
        {/* Bouton d'action révélé lors du swipe - Style Instagram */}
        {/* Ne pas afficher le bouton supprimer pour les invitations */}
        {!['friend_invitation', 'invitation'].includes(notification.type) && (
          <div
            className={`absolute right-0 top-0 h-full flex items-center justify-center transition-all duration-100 ${
              isSwiped ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
          >
            {/* Bouton Supprimer */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDeleteNotification(notification.id)}
              disabled={isDeleting}
              className="bg-red-500 text-white p-2 rounded-full shadow-lg"
            >
              <Trash2 size={14} />
            </motion.button>
          </div>
        )}

        {/* Contenu de la notification */}
        <motion.div
          drag={
            ['friend_invitation', 'invitation'].includes(notification.type)
              ? false
              : 'x'
          }
          dragConstraints={{ left: -48, right: 0 }}
          dragElastic={0}
          onPan={(event, info) => handlePan(event, info, notification.id)}
          animate={{
            x: isSwiped ? -48 : 0,
          }}
          transition={{
            duration: 0.1,
            ease: 'linear',
          }}
          data-notification={notification.id}
          className={`relative z-10 rounded-lg p-4 shadow-sm transition-all ${
            ['friend_invitation', 'invitation'].includes(notification.type)
              ? 'cursor-default'
              : 'cursor-grab active:cursor-grabbing'
          } ${
            isRead
              ? darkMode
                ? 'bg-gray-800/50 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200/50'
              : darkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
          }`}
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
        </motion.div>
      </motion.div>
    );
  };

  // 🎯 PHASE 4: Rendu d'un groupe de notifications
  const renderGroupedNotification = group => {
    // Protection contre les données invalides
    if (!group || !group.notifications || !Array.isArray(group.notifications)) {
      console.warn('🚨 [NotificationsScreen] Groupe invalide:', group);
      return null;
    }

    const isProcessing = group.notifications.some(notif =>
      processingNotifications.has(notif.id)
    );

    return (
      <motion.div
        key={`group_${group.activity}_${group.notifications[0]?.id}`}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -300 }}
        className="relative overflow-hidden"
      >
        <motion.div
          className={`p-4 rounded-lg transition-all ${
            group.hasUnread
              ? darkMode
                ? 'bg-gray-700 border-l-4 border-blue-500'
                : 'bg-blue-50 border-l-4 border-blue-400'
              : darkMode
                ? 'bg-gray-800'
                : 'bg-gray-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={`font-medium ${
                  group.hasUnread
                    ? darkMode
                      ? 'text-white'
                      : 'text-gray-900'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                }`}
              >
                {generateGroupedMessage(group)}
              </p>

              {/* Détails des expéditeurs */}
              <div className="mt-2 space-y-1">
                {getGroupDetails(group).map((sender, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={`${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {sender.name}
                    </span>
                    <span
                      className={`${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {sender.time}
                    </span>
                  </div>
                ))}
              </div>

              <p
                className={`text-sm mt-2 ${
                  group.hasUnread
                    ? darkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                    : darkMode
                      ? 'text-gray-600'
                      : 'text-gray-400'
                }`}
              >
                {group.count} invitation{group.count > 1 ? 's' : ''} •{' '}
                {formatNotificationDate(group.mostRecent?.createdAt)}
              </p>
            </div>

            {/* Indicateur de statut */}
            {group.hasUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-3 mt-2 flex-shrink-0"></div>
            )}
          </div>

          {/* Boutons d'action pour invitations groupées */}
          {group.hasUnread && (
            <div className="flex space-x-2 mt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGroupInvitationResponse(group, 'accepted')}
                disabled={isProcessing}
                className={`flex-1 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
              >
                {isProcessing ? '⏳ ...' : `✅ Accepter tout (${group.count})`}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGroupInvitationResponse(group, 'declined')}
                disabled={isProcessing}
                className={`flex-1 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white py-2 px-4 rounded-lg font-medium transition-colors`}
              >
                {isProcessing ? '⏳ ...' : `❌ Tout décliner`}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // Fonction pour rendre une section de notifications
  const renderSection = (
    title,
    icon,
    notifications,
    color = 'blue',
    useGrouping = false
  ) => {
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

    // Si le regroupement est activé, utiliser les groupes
    const itemsToRender = useGrouping
      ? NotificationGroupingService.groupNotificationsByEvent(notifications)
      : notifications;

    const renderFunction = useGrouping
      ? renderGroupedNotification
      : renderNotification;

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
        <div className="space-y-3">{itemsToRender.map(renderFunction)}</div>
      </motion.div>
    );
  };

  return (
    <div className="px-responsive py-4">
      {/* Instructions d'utilisation pour mobile */}
      {notifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}
        >
          ← Glissez vers la gauche pour révéler les actions
        </motion.div>
      )}

      {/* Bouton "Tout supprimer" en haut - seulement pour les notifications supprimables */}
      {(notifications || []).filter(
        n => !['friend_invitation', 'invitation'].includes(n.type)
      ).length > 0 && (
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDeleteAllNonInvitations}
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
      {notifications && notifications.length > 0 ? (
        <div className="space-y-6">
          {/* Section Demandes d'amitié */}
          {renderSection("Demandes d'amitié", Users, friendInvitations, 'blue')}

          {/* Section Notifications d'amis */}
          {renderSection('Amis', Users, friendNotifications, 'cyan')}

          {/* Section Invitations d'activités - AVEC REGROUPEMENT */}
          {renderSection(
            "Invitations d'activités",
            Coffee,
            activityInvitations,
            'green',
            true // ✅ Activer le regroupement pour les invitations d'activités
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
