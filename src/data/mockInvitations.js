/**
 * Données mock pour les invitations
 * Ces données seront remplacées par les vraies données Firebase
 *
 * Structure identique aux données réelles pour faciliter la transition
 */

export const MOCK_INVITATIONS = [
  // CAS 1: Invitation d'activité reçue
  {
    id: 'mock-invitation-1',
    type: 'invitation_received',
    user: {
      uid: 'mock-user-1',
      displayName: 'Marie',
      photoURL: null,
    },
    activity: 'coffee',
    createdAt: 'Il y a 2 min',
    expiresIn: '8 min',
    distance: '350m',
  },

  // CAS 2: Invitation envoyée, en attente
  {
    id: 'mock-invitation-2',
    type: 'invitation_sent',
    user: {
      uid: 'mock-user-2',
      displayName: 'Thomas',
      photoURL: null,
    },
    activity: 'lunch',
    createdAt: 'Il y a 1 min',
    expiresIn: '9 min',
  },

  // CAS 3: Rendez-vous en cours
  {
    id: 'mock-invitation-3',
    type: 'in_progress',
    user: {
      uid: 'mock-user-3',
      displayName: 'Sophie',
      photoURL: null,
    },
    activity: 'drinks',
    distance: '120m',
    locationName: 'Bar Le Central',
    timeRemaining: '38:42',
  },

  // CAS 4: Rendez-vous bientôt terminé
  {
    id: 'mock-invitation-4',
    type: 'ending_soon',
    user: {
      uid: 'mock-user-4',
      displayName: 'Lucas',
      photoURL: null,
    },
    activity: 'lunch',
    timeRemaining: '04:15',
  },

  // CAS 5: Demande d'ami
  {
    id: 'mock-invitation-5',
    type: 'friend_request',
    user: {
      uid: 'mock-user-5',
      displayName: 'Alex',
      photoURL: null,
    },
  },

  // CAS 6: Invitation de groupe
  {
    id: 'mock-invitation-6',
    type: 'group_invitation',
    users: [
      { uid: 'mock-user-6', displayName: 'Emma', photoURL: null },
      { uid: 'mock-user-7', displayName: 'Jules', photoURL: null },
    ],
    groupSize: 3,
    activity: 'chill',
    locationName: 'Parc Central',
    timeRemaining: '28 min',
  },

  // CAS 7: Invitation déclinée
  {
    id: 'mock-invitation-7',
    type: 'declined',
    user: {
      uid: 'mock-user-8',
      displayName: 'Pierre',
      photoURL: null,
    },
    createdAt: 'Il y a 5 min',
  },

  // CAS 8: Invitation expirée
  {
    id: 'mock-invitation-8',
    type: 'expired',
    user: {
      uid: 'mock-user-9',
      displayName: 'Clara',
      photoURL: null,
    },
  },
];

/**
 * Fonction utilitaire pour transformer les vraies données Firebase
 * en format compatible avec InvitationCard
 *
 * @param {Object} invitation - Invitation depuis Firebase
 * @param {Object} userData - Données utilisateur associé
 * @param {string} currentUserId - ID de l'utilisateur courant
 * @returns {Object} - Données formatées pour InvitationCard
 */
export const formatInvitationForCard = (
  invitation,
  userData,
  currentUserId
) => {
  // Déterminer le type basé sur le statut et la direction
  let type = 'invitation_received';

  if (invitation.fromUserId === currentUserId) {
    // C'est une invitation envoyée par l'utilisateur courant
    if (invitation.status === 'pending') {
      type = 'invitation_sent';
    } else if (invitation.status === 'declined') {
      type = 'declined';
    } else if (invitation.status === 'expired') {
      type = 'expired';
    }
  } else {
    // C'est une invitation reçue
    if (invitation.status === 'accepted') {
      // Vérifier si bientôt terminé
      const remaining = calculateTimeRemaining(invitation.createdAt);
      type = remaining && remaining.minutes < 5 ? 'ending_soon' : 'in_progress';
    }
  }

  // Gérer les invitations de groupe
  if (invitation.isGroupInvitation) {
    type = 'group_invitation';
  }

  // Gérer les demandes d'ami
  if (invitation.type === 'friend_invitation') {
    type = 'friend_request';
  }

  return {
    id: invitation.id,
    type,
    user: userData,
    users: invitation.groupMembers || null,
    activity: invitation.activity,
    createdAt: invitation.createdAt,
    expiresIn: calculateExpiresIn(invitation.createdAt),
    timeRemaining: calculateTimeRemaining(invitation.createdAt)?.formatted,
    distance: invitation.distance,
    locationName: invitation.locationName,
    groupSize: invitation.groupSize,
  };
};

/**
 * Calcule le temps restant avant expiration
 */
const calculateExpiresIn = createdAt => {
  if (!createdAt) return null;

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const expirationMs = 10 * 60 * 1000; // 10 minutes
  const remaining = Math.max(0, created + expirationMs - now);

  if (remaining === 0) return 'Expiré';

  const minutes = Math.floor(remaining / 60000);
  return `${minutes} min`;
};

/**
 * Calcule le temps restant pour une activité en cours
 */
const calculateTimeRemaining = createdAt => {
  if (!createdAt) return null;

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const durationMs = 45 * 60 * 1000; // 45 minutes
  const remaining = Math.max(0, created + durationMs - now);

  if (remaining === 0) return null;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return {
    minutes,
    seconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
  };
};
