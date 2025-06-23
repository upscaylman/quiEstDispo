// Service pour regroupement intelligent des notifications - Phase 4 Task 4.3
import { debugLog, prodError } from '../utils/logger';

export class NotificationGroupingService {
  /**
   * Groupe les notifications par événement et type
   * @param {Array} notifications - Liste des notifications
   * @returns {Array} - Notifications groupées
   */
  static groupNotificationsByEvent(notifications) {
    try {
      debugLog(
        `🎯 [NotificationGroupingService] Regroupement de ${notifications.length} notifications`
      );

      const grouped = {};

      notifications.forEach(notif => {
        // Grouper les invitations d'activité par activité
        if (notif.type === 'invitation' && notif.data?.activity) {
          const groupKey = `invitation_${notif.data.activity}`;

          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              type: 'grouped_invitation',
              activity: notif.data.activity,
              activityLabel: notif.data.activityLabel || notif.data.activity,
              notifications: [],
              senders: new Set(),
              count: 0,
              hasUnread: false,
              mostRecent: null,
              groupKey,
            };
          }

          grouped[groupKey].notifications.push(notif);
          grouped[groupKey].senders.add(notif.from);
          grouped[groupKey].count++;

          if (!notif.read) {
            grouped[groupKey].hasUnread = true;
          }

          // Garder la plus récente
          if (
            !grouped[groupKey].mostRecent ||
            (notif.createdAt?.toDate?.()?.getTime() || 0) >
              (grouped[groupKey].mostRecent.createdAt?.toDate?.()?.getTime() ||
                0)
          ) {
            grouped[groupKey].mostRecent = notif;
          }
        }
        // Grouper les invitations d'amitié
        else if (notif.type === 'friend_invitation') {
          const groupKey = 'friend_invitations';

          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              type: 'grouped_friend_invitation',
              notifications: [],
              senders: new Set(),
              count: 0,
              hasUnread: false,
              mostRecent: null,
              groupKey,
            };
          }

          grouped[groupKey].notifications.push(notif);
          grouped[groupKey].senders.add(notif.from);
          grouped[groupKey].count++;

          if (!notif.read) {
            grouped[groupKey].hasUnread = true;
          }

          if (
            !grouped[groupKey].mostRecent ||
            (notif.createdAt?.toDate?.()?.getTime() || 0) >
              (grouped[groupKey].mostRecent.createdAt?.toDate?.()?.getTime() ||
                0)
          ) {
            grouped[groupKey].mostRecent = notif;
          }
        }
        // Notifications individuelles (non groupables)
        else {
          const individualKey = `individual_${notif.id}`;
          grouped[individualKey] = {
            type: 'individual',
            notification: notif,
            mostRecent: notif,
            hasUnread: !notif.read,
            groupKey: individualKey,
          };
        }
      });

      // Trier par date de plus récente
      const sortedGroups = Object.values(grouped).sort((a, b) => {
        const aTime = a.mostRecent?.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.mostRecent?.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });

      debugLog(
        `🎯 [NotificationGroupingService] ✅ ${sortedGroups.length} groupes créés`
      );
      return sortedGroups;
    } catch (error) {
      prodError('❌ [NotificationGroupingService] Erreur regroupement:', error);
      return [];
    }
  }

  /**
   * Génère le message d'affichage pour un groupe
   * @param {Object} group - Groupe de notifications
   * @returns {string} - Message formaté
   */
  static generateGroupedMessage(group) {
    try {
      const sendersArray = Array.from(group.senders);

      // Messages pour invitations d'activité
      if (group.type === 'grouped_invitation') {
        const activityEmoji = {
          coffee: '☕',
          lunch: '🍽️',
          drinks: '🍷',
          chill: '😎',
          clubbing: '🎉',
          cinema: '🎬',
        };

        const emoji = activityEmoji[group.activity] || '🎉';

        if (sendersArray.length === 1) {
          return `${emoji} ${group.notifications[0].message}`;
        } else if (sendersArray.length === 2) {
          const firstSender =
            group.notifications.find(n => n.from === sendersArray[0])?.data
              ?.fromUserName || 'Un ami';
          const secondSender =
            group.notifications.find(n => n.from === sendersArray[1])?.data
              ?.fromUserName || 'Un ami';
          return `${emoji} ${firstSender} et ${secondSender} vous invitent pour ${group.activityLabel}`;
        } else {
          const firstSender =
            group.notifications[0]?.data?.fromUserName || 'Un ami';
          const otherCount = sendersArray.length - 1;
          return `${emoji} ${firstSender} et ${otherCount} autre${otherCount > 1 ? 's' : ''} vous invitent pour ${group.activityLabel}`;
        }
      }

      // Messages pour invitations d'amitié
      if (group.type === 'grouped_friend_invitation') {
        if (sendersArray.length === 1) {
          return `👥 ${group.notifications[0].message}`;
        } else if (sendersArray.length === 2) {
          const firstSender =
            group.notifications.find(n => n.from === sendersArray[0])?.data
              ?.fromUserName || 'Un ami';
          const secondSender =
            group.notifications.find(n => n.from === sendersArray[1])?.data
              ?.fromUserName || 'Un ami';
          return `👥 ${firstSender} et ${secondSender} veulent devenir vos amis`;
        } else {
          const firstSender =
            group.notifications[0]?.data?.fromUserName || 'Un ami';
          const otherCount = sendersArray.length - 1;
          return `👥 ${firstSender} et ${otherCount} autre${otherCount > 1 ? 's' : ''} veulent devenir vos amis`;
        }
      }

      // Message par défaut
      return group.notification?.message || 'Notification';
    } catch (error) {
      prodError(
        '❌ [NotificationGroupingService] Erreur génération message:',
        error
      );
      return 'Notification';
    }
  }

  /**
   * Obtient les détails des expéditeurs d'un groupe
   * @param {Object} group - Groupe de notifications
   * @returns {Array} - Détails des expéditeurs
   */
  static getGroupDetails(group) {
    try {
      if (group.type === 'individual') {
        return [
          {
            name: group.notification?.data?.fromUserName || 'Expéditeur',
            time: this.formatNotificationDate(group.notification?.createdAt),
            read: group.notification?.read || false,
            notificationId: group.notification?.id,
          },
        ];
      }

      const sendersArray = Array.from(group.senders);
      return sendersArray.map(senderId => {
        const notif = group.notifications.find(n => n.from === senderId);
        return {
          name: notif?.data?.fromUserName || 'Ami inconnu',
          time: this.formatNotificationDate(notif?.createdAt),
          read: notif?.read || false,
          notificationId: notif?.id,
          senderId,
        };
      });
    } catch (error) {
      prodError(
        '❌ [NotificationGroupingService] Erreur détails groupe:',
        error
      );
      return [];
    }
  }

  /**
   * Formate la date de notification
   * @param {*} createdAt - Date de création
   * @returns {string} - Date formatée
   */
  static formatNotificationDate(createdAt) {
    if (!createdAt) return 'Maintenant';

    try {
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
          year:
            date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch (error) {
      return 'Date invalide';
    }
  }

  /**
   * Obtient les statistiques d'un groupe
   * @param {Object} group - Groupe de notifications
   * @returns {Object} - Statistiques
   */
  static getGroupStats(group) {
    try {
      if (group.type === 'individual') {
        return {
          total: 1,
          unread: group.hasUnread ? 1 : 0,
          senders: 1,
        };
      }

      return {
        total: group.count,
        unread: group.notifications.filter(n => !n.read).length,
        senders: group.senders.size,
        activities:
          group.type === 'grouped_invitation' ? [group.activity] : null,
      };
    } catch (error) {
      prodError('❌ [NotificationGroupingService] Erreur stats groupe:', error);
      return { total: 0, unread: 0, senders: 0 };
    }
  }

  /**
   * Détermine si un groupe nécessite une action utilisateur
   * @param {Object} group - Groupe de notifications
   * @returns {boolean} - True si action requise
   */
  static groupRequiresAction(group) {
    try {
      if (group.type === 'individual') {
        const notif = group.notification;
        return (
          !notif.read &&
          ['friend_invitation', 'invitation'].includes(notif.type)
        );
      }

      return (
        group.hasUnread &&
        ['grouped_invitation', 'grouped_friend_invitation'].includes(group.type)
      );
    } catch (error) {
      prodError(
        '❌ [NotificationGroupingService] Erreur vérification action:',
        error
      );
      return false;
    }
  }

  /**
   * Filtre les groupes par type
   * @param {Array} groups - Liste des groupes
   * @param {string} type - Type à filtrer
   * @returns {Array} - Groupes filtrés
   */
  static filterGroupsByType(groups, type) {
    try {
      return groups.filter(group => {
        if (type === 'actionable') {
          return this.groupRequiresAction(group);
        }
        if (type === 'invitations') {
          return (
            ['grouped_invitation', 'grouped_friend_invitation'].includes(
              group.type
            ) ||
            (group.type === 'individual' &&
              ['friend_invitation', 'invitation'].includes(
                group.notification?.type
              ))
          );
        }
        return group.type === type;
      });
    } catch (error) {
      prodError('❌ [NotificationGroupingService] Erreur filtrage:', error);
      return [];
    }
  }
}
