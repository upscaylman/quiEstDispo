// @ts-nocheck
/* eslint-disable no-console */
import { fireEvent, render, screen } from '@testing-library/react';
import { AlertTriangle } from 'lucide-react';
import WarningBanner from '../components/WarningBanner';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('WarningBanner - PRIORITÉ #5 - Composant UI simple', () => {
  const defaultProps = {
    title: 'Attention',
    message: "Ceci est un message d'avertissement",
    icon: AlertTriangle,
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('Rendu de base', () => {
    test('doit afficher le titre et le message', () => {
      render(<WarningBanner {...defaultProps} />);

      expect(screen.getByText('Attention')).toBeInTheDocument();
      expect(
        screen.getByText("Ceci est un message d'avertissement")
      ).toBeInTheDocument();
    });

    test("doit afficher l'icône quand fournie", () => {
      const { container } = render(<WarningBanner {...defaultProps} />);

      // L'icône Lucide est rendue comme SVG
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    test('doit fonctionner sans icône', () => {
      const { icon, ...propsWithoutIcon } = defaultProps;
      render(<WarningBanner {...propsWithoutIcon} />);

      expect(screen.getByText('Attention')).toBeInTheDocument();
      expect(
        screen.getByText("Ceci est un message d'avertissement")
      ).toBeInTheDocument();
    });
  });

  describe('Message avec mot cliquable', () => {
    test('doit rendre un bouton pour le mot cliquable', () => {
      const onInviteClick = jest.fn();
      render(
        <WarningBanner
          title="Invitation"
          message="Cliquez pour rejoindre l'activité"
          onInviteClick={onInviteClick}
        />
      );

      const clickableButton = screen.getByText('rejoindre');
      expect(clickableButton).toBeInTheDocument();
      expect(clickableButton.tagName).toBe('BUTTON');
    });

    test('doit appeler onInviteClick quand cliqué', () => {
      const onInviteClick = jest.fn();
      render(
        <WarningBanner
          title="Invitation"
          message="Cliquez pour rejoindre l'activité"
          onInviteClick={onInviteClick}
        />
      );

      const clickableButton = screen.getByText('rejoindre');
      fireEvent.click(clickableButton);

      expect(onInviteClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variantes de couleur', () => {
    test('doit appliquer le variant blue par défaut', () => {
      const { container } = render(<WarningBanner {...defaultProps} />);

      const bannerDiv = container.firstChild;
      expect(bannerDiv).toHaveClass('bg-blue-50');
    });

    test('doit appliquer le variant purple', () => {
      const { container } = render(
        <WarningBanner {...defaultProps} variant="purple" />
      );

      const bannerDiv = container.firstChild;
      expect(bannerDiv).toHaveClass('bg-purple-50');
    });
  });

  describe('Mode sombre', () => {
    test('doit appliquer les couleurs dark mode', () => {
      const { container } = render(
        <WarningBanner {...defaultProps} darkMode={true} />
      );

      const bannerDiv = container.firstChild;
      expect(bannerDiv).toHaveClass('bg-blue-900/20');
    });
  });
});
