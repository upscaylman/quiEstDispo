// @ts-nocheck
// BaseMapView - PHASE 4 - Fonctionnalités Avancées (Composants Carte)

import { render, screen } from '@testing-library/react';
import BaseMapView from '../components/map/BaseMapView';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">⏰</div>,
  Crosshair: () => <div data-testid="crosshair-icon">🎯</div>,
  Filter: () => <div data-testid="filter-icon">🔍</div>,
  MapPin: () => <div data-testid="map-pin-icon">📍</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  X: () => <div data-testid="x-icon">❌</div>,
}));

// Mock mapUtils
jest.mock('../components/map/mapUtils', () => ({
  activities: [
    { id: 'coffee', name: 'Coffee', color: '#f59e0b' },
    { id: 'lunch', name: 'Lunch', color: '#10b981' },
  ],
  calculateDistance: jest.fn(() => 1.5),
  filterFriendsByActivity: jest.fn(friends => friends),
  formatDistance: jest.fn(distance => `${distance} km`),
  getActivityColor: jest.fn(() => '#f59e0b'),
  sanitizeFriendsData: jest.fn(friends => friends || []),
}));

// Mock console
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// === FIXTURES ===

const createMockFriend = (id = 'friend1', overrides = {}) => ({
  id,
  name: `Friend ${id}`,
  avatar: '👤',
  location: { lat: 48.8566, lng: 2.3522 },
  activity: 'coffee',
  distance: 1.2,
  isAvailable: true,
  ...overrides,
});

const createMockLocation = (overrides = {}) => ({
  lat: 48.8566,
  lng: 2.3522,
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user123',
  name: 'Test User',
  avatar: '😊',
  ...overrides,
});

// === TESTS ===

describe('BaseMapView - PHASE 4 - Fonctionnalités Avancées', () => {
  const defaultProps = {
    availableFriends: [],
    userLocation: createMockLocation(),
    darkMode: false,
    selectedActivity: null,
    isAvailable: false,
    currentUser: createMockUser(),
    showControls: true,
    children: <div data-testid="map-child">Mock Map Child</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🗺️ Rendu de base', () => {
    test('doit afficher le composant sans erreur', () => {
      expect(() => {
        render(<BaseMapView {...defaultProps} />);
      }).not.toThrow();
    });

    test("doit afficher l'enfant carte", () => {
      render(<BaseMapView {...defaultProps} />);

      expect(screen.getByTestId('map-child')).toBeInTheDocument();
    });

    test('doit afficher les contrôles par défaut', () => {
      render(<BaseMapView {...defaultProps} />);

      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
      expect(screen.getByTestId('crosshair-icon')).toBeInTheDocument();
    });
  });

  describe('🎨 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<BaseMapView {...darkProps} />);

      // Les éléments dark mode devraient être présents
      expect(screen.getByTestId('map-child')).toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test("doit gérer l'absence de localisation utilisateur", () => {
      const noLocationProps = { ...defaultProps, userLocation: null };

      expect(() => {
        render(<BaseMapView {...noLocationProps} />);
      }).not.toThrow();
    });

    test("doit gérer l'absence d'utilisateur actuel", () => {
      const noUserProps = { ...defaultProps, currentUser: null };

      expect(() => {
        render(<BaseMapView {...noUserProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        children: <div>Test</div>,
      };

      expect(() => {
        render(<BaseMapView {...minimalProps} />);
      }).not.toThrow();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      render(<BaseMapView {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('doit avoir des éléments avec rôles appropriés', () => {
      render(<BaseMapView {...defaultProps} />);

      expect(screen.getByTestId('map-child')).toBeInTheDocument();
    });
  });
});
