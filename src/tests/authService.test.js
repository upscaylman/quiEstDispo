// @ts-nocheck
// Tests AuthService - PHASE 2 - Logique Métier Core (Priorité HAUTE)

// === MOCKS FIREBASE COMPLETS ===
import { AuthService } from '../services/authService';

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  })),
  FacebookAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  })),
  RecaptchaVerifier: jest.fn(() => ({
    verify: jest.fn(),
    clear: jest.fn(),
    render: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  signInWithPhoneNumber: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'test-doc-id' })),
  getDoc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  serverTimestamp: jest.fn(() => ({ __type: 'timestamp' })),
}));

jest.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    settings: { appVerificationDisabledForTesting: true },
  },
  db: { __type: 'firestore' },
}));

describe('AuthService - PHASE 2 - Logique Métier Core', () => {
  const mockUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+33123456789',
    emailVerified: true,
    reload: jest.fn(),
  };

  const mockCredential = {
    accessToken: 'mock-access-token',
    idToken: 'mock-id-token',
  };

  const mockResult = {
    user: mockUser,
    credential: mockCredential,
  };

  const mockConfirmationResult = {
    verificationId: 'mock-verification-id',
    confirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🔐 Google Authentication', () => {
    test('doit connecter avec Google avec succès', async () => {
      const { signInWithPopup } = require('firebase/auth');
      signInWithPopup.mockResolvedValue(mockResult);

      jest.spyOn(AuthService, 'createUserProfile').mockResolvedValue(mockUser);

      const result = await AuthService.signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });

    test('doit gérer les erreurs de popup Google', async () => {
      const { signInWithPopup } = require('firebase/auth');
      const error = new Error('popup-closed-by-user');
      error.code = 'auth/popup-closed-by-user';
      signInWithPopup.mockRejectedValue(error);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        "Connexion annulée par l'utilisateur"
      );
    });

    test('doit gérer les erreurs de popup bloquée', async () => {
      const { signInWithPopup } = require('firebase/auth');
      const error = new Error('popup-blocked');
      error.code = 'auth/popup-blocked';
      signInWithPopup.mockRejectedValue(error);

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'Popup bloquée par le navigateur'
      );
    });
  });

  describe('📘 Facebook Authentication', () => {
    test('doit connecter avec Facebook avec succès', async () => {
      const { signInWithPopup } = require('firebase/auth');
      signInWithPopup.mockResolvedValue(mockResult);

      jest.spyOn(AuthService, 'createUserProfile').mockResolvedValue(mockUser);

      const result = await AuthService.signInWithFacebook();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });
  });

  describe('📱 Phone Authentication', () => {
    test('doit valider et formater le numéro de téléphone français', () => {
      const validCases = [
        ['0123456789', '+33123456789'],
        ['+33123456789', '+33123456789'],
        ['06 12 34 56 78', '+33612345678'],
        ['+33 6 12 34 56 78', '+33612345678'],
      ];

      validCases.forEach(([input, expected]) => {
        const result = AuthService.validateAndFormatPhoneNumber(input);
        expect(result).toBe(expected);
      });
    });

    test('doit rejeter les numéros invalides', () => {
      const invalidCases = [
        '',
        '123',
        '+1234567890', // US number
        'abcdefghij',
        '012345678', // Too short
        '01234567890', // Too long
      ];

      invalidCases.forEach(invalid => {
        expect(() => {
          AuthService.validateAndFormatPhoneNumber(invalid);
        }).toThrow('Numéro de téléphone invalide');
      });
    });

    test('doit envoyer SMS avec succès', async () => {
      const { signInWithPhoneNumber } = require('firebase/auth');
      signInWithPhoneNumber.mockResolvedValue(mockConfirmationResult);

      const mockRecaptcha = { verify: jest.fn(), clear: jest.fn() };
      const result = await AuthService.signInWithPhone(
        '+33123456789',
        mockRecaptcha
      );

      expect(signInWithPhoneNumber).toHaveBeenCalled();
      expect(result).toBe(mockConfirmationResult);
    });

    test('doit confirmer le code SMS', async () => {
      mockConfirmationResult.confirm.mockResolvedValue(mockResult);
      jest
        .spyOn(AuthService, 'handlePhoneAccountLinking')
        .mockResolvedValue(mockUser);

      const result = await AuthService.confirmPhoneCode(
        mockConfirmationResult,
        '123456'
      );

      expect(mockConfirmationResult.confirm).toHaveBeenCalledWith('123456');
      expect(result).toBe(mockUser);
    });

    test('doit créer RecaptchaVerifier correctement', () => {
      const verifier = AuthService.createRecaptchaVerifier(
        'recaptcha-container'
      );

      expect(verifier).toBeDefined();
    });
  });

  describe('👤 User Profile Management', () => {
    test('doit créer un profil utilisateur', async () => {
      const { getDoc, setDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await AuthService.createUserProfile(mockUser);

      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          uid: mockUser.uid,
          name: mockUser.displayName,
          email: mockUser.email,
        })
      );
    });

    test('doit mettre à jour un profil existant', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          uid: 'test-uid-123',
          name: 'Test User',
          email: 'test@example.com',
        }),
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await AuthService.createUserProfile(mockUser);

      expect(updateDoc).toHaveBeenCalled();
      expect(result).toEqual(mockDocSnap.data());
    });

    test('doit récupérer un profil utilisateur', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ name: 'Test User' }),
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await AuthService.getUserProfile('test-uid');

      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual({ name: 'Test User' });
    });

    test('doit retourner null si profil inexistant', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await AuthService.getUserProfile('nonexistent-uid');

      expect(result).toBeNull();
    });
  });

  describe('🔄 Authentication State', () => {
    test("doit retourner l'utilisateur courant", () => {
      const { auth } = require('../firebase');
      auth.currentUser = mockUser;

      const result = AuthService.getCurrentUser();

      expect(result).toBe(mockUser);
    });

    test('doit vérifier si utilisateur authentifié', () => {
      const { auth } = require('../firebase');

      auth.currentUser = mockUser;
      expect(AuthService.isAuthenticated()).toBe(true);

      auth.currentUser = null;
      expect(AuthService.isAuthenticated()).toBe(false);
    });

    test("doit déconnecter l'utilisateur", async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue();

      await AuthService.signOut();

      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('🧪 Test Mode Functions', () => {
    test('doit exécuter test auth téléphone avec numéro officiel', async () => {
      const { signInWithPhoneNumber } = require('firebase/auth');
      signInWithPhoneNumber.mockResolvedValue(mockConfirmationResult);
      mockConfirmationResult.confirm.mockResolvedValue(mockResult);

      jest.spyOn(AuthService, 'createRecaptchaVerifier').mockReturnValue({
        verify: jest.fn(),
        clear: jest.fn(),
      });

      const result = await AuthService.testPhoneAuth();

      expect(result.success).toBe(true);
      expect(signInWithPhoneNumber).toHaveBeenCalledWith(
        expect.anything(),
        '+16505554567', // Numéro officiel de test Firebase
        expect.anything()
      );
    });
  });

  describe('🔧 Utility Functions', () => {
    test("doit diagnostiquer l'état d'App Check", async () => {
      // Mock navigator
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
      });

      const diagnosis = await AuthService.diagnosePhoneAuth();

      expect(diagnosis).toEqual(
        expect.objectContaining({
          isOnline: true,
          appCheckEnabled: expect.any(Boolean),
          testMode: expect.any(Boolean),
        })
      );
    });
  });

  describe('📱 Mobile & Redirect Scenarios', () => {
    test('doit démarrer redirection Google', async () => {
      const { signInWithRedirect } = require('firebase/auth');
      signInWithRedirect.mockResolvedValue();

      await AuthService.signInWithGoogleRedirect();

      expect(signInWithRedirect).toHaveBeenCalled();
    });

    test('doit récupérer résultat redirection Google', async () => {
      const { getRedirectResult } = require('firebase/auth');
      getRedirectResult.mockResolvedValue(mockResult);
      jest.spyOn(AuthService, 'createUserProfile').mockResolvedValue(mockUser);

      const result = await AuthService.getGoogleRedirectResult();

      expect(getRedirectResult).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });

    test('doit retourner null si pas de redirection en cours', async () => {
      const { getRedirectResult } = require('firebase/auth');
      getRedirectResult.mockResolvedValue(null);

      const result = await AuthService.getGoogleRedirectResult();

      expect(result).toBeNull();
    });
  });
});
