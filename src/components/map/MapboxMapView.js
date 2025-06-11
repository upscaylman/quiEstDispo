import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import BaseMapView from './BaseMapView';
import { createFriendMarkerElement, createUserMarkerElement } from './mapUtils';

// Configuration Mapbox
if (process.env.REACT_APP_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
}

const MapboxRenderer = ({
  filteredFriends,
  userLocation,
  darkMode,
  selectedActivity,
  isAvailable,
  currentUser,
  onFriendSelect,
  onCenterUser,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const friendMarkers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!process.env.REACT_APP_MAPBOX_TOKEN) {
      console.error(
        'Mapbox token manquant ! Ajoutez REACT_APP_MAPBOX_TOKEN dans .env.local'
      );
      return;
    }

    const initializeMap = () => {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: darkMode
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12',
        center: userLocation
          ? [userLocation.lng, userLocation.lat]
          : [2.3522, 48.8566],
        zoom: 13,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      // Ajouter les contrôles de navigation
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Changer le style de la carte selon le mode sombre
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.setStyle(
      darkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12'
    );
  }, [darkMode, mapLoaded]);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Nettoyer les anciens marqueurs
    friendMarkers.current.forEach(({ marker }) => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    friendMarkers.current = [];

    // Ajouter les nouveaux marqueurs
    filteredFriends.forEach(friend => {
      const lat =
        friend.location?.lat || friend.lat || friend.friend?.location?.lat;
      const lng =
        friend.location?.lng || friend.lng || friend.friend?.location?.lng;

      if (!lat || !lng) return;

      let markerEl;

      // Créer le marqueur approprié selon le type
      if (friend.isCurrentUser) {
        console.log('🟢 Création marqueur utilisateur:', friend);
        // Marqueur utilisateur
        markerEl = createUserMarkerElement(
          {
            ...currentUser,
            selectedActivity,
            isAvailable,
          },
          !!userLocation
        );
      } else {
        console.log('🔵 Création marqueur ami:', friend);
        // Marqueur ami
        markerEl = createFriendMarkerElement(friend, selectedFriend => {
          onFriendSelect(selectedFriend);
        });
      }

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([lng, lat])
        .addTo(map.current);
      console.log('✅ Marqueur ajouté à la carte:', {
        lat,
        lng,
        isCurrentUser: friend.isCurrentUser,
      });

      friendMarkers.current.push({ marker: markerEl, friend });
    });

    // Ajuster la vue pour afficher tous les marqueurs
    if (filteredFriends.length > 0 && userLocation) {
      const bounds = new mapboxgl.LngLatBounds();

      // Ajouter la position de l'utilisateur
      bounds.extend([userLocation.lng, userLocation.lat]);

      // Ajouter les positions des amis
      filteredFriends.forEach(friend => {
        const lat =
          friend.location?.lat || friend.lat || friend.friend?.location?.lat;
        const lng =
          friend.location?.lng || friend.lng || friend.friend?.location?.lng;
        if (lat && lng) {
          bounds.extend([lng, lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 50 },
        maxZoom: 15,
      });
    }
  }, [
    filteredFriends,
    mapLoaded,
    onFriendSelect,
    userLocation,
    currentUser,
    selectedActivity,
    isAvailable,
  ]);

  // Fonction pour centrer sur l'utilisateur
  useEffect(() => {
    if (onCenterUser && map.current) {
      window.mapboxCenterOnUser = () => {
        if (userLocation) {
          map.current.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 14,
          });
        }
      };
    }
  }, [onCenterUser, userLocation]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Message d'erreur si pas de token */}
      {!process.env.REACT_APP_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-sm mx-4`}
          >
            <h3
              className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Token Mapbox manquant
            </h3>
            <p
              className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              Ajoutez votre token Mapbox dans le fichier .env.local :
            </p>
            <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              REACT_APP_MAPBOX_TOKEN=votre_token_ici
            </code>
          </div>
        </div>
      )}
    </>
  );
};

// Composant principal qui utilise BaseMapView
const MapboxMapView = props => {
  return (
    <BaseMapView {...props}>
      <MapboxRenderer
        onCenterUser={() => {
          if (window.mapboxCenterOnUser) {
            window.mapboxCenterOnUser();
          }
        }}
      />
    </BaseMapView>
  );
};

export default MapboxMapView;
