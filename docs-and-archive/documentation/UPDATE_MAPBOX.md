# 🔄 Mise à jour pour intégrer la carte Mapbox

## 📝 Étapes d'intégration

### 1. Ajouter l'import dans App.js

Ajoutez cette ligne après les autres imports :

```javascript
// src/App.js - ligne 8
import MapboxMapView from './components/MapboxMapView';
```

### 2. Ajouter l'état pour choisir le type de carte

Ajoutez cette ligne après `const [darkMode, setDarkMode] = useState(false);` :

```javascript
// src/App.js - ligne 30
const [useMapbox, setUseMapbox] = useState(false);
```

### 3. Modifier le rendu de la carte

Remplacez le case 'map' dans `renderScreen()` par :

```javascript
// src/App.js - case 'map' (ligne 243)
case 'map':
  const MapComponent = useMapbox ? MapboxMapView : MapView;
  return (
    <MapComponent
      userLocation={location}
      availableFriends={availableFriends}
      darkMode={darkMode}
      selectedActivity={currentActivity}
      isAvailable={isAvailable}
    />
  );
```

### 4. Ajouter l'option dans les paramètres

Dans la section Apparence des paramètres, ajoutez après le toggle du thème sombre :

```javascript
// src/App.js - dans case 'settings' (après le toggle darkMode)
{
  /* Choix du type de carte */
}
<div className="flex items-center justify-between mt-4">
  <div>
    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      Carte Mapbox
    </h4>
    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      Utiliser la vraie carte Mapbox (nécessite un token)
    </p>
  </div>
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => setUseMapbox(!useMapbox)}
    className={`w-14 h-8 rounded-full p-1 transition-colors ${
      useMapbox ? 'bg-blue-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
    }`}
  >
    <div
      className={`w-6 h-6 rounded-full bg-white transition-transform ${
        useMapbox ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </motion.button>
</div>;
```

## 🎯 Configuration Mapbox

### Créer le fichier .env

```bash
# .env (à la racine du projet)
REACT_APP_MAPBOX_TOKEN=pk.votre_token_ici
```

### Obtenir un token Mapbox

1. Créez un compte sur [mapbox.com](https://mapbox.com)
2. Copiez votre token d'accès (commence par `pk.`)
3. Ajoutez-le dans `.env` et redémarrez l'app (`npm start`)

## 🧪 Test

1. **Lancez l'app** : `npm start`
2. **Allez dans Paramètres** → Activez "Carte Mapbox"
3. **Allez dans Carte** → Vous devriez voir la vraie carte
4. **Sans token** → Un message d'erreur explicatif s'affiche

## 🔄 Code complet pour les modifications

### Import (ligne 8)

```javascript
import MapboxMapView from './components/MapboxMapView';
```

### État (ligne 30)

```javascript
const [useMapbox, setUseMapbox] = useState(false);
```

### Rendu de la carte (ligne 243)

```javascript
case 'map':
  const MapComponent = useMapbox ? MapboxMapView : MapView;
  return (
    <MapComponent
      userLocation={location}
      availableFriends={availableFriends}
      darkMode={darkMode}
      selectedActivity={currentActivity}
      isAvailable={isAvailable}
    />
  );
```

### Option dans paramètres (à ajouter dans case 'settings')

```javascript
{
  /* Choix du type de carte */
}
<div className="flex items-center justify-between mt-4">
  <div>
    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      Carte Mapbox
    </h4>
    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      Utiliser la vraie carte Mapbox (nécessite un token)
    </p>
  </div>
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => setUseMapbox(!useMapbox)}
    className={`w-14 h-8 rounded-full p-1 transition-colors ${
      useMapbox ? 'bg-blue-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
    }`}
  >
    <div
      className={`w-6 h-6 rounded-full bg-white transition-transform ${
        useMapbox ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </motion.button>
</div>;
```

## ✅ Résultat

- **Carte stylisée** (par défaut) : rapide, fonctionne sans token
- **Carte Mapbox** (optionnelle) : vraie carte avec interactions avancées
- **Basculement facile** dans les paramètres
- **Messages d'erreur clairs** si configuration manquante

L'utilisateur peut maintenant choisir entre les deux options selon ses besoins !
