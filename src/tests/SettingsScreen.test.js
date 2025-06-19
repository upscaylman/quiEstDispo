// @ts-nocheck
// Tests SettingsScreen.js - PHASE 3 - UI Complexe (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import SettingsScreen from '../components/screens/SettingsScreen';

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
  Bell: ({ size, className }) => (
    <div
      className={className}
      data-testid="bell-icon"
      style={{ width: size, height: size }}
    >
      🔔
    </div>
  ),
  Moon: ({ size, className }) => (
    <div
      className={className}
      data-testid="moon-icon"
      style={{ width: size, height: size }}
    >
      🌙
    </div>
  ),
  Sun: ({ size, className }) => (
    <div
      className={className}
      data-testid="sun-icon"
      style={{ width: size, height: size }}
    >
      ☀️
    </div>
  ),
  Smartphone: ({ size, className }) => (
    <div
      className={className}
      data-testid="smartphone-icon"
      style={{ width: size, height: size }}
    >
      📱
    </div>
  ),
  Palette: ({ size, className }) => (
    <div
      className={className}
      data-testid="palette-icon"
      style={{ width: size, height: size }}
    >
      🎨
    </div>
  ),
}));

// Mock ProfileEditor
jest.mock('../components/ProfileEditor', () => {
  return function MockProfileEditor({ onProfileUpdate, darkMode, user }) {
    return (
      <div data-testid="profile-editor">
        Mock Profile Editor - User: {user?.name || 'No user'}
        <button onClick={() => onProfileUpdate?.({ name: 'Updated Name' })}>
          Update Profile
        </button>
      </div>
    );
  };
});

// Mock NotificationTest (dev seulement)
jest.mock('../components/NotificationTest', () => ({
  __esModule: true,
  default: function MockNotificationTest({ user, darkMode }) {
    return (
      <div data-testid="notification-test">
        Mock Notification Test - User: {user?.name || 'No user'}
      </div>
    );
  },
}));

