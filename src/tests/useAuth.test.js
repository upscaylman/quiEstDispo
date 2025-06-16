// @ts-nocheck
// Tests useAuth Hook - PHASE 2 - Logique Métier Core
import { act, renderHook } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

// === MOCKS COMPLETS ===
const mockAuthService = {
  onAuthStateChanged: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithGoogleRedirect: jest.fn(),
  signInWithFacebook: jest.fn(),
  signInWithFacebookRedirect: jest.fn(),
  getGoogleRedirectResult: jest.fn(),
  getFacebookRedirectResult: jest.fn(),
  signInWithPhone: jest.fn(),
  confirmPhoneCode: jest.fn(),
  createRecaptchaVerifier: jest.fn(),
  signOut: jest.fn(),
  testPhoneAuth: jest.fn(),
  createUserProfile: jest.fn(),
  cleanupOrphanedAuthAccount: jest.fn(),
};

// Mock AuthService
jest.mock('../services/firebaseService', () => ({
  AuthService: mockAuthService,
}));

describe('useAuth Hook - PHASE 2 - Hooks Authentication', () => {
  const mockUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+33123456789',
  };

  const mockFirebaseUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+33123456789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🔄 Authentication State Management', () => {
    test('doit initialiser avec loading = true et user = null', () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
    });

    test("doit mettre à jour l'état quand utilisateur se connecte", async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn(); // unsubscribe function
      });

      mockAuthService.cleanupOrphanedAuthAccount.mockResolvedValue(false);
      mockAuthService.createUserProfile.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Simuler connexion utilisateur
      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });

    test("doit mettre à jour l'état quand utilisateur se déconnecte", async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());

      // Simuler déconnexion utilisateur
      await act(async () => {
        await authCallback(null);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
    });

    test('doit utiliser données fallback si création profil échoue', async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });

      mockAuthService.cleanupOrphanedAuthAccount.mockResolvedValue(false);
      mockAuthService.createUserProfile.mockRejectedValue(
        new Error('Profile error')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(
        expect.objectContaining({
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName || 'Utilisateur',
        })
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Profile creation failed'),
        expect.any(Error)
      );
    });

    test('doit gérer le nettoyage des comptes orphelins', async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });

      mockAuthService.cleanupOrphanedAuthAccount.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      expect(mockAuthService.cleanupOrphanedAuthAccount).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('🧹 Compte orphelin supprimé');
    });

    test('doit continuer si nettoyage orphelin échoue', async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });

      mockAuthService.cleanupOrphanedAuthAccount.mockRejectedValue(
        new Error('Cleanup error')
      );
      mockAuthService.createUserProfile.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Vérification compte orphelin échouée'),
        expect.any(Error)
      );
    });
  });

  describe('🔐 Google Authentication', () => {
    test('doit connecter avec Google en mode popup', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signInWithGoogle.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithGoogle();
      });

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      expect(signInResult).toEqual({ user: mockUser });
      expect(result.current.loading).toBe(false);
    });

    test('doit connecter avec Google en mode redirection', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signInWithGoogleRedirect.mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithGoogle(true);
      });

      expect(mockAuthService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(signInResult).toBe(null); // Redirection retourne null
    });

    test('doit proposer redirection si popup bloquée', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      const popupError = new Error('Popup bloquée par le navigateur');
      mockAuthService.signInWithGoogle.mockRejectedValue(popupError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (error) {
          expect(error.message).toContain(
            'Vous pouvez essayer le mode redirection'
          );
        }
      });
    });

    test('doit vérifier résultat redirection Google', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.getGoogleRedirectResult.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      let redirectResult;
      await act(async () => {
        redirectResult = await result.current.checkGoogleRedirectResult();
      });

      expect(mockAuthService.getGoogleRedirectResult).toHaveBeenCalled();
      expect(redirectResult).toEqual({ user: mockUser });
    });

    test('doit retourner null si pas de redirection Google', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.getGoogleRedirectResult.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      let redirectResult;
      await act(async () => {
        redirectResult = await result.current.checkGoogleRedirectResult();
      });

      expect(redirectResult).toBe(null);
    });
  });

  describe('📘 Facebook Authentication (NON IMPLÉMENTÉE - masquée en production)', () => {
    test('doit connecter avec Facebook en mode popup (développement uniquement)', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signInWithFacebook.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithFacebook();
      });

      // Note: Facebook auth existe dans useAuth mais interface masquée en production
      expect(mockAuthService.signInWithFacebook).toHaveBeenCalled();
      expect(signInResult).toEqual({ user: mockUser });
    });

    test('doit connecter avec Facebook en mode redirection (développement uniquement)', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signInWithFacebookRedirect.mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithFacebook(true);
      });

      // Note: Code prêt mais UI Facebook non visible en production
      expect(mockAuthService.signInWithFacebookRedirect).toHaveBeenCalled();
      expect(signInResult).toBe(null);
    });

    test('doit vérifier résultat redirection Facebook (développement uniquement)', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.getFacebookRedirectResult.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      let redirectResult;
      await act(async () => {
        redirectResult = await result.current.checkFacebookRedirectResult();
      });

      // Note: Méthode existe mais interface Facebook masquée en production
      expect(mockAuthService.getFacebookRedirectResult).toHaveBeenCalled();
      expect(redirectResult).toEqual({ user: mockUser });
    });
  });

  describe('📱 Phone Authentication', () => {
    const mockRecaptcha = { verify: jest.fn(), clear: jest.fn() };
    const mockConfirmationResult = { confirm: jest.fn() };

    test('doit envoyer SMS pour authentification téléphone (UNIQUEMENT +336/+337)', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signInWithPhone.mockResolvedValue(mockConfirmationResult);

      const { result } = renderHook(() => useAuth());

      let phoneResult;
      await act(async () => {
        phoneResult = await result.current.signInWithPhone(
          '+33612345678', // Seuls +336/+337 acceptés en production
          mockRecaptcha
        );
      });

      expect(mockAuthService.signInWithPhone).toHaveBeenCalledWith(
        '+33612345678',
        mockRecaptcha
      );
      expect(phoneResult).toBe(mockConfirmationResult);
    });

    test('doit confirmer le code SMS', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.confirmPhoneCode.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      let confirmResult;
      await act(async () => {
        confirmResult = await result.current.confirmPhoneCode(
          mockConfirmationResult,
          '123456'
        );
      });

      expect(mockAuthService.confirmPhoneCode).toHaveBeenCalledWith(
        mockConfirmationResult,
        '123456'
      );
      expect(confirmResult).toBe(mockUser);
    });

    test('doit créer RecaptchaVerifier', () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.createRecaptchaVerifier.mockReturnValue(mockRecaptcha);

      const { result } = renderHook(() => useAuth());

      const verifier = result.current.createRecaptchaVerifier(
        'recaptcha-container'
      );

      expect(mockAuthService.createRecaptchaVerifier).toHaveBeenCalledWith(
        'recaptcha-container',
        {}
      );
      expect(verifier).toBe(mockRecaptcha);
    });
  });

  describe('🚪 Sign Out', () => {
    test("doit déconnecter l'utilisateur", async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.signOut.mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    test('doit gérer les erreurs de déconnexion', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      const signOutError = new Error('Sign out failed');
      mockAuthService.signOut.mockRejectedValue(signOutError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          expect(error).toBe(signOutError);
        }
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sign out error'),
        signOutError
      );
    });
  });

  describe('🧪 Test Functions', () => {
    test('doit exécuter test authentification téléphone', async () => {
      mockAuthService.onAuthStateChanged.mockImplementation(() => jest.fn());
      mockAuthService.testPhoneAuth.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      let testResult;
      await act(async () => {
        testResult = await result.current.testPhoneAuth();
      });

      expect(mockAuthService.testPhoneAuth).toHaveBeenCalled();
      expect(testResult).toEqual({ success: true });
    });
  });

  describe('🔧 Utility Functions', () => {
    test('doit rafraîchir les données utilisateur', async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });
      mockAuthService.cleanupOrphanedAuthAccount.mockResolvedValue(false);
      mockAuthService.createUserProfile.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Simuler utilisateur connecté
      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      // Rafraîchir les données
      const updatedUser = { ...mockUser, name: 'Updated User' };
      mockAuthService.createUserProfile.mockResolvedValue(updatedUser);

      await act(async () => {
        await result.current.refreshUserData();
      });

      expect(result.current.user).toEqual(updatedUser);
    });
  });

  describe('🔄 Cleanup & Memory Management', () => {
    test('doit nettoyer les listeners au démontage', () => {
      const unsubscribeMock = jest.fn();
      mockAuthService.onAuthStateChanged.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    test('doit éviter les mises à jour après démontage', async () => {
      let authCallback;
      mockAuthService.onAuthStateChanged.mockImplementation(callback => {
        authCallback = callback;
        return jest.fn();
      });

      const { result, unmount } = renderHook(() => useAuth());

      // Démonter le composant
      unmount();

      // Essayer de déclencher callback après démontage
      await act(async () => {
        await authCallback(mockFirebaseUser);
      });

      // Le state ne doit pas être mis à jour
      expect(result.current.user).toBe(null);
    });
  });
});
