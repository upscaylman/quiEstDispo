// Écran d'accueil avec gestion des disponibilités - MD3 Expressive
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock as ClockIcon,
  Coffee,
  Facebook,
  FlaskConical,
  HelpCircle,
  Instagram,
  Linkedin,
  MapPin,
  Shield,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MOCK_INVITATIONS } from '../../data/mockInvitations';
import { showDevTools } from '../../utils/adminUtils';
import AvailabilityButtons from '../AvailabilityButtons';
import InvitationListItem from '../cards/InvitationListItem';
import MD3Button from '../common/MD3Button';
import MD3Card from '../common/MD3Card';
import MD3IconButton from '../common/MD3IconButton';
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
  onCancelInvitations,
  onRetryGeolocation,
  onRequestLocationPermission,
  onInviteFriends,
  onAddFriend,
  onCreateTestFriendships,
  onFriendInvitationResponse,
  onActivityInvitationResponse,
}) => {
  // State pour forcer le re-render et mettre à jour les temps
  const [currentTime, setCurrentTime] = useState(Date.now());

  // State pour afficher/cacher les mocks d'invitations (admin only)
  const [showInvitationMocks, setShowInvitationMocks] = useState(false);

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

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-surface)]">
      <div className="flex-1">
        {/* Boutons de disponibilité */}
        <div className="px-4 sm:px-6 py-6">
          <AvailabilityButtons
            isAvailable={isAvailable}
            currentActivity={currentActivity}
            availabilityStartTime={availabilityStartTime}
            pendingInvitation={pendingInvitation}
            location={location}
            locationError={locationError}
            retryGeolocation={onRetryGeolocation}
            requestLocationPermission={onRequestLocationPermission}
            darkMode={darkMode}
            user={user}
            onStartAvailability={onSetAvailability}
            onStopAvailability={onStopAvailability}
            onCancelInvitations={onCancelInvitations}
            onInviteMoreFriends={onInviteFriends}
          />

          {/* Section Notifications - MD3 Style */}
          <AnimatePresence>
            {homeNotifications.length > 0 && (
              <motion.div
                className="mt-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <div className="space-y-4">
                  {homeNotifications.map(notification => (
                    <MD3Card
                      key={notification.id}
                      variant="filled"
                      padding="default"
                      className="border-l-4 border-l-[var(--md-sys-color-primary)]"
                    >
                      <p className="font-semibold mb-2 text-[var(--md-sys-color-on-surface)]">
                        {notification.message}
                      </p>
                      <p className="text-sm mb-4 text-[var(--md-sys-color-on-surface-variant)]">
                        {notification.createdAt
                          ?.toDate?.()
                          ?.toLocaleTimeString() || 'Maintenant'}
                      </p>

                      {/* Boutons d'action pour les invitations d'amitié */}
                      {notification.type === 'friend_invitation' &&
                        notification.data?.actions && (
                          <div className="flex gap-3">
                            <MD3Button
                              variant="filled"
                              onClick={() =>
                                onFriendInvitationResponse?.(
                                  notification.data.invitationId,
                                  'accepted',
                                  notification.id
                                )
                              }
                              className="flex-1 bg-[var(--md-sys-color-success)]"
                              icon={<span>✅</span>}
                            >
                              Accepter
                            </MD3Button>
                            <MD3Button
                              variant="outlined"
                              onClick={() =>
                                onFriendInvitationResponse?.(
                                  notification.data.invitationId,
                                  'declined',
                                  notification.id
                                )
                              }
                              className="flex-1"
                            >
                              Refuser
                            </MD3Button>
                          </div>
                        )}

                      {/* Boutons d'action pour les invitations d'événements */}
                      {(notification.type === 'invitation' ||
                        notification.type === 'invitation_sent') &&
                        notification.data?.actions && (
                          <div className="flex gap-3">
                            <MD3Button
                              variant="filled"
                              onClick={() =>
                                onActivityInvitationResponse?.(
                                  notification,
                                  'accepted'
                                )
                              }
                              className="flex-1"
                              icon={<span>🎉</span>}
                            >
                              Rejoindre
                            </MD3Button>
                            <MD3Button
                              variant="tonal"
                              onClick={() =>
                                onActivityInvitationResponse?.(
                                  notification,
                                  'declined'
                                )
                              }
                              className="flex-1"
                            >
                              Ignorer
                            </MD3Button>
                          </div>
                        )}
                    </MD3Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section Inviter des amis - MD3 Expressive */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <MD3Card variant="elevated" padding="large">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-tertiary)] flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                  Élargis ton cercle
                </h3>
              </div>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-5">
                Invite tes amis pour partager vos disponibilités en temps réel !
              </p>
              <MD3Button
                variant="filled"
                onClick={onAddFriend}
                fullWidth
                size="large"
                icon={<UserPlus size={20} />}
                className="bg-gradient-to-r from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-tertiary)]"
              >
                Inviter des amis 🎉
              </MD3Button>

              {/* Bouton de test en mode développement */}
              {showDevTools(user) && (
                <div className="mt-5 space-y-2">
                  <MD3Button
                    variant="tonal"
                    onClick={onCreateTestFriendships}
                    size="small"
                    fullWidth
                    icon={<FlaskConical size={14} />}
                  >
                    Test amitiés
                  </MD3Button>
                  <MD3Button
                    variant={showInvitationMocks ? 'filled' : 'outlined'}
                    onClick={() => setShowInvitationMocks(!showInvitationMocks)}
                    size="small"
                    fullWidth
                    icon={<Coffee size={16} />}
                  >
                    {showInvitationMocks ? 'Masquer' : 'Afficher'} mocks
                    invitations
                  </MD3Button>
                </div>
              )}
            </MD3Card>
          </motion.div>

          {/* ========== SECTION MOCKS INVITATIONS (Admin only) ========== */}
          {showDevTools(user) && showInvitationMocks && (
            <motion.div
              className="mt-6 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Titre de section avec toggle vue */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-tertiary)] animate-pulse" />
                  <h2 className="text-sm font-semibold text-[var(--md-sys-color-tertiary)] uppercase tracking-wide">
                    Mocks Invitations (Dev)
                  </h2>
                </div>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] px-2 py-1 rounded-full">
                  Liste compacte avec expansion
                </span>
              </div>

              {/* Rendu en liste compacte avec expansion */}
              {MOCK_INVITATIONS.map(invitation => (
                <InvitationListItem
                  key={invitation.id}
                  {...invitation}
                  onAccept={() => console.log('Accept:', invitation.id)}
                  onDecline={() => console.log('Decline:', invitation.id)}
                  onCancel={() => console.log('Cancel:', invitation.id)}
                  onViewOnMap={() => console.log('View on map:', invitation.id)}
                  onExtend={() => console.log('Extend:', invitation.id)}
                  onTerminate={() => console.log('Terminate:', invitation.id)}
                  onJoinGroup={() => console.log('Join group:', invitation.id)}
                  onViewDetails={() =>
                    console.log('View details:', invitation.id)
                  }
                  onInviteOther={() =>
                    console.log('Invite other:', invitation.id)
                  }
                />
              ))}
            </motion.div>
          )}
          {/* ========== FIN SECTION MOCKS INVITATIONS ========== */}
        </div>

        {/* Section Carte - MD3 Style - Affichée seulement si amis disponibles ou en attente de localisation */}
        {(availableFriends?.length > 0 || !location) && (
          <div className="flex-1 relative min-h-[300px] mx-4 sm:mx-6 rounded-[28px] overflow-hidden shadow-[var(--md-sys-elevation-level2)]">
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
              <div className="h-full flex items-center justify-center bg-[var(--md-sys-color-surface-container)] p-4">
                <motion.div
                  className="bg-[var(--md-sys-color-surface-container-highest)] rounded-[28px] shadow-[var(--md-sys-elevation-level3)] p-8 max-w-sm w-full text-center border border-[var(--md-sys-color-outline-variant)]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {locationError ? (
                    <>
                      {/* État d'erreur */}
                      <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          duration: 0.5,
                          delay: 0.1,
                        }}
                      >
                        <MapPin
                          size={36}
                          className="text-[var(--md-sys-color-on-error-container)]"
                        />
                      </motion.div>

                      <h3 className="text-xl font-bold mb-2 text-[var(--md-sys-color-on-surface)]">
                        Localisation indisponible
                      </h3>

                      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6 leading-relaxed">
                        Nous n'avons pas pu accéder à votre position. Vérifiez
                        que la géolocalisation est activée dans les paramètres
                        de votre appareil.
                      </p>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MD3Button
                          variant="filled"
                          onClick={onRetryGeolocation}
                          icon={<MapPin size={20} />}
                          fullWidth
                          size="large"
                        >
                          Réessayer
                        </MD3Button>
                      </motion.div>

                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-4 opacity-70">
                        Votre position permet à vos amis de vous retrouver
                      </p>
                    </>
                  ) : (
                    <>
                      {/* État de chargement */}
                      <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center relative"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        {/* Cercle de chargement */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-[var(--md-sys-color-primary)] border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <MapPin
                            size={32}
                            className="text-[var(--md-sys-color-on-primary-container)]"
                          />
                        </motion.div>
                      </motion.div>

                      <h3 className="text-xl font-bold mb-2 text-[var(--md-sys-color-on-surface)]">
                        Localisation en cours
                      </h3>

                      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4 leading-relaxed">
                        Nous déterminons votre position pour afficher vos amis
                        proches sur la carte.
                      </p>

                      {/* Indicateur de progression animé */}
                      <div className="flex justify-center gap-1.5 mb-4">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] opacity-70">
                        Cela ne prend que quelques secondes
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer MD3 Expressive */}
      <footer
        className="px-6 sm:px-8 py-8"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #7c3aed 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Réseaux sociaux */}
          <div className="flex justify-center gap-4 mb-8">
            <MD3IconButton
              variant="standard"
              icon={<Facebook size={20} />}
              onClick={() => window.open('https://facebook.com', '_blank')}
              ariaLabel="Facebook"
              className="text-white/80 hover:text-white hover:bg-white/20"
            />
            <MD3IconButton
              variant="standard"
              icon={<Instagram size={20} />}
              onClick={() => window.open('https://instagram.com', '_blank')}
              ariaLabel="Instagram"
              className="text-white/80 hover:text-white hover:bg-white/20"
            />
            <MD3IconButton
              variant="standard"
              icon={<X size={20} />}
              onClick={() => window.open('https://x.com', '_blank')}
              ariaLabel="X"
              className="text-white/80 hover:text-white hover:bg-white/20"
            />
            <MD3IconButton
              variant="standard"
              icon={<Linkedin size={20} />}
              onClick={() => window.open('https://linkedin.com', '_blank')}
              ariaLabel="LinkedIn"
              className="text-white/80 hover:text-white hover:bg-white/20"
            />
          </div>

          {/* Sections du footer - MD3 Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* À PROPOS */}
            <div className="text-center">
              <h3 className="font-bold text-white mb-4 flex items-center justify-center gap-2 text-base">
                <HelpCircle size={18} /> À PROPOS
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Découvrez comment nous simplifions vos rencontres spontanées
                entre amis.
              </p>
            </div>

            {/* LÉGAL */}
            <div className="text-center">
              <h3 className="font-bold text-white mb-4 flex items-center justify-center gap-2 text-base">
                <Shield size={18} /> LÉGAL
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors font-medium"
                  >
                    CGU Qui est dispo
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors font-medium"
                  >
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors font-medium"
                  >
                    Données personnelles
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors font-medium"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>

            {/* SERVICE CLIENT */}
            <div className="text-center">
              <h3 className="font-bold text-white mb-4 flex items-center justify-center gap-2 text-base">
                <ClockIcon size={18} /> SERVICE CLIENT
              </h3>
              <div className="space-y-2">
                <p className="text-white/80 font-medium">
                  Du lundi au vendredi
                </p>
                <p className="text-white/80 font-medium">
                  de 10h à 18h (Heure de Paris)
                </p>
                <a
                  href="mailto:contact@qui-est-dispo.com"
                  className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-all"
                >
                  Nous contacter
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 mt-10 pt-6 text-center">
            <p className="text-white/70 text-sm font-medium">
              © 2026 Qui est dispo. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;
