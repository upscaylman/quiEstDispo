// Écran de carte en plein écran
import { Clock as ClockIcon } from 'lucide-react';
import React from 'react';
import MapView from '../MapView';
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

  // Props de fonctions
  onInviteFriends,
  onRetryGeolocation,
}) => {
  // Composant de carte selon les préférences
  const MapComponent = useMapbox ? MapboxMapView : MapView;

  return (
    <div className="h-full">
      {location ? (
        <MapComponent
          friends={friends}
          availableFriends={availableFriends}
          currentLocation={location}
          onInviteFriends={onInviteFriends}
          darkMode={darkMode}
          isAvailable={isAvailable}
          currentActivity={currentActivity}
          showControls={true}
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
              <button
                onClick={onRetryGeolocation}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
