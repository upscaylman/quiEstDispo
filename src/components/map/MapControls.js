import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Filter, Minus, Plus } from 'lucide-react';
import React from 'react';

const MapControls = ({
  // Props d'état
  showControls,
  userLocation,
  darkMode,
  zoom,
  showFilters,
  activityFilter,
  isFollowingUser,
  activities,

  // Props de fonctions
  onZoomIn,
  onZoomOut,
  onCenterUser,
  onToggleFilters,
  onFilterChange,
}) => {
  if (!showControls) return null;

  return (
    <>
      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onZoomIn}
          className={`w-10 h-10 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
          } rounded-lg shadow-lg flex items-center justify-center`}
        >
          <Plus size={20} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onZoomOut}
          className={`w-10 h-10 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
          } rounded-lg shadow-lg flex items-center justify-center`}
        >
          <Minus size={20} />
        </motion.button>
      </div>

      {/* Bouton centrer sur utilisateur */}
      {userLocation && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCenterUser}
          className={`absolute bottom-20 right-4 z-40 w-12 h-12 ${
            isFollowingUser
              ? 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700'
          } rounded-full shadow-lg flex items-center justify-center`}
        >
          <Crosshair size={20} />
        </motion.button>
      )}

      {/* Bouton filtres */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleFilters}
        className={`absolute top-4 left-4 z-40 w-10 h-10 ${
          showFilters
            ? 'bg-blue-500 text-white'
            : darkMode
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700'
        } rounded-lg shadow-lg flex items-center justify-center`}
      >
        <Filter size={20} />
      </motion.button>

      {/* Panel de filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`absolute top-16 left-4 z-40 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg shadow-xl p-4 min-w-48`}
          >
            <h3
              className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Filtres
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`w-full text-left px-3 py-2 rounded ${
                  activityFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Toutes les activités
              </button>
              {activities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => onFilterChange(activity.id)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center ${
                    activityFilter === activity.id
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <activity.icon size={16} className="mr-2" />
                  {activity.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Variante pour Mapbox avec contrôles réorganisés
export const MapboxControls = ({
  // Props d'état
  showControls,
  userLocation,
  darkMode,
  showFilters,
  activityFilter,
  isFollowingUser,
  activities,

  // Props de fonctions
  onCenterUser,
  onToggleFilters,
  onFilterChange,
}) => {
  if (!showControls) return null;

  return (
    <>
      {/* Bouton filtres - NOUVEAU : en haut à droite (place du zoom) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleFilters}
        className={`absolute top-4 right-4 z-40 w-10 h-10 ${
          showFilters
            ? 'bg-blue-500 text-white'
            : darkMode
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700'
        } rounded-lg shadow-lg flex items-center justify-center`}
      >
        <Filter size={20} />
      </motion.button>

      {/* Bouton centrer sur utilisateur - NOUVEAU : sous le filtre */}
      {userLocation && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCenterUser}
          className={`absolute top-16 right-4 z-40 w-10 h-10 ${
            isFollowingUser
              ? 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700'
          } rounded-lg shadow-lg flex items-center justify-center`}
        >
          <Crosshair size={20} />
        </motion.button>
      )}

      {/* Panel de filtres - NOUVEAU : s'ouvre depuis la droite */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`absolute top-16 right-4 z-40 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg shadow-xl p-4 min-w-48`}
          >
            <h3
              className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Filtres
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`w-full text-left px-3 py-2 rounded ${
                  activityFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Toutes les activités
              </button>
              {activities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => onFilterChange(activity.id)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center ${
                    activityFilter === activity.id
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <activity.icon size={16} className="mr-2" />
                  {activity.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapControls;
