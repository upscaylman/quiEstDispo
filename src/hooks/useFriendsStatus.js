// Hook pour la gestion des états d'amis en temps réel - Phase 4
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const isRefreshingRef = useRef(false);

  // Utiliser refs pour éviter les dépendances circulaires
  const friendsRef = useRef(friends);
  const currentUserIdRef = useRef(currentUserId);

  // Mettre à jour les refs quand les props changent
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Créer une clé stable basée sur les IDs des amis pour détecter les vrais changements
  const friendsKey = useMemo(() => {
    if (!friends || friends.length === 0) return '';
    return friends
      .map(f => f.id)
      .sort()
      .join(',');
  }, [friends]);

  // Fonction pour rafraîchir les statuts - stable, utilise les refs
  const refreshStatuses = useCallback(async () => {
    const currentFriends = friendsRef.current;
    const userId = currentUserIdRef.current;

    if (!currentFriends || currentFriends.length === 0 || !userId) {
      return;
    }

    // Éviter les appels concurrents
    if (isRefreshingRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastRefreshRef.current < 2000) {
      // Éviter trop de refreshs rapprochés (< 2s)
      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastRefreshRef.current = now;

      const statusResults = await FriendsStatusService.getAllFriendsStatus(
        currentFriends,
        userId
      );

      setFriendsStatuses(statusResults);
    } catch (err) {
      console.error('❌ Erreur refresh statuts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, []); // Pas de dépendances - utilise les refs

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

  // Refresh initial et quand les amis ou userId changent vraiment
  useEffect(() => {
    if (friendsKey && currentUserId) {
      refreshStatuses();
    }
  }, [friendsKey, currentUserId, refreshStatuses]);

  // Démarrer l'auto-refresh une seule fois
  useEffect(() => {
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  // Écouter événements personnalisés - configuration unique
  useEffect(() => {
    const handleFriendsStatusUpdate = () => {
      refreshStatuses();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStatuses();
      }
    };

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
  }, [refreshStatuses, stopAutoRefresh]);

  return {
    friendsStatuses,
    isLoading,
    error,
    refreshStatuses,
  };
};
