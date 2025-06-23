/**
 * Types et enums pour le système d'invitations événements
 * Phase 1 - Refactoring du système d'états
 * Phase 2 - Système de groupes
 */

// ===========================
// ENUMS D'ÉTATS UTILISATEUR
// ===========================

/**
 * États possibles d'un utilisateur dans le système d'événements
 * Règle métier: Un utilisateur ne peut être que dans UN seul état à la fois
 */
export const UserEventStatus = {
  LIBRE: 'libre', // Peut envoyer/recevoir des invitations
  INVITATION_ENVOYEE: 'invitation_envoyee', // A envoyé une invitation, en attente de réponse
  INVITATION_RECUE: 'invitation_recue', // A reçu une invitation, doit répondre
  EN_PARTAGE: 'en_partage', // Partage actif de localisation/disponibilité
};

/**
 * Statuts des invitations
 */
export const InvitationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
};

/**
 * Types de relations entre utilisateurs dans le contexte d'événements
 */
export const RelationshipType = {
  NONE: 'none', // Aucune relation active
  INVITATION_SENT: 'invitation_sent', // A envoyé une invitation
  INVITATION_RECEIVED: 'invitation_received', // A reçu une invitation
  IN_SAME_GROUP: 'in_same_group', // Dans le même groupe actif
};

// ===========================
// PHASE 2 - SYSTÈME DE GROUPES
// ===========================

/**
 * Modèle d'un groupe d'événement
 * Règle métier: Limite max de 10 personnes par groupe
 */
export const EventGroupModel = {
  id: '', // ID unique du groupe
  eventId: '', // ID de l'événement associé
  createdBy: '', // UserID du créateur
  members: [], // Array de UserIDs des membres
  createdAt: null, // Date de création
  maxMembers: 10, // Limite maximale (constante)
  activity: '', // Type d'activité (coffee, lunch, etc.)
  isActive: true, // Statut du groupe
  lastActivity: null, // Dernière activité du groupe
};

/**
 * Statuts d'un membre dans un groupe
 */
export const GroupMemberStatus = {
  ACTIVE: 'active', // Membre actif et en ligne
  OFFLINE: 'offline', // Membre du groupe mais hors ligne
  LEFT: 'left', // A quitté le groupe
};

/**
 * Types d'événements de groupe (pour l'historique)
 */
export const GroupEventType = {
  CREATED: 'created', // Groupe créé
  MEMBER_JOINED: 'member_joined', // Nouveau membre rejoint
  MEMBER_LEFT: 'member_left', // Membre a quitté
  ACTIVITY_CHANGED: 'activity_changed', // Activité modifiée
  GROUP_ENDED: 'group_ended', // Groupe terminé
};

// ===========================
// MODÈLES ÉTENDUS PHASE 2
// ===========================

/**
 * Modèle utilisateur étendu pour Phase 2
 */
export const ExtendedUserModel = {
  // Phase 1 - États
  eventStatus: UserEventStatus.LIBRE,
  currentEventId: null,
  currentGroupId: null, // 🎯 NOUVEAU: ID du groupe actuel
  pendingInvitations: [],

  // Phase 2 - Groupes
  groupHistory: [], // 🎯 NOUVEAU: Historique des groupes rejoints
  groupRole: null, // 🎯 NOUVEAU: 'creator' | 'member' | null
  lastGroupActivity: null, // 🎯 NOUVEAU: Dernière activité de groupe
  groupNotifications: true, // 🎯 NOUVEAU: Notifications de groupe activées
};

/**
 * Modèle d'invitation étendu pour Phase 2 + 3
 */
