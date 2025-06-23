// @ts-nocheck
// AddFriendModal - PHASE 4 - Fonctionnalités Amis Avancées

import { fireEvent, render, screen } from '@testing-library/react';
import AddFriendModal from '../components/friends/AddFriendModal';

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
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon">📧</div>,
  Phone: () => <div data-testid="phone-icon">📞</div>,
  QrCode: () => <div data-testid="qr-icon">📱</div>,
  Share2: () => <div data-testid="share-icon">🔗</div>,
  UserPlus: () => <div data-testid="user-plus-icon">👤</div>,
  X: () => <div data-testid="x-icon">❌</div>,
}));

// Mock des composants enfants
jest.mock('../components/friends/FriendInviteForm', () => {
  return function MockFriendInviteForm({ method }) {
    return <div data-testid={`invite-form-${method}`}>Form {method}</div>;
  };
});

jest.mock('../components/friends/PhoneSearch', () => {
  return function MockPhoneSearch() {
    return <div data-testid="phone-search">Phone Search</div>;
  };
});

jest.mock('../components/friends/QRCodeScanner', () => {
  return function MockQRCodeScanner() {
    return <div data-testid="qr-scanner">QR Scanner</div>;
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

describe('AddFriendModal - PHASE 4 - Fonctionnalités Amis Avancées', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onAddFriend: jest.fn(),
    currentUser: createMockUser(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🎭 Rendu et visibilité', () => {
    test('doit afficher le modal quand isOpen=true', () => {
      render(<AddFriendModal {...defaultProps} />);

      expect(screen.getByText('Ajouter un ami')).toBeInTheDocument();
      expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument();
    });

    test('ne doit pas afficher le modal quand isOpen=false', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(<AddFriendModal {...closedProps} />);

      expect(screen.queryByText('Ajouter un ami')).not.toBeInTheDocument();
    });
  });

  describe('🔄 Changement de méthodes', () => {
    test('doit afficher les 4 boutons de méthode', () => {
      render(<AddFriendModal {...defaultProps} />);

      expect(screen.getByText('Téléphone')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('QR Code')).toBeInTheDocument();
      expect(screen.getByText('Partager')).toBeInTheDocument();
    });

    test('doit afficher PhoneSearch par défaut', () => {
      render(<AddFriendModal {...defaultProps} />);

      expect(screen.getByTestId('phone-search')).toBeInTheDocument();
    });

    test('doit changer vers le composant Email', () => {
      render(<AddFriendModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Email'));
      expect(screen.getByTestId('invite-form-mail')).toBeInTheDocument();
    });

    test('doit changer vers le composant QR Code', () => {
      render(<AddFriendModal {...defaultProps} />);

      fireEvent.click(screen.getByText('QR Code'));
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    test('doit changer vers le composant Partager', () => {
      render(<AddFriendModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Partager'));
      expect(screen.getByTestId('invite-form-share')).toBeInTheDocument();
    });
  });

  describe('🔧 Interactions et callbacks', () => {
    test('doit appeler onClose quand on clique sur X', () => {
      render(<AddFriendModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('x-icon'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('doit appeler onClose quand on clique sur le fond', () => {
      render(<AddFriendModal {...defaultProps} />);

      const backdrop = screen
        .getByText('Ajouter un ami')
        .closest('[class*="bg-black"]');
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test("doit gérer l'absence de currentUser", () => {
      const noUserProps = { ...defaultProps, currentUser: null };

      expect(() => {
        render(<AddFriendModal {...noUserProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = { isOpen: true, onClose: jest.fn() };

      expect(() => {
        render(<AddFriendModal {...minimalProps} />);
      }).not.toThrow();
    });
  });
});
