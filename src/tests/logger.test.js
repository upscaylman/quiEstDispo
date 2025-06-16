/* eslint-disable no-global-assign, no-console */
// @ts-nocheck
import {
  debugError,
  debugInfo,
  debugLog,
  debugWarn,
  prodError,
  prodLog,
  prodWarn,
} from '../utils/logger';

// Mock console methods pour capturer les appels
const originalConsole = { ...console };

describe('Logger Utils - PRIORITÉ #1', () => {
  beforeEach(() => {
    // Mock console methods
    // eslint-disable-next-line no-console
    console.log = jest.fn();
    // eslint-disable-next-line no-console
    console.info = jest.fn();
    // eslint-disable-next-line no-console
    console.warn = jest.fn();
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console
    // eslint-disable-next-line no-console
    console.log = originalConsole.log;
    // eslint-disable-next-line no-console
    console.info = originalConsole.info;
    // eslint-disable-next-line no-console
    console.warn = originalConsole.warn;
    // eslint-disable-next-line no-console
    console.error = originalConsole.error;
  });

  describe('Development mode', () => {
    beforeEach(() => {
      // Set development environment
      process.env.NODE_ENV = 'development';
    });

    test('debugLog doit logger en développement', () => {
      debugLog('Test message');
      expect(console.log).toHaveBeenCalledWith('Test message');
    });

    test('debugError doit logger les erreurs en développement', () => {
      debugError('Error message');
      expect(console.error).toHaveBeenCalledWith('Error message');
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      // Set production environment
      process.env.NODE_ENV = 'production';
    });

    test('debugLog ne doit PAS logger en production', () => {
      debugLog('Test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('prodLog doit TOUJOURS logger', () => {
      prodLog('Important message');
      expect(console.log).toHaveBeenCalledWith('Important message');
    });
  });

  describe('Debug functions - Development mode', () => {
    beforeEach(() => {
      // Set development environment
      process.env.NODE_ENV = 'development';
    });

    test('debugLog doit appeler console.log en développement', () => {
      debugLog('Test message');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Test message');
    });

    test('debugLog doit gérer plusieurs arguments', () => {
      debugLog('Message', 'avec', 'plusieurs', 'args');
      expect(console.log).toHaveBeenCalledWith(
        'Message',
        'avec',
        'plusieurs',
        'args'
      );
    });

    test('debugInfo doit appeler console.info en développement', () => {
      debugInfo('Info message');
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith('Info message');
    });

    test('debugWarn doit appeler console.warn en développement', () => {
      debugWarn('Warning message');
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith('Warning message');
    });

    test('debugLog doit gérer des objets complexes', () => {
      const testObject = { key: 'value', nested: { data: 123 } };
      debugLog('Object:', testObject);
      expect(console.log).toHaveBeenCalledWith('Object:', testObject);
    });
  });

  describe('Debug functions - Production mode', () => {
    beforeEach(() => {
      // Set production environment
      process.env.NODE_ENV = 'production';
    });

    test('debugInfo ne doit PAS appeler console.info en production', () => {
      debugInfo('Info message');
      expect(console.info).not.toHaveBeenCalled();
    });

    test('debugWarn ne doit PAS appeler console.warn en production', () => {
      debugWarn('Warning message');
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('debugError ne doit PAS appeler console.error en production', () => {
      debugError('Error message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Production functions - Toujours actives', () => {
    test('prodLog doit toujours appeler console.log (dev)', () => {
      process.env.NODE_ENV = 'development';
      prodLog('Production log');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Production log');
    });

    test('prodLog doit toujours appeler console.log (prod)', () => {
      process.env.NODE_ENV = 'production';
      prodLog('Production log');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Production log');
    });

    test('prodError doit toujours appeler console.error', () => {
      process.env.NODE_ENV = 'production';
      prodError('Production error');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Production error');
    });

    test('prodWarn doit toujours appeler console.warn', () => {
      process.env.NODE_ENV = 'production';
      prodWarn('Production warning');
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith('Production warning');
    });
  });

  describe('Cas limites et edge cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('doit gérer les arguments undefined', () => {
      debugLog(undefined);
      expect(console.log).toHaveBeenCalledWith(undefined);
    });

    test('doit gérer les arguments null', () => {
      debugLog(null);
      expect(console.log).toHaveBeenCalledWith(null);
    });

    test('doit gérer les arguments vides', () => {
      debugLog();
      expect(console.log).toHaveBeenCalledWith();
    });

    test('doit gérer les erreurs comme objets', () => {
      const testError = new Error('Test error');
      debugError('Error occurred:', testError);
      expect(console.error).toHaveBeenCalledWith('Error occurred:', testError);
    });

    test('doit gérer NODE_ENV undefined comme production', () => {
      delete process.env.NODE_ENV;
      debugLog('Should not appear');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('doit gérer NODE_ENV avec des valeurs non-standard', () => {
      process.env.NODE_ENV = 'staging';
      debugLog('Should not appear in staging');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Performance et utilisation réelle', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('doit fonctionner avec de gros objets', () => {
      const bigObject = {
        data: new Array(1000).fill('test'),
        metadata: { timestamp: Date.now() },
      };

      debugLog('Big object:', bigObject);
      expect(console.log).toHaveBeenCalledWith('Big object:', bigObject);
    });

    test("doit conserver l'ordre des arguments multiples", () => {
      debugLog('First', 'Second', 'Third', 123, true, { key: 'value' });
      expect(console.log).toHaveBeenCalledWith(
        'First',
        'Second',
        'Third',
        123,
        true,
        { key: 'value' }
      );
    });
  });
});
