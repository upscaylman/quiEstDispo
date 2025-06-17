// @ts-nocheck
// Tests AppCheckService - PHASE 2 - Logique Métier Core
import { AppCheckService } from '../services/appCheckService';

// Mock Firebase App Check
jest.mock('firebase/app-check', () => ({
  getToken: jest.fn(),
  getLimitedUseToken: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase', () => ({
  appCheck: { __type: 'appCheck' },
}));

// === MOCKS COMPLETS ===
const mockTokenResponse = {
  token: 'mock-app-check-token',
};

const mockLimitedTokenResponse = {
  token: 'mock-limited-token',
};

// Mock fetch global
global.fetch = jest.fn();

// Récupérer le mock pour les tests
const mockAppCheck = require('../firebase').appCheck;

describe('AppCheckService - PHASE 2 - Services App Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🔐 Token Management', () => {
    test('doit obtenir un token App Check standard', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const token = await AppCheckService.getAppCheckToken();

      expect(getToken).toHaveBeenCalledWith(mockAppCheck, false);
      expect(token).toBe('mock-app-check-token');
    });

    test('doit obtenir un token App Check avec forceRefresh', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const token = await AppCheckService.getAppCheckToken(true);

      expect(getToken).toHaveBeenCalledWith(mockAppCheck, true);
      expect(token).toBe('mock-app-check-token');
    });

    test('doit obtenir un token App Check à usage limité', async () => {
      const { getLimitedUseToken } = require('firebase/app-check');
      getLimitedUseToken.mockResolvedValue(mockLimitedTokenResponse);

      const token = await AppCheckService.getLimitedUseAppCheckToken();

      expect(getLimitedUseToken).toHaveBeenCalledWith(mockAppCheck);
      expect(token).toBe('mock-limited-token');
    });

    test.skip('doit retourner null si App Check non initialisé', async () => {
      // Mock appCheck null
      jest.doMock('../firebase', () => ({
        appCheck: null,
      }));

      const token = await AppCheckService.getAppCheckToken();

      expect(token).toBe(null);
      expect(console.warn).toHaveBeenCalledWith('⚠️ App Check non initialisé');
    });

    test('doit gérer les erreurs de token standard', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockRejectedValue(new Error('Token error'));

      const token = await AppCheckService.getAppCheckToken();

      expect(token).toBe(null);
      expect(console.warn).toHaveBeenCalledWith(
        '❌ Échec obtention jeton App Check:',
        expect.any(Error)
      );
    });

    test('doit gérer les erreurs de token limité', async () => {
      const { getLimitedUseToken } = require('firebase/app-check');
      getLimitedUseToken.mockRejectedValue(new Error('Limited token error'));

      const token = await AppCheckService.getLimitedUseAppCheckToken();

      expect(token).toBe(null);
      expect(console.warn).toHaveBeenCalledWith(
        '❌ Échec obtention jeton App Check limité:',
        expect.any(Error)
      );
    });

    test('doit logger en mode développement', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      await AppCheckService.getAppCheckToken();

      expect(console.log).toHaveBeenCalledWith('🔐 App Check token obtained');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('🔒 Secure Headers', () => {
    test('doit créer des en-têtes sécurisés avec token standard', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const headers = await AppCheckService.createSecureHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': 'mock-app-check-token',
      });
    });

    test('doit créer des en-têtes sécurisés avec token limité', async () => {
      const { getLimitedUseToken } = require('firebase/app-check');
      getLimitedUseToken.mockResolvedValue(mockLimitedTokenResponse);

      const headers = await AppCheckService.createSecureHeaders(true);

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': 'mock-limited-token',
      });
    });

    test('doit créer des en-têtes avec en-têtes additionnels', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const additionalHeaders = {
        Authorization: 'Bearer custom-token',
        'Custom-Header': 'value',
      };

      const headers = await AppCheckService.createSecureHeaders(
        false,
        additionalHeaders
      );

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer custom-token',
        'Custom-Header': 'value',
        'X-Firebase-AppCheck': 'mock-app-check-token',
      });
    });

    test('doit créer des en-têtes sans token si obtention échoue', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(null);

      jest.spyOn(AppCheckService, 'getAppCheckToken').mockResolvedValue(null);

      const headers = await AppCheckService.createSecureHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('🌐 Secure API Calls', () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn(() => Promise.resolve({ success: true })),
    };

    test.skip('doit effectuer un appel API sécurisé', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);
      fetch.mockResolvedValue(mockResponse);

      const response = await AppCheckService.secureApiCall('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'Content-Type': 'application/json',
          'X-Firebase-AppCheck': 'mock-app-check-token',
        },
      });
      expect(response).toBe(mockResponse);
    });

    test('doit effectuer un appel API avec token limité', async () => {
      const { getLimitedUseToken } = require('firebase/app-check');
      getLimitedUseToken.mockResolvedValue(mockLimitedTokenResponse);
      fetch.mockResolvedValue(mockResponse);

      await AppCheckService.secureApiCall('/api/test', {}, true);

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'X-Firebase-AppCheck': 'mock-limited-token',
        },
      });
    });

    test("doit gérer les erreurs d'API (404)", async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const errorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
      fetch.mockResolvedValue(errorResponse);

      await expect(
        AppCheckService.secureApiCall('/api/nonexistent')
      ).rejects.toThrow('API call failed: 404 Not Found');
    });

    test('doit gérer les erreurs réseau', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const networkError = new Error('Network error');
      fetch.mockRejectedValue(networkError);

      await expect(AppCheckService.secureApiCall('/api/test')).rejects.toThrow(
        'Network error'
      );
      expect(console.error).toHaveBeenCalledWith(
        '❌ Secure API call failed:',
        networkError
      );
    });
  });

  describe('🔧 Protected Endpoints', () => {
    test.skip('doit appeler un endpoint protégé avec GET', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const mockResponse = {
        ok: true,
        json: jest.fn(() => Promise.resolve({ data: 'test' })),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await AppCheckService.callProtectedEndpoint('/users');

      expect(fetch).toHaveBeenCalledWith(
        'https://yourbackend.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Firebase-AppCheck': 'mock-app-check-token',
          }),
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    test.skip('doit appeler un endpoint protégé avec POST', async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const mockResponse = {
        ok: true,
        json: jest.fn(() => Promise.resolve({ created: true })),
      };
      fetch.mockResolvedValue(mockResponse);

      const postData = { name: 'Test User' };
      const result = await AppCheckService.callProtectedEndpoint(
        '/users',
        postData
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://yourbackend.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'X-Firebase-AppCheck': 'mock-app-check-token',
          }),
        })
      );
      expect(result).toEqual({ created: true });
    });

    test("doit gérer les erreurs d'endpoint protégé", async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const errorResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      };
      fetch.mockResolvedValue(errorResponse);

      await expect(
        AppCheckService.callProtectedEndpoint('/admin')
      ).rejects.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        '❌ Protected endpoint call failed:',
        expect.any(Error)
      );
    });
  });

  describe('🔍 Utility Functions', () => {
    test('doit vérifier si App Check est disponible', async () => {
      jest
        .spyOn(AppCheckService, 'getAppCheckToken')
        .mockResolvedValue('token');

      const isAvailable = await AppCheckService.isAppCheckAvailable();

      expect(isAvailable).toBe(true);
    });

    test('doit retourner false si App Check indisponible', async () => {
      jest.spyOn(AppCheckService, 'getAppCheckToken').mockResolvedValue(null);

      const isAvailable = await AppCheckService.isAppCheckAvailable();

      expect(isAvailable).toBe(false);
    });

    test.skip("doit forcer l'actualisation du token", async () => {
      const { getToken } = require('firebase/app-check');
      getToken.mockResolvedValue(mockTokenResponse);

      const token = await AppCheckService.refreshAppCheckToken();

      expect(getToken).toHaveBeenCalledWith(mockAppCheck, true);
      expect(token).toBe('mock-app-check-token');
    });
  });

  describe('🔧 Edge Cases', () => {
    test.skip("doit gérer l'absence totale d'App Check", async () => {
      jest.doMock('../firebase', () => ({
        appCheck: undefined,
      }));

      const token = await AppCheckService.getAppCheckToken();
      const limitedToken = await AppCheckService.getLimitedUseAppCheckToken();
      const isAvailable = await AppCheckService.isAppCheckAvailable();

      expect(token).toBe(null);
      expect(limitedToken).toBe(null);
      expect(isAvailable).toBe(false);
    });

    test('doit continuer sans App Check si non configuré', async () => {
      jest.spyOn(AppCheckService, 'getAppCheckToken').mockResolvedValue(null);

      const mockResponse = {
        ok: true,
        json: jest.fn(() => Promise.resolve({ data: 'test' })),
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await AppCheckService.secureApiCall('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          // Pas de header App Check
        },
      });
      expect(response).toBe(mockResponse);
    });
  });
});
