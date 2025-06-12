// Application refactorisée avec AppShell et components modulaires
import { Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AddFriendModal from './components/AddFriendModal';
import AppShell from './components/AppShell';
import CookieConsent from './components/CookieConsent';
import LoginScreen from './components/LoginScreen';
import MapboxMapView from './components/map/MapboxMapView';
import MapView from './components/MapView';
import PhoneRequiredModal from './components/PhoneRequiredModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import WarningBanner from './components/WarningBanner';
import { useAuth } from './hooks/useAuth';
import { useGeolocation } from './hooks/useGeolocation';
import { CookieService } from './services/cookieService';
import {
  AuthService,
  AvailabilityService,
  FriendsService,
  InvitationService,
  NotificationService,
} from './services/firebaseService';
import { getMockDataForOfflineMode } from './utils/mockData';

function App() {
  const { user, loading, signOut } = useAuth();
  const {
    location,
    error: locationError,
    retryGeolocation,
    requestLocationPermission,
  } = useGeolocation();

  // État principal
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);
  const [availabilityStartTime, setAvailabilityStartTime] = useState(null);
  const [friends, setFriends] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lastNotificationCenterVisit, setLastNotificationCenterVisit] =
    useState(Date.now());
  const [lastFriendsTabVisit, setLastFriendsTabVisit] = useState(Date.now());

  // Modales
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false);
  const [selectedInviteActivity, setSelectedInviteActivity] = useState(null);
  const [showPhoneRequiredModal, setShowPhoneRequiredModal] = useState(false);

  // Fonction pour gérer le changement d'écran avec logique notifications
  const handleScreenChange = screen => {
    if (screen === 'notifications') {
      // Marquer la visite au centre de notifications
      setLastNotificationCenterVisit(Date.now());
    }
    if (screen === 'friends') {
      // Marquer la visite à l'onglet amis
      setLastFriendsTabVisit(Date.now());
    }
    setCurrentScreen(screen);
  };

  // Calculer le nombre de nouvelles notifications depuis la dernière visite
  const getNewNotificationsCount = () => {
    return notifications.filter(notification => {
      const notificationTime =
        notification.createdAt?.toDate?.()?.getTime() || Date.now();
      return notificationTime > lastNotificationCenterVisit;
    }).length;
  };

  // Calculer le nombre de nouvelles notifications liées aux amis
  const getNewFriendsNotificationsCount = () => {
    return notifications.filter(notification => {
      const notificationTime =
        notification.createdAt?.toDate?.()?.getTime() || Date.now();
      const isFriendRelated = [
        'friend_invitation',
        'friend_invitation_accepted',
        'friend_removed',
      ].includes(notification.type);
      return isFriendRelated && notificationTime > lastFriendsTabVisit;
    }).length;
  };
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Gestion du thème avec support du mode système et cookies
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

  // Gestion des notifications push (handlers manquants)
  const handleEnablePushNotifications = async () => {
    try {
      // TODO: Implémenter l'activation des notifications push
      console.log('🔔 Activation des notifications push...');
      alert('Fonctionnalité en cours de développement');
    } catch (error) {
      console.error('❌ Erreur activation notifications push:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleTestPushNotification = async () => {
    try {
      // TODO: Implémenter le test des notifications push
      console.log('🧪 Test des notifications push...');
      alert('Test de notification push envoyé');
    } catch (error) {
      console.error('❌ Erreur test notification push:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleCheckPushStatus = async () => {
    try {
      // TODO: Implémenter la vérification du statut
      console.log('🔍 Vérification du statut des notifications push...');
      alert('Statut vérifié - voir console');
    } catch (error) {
      console.error('❌ Erreur vérification statut:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleOpenDebugNotifications = () => {
    setCurrentScreen('debug-notifications');
  };

  // Handler pour démarrer une disponibilité
  const handleStartAvailability = async (
    activity,
    isResponseToInvitation = false,
    respondingToUserId = null
  ) => {
    if (!user || !location) return;

    const startTime = new Date().getTime();

    try {
      console.log(
        `🚀 Démarrage disponibilité: ${activity}${isResponseToInvitation ? ' (réponse à invitation)' : ''}`
      );

      const metadata = isResponseToInvitation
        ? {
            isResponseToInvitation: true,
            respondingToUserId: respondingToUserId,
            responseTimestamp: startTime,
          }
        : {};

      const result = await AvailabilityService.setAvailability(
        user.uid,
        activity,
        location,
        metadata
      );

      console.log('🛑 [DEBUG] Result from setAvailability:', result);
      console.log('🛑 [DEBUG] Type of result:', typeof result);

      setIsAvailable(true);
      setCurrentActivity(activity);
      setAvailabilityId(result);
      setAvailabilityStartTime(startTime);

      // 🐛 FIX SIMPLE: Sauvegarder dans localStorage
      localStorage.setItem(
        'availabilityState',
        JSON.stringify({
          isAvailable: true,
          currentActivity: activity,
          availabilityId: result,
          availabilityStartTime: startTime,
        })
      );

      console.log('🛑 [DEBUG] AvailabilityId set to:', result);
      console.log('✅ Disponibilité activée');
    } catch (error) {
      // Mode offline - juste mettre à jour l'état local
      const offlineId = 'offline-' + Date.now();
      setIsAvailable(true);
      setCurrentActivity(activity);
      setAvailabilityId(offlineId);
      setAvailabilityStartTime(startTime);

      // Sauvegarder même en offline
      localStorage.setItem(
        'availabilityState',
        JSON.stringify({
          isAvailable: true,
          currentActivity: activity,
          availabilityId: offlineId,
          availabilityStartTime: startTime,
        })
      );

      console.error('❌ Erreur lors du démarrage (mode offline):', error);
    }
  };

  // Handler pour les clics sur les cartes d'événements
  const handleActivityClick = async activity => {
    if (!user || !location) {
      alert('Localisation requise pour partager une activité');
      return;
    }

    // Ouvrir le modal pour choisir qui inviter
    setSelectedInviteActivity(activity);
    setShowInviteFriendsModal(true);
  };

  // Handler pour envoyer des invitations
  const handleSendInvitations = async (activity, friendIds) => {
    try {
      if (!user || !location) {
        throw new Error('Utilisateur ou localisation manquant');
      }

      console.log(
        `📨 Envoi d'invitations ${activity} à ${friendIds.length} amis`
      );

      // Envoyer les invitations avec vérification anti-duplication
      const result = await InvitationService.sendInvitations(
        user.uid,
        activity,
        friendIds,
        location
      );

      // Démarrer sa propre disponibilité SEULEMENT si au moins une invitation a été envoyée
      if (result.count > 0) {
        await handleStartAvailability(activity);
      }

      // Log de succès simplifié
      if (result.count > 0) {
        console.log(
          `✅ ${result.count} invitation${result.count > 1 ? 's' : ''} envoyée${result.count > 1 ? 's' : ''} pour ${activity}! Vous êtes maintenant disponible !`
        );
      } else {
        console.log('Aucune invitation envoyée.');
      }
    } catch (error) {
      console.error('❌ Erreur envoi invitations:', error);
      // Garder l'alert seulement pour les erreurs critiques
      alert(`Erreur lors de l'envoi des invitations: ${error.message}`);
    }
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
      console.log(
        `🔥 [DEBUG] Rejoindre ${friendAvailability.activity} avec ami:`,
        friendAvailability.userId || friendAvailability.friend?.id
      );

      // Nettoyer toutes les invitations entre ces deux utilisateurs pour cette activité
      const friendId =
        friendAvailability.userId || friendAvailability.friend?.id;
      await InvitationService.cleanupInvitationsBetweenUsers(
        user.uid,
        friendId,
        friendAvailability.activity
      );

      // Supprimer la notification d'invitation correspondante
      await NotificationService.removeInvitationNotification(
        user.uid,
        friendId,
        friendAvailability.activity
      );

      // Démarrer la nouvelle activité
      await handleStartAvailability(
        friendAvailability.activity,
        true, // isResponseToInvitation
        friendId // respondingToUserId
      );

      // Marquer l'availability de l'ami qui nous a invité pour qu'il apparaisse dans notre liste
      await AvailabilityService.markAsJoinedByFriend(
        friendAvailability.id,
        user.uid
      );

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
      console.log(
        `✅ Vous êtes maintenant disponible pour ${friendAvailability.activity} comme ${friendName} !`
      );
    } catch (error) {
      console.error("❌ Erreur lors de rejoindre l'activité:", error);
    }
  };

  // Décliner l'activité d'un ami
  const handleDeclineFriendActivity = async friendAvailability => {
    try {
      console.log(`🔥 [DEBUG] ===============================`);
      console.log(`🔥 [DEBUG] DÉBUT DÉCLINAISON`);
      console.log(`🔥 [DEBUG] Activité: ${friendAvailability.activity}`);
      console.log(
        `🔥 [DEBUG] Ami:`,
        friendAvailability.userId || friendAvailability.friend?.id
      );
      console.log(`🔥 [DEBUG] User actuel:`, user.uid);
      console.log(`🔥 [DEBUG] ===============================`);

      // Nettoyer toutes les invitations entre ces deux utilisateurs pour cette activité
      const friendId =
        friendAvailability.userId || friendAvailability.friend?.id;

      console.log(`🔥 [DEBUG] Appel cleanupInvitationsBetweenUsers...`);
      await InvitationService.cleanupInvitationsBetweenUsers(
        user.uid,
        friendId,
        friendAvailability.activity
      );
      console.log(`🔥 [DEBUG] cleanupInvitationsBetweenUsers terminé !`);

      // Supprimer la notification d'invitation correspondante
      console.log(`🔥 [DEBUG] Suppression notification d'invitation...`);
      await NotificationService.removeInvitationNotification(
        user.uid,
        friendId,
        friendAvailability.activity
      );
      console.log(`🔥 [DEBUG] Notification d'invitation supprimée !`);

      // Envoyer notification de déclin à l'ami
      console.log(`🔥 [DEBUG] Envoi notification de déclin...`);
      await sendResponseNotification(friendAvailability, 'declined');

      // Retirer l'ami de la liste des disponibles
      console.log(`🔥 [DEBUG] Retrait de la liste des disponibles...`);
      setAvailableFriends(prev =>
        prev.filter(friend => friend.id !== friendAvailability.id)
      );

      // Message de confirmation
      const friendName =
        friendAvailability.friend?.name ||
        friendAvailability.name ||
        'Votre ami';

      console.log(`🔥 [DEBUG] ===============================`);
      console.log(`🔥 [DEBUG] DÉCLINAISON TERMINÉE AVEC SUCCÈS`);
      console.log(`🔥 [DEBUG] ===============================`);

      console.log(
        `✅ Vous avez décliné l'invitation de ${friendName} pour ${friendAvailability.activity}`
      );
    } catch (error) {
      console.error(
        "🔥 [DEBUG] ❌ ERREUR lors de décliner l'invitation:",
        error
      );
    }
  };

  // Envoyer une notification de réponse à un ami
  const sendResponseNotification = async (friendAvailability, responseType) => {
    if (!user) return;

    try {
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

  // Fonctions de réponse aux invitations SUPPRIMÉES - plus de cartes Rejoindre/Décliner

  // Handlers pour les actions d'amitié
  const handleAddFriend = async identifier => {
    try {
      console.log('➕ Ajout ami:', identifier);

      let result;
      // Si c'est un numéro de téléphone
      if (identifier.includes('+') || identifier.startsWith('0')) {
        result = await FriendsService.addFriendByPhone(user.uid, identifier);
      } else {
        // Sinon c'est un userId
        result = await FriendsService.addFriendByUserId(user.uid, identifier);
      }

      // SEULEMENT rafraîchir la liste des amis si ce n'est PAS juste une invitation envoyée
      if (!result.invitationSent) {
        const updatedFriends = await FriendsService.getFriends(user.uid);
        setFriends(updatedFriends);
        console.log('✅ Ami ajouté avec succès à la liste');
      } else {
        console.log("✅ Invitation d'amitié envoyée");
      }

      return result; // Retourner le résultat pour le modal
    } catch (error) {
      console.error('❌ Erreur ajout ami:', error);
      throw error; // Relancer l'erreur pour que le modal puisse la gérer
    }
  };

  // Handler pour ouvrir le modal d'ajout d'ami
  const handleOpenAddFriendModal = () => {
    // Vérifier si l'utilisateur a un numéro de téléphone
    if (!user.phone || user.phone.trim() === '') {
      // Pas de numéro → Afficher le modal d'explication
      setShowPhoneRequiredModal(true);
    } else {
      // Numéro présent → Ouvrir le modal d'ajout d'ami normalement
      setShowAddFriendModal(true);
    }
  };

  // Handler pour rediriger vers les paramètres depuis le modal PhoneRequired
  const handleGoToSettings = () => {
    setShowPhoneRequiredModal(false);
    handleScreenChange('settings');
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${friendName} de vos amis ?`
      )
    ) {
      return;
    }

    try {
      await FriendsService.removeFriend(user.uid, friendId);

      // Rafraîchir la liste des amis
      const updatedFriends = await FriendsService.getFriends(user.uid);
      setFriends(updatedFriends);

      console.log(`✅ ${friendName} supprimé de la liste d'amis`);
    } catch (error) {
      console.error('Erreur suppression ami:', error);
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const markNotificationAsRead = async notificationId => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user.uid);
      setNotifications([]);
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  const markAllFriendsNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllFriendsNotificationsAsRead(user.uid);
      setNotifications(prev =>
        prev.filter(
          n =>
            ![
              'friend_invitation',
              'friend_invitation_accepted',
              'friend_removed',
            ].includes(n.type)
        )
      );
    } catch (error) {
      console.error('Erreur marquage notifications amis:', error);
    }
  };

  const handleFriendInvitationResponse = async (
    invitationId,
    response,
    notificationId
  ) => {
    try {
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

  const handleActivityInvitationResponse = async (notification, response) => {
    try {
      console.log(`🎯 [DEBUG] Réponse à l'invitation d'activité:`, {
        activity: notification.data.activity,
        response,
        from: notification.data.fromUserName,
      });

      if (response === 'accepted') {
        // Si on est déjà disponible pour une autre activité, demander confirmation
        if (isAvailable && currentActivity !== notification.data.activity) {
          const confirm = window.confirm(
            `Vous êtes déjà disponible pour ${currentActivity}. Voulez-vous basculer vers ${notification.data.activity} ?`
          );
          if (!confirm) return;

          // Arrêter la disponibilité actuelle
          await handleStopAvailability();
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Démarrer la nouvelle activité
        await handleStartAvailability(
          notification.data.activity,
          true, // isResponseToInvitation
          notification.data.fromUserId // respondingToUserId
        );

        console.log(
          `✅ Vous avez accepté l'invitation pour ${notification.data.activity} de ${notification.data.fromUserName}`
        );
      }

      // Répondre à l'invitation dans Firebase (pour les deux cas accepted/declined)
      if (notification.data.invitationId) {
        await InvitationService.respondToInvitation(
          notification.data.invitationId,
          user.uid,
          response
        );
      } else {
        console.warn("⚠️ ID d'invitation manquant dans la notification");
      }

      // Marquer la notification comme lue et la supprimer
      await markNotificationAsRead(notification.id);

      const responseText = response === 'accepted' ? 'accepté' : 'décliné';
      console.log(
        `✅ Vous avez ${responseText} l'invitation pour ${notification.data.activity}`
      );
    } catch (error) {
      console.error("❌ Erreur lors de la réponse à l'invitation:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleStopAvailability = async () => {
    console.log('🛑 [DEBUG] === DÉBUT handleStopAvailability ===');
    console.log('🛑 [DEBUG] user:', user?.uid);
    console.log('🛑 [DEBUG] availabilityId:', availabilityId);
    console.log('🛑 [DEBUG] currentActivity:', currentActivity);

    if (!user) return;

    try {
      // Chercher s'il y a un ami qui avait accepté notre invitation
      const friendWhoAccepted = availableFriends.find(
        friend =>
          friend.isResponseToInvitation &&
          friend.respondingToUserId === user.uid &&
          friend.activity === currentActivity
      );

      console.log('🛑 [DEBUG] Ami qui avait accepté:', friendWhoAccepted);

      // 🎯 AMÉLIORÉ: Annuler toutes les invitations en cours pour cette activité
      if (currentActivity) {
        console.log(
          '🛑 [DEBUG] Annulation des invitations pour:',
          currentActivity
        );

        try {
          // Chercher TOUTES les notifications d'invitation (même lues) que j'ai envoyées pour cette activité
          const cancelResult =
            await NotificationService.cancelInvitationNotifications(
              user.uid,
              currentActivity
            );

          console.log(
            '🛑 [DEBUG] Résultat annulation notifications:',
            cancelResult
          );

          // Nettoyer aussi les invitations dans Firestore
          await InvitationService.cleanupUserInvitations(
            user.uid,
            currentActivity
          );

          console.log(
            '🛑 [DEBUG] ✅ Invitations annulées pour',
            currentActivity
          );

          // 🔥 NOUVEAU: Forcer le rechargement de la liste des amis disponibles
          console.log('🛑 [DEBUG] 🔄 Rechargement des amis disponibles...');
          const updatedAvailableFriends =
            await AvailabilityService.getAvailableFriends(user.uid);
          setAvailableFriends(updatedAvailableFriends);
          console.log('🛑 [DEBUG] ✅ Liste des amis disponibles rechargée');
        } catch (cancelError) {
          console.error(
            "🛑 [DEBUG] ❌ Erreur lors de l'annulation des invitations:",
            cancelError
          );
        }
      }

      if (availabilityId && !availabilityId.startsWith('offline-')) {
        await AvailabilityService.stopAvailability(user.uid, availabilityId);
      }

      // Si un ami avait accepté, lui envoyer une notification d'annulation
      if (friendWhoAccepted) {
        console.log(
          '🛑 [DEBUG] Envoi notification annulation à:',
          friendWhoAccepted.friend.name
        );
        await NotificationService.createNotification(
          friendWhoAccepted.userId, // À qui
          user.uid, // De qui
          'activity_cancelled', // Type
          `❌ ${user.displayName || user.name || 'Un ami'} a annulé l'activité ${currentActivity}`,
          {
            activity: currentActivity,
            cancelledBy: user.uid,
            cancelledByName: user.displayName || user.name || 'Un ami',
          }
        );
        console.log('🛑 [DEBUG] ✅ Notification annulation envoyée');
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt de disponibilité:", error);
      // Continuer même en cas d'erreur pour permettre l'arrêt local
    }

    setIsAvailable(false);
    setCurrentActivity(null);
    setAvailabilityId(null);
    setAvailabilityStartTime(null);

    // 🐛 FIX SIMPLE: Nettoyer localStorage
    localStorage.removeItem('availabilityState');

    console.log('🛑 [DEBUG] === FIN handleStopAvailability ===');
  };

  // Handler pour terminer manuellement une activité en cours
  const handleTerminateActivity = async activityId => {
    if (!user) return;

    try {
      console.log('🏁 [DEBUG] Termination activité:', activityId);

      const result = await AvailabilityService.terminateActivity(
        activityId,
        user.uid
      );

      if (result && result.otherUserId) {
        // Envoyer notification à l'autre participant
        await NotificationService.createNotification(
          result.otherUserId,
          user.uid,
          'activity_terminated',
          `🏁 ${user.displayName || user.name || 'Un ami'} a terminé l'activité ${result.activity}`,
          {
            activity: result.activity,
            terminatedBy: user.uid,
            terminatedByName: user.displayName || user.name || 'Un ami',
          }
        );
        console.log('🏁 [DEBUG] ✅ Notification termination envoyée');
      }

      // Si c'était notre activité principale, remettre à jour l'état local
      if (availabilityId === activityId) {
        setIsAvailable(false);
        setCurrentActivity(null);
        setAvailabilityId(null);
        setAvailabilityStartTime(null);

        // Nettoyer localStorage
        localStorage.removeItem('availabilityState');
      }

      console.log('🏁 [DEBUG] ✅ Activité terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la termination:', error);
      alert(`Erreur lors de la termination: ${error.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('🗑️ Suppression du compte en cours...');

      const result = await AuthService.deleteUserAccount(user.uid);

      console.log('✅ Compte supprimé avec succès');

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
      setShowDeleteAccountModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 Tentative de déconnexion...');

    try {
      // Arrêter la disponibilité si active
      if (isAvailable) {
        await handleStopAvailability();
      }

      // Réinitialiser l'écran à l'accueil pour la prochaine connexion
      setCurrentScreen('home');

      // Déconnexion Firebase
      await signOut();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion côté client même en cas d'erreur
      window.location.reload();
    }
  };

  const handleMapProviderChange = provider => {
    const isMapbox = provider === 'mapbox';
    setUseMapbox(isMapbox);
    CookieService.setMapProviderPreference(provider);
    console.log(`🗺️ Provider de cartes changé: ${provider}`);
  };

  const handleCreateTestFriendships = async () => {
    try {
      console.log("🧪 Création de relations d'amitié de test...");
      await FriendsService.createTestFriendships(user.uid);

      // Rafraîchir la liste des amis
      const updatedFriends = await FriendsService.getFriends(user.uid);
      setFriends(updatedFriends);

      console.log("✅ Relations d'amitié de test créées");
    } catch (error) {
      console.error('❌ Erreur création test amitiés:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleLoadMockData = async () => {
    try {
      console.log('📊 Chargement des données de test...');
      const mockData = getMockDataForOfflineMode();
      setAvailableFriends(mockData.availableFriends || []);
      console.log('✅ Données de test chargées');
    } catch (error) {
      console.error('❌ Erreur chargement données test:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Gestion des événements de connexion
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

      // Appliquer la classe 'dark' à l'élément HTML pour Tailwind
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  // 🐛 FIX SIMPLE: Restaurer l'état depuis localStorage
  const restoreAvailabilityState = () => {
    try {
      const saved = localStorage.getItem('availabilityState');
      if (saved) {
        const state = JSON.parse(saved);
        console.log(
          '🔄 [REFRESH] Restauration état depuis localStorage:',
          state
        );

        // Vérifier que l'état n'est pas expiré (plus de 45min)
        const now = Date.now();
        const elapsed = now - state.availabilityStartTime;
        const maxDuration = 45 * 60 * 1000; // 45 minutes

        if (elapsed < maxDuration) {
          setIsAvailable(state.isAvailable);
          setCurrentActivity(state.currentActivity);
          setAvailabilityId(state.availabilityId);
          setAvailabilityStartTime(state.availabilityStartTime);
          console.log('✅ État restauré avec succès');
        } else {
          console.log('⏰ État expiré, nettoyage localStorage');
          localStorage.removeItem('availabilityState');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur restauration localStorage:', error);
      localStorage.removeItem('availabilityState');
    }
  };

  // Charger les données utilisateur
  useEffect(() => {
    if (!user) {
      // Si l'utilisateur se déconnecte, réinitialiser l'écran à l'accueil
      setCurrentScreen('home');
      return;
    }

    let unsubscribeAvailable;
    let unsubscribeNotifications;

    const loadUserData = async () => {
      try {
        // Charger les amis
        const friendsData = await FriendsService.getFriends(user.uid);
        setFriends(friendsData);

        // 🐛 FIX SIMPLE: Récupérer l'état depuis localStorage après refresh
        restoreAvailabilityState();

        // Écouter les amis disponibles (utilise onSnapshot)
        unsubscribeAvailable = AvailabilityService.onAvailableFriends(
          user.uid,
          setAvailableFriends
        );

        // Configurer le listener pour les notifications en temps réel
        unsubscribeNotifications = NotificationService.onNotifications(
          user.uid,
          setNotifications
        );

        // Charger les notifications initialement
        const notificationsData = await NotificationService.getNotifications(
          user.uid
        );
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadUserData();

    // Cleanup lors du démontage
    return () => {
      if (unsubscribeAvailable) {
        unsubscribeAvailable();
      }
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user]);

  const handleProfileUpdate = async updatedUser => {
    // Mettre à jour l'état local de l'utilisateur si possible
    // En pratique, on devrait déclencher un rechargement du profil utilisateur
    console.log('📝 Profil mis à jour:', updatedUser);
    // Le hook useProfileEditor fait déjà refreshUserData(), pas besoin de recharger la page
    // window.location.reload(); // Supprimé pour éviter la redirection vers l'accueil
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
        <UpdateNotification />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <UpdateNotification />
      </>
    );
  }

  // Structure spéciale pour la carte
  if (currentScreen === 'map') {
    const MapComponent = useMapbox ? MapboxMapView : MapView;
    return (
      <div
        className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
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

        {/* Navigation */}
        <AppShell
          user={user}
          darkMode={darkMode}
          currentScreen={currentScreen}
          themeMode={themeMode}
          pushNotificationStatus={pushNotificationStatus}
          onScreenChange={handleScreenChange}
          onThemeToggle={() => setDarkMode(!darkMode)}
          onThemeChange={setThemeMode}
          onSignOut={handleSignOut}
          friends={friends}
          availableFriends={availableFriends}
          notifications={notifications}
          newNotificationsCount={getNewNotificationsCount()}
          newFriendsNotificationsCount={getNewFriendsNotificationsCount()}
          isAvailable={isAvailable}
          currentActivity={currentActivity}
          location={location}
          locationError={locationError}
          isOnline={isOnline}
          onAddFriend={handleOpenAddFriendModal}
          onAddFriendById={handleAddFriend}
          onRemoveFriend={handleRemoveFriend}
          onCreateTestFriendships={handleCreateTestFriendships}
          onLoadMockData={handleLoadMockData}
          onDeleteAccount={handleDeleteAccount}
          onMapProviderChange={handleMapProviderChange}
          useMapbox={useMapbox}
          onMarkNotificationAsRead={markNotificationAsRead}
          onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
          onMarkAllFriendsNotificationsAsRead={
            markAllFriendsNotificationsAsRead
          }
          onFriendInvitationResponse={handleFriendInvitationResponse}
          onActivityInvitationResponse={handleActivityInvitationResponse}
          onProfileUpdate={handleProfileUpdate}
          onEnablePushNotifications={handleEnablePushNotifications}
          onTestPushNotification={handleTestPushNotification}
          onCheckPushStatus={handleCheckPushStatus}
          onOpenDebugNotifications={handleOpenDebugNotifications}
          onShowDeleteAccount={() => setShowDeleteAccountModal(true)}
          retryGeolocation={retryGeolocation}
          onRequestLocationPermission={requestLocationPermission}
          availabilityStartTime={availabilityStartTime}
          showAddFriendModal={showAddFriendModal}
          setShowAddFriendModal={setShowAddFriendModal}
          showDeleteAccountModal={showDeleteAccountModal}
          setShowDeleteAccountModal={setShowDeleteAccountModal}
          onSetAvailability={handleActivityClick}
          onStopAvailability={handleStopAvailability}
          onTerminateActivity={handleTerminateActivity}
          showInviteFriendsModal={showInviteFriendsModal}
          setShowInviteFriendsModal={setShowInviteFriendsModal}
          selectedInviteActivity={selectedInviteActivity}
          onSendInvitations={handleSendInvitations}
          onInviteFriends={handleActivityClick}
        />

        {/* Modal d'ajout d'amis */}
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAddFriend={handleAddFriend}
          currentUser={user}
          darkMode={darkMode}
        />

        {/* Consentement cookies */}
        <CookieConsent darkMode={darkMode} />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt darkMode={darkMode} />

        {/* Modal PhoneRequired */}
        <PhoneRequiredModal
          isOpen={showPhoneRequiredModal}
          onClose={() => setShowPhoneRequiredModal(false)}
          onGoToSettings={handleGoToSettings}
          darkMode={darkMode}
        />
      </div>
    );
  }

  return (
    <>
      <AppShell
        user={user}
        darkMode={darkMode}
        currentScreen={currentScreen}
        themeMode={themeMode}
        pushNotificationStatus={pushNotificationStatus}
        onScreenChange={handleScreenChange}
        onThemeToggle={() => setDarkMode(!darkMode)}
        onThemeChange={setThemeMode}
        onSignOut={handleSignOut}
        friends={friends}
        availableFriends={availableFriends}
        notifications={notifications}
        newNotificationsCount={getNewNotificationsCount()}
        newFriendsNotificationsCount={getNewFriendsNotificationsCount()}
        isAvailable={isAvailable}
        currentActivity={currentActivity}
        location={location}
        locationError={locationError}
        isOnline={isOnline}
        onAddFriend={handleOpenAddFriendModal}
        onAddFriendById={handleAddFriend}
        onRemoveFriend={handleRemoveFriend}
        onCreateTestFriendships={handleCreateTestFriendships}
        onLoadMockData={handleLoadMockData}
        onDeleteAccount={handleDeleteAccount}
        onMapProviderChange={handleMapProviderChange}
        useMapbox={useMapbox}
        onMarkNotificationAsRead={markNotificationAsRead}
        onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
        onMarkAllFriendsNotificationsAsRead={markAllFriendsNotificationsAsRead}
        onFriendInvitationResponse={handleFriendInvitationResponse}
        onActivityInvitationResponse={handleActivityInvitationResponse}
        onProfileUpdate={handleProfileUpdate}
        onEnablePushNotifications={handleEnablePushNotifications}
        onTestPushNotification={handleTestPushNotification}
        onCheckPushStatus={handleCheckPushStatus}
        onOpenDebugNotifications={handleOpenDebugNotifications}
        onShowDeleteAccount={() => setShowDeleteAccountModal(true)}
        retryGeolocation={retryGeolocation}
        onRequestLocationPermission={requestLocationPermission}
        availabilityStartTime={availabilityStartTime}
        showAddFriendModal={showAddFriendModal}
        setShowAddFriendModal={setShowAddFriendModal}
        showDeleteAccountModal={showDeleteAccountModal}
        setShowDeleteAccountModal={setShowDeleteAccountModal}
        onSetAvailability={handleActivityClick}
        onStopAvailability={handleStopAvailability}
        onTerminateActivity={handleTerminateActivity}
        showInviteFriendsModal={showInviteFriendsModal}
        setShowInviteFriendsModal={setShowInviteFriendsModal}
        selectedInviteActivity={selectedInviteActivity}
        onSendInvitations={handleSendInvitations}
        onInviteFriends={handleActivityClick}
      />

      {/* Modal d'ajout d'amis */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={handleAddFriend}
        currentUser={user}
        darkMode={darkMode}
      />

      {/* Consentement cookies */}
      <CookieConsent darkMode={darkMode} />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt darkMode={darkMode} />

      {/* Modal PhoneRequired */}
      <PhoneRequiredModal
        isOpen={showPhoneRequiredModal}
        onClose={() => setShowPhoneRequiredModal(false)}
        onGoToSettings={handleGoToSettings}
        darkMode={darkMode}
      />
    </>
  );
}

export default App;
