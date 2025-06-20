// Export centralisé de tous les services Firebase refactorisés
export { AuthService } from './authService';
export { AvailabilityService } from './availabilityService';
export { FriendsService } from './friendsService';
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
