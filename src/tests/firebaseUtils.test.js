// @ts-nocheck
// firebaseUtils - PHASE 5 - Intégrations Firebase (Utilitaires)

import {
  getNetworkErrorMessage,
  isOnline,
  retryWithBackoff,
} from '../services/firebaseUtils';

// === MOCKS ===

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: { mock: 'auth' },
  db: { mock: 'db' },
}));

// Mock navigator avec vérification d'existence
if (typeof navigator === 'undefined') {
  global.navigator = { onLine: true };
} else {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
}

// === TESTS ===

describe('firebaseUtils - PHASE 5 - Intégrations Firebase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.onLine to default
    navigator.onLine = true;
  });

  describe('🌐 Détection de connectivité', () => {
    test('doit retourner true quand navigator.onLine est true', () => {
      navigator.onLine = true;
      expect(isOnline()).toBe(true);
    });

    test('doit retourner false quand navigator.onLine est false', () => {
      navigator.onLine = false;
      expect(isOnline()).toBe(false);
    });

    test('doit retourner true quand navigator est indéfini', () => {
      const originalNavigator = global.navigator;
      // @ts-ignore
      delete global.navigator;

      expect(isOnline()).toBe(true);

      global.navigator = originalNavigator;
    });
  });

  describe("📡 Messages d'erreur réseau", () => {
    test('doit retourner le message par défaut quand en ligne', () => {
      navigator.onLine = true;
      const message = getNetworkErrorMessage();
      expect(message).toBe('Problème de réseau temporaire, réessayez');
    });

    test('doit retourner le message par défaut personnalisé', () => {
      navigator.onLine = true;
      const message = getNetworkErrorMessage('Message personnalisé');
      expect(message).toBe('Problème de réseau temporaire, réessayez');
    });

    test('doit retourner un message spécifique quand hors ligne', () => {
      navigator.onLine = false;
      const message = getNetworkErrorMessage();
      expect(message).toBe('Pas de connexion internet détectée');
    });
  });

  describe('🔄 Retry avec backoff', () => {
    test('doit réussir au premier essai', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('doit retenter sur erreur unavailable', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 'unavailable' })
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, 2, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('doit retenter sur erreur deadline-exceeded', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 'deadline-exceeded' })
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, 2, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('doit échouer immédiatement sur autres erreurs', async () => {
      const mockFn = jest.fn().mockRejectedValue({ code: 'permission-denied' });

      await expect(retryWithBackoff(mockFn)).rejects.toEqual({
        code: 'permission-denied',
      });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('doit échouer après max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue({ code: 'unavailable' });

      await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toEqual({
        code: 'unavailable',
      });
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('🔧 Configuration et robustesse', () => {
    test('doit gérer retryWithBackoff avec paramètres par défaut', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