export const ExtendedInvitationModel = {
  id: '',
  eventId: '',
  fromUserId: '',
  toUserIds: [], // Support multi-destinataires (Phase 3)
  groupId: null, // 🎯 NOUVEAU: Si c'est pour rejoindre un groupe existant
  status: InvitationStatus.PENDING,
  createdAt: null,
  expiresAt: null, // 🚨 CRITIQUE Phase 3: Auto-expiration après 10min

  // Phase 2 - Groupes
  isGroupInvitation: false, // 🎯 NOUVEAU: Invitation pour rejoindre un groupe
  groupSize: 1, // 🎯 NOUVEAU: Taille actuelle du groupe
  invitationType: 'individual', // 🎯 NOUVEAU: 'individual' | 'group'

  // Phase 3 - Invitations multiples intelligentes
  isMultipleInvitation: false, // 🚨 NOUVEAU: Invitation à plusieurs destinataires
  totalRecipients: 1, // 🚨 NOUVEAU: Nombre total de destinataires
  acceptedByUserIds: [], // 🚨 NOUVEAU: IDs utilisateurs ayant accepté
  declinedByUserIds: [], // 🚨 NOUVEAU: IDs utilisateurs ayant décliné
  activity: '', // 🚨 NOUVEAU: Activité demandée (coffee, lunch...)
  priority: 'normal', // 🚨 NOUVEAU: 'high' | 'normal' | 'low' pour conflits
  conflictsWith: [], // 🚨 NOUVEAU: IDs autres invitations en conflit
  autoExpired: false, // 🚨 NOUVEAU: Expirée automatiquement
  expirationNotificationSent: false, // 🚨 NOUVEAU: Notification d'expiration envoyée
};

// ===========================
// CONSTANTES
// ===========================

export const EVENT_CONSTANTS = {
  MAX_GROUP_SIZE: 10, // Taille maximale d'un groupe
  MIN_GROUP_SIZE: 2, // Taille minimale pour former un groupe
  INVITATION_EXPIRY_MINUTES: 10, // Expiration des invitations en minutes
  GROUP_CLEANUP_HOURS: 24, // Nettoyage des groupes inactifs

  // Phase 3 - Invitations multiples
  MAX_MULTIPLE_RECIPIENTS: 8, // 🚨 NOUVEAU: Maximum destinataires par invitation multiple
  INVITATION_COOLDOWN_SECONDS: 30, // 🚨 NOUVEAU: Cooldown anti-spam entre invitations
  CONFLICT_PRIORITY_TIMEOUT_MINUTES: 5, // 🚨 NOUVEAU: Timeout priorité en cas de conflit
  EXPIRATION_CHECK_INTERVAL_MINUTES: 1, // 🚨 NOUVEAU: Intervalle vérification expiration

  // Collections Firestore
  COLLECTIONS: {
    USERS: 'users',
    EVENTS: 'events',
    GROUPS: 'groups',
    INVITATIONS: 'invitations',
    NOTIFICATIONS: 'notifications',
  },
};

// ===========================
// FONCTIONS UTILITAIRES PHASE 1
// ===========================

/**
 * Valide si une transition d'état est autorisée
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;

  const validTransitions = {
    [UserEventStatus.LIBRE]: [
      UserEventStatus.INVITATION_ENVOYEE,
      UserEventStatus.INVITATION_RECUE,
      UserEventStatus.EN_PARTAGE,
    ],
    [UserEventStatus.INVITATION_ENVOYEE]: [
      UserEventStatus.LIBRE,
      UserEventStatus.EN_PARTAGE,
    ],
    [UserEventStatus.INVITATION_RECUE]: [
      UserEventStatus.LIBRE,
      UserEventStatus.EN_PARTAGE,
    ],
    [UserEventStatus.EN_PARTAGE]: [UserEventStatus.LIBRE],
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
};

/**
 * Détermine si un utilisateur peut envoyer des invitations selon son état
 */
export const canSendInvitations = status => {
  return status === UserEventStatus.LIBRE;
};

/**
 * Détermine si un utilisateur peut recevoir des invitations selon son état
 */
export const canReceiveInvitations = status => {
  return status === UserEventStatus.LIBRE;
};

/**
 * Obtient le message d'affichage pour un état
 */
export const getStatusMessage = (status, activity = null) => {
  switch (status) {
    case UserEventStatus.LIBRE:
      return 'Libre';
    case UserEventStatus.INVITATION_ENVOYEE:
      return 'Invitation envoyée';
    case UserEventStatus.INVITATION_RECUE:
      return 'Invitation reçue';
    case UserEventStatus.EN_PARTAGE:
      return activity ? `En partage - ${activity}` : 'En partage';
    default:
      return 'État inconnu';
  }
};

