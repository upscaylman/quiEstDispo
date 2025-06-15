import React from 'react';
import MapControls from './MapControls';
import MapMarkers from './MapMarkers';
import useMapLogic from './useMapLogic';

const MapView = ({
  availableFriends = [],
  userLocation,
  darkMode = false,
  selectedActivity,
  isAvailable = false,
  showControls = true,
  onRetryGeolocation,
  onRequestLocationPermission,
}) => {
  // Utiliser le hook de logique métier
  const {
    // États
    selectedFriend,
    mapCenter,
    zoom,
    showFilters,
    activityFilter,
    isFollowingUser,
    mapStyle,
    mapRef,

    // Données calculées
    filteredFriends,

    // Fonctions utilitaires
    latLngToPixel,
    calculateDistance,
    formatDistance,
    getActivityColor,

    // Gestionnaires d'événements
    handleZoomIn,
    handleZoomOut,
    handleCenterOnUser,
    handleToggleFilters,
    handleFilterChange,
    handleFriendSelect,
    handleFriendDeselect,

    // Constantes
    activities,
  } = useMapLogic({
    availableFriends,
    userLocation,
    darkMode,
    selectedActivity,
    isAvailable,
  });

  return (
    <div className="h-full relative overflow-hidden">
      {/* Carte de fond stylisée */}
      <div
        ref={mapRef}
        className={`w-full h-full relative ${
          mapStyle === 'dark'
            ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
            : 'bg-gradient-to-br from-blue-200 via-green-100 to-purple-100'
        }`}
        style={{
          backgroundImage:
            mapStyle === 'dark'
              ? `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)`,
        }}
      >
        {/* Grille de fond pour effet carte */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
              linear-gradient(90deg, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Points d'intérêt décoratifs */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Routes stylisées */}
          <div
            className={`absolute ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } opacity-30`}
            style={{
              width: '100%',
              height: '2px',
              top: '30%',
              transform: 'rotate(-15deg)',
            }}
          />
          <div
            className={`absolute ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } opacity-30`}
            style={{
              width: '100%',
              height: '2px',
              top: '70%',
              transform: 'rotate(15deg)',
            }}
          />
        </div>

        {/* Marqueurs (amis + utilisateur) */}
        <MapMarkers
          filteredFriends={filteredFriends}
          userLocation={userLocation}
          selectedFriend={selectedFriend}
          darkMode={darkMode}
          isAvailable={isAvailable}
          selectedActivity={selectedActivity}
          latLngToPixel={latLngToPixel}
          calculateDistance={calculateDistance}
          formatDistance={formatDistance}
          getActivityColor={getActivityColor}
          onFriendSelect={handleFriendSelect}
          onFriendDeselect={handleFriendDeselect}
          onRetryGeolocation={onRetryGeolocation}
          onRequestLocationPermission={onRequestLocationPermission}
        />
      </div>

      {/* Contrôles de la carte */}
      <MapControls
        showControls={showControls}
        userLocation={userLocation}
        darkMode={darkMode}
        zoom={zoom}
        showFilters={showFilters}
        activityFilter={activityFilter}
        isFollowingUser={isFollowingUser}
        activities={activities}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenterUser={handleCenterOnUser}
        onToggleFilters={handleToggleFilters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default MapView;
