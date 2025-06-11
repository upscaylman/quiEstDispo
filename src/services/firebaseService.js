// Fichier de compatibilité pour maintenir les imports existants
// Re-export de tous les services refactorisés
export { AuthService } from './authService';
export { AvailabilityService } from './availabilityService';
export { FriendsService } from './friendsService';
export { InvitationService } from './invitationService';
export { NotificationService } from './notificationService';

// Utilitaires
export {
  getNetworkErrorMessage,
  isOnline,
  retryWithBackoff,
} from './firebaseUtils';

console.log('✅ Services Firebase refactorisés chargés avec succès');
