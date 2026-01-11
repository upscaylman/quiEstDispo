// Application refactorisée avec AppShell et components modulaires
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import AppShell from './components/AppShell';
import CookieConsent from './components/CookieConsent';
import LoadingSpinner from './components/LoadingSpinner';
import LoginScreen from './components/LoginScreen';
import PhoneRequiredModal from './components/PhoneRequiredModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import { useToast } from './contexts/ToastContext';
import { useAuth } from './hooks/useAuth';
import { useGeolocation } from './hooks/useGeolocation';
import { CookieService } from './services/cookieService';
import { EventStatusService } from './services/eventStatusService';
import {
  AuthService,
  AvailabilityService,
  FriendsService,
  InvitationService,
  NotificationService,
} from './services/firebaseService';
import { InvitationExpirationService } from './services/invitationExpirationService'; // 🎯 Import pour démarrer le timer d'expiration
import { PresenceService } from './services/presenceService';
import './styles/responsive.css';
import { UserEventStatus } from './types/eventTypes';
import { debugLog, prodError } from './utils/logger';
import { getMockDataForOfflineMode } from './utils/mockData';

// 🚀 LAZY LOADING des composants lourds pour optimiser le bundle initial
const MapView = lazy(() =>
  import('./components/map').then(module => ({ default: module.MapView }))
);
const MapboxMapView = lazy(() => import('./components/map/MapboxMapView'));

// 🎯 LAZY LOADING des modals (chargés seulement à l'ouverture)
const AddFriendModal = lazy(() => import('./components/AddFriendModal'));
const DeleteAccountModal = lazy(
  () => import('./components/DeleteAccountModal')
);
const InviteFriendsModal = lazy(
  () => import('./components/InviteFriendsModal')
);

// Version de l'application
const APP_VERSION = '1.3.0';

