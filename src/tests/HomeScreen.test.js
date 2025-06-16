// @ts-nocheck
// Tests HomeScreen.js - PHASE 3 - UI Complexe (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import HomeScreen from '../components/screens/HomeScreen';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({ children, className, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  UserPlus: ({ size }) => (
    <div data-testid="userplus-icon" style={{ width: size, height: size }}>
      👥➕
    </div>
  ),
}));

// Mock AvailabilityButtons
jest.mock('../components/AvailabilityButtons', () => {
  return function MockAvailabilityButtons(props) {
    return (
      <div data-testid="availability-buttons">
        <button
          data-testid="start-availability"
          onClick={() =>
            props.onStartAvailability && props.onStartAvailability('coffee')
          }
        >
          {props.isAvailable
            ? `Arrêter ${props.currentActivity}`
            : 'Commencer une activité'}
        </button>
      </div>
    );
  };
});

// Mock MapView avec le bon chemin depuis src/tests/
jest.mock('../components/map', () => ({
  MapView: function MockMapView(props) {
    return (
      <div data-testid="map-view">
        <div>Map avec {props.friends?.length || 0} amis</div>
      </div>
    );
  },
}));

// Mock MapboxMapView avec le bon chemin depuis src/tests/
jest.mock('../components/map/MapboxMapView', () => {
  return function MockMapboxMapView(props) {
    return (
      <div data-testid="mapbox-view">
        <div>Mapbox avec {props.friends?.length || 0} amis</div>
      </div>
    );
  };
});

describe('HomeScreen - PHASE 3 - UI Complexe', () => {
  const defaultProps = {
    isAvailable: false,
    currentActivity: null,
    friends: [],
    useMapbox: false,
    darkMode: false,
    onSetAvailability: jest.fn(),
    onAddFriend: jest.fn(),
    onCreateTestFriendships: jest.fn(),
    onLoadMockData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  test('doit afficher les composants principaux', () => {
    render(<HomeScreen {...defaultProps} />);

    expect(screen.getByTestId('availability-buttons')).toBeInTheDocument();
    expect(screen.getByText('Élargis ton cercle')).toBeInTheDocument();
    expect(screen.getByText('Inviter des amis 🎉')).toBeInTheDocument();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  test('doit utiliser MapboxMapView quand useMapbox=true', () => {
    render(<HomeScreen {...defaultProps} useMapbox={true} />);

    expect(screen.getByTestId('mapbox-view')).toBeInTheDocument();
    expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
  });

  test('doit appeler onAddFriend quand on clique sur "Inviter des amis"', () => {
    const onAddFriend = jest.fn();
    render(<HomeScreen {...defaultProps} onAddFriend={onAddFriend} />);

    const inviteButton = screen.getByText('Inviter des amis 🎉');
    fireEvent.click(inviteButton);

    expect(onAddFriend).toHaveBeenCalledTimes(1);
  });
});
