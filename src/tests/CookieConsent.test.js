// @ts-nocheck
/* eslint-disable no-console */
import { fireEvent, render, screen } from '@testing-library/react';
import CookieConsent from '../components/CookieConsent';

// Mock CookieService - doit être défini avant le jest.mock
jest.mock('../services/cookieService', () => ({
  CookieService: {
    getConsent: jest.fn(),
    setConsent: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Récupérer le mock après l'import
const {
  CookieService: mockCookieService,
} = require('../services/cookieService');

describe('CookieConsent - Composant UI simple', () => {
  beforeEach(() => {
    console.log = jest.fn();
    mockCookieService.getConsent.mockClear();
    mockCookieService.setConsent.mockClear();
  });

  describe('Affichage conditionnel', () => {
    test('doit afficher le banner si aucun consentement', () => {
      mockCookieService.getConsent.mockReturnValue(null);

      render(<CookieConsent darkMode={false} />);

      expect(
        screen.getByText('Nous utilisons des cookies')
      ).toBeInTheDocument();
      expect(screen.getByText('Accepter tout')).toBeInTheDocument();
    });

    test('ne doit pas afficher si consentement existant', () => {
      mockCookieService.getConsent.mockReturnValue({
        preferences: { necessary: true },
      });

      render(<CookieConsent darkMode={false} />);
      expect(screen.queryByText('Accepter tout')).not.toBeInTheDocument();
    });
  });

  describe('Actions du banner', () => {
    beforeEach(() => {
      mockCookieService.getConsent.mockReturnValue(null);
    });

    test('doit accepter tous les cookies', () => {
      render(<CookieConsent darkMode={false} />);

      fireEvent.click(screen.getByText('Accepter tout'));

      expect(mockCookieService.setConsent).toHaveBeenCalledWith({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
      });
    });

    test('doit accepter seulement les necessaires', () => {
      render(<CookieConsent darkMode={false} />);

      fireEvent.click(screen.getByText('Nécessaires uniquement'));

      expect(mockCookieService.setConsent).toHaveBeenCalledWith({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      });
    });
  });

  describe('Modal de preferences', () => {
    test('doit ouvrir le modal de personnalisation', () => {
      mockCookieService.getConsent.mockReturnValue(null);

      render(<CookieConsent darkMode={false} />);

      fireEvent.click(screen.getByText('Personnaliser'));

      expect(screen.getByText('Préférences des cookies')).toBeInTheDocument();
    });
  });

  describe('Support des themes', () => {
    test('doit supporter le mode sombre', () => {
      mockCookieService.getConsent.mockReturnValue(null);

      render(<CookieConsent darkMode={true} />);

      expect(
        screen.getByText('Nous utilisons des cookies')
      ).toBeInTheDocument();
    });

    test('doit supporter le mode clair', () => {
      mockCookieService.getConsent.mockReturnValue(null);

      render(<CookieConsent darkMode={false} />);

      expect(
        screen.getByText('Nous utilisons des cookies')
      ).toBeInTheDocument();
    });
  });

  describe('Integration CookieService', () => {
    test('doit appeler getConsent au montage', () => {
      render(<CookieConsent darkMode={false} />);

      expect(mockCookieService.getConsent).toHaveBeenCalled();
    });
  });
});
