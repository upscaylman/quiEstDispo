// @ts-nocheck
// Test simple validation téléphone UNIQUEMENT +336/+337

import { AuthService } from '../services/authService';

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
