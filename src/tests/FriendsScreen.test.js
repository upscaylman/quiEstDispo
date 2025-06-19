// @ts-nocheck
// Tests FriendsScreen.js - PHASE 3 - UI Complexe (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import FriendsScreen from '../components/screens/FriendsScreen';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
    button: ({ children, className, whileHover, whileTap, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ size, className }) => (
    <div
      className={className}
      data-testid="check-icon"
      style={{ width: size, height: size }}
    >
      ✓
    </div>
  ),
  UserMinus: ({ size, className }) => (
    <div
      className={className}
      data-testid="user-minus-icon"
      style={{ width: size, height: size }}
    >
      👤➖
    </div>
  ),
  UserPlus: ({ size, className }) => (
    <div
      className={className}
      data-testid="user-plus-icon"
      style={{ width: size, height: size }}
    >
      👤➕
    </div>
  ),
}));

describe('FriendsScreen - PHASE 3 - UI Complexe', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    friends: [
      {
        id: 'friend1',
        name: 'Alice Martin',
        avatar: '👩',
        isOnline: true,
      },
      {
        id: 'friend2',
        name: 'Bob Dupont',
        avatar: 'https://example.com/avatar.jpg',
        isOnline: false,
      },
    ],
    darkMode: false,
    isOnline: true,
    user: { id: 'user1', name: 'Test User' },
    notifications: [
      {
        id: 'notif1',
        type: 'friend_invitation',
        message: "Alice Martin vous a envoyé une demande d'amitié",
        read: false,
        createdAt: {
          toDate: () => new Date('2024-01-15T10:30:00Z'),
        },
        data: {
          actions: true,
          invitationId: 'inv123',
        },
      },
    ],
    newFriendsNotificationsCount: 1,
    onAddFriend: jest.fn(),
    onRemoveFriend: jest.fn(),
    onMarkAllFriendsNotificationsAsRead: jest.fn(),
    onFriendInvitationResponse: jest.fn(),
    onDebugFriends: jest.fn(),
    onCreateTestFriendships: jest.fn(),
    onLoadMockData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('📱 Affichage interface utilisateur', () => {
    test('doit afficher la liste des amis', () => {
      render(<FriendsScreen {...defaultProps} />);

      expect(screen.getByText('Alice Martin')).toBeInTheDocument();
      expect(screen.getByText('Bob Dupont')).toBeInTheDocument();
      expect(screen.getByText('🟢 En ligne')).toBeInTheDocument();
      expect(screen.getByText('⚫ Hors ligne')).toBeInTheDocument();
    });

    test('doit afficher les avatars correctement', () => {
      render(<FriendsScreen {...defaultProps} />);

      // Avatar emoji
      expect(screen.getByText('👩')).toBeInTheDocument();

      // Avatar image
      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage.src).toBe('https://example.com/avatar.jpg');
    });

    test("doit afficher l'état vide quand aucun ami", () => {
      const emptyProps = { ...defaultProps, friends: [] };
      render(<FriendsScreen {...emptyProps} />);

      expect(screen.getByText("Aucun ami pour l'instant")).toBeInTheDocument();
      expect(
        screen.getByText('Ajoutez vos premiers amis pour commencer !')
      ).toBeInTheDocument();
    });

    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<FriendsScreen {...darkProps} />);

      // Vérifier qu'il y a des éléments avec les classes de mode sombre
      const darkElements = document.querySelectorAll('.bg-gray-800');
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  describe("🔔 Gestion des invitations d'amitié", () => {
    test('doit afficher les invitations en attente', () => {
      render(<FriendsScreen {...defaultProps} />);

      expect(screen.getByText("🤝 Invitations d'amitié")).toBeInTheDocument();
      expect(
        screen.getByText("Alice Martin vous a envoyé une demande d'amitié")
      ).toBeInTheDocument();
      expect(screen.getByText('✅ Accepter')).toBeInTheDocument();
      expect(screen.getByText('❌ Refuser')).toBeInTheDocument();
    });

    test('doit masquer la section si aucune invitation', () => {
      const noInvitationsProps = {
        ...defaultProps,
        notifications: [],
      };
      render(<FriendsScreen {...noInvitationsProps} />);

      expect(
        screen.queryByText("🤝 Invitations d'amitié")
      ).not.toBeInTheDocument();
    });

    test("doit appeler onFriendInvitationResponse lors de l'acceptation", () => {
      render(<FriendsScreen {...defaultProps} />);

      const acceptButton = screen.getByText('✅ Accepter');

      fireEvent.click(acceptButton);

      expect(defaultProps.onFriendInvitationResponse).toHaveBeenCalledWith(
        'inv123',
        'accepted',
        'notif1'
      );
    });

    test('doit appeler onFriendInvitationResponse lors du refus', () => {
      render(<FriendsScreen {...defaultProps} />);

      const declineButton = screen.getByText('❌ Refuser');

      fireEvent.click(declineButton);

      expect(defaultProps.onFriendInvitationResponse).toHaveBeenCalledWith(
        'inv123',
        'declined',
        'notif1'
      );
    });

    test("doit afficher l'heure de création des invitations", () => {
      render(<FriendsScreen {...defaultProps} />);

      // L'heure doit être formatée en heure locale
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe("🗑️ Suppression d'amis", () => {
    test('doit permettre de supprimer un ami', () => {
      render(<FriendsScreen {...defaultProps} />);

      const removeButtons = screen.getAllByTestId('user-minus-icon');
      const firstRemoveButton = removeButtons[0];

      fireEvent.click(firstRemoveButton);

      expect(defaultProps.onRemoveFriend).toHaveBeenCalledWith(
        'friend1',
        'Alice Martin'
      );
    });

    test('doit avoir un tooltip informatif sur le bouton de suppression', () => {
      render(<FriendsScreen {...defaultProps} />);

      const removeButton = screen
        .getAllByTestId('user-minus-icon')[0]
        .closest('button');
      expect(removeButton).toHaveAttribute(
        'title',
        'Supprimer Alice Martin de vos amis'
      );
    });
  });

  describe('📊 Gestion des notifications', () => {
    test('doit afficher le bouton de marquage des notifications', () => {
      render(<FriendsScreen {...defaultProps} />);

      expect(
        screen.getByText('Marquer notif. amis lues (1)')
      ).toBeInTheDocument();
    });

    test('doit masquer le bouton si aucune notification', () => {
      const noNotifProps = {
        ...defaultProps,
        newFriendsNotificationsCount: 0,
      };
      render(<FriendsScreen {...noNotifProps} />);

      expect(screen.queryByText(/Marquer notif/)).not.toBeInTheDocument();
    });

    test('doit appeler onMarkAllFriendsNotificationsAsRead', () => {
      render(<FriendsScreen {...defaultProps} />);

      const markButton = screen.getByText('Marquer notif. amis lues (1)');

      fireEvent.click(markButton);

      expect(
        defaultProps.onMarkAllFriendsNotificationsAsRead
      ).toHaveBeenCalled();
    });
  });

  describe('🧪 Cas limite et robustesse', () => {
    test('doit gérer les notifications sans timestamp', () => {
      const propsWithoutTimestamp = {
        ...defaultProps,
        notifications: [
          {
            ...defaultProps.notifications[0],
            createdAt: null,
          },
        ],
      };

      render(<FriendsScreen {...propsWithoutTimestamp} />);

      expect(screen.getByText('Maintenant')).toBeInTheDocument();
    });

    test('doit gérer les notifications sans actions', () => {
      const propsWithoutActions = {
        ...defaultProps,
        notifications: [
          {
            ...defaultProps.notifications[0],
            data: { actions: false },
          },
        ],
      };

      render(<FriendsScreen {...propsWithoutActions} />);

      expect(screen.queryByText('✅ Accepter')).not.toBeInTheDocument();
      expect(screen.queryByText('❌ Refuser')).not.toBeInTheDocument();
    });

    test("doit gérer l'absence de props optionnelles", () => {
      const minimalProps = {
        friends: [],
        darkMode: false,
        isOnline: true,
        user: null,
        notifications: [],
        newFriendsNotificationsCount: 0,
      };

      expect(() => {
        render(<FriendsScreen {...minimalProps} />);
      }).not.toThrow();
    });

    test("doit filtrer correctement les notifications d'amis", () => {
      const mixedNotifications = {
        ...defaultProps,
        notifications: [
          defaultProps.notifications[0], // friend_invitation
          {
            id: 'notif2',
            type: 'activity_invitation',
            message: 'Invitation activité',
            read: false,
          },
          {
            id: 'notif3',
            type: 'friend_invitation',
            message: 'Autre invitation amitié',
            read: true, // lue
          },
        ],
      };

      render(<FriendsScreen {...mixedNotifications} />);

      // Seule la première invitation d'amitié non lue doit être affichée
      expect(
        screen.getByText("Alice Martin vous a envoyé une demande d'amitié")
      ).toBeInTheDocument();
      expect(screen.queryByText('Invitation activité')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Autre invitation amitié')
      ).not.toBeInTheDocument();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      render(<FriendsScreen {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Vérifier que les boutons critiques sont présents
      expect(screen.getByText('✅ Accepter')).toBeInTheDocument();
      expect(screen.getByText('❌ Refuser')).toBeInTheDocument();
    });

    test('doit avoir des images avec alt text', () => {
      render(<FriendsScreen {...defaultProps} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage).toBeInTheDocument();
    });
  });
});
