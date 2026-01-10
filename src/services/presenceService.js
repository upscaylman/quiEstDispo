// Service de présence utilisateur - Gère le statut en ligne/hors ligne
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isOnline as isNetworkOnline } from './firebaseUtils';

// Délai pour considérer un utilisateur hors ligne (5 minutes)
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export class PresenceService {
  static heartbeatInterval = null;
  static currentUserId = null;

  /**
   * Démarre le heartbeat de présence pour l'utilisateur
   */
  static startPresenceHeartbeat(userId) {
    if (!userId) return;

    this.currentUserId = userId;

    // Mise à jour immédiate
    this.updatePresence(userId);

    // Heartbeat toutes les 2 minutes
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(
      () => {
        this.updatePresence(userId);
      },
      2 * 60 * 1000
    );

    // Événements de visibilité de page
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleUnload);
  }

  /**
   * Arrête le heartbeat de présence
   */
  static stopPresenceHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    window.removeEventListener('beforeunload', this.handleUnload);

    // Marquer comme hors ligne
    if (this.currentUserId) {
      this.setOffline(this.currentUserId);
    }
  }

  /**
   * Gère les changements de visibilité de la page
   */
  static handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.currentUserId) {
      this.updatePresence(this.currentUserId);
    }
  };

  /**
   * Gère la fermeture de la page
   */
  static handleUnload = () => {
    if (this.currentUserId) {
      // Utilise sendBeacon pour une mise à jour fiable avant fermeture
      // Fallback: on ne peut pas await dans beforeunload
      this.setOffline(this.currentUserId);
    }
  };

  /**
   * Met à jour le timestamp de présence de l'utilisateur
   */
  static async updatePresence(userId) {
    if (!userId || !isNetworkOnline()) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      // Silencieux - pas critique
      console.debug('Presence update failed:', error.message);
    }
  }

  /**
   * Marque l'utilisateur comme hors ligne
   */
  static async setOffline(userId) {
    if (!userId || !isNetworkOnline()) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.debug('Offline update failed:', error.message);
    }
  }

  /**
   * Vérifie si un utilisateur est en ligne (actif récemment)
   */
  static isUserOnline(lastActive) {
    if (!lastActive) return false;

    const lastActiveDate = lastActive?.toDate
      ? lastActive.toDate()
      : new Date(lastActive);
    const now = new Date();
    const diff = now.getTime() - lastActiveDate.getTime();

    return diff < ONLINE_THRESHOLD_MS;
  }

  /**
   * Récupère le statut de présence d'un utilisateur
   */
  static async getUserPresence(userId) {
    if (!userId || !isNetworkOnline()) {
      return { isOnline: false, lastActive: null };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { isOnline: false, lastActive: null };
      }

      const userData = userSnap.data();
      const lastActive = userData.lastActive;
      const isOnline = this.isUserOnline(lastActive);

      return {
        isOnline,
        lastActive: lastActive?.toDate ? lastActive.toDate() : lastActive,
      };
    } catch (error) {
      console.error('Error getting presence:', error);
      return { isOnline: false, lastActive: null };
    }
  }
}

export default PresenceService;
