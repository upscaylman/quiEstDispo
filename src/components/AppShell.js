// Composant AppShell - Structure principale et navigation
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Coffee, MapPin, Users } from 'lucide-react';
import NavigationBar from './common/NavigationBar';
import InviteFriendsModal from './InviteFriendsModal';
import NotificationBadge from './NotificationBadge';
import WarningBanner from './WarningBanner';

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
  pendingInvitation,

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
  onMapProviderChange,
  onEnablePushNotifications,
  onTestPushNotification,
  onCheckPushStatus,
  onOpenDebugNotifications,
  onShowDeleteAccount,
  onSignOut,
  onSendInvitations,
  onCancelInvitations,
  onOpenInviteFriendsModal,
  onOpenActivitySelector,
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
      <NavigationBar
        tabs={tabs}
        onTabChange={onScreenChange}
        darkMode={darkMode}
      />
    );
  };

  // Fonction pour rendre le header approprié
  const renderHeader = () => {
    // Header spécial pour les pages Paramètres et Notifications
    if (currentScreen === 'settings' || currentScreen === 'notifications') {
      return (
        <div
          className="px-responsive py-4 sticky top-0 z-50 backdrop-blur-xl"
          style={{
            background: darkMode
              ? 'rgba(30, 30, 35, 0.85)'
              : 'rgba(255, 255, 255, 0.88)',
            boxShadow: darkMode
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
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
        className="px-responsive py-4 sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: darkMode
            ? 'rgba(30, 30, 35, 0.85)'
            : 'rgba(255, 255, 255, 0.88)',
          boxShadow: darkMode
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Titres à gauche */}
          <div className="flex items-center gap-3">
            {/* Icône pour chaque onglet dans un carré */}
            {currentScreen === 'home' && (
              <div
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
              >
                <Coffee
                  size={24}
                  className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                />
              </div>
            )}
            {currentScreen === 'map' && (
              <div
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
              >
                <MapPin
                  size={24}
                  className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                />
              </div>
            )}
            {currentScreen === 'friends' && (
              <div
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
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
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentScreen === 'home' &&
                  (isAvailable
                    ? `Tu es dispo pour ${currentActivity === 'coffee' ? 'Coffee' : currentActivity === 'lunch' ? 'Lunch' : currentActivity === 'drinks' ? 'Drinks' : currentActivity === 'chill' ? 'Chill' : currentActivity === 'clubbing' ? 'Clubbing' : currentActivity === 'cinema' ? 'Cinema' : currentActivity}`
                    : 'Que veux-tu faire ?')}
                {currentScreen === 'map' &&
                  (availableFriends.length > 0
                    ? `${availableFriends.length} ami${availableFriends.length > 1 ? 's' : ''} disponible${availableFriends.length > 1 ? 's' : ''}`
                    : 'Explorer autour de vous')}
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

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            {/* Bouton notifications */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onScreenChange('notifications')}
              className={`relative p-2 rounded-full transition-colors ${
                currentScreen === 'notifications'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'hover:bg-gray-700/50 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Bell size={20} />
              {(newNotificationsCount > 0 || pendingInvitation) && (
                <NotificationBadge
                  count={newNotificationsCount + (pendingInvitation ? 1 : 0)}
                />
              )}
            </motion.button>

            {/* Avatar profil */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onScreenChange('settings')}
              className="relative cursor-pointer"
              title="Paramètres"
            >
              {/* Contour dégradé circulaire */}
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 transition-all ${
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
                  {user.avatar &&
                  (user.avatar.startsWith('http') ||
                    user.avatar.startsWith('data:')) ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm">{user.avatar || '👤'}</span>
                  )}
                </div>
              </div>
            </motion.button>
          </div>
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
            onFriendInvitationResponse={onFriendInvitationResponse}
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
            pendingInvitation={pendingInvitation}
            onCancelInvitations={onCancelInvitations}
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
            useMapbox={useMapbox}
            onProfileUpdate={onProfileUpdate}
            onThemeChange={onThemeChange}
            onMapProviderChange={onMapProviderChange}
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
            currentUser={user}
            onInviteFriends={onInviteFriends}
            onRetryGeolocation={onRetryGeolocation}
            onRequestLocationPermission={onRequestLocationPermission}
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
            useMapbox={useMapbox}
            onProfileUpdate={onProfileUpdate}
            onThemeChange={onThemeChange}
            onMapProviderChange={onMapProviderChange}
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
            pendingInvitation={pendingInvitation}
            onSetAvailability={onSetAvailability}
            onStopAvailability={onStopAvailability}
            onTerminateActivity={onTerminateActivity}
            onCancelInvitations={onCancelInvitations}
            onRetryGeolocation={onRetryGeolocation}
            onRequestLocationPermission={onRequestLocationPermission}
            onInviteFriends={onInviteFriends}
            onAddFriend={onAddFriend}
            onCreateTestFriendships={onCreateTestFriendships}
            onLoadMockData={onLoadMockData}
            onFriendInvitationResponse={onFriendInvitationResponse}
            onActivityInvitationResponse={onActivityInvitationResponse}
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

      {/* Bandeau informatif si aucun ami (tous les écrans sauf settings et debug) */}
      {['home', 'map', 'friends'].includes(currentScreen) &&
        friends.length === 0 && (
          <WarningBanner
            icon={Users}
            title=""
            message="Invitez vos ami(e)s à vous rejoindre"
            darkMode={darkMode}
            onInviteClick={onAddFriend}
            clickableWord="rejoindre"
          />
        )}

      {/* Bandeau informatif si des amis mais aucun disponible */}
      {currentScreen === 'map' &&
        friends.length > 0 &&
        availableFriends.length === 0 && (
          <WarningBanner
            icon={Users}
            title=""
            message="Invitez vos ami(e)s à vous rejoindre"
            darkMode={darkMode}
            onInviteClick={onOpenActivitySelector}
            variant="purple"
            clickableWord="rejoindre"
          />
        )}

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
        currentUserId={user?.uid} // 🔥 NOUVEAU: ID utilisateur pour logique bilatérale
        isActiveEventInvitation={
          isAvailable && currentActivity === selectedInviteActivity
        } // 🎯 NOUVEAU: True si événement actif
      />

      {/* Éléments enfants (modales, etc.) */}
      {children}
    </div>
  );
};

export default AppShell;