function App() {
  const { user, loading, refreshUserData, signOut } = useAuth();
  const {
    location,
    error: locationError,
    retryGeolocation,
    requestLocationPermission,
  } = useGeolocation();

  // 🍞 Hook pour les toasts
  const toast = useToast();

  // Ref pour l'annulation des invitations (pour éviter les problèmes de closure)
  const cancelInvitationsRef = useRef(null);

  // Hook pour les notifications GPS (temporairement désactivé)
  // const { gpsStatus } = useGPSNotifications();

  // État principal
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);
  const [availabilityStartTime, setAvailabilityStartTime] = useState(null);
  const [friends, setFriends] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 🎯 NOUVEAU: État pour les invitations en attente
  const [pendingInvitation, setPendingInvitation] = useState(null); // { activity: 'coffee', sentAt: timestamp, friendIds: [...] }

  // 🔔 FIX BADGE: Initialiser avec 0 pour voir toutes les notifications non lues
  const [lastNotificationCenterVisit, setLastNotificationCenterVisit] =
    useState(0);
  const [lastFriendsTabVisit, setLastFriendsTabVisit] = useState(0);

  // Modales
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false);
  const [selectedInviteActivity, setSelectedInviteActivity] = useState(null);
  const [showPhoneRequiredModal, setShowPhoneRequiredModal] = useState(false);
  const [isActiveEventInvitation, setIsActiveEventInvitation] = useState(false); // 🎯 NOUVEAU: Flag pour distinguer les types d'invitation

  // État pour les notifications push
  const [pushNotificationStatus, setPushNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

  // 🔧 FIX DOUBLON: Tracker les notifications de déclin déjà traitées
  const [processedDeclineNotifications, setProcessedDeclineNotifications] =
    useState(new Set());

  // Calculer le nombre de nouvelles notifications depuis la dernière visite
  const getNewNotificationsCount = () => {
    return notifications.filter(notification => {
      const notificationTime =
        notification.createdAt?.toDate?.()?.getTime() || Date.now();
      const isUnread = !notification.read;
      return isUnread && notificationTime > lastNotificationCenterVisit;
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
      const isUnread = !notification.read;
      return (
        isFriendRelated && isUnread && notificationTime > lastFriendsTabVisit
      );
    }).length;
  };
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Log de la version au démarrage
  useEffect(() => {
    console.log(
      '🚀 Qui est dispo v' + APP_VERSION + " - Démarrage de l'application"
    );
  }, []);

  // 🎯 Démarrage explicite du service d'expiration des invitations
  useEffect(() => {
    // Démarrer le timer d'expiration si pas déjà en cours
    if (!InvitationExpirationService.isRunning) {
      console.log(
        "🚀 [EXPIRATION] Démarrage du service d'expiration depuis App.js"
      );
      InvitationExpirationService.startExpirationTimer();
    }

    // Cleanup au démontage
    return () => {
      // Ne pas arrêter le timer car d'autres onglets peuvent en avoir besoin
    };
  }, []);

  // 🎯 TASK 1.4 - VALIDATION ÉTATS (un seul état par user)
  const validateUserState = async (expectedState = null) => {
    if (!user?.uid) return { valid: true, currentState: UserEventStatus.LIBRE };

    try {
      // 🎯 UTILISE la nouvelle méthode centralisée de validation
      const validation = await EventStatusService.validateSingleUserState(
        user.uid
      );

      debugLog(`🔍 [VALIDATION] Résultat validation:`, validation);

      // Si auto-correction effectuée, rafraîchir les états locaux
      if (validation.wasAutoFixed) {
        setIsAvailable(false);
        setCurrentActivity(null);
        setAvailabilityId(null);
        setAvailabilityStartTime(null);
        setPendingInvitation(null);

        // Nettoyer localStorage
        localStorage.removeItem('availabilityState');
        localStorage.removeItem('pendingInvitation');

        debugLog(
          `✅ [VALIDATION] États locaux réinitialisés après auto-correction`
        );
      }

      // Vérifier l'état attendu si spécifié
      if (expectedState && validation.currentState !== expectedState) {
        return {
          valid: false,
          currentState: validation.currentState,
          expectedState,
          error: `État attendu: ${expectedState}, état actuel: ${validation.currentState}`,
          correctedIssues: validation.correctedIssues,
        };
      }

      return {
        valid: validation.valid,
        currentState: validation.currentState,
        correctedIssues: validation.correctedIssues,
        wasAutoFixed: validation.wasAutoFixed,
      };
    } catch (error) {
      prodError('❌ [VALIDATION] Erreur validation état:', error);
      return { valid: false, error: error.message };
    }
  };

  // Gestion du thème avec support du mode système et cookies
  const [themeMode, setThemeMode] = useState(() => {
    const cookieTheme = CookieService.getThemePreference();
    if (cookieTheme) return cookieTheme;
    const saved = localStorage.getItem('themeMode');
    return saved || 'auto';
  });

  const [darkMode, setDarkMode] = useState(false);
  const [useMapbox, setUseMapbox] = useState(() => {
    const cookieProvider = CookieService.getMapProviderPreference();
    if (cookieProvider !== null) return cookieProvider === 'mapbox';
    return true;
  });

  // État système
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    // 🎯 TASK 1.4 - VALIDATION ÉTAT avant démarrage
    // 🚨 FIX: Pour les réponses aux invitations, ne pas exiger l'état LIBRE
    if (!isResponseToInvitation) {
      const validation = await validateUserState(UserEventStatus.LIBRE);
      if (!validation.valid && !validation.wasAutoFixed) {
        debugLog(
          `❌ [VALIDATION] Impossible de démarrer disponibilité: ${validation.error}`,
          'StateValidation'
        );
        alert(`Impossible de démarrer l'activité: ${validation.error}`);
        return;
      }

      if (validation.wasAutoFixed) {
        debugLog(
          `✅ [VALIDATION] État corrigé automatiquement, démarrage possible`,
          'StateValidation'
        );
      }
    } else {
      // Pour les réponses aux invitations, validation plus souple
      debugLog(
        `🎯 [VALIDATION] Réponse à invitation - validation souple pour ${activity}`,
        'StateValidation'
      );

      // 🚨 MODE DÉVELOPPEMENT : Contourner complètement la validation
      if (process.env.NODE_ENV === 'development') {
        debugLog(
          `🔧 [DEV MODE] Contournement validation réponse invitation`,
          'StateValidation'
        );
      } else {
        // En production, juste vérifier que l'utilisateur existe et corriger si nécessaire
        const validation = await validateUserState(); // Sans état spécifique attendu
        if (validation.wasAutoFixed) {
          debugLog(
            `✅ [VALIDATION] État corrigé automatiquement pour réponse invitation`,
            'StateValidation'
          );
        }
      }
    }

    const startTime = new Date().getTime();

    try {
      console.log(
        `🚀 Démarrage disponibilité: ${activity}${isResponseToInvitation ? ' (réponse à invitation)' : ''}`
      );

      // 🎯 CORRECTION - DISTINCTION entre INVITATION_ENVOYEE et EN_PARTAGE
      const targetStatus = isResponseToInvitation
        ? UserEventStatus.EN_PARTAGE // Réponse à invitation = partage immédiat
        : UserEventStatus.INVITATION_ENVOYEE; // Démarrage pour inviter = attente

      await EventStatusService.setUserEventStatus(user.uid, targetStatus, {
        currentActivity: activity,
        availabilityStartTime: startTime,
        isResponseToInvitation,
        respondingToUserId,
      });

      console.log(
        `📊 [STATUT] ${isResponseToInvitation ? '✅ EN_PARTAGE (acceptation invitation)' : '⏳ INVITATION_ENVOYEE (en attente acceptation)'}`
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

      // 🚀 DÉCLENCHEMENT IMMÉDIAT: Informer l'interface du changement
      window.dispatchEvent(
        new CustomEvent('availability-state-changed', {
          detail: {
            userId: user.uid,
            newState: 'EN_PARTAGE',
            activity: activity,
          },
        })
      );

      // 🎯 NOUVEAU: Déclencher mise à jour statuts amis temps réel
      window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
      console.log(
        '📡 [APP] Événement friendsStatusUpdate émis (début partage)'
      );

      // 🔔 AMÉLIORATION MAJEURE: Utiliser le service pour notifier les participants
      console.log('🚨 [AVANT] Appel notifyFriendsOfDeparture...', {
        user: user.uid,
        availabilityId,
      });
      try {
        await AvailabilityService.notifyFriendsOfDeparture(
          user.uid,
          availabilityId
        );
        console.log('🚨 [APRÈS] notifyFriendsOfDeparture TERMINÉ SANS ERREUR');
      } catch (notificationError) {
        console.error(
          '🚨 [ERREUR] Erreur notifications participants:',
          notificationError
        );
        console.error('🚨 [ERREUR] Stack trace:', notificationError.stack);
        // Ne pas bloquer l'arrêt pour une erreur de notification
      }
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
      debugLog(`🔥 [APP] handleSendInvitations appelé !`, {
        activity,
        friendIds,
        userUid: user?.uid,
      });

      if (!user || !location) {
        throw new Error('Utilisateur ou localisation manquant');
      }

      debugLog(`📨 Envoi d'invitations ${activity} à ${friendIds.length} amis`);

      // Envoyer les invitations avec vérification anti-duplication
      const result = await InvitationService.sendInvitations(
        user.uid,
        activity,
        friendIds,
        location
      );

      debugLog(`🔥 [APP] Résultat de sendInvitations:`, result);

      // 🎯 Définir l'état d'invitation en attente
      if (result.count > 0) {
        // Créer UNE carte par ami invité (pas une carte groupée)
        const invitedFriends = friends.filter(friend =>
          friendIds.includes(friend.id)
        );

        // Créer un array de cartes, une par ami
        const pendingInvitations = invitedFriends.map(friend => ({
          activity,
          sentAt: new Date().getTime(),
          friendId: friend.id,
          friendName: friend.name || friend.displayName || 'Ami',
          senderId: user.uid,
        }));

        setPendingInvitation(pendingInvitations);

        // Sauvegarder dans localStorage
        localStorage.setItem(
          'pendingInvitation',
          JSON.stringify(pendingInvitations)
        );

        // 🔔 Créer une notification dans le centre de notifications
        const friendNames = invitedFriends.map(
          f => f.name || f.displayName || 'Ami'
        );
        const friendsTextNotif =
          result.count === 1
            ? friendNames[0]
            : `${friendNames.slice(0, 2).join(', ')}${result.count > 2 ? ` et ${result.count - 2} autre${result.count > 3 ? 's' : ''}` : ''}`;

        console.log('🔔 [DEBUG] Création notification invitation_sent');
        await NotificationService.createNotification(
          user.uid,
          user.uid,
          'invitation_sent',
          `Tu as invité ${friendsTextNotif} pour ${activity}`,
          {
            activity,
            friendIds,
            friendNames,
            count: result.count,
          }
        );
        console.log('🔔 [DEBUG] Notification invitation_sent créée');

        // 🍞 Afficher un toast de succès avec bouton Annuler
        const friendsText =
          result.count === 1 ? friendNames[0] : `${result.count} amis`;
        toast.success(`Invitation envoyée à ${friendsText}`, {
          duration: 5000,
          action: 'Annuler',
          onAction: () => {
            // Utiliser la ref pour appeler la dernière version de handleCancelInvitations
            cancelInvitationsRef.current?.();
          },
        });
      } else {
        toast.info('Aucune invitation envoyée', { duration: 3000 });
      }
    } catch (error) {
      prodError('❌ Erreur envoi invitations:', error);
      // 🍞 Afficher un toast d'erreur au lieu d'une alert
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // 🚫 Handler pour annuler les invitations en attente
  const handleCancelInvitations = async () => {
    if (!pendingInvitation || !user) return;

    try {
      const { activity, friendIds } = pendingInvitation;

      const result = await InvitationService.cancelSentInvitations(
        user.uid,
        activity,
        friendIds
      );

      // Nettoyer l'état
      setPendingInvitation(null);
      localStorage.removeItem('pendingInvitation');

      if (result.cancelled > 0) {
        toast.success(
          `${result.cancelled} invitation${result.cancelled > 1 ? 's' : ''} annulée${result.cancelled > 1 ? 's' : ''}`,
          {
            duration: 3000,
          }
        );
      } else {
        toast.info('Invitations déjà traitées', { duration: 3000 });
      }
    } catch (error) {
      prodError('❌ Erreur annulation invitations:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Mettre à jour la ref pour le callback du toast
  cancelInvitationsRef.current = handleCancelInvitations;

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

      let message, type;
      if (responseType === 'joined') {
        message = `${userName} a rejoint votre activité ${activityName} !`;
        type = 'activity_joined';
      } else {
        message = `${userName} a décliné votre invitation pour ${activityName}`;
        type = 'activity_declined';
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
        message,
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

      // Si accepté, faire partager les localisations mutuellement
      if (responseType === 'accepted') {
        // 🔥 RÉCIPROCITÉ CORRIGÉE: Utiliser la nouvelle méthode de partage mutuel
        await AvailabilityService.enableMutualLocationSharing(
          user.uid, // Celui qui accepte
          friendId, // L'expéditeur
          activityName
        );

        console.log(
          `🔄 [RÉCIPROCITÉ] Partage mutuel activé entre ${user.uid} ↔ ${friendId}`
        );
      }
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

  // Handler pour ouvrir le modal d'invitation d'amis sans activité pré-sélectionnée
  const handleOpenInviteFriendsModal = () => {
    setSelectedInviteActivity(null); // Aucune activité pré-sélectionnée
    setShowInviteFriendsModal(true);
  };

  // 🎯 NOUVEAU: Handler pour inviter d'autres amis pendant l'événement actif
  const handleInviteMoreFriends = activity => {
    setSelectedInviteActivity(activity);
    setIsActiveEventInvitation(true); // 🚨 Marquer comme invitation d'événement actif
    setShowInviteFriendsModal(true);
  };

  // Handler pour ouvrir le sélecteur d'activité simple
  const handleOpenActivitySelector = () => {
    // Rediriger vers l'accueil
    handleScreenChange('home');
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
      // Nouvelle logique : supprimer toutes les notifications
      const deletePromises = notifications.map(notification =>
        NotificationService.deleteNotification(notification.id)
      );

      await Promise.all(deletePromises);
      setNotifications([]);

      console.log('✅ Toutes les notifications ont été supprimées');
    } catch (error) {
      console.error('Erreur suppression toutes notifications:', error);
      alert(`Erreur lors de la suppression: ${error.message}`);
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
      // 🔧 FIX iPhone: Nettoyer l'état des notifications IMMÉDIATEMENT
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Traiter la réponse dans Firebase
      const result = await FriendsService.respondToFriendInvitation(
        invitationId,
        response,
        user.uid
      );

      if (
        result === response ||
        result === 'accepted' ||
        result === 'declined'
      ) {
        // Si acceptée, recharger la liste d'amis
        if (response === 'accepted') {
          const updatedFriends = await FriendsService.getFriends(user.uid);
          setFriends(updatedFriends);
        }

        console.log(
          `✅ Invitation ${response === 'accepted' ? 'acceptée' : 'refusée'}`
        );
      }

      // 🔧 FIX iPhone: Double vérification du nettoyage de l'état
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 100);
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      alert(`Erreur: ${error.message}`);

      // 🔧 FIX iPhone: Même en cas d'erreur, nettoyer l'état pour éviter le blocage
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 100);
    }
  };

  const handleActivityInvitationResponse = async (notification, response) => {
    try {
      console.log(`🎯 [DEBUG] Réponse à l'invitation d'activité:`, {
        activity: notification.data.activity,
        response,
        from: notification.data.fromUserName,
        invitationId: notification.data.invitationId,
      });

      // 🔧 CRITIQUE: Mettre à jour l'invitation dans Firestore sera fait plus tard dans la fonction
      console.log(
        `🔥 [DEBUG] Traitement de la réponse ${response} pour invitation ${notification.data.invitationId}`
      );

      // 🔧 FIX iPhone: Marquer la notification comme lue IMMÉDIATEMENT
      // pour éviter que l'overlay reste actif et bloque les interactions
      await markNotificationAsRead(notification.id);

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

        // 🎯 NOUVEAU: Démarrer la disponibilité pour celui qui accepte (avec décompte)
        await handleStartAvailability(
          notification.data.activity,
          true, // isResponseToInvitation
          notification.data.fromUserId // respondingToUserId
        );

        // 🚀 DÉCLENCHEMENT IMMÉDIAT: Informer l'interface du changement
        window.dispatchEvent(
          new CustomEvent('availability-state-changed', {
            detail: {
              userId: user.uid,
              newState: 'EN_PARTAGE',
              activity: notification.data.activity,
            },
          })
        );

        // 🎯 NOUVEAU: Créer une notification spéciale pour l'expéditeur pour qu'il démarre son décompte aussi
        const userName = user.displayName || user.name || 'Un ami';
        const activityName = notification.data.activity;

        await NotificationService.createNotification(
          notification.data.fromUserId, // À qui (l'expéditeur)
          user.uid, // De qui (celui qui accepte)
          'activity_accepted_start_timer', // Type spécial pour démarrer le décompte
          `${userName} a accepté votre invitation pour ${activityName} ! Le partage de localisation commence maintenant.`,
          {
            activity: activityName,
            acceptedBy: user.uid,
            acceptedByName: userName,
            originalInvitationId: notification.data.invitationId,
            shouldStartTimer: true, // Flag pour indiquer qu'il faut démarrer le décompte
          }
        );

        console.log(
          `✅ Vous avez accepté l'invitation pour ${notification.data.activity} de ${notification.data.fromUserName} - Décompte démarré !`
        );
      }

      // Répondre à l'invitation dans Firebase (pour les deux cas accepted/declined)
      if (notification.data.invitationId) {
        await InvitationService.respondToInvitation(
          notification.data.invitationId,
          user.uid,
          response
        );

        // Si accepté, faire partager les localisations mutuellement
        if (response === 'accepted') {
          // 🔥 RÉCIPROCITÉ CORRIGÉE: Utiliser la nouvelle méthode de partage mutuel
          await AvailabilityService.enableMutualLocationSharing(
            user.uid, // Celui qui accepte
            notification.data.fromUserId, // L'expéditeur
            notification.data.activity
          );

          console.log(
            `🔄 [RÉCIPROCITÉ] Partage mutuel activé entre ${user.uid} ↔ ${notification.data.fromUserId}`
          );
        } else if (response === 'declined') {
          // 🔧 BUG FIX: Quand on décline, annuler l'invitation de l'expéditeur
          console.log(
            `🔥 [DÉCLIN] Annulation de l'invitation de l'expéditeur...`
          );

          try {
            // 1. Nettoyer toutes les invitations entre ces deux utilisateurs pour cette activité
            await InvitationService.cleanupInvitationsBetweenUsers(
              user.uid,
              notification.data.fromUserId,
              notification.data.activity
            );

            // 2. Supprimer la notification d'invitation correspondante pour l'expéditeur
            await NotificationService.removeInvitationNotification(
              notification.data.fromUserId, // L'expéditeur (qui doit voir disparaître la notif)
              user.uid, // Celui qui décline
              notification.data.activity
            );

            // 3. Forcer l'arrêt de la disponibilité de l'expéditeur (annuler son compte à rebours)
            try {
              // Chercher l'availability de l'expéditeur pour cette activité et l'arrêter
              const senderAvailabilities =
                await AvailabilityService.getAvailableFriends(
                  notification.data.fromUserId
                );
              const senderActivityForThisActivity = senderAvailabilities.find(
                avail =>
                  avail.userId === notification.data.fromUserId &&
                  avail.activity === notification.data.activity
              );

              if (senderActivityForThisActivity) {
                console.log(
                  `🔥 [DÉCLIN] Arrêt de la disponibilité de l'expéditeur: ${senderActivityForThisActivity.id}`
                );
                await AvailabilityService.stopAvailability(
                  notification.data.fromUserId,
                  senderActivityForThisActivity.id
                );
              }
            } catch (stopError) {
              console.warn(
                "⚠️ Erreur lors de l'arrêt de la disponibilité de l'expéditeur (non critique):",
                stopError
              );
            }

            // 4. Retirer l'expéditeur de notre liste des disponibles
            setAvailableFriends(prev =>
              prev.filter(
                friend =>
                  friend.userId !== notification.data.fromUserId ||
                  friend.activity !== notification.data.activity
              )
            );

            console.log(
              `🔥 [DÉCLIN] ✅ Invitation de ${notification.data.fromUserName} annulée et disponibilité arrêtée`
            );
          } catch (cleanupError) {
            console.error(
              "❌ Erreur lors de l'annulation de l'invitation:",
              cleanupError
            );
          }
        }
      } else {
        console.warn("⚠️ ID d'invitation manquant dans la notification");
      }

      // 🔧 FIX iPhone: Forcer un re-render complet pour s'assurer que l'interface est réactive
      setTimeout(() => {
        // Forcer le rechargement de l'état des notifications pour nettoyer les états résiduels
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 100);

      const responseText = response === 'accepted' ? 'accepté' : 'décliné';
      console.log(
        `✅ Vous avez ${responseText} l'invitation pour ${notification.data.activity}`
      );
    } catch (error) {
      console.error("❌ Erreur lors de la réponse à l'invitation:", error);
      alert(`Erreur: ${error.message}`);

      // 🔧 FIX iPhone: Même en cas d'erreur, nettoyer l'état pour éviter le blocage
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 100);
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
          friend.activity === (currentActivity || pendingInvitation?.activity)
      );

      console.log('🛑 [DEBUG] Ami qui avait accepté:', friendWhoAccepted);

      // 🎯 AMÉLIORÉ: Annuler toutes les invitations en cours pour cette activité
      const activityToCancel = currentActivity || pendingInvitation?.activity;
      if (activityToCancel) {
        console.log(
          '🛑 [DEBUG] Annulation des invitations pour:',
          activityToCancel
        );

        try {
          // Chercher TOUTES les notifications d'invitation (même lues) que j'ai envoyées pour cette activité
          const cancelResult =
            await NotificationService.cancelInvitationNotifications(
              user.uid,
              activityToCancel
            );

          console.log(
            '🛑 [DEBUG] Résultat annulation notifications:',
            cancelResult
          );

          // Nettoyer aussi les invitations dans Firestore
          await InvitationService.cleanupUserInvitations(
            user.uid,
            activityToCancel
          );

          console.log(
            '🛑 [DEBUG] ✅ Invitations annulées pour',
            activityToCancel
          );

          // 🔥 NOUVEAU: Nettoyer les availabilities expirées pour éviter les participants fantômes
          console.log('🛑 [DEBUG] 🧹 Nettoyage des availabilities expirées...');
          await AvailabilityService.cleanupExpiredAvailabilities();

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

      // 🔔 AMÉLIORATION MAJEURE: Utiliser le service pour notifier les participants
      console.log('🚨 [AVANT] Appel notifyFriendsOfDeparture...', {
        user: user.uid,
        availabilityId,
      });
      try {
        await AvailabilityService.notifyFriendsOfDeparture(
          user.uid,
          availabilityId
        );
        console.log('🚨 [APRÈS] notifyFriendsOfDeparture TERMINÉ SANS ERREUR');
      } catch (notificationError) {
        console.error(
          '🚨 [ERREUR] Erreur notifications participants:',
          notificationError
        );
        console.error('🚨 [ERREUR] Stack trace:', notificationError.stack);
        // Ne pas bloquer l'arrêt pour une erreur de notification
      }

      console.log('🛑 [DEBUG] ✅ Disponibilité arrêtée');

      // 🔔 SUPPRIMÉ: Auto-notification inutile car l'utilisateur sait qu'il a arrêté son partage
      // Seules les notifications aux autres participants sont nécessaires

      // 🚀 DÉCLENCHEMENT IMMÉDIAT: Informer l'interface du changement
      window.dispatchEvent(
        new CustomEvent('availability-state-changed', {
          detail: { userId: user.uid, newState: 'LIBRE', activity: null },
        })
      );

      // 🎯 NOUVEAU: Déclencher mise à jour statuts amis temps réel
      window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
      console.log(
        '📡 [APP] Événement friendsStatusUpdate émis (arrêt partage)'
      );
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt de disponibilité:", error);
      // Continuer même en cas d'erreur pour permettre l'arrêt local
    }

    setIsAvailable(false);
    setCurrentActivity(null);
    setAvailabilityId(null);
    setAvailabilityStartTime(null);
    setPendingInvitation(null);

    // 🐛 FIX SIMPLE: Nettoyer localStorage
    localStorage.removeItem('availabilityState');
    localStorage.removeItem('pendingInvitation'); // 🎯 NOUVEAU: Nettoyer aussi pendingInvitation

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
          `${user.displayName || user.name || 'Un ami'} a terminé l'activité ${result.activity}`,
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

      // 🔧 FIX: Nettoyer les états locaux et localStorage pour éviter confusion entre utilisateurs
      setPendingInvitation(null);
      setIsAvailable(false);
      setCurrentActivity(null);
      localStorage.removeItem('pendingInvitation');
      localStorage.removeItem('availabilityState');

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
      await FriendsService.addTestFriendships(user.uid);

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

  // 🎯 Nettoyage automatique des invitations après 2 heures
  useEffect(() => {
    if (
      !pendingInvitation ||
      !Array.isArray(pendingInvitation) ||
      pendingInvitation.length === 0
    )
      return;

    // Nettoyage automatique après 2 heures pour chaque invitation
    const maxDuration = 2 * 60 * 60 * 1000; // 2 heures
    const now = Date.now();

    // Filtrer les invitations trop vieilles (> 2h)
    const validInvitations = pendingInvitation.filter(inv => {
      const elapsed = now - inv.sentAt;
      return elapsed < maxDuration;
    });

    if (validInvitations.length !== pendingInvitation.length) {
      console.log(
        `⏰ [EXPIRATION] Nettoyage ${pendingInvitation.length - validInvitations.length} invitations > 2h`
      );
      if (validInvitations.length === 0) {
        setPendingInvitation(null);
        localStorage.removeItem('pendingInvitation');
      } else {
        setPendingInvitation(validInvitations);
        localStorage.setItem(
          'pendingInvitation',
          JSON.stringify(validInvitations)
        );
      }
      return;
    }

    // Timer pour nettoyer la plus ancienne invitation après 2h
    const oldestInvitation = pendingInvitation.reduce((oldest, current) =>
      current.sentAt < oldest.sentAt ? current : oldest
    );
    const elapsed = now - oldestInvitation.sentAt;
    const remaining = maxDuration - elapsed;

    if (remaining > 0) {
      const timer = setTimeout(() => {
        console.log('⏰ [EXPIRATION] Timer 2h atteint, re-vérification');
        const nowCheck = Date.now();
        const stillValid = pendingInvitation.filter(inv => {
          const elapsedCheck = nowCheck - inv.sentAt;
          return elapsedCheck < maxDuration;
        });
        if (stillValid.length === 0) {
          setPendingInvitation(null);
          localStorage.removeItem('pendingInvitation');
        } else {
          setPendingInvitation(stillValid);
          localStorage.setItem('pendingInvitation', JSON.stringify(stillValid));
        }
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [pendingInvitation]);

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

  // 🎯 Restaurer pendingInvitation depuis localStorage
  const restorePendingInvitation = () => {
    try {
      const saved = localStorage.getItem('pendingInvitation');
      if (saved) {
        const data = JSON.parse(saved);
        console.log('🔄 [REFRESH] Restauration invitations en attente:', data);

        // Gérer ancien format (objet unique) et nouveau format (array)
        const invitations = Array.isArray(data) ? data : [data];

        // 🔧 FIX: Vérifier que les invitations appartiennent à l'utilisateur actuel
        const userInvitations = invitations.filter(inv => {
          if (inv.senderId && inv.senderId !== user.uid) {
            console.log(
              '⚠️ Invitation appartient à un autre utilisateur, ignorée'
            );
            return false;
          }
          return true;
        });

        if (userInvitations.length === 0) {
          localStorage.removeItem('pendingInvitation');
          return;
        }

        // Vérifier que les invitations ne sont pas trop anciennes (plus de 2h)
        const now = Date.now();
        const maxDuration = 2 * 60 * 60 * 1000; // 2 heures

        const validInvitations = userInvitations.filter(inv => {
          const elapsed = now - inv.sentAt;
          return elapsed < maxDuration;
        });

        if (validInvitations.length > 0) {
          setPendingInvitation(validInvitations);
          console.log(
            `✅ ${validInvitations.length} invitations en attente restaurées`
          );
        } else {
          console.log('⏰ Invitation expirée, nettoyage localStorage');
          localStorage.removeItem('pendingInvitation');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur restauration pendingInvitation:', error);
      localStorage.removeItem('pendingInvitation');
    }
  };

  // Charger les données utilisateur
  useEffect(() => {
    if (!user) {
      // Si l'utilisateur se déconnecte, réinitialiser l'écran à l'accueil
      setCurrentScreen('home');
      // 🔧 FIX: Réinitialiser aussi pendingInvitation pour éviter qu'un autre utilisateur la voie
      setPendingInvitation(null);
      // Arrêter le heartbeat de présence
      PresenceService.stopPresenceHeartbeat();
      return;
    }

    // Démarrer le heartbeat de présence
    PresenceService.startPresenceHeartbeat(user.uid);

    let unsubscribeAvailable;
    let unsubscribeNotifications;

    const loadUserData = async () => {
      try {
        // Charger les amis
        const friendsData = await FriendsService.getFriends(user.uid);
        setFriends(friendsData);

        // 🐛 FIX SIMPLE: Récupérer l'état depuis localStorage après refresh
        restoreAvailabilityState();
        restorePendingInvitation(); // 🎯 NOUVEAU: Restaurer aussi pendingInvitation

        // Écouter les amis disponibles (utilise onSnapshot)
        unsubscribeAvailable = AvailabilityService.onAvailableFriends(
          user.uid,
          setAvailableFriends
        );

        // Configurer le listener pour les notifications en temps réel
        unsubscribeNotifications = NotificationService.onNotifications(
          user.uid,
          newNotifications => {
            console.log(
              '🔔 App.js - Notifications reçues via listener:',
              newNotifications
            );
            console.log(
              '🔔 App.js - Nombre de notifications via listener:',
              newNotifications?.length || 0
            );
            setNotifications(newNotifications);
          }
        );

        // Charger les notifications initialement
        const notificationsData = await NotificationService.getNotifications(
          user.uid
        );
        console.log(
          '🔔 App.js - Notifications chargées initialement:',
          notificationsData
        );
        console.log(
          '🔔 App.js - Nombre de notifications initiales:',
          notificationsData?.length || 0
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
      // Arrêter le heartbeat de présence
      PresenceService.stopPresenceHeartbeat();
    };
  }, [user]);

  // 🎯 NOUVEAU: Surveiller les notifications pour traiter automatiquement les démarrages de décompte
  useEffect(() => {
    if (!notifications || !user) return;

    // Chercher les nouvelles notifications de type "activity_accepted_start_timer" non lues
    const timerStartNotifications = notifications.filter(
      notif =>
        notif.type === 'activity_accepted_start_timer' &&
        !notif.read &&
        notif.data?.shouldStartTimer
    );

    // Traiter chaque notification de démarrage de décompte
    timerStartNotifications.forEach(async notification => {
      try {
        console.log(
          '🎯 [AUTO] Traitement notification démarrage décompte:',
          notification
        );

        // 🎯 NOUVEAU: Supprimer l'état d'invitation en attente car quelqu'un a accepté
        if (
          pendingInvitation &&
          pendingInvitation.activity === notification.data.activity
        ) {
          console.log(
            '🎯 [AUTO] Suppression invitation en attente car acceptée'
          );
          setPendingInvitation(null);
          localStorage.removeItem('pendingInvitation'); // 🎯 NOUVEAU: Supprimer aussi du localStorage
        }

        // Démarrer la disponibilité avec décompte pour l'expéditeur original
        if (!isAvailable || currentActivity !== notification.data.activity) {
          console.log(
            `🔧 [FIX] Démarrage automatique pour expéditeur - validation souple activée`
          );

          await handleStartAvailability(
            notification.data.activity,
            true, // 🚨 FIX: Traiter comme une "réponse" pour éviter la validation stricte
            notification.data.acceptedBy // L'utilisateur qui a accepté
          );

          console.log(
            `🎯 [AUTO] Décompte démarré pour ${notification.data.activity} suite à l'acceptation de ${notification.data.acceptedByName}`
          );
        }

        // Marquer la notification comme lue automatiquement
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error(
          '❌ Erreur traitement notification démarrage décompte:',
          error
        );
      }
    });

    // 🔧 BUG FIX: Gérer les notifications de déclin pour annuler pendingInvitation (avec déduplication)
    const unprocessedDeclineNotifications = notifications.filter(
      notification =>
        notification.type === 'invitation_response' &&
        notification.data?.accepted === false &&
        !notification.read &&
        !processedDeclineNotifications.has(notification.id)
    );

    unprocessedDeclineNotifications.forEach(async notification => {
      try {
        console.log(
          '🚫 [AUTO] Traitement notification de déclin (première fois):',
          notification
        );

        // Marquer comme traitée immédiatement pour éviter les doublons
        setProcessedDeclineNotifications(
          prev => new Set([...prev, notification.id])
        );

        // 🎯 NOUVEAU: Supprimer l'état d'invitation en attente car quelqu'un a décliné
        if (
          pendingInvitation &&
          pendingInvitation.activity === notification.data.activity
        ) {
          console.log(
            '🚫 [AUTO] Suppression invitation en attente car déclinée par',
            notification.data.fromUserName
          );
          setPendingInvitation(null);
          localStorage.removeItem('pendingInvitation');

          // Arrêter la disponibilité si on était en attente
          if (isAvailable && currentActivity === notification.data.activity) {
            console.log(
              '🚫 [AUTO] Arrêt de la disponibilité car invitation déclinée'
            );
            await handleStopAvailability();
          }
        }

        // Ne PAS marquer automatiquement comme lue pour que l'utilisateur voie le badge de notification
      } catch (error) {
        console.error('❌ Erreur traitement notification de déclin:', error);
      }
    });
  }, [
    notifications,
    user,
    isAvailable,
    currentActivity,
    pendingInvitation,
    processedDeclineNotifications,
  ]);

  const handleProfileUpdate = async updatedUser => {
    try {
      console.log('📝 Profile update received:', updatedUser);

      // Rafraîchir immédiatement les données utilisateur depuis Firestore
      // pour synchroniser l'état global avec la nouvelle photo
      await refreshUserData();

      console.log(
        '✅ User data refreshed in App.js - header should update now'
      );
    } catch (error) {
      console.error(
        '❌ Error refreshing user data in handleProfileUpdate:',
        error
      );
      // En cas d'erreur, on continue sans interrompre l'expérience utilisateur
    }
  };

  // Fonction pour gérer le changement d'écran avec logique notifications
  const handleScreenChange = screen => {
    if (screen === 'notifications') {
      // Marquer la visite au centre de notifications
      setLastNotificationCenterVisit(Date.now());
      // Note: Le marquage automatique comme "lu" est maintenant géré dans NotificationsScreen
    }
    if (screen === 'friends') {
      // Marquer la visite à l'onglet amis
      setLastFriendsTabVisit(Date.now());
    }
    setCurrentScreen(screen);
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
        <div className="flex-1 relative overflow-hidden">
          <Suspense
            fallback={
              <LoadingSpinner message="Chargement de la carte..." size="lg" />
            }
          >
            <MapComponent
              userLocation={location}
              availableFriends={availableFriends}
              darkMode={darkMode}
              selectedActivity={currentActivity}
              isAvailable={isAvailable}
              showControls={true}
              onRetryGeolocation={retryGeolocation}
              onRequestLocationPermission={requestLocationPermission}
            />
          </Suspense>
        </div>

        {/* Navigation */}
        <AppShell
          user={user}
          darkMode={darkMode}
          currentScreen={currentScreen}
          themeMode={themeMode}
          pushNotificationStatus={pushNotificationStatus}
          pendingInvitation={pendingInvitation}
          onScreenChange={handleScreenChange}
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
          onShowDeleteAccount={() => setShowDeleteAccountModal(true)}
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
          onRetryGeolocation={retryGeolocation}
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
          onOpenInviteFriendsModal={handleOpenInviteFriendsModal}
          onOpenActivitySelector={handleOpenActivitySelector}
        />

        {/* Modal d'ajout d'amis */}
        {showAddFriendModal && (
          <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
            <AddFriendModal
              isOpen={showAddFriendModal}
              onClose={() => setShowAddFriendModal(false)}
              onAddFriend={handleAddFriend}
              currentUser={user}
              darkMode={darkMode}
            />
          </Suspense>
        )}

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

        {/* Modal de suppression de compte */}
        {showDeleteAccountModal && (
          <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
            <DeleteAccountModal
              isOpen={showDeleteAccountModal}
              onClose={() => setShowDeleteAccountModal(false)}
              onConfirm={handleDeleteAccount}
              darkMode={darkMode}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // Rendu normal pour les autres écrans
  return (
    <>
      <AppShell
        user={user}
        darkMode={darkMode}
        currentScreen={currentScreen}
        themeMode={themeMode}
        pushNotificationStatus={pushNotificationStatus}
        pendingInvitation={pendingInvitation}
        onScreenChange={handleScreenChange}
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
        onShowDeleteAccount={() => setShowDeleteAccountModal(true)}
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
        onRetryGeolocation={retryGeolocation}
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
        onCancelInvitations={handleCancelInvitations}
        onInviteFriends={handleActivityClick}
        onOpenInviteFriendsModal={handleOpenInviteFriendsModal}
        onOpenActivitySelector={handleOpenActivitySelector}
      />

      {/* Modal d'ajout d'amis */}
      {showAddFriendModal && (
        <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
          <AddFriendModal
            isOpen={showAddFriendModal}
            onClose={() => setShowAddFriendModal(false)}
            onAddFriend={handleAddFriend}
            currentUser={user}
            darkMode={darkMode}
          />
        </Suspense>
      )}

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

      {/* Modal de suppression de compte */}
      {showDeleteAccountModal && (
        <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
          <DeleteAccountModal
            isOpen={showDeleteAccountModal}
            onClose={() => setShowDeleteAccountModal(false)}
            onConfirm={handleDeleteAccount}
            darkMode={darkMode}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;
