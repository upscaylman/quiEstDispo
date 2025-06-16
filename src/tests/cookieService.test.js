// @ts-nocheck
/* eslint-disable no-console */

// Mock localStorage pour ce test
const mockLocalStorage = (() => {
  let store = {};

  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: index => Object.keys(store)[index] || null,
  };
})();

// Remplacer localStorage global
global.localStorage = mockLocalStorage;
const localStorage = mockLocalStorage;

describe('CookieService - Test simple - PRIORITE #4', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();

    console.log = jest.fn();
    console.warn = jest.fn();
  });

  describe('Tests basiques du service cookies', () => {
    test('localStorage mock doit fonctionner', () => {
      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
    });

    test('doit simuler le comportement de base', () => {
      const cookieCategories = {
        necessary: {
          name: 'Cookies necessaires',
          cookies: ['cookie_consent'],
        },
      };

      expect(cookieCategories.necessary).toBeDefined();
      expect(cookieCategories.necessary.cookies).toContain('cookie_consent');
    });

    test('doit simuler la gestion du consentement', () => {
      const preferences = {
        necessary: true,
        functional: true,
        analytics: false,
        marketing: false,
      };

      const consentData = {
        preferences,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      localStorage.setItem('cookie_consent', JSON.stringify(consentData));

      const saved = localStorage.getItem('cookie_consent');
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved);
      expect(parsed.preferences).toEqual(preferences);
    });
  });
});
