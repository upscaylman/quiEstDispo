// Utilitaires communs pour les services Firebase
import { auth, db } from '../firebase';

// Utilitaire pour vérifier la connectivité (amélioré)
export const isOnline = () => {
  // navigator.onLine peut être peu fiable, on assume connecté par défaut
  if (typeof navigator === 'undefined') return true;

  // Si navigator.onLine dit offline, on fait confiance
  if (!navigator.onLine) return false;

  // Sinon on assume connecté (Firebase gèrera les erreurs réseau)
  return true;
};

// Messages d'erreur réseau simplifiés avec debug (moins verbeux)
export const getNetworkErrorMessage = (
  defaultMessage = 'Erreur de connexion'
) => {
  const onlineStatus = isOnline();

  // Seulement log si réellement offline
  if (!onlineStatus) {
    console.log('🌐 Network status: offline detected');
    return 'Pas de connexion internet détectée';
  }
  return 'Problème de réseau temporaire, réessayez';
};

// Utilitaire pour retry avec backoff optimisé
export const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 500) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        const delay = baseDelay * Math.pow(1.5, i); // Moins agressif
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Exports pour compatibilité
export { auth, db };
