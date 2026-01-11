// Écran de gestion des amis - MD3 Expressive
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  FlaskConical,
  Sparkles,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import { EventStatusService } from '../../services/eventStatusService';
import { showDevTools } from '../../utils/adminUtils';
import FriendListItem from '../common/FriendListItem';
import MD3Button from '../common/MD3Button';
import MD3Card from '../common/MD3Card';
import MD3FAB from '../common/MD3FAB';

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
    friendsStatuses: friendsStatusRaw,
    isLoading: statusLoading,
    error: statusError,
  } = useFriendsStatus(friends, user?.uid);

  // Protection contre friendsStatus undefined
  const friendsStatus = friendsStatusRaw || {};

  // Helper pour accès sécurisé aux statuts
  const getFriendStatus = friendId => friendsStatus?.[friendId] || null;

  // Filtrer les notifications d'amis non lues
  const getFriendInvitations = () => {
    if (!notifications) return [];

    return notifications.filter(notification => {
      return !notification.read && notification.type === 'friend_invitation';
    });
  };

  const friendInvitations = getFriendInvitations();

  const handleDebugStatuts = async () => {
    if (!user) return;

    console.log('🔍 DEBUG: Statut utilisateur actuel');

    try {
      const userStatus = await EventStatusService.getUserEventStatus(user.uid);

      console.log('👤 Utilisateur actuel:', user.displayName || user.uid);
      console.log('📊 eventStatus:', userStatus);
      console.log('🔍 isAvailable:', user.isAvailable);
      console.log('🎯 currentActivity:', user.currentActivity);
      console.log('📍 locationShared:', user.locationShared);

      // Nettoyer si incohérent
      if (
        userStatus === 'en_partage' &&
        (!user.isAvailable || !user.currentActivity)
      ) {
        console.log('🔧 CORRECTION: Statut incohérent détecté, nettoyage...');
        await EventStatusService.setUserEventStatus(user.uid, 'libre');
        alert('Statut nettoyé ! Actualisez la page.');
      } else {
        alert(`Statut actuel: ${userStatus}\nVoir console pour détails`);
      }
    } catch (error) {
      console.error('❌ Erreur debug:', error);
      alert('Erreur debug: ' + error.message);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 relative min-h-full bg-[var(--md-sys-color-surface)]">
      {/* Header avec bouton de notifications */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
          Mes amis
        </h2>
        <div className="flex items-center gap-3">
          {/* Bouton "Marquer notifications amis comme lues" */}
          {newFriendsNotificationsCount > 0 && (
            <MD3Button
              variant="tonal"
              size="small"
              onClick={onMarkAllFriendsNotificationsAsRead}
              icon={<Check size={16} />}
            >
              {newFriendsNotificationsCount} non lues
            </MD3Button>
          )}

          {/* Indicateur de statut des amis */}
          {statusLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full"
            />
          )}
        </div>
      </div>

      {/* Erreur statuts */}
      {statusError && (
        <MD3Card
          variant="filled"
          className="mb-4 bg-[var(--md-sys-color-error-container)]"
        >
          <p className="text-[var(--md-sys-color-on-error-container)] text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> Erreur statuts: {statusError}
          </p>
        </MD3Card>
      )}

      {/* Section Invitations d'amis - MD3 Style */}
      <AnimatePresence>
        {friendInvitations.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Sparkles
                size={20}
                className="text-[var(--md-sys-color-primary)]"
              />
              Invitations d'amitié
            </h3>
            <div className="space-y-4">
              {friendInvitations.map(notification => (
                <MD3Card
                  key={notification.id}
                  variant="outlined"
                  className="border-l-4 border-l-[var(--md-sys-color-tertiary)]"
                >
                  <p className="font-semibold mb-2 text-[var(--md-sys-color-on-surface)]">
                    {notification.message}
                  </p>
                  <p className="text-sm mb-4 text-[var(--md-sys-color-on-surface-variant)]">
                    {notification.createdAt?.toDate?.()?.toLocaleTimeString() ||
                      'Maintenant'}
                  </p>

                  {/* Boutons d'action pour les invitations d'amitié */}
                  {notification.data?.actions && (
                    <div className="flex gap-3">
                      <MD3Button
                        variant="filled"
                        onClick={() =>
                          onFriendInvitationResponse?.(
                            notification.data.invitationId,
                            'accepted',
                            notification.id
                          )
                        }
                        className="flex-1 bg-[var(--md-sys-color-success)]"
                        icon={<Check size={18} />}
                      >
                        Accepter
                      </MD3Button>
                      <MD3Button
                        variant="outlined"
                        onClick={() =>
                          onFriendInvitationResponse?.(
                            notification.data.invitationId,
                            'declined',
                            notification.id
                          )
                        }
                        className="flex-1"
                      >
                        Refuser
                      </MD3Button>
                    </div>
                  )}
                </MD3Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des amis - MD3 Style */}
      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
          },
        }}
      >
        {friends.map((friend, index) => (
          <motion.div
            key={friend.id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <FriendListItem
              friend={friend}
              status={getFriendStatus(friend.id)}
              onRemove={onRemoveFriend}
              darkMode={darkMode}
            />
          </motion.div>
        ))}

        {/* État vide - MD3 Style */}
        {friends.length === 0 && (
          <motion.div
            className="text-center py-16 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-24 h-24 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mb-6"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Users
                size={48}
                className="text-[var(--md-sys-color-on-primary-container)]"
              />
            </motion.div>
            <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-3">
              Aucun ami pour l'instant
            </h3>
            <p className="text-base text-[var(--md-sys-color-on-surface-variant)] max-w-[280px] mb-8">
              Ajoutez vos premiers amis pour commencer à partager vos
              disponibilités !
            </p>

            <MD3Button
              variant="filled"
              size="large"
              onClick={onAddFriend}
              icon={<UserPlus size={20} />}
            >
              Ajouter un ami
            </MD3Button>

            {/* Boutons de debug en mode développement */}
            {showDevTools(user) && (
              <MD3Card
                variant="outlined"
                className="mt-8 max-w-sm mx-auto bg-[var(--md-sys-color-warning-container)]"
              >
                <h4 className="font-semibold text-[var(--md-sys-color-on-warning-container)] mb-3 flex items-center gap-2">
                  <Wrench size={16} /> Outils de debug
                </h4>
                <div className="flex flex-wrap gap-2">
                  <MD3Button
                    variant="tonal"
                    size="small"
                    onClick={onCreateTestFriendships}
                    disabled={!isOnline}
                    icon={<FlaskConical size={14} />}
                  >
                    Test amitiés
                  </MD3Button>
                </div>
              </MD3Card>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* FAB - Ajouter un ami - MD3 Style */}
      <MD3FAB
        icon={<UserPlus size={24} />}
        onClick={onAddFriend}
        variant="primary"
        position="bottom-right"
        className="mb-16"
      />
    </div>
  );
};

export default FriendsScreen;
