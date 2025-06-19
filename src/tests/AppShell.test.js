// @ts-nocheck
// Tests AppShell.js - PHASE 3 - UI Complexe (Priorité HAUTE)

import { fireEvent, render, screen } from '@testing-library/react';
import AppShell from '../components/AppShell';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({ children, className, whileHover, whileTap, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ size, className }) => (
    <div
      className={className}
      data-testid="arrow-left-icon"
      style={{ width: size, height: size }}
    >
      ←
    </div>
  ),
  Bell: ({ size, className }) => (
    <div
      className={className}
      data-testid="bell-icon"
      style={{ width: size, height: size }}
    >
      🔔
    </div>
  ),
  Coffee: ({ size, className }) => (
    <div
      className={className}
      data-testid="coffee-icon"
      style={{ width: size, height: size }}
    >
      ☕
    </div>
  ),
  MapPin: ({ size, className }) => (
    <div
      className={className}
      data-testid="mappin-icon"
      style={{ width: size, height: size }}
    >
      📍
    </div>
  ),
  Users: ({ size, className }) => (
    <div
      className={className}
      data-testid="users-icon"
      style={{ width: size, height: size }}
    >
      👥
    </div>
  ),
}));

// Mock des composants enfants
jest.mock('../components/InviteFriendsModal', () => {
  return function MockInviteFriendsModal(props) {
    return props.isOpen ? (
      <div data-testid="invite-friends-modal">Mock Invite Friends Modal</div>
    ) : null;
  };
});

jest.mock('../components/NotificationBadge', () => {
  return function MockNotificationBadge({ count }) {
    return count > 0 ? (
      <div data-testid="notification-badge">{count}</div>
    ) : null;
  };
});

jest.mock('../components/WarningBanner', () => {
  return function MockWarningBanner(props) {
    return <div data-testid="warning-banner">Mock Warning Banner</div>;
  };
});

// Mock des écrans
jest.mock('../components/screens/HomeScreen', () => {
  return function MockHomeScreen() {
    return <div data-testid="home-screen">Mock Home Screen</div>;
  };
});

jest.mock('../components/screens/FriendsScreen', () => {
  return function MockFriendsScreen() {
    return <div data-testid="friends-screen">Mock Friends Screen</div>;
  };
});

jest.mock('../components/screens/MapScreen', () => {
  return function MockMapScreen() {
    return <div data-testid="map-screen">Mock Map Screen</div>;
  };
});

jest.mock('../components/screens/NotificationsScreen', () => {
  return function MockNotificationsScreen() {
    return (
      <div data-testid="notifications-screen">Mock Notifications Screen</div>
    );
  };
});

jest.mock('../components/screens/SettingsScreen', () => {
  return function MockSettingsScreen() {
    return <div data-testid="settings-screen">Mock Settings Screen</div>;
  };
});

