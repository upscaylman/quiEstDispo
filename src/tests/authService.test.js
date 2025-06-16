import { auth } from '../firebase';
import { signInWithPhone, signOut } from '../services/authService';

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {
    signInWithPhoneNumber: jest.fn(),
    signOut: jest.fn(),
    settings: { appVerificationDisabledForTesting: false },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithPhone', () => {
    test('should handle successful phone sign in', async () => {
      const mockConfirmationResult = {
        confirm: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
      };

      auth.signInWithPhoneNumber.mockResolvedValue(mockConfirmationResult);

      const result = await signInWithPhone('+16505554567');

      expect(auth.signInWithPhoneNumber).toHaveBeenCalledWith(
        '+16505554567',
        expect.any(Object)
      );
      expect(result).toBe(mockConfirmationResult);
    });

    test('should handle App Check error (500)', async () => {
      const appCheckError = new Error('App Check error');
      appCheckError.code = 'auth/app-check-failed';

      auth.signInWithPhoneNumber.mockRejectedValue(appCheckError);

      await expect(signInWithPhone('+16505554567')).rejects.toThrow(
        'App Check error'
      );
    });

    test('should handle invalid phone number', async () => {
      const invalidPhoneError = new Error('Invalid phone number');
      invalidPhoneError.code = 'auth/invalid-phone-number';

      auth.signInWithPhoneNumber.mockRejectedValue(invalidPhoneError);

      await expect(signInWithPhone('invalid')).rejects.toThrow(
        'Invalid phone number'
      );
    });
  });

  describe('signOut', () => {
    test('should successfully sign out user', async () => {
      auth.signOut.mockResolvedValue();

      await signOut();

      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});
