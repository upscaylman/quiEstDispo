// @ts-nocheck
// MapboxMapView - PHASE 4 - Fonctionnalités Avancées (Composants Carte)

import { render } from '@testing-library/react';
import MapboxMapView from '../components/map/MapboxMapView';

// === MOCKS ===

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    flyTo: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    getCanvas: jest.fn(() => ({
      style: { cursor: 'default' },
    })),
    loaded: jest.fn(() => true),
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    getElement: jest.fn(() => ({})),
  })),
  accessToken: '',
}));

// Mock CSS import
jest.mock('mapbox-gl/dist/mapbox-gl.css', () => {});

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
  Crosshair: () => <div data-testid="crosshair-icon">🎯</div>,
  Filter: () => <div data-testid="filter-icon">🔍</div>,
  X: () => <div data-testid="x-icon">❌</div>,
  Coffee: () => <div data-testid="coffee-icon">☕</div>,
  UtensilsCrossed: () => <div data-testid="utensils-icon">🍽️</div>,
  Wine: () => <div data-testid="wine-icon">🍷</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  Music: () => <div data-testid="music-icon">🎵</div>,
  Film: () => <div data-testid="film-icon">🎬</div>,
  MapPin: () => <div data-testid="map-pin-icon">📍</div>,
  Clock: () => <div data-testid="clock-icon">⏰</div>,
}));

// === FIXTURES ===

const createMockLocation = (overrides = {}) => ({
  lat: 48.8566,
  lng: 2.3522,
  ...overrides,
});

// === TESTS ===

describe('MapboxMapView - PHASE 4 - Fonctionnalités Avancées', () => {
  const defaultProps = {
    availableFriends: [],
    userLocation: createMockLocation(),
    darkMode: false,
    selectedActivity: null,
    isAvailable: false,
    showControls: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';
  });

  describe('🔧 Cas limite et robustesse', () => {
    test("doit gérer l'absence de token Mapbox", () => {
      delete process.env.REACT_APP_MAPBOX_TOKEN;

      expect(() => {
        render(<MapboxMapView {...defaultProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {};

      expect(() => {
        render(<MapboxMapView {...minimalProps} />);
      }).not.toThrow();
    });

    test('doit afficher le composant avec token', () => {
      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      expect(() => {
        render(<MapboxMapView {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
