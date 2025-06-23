import { motion } from 'framer-motion';
import {
  Clock,
  Coffee,
  Film,
  Heart,
  MapPin,
  Music,
  Send,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AvailabilityService } from '../services/availabilityService';
import { EventGroupService } from '../services/eventGroupService';
import { EventStatusService } from '../services/eventStatusService';
import { InvitationService } from '../services/invitationService';
import {
  UserEventStatus,
  getStatusColor,
  getStatusMessage,
} from '../types/eventTypes';
import { debugLog } from '../utils/logger';

/**
 * 🎯 REFONTE MODERNE - AvailabilityButtons avec design conservé + logique Phase 1-6
 *
 * NOUVEAUTÉS:
 * - Logique 100% basée sur nouveaux services (EventStatusService, InvitationService)
 * - Élimination doubles logiques et props obsolètes
 * - Interface moderne avec états temps réel
 * - Design conservé (cartes, couleurs, animations)
 * - Support complet des 4 états: LIBRE, INVITATION_ENVOYEE, INVITATION_RECUE, EN_PARTAGE
 */
const AvailabilityButtons = ({
  // 🔧 PROPS MINIMALES MODERNISÉES
  location,
  locationError,
  retryGeolocation,
  requestLocationPermission,
  darkMode,
  user,
  onStartAvailability, // Callback pour démarrer activité
  onStopAvailability, // Callback pour arrêter activité
  onInviteMoreFriends, // Callback pour ouvrir modal invitations
}) => {
  // 🎯 ÉTATS MODERNISÉS - Uniquement nouveaux services
  const [userEventStatus, setUserEventStatus] = useState(UserEventStatus.LIBRE);
  const [statusInfo, setStatusInfo] = useState(null);
  const [currentAvailability, setCurrentAvailability] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🎯 ÉTATS GROUPES (Phase 2)
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSubscription, setGroupSubscription] = useState(null);

  // 🔧 Références stables
  const onStopAvailabilityRef = useRef(onStopAvailability);
  const onStartAvailabilityRef = useRef(onStartAvailability);
  const onInviteMoreFriendsRef = useRef(onInviteMoreFriends);

  onStopAvailabilityRef.current = onStopAvailability;
  onStartAvailabilityRef.current = onStartAvailability;
  onInviteMoreFriendsRef.current = onInviteMoreFriends;

  // 🎯 CHARGEMENT ÉTAT UTILISATEUR MODERNE (Phase 1)
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserState = async () => {
      setLoading(true);
      try {
        const [status, info] = await Promise.all([
          EventStatusService.getUserEventStatus(user.uid),
          EventStatusService.getUserStatusInfo(user.uid),
        ]);

        debugLog(
          `🔄 État utilisateur chargé: ${status}`,
          'AvailabilityButtons'
        );
        setUserEventStatus(status);
        setStatusInfo(info);

        // Récupérer disponibilité active si EN_PARTAGE ou LIBRE avec activité
        if (
          status === UserEventStatus.EN_PARTAGE ||
          (status === UserEventStatus.LIBRE && info?.currentActivity)
        ) {
          const availability = info?.availabilityId
            ? await AvailabilityService.getAvailability(info.availabilityId)
            : null;
          setCurrentAvailability(availability);
        } else {
          setCurrentAvailability(null);
        }

        // Récupérer invitations en attente si INVITATION_ENVOYEE
        if (status === UserEventStatus.INVITATION_ENVOYEE) {
          const invitations = await InvitationService.getUserPendingInvitations(
            user.uid
          );
          setPendingInvitations(
            invitations.filter(inv => inv.fromUserId === user.uid)
          );
        } else {
          setPendingInvitations([]);
        }
      } catch (error) {
        console.error('❌ [MODERN] Erreur chargement état:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserState();

    // 🎯 Refresh périodique état utilisateur (30s)
    const statusInterval = setInterval(loadUserState, 30000);

    return () => clearInterval(statusInterval);
  }, [user?.uid]);

  // 🚀 RAFRAÎCHISSEMENT IMMÉDIAT sur changements d'état critiques
  useEffect(() => {
    if (!user?.uid) return;

    const refreshImmediately = async () => {
      debugLog(
        `🚀 Rafraîchissement immédiat pour état: ${userEventStatus}`,
        'AvailabilityButtons'
      );

      try {
        const [status, info] = await Promise.all([
          EventStatusService.getUserEventStatus(user.uid),
          EventStatusService.getUserStatusInfo(user.uid),
        ]);

        if (status !== userEventStatus) {
          debugLog(
            `🔄 Changement d'état détecté: ${userEventStatus} → ${status}`,
            'AvailabilityButtons'
          );
          setUserEventStatus(status);
          setStatusInfo(info);

          // Recharger availability si nécessaire
          if (status === UserEventStatus.EN_PARTAGE && info?.availabilityId) {
            const availability = await AvailabilityService.getAvailability(
              info.availabilityId
            );
            setCurrentAvailability(availability);
          }
        }
      } catch (error) {
        debugLog(
          `❌ Erreur rafraîchissement immédiat: ${error.message}`,
          'AvailabilityButtons'
        );
      }
    };

    // Écouter les événements de changement d'état
    const handleStateChange = () => refreshImmediately();

    window.addEventListener('availability-state-changed', handleStateChange);
    window.addEventListener('invitation-accepted', handleStateChange);

    return () => {
      window.removeEventListener(
        'availability-state-changed',
        handleStateChange
      );
      window.removeEventListener('invitation-accepted', handleStateChange);
    };
  }, [user?.uid, userEventStatus]);

  // 🎯 GESTION GROUPES MODERNE (Phase 2)
  useEffect(() => {
    if (statusInfo?.currentGroupId) {
      const loadGroupInfo = async () => {
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
          console.error('❌ [MODERN] Erreur groupe:', error);
        }
      };

      loadGroupInfo();

      // Écouter changements groupe en temps réel
      const unsubscribe = EventGroupService.subscribeToGroupChanges(
        statusInfo.currentGroupId,
        async groupData => {
          if (groupData) {
            await loadGroupInfo();
          } else {
            setGroupInfo(null);
            setGroupMembers([]);
          }
        }
      );

      setGroupSubscription(unsubscribe);
      return () => unsubscribe?.();
    } else {
      setGroupInfo(null);
      setGroupMembers([]);
      if (groupSubscription) {
        groupSubscription();
        setGroupSubscription(null);
      }
    }
  }, [statusInfo?.currentGroupId]);

  // 🚀 HACK IMMÉDIAT: Démarrer timer dès passage EN_PARTAGE
  useEffect(() => {
    if (
      userEventStatus === UserEventStatus.EN_PARTAGE &&
      !currentAvailability?.startTime
    ) {
      debugLog(
        `🚀 HACK: Passage EN_PARTAGE détecté, démarrage timer avec NOW`,
        'AvailabilityButtons'
      );
      // Si on passe EN_PARTAGE mais pas encore de startTime, utiliser maintenant
      setCurrentAvailability(prev => ({
        ...prev,
        startTime: Date.now(),
      }));
    }
  }, [userEventStatus, currentAvailability?.startTime]);

  // 🔧 TIMER INTELLIGENT avec gestion correcte des états
  useEffect(() => {
    // Pour EN_PARTAGE, utiliser currentAvailability.startTime
    if (
      userEventStatus === UserEventStatus.EN_PARTAGE &&
      currentAvailability?.startTime
    ) {
      const updateTimer = () => {
        const now = Date.now();
        const startTime =
          currentAvailability.startTime.toMillis?.() ||
          currentAvailability.startTime;
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, 45 * 60 - elapsed); // 45 minutes

        debugLog(
          `🕐 Timer EN_PARTAGE: ${remaining}s restant (startTime: ${new Date(startTime).toLocaleTimeString()})`,
          'AvailabilityButtons'
        );
        setTimeLeft(remaining);

        // Auto-arrêt si temps écoulé
        if (remaining <= 0 && onStopAvailabilityRef.current) {
          debugLog(`⏰ Timer expiré, arrêt automatique`, 'AvailabilityButtons');
          onStopAvailabilityRef.current();
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }

    // Pour LIBRE avec activité, utiliser statusInfo.availabilityStartTime
    else if (
      userEventStatus === UserEventStatus.LIBRE &&
      statusInfo?.availabilityStartTime
    ) {
      const updateTimer = () => {
        const now = Date.now();
        const startTime =
          statusInfo.availabilityStartTime.toMillis?.() ||
          statusInfo.availabilityStartTime;
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, 45 * 60 - elapsed); // 45 minutes

        debugLog(
          `🕐 Timer LIBRE: ${remaining}s restant (startTime: ${new Date(startTime).toLocaleTimeString()})`,
          'AvailabilityButtons'
        );
        setTimeLeft(remaining);

        // Auto-arrêt si temps écoulé
        if (remaining <= 0 && onStopAvailabilityRef.current) {
          debugLog(`⏰ Timer expiré, arrêt automatique`, 'AvailabilityButtons');
          onStopAvailabilityRef.current();
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }

    // Sinon, pas de timer actif
    else {
      debugLog(
        `🕐 Pas de timer actif (état: ${userEventStatus}, availability: ${!!currentAvailability?.startTime})`,
        'AvailabilityButtons'
      );
      setTimeLeft(0);
    }
  }, [
    userEventStatus,
    currentAvailability?.startTime,
    statusInfo?.availabilityStartTime,
  ]);

  // 🎨 UTILITAIRES DESIGN (conservés de l'original)
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

  // 🎯 BADGE STATUT MODERNE
  const renderStatusBadge = () => {
    if (!statusInfo) return null;

    const statusColor = getStatusColor(userEventStatus);
    const statusMessage = getStatusMessage(
      userEventStatus,
      statusInfo.currentActivity
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
          statusColor === 'green'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : statusColor === 'orange'
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : statusColor === 'blue'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : statusColor === 'purple'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
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
        />
        {statusMessage}
      </motion.div>
    );
  };

  // 🎯 LOADING STATE MODERNE
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de votre état...
          </p>
        </div>
      </motion.div>
    );
  }

  // 🎯 GESTION ERREURS LOCALISATION (design conservé)
  if (locationError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={requestLocationPermission || retryGeolocation}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium mb-3 transition-colors"
          >
            Autoriser la localisation
          </motion.button>
          <p
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Une popup va s'ouvrir pour demander l'autorisation de localisation.
            <br />
            Cliquez sur "Autoriser" pour continuer.
          </p>
        </div>
      </motion.div>
    );
  }

  if (!location) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Obtention de ta position...
          </p>
        </div>
      </motion.div>
    );
  }

  // 🎯 LOGIQUE AFFICHAGE MODERNE selon état
  return (
    <div className="space-y-4">
      {renderStatusBadge()}

      {/* Affichage selon l'état utilisateur */}
      {userEventStatus === UserEventStatus.LIBRE &&
        !statusInfo?.currentActivity && (
          <ModernActivitySelector
            activities={activities}
            onStartAvailability={onStartAvailabilityRef.current}
            darkMode={darkMode}
          />
        )}

      {userEventStatus === UserEventStatus.LIBRE &&
        statusInfo?.currentActivity && (
          <ModernAvailabilityCountdown
            activity={statusInfo.currentActivity}
            timeLeft={timeLeft}
            activities={activities}
            onInviteMoreFriends={onInviteMoreFriendsRef.current}
            onStopAvailability={onStopAvailabilityRef.current}
            darkMode={darkMode}
          />
        )}

      {userEventStatus === UserEventStatus.INVITATION_ENVOYEE &&
        pendingInvitations.length > 0 && (
          <ModernPendingInvitation
            invitations={pendingInvitations}
            activities={activities}
            darkMode={darkMode}
          />
        )}

      {userEventStatus === UserEventStatus.EN_PARTAGE &&
        currentAvailability && (
          <ModernSharingCountdown
            availability={currentAvailability}
            timeLeft={timeLeft}
            activities={activities}
            groupInfo={groupInfo}
            groupMembers={groupMembers}
            onInviteMoreFriends={onInviteMoreFriendsRef.current}
            onStopAvailability={onStopAvailabilityRef.current}
            darkMode={darkMode}
          />
        )}
    </div>
  );
};

