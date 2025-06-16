// @ts-nocheck
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NotificationBadge from '../components/NotificationBadge';

describe('NotificationBadge', () => {
  describe('Rendu conditionnel', () => {
    test("ne doit pas s'afficher quand count est 0", () => {
      render(<NotificationBadge count={0} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test("ne doit pas s'afficher quand count n'est pas fourni (valeur par défaut)", () => {
      render(<NotificationBadge />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test("doit s'afficher quand count est supérieur à 0", () => {
      render(<NotificationBadge count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Affichage des valeurs', () => {
    test('doit afficher le nombre exact pour count < 100', () => {
      render(<NotificationBadge count={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('doit afficher "99+" pour count >= 100', () => {
      render(<NotificationBadge count={150} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    test('doit afficher "99+" pour count = 99', () => {
      render(<NotificationBadge count={99} />);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    test('doit afficher "99+" pour count = 100', () => {
      render(<NotificationBadge count={100} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Classes CSS et styles', () => {
    test('doit avoir les bonnes classes CSS', () => {
      render(<NotificationBadge count={1} />);
      const badge = screen.getByText('1');

      expect(badge).toHaveClass('absolute');
      expect(badge).toHaveClass('-top-1');
      expect(badge).toHaveClass('-right-1');
      expect(badge).toHaveClass('bg-red-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('w-5');
      expect(badge).toHaveClass('h-5');
      expect(badge).toHaveClass('flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('justify-center');
      expect(badge).toHaveClass('font-medium');
    });
  });

  describe('Cas limites', () => {
    test('doit gérer count négatif comme 0', () => {
      render(<NotificationBadge count={-5} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test('doit gérer count null', () => {
      render(<NotificationBadge count={null} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test('doit gérer count undefined', () => {
      render(<NotificationBadge count={undefined} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test('doit gérer de très grands nombres', () => {
      render(<NotificationBadge count={9999} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    test("doit être lisible par les lecteurs d'écran", () => {
      render(<NotificationBadge count={5} />);
      const badge = screen.getByText('5');

      // Vérifier que le texte est visible
      expect(badge).toBeVisible();
      expect(badge).toHaveTextContent('5');
    });

    test('doit avoir un contraste suffisant (classes CSS)', () => {
      render(<NotificationBadge count={1} />);
      const badge = screen.getByText('1');

      // Vérifier les classes qui assurent le contraste
      expect(badge).toHaveClass('bg-red-500');
      expect(badge).toHaveClass('text-white');
    });
  });
});
