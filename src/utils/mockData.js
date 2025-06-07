// Données de test pour le mode offline ou développement
export const getMockDataForOfflineMode = () => {
  return {
    friends: [
      {
        id: 'friend1',
        name: 'Alice Dupont',
        avatar: '👩‍💼',
        isOnline: true,
        phone: '+33612345678',
        location: { lat: 48.8606, lng: 2.3376 }, // Paris
      },
      {
        id: 'friend2',
        name: 'Bob Martin',
        avatar: '👨‍💻',
        isOnline: true,
        phone: '+33612345679',
        location: { lat: 48.8526, lng: 2.3488 }, // Paris
      },
      {
        id: 'friend3',
        name: 'Claire Bernard',
        avatar: '👩‍🎨',
        isOnline: false,
        phone: '+33612345680',
        location: { lat: 48.8636, lng: 2.3296 }, // Paris
      },
    ],
    availableFriends: [
      {
        id: 'avail1',
        userId: 'friend1',
        activity: 'coffee',
        location: { lat: 48.8606, lng: 2.3376 },
        timeLeft: 42,
        friend: {
          id: 'friend1',
          name: 'Alice Dupont',
          avatar: '👩‍💼',
          location: { lat: 48.8606, lng: 2.3376 },
        },
      },
      {
        id: 'avail2',
        userId: 'friend2',
        activity: 'lunch',
        location: { lat: 48.8526, lng: 2.3488 },
        timeLeft: 35,
        friend: {
          id: 'friend2',
          name: 'Bob Martin',
          avatar: '👨‍💻',
          location: { lat: 48.8526, lng: 2.3488 },
        },
      },
    ],
    notifications: [
      {
        id: 'notif1',
        message: 'Alice est dispo pour un coffee !',
        createdAt: { toDate: () => new Date() },
        read: false,
      },
    ],
  };
};
