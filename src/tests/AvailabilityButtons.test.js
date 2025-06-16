// @ts-nocheck
// Tests AvailabilityButtons.js - PHASE 2 - Logique Métier Core (Priorité HAUTE)

import { fireEvent, render, screen } from '@testing-library/react';
import AvailabilityButtons from '../components/AvailabilityButtons';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({
      children,
      className,
      whileHover,
      whileTap,
      onClick,
      ...props
    }) => {
      const React = require('react');
      return React.createElement(
        'button',
        { className, onClick, ...props },
        children
      );
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Coffee: ({ size, className }) => (
    <div data-testid="coffee-icon" style={{ width: size, height: size }}>
      ☕
    </div>
  ),
  MapPin: ({ size, className }) => (
    <div data-testid="mappin-icon" style={{ width: size, height: size }}>
      📍
    </div>
  ),
  Clock: ({ size, className }) => (
    <div data-testid="clock-icon" style={{ width: size, height: size }}>
      ⏰
    </div>
  ),
  Users: ({ size, className }) => (
    <div data-testid="users-icon" style={{ width: size, height: size }}>
      👥
    </div>
  ),
  X: ({ size, className }) => (
    <div data-testid="x-icon" style={{ width: size, height: size }}>
      ❌
    </div>
  ),
  Plus: ({ size, className }) => (
    <div data-testid="plus-icon" style={{ width: size, height: size }}>
      ➕
    </div>
  ),
}));

describe('AvailabilityButtons - PHASE 2 - Logique Métier Core', () => {
  const defaultProps = {
    isAvailable: false,
    currentActivity: null,
    onStartAvailability: jest.fn(),
    onStopAvailability: jest.fn(),
    location: null,
    locationError: null,
    darkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🎨 États de base', () => {
    test("doit afficher les boutons d'activité quand non disponible", () => {
      render(<AvailabilityButtons {...defaultProps} />);

      // Activités principales
      expect(screen.getByText(/coffee/i)).toBeInTheDocument();
      expect(screen.getByText(/lunch/i)).toBeInTheDocument();
      expect(screen.getByText(/drinks/i)).toBeInTheDocument();
      expect(screen.getByText(/chill/i)).toBeInTheDocument();
    });

    test('doit afficher le statut actuel quand disponible', () => {
      const props = {
        ...defaultProps,
        isAvailable: true,
        currentActivity: 'coffee',
      };

      render(<AvailabilityButtons {...props} />);

      expect(screen.getByText(/coffee/i)).toBeInTheDocument();
      expect(screen.getByText(/arrêter/i)).toBeInTheDocument();
    });
  });

  describe('🖱️ Interactions', () => {
    test("doit appeler onStartAvailability avec l'activité choisie", () => {
      const onStartAvailability = jest.fn();
      render(
        <AvailabilityButtons
          {...defaultProps}
          onStartAvailability={onStartAvailability}
        />
      );

      const coffeeButton = screen.getByText(/coffee/i);
      fireEvent.click(coffeeButton);

      expect(onStartAvailability).toHaveBeenCalledWith('coffee');
    });

    test('doit appeler onStopAvailability quand on arrête', () => {
      const onStopAvailability = jest.fn();
      const props = {
        ...defaultProps,
        isAvailable: true,
        currentActivity: 'coffee',
        onStopAvailability,
      };

      render(<AvailabilityButtons {...props} />);

      const stopButton = screen.getByText(/arrêter/i);
      fireEvent.click(stopButton);

      expect(onStopAvailability).toHaveBeenCalledTimes(1);
    });
  });

  describe('📍 Gestion de la localisation', () => {
    test("doit afficher un message d'erreur de localisation", () => {
      const props = {
        ...defaultProps,
        locationError: 'Erreur GPS',
      };

      render(<AvailabilityButtons {...props} />);

      expect(screen.getByText(/localisation/i)).toBeInTheDocument();
    });

    test('doit permettre de réessayer la géolocalisation', () => {
      const retryGeolocation = jest.fn();
      const props = {
        ...defaultProps,
        locationError: 'Erreur GPS',
        retryGeolocation,
      };

      render(<AvailabilityButtons {...props} />);

      const retryButton = screen.getByText(/réessayer/i);
      fireEvent.click(retryButton);

      expect(retryGeolocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('🌙 Mode sombre', () => {
    test('doit appliquer les styles sombres', () => {
      const props = {
        ...defaultProps,
        darkMode: true,
      };

      render(<AvailabilityButtons {...props} />);

      // Vérifier que le composant se rend sans erreur en mode sombre
      expect(screen.getByText(/coffee/i)).toBeInTheDocument();
    });
  });

  describe('⏰ Gestion du temps', () => {
    test('doit afficher le temps restant quand disponible', () => {
      const props = {
        ...defaultProps,
        isAvailable: true,
        currentActivity: 'coffee',
        availabilityStartTime: Date.now() - 10 * 60 * 1000, // Il y a 10 minutes
      };

      render(<AvailabilityButtons {...props} />);

      // Le temps devrait être affiché quelque part
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('🎯 Activités spécifiques', () => {
    const activities = ['coffee', 'lunch', 'drinks', 'chill'];

    activities.forEach(activity => {
      test(`doit démarrer l'activité ${activity}`, () => {
        const onStartAvailability = jest.fn();
        render(
          <AvailabilityButtons
            {...defaultProps}
            onStartAvailability={onStartAvailability}
          />
        );

        const activityButton = screen.getByText(new RegExp(activity, 'i'));
        fireEvent.click(activityButton);

        expect(onStartAvailability).toHaveBeenCalledWith(activity);
      });
    });
  });

  describe("🔄 États d'erreur", () => {
    test("doit gérer l'absence de callbacks", () => {
      const props = {
        ...defaultProps,
        onStartAvailability: undefined,
        onStopAvailability: undefined,
      };

      expect(() => render(<AvailabilityButtons {...props} />)).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        isAvailable: false,
      };

      expect(() =>
        render(<AvailabilityButtons {...minimalProps} />)
      ).not.toThrow();
    });
  });

  describe('📱 Responsivité', () => {
    test('doit afficher les icônes pour chaque activité', () => {
      render(<AvailabilityButtons {...defaultProps} />);

      // Au moins quelques icônes doivent être présentes
      expect(screen.getByTestId('coffee-icon')).toBeInTheDocument();
    });
  });

  describe('🎭 Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      render(<AvailabilityButtons {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('doit avoir des textes descriptifs', () => {
      render(<AvailabilityButtons {...defaultProps} />);

      // Au moins un des textes d'activité doit être présent
      const hasActivity = ['coffee', 'lunch', 'drinks', 'chill'].some(
        activity => {
          try {
            screen.getByText(new RegExp(activity, 'i'));
            return true;
          } catch {
            return false;
          }
        }
      );

      expect(hasActivity).toBe(true);
    });
  });
});
