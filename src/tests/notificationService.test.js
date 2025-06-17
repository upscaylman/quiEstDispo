// @ts-nocheck
// Tests NotificationService - PRIORITÉ BASSE - Services métier
import { NotificationService } from '../services/notificationService';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __type: 'timestamp' })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

// Mock Firebase utils
jest.mock('../services/firebaseUtils', () => ({
  db: { __type: 'firestore' },
  isOnline: jest.fn(() => true),
  retryWithBackoff: jest.fn(fn => fn()),
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  debugLog: jest.fn(),
  prodError: jest.fn(),
}));

describe('NotificationService - Gestion notifications Firestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔔 Écoute des notifications', () => {
    test('doit configurer un listener pour les notifications', () => {
      const {
        onSnapshot,
        query,
        collection,
        where,
        orderBy,
      } = require('firebase/firestore');
      const { db } = require('../services/firebaseUtils');
      const callback = jest.fn();
      const unsubscribe = jest.fn();

      onSnapshot.mockReturnValue(unsubscribe);
      query.mockReturnValue({ __type: 'query' });
      collection.mockReturnValue({ __type: 'collection' });
      where.mockReturnValue({ __type: 'where' });
      orderBy.mockReturnValue({ __type: 'orderBy' });

      const result = NotificationService.onNotifications('user123', callback);

      expect(collection).toHaveBeenCalledWith(db, 'notifications');
      expect(where).toHaveBeenCalledWith('to', '==', 'user123');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(query).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    test('doit traiter les notifications reçues via onSnapshot', () => {
      const { onSnapshot } = require('firebase/firestore');
      const callback = jest.fn();

      // Mock snapshot avec notifications
      const mockSnapshot = {
        size: 2,
        docs: [
          {
            id: 'notif1',
            data: () => ({
              type: 'friend_invitation',
              message: 'Invitation reçue',
              read: false,
              createdAt: { toDate: () => new Date('2023-01-01') },
            }),
          },
          {
            id: 'notif2',
            data: () => ({
              type: 'activity_update',
              message: 'Activité mise à jour',
              read: true,
              createdAt: { toDate: () => new Date('2023-01-02') },
            }),
          },
        ],
      };

      onSnapshot.mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return jest.fn();
      });

      NotificationService.onNotifications('user123', callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'notif2',
          type: 'activity_update',
          message: 'Activité mise à jour',
          read: true,
        }),
        expect.objectContaining({
          id: 'notif1',
          type: 'friend_invitation',
          message: 'Invitation reçue',
          read: false,
        }),
      ]);
    });

    test('doit gérer les erreurs onSnapshot', () => {
      const { onSnapshot } = require('firebase/firestore');
      const callback = jest.fn();

      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      NotificationService.onNotifications('user123', callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    test('doit retourner fonction vide en mode offline', () => {
      const { isOnline } = require('../services/firebaseUtils');
      isOnline.mockReturnValue(false);
      const callback = jest.fn();

      const result = NotificationService.onNotifications('user123', callback);

      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof result).toBe('function');
    });
  });

  describe('📖 Marquer comme lu', () => {
    test('doit marquer une notification comme lue', async () => {
      const { updateDoc, doc, serverTimestamp } = require('firebase/firestore');
      const { db, retryWithBackoff } = require('../services/firebaseUtils');

      doc.mockReturnValue({ __type: 'docRef' });
      retryWithBackoff.mockImplementation(async fn => await fn());

      await NotificationService.markAsRead('notif123');

      expect(doc).toHaveBeenCalledWith(db, 'notifications', 'notif123');
      expect(retryWithBackoff).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        { __type: 'docRef' },
        {
          read: true,
          updatedAt: { __type: 'timestamp' },
        }
      );
    });

    test('ne doit pas marquer comme lu en mode offline', async () => {
      const { isOnline } = require('../services/firebaseUtils');
      const { updateDoc } = require('firebase/firestore');
      isOnline.mockReturnValue(false);

      await NotificationService.markAsRead('notif123');

      expect(updateDoc).not.toHaveBeenCalled();
    });

    test('doit gérer les erreurs lors du marquage', async () => {
      const { retryWithBackoff } = require('../services/firebaseUtils');
      const { prodError } = require('../utils/logger');

      retryWithBackoff.mockRejectedValue(new Error('Update failed'));

      await NotificationService.markAsRead('notif123');

      expect(prodError).toHaveBeenCalledWith(
        'Warning: Could not mark notification as read:',
        expect.any(Error)
      );
    });
  });

  describe('📖 Marquer toutes comme lues', () => {
    test('doit marquer toutes les notifications comme lues', async () => {
      const {
        getDocs,
        query,
        collection,
        where,
        updateDoc,
      } = require('firebase/firestore');
      const { db, retryWithBackoff } = require('../services/firebaseUtils');

      const mockQuerySnapshot = {
        empty: false,
        docs: [{ ref: { __type: 'docRef1' } }, { ref: { __type: 'docRef2' } }],
      };

      query.mockReturnValue({ __type: 'query' });
      getDocs.mockResolvedValue(mockQuerySnapshot);
      retryWithBackoff.mockImplementation(async fn => await fn());

      await NotificationService.markAllAsRead('user123');

      expect(collection).toHaveBeenCalledWith(db, 'notifications');
      expect(where).toHaveBeenCalledWith('to', '==', 'user123');
      expect(where).toHaveBeenCalledWith('read', '==', false);
      expect(getDocs).toHaveBeenCalled();
      expect(retryWithBackoff).toHaveBeenCalledTimes(2); // Une fois par notification
    });

    test('ne doit rien faire si aucune notification non lue', async () => {
      const { getDocs } = require('firebase/firestore');
      const { updateDoc } = require('firebase/firestore');

      getDocs.mockResolvedValue({ empty: true, docs: [] });

      await NotificationService.markAllAsRead('user123');

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('✉️ Création de notifications', () => {
    test('doit créer une notification générique', async () => {
      const {
        addDoc,
        collection,
        serverTimestamp,
      } = require('firebase/firestore');
      const { db, retryWithBackoff } = require('../services/firebaseUtils');

      addDoc.mockResolvedValue({ id: 'new-notif-id' });
      retryWithBackoff.mockImplementation(async fn => await fn());

      const result = await NotificationService.createNotification(
        'user123',
        'user456',
        'friend_invitation',
        'Nouvelle invitation',
        { extra: 'data' }
      );

      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object), // collection
        {
          to: 'user123',
          from: 'user456',
          type: 'friend_invitation',
          message: 'Nouvelle invitation',
          data: { extra: 'data' },
          read: false,
          createdAt: { __type: 'timestamp' },
        }
      );
      expect(result).toEqual({ success: true, id: 'new-notif-id' });
    });

    test('doit gérer les erreurs lors de la création', async () => {
      const { retryWithBackoff } = require('../services/firebaseUtils');

      retryWithBackoff.mockRejectedValue(new Error('Creation failed'));

      const result = await NotificationService.createNotification(
        'user123',
        'user456',
        'test',
        'Message'
      );

      expect(result).toEqual({ success: false, error: 'Creation failed' });
    });

    test('ne doit pas créer en mode offline', async () => {
      const { isOnline } = require('../services/firebaseUtils');
      const { addDoc } = require('firebase/firestore');
      isOnline.mockReturnValue(false);

      const result = await NotificationService.createNotification(
        'user123',
        'user456',
        'test',
        'Message'
      );

      expect(addDoc).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: 'Mode hors ligne' });
    });
  });

  describe('🗑️ Suppression de notifications', () => {
    test('doit supprimer une notification', async () => {
      const { deleteDoc, doc } = require('firebase/firestore');
      const { db, retryWithBackoff } = require('../services/firebaseUtils');

      doc.mockReturnValue({ __type: 'docRef' });
      retryWithBackoff.mockImplementation(async fn => await fn());

      await NotificationService.deleteNotification('notif123');

      expect(doc).toHaveBeenCalledWith(db, 'notifications', 'notif123');
      expect(deleteDoc).toHaveBeenCalledWith({ __type: 'docRef' });
    });

    test('ne doit pas supprimer en mode offline', async () => {
      const { isOnline } = require('../services/firebaseUtils');
      const { deleteDoc } = require('firebase/firestore');
      isOnline.mockReturnValue(false);

      await NotificationService.deleteNotification('notif123');

      expect(deleteDoc).not.toHaveBeenCalled();
    });
  });

  describe("🧪 Tests d'intégration simulés", () => {
    test('doit gérer un workflow complet de notification', async () => {
      const { onSnapshot, addDoc, updateDoc } = require('firebase/firestore');
      const { retryWithBackoff } = require('../services/firebaseUtils');

      // Setup mocks
      retryWithBackoff.mockImplementation(async fn => await fn());
      addDoc.mockResolvedValue({ id: 'notif-123' });
      onSnapshot.mockImplementation((query, callback) => {
        // Simuler réception de notification
        setTimeout(() => {
          callback({
            size: 1,
            docs: [
              {
                id: 'notif-123',
                data: () => ({
                  type: 'friend_invitation',
                  message: 'Test notification',
                  read: false,
                  createdAt: { toDate: () => new Date() },
                }),
              },
            ],
          });
        }, 10);
        return jest.fn();
      });

      // 1. Créer une notification
      const createResult = await NotificationService.createNotification(
        'user123',
        'user456',
        'friend_invitation',
        'Test notification'
      );
      expect(createResult.success).toBe(true);

      // 2. Écouter les notifications
      const callback = jest.fn();
      const unsubscribe = NotificationService.onNotifications(
        'user123',
        callback
      );

      // Attendre le callback
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(callback).toHaveBeenCalled();

      // 3. Marquer comme lu
      await NotificationService.markAsRead('notif-123');
      expect(updateDoc).toHaveBeenCalled();

      // Nettoyer
      unsubscribe();
    });
  });
});
