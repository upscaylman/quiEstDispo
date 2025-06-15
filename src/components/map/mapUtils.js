import {
  Coffee,
  Film,
  Music,
  Users,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';

// Configuration des activités partagée entre toutes les cartes
export const activities = [
  {
    id: 'coffee',
    name: 'Coffee',
    icon: Coffee,
    color: '#f59e0b',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'lunch',
    name: 'Lunch',
    icon: UtensilsCrossed,
    color: '#10b981',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    icon: Wine,
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    id: 'chill',
    name: 'Chill',
    icon: Users,
    color: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'clubbing',
    name: 'Clubbing',
    icon: Music,
    color: '#ec4899',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 'cinema',
    name: 'Cinema',
    icon: Film,
    color: '#6366f1',
    gradient: 'from-indigo-400 to-purple-500',
  },
];

// Obtenir la couleur d'une activité
export const getActivityColor = activityName => {
  if (!activityName) return '#6b7280';
  const activity = activities.find(
    a => a.name.toLowerCase() === activityName.toLowerCase()
  );
  return activity ? activity.color : '#6b7280';
};

// Obtenir le gradient d'une activité
export const getActivityGradient = activityName => {
  if (!activityName) return 'from-gray-400 to-gray-500';
  const activity = activities.find(
    a => a.name.toLowerCase() === activityName.toLowerCase()
  );
  return activity ? activity.gradient : 'from-gray-400 to-gray-500';
};

// Calculer la distance entre deux points (formule de Haversine)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Formater la distance pour l'affichage
export const formatDistance = distance => {
  if (!distance || isNaN(distance)) return '?';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Valider et nettoyer les données des amis
export const sanitizeFriendsData = (availableFriends = []) => {
  return availableFriends.filter(friend => {
    if (!friend) return false;
    const lat = friend.location?.lat || friend.lat;
    const lng = friend.location?.lng || friend.lng;
    return (
      lat &&
      lng &&
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  });
};

// Filtrer les amis par activité
export const filterFriendsByActivity = (friends, activityFilter) => {
  if (activityFilter === 'all') return friends;
  return friends.filter(
    friend => friend.activity?.toLowerCase() === activityFilter
  );
};

// Calculer les limites de la carte pour afficher tous les amis
export const calculateMapBounds = (friends, userLocation) => {
  if (friends.length === 0 && userLocation) return userLocation;

  const lats = [];
  const lngs = [];

  // Ajouter les positions des amis
  friends.forEach(friend => {
    const lat = friend.location?.lat || friend.lat;
    const lng = friend.location?.lng || friend.lng;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      lats.push(lat);
      lngs.push(lng);
    }
  });

  // Ajouter la position de l'utilisateur
  if (userLocation && userLocation.lat && userLocation.lng) {
    lats.push(userLocation.lat);
    lngs.push(userLocation.lng);
  }

  // Position par défaut si aucune donnée valide
  if (lats.length === 0) return { lat: 48.8566, lng: 2.3522 };

  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

  return { lat: centerLat, lng: centerLng };
};

// Créer l'élément HTML pour un marqueur d'utilisateur
export const createUserMarkerElement = (user, hasLocationPermission = true) => {
  const container = document.createElement('div');
  container.className = 'marker-container user-marker';
  container.style.width = '60px';
  container.style.height = '80px';

  // Debug pour voir les données utilisateur
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 createUserMarkerElement - Données utilisateur:', {
      user,
      profilePicture: user.profilePicture,
      avatar: user.avatar,
      photoURL: user.photoURL,
      displayName: user.displayName,
      name: user.name,
    });
  }

  // Récupérer l'activité de l'utilisateur
  const userActivity = user.selectedActivity || user.activity;
  const isAvailable = user.isAvailable !== false; // Par défaut true si non spécifié

  // Gérer les multiples sources d'avatar
  const avatarUrl = user.profilePicture || user.avatar || user.photoURL;
  const userName = user.displayName || user.name || 'Vous';

  // Background coloré selon l'activité ou bleu par défaut pour l'utilisateur
  const activityColor =
    isAvailable && userActivity ? getActivityColor(userActivity) : '#3b82f6'; // Bleu au lieu de gris

  // Obtenir l'icône d'activité (même fonction que pour les amis)
  const getActivityIconSVG = activity => {
    const activityObj = activities.find(
      a => a.name.toLowerCase() === activity?.toLowerCase()
    );
    if (!activityObj)
      return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';

    switch (activity?.toLowerCase()) {
      case 'coffee':
        return '<path d="M3 14c0 1.3.84 2.4 2 2.82V17H3v2h12v-2h-2v-.18c1.16-.42 2-1.52 2-2.82v-4H3v4zm2 0v-2h8v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2zm13-4h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2v-5zM3 8h12c0-1.86-1.28-3.41-3-3.86V2H6v2.14C4.28 4.59 3 6.14 3 8z"/>';
      case 'lunch':
        return '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>';
      case 'drinks':
        return '<path d="M3 14c0 1.3.84 2.4 2 2.82V17c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-.18c1.16-.42 2-1.52 2-2.82v-3H3v3zM7 17v-1h6v1H7zM19.23 7L20 3h-8l.77 4M9.72 7L9 3H5v2h2.23l.77 4"/>';
      case 'chill':
        return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';
      case 'clubbing':
        return '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>';
      case 'cinema':
        return '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>';
      default:
        return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';
    }
  };

  container.innerHTML = `
    <div style="position: relative; width: 100%; height: 100%;">
      ${
        hasLocationPermission
          ? `
        <!-- Animations GPS (cercles verts pulsants) -->
        <div style="
          position: absolute;
          top: 0px;
          left: 0px;
          width: 50px;
          height: 50px;
          border: 2px solid #10b981;
          border-radius: 50%;
          animation: gps-pulse 2s infinite;
          opacity: 0.6;
          margin: 5px auto 0;
        "></div>
        <div style="
          position: absolute;
          top: -5px;
          left: -5px;
          width: 60px;
          height: 60px;
          border: 2px solid #10b981;
          border-radius: 50%;
          animation: gps-pulse 2s infinite 0.7s;
          opacity: 0.4;
          margin: 5px auto 0;
        "></div>
      `
          : ''
      }
      
      <div style="position: relative; width: 50px; height: 50px; margin: 5px auto 0;">
        <!-- Grand cercle avec photo de profil bien centrée + indicateur GPS -->
        <div style="
          width: 50px;
          height: 50px;
          background: ${activityColor};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px rgba(59, 130, 246, 0.3);
          overflow: hidden;
          position: relative;
        ">
          ${
            avatarUrl &&
            (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))
              ? `<img src="${avatarUrl}" style="
                 width: 100%; 
                 height: 100%; 
                 object-fit: cover;
                 position: absolute;
                 top: 0;
                 left: 0;
               " alt="Avatar" />`
              : `<div style="
                 width: 100%;
                 height: 100%;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 font-size: 18px;
                 font-weight: bold;
                 color: white;
                 background: rgba(0,0,0,0.2);
                 backdrop-filter: blur(2px);
               ">${userName.substring(0, 2).toUpperCase()}</div>`
          }
        </div>
        
        <!-- Petit cercle avec icône d'activité -->
        ${
          isAvailable && userActivity
            ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 22px;
            height: 22px;
            background: ${activityColor};
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">
            <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
              ${getActivityIconSVG(userActivity)}
            </svg>
          </div>
        `
            : ''
        }
      </div>
      
      <!-- Tooltip avec nom utilisateur -->
      <div style="
        position: absolute;
        top: 57px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255,255,255,0.1);
      ">
        ${userName} (Vous)
      </div>
    </div>
  `;

  // Ajouter les animations CSS si elles n'existent pas déjà
  if (!document.querySelector('#map-marker-animations')) {
    const style = document.createElement('style');
    style.id = 'map-marker-animations';
    style.textContent = `
      @keyframes gps-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 0.3; }
        100% { transform: scale(1.2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  return container;
};

// Créer l'élément HTML pour un marqueur d'ami
export const createFriendMarkerElement = (friend, onClick) => {
  const container = document.createElement('div');
  container.className = 'marker-container friend-marker';
  container.style.width = '60px';
  container.style.height = '80px';
  container.style.cursor = 'pointer';

  // Récupérer l'activité de l'ami
  const friendActivity = friend.activity;
  const activityColor = getActivityColor(friendActivity);

  // Gérer les multiples sources d'avatar
  const avatarUrl =
    friend.friend?.avatar ||
    friend.avatar ||
    friend.friend?.profilePicture ||
    friend.profilePicture ||
    friend.friend?.photoURL ||
    friend.photoURL;
  const friendName =
    friend.friend?.name ||
    friend.name ||
    friend.friend?.displayName ||
    friend.displayName ||
    'Ami';

  // Obtenir l'icône correcte selon l'activité (même que dans l'accueil)
  const getActivityIconSVG = activity => {
    const activityObj = activities.find(
      a => a.name.toLowerCase() === activity?.toLowerCase()
    );
    if (!activityObj)
      return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';

    // Utiliser les mêmes icônes SVG que dans les activités
    switch (activity?.toLowerCase()) {
      case 'coffee':
        return '<path d="M3 14c0 1.3.84 2.4 2 2.82V17H3v2h12v-2h-2v-.18c1.16-.42 2-1.52 2-2.82v-4H3v4zm2 0v-2h8v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2zm13-4h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2v-5zM3 8h12c0-1.86-1.28-3.41-3-3.86V2H6v2.14C4.28 4.59 3 6.14 3 8z"/>';
      case 'lunch':
        return '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>';
      case 'drinks':
        return '<path d="M3 14c0 1.3.84 2.4 2 2.82V17c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-.18c1.16-.42 2-1.52 2-2.82v-3H3v3zM7 17v-1h6v1H7zM19.23 7L20 3h-8l.77 4M9.72 7L9 3H5v2h2.23l.77 4"/>';
      case 'chill':
        return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';
      case 'clubbing':
        return '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>';
      case 'cinema':
        return '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>';
      default:
        return '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>';
    }
  };

  container.innerHTML = `
    <div style="position: relative; width: 50px; height: 50px; margin: 0 auto;">
      <!-- Grand cercle avec photo de profil bien centrée -->
      <div style="
        width: 50px;
        height: 50px;
        background: #ddd;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        overflow: hidden;
        position: relative;
      ">
        ${
          avatarUrl &&
          (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))
            ? `<img src="${avatarUrl}" style="
               width: 100%; 
               height: 100%; 
               object-fit: cover;
               position: absolute;
               top: 0;
               left: 0;
             " alt="Avatar" />`
            : `<div style="
               width: 100%;
               height: 100%;
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 18px;
               font-weight: bold;
               color: white;
               background: #6b7280;
             ">${friendName.substring(0, 2).toUpperCase()}</div>`
        }
      </div>
      
      <!-- Petit cercle avec icône d'activité (même que dans l'accueil) -->
      ${
        friendActivity
          ? `
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 22px;
          height: 22px;
          background: ${activityColor};
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">
          <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
            ${getActivityIconSVG(friendActivity)}
          </svg>
        </div>
      `
          : ''
      }
    </div>
   
    <!-- Tooltip corrigé : largeur automatique, arrondi et transparent -->
    <div style="
      position: absolute;
      top: 52px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      ${friendName}
    </div>
  `;

  if (onClick) {
    container.addEventListener('click', () => {
      onClick({
        ...friend,
        name: friendName,
        avatar: avatarUrl || '👤',
      });
    });
  }

  return container;
};
