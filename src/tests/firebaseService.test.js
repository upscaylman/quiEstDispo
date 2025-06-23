// @ts-nocheck
// firebaseService - PHASE 5 - Intégrations Firebase (Service Principal)

import * as firebaseService from '../services/firebaseService';

// === MOCKS ===

// Mock des services refactorisés
jest.mock('../services/authService', () => ({
  AuthService: { mock: 'AuthService' },
}));

jest.mock('../services/availabilityService', () => ({
  AvailabilityService: { mock: 'AvailabilityService' },
}));

jest.mock('../services/friendsService', () => ({
  FriendsService: { mock: 'FriendsService' },
}));

jest.mock('../services/invitationService', () => ({
  InvitationService: { mock: 'InvitationService' },
}));

jest.mock('../services/notificationService', () => ({
  NotificationService: { mock: 'NotificationService' },
}));

jest.mock('../services/firebaseUtils', () => ({
  getNetworkErrorMessage: jest.fn(() => 'Network error'),
  isOnline: jest.fn(() => true),
  retryWithBackoff: jest.fn(),
}));

// === TESTS ===

describe('firebaseService - PHASE 5 - Intégrations Firebase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('📦 Re-exports des services', () => {
    test('doit exporter AuthService', () => {
      expect(firebaseService.AuthService).toBeDefined();
      expect(firebaseService.AuthService.mock).toBe('AuthService');
    });

    test('doit exporter AvailabilityService', () => {
      expect(firebaseService.AvailabilityService).toBeDefined();
      expect(firebaseService.AvailabilityService.mock).toBe(
        'AvailabilityService'
      );
    });

    test('doit exporter FriendsService', () => {
      expect(firebaseService.FriendsService).toBeDefined();
      expect(firebaseService.FriendsService.mock).toBe('FriendsService');
    });

    test('doit exporter InvitationService', () => {
      expect(firebaseService.InvitationService).toBeDefined();
      expect(firebaseService.InvitationService.mock).toBe('InvitationService');
    });

    test('doit exporter NotificationService', () => {
      expect(firebaseService.NotificationService).toBeDefined();
      expect(firebaseService.NotificationService.mock).toBe(
        'NotificationService'
      );
    });
  });

  describe('🔧 Re-exports des utilitaires', () => {
    test('doit exporter getNetworkErrorMessage', () => {
      expect(firebaseService.getNetworkErrorMessage).toBeDefined();
      expect(typeof firebaseService.getNetworkErrorMessage).toBe('function');
    });

    test('doit exporter isOnline', () => {
      expect(firebaseService.isOnline).toBeDefined();
      expect(typeof firebaseService.isOnline).toBe('function');
    });

    test('doit exporter retryWithBackoff', () => {
      expect(firebaseService.retryWithBackoff).toBeDefined();
      expect(typeof firebaseService.retryWithBackoff).toBe('function');
    });
  });
});
