// Tests pour les types EventTypes - Phase 1 refactoring
import {
  calculateExpirationDate,
  canGroupAcceptMember,
  // Phase 3 - Invitations multiples
  canSendMultipleInvitation,
  ConflictType,
  createDefaultGroup,
  detectInvitationConflicts,
  EVENT_CONSTANTS,
  formatMultipleInvitationMessage,
  getGroupProgress,
  getGroupSizeColor,
  getGroupSizeMessage,
  getInvitationPriority,
  getStatusColor,
  getStatusMessage,
  InvitationPriority,
  isGroupSize,
  isInvitationExpired,
  isValidStatusTransition,
  UserEventStatus,
  validateGroupStructure,
} from '../types/eventTypes';

describe('EventTypes - Phase 1 Refactoring', () => {
  describe('États utilisateur', () => {
    test('doit exporter tous les enums requis', () => {
      expect(UserEventStatus.LIBRE).toBe('libre');
      expect(UserEventStatus.INVITATION_ENVOYEE).toBe('invitation_envoyee');
      expect(UserEventStatus.INVITATION_RECUE).toBe('invitation_recue');
      expect(UserEventStatus.EN_PARTAGE).toBe('en_partage');
    });

    test("doit valider les transitions d'états valides", () => {
      // Tests des transitions valides selon notre plan
      expect(
        isValidStatusTransition(
          UserEventStatus.LIBRE,
          UserEventStatus.INVITATION_ENVOYEE
        )
      ).toBe(true);
      expect(
        isValidStatusTransition(
          UserEventStatus.LIBRE,
          UserEventStatus.INVITATION_RECUE
        )
      ).toBe(true);
      expect(
        isValidStatusTransition(
          UserEventStatus.LIBRE,
          UserEventStatus.EN_PARTAGE
        )
      ).toBe(true);

      expect(
        isValidStatusTransition(
          UserEventStatus.INVITATION_ENVOYEE,
          UserEventStatus.LIBRE
        )
      ).toBe(true);
      expect(
        isValidStatusTransition(
          UserEventStatus.INVITATION_ENVOYEE,
          UserEventStatus.EN_PARTAGE
        )
      ).toBe(true);

      expect(
        isValidStatusTransition(
          UserEventStatus.EN_PARTAGE,
          UserEventStatus.LIBRE
        )
      ).toBe(true);
    });

    test("doit rejeter les transitions d'états invalides", () => {
      // Tests des transitions invalides
      expect(
        isValidStatusTransition(
          UserEventStatus.INVITATION_ENVOYEE,
          UserEventStatus.INVITATION_RECUE
        )
      ).toBe(false);
      expect(
        isValidStatusTransition(
          UserEventStatus.EN_PARTAGE,
          UserEventStatus.INVITATION_ENVOYEE
        )
      ).toBe(false);
    });
  });

  describe("Messages et couleurs d'état", () => {
    test('doit retourner des messages appropriés pour chaque état', () => {
      expect(getStatusMessage(UserEventStatus.LIBRE)).toContain('Libre');
      expect(getStatusMessage(UserEventStatus.INVITATION_ENVOYEE)).toContain(
        'Invitation envoyée'
      );
      expect(getStatusMessage(UserEventStatus.INVITATION_RECUE)).toContain(
        'Invitation reçue'
      );
      expect(getStatusMessage(UserEventStatus.EN_PARTAGE)).toContain(
        'En partage'
      );
    });

    test('doit retourner des couleurs appropriées pour chaque état', () => {
      expect(getStatusColor(UserEventStatus.LIBRE)).toBe('green');
      expect(getStatusColor(UserEventStatus.INVITATION_ENVOYEE)).toBe('orange');
      expect(getStatusColor(UserEventStatus.INVITATION_RECUE)).toBe('blue');
      expect(getStatusColor(UserEventStatus.EN_PARTAGE)).toBe('purple');
    });
  });

  describe('Validation des états', () => {
    test("doit permettre les bonnes actions selon l'état", () => {
      // Les utilisateurs LIBRE peuvent envoyer et recevoir des invitations
      expect(
        isValidStatusTransition(
          UserEventStatus.LIBRE,
          UserEventStatus.INVITATION_ENVOYEE
        )
      ).toBe(true);
      expect(
        isValidStatusTransition(
          UserEventStatus.LIBRE,
          UserEventStatus.INVITATION_RECUE
        )
      ).toBe(true);

      // Les utilisateurs EN_PARTAGE ne peuvent que revenir à LIBRE
      expect(
        isValidStatusTransition(
          UserEventStatus.EN_PARTAGE,
          UserEventStatus.LIBRE
        )
      ).toBe(true);
      expect(
        isValidStatusTransition(
          UserEventStatus.EN_PARTAGE,
          UserEventStatus.INVITATION_ENVOYEE
        )
      ).toBe(false);
      expect(
        isValidStatusTransition(
          UserEventStatus.EN_PARTAGE,
          UserEventStatus.INVITATION_RECUE
        )
      ).toBe(false);
    });

    test('doit gérer des inputs invalides gracieusement', () => {
      // Teste avec des valeurs nulles/undefined
      expect(isValidStatusTransition(null, UserEventStatus.LIBRE)).toBe(false);
      expect(isValidStatusTransition(UserEventStatus.LIBRE, null)).toBe(false);
      expect(isValidStatusTransition(undefined, undefined)).toBe(false);

      // Teste avec des strings incorrectes
      expect(
        isValidStatusTransition('invalid_state', UserEventStatus.LIBRE)
      ).toBe(false);
      expect(
        isValidStatusTransition(UserEventStatus.LIBRE, 'invalid_state')
      ).toBe(false);
    });
  });

  describe("Architecture du système d'états", () => {
    test('doit avoir une structure cohérente des états', () => {
      const allStates = Object.values(UserEventStatus);

      // Tous les états doivent être des strings
      allStates.forEach(state => {
        expect(typeof state).toBe('string');
        expect(state.length).toBeGreaterThan(0);
      });

      // Doit avoir exactement 4 états selon le plan
      expect(allStates).toHaveLength(4);
    });

    test('doit permettre une transition depuis LIBRE vers tous les autres états', () => {
      const otherStates = [
        UserEventStatus.INVITATION_ENVOYEE,
        UserEventStatus.INVITATION_RECUE,
        UserEventStatus.EN_PARTAGE,
      ];

      otherStates.forEach(toState => {
        expect(isValidStatusTransition(UserEventStatus.LIBRE, toState)).toBe(
          true
        );
      });
    });

    test('doit permettre un retour vers LIBRE depuis tous les états', () => {
      const allStates = [
        UserEventStatus.INVITATION_ENVOYEE,
        UserEventStatus.INVITATION_RECUE,
        UserEventStatus.EN_PARTAGE,
      ];

      allStates.forEach(fromState => {
        expect(isValidStatusTransition(fromState, UserEventStatus.LIBRE)).toBe(
          true
        );
      });
    });
  });
});

