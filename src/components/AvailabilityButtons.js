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
import ActivityCard from './common/ActivityCard';

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
  onCancelInvitations,
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
      {isAvailable && currentActivity ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-[28px] p-6 shadow-md ${darkMode ? 'bg-surface-variant text-on-surface' : 'bg-surface text-on-surface'}`}
          style={{
            backgroundColor: darkMode
              ? 'var(--md-sys-color-surface-container-high)'
              : 'var(--md-sys-color-surface)',
            boxShadow: 'var(--md-sys-elevation-2)',
          }}
        >
          <h3
            className="font-headline-small mb-4"
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '1.5rem',
              fontWeight: 500,
            }}
          >
            Tu es disponible pour {currentActivity}
          </h3>
          <div className="flex items-center space-x-3 mb-6 bg-surface-variant/50 p-4 rounded-[16px]">
            <Clock
              size={24}
              className={timeLeft <= 300 ? 'text-error' : 'text-primary'}
              style={{
                color:
                  timeLeft <= 300
                    ? 'var(--md-sys-color-error)'
                    : 'var(--md-sys-color-primary)',
              }}
            />
            <span
              className={`font-mono text-3xl font-bold ${timeLeft <= 300 ? 'text-error' : 'text-primary'}`}
              style={{
                color:
                  timeLeft <= 300
                    ? 'var(--md-sys-color-error)'
                    : 'var(--md-sys-color-primary)',
              }}
            >
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {timeLeft <= 300 && (
              <span className="text-sm font-medium text-error px-2 py-1 rounded-md bg-error-container text-on-error-container">
                bientôt expiré
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onInviteMoreFriends}
              className="flex-1 py-3 px-6 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <Users size={18} />
              Inviter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStopAvailability}
              className="py-3 px-6 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              Arrêter
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl"
        >
          <h3
            className={`text-xl font-normal mb-6 pl-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Que veux-tu faire ?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                id={activity.id}
                label={activity.label}
                icon={activity.icon}
                index={index}
                darkMode={darkMode}
                onClick={() => onStartAvailability(activity.id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AvailabilityButtons;
