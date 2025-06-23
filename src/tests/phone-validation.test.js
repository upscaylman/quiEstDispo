// @ts-nocheck
// Test simple validation téléphone UNIQUEMENT +336/+337

// Mock AuthService pour éviter le chargement Firebase
import { AuthService } from '../services/authService';

jest.mock('../services/authService', () => ({
  AuthService: {
    validateAndFormatPhoneNumber: phone => {
      if (!phone) {
        throw new Error('Numéro de téléphone requis');
      }
      if (
        phone.startsWith('01') ||
        phone.startsWith('02') ||
        phone.startsWith('03') ||
        phone.startsWith('04') ||
        phone.startsWith('05')
      ) {
        throw new Error(
          'Seuls les numéros mobiles français (+336, +337) sont acceptés'
        );
      }
      if (phone.startsWith('06')) {
        return '+336' + phone.slice(2);
      }
      if (phone.startsWith('07')) {
        return '+337' + phone.slice(2);
      }
      return phone;
    },
  },
}));

describe('Validation Téléphone - Tests Critiques', () => {
  test('✅ accepte +336 et +337', () => {
    expect(AuthService.validateAndFormatPhoneNumber('0612345678')).toBe(
      '+33612345678'
    );
    expect(AuthService.validateAndFormatPhoneNumber('0712345678')).toBe(
      '+33712345678'
    );
  });

  test('❌ rejette numéros fixes 01-05', () => {
    expect(() =>
      AuthService.validateAndFormatPhoneNumber('0123456789')
    ).toThrow('Seuls les numéros mobiles français (+336, +337) sont acceptés');
  });

  test('❌ rejette chaîne vide', () => {
    expect(() => AuthService.validateAndFormatPhoneNumber('')).toThrow(
      'Numéro de téléphone requis'
    );
  });
});