describe('SettingsScreen - PHASE 3 - UI Complexe', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    user: {
      id: 'user1',
      name: 'Test User',
      avatar: '👤',
      email: 'test@example.com',
      phone: '+33612345678',
    },
    darkMode: false,
    themeMode: 'light',
    useMapbox: false,
    pushNotificationStatus: {
      supported: true,
      permission: 'granted',
      subscribed: true,
    },
    currentScreen: 'settings',
    onProfileUpdate: jest.fn(),
    onThemeChange: jest.fn(),
    onMapProviderChange: jest.fn(),
    onEnablePushNotifications: jest.fn(),
    onTestPushNotification: jest.fn(),
    onCheckPushStatus: jest.fn(),
    onOpenDebugNotifications: jest.fn(),
    onShowDeleteAccount: jest.fn(),
    onSignOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('📱 Interface utilisateur principale', () => {
    test("doit afficher l'éditeur de profil", () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByTestId('profile-editor')).toBeInTheDocument();
      expect(
        screen.getByText('Mock Profile Editor - User: Test User')
      ).toBeInTheDocument();
    });

    test('doit afficher la section apparence', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByText('🎨 Apparence')).toBeInTheDocument();
      expect(screen.getByText('Thème')).toBeInTheDocument();
      expect(screen.getByText('Thème automatique')).toBeInTheDocument();
    });

    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<SettingsScreen {...darkProps} />);

      // Vérifier que les classes pour le mode sombre sont appliquées
      const appearanceSection = screen.getByText('🎨 Apparence').closest('div');
      expect(appearanceSection).toHaveClass('bg-gray-800');
    });
  });

  describe('🎨 Gestion du thème', () => {
    test("doit afficher l'état du thème clair", () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByText('Interface claire activée')).toBeInTheDocument();
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    test("doit afficher l'état du thème sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true, themeMode: 'dark' };
      render(<SettingsScreen {...darkProps} />);

      expect(screen.getByText('Interface sombre activée')).toBeInTheDocument();
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    test("doit afficher l'état du thème automatique", () => {
      const autoProps = { ...defaultProps, themeMode: 'auto' };
      render(<SettingsScreen {...autoProps} />);

      expect(
        screen.getByText('Géré automatiquement par votre appareil')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Suit automatiquement votre appareil')
      ).toBeInTheDocument();
    });

    test('doit basculer du thème clair vers sombre', () => {
      render(<SettingsScreen {...defaultProps} />);

      // Cliquer sur le toggle du thème principal
      const themeToggle = screen.getByTestId('sun-icon').closest('button');
      fireEvent.click(themeToggle);

      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('dark');
    });

    test('doit basculer du thème sombre vers clair', () => {
      const darkProps = { ...defaultProps, darkMode: true, themeMode: 'dark' };
      render(<SettingsScreen {...darkProps} />);

      const themeToggle = screen.getByTestId('moon-icon').closest('button');
      fireEvent.click(themeToggle);

      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('light');
    });

    test('doit activer le thème automatique', () => {
      render(<SettingsScreen {...defaultProps} />);

      // Rechercher le bouton du thème automatique
      const autoToggleContainer = screen
        .getByText('Thème automatique')
        .closest('div')
        .closest('div');
      const autoToggle = autoToggleContainer.querySelector('button');

      fireEvent.click(autoToggle);

      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('auto');
    });

    test('doit désactiver le thème automatique', () => {
      const autoProps = { ...defaultProps, themeMode: 'auto' };
      render(<SettingsScreen {...autoProps} />);

      const autoToggleContainer = screen
        .getByText('Thème automatique')
        .closest('div')
        .closest('div');
      const autoToggle = autoToggleContainer.querySelector('button');

      fireEvent.click(autoToggle);

      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('light');
    });

    test('doit désactiver le toggle principal en mode auto', () => {
      const autoProps = { ...defaultProps, themeMode: 'auto' };
      render(<SettingsScreen {...autoProps} />);

      const themeToggle = screen
        .getByTestId('smartphone-icon')
        .closest('button');
      expect(themeToggle).toBeDisabled();
    });
  });

  describe('📱 Notifications push (développement)', () => {
    test('doit afficher la section notifications en développement', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<SettingsScreen {...defaultProps} />);

      expect(
        screen.getByText('📱 Notifications Push (dev)')
      ).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('doit masquer la section notifications en production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(<SettingsScreen {...defaultProps} />);

      expect(
        screen.queryByText('📱 Notifications Push (dev)')
      ).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('🧪 Écran debug notifications', () => {
    test("doit afficher l'écran debug en développement", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const debugProps = {
        ...defaultProps,
        currentScreen: 'debug-notifications',
      };
      render(<SettingsScreen {...debugProps} />);

      expect(screen.getByTestId('notification-test')).toBeInTheDocument();
      expect(
        screen.getByText('Mock Notification Test - User: Test User')
      ).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test("ne doit pas afficher l'écran debug en production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const debugProps = {
        ...defaultProps,
        currentScreen: 'debug-notifications',
      };
      render(<SettingsScreen {...debugProps} />);

      expect(screen.queryByTestId('notification-test')).not.toBeInTheDocument();
      // Devrait afficher l'écran normal
      expect(screen.getByTestId('profile-editor')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('👤 Mise à jour du profil', () => {
    test('doit transmettre les props au ProfileEditor', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(
        screen.getByText('Mock Profile Editor - User: Test User')
      ).toBeInTheDocument();
    });

    test('doit gérer la mise à jour du profil', () => {
      render(<SettingsScreen {...defaultProps} />);

      const updateButton = screen.getByText('Update Profile');
      fireEvent.click(updateButton);

      expect(defaultProps.onProfileUpdate).toHaveBeenCalledWith({
        name: 'Updated Name',
      });
    });
  });

  describe('🧪 Cas limite et robustesse', () => {
    test("doit gérer l'absence d'utilisateur", () => {
      const noUserProps = { ...defaultProps, user: null };

      expect(() => {
        render(<SettingsScreen {...noUserProps} />);
      }).not.toThrow();

      expect(
        screen.getByText('Mock Profile Editor - User: No user')
      ).toBeInTheDocument();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        darkMode: false,
        themeMode: 'light',
        currentScreen: 'settings',
      };

      expect(() => {
        render(<SettingsScreen {...minimalProps} />);
      }).not.toThrow();
    });

    test('doit gérer un themeMode invalide', () => {
      const invalidProps = { ...defaultProps, themeMode: 'invalid' };

      expect(() => {
        render(<SettingsScreen {...invalidProps} />);
      }).not.toThrow();
    });

    test("doit gérer l'absence des fonctions callback", () => {
      const noCallbackProps = {
        ...defaultProps,
        onProfileUpdate: undefined,
        onThemeChange: undefined,
      };

      expect(() => {
        render(<SettingsScreen {...noCallbackProps} />);
      }).not.toThrow();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      render(<SettingsScreen {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('doit avoir des labels descriptifs pour les toggles', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByText('Thème')).toBeInTheDocument();
      expect(screen.getByText('Thème automatique')).toBeInTheDocument();
      expect(screen.getByText('Interface claire activée')).toBeInTheDocument();
    });

    test('doit indiquer visuellement les états des toggles', () => {
      render(<SettingsScreen {...defaultProps} />);

      // Toggle principal - position pour thème clair
      const themeToggle = screen.getByTestId('sun-icon').closest('div');
      expect(themeToggle).toHaveClass('translate-x-0');

      // Toggle automatique - désactivé par défaut
      const autoToggleContainer = screen
        .getByText('Thème automatique')
        .closest('div')
        .closest('div');
      const autoToggleButton = autoToggleContainer.querySelector('button');
      expect(autoToggleButton.firstChild).toHaveClass('translate-x-0');
    });

    test('doit indiquer les états activés visuellement', () => {
      const autoProps = { ...defaultProps, themeMode: 'auto' };
      render(<SettingsScreen {...autoProps} />);

      // Toggle automatique activé
      const autoToggleContainer = screen
        .getByText('Thème automatique')
        .closest('div')
        .closest('div');
      const autoToggleButton = autoToggleContainer.querySelector('button');
      expect(autoToggleButton).toHaveClass('bg-purple-500');
      expect(autoToggleButton.firstChild).toHaveClass('translate-x-6');
    });
  });

  describe('🔄 Intégration des composants', () => {
    test('doit transmettre les bonnes props au ProfileEditor', () => {
      render(<SettingsScreen {...defaultProps} />);

      const profileEditor = screen.getByTestId('profile-editor');
      expect(profileEditor).toBeInTheDocument();
    });

    test("doit gérer les changements d'état correctement", () => {
      render(<SettingsScreen {...defaultProps} />);

      // Tester plusieurs interactions
      const updateButton = screen.getByText('Update Profile');
      fireEvent.click(updateButton);

      const themeToggle = screen.getByTestId('sun-icon').closest('button');
      fireEvent.click(themeToggle);

      expect(defaultProps.onProfileUpdate).toHaveBeenCalled();
      expect(defaultProps.onThemeChange).toHaveBeenCalled();
    });
  });

  describe('🎨 Styles et animations', () => {
    test('doit appliquer les bonnes classes CSS selon le thème', () => {
      render(<SettingsScreen {...defaultProps} />);

      const appearanceSection = screen.getByText('🎨 Apparence').closest('div');
      expect(appearanceSection).toHaveClass('bg-white');
    });

    test('doit appliquer les bonnes classes CSS en mode sombre', () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<SettingsScreen {...darkProps} />);

      const appearanceSection = screen.getByText('🎨 Apparence').closest('div');
      expect(appearanceSection).toHaveClass('bg-gray-800');
    });

    test('doit avoir des animations sur les boutons', () => {
      render(<SettingsScreen {...defaultProps} />);

      // Les boutons devraient avoir des classes d'animation
      const themeToggle = screen.getByTestId('sun-icon').closest('button');
      expect(themeToggle).toHaveClass('transition-colors');
    });
  });
});
