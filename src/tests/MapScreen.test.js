// @ts-nocheck
// MapScreen - PHASE 4 - Fonctionnalités Avancées (Composants Carte)

import { render, screen } from '@testing-library/react';
import MapScreen from '../components/screens/MapScreen';

// === MOCKS ===

// Mock framer-motion pour éviter les erreurs d'animation
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
  MapPin: () => <div data-testid="map-pin-icon">📍</div>,
  MapPinOff: () => <div data-testid="map-pin-off-icon">📍❌</div>,
  Crosshair: () => <div data-testid="crosshair-icon">🎯</div>,
  RefreshCw: () => <div data-testid="refresh-icon">🔄</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
}));

// Mock des composants carte
jest.mock('../components/map', () => ({
  MapView: function MockMapView(props) {
    return (
      <div data-testid="map-view" className="mock-map-view">
        <div>Mock MapView</div>
        <div>Friends: {props.availableFriends?.length || 0}</div>
        <div>Location: {props.userLocation ? 'Present' : 'None'}</div>
        <div>Activity: {props.selectedActivity || 'None'}</div>
        <div>Controls: {props.showControls ? 'Shown' : 'Hidden'}</div>
        {props.onInviteFriends && (
          <button onClick={() => props.onInviteFriends(['friend1'])}>
            Invite Friends
          </button>
        )}
        {props.onRetryGeolocation && (
          <button onClick={props.onRetryGeolocation}>Retry GPS</button>
        )}
      </div>
    );
  },
}));

jest.mock('../components/map/MapboxMapView', () => {
  return function MockMapboxMapView(props) {
    return (
      <div data-testid="mapbox-map-view" className="mock-mapbox-map-view">
        <div>Mock MapboxMapView</div>
        <div>Friends: {props.availableFriends?.length || 0}</div>
        <div>Location: {props.userLocation ? 'Present' : 'None'}</div>
        <div>Activity: {props.selectedActivity || 'None'}</div>
        <div>Controls: {props.showControls ? 'Shown' : 'Hidden'}</div>
        {props.onInviteFriends && (
          <button onClick={() => props.onInviteFriends(['friend1'])}>
            Invite Friends Mapbox
          </button>
        )}
        {props.onRetryGeolocation && (
          <button onClick={props.onRetryGeolocation}>Retry GPS Mapbox</button>
        )}
      </div>
    );
  };
});

// Mock console pour éviter les logs pendant les tests
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

// === TESTS ===

describe('MapScreen - PHASE 4 - Fonctionnalités Avancées', () => {
  const defaultProps = {
    friends: [],
    availableFriends: [],
    location: null,
    locationError: null,
    useMapbox: false,
    darkMode: false,
    isAvailable: false,
    currentActivity: null,
    onInviteFriends: jest.fn(),
    onRetryGeolocation: jest.fn(),
    onRequestLocationPermission: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🗺️ Rendu de base', () => {
    test('doit afficher le composant sans erreur', () => {
      expect(() => {
        render(<MapScreen {...defaultProps} />);
      }).not.toThrow();
    });

    test('doit afficher un message quand pas de localisation', () => {
      render(<MapScreen {...defaultProps} />);

      expect(screen.getByText(/Localisation en cours/i)).toBeInTheDocument();
    });

    test("doit afficher le bouton d'activation avec erreur", () => {
      const errorProps = {
        ...defaultProps,
        locationError: 'Permission denied',
      };
      render(<MapScreen {...errorProps} />);

      expect(screen.getByText(/Activer la localisation/i)).toBeInTheDocument();
    });
  });

  describe('🌐 Choix du composant carte', () => {
    const locationProps = {
      ...defaultProps,
      location: createMockLocation(),
    };

    test('doit utiliser MapView par défaut', () => {
      render(<MapScreen {...locationProps} />);

      expect(screen.getByTestId('map-view')).toBeInTheDocument();
      expect(screen.queryByTestId('mapbox-map-view')).not.toBeInTheDocument();
    });

    test('doit utiliser MapboxMapView quand useMapbox est true', () => {
      const mapboxProps = { ...locationProps, useMapbox: true };
      render(<MapScreen {...mapboxProps} />);

      expect(screen.getByTestId('mapbox-map-view')).toBeInTheDocument();
      expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        location: null,
        useMapbox: false,
        darkMode: false,
        isAvailable: false,
      };

      expect(() => {
        render(<MapScreen {...minimalProps} />);
      }).not.toThrow();
    });
  });
});
