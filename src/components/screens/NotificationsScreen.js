// Écran de gestion des notifications - Design moderne MD3 Expressive
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Coffee,
  Flag,
  MapPin,
  PartyPopper,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NotificationService } from '../../services/firebaseService';

// Configuration des types de notifications avec icônes et couleurs
const NOTIFICATION_CONFIG = {
  friend_invitation: {
    icon: Users,
    color: 'blue',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-900/20',
    iconColor: 'text-blue-500',
    label: "Demande d'ami",
  },
  invitation: {
    icon: Coffee,
    color: 'green',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-900/20',
    iconColor: 'text-green-500',
    label: 'Invitation',
  },
  invitation_sent: {
    icon: Send,
    color: 'blue',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-900/20',
    iconColor: 'text-blue-500',
    label: 'Invitation envoyée',
  },
  friend_invitation_accepted: {
    icon: CheckCheck,
    color: 'cyan',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-900/20',
    iconColor: 'text-cyan-500',
    label: 'Ami accepté',
  },
  friend_added_confirmation: {
    icon: CheckCheck,
    color: 'cyan',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-900/20',
    iconColor: 'text-cyan-500',
    label: 'Ami ajouté',
  },
  activity_accepted: {
    icon: Check,
    color: 'emerald',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-900/20',
    iconColor: 'text-emerald-500',
    label: 'Accepté',
  },
  activity_accepted_start_timer: {
    icon: PartyPopper,
    color: 'emerald',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-900/20',
    iconColor: 'text-emerald-500',
    label: 'Activité démarrée',
  },
  activity_joined: {
    icon: PartyPopper,
    color: 'emerald',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-900/20',
    iconColor: 'text-emerald-500',
    label: 'Rejoint',
  },
  activity_declined: {
    icon: X,
    color: 'red',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-900/20',
    iconColor: 'text-red-400',
    label: 'Décliné',
  },
  activity_cancelled: {
    icon: X,
    color: 'red',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-900/20',
    iconColor: 'text-red-400',
    label: 'Annulé',
  },
  activity_terminated: {
    icon: Flag,
    color: 'orange',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-900/20',
    iconColor: 'text-orange-500',
    label: 'Terminé',
  },
  invitation_expired: {
    icon: Clock,
    color: 'gray',
    bgLight: 'bg-gray-50',
    bgDark: 'bg-gray-800',
    iconColor: 'text-gray-400',
    label: 'Expiré',
  },
  invitation_response: {
    icon: Check,
    color: 'purple',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-900/20',
    iconColor: 'text-purple-500',
    label: 'Réponse',
  },
  friend_stopped_sharing: {
    icon: MapPin,
    color: 'orange',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-900/20',
    iconColor: 'text-orange-500',
    label: 'Partage terminé',
  },
  default: {
    icon: Bell,
    color: 'gray',
    bgLight: 'bg-gray-50',
    bgDark: 'bg-gray-800',
    iconColor: 'text-gray-500',
    label: 'Notification',
  },
};

