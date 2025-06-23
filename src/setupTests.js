// @ts-nocheck
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// POLYFILL CRITIQUE : Doit être importé en premier pour éviter les erreurs undici
import 'web-streams-polyfill';

// Setup pour les tests Jest

// Mock ReadableStream pour éviter l'erreur undici
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return { read: () => Promise.resolve({ done: true }) };
    }
  };
}

// Polyfill simple pour ReadableStream
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
        cancel: () => Promise.resolve(),
      };
    }
    cancel() {
      return Promise.resolve();
    }
    pipeTo() {
      return Promise.resolve();
    }
    pipeThrough() {
      return this;
    }
    tee() {
      return [this, this];
    }
  };
}

// Polyfill pour TextEncoder/TextDecoder (requis par Firebase)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input) {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input) {
      return Buffer.from(input).toString('utf8');
    }
  };
}

// Mock pour framer-motion pour éviter les erreurs addListener
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => {
      const React = require('react');
      return React.createElement(
        'div',
        { className, style, ...props },
        children
      );
    },
    span: ({ children, className, style, ...props }) => {
      const React = require('react');
      return React.createElement(
        'span',
        { className, style, ...props },
        children
      );
    },
    button: ({ children, className, style, ...props }) => {
      const React = require('react');
      return React.createElement(
        'button',
        { className, style, ...props },
        children
      );
    },
  },
  AnimatePresence: ({ children }) => {
    const React = require('react');
    return React.createElement('div', {}, children);
  },
}));

// Polyfills pour l'environnement navigateur
if (typeof global.window === 'undefined') {
  global.window = {};
}

if (typeof global.navigator === 'undefined') {
  global.navigator = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
    language: 'fr-FR',
    languages: ['fr-FR', 'fr', 'en-US', 'en'],
    onLine: true,
    cookieEnabled: true,
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
  };
}

// Mock localStorage
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
  };
  global.localStorage = localStorageMock;
  global.window.localStorage = localStorageMock;
}

// Mock sessionStorage
if (typeof global.sessionStorage === 'undefined') {
  const sessionStorageMock = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
  };
  global.sessionStorage = sessionStorageMock;
  global.window.sessionStorage = sessionStorageMock;
}

// Mock window.confirm
global.window.confirm = jest.fn(() => true);

// Mock window.alert
global.window.alert = jest.fn();

// Mock window.addEventListener et removeEventListener
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();

// Mock document si nécessaire
if (typeof global.document === 'undefined') {
  global.document = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    createElement: jest.fn(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      style: {},
    })),
    getElementById: jest.fn(() => null),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
  };
}

// Mock pour les APIs PWA
global.window.matchMedia = jest.fn(() => ({
  matches: false,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock pour beforeinstallprompt
global.window.beforeinstallprompt = null;

// === CONFIGURATION SPÉCIALE CI/TEST ===

// Configuration améliorée pour l'environnement CI
const isTestEnv =
  process.env.CI === 'true' || process.env.JEST_WORKER_ID !== undefined;
if (isTestEnv) {
  // Mock amélioré pour window
  global.window = {
    ...global.window,
    location: {
      href: 'http://localhost:3000/test',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
    },
    navigator: {
      ...global.navigator,
      onLine: true,
      userAgent: 'CI-Test-Environment/1.0',
    },
    // Mock pour Firebase App Check
    FIREBASE_APPCHECK_DEBUG_TOKEN: true,
  };

  // Mock amélioré pour document
  const mockElement = {
    innerHTML: '',
    style: { display: 'none' },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    id: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
    },
  };

  global.document = {
    ...global.document,
    getElementById: jest.fn(id => ({
      ...mockElement,
      id,
    })),
    createElement: jest.fn(tag => ({
      ...mockElement,
      tagName: tag.toUpperCase(),
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
  };

  console.log(
    '🤖 Configuration CI/Test environment activée avec mocks complets'
  );
}
