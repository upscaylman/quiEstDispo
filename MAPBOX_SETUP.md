# 🗺️ Configuration Mapbox avec les nouvelles Interactions API

Votre projet utilise déjà **Mapbox GL JS v2.15.0**, mais la nouvelle [Interactions API](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/) est disponible depuis la **v3.9.0**.

## 📋 Configuration actuelle

### ✅ Ce qui est déjà installé

- `mapbox-gl: ^2.15.0` (dans package.json)
- CSS Mapbox configuré (dans index.css)
- Composant MapboxMapView créé avec les nouvelles API

### 🚀 Étapes de configuration

#### 1. Obtenir un token Mapbox

1. **Créez un compte gratuit** sur [mapbox.com](https://mapbox.com)
2. **Accédez au tableau de bord** : [account.mapbox.com](https://account.mapbox.com)
3. **Copiez votre token d'accès par défaut** (commence par `pk.`)

#### 2. Configurer le token dans votre projet

Créez un fichier `.env` à la racine du projet :

```bash
# .env
REACT_APP_MAPBOX_TOKEN=pk.your_actual_token_here
```

**⚠️ Remplacez `pk.your_actual_token_here` par votre vrai token !**

#### 3. Mise à niveau vers v3.9.0+ (optionnel)

Pour utiliser les nouvelles [Interactions API](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/) complètes :

```bash
npm install mapbox-gl@latest
```

## 🎯 Fonctionnalités implémentées selon la documentation

### 1. **Interactions sur la carte** (map.addInteraction)

```javascript
// Clic sur la carte - basé sur la doc
map.addInteraction('map-click', {
  type: 'click',
  handler: e => {
    console.log(`Cliqué à: ${e.lngLat.lng}, ${e.lngLat.lat}`);
    setSelectedFriend(null);
  },
});
```

### 2. **Interactions sur les featuresets** (POI, bâtiments)

```javascript
// Survol des Points d'Intérêt
map.addInteraction('poi-hover', {
  type: 'mouseenter',
  target: { featuresetId: 'poi', importId: 'basemap' },
  handler: e => {
    console.log('POI survolé:', e.feature.properties.name);
    map.getCanvas().style.cursor = 'pointer';
  },
});
```

### 3. **Marqueurs personnalisés** avec événements

- Marqueurs HTML customisés pour les amis
- Marqueur utilisateur avec animation
- Clics sur marqueurs pour afficher les détails

### 4. **Styles adaptatifs**

- **Mode clair** : `mapbox://styles/mapbox/streets-v12`
- **Mode sombre** : `mapbox://styles/mapbox/dark-v11`
- Basculement automatique selon le thème de l'app

## 📱 Utilisation dans l'application

### Intégration dans App.js

Le composant `MapboxMapView` est prêt à remplacer `MapView` :

```javascript
// Dans App.js, case 'map':
return (
  <MapboxMapView
    userLocation={location}
    availableFriends={availableFriends}
    darkMode={darkMode}
    selectedActivity={currentActivity}
    isAvailable={isAvailable}
  />
);
```

### Fonctionnalités disponibles

✅ **Carte Mapbox vraie** avec rues, bâtiments, POI  
✅ **Interactions API** selon la documentation officielle  
✅ **Marqueurs personnalisés** HTML pour amis et utilisateur  
✅ **Filtres d'activités** (Coffee, Lunch, Drinks, Chill)  
✅ **Zoom, centrage automatique** sur tous les points  
✅ **Mode sombre/clair** adaptatif  
✅ **Détails d'amis** avec distance calculée  
✅ **Gestion d'erreurs** complète avec guide de config

## 🔧 Troubleshooting

### ❌ "Token Mapbox manquant"

- Vérifiez que le fichier `.env` existe à la racine
- Redémarrez le serveur (`npm start`) après création du .env
- Le token doit commencer par `pk.`

### ❌ "Erreur de chargement de la carte"

- Vérifiez votre connexion internet
- Le token est-il valide et non expiré ?
- Consultez la console (F12) pour plus de détails

### ❌ Interactions ne fonctionnent pas

- Mettez à jour vers `mapbox-gl@latest` (v3.9.0+)
- Les interactions de base fonctionnent avec v2.15.0
- Les featuresets nécessitent v3.9.0+

## 🆚 Comparaison des versions

| Fonctionnalité   | MapView actuel     | MapboxMapView nouveau      |
| ---------------- | ------------------ | -------------------------- |
| **Base**         | Carte CSS stylisée | Vraie carte Mapbox         |
| **Interactions** | onClick basique    | Interactions API complètes |
| **POI**          | ❌                 | ✅ Survol des lieux        |
| **Rues**         | Grille simulée     | ✅ Vraies rues             |
| **Performance**  | Légère             | Optimisée Mapbox           |
| **Token requis** | ❌                 | ✅ Gratuit 50k vues/mois   |

## 📚 Références

- [Documentation Interactions API](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/)
- [Mapbox GL JS API Reference](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Exemples d'interactions](https://docs.mapbox.com/mapbox-gl-js/example/)
- [Pricing Mapbox](https://www.mapbox.com/pricing) - 50 000 vues gratuites/mois

---

💡 **Astuce** : Vous pouvez garder les deux versions et permettre à l'utilisateur de choisir dans les paramètres !
