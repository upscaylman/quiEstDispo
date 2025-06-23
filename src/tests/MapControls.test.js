// @ts-nocheck
// MapControls - PHASE 4 - Fonctionnalités Avancées (Composants Carte)

import { fireEvent, render, screen } from '@testing-library/react';
import MapControls from '../components/map/MapControls';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileTap, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">➕</div>,
  Minus: () => <div data-testid="minus-icon">➖</div>,
  Crosshair: () => <div data-testid="crosshair-icon">🎯</div>,
  Filter: () => <div data-testid="filter-icon">🔍</div>,
  X: () => <div data-testid="x-icon">❌</div>,
}));

// === FIXTURES ===

const createMockLocation = (overrides = {}) => ({
  lat: 48.8566,
  lng: 2.3522,
  ...overrides,
});

// === TESTS ===

describe('MapControls - PHASE 4 - Fonctionnalités Avancées', () => {
  const defaultProps = {
    showControls: true,
    userLocation: createMockLocation(),
    darkMode: false,
    zoom: 14,
    showFilters: false,
    activityFilter: 'all',
    isFollowingUser: false,
    activities: [
      { id: 'coffee', name: 'Coffee', color: '#f59e0b' },
      { id: 'lunch', name: 'Lunch', color: '#10b981' },
    ],
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onCenterUser: jest.fn(),
    onToggleFilters: jest.fn(),
    onFilterChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🗺️ Rendu de base', () => {
    test('doit afficher le composant sans erreur', () => {
      expect(() => {
        render(<MapControls {...defaultProps} />);
      }).not.toThrow();
    });

    test('doit afficher les contrôles quand showControls est true', () => {
      render(<MapControls {...defaultProps} />);

      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('crosshair-icon')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    test('ne doit rien afficher quand showControls est false', () => {
      const hiddenProps = { ...defaultProps, showControls: false };
      render(<MapControls {...hiddenProps} />);

      expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('minus-icon')).not.toBeInTheDocument();
    });
  });

  describe("🔍 Boutons d'action", () => {
    test('doit appeler onZoomIn quand on clique sur le bouton plus', () => {
      render(<MapControls {...defaultProps} />);

      const zoomInButton = screen.getByTestId('plus-icon').closest('button');
      fireEvent.click(zoomInButton);

      expect(defaultProps.onZoomIn).toHaveBeenCalled();
    });

    test('doit appeler onZoomOut quand on clique sur le bouton moins', () => {
      render(<MapControls {...defaultProps} />);

      const zoomOutButton = screen.getByTestId('minus-icon').closest('button');
      fireEvent.click(zoomOutButton);

      expect(defaultProps.onZoomOut).toHaveBeenCalled();
    });

    test('doit appeler onCenterUser quand on clique sur le bouton centrer', () => {
      render(<MapControls {...defaultProps} />);

      const centerButton = screen
        .getByTestId('crosshair-icon')
        .closest('button');
      fireEvent.click(centerButton);

      expect(defaultProps.onCenterUser).toHaveBeenCalled();
    });

    test('doit appeler onToggleFilters quand on clique sur le bouton filtres', () => {
      render(<MapControls {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      fireEvent.click(filterButton);

      expect(defaultProps.onToggleFilters).toHaveBeenCalled();
    });
  });

  describe('🎨 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<MapControls {...darkProps} />);

      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test('doit gérer les callbacks manquants', () => {
      const noCallbackProps = {
        ...defaultProps,
        onZoomIn: undefined,
        onZoomOut: undefined,
        onCenterUser: undefined,
        onToggleFilters: undefined,
      };

      expect(() => {
        render(<MapControls {...noCallbackProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        showControls: true,
      };

      expect(() => {
        render(<MapControls {...minimalProps} />);
      }).not.toThrow();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      render(<MapControls {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
