// Mock simple pour FriendsStatusService - Phase 4
import { UserEventStatus } from '../types/eventTypes';
import { debugLog } from '../utils/logger';

export class FriendsStatusService {
  static async getFriendDetailedStatus(friendId, currentUserId) {
    debugLog(`🔍 [Mock] Calcul statut pour ${friendId}`);
    return {
      status: UserEventStatus.LIBRE,
      message: 'Disponible pour activité',
      color: 'bg-green-500 text-white',
      available: true,
      details: { type: 'mock', friendId },
    };
  }

  static async getAllFriendsStatus(friends, currentUserId) {
    debugLog(`🔍 [Mock] Calcul statuts pour ${friends.length} amis`);
    const statusMap = {};
    friends.forEach(friend => {
      statusMap[friend.id] = {
        status: UserEventStatus.LIBRE,
        message: 'Disponible pour activité',
        color: 'bg-green-500 text-white',
        available: true,
        details: { type: 'mock', friendId: friend.id },
      };
    });
    return statusMap;
  }

  static filterAvailableFriends(friends, friendsStatus) {
    return friends.filter(friend => {
      const status = friendsStatus[friend.id];
      return status?.available === true;
    });
  }
}
