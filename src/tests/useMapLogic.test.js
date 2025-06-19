// @ts-nocheck
// Tests useMapLogic.js - PHASE 2 - Geolocalisation (LOGIQUE CARTE)

import { act, renderHook } from '@testing-library/react';
import { useMapLogic } from '../components/map/useMapLogic';

// === MOCKS ===

// Mock des utilitaires de carte
jest.mock('../components/map/mapUtils', () => ({
  activities: [
    { id: 'coffee', label: 'Cafe', color: 'bg-yellow-500' },
    { id: 'sport', label: 'Sport', color: 'bg-green-500' },
  ],
  calculateDistance: jest.fn(() => 1.5),
  calculateMapBounds: jest.fn(() => ({ lat: 48.8566, lng: 2.3522 })),
  filterFriendsByActivity: jest.fn(friends => friends),
  formatDistance: jest.fn(distance => `${distance.toFixed(1)} km`),
  getActivityColor: jest.fn(() => '#f59e0b'),
  getActivityGradient: jest.fn(() => 'gradient-coffee'),
  sanitizeFriendsData: jest.fn(friends => friends),
}));

describe('useMapLogic - PHASE 2 - Logique de Carte', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  const mockUserLocation = { lat: 48.8566, lng: 2.3522 };
  const mockFriends = [
    { id: '1', name: 'Alice', lat: 48.8576, lng: 2.3532, activity: 'coffee' },
  ];

  describe('🗺️ Initialisation de base', () => {
    test('doit initialiser avec les valeurs par defaut', () => {
      const { result } = renderHook(() => useMapLogic({}));

      expect(result.current.selectedFriend).toBe(null);
      expect(result.current.zoom).toBe(14);
      expect(result.current.showFilters).toBe(false);
      expect(result.current.activityFilter).toBe('all');
    });

    test('doit utiliser la localisation utilisateur pour centrer', () => {
      const { result } = renderHook(() =>
        useMapLogic({ userLocation: mockUserLocation })
      );

      expect(result.current.mapCenter).toEqual(mockUserLocation);
    });
  });

  describe('🔍 Zoom et navigation', () => {
    test('doit permettre de zoomer/dezoomer', () => {
      const { result } = renderHook(() => useMapLogic({}));

      expect(result.current.zoom).toBe(14);

      act(() => {
        result.current.handleZoomIn();
      });
      expect(result.current.zoom).toBe(15);

      act(() => {
        result.current.handleZoomOut();
      });
      expect(result.current.zoom).toBe(14);
    });

    test('doit limiter le zoom entre 10 et 18', () => {
      const { result } = renderHook(() => useMapLogic({}));

      // Vérifier zoom initial
      expect(result.current.zoom).toBe(14);

      // Test limite superieure (tester plusieurs incréments)
      act(() => {
        result.current.handleZoomIn();
      });
      expect(result.current.zoom).toBe(15);

      act(() => {
        result.current.handleZoomIn();
      });
      act(() => {
        result.current.handleZoomIn();
      });
      act(() => {
        result.current.handleZoomIn();
      });
      expect(result.current.zoom).toBe(18);

      // Test limite inferieure (depuis 18, -8 pour atteindre 10)
      // Chaque handleZoomOut doit être dans son propre act()
      act(() => result.current.handleZoomOut()); // 17
      act(() => result.current.handleZoomOut()); // 16
      act(() => result.current.handleZoomOut()); // 15
      act(() => result.current.handleZoomOut()); // 14
      act(() => result.current.handleZoomOut()); // 13
      act(() => result.current.handleZoomOut()); // 12
      act(() => result.current.handleZoomOut()); // 11
      act(() => result.current.handleZoomOut()); // 10
      expect(result.current.zoom).toBe(10);
    });
  });

  describe('👥 Gestion des amis', () => {
    test('doit selectionner et deselectionner un ami', () => {
      const { result } = renderHook(() =>
        useMapLogic({ availableFriends: mockFriends })
      );

      act(() => {
        result.current.handleFriendSelect(mockFriends[0]);
      });

      expect(result.current.selectedFriend).toEqual(mockFriends[0]);

      act(() => {
        result.current.handleFriendDeselect();
      });

      expect(result.current.selectedFriend).toBe(null);
    });
  });

  describe('🎛️ Filtres', () => {
    test("doit basculer l'affichage des filtres", () => {
      const { result } = renderHook(() => useMapLogic({}));

      expect(result.current.showFilters).toBe(false);

      act(() => {
        result.current.handleToggleFilters();
      });

      expect(result.current.showFilters).toBe(true);
    });

    test("doit changer le filtre d'activite", () => {
      const { result } = renderHook(() => useMapLogic({}));

      act(() => {
        result.current.handleFilterChange('sport');
      });

      expect(result.current.activityFilter).toBe('sport');
    });
  });

  describe('📍 Conversion de coordonnees', () => {
    test('doit convertir lat/lng en coordonnees pixel', () => {
      const { result } = renderHook(() =>
        useMapLogic({ userLocation: mockUserLocation })
      );

      // S'assurer que mapCenter est bien défini
      expect(result.current.mapCenter).toBeDefined();
      expect(result.current.mapCenter.lat).toBeDefined();
      expect(result.current.mapCenter.lng).toBeDefined();

      const pixelCoords = result.current.latLngToPixel(48.8566, 2.3522);

      expect(pixelCoords).toHaveProperty('x');
      expect(pixelCoords).toHaveProperty('y');
      expect(typeof pixelCoords.x).toBe('number');
      expect(typeof pixelCoords.y).toBe('number');
    });

    test('doit gerer les coordonnees invalides', () => {
      const { result } = renderHook(() => useMapLogic({}));

      // Même sans userLocation, mapCenter doit avoir une valeur par défaut
      expect(result.current.mapCenter).toBeDefined();
      expect(result.current.mapCenter.lat).toBeDefined();
      expect(result.current.mapCenter.lng).toBeDefined();

      const pixelCoords = result.current.latLngToPixel(null, null);

      expect(pixelCoords).toEqual({ x: 50, y: 50 });
    });
  });

  describe('🌙 Mode sombre', () => {
    test('doit changer le style selon darkMode', () => {
      const { result, rerender } = renderHook(
        ({ darkMode }) => useMapLogic({ darkMode }),
        { initialProps: { darkMode: false } }
      );

      expect(result.current.mapStyle).toBe('default');

      rerender({ darkMode: true });

      expect(result.current.mapStyle).toBe('dark');
    });
  });

  describe('🏗️ API complete', () => {
    test('doit exposer toutes les proprietes necessaires', () => {
      const { result } = renderHook(() => useMapLogic({}));

      const expectedProperties = [
        'selectedFriend',
        'mapCenter',
        'zoom',
        'showFilters',
        'activityFilter',
        'sanitizedFriends',
        'filteredFriends',
        'latLngToPixel',
        'handleZoomIn',
        'handleZoomOut',
        'handleFriendSelect',
        'activities',
      ];

      expectedProperties.forEach(prop => {
        expect(result.current).toHaveProperty(prop);
      });
    });
  });
});
