import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Clock as ClockIcon,
  Coffee,
  Facebook,
  FileText,
  HelpCircle,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  Twitter,
  UserPlus,
  Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import AddFriendModal from './components/AddFriendModal';
import AvailabilityButtons from './components/AvailabilityButtons';
import DeleteAccountModal from './components/DeleteAccountModal';
import InviteFriendsModal from './components/InviteFriendsModal';
import LoginScreen from './components/LoginScreen';
import MapView from './components/MapView';
import MapboxMapView from './components/MapboxMapView';
import NotificationBadge from './components/NotificationBadge';
import NotificationTest from './components/NotificationTest';
import ProfileEditor from './components/ProfileEditor';
import UpdateNotification from './components/UpdateNotification';
import WarningBanner from './components/WarningBanner';
import { useAuth } from './hooks/useAuth';
import { useGeolocation } from './hooks/useGeolocation';
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

  const [currentScreen, setCurrentScreen] = useState('home');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);
  const [availabilityStartTime, setAvailabilityStartTime] = useState(null);
  const [friends, setFriends] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false);
  const [selectedInviteActivity, setSelectedInviteActivity] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  // Gestion du thème avec support du mode système
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'light'; // 'light', 'dark', 'auto'
  });

  const [darkMode, setDarkMode] = useState(false);
  const [useMapbox, setUseMapbox] = useState(true); // Utiliser MapboxMapView par défaut
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushNotificationStatus, setPushNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

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

  // Gérer le thème automatique et la sauvegarde
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;

      if (themeMode === 'dark') {
        shouldBeDark = true;
      } else if (themeMode === 'auto') {
        // Détecter le thème du système
        shouldBeDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
      }
      // Si themeMode === 'light', shouldBeDark reste false

      setDarkMode(shouldBeDark);
    };

    // Appliquer le thème immédiatement
    updateTheme();

    // Sauvegarder dans localStorage
    localStorage.setItem('themeMode', themeMode);

    // Écouter les changements du thème système si en mode auto
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

  useEffect(() => {
    if (!user) return;

    let unsubscribeNotifications;
    let unsubscribeFriends;
    let unsubscribeUserFriends;

    const loadDataOptimized = async () => {
      try {
        await retryGeolocation();

        // Charger les amis initialement
        const friendsData = await FriendsService.getFriends(user.uid);
        setFriends(friendsData);

        // Configurer le listener pour les notifications en temps réel
        unsubscribeNotifications = NotificationService.onNotifications(
          user.uid,
          setNotifications
        );

        // Configurer le listener pour les amis disponibles en temps réel
        unsubscribeFriends = AvailabilityService.onAvailableFriends(
          user.uid,
          setAvailableFriends
        );

        // Configurer le listener pour surveiller les changements dans la liste d'amis
        unsubscribeUserFriends = FriendsService.onUserFriendsChange(
          user.uid,
          async () => {
            console.log("📝 Liste d'amis mise à jour, rechargement...");
            const updatedFriends = await FriendsService.getFriends(user.uid);
            setFriends(updatedFriends);
          }
        );

        // Vérifier le statut des notifications push directement
        try {
          const status = await PushNotificationService.checkStatus();
          setPushNotificationStatus(status);
          console.log('📱 Statut notifications push:', status);
        } catch (error) {
          console.error('Erreur vérification notifications push:', error);
        }
      } catch (error) {
        console.error('Erreur chargement des données:', error);
        if (!isOnline) {
          const mockData = getMockDataForOfflineMode();
          setFriends(mockData.friends);
          setAvailableFriends(mockData.availableFriends);
        }
      }
    };

    loadDataOptimized();

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeFriends) unsubscribeFriends();
      if (unsubscribeUserFriends) unsubscribeUserFriends();
    };
  }, [user, isOnline, retryGeolocation]);

  // Détecter les changements de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-stop availability après 45 minutes
  useEffect(() => {
    if (!isAvailable || !availabilityId) return;

    const timer = setTimeout(
      async () => {
        await handleStopAvailability();
      },
      45 * 60 * 1000
    );

    return () => clearTimeout(timer);
  }, [isAvailable, availabilityId]);

  const handleStartAvailability = async activity => {
    if (!user || !location) return;

    const startTime = new Date().getTime();

    try {
      const id = await AvailabilityService.setAvailability(
        user.uid,
        activity,
        location
      );

      setIsAvailable(true);
      setCurrentActivity(activity);
      setAvailabilityId(id);
      setAvailabilityStartTime(startTime);
    } catch (error) {
      // Mode offline - juste mettre à jour l'état local
      setIsAvailable(true);
      setCurrentActivity(activity);
      setAvailabilityId('offline-' + Date.now());
      setAvailabilityStartTime(startTime);
    }
  };

  const handleStopAvailability = async () => {
    if (!user) return;

    try {
      if (availabilityId && !availabilityId.startsWith('offline-')) {
        await AvailabilityService.stopAvailability(user.uid, availabilityId);
      }
    } catch (error) {
      // Ignorer les erreurs
    }

    setIsAvailable(false);
    setCurrentActivity(null);
    setAvailabilityId(null);
    setAvailabilityStartTime(null);
  };

  // Rejoindre l'activité d'un ami
  const handleJoinFriendActivity = async friendAvailability => {
    if (!user || !location) {
      alert('Localisation requise pour rejoindre une activité');
      return;
    }

    if (isAvailable) {
      const confirm = window.confirm(
        `Vous êtes déjà disponible pour ${currentActivity}. Voulez-vous basculer vers ${friendAvailability.activity} ?`
      );
      if (!confirm) return;

      // Arrêter la disponibilité actuelle
      await handleStopAvailability();

      // Attendre un peu pour que l'état se mette à jour
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Démarrer la nouvelle activité
      await handleStartAvailability(friendAvailability.activity);

      // Envoyer notification de réponse à l'ami
      await sendResponseNotification(friendAvailability, 'joined');

      // Retirer l'ami de la liste des disponibles (on a répondu)
      setAvailableFriends(prev =>
        prev.filter(friend => friend.id !== friendAvailability.id)
      );

      // Message de confirmation
      const friendName =
        friendAvailability.friend?.name ||
        friendAvailability.name ||
        'Votre ami';
      alert(
        `✅ Vous êtes maintenant disponible pour ${friendAvailability.activity} comme ${friendName} !`
      );
    } catch (error) {
      console.error("Erreur lors de rejoindre l'activité:", error);
      alert("Erreur lors de rejoindre l'activité");
    }
  };

  // Décliner l'activité d'un ami
  const handleDeclineFriendActivity = async friendAvailability => {
    try {
      // Envoyer notification de déclin à l'ami
      await sendResponseNotification(friendAvailability, 'declined');

      // Retirer l'ami de la liste des disponibles
      setAvailableFriends(prev =>
        prev.filter(friend => friend.id !== friendAvailability.id)
      );

      // Message de confirmation
      const friendName =
        friendAvailability.friend?.name ||
        friendAvailability.name ||
        'Votre ami';
      alert(
        `Vous avez décliné l'invitation de ${friendName} pour ${friendAvailability.activity}`
      );
    } catch (error) {
      console.error("Erreur lors de décliner l'invitation:", error);
      alert("Erreur lors de décliner l'invitation");
    }
  };

  // Envoyer une notification de réponse à un ami
  const sendResponseNotification = async (friendAvailability, responseType) => {
    if (!user) return;

    try {
      const { NotificationService, AvailabilityService } = await import(
        './services/firebaseService'
      );

      const friendId =
        friendAvailability.friend?.id || friendAvailability.userId;
      if (!friendId) {
        console.error("ID de l'ami introuvable");
        return;
      }

      const userName = user.displayName || user.name || 'Un ami';
      const activityName = friendAvailability.activity;

      let message, type, emoji;
      if (responseType === 'joined') {
        message = `${userName} a rejoint votre activité ${activityName} !`;
        type = 'activity_joined';
        emoji = '✅';
      } else {
        message = `${userName} a décliné votre invitation pour ${activityName}`;
        type = 'activity_declined';
        emoji = '❌';
      }

      // Enregistrer la réponse dans Firebase
      await AvailabilityService.recordActivityResponse(
        user.uid,
        friendAvailability.id,
        responseType
      );

      // Créer la notification avec les paramètres corrects
      await NotificationService.createNotification(
        friendId,
        user.uid,
        type,
        `${emoji} ${message}`,
        {
          activityId: friendAvailability.id,
          activity: activityName,
          responseType: responseType,
          fromUserName: userName,
        }
      );

      console.log(
        `📬 Notification envoyée: ${responseType} pour ${activityName}`
      );
    } catch (error) {
      console.error('Erreur envoi notification de réponse:', error);
    }
  };

  // Gérer le clic sur un bouton d'activité (nouveau comportement)
  const handleActivityClick = async activity => {
    if (!user || !location) {
      alert('Localisation requise pour partager une activité');
      return;
    }

    // Ouvrir le modal pour choisir qui inviter
    setSelectedInviteActivity(activity);
    setShowInviteFriendsModal(true);
  };

  // Envoyer des invitations pour une activité
  const handleSendInvitations = async (activity, friendIds) => {
    try {
      if (!user || !location) {
        throw new Error('Utilisateur ou localisation manquant');
      }

      console.log(
        `📨 Envoi d'invitations ${activity} à ${friendIds.length} amis`
      );

      // Envoyer les invitations
      await InvitationService.sendInvitations(
        user.uid,
        activity,
        friendIds,
        location
      );

      // Démarrer sa propre disponibilité
      await handleStartAvailability(activity);

      // Message de succès
      alert(
        `✅ Invitations envoyées à ${friendIds.length} ami${friendIds.length > 1 ? 's' : ''} et vous êtes maintenant disponible pour ${activity} !`
      );
    } catch (error) {
      console.error('❌ Erreur envoi invitations:', error);
      alert(`Erreur lors de l'envoi des invitations: ${error.message}`);
    }
  };

  const addFriendByPhone = async phoneNumber => {
    if (!user) return;

    try {
      const friend = await FriendsService.addFriendByPhone(
        user.uid,
        phoneNumber
      );
      setFriends(prev => [...prev, friend]);
      return friend;
    } catch (error) {
      throw error;
    }
  };

  const addFriendByUserId = async userId => {
    if (!user) return;

    try {
      await FriendsService.addMutualFriendship(user.uid, userId);
      // Recharger la liste des amis
      const friendsData = await FriendsService.getFriends(user.uid);
      setFriends(friendsData);
      return { name: 'Ami' }; // Retour générique
    } catch (error) {
      throw error;
    }
  };

  const handleAddFriend = async identifier => {
    // Si c'est un numéro de téléphone
    if (identifier.includes('+') || identifier.startsWith('0')) {
      return await addFriendByPhone(identifier);
    }
    // Sinon c'est un userId
    return await addFriendByUserId(identifier);
  };

  const handleProfileUpdate = async updatedUser => {
    // Mettre à jour l'état local de l'utilisateur si possible
    // En pratique, on devrait déclencher un rechargement du profil utilisateur
    console.log('📝 Profil mis à jour:', updatedUser);
    // Forcer le rechargement pour récupérer les nouvelles données
    window.location.reload();
  };

  const markNotificationAsRead = async notificationId => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const handleFriendInvitationResponse = async (
    invitationId,
    response,
    notificationId
  ) => {
    try {
      console.log(
        '🔍 Debug - FriendsService disponible:',
        typeof FriendsService
      );
      console.log(
        '🔍 Debug - Méthode respondToFriendInvitation disponible:',
        typeof FriendsService?.respondToFriendInvitation
      );

      // Vérification de sécurité
      if (
        !FriendsService ||
        typeof FriendsService.respondToFriendInvitation !== 'function'
      ) {
        console.error(
          "❌ FriendsService.respondToFriendInvitation n'est pas disponible"
        );

        // Fallback : marquer juste la notification comme lue
        await markNotificationAsRead(notificationId);
        alert(
          'Erreur technique, mais la notification a été marquée comme lue. Veuillez réessayer.'
        );
        return;
      }

      await FriendsService.respondToFriendInvitation(
        invitationId,
        response,
        user.uid
      );

      // Marquer la notification comme lue
      await markNotificationAsRead(notificationId);

      // Rafraîchir la liste des amis si accepté
      if (response === 'accepted') {
        const freshFriends = await FriendsService.getFriends(user.uid);
        setFriends(freshFriends);
      }

      console.log(
        `✅ Invitation ${response === 'accepted' ? 'acceptée' : 'refusée'}`
      );
    } catch (error) {
      console.error('Erreur réponse invitation:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 Tentative de déconnexion...');

    try {
      // Arrêter la disponibilité si active
      if (isAvailable) {
        await handleStopAvailability();
      }

      // Déconnexion Firebase
      await signOut();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion côté client même en cas d'erreur
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
        {/* Notification de mise à jour même pendant le chargement */}
        <UpdateNotification />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        {/* Notification de mise à jour sur la page de connexion */}
        <UpdateNotification />
      </>
    );
  }

  // Header commun avec notifications et profil
  // Supprimer le compte utilisateur
  const handleDeleteAccount = async () => {
    try {
      console.log('🗑️ Suppression du compte en cours...');

      // Importer le service de suppression
      const { AuthService } = await import('./services/firebaseService');

      // Supprimer le compte complètement
      const result = await AuthService.deleteUserAccount(user.uid);

      console.log('✅ Compte supprimé avec succès');

      // Message de confirmation avec détails de vérification
      let message = 'Votre compte a été supprimé définitivement. Au revoir !';

      if (result.verification) {
        if (result.verification.success) {
          message +=
            '\n\n✅ Vérification : Toutes vos données ont été supprimées de la base de données.';
        } else if (result.verification.issues) {
          message +=
            '\n\n⚠️ Note : Quelques données secondaires pourraient subsister mais votre compte principal a été supprimé.';
          console.log('Issues détectées:', result.verification.issues);
        }
      }

      alert(message);

      // Fermer la modale
      setShowDeleteAccountModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const renderHeader = () => {
    // Header spécial pour les pages Paramètres et Notifications
    if (currentScreen === 'settings' || currentScreen === 'notifications') {
      return (
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 sticky top-0 z-10`}
        >
          <div className="flex items-center">
            {/* Flèche de retour */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentScreen('home')}
              className={`p-2 rounded-full mr-3 transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={20} />
            </motion.button>

            {/* Titre */}
            <div>
              <h1
                className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {currentScreen === 'settings' && 'Paramètres'}
                {currentScreen === 'notifications' && 'Notifications'}
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
      );
    }

    // Header normal pour les autres pages
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 sticky top-0 z-10`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {currentScreen === 'home' &&
                `Salut ${user.name?.split(' ')[0]}! 👋`}
              {currentScreen === 'map' && 'Carte'}
              {currentScreen === 'friends' && 'Mes Amis'}
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentScreen === 'home' &&
                (isAvailable
                  ? `Tu es dispo pour ${currentActivity === 'coffee' ? 'Coffee ☕' : currentActivity === 'lunch' ? 'Lunch 🍽️' : currentActivity === 'drinks' ? 'Drinks 🍻' : currentActivity === 'chill' ? 'Chill 😎' : currentActivity}`
                  : 'Que veux-tu faire ?')}
              {currentScreen === 'friends' && `${friends.length} amis`}
              {!isOnline && (
                <span className="text-orange-500 text-xs ml-2">
                  • Mode hors ligne
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Bouton notifications */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentScreen('notifications')}
              className={`relative p-2 rounded-full transition-colors ${
                currentScreen === 'notifications'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <NotificationBadge count={notifications.length} />
              )}
            </motion.button>

            {/* Avatar profil */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentScreen('settings')}
              className={`w-10 h-10 ${
                currentScreen === 'settings'
                  ? 'bg-blue-500'
                  : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              } rounded-full flex items-center justify-center cursor-pointer transition-colors`}
              title="Paramètres"
            >
              {user.avatar && user.avatar.startsWith('http') ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl">{user.avatar || '👤'}</span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'friends':
        return (
          <div className="p-4 px-6">
            <div className="flex items-center justify-end mb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddFriendModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Ajouter un ami"
              >
                <UserPlus size={20} />
              </motion.button>
            </div>
            <div className="space-y-3">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 flex items-center shadow`}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    {friend.avatar && friend.avatar.startsWith('http') ? (
                      <img
                        src={friend.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{friend.avatar || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {friend.name}
                    </h3>
                    <p
                      className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {friend.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                    </p>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus
                    size={48}
                    className={`mx-auto mb-4 opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                  <p
                    className={`text-lg mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                  >
                    Aucun ami pour l'instant
                  </p>
                  <p
                    className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Ajoutez vos premiers amis pour commencer !
                  </p>

                  {/* Boutons de debug en mode développement */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="space-y-3 mt-6 max-w-sm mx-auto">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">
                          🛠️ Outils de debug (développement)
                        </h4>
                        <p className="text-xs text-yellow-700 mb-3">
                          Des utilisateurs dans la base mais pas d'amis visibles
                          ?
                        </p>

                        <div className="space-y-2">
                          <button
                            onClick={async () => {
                              try {
                                console.log(
                                  "📊 Debug des relations d'amitié Firebase:"
                                );

                                if (!isOnline) {
                                  console.warn(
                                    '⚠️ Mode offline - analyse locale uniquement'
                                  );
                                  console.log('👥 Amis locaux:', friends);
                                  console.log(
                                    '🟢 Disponibilités locales:',
                                    availableFriends
                                  );
                                  alert(
                                    "Mode offline - Vérifiez la console pour l'analyse locale"
                                  );
                                  return;
                                }

                                const { FriendsService } = await import(
                                  './services/firebaseService'
                                );
                                await FriendsService.debugFriendshipData(
                                  user.uid
                                );

                                console.log('👥 Amis chargés:', friends);
                                console.log(
                                  '🟢 Disponibilités:',
                                  availableFriends
                                );
                                alert(
                                  'Analyse Firebase terminée - Vérifiez la console (F12)'
                                );
                              } catch (error) {
                                console.error('❌ Debug failed:', error);
                                alert("Erreur lors de l'analyse");
                              }
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                            disabled={!isOnline}
                          >
                            🔍 Debug Firebase
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                if (!isOnline) {
                                  alert(
                                    'Firebase hors ligne - impossible de créer des amitiés'
                                  );
                                  return;
                                }

                                const { FriendsService } = await import(
                                  './services/firebaseService'
                                );
                                const friendships =
                                  await FriendsService.addTestFriendships(
                                    user.uid
                                  );

                                if (friendships && friendships.length > 0) {
                                  console.log(
                                    '✅ Amitiés Firebase créées:',
                                    friendships
                                  );
                                  alert(
                                    'Amitiés de test créées ! Rechargement...'
                                  );
                                  window.location.reload();
                                } else {
                                  console.log(
                                    "�� Aucune amitié créée (normal si pas d'autres utilisateurs)"
                                  );
                                  alert(
                                    'Aucun autre utilisateur trouvé pour créer des amitiés'
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  '❌ Erreur création amitiés Firebase:',
                                  error
                                );
                                alert(
                                  'Erreur lors de la création des amitiés Firebase'
                                );
                              }
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                            disabled={!isOnline}
                          >
                            🧪 Créer amitiés Firebase
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                console.log(
                                  '🔄 Chargement des données de test (pour demo/test)...'
                                );
                                const { getMockDataForOfflineMode } =
                                  await import('./utils/mockData');
                                const mockData = getMockDataForOfflineMode();

                                setFriends(mockData.friends);
                                setAvailableFriends(mockData.availableFriends);
                                setNotifications(mockData.notifications);

                                console.log(
                                  '✅ Données de test temporaires chargées'
                                );
                                alert(`Données de test chargées temporairement !
${mockData.friends.length} amis
${mockData.availableFriends.length} disponibilités
${mockData.notifications.length} notifications

Note: Ces données sont temporaires et ne sont pas sauvegardées`);
                              } catch (error) {
                                console.error(
                                  '❌ Erreur chargement données test:',
                                  error
                                );
                                alert(
                                  'Erreur lors du chargement des données de test'
                                );
                              }
                            }}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                          >
                            🎭 Charger données demo
                          </button>

                          <p className="text-xs text-yellow-600 mt-2">
                            💡 Ouvrez la console (F12) pour voir les détails
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-4 px-6">
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow`}
                >
                  <p
                    className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {notification.message}
                  </p>
                  <p
                    className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {notification.createdAt?.toDate?.()?.toLocaleTimeString() ||
                      'Maintenant'}
                  </p>

                  {/* Boutons d'action pour les invitations d'amitié */}
                  {notification.type === 'friend_invitation' &&
                    notification.data?.actions && (
                      <div className="flex space-x-2 mt-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleFriendInvitationResponse(
                              notification.data.invitationId,
                              'accepted',
                              notification.id
                            )
                          }
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          ✅ Accepter
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleFriendInvitationResponse(
                              notification.data.invitationId,
                              'declined',
                              notification.id
                            )
                          }
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          ❌ Refuser
                        </motion.button>
                      </div>
                    )}

                  {/* Bouton simple pour les autres types de notifications */}
                  {notification.type !== 'friend_invitation' && (
                    <div className="mt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Marquer comme lu
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <p
                  className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Aucune notification
                </p>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 px-6">
            {/* Section Profil avec éditeur de téléphone */}
            <ProfileEditor
              user={user}
              onProfileUpdate={handleProfileUpdate}
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
                      setThemeMode(themeMode === 'dark' ? 'light' : 'dark')
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
                      setThemeMode(themeMode === 'auto' ? 'light' : 'auto')
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

              {/* Notifications Push Toggle */}
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
                            : enablePushNotifications
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

                      {/* Bouton Test (si activé) */}
                      {pushNotificationStatus.subscribed && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={testPushNotification}
                          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                          title="Tester les notifications"
                        >
                          <Bell
                            size={16}
                            className={
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }
                          />
                        </motion.button>
                      )}

                      {/* Bouton Vérifier */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={checkPushNotificationStatus}
                        className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
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

            {/* Section Debug Notifications (temporaire) */}
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
                  onClick={() => setCurrentScreen('debug-notifications')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  🔍 Ouvrir le diagnostic
                </motion.button>
              </div>
            )}

            {/* Zone dangereuse */}
            <div
              className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-6 shadow mb-4`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${darkMode ? 'text-red-300' : 'text-red-700'} flex items-center`}
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
                onClick={() => setShowDeleteAccountModal(true)}
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
                onClick={handleSignOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Se déconnecter
              </motion.button>
            </div>
          </div>
        );
      case 'debug-notifications':
        return <NotificationTest user={user} darkMode={darkMode} />;
      default:
        return (
          <div className="min-h-screen flex flex-col">
            {/* Contenu principal avec fond normal */}
            <div className="flex-1 p-4 px-6">
              <AvailabilityButtons
                isAvailable={isAvailable}
                currentActivity={currentActivity}
                onStartAvailability={handleActivityClick}
                onStopAvailability={handleStopAvailability}
                location={location}
                locationError={locationError}
                availabilityStartTime={availabilityStartTime}
                retryGeolocation={retryGeolocation}
                darkMode={darkMode}
              />

              {/* Section Inviter des amis */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}
                >
                  Élargis ton cercle
                </h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddFriendModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center transition-all shadow-lg"
                >
                  <UserPlus size={20} className="mr-2" />
                  <span>Inviter des amis 🎉</span>
                </motion.button>

                {/* Boutons de test en mode développement */}
                {process.env.NODE_ENV === 'development' &&
                  friends.length === 0 && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={async () => {
                          try {
                            console.log(
                              "🧪 Test: Création d'amitiés de test..."
                            );
                            await FriendsService.debugFriendshipData(user.uid);
                            const result =
                              await FriendsService.addTestFriendships(user.uid);
                            if (result && result.length > 0) {
                              alert('Amitiés de test créées ! Rechargement...');
                              window.location.reload();
                            } else {
                              alert(
                                'Aucun utilisateur trouvé pour créer des amitiés. Connectez-vous avec un autre compte.'
                              );
                            }
                          } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur: ' + error.message);
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        🧪 Créer des amitiés de test
                      </button>
                      <button
                        onClick={async () => {
                          const mockData = getMockDataForOfflineMode();
                          setFriends(mockData.friends);
                          setAvailableFriends(mockData.availableFriends);
                          alert('Données de démo chargées temporairement !');
                        }}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        🎭 Charger des données de démo
                      </button>
                    </div>
                  )}
              </motion.div>

              {availableFriends.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      Amis disponibles
                    </h3>
                    <div
                      className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} bg-opacity-20 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} px-2 py-1 rounded-full`}
                    >
                      👆 Cliquez pour rejoindre
                    </div>
                  </div>
                  <div className="space-y-2">
                    {availableFriends.map(availability => (
                      <motion.div
                        key={availability.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 shadow transition-all border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              {availability.friend?.avatar &&
                              availability.friend.avatar.startsWith('http') ? (
                                <img
                                  src={availability.friend.avatar}
                                  alt="Avatar"
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">
                                  {availability.friend?.avatar || '👤'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                              >
                                {availability.friend?.name}
                              </p>
                              <p
                                className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                              >
                                Dispo pour {availability.activity}
                              </p>
                              {availability.timeLeft && (
                                <p
                                  className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                                >
                                  Encore {availability.timeLeft} min
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Icône de l'activité */}
                          <div className="flex items-center mr-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              {availability.activity === 'coffee' && (
                                <Coffee
                                  size={16}
                                  className={
                                    darkMode ? 'text-gray-300' : 'text-gray-600'
                                  }
                                />
                              )}
                              {availability.activity === 'lunch' && (
                                <span className="text-sm">🍽️</span>
                              )}
                              {availability.activity === 'drinks' && (
                                <span className="text-sm">🍷</span>
                              )}
                              {availability.activity === 'chill' && (
                                <Users
                                  size={16}
                                  className={
                                    darkMode ? 'text-gray-300' : 'text-gray-600'
                                  }
                                />
                              )}
                              {!['coffee', 'lunch', 'drinks', 'chill'].includes(
                                availability.activity
                              ) && <span className="text-sm">📍</span>}
                            </div>
                          </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex space-x-2 mt-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              handleJoinFriendActivity(availability)
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            ✅ Rejoindre
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              handleDeclineFriendActivity(availability)
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            ❌ Décliner
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer avec dégradé */}
            <footer className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 px-6 py-8 border-t border-gray-200">
              <div className="max-w-4xl mx-auto">
                {/* Réseaux sociaux */}
                <div className="flex justify-center space-x-6 mb-8">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Linkedin size={20} />
                  </a>
                </div>

                {/* Sections du footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                  {/* À PROPOS */}
                  <div className="text-center">
                    <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                      <HelpCircle size={16} className="mr-2" />À PROPOS
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors flex items-center justify-center"
                        >
                          <HelpCircle size={14} className="mr-2" />
                          Centre d'aide
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors flex items-center justify-center"
                        >
                          <FileText size={14} className="mr-2" />
                          Guide d'utilisation
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* LEGAL */}
                  <div className="text-center">
                    <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                      <Shield size={16} className="mr-2" />
                      LÉGAL
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          CGU Qui est dispo
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          Mentions légales
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          Données personnelles
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          Cookies
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* SERVICE CLIENT */}
                  <div className="text-center">
                    <h3 className="font-semibold text-white mb-4 flex items-center justify-center">
                      <ClockIcon size={16} className="mr-2" />
                      SERVICE CLIENT
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white/70 flex items-center justify-center">
                        <ClockIcon size={14} className="mr-2" />
                        Du lundi au vendredi
                      </p>
                      <p className="text-white/70">
                        de 10h à 18h (Heure de Paris)
                      </p>
                      <a
                        href="mailto:contact@qui-est-dispo.com"
                        className="text-white hover:text-white/80 transition-colors flex items-center justify-center mt-3"
                      >
                        <Mail size={14} className="mr-2" />
                        Nous contacter
                      </a>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/20 mt-8 pt-6 text-center">
                  <p className="text-white/60 text-xs">
                    © 2025 Qui est dispo. Tous droits réservés.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        );
    }
  };

  // Structure spéciale pour la carte
  if (currentScreen === 'map') {
    const MapComponent = useMapbox ? MapboxMapView : MapView;
    return (
      <div
        className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {renderHeader()}

        {/* Bandeau d'avertissement si aucun ami disponible */}
        {availableFriends.length === 0 && (
          <div className="p-4">
            <WarningBanner
              icon={Users}
              title="Aucun ami disponible"
              message="Vos amis ne sont pas disponibles pour le moment. Invitez-les à partager leur statut !"
              darkMode={darkMode}
            />
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <MapComponent
            userLocation={location}
            availableFriends={availableFriends}
            darkMode={darkMode}
            selectedActivity={currentActivity}
            isAvailable={isAvailable}
            currentUser={user}
          />
        </div>
        {/* Navigation fixe en bas */}
        <nav
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-2 z-50`}
        >
          <div className="flex justify-around">
            {[
              { id: 'home', icon: Coffee, label: 'Accueil' },
              { id: 'map', icon: MapPin, label: 'Carte' },
              { id: 'friends', icon: Users, label: 'Amis' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`flex flex-col items-center py-1 px-2 relative ${
                  currentScreen === item.id
                    ? 'text-blue-600'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                }`}
              >
                <item.icon size={24} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Modal d'ajout d'amis */}
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAddFriend={handleAddFriend}
          currentUser={user}
        />

        {/* Modal d'invitation d'amis */}
        <InviteFriendsModal
          isOpen={showInviteFriendsModal}
          onClose={() => setShowInviteFriendsModal(false)}
          onSendInvitations={handleSendInvitations}
          activity={selectedInviteActivity}
          friends={friends}
          darkMode={darkMode}
        />

        {/* Modal de suppression de compte */}
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirm={handleDeleteAccount}
          darkMode={darkMode}
        />

        {/* Notification de mise à jour automatique */}
        <UpdateNotification />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Header commun */}
      {renderHeader()}

      {/* Contenu principal avec padding bottom pour la nav */}
      <div className="flex-1 pb-16 overflow-y-auto flex flex-col">
        {renderScreen()}
      </div>

      {/* Navigation fixe en bas */}
      <nav
        className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-2 z-50`}
      >
        <div className="flex justify-around">
          {[
            { id: 'home', icon: Coffee, label: 'Accueil' },
            { id: 'map', icon: MapPin, label: 'Carte' },
            { id: 'friends', icon: Users, label: 'Amis' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center py-1 px-2 relative ${
                currentScreen === item.id
                  ? 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modal d'ajout d'amis */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={handleAddFriend}
        currentUser={user}
      />

      {/* Modal d'invitation d'amis */}
      <InviteFriendsModal
        isOpen={showInviteFriendsModal}
        onClose={() => setShowInviteFriendsModal(false)}
        onSendInvitations={handleSendInvitations}
        activity={selectedInviteActivity}
        friends={friends}
        darkMode={darkMode}
      />

      {/* Modal de suppression de compte */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        darkMode={darkMode}
      />

      {/* Notification de mise à jour automatique */}
      <UpdateNotification />
    </div>
  );
}

export default App;
