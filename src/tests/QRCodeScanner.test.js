// @ts-nocheck
// QRCodeScanner - PHASE 4 - Fonctionnalités Amis Avancées

import { render, screen } from '@testing-library/react';
import QRCodeScanner from '../components/friends/QRCodeScanner';

// === MOCKS ===

// Mock react-qr-code
jest.mock('react-qr-code', () => {
  return function MockQRCode({ value, size }) {
    return (
      <div data-testid="qr-code" data-value={value} data-size={size}>
        QR Code Mock
      </div>
    );
  };
});

// Mock dynamic import qr-scanner
jest.mock('qr-scanner', () => {
  return {
    default: class MockQRScanner {
      constructor(video, callback, options) {
        this.video = video;
        this.callback = callback;
        this.options = options;
      }

      start() {
        return Promise.resolve();
      }

      destroy() {
        // Mock destroy
      }
    },
  };
});

// === FIXTURES ===

const createMockUser = (overrides = {}) => ({
  uid: 'user123',
  displayName: 'Test User',
  photoURL: 'avatar.jpg',
  ...overrides,
});

// === TESTS ===

describe('QRCodeScanner - PHASE 4 - Fonctionnalités Amis Avancées', () => {
  const defaultProps = {
    currentUser: createMockUser(),
    onAddFriend: jest.fn(),
    loading: false,
    setLoading: jest.fn(),
    setError: jest.fn(),
    setSuccess: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('📱 Rendu de base', () => {
    test('doit afficher le QR Code utilisateur', () => {
      render(<QRCodeScanner {...defaultProps} />);

      expect(screen.getByText('Mon QR Code')).toBeInTheDocument();
      expect(
        screen.getByText("Faites scanner ce code pour qu'on vous ajoute")
      ).toBeInTheDocument();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    test('doit afficher le bouton scanner', () => {
      render(<QRCodeScanner {...defaultProps} />);

      expect(screen.getByText('Scanner un QR Code')).toBeInTheDocument();
    });

    test('doit générer des données QR correctes', () => {
      render(<QRCodeScanner {...defaultProps} />);

      const qrCode = screen.getByTestId('qr-code');
      const qrValue = qrCode.getAttribute('data-value');

      expect(qrValue).toContain('add_friend');
      expect(qrValue).toContain('user123');
      expect(qrValue).toContain('Test User');
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test("doit gérer l'absence de currentUser", () => {
      const noUserProps = { ...defaultProps, currentUser: null };

      expect(() => {
        render(<QRCodeScanner {...noUserProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {};

      expect(() => {
        render(<QRCodeScanner {...minimalProps} />);
      }).not.toThrow();
    });

    test('doit gérer un utilisateur sans displayName', () => {
      const userWithoutName = {
        ...defaultProps,
        currentUser: { uid: 'user123' },
      };
      render(<QRCodeScanner {...userWithoutName} />);

      expect(screen.getByText('Mon QR Code')).toBeInTheDocument();
    });
  });

  describe('🎯 Fonctionnalités QR', () => {
    test('doit afficher la taille QR correcte', () => {
      render(<QRCodeScanner {...defaultProps} />);

      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode.getAttribute('data-size')).toBe('150');
    });
  });
});
