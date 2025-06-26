// Hook pour la gestion des états d'amis en temps réel - Phase 4
import { useCallback, useEffect, useRef, useState } from 'react';
import { FriendsStatusService } from '../services/friendsStatusService';

/**
 * Hook pour gérer les états des amis en temps réel
 * @param {Array} friends - Liste des amis
 * @param {string} currentUserId - ID de l'utilisateur actuel
 * @returns {Object} - { friendsStatus, loading, error, refreshStatus }
 */
export const useFriendsStatus = (friends, currentUserId) => {
  const [friendsStatuses, setFriendsStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastRefreshRef = useRef(0);
  const intervalRef = useRef(null);

  // Fonction pour rafraîchir les statuts
  const refreshStatuses = useCallback(async () => {
    if (!friends || friends.length === 0 || !currentUserId) {
      return;
    }

    const now = Date.now();
    if (now - lastRefreshRef.current < 2000) {
      // Éviter trop de refreshs rapprochés (< 2s)
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      lastRefreshRef.current = now;

      const statusResults = await FriendsStatusService.getAllFriendsStatus(
        friends,
        currentUserId
      );

      setFriendsStatuses(statusResults);
    } catch (error) {
      console.error('❌ Erreur refresh statuts:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [friends, currentUserId]);

  // Démarrer/arrêter le refresh automatique
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) return; // Déjà démarré

    intervalRef.current = setInterval(() => {
      refreshStatuses();
    }, 15000); // Toutes les 15 secondes
  }, [refreshStatuses]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Refresh manuel avec événement personnalisé
  const handleFriendsStatusUpdate = useCallback(
    event => {
      console.log(
        '🔄 [DEBUG] Événement friendsStatusUpdate reçu !',
        new Date().toLocaleTimeString()
      );
      refreshStatuses();
    },
    [refreshStatuses]
  );

  // Gestion visibilité page
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // Page redevient visible
      refreshStatuses();
    }
  }, [refreshStatuses]);

  // Effects
  useEffect(() => {
    // Rafraîchir immédiatement
    refreshStatuses();
  }, [refreshStatuses]);

  // 🎯 NOUVEAU: Forcer refresh toutes les 10 secondes pour débugger
  useEffect(() => {
    if (!friends?.length || !currentUserId) return;

    const forceInterval = setInterval(() => {
      console.log(
        '🔄 [DEBUG] Force refresh statuts amis...',
        new Date().toLocaleTimeString()
      );
      refreshStatuses();
    }, 10000); // Toutes les 10 secondes pour tester

    return () => clearInterval(forceInterval);
  }, [friends, currentUserId, refreshStatuses]);

  useEffect(() => {
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  useEffect(() => {
    // Écouter événements personnalisés
    window.addEventListener('friendsStatusUpdate', handleFriendsStatusUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(
        'friendsStatusUpdate',
        handleFriendsStatusUpdate
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAutoRefresh();
    };
  }, [handleFriendsStatusUpdate, handleVisibilityChange, stopAutoRefresh]);

  return {
    friendsStatuses,
    isLoading,
    error,
    refreshStatuses,
  };
};
