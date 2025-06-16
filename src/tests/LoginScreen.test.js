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

  describe('🎨 Rendering et Structure', () => {
    test('doit afficher le titre et la description', () => {
      render(<LoginScreen />);

      expect(screen.getByText('Qui est dispo ?')).toBeInTheDocument();
      expect(
        screen.getByText('Organisez vos sorties spontanées entre amis')
      ).toBeInTheDocument();
    });

    test('doit afficher les 3 features avec leurs icônes', () => {
      render(<LoginScreen />);

      // Vérifier les features
      expect(screen.getByText('Géolocalisation')).toBeInTheDocument();
      expect(
        screen.getByText('Partage ta position avec tes amis')
      ).toBeInTheDocument();

      expect(screen.getByText('Amis proches')).toBeInTheDocument();
      expect(
        screen.getByText('Vois qui est disponible autour de toi')
      ).toBeInTheDocument();

      expect(screen.getByText('Temps réel')).toBeInTheDocument();
      expect(
        screen.getByText('Notifications instantanées')
      ).toBeInTheDocument();

      // Vérifier les icônes
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    test("doit afficher les onglets de méthode d'authentification", () => {
      render(<LoginScreen />);

      expect(screen.getByText('Téléphone')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    test("doit afficher l'interface téléphone par défaut", () => {
      render(<LoginScreen />);

      expect(screen.getByLabelText('Numéro de téléphone')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('+33 6 12 34 56 78')
      ).toBeInTheDocument();
      expect(screen.getByText('Envoyer le code SMS')).toBeInTheDocument();
    });
  });

  describe('📱 Authentification par téléphone', () => {
    test('doit formater automatiquement le numéro de téléphone', async () => {
      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');

      // Test avec numéro commençant par 0
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      expect(phoneInput.value).toBe('+33 6 12 34 56 78');

      // Test avec numéro sans préfixe
      fireEvent.change(phoneInput, { target: { value: '612345678' } });
      expect(phoneInput.value).toBe('+33 6 12 34 56 78');
    });

    test('doit envoyer SMS quand le formulaire est soumis', async () => {
      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      const submitButton = screen.getByText('Envoyer le code SMS');

      // Saisir un numéro valide
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });

      // Cliquer sur envoyer
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.createRecaptchaVerifier).toHaveBeenCalledWith(
          'recaptcha-container',
          expect.any(Object)
        );
        expect(mockUseAuth.signInWithPhone).toHaveBeenCalledWith(
          '+33 6 12 34 56 78',
          expect.any(Object)
        );
      });
    });

    test("doit afficher l'interface de vérification après envoi SMS", async () => {
      mockUseAuth.signInWithPhone.mockResolvedValue({
        verificationId: 'test-id',
        confirm: jest.fn(),
      });

      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      const submitButton = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText('Code de vérification')
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
        expect(screen.getByText('Vérifier le code')).toBeInTheDocument();
      });
    });

    test('doit confirmer le code de vérification', async () => {
      const mockConfirmationResult = {
        confirm: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
      };
      mockUseAuth.signInWithPhone.mockResolvedValue(mockConfirmationResult);

      render(<LoginScreen />);

      // Envoyer SMS d'abord
      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      await waitFor(() => {
        expect(
          screen.getByLabelText('Code de vérification')
        ).toBeInTheDocument();
      });

      // Saisir et confirmer le code
      const codeInput = screen.getByPlaceholderText('123456');
      const verifyButton = screen.getByText('Vérifier le code');

      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockConfirmationResult.confirm).toHaveBeenCalledWith('123456');
      });
    });

    test("doit permettre de recommencer l'authentification", async () => {
      const mockConfirmationResult = { confirm: jest.fn() };
      mockUseAuth.signInWithPhone.mockResolvedValue(mockConfirmationResult);

      render(<LoginScreen />);

      // Aller à l'étape de vérification
      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      await waitFor(() => {
        expect(screen.getByText('Recommencer')).toBeInTheDocument();
      });

      // Cliquer sur recommencer
      fireEvent.click(screen.getByText('Recommencer'));

      // Doit revenir à l'interface d'envoi SMS
      expect(screen.getByText('Envoyer le code SMS')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('+33 6 12 34 56 78')
      ).toBeInTheDocument();
    });
  });

  describe('🧪 Mode développement - Tests SMS', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('doit afficher le bouton de test SMS en mode développement', () => {
      render(<LoginScreen />);

      expect(screen.getByText(/🧪 Test SMS/)).toBeInTheDocument();
      expect(screen.getByText(/Contourner erreur 500/)).toBeInTheDocument();
    });

    test('doit appeler testPhoneAuth quand le bouton test est cliqué', async () => {
      render(<LoginScreen />);

      const testButton = screen.getByText(/🧪 Test SMS/);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockUseAuth.testPhoneAuth).toHaveBeenCalled();
      });
    });

    test('doit afficher les informations de test', () => {
      render(<LoginScreen />);

      expect(screen.getByText(/Numéro : \+33612345678/)).toBeInTheDocument();
      expect(screen.getByText(/Code : 123456/)).toBeInTheDocument();
    });
  });

  describe("🔄 Basculement entre méthodes d'authentification", () => {
    test("doit basculer vers l'interface Google", () => {
      render(<LoginScreen />);

      const googleTab = screen.getByText('Google');
      fireEvent.click(googleTab);

      // Doit avoir la classe active
      expect(googleTab.closest('button')).toHaveClass(
        'bg-white',
        'text-gray-900'
      );

      // Doit afficher l'interface Google
      expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
    });

    test("doit revenir à l'interface téléphone", () => {
      render(<LoginScreen />);

      // Aller sur Google d'abord
      fireEvent.click(screen.getByText('Google'));

      // Revenir sur téléphone
      const phoneTab = screen.getByText('Téléphone');
      fireEvent.click(phoneTab);

      expect(phoneTab.closest('button')).toHaveClass(
        'bg-white',
        'text-gray-900'
      );
      expect(
        screen.getByPlaceholderText('+33 6 12 34 56 78')
      ).toBeInTheDocument();
    });
  });

  describe('🚨 Gestion des erreurs', () => {
    test("doit afficher les erreurs d'authentification téléphone", async () => {
      mockUseAuth.signInWithPhone.mockRejectedValue(
        new Error('Numéro invalide')
      );

      render(<LoginScreen />);

      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      const submitButton = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Numéro invalide')).toBeInTheDocument();
      });
    });

    test('doit afficher les erreurs de vérification de code', async () => {
      const mockConfirmationResult = {
        confirm: jest.fn().mockRejectedValue(new Error('Code invalide')),
      };
      mockUseAuth.signInWithPhone.mockResolvedValue(mockConfirmationResult);

      render(<LoginScreen />);

      // Aller à l'étape de vérification
      const phoneInput = screen.getByPlaceholderText('+33 6 12 34 56 78');
      fireEvent.change(phoneInput, { target: { value: '0612345678' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      await waitFor(() => {
        expect(
          screen.getByLabelText('Code de vérification')
        ).toBeInTheDocument();
      });

      // Saisir code invalide
      const codeInput = screen.getByPlaceholderText('123456');
      const verifyButton = screen.getByText('Vérifier le code');

      fireEvent.change(codeInput, { target: { value: '000000' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Code invalide')).toBeInTheDocument();
      });
    });

    test('doit gérer les erreurs de test SMS', async () => {
      process.env.NODE_ENV = 'development';
      mockUseAuth.testPhoneAuth.mockRejectedValue(new Error('Erreur test'));

      render(<LoginScreen />);

      const testButton = screen.getByText(/🧪 Test SMS/);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('Erreur test')).toBeInTheDocument();
      });
    });
  });

  describe('⏳ États de chargement', () => {
    test("doit afficher l'état de chargement pendant l'envoi SMS", () => {
      mockUseAuth.loading = true;

      render(<LoginScreen />);

      const submitButton = screen.getByText('Envoyer le code SMS');
      expect(submitButton).toBeDisabled();

      // Doit afficher le spinner
      expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('doit désactiver le bouton SMS pendant le chargement', () => {
      mockUseAuth.loading = true;

      render(<LoginScreen />);

      expect(screen.getByText('Envoyer le code SMS')).toBeDisabled();
    });

    test('doit désactiver le bouton test SMS pendant le chargement en développement', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      mockUseAuth.loading = true;

      render(<LoginScreen />);

      const testButton = screen.getByText(/🧪 Test SMS/);
      expect(testButton).toBeDisabled();

      process.env.NODE_ENV = originalNodeEnv;
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
