// @ts-nocheck
// Tests UpdateNotification - Phase 3 UI Complexe - SYSTÈME NOTIFICATIONS MAJ
import { render } from '@testing-library/react';
import UpdateNotification from '../components/UpdateNotification';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon" />,
  X: () => <div data-testid="close-icon" />,
}));

describe('UpdateNotification - Notifications de mise à jour', () => {
  beforeEach(() => {
    // Mock navigator avec service worker basique
    global.navigator = {
      serviceWorker: {
        ready: Promise.resolve({
          addEventListener: jest.fn(),
          update: jest.fn().mockResolvedValue(),
          active: { postMessage: jest.fn() },
        }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };

    // Mock document
    global.document = {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🎨 Rendu de base', () => {
    test('doit se rendre sans erreur', () => {
      expect(() => {
        render(<UpdateNotification />);
      }).not.toThrow();
    });

    test("doit gérer l'absence de service worker", () => {
      delete global.navigator.serviceWorker;

      expect(() => {
        render(<UpdateNotification />);
      }).not.toThrow();
    });
  });
});
