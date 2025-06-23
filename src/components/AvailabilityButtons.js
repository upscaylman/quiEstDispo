import { motion } from 'framer-motion';
import {
  Clock,
  Coffee,
  Film,
  MapPin,
  Music,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EventGroupService } from '../services/eventGroupService';
import { EventStatusService } from '../services/eventStatusService';
import {
  UserEventStatus,
  getGroupProgress,
  getGroupSizeColor,
  getGroupSizeMessage,
  getStatusColor,
  getStatusMessage,
  isGroupSize,
} from '../types/eventTypes';

const AvailabilityButtons = ({
  isAvailable,
  currentActivity,
  onStartAvailability,
  onStopAvailability,
  location,
  locationError,
  availabilityStartTime,
  retryGeolocation,
  requestLocationPermission,
  darkMode,
  onInviteMoreFriends, // Nouvelle prop pour inviter plus d'amis
  pendingInvitation, // 🎯 NOUVEAU: État d'invitation en attente
  user, // 🎯 NOUVEAU: Pour accéder aux états
}) => {
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [userEventStatus, setUserEventStatus] = useState(UserEventStatus.LIBRE);
  const [statusInfo, setStatusInfo] = useState(null);
  // 🎯 PHASE 2 - États groupes
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSubscription, setGroupSubscription] = useState(null);

  // 🔥 CORRECTION: Ref stable pour onStopAvailability
  const onStopAvailabilityRef = useRef(onStopAvailability);
  onStopAvailabilityRef.current = onStopAvailability;

  // 🎯 NOUVEAU: Récupérer l'état utilisateur
  useEffect(() => {
    if (user?.uid) {
      const fetchUserStatus = async () => {
        try {
          const status = await EventStatusService.getUserEventStatus(user.uid);
          const info = await EventStatusService.getUserStatusInfo(user.uid);
          setUserEventStatus(status);
          setStatusInfo(info);
        } catch (error) {
          console.error('❌ Erreur récupération état utilisateur:', error);
        }
      };

      fetchUserStatus();
    }
  }, [user?.uid, isAvailable, currentActivity]);

  // 🎯 PHASE 2 - Récupérer les informations de groupe
  useEffect(() => {
    if (statusInfo?.currentGroupId) {
      const fetchGroupInfo = async () => {
        try {
          const info = await EventGroupService.getGroupInfo(
            statusInfo.currentGroupId
          );
          const members = await EventGroupService.getGroupMembers(
            statusInfo.currentGroupId
          );
          setGroupInfo(info);
          setGroupMembers(members);
        } catch (error) {
          console.error('❌ Erreur récupération info groupe:', error);
        }
      };

      fetchGroupInfo();

      // 🎯 PHASE 2 - Écouter les changements de groupe en temps réel
      const unsubscribe = EventGroupService.subscribeToGroupChanges(
        statusInfo.currentGroupId,
        async groupData => {
          if (groupData) {
            const info = await EventGroupService.getGroupInfo(
              statusInfo.currentGroupId
            );
            const members = await EventGroupService.getGroupMembers(
              statusInfo.currentGroupId
            );
            setGroupInfo(info);
            setGroupMembers(members);
          } else {
            // Groupe supprimé
            setGroupInfo(null);
            setGroupMembers([]);
          }
        }
      );

      setGroupSubscription(unsubscribe);

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Pas de groupe actuel
      setGroupInfo(null);
      setGroupMembers([]);
      if (groupSubscription) {
        groupSubscription();
        setGroupSubscription(null);
      }
    }
  }, [statusInfo?.currentGroupId]);

  useEffect(() => {
    if (!isAvailable || !availabilityStartTime) {
      setTimeLeft(45 * 60);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - availabilityStartTime) / 1000);
      const remaining = Math.max(0, 45 * 60 - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        onStopAvailabilityRef.current(); // 🔥 UTILISER la ref stable
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAvailable, availabilityStartTime]); // 🔥 SUPPRIMER onStopAvailability des dépendances

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activities = [
    {
      id: 'coffee',
      label: 'Coffee',
      icon: Coffee,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
    },
    {
      id: 'lunch',
      label: 'Lunch',
      icon: Utensils,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      id: 'drinks',
      label: 'Drinks',
      icon: Wine,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      id: 'chill',
      label: 'Chill',
      icon: Users,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      id: 'clubbing',
      label: 'Clubbing',
      icon: Music,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
    },
    {
      id: 'cinema',
      label: 'Cinema',
      icon: Film,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
    },
  ];

  // 🎯 NOUVEAU: Affichage différencié selon l'état utilisateur
  const renderStatusBadge = () => {
    if (!statusInfo) return null;

    const statusColor = getStatusColor(userEventStatus);
    const statusMessage = getStatusMessage(userEventStatus, currentActivity);

    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
          statusColor === 'green'
            ? 'bg-green-100 text-green-800'
            : statusColor === 'orange'
              ? 'bg-orange-100 text-orange-800'
              : statusColor === 'blue'
                ? 'bg-blue-100 text-blue-800'
                : statusColor === 'purple'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            statusColor === 'green'
              ? 'bg-green-500'
              : statusColor === 'orange'
                ? 'bg-orange-500'
                : statusColor === 'blue'
                  ? 'bg-blue-500'
                  : statusColor === 'purple'
                    ? 'bg-purple-500'
                    : 'bg-gray-500'
          }`}
        ></div>
        {statusMessage}
      </div>
    );
  };

  // 🎯 PHASE 2 - Affichage des membres du groupe
  const renderGroupMembers = () => {
    if (!groupInfo || !groupMembers.length) return null;

    const groupSizeColor = getGroupSizeColor(groupMembers.length);
    const groupSizeMessage = getGroupSizeMessage(groupMembers.length);
    const groupProgress = getGroupProgress(groupMembers.length);
    const isGroup = isGroupSize(groupMembers.length);

    return (
      <div className="mb-4">
        {/* Indicateur de progression du groupe */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span
              className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              {groupSizeMessage}
            </span>
            <span
              className={`text-xs ${
                groupSizeColor === 'blue'
                  ? 'text-blue-600'
                  : groupSizeColor === 'green'
                    ? 'text-green-600'
                    : groupSizeColor === 'orange'
                      ? 'text-orange-600'
                      : 'text-red-600'
              }`}
            >
              {groupMembers.length}/10
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                groupSizeColor === 'blue'
                  ? 'bg-blue-500'
                  : groupSizeColor === 'green'
                    ? 'bg-green-500'
                    : groupSizeColor === 'orange'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${groupProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Liste des membres */}
        <div className="space-y-2">
          <h4
            className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            {isGroup ? 'Membres du groupe' : 'Participant'}
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {groupMembers.map(member => (
              <div
                key={member.userId}
                className={`flex items-center justify-between px-2 py-1 rounded ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{member.avatar}</span>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      {member.name}
                      {member.isCreator && (
                        <span className="ml-1 text-xs text-blue-500">👑</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message d'encouragement pour inviter plus */}
        {groupInfo?.canAcceptMembers && (
          <div
            className={`mt-3 p-2 rounded-lg text-xs text-center ${
              darkMode
                ? 'bg-blue-900/20 text-blue-300'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {groupMembers.length === 1
              ? '🚀 Invite des amis pour former un groupe !'
              : `🎉 Groupe en formation ! ${10 - groupMembers.length} places restantes`}
          </div>
        )}
      </div>
    );
  };

  // 🎯 NOUVEAU: Gestion d'affichage selon l'état - évite l'écrasement du décompte
  const renderAvailableState = () => {
    // Si l'utilisateur est EN_PARTAGE, afficher le décompte de partage
    if (userEventStatus === UserEventStatus.EN_PARTAGE && isAvailable) {
      return renderSharingCountdown();
    }

    // Si l'utilisateur a INVITATION_ENVOYEE, afficher l'attente sans écraser le décompte précédent
    if (
      userEventStatus === UserEventStatus.INVITATION_ENVOYEE &&
      pendingInvitation
    ) {
      return renderPendingInvitation();
    }

    // Si l'utilisateur est LIBRE mais avec disponibilité active (état transitoire)
    if (isAvailable && currentActivity) {
      return renderAvailabilityCountdown();
    }

    return null;
  };

  // 🎯 NOUVEAU: Décompte de disponibilité (état LIBRE avec activité)
  const renderAvailabilityCountdown = () => {
    const progressPercentage = (timeLeft / (45 * 60)) * 100;
    const isUrgent = timeLeft < 300;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-green-200`}
      >
        <div className="text-center">
          {renderStatusBadge()}

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Tu es disponible !
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Activité :{' '}
            <span className="font-semibold">
              {activities.find(a => a.id === currentActivity)?.label ||
                currentActivity}
            </span>
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-center text-lg font-mono mb-2">
              <Clock
                size={20}
                className={`mr-2 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`}
              />
              <span
                className={`font-bold ${isUrgent ? 'text-red-500' : 'text-blue-600'}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  isUrgent ? 'bg-red-500' : 'bg-blue-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p
              className={`text-sm ${isUrgent ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {isUrgent ? '⚠️ Bientôt expiré !' : 'Temps restant'}
            </p>
          </div>

          <div className="space-y-3">
            {/* Bouton Inviter d'autres amis */}
            {onInviteMoreFriends && (
              <button
                onClick={() => {
                  console.log(
                    '🔥 [DEBUG] Bouton inviter cliqué pour:',
                    currentActivity
                  );
                  onInviteMoreFriends(currentActivity);
                }}
                className={`w-full ${activities.find(a => a.id === currentActivity)?.color || 'bg-blue-500'} ${activities.find(a => a.id === currentActivity)?.hoverColor || 'hover:bg-blue-600'} text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center`}
              >
                {/* Icône selon l'activité */}
                {currentActivity === 'coffee' && (
                  <Coffee size={20} className="mr-2" />
                )}
                {currentActivity === 'lunch' && (
                  <Utensils size={20} className="mr-2" />
                )}
                {currentActivity === 'drinks' && (
                  <Wine size={20} className="mr-2" />
                )}
                {currentActivity === 'chill' && (
                  <Users size={20} className="mr-2" />
                )}
                {currentActivity === 'clubbing' && (
                  <Music size={20} className="mr-2" />
                )}
                {currentActivity === 'cinema' && (
                  <Film size={20} className="mr-2" />
                )}
                Inviter d'autres amis pour{' '}
                {activities.find(a => a.id === currentActivity)?.label ||
                  currentActivity}
              </button>
            )}

            {/* Bouton Arrêter */}
            <button
              onClick={onStopAvailability}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Arrêter ma disponibilité
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // 🎯 PHASE 2 - Décompte de partage avec info groupe (état EN_PARTAGE)
  const renderSharingCountdown = () => {
    const progressPercentage = (timeLeft / (45 * 60)) * 100;
    const isUrgent = timeLeft < 300;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-purple-200`}
      >
        <div className="text-center">
          {renderStatusBadge()}

          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📍</span>
          </div>
          <h3 className="text-xl font-bold text-purple-700 mb-2">
            {groupInfo && isGroupSize(groupMembers.length)
              ? 'Partage de groupe !'
              : 'Partage en cours !'}
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            {groupInfo && isGroupSize(groupMembers.length)
              ? `Vous partagez vos positions en groupe pour ${activities.find(a => a.id === currentActivity)?.label || currentActivity}`
              : `Vous partagez votre position pour ${activities.find(a => a.id === currentActivity)?.label || currentActivity}`}
          </p>

          {/* 🎯 PHASE 2 - Affichage des membres du groupe */}
          {renderGroupMembers()}

          <div className="mb-4">
            <div className="flex items-center justify-center text-lg font-mono mb-2">
              <Clock
                size={20}
                className={`mr-2 ${isUrgent ? 'text-red-500' : 'text-purple-500'}`}
              />
              <span
                className={`font-bold ${isUrgent ? 'text-red-500' : 'text-purple-600'}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  isUrgent ? 'bg-red-500' : 'bg-purple-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p
              className={`text-sm ${isUrgent ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {isUrgent ? '⚠️ Bientôt expiré !' : 'Partage en cours'}
            </p>
          </div>

          <div className="space-y-3">
            {/* 🎯 PHASE 2 - Bouton inviter plus si groupe pas plein */}
            {groupInfo?.canAcceptMembers && onInviteMoreFriends && (
              <button
                onClick={() => onInviteMoreFriends(currentActivity)}
                className={`w-full ${activities.find(a => a.id === currentActivity)?.color || 'bg-purple-500'} ${activities.find(a => a.id === currentActivity)?.hoverColor || 'hover:bg-purple-600'} text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center`}
              >
                <Users size={20} className="mr-2" />
                Inviter plus d'amis au groupe
              </button>
            )}

            {/* Bouton Arrêter le partage */}
            <button
              onClick={onStopAvailability}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {groupInfo && isGroupSize(groupMembers.length)
                ? 'Quitter le groupe'
                : 'Arrêter de partager ma position'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // 🎯 NOUVEAU: Affichage d'invitation en attente (état INVITATION_ENVOYEE)
  const renderPendingInvitation = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-orange-200`}
      >
        <div className="text-center">
          {renderStatusBadge()}

          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h3 className="text-xl font-bold text-orange-700 mb-2">
            Invitation envoyée
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Vous avez invité des amis pour{' '}
            <span className="font-semibold">
              {activities.find(a => a.id === pendingInvitation?.activity)
                ?.label || pendingInvitation?.activity}
            </span>
          </p>

          <div className="mb-4">
            <div className="animate-pulse flex items-center justify-center mb-2">
              <span className="text-orange-500 text-sm">
                En attente de réponse...
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Message informatif */}
            <p
              className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}
            >
              Vous serez notifié(e) dès qu'un ami accepte votre invitation
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // 🎯 LOGIQUE PRINCIPALE D'AFFICHAGE
  // Prioriser l'état EventStatus sur les props legacy pour éviter les conflits

  // Si pas d'état récupéré encore, afficher loading
  if (user?.uid && !statusInfo) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de votre état...
          </p>
        </div>
      </div>
    );
  }

  // Affichage selon l'état centralisé
  const stateDisplay = renderAvailableState();
  if (stateDisplay) {
    return stateDisplay;
  }

  // Gestion des erreurs de localisation (legacy)
  if (locationError) {
    return (
      <div
        className={`${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-6`}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3
            className={`text-lg font-semibold text-yellow-700 mb-2 ${darkMode ? 'text-yellow-300' : ''}`}
          >
            Localisation requise
          </h3>
          <p
            className={`${darkMode ? 'text-yellow-200' : 'text-yellow-600'} text-sm mb-2`}
          >
            {locationError}
          </p>
          <p
            className={`${darkMode ? 'text-yellow-100' : 'text-yellow-700'} text-xs mb-4 leading-relaxed`}
          >
            L'application a besoin de votre position GPS pour vous localiser sur
            la carte et permettre à vos amis de vous retrouver facilement.
          </p>
          <button
            onClick={requestLocationPermission || retryGeolocation}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium mb-3 transition-colors"
          >
            Autoriser la localisation
          </button>
          <p
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Une popup va s'ouvrir pour demander l'autorisation de localisation.
            <br />
            Cliquez sur "Autoriser" pour continuer.
          </p>
        </div>
      </div>
    );
  }

  // Chargement de la localisation (legacy)
  if (!location) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Obtention de ta position...
          </p>
        </div>
      </div>
    );
  }

  // Interface de sélection d'activités (état LIBRE par défaut)
  return (
    <div className="space-y-4">
      {renderStatusBadge()}

      <div className="text-center mb-6">
        <h2
          className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}
        >
          Que veux-tu faire ?
        </h2>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Partage ta disponibilité avec tes amis
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {activities.map(activity => {
          const Icon = activity.icon;
          return (
            <motion.button
              key={activity.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onStartAvailability(activity.id);
              }}
              className={`${activity.color} ${activity.hoverColor} text-white p-6 rounded-xl font-medium transition-all duration-200 shadow-lg cursor-pointer aspect-square flex items-center justify-center`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon size={24} />
                <span>{activity.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AvailabilityButtons;