const NotificationsScreen = ({
  notifications,
  darkMode,
  pendingInvitation,
  onCancelInvitations,
  onFriendInvitationResponse,
  onActivityInvitationResponse,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onNavigateToHome, // Pour naviguer vers l'accueil quand on clique sur une invitation_sent
}) => {
  const [processingIds, setProcessingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, unread, invitations

  // Debug logs
  useEffect(() => {
    console.log('🔔 NotificationsScreen - Reçu:', notifications?.length || 0);
  }, [notifications]);

  // Marquer automatiquement les notifications informatives comme lues
  useEffect(() => {
    const markInfoNotificationsAsRead = async () => {
      if (!notifications?.length) return;

      const infoTypes = [
        'friend_stopped_sharing',
        'friend_invitation_accepted',
        'friend_added_confirmation',
        'invitation_response',
        'activity_accepted',
        'activity_declined',
      ];
      const unreadInfo = notifications.filter(
        n => infoTypes.includes(n.type) && !n.read
      );

      for (const notif of unreadInfo) {
        try {
          await NotificationService.markAsRead(notif.id);
        } catch (error) {
          console.error('Erreur marquage auto:', error);
        }
      }
    };

    const timer = setTimeout(markInfoNotificationsAsRead, 1500);
    return () => clearTimeout(timer);
  }, [notifications]);

  // Obtenir la config d'une notification
  const getConfig = useCallback(type => {
    return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;
  }, []);

  // Formater la date
  const formatDate = useCallback(createdAt => {
    if (!createdAt) return 'Maintenant';

    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  // Supprimer une notification
  const handleDelete = async id => {
    setDeletingIds(prev => new Set([...prev, id]));
    try {
      await NotificationService.deleteNotification(id);
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Supprimer toutes les notifications (sauf invitations en attente)
  const handleDeleteAll = async () => {
    const toDelete = (notifications || []).filter(
      n => !['friend_invitation', 'invitation'].includes(n.type) || n.read
    );

    for (const notif of toDelete) {
      await handleDelete(notif.id);
    }
  };

  // Répondre à une invitation
  const handleResponse = async (notification, response, type = 'activity') => {
    setProcessingIds(prev => new Set([...prev, notification.id]));

    try {
      if (type === 'friend') {
        await onFriendInvitationResponse(
          notification.data?.invitationId,
          response,
          notification.id
        );
      } else {
        await onActivityInvitationResponse(notification, response);
      }
    } catch (error) {
      console.error('Erreur réponse:', error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  // Filtrer les notifications
  const filteredNotifications = (notifications || []).filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'invitations')
      return ['friend_invitation', 'invitation', 'invitation_sent'].includes(
        n.type
      );
    return true;
  });

  // Trier par date (plus récentes en premier)
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
    const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
    return bTime - aTime;
  });

  // Séparer les invitations en attente des autres
  const pendingInvitations = sortedNotifications.filter(
    n => ['friend_invitation', 'invitation'].includes(n.type) && !n.read
  );
  const otherNotifications = sortedNotifications.filter(
    n => !(['friend_invitation', 'invitation'].includes(n.type) && !n.read)
  );

  // Compter les non lues
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  // Rendu d'une notification
  const renderNotification = (notification, isPending = false) => {
    const config = getConfig(notification.type);
    const Icon = config.icon;
    const isProcessing = processingIds.has(notification.id);
    const isDeleting = deletingIds.has(notification.id);
    const isRead = notification.read;
    const isInvitationSent = notification.type === 'invitation_sent';

    // Gestionnaire de clic pour les notifications invitation_sent
    const handleNotificationClick = () => {
      if (isInvitationSent && onNavigateToHome) {
        onNavigateToHome();
      }
    };

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: isDeleting ? 0 : 1,
          y: 0,
          scale: 1,
          x: isDeleting ? -100 : 0,
        }}
        exit={{ opacity: 0, x: -100, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleNotificationClick}
        className={`
          relative overflow-hidden rounded-2xl mb-3
          ${isInvitationSent ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}
          ${
            isPending
              ? darkMode
                ? 'bg-gradient-to-r from-gray-800 to-gray-750 border border-gray-700'
                : 'bg-white border border-gray-200 shadow-sm'
              : darkMode
                ? 'bg-gray-800/50'
                : 'bg-gray-50'
          }
        `}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icône avec background coloré */}
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${darkMode ? config.bgDark : config.bgLight}
              `}
            >
              <Icon size={20} className={config.iconColor} />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Label type */}
                  <span className={`text-xs font-medium ${config.iconColor}`}>
                    {config.label}
                  </span>

                  {/* Message */}
                  <p
                    className={`
                    mt-0.5 text-sm leading-relaxed
                    ${
                      isRead
                        ? darkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                        : darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }
                  `}
                  >
                    {notification.message}
                  </p>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock
                      size={12}
                      className={darkMode ? 'text-gray-500' : 'text-gray-400'}
                    />
                    <span
                      className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Indicateur non lu / Bouton supprimer */}
                <div className="flex items-center gap-2">
                  {!isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  )}

                  {!isPending && (
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={isDeleting}
                      className={`
                        p-1.5 rounded-full transition-colors
                        ${
                          darkMode
                            ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                        }
                      `}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Boutons d'action pour invitations */}
              {isPending && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      handleResponse(
                        notification,
                        'accepted',
                        notification.type === 'friend_invitation'
                          ? 'friend'
                          : 'activity'
                      )
                    }
                    disabled={isProcessing}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl font-medium text-sm
                      flex items-center justify-center gap-2 transition-all
                      ${
                        isProcessing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 active:scale-95'
                      }
                      text-white
                    `}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        Accepter
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleResponse(
                        notification,
                        'declined',
                        notification.type === 'friend_invitation'
                          ? 'friend'
                          : 'activity'
                      )
                    }
                    disabled={isProcessing}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl font-medium text-sm
                      flex items-center justify-center gap-2 transition-all
                      ${
                        isProcessing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }
                      active:scale-95
                    `}
                  >
                    <X size={16} />
                    Décliner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header sticky avec filtres */}
      <div
        className="sticky top-[72px] z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          background: darkMode
            ? 'rgba(17, 24, 39, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Stats rapides */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${
                unreadCount > 0
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-600'
              }
            `}
            >
              {unreadCount > 0
                ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}`
                : 'Tout lu ✓'}
            </div>
          </div>

          {otherNotifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-colors
                ${
                  darkMode
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }
              `}
            >
              <Trash2 size={14} />
              Tout effacer
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'unread', label: 'Non lues' },
            { id: 'invitations', label: 'Invitations' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  filter === f.id
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="popLayout">
          {/* Section Invitations en attente (reçues) */}
          {pendingInvitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h3
                  className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  En attente de réponse ({pendingInvitations.length})
                </h3>
              </div>

              {pendingInvitations.map(n => renderNotification(n, true))}
            </motion.div>
          )}

          {/* Autres notifications */}
          {otherNotifications.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {pendingInvitations.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Clock
                    size={16}
                    className={darkMode ? 'text-gray-500' : 'text-gray-400'}
                  />
                  <h3
                    className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Historique
                  </h3>
                </div>
              )}

              {otherNotifications.map(n => renderNotification(n, false))}
            </motion.div>
          )}

          {/* État vide */}
          {sortedNotifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div
                className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-4
                ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
              `}
              >
                <BellOff
                  size={32}
                  className={darkMode ? 'text-gray-600' : 'text-gray-400'}
                />
              </div>

              <h3
                className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {filter === 'all'
                  ? 'Aucune notification'
                  : filter === 'unread'
                    ? 'Tout est lu !'
                    : 'Aucune invitation'}
              </h3>

              <p
                className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {filter === 'all'
                  ? 'Les nouvelles notifications apparaîtront ici'
                  : 'Changez de filtre pour voir plus'}
              </p>

              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium"
                >
                  Voir toutes
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsScreen;
