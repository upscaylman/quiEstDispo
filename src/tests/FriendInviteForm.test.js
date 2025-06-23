// @ts-nocheck
// FriendInviteForm - PHASE 4 - Fonctionnalités Amis Avancées

import { fireEvent, render, screen } from '@testing-library/react';
import FriendInviteForm from '../components/friends/FriendInviteForm';

// === MOCKS ===

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Share2: () => <div data-testid="share-icon">🔗</div>,
}));

// Mock des APIs navigator
if (typeof navigator === 'undefined') {
  global.navigator = { share: jest.fn() };
} else {
  Object.defineProperty(navigator, 'share', {
    writable: true,
    value: jest.fn(),
  });
}

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(),
  },
});

// Mock window.open
global.open = jest.fn();

// === FIXTURES ===

const createMockUser = (overrides = {}) => ({
  uid: 'user123',
  displayName: 'Test User',
  name: 'Test User',
  ...overrides,
});

// === TESTS ===

describe('FriendInviteForm - PHASE 4 - Fonctionnalités Amis Avancées', () => {
  const defaultProps = {
    method: 'mail',
    currentUser: createMockUser(),
    loading: false,
    setLoading: jest.fn(),
    setError: jest.fn(),
    setSuccess: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('📧 Mode Email', () => {
    test('doit afficher le formulaire email', () => {
      render(<FriendInviteForm {...defaultProps} />);

      expect(
        screen.getByText('Adresse email de votre ami')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('ami@exemple.com')
      ).toBeInTheDocument();
      expect(screen.getByText("Message d'invitation")).toBeInTheDocument();
    });

    test('doit permettre de saisir un email', () => {
      render(<FriendInviteForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('ami@exemple.com');
      fireEvent.change(emailInput, { target: { value: 'test@exemple.com' } });

      expect(emailInput.value).toBe('test@exemple.com');
    });

    test("doit valider l'email vide", () => {
      render(<FriendInviteForm {...defaultProps} />);

      const sendButton = screen.getByText("Envoyer l'invitation par email");
      fireEvent.click(sendButton);

      expect(defaultProps.setError).toHaveBeenCalledWith(
        'Veuillez saisir une adresse email'
      );
    });

    test('doit valider le format email', () => {
      render(<FriendInviteForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('ami@exemple.com');
      fireEvent.change(emailInput, { target: { value: 'email-invalide' } });

      const sendButton = screen.getByText("Envoyer l'invitation par email");
      fireEvent.click(sendButton);

      expect(defaultProps.setError).toHaveBeenCalledWith(
        'Veuillez saisir une adresse email valide'
      );
    });
  });

  describe('🔗 Mode Partage', () => {
    const shareProps = { ...defaultProps, method: 'share' };

    test('doit afficher le bouton de partage', () => {
      render(<FriendInviteForm {...shareProps} />);

      expect(
        screen.getByText('Partager sur les réseaux sociaux')
      ).toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test("doit gérer l'absence de currentUser", () => {
      const noUserProps = { ...defaultProps, currentUser: null };

      expect(() => {
        render(<FriendInviteForm {...noUserProps} />);
      }).not.toThrow();
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = { method: 'mail' };

      expect(() => {
        render(<FriendInviteForm {...minimalProps} />);
      }).not.toThrow();
    });

    test('doit gérer un mode inconnu', () => {
      const unknownProps = { ...defaultProps, method: 'unknown' };

      expect(() => {
        render(<FriendInviteForm {...unknownProps} />);
      }).not.toThrow();
    });
  });

  describe('🔄 État de chargement', () => {
    test("doit afficher l'indicateur de chargement", () => {
      const loadingProps = { ...defaultProps, loading: true };
      render(<FriendInviteForm {...loadingProps} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
