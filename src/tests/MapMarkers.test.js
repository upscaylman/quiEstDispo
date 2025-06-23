// @ts-nocheck
// MapMarkers - PHASE 4 - Fonctionnalités Avancées (Composants Carte)

import { render } from '@testing-library/react';
import MapMarkers from '../components/map/MapMarkers';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      ...props
    }) => <div {...props}>{children}</div>,
    button: ({
      children,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      ...props
    }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">⏰</div>,
  MapPin: () => <div data-testid="map-pin-icon">📍</div>,
  X: () => <div data-testid="x-icon">❌</div>,
}));

// === TESTS ===

describe('MapMarkers - PHASE 4 - Fonctionnalités Avancées', () => {
  const allRequiredProps = {
    filteredFriends: [],
    userLocation: null,
    selectedFriend: null,
    darkMode: false,
    isAvailable: false,
    selectedActivity: null,
    // Toutes les fonctions requises
    latLngToPixel: jest.fn(() => ({ x: 50, y: 50 })),
    calculateDistance: jest.fn(() => 1.2),
    formatDistance: jest.fn(() => '1.2 km'),
    getActivityColor: jest.fn(() => '#3b82f6'),
    onFriendSelect: jest.fn(),
    onFriendDeselect: jest.fn(),
    onRetryGeolocation: jest.fn(),
    onRequestLocationPermission: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔧 Robustesse avec props complètes', () => {
    test('doit se rendre sans erreur avec toutes les props requises', () => {
      expect(() => {
        render(<MapMarkers {...allRequiredProps} />);
      }).not.toThrow();
    });
  });
});
