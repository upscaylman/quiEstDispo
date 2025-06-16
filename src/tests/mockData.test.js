// @ts-nocheck
import { getMockDataForOfflineMode } from '../utils/mockData.js';

describe('MockData Utils - Données de test', () => {
  let mockData;

  beforeEach(() => {
    mockData = getMockDataForOfflineMode();
  });

  describe('Structure des données mock', () => {
    test('doit retourner un objet avec toutes les propriétés requises', () => {
      expect(mockData).toBeDefined();
      expect(mockData).toHaveProperty('friends');
      expect(mockData).toHaveProperty('availableFriends');
      expect(mockData).toHaveProperty('notifications');
    });

    test('toutes les propriétés doivent être des tableaux', () => {
      expect(Array.isArray(mockData.friends)).toBe(true);
      expect(Array.isArray(mockData.availableFriends)).toBe(true);
      expect(Array.isArray(mockData.notifications)).toBe(true);
    });

    test('les tableaux ne doivent pas être vides', () => {
      expect(mockData.friends.length).toBeGreaterThan(0);
      expect(mockData.availableFriends.length).toBeGreaterThan(0);
      expect(mockData.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Validation des amis mock', () => {
    test('chaque ami doit avoir les propriétés requises', () => {
      mockData.friends.forEach(friend => {
        expect(friend).toHaveProperty('id');
        expect(friend).toHaveProperty('name');
        expect(friend).toHaveProperty('avatar');
        expect(friend).toHaveProperty('isOnline');
        expect(friend).toHaveProperty('phone');
        expect(friend).toHaveProperty('location');

        expect(typeof friend.id).toBe('string');
        expect(typeof friend.name).toBe('string');
        expect(typeof friend.avatar).toBe('string');
        expect(typeof friend.isOnline).toBe('boolean');
        expect(typeof friend.phone).toBe('string');
        expect(typeof friend.location).toBe('object');
      });
    });

    test('les coordonnées des amis doivent être valides', () => {
      mockData.friends.forEach(friend => {
        expect(friend.location).toHaveProperty('lat');
        expect(friend.location).toHaveProperty('lng');
        expect(typeof friend.location.lat).toBe('number');
        expect(typeof friend.location.lng).toBe('number');
        expect(friend.location.lat).toBeGreaterThan(-90);
        expect(friend.location.lat).toBeLessThan(90);
        expect(friend.location.lng).toBeGreaterThan(-180);
        expect(friend.location.lng).toBeLessThan(180);
      });
    });

    test('les numéros de téléphone doivent avoir un format valide', () => {
      mockData.friends.forEach(friend => {
        expect(friend.phone).toMatch(/^\+\d+$/);
        expect(friend.phone.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Validation des amis disponibles', () => {
    test('chaque ami disponible doit avoir les propriétés requises', () => {
      mockData.availableFriends.forEach(availableFriend => {
        expect(availableFriend).toHaveProperty('id');
        expect(availableFriend).toHaveProperty('userId');
        expect(availableFriend).toHaveProperty('activity');
        expect(availableFriend).toHaveProperty('location');
        expect(availableFriend).toHaveProperty('timeLeft');
        expect(availableFriend).toHaveProperty('friend');

        expect(typeof availableFriend.id).toBe('string');
        expect(typeof availableFriend.userId).toBe('string');
        expect(typeof availableFriend.activity).toBe('string');
        expect(typeof availableFriend.timeLeft).toBe('number');
        expect(typeof availableFriend.friend).toBe('object');
      });
    });

    test('timeLeft doit être positif', () => {
      mockData.availableFriends.forEach(availableFriend => {
        expect(availableFriend.timeLeft).toBeGreaterThan(0);
        expect(availableFriend.timeLeft).toBeLessThan(60);
      });
    });

    test('les activités doivent être des valeurs valides', () => {
      const validActivities = [
        'coffee',
        'lunch',
        'drinks',
        'chill',
        'clubbing',
        'cinema',
      ];

      mockData.availableFriends.forEach(availableFriend => {
        expect(validActivities).toContain(availableFriend.activity);
      });
    });
  });

  describe('Validation des notifications', () => {
    test('chaque notification doit avoir les propriétés requises', () => {
      mockData.notifications.forEach(notification => {
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('createdAt');
        expect(notification).toHaveProperty('read');

        expect(typeof notification.id).toBe('string');
        expect(typeof notification.message).toBe('string');
        expect(typeof notification.read).toBe('boolean');
      });
    });

    test('createdAt doit avoir une méthode toDate', () => {
      mockData.notifications.forEach(notification => {
        expect(typeof notification.createdAt.toDate).toBe('function');
        const date = notification.createdAt.toDate();
        expect(date instanceof Date).toBe(true);
      });
    });
  });

  describe('Utilisation pratique', () => {
    test('la fonction doit être déterministe', () => {
      const mockData1 = getMockDataForOfflineMode();
      const mockData2 = getMockDataForOfflineMode();

      expect(JSON.stringify(mockData1)).toBe(JSON.stringify(mockData2));
    });

    test('doit avoir assez de variété pour les tests', () => {
      expect(mockData.friends.length).toBeGreaterThanOrEqual(3);
      expect(mockData.availableFriends.length).toBeGreaterThanOrEqual(2);

      const onlineFriends = mockData.friends.filter(f => f.isOnline);
      const offlineFriends = mockData.friends.filter(f => !f.isOnline);

      expect(onlineFriends.length).toBeGreaterThan(0);
      expect(offlineFriends.length).toBeGreaterThan(0);
    });
  });
});
