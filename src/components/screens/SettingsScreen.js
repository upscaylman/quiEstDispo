// Écran des paramètres
import { motion } from 'framer-motion';
import { Bell, Moon, Palette, Smartphone, Sun } from 'lucide-react';
import React from 'react';
import NotificationTest from '../NotificationTest';
import ProfileEditor from '../ProfileEditor';

const SettingsScreen = ({
  // Props de state
  user,
  darkMode,
  themeMode,
  pushNotificationStatus,
  currentScreen,
  useMapbox,

  // Props de fonctions
  onProfileUpdate,
  onThemeChange,
  onMapProviderChange,
  onEnablePushNotifications,
  onTestPushNotification,
  onCheckPushStatus,
  onOpenDebugNotifications,
  onShowDeleteAccount,
  onSignOut,
}) => {
  // Écran de debug des notifications
  if (currentScreen === 'debug-notifications') {
    return <NotificationTest user={user} darkMode={darkMode} />;
  }

  return (
    <div className="px-responsive py-4">
      {/* Section Profil */}
      <ProfileEditor
        user={user}
        onProfileUpdate={onProfileUpdate}
        darkMode={darkMode}
      />

      {/* Section Apparence */}
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          🎨 Apparence
        </h3>

        {/* Toggle Thème Clair/Sombre */}
        <div
          className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Palette
                size={18}
                className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              />
              <div>
                <h5
                  className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Thème
                </h5>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {themeMode === 'auto'
                    ? 'Géré automatiquement par votre appareil'
                    : themeMode === 'dark'
                      ? 'Interface sombre activée'
                      : 'Interface claire activée'}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                themeMode !== 'auto' &&
                onThemeChange(themeMode === 'dark' ? 'light' : 'dark')
              }
              disabled={themeMode === 'auto'}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                themeMode === 'auto'
                  ? darkMode
                    ? 'bg-gray-600 opacity-50'
                    : 'bg-gray-300 opacity-50'
                  : themeMode === 'dark'
                    ? 'bg-blue-500'
                    : darkMode
                      ? 'bg-gray-600'
                      : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                  themeMode === 'auto'
                    ? 'bg-gray-400 translate-x-3'
                    : themeMode === 'dark'
                      ? 'bg-white translate-x-6'
                      : 'bg-white translate-x-0'
                }`}
              >
                {themeMode === 'auto' ? (
                  <Smartphone size={12} className="text-gray-600" />
                ) : themeMode === 'dark' ? (
                  <Moon size={12} className="text-gray-600" />
                ) : (
                  <Sun size={12} className="text-gray-600" />
                )}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Toggle Thème Automatique */}
        <div
          className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 mt-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Smartphone
                size={18}
                className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              />
              <div>
                <h5
                  className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Thème automatique
                </h5>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {themeMode === 'auto'
                    ? 'Suit automatiquement votre appareil'
                    : 'Désactivé - thème manuel'}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                onThemeChange(themeMode === 'auto' ? 'light' : 'auto')
              }
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                themeMode === 'auto'
                  ? 'bg-purple-500'
                  : darkMode
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  themeMode === 'auto' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Section Notifications Push */}
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          📱 Notifications Push
        </h3>

        <div
          className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Bell
                size={18}
                className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              />
              <div>
                <h5
                  className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Notifications Push
                </h5>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {pushNotificationStatus.subscribed
                    ? 'Activées et fonctionnelles'
                    : pushNotificationStatus.permission === 'granted'
                      ? 'Autorisées mais non configurées'
                      : pushNotificationStatus.permission === 'denied'
                        ? 'Refusées par le navigateur'
                        : 'Non configurées'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onEnablePushNotifications}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
            >
              🔔 Activer
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onTestPushNotification}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
            >
              🧪 Tester
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCheckPushStatus}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded"
            >
              🔍 Statut
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenDebugNotifications}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded"
            >
              🐛 Debug
            </motion.button>
          </div>
        </div>
      </div>

      {/* Section Test des Notifications Firestore */}
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          🧪 Test des Notifications Firestore
        </h3>

        <NotificationTest darkMode={darkMode} />
      </div>

      {/* Section Debug Notifications (dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            🔧 Debug Notifications (dev)
          </h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDebugNotifications}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            🔍 Ouvrir le diagnostic
          </motion.button>
        </div>
      )}

      {/* Section Provider de Cartes (dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            🗺️ Provider de Cartes (dev)
          </h3>

          <div
            className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h.01M15 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <div>
                  <h5
                    className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Utiliser Mapbox
                  </h5>
                  <p
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {useMapbox
                      ? 'Cartes Mapbox activées'
                      : 'Cartes CSS par défaut'}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onMapProviderChange(useMapbox ? 'default' : 'mapbox')
                }
                className={`w-14 h-8 rounded-full p-1 transition-colors ${
                  useMapbox
                    ? 'bg-blue-500'
                    : darkMode
                      ? 'bg-gray-600'
                      : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    useMapbox ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Zone dangereuse */}
      <div
        className={`${
          darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
        } border rounded-lg p-6 shadow mb-4`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            darkMode ? 'text-red-300' : 'text-red-700'
          } flex items-center`}
        >
          ⚠️ Zone dangereuse
        </h3>
        <p
          className={`text-sm mb-4 ${darkMode ? 'text-red-200' : 'text-red-600'}`}
        >
          Cette action est irréversible. Toutes vos données seront
          définitivement supprimées.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowDeleteAccount}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
        >
          🗑️ Supprimer mon compte
        </motion.button>
      </div>

      {/* Section Déconnexion */}
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow`}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSignOut}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Se déconnecter
        </motion.button>
      </div>
    </div>
  );
};

export default SettingsScreen;
