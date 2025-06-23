// Écran d'accueil avec gestion des disponibilités
import { motion } from 'framer-motion';
import {
  Clock as ClockIcon,
  Facebook,
  HelpCircle,
  Instagram,
  Linkedin,
  Shield,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AvailabilityButtons from '../AvailabilityButtons';
import { MapView } from '../map';
import MapboxMapView from '../map/MapboxMapView';

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
  notifications,
  pendingInvitation,

  // Props de fonctions
  onSetAvailability,
  onStopAvailability,
  onTerminateActivity,
  onRetryGeolocation,
  onRequestLocationPermission,
  onInviteFriends,
  onAddFriend,
  onCreateTestFriendships,
  onLoadMockData,
  onFriendInvitationResponse,
  onActivityInvitationResponse,
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

  // Vérification de sécurité pour les tests ou les erreurs d'import
  const SafeMapComponent =
    MapComponent ||
    (() => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p>Carte non disponible</p>
      </div>
    ));

  // Filtrer les notifications à afficher sur l'écran d'accueil
  const getHomeNotifications = () => {
    if (!notifications) return [];

    return notifications.filter(notification => {
      // Afficher SEULEMENT les invitations qui nécessitent une action
      // Exclure les notifications de déclinaison/réponses
      return (
        !notification.read &&
        [
          'friend_invitation',
          'invitation',
          // 'invitation_sent', // Retirer - ce sont les invitations qu'on a envoyées
          // 'activity_accepted_start_timer', // Retirer - notification de démarrage
        ].includes(notification.type)
      );
    });
  };

  const homeNotifications = getHomeNotifications();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {/* Boutons de disponibilité */}
        <div className="px-responsive py-4">
          <AvailabilityButtons
            location={location}
            locationError={locationError}
            retryGeolocation={onRetryGeolocation}
            requestLocationPermission={onRequestLocationPermission}
            darkMode={darkMode}
            user={user}
            onStartAvailability={onSetAvailability}
            onStopAvailability={onStopAvailability}
            onInviteMoreFriends={onInviteFriends}
          />

          {/* Section Notifications */}
          {homeNotifications.length > 0 && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-3">
                {homeNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}
                  >
                    <p
                      className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {notification.message}
                    </p>
                    <p
                      className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {notification.createdAt
                        ?.toDate?.()
                        ?.toLocaleTimeString() || 'Maintenant'}
                    </p>

                    {/* Boutons d'action pour les invitations d'amitié */}
                    {notification.type === 'friend_invitation' &&
                      notification.data?.actions && (
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onFriendInvitationResponse?.(
                                notification.data.invitationId,
                                'accepted',
                                notification.id
                              )
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            ✅ Accepter
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onFriendInvitationResponse?.(
                                notification.data.invitationId,
                                'declined',
                                notification.id
                              )
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            ❌ Refuser
                          </motion.button>
                        </div>
                      )}

                    {/* Boutons d'action pour les invitations d'événements */}
                    {(notification.type === 'invitation' ||
                      notification.type === 'invitation_sent') &&
                      notification.data?.actions && (
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onActivityInvitationResponse?.(
                                notification,
                                'accepted'
                              )
                            }
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            🎉 Rejoindre
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onActivityInvitationResponse?.(
                                notification,
                                'declined'
                              )
                            }
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            ⏭️ Ignorer
                          </motion.button>
                        </div>
                      )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

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

        {/* Section des amis disponibles SUPPRIMÉE - plus de cartes avec boutons Rejoindre/Décliner */}

        {/* Carte */}
        <div className="flex-1 relative">
          {location ? (
            <SafeMapComponent
              availableFriends={availableFriends}
              userLocation={location}
              darkMode={darkMode}
              isAvailable={isAvailable}
              selectedActivity={currentActivity}
              currentUser={user}
              showControls={false}
              onRetryGeolocation={onRetryGeolocation}
              onRequestLocationPermission={onRequestLocationPermission}
            />
          ) : (
            <div
              className={`h-full flex items-center justify-center ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <div className="text-center p-responsive">
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
                  className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {locationError
                    ? 'Erreur de géolocalisation. Vérifiez vos permissions.'
                    : 'Nous déterminons votre position pour afficher vos amis.'}
                </p>
                {locationError && (
                  <p
                    className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-600'} leading-relaxed`}
                  >
                    L'application a besoin de votre position GPS pour vous
                    localiser sur la carte et permettre à vos amis de vous
                    retrouver facilement.
                  </p>
                )}
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
      <footer className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 px-responsive-lg py-8 border-t border-gray-200 mt-16">
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