// 🎯 COMPOSANTS MODERNES SÉPARÉS (design conservé)

const ModernActivitySelector = ({
  activities,
  onStartAvailability,
  darkMode,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="text-center">
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
      {activities.map((activity, index) => {
        const Icon = activity.icon;
        return (
          <motion.button
            key={activity.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStartAvailability(activity.id)}
            className={`${activity.color} ${activity.hoverColor} text-white p-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer aspect-square flex items-center justify-center group`}
          >
            <div className="flex flex-col items-center space-y-2">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon size={24} />
              </motion.div>
              <span className="group-hover:font-semibold transition-all">
                {activity.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

const ModernAvailabilityCountdown = ({
  activity,
  timeLeft,
  activities,
  onInviteMoreFriends,
  onStopAvailability,
  darkMode,
}) => {
  const progressPercentage = Math.max(0, (timeLeft / (45 * 60)) * 100);
  const isUrgent = timeLeft < 300; // 5 minutes
  const activityData = activities.find(a => a.id === activity);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-green-200`}
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-2xl">✅</span>
        </motion.div>

        <h3 className="text-xl font-bold text-green-700 mb-2">
          Tu es disponible !
        </h3>

        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Activité :{' '}
          <span className="font-semibold">
            {activityData?.label || activity}
          </span>
        </p>

        {/* Timer modernisé */}
        <div className="mb-6">
          <div className="flex items-center justify-center text-lg font-mono mb-3">
            <motion.div
              animate={{ rotate: isUrgent ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
            >
              <Clock
                size={20}
                className={`mr-2 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`}
              />
            </motion.div>
            <span
              className={`font-bold text-2xl ${isUrgent ? 'text-red-500' : 'text-blue-600'}`}
            >
              {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full transition-all duration-1000 ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>

          <motion.p
            animate={{ color: isUrgent ? '#dc2626' : undefined }}
            className={`text-sm ${isUrgent ? 'text-red-600 font-medium' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {isUrgent
              ? '⚠️ Bientôt expiré !'
              : 'Temps restant pour cette activité'}
          </motion.p>
        </div>

        <div className="space-y-3">
          {/* Bouton Inviter */}
          {onInviteMoreFriends && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onInviteMoreFriends(activity)}
              className={`w-full ${activityData?.color || 'bg-blue-500'} ${activityData?.hoverColor || 'hover:bg-blue-600'} text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center shadow-lg hover:shadow-xl`}
            >
              <Send size={20} className="mr-2" />
              Inviter d'autres amis pour {activityData?.label || activity}
            </motion.button>
          )}

          {/* Bouton Arrêter */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStopAvailability}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          >
            Arrêter ma disponibilité
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ModernPendingInvitation = ({ invitations, activities, darkMode }) => {
  const latestInvitation = invitations[0]; // Plus récente
  const activityData = activities.find(
    a => a.id === latestInvitation?.activity
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-orange-200`}
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-2xl">⏳</span>
        </motion.div>

        <h3 className="text-xl font-bold text-orange-700 mb-2">
          {invitations.length === 1
            ? 'Invitation envoyée'
            : `${invitations.length} invitations envoyées`}
        </h3>

        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Vous avez invité des amis pour{' '}
          <span className="font-semibold">
            {activityData?.label || latestInvitation?.activity}
          </span>
        </p>

        {/* Animation d'attente */}
        <div className="mb-6">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center justify-center mb-3"
          >
            <Heart size={16} className="text-orange-500 mr-2" />
            <span className="text-orange-600 font-medium">
              En attente de réponse...
            </span>
            <Heart size={16} className="text-orange-500 ml-2" />
          </motion.div>

          {invitations.length > 1 && (
            <p
              className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {invitations.length} invitations actives
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`bg-orange-50 ${darkMode ? 'bg-orange-900/20' : ''} rounded-lg p-3`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-orange-200' : 'text-orange-700'} italic`}
          >
            💫 Vous serez notifié(e) dès qu'un ami accepte votre invitation
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ModernSharingCountdown = ({
  availability,
  timeLeft,
  activities,
  groupInfo,
  groupMembers,
  onInviteMoreFriends,
  onStopAvailability,
  darkMode,
}) => {
  const progressPercentage = Math.max(0, (timeLeft / (45 * 60)) * 100);
  const isUrgent = timeLeft < 300;
  const activityData = activities.find(a => a.id === availability?.activity);
  const isGroup = groupMembers && groupMembers.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-purple-200`}
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-2xl">📍</span>
        </motion.div>

        <h3 className="text-xl font-bold text-purple-700 mb-2">
          {isGroup
            ? `Partage de groupe ! (${groupMembers.length})`
            : 'Partage en cours !'}
        </h3>

        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          {isGroup
            ? `Vous partagez vos positions en groupe pour ${activityData?.label || availability?.activity}`
            : `Vous partagez votre position pour ${activityData?.label || availability?.activity}`}
        </p>

        {/* Membres du groupe */}
        {isGroup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg p-3 mb-4`}
          >
            <div className="flex items-center justify-center flex-wrap gap-2">
              {groupMembers.slice(0, 5).map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center bg-white rounded-full px-2 py-1 text-xs shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  {member.name || 'Ami'}
                </motion.div>
              ))}
              {groupMembers.length > 5 && (
                <span className="text-xs text-purple-600">
                  +{groupMembers.length - 5} autres
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-center text-lg font-mono mb-3">
            <motion.div
              animate={{ rotate: isUrgent ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
            >
              <Clock
                size={20}
                className={`mr-2 ${isUrgent ? 'text-red-500' : 'text-purple-500'}`}
              />
            </motion.div>
            <span
              className={`font-bold text-2xl ${isUrgent ? 'text-red-500' : 'text-purple-600'}`}
            >
              {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full transition-all duration-1000 ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p
            className={`text-sm ${isUrgent ? 'text-red-600 font-medium' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {isUrgent ? '⚠️ Bientôt expiré !' : 'Partage en cours'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Bouton inviter plus si groupe pas plein */}
          {groupInfo?.canAcceptMembers && onInviteMoreFriends && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onInviteMoreFriends(availability?.activity)}
              className={`w-full ${activityData?.color || 'bg-purple-500'} ${activityData?.hoverColor || 'hover:bg-purple-600'} text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center shadow-lg hover:shadow-xl`}
            >
              <Users size={20} className="mr-2" />
              Inviter plus d'amis au groupe
            </motion.button>
          )}

          {/* Bouton Arrêter */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStopAvailability}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          >
            {isGroup ? 'Quitter le groupe' : 'Arrêter de partager ma position'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Utilitaire pour formater le temps (réutilisé)
const formatTime = seconds => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default AvailabilityButtons;
