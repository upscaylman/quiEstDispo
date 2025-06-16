// @ts-nocheck
/* eslint-disable no-console */
import { render, screen, waitFor } from '@testing-library/react';
import GoogleSignInButton from '../components/GoogleSignInButton';

// Mock window.google
const mockGoogleAccounts = {
  id: {
    renderButton: jest.fn(),
  },
};

describe('GoogleSignInButton - Composant UI simple', () => {
  let originalGoogle;

  beforeEach(() => {
    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // Reset mocks
    mockGoogleAccounts.id.renderButton.mockClear();

    // Mock window.google
    originalGoogle = window.google;
    window.google = {
      accounts: mockGoogleAccounts,
    };

    // Mock atob pour décoder JWT
    global.atob = jest.fn().mockImplementation(str => {
      // Simuler le décodage d'un payload JWT
      return JSON.stringify({
        sub: '123456789',
        name: 'John Doe',
        email: 'john.doe@example.com',
        picture: 'https://example.com/avatar.jpg',
      });
    });
  });

  afterEach(() => {
    window.google = originalGoogle;
    delete window.handleGoogleSignIn;
  });

  describe('Rendu de base', () => {
    test('doit afficher le conteneur du bouton Google', () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      const container = document.querySelector('.google-signin-button');
      expect(container).toBeInTheDocument();
    });

    test("doit afficher l'état de chargement quand disabled", () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} disabled={true} />);

      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('doit appliquer les classes personnalisées', () => {
      const onSignIn = jest.fn();
      render(
        <GoogleSignInButton onSignIn={onSignIn} className="custom-class" />
      );

      const container = document.querySelector('.google-signin-button');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Initialisation Google API', () => {
    test('doit appeler renderButton avec les paramètres par défaut', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalledWith(
          expect.any(Element),
          expect.objectContaining({
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '300',
            locale: 'fr',
          })
        );
      });
    });

    test('doit appeler renderButton avec des paramètres personnalisés', async () => {
      const onSignIn = jest.fn();
      render(
        <GoogleSignInButton
          onSignIn={onSignIn}
          type="icon"
          theme="filled_blue"
          size="medium"
          text="continue_with"
          shape="pill"
          width="250"
          locale="en"
        />
      );

      await waitFor(() => {
        expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalledWith(
          expect.any(Element),
          expect.objectContaining({
            type: 'icon',
            theme: 'filled_blue',
            size: 'medium',
            text: 'continue_with',
            shape: 'pill',
            width: '250',
            locale: 'en',
          })
        );
      });
    });

    test('ne doit pas appeler renderButton quand disabled', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} disabled={true} />);

      // Attendre un peu pour s'assurer que renderButton n'est pas appelé
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockGoogleAccounts.id.renderButton).not.toHaveBeenCalled();
    });
  });

  describe('Gestion des callbacks Google', () => {
    test('doit créer un callback global handleGoogleSignIn', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(window.handleGoogleSignIn).toBeDefined();
        expect(typeof window.handleGoogleSignIn).toBe('function');
      });
    });

    test('doit traiter une réponse de credential valide', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(window.handleGoogleSignIn).toBeDefined();
      });

      // Simuler une réponse Google
      const mockCredentialResponse = {
        credential: 'header.payload.signature',
        select_by: 'user',
      };

      window.handleGoogleSignIn(mockCredentialResponse);

      expect(onSignIn).toHaveBeenCalledWith({
        credential: 'header.payload.signature',
        user: {
          sub: '123456789',
          name: 'John Doe',
          email: 'john.doe@example.com',
          picture: 'https://example.com/avatar.jpg',
        },
        select_by: 'user',
      });
    });

    test('doit gérer une erreur de décodage JWT', async () => {
      // Mock atob pour lancer une erreur
      global.atob = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(window.handleGoogleSignIn).toBeDefined();
      });

      const mockCredentialResponse = {
        credential: 'invalid.jwt.token',
      };

      window.handleGoogleSignIn(mockCredentialResponse);

      expect(onSignIn).toHaveBeenCalledWith({
        error: 'Erreur lors du décodage des informations',
      });
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error decoding credential'),
        expect.any(Error)
      );
    });

    test('doit nettoyer le callback global lors du démontage', () => {
      const onSignIn = jest.fn();
      const { unmount } = render(<GoogleSignInButton onSignIn={onSignIn} />);

      // Le callback devrait être défini
      expect(window.handleGoogleSignIn).toBeDefined();

      unmount();

      // Le callback devrait être supprimé
      expect(window.handleGoogleSignIn).toBeUndefined();
    });
  });

  describe("Gestion des erreurs d'initialisation", () => {
    test("doit gérer l'absence de Google API", async () => {
      // Supprimer temporairement l'API Google
      window.google = undefined;

      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      // Attendre et vérifier qu'aucune erreur fatale ne se produit
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockGoogleAccounts.id.renderButton).not.toHaveBeenCalled();
    });

    test("doit gérer les erreurs lors de l'initialisation", async () => {
      // Mock renderButton pour lancer une erreur
      mockGoogleAccounts.id.renderButton.mockImplementation(() => {
        throw new Error('Render error');
      });

      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error initializing Google Sign-In button'),
          expect.any(Error)
        );
      });
    });
  });

  describe('Tests de réactivité aux props', () => {
    test('doit se réinitialiser quand les props changent', async () => {
      const onSignIn = jest.fn();
      const { rerender } = render(
        <GoogleSignInButton onSignIn={onSignIn} theme="outline" />
      );

      await waitFor(() => {
        expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalledTimes(1);
      });

      // Changer les props
      rerender(<GoogleSignInButton onSignIn={onSignIn} theme="filled_blue" />);

      await waitFor(() => {
        expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalledTimes(2);
      });
    });

    test('doit passer de disabled à enabled', async () => {
      const onSignIn = jest.fn();
      const { rerender } = render(
        <GoogleSignInButton onSignIn={onSignIn} disabled={true} />
      );

      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument();
      expect(mockGoogleAccounts.id.renderButton).not.toHaveBeenCalled();

      // Activer le bouton
      rerender(<GoogleSignInButton onSignIn={onSignIn} disabled={false} />);

      await waitFor(() => {
        expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalled();
      });
      expect(
        screen.queryByText('Connexion en cours...')
      ).not.toBeInTheDocument();
    });
  });

  describe("États d'interface", () => {
    test('doit afficher le spinner de chargement avec les bonnes classes', () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} disabled={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        'rounded-full',
        'h-5',
        'w-5',
        'border-b-2',
        'border-gray-400'
      );
    });

    test('doit afficher le conteneur de chargement avec le bon style', () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} disabled={true} />);

      const loadingContainer = screen.getByText(
        'Connexion en cours...'
      ).parentElement;
      expect(loadingContainer).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'bg-gray-100',
        'text-gray-400',
        'py-3',
        'px-6',
        'rounded-lg'
      );
    });
  });

  describe('Tests de décodage JWT', () => {
    test('doit décoder correctement un JWT valide', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(window.handleGoogleSignIn).toBeDefined();
      });

      // Simuler un JWT avec payload différent
      global.atob = jest.fn().mockImplementation(() =>
        JSON.stringify({
          sub: '987654321',
          name: 'Jane Doe',
          email: 'jane@example.com',
          given_name: 'Jane',
          family_name: 'Doe',
        })
      );

      const mockCredentialResponse = {
        credential: 'header.newpayload.signature',
        select_by: 'auto',
      };

      window.handleGoogleSignIn(mockCredentialResponse);

      expect(onSignIn).toHaveBeenCalledWith({
        credential: 'header.newpayload.signature',
        user: {
          sub: '987654321',
          name: 'Jane Doe',
          email: 'jane@example.com',
          given_name: 'Jane',
          family_name: 'Doe',
        },
        select_by: 'auto',
      });
    });

    test('doit logger les informations de credential reçues', async () => {
      const onSignIn = jest.fn();
      render(<GoogleSignInButton onSignIn={onSignIn} />);

      await waitFor(() => {
        expect(window.handleGoogleSignIn).toBeDefined();
      });

      const mockCredentialResponse = {
        credential: 'test.credential.token',
      };

      window.handleGoogleSignIn(mockCredentialResponse);

      expect(console.log).toHaveBeenCalledWith(
        '✅ Google Sign-In credential received:',
        mockCredentialResponse
      );
      expect(console.log).toHaveBeenCalledWith(
        '📋 User info from credential:',
        expect.any(Object)
      );
    });
  });
});
