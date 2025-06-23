// @ts-nocheck
// PhoneSearch - PHASE 4 - Fonctionnalités Amis Avancées

import { fireEvent, render, screen } from '@testing-library/react';
import PhoneSearch from '../components/friends/PhoneSearch';

// === MOCKS ===

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Contact: () => <div data-testid="contact-icon">📞</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
}));

// Mock des APIs navigator.contacts
if (typeof navigator === 'undefined') {
  global.navigator = { contacts: undefined };
} else {
  Object.defineProperty(navigator, 'contacts', {
    writable: true,
    value: undefined,
  });
}

// === TESTS ===

describe('PhoneSearch - PHASE 4 - Fonctionnalités Amis Avancées', () => {
  const defaultProps = {
    onAddFriend: jest.fn(),
    loading: false,
    setLoading: jest.fn(),
    setError: jest.fn(),
    setSuccess: jest.fn(),
    onClose: jest.fn(),
    darkMode: false,
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

  describe('📱 Rendu de base', () => {
    test('doit afficher le formulaire de recherche téléphone', () => {
      render(<PhoneSearch {...defaultProps} />);

      expect(screen.getByText('Numéro de téléphone')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Numéro de téléphone')
      ).toBeInTheDocument();
      expect(screen.getByText('Ajouter par téléphone')).toBeInTheDocument();
    });

    test("doit afficher les instructions d'utilisation", () => {
      render(<PhoneSearch {...defaultProps} />);

      expect(
        screen.getByText('Format accepté : +33612345678 ou 0612345678')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Cliquez sur l'icône contact pour choisir depuis vos contacts"
        )
      ).toBeInTheDocument();
    });

    test("doit afficher l'icône contact", () => {
      render(<PhoneSearch {...defaultProps} />);

      expect(screen.getByTestId('contact-icon')).toBeInTheDocument();
    });
  });

  describe('📝 Saisie téléphone', () => {
    test('doit permettre de saisir un numéro', () => {
      render(<PhoneSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Numéro de téléphone');
      fireEvent.change(input, { target: { value: '0612345678' } });

      expect(input.value).toBe('0612345678');
    });

    test('doit valider les champs vides', () => {
      render(<PhoneSearch {...defaultProps} />);

      const addButton = screen.getByText('Ajouter par téléphone');
      fireEvent.click(addButton);

      expect(defaultProps.setError).toHaveBeenCalledWith(
        'Veuillez saisir un numéro de téléphone'
      );
    });
  });

  describe('🎨 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<PhoneSearch {...darkProps} />);

      expect(screen.getByText('Numéro de téléphone')).toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test('doit gérer les props manquantes', () => {
      const minimalProps = {};

      expect(() => {
        render(<PhoneSearch {...minimalProps} />);
      }).not.toThrow();
    });

    test("doit gérer l'état de chargement", () => {
      const loadingProps = { ...defaultProps, loading: true };
      render(<PhoneSearch {...loadingProps} />);

      const input = screen.getByPlaceholderText('Numéro de téléphone');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons[1]; // Le deuxième bouton est celui d'ajout

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des éléments accessibles', () => {
      render(<PhoneSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button', {
        name: /ajouter par téléphone/i,
      });

      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });
  });
});
