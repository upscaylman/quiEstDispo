// @ts-nocheck
// Tests GoogleSignInService - PHASE 2 - Logique Métier Core
import { GoogleSignInService } from '../services/googleSignInService';

// === MOCKS COMPLETS ===
const mockGoogleAccounts = {
  id: {
    initialize: jest.fn(),
    prompt: jest.fn(),
    cancel: jest.fn(),
    disableAutoSelect: jest.fn(),
  },
  oauth2: {
    revoke: jest.fn(),
  },
};

// Mock window.google
Object.defineProperty(global, 'window', {
  value: {
    google: {
      accounts: mockGoogleAccounts,
    },
  },
  writable: true,
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn(() => ({ __type: 'credential' })),
  },
  signInWithCredential: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase', () => ({
  auth: { __type: 'auth' },
}));

describe('GoogleSignInService - PHASE 2 - Services Google', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🔧 Initialization', () => {
    test('doit initialiser Google Sign-In avec succès', async () => {
      const clientId = 'test-client-id';
      const options = {
        callback: 'testCallback',
        auto_prompt: false,
        ux_mode: 'popup',
      };

      const result = await GoogleSignInService.initialize(clientId, options);

      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: clientId,
          callback: 'testCallback',
          auto_prompt: false,
          ux_mode: 'popup',
        })
      );
      expect(result).toBe(true);
    });

    test('doit utiliser les options par défaut', async () => {
      const clientId = 'test-client-id';

      await GoogleSignInService.initialize(clientId);

      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: clientId,
          callback: 'handleGoogleSignIn',
          auto_prompt: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
        })
      );
    });

    test('doit attendre que Google soit chargé', async () => {
      // Simuler Google non disponible initialement
      window.google = undefined;

      // Remettre Google après un délai
      setTimeout(() => {
        window.google = { accounts: mockGoogleAccounts };
      }, 50);

      const result = await GoogleSignInService.initialize('test-client-id');

      expect(result).toBe(true);
      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalled();
    });

    test("doit gérer les erreurs d'initialisation", async () => {
      mockGoogleAccounts.id.initialize.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(
        GoogleSignInService.initialize('test-client-id')
      ).rejects.toThrow('Initialization failed');
    });
  });

  describe('🔐 Firebase Authentication', () => {
    test('doit connecter avec Firebase en utilisant credential Google', async () => {
      const {
        signInWithCredential,
        GoogleAuthProvider,
      } = require('firebase/auth');
      const mockCredential = { __type: 'credential' };
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockResult = { user: mockUser };

      GoogleAuthProvider.credential.mockReturnValue(mockCredential);
      signInWithCredential.mockResolvedValue(mockResult);

      const result =
        await GoogleSignInService.signInWithFirebase('mock-jwt-token');

      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(
        'mock-jwt-token'
      );
      expect(signInWithCredential).toHaveBeenCalledWith(
        expect.any(Object),
        mockCredential
      );
      expect(result).toEqual({
        user: mockUser,
        credential: mockCredential,
      });
    });

    test('doit gérer les erreurs de compte existant', async () => {
      const { signInWithCredential } = require('firebase/auth');
      const error = new Error('Account exists');
      error.code = 'auth/account-exists-with-different-credential';

      signInWithCredential.mockRejectedValue(error);

      await expect(
        GoogleSignInService.signInWithFirebase('mock-jwt-token')
      ).rejects.toThrow('Un compte existe déjà avec cette adresse email');
    });

    test('doit gérer les erreurs de credential invalide', async () => {
      const { signInWithCredential } = require('firebase/auth');
      const error = new Error('Invalid credential');
      error.code = 'auth/invalid-credential';

      signInWithCredential.mockRejectedValue(error);

      await expect(
        GoogleSignInService.signInWithFirebase('invalid-token')
      ).rejects.toThrow('Credential Google invalide');
    });

    test("doit gérer les erreurs d'opération non autorisée", async () => {
      const { signInWithCredential } = require('firebase/auth');
      const error = new Error('Operation not allowed');
      error.code = 'auth/operation-not-allowed';

      signInWithCredential.mockRejectedValue(error);

      await expect(
        GoogleSignInService.signInWithFirebase('mock-token')
      ).rejects.toThrow('Connexion Google non autorisée');
    });

    test("doit gérer les erreurs d'utilisateur désactivé", async () => {
      const { signInWithCredential } = require('firebase/auth');
      const error = new Error('User disabled');
      error.code = 'auth/user-disabled';

      signInWithCredential.mockRejectedValue(error);

      await expect(
        GoogleSignInService.signInWithFirebase('mock-token')
      ).rejects.toThrow('Compte utilisateur désactivé');
    });

    test('doit continuer même si création profil échoue', async () => {
      const { signInWithCredential } = require('firebase/auth');
      const mockUser = { uid: 'test-uid' };
      const mockResult = { user: mockUser };

      signInWithCredential.mockResolvedValue(mockResult);

      // Mock du dynamic import qui échoue
      jest.doMock('../services/firebaseService', () => {
        throw new Error('Profile creation failed');
      });

      const result = await GoogleSignInService.signInWithFirebase('mock-token');

      expect(result).toEqual(
        expect.objectContaining({
          user: mockUser,
        })
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Erreur création profil'),
        expect.any(Error)
      );
    });
  });

  describe('💡 One Tap & Prompts', () => {
    test('doit afficher la prompt One Tap', () => {
      const mockNotification = {
        isNotDisplayed: jest.fn(() => false),
        isSkippedMoment: jest.fn(() => false),
        isDismissedMoment: jest.fn(() => false),
      };

      mockGoogleAccounts.id.prompt.mockImplementation(callback => {
        callback(mockNotification);
      });

      GoogleSignInService.promptOneTap();

      expect(mockGoogleAccounts.id.prompt).toHaveBeenCalled();
    });

    test('doit gérer One Tap non affiché', () => {
      const mockNotification = {
        isNotDisplayed: jest.fn(() => true),
        getNotDisplayedReason: jest.fn(() => 'user_cancel'),
        isSkippedMoment: jest.fn(() => false),
        isDismissedMoment: jest.fn(() => false),
      };

      mockGoogleAccounts.id.prompt.mockImplementation(callback => {
        callback(mockNotification);
      });

      GoogleSignInService.promptOneTap();

      expect(console.log).toHaveBeenCalledWith(
        '⚠️ One Tap non affiché:',
        'user_cancel'
      );
    });

    test('doit gérer One Tap ignoré', () => {
      const mockNotification = {
        isNotDisplayed: jest.fn(() => false),
        isSkippedMoment: jest.fn(() => true),
        getSkippedReason: jest.fn(() => 'user_cancel'),
        isDismissedMoment: jest.fn(() => false),
      };

      mockGoogleAccounts.id.prompt.mockImplementation(callback => {
        callback(mockNotification);
      });

      GoogleSignInService.promptOneTap();

      expect(console.log).toHaveBeenCalledWith(
        '⏭️ One Tap ignoré:',
        'user_cancel'
      );
    });

    test('doit gérer One Tap fermé', () => {
      const mockNotification = {
        isNotDisplayed: jest.fn(() => false),
        isSkippedMoment: jest.fn(() => false),
        isDismissedMoment: jest.fn(() => true),
        getDismissedReason: jest.fn(() => 'credential_returned'),
      };

      mockGoogleAccounts.id.prompt.mockImplementation(callback => {
        callback(mockNotification);
      });

      GoogleSignInService.promptOneTap();

      expect(console.log).toHaveBeenCalledWith(
        '❌ One Tap fermé:',
        'credential_returned'
      );
    });

    test('doit désactiver One Tap', () => {
      GoogleSignInService.disableOneTap();

      expect(mockGoogleAccounts.id.cancel).toHaveBeenCalled();
    });

    test('doit gérer les erreurs One Tap', () => {
      mockGoogleAccounts.id.prompt.mockImplementation(() => {
        throw new Error('One Tap error');
      });

      GoogleSignInService.promptOneTap();

      expect(console.error).toHaveBeenCalledWith(
        '❌ Erreur One Tap:',
        expect.any(Error)
      );
    });
  });

  describe('🚪 Sign Out & Revoke', () => {
    test('doit déconnecter Google', () => {
      GoogleSignInService.signOut();

      expect(mockGoogleAccounts.id.disableAutoSelect).toHaveBeenCalled();
    });

    test("doit révoquer l'accès Google", async () => {
      const accessToken = 'mock-access-token';

      mockGoogleAccounts.oauth2.revoke.mockImplementation((token, callback) => {
        callback();
      });

      await GoogleSignInService.revoke(accessToken);

      expect(mockGoogleAccounts.oauth2.revoke).toHaveBeenCalledWith(
        accessToken,
        expect.any(Function)
      );
    });

    test("doit gérer l'absence de token pour révocation", async () => {
      await GoogleSignInService.revoke(null);

      expect(mockGoogleAccounts.oauth2.revoke).not.toHaveBeenCalled();
    });

    test('doit gérer les erreurs de révocation', async () => {
      mockGoogleAccounts.oauth2.revoke.mockImplementation(() => {
        throw new Error('Revoke error');
      });

      await GoogleSignInService.revoke('mock-token');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Erreur révocation Google:',
        expect.any(Error)
      );
    });
  });

  describe('🔧 Edge Cases & Error Handling', () => {
    test("doit gérer l'absence de Google APIs", () => {
      window.google = undefined;

      GoogleSignInService.promptOneTap();
      GoogleSignInService.disableOneTap();
      GoogleSignInService.signOut();

      // Ne doit pas planter, juste ne rien faire
      expect(console.error).not.toHaveBeenCalled();
    });

    test("doit gérer l'absence d'accounts API", () => {
      window.google = { accounts: undefined };

      GoogleSignInService.promptOneTap();
      GoogleSignInService.disableOneTap();
      GoogleSignInService.signOut();

      // Ne doit pas planter
      expect(console.error).not.toHaveBeenCalled();
    });

    test("doit gérer l'absence d'oauth2 API", async () => {
      window.google = {
        accounts: {
          id: mockGoogleAccounts.id,
          oauth2: undefined,
        },
      };

      await GoogleSignInService.revoke('mock-token');

      // Ne doit pas planter
      expect(console.error).not.toHaveBeenCalled();
    });

    test('doit gérer les erreurs génériques de connexion Firebase', async () => {
      const { signInWithCredential } = require('firebase/auth');
      const error = new Error('Generic error');
      error.code = 'auth/unknown-error';

      signInWithCredential.mockRejectedValue(error);

      await expect(
        GoogleSignInService.signInWithFirebase('mock-token')
      ).rejects.toThrow('Generic error');
    });
  });

  describe('📱 Integration Tests', () => {
    test('doit avoir toutes les méthodes publiques définies', () => {
      expect(typeof GoogleSignInService.initialize).toBe('function');
      expect(typeof GoogleSignInService.signInWithFirebase).toBe('function');
      expect(typeof GoogleSignInService.promptOneTap).toBe('function');
      expect(typeof GoogleSignInService.disableOneTap).toBe('function');
      expect(typeof GoogleSignInService.signOut).toBe('function');
      expect(typeof GoogleSignInService.revoke).toBe('function');
    });

    test('doit fonctionner avec un workflow complet simulé', async () => {
      // S'assurer que window.google est correctement configuré
      window.google = {
        accounts: mockGoogleAccounts,
      };

      // 1. Initialisation
      await GoogleSignInService.initialize('test-client-id');

      // 2. Connexion
      const { signInWithCredential } = require('firebase/auth');
      signInWithCredential.mockResolvedValue({ user: { uid: 'test' } });

      const result = await GoogleSignInService.signInWithFirebase('jwt-token');

      // 3. Déconnexion
      GoogleSignInService.signOut();

      // 4. Révocation - Setup du mock juste avant l'appel
      mockGoogleAccounts.oauth2.revoke.mockImplementation((token, callback) => {
        callback();
      });
      await GoogleSignInService.revoke('access-token');

      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalled();
      expect(signInWithCredential).toHaveBeenCalled();
      expect(mockGoogleAccounts.id.disableAutoSelect).toHaveBeenCalled();
      expect(mockGoogleAccounts.oauth2.revoke).toHaveBeenCalledWith(
        'access-token',
        expect.any(Function)
      );
      expect(result).toEqual(
        expect.objectContaining({
          user: expect.any(Object),
        })
      );
    });
  });
});
