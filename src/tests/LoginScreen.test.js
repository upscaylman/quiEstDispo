// @ts-nocheck
// Tests LoginScreen.js - PHASE 3 - UI Complexe (Priorité MOYENNE)

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginScreen from '../components/LoginScreen';

// Import du mock pour pouvoir le référencer dans les tests
import mockGoogleSignInService from '../services/googleSignInService';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({ children, className, whileHover, whileTap, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: ({ className, size }) => (
    <div
      className={className}
      data-testid="clock-icon"
      style={{ width: size, height: size }}
    >
      ⏰
    </div>
  ),
  MapPin: ({ className, size }) => (
    <div
      className={className}
      data-testid="mappin-icon"
      style={{ width: size, height: size }}
    >
      📍
    </div>
  ),
  Smartphone: ({ className, size }) => (
    <div
      className={className}
      data-testid="smartphone-icon"
      style={{ width: size, height: size }}
    >
      📱
    </div>
  ),
  Users: ({ className, size }) => (
    <div
      className={className}
      data-testid="users-icon"
      style={{ width: size, height: size }}
    >
      👥
    </div>
  ),
}));

// Mock useAuth hook
const mockUseAuth = {
  signInWithGoogle: jest.fn(),
  signInWithFacebook: jest.fn(),
  checkGoogleRedirectResult: jest.fn(),
  checkFacebookRedirectResult: jest.fn(),
  signInWithPhone: jest.fn(),
  confirmPhoneCode: jest.fn(),
  createRecaptchaVerifier: jest.fn(),
  testPhoneAuth: jest.fn(),
  loading: false,
  setLoading: jest.fn(),
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock GoogleSignInService
jest.mock('../services/googleSignInService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    signInWithFirebase: jest.fn(),
  },
}));

// Mock GoogleSignInButton
jest.mock('../components/GoogleSignInButton', () => {
  return function MockGoogleSignInButton({ onSignIn, ...props }) {
    return (
      <button
        data-testid="google-signin-button"
        onClick={() => onSignIn && onSignIn({ credential: 'mock-credential' })}
        {...props}
      >
        Mock Google Sign In
      </button>
    );
  };
});

// Mock window pour éviter les erreurs JSDOM
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000' },
  writable: true,
});

