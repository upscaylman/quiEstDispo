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
import React, { useEffect, useState } from 'react';

const AvailabilityButtons = ({
  isAvailable,
  currentActivity,
  onStartAvailability,
  onStopAvailability,
  location,
  locationError,
  availabilityStartTime,
  retryGeolocation, // Nouvelle prop pour retry sans recharger
  darkMode,
}) => {
  const [timeLeft, setTimeLeft] = useState(45 * 60);

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
        onStopAvailability();
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAvailable, availabilityStartTime, onStopAvailability]);

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

  if (isAvailable) {
    const progressPercentage = (timeLeft / (45 * 60)) * 100;
    const isUrgent = timeLeft < 300;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-green-200`}
      >
        <div className="text-center">
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

          <button
            onClick={onStopAvailability}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Arrêter ma disponibilité
          </button>
        </div>
      </motion.div>
    );
  }

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
            className={`${darkMode ? 'text-yellow-200' : 'text-yellow-600'} text-sm mb-4`}
          >
            {locationError}
          </p>
          <button
            onClick={() => {
              if (retryGeolocation) {
                retryGeolocation();
              } else {
                window.location.reload();
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium mb-3 transition-colors"
          >
            Réessayer la localisation
          </button>
          <p
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            1. Vérifiez que Chrome a l'autorisation
            <br />
            2. Cliquez sur l'icône 🔒 dans l'URL
            <br />
            3. Autorisez la localisation
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-4">
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

      <div
        className={`flex items-center justify-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-4`}
      >
        <MapPin size={12} className="mr-1" />
        <span>Ta position sera partagée avec tes amis</span>
      </div>
    </div>
  );
};

export default AvailabilityButtons;
