// Écran de carte en plein écran - MD3 Expressive
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { MD3Card } from '../common';
import MD3Button from '../common/MD3Button';
import { MapView } from '../map';
import MapboxMapView from '../map/MapboxMapView';

const MapScreen = ({
  // Props de state
  friends,
  availableFriends,
  location,
  locationError,
  useMapbox,
  darkMode,
  isAvailable,
  currentActivity,
  currentUser,

  // Props de fonctions
  onInviteFriends,
  onRetryGeolocation,
  onRequestLocationPermission,
}) => {
  // Composant de carte selon les préférences
  const MapComponent = useMapbox ? MapboxMapView : MapView;

  return (
    <div className="h-full relative overflow-hidden">
      {location ? (
        <MapComponent
          friends={friends}
          availableFriends={availableFriends}
          userLocation={location}
          onInviteFriends={onInviteFriends}
          darkMode={darkMode}
          isAvailable={isAvailable}
          selectedActivity={currentActivity}
          currentUser={currentUser}
          showControls={true}
          onRetryGeolocation={onRetryGeolocation}
          onRequestLocationPermission={onRequestLocationPermission}
        />
      ) : (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface-container-low)] to-[var(--md-sys-color-surface-container)]">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--md-sys-color-primary)]/5"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[var(--md-sys-color-tertiary)]/5"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10"
          >
            <MD3Card
              variant="elevated"
              className="p-8 max-w-sm mx-4 text-center"
            >
              {/* Icon container with animation */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-primary-container)] flex items-center justify-center"
                animate={
                  locationError
                    ? {}
                    : {
                        scale: [1, 1.05, 1],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {locationError ? (
                  <MapPin
                    size={36}
                    className="text-[var(--md-sys-color-error)]"
                  />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Navigation
                      size={36}
                      className="text-[var(--md-sys-color-on-primary-container)]"
                    />
                  </motion.div>
                )}
              </motion.div>

              <h3 className="text-headline-small font-semibold text-[var(--md-sys-color-on-surface)] mb-3">
                {locationError
                  ? 'Localisation désactivée'
                  : 'Localisation en cours...'}
              </h3>

              <p className="text-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
                {locationError
                  ? 'Activez la géolocalisation pour voir vos amis sur la carte.'
                  : 'Nous déterminons votre position pour afficher vos amis.'}
              </p>

              {locationError && (
                <>
                  <p className="text-body-small text-[var(--md-sys-color-on-surface-variant)]/70 mb-6 leading-relaxed">
                    L'application a besoin de votre position GPS pour vous
                    localiser sur la carte et permettre à vos amis de vous
                    retrouver.
                  </p>

                  <MD3Button
                    onClick={onRetryGeolocation}
                    fullWidth
                    size="large"
                    icon={<MapPin size={20} />}
                  >
                    Activer la localisation
                  </MD3Button>
                </>
              )}

              {!locationError && (
                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </MD3Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
