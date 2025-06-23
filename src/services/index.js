// Export centralisé de tous les services Firebase refactorisés
export { AuthService } from './authService';
export { AvailabilityService } from './availabilityService';
export { EventGroupService } from './eventGroupService';
export { EventStatusService } from './eventStatusService';
export { FriendsService } from './friendsService';
export { InvitationExpirationService } from './invitationExpirationService';
export { InvitationService } from './invitationService';
export { NotificationService } from './notificationService';

// Exports d'utilitaires
export {
  getNetworkErrorMessage,
  isOnline,
  retryWithBackoff,
} from './firebaseUtils';

// Export de l'ancien service pour compatibilité (à supprimer après migration)
export * from './firebaseService';

// 🎯 PHASE 4 - INTERFACE TEMPS RÉEL FINALISÉE
export { FriendsStatusService } from './friendsStatusService';
export { NotificationGroupingService } from './notificationGroupingService';

// 🎯 PHASE 5 - SERVICES MÉTIER AVANCÉS
export { InvitationConflictService } from './invitationConflictService';
export { RelationshipService } from './relationshipService';
export { ValidationService } from './validationService';

// 🎯 PHASE 6 - OPTIMISATIONS TEMPS RÉEL
export { RealTimeOptimizationService } from './realTimeOptimizationService';
