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
import { debugLog } from '../utils/logger';

/**
 * 🎯 AVAILABILITY BUTTONS SIMPLIFIÉ
 * Version utilisant les props d'App.js comme source de vérité
 */
const AvailabilityButtons = ({
  // 🔧 PROPS D'ÉTAT DEPUIS APP.JS (source de vérité)
  isAvailable,
  currentActivity,
  availabilityStartTime,
  pendingInvitation,
  // 🔧 PROPS TECHNIQUES
  location,
  locationError,
  retryGeolocation,
  requestLocationPermission,
  darkMode,
  user,
  // 🔧 CALLBACKS
  onStartAvailability,
  onStopAvailability,
  onInviteMoreFriends,
}) => {
  // 🎯 ÉTATS SIMPLIFIÉS - Basés sur les props d'App.js
  const [timeLeft, setTimeLeft] = useState(0);

  // 🔧 Références stables
  const onStopAvailabilityRef = useRef(onStopAvailability);
  const onStartAvailabilityRef = useRef(onStartAvailability);
  const onInviteMoreFriendsRef = useRef(onInviteMoreFriends);

  onStopAvailabilityRef.current = onStopAvailability;
  onStartAvailabilityRef.current = onStartAvailability;
  onInviteMoreFriendsRef.current = onInviteMoreFriends;

  // 🔧 TIMER BASÉ SUR LES PROPS APP.JS
  useEffect(() => {
    if (isAvailable && availabilityStartTime) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - availabilityStartTime) / 1000);
        const remaining = Math.max(0, 45 * 60 - elapsed); // 45 minutes

        debugLog(
          `🕐 Timer: ${remaining}s restant (depuis ${new Date(availabilityStartTime).toLocaleTimeString()})`,
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
    } else {
      setTimeLeft(0);
    }
  }, [isAvailable, availabilityStartTime]);

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

  // 🎯 LOGIQUE AFFICHAGE SELON ÉTAT APP.JS
  return (
    <div className="space-y-4">
      {/* Invitation en attente */}
      {pendingInvitation && (
        <ModernPendingInvitation
          invitation={pendingInvitation}
          activities={activities}
          darkMode={darkMode}
        />
      )}

      {/* Compte à rebours en cours */}
      {isAvailable && currentActivity && timeLeft > 0 && (
        <ModernAvailabilityCountdown
          activity={currentActivity}
          timeLeft={timeLeft}
          activities={activities}
          onInviteMoreFriends={onInviteMoreFriendsRef.current}
          onStopAvailability={onStopAvailabilityRef.current}
          darkMode={darkMode}
        />
      )}

      {/* Sélecteur d'activité */}
      {!isAvailable && !pendingInvitation && (
        <ModernActivitySelector
          activities={activities}
          onStartAvailability={onStartAvailabilityRef.current}
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

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              className={`h-full rounded-full transition-all duration-1000 ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
              animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1, repeat: isUrgent ? Infinity : 0 }}
            />
          </div>

          <p
            className={`text-xs ${isUrgent ? 'text-red-600 font-medium' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {isUrgent
              ? '⚠️ Bientôt expiré'
              : `${Math.ceil(timeLeft / 60)} minutes restantes`}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onInviteMoreFriends}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            👥 Inviter plus d'amis
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStopAvailability}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            🛑 Arrêter
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ModernPendingInvitation = ({ invitation, activities, darkMode }) => {
  const activityData = activities.find(a => a.id === invitation?.activity);

  if (!invitation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-lg`}
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-2xl">⏳</span>
        </motion.div>

        <h3 className="text-xl font-bold text-orange-700 mb-2">
          Invitation en attente
        </h3>

        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Activité :{' '}
          <span className="font-semibold">
            {activityData?.label || invitation.activity}
          </span>
        </p>

        <p
          className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          En attente de réponses des amis invités...
        </p>
      </div>
    </motion.div>
  );
};

export default AvailabilityButtons;
