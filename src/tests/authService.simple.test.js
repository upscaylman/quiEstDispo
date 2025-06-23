// @ts-nocheck
// Tests AuthService - PHASE 2 - Version SIMPLIFIÉE pour debug

// POLYFILL CRITIQUE : Doit être importé en premier pour éviter les erreurs undici
import 'web-streams-polyfill';

import { AuthService } from '../services/authService';

// Polyfill ReadableStream pour éviter l'erreur undici
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
        cancel: () => Promise.resolve(),
      };
    }
    cancel() {
      return Promise.resolve();
    }
    pipeTo() {
      return Promise.resolve();
    }
    pipeThrough() {
      return this;
    }
    tee() {
      return [this, this];
    }
  };
}

// Mock navigator globalement
global.navigator = {
  onLine: true,
  userAgent: 'Mozilla/5.0 (test)',
};

describe('AuthService - Tests Simplifiés PHASE 2', () => {
  describe('📱 Validation Téléphone (Tests Critiques)', () => {
    test('✅ doit accepter UNIQUEMENT +336 et +337', () => {
      const validCases = [
        ['0612345678', '+33612345678'],
        ['0712345678', '+33712345678'],
        ['+33612345678', '+33612345678'],
        ['+33712345678', '+33712345678'],
      ];

      validCases.forEach(([input, expected]) => {
        const result = AuthService.validateAndFormatPhoneNumber(input);
        expect(result).toBe(expected);
      });
    });

    test('❌ doit rejeter numéros fixes français (01-05)', () => {
      const fixedNumbers = [
        '0123456789', // 01
        '0212345678', // 02
        '0312345678', // 03
        '0412345678', // 04
        '0512345678', // 05
      ];

      fixedNumbers.forEach(input => {
        expect(() => AuthService.validateAndFormatPhoneNumber(input)).toThrow(
          'Seuls les numéros mobiles français (+336, +337) sont acceptés'
        );
      });
    });

    test('❌ doit rejeter chaînes vides', () => {
      expect(() => AuthService.validateAndFormatPhoneNumber('')).toThrow(
        'Numéro de téléphone requis'
      );
    });
  });
});