/**
 * Obtient la couleur d'affichage pour un état
 */
export const getStatusColor = status => {
  switch (status) {
    case UserEventStatus.LIBRE:
      return 'green';
    case UserEventStatus.INVITATION_ENVOYEE:
      return 'orange';
    case UserEventStatus.INVITATION_RECUE:
      return 'blue';
    case UserEventStatus.EN_PARTAGE:
      return 'purple';
    default:
      return 'gray';
  }
};

// ===========================
// FONCTIONS UTILITAIRES PHASE 2 - GROUPES
// ===========================

/**
 * Valide si un groupe peut accepter un nouveau membre
 */
export const canGroupAcceptMember = (
  currentSize,
  maxSize = EVENT_CONSTANTS.MAX_GROUP_SIZE
) => {
  return currentSize < maxSize;
};

/**
 * Détermine si une taille constitue un "groupe" (vs 1v1)
 */
export const isGroupSize = memberCount => {
  return memberCount >= EVENT_CONSTANTS.MIN_GROUP_SIZE;
};

/**
 * Calcule la progression de formation du groupe (1v1 → groupe complet)
 */
export const getGroupProgress = (
  currentSize,
  maxSize = EVENT_CONSTANTS.MAX_GROUP_SIZE
) => {
  if (currentSize <= 0) return 0;
  return Math.min((currentSize / maxSize) * 100, 100);
};

/**
 * Obtient le message d'affichage pour la taille du groupe
 */
export const getGroupSizeMessage = memberCount => {
  if (memberCount === 1) return 'Seul(e)';
  if (memberCount === 2) return 'En duo';
  if (memberCount <= 5) return `Groupe de ${memberCount}`;
  if (memberCount <= 8) return `Grand groupe (${memberCount})`;
  return `Groupe complet (${memberCount}/${EVENT_CONSTANTS.MAX_GROUP_SIZE})`;
};

/**
 * Détermine la couleur d'affichage selon la taille du groupe
 */
export const getGroupSizeColor = (
  memberCount,
  maxSize = EVENT_CONSTANTS.MAX_GROUP_SIZE
) => {
  const ratio = memberCount / maxSize;
  if (ratio < 0.3) return 'blue'; // Petit groupe
  if (ratio < 0.7) return 'green'; // Groupe moyen
  if (ratio < 1.0) return 'orange'; // Groupe presque plein
  return 'red'; // Groupe complet
};

/**
 * Valide la structure d'un groupe
 */
export const validateGroupStructure = group => {
  if (!group || typeof group !== 'object')
    return { valid: false, error: 'Groupe invalide' };

  if (!group.id || typeof group.id !== 'string') {
    return { valid: false, error: 'ID de groupe manquant' };
  }

  if (!group.eventId || typeof group.eventId !== 'string') {
    return { valid: false, error: "ID d'événement manquant" };
  }

  if (!group.createdBy || typeof group.createdBy !== 'string') {
    return { valid: false, error: 'Créateur manquant' };
  }

  if (!Array.isArray(group.members)) {
    return { valid: false, error: 'Liste de membres invalide' };
  }

  if (group.members.length > EVENT_CONSTANTS.MAX_GROUP_SIZE) {
    return { valid: false, error: 'Trop de membres dans le groupe' };
  }

  if (!group.members.includes(group.createdBy)) {
    return { valid: false, error: 'Le créateur doit être membre du groupe' };
  }

  return { valid: true };
};

/**
 * Crée un modèle de groupe par défaut
 */
export const createDefaultGroup = (eventId, creatorId, activity) => {
  return {
    ...EventGroupModel,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventId,
    createdBy: creatorId,
    members: [creatorId],
    createdAt: new Date(),
    activity,
    lastActivity: new Date(),
  };
};

// ===========================
// FONCTIONS UTILITAIRES PHASE 3 - INVITATIONS MULTIPLES
// ===========================

/**
 * Statuts d'invitation étendus pour Phase 3
 */
