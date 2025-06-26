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

/**
 * AVAILABILITY BUTTONS SIMPLIFIÉ - TASK 1.4/1.5
 * Version utilisant UNIQUEMENT les props d'App.js comme source de vérité
 */
const AvailabilityButtons = ({
  isAvailable,
  currentActivity,
  availabilityStartTime,
  pendingInvitation,
  location,
  locationError,
  retryGeolocation,
  requestLocationPermission,
  darkMode,
  user,
  onStartAvailability,
  onStopAvailability,
  onInviteMoreFriends,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const onStopAvailabilityRef = useRef(onStopAvailability);
  const onStartAvailabilityRef = useRef(onStartAvailability);

  onStopAvailabilityRef.current = onStopAvailability;
  onStartAvailabilityRef.current = onStartAvailability;

  useEffect(() => {
    if (isAvailable && availabilityStartTime) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - availabilityStartTime) / 1000);
        const remaining = Math.max(0, 45 * 60 - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0 && onStopAvailabilityRef.current) {
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
            className={`text-lg font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}
          >
            Localisation requise
          </h3>
          <button
            onClick={requestLocationPermission || retryGeolocation}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Autoriser la localisation
          </button>
        </div>
      </motion.div>
    );
  }

  if (!location) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Obtention de ta position...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingInvitation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${darkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'} border rounded-xl p-6`}
        >
          <h3
            className={`font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}
          >
            Invitation envoyée pour {pendingInvitation.activity}
          </h3>
          <p
            className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
          >
            En attente de réponses ({pendingInvitation.count || 0} ami
            {pendingInvitation.count > 1 ? 's' : ''} invité
            {pendingInvitation.count > 1 ? 's' : ''})
          </p>
          {pendingInvitation.friendNames && (
            <p
              className={`text-xs ${darkMode ? 'text-orange-200' : 'text-orange-600'} mt-2`}
            >
              👥 {pendingInvitation.friendNames.join(', ')}
            </p>
          )}
        </motion.div>
      )}

      {isAvailable && currentActivity ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <h3
            className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Tu es disponible pour {currentActivity}
          </h3>
          <div className="flex items-center space-x-2 mb-4">
            <Clock
              size={16}
              className={timeLeft <= 300 ? 'text-red-500' : 'text-green-500'}
            />
            <span
              className={`font-mono text-lg font-semibold ${timeLeft <= 300 ? 'text-red-500' : darkMode ? 'text-green-400' : 'text-green-600'}`}
            >
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {timeLeft <= 300 && (
              <span className="text-xs text-red-500 font-medium">
                bientôt expiré
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onInviteMoreFriends}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
            >
              Inviter d'autres amis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStopAvailability}
              className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} py-3 px-4 rounded-lg font-medium`}
            >
              Arrêter
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            🚀 Que veux-tu faire ?
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartAvailability(activity.id)}
                  className={`${activity.color} ${activity.hoverColor} text-white p-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer aspect-square flex items-center justify-center group`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Icon size={24} />
                    <span className="text-sm group-hover:font-semibold transition-all">
                      {activity.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AvailabilityButtons;
