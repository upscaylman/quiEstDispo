// @ts-nocheck
/* eslint-disable no-global-assign, no-console */

// Mock console methods pour capturer les appels
const originalConsole = { ...console };

describe('ErrorHandler Utils - Gestion erreurs Firebase', () => {
  let ErrorHandler;
  let errorHandler;

  beforeAll(async () => {
    // Import de l'instance errorHandler (pas la classe)
    const module = await import('../utils/errorHandler.js');
    errorHandler = module.default;
  });

  beforeEach(() => {
    // Restore console
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('Filtrage des erreurs Firebase', () => {
    test('doit filtrer les erreurs de connexion Firebase', () => {
      const firebaseErrors = [
        'net::ERR_ABORTED 400',
        'WebChannelConnection RPC failed',
        'Failed to get document because the client is offline',
        'Stream listen failed',
        'Firebase connection was forcefully closed',
      ];

      firebaseErrors.forEach(error => {
        expect(errorHandler.shouldFilterError([error])).toBe(true);
      });
    });

    test('doit laisser passer les erreurs importantes', () => {
      const importantErrors = [
        'Authentication failed',
        'Permission denied',
        'Document not found',
        'Unknown error',
      ];

      importantErrors.forEach(error => {
        expect(errorHandler.shouldFilterError([error])).toBe(false);
      });
    });

    test('doit filtrer les warnings Firebase répétitifs', () => {
      const firebaseWarnings = [
        'Firestore (10.14.1): WebChannelConnection',
        "RPC 'Listen' stream error",
        'transport errored',
        'stream 0x12345',
      ];

      firebaseWarnings.forEach(warning => {
        expect(errorHandler.shouldFilterWarning([warning])).toBe(true);
      });
    });

    test('doit filtrer les logs Firebase verbeux', () => {
      const firebaseLogs = [
        'webchannel_blob_es2018.js:123',
        '__webpack_modules__ something',
        'Firestore/Listen/channel debug',
        'gsessionid=abc123',
      ];

      firebaseLogs.forEach(log => {
        expect(errorHandler.shouldFilterLog([log])).toBe(true);
      });
    });
  });

  describe('Système de throttling des erreurs', () => {
    test('doit permettre les premières erreurs', () => {
      const errorPattern = 'net::ERR_ABORTED 400';

      // Les 3 premières doivent passer
      expect(errorHandler.shouldThrottleError(errorPattern)).toBe(false);
      expect(errorHandler.shouldThrottleError(errorPattern)).toBe(false);
      expect(errorHandler.shouldThrottleError(errorPattern)).toBe(false);
    });

    test('doit throttler après MAX_SAME_ERROR', () => {
      const errorPattern = 'WebChannelConnection RPC';

      // Dépasser la limite
      for (let i = 0; i < 5; i++) {
        errorHandler.shouldThrottleError(errorPattern);
      }

      // La 5ème doit être throttlée
      expect(errorHandler.shouldThrottleError(errorPattern)).toBe(true);
    });

    test('doit reset le compteur après ERROR_RESET_TIME', () => {
      const errorPattern = 'transport errored';

      // Créer plusieurs erreurs
      for (let i = 0; i < 5; i++) {
        errorHandler.shouldThrottleError(errorPattern);
      }

      // Simuler le passage du temps
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 35000); // +35 secondes

      // Doit permettre à nouveau
      expect(errorHandler.shouldThrottleError(errorPattern)).toBe(false);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe("Statistiques d'erreurs", () => {
    test('doit retourner les stats des erreurs throttlées', () => {
      const errorPattern1 = 'net::ERR_ABORTED 400';
      const errorPattern2 = 'WebChannelConnection RPC';

      // Créer des erreurs throttlées
      for (let i = 0; i < 10; i++) {
        errorHandler.shouldThrottleError(errorPattern1);
      }
      for (let i = 0; i < 5; i++) {
        errorHandler.shouldThrottleError(errorPattern2);
      }

      const stats = errorHandler.getErrorStats();

      expect(stats[errorPattern1]).toBe(10);
      expect(stats[errorPattern2]).toBe(5);
    });

    test('ne doit pas inclure les erreurs non-throttlées dans les stats', () => {
      const errorPattern = 'rare error';

      // Seulement 2 erreurs (sous la limite)
      errorHandler.shouldThrottleError(errorPattern);
      errorHandler.shouldThrottleError(errorPattern);

      const stats = errorHandler.getErrorStats();

      expect(stats[errorPattern]).toBeUndefined();
    });
  });

  describe('Interception des erreurs console', () => {
    test('doit intercepter console.error pour Firebase', () => {
      // Nouvelle instance pour tester l'interception
      new ErrorHandler(); // Pas besoin de stocker dans une variable

      // Cette erreur doit être filtrée
      console.error('net::ERR_ABORTED 400 Firebase error');

      expect(console.error).not.toHaveBeenCalled();
    });

    test('doit laisser passer les erreurs non-Firebase', () => {
      new ErrorHandler(); // Pas besoin de stocker dans une variable

      // Cette erreur ne doit pas être filtrée
      console.error('Real application error');

      expect(console.error).toHaveBeenCalledWith('Real application error');
    });
  });

  describe('Cas limites et edge cases', () => {
    test('doit gérer les arguments undefined', () => {
      expect(() => {
        errorHandler.shouldFilterError([undefined]);
        errorHandler.shouldFilterWarning([null]);
        errorHandler.shouldFilterLog(['']);
      }).not.toThrow();
    });

    test('doit gérer les messages vides', () => {
      expect(errorHandler.shouldFilterError([])).toBe(false);
      expect(errorHandler.shouldFilterWarning([])).toBe(false);
      expect(errorHandler.shouldFilterLog([])).toBe(false);
    });

    test('doit gérer les objets non-string dans les messages', () => {
      expect(() => {
        errorHandler.shouldFilterError([123, { error: 'test' }]);
        errorHandler.shouldThrottleError(null);
      }).not.toThrow();
    });
  });

  describe('Cleanup et nettoyage', () => {
    test('doit avoir une méthode cleanup', () => {
      expect(typeof errorHandler.cleanup).toBe('function');
    });

    test('doit nettoyer les ressources', () => {
      expect(() => {
        errorHandler.cleanup();
      }).not.toThrow();
    });
  });
});
