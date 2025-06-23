// @ts-nocheck
// firebase - PHASE 5 - Intégrations Firebase (Configuration - Simplifié)

// === MOCKS SIMPLES ===

// Mock Firebase SDK basique
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ mock: 'app' })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    settings: {
      appVerificationDisabledForTesting: true,
      testPhoneNumbers: {},
    },
  })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ mock: 'firestore' })),
  setLogLevel: jest.fn(),
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
  enablePersistentCacheIndexAutoCreation: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({ mock: 'storage' })),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({ mock: 'messaging' })),
  getToken: jest.fn(),
  onMessage: jest.fn(),
}));

// === TESTS SIMPLIFIÉS ===

describe('firebase - PHASE 5 - Intégrations Firebase', () => {
  // Mock console to avoid noise
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔧 Imports et exports de base', () => {
    test('doit importer sans erreur', () => {
      expect(() => {
        require('../firebase');
      }).not.toThrow();
    });

    test('doit exporter les services de base', () => {
      const firebase = require('../firebase');

      expect(firebase.auth).toBeDefined();
      expect(firebase.db).toBeDefined();
      // NOTE: storage désactivé pour optimisation performance
      // expect(firebase.storage).toBeDefined();
    });

    test('doit exporter appCheck comme null', () => {
      const firebase = require('../firebase');

      expect(firebase.appCheck).toBeNull();
    });
  });

  describe('🌐 Utilitaires réseau', () => {
    test('doit exporter handleNetworkChange', () => {
      const firebase = require('../firebase');

      expect(firebase.handleNetworkChange).toBeDefined();
      expect(typeof firebase.handleNetworkChange).toBe('function');
    });
  });
});
