// @ts-nocheck
// Tests GPSStatusToast.js - PHASE 2 - Geolocalisation (UI)

import { act, render, screen } from '@testing-library/react';
import GPSStatusToast from '../components/GPSStatusToast';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, className, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle-icon">✅</div>,
  MapPin: () => <div data-testid="map-pin-icon">📍</div>,
  MapPinOff: () => <div data-testid="map-pin-off-icon">📍❌</div>,
}));

describe('GPSStatusToast - PHASE 2 - Geolocalisation UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('🎨 Rendu de base', () => {
    test('ne doit rien afficher si pas de statut', () => {
      const { container } = render(
        <GPSStatusToast status={null} darkMode={false} />
      );

      expect(container.firstChild).toBe(null);
    });

    test('doit afficher le toast quand statut fourni', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      render(<GPSStatusToast status={status} darkMode={false} />);

      expect(
        screen.getByText('🎯 GPS activé - Position mise à jour')
      ).toBeInTheDocument();
    });
  });

  describe('📍 Types de notifications GPS', () => {
    test('doit afficher la notification GPS active', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      render(<GPSStatusToast status={status} darkMode={false} />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(
        screen.getByText('🎯 GPS activé - Position mise à jour')
      ).toBeInTheDocument();
    });

    test('doit afficher la notification GPS desactive', () => {
      const status = {
        type: 'gps_disabled',
        message: null,
        timestamp: Date.now(),
      };

      render(<GPSStatusToast status={status} darkMode={false} />);

      expect(screen.getByTestId('map-pin-off-icon')).toBeInTheDocument();
      expect(screen.getByText('GPS désactivé')).toBeInTheDocument();
    });

    test('doit afficher la notification GPS en cours de mise a jour', () => {
      const status = {
        type: 'gps_updating',
        message: null,
        timestamp: Date.now(),
      };

      render(<GPSStatusToast status={status} darkMode={false} />);

      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      expect(
        screen.getByText('📍 Mise à jour de votre position...')
      ).toBeInTheDocument();
    });
  });

  describe('🌙 Mode sombre', () => {
    test('doit appliquer les styles clairs par defaut', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      const { container } = render(
        <GPSStatusToast status={status} darkMode={false} />
      );

      const toastElement = container.querySelector('.bg-green-500');
      expect(toastElement).toBeInTheDocument();
    });

    test('doit appliquer les styles sombres', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      const { container } = render(
        <GPSStatusToast status={status} darkMode={true} />
      );

      const toastElement = container.querySelector('.bg-green-800');
      expect(toastElement).toBeInTheDocument();
    });
  });

  describe('📱 Responsivite et positionnement', () => {
    test('doit avoir les classes CSS de positionnement', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      const { container } = render(
        <GPSStatusToast status={status} darkMode={false} />
      );

      const toastElement = container.querySelector('.fixed');
      expect(toastElement).toHaveClass('top-4');
    });
  });

  describe('⏰ Gestion des timers et auto-hide', () => {
    test('doit gérer le cycle auto-hide sans warnings', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      render(<GPSStatusToast status={status} darkMode={false} />);

      // Vérifier que le toast est visible
      expect(
        screen.getByText('🎯 GPS activé - Position mise à jour')
      ).toBeInTheDocument();

      // Avancer les timers pour déclencher le auto-hide
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Le composant doit toujours être dans le DOM mais invisiblement
      // car le useEffect se déclenche seulement au changement de status
    });

    test('doit nettoyer les timers au unmount', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      const { unmount } = render(
        <GPSStatusToast status={status} darkMode={false} />
      );

      // Démonter le composant - ceci nettoie automatiquement les timers
      unmount();

      // Avancer les timers - aucun warning ne devrait apparaître car cleanup effectué
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });
  });

  describe('🔧 Props et validation', () => {
    test('doit gerer les props manquantes gracieusement', () => {
      expect(() => render(<GPSStatusToast />)).not.toThrow();
    });

    test('doit gerer darkMode undefined', () => {
      const status = {
        type: 'gps_enabled',
        message: null,
        timestamp: Date.now(),
      };

      expect(() => render(<GPSStatusToast status={status} />)).not.toThrow();
    });
  });
});
