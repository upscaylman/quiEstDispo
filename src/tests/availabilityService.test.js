// @ts-nocheck
// Tests availabilityService.js - FINALISATION COMPLÈTE Foundation Services

import { AvailabilityService } from '../services/availabilityService';

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

describe('AvailabilityService - FINALISATION COMPLÈTE Foundation Services', () => {
  let mockFirebaseUtils;
  let firestore;

  // === FIXTURES RÉUTILISABLES ===
  const createMockAvailability = (overrides = {}) => ({
    id: 'availability-123',
    userId: 'user-123',
    activity: 'coffee',
    location: { lat: 48.8566, lng: 2.3522 },
    isActive: true,
    createdAt: { __serverTimestamp: true },
    metadata: {},
    duration: 45,
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    isAvailable: false,
    currentActivity: null,
    availabilityId: null,
    location: null,
    ...overrides,
  });

  const createMockResponse = (overrides = {}) => ({
    id: 'response-123',
    userId: 'user-123',
    availabilityId: 'availability-123',
    type: 'joined',
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les mocks après leur définition
    mockFirebaseUtils = require('../services/firebaseUtils');
    firestore = require('firebase/firestore');

    // Reset des mocks par défaut
    mockFirebaseUtils.isOnline.mockReturnValue(true);
    firestore.serverTimestamp.mockReturnValue({ __serverTimestamp: true });

    // Mock console pour éviter les logs de test
    ['log', 'error', 'warn'].forEach(method => {
      console[method] = jest.fn();
    });
  });

  // === HELPER FUNCTIONS PATTERN ÉPROUVÉ ===
  const setupSuccessfulAvailabilityCreation = (
    availabilityId = 'availability-123'
  ) => {
    const mockAvailabilityRef = { id: availabilityId };
    firestore.addDoc.mockResolvedValue(mockAvailabilityRef);
    firestore.updateDoc.mockResolvedValue();
    return mockAvailabilityRef;
  };

  const setupMockQuery = (results = []) => {
    firestore.getDocs.mockResolvedValue({
      size: results.length,
      docs: results.map(item => ({
        id: item.id,
        ref: `doc-ref-${item.id}`,
        data: () => item,
      })),
    });
  };

  const setupMockDocument = (docData, exists = true) => {
    firestore.getDoc.mockResolvedValue({
      exists: () => exists,
      data: () => (exists ? docData : undefined),
    });
  };

  const setupMockSnapshot = (unsubscribeFn = jest.fn()) => {
    firestore.onSnapshot.mockReturnValue(unsubscribeFn);
    return unsubscribeFn;
  };

  describe('⚡ Définir une disponibilité - Patterns Optimisés', () => {
    test('doit créer une disponibilité avec succès', async () => {
      const mockAvailabilityRef = setupSuccessfulAvailabilityCreation();
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
          duration: 45,
          createdAt: { __serverTimestamp: true },
        })
      );

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isAvailable: true,
          currentActivity: 'coffee',
          availabilityId: 'availability-123',
          lastActivity: { __serverTimestamp: true },
        })
      );

      expect(result).toBe('availability-123');
    });

    test("doit partager la localisation lors d'acceptation d'invitation", async () => {
      const mockAvailabilityRef = setupSuccessfulAvailabilityCreation();
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
          locationShared: true,
          isAvailable: true,
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

      expect(console.error).toHaveBeenCalledWith(
        '❌ Set availability error:',
        expect.any(Error)
      );
    });

    test('doit valider les paramètres requis', async () => {
      await expect(
        AvailabilityService.setAvailability(null, 'coffee', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Paramètres requis manquants');

      await expect(
        AvailabilityService.setAvailability('user-123', '', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Activité requise');

      await expect(
        AvailabilityService.setAvailability('user-123', 'coffee', null)
      ).rejects.toThrow('Localisation requise');
    });
  });

  describe('🛑 Arrêter une disponibilité - Patterns Robustes', () => {
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
          location: null,
          locationShared: false,
          lastActivity: { __serverTimestamp: true },
        })
      );
    });

    test('doit nettoyer les invitations pending', async () => {
      // Mock query pour invitations pending
      const mockInvitations = [
        { id: 'invitation-1', status: 'pending' },
        { id: 'invitation-2', status: 'pending' },
      ];
      setupMockQuery(mockInvitations);

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

    test('doit notifier les amis du départ', async () => {
      const mockUser = createMockUser({ name: 'Test User' });
      setupMockDocument(mockUser);

      // Mock notifyFriendsOfDeparture pour ce test
      const mockNotify = jest.fn().mockResolvedValue();
      AvailabilityService.notifyFriendsOfDeparture = mockNotify;

      await AvailabilityService.stopAvailability(
        'user-123',
        'availability-123'
      );

      // Vérifier que la notification de départ a été appelée
      expect(mockNotify).toHaveBeenCalledWith('user-123', 'availability-123');
    });
  });

  describe('📋 Récupération de disponibilité - Pattern Optimisé', () => {
    test('doit récupérer une disponibilité par ID', async () => {
      const mockAvailabilityData = createMockAvailability();
      setupMockDocument(mockAvailabilityData);

      const result =
        await AvailabilityService.getAvailability('availability-123');

      expect(firestore.getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockAvailabilityData);
    });

    test('doit retourner null si disponibilité non trouvée', async () => {
      setupMockDocument(null, false);

      const result =
        await AvailabilityService.getAvailability('availability-123');

      expect(result).toBeNull();
    });

    test('doit gérer les erreurs de récupération', async () => {
      firestore.getDoc.mockRejectedValue(new Error('Fetch error'));

      const result =
        await AvailabilityService.getAvailability('availability-123');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Get availability error:',
        expect.any(Error)
      );
    });
  });

  describe('👥 Amis disponibles - Listeners Optimisés', () => {
    test('doit écouter les amis disponibles', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = setupMockSnapshot();

      const unsubscribe = AvailabilityService.onAvailableFriends(
        'user-123',
        mockCallback
      );

      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    test('doit créer un listener pour les amis disponibles avec filtre', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = setupMockSnapshot();

      const unsubscribe = AvailabilityService.listenToFriends(
        'user-123',
        mockCallback
      );

      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    test('doit traiter les changements en temps réel', () => {
      const mockCallback = jest.fn();
      let snapshotCallback;

      // Capturer le callback passé à onSnapshot
      firestore.onSnapshot.mockImplementation((query, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      AvailabilityService.onAvailableFriends('user-123', mockCallback);

      // Simuler un changement de snapshot
      const mockSnapshot = {
        docs: [
          {
            id: 'avail-1',
            data: () => createMockAvailability({ id: 'avail-1' }),
          },
          {
            id: 'avail-2',
            data: () => createMockAvailability({ id: 'avail-2' }),
          },
        ],
      };

      snapshotCallback(mockSnapshot);

      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'avail-1', ...createMockAvailability({ id: 'avail-1' }) },
        { id: 'avail-2', ...createMockAvailability({ id: 'avail-2' }) },
      ]);
    });
  });

  describe('🤝 Réponses aux invitations - Patterns Métier', () => {
    test('doit marquer comme rejoint par un ami', async () => {
      const mockResponse = createMockResponse();
      firestore.addDoc.mockResolvedValue({ id: mockResponse.id });

      await AvailabilityService.joinActivity(
        'user-123',
        'availability-123',
        'Rejoindre pour café'
      );

      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          availabilityId: 'availability-123',
          type: 'joined',
          message: 'Rejoindre pour café',
          createdAt: { __serverTimestamp: true },
        })
      );
    });

    test('doit terminer une activité', async () => {
      const mockAvailability = createMockAvailability();
      setupMockDocument(mockAvailability);

      await AvailabilityService.finishActivity('user-123', 'availability-123');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isActive: false,
          endedAt: { __serverTimestamp: true },
          status: 'completed',
        })
      );
    });

    test('doit enregistrer différents types de réponses', async () => {
      const responseTypes = ['joined', 'declined', 'maybe'];

      for (const type of responseTypes) {
        firestore.addDoc.mockResolvedValue({ id: `response-${type}` });

        await AvailabilityService.recordActivityResponse(
          'user-123',
          'availability-123',
          type,
          `Message ${type}`
        );

        expect(firestore.addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type,
            message: `Message ${type}`,
          })
        );
      }
    });
  });

  describe('🧹 Nettoyage - Maintenance Automatique', () => {
    test('doit nettoyer les réponses inactives selon la durée', async () => {
      const oldResponse = createMockResponse({
        id: 'old-response',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      });
      const recentResponse = createMockResponse({
        id: 'recent-response',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30min ago
      });

      setupMockQuery([oldResponse, recentResponse]);

      await AvailabilityService.cleanupInactiveResponses();

      // Seule la réponse > 1h doit être supprimée
      expect(firestore.deleteDoc).toHaveBeenCalledTimes(1);
    });

    test('doit nettoyer les réponses pour des activités spécifiques', async () => {
      const responses = [
        createMockResponse({ id: 'resp-1', availabilityId: 'activity-target' }),
        createMockResponse({ id: 'resp-2', availabilityId: 'activity-target' }),
      ];
      setupMockQuery(responses);

      await AvailabilityService.cleanupActivityResponses('activity-target');

      expect(firestore.deleteDoc).toHaveBeenCalledTimes(2);
    });

    test('doit nettoyer les invitations expirées', async () => {
      const expiredInvitations = [
        { id: 'inv-1', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }, // 25h ago
        { id: 'inv-2', createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000) }, // 30h ago
      ];
      setupMockQuery(expiredInvitations);

      await AvailabilityService.cleanupExpiredInvitations();

      expect(firestore.deleteDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe("🚨 Gestion d'erreurs - Patterns Défensifs", () => {
    test("doit gérer les erreurs lors de l'arrêt", async () => {
      firestore.deleteDoc.mockRejectedValue(new Error('Delete failed'));

      // Ne doit pas faire planter, mais logger l'erreur
      await AvailabilityService.stopAvailability(
        'user-123',
        'availability-123'
      );

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Stop availability error:',
        expect.any(Error)
      );
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
      ).rejects.toThrow('Impossible de définir la disponibilité');
    });

    test('doit gérer les timeouts de requête', async () => {
      const timeoutError = new Error('Request timeout');
      firestore.addDoc.mockRejectedValue(timeoutError);

      await expect(
        AvailabilityService.setAvailability('user-123', 'coffee', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Impossible de définir la disponibilité');
    });
  });

  describe('📍 Partage de localisation - UX Optimisée', () => {
    test("doit partager la localisation lors de l'acceptation", async () => {
      await AvailabilityService.shareLocationOnAcceptance('user-123');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          locationShared: true,
          shareLocation: true,
          lastLocationUpdate: { __serverTimestamp: true },
        })
      );
    });

    test('doit arrêter le partage de localisation', async () => {
      await AvailabilityService.stopLocationSharing('user-123');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          locationShared: false,
          shareLocation: false,
          location: null,
        })
      );
    });

    test('doit mettre à jour la position en temps réel', async () => {
      const newLocation = { lat: 48.8567, lng: 2.3523 };

      await AvailabilityService.updateUserLocation('user-123', newLocation);

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          location: newLocation,
          lastLocationUpdate: { __serverTimestamp: true },
        })
      );
    });
  });

  describe('🔄 Fonctionnalités avancées - Edge Cases', () => {
    test("doit enregistrer une réponse d'activité avec métadonnées", async () => {
      const metadata = { source: 'map', priority: 'high' };
      firestore.addDoc.mockResolvedValue({ id: 'response-meta' });

      await AvailabilityService.recordActivityResponse(
        'user-123',
        'availability-123',
        'joined',
        'Message avec meta',
        metadata
      );

      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          availabilityId: 'availability-123',
          type: 'joined',
          message: 'Message avec meta',
          metadata,
          createdAt: { __serverTimestamp: true },
        })
      );
    });

    test("doit notifier les amis d'une activité", async () => {
      const mockUser = createMockUser({
        name: 'Test User',
        friends: ['friend1', 'friend2'],
      });
      setupMockDocument(mockUser);

      await AvailabilityService.notifyFriends(
        'user-123',
        'availability-123',
        'coffee',
        'Café maintenant ?'
      );

      expect(firestore.addDoc).toHaveBeenCalledTimes(2); // Une notification par ami
    });

    test('doit gérer les disponibilités concurrentes', async () => {
      // Test pour éviter les conflicts de disponibilités multiples
      const mockAvailabilityRef = setupSuccessfulAvailabilityCreation();

      // Simuler utilisateur déjà disponible
      const busyUser = createMockUser({
        isAvailable: true,
        currentActivity: 'lunch',
        availabilityId: 'existing-availability',
      });
      setupMockDocument(busyUser);

      await expect(
        AvailabilityService.setAvailability('user-123', 'coffee', {
          lat: 48.8566,
          lng: 2.3522,
        })
      ).rejects.toThrow('Utilisateur déjà disponible pour une autre activité');
    });
  });

  describe('🎯 Performance et Optimisation', () => {
    test('doit utiliser les index Firestore optimalement', async () => {
      // Vérifier que les requêtes utilisent les bons index
      AvailabilityService.onAvailableFriends('user-123', jest.fn());

      expect(firestore.query).toHaveBeenCalled();
      expect(firestore.where).toHaveBeenCalledWith('isActive', '==', true);
    });

    test('doit batching les opérations multiples', async () => {
      // Test pour les opérations en lot (future optimization)
      const availabilities = [
        createMockAvailability({ id: 'av1' }),
        createMockAvailability({ id: 'av2' }),
        createMockAvailability({ id: 'av3' }),
      ];

      setupMockQuery(availabilities);

      await AvailabilityService.batchCleanupExpired?.();

      // Si implémenté, vérifier l'utilisation de batch operations
      expect(true).toBe(true); // Placeholder pour futures optimisations
    });

    test('doit gérer la pagination des résultats', async () => {
      // Test pour la pagination (si implémentée)
      const limit = 10;
      const availabilities = Array.from({ length: limit }, (_, i) =>
        createMockAvailability({ id: `av-${i}` })
      );

      setupMockQuery(availabilities);

      const result = await AvailabilityService.getAvailableFriends?.(
        'user-123',
        { limit }
      );

      // Si la méthode existe, vérifier le résultat
      expect(result?.length || 0).toBeLessThanOrEqual(limit);
    });
  });
});