export const InvitationPriority = {
  HIGH: 'high', // Priorité haute (pour conflits)
  NORMAL: 'normal', // Priorité normale
  LOW: 'low', // Priorité basse
};

/**
 * Types de conflit d'invitation
 */
export const ConflictType = {
  SIMULTANEOUS: 'simultaneous', // Invitations reçues simultanément
  OVERLAPPING: 'overlapping', // Invitations qui se chevauchent
  DUPLICATE: 'duplicate', // Même expéditeur, même activité
};

/**
 * Vérifie si une invitation est expirée
 */
export const isInvitationExpired = invitation => {
  if (!invitation.expiresAt) return false;

  const expirationTime = invitation.expiresAt.toDate
    ? invitation.expiresAt.toDate().getTime()
    : new Date(invitation.expiresAt).getTime();

  return Date.now() > expirationTime;
};

/**
 * Calcule la date d'expiration pour une nouvelle invitation
 */
export const calculateExpirationDate = (
  minutesFromNow = EVENT_CONSTANTS.INVITATION_EXPIRY_MINUTES
) => {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
};

/**
 * Valide si un utilisateur peut envoyer une invitation multiple
 */
export const canSendMultipleInvitation = (userStatus, recipientCount) => {
  if (userStatus !== UserEventStatus.LIBRE)
    return {
      canSend: false,
      reason: 'Utilisateur non libre',
    };

  if (recipientCount > EVENT_CONSTANTS.MAX_MULTIPLE_RECIPIENTS)
    return {
      canSend: false,
      reason: `Maximum ${EVENT_CONSTANTS.MAX_MULTIPLE_RECIPIENTS} destinataires`,
    };

  if (recipientCount < 1)
    return {
      canSend: false,
      reason: 'Au moins un destinataire requis',
    };

  return { canSend: true };
};

/**
 * Détermine la priorité d'une invitation basée sur le contexte
 */
export const getInvitationPriority = invitationContext => {
  // Si c'est une réponse à une invitation existante
  if (invitationContext.isResponse) return InvitationPriority.HIGH;

  // Si l'expéditeur est déjà en relation active
  if (invitationContext.hasActiveRelation) return InvitationPriority.HIGH;

  // Si c'est une invitation de groupe
  if (invitationContext.isGroupInvitation) return InvitationPriority.NORMAL;

  // Par défaut
  return InvitationPriority.NORMAL;
};

/**
 * Formate le message d'invitation multiple pour l'affichage
 */
export const formatMultipleInvitationMessage = invitation => {
  const { fromUserName, activity, totalRecipients, acceptedByUserIds } =
    invitation;
  const acceptedCount = acceptedByUserIds.length;

  if (totalRecipients === 1) {
    return `🎉 ${fromUserName} vous invite pour ${activity}`;
  }

  if (acceptedCount === 0) {
    return `🎉 ${fromUserName} vous invite pour ${activity} (${totalRecipients} invités)`;
  }

  return `🎉 ${fromUserName} vous invite pour ${activity} (${acceptedCount}/${totalRecipients} ont accepté)`;
};

/**
 * Vérifie les conflits entre invitations
 */
export const detectInvitationConflicts = (
  newInvitation,
  existingInvitations
) => {
  const conflicts = [];

  existingInvitations.forEach(existing => {
    // Conflit si même expéditeur + même activité + encore active
    if (
      existing.fromUserId === newInvitation.fromUserId &&
      existing.activity === newInvitation.activity &&
      existing.status === InvitationStatus.PENDING &&
      !isInvitationExpired(existing)
    ) {
      conflicts.push({
        type: ConflictType.DUPLICATE,
        conflictingInvitation: existing,
        reason: 'Invitation similaire déjà en cours',
      });
    }

    // Conflit si invitations overlapping dans le temps
    if (
      existing.status === InvitationStatus.PENDING &&
      !isInvitationExpired(existing) &&
      existing.fromUserId !== newInvitation.fromUserId
    ) {
      conflicts.push({
        type: ConflictType.SIMULTANEOUS,
        conflictingInvitation: existing,
        reason: 'Invitations simultanées détectées',
      });
    }
  });

  return conflicts;
};
