// @ts-nocheck
// Tests availabilityService.js - PHASE 2 - Logique Métier Core (Priorité HAUTE)

import { AvailabilityService } from '../services/availabilityService';

// Import du mock pour pouvoir le référencer dans les tests

// === MOCKS COMPLETS FIREBASE ===

// Mock Firebase/Firestore
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

// Mock firebaseUtils AVANT la définition
jest.mock('../services/firebaseUtils', () => ({
  db: { __mockDB: true },
  isOnline: jest.fn(() => true),
  retryWithBackoff: jest.fn(fn => fn()),
}));

describe('AvailabilityService - PHASE 2 - Logique Métier Core', () => {
  let mockFirebaseUtils;
  let firestore;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les mocks après leur définition
    mockFirebaseUtils = require('../services/firebaseUtils');
    firestore = require('firebase/firestore');

    // Reset des mocks par défaut
    mockFirebaseUtils.isOnline.mockReturnValue(true);
    firestore.serverTimestamp.mockReturnValue({ __serverTimestamp: true });

    // Mock console pour éviter les logs de test
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('⚡ Définir une disponibilité', () => {
    test.skip('doit créer une disponibilité avec succès', async () => {
      const mockAvailabilityRef = { id: 'availability-123' };
      firestore.addDoc.mockResolvedValue(mockAvailabilityRef);

      const location = { lat: 48.8566, lng: 2.3522 };
      const result = await AvailabilityService.setAvailability(
        'user-123',
        'coffee',
        location,
        {},
        45
      );

      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          activity: 'coffee',
          location,
          isActive: true,
        })
      );

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isAvailable: true,
          currentActivity: 'coffee',
          availabilityId: 'availability-123',
        })
      );

      expect(result).toBe('availability-123');
    });

    test("doit partager la localisation lors d'acceptation d'invitation", async () => {
      const mockAvailabilityRef = { id: 'availability-123' };
      firestore.addDoc.mockResolvedValue(mockAvailabilityRef);

      const location = { lat: 48.8566, lng: 2.3522 };
      const metadata = {
        isResponseToInvitation: true,
        respondingToUserId: 'friend-123',
      };

      await AvailabilityService.setAvailability(
        'user-123',
        'coffee',
        location,
        metadata,
        45
      );

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          location, // Location partagée car réponse à invitation
        })
      );
    });

    test('doit gérer le mode offline', async () => {
      mockFirebaseUtils.isOnline.mockReturnValue(false);

      const result = await AvailabilityService.setAvailability(
        'user-123',
        'coffee',
        { lat: 48.8566, lng: 2.3522 }
      );

      expect(result).toMatch(/^offline-\d+$/);
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Offline mode, creating local availability'
      );
    });

    test('doit gérer les erreurs Firebase', async () => {
      firestore.addDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        AvailabilityService.setAvailability('user-123', 'coffee', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Impossible de définir la disponibilité');
    });
  });

  describe('🛑 Arrêter une disponibilité', () => {
    test('doit arrêter une disponibilité avec succès', async () => {
      await AvailabilityService.stopAvailability(
        'user-123',
        'availability-123'
      );

      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isAvailable: false,
          currentActivity: null,
          availabilityId: null,
        })
      );
    });

    test('doit nettoyer les invitations pending', async () => {
      // Mock query pour invitations
      firestore.getDocs.mockResolvedValue({
        size: 2,
        docs: [{ ref: 'invitation-1' }, { ref: 'invitation-2' }],
      });

      await AvailabilityService.stopAvailability(
        'user-123',
        'availability-123'
      );

      expect(firestore.deleteDoc).toHaveBeenCalledTimes(3); // 1 availability + 2 invitations
    });

    test('doit gérer le mode offline', async () => {
      mockFirebaseUtils.isOnline.mockReturnValue(false);

      await AvailabilityService.stopAvailability(
        'user-123',
        'availability-123'
      );

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Offline mode, cannot stop availability'
      );
    });

    test('doit gérer les disponibilités offline', async () => {
      await AvailabilityService.stopAvailability(
        'user-123',
        'offline-123456789'
      );

      // Ne doit pas essayer de supprimer un document Firebase pour les IDs offline
      expect(firestore.deleteDoc).not.toHaveBeenCalled();
      expect(firestore.updateDoc).toHaveBeenCalled(); // Mais doit mettre à jour l'utilisateur
    });
  });

  describe('📋 Récupération de disponibilité', () => {
    test('doit récupérer une disponibilité par ID', async () => {
      const mockAvailabilityData = {
        userId: 'user-123',
        activity: 'coffee',
        location: { lat: 48.8566, lng: 2.3522 },
        isActive: true,
      };

      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAvailabilityData,
      });

      const result =
        await AvailabilityService.getAvailability('availability-123');

      expect(firestore.getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockAvailabilityData);
    });

    test('doit retourner null si disponibilité non trouvée', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result =
        await AvailabilityService.getAvailability('availability-123');

      expect(result).toBeNull();
    });
  });

  describe('👥 Amis disponibles', () => {
    test('doit écouter les amis disponibles', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      firestore.onSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = AvailabilityService.onAvailableFriends(
        'user-123',
        mockCallback
      );

      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    test('doit créer un listener pour les amis disponibles', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      firestore.onSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = AvailabilityService.listenToAvailableFriends(
        'user-123',
        mockCallback
      );

      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('🤝 Réponses aux invitations', () => {
    test('doit marquer comme rejoint par un ami', async () => {
      await AvailabilityService.markAsJoinedByFriend(
        'availability-123',
        'friend-123'
      );

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          joinedByFriend: 'friend-123',
        })
      );
    });

    test('doit terminer une activité', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user-123',
          joinedByFriend: 'friend-123',
        }),
      });

      await AvailabilityService.terminateActivity(
        'availability-123',
        'user-123'
      );

      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isAvailable: false,
          currentActivity: null,
        })
      );
    });
  });

  describe('🧹 Nettoyage', () => {
    test('doit nettoyer les réponses inactives', async () => {
      const mockOldResponses = [
        {
          id: 'response-1',
          data: () => ({
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          }),
        },
        {
          id: 'response-2',
          data: () => ({ createdAt: new Date(Date.now() - 30 * 60 * 1000) }),
        },
      ];

      firestore.getDocs.mockResolvedValue({
        docs: mockOldResponses,
      });

      await AvailabilityService.cleanupInactiveResponses();

      expect(firestore.getDocs).toHaveBeenCalled();
      expect(firestore.deleteDoc).toHaveBeenCalledTimes(1); // Seule la réponse > 1h supprimée
    });

    test('doit nettoyer les réponses pour des activités spécifiques', async () => {
      const mockResponses = [{ ref: 'response-1' }, { ref: 'response-2' }];

      firestore.getDocs.mockResolvedValue({
        docs: mockResponses,
      });

      await AvailabilityService.cleanupResponsesForActivities([
        'activity-1',
        'activity-2',
      ]);

      expect(firestore.deleteDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe("🚨 Gestion d'erreurs", () => {
    test("doit gérer les erreurs lors de l'arrêt", async () => {
      firestore.deleteDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        AvailabilityService.stopAvailability('user-123', 'availability-123')
      ).rejects.toThrow("Impossible d'arrêter la disponibilité");
    });

    test('doit gérer les erreurs de connexion', async () => {
      mockFirebaseUtils.retryWithBackoff.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        AvailabilityService.setAvailability('user-123', 'coffee', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('📍 Partage de localisation', () => {
    test("doit partager la localisation lors de l'acceptation", async () => {
      await AvailabilityService.shareLocationOnAcceptance('user-123');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          shareLocation: true,
        })
      );
    });
  });

  describe('🔄 Fonctionnalités avancées', () => {
    test("doit enregistrer une réponse d'activité", async () => {
      const mockResponseRef = { id: 'response-123' };
      firestore.addDoc.mockResolvedValue(mockResponseRef);

      const result = await AvailabilityService.recordActivityResponse(
        'user-123',
        'activity-123',
        'accepted'
      );

      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          activityId: 'activity-123',
          responseType: 'accepted',
        })
      );

      expect(result).toBe('response-123');
    });

    test("doit notifier les amis d'une activité", async () => {
      // Mock des amis
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: ['friend-1', 'friend-2'] }),
      });

      await AvailabilityService.notifyFriends('user-123', 'coffee');

      expect(firestore.getDoc).toHaveBeenCalled();
      // La notification serait gérée par un service externe
    });
  });
});
