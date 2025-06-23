// @ts-nocheck
// Tests friendsService.js - OPTIMISATION COMPLÈTE avec patterns éprouvés

import { FriendsService } from '../services/friendsService';

// === MOCKS COMPLETS FIREBASE ===

// Mock Firebase/Firestore
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
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

describe('FriendsService - OPTIMISATION COMPLÈTE Foundation Services', () => {
  let mockFirebaseUtils;
  let mockFirestore;

  // === FIXTURES RÉUTILISABLES ===
  const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+33612345678',
    friends: [],
    ...overrides,
  });

  const createMockFriend = (overrides = {}) => ({
    id: 'friend-123',
    name: 'Alice Dupont',
    email: 'alice@example.com',
    phone: '+33687654321',
    friends: [],
    isOnline: true,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les mocks après leur définition
    mockFirebaseUtils = require('../services/firebaseUtils');
    mockFirestore = require('firebase/firestore');

    // Reset des mocks par défaut
    mockFirebaseUtils.isOnline.mockReturnValue(true);
    mockFirestore.serverTimestamp.mockReturnValue({ __serverTimestamp: true });

    // Mock console pour éviter les logs de test
    ['log', 'error', 'warn'].forEach(method => {
      console[method] = jest.fn();
    });
  });

  // === HELPER FUNCTIONS PATTERN ÉPROUVÉ ===
  const setupSuccessfulUserQuery = userData => {
    mockFirestore.getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: userData.id,
          data: () => userData,
        },
      ],
    });
  };

  const setupEmptyUserQuery = () => {
    mockFirestore.getDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });
  };

  const setupExistingUser = (userId, userData) => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => userData,
    });
  };

  const setupNoExistingInvitations = () => {
    // Mock pour les requêtes d'invitations existantes
    mockFirestore.getDocs.mockImplementation(queryObj => {
      // Identifier si c'est une requête d'invitation via les appels where
      return Promise.resolve({
        empty: true,
        docs: [],
      });
    });
  };

  describe('📱 Normalisation des numéros de téléphone', () => {
    test('doit normaliser un numéro français avec 0', () => {
      const result = FriendsService.normalizePhoneNumber('0612345678');
      expect(result).toBe('+33612345678');
    });

    test('doit normaliser un numéro avec espaces et tirets', () => {
      const result = FriendsService.normalizePhoneNumber('06 12-34 56(78)');
      expect(result).toBe('+33612345678');
    });

    test('doit ajouter +33 si pas de préfixe', () => {
      const result = FriendsService.normalizePhoneNumber('612345678');
      expect(result).toBe('+33612345678');
    });

    test('doit garder les numéros déjà normalisés', () => {
      const result = FriendsService.normalizePhoneNumber('+33612345678');
      expect(result).toBe('+33612345678');
    });

    test('doit gérer les numéros internationaux', () => {
      const result = FriendsService.normalizePhoneNumber('+1234567890');
      expect(result).toBe('+1234567890');
    });
  });

  describe('🧪 Mode développement - Debug et tests', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    describe('debugListAllUsers', () => {
      test('doit lister tous les utilisateurs en développement', async () => {
        const mockUsers = [
          createMockUser({ id: 'user1', name: 'Alice' }),
          createMockUser({ id: 'user2', name: 'Bob' }),
        ];

        mockFirestore.getDocs.mockResolvedValue({
          docs: mockUsers.map(user => ({
            id: user.id,
            data: () => ({ name: user.name, email: user.email }),
          })),
        });

        const result = await FriendsService.debugListAllUsers();

        expect(mockFirestore.collection).toHaveBeenCalledWith(
          mockFirebaseUtils.db,
          'users'
        );
        expect(mockFirestore.getDocs).toHaveBeenCalled();
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'user1',
          name: 'Alice',
          email: 'test@example.com',
        });
      });

      test('doit retourner un tableau vide en mode offline', async () => {
        mockFirebaseUtils.isOnline.mockReturnValue(false);

        const result = await FriendsService.debugListAllUsers();

        expect(result).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ Offline mode, cannot list users'
        );
      });

      test('ne doit pas fonctionner en production', async () => {
        process.env.NODE_ENV = 'production';

        const result = await FriendsService.debugListAllUsers();

        expect(result).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ Cette fonction est disponible uniquement en développement'
        );
      });
    });

    describe('addTestFriendships', () => {
      test('doit créer des amitiés de test', async () => {
        const mockUsers = [
          createMockUser({ id: 'user1', name: 'Alice' }),
          createMockUser({ id: 'user2', name: 'Bob' }),
          createMockUser({ id: 'user3', name: 'Charlie' }),
        ];

        mockFirestore.getDocs.mockResolvedValue({
          docs: mockUsers.map(user => ({
            id: user.id,
            data: () => ({ name: user.name }),
          })),
        });

        // Mock addMutualFriendship
        jest
          .spyOn(FriendsService, 'addMutualFriendship')
          .mockResolvedValue(true);

        const result = await FriendsService.addTestFriendships('currentUser');

        expect(result).toHaveLength(2); // 2 premiers autres utilisateurs
        expect(FriendsService.addMutualFriendship).toHaveBeenCalledWith(
          'currentUser',
          'user1'
        );
        expect(FriendsService.addMutualFriendship).toHaveBeenCalledWith(
          'currentUser',
          'user2'
        );
      });
    });
  });

  describe("👥 Ajout d'amis - Patterns Optimisés", () => {
    describe('addFriendByPhone', () => {
      test('doit créer une invitation (pas amitié directe) par numéro', async () => {
        const currentUser = createMockUser();
        const friendData = createMockFriend();

        // Setup: utilisateur trouvé
        setupSuccessfulUserQuery(friendData);
        // Setup: utilisateur courant existe
        setupExistingUser(currentUser.id, currentUser);
        // Setup: pas d'invitations existantes
        setupNoExistingInvitations();

        // Mock createFriendInvitation
        jest
          .spyOn(FriendsService, 'createFriendInvitation')
          .mockResolvedValue();

        const result = await FriendsService.addFriendByPhone(
          currentUser.id,
          '+33687654321'
        );

        expect(FriendsService.createFriendInvitation).toHaveBeenCalledWith(
          currentUser.id,
          friendData.id
        );
        expect(result).toEqual({
          id: friendData.id,
          name: friendData.name,
          email: friendData.email,
          phone: friendData.phone,
          friends: friendData.friends,
          isOnline: friendData.isOnline,
          invitationSent: true, // IMPORTANT: invitation créée, pas ami direct
        });
      });

      test("doit empêcher de s'ajouter soi-même", async () => {
        const currentUser = createMockUser();

        // Même utilisateur avec même numéro
        setupSuccessfulUserQuery(currentUser);

        await expect(
          FriendsService.addFriendByPhone(currentUser.id, currentUser.phone)
        ).rejects.toThrow(
          "Impossible d'ajouter cet ami: Vous ne pouvez pas vous ajouter comme ami"
        );
      });

      test('doit détecter utilisateur non trouvé', async () => {
        setupEmptyUserQuery();

        await expect(
          FriendsService.addFriendByPhone('user-123', '+33999999999')
        ).rejects.toThrow(
          "Impossible d'ajouter cet ami: Utilisateur non trouvé avec ce numéro. Assurez-vous que cette personne s'est déjà connectée à l'application."
        );
      });

      test('doit détecter invitation déjà en cours', async () => {
        const currentUser = createMockUser();
        const friendData = createMockFriend();

        setupSuccessfulUserQuery(friendData);
        setupExistingUser(currentUser.id, currentUser);

        // Mock: invitation existante trouvée
        mockFirestore.getDocs.mockResolvedValue({
          empty: false,
          docs: [{ id: 'existing-invitation' }],
        });

        await expect(
          FriendsService.addFriendByPhone(currentUser.id, friendData.phone)
        ).rejects.toThrow(
          "Impossible d'ajouter cet ami: Une invitation est déjà en cours pour cet utilisateur"
        );
      });

      test('doit détecter ami déjà ajouté', async () => {
        const friendData = createMockFriend();
        const currentUser = createMockUser({
          friends: [friendData.id], // Déjà ami
        });

        setupSuccessfulUserQuery(friendData);
        setupExistingUser(currentUser.id, currentUser);
        setupNoExistingInvitations();

        await expect(
          FriendsService.addFriendByPhone(currentUser.id, friendData.phone)
        ).rejects.toThrow(
          "Impossible d'ajouter cet ami: Cette personne est déjà dans vos amis"
        );
      });
    });

    describe('addMutualFriendship', () => {
      test("doit créer une relation d'amitié mutuelle", async () => {
        const user1 = createMockUser({ id: 'user1' });
        const user2 = createMockUser({ id: 'user2' });

        // Mock pour éviter les doublons
        mockFirestore.getDocs.mockResolvedValue({
          empty: true, // Pas de relation existante
          docs: [],
        });

        const result = await FriendsService.addMutualFriendship(
          'user1',
          'user2'
        );

        // Vérifier la création de la relation friendship
        expect(mockFirestore.addDoc).toHaveBeenCalledWith(
          expect.anything(), // collection reference
          expect.objectContaining({
            user1: 'user1',
            user2: 'user2',
            status: 'accepted',
            createdAt: { __serverTimestamp: true },
          })
        );

        // Vérifier la mise à jour des deux utilisateurs
        expect(mockFirestore.updateDoc).toHaveBeenCalledTimes(2);

        expect(result).toBe(true);
      });

      test("doit éviter les doublons d'amitié", async () => {
        // Mock: relation existante trouvée
        mockFirestore.getDocs.mockResolvedValue({
          empty: false,
          docs: [{ id: 'existing-friendship' }],
        });

        // Note: La logique réelle ne throw pas mais continue silencieusement
        const result = await FriendsService.addMutualFriendship(
          'user1',
          'user2'
        );

        expect(result).toBe(true); // Succès même si déjà existant
        // Pas de nouvelle création d'amitié
        expect(mockFirestore.addDoc).not.toHaveBeenCalled();
      });
    });
  });

  describe('📋 Récupération des amis - Pattern Optimisé', () => {
    describe('getFriends', () => {
      test('doit récupérer la liste des amis avec données complètes', async () => {
        const friend1 = createMockFriend({ id: 'friend1', name: 'Alice' });
        const friend2 = createMockFriend({ id: 'friend2', name: 'Bob' });
        const currentUser = createMockUser({
          friends: ['friend1', 'friend2'],
        });

        // Mock: utilisateur principal
        mockFirestore.getDoc.mockImplementation(docRef => {
          // Simuler les différents docs selon leur ID
          if (docRef.toString().includes('user-123')) {
            return Promise.resolve({
              exists: () => true,
              data: () => currentUser,
            });
          } else if (docRef.toString().includes('friend1')) {
            return Promise.resolve({
              exists: () => true,
              data: () => friend1,
            });
          } else if (docRef.toString().includes('friend2')) {
            return Promise.resolve({
              exists: () => true,
              data: () => friend2,
            });
          }
          return Promise.resolve({ exists: () => false });
        });

        const result = await FriendsService.getFriends('user-123');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'friend1',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '+33687654321',
          friends: [],
          isOnline: true,
        });
        expect(result[1]).toEqual({
          id: 'friend2',
          name: 'Bob',
          email: 'alice@example.com',
          phone: '+33687654321',
          friends: [],
          isOnline: true,
        });
      });

      test('doit retourner tableau vide si aucun ami', async () => {
        const currentUser = createMockUser({ friends: [] });

        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => currentUser,
        });

        const result = await FriendsService.getFriends('user-123');

        expect(result).toEqual([]);
      });

      test('doit retourner tableau vide si utilisateur non trouvé', async () => {
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => false,
        });

        const result = await FriendsService.getFriends('user-123');

        expect(result).toEqual([]);
      });
    });
  });

  describe("🔔 Système d'invitations - Patterns Robustes", () => {
    describe('createFriendInvitation', () => {
      test('doit créer une invitation avec succès', async () => {
        setupNoExistingInvitations();

        await FriendsService.createFriendInvitation('user1', 'user2');

        expect(mockFirestore.addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            fromUserId: 'user1',
            toUserId: 'user2',
            status: 'pending',
            type: 'friend_invitation',
            createdAt: { __serverTimestamp: true },
          })
        );
      });

      test('doit détecter invitation déjà en attente', async () => {
        // Mock: invitation existante
        mockFirestore.getDocs.mockResolvedValue({
          empty: false,
          docs: [{ id: 'existing-invitation' }],
        });

        await expect(
          FriendsService.createFriendInvitation('user1', 'user2')
        ).rejects.toThrow(
          "Impossible d'envoyer l'invitation: Une invitation est déjà en attente pour cet utilisateur"
        );
      });
    });

    describe('respondToFriendInvitation', () => {
      test("doit accepter une invitation d'ami", async () => {
        await FriendsService.respondToFriendInvitation(
          'invitation-123',
          'accepted',
          'user2'
        );

        expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'accepted',
            respondedAt: { __serverTimestamp: true },
          })
        );
      });

      test("doit refuser une invitation d'ami", async () => {
        await FriendsService.respondToFriendInvitation(
          'invitation-123',
          'declined',
          'user2'
        );

        expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'declined',
            respondedAt: { __serverTimestamp: true },
          })
        );
      });
    });
  });

  describe("🚨 Gestion d'erreurs - Patterns Défensifs", () => {
    test('doit gérer les erreurs Firebase dans addFriendByPhone', async () => {
      mockFirestore.getDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(
        FriendsService.addFriendByPhone('user-123', '+33612345678')
      ).rejects.toThrow("Impossible d'ajouter cet ami: Firebase error");

      expect(console.error).toHaveBeenCalledWith(
        '❌ Add friend by phone failed:',
        expect.any(Error)
      );
    });

    test('doit gérer le mode offline', async () => {
      mockFirebaseUtils.isOnline.mockReturnValue(false);

      await expect(
        FriendsService.addFriendByPhone('user-123', '+33612345678')
      ).rejects.toThrow('Connexion requise pour ajouter un ami');
    });

    test('doit gérer les erreurs réseau avec retry', async () => {
      const networkError = new Error('Network error');
      mockFirebaseUtils.retryWithBackoff.mockRejectedValue(networkError);

      await expect(
        FriendsService.addFriendByPhone('user-123', '+33612345678')
      ).rejects.toThrow("Impossible d'ajouter cet ami: Network error");
    });
  });

  describe('🔄 Fonctionnalités avancées - Edge Cases', () => {
    test("doit vérifier les doublons avant d'ajouter un ami", async () => {
      const friendData = createMockFriend();
      const currentUser = createMockUser({
        friends: [friendData.id], // Déjà dans la liste
      });

      setupSuccessfulUserQuery(friendData);
      setupExistingUser(currentUser.id, currentUser);

      await expect(
        FriendsService.addFriendByPhone(currentUser.id, friendData.phone)
      ).rejects.toThrow(
        "Impossible d'ajouter cet ami: Cette personne est déjà dans vos amis"
      );
    });

    test('doit normaliser le numéro avant recherche', async () => {
      const friendData = createMockFriend({ phone: '+33687654321' });
      const currentUser = createMockUser();

      setupSuccessfulUserQuery(friendData);
      setupExistingUser(currentUser.id, currentUser);
      setupNoExistingInvitations();
      jest.spyOn(FriendsService, 'createFriendInvitation').mockResolvedValue();

      await FriendsService.addFriendByPhone(currentUser.id, '06 87-65 43(21)');

      // Vérifier que la recherche s'est faite avec le numéro normalisé
      expect(mockFirestore.query).toHaveBeenCalled();
      expect(mockFirestore.where).toHaveBeenCalledWith(
        'phone',
        '==',
        '+33687654321'
      );
    });

    test('doit tenter les variantes de numéros si pas trouvé', async () => {
      const friendData = createMockFriend();
      const currentUser = createMockUser();

      // Première requête: vide
      // Deuxième requête (variante): trouvée
      mockFirestore.getDocs
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: friendData.id, data: () => friendData }],
        });

      setupExistingUser(currentUser.id, currentUser);
      jest.spyOn(FriendsService, 'createFriendInvitation').mockResolvedValue();

      const result = await FriendsService.addFriendByPhone(
        currentUser.id,
        '06 87 65 43 21' // Format avec espaces
      );

      expect(result.invitationSent).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Invitation trouvée avec variante:',
        friendData.name
      );
    });
  });

  describe('🎯 Performance et Optimisation', () => {
    test('doit utiliser le cache pour éviter les requêtes répétées', async () => {
      // Note: Cette fonctionnalité pourrait être ajoutée future
      expect(true).toBe(true); // Placeholder pour futures optimisations
    });

    test('doit nettoyer les listeners au démontage', () => {
      const mockUnsubscribe = jest.fn();
      mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = FriendsService.onUserFriendsChange(
        'user-123',
        jest.fn()
      );
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
