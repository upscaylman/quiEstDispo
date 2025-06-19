// @ts-nocheck
// Tests friendsService.js - PHASE 2 - Logique Métier Core (Priorité HAUTE)

import { FriendsService } from '../services/friendsService';

// Import du mock pour pouvoir le référencer dans les tests

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

describe('FriendsService - PHASE 2 - Logique Métier Core', () => {
  let mockFirebaseUtils;
  let mockFirestore;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les mocks après leur définition
    mockFirebaseUtils = require('../services/firebaseUtils');
    mockFirestore = require('firebase/firestore');

    // Reset des mocks par défaut
    mockFirebaseUtils.isOnline.mockReturnValue(true);
    mockFirestore.serverTimestamp.mockReturnValue({ __serverTimestamp: true });

    // Mock console pour éviter les logs de test
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

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
          { id: 'user1', name: 'Alice', email: 'alice@test.com' },
          { id: 'user2', name: 'Bob', email: 'bob@test.com' },
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
          email: 'alice@test.com',
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
          { id: 'user1', name: 'Alice' },
          { id: 'user2', name: 'Bob' },
          { id: 'user3', name: 'Charlie' },
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

  describe("👥 Ajout d'amis", () => {
    describe('addFriendByPhone', () => {
      test('doit ajouter un ami par numéro de téléphone', async () => {
        const mockUserData = {
          id: 'friend-id',
          name: 'Alice',
          phone: '+33612345678',
        };

        // Mock query results
        mockFirestore.getDocs.mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'friend-id',
              data: () => mockUserData,
            },
          ],
        });

        // Mock addMutualFriendship
        jest
          .spyOn(FriendsService, 'addMutualFriendship')
          .mockResolvedValue(true);

        const result = await FriendsService.addFriendByPhone(
          'user-id',
          '0612345678'
        );

        expect(mockFirestore.query).toHaveBeenCalled();
        expect(mockFirestore.where).toHaveBeenCalledWith(
          'phone',
          '==',
          '+33612345678'
        );
        expect(FriendsService.addMutualFriendship).toHaveBeenCalledWith(
          'user-id',
          'friend-id'
        );
        expect(result.success).toBe(true);
        expect(result.friend).toEqual(mockUserData);
      });

      test("doit gérer le cas où l'utilisateur n'est pas trouvé", async () => {
        mockFirestore.getDocs.mockResolvedValue({
          empty: true,
          docs: [],
        });

        const result = await FriendsService.addFriendByPhone(
          'user-id',
          '0612345678'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Utilisateur non trouvé avec ce numéro de téléphone'
        );
      });

      test("doit empêcher de s'ajouter soi-même", async () => {
        const mockUserData = {
          id: 'user-id', // Même ID que l'utilisateur courant
          name: 'Self',
          phone: '+33612345678',
        };

        mockFirestore.getDocs.mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'user-id',
              data: () => mockUserData,
            },
          ],
        });

        const result = await FriendsService.addFriendByPhone(
          'user-id',
          '0612345678'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Vous ne pouvez pas vous ajouter vous-même comme ami'
        );
      });

      test('doit gérer le mode offline', async () => {
        mockFirebaseUtils.isOnline.mockReturnValue(false);

        await expect(
          FriendsService.addFriendByPhone('user-id', '0612345678')
        ).rejects.toThrow('Connexion requise pour ajouter un ami');

        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ Offline mode, cannot add friend'
        );
      });
    });

    describe('addMutualFriendship', () => {
      test("doit créer une relation d'amitié mutuelle", async () => {
        // Mock des documents utilisateurs
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ friends: [] }),
        });

        await FriendsService.addMutualFriendship('user1', 'user2');

        // Vérifier la création de la relation friendship
        expect(mockFirestore.addDoc).toHaveBeenCalledWith(
          expect.anything(), // collection reference
          expect.objectContaining({
            user1: 'user1',
            user2: 'user2',
            status: 'accepted',
          })
        );

        // Vérifier la mise à jour des deux utilisateurs
        expect(mockFirestore.updateDoc).toHaveBeenCalledTimes(2);
      });

      test("doit éviter les doublons d'amitié", async () => {
        // Mock utilisateur avec amitié existante
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ friends: ['user2'] }),
        });

        await expect(
          FriendsService.addMutualFriendship('user1', 'user2')
        ).rejects.toThrow('Ces utilisateurs sont déjà amis');
      });
    });
  });

  describe('📋 Récupération des amis', () => {
    describe('getFriends', () => {
      test('doit récupérer la liste des amis', async () => {
        const mockFriends = [
          { id: 'friend1', name: 'Alice', isOnline: true },
          { id: 'friend2', name: 'Bob', isOnline: false },
        ];

        // Mock user document
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ friends: ['friend1', 'friend2'] }),
        });

        // Mock friends documents
        mockFirestore.getDocs.mockResolvedValue({
          docs: mockFriends.map(friend => ({
            id: friend.id,
            data: () => ({ name: friend.name, isOnline: friend.isOnline }),
          })),
        });

        const result = await FriendsService.getFriends('user-id');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'friend1',
          name: 'Alice',
          isOnline: true,
        });
      });

      test("doit retourner un tableau vide si pas d'amis", async () => {
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ friends: [] }),
        });

        const result = await FriendsService.getFriends('user-id');

        expect(result).toEqual([]);
      });

      test("doit retourner un tableau vide si utilisateur n'existe pas", async () => {
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => false,
        });

        const result = await FriendsService.getFriends('user-id');

        expect(result).toEqual([]);
      });
    });
  });

  describe("🔔 Système d'invitations", () => {
    describe('createFriendInvitation', () => {
      test("doit créer une invitation d'ami", async () => {
        const mockInvitationRef = { id: 'invitation-id' };
        mockFirestore.addDoc.mockResolvedValue(mockInvitationRef);

        const result = await FriendsService.createFriendInvitation(
          'user1',
          'user2'
        );

        expect(mockFirestore.addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            fromUserId: 'user1',
            toUserId: 'user2',
            status: 'pending',
            type: 'friend_request',
          })
        );

        expect(result).toBe('invitation-id');
      });

      test('doit gérer le mode offline', async () => {
        mockFirebaseUtils.isOnline.mockReturnValue(false);

        await expect(
          FriendsService.createFriendInvitation('user1', 'user2')
        ).rejects.toThrow('Connexion requise pour envoyer une invitation');
      });
    });

    describe('respondToFriendInvitation', () => {
      test("doit accepter une invitation d'ami", async () => {
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({
            fromUserId: 'user1',
            toUserId: 'user2',
            status: 'pending',
          }),
        });

        jest
          .spyOn(FriendsService, 'addMutualFriendship')
          .mockResolvedValue(true);

        await FriendsService.respondToFriendInvitation(
          'invitation-id',
          'accepted',
          'user2'
        );

        expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'accepted',
          })
        );

        expect(FriendsService.addMutualFriendship).toHaveBeenCalledWith(
          'user1',
          'user2'
        );
      });

      test("doit refuser une invitation d'ami", async () => {
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({
            fromUserId: 'user1',
            toUserId: 'user2',
            status: 'pending',
          }),
        });

        await FriendsService.respondToFriendInvitation(
          'invitation-id',
          'declined',
          'user2'
        );

        expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'declined',
          })
        );

        // Ne doit pas créer d'amitié
        expect(FriendsService.addMutualFriendship).not.toHaveBeenCalled();
      });
    });
  });

  describe("🗑️ Suppression d'amis", () => {
    describe('removeFriend', () => {
      test('doit supprimer un ami', async () => {
        // Mock friendship query
        mockFirestore.getDocs.mockResolvedValue({
          docs: [
            {
              id: 'friendship-id',
              data: () => ({ user1: 'user1', user2: 'friend-id' }),
            },
          ],
        });

        await FriendsService.removeFriend('user1', 'friend-id');

        // Vérifier la suppression de la relation
        expect(mockFirestore.deleteDoc).toHaveBeenCalled();

        // Vérifier la mise à jour des deux utilisateurs
        expect(mockFirestore.updateDoc).toHaveBeenCalledTimes(2);
      });

      test.skip("doit gérer le cas où l'amitié n'existe pas", async () => {
        mockFirestore.getDocs.mockResolvedValue({
          docs: [], // Pas d'amitié trouvée
        });

        await expect(
          FriendsService.removeFriend('user1', 'friend-id')
        ).rejects.toThrow("Relation d'amitié non trouvée");
      });
    });
  });

  describe('👂 Listeners en temps réel', () => {
    describe('onUserFriendsChange', () => {
      test("doit créer un listener pour les changements d'amis", () => {
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();
        mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe);

        const unsubscribe = FriendsService.onUserFriendsChange(
          'user-id',
          mockCallback
        );

        expect(mockFirestore.onSnapshot).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockUnsubscribe);
      });
    });

    describe('listenToFriends', () => {
      test("doit démarrer l'écoute des amis", () => {
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();
        mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe);

        const unsubscribe = FriendsService.listenToFriends(
          'user-id',
          mockCallback
        );

        expect(mockFirestore.onSnapshot).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockUnsubscribe);
      });
    });
  });

  describe("🚨 Gestion d'erreurs", () => {
    test('doit gérer les erreurs Firebase dans addFriendByPhone', async () => {
      mockFirestore.getDocs.mockRejectedValue(new Error('Firebase error'));

      const result = await FriendsService.addFriendByPhone(
        'user-id',
        '0612345678'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de la recherche');
    });

    test('doit gérer les erreurs de connexion', async () => {
      mockFirebaseUtils.retryWithBackoff.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        FriendsService.addFriendByPhone('user-id', '0612345678')
      ).rejects.toThrow('Network error');
    });
  });

  describe('🔄 Fonctionnalités avancées', () => {
    test("doit vérifier les doublons avant d'ajouter un ami", async () => {
      // Test déjà couvert dans addMutualFriendship, mais on peut ajouter des cas spécifiques
      const mockUserData = {
        id: 'friend-id',
        name: 'Alice',
        phone: '+33612345678',
      };

      // Mock user avec amis existants
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: ['friend-id'] }),
      });

      mockFirestore.getDocs.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'friend-id',
            data: () => mockUserData,
          },
        ],
      });

      const result = await FriendsService.addFriendByPhone(
        'user-id',
        '0612345678'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('déjà ami');
    });
  });
});
