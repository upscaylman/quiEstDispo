// @ts-nocheck
// Tests ActivityCard.js - PHASE 3 - UI Complexe (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import ActivityCard from '../components/ActivityCard';

// === MOCKS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, whileHover, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({ children, className, whileTap, onClick, ...props }) => {
      const React = require('react');
      return React.createElement(
        'button',
        { className, onClick, ...props },
        children
      );
    },
  },
}));

describe('ActivityCard - PHASE 3 - UI Complexe', () => {
  const defaultProps = {
    activity: 'coffee',
    friend: {
      name: 'Alice',
      avatar: '👩',
      location: 'Paris 11ème',
      timeLeft: 30,
    },
    onJoin: jest.fn(),
    darkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🎨 Rendering et Structure', () => {
    test("doit afficher les informations de l'ami", () => {
      render(<ActivityCard {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
      expect(screen.getByText('Paris 11ème')).toBeInTheDocument();
    });

    test("doit afficher l'activité avec le bon style", () => {
      render(<ActivityCard {...defaultProps} />);

      expect(screen.getByText('coffee')).toBeInTheDocument();
    });

    test('doit afficher le temps restant', () => {
      render(<ActivityCard {...defaultProps} />);

      expect(screen.getByText('30 min left')).toBeInTheDocument();
    });

    test('doit afficher le bouton Join', () => {
      render(<ActivityCard {...defaultProps} />);

      expect(screen.getByText('Join')).toBeInTheDocument();
    });
  });

  describe('🎨 Couleurs des activités', () => {
    test('doit appliquer la couleur amber pour coffee', () => {
      render(<ActivityCard {...defaultProps} activity="coffee" />);

      const activityBadge = screen.getByText('coffee');
      expect(activityBadge).toHaveClass('from-amber-400', 'to-orange-500');
    });

    test('doit appliquer la couleur verte pour lunch', () => {
      render(<ActivityCard {...defaultProps} activity="lunch" />);

      const activityBadge = screen.getByText('lunch');
      expect(activityBadge).toHaveClass('from-green-400', 'to-emerald-500');
    });

    test('doit appliquer la couleur violette pour drinks', () => {
      render(<ActivityCard {...defaultProps} activity="drinks" />);

      const activityBadge = screen.getByText('drinks');
      expect(activityBadge).toHaveClass('from-purple-400', 'to-pink-500');
    });

    test('doit appliquer la couleur bleue pour chill', () => {
      render(<ActivityCard {...defaultProps} activity="chill" />);

      const activityBadge = screen.getByText('chill');
      expect(activityBadge).toHaveClass('from-blue-400', 'to-indigo-500');
    });

    test('doit appliquer la couleur grise par défaut', () => {
      render(<ActivityCard {...defaultProps} activity="unknown" />);

      const activityBadge = screen.getByText('unknown');
      expect(activityBadge).toHaveClass('from-gray-400', 'to-gray-500');
    });

    test('doit être insensible à la casse', () => {
      render(<ActivityCard {...defaultProps} activity="COFFEE" />);

      const activityBadge = screen.getByText('COFFEE');
      expect(activityBadge).toHaveClass('from-amber-400', 'to-orange-500');
    });
  });

  describe('🌙 Mode sombre', () => {
    test('doit appliquer les styles sombres', () => {
      render(<ActivityCard {...defaultProps} darkMode={true} />);

      const card = screen.getByText('Alice').closest('div');
      expect(card).toHaveClass('bg-gray-800', 'border-gray-700');
    });

    test('doit appliquer les styles clairs par défaut', () => {
      render(<ActivityCard {...defaultProps} darkMode={false} />);

      const card = screen.getByText('Alice').closest('div');
      expect(card).toHaveClass('bg-white', 'border-gray-100');
    });
  });

  describe('🖱️ Interactions', () => {
    test('doit appeler onJoin quand le bouton est cliqué', () => {
      const onJoin = jest.fn();
      render(<ActivityCard {...defaultProps} onJoin={onJoin} />);

      const joinButton = screen.getByText('Join');
      fireEvent.click(joinButton);

      expect(onJoin).toHaveBeenCalledTimes(1);
    });

    test('doit fonctionner même sans onJoin', () => {
      render(<ActivityCard {...defaultProps} onJoin={undefined} />);

      const joinButton = screen.getByText('Join');
      expect(() => fireEvent.click(joinButton)).not.toThrow();
    });
  });

  describe('📱 Props variées', () => {
    test("doit gérer des noms d'amis longs", () => {
      const longNameFriend = {
        ...defaultProps.friend,
        name: 'Jean-Baptiste Alexandre',
      };

      render(<ActivityCard {...defaultProps} friend={longNameFriend} />);

      expect(screen.getByText('Jean-Baptiste Alexandre')).toBeInTheDocument();
    });

    test('doit gérer des localisations longues', () => {
      const longLocationFriend = {
        ...defaultProps.friend,
        location: 'Saint-Germain-des-Prés, Paris 6ème arrondissement',
      };

      render(<ActivityCard {...defaultProps} friend={longLocationFriend} />);

      expect(
        screen.getByText('Saint-Germain-des-Prés, Paris 6ème arrondissement')
      ).toBeInTheDocument();
    });

    test('doit gérer des temps très courts', () => {
      const shortTimeFriend = {
        ...defaultProps.friend,
        timeLeft: 2,
      };

      render(<ActivityCard {...defaultProps} friend={shortTimeFriend} />);

      expect(screen.getByText('2 min left')).toBeInTheDocument();
    });

    test('doit gérer des temps longs', () => {
      const longTimeFriend = {
        ...defaultProps.friend,
        timeLeft: 120,
      };

      render(<ActivityCard {...defaultProps} friend={longTimeFriend} />);

      expect(screen.getByText('120 min left')).toBeInTheDocument();
    });

    test('doit gérer différents avatars émojis', () => {
      const emojiVariations = ['👨', '👩', '🧑', '👴', '👵', '🎭'];

      emojiVariations.forEach(emoji => {
        const { unmount } = render(
          <ActivityCard
            {...defaultProps}
            friend={{ ...defaultProps.friend, avatar: emoji }}
          />
        );

        expect(screen.getByText(emoji)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('🔄 Cas limites', () => {
    test('doit gérer des props manquantes gracieusement', () => {
      const minimalProps = {
        activity: 'coffee',
        friend: {
          name: 'Alice',
        },
        onJoin: jest.fn(),
      };

      expect(() => render(<ActivityCard {...minimalProps} />)).not.toThrow();
    });

    test('doit gérer une activité vide', () => {
      const { container } = render(
        <ActivityCard {...defaultProps} activity="" />
      );

      // Une activité vide devrait utiliser les couleurs par défaut
      const activityElement = container.querySelector(
        '[class*="from-gray-400"]'
      );
      expect(activityElement).toBeInTheDocument();
    });

    test('doit gérer un timeLeft à 0', () => {
      const expiredFriend = {
        ...defaultProps.friend,
        timeLeft: 0,
      };

      render(<ActivityCard {...defaultProps} friend={expiredFriend} />);

      expect(screen.getByText('0 min left')).toBeInTheDocument();
    });
  });

  describe('🎭 Accessibilité', () => {
    test('doit avoir un bouton accessible', () => {
      render(<ActivityCard {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: 'Join' });
      expect(joinButton).toBeInTheDocument();
    });

    test('doit afficher le texte des informations importantes', () => {
      render(<ActivityCard {...defaultProps} />);

      // Informations critiques accessibles
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('coffee')).toBeInTheDocument();
      expect(screen.getByText('30 min left')).toBeInTheDocument();
    });
  });

  describe('📊 Différentes combinaisons', () => {
    test('doit fonctionner avec toutes les activités en mode sombre', () => {
      const activities = ['coffee', 'lunch', 'drinks', 'chill', 'random'];

      activities.forEach(activity => {
        const { unmount } = render(
          <ActivityCard {...defaultProps} activity={activity} darkMode={true} />
        );

        expect(screen.getByText(activity)).toBeInTheDocument();
        unmount();
      });
    });

    test('doit maintenir la cohérence visuelle', () => {
      render(<ActivityCard {...defaultProps} />);

      // Vérifier que tous les éléments sont présents
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
      expect(screen.getByText('Paris 11ème')).toBeInTheDocument();
      expect(screen.getByText('coffee')).toBeInTheDocument();
      expect(screen.getByText('30 min left')).toBeInTheDocument();
      expect(screen.getByText('Join')).toBeInTheDocument();
    });
  });
});
