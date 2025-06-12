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

  // Props de fonctions
  onProfileUpdate,
  onThemeChange,
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
                        : pushNotificationStatus.supported
                          ? 'Disponibles sur ce navigateur'
                          : 'Non supportées sur ce navigateur'}
                </p>
              </div>
            </div>

            {pushNotificationStatus.supported && (
              <div className="flex items-center space-x-2">
                {/* Toggle Switch */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={
                    pushNotificationStatus.subscribed
                      ? null
                      : onEnablePushNotifications
                  }
                  disabled={pushNotificationStatus.subscribed}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    pushNotificationStatus.subscribed
                      ? 'bg-green-500'
                      : pushNotificationStatus.permission === 'denied'
                        ? 'bg-red-500'
                        : darkMode
                          ? 'bg-gray-600'
                          : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      pushNotificationStatus.subscribed
                        ? 'translate-x-6'
                        : 'translate-x-0'
                    }`}
                  />
                </motion.button>

                {/* Bouton Test */}
                {pushNotificationStatus.subscribed && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onTestPushNotification}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                    title="Tester les notifications"
                  >
                    <Bell
                      size={16}
                      className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                    />
                  </motion.button>
                )}

                {/* Bouton Vérifier */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCheckPushStatus}
                  className={`p-2 rounded-full ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors`}
                  title="Vérifier le statut"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                    <path d="M6 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                    <path d="M13 12h1"></path>
                  </svg>
                </motion.button>
              </div>
            )}

            {/* Si non supporté */}
            {!pushNotificationStatus.supported && (
              <div className="text-red-500">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M15 9l-6 6"></path>
                  <path d="M9 9l6 6"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
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
