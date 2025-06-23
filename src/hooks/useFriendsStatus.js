// Hook pour la gestion des états d'amis en temps réel - Phase 4
import { useCallback, useEffect, useState } from 'react';
import { FriendsStatusService } from '../services/friendsStatusService';
import { debugLog, prodError } from '../utils/logger';

/**
 * Hook pour gérer les états des amis en temps réel
 * @param {Array} friends - Liste des amis
 * @param {string} currentUserId - ID de l'utilisateur actuel
 * @returns {Object} - { friendsStatus, loading, error, refreshStatus }
 */
export const useFriendsStatus = (friends, currentUserId) => {
  const [friendsStatus, setFriendsStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fonction pour rafraîchir les statuts
  const refreshStatus = useCallback(
    async (force = false) => {
      if (!friends?.length || !currentUserId) {
        debugLog(
          "🔄 [useFriendsStatus] Pas d'amis ou d'utilisateur, skip refresh"
        );
        return;
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;

      // Éviter les refresh trop fréquents (sauf si forcé)
      if (!force && timeSinceLastUpdate < 10000) {
        // 10 secondes minimum
        debugLog('🔄 [useFriendsStatus] Refresh trop récent, skip');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        debugLog(
          `🔄 [useFriendsStatus] Refresh statuts pour ${friends.length} amis`
        );

        // Calculer les statuts de tous les amis
        const statusResults = await FriendsStatusService.getAllFriendsStatus(
          friends,
          currentUserId
        );

        setFriendsStatus(statusResults);
        setLastUpdate(now);

        debugLog('🔄 [useFriendsStatus] ✅ Statuts mis à jour:', statusResults);
      } catch (err) {
        prodError('❌ [useFriendsStatus] Erreur refresh statuts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [friends, currentUserId, lastUpdate]
  );

  // Refresh automatique toutes les 15 secondes
  useEffect(() => {
    if (!friends?.length || !currentUserId) return;

    debugLog('🔄 [useFriendsStatus] Démarrage refresh automatique');

    // Premier refresh immédiat
    refreshStatus(true);

    // Intervalle de refresh
    const interval = setInterval(() => {
      debugLog('🔄 [useFriendsStatus] Refresh automatique (15s)');
      refreshStatus();
    }, 15000);

    return () => {
      debugLog('🔄 [useFriendsStatus] Arrêt refresh automatique');
      clearInterval(interval);
    };
  }, [refreshStatus]);

  // Écouter les événements de changement d'état
  useEffect(() => {
    const handleStatusChange = event => {
      debugLog('🔄 [useFriendsStatus] Événement détecté:', event.type);
      // Refresh immédiat en cas d'événement
      setTimeout(() => refreshStatus(true), 100);
    };

    // Événements qui déclenchent un refresh immédiat
    const events = [
      'invitation-sent',
      'invitation-responded',
      'availability-changed',
      'friendsStatusUpdate',
      'location-sharing-started',
      'location-sharing-stopped',
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleStatusChange);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleStatusChange);
      });
    };
  }, [refreshStatus]);

  // Écouter les changements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debugLog('🔄 [useFriendsStatus] Page visible, refresh statuts');
        setTimeout(() => refreshStatus(true), 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshStatus]);

  return {
    friendsStatus,
    loading,
    error,
    refreshStatus: () => refreshStatus(true),
    lastUpdate: new Date(lastUpdate).toLocaleTimeString(),
  };
};
