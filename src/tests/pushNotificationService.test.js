// @ts-nocheck
// Tests PushNotificationService - PRIORITÉ BASSE - Services métier
import { PushNotificationService } from '../services/pushNotificationService';

// Mock Firebase Messaging
jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({ __type: 'messaging' })),
  getToken: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase', () => ({
  app: { __type: 'app' },
  messaging: { __type: 'messaging' },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  debugError: jest.fn(),
  debugLog: jest.fn(),
  debugWarn: jest.fn(),
  prodError: jest.fn(),
  prodWarn: jest.fn(),
}));

describe('PushNotificationService - Gestion notifications push', () => {
  let originalNavigator;
  let originalWindow;
  let originalNotification;

  beforeEach(() => {
    jest.clearAllMocks();

    // Sauvegarder les originaux
    originalNavigator = global.navigator;
    originalWindow = global.window;
    originalNotification = global.Notification;

    // Mock navigator pour différents scénarios
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      serviceWorker: {
        ready: Promise.resolve({
          showNotification: jest.fn(),
        }),
      },
    };

    // Mock window
    global.window = {
      Notification: jest.fn(),
      PushManager: jest.fn(),
    };

    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn(),
    };

    // Mock process.env
    process.env.REACT_APP_VAPID_KEY = 'test-vapid-key';

    // IMPORTANT: Mock isSupported pour éviter les erreurs
    PushNotificationService.isSupported = true;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
    global.Notification = originalNotification;
    delete process.env.REACT_APP_VAPID_KEY;
  });

  describe('🔍 Détection du support', () => {
    test.skip('doit détecter le support des notifications', () => {
      const support = PushNotificationService.checkNotificationSupport();

      expect(support).toEqual({
        notifications: true,
        serviceWorker: true,
        pushManager: true,
      });
    });

    test('doit détecter mobile via user agent', () => {
      global.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)';

      const isMobile = PushNotificationService.isMobile();
      expect(isMobile).toBe(true);
    });

    test('doit détecter desktop via user agent', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      const isMobile = PushNotificationService.isMobile();
      expect(isMobile).toBe(false);
    });
  });

  describe('📱 Gestion des permissions', () => {
    test('doit demander permission avec succès', async () => {
      global.Notification.requestPermission.mockResolvedValue('granted');

      const result = await PushNotificationService.requestPermission();

      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(result).toEqual({
        permission: 'granted',
        granted: true,
        denied: false,
        default: false,
      });
    });

    test('doit gérer permission refusée', async () => {
      global.Notification.requestPermission.mockResolvedValue('denied');

      const result = await PushNotificationService.requestPermission();

      expect(result).toEqual({
        permission: 'denied',
        granted: false,
        denied: true,
        default: false,
      });
    });

    test('doit gérer navigateur non supporté', async () => {
      delete global.window.Notification;

      const result = await PushNotificationService.requestPermission();

      expect(result).toEqual({
        permission: 'denied',
        granted: false,
        denied: true,
        default: false,
        error: 'Ce navigateur ne supporte pas les notifications',
      });
    });
  });

  describe('🔥 Token Firebase', () => {
    test('doit obtenir token Firebase avec VAPID key', async () => {
      const { getToken } = require('firebase/messaging');
      getToken.mockResolvedValue('test-firebase-token');

      const result = await PushNotificationService.getFirebaseToken();

      expect(getToken).toHaveBeenCalledWith(expect.any(Object), {
        vapidKey: 'test-vapid-key',
      });
      expect(result).toEqual({
        token: 'test-firebase-token',
        subscribed: true,
        localOnly: false,
      });
    });

    test('doit gérer absence de VAPID key', async () => {
      delete process.env.REACT_APP_VAPID_KEY;

      const result = await PushNotificationService.getFirebaseToken();

      expect(result).toEqual({
        token: null,
        subscribed: false,
        localOnly: true,
      });
    });

    test('doit gérer erreur Firebase', async () => {
      const { getToken } = require('firebase/messaging');
      getToken.mockRejectedValue(new Error('Firebase error'));

      const result = await PushNotificationService.getFirebaseToken();

      expect(result).toEqual({
        token: null,
        subscribed: false,
        localOnly: true,
        error: 'Firebase error',
      });
    });
  });

  describe('📱 Notifications locales', () => {
    test('doit activer notifications locales avec succès', async () => {
      global.Notification.requestPermission.mockResolvedValue('granted');

      const result = await PushNotificationService.enableLocalNotifications();

      expect(result).toEqual({
        success: true,
        permission: 'granted',
      });
    });

    test('doit gérer permission refusée pour notifications locales', async () => {
      global.Notification.requestPermission.mockResolvedValue('denied');

      const result = await PushNotificationService.enableLocalNotifications();

      expect(result).toEqual({
        success: false,
        permission: 'denied',
      });
    });
  });

  describe('📊 Vérification du statut', () => {
    test('doit vérifier statut avec permission accordée', async () => {
      global.Notification.permission = 'granted';
      const { getToken } = require('firebase/messaging');
      getToken.mockResolvedValue('test-token');

      const result = await PushNotificationService.checkStatus();

      expect(result).toEqual(
        expect.objectContaining({
          supported: true,
          permission: 'granted',
          subscribed: true,
          support: expect.any(Object),
        })
      );
    });

    test('doit vérifier statut avec permission refusée', async () => {
      global.Notification.permission = 'denied';

      const result = await PushNotificationService.checkStatus();

      expect(result).toEqual(
        expect.objectContaining({
          supported: true,
          permission: 'denied',
          subscribed: false,
        })
      );
    });
  });

  describe('🔔 Envoi de notifications', () => {
    test.skip('doit envoyer notification test via Service Worker', async () => {
      // Mock toutes les propriétés de Notification
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'granted',
      });

      const mockShowNotification = jest.fn();
      global.navigator.serviceWorker.ready = Promise.resolve({
        showNotification: mockShowNotification,
      });

      await PushNotificationService.showTestNotification(
        'Test Title',
        'Test Body',
        { tag: 'test' }
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'test',
        })
      );
    });

    test('ne doit pas envoyer si permission refusée', async () => {
      // Mock permission refusée
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'denied',
      });

      const result = await PushNotificationService.showTestNotification(
        'Test',
        'Test'
      );

      expect(result).toBeUndefined();
    });
  });

  describe('🧪 Tests end-to-end simulés', () => {
    test('doit gérer workflow complet de notifications', async () => {
      // 1. Vérifier support
      const support = PushNotificationService.checkNotificationSupport();
      expect(support.notifications).toBe(true);

      // 2. Demander permission
      global.Notification.requestPermission.mockResolvedValue('granted');
      const permission = await PushNotificationService.requestPermission();
      expect(permission.granted).toBe(true);

      // 3. Obtenir token Firebase
      const { getToken } = require('firebase/messaging');
      getToken.mockResolvedValue('firebase-token');
      const tokenResult = await PushNotificationService.getFirebaseToken();
      expect(tokenResult.subscribed).toBe(true);

      // 4. Vérifier statut final
      global.Notification.permission = 'granted';
      const status = await PushNotificationService.checkStatus();
      expect(status.subscribed).toBe(true);
    });
  });
});
