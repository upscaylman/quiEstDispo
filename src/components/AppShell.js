// Composant AppShell - Structure principale et navigation
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Coffee, MapPin, Users } from 'lucide-react';
import React from 'react';
import InviteFriendsModal from './InviteFriendsModal';
import NotificationBadge from './NotificationBadge';

// Import des composants screens
import FriendsScreen from './screens/FriendsScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';

const AppShell = ({
  // Props de state
  user,
  currentScreen,
  darkMode,
  isOnline,
  notifications,
  newNotificationsCount,
  newFriendsNotificationsCount,
  friends,
  isAvailable,
  currentActivity,
  availabilityStartTime,
  availableFriends,
  location,
  locationError,
  useMapbox,
  themeMode,
  pushNotificationStatus,

  // Props de modales
  showInviteFriendsModal,
  setShowInviteFriendsModal,
  selectedInviteActivity,

  // Props de fonctions
  onScreenChange,
  onSetAvailability,
  onStopAvailability,
  onTerminateActivity,
  onRetryGeolocation,
  onRequestLocationPermission,
  onInviteFriends,
  onAddFriend,
  onAddFriendById,
  onRemoveFriend,
  onDebugFriends,
  onCreateTestFriendships,
  onLoadMockData,
  onFriendInvitationResponse,
  onActivityInvitationResponse,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onMarkAllFriendsNotificationsAsRead,
  onProfileUpdate,
  onThemeChange,
  onEnablePushNotifications,
  onTestPushNotification,
  onCheckPushStatus,
  onOpenDebugNotifications,
  onShowDeleteAccount,
  onSignOut,
  onSendInvitations,
  children,
}) => {
  // Fonction pour rendre la navigation en bas (tabs)
  const renderBottomNavigation = () => {
    // Ne pas afficher la navigation sur les écrans de paramètres et notifications
    if (
      currentScreen === 'settings' ||
      currentScreen === 'notifications' ||
      currentScreen === 'debug-notifications'
    ) {
      return null;
    }

    const tabs = [
      {
        id: 'home',
        label: 'Accueil',
        icon: Coffee,
        active: currentScreen === 'home',
      },
      {
        id: 'map',
        label: 'Carte',
        icon: MapPin,
        active: currentScreen === 'map',
      },
      {
        id: 'friends',
        label: 'Amis',
        icon: Users,
        active: currentScreen === 'friends',
        badge:
          newFriendsNotificationsCount > 0
            ? newFriendsNotificationsCount
            : null,
      },
    ];

    return (
      <nav
        className={`fixed bottom-0 left-0 right-0 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-t px-responsive py-2 z-50`}
      >
        <div className="flex justify-around">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.active;

            return (
              <button
                key={tab.id}
                onClick={() => onScreenChange(tab.id)}
                className={`flex flex-col items-center py-1 px-2 relative ${
                  isActive
                    ? 'text-blue-600'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{tab.label}</span>

                {/* Badge pour les amis - uniquement si pas actif pour éviter la confusion */}
                {tab.badge && !isActive && (
                  <span
                    className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  };

  // Fonction pour rendre le header approprié
  const renderHeader = () => {
    // Header spécial pour les pages Paramètres et Notifications
    if (currentScreen === 'settings' || currentScreen === 'notifications') {
      return (
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm px-responsive py-4 sticky top-0 z-10`}
        >
          <div className="flex items-center">
            {/* Flèche de retour */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onScreenChange('home')}
              className={`p-2 rounded-full mr-3 transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={20} />
            </motion.button>

            {/* Titre */}
            <div className="flex items-center gap-3">
              {currentScreen === 'notifications' && (
                <div
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Bell
                    size={24}
                    className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                  />
                </div>
              )}
              <div>
                <h1
                  className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {currentScreen === 'settings' && 'Paramètres'}
                  {currentScreen === 'notifications' && 'Notifications'}
                </h1>
                <p
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  {currentScreen === 'settings' &&
                    'Gérer votre profil et préférences'}
                  {currentScreen === 'notifications' &&
                    `${notifications.length} notifications`}
                  {!isOnline && (
                    <span className="text-orange-500 text-xs ml-2">
                      • Mode hors ligne
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Header normal pour les autres pages
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm px-responsive py-4 sticky top-0 z-10`}
      >
        <div className="flex items-center justify-between">
          {/* Avatar profil à gauche */}
          <div className="flex items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onScreenChange('settings')}
              className="relative mr-3 cursor-pointer"
              title="Paramètres"
            >
              {/* Contour dégradé circulaire */}
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 transition-all ${
                  currentScreen === 'settings'
                    ? 'shadow-lg shadow-blue-500/25'
                    : 'hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <div
                  className={`w-full h-full ${
                    currentScreen === 'settings'
                      ? 'bg-blue-500'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300'
                  } rounded-full flex items-center justify-center transition-all`}
                >
                  {user.avatar && user.avatar.startsWith('http') ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">{user.avatar || '👤'}</span>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Titres */}
            <div className="flex items-center gap-3">
              {/* Icône pour chaque onglet dans un carré */}
              {currentScreen === 'home' && (
                <div
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Coffee
                    size={24}
                    className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                  />
                </div>
              )}
              {currentScreen === 'map' && (
                <div
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <MapPin
                    size={24}
                    className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                  />
                </div>
              )}
              {currentScreen === 'friends' && (
                <div
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Users
                    size={24}
                    className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                  />
                </div>
              )}
              <div>
                <h1
                  className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {currentScreen === 'home' &&
                    `Salut ${user.name?.split(' ')[0]}! 👋`}
                  {currentScreen === 'map' && 'Carte'}
                  {currentScreen === 'friends' && 'Mes Amis'}
                  {currentScreen === 'notifications' && 'Notifications'}
                </h1>
                <p
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  {currentScreen === 'home' &&
                    (isAvailable
                      ? `Tu es dispo pour ${currentActivity === 'coffee' ? 'Coffee' : currentActivity === 'lunch' ? 'Lunch' : currentActivity === 'drinks' ? 'Drinks' : currentActivity === 'chill' ? 'Chill' : currentActivity === 'clubbing' ? 'Clubbing' : currentActivity === 'cinema' ? 'Cinema' : currentActivity}`
                      : 'Que veux-tu faire ?')}
                  {currentScreen === 'friends' && `${friends.length} amis`}
                  {currentScreen === 'notifications' &&
                    `${notifications.length} notifications`}
                  {!isOnline && (
                    <span className="text-orange-500 text-xs ml-2">
                      • Mode hors ligne
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Bouton notifications à droite */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onScreenChange('notifications')}
            className={`relative p-2 rounded-full transition-colors ${
              currentScreen === 'notifications'
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Bell size={20} />
            {newNotificationsCount > 0 && (
              <NotificationBadge count={newNotificationsCount} />
            )}
          </motion.button>
        </div>
      </div>
    );
  };

  // Fonction pour rendre l'écran approprié
  const renderScreen = () => {
    switch (currentScreen) {
      case 'friends':
        return (
          <FriendsScreen
            friends={friends}
            darkMode={darkMode}
            isOnline={isOnline}
            user={user}
            notifications={notifications}
            newFriendsNotificationsCount={newFriendsNotificationsCount}
            onAddFriend={onAddFriend}
            onRemoveFriend={onRemoveFriend}
            onMarkAllFriendsNotificationsAsRead={onMarkAllNotificationsAsRead}
            onDebugFriends={onDebugFriends}
            onCreateTestFriendships={onCreateTestFriendships}
            onLoadMockData={onLoadMockData}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            darkMode={darkMode}
            onFriendInvitationResponse={onFriendInvitationResponse}
            onActivityInvitationResponse={onActivityInvitationResponse}
            onMarkNotificationAsRead={onMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            user={user}
            darkMode={darkMode}
            themeMode={themeMode}
            pushNotificationStatus={pushNotificationStatus}
            currentScreen={currentScreen}
            onProfileUpdate={onProfileUpdate}
            onThemeChange={onThemeChange}
            onEnablePushNotifications={onEnablePushNotifications}
            onTestPushNotification={onTestPushNotification}
            onCheckPushStatus={onCheckPushStatus}
            onOpenDebugNotifications={onOpenDebugNotifications}
            onShowDeleteAccount={onShowDeleteAccount}
            onSignOut={onSignOut}
          />
        );

      case 'map':
        return (
          <MapScreen
            friends={friends}
            availableFriends={availableFriends}
            location={location}
            locationError={locationError}
            useMapbox={useMapbox}
            darkMode={darkMode}
            isAvailable={isAvailable}
            currentActivity={currentActivity}
            onInviteFriends={onInviteFriends}
            onRetryGeolocation={onRetryGeolocation}
          />
        );

      case 'debug-notifications':
        return (
          <SettingsScreen
            user={user}
            darkMode={darkMode}
            themeMode={themeMode}
            pushNotificationStatus={pushNotificationStatus}
            currentScreen={currentScreen}
            onProfileUpdate={onProfileUpdate}
            onThemeChange={onThemeChange}
            onEnablePushNotifications={onEnablePushNotifications}
            onTestPushNotification={onTestPushNotification}
            onCheckPushStatus={onCheckPushStatus}
            onOpenDebugNotifications={onOpenDebugNotifications}
            onShowDeleteAccount={onShowDeleteAccount}
            onSignOut={onSignOut}
          />
        );

      default:
        return (
          <HomeScreen
            isAvailable={isAvailable}
            currentActivity={currentActivity}
            availabilityStartTime={availabilityStartTime}
            availableFriends={availableFriends}
            friends={friends}
            location={location}
            locationError={locationError}
            useMapbox={useMapbox}
            darkMode={darkMode}
            isOnline={isOnline}
            user={user}
            notifications={notifications}
            onSetAvailability={onSetAvailability}
            onStopAvailability={onStopAvailability}
            onTerminateActivity={onTerminateActivity}
            onRetryGeolocation={onRetryGeolocation}
            onRequestLocationPermission={onRequestLocationPermission}
            onInviteFriends={onInviteFriends}
            onAddFriend={onAddFriend}
            onCreateTestFriendships={onCreateTestFriendships}
            onLoadMockData={onLoadMockData}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors flex flex-col`}
    >
      {/* Header */}
      {renderHeader()}

      {/* Contenu principal */}
      <div className="flex-1 pb-16">{renderScreen()}</div>

      {/* Navigation en bas */}
      {renderBottomNavigation()}

      {/* Modal d'invitation d'amis */}
      <InviteFriendsModal
        isOpen={showInviteFriendsModal}
        onClose={() => setShowInviteFriendsModal(false)}
        onSendInvitations={onSendInvitations}
        activity={selectedInviteActivity}
        friends={friends}
        notifications={notifications}
        darkMode={darkMode}
      />

      {/* Éléments enfants (modales, etc.) */}
      {children}
    </div>
  );
};

export default AppShell;