describe('LoginScreen - PHASE 3 - UI Complexe', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Réinitialiser les mocks
    mockUseAuth.loading = false;
    mockUseAuth.signInWithGoogle.mockResolvedValue({
      user: { uid: 'test-uid' },
    });
    mockUseAuth.signInWithFacebook.mockResolvedValue({
      user: { uid: 'test-uid' },
    });
    mockUseAuth.signInWithPhone.mockResolvedValue({
      verificationId: 'test-verification-id',
    });
    mockUseAuth.confirmPhoneCode.mockResolvedValue({
      user: { uid: 'test-uid' },
    });
    mockUseAuth.createRecaptchaVerifier.mockReturnValue({
      verify: jest.fn(),
      clear: jest.fn(),
    });
    mockUseAuth.testPhoneAuth.mockResolvedValue({ user: { uid: 'test-uid' } });
    mockUseAuth.checkGoogleRedirectResult.mockResolvedValue(null);
    mockUseAuth.checkFacebookRedirectResult.mockResolvedValue(null);

    mockGoogleSignInService.initialize.mockResolvedValue(true);
    mockGoogleSignInService.signInWithFirebase.mockResolvedValue({
      user: { uid: 'test-uid' },
    });

    // Mock console pour éviter les logs de test
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('📱 Interface utilisateur basique', () => {
    test('doit afficher les éléments principaux', () => {
      render(<LoginScreen />);

      // Titre principal
      expect(screen.getByText('Qui est dispo ?')).toBeInTheDocument();
      expect(screen.getByText('Connexion')).toBeInTheDocument();

      // Champs de saisie
      expect(
        screen.getByPlaceholderText('+33 6 12 34 56 78')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /envoyer le code sms/i })
      ).toBeInTheDocument();

      // Onglets de connexion
      expect(screen.getByText('Téléphone')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    test('doit permettre la saisie du numéro de téléphone', () => {
      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '+33612345678' } });

      // Le composant formate automatiquement le numéro
      expect(phoneInput.value).toBe('+336 12 34 56 78');
    });

    test('doit afficher le conteneur reCAPTCHA', () => {
      render(<LoginScreen />);

      expect(
        document.getElementById('recaptcha-container')
      ).toBeInTheDocument();
    });
  });

  describe('🔄 Basculement entre interfaces', () => {
    test('doit basculer vers Google', () => {
      render(<LoginScreen />);

      const googleTab = screen.getByText('Google');
      fireEvent.click(googleTab);

      // Doit afficher l'interface Google (bouton avec icône Google)
      expect(screen.getByText('Continuer avec Google')).toBeInTheDocument();
    });

    test("doit revenir à l'interface téléphone", () => {
      render(<LoginScreen />);

      // Basculer vers Google puis revenir
      fireEvent.click(screen.getByText('Google'));
      fireEvent.click(screen.getByText('Téléphone'));

      // Doit afficher l'interface téléphone
      expect(
        screen.getByPlaceholderText('+33 6 12 34 56 78')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /envoyer le code sms/i })
      ).toBeInTheDocument();
    });
  });

  describe('🚨 Gestion des erreurs', () => {
    test("doit afficher les erreurs d'authentification téléphone", async () => {
      // Mock d'une erreur d'authentification
      mockUseAuth.signInWithPhone.mockRejectedValue(
        new Error('auth/invalid-phone-number')
      );

      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      const submitButton = screen.getByRole('button', {
        name: /envoyer le code sms/i,
      });

      fireEvent.change(phoneInput, { target: { value: '+336 12 34 56 78' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Le composant affiche le message d'erreur brut
        expect(
          screen.getByText('auth/invalid-phone-number')
        ).toBeInTheDocument();
      });
    });

    test('doit afficher les erreurs de vérification de code', async () => {
      // Mock réussite du SMS puis erreur de vérification
      mockUseAuth.signInWithPhone.mockResolvedValue({
        verificationId: 'test-id',
      });
      mockUseAuth.confirmPhoneCode.mockRejectedValue(
        new Error('auth/invalid-verification-code')
      );

      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '+33612345678' } });
      fireEvent.click(
        screen.getByRole('button', { name: /envoyer le code sms/i })
      );

      await waitFor(() => {
        // Doit passer à l'interface de vérification de code
        expect(screen.getByText('Code de vérification')).toBeInTheDocument();
      });

      const codeInput = screen.getByPlaceholderText('123456');
      const verifyButton = screen.getByText('Vérifier le code');

      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(
          screen.getByText('auth/invalid-verification-code')
        ).toBeInTheDocument();
      });
    });
  });

  describe('⏳ États de chargement', () => {
    test("doit afficher l'état de chargement pendant l'envoi SMS", async () => {
      // Mock loading state
      mockUseAuth.loading = true;

      render(<LoginScreen />);

      // Saisir un numéro pour activer le bouton
      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '+33612345678' } });

      // Trouver le bouton SMS
      const submitButton = screen.getByRole('button', {
        name: /envoyer le code sms/i,
      });

      // Le bouton doit être désactivé quand loading=true
      expect(submitButton).toBeDisabled();
      expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('doit désactiver le bouton SMS quand pas de numéro', () => {
      render(<LoginScreen />);

      // Par défaut le bouton doit être désactivé (pas de numéro)
      const submitButton = screen.getByRole('button', {
        name: /envoyer le code sms/i,
      });
      expect(submitButton).toBeDisabled();
    });

    test('doit désactiver le bouton test SMS pendant le chargement en développement', () => {
      // Mock environnement développement
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock loading state
      mockUseAuth.loading = true;

      render(<LoginScreen />);

      // Le bouton de test doit être désactivé par défaut aussi
      const testButton = screen.getByText(/🧪 Test SMS \(\+33612345678\)/);
      expect(testButton).toBeDisabled();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('🔧 Initialisation Google Sign-In', () => {
    test('doit initialiser Google Sign-In au montage', async () => {
      process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id';

      render(<LoginScreen />);

      await waitFor(() => {
        expect(mockGoogleSignInService.initialize).toHaveBeenCalledWith(
          'test-client-id',
          expect.objectContaining({
            context: 'signin',
            ux_mode: 'popup',
            auto_prompt: false,
          })
        );
      });
    });

    test("doit gérer l'absence de Client ID Google", () => {
      delete process.env.REACT_APP_GOOGLE_CLIENT_ID;

      render(<LoginScreen />);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Client ID Google non configuré')
      );
    });
  });

  describe('📱 Validation de formulaire', () => {
    test('doit désactiver le bouton si le numéro est vide', () => {
      render(<LoginScreen />);

      const submitButton = screen.getByText('Envoyer le code SMS');
      expect(submitButton).toBeDisabled();
    });

    test('doit activer le bouton avec un numéro valide', () => {
      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });

      const submitButton = screen.getByText('Envoyer le code SMS');
      expect(submitButton).not.toBeDisabled();
    });

    test('doit limiter la saisie du code à 6 caractères', () => {
      const mockConfirmationResult = { confirm: jest.fn() };
      mockUseAuth.signInWithPhone.mockResolvedValue(mockConfirmationResult);

      render(<LoginScreen />);

      // Aller à l'étape de vérification
      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      return waitFor(() => {
        const codeInput = screen.getByPlaceholderText('123456');
        expect(codeInput).toHaveAttribute('maxLength', '6');
      });
    });
  });
});
