import { debugError, debugLog, debugWarn } from '../utils/logger';

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('Logger Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('debugLog', () => {
    test('should log message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      debugLog('Test message');

      expect(console.log).toHaveBeenCalledWith('Test message');

      process.env.NODE_ENV = originalEnv;
    });

    test('should not log message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      debugLog('Test message');

      expect(console.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('debugError', () => {
    test('should log error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      debugError('Test error');

      expect(console.error).toHaveBeenCalledWith('Test error');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('debugWarn', () => {
    test('should log warning in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      debugWarn('Test warning');

      expect(console.warn).toHaveBeenCalledWith('Test warning');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
