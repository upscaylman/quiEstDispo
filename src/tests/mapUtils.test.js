// @ts-nocheck
import {
  calculateDistance,
  calculateMapBounds,
  filterFriendsByActivity,
  formatDistance,
  getActivityColor,
  sanitizeFriendsData,
} from '../components/map/mapUtils.js';

describe('MapUtils - Calculs géographiques', () => {
  describe('getActivityColor', () => {
    test('doit retourner la couleur correcte pour Coffee', () => {
      expect(getActivityColor('Coffee')).toBe('#f59e0b');
    });

    test('doit retourner la couleur par défaut pour activité inconnue', () => {
      expect(getActivityColor('unknown')).toBe('#6b7280');
      expect(getActivityColor(null)).toBe('#6b7280');
    });

    test('doit être insensible à la casse', () => {
      expect(getActivityColor('COFFEE')).toBe('#f59e0b');
      expect(getActivityColor('coffee')).toBe('#f59e0b');
    });
  });

  describe('calculateDistance', () => {
    test('doit calculer la distance entre Paris et Marseille', () => {
      const distance = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      expect(distance).toBeGreaterThan(650);
      expect(distance).toBeLessThan(700);
    });

    test('doit retourner 0 pour la même position', () => {
      const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBe(0);
    });

    test('doit retourner 0 pour paramètres invalides', () => {
      expect(calculateDistance(null, 2.3522, 48.8566, 2.3522)).toBe(0);
      expect(
        calculateDistance(undefined, undefined, undefined, undefined)
      ).toBe(0);
    });
  });

  describe('formatDistance', () => {
    test('doit formater en mètres pour distances courtes', () => {
      expect(formatDistance(0.1)).toBe('100m');
      expect(formatDistance(0.5)).toBe('500m');
    });

    test('doit formater en kilomètres pour distances longues', () => {
      expect(formatDistance(1.0)).toBe('1.0km');
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(10.234)).toBe('10.2km');
    });

    test('doit gérer les valeurs invalides', () => {
      expect(formatDistance(null)).toBe('?');
      expect(formatDistance(undefined)).toBe('?');
      expect(formatDistance(NaN)).toBe('?');
    });

    test('doit gérer la distance zéro', () => {
      expect(formatDistance(0)).toBe('0m');
    });
  });

  describe('sanitizeFriendsData', () => {
    test('doit filtrer les amis avec coordonnées valides', () => {
      const friends = [
        { id: '1', location: { lat: 48.8566, lng: 2.3522 } },
        { id: '2', lat: 43.2965, lng: 5.3698 },
        { id: '3', location: { lat: null, lng: 2.3522 } },
        { id: '4', location: { lat: 'invalid', lng: 2.3522 } },
        null,
      ];

      const result = sanitizeFriendsData(friends);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    test('doit gérer un tableau vide', () => {
      expect(sanitizeFriendsData([])).toEqual([]);
      expect(sanitizeFriendsData()).toEqual([]);
    });
  });

  describe('filterFriendsByActivity', () => {
    const mockFriends = [
      { id: '1', activity: 'coffee' },
      { id: '2', activity: 'lunch' },
      { id: '3', activity: 'coffee' },
    ];

    test('doit filtrer par activité spécifique', () => {
      const coffeeLovers = filterFriendsByActivity(mockFriends, 'coffee');
      expect(coffeeLovers).toHaveLength(2);
      expect(coffeeLovers.every(f => f.activity === 'coffee')).toBe(true);
    });

    test('doit retourner tous les amis pour "all"', () => {
      const allFriends = filterFriendsByActivity(mockFriends, 'all');
      expect(allFriends).toEqual(mockFriends);
    });
  });

  describe('calculateMapBounds', () => {
    test('doit calculer le centre pour plusieurs amis', () => {
      const friends = [
        { location: { lat: 48.8566, lng: 2.3522 } },
        { location: { lat: 48.8606, lng: 2.3376 } },
      ];

      const bounds = calculateMapBounds(friends);
      expect(bounds.lat).toBeCloseTo(48.8586, 2);
      expect(bounds.lng).toBeCloseTo(2.3449, 2);
    });

    test('doit retourner Paris par défaut si aucune donnée', () => {
      const bounds = calculateMapBounds([]);
      expect(bounds.lat).toBe(48.8566);
      expect(bounds.lng).toBe(2.3522);
    });
  });
});
