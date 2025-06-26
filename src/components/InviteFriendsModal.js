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
import { useEffect, useMemo, useState } from 'react';
// 🎯 PHASE 5 - Validation UI selon état utilisateur
import { ValidationService } from '../services/validationService';
// 🎯 TASK 1.5 - Interface états temps réel
import { useFriendsStatus } from '../hooks/useFriendsStatus';

const InviteFriendsModal = ({
  isOpen,
  onClose,
  onSendInvitations,
  activity,
  friends = [],
  notifications = [],
  darkMode = false,
  currentUserId = null,
  isActiveEventInvitation = false,
}) => {
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(activity);
  // 🎯 NOUVEAU: État pour validation utilisateur
  const [userActionValid, setUserActionValid] = useState({
    valid: true,
    reason: '',
  });
  const [validatingUser, setValidatingUser] = useState(false);

  // 🎯 TASK 1.5 - Hook pour les statuts temps réel des amis
  const {
    friendsStatus,
    loading: statusLoading,
    error: statusError,
  } = useFriendsStatus(friends, currentUserId);

  useEffect(() => {
    if (isOpen) {
      setSelectedActivity(activity);
      // 🎯 PHASE 5: Valider si l'utilisateur peut envoyer des invitations
      validateUserCanSendInvitations();
    }
  }, [isOpen, activity, currentUserId]);

  // 🎯 PHASE 5: Validation état utilisateur
  const validateUserCanSendInvitations = async () => {
    if (!currentUserId) return;

    setValidatingUser(true);
    try {
      // 🔍 DEBUG: Vérifier d'abord l'état brut de l'utilisateur
      if (process.env.NODE_ENV === 'development') {
        const { EventStatusService } = await import(
          '../services/eventStatusService'
        );
        const rawStatus =
          await EventStatusService.getUserEventStatus(currentUserId);
        console.log('🔍 [MODAL DEBUG] État brut utilisateur:', rawStatus);
      }

      const validation = await ValidationService.validateActionByUserState(
        currentUserId,
        'send_invitation'
      );

      setUserActionValid({
        valid: validation.allowed,
        reason: validation.reason,
        details: validation.details,
        userMessage: validation.userMessage,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [MODAL VALIDATION] Validation complète:', validation);
        console.log(
          '🔍 [MODAL VALIDATION] Interface sera:',
          validation.allowed ? 'AUTORISÉE' : 'BLOQUÉE'
        );
      }
    } catch (error) {
      console.error('❌ [MODAL] Erreur validation utilisateur:', error);
      setUserActionValid({
        valid: false,
        reason: 'validation_error',
        userMessage: 'Impossible de vérifier votre état. Réessayez.',
      });
    } finally {
      setValidatingUser(false);
    }
  };

  // ✅ SIMPLIFICATION: Plus besoin de requêtes Firestore complexes
  // Les relations bilatérales sont détectées via les notifications seulement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔥 [DEBUG MODAL V2] Modal ouvert avec activité: ${selectedActivity}`
      );
    }
  }, [isOpen, selectedActivity]);

  const friendsWithBilateralRelations = useMemo(() => {
    const bilateralRelations = new Set();

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🔥 [DEBUG RELATIONS V2] Calcul des relations bilatérales SIMPLIFIÉES...',
        {
          currentUserId,
          selectedActivity,
          notificationsTotal: notifications.length,
        }
      );
    }

    // ✅ NOUVELLE APPROCHE ROBUSTE: Utiliser les notifications seulement
    // (plus fiable que Firestore qui peut être nettoyé)

    // Cas 1: Notifications d'invitations reçues non lues (attente de réponse)
    notifications.forEach(notif => {
      if (
        notif.type === 'invitation' &&
        notif.data?.activity === selectedActivity &&
        !notif.read
      ) {
        bilateralRelations.add(notif.from);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '🔥 [DEBUG RELATIONS V2] ➕ Ajout via invitation reçue en attente:',
            notif.from
          );
        }
      }
    });

    // Cas 2: Notifications d'invitations envoyées non lues (en attente)
    notifications.forEach(notif => {
      if (
        notif.type === 'invitation_sent' &&
        notif.data?.activity === selectedActivity &&
        !notif.read
      ) {
        bilateralRelations.add(notif.to);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '🔥 [DEBUG RELATIONS V2] ➕ Ajout via invitation envoyée en attente:',
            notif.to
          );
        }
      }
    });

    // Cas 3: Notifications d'acceptation (relation active confirmée)
    notifications.forEach(notif => {
      if (
        (notif.type === 'activity_accepted_start_timer' ||
          notif.type === 'activity_joined') &&
        notif.data?.activity === selectedActivity
      ) {
        bilateralRelations.add(notif.from);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '🔥 [DEBUG RELATIONS V2] ➕ Ajout via activité acceptée/rejointe:',
            notif.from
          );
        }
      }
    });

    // Cas 4: Notifications que j'ai envoyées confirmant l'acceptation
    notifications.forEach(notif => {
      if (
        (notif.type === 'activity_accepted_start_timer' ||
          notif.type === 'activity_joined') &&
        notif.data?.activity === selectedActivity &&
        notif.to // Je suis l'expéditeur de cette notification
      ) {
        bilateralRelations.add(notif.to);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            "🔥 [DEBUG RELATIONS V2] ➕ Ajout via confirmation d'acceptation que j'ai envoyée:",
            notif.to
          );
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🔥 [DEBUG RELATIONS V2] ✅ Relations finales simplifiées:',
        Array.from(bilateralRelations)
      );
    }

    return bilateralRelations;
  }, [notifications, selectedActivity, currentUserId]);

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

  const friendsWhoInvitedUs = new Set(
    notifications
      .filter(notif => {
        const isInvitation = notif.type === 'invitation';
        const sameActivity = notif.data?.activity === selectedActivity;
        const unread = !notif.read;

        // Debug supprimé pour éviter logs infinis

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
    // 🎯 PHASE 5: Bloquer si utilisateur ne peut pas inviter
    if (!userActionValid.valid) {
      return;
    }

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
    console.log(`🔥 [MODAL] handleSendInvitations appelé !`, {
      selectedActivity,
      selectedFriendsSize: selectedFriends.size,
      selectedFriendsArray: Array.from(selectedFriends),
      userActionValid,
    });

    // 🎯 PHASE 5: Vérifications renforcées
    if (!userActionValid.valid) {
      alert(
        `❌ ${userActionValid.userMessage || 'Action non autorisée dans votre état actuel'}`
      );
      return;
    }

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
      // 🎯 PHASE 5: Validation finale avant envoi
      console.log(
        '🧹 [DEBUG] Nettoyage préventif des invitations obsolètes...'
      );

      // Nettoyer les données obsolètes d'abord
      try {
        const { InvitationService } = await import(
          '../services/invitationService'
        );
        await InvitationService.quickCleanupOldInvitations();
      } catch (cleanupError) {
        console.warn('⚠️ Erreur nettoyage:', cleanupError);
      }

      const finalValidation =
        await ValidationService.validateInvitationRecipients(
          currentUserId,
          Array.from(selectedFriends)
        );

      console.log('🔍 [DEBUG] Résultat validation finale:', finalValidation);

      if (finalValidation.invalid.length > 0) {
        // Logs détaillés pour diagnostic
        console.error('❌ [DEBUG] Validation échouée:', {
          total: finalValidation.summary?.total,
          valid: finalValidation.valid,
          invalid: finalValidation.invalid,
          blocked: finalValidation.blocked,
          reasons: finalValidation.reasons,
        });

        alert(
          `⚠️ ${finalValidation.invalid.length} ami(s) ne peuvent plus être invité(s). Leurs statuts ont changé.`
        );
        // Retirer les amis invalides de la sélection
        const validFriendIds = new Set(finalValidation.valid);
        setSelectedFriends(
          prev => new Set([...prev].filter(id => validFriendIds.has(id)))
        );
        return;
      }

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

  // 🔥 DEBUG: Vérifier les paramètres (seulement si modal ouvert pour éviter spam)
  if (isOpen && process.env.NODE_ENV === 'development') {
    console.log('🔥 [DEBUG MODAL] État du modal:', {
      isActiveEventInvitation,
      selectedActivity,
      currentUserId,
      userActionValid,
      // Firestore supprimé - utilisation notifications uniquement
      notificationsCount: notifications.length,
      notificationsRelevantes: notifications.filter(
        notif =>
          (notif.type === 'invitation' || notif.type === 'invitation_sent') &&
          notif.data?.activity === selectedActivity
      ),
      relationsCount: friendsWithBilateralRelations.size,
      relationsArray: Array.from(friendsWithBilateralRelations),
      amisFiltres: friends
        .filter(
          friend =>
            !friendsWhoInvitedUs.has(friend.id) &&
            (!isActiveEventInvitation ||
              !friendsWithBilateralRelations.has(friend.id))
        )
        .map(f => f.name),
    });
  }

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
          } rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col`}
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

          {/* 🎯 PHASE 5: Message d'erreur si utilisateur ne peut pas inviter */}
          {(!userActionValid.valid || validatingUser) && (
            <div
              className={`px-responsive-lg py-4 border-b ${
                darkMode
                  ? 'border-gray-700 bg-red-900/20'
                  : 'border-gray-200 bg-red-50'
              }`}
            >
              {validatingUser ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  <span
                    className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}
                  >
                    Vérification de votre statut...
                  </span>
                </div>
              ) : (
                <div
                  className={`flex items-start space-x-2 ${
                    darkMode ? 'text-red-300' : 'text-red-600'
                  }`}
                >
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Action non autorisée</p>
                    <p className="text-xs mt-1 opacity-90">
                      {userActionValid.userMessage ||
                        "Votre état actuel ne permet pas d'envoyer des invitations."}
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={validateUserCanSendInvitations}
                        className={`text-xs underline ${
                          darkMode
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-red-700 hover:text-red-800'
                        }`}
                      >
                        Vérifier à nouveau
                      </button>
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={async () => {
                            try {
                              const { EventStatusService } = await import(
                                '../services/eventStatusService'
                              );
                              await EventStatusService.forceResetToLibre(
                                currentUserId,
                                'Reset manuel depuis modal'
                              );
                              console.log('🔄 Reset forcé vers LIBRE effectué');
                              // Re-valider après reset
                              await validateUserCanSendInvitations();
                            } catch (error) {
                              console.error('❌ Erreur reset:', error);
                            }
                          }}
                          className={`block text-xs underline ${
                            darkMode
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-yellow-700 hover:text-yellow-800'
                          }`}
                        >
                          🔧 [DEV] Forcer reset état
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                        whileHover={
                          userActionValid.valid ? { scale: 1.02 } : {}
                        }
                        whileTap={userActionValid.valid ? { scale: 0.98 } : {}}
                        onClick={() =>
                          userActionValid.valid &&
                          setSelectedActivity(activityKey)
                        }
                        disabled={!userActionValid.valid}
                        className={`${
                          userActionValid.valid
                            ? `${activityData.color} hover:opacity-90 cursor-pointer`
                            : 'bg-gray-400 cursor-not-allowed opacity-60'
                        } text-white p-4 rounded-xl font-medium transition-all duration-200 shadow-lg aspect-square flex items-center justify-center`}
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
          <div className="px-responsive-lg py-6 flex-1 overflow-y-auto">
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

                <div className="space-y-3 max-h-96 sm:max-h-80 md:max-h-64 overflow-y-auto">
                  {friends
                    .filter(
                      friend =>
                        !friendsWhoInvitedUs.has(friend.id) &&
                        // 🎯 Restrictions bilatérales SEULEMENT pendant l'événement actif
                        (!isActiveEventInvitation ||
                          !friendsWithBilateralRelations.has(friend.id))
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
                            <div className="flex items-center gap-2">
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
                              {/* 🎯 NOUVEAU: Affichage du statut temps réel */}
                              {friendsStatus?.[friend.id] && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    friendsStatus[friend.id].available
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}
                                >
                                  {friendsStatus[friend.id].message}
                                </span>
                              )}
                            </div>
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
              className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-3 flex-shrink-0`}
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
                onClick={() => {
                  console.log(`🔥 [MODAL] Bouton Inviter cliqué !`, {
                    selectedActivity,
                    selectedFriendsSize: selectedFriends.size,
                    isLoading,
                    disabled:
                      !selectedActivity ||
                      selectedFriends.size === 0 ||
                      isLoading,
                  });
                  handleSendInvitations();
                }}
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
