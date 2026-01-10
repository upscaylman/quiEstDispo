import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Coffee,
  Film,
  MapPin,
  Music,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
// 🎯 PHASE 5 - Validation UI selon état utilisateur
import { ValidationService } from '../services/validationService';
// 🎯 TASK 1.5 - Interface états temps réel
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import AdaptiveModal from './common/AdaptiveModal';
import StatusIndicator, {
  getFriendDisplayStatus,
} from './common/StatusIndicator';

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

  // Render icon helper - supports forwardRef components
  const renderIcon = (IconComponent, size = 24) => {
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  };

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
          `${finalValidation.invalid.length} ami(s) ne peuvent plus être invité(s). Leurs statuts ont changé.`
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

  // Icône du header
  const headerIcon = currentActivity ? (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
      className={`${currentActivity.color} p-3 rounded-[var(--md-sys-shape-corner-large)] text-white shadow-md`}
    >
      {renderIcon(currentActivity.icon, 24)}
    </motion.div>
  ) : null;

  // Footer du modal
  const modalFooter =
    friends.length > 0 ? (
      <div className="p-6 flex gap-3">
        {/* Bouton Annuler - Style MD3 Outlined */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleClose}
          className="flex-1 h-11 px-6 rounded-full font-semibold transition-all duration-200 
          border-2 border-[var(--md-sys-color-outline)] 
          text-[var(--md-sys-color-primary)] 
          hover:bg-[var(--md-sys-color-primary)]/8
          active:scale-[0.98]"
        >
          Annuler
        </motion.button>

        {/* Bouton Inviter - Style MD3 Filled */}
        <motion.button
          whileHover={{
            scale:
              !selectedActivity || selectedFriends.size === 0 || isLoading
                ? 1
                : 1.02,
          }}
          whileTap={{
            scale:
              !selectedActivity || selectedFriends.size === 0 || isLoading
                ? 1
                : 0.97,
          }}
          onClick={() => {
            console.log(`🔥 [MODAL] Bouton Inviter cliqué !`, {
              selectedActivity,
              selectedFriendsSize: selectedFriends.size,
              isLoading,
              disabled:
                !selectedActivity || selectedFriends.size === 0 || isLoading,
            });
            handleSendInvitations();
          }}
          disabled={
            !selectedActivity || selectedFriends.size === 0 || isLoading
          }
          className={`flex-1 h-11 px-6 rounded-full font-semibold transition-all duration-200
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            selectedActivity && selectedFriends.size > 0 && !isLoading
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-[var(--md-sys-elevation-level1)]'
              : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          {isLoading ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span>Envoi...</span>
            </>
          ) : (
            `Inviter ${selectedFriends.size > 0 ? `(${selectedFriends.size})` : ''}`
          )}
        </motion.button>
      </div>
    ) : null;

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Inviter des amis"
      subtitle={
        currentActivity
          ? `Pour ${currentActivity.label}`
          : 'Choisissez une activité'
      }
      icon={headerIcon}
      footer={modalFooter}
      maxWidth="max-w-md"
      mobileFullHeight={false}
    >
      <div className="text-[var(--md-sys-color-on-surface)]">
        {/* 🎯 PHASE 5: Message d'erreur si utilisateur ne peut pas inviter */}
        {(!userActionValid.valid || validatingUser) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-responsive-lg py-4 border-b border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-error-container)]"
          >
            {validatingUser ? (
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-5 h-5 border-2 border-[var(--md-sys-color-on-error-container)]/30 border-t-[var(--md-sys-color-on-error-container)] rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <span className="text-body-medium text-[var(--md-sys-color-on-error-container)]">
                  Vérification de votre statut...
                </span>
              </div>
            ) : (
              <div className="flex items-start space-x-3 text-[var(--md-sys-color-on-error-container)]">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-body-medium font-medium">
                    Action non autorisée
                  </p>
                  <p className="text-body-small mt-1 opacity-90">
                    {userActionValid.userMessage ||
                      "Votre état actuel ne permet pas d'envoyer des invitations."}
                  </p>
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={validateUserCanSendInvitations}
                      className="text-label-small underline hover:opacity-80 transition-opacity"
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
                        className="block text-label-small underline text-[var(--md-sys-color-warning)] hover:opacity-80"
                      >
                        🔧 [DEV] Forcer reset état
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sélecteur d'activité si aucune activité pré-sélectionnée */}
        {!currentActivity && (
          <div className="px-responsive-lg py-4 border-b border-[var(--md-sys-color-outline-variant)]/30">
            <h3 className="text-title-medium font-semibold mb-3 text-[var(--md-sys-color-on-surface)]">
              Choisissez une activité
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(activities).map(
                ([activityKey, activityData], index) => {
                  const isSelected = selectedActivity === activityKey;
                  return (
                    <motion.button
                      key={activityKey}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={
                        userActionValid.valid ? { scale: 1.05, y: -2 } : {}
                      }
                      whileTap={userActionValid.valid ? { scale: 0.95 } : {}}
                      onClick={() =>
                        userActionValid.valid &&
                        setSelectedActivity(activityKey)
                      }
                      disabled={!userActionValid.valid}
                      className={`${
                        userActionValid.valid
                          ? `${activityData.color} hover:shadow-lg cursor-pointer`
                          : 'bg-[var(--md-sys-color-surface-container)] cursor-not-allowed opacity-60'
                      } text-white p-4 rounded-[var(--md-sys-shape-corner-large)] font-medium transition-all duration-200 shadow-md aspect-square flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--md-sys-color-surface-container-high)]'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1.5">
                        {renderIcon(activityData.icon, 24)}
                        <span className="text-label-medium">
                          {activityData.label}
                        </span>
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-center">
                <Users
                  size={32}
                  className="text-[var(--md-sys-color-on-surface-variant)]"
                />
              </div>
              <p className="text-body-large text-[var(--md-sys-color-on-surface-variant)]">
                Aucun ami disponible pour l'instant
              </p>
              <p className="text-body-small mt-2 text-[var(--md-sys-color-on-surface-variant)]/70">
                Ajoutez des amis pour pouvoir les inviter !
              </p>
            </motion.div>
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
                      <MapPin size={18} className="flex-shrink-0 mt-0.5" />
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
                      // 🎯 Ne pas afficher les amis déjà en attente d'invitation ou avec relation active
                      !friendsWithBilateralRelations.has(friend.id)
                  )
                  .map(friend => {
                    const isDisabled = false;
                    // Statut de connexion (en ligne / hors ligne)
                    const displayStatus = getFriendDisplayStatus(
                      friend,
                      friendsStatus?.[friend.id]
                    );

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
                        {/* Avatar avec pastille de statut en ligne/hors ligne */}
                        <div className="relative w-12 h-12 mr-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
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
                          {/* Pastille de statut en ligne/hors ligne sur l'avatar */}
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <StatusIndicator
                              status={displayStatus}
                              size="sm"
                              showRing={true}
                              showLabel={false}
                            />
                          </div>
                        </div>

                        <div className="flex-1">
                          <p
                            className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}
                          >
                            {friend.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Indicateur de disponibilité (Disponible/Occupé) */}
                            <span
                              className="text-xs"
                              style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                              }}
                            >
                              {displayStatus.includes('busy')
                                ? 'Occupé'
                                : 'Disponible'}
                            </span>
                            {/* 🎯 Affichage du statut temps réel */}
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
      </div>
    </AdaptiveModal>
  );
};

export default InviteFriendsModal;
