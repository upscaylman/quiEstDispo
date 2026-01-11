// Application refactorisée avec AppShell et components modulaires
import { useCallback, useEffect, useState } from 'react';
import AddFriendModal from './components/AddFriendModal';
import AppShell from './components/AppShell';
import CookieConsent from './components/CookieConsent';
import DeleteAccountModal from './components/DeleteAccountModal';
import InviteFriendsModal from './components/InviteFriendsModal';
import LoginScreen from './components/LoginScreen';
import UpdateNotification from './components/UpdateNotification';
import WarningBanner from './components/WarningBanner';
import { useAuth } from './hooks/useAuth';
import { useGeolocation } from './hooks/useGeolocation';
import { CookieService } from './services/cookieService';
import {
  AvailabilityService,
  FriendsService,
  InvitationService,
  NotificationService,
} from './services/firebaseService';
import PushNotificationService from './services/pushNotificationService';
import { getMockDataForOfflineMode } from './utils/mockData';

function App() {
  const { user, loading, signOut } = useAuth();
  const { location, error: locationError, retryGeolocation } = useGeolocation();

  // État principal
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);
  const [availabilityStartTime, setAvailabilityStartTime] = useState(null);
  const [friends, setFriends] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modales
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false);
  const [selectedInviteActivity, setSelectedInviteActivity] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Thème et préférences
  const [themeMode, setThemeMode] = useState(() => {
    const cookieTheme = CookieService.getThemePreference();
    if (cookieTheme) return cookieTheme;
    const saved = localStorage.getItem('themeMode');
    return saved || 'light';
  });

  const [darkMode, setDarkMode] = useState(false);
  const [useMapbox, setUseMapbox] = useState(() => {
    const cookieProvider = CookieService.getMapProviderPreference();
    if (cookieProvider !== null) return cookieProvider === 'mapbox';
    return true;
  });

  // État système
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushNotificationStatus, setPushNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

  // ====================
  // FONCTIONS UTILITAIRES
  // ====================

  // Vérifier le statut des notifications push
  const checkPushNotificationStatus = useCallback(async () => {
    try {
      const status = await PushNotificationService.checkStatus();
      setPushNotificationStatus(status);
      console.log('📱 Statut notifications push:', status);
    } catch (error) {
      console.error('Erreur vérification notifications push:', error);
    }
  }, []);

  // Activer les notifications push
  const enablePushNotifications = async () => {
    try {
      await PushNotificationService.requestPermission();
      await checkPushNotificationStatus();
      console.log('✅ Notifications push activées');
    } catch (error) {
      console.error('❌ Erreur activation notifications push:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Tester les notifications push
  const testPushNotification = async () => {
    try {
      await PushNotificationService.sendTestPushNotification();
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // ====================
  // EFFECTS
  // ====================

  // Gérer le thème automatique
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;
      if (themeMode === 'dark') {
        shouldBeDark = true;
      } else if (themeMode === 'auto') {
        shouldBeDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
      }
      setDarkMode(shouldBeDark);
    };

    updateTheme();
    localStorage.setItem('themeMode', themeMode);
    CookieService.setThemePreference(themeMode);

    let mediaQuery;
    if (themeMode === 'auto') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
    }

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', updateTheme);
      }
    };
  }, [themeMode]);

  // Écouter les changements de consentement cookies
  useEffect(() => {
    const handleConsentChange = event => {
      const { preferences } = event.detail;
      console.log('🍪 Consentement cookies mis à jour:', preferences);
      if (preferences.analytics) {
        CookieService.setAnalyticsSession();
      }
      CookieService.trackPageView(currentScreen);
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);
    return () =>
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
  }, [currentScreen]);

  // Charger les données utilisateur
  useEffect(() => {
    if (!user) return;

    let unsubscribeNotifications;
    let unsubscribeFriends;
    let unsubscribeUserFriends;

    const loadDataOptimized = async () => {
      try {
        await retryGeolocation();

        // Charger les amis
        const friendsData = await FriendsService.getFriends(user.uid);
        setFriends(friendsData);

        // Écouter les notifications en temps réel
        unsubscribeNotifications = NotificationService.listenToNotifications(
          user.uid,
          setNotifications
        );

        // Écouter les amis disponibles
        unsubscribeFriends = AvailabilityService.listenToAvailableFriends(
          user.uid,
          setAvailableFriends
        );

        // Écouter les changements d'amis
        unsubscribeUserFriends = FriendsService.listenToFriends(
          user.uid,
          setFriends
        );

        console.log('✅ Données chargées avec succès');
      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        if (!navigator.onLine) {
          console.log(
            '🔄 Mode offline détecté, chargement données fictives...'
          );
          const mockData = getMockDataForOfflineMode();
          setFriends(mockData.friends);
          setAvailableFriends(mockData.availableFriends);
        }
      }
    };

    loadDataOptimized();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeFriends) unsubscribeFriends();
      if (unsubscribeUserFriends) unsubscribeUserFriends();
    };
  }, [user, retryGeolocation]);

  // Vérifier le statut push au montage
  useEffect(() => {
    checkPushNotificationStatus();
  }, [checkPushNotificationStatus]);

  // ====================
  // HANDLERS D'ACTIONS
  // ====================

  // Démarrer une disponibilité
  const handleActivityClick = async activity => {
    if (!location) {
      alert('Votre position est requise pour cette fonctionnalité');
      await retryGeolocation();
      return;
    }

    try {
      const id = await AvailabilityService.setAvailability(
        user.uid,
        activity,
        location
      );
      setAvailabilityId(id);
      setIsAvailable(true);
      setCurrentActivity(activity);
      setAvailabilityStartTime(new Date().toISOString());
      console.log(`✅ Disponibilité ${activity} créée`);
    } catch (error) {
      console.error('❌ Erreur création disponibilité:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Arrêter la disponibilité
  const handleStopAvailability = async () => {
    if (!availabilityId) return;

    try {
      await AvailabilityService.stopAvailability(availabilityId);
      setIsAvailable(false);
      setCurrentActivity(null);
      setAvailabilityId(null);
      setAvailabilityStartTime(null);
      console.log('✅ Disponibilité arrêtée');
    } catch (error) {
      console.error('❌ Erreur arrêt disponibilité:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Répondre à une disponibilité d'ami
  const sendResponseNotification = async (friendAvailability, responseType) => {
    try {
      const responseMessage =
        responseType === 'join'
          ? `${user.name} veut vous rejoindre !`
          : `${user.name} ne peut pas vous rejoindre cette fois`;

      await NotificationService.sendNotification(
        friendAvailability.userId,
        responseMessage,
        'availability_response',
        { responseType, responderId: user.uid }
      );

      // Enregistrer la réponse
      await AvailabilityService.recordResponse(
        friendAvailability.id,
        user.uid,
        responseType
      );

      console.log(`✅ Réponse "${responseType}" envoyée`);
    } catch (error) {
      console.error('❌ Erreur envoi réponse:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Envoyer des invitations
  const handleSendInvitations = async (activity, friendIds) => {
    if (!location) {
      alert('Votre position est requise');
      return;
    }

    try {
      const results = await Promise.allSettled(
        friendIds.map(async friendId => {
          const friend = friends.find(f => f.id === friendId);
          const invitationData = {
            fromUserId: user.uid,
            fromUserName: user.name,
            toUserId: friendId,
            activity,
            location,
            message: `${user.name} vous invite pour ${activity} !`,
            createdAt: new Date(),
            status: 'pending',
          };

          const invitationId =
            await InvitationService.sendInvitation(invitationData);

          await NotificationService.sendNotification(
            friendId,
            `${user.name} vous invite pour ${activity} !`,
            'activity_invitation',
            { invitationId, activity, location }
          );

          return { friendId, friend: friend?.name, success: true };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        alert(`${successful} invitation(s) envoyée(s) !`);
      }
      if (failed > 0) {
        console.error(`❌ ${failed} invitation(s) échouée(s)`);
      }

      setShowInviteFriendsModal(false);
      setSelectedInviteActivity(null);
    } catch (error) {
      console.error('❌ Erreur envoi invitations:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Répondre à une invitation d'amitié
  const handleFriendInvitationResponse = async (
    invitationId,
    response,
    notificationId
  ) => {
    try {
      // Traiter la réponse dans Firebase
      const result = await FriendsService.respondToFriendInvitation(
        invitationId,
        response,
        user.uid
      );

      if (result.success) {
        // Supprimer la notification
        await NotificationService.markAsRead(notificationId);

        // Actualiser les notifications et amis
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        if (response === 'accepted') {
          // Recharger la liste d'amis
          const updatedFriends = await FriendsService.getFriends(user.uid);
          setFriends(updatedFriends);
        }

        console.log(
          `✅ Invitation ${response === 'accepted' ? 'acceptée' : 'refusée'}`
        );
      }
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Supprimer un ami
  const handleRemoveFriend = async (friendId, friendName) => {
    // Utiliser window.confirm pour éviter l'erreur ESLint
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer ${friendName} de vos amis ?`
      )
    ) {
      return;
    }

    try {
      await FriendsService.removeFriend(user.uid, friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      console.log(`✅ ${friendName} supprimé de vos amis`);
    } catch (error) {
      console.error('❌ Erreur suppression ami:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Gérer la mise à jour du profil
  const handleProfileUpdate = async updates => {
    try {
      // Logique de mise à jour du profil
      console.log('✅ Profil mis à jour:', updates);
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Déconnexion
  const handleSignOut = async () => {
    try {
      if (isAvailable && availabilityId) {
        await AvailabilityService.stopAvailability(availabilityId);
      }
      await signOut();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Suppression de compte
  const handleDeleteAccount = async () => {
    try {
      if (isAvailable && availabilityId) {
        await AvailabilityService.stopAvailability(availabilityId);
      }
      // Logique suppression compte
      console.log('✅ Compte supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression compte:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Marquer notification comme lue
  const markNotificationAsRead = async notificationId => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('❌ Erreur marquer notification:', error);
    }
  };

  // ====================
  // HANDLERS DEBUG
  // ====================

  const handleDebugFriends = async () => {
    try {
      console.log("📊 Debug des relations d'amitié Firebase:");
      if (!isOnline) {
        console.warn('⚠️ Mode offline - analyse locale uniquement');
        console.log('👥 Amis locaux:', friends);
        console.log('🟢 Disponibilités locales:', availableFriends);
        alert("Mode offline - Vérifiez la console pour l'analyse locale");
        return;
      }

      await FriendsService.debugFriendshipData(user.uid);
      console.log('👥 Amis chargés:', friends);
      console.log('🟢 Disponibilités:', availableFriends);
      alert('Analyse Firebase terminée - Vérifiez la console (F12)');
    } catch (error) {
      console.error('❌ Debug failed:', error);
      alert("Erreur lors de l'analyse");
    }
  };

  const handleCreateTestFriendships = async () => {
    try {
      if (!isOnline) {
        alert('Firebase hors ligne - impossible de créer des amitiés');
        return;
      }

      const friendships = await FriendsService.addTestFriendships(user.uid);
      if (friendships && friendships.length > 0) {
        console.log('✅ Amitiés Firebase créées:', friendships);
        alert('Amitiés de test créées ! Rechargement...');
        window.location.reload();
      } else {
        console.log(
          "ℹ️ Aucune amitié créée (normal si pas d'autres utilisateurs)"
        );
        alert('Aucun autre utilisateur trouvé pour créer des amitiés');
      }
    } catch (error) {
      console.error('❌ Erreur création amitiés Firebase:', error);
      alert('Erreur lors de la création des amitiés Firebase');
    }
  };

  const handleLoadMockData = async () => {
    try {
      console.log('🔄 Chargement des données de test (pour demo/test)...');
      const mockData = getMockDataForOfflineMode();
      setFriends(mockData.friends);
      setAvailableFriends(mockData.availableFriends);
      alert('Données de démo chargées temporairement !');
    } catch (error) {
      console.error('❌ Erreur chargement données fictives:', error);
      alert('Erreur lors du chargement des données fictives');
    }
  };

  // ====================
  // RENDU
  // ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <AppShell
        // State props
        user={user}
        currentScreen={currentScreen}
        darkMode={darkMode}
        isOnline={isOnline}
        notifications={notifications}
        friends={friends}
        isAvailable={isAvailable}
        currentActivity={currentActivity}
        availabilityStartTime={availabilityStartTime}
        availableFriends={availableFriends}
        location={location}
        locationError={locationError}
        useMapbox={useMapbox}
        themeMode={themeMode}
        pushNotificationStatus={pushNotificationStatus}
        // Function props
        onScreenChange={setCurrentScreen}
        onSetAvailability={handleActivityClick}
        onStopAvailability={handleStopAvailability}
        onResponseToAvailability={sendResponseNotification}
        onRetryGeolocation={retryGeolocation}
        onInviteFriends={activity => {
          setSelectedInviteActivity(activity);
          setShowInviteFriendsModal(true);
        }}
        onAddFriend={() => setShowAddFriendModal(true)}
        onRemoveFriend={handleRemoveFriend}
        onDebugFriends={handleDebugFriends}
        onCreateTestFriendships={handleCreateTestFriendships}
        onLoadMockData={handleLoadMockData}
        onFriendInvitationResponse={handleFriendInvitationResponse}
        onMarkNotificationAsRead={markNotificationAsRead}
        onProfileUpdate={handleProfileUpdate}
        onThemeChange={setThemeMode}
        onEnablePushNotifications={enablePushNotifications}
        onTestPushNotification={testPushNotification}
        onCheckPushStatus={checkPushNotificationStatus}
        onOpenDebugNotifications={() => setCurrentScreen('debug-notifications')}
        onShowDeleteAccount={() => setShowDeleteAccountModal(true)}
        onSignOut={handleSignOut}
      >
        {/* Modales */}
        {showAddFriendModal && (
          <AddFriendModal
            onClose={() => setShowAddFriendModal(false)}
            darkMode={darkMode}
          />
        )}

        {showInviteFriendsModal && selectedInviteActivity && (
          <InviteFriendsModal
            activity={selectedInviteActivity}
            friends={friends}
            onSendInvitations={handleSendInvitations}
            onClose={() => {
              setShowInviteFriendsModal(false);
              setSelectedInviteActivity(null);
            }}
            darkMode={darkMode}
          />
        )}

        {showDeleteAccountModal && (
          <DeleteAccountModal
            onConfirm={handleDeleteAccount}
            onClose={() => setShowDeleteAccountModal(false)}
            darkMode={darkMode}
          />
        )}

        {/* Composants système */}
        <WarningBanner isOnline={isOnline} darkMode={darkMode} />
        <UpdateNotification />
        <CookieConsent darkMode={darkMode} />
      </AppShell>
    </div>
  );
}

export default App;
