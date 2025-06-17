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
}) => {
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  // 🔥 CORRECTION: Ref stable pour onStopAvailability
  const onStopAvailabilityRef = useRef(onStopAvailability);
  onStopAvailabilityRef.current = onStopAvailability;

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

  // 🎯 NOUVEAU: Afficher le message d'invitation en attente
  if (pendingInvitation) {
    const activity = activities.find(a => a.id === pendingInvitation.activity);
    const ActivityIcon = activity?.icon || Users;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border-2 border-orange-200`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ActivityIcon size={32} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-orange-700 mb-2">
            Invitation en attente
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Tu as invité{' '}
            <span className="font-semibold">
              {pendingInvitation.friendNames
                ? pendingInvitation.friendNames.length === 1
                  ? pendingInvitation.friendNames[0]
                  : pendingInvitation.friendNames.length === 2
                    ? `${pendingInvitation.friendNames[0]} et ${pendingInvitation.friendNames[1]}`
                    : `${pendingInvitation.friendNames.slice(0, -1).join(', ')} et ${pendingInvitation.friendNames[pendingInvitation.friendNames.length - 1]}`
                : `${pendingInvitation.count} ami${pendingInvitation.count > 1 ? 's' : ''}`}
            </span>{' '}
            pour{' '}
            <span className="font-semibold">
              {activity?.label || pendingInvitation.activity}
            </span>
          </p>

          <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <Clock size={20} className="mr-2 text-orange-600" />
              <span className="text-orange-700 font-medium">
                En attente d'acceptation
              </span>
            </div>
            <p className="text-sm text-orange-600">
              Le partage de votre position commencera quand quelqu'un acceptera
              l'invitation
            </p>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Envoyé il y a{' '}
            {Math.floor((Date.now() - pendingInvitation.sentAt) / 60000)} min
          </div>

          {/* Bouton d'annulation */}
          <button
            onClick={onStopAvailability}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Annuler l'invitation
          </button>
        </div>
      </motion.div>
    );
  }

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
