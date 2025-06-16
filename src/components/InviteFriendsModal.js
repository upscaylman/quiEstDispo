import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Coffee,
  Film,
  Music,
  Users,
  Utensils,
  Wine,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const InviteFriendsModal = ({
  isOpen,
  onClose,
  onSendInvitations,
  activity,
  friends = [],
  notifications = [],
  darkMode = false,
}) => {
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(activity);

  useEffect(() => {
    if (isOpen) {
      setSelectedActivity(activity);
    }
  }, [isOpen, activity]);

  const activities = {
    coffee: { label: 'Coffee', icon: Coffee, color: 'bg-amber-500' },
    lunch: { label: 'Lunch', icon: Utensils, color: 'bg-green-500' },
    drinks: { label: 'Drinks', icon: Wine, color: 'bg-purple-500' },
    chill: { label: 'Chill', icon: Users, color: 'bg-blue-500' },
    clubbing: { label: 'Clubbing', icon: Music, color: 'bg-pink-500' },
    cinema: { label: 'Cinema', icon: Film, color: 'bg-indigo-500' },
  };

  const currentActivity = selectedActivity
    ? activities[selectedActivity]
    : null;
  const Icon = currentActivity?.icon;

  // 🔥 NOUVEAU BUG #2 FIX: Calculer les amis avec relations bilatérales à exclure
  const friendsWithBilateralRelations = new Set();

  // Parcourir les notifications pour identifier les relations bilatérales
  notifications.forEach(notif => {
    if (
      notif.type === 'invitation' &&
      notif.data?.activity === selectedActivity &&
      !notif.read
    ) {
      // Si on a reçu une invitation pour cette activité, on ne peut pas réinviter cette personne
      friendsWithBilateralRelations.add(notif.from);
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `🚫 [DEBUG] Exclusion bilatérale: ${notif.from} (nous a invités pour ${selectedActivity})`
        );
      }
    }
  });

  // 🔥 NOUVEAU: Également exclure les amis à qui on a déjà envoyé une invitation en attente
  // (pour éviter les doublons même si l'autre n'a pas encore répondu)
  notifications.forEach(notif => {
    if (
      notif.type === 'invitation_sent' &&
      notif.data?.activity === selectedActivity &&
      !notif.read
    ) {
      // Si on a envoyé une invitation en attente, ne pas permettre de réinviter
      friendsWithBilateralRelations.add(notif.to);
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `🚫 [DEBUG] Exclusion invitation en attente: ${notif.to} (on lui a déjà envoyé pour ${selectedActivity})`
        );
      }
    }
  });

  const friendsWhoInvitedUs = new Set(
    notifications
      .filter(notif => {
        const isInvitation = notif.type === 'invitation';
        const sameActivity = notif.data?.activity === selectedActivity;
        const unread = !notif.read;

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [DEBUG] Notification check:`, {
            id: notif.id,
            type: notif.type,
            isInvitation,
            notifActivity: notif.data?.activity,
            currentActivity: selectedActivity,
            sameActivity,
            unread,
            shouldGray: isInvitation && sameActivity && unread,
          });
        }

        return (
          isInvitation &&
          sameActivity &&
          unread &&
          !friendsWithBilateralRelations.has(notif.from)
        );
      })
      .map(notif => notif.from)
  );

  const toggleFriend = friendId => {
    if (friendsWhoInvitedUs.has(friendId)) {
      return;
    }

    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSendInvitations = async () => {
    if (!selectedActivity) {
      alert('Sélectionnez une activité !');
      return;
    }

    if (selectedFriends.size === 0) {
      alert('Sélectionnez au moins un ami à inviter !');
      return;
    }

    setIsLoading(true);
    try {
      await onSendInvitations(selectedActivity, Array.from(selectedFriends));
      setSelectedFriends(new Set());
      onClose();
    } catch (error) {
      console.error('Erreur envoi invitations:', error);
      alert("Erreur lors de l'envoi des invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFriends(new Set());
    setSelectedActivity(activity); // Reset l'activité
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-responsive py-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className={`${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-responsive-lg py-6 border-b border-opacity-20">
            <div className="flex items-center space-x-3">
              {currentActivity ? (
                <>
                  <div
                    className={`${currentActivity.color} p-3 rounded-full text-white`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Inviter des amis</h2>
                    <p
                      className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Pour {currentActivity.label}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <h2 className="text-xl font-bold">Inviter des amis</h2>
                  <p
                    className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Choisissez une activité
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sélecteur d'activité si aucune activité pré-sélectionnée */}
          {!currentActivity && (
            <div className="px-responsive-lg py-4 border-b border-opacity-20">
              <h3
                className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}
              >
                Choisissez une activité
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(activities).map(
                  ([activityKey, activityData]) => {
                    const ActivityIcon = activityData.icon;
                    return (
                      <motion.button
                        key={activityKey}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedActivity(activityKey)}
                        className={`${activityData.color} hover:opacity-90 text-white p-4 rounded-xl font-medium transition-all duration-200 shadow-lg cursor-pointer aspect-square flex items-center justify-center`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <ActivityIcon size={20} />
                          <span className="text-sm">{activityData.label}</span>
                        </div>
                      </motion.button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-responsive-lg py-6">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users
                  size={48}
                  className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                />
                <p
                  className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Aucun ami disponible pour l'instant
                </p>
                <p
                  className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Ajoutez des amis pour pouvoir les inviter !
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p
                    className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Sélectionnez les amis à inviter ({selectedFriends.size}{' '}
                    sélectionné{selectedFriends.size > 1 ? 's' : ''})
                  </p>

                  {/* Warning de partage de localisation */}
                  {selectedFriends.size > 0 && (
                    <div
                      className={`mt-3 p-3 rounded-lg border-l-4 ${
                        darkMode
                          ? 'bg-orange-900/20 border-orange-500 text-orange-300'
                          : 'bg-orange-50 border-orange-400 text-orange-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">📍</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Partage de localisation
                          </p>
                          <p className="text-xs mt-1 opacity-90">
                            En envoyant cette invitation, vous partagerez votre
                            localisation avec{' '}
                            {selectedFriends.size > 1 ? 'ces amis' : 'cet ami'}{' '}
                            s'ils acceptent.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {friendsWhoInvitedUs.size > 0 && (
                    <p
                      className={`text-xs mt-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'} bg-blue-50 dark:bg-blue-900/20 p-2 rounded`}
                    >
                      💡 {friendsWhoInvitedUs.size} ami
                      {friendsWhoInvitedUs.size > 1
                        ? 's vous ont'
                        : ' vous a'}{' '}
                      déjà invité{friendsWhoInvitedUs.size > 1 ? 's' : ''} -
                      vérifiez vos notifications !
                    </p>
                  )}
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {friends
                    .filter(
                      friend =>
                        !friendsWhoInvitedUs.has(friend.id) &&
                        !friendsWithBilateralRelations.has(friend.id)
                    )
                    .map(friend => {
                      const isDisabled = false;

                      return (
                        <motion.div
                          key={friend.id}
                          whileTap={!isDisabled ? { scale: 0.98 } : {}}
                          onClick={() => !isDisabled && toggleFriend(friend.id)}
                          className={`flex items-center p-3 rounded-lg transition-all ${
                            selectedFriends.has(friend.id)
                              ? // Sélectionné
                                darkMode
                                ? 'bg-blue-600 bg-opacity-20 border border-blue-500 cursor-pointer'
                                : 'bg-blue-50 border border-blue-300 cursor-pointer'
                              : // Normal
                                darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                                : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                          }`}
                        >
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
                              <span className="text-2xl">
                                {friend.avatar || '👤'}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <p
                              className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}
                            >
                              {friend.name}
                            </p>
                            <p
                              className={`text-sm ${
                                isDisabled
                                  ? 'text-gray-400'
                                  : darkMode
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                              }`}
                            >
                              {friend.isOnline
                                ? '🟢 En ligne'
                                : '⚫ Hors ligne'}
                            </p>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isDisabled
                                ? // Désactivé
                                  'border-gray-400 bg-gray-300'
                                : selectedFriends.has(friend.id)
                                  ? // Sélectionné
                                    'bg-blue-500 border-blue-500'
                                  : // Normal
                                    darkMode
                                    ? 'border-gray-500'
                                    : 'border-gray-300'
                            }`}
                          >
                            {!isDisabled && selectedFriends.has(friend.id) && (
                              <Check size={16} className="text-white" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {friends.length > 0 && (
            <div
              className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-3`}
            >
              <button
                onClick={handleClose}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleSendInvitations}
                disabled={
                  !selectedActivity || selectedFriends.size === 0 || isLoading
                }
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedActivity && selectedFriends.size > 0 && !isLoading
                    ? `${currentActivity?.color} hover:opacity-90 text-white`
                    : darkMode
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gray-300 text-gray-500'
                } ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi...
                  </div>
                ) : (
                  `Inviter ${selectedFriends.size > 0 ? `(${selectedFriends.size})` : ''}`
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteFriendsModal;