// 🎯 PHASE 2 - Tests pour le système de groupes
describe('EventTypes - Phase 2 Système de Groupes', () => {
  describe('Détection de groupes', () => {
    test('doit identifier correctement les tailles de groupe', () => {
      expect(isGroupSize(1)).toBe(false); // 1 personne = pas un groupe
      expect(isGroupSize(2)).toBe(true); // 2+ personnes = groupe
      expect(isGroupSize(5)).toBe(true);
      expect(isGroupSize(10)).toBe(true);
    });

    test('doit retourner les messages appropriés pour les tailles', () => {
      expect(getGroupSizeMessage(1)).toBe('Seul(e)');
      expect(getGroupSizeMessage(2)).toBe('En duo');
      expect(getGroupSizeMessage(3)).toBe('Groupe de 3');
      expect(getGroupSizeMessage(5)).toBe('Groupe de 5');
      expect(getGroupSizeMessage(8)).toBe('Grand groupe (8)');
      expect(getGroupSizeMessage(10)).toBe('Groupe complet (10/10)');
    });

    test('doit retourner les couleurs appropriées selon la taille', () => {
      expect(getGroupSizeColor(1)).toBe('blue'); // Petit (10%)
      expect(getGroupSizeColor(3)).toBe('green'); // Moyen (30%)
      expect(getGroupSizeColor(5)).toBe('green'); // Moyen (50%)
      expect(getGroupSizeColor(8)).toBe('orange'); // Presque plein (80%)
      expect(getGroupSizeColor(10)).toBe('red'); // Complet (100%)
    });
  });

  describe('Progression de groupe', () => {
    test('doit calculer la progression correctement', () => {
      expect(getGroupProgress(1)).toBe(10); // 1/10 = 10%
      expect(getGroupProgress(5)).toBe(50); // 5/10 = 50%
      expect(getGroupProgress(10)).toBe(100); // 10/10 = 100%
      expect(getGroupProgress(15)).toBe(100); // Plafonné à 100%
    });

    test('doit gérer les valeurs limites', () => {
      expect(getGroupProgress(0)).toBe(0);
      expect(getGroupProgress(-1)).toBe(0);
    });
  });

  describe("Capacité d'acceptation de membres", () => {
    test("doit permettre d'ajouter des membres sous la limite", () => {
      expect(canGroupAcceptMember(5)).toBe(true); // 5 < 10
      expect(canGroupAcceptMember(9)).toBe(true); // 9 < 10
    });

    test("doit empêcher d'ajouter des membres à la limite", () => {
      expect(canGroupAcceptMember(10)).toBe(false); // 10 = limite
      expect(canGroupAcceptMember(15)).toBe(false); // 15 > limite
    });

    test('doit gérer les valeurs négatives ou nulles', () => {
      expect(canGroupAcceptMember(0)).toBe(true);
      expect(canGroupAcceptMember(-1)).toBe(true);
    });
  });

  describe('Validation de structure de groupe', () => {
    test('doit valider un groupe correct', () => {
      const validGroup = {
        id: 'group123',
        eventId: 'event456',
        createdBy: 'user789',
        members: ['user789', 'user101'],
        createdAt: new Date(),
        maxMembers: 10,
        activity: 'coffee',
        isActive: true,
      };

      const result = validateGroupStructure(validGroup);
      expect(result.valid).toBe(true);
    });

    test('doit rejeter un groupe sans ID', () => {
      const invalidGroup = {
        eventId: 'event456',
        createdBy: 'user789',
        members: ['user789'],
      };

      const result = validateGroupStructure(invalidGroup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ID de groupe manquant');
    });

    test('doit rejeter un groupe sans créateur', () => {
      const invalidGroup = {
        id: 'group123',
        eventId: 'event456',
        members: ['user789'],
      };

      const result = validateGroupStructure(invalidGroup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Créateur manquant');
    });

    test('doit rejeter un groupe avec trop de membres', () => {
      const invalidGroup = {
        id: 'group123',
        eventId: 'event456',
        createdBy: 'user789',
        members: new Array(15).fill().map((_, i) => `user${i}`), // 15 membres > limite
      };

      const result = validateGroupStructure(invalidGroup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Trop de membres');
    });

    test("doit rejeter un groupe où le créateur n'est pas membre", () => {
      const invalidGroup = {
        id: 'group123',
        eventId: 'event456',
        createdBy: 'user789',
        members: ['user101', 'user102'], // créateur user789 pas dans la liste
      };

      const result = validateGroupStructure(invalidGroup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Le créateur doit être membre');
    });

    test('doit gérer les inputs null/undefined', () => {
      expect(validateGroupStructure(null).valid).toBe(false);
      expect(validateGroupStructure(undefined).valid).toBe(false);
      expect(validateGroupStructure({}).valid).toBe(false);
    });
  });

  describe('Création de groupe par défaut', () => {
    test('doit créer un groupe avec les bonnes propriétés', () => {
      const group = createDefaultGroup('event123', 'user456', 'coffee');

      expect(group.eventId).toBe('event123');
      expect(group.createdBy).toBe('user456');
      expect(group.activity).toBe('coffee');
      expect(group.members).toEqual(['user456']);
      expect(group.maxMembers).toBe(EVENT_CONSTANTS.MAX_GROUP_SIZE);
      expect(group.isActive).toBe(true);
      expect(group.id).toMatch(/^group_/);
      expect(group.createdAt).toBeInstanceOf(Date);
    });

    test('doit générer des IDs uniques', () => {
      const group1 = createDefaultGroup('event1', 'user1', 'coffee');
      const group2 = createDefaultGroup('event1', 'user1', 'coffee');

      expect(group1.id).not.toBe(group2.id);
    });
  });

  describe('Constantes', () => {
    test('doit avoir les bonnes valeurs de constantes', () => {
      expect(EVENT_CONSTANTS.MAX_GROUP_SIZE).toBe(10);
      expect(EVENT_CONSTANTS.MIN_GROUP_SIZE).toBe(2);
      expect(EVENT_CONSTANTS.INVITATION_EXPIRY_MINUTES).toBe(10);
      expect(EVENT_CONSTANTS.GROUP_CLEANUP_HOURS).toBe(24);
    });
  });
});

// ===========================
// TESTS PHASE 3 - INVITATIONS MULTIPLES (30 tests)
// ===========================

describe('EventTypes - Phase 3 Invitations Multiples', () => {
  describe('Validation invitations multiples', () => {
    test('doit valider les invitations simples', () => {
      const result = canSendMultipleInvitation(UserEventStatus.LIBRE, 1);
      expect(result.canSend).toBe(true);
    });

    test('doit valider les invitations multiples', () => {
      const result = canSendMultipleInvitation(UserEventStatus.LIBRE, 5);
      expect(result.canSend).toBe(true);
    });

    test('doit rejeter si utilisateur non libre', () => {
      const result = canSendMultipleInvitation(UserEventStatus.EN_PARTAGE, 3);
      expect(result.canSend).toBe(false);
      expect(result.reason).toBe('Utilisateur non libre');
    });

    test('doit rejeter si trop de destinataires', () => {
      const result = canSendMultipleInvitation(UserEventStatus.LIBRE, 10);
      expect(result.canSend).toBe(false);
      expect(result.reason).toBe('Maximum 8 destinataires');
    });

    test('doit rejeter si aucun destinataire', () => {
      const result = canSendMultipleInvitation(UserEventStatus.LIBRE, 0);
      expect(result.canSend).toBe(false);
      expect(result.reason).toBe('Au moins un destinataire requis');
    });
  });

  describe('Vérification expiration', () => {
    test('doit détecter les invitations non expirées', () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000); // +5min
      const invitation = { expiresAt: futureDate };
      expect(isInvitationExpired(invitation)).toBe(false);
    });

    test('doit détecter les invitations expirées', () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 1000); // -5min
      const invitation = { expiresAt: pastDate };
      expect(isInvitationExpired(invitation)).toBe(true);
    });

    test("doit gérer les invitations sans date d'expiration", () => {
      const invitation = {};
      expect(isInvitationExpired(invitation)).toBe(false);
    });

    test('doit gérer les dates Firebase Timestamp', () => {
      const pastTimestamp = {
        toDate: () => new Date(Date.now() - 5 * 60 * 1000),
      };
      const invitation = { expiresAt: pastTimestamp };
      expect(isInvitationExpired(invitation)).toBe(true);
    });
  });

  describe('Calcul date expiration', () => {
    test("doit calculer la date d'expiration par défaut (10min)", () => {
      const before = Date.now();
      const expirationDate = calculateExpirationDate();
      const after = Date.now();

      const expectedTime = 10 * 60 * 1000; // 10 minutes en ms
      const actualTime = expirationDate.getTime() - before;

      expect(actualTime).toBeGreaterThanOrEqual(expectedTime - 1000); // -1s tolérance
      expect(actualTime).toBeLessThanOrEqual(expectedTime + 1000); // +1s tolérance
    });

    test('doit calculer avec des minutes personnalisées', () => {
      const customMinutes = 15;
      const before = Date.now();
      const expirationDate = calculateExpirationDate(customMinutes);

      const expectedTime = customMinutes * 60 * 1000;
      const actualTime = expirationDate.getTime() - before;

      expect(actualTime).toBeGreaterThanOrEqual(expectedTime - 1000);
      expect(actualTime).toBeLessThanOrEqual(expectedTime + 1000);
    });

    test('doit retourner un objet Date valide', () => {
      const expirationDate = calculateExpirationDate();
      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Priorité des invitations', () => {
    test('doit assigner une priorité haute pour les réponses', () => {
      const context = { isResponse: true };
      expect(getInvitationPriority(context)).toBe('high');
    });

    test('doit assigner une priorité haute pour les relations actives', () => {
      const context = { hasActiveRelation: true };
      expect(getInvitationPriority(context)).toBe('high');
    });

    test('doit assigner une priorité normale pour les invitations de groupe', () => {
      const context = { isGroupInvitation: true };
      expect(getInvitationPriority(context)).toBe('normal');
    });

    test('doit assigner une priorité normale par défaut', () => {
      const context = {};
      expect(getInvitationPriority(context)).toBe('normal');
    });
  });

  describe('Formatage messages invitations multiples', () => {
    test('doit formater les invitations simples', () => {
      const invitation = {
        fromUserName: 'Paul',
        activity: 'coffee',
        totalRecipients: 1,
        acceptedByUserIds: [],
      };

      const message = formatMultipleInvitationMessage(invitation);
      expect(message).toBe('🎉 Paul vous invite pour coffee');
    });

    test('doit formater les invitations multiples sans acceptation', () => {
      const invitation = {
        fromUserName: 'Paul',
        activity: 'lunch',
        totalRecipients: 3,
        acceptedByUserIds: [],
      };

      const message = formatMultipleInvitationMessage(invitation);
      expect(message).toBe('🎉 Paul vous invite pour lunch (3 invités)');
    });

    test("doit formater avec compteur d'acceptations", () => {
      const invitation = {
        fromUserName: 'Marie',
        activity: 'drinks',
        totalRecipients: 5,
        acceptedByUserIds: ['user1', 'user2'],
      };

      const message = formatMultipleInvitationMessage(invitation);
      expect(message).toBe(
        '🎉 Marie vous invite pour drinks (2/5 ont accepté)'
      );
    });
  });

  describe('Détection de conflits', () => {
    test('doit détecter les invitations dupliquées', () => {
      const newInvitation = {
        fromUserId: 'user1',
        activity: 'coffee',
      };

      const existingInvitations = [
        {
          fromUserId: 'user1',
          activity: 'coffee',
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Future
        },
      ];

      const conflicts = detectInvitationConflicts(
        newInvitation,
        existingInvitations
      );
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('duplicate');
      expect(conflicts[0].reason).toBe('Invitation similaire déjà en cours');
    });

    test('doit détecter les invitations simultanées', () => {
      const newInvitation = {
        fromUserId: 'user1',
        activity: 'coffee',
      };

      const existingInvitations = [
        {
          fromUserId: 'user2', // Différent expéditeur
          activity: 'lunch', // Différente activité
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      ];

      const conflicts = detectInvitationConflicts(
        newInvitation,
        existingInvitations
      );
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('simultaneous');
      expect(conflicts[0].reason).toBe('Invitations simultanées détectées');
    });

    test('ne doit pas détecter de conflit pour invitations expirées', () => {
      const newInvitation = {
        fromUserId: 'user1',
        activity: 'coffee',
      };

      const existingInvitations = [
        {
          fromUserId: 'user1',
          activity: 'coffee',
          status: 'pending',
          expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Passé = expiré
        },
      ];

      const conflicts = detectInvitationConflicts(
        newInvitation,
        existingInvitations
      );
      expect(conflicts).toHaveLength(0);
    });

    test('ne doit pas détecter de conflit pour invitations non-pending', () => {
      const newInvitation = {
        fromUserId: 'user1',
        activity: 'coffee',
      };

      const existingInvitations = [
        {
          fromUserId: 'user1',
          activity: 'coffee',
          status: 'accepted', // Pas pending
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      ];

      const conflicts = detectInvitationConflicts(
        newInvitation,
        existingInvitations
      );
      expect(conflicts).toHaveLength(0);
    });

    test('doit gérer les listes vides', () => {
      const newInvitation = { fromUserId: 'user1', activity: 'coffee' };
      const conflicts = detectInvitationConflicts(newInvitation, []);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Constantes Phase 3', () => {
    test("doit avoir les nouvelles constantes d'invitations multiples", () => {
      expect(EVENT_CONSTANTS.MAX_MULTIPLE_RECIPIENTS).toBe(8);
      expect(EVENT_CONSTANTS.INVITATION_COOLDOWN_SECONDS).toBe(30);
      expect(EVENT_CONSTANTS.CONFLICT_PRIORITY_TIMEOUT_MINUTES).toBe(5);
      expect(EVENT_CONSTANTS.EXPIRATION_CHECK_INTERVAL_MINUTES).toBe(1);
    });
  });

  describe('Enums Phase 3', () => {
    test("doit avoir les priorités d'invitation", () => {
      expect(InvitationPriority.HIGH).toBe('high');
      expect(InvitationPriority.NORMAL).toBe('normal');
      expect(InvitationPriority.LOW).toBe('low');
    });

    test('doit avoir les types de conflit', () => {
      expect(ConflictType.SIMULTANEOUS).toBe('simultaneous');
      expect(ConflictType.OVERLAPPING).toBe('overlapping');
      expect(ConflictType.DUPLICATE).toBe('duplicate');
    });
  });
});
