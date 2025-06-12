// Écran d'accueil avec gestion des disponibilités
import { motion } from 'framer-motion';
import {
  Clock as ClockIcon,
  Coffee,
  Facebook,
  Film,
  HelpCircle,
  Instagram,
  Linkedin,
  Music,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AvailabilityButtons from '../AvailabilityButtons';
import MapboxMapView from '../map/MapboxMapView';
import MapView from '../MapView';

const HomeScreen = ({
  // Props de state
  isAvailable,
  currentActivity,
  availabilityStartTime,
  availableFriends,
  friends,
  location,
  locationError,
  useMapbox,
  darkMode,
  isOnline,
  user,

  // Props de fonctions
  onSetAvailability,
  onStopAvailability,
  onResponseToAvailability,
  onTerminateActivity,
  onRetryGeolocation,
  onRequestLocationPermission,
  onInviteFriends,
  onAddFriend,
  onCreateTestFriendships,
  onLoadMockData,
}) => {
  // State pour forcer le re-render et mettre à jour les temps
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Timer pour mettre à jour l'affichage du temps restant
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(timer);
  }, []);

  // Calculer le temps restant pour la disponibilité
  const getTimeLeft = () => {
    if (!availabilityStartTime || !isAvailable) return '45:00';

    const now = new Date().getTime();
    const elapsed = Math.floor((now - availabilityStartTime) / 1000);
    const remaining = Math.max(0, 45 * 60 - elapsed);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fonction pour obtenir les couleurs d'activité
  const getActivityColor = activity => {
    const colors = {
      coffee: 'bg-amber-500',
      lunch: 'bg-green-500',
      drinks: 'bg-purple-500',
      chill: 'bg-blue-500',
      clubbing: 'bg-pink-500',
      cinema: 'bg-indigo-500',
    };
    return colors[activity] || 'bg-gray-500';
  };

  // Calculer le temps restant pour une activité (basé sur createdAt + 45min)
  const getActivityTimeLeft = availability => {
    if (!availability.createdAt) return null;

    const createdTime = new Date(availability.createdAt).getTime();
    const now = new Date().getTime();
    const durationMs = 45 * 60 * 1000; // 45 minutes en millisecondes
    const endTime = createdTime + durationMs;
    const remaining = Math.max(0, endTime - now);

    if (remaining === 0) return null; // Activité expirée

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}min`;
    } else {
      return `${seconds}s`;
    }
  };

  // Vérifier si une activité est expirée
  const isActivityExpired = availability => {
    if (!availability.createdAt) return false;

    const createdTime = new Date(availability.createdAt).getTime();
    const now = new Date().getTime();
    const durationMs = 45 * 60 * 1000; // 45 minutes

    return now - createdTime >= durationMs;
  };

  const timeLeft = getTimeLeft();

  // Composant de carte selon les préférences
  const MapComponent = useMapbox ? MapboxMapView : MapView;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {/* Boutons de disponibilité */}
        <div className="p-4 px-6">
          <AvailabilityButtons
            isAvailable={isAvailable}
            currentActivity={currentActivity}
            onStartAvailability={onSetAvailability}
            onStopAvailability={onStopAvailability}
            location={location}
            locationError={locationError}
            availabilityStartTime={availabilityStartTime}
            retryGeolocation={onRetryGeolocation}
            requestLocationPermission={onRequestLocationPermission}
            darkMode={darkMode}
          />

          {/* Section Inviter des amis */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3
              className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              Élargis ton cercle
            </h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddFriend}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center transition-all shadow-lg"
            >
              <UserPlus size={20} className="mr-2" />
              <span>Inviter des amis 🎉</span>
            </motion.button>

            {/* Boutons de test en mode développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={onCreateTestFriendships}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  🧪 Créer des amitiés de test
                </button>
                <button
                  onClick={onLoadMockData}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  🎭 Charger des données de démo
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Amis disponibles */}
        {availableFriends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 pb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Amis disponibles
              </h3>
              <div
                className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} bg-opacity-20 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} px-2 py-1 rounded-full`}
              >
                👆 Cliquez pour rejoindre
              </div>
            </div>
            <div className="space-y-2">
              {availableFriends
                .map(availability => {
                  const isInProgress =
                    availability.isResponseToInvitation &&
                    availability.respondingToUserId === user?.uid;
                  const timeLeft = getActivityTimeLeft(availability);
                  const expired = isActivityExpired(availability);

                  // Ne pas afficher les activités expirées
                  if (expired) return null;

                  return (
                    <motion.div
                      key={availability.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 shadow transition-all border-2 ${
                        isInProgress
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                          : darkMode
                            ? 'border-gray-700'
                            : 'border-gray-200'
                      }`}
                    >
                      {/* Badge de statut */}
                      {isInProgress && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              Activité en cours
                            </span>
                          </div>
                          {timeLeft && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              {timeLeft} restant
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            {availability.friend?.avatar &&
                            availability.friend.avatar.startsWith('http') ? (
                              <img
                                src={availability.friend.avatar}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">
                                {availability.friend?.avatar || '👤'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {availability.friend?.name}
                            </p>
                            <p
                              className={`text-sm ${
                                isInProgress
                                  ? 'text-green-600 dark:text-green-400'
                                  : darkMode
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                              }`}
                            >
                              {isInProgress
                                ? `En ${availability.activity}`
                                : `Dispo pour ${availability.activity}`}
                            </p>
                            {!isInProgress && timeLeft && (
                              <p
                                className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                              >
                                Encore {timeLeft}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Icône de l'activité */}
                        <div className="flex items-center mr-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isInProgress
                                ? 'bg-green-500'
                                : getActivityColor(availability.activity)
                            }`}
                          >
                            {availability.activity === 'coffee' && (
                              <Coffee size={16} className="text-white" />
                            )}
                            {availability.activity === 'lunch' && (
                              <span className="text-sm">🍽️</span>
                            )}
                            {availability.activity === 'drinks' && (
                              <span className="text-sm">🍷</span>
                            )}
                            {availability.activity === 'chill' && (
                              <Users size={16} className="text-white" />
                            )}
                            {availability.activity === 'clubbing' && (
                              <Music size={16} className="text-white" />
                            )}
                            {availability.activity === 'cinema' && (
                              <Film size={16} className="text-white" />
                            )}
                            {![
                              'coffee',
                              'lunch',
                              'drinks',
                              'chill',
                              'clubbing',
                              'cinema',
                            ].includes(availability.activity) && (
                              <span className="text-sm">📍</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      {!isInProgress ? (
                        <div className="flex space-x-2 mt-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onResponseToAvailability(availability, 'join')
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            ✅ Rejoindre
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onResponseToAvailability(availability, 'decline')
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            ❌ Décliner
                          </motion.button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              🎉 Activité confirmée
                            </span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onTerminateActivity(availability.id);
                            }}
                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            Terminer
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
                .filter(Boolean)}
            </div>
          </motion.div>
        )}

        {/* Carte */}
        <div className="flex-1 relative">
          {location ? (
            <MapComponent
              friends={friends}
              availableFriends={availableFriends}
              currentLocation={location}
              onInviteFriends={onInviteFriends}
              darkMode={darkMode}
              isAvailable={isAvailable}
              currentActivity={currentActivity}
              showControls={false}
            />
          ) : (
            <div
              className={`h-full flex items-center justify-center ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <div className="text-center p-6">
                <ClockIcon
                  size={48}
                  className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                />
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Localisation en cours...
                </h3>
                <p
                  className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {locationError
                    ? 'Erreur de géolocalisation. Vérifiez vos permissions.'
                    : 'Nous déterminons votre position pour afficher vos amis.'}
                </p>
                {locationError && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetryGeolocation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Réessayer
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer avec dégradé */}
      <footer className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 px-6 py-8 border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto">
          {/* Réseaux sociaux */}
          <div className="flex justify-center space-x-6 mb-8">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <X size={20} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <Linkedin size={20} />
            </a>
          </div>

          {/* Sections du footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* À PROPOS */}
            <div className="text-center">
              <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                <HelpCircle size={16} className="mr-2" />À PROPOS
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Guide d'utilisation
                  </a>
                </li>
              </ul>
            </div>

            {/* LEGAL */}
            <div className="text-center">
              <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                <Shield size={16} className="mr-2" />
                LÉGAL
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    CGU Qui est dispo
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Données personnelles
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>

            {/* SERVICE CLIENT */}
            <div className="text-center">
              <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                <ClockIcon size={16} className="mr-2" />
                SERVICE CLIENT
              </h3>
              <div className="space-y-2">
                <p className="text-white/70">Du lundi au vendredi</p>
                <p className="text-white/70">de 10h à 18h (Heure de Paris)</p>
                <a
                  href="mailto:contact@qui-est-dispo.com"
                  className="text-white hover:text-white/80 transition-colors inline-block mt-3"
                >
                  Nous contacter
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 mt-8 pt-6 text-center">
            <p className="text-white/60 text-xs">
              © 2025 Qui est dispo. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;