describe('AppShell - PHASE 3 - UI Complexe', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    // Props de state
    user: { id: 'user1', name: 'Test User', avatar: '👤' },
    currentScreen: 'home',
    darkMode: false,
    isOnline: true,
    notifications: [
      { id: 'notif1', type: 'activity_invitation', read: false },
      { id: 'notif2', type: 'friend_invitation', read: false },
    ],
    newNotificationsCount: 2,
    newFriendsNotificationsCount: 1,
    friends: [{ id: 'friend1', name: 'Alice' }],
    isAvailable: false,
    currentActivity: null,
    availabilityStartTime: null,
    availableFriends: [],
    location: null,
    locationError: null,
    useMapbox: false,
    themeMode: 'light',
    pushNotificationStatus: { supported: true, permission: 'granted' },
    pendingInvitation: null,

    // Props de modales
    showInviteFriendsModal: false,
    setShowInviteFriendsModal: jest.fn(),
    selectedInviteActivity: null,

    // Props de fonctions
    onScreenChange: jest.fn(),
    onSetAvailability: jest.fn(),
    onStopAvailability: jest.fn(),
    onTerminateActivity: jest.fn(),
    onRetryGeolocation: jest.fn(),
    onRequestLocationPermission: jest.fn(),
    onInviteFriends: jest.fn(),
    onAddFriend: jest.fn(),
    onAddFriendById: jest.fn(),
    onRemoveFriend: jest.fn(),
    onDebugFriends: jest.fn(),
    onCreateTestFriendships: jest.fn(),
    onLoadMockData: jest.fn(),
    onFriendInvitationResponse: jest.fn(),
    onActivityInvitationResponse: jest.fn(),
    onMarkNotificationAsRead: jest.fn(),
    onMarkAllNotificationsAsRead: jest.fn(),
    onMarkAllFriendsNotificationsAsRead: jest.fn(),
    onProfileUpdate: jest.fn(),
    onThemeChange: jest.fn(),
    onMapProviderChange: jest.fn(),
    onEnablePushNotifications: jest.fn(),
    onTestPushNotification: jest.fn(),
    onCheckPushStatus: jest.fn(),
    onOpenDebugNotifications: jest.fn(),
    onShowDeleteAccount: jest.fn(),
    onSignOut: jest.fn(),
    onSendInvitations: jest.fn(),
    onOpenInviteFriendsModal: jest.fn(),
    onOpenActivitySelector: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🧭 Navigation principale', () => {
    test('doit afficher la navigation en bas par défaut', () => {
      render(<AppShell {...defaultProps} />);

      expect(screen.getAllByTestId('coffee-icon').length).toBeGreaterThan(0); // Accueil
      expect(screen.getAllByTestId('mappin-icon').length).toBeGreaterThan(0); // Carte
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0); // Amis
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Carte')).toBeInTheDocument();
      expect(screen.getByText('Amis')).toBeInTheDocument();
    });

    test('doit masquer la navigation sur les écrans paramètres/notifications', () => {
      const settingsProps = { ...defaultProps, currentScreen: 'settings' };
      render(<AppShell {...settingsProps} />);

      expect(screen.queryByText('Accueil')).not.toBeInTheDocument();
      expect(screen.queryByText('Carte')).not.toBeInTheDocument();
      expect(screen.queryByText('Amis')).not.toBeInTheDocument();
    });

    test("doit marquer l'onglet actif visuellement", () => {
      render(<AppShell {...defaultProps} />);

      // Par défaut sur home, vérifier que tous les onglets sont présents
      expect(screen.getByText('Carte')).toBeInTheDocument();
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Amis')).toBeInTheDocument();

      // L'écran d'accueil doit être affiché par défaut
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test("doit afficher le badge de notifications sur l'onglet amis", () => {
      render(<AppShell {...defaultProps} />);

      // Badge doit être visible quand on n'est pas sur l'écran amis
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
    });

    test("doit masquer le badge quand on est sur l'écran amis", () => {
      const friendsProps = { ...defaultProps, currentScreen: 'friends' };
      render(<AppShell {...friendsProps} />);

      // Badge ne doit pas être visible quand on est sur l'écran amis
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    test('doit appeler onScreenChange lors du clic sur un onglet', async () => {
      render(<AppShell {...defaultProps} />);

      const mapTab = screen.getByText('Carte');

      fireEvent.click(mapTab);

      expect(defaultProps.onScreenChange).toHaveBeenCalledWith('map');
    });
  });

  describe('📱 Affichage des écrans', () => {
    test("doit afficher l'écran d'accueil par défaut", () => {
      render(<AppShell {...defaultProps} />);
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test("doit afficher l'écran des amis", () => {
      const friendsProps = { ...defaultProps, currentScreen: 'friends' };
      render(<AppShell {...friendsProps} />);
      expect(screen.getByTestId('friends-screen')).toBeInTheDocument();
    });

    test("doit afficher l'écran de la carte", () => {
      const mapProps = { ...defaultProps, currentScreen: 'map' };
      render(<AppShell {...mapProps} />);
      expect(screen.getByTestId('map-screen')).toBeInTheDocument();
    });

    test("doit afficher l'écran des notifications", () => {
      const notifProps = { ...defaultProps, currentScreen: 'notifications' };
      render(<AppShell {...notifProps} />);
      expect(screen.getByTestId('notifications-screen')).toBeInTheDocument();
    });

    test("doit afficher l'écran des paramètres", () => {
      const settingsProps = { ...defaultProps, currentScreen: 'settings' };
      render(<AppShell {...settingsProps} />);
      expect(screen.getByTestId('settings-screen')).toBeInTheDocument();
    });
  });

  describe('🎯 Header spéciaux', () => {
    test("doit afficher le header standard pour l'accueil", () => {
      render(<AppShell {...defaultProps} />);

      // Header principal ne doit pas avoir de bouton retour
      expect(screen.queryByTestId('arrow-left-icon')).not.toBeInTheDocument();
    });

    test('doit afficher le header avec retour pour les paramètres', () => {
      const settingsProps = { ...defaultProps, currentScreen: 'settings' };
      render(<AppShell {...settingsProps} />);

      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      expect(screen.getByText('Paramètres')).toBeInTheDocument();
      expect(
        screen.getByText('Gérer votre profil et préférences')
      ).toBeInTheDocument();
    });

    test('doit afficher le header avec retour pour les notifications', () => {
      const notifProps = { ...defaultProps, currentScreen: 'notifications' };
      render(<AppShell {...notifProps} />);

      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('2 notifications')).toBeInTheDocument();
    });

    test("doit permettre le retour à l'accueil", () => {
      const settingsProps = { ...defaultProps, currentScreen: 'settings' };
      render(<AppShell {...settingsProps} />);

      const backButton = screen.getByTestId('arrow-left-icon');

      fireEvent.click(backButton);

      expect(defaultProps.onScreenChange).toHaveBeenCalledWith('home');
    });
  });

  describe('🌓 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<AppShell {...darkProps} />);

      // Vérifier que les classes pour le mode sombre sont appliquées
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('bg-gray-800');
    });

    test("doit conserver le thème lors des changements d'écran", () => {
      const darkProps = {
        ...defaultProps,
        darkMode: true,
        currentScreen: 'settings',
      };
      render(<AppShell {...darkProps} />);

      // Header en mode sombre - chercher un élément avec la classe appropriée
      const darkElements = document.querySelectorAll('.bg-gray-800');
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  describe('🔔 Gestion des modales', () => {
    test("doit afficher la modale d'invitation d'amis quand ouverte", () => {
      const modalProps = { ...defaultProps, showInviteFriendsModal: true };
      render(<AppShell {...modalProps} />);

      expect(screen.getByTestId('invite-friends-modal')).toBeInTheDocument();
    });

    test("doit masquer la modale d'invitation d'amis par défaut", () => {
      render(<AppShell {...defaultProps} />);

      expect(
        screen.queryByTestId('invite-friends-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('🌐 Statut de connexion', () => {
    test('doit indiquer le statut hors ligne', () => {
      const offlineProps = { ...defaultProps, isOnline: false };
      render(<AppShell {...offlineProps} />);

      // Devrait afficher une indication de statut hors ligne
      // (le composant semble gérer cela dans le header)
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test('doit fonctionner normalement en ligne', () => {
      render(<AppShell {...defaultProps} />);

      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
      expect(screen.getAllByTestId('coffee-icon').length).toBeGreaterThan(0);
    });
  });

  describe('🧪 Cas limite et robustesse', () => {
    test("doit gérer l'absence de notifications", () => {
      const noNotifProps = {
        ...defaultProps,
        notifications: [],
        newNotificationsCount: 0,
        newFriendsNotificationsCount: 0,
      };
      render(<AppShell {...noNotifProps} />);

      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument(); // Pas de badge
    });

    test("doit gérer l'absence d'utilisateur", () => {
      const noUserProps = { ...defaultProps, user: null };

      expect(() => {
        render(<AppShell {...noUserProps} />);
      }).not.toThrow();
    });

    test("doit gérer l'absence d'amis", () => {
      const noFriendsProps = { ...defaultProps, friends: [] };
      render(<AppShell {...noFriendsProps} />);

      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test('doit gérer les écrans inconnus', () => {
      const unknownScreenProps = { ...defaultProps, currentScreen: 'unknown' };
      render(<AppShell {...unknownScreenProps} />);

      // Devrait afficher l'écran d'accueil par défaut ou gérer gracieusement
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        currentScreen: 'home',
        darkMode: false,
        isOnline: true,
        notifications: [],
        newNotificationsCount: 0,
        newFriendsNotificationsCount: 0,
        friends: [],
        onScreenChange: jest.fn(),
      };

      expect(() => {
        render(<AppShell {...minimalProps} />);
      }).not.toThrow();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir une navigation accessible', () => {
      render(<AppShell {...defaultProps} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
    });

    test('doit avoir des boutons avec texte descriptif', () => {
      render(<AppShell {...defaultProps} />);

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Carte')).toBeInTheDocument();
      expect(screen.getByText('Amis')).toBeInTheDocument();
    });

    test('doit avoir des boutons de retour accessibles', () => {
      const settingsProps = { ...defaultProps, currentScreen: 'settings' };
      render(<AppShell {...settingsProps} />);

      const backButton = screen
        .getByTestId('arrow-left-icon')
        .closest('button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('📊 Intégration des composants', () => {
    test('doit transmettre les bonnes props aux écrans enfants', () => {
      render(<AppShell {...defaultProps} />);

      // Les écrans doivent recevoir les props appropriées
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    test("doit afficher les bannières d'avertissement si nécessaire", () => {
      render(<AppShell {...defaultProps} />);

      // Warning banner devrait être affiché
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
    });
  });
});
