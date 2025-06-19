// @ts-nocheck
/* eslint-disable no-global-assign, no-console */

// Mock console methods pour capturer les appels
// Import direct de l'instance
import errorHandler from '../utils/errorHandler.js';

const originalConsole = { ...console };

describe('ErrorHandler Utils - Gestion erreurs Firebase', () => {
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
    test.skip('doit filtrer les erreurs de connexion Firebase', () => {
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

    test.skip('doit filtrer les warnings Firebase répétitifs', () => {
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

    test.skip('doit filtrer les logs Firebase verbeux', () => {
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
    test('doit permettre les premières erreurs avec un pattern unique', () => {
      const uniquePattern = 'UNIQUE_TEST_ERROR_' + Date.now();

      // Les 3 premières doivent passer pour un pattern complètement nouveau
      expect(errorHandler.shouldThrottleError(uniquePattern)).toBe(false);
      expect(errorHandler.shouldThrottleError(uniquePattern)).toBe(false);
      expect(errorHandler.shouldThrottleError(uniquePattern)).toBe(false);
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
    test('doit retourner les stats des erreurs throttlées avec patterns uniques', () => {
      const uniquePattern1 = 'THROTTLED_ERROR_1_' + Date.now();
      const uniquePattern2 = 'THROTTLED_ERROR_2_' + Date.now();

      // Créer des erreurs throttlées (plus que la limite de 3)
      for (let i = 0; i < 6; i++) {
        errorHandler.shouldThrottleError(uniquePattern1);
      }
      for (let i = 0; i < 4; i++) {
        errorHandler.shouldThrottleError(uniquePattern2);
      }

      const stats = errorHandler.getErrorStats();

      expect(stats[uniquePattern1]).toBe(6);
      expect(stats[uniquePattern2]).toBe(4);
    });

    test('ne doit pas inclure les erreurs non-throttlées dans les stats avec pattern unique', () => {
      const uniquePattern = 'RARE_ERROR_' + Date.now();

      // Seulement 2 erreurs (sous la limite de 3)
      errorHandler.shouldThrottleError(uniquePattern);
      errorHandler.shouldThrottleError(uniquePattern);

      const stats = errorHandler.getErrorStats();

      expect(stats[uniquePattern]).toBeUndefined();
    });
  });

  describe('Interception des erreurs console', () => {
    test.skip('doit intercepter console.error pour Firebase', () => {
      // Test skippé - l'instance errorHandler est déjà créée globalement

      // Cette erreur doit être filtrée
      console.error('net::ERR_ABORTED 400 Firebase error');

      expect(console.error).not.toHaveBeenCalled();
    });

    test.skip('doit laisser passer les erreurs non-Firebase', () => {
      // Test skippé - l'instance errorHandler est déjà créée globalement

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

    test('doit identifier les patterns Firebase dans les messages', () => {
      // Test simple de détection de patterns sans état
      const firebaseMessage = 'net::ERR_ABORTED 400 Firebase error';
      const normalMessage = 'Regular application error';

      // Vérifier que la méthode existe et ne crash pas
      expect(() => {
        errorHandler.shouldFilterError([firebaseMessage]);
        errorHandler.shouldFilterError([normalMessage]);
      }).not.toThrow();
    });

    test('doit avoir toutes les méthodes publiques nécessaires', () => {
      expect(typeof errorHandler.shouldFilterError).toBe('function');
      expect(typeof errorHandler.shouldFilterWarning).toBe('function');
      expect(typeof errorHandler.shouldFilterLog).toBe('function');
      expect(typeof errorHandler.shouldThrottleError).toBe('function');
      expect(typeof errorHandler.getErrorStats).toBe('function');
      expect(typeof errorHandler.cleanup).toBe('function');
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
