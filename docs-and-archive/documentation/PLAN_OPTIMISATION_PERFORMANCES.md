# 🚀 PLAN D'OPTIMISATION PERFORMANCES - Qui est dispo

## 📊 **DIAGNOSTIC ACTUEL**

### **🔍 Problèmes Identifiés**

- **Bundle principal** : **541.36 kB** (⚠️ Trop volumineux - recommandé <244 kB)
- **CSS principal** : 13.57 kB (✅ Acceptable)
- **Chunks additionnels** : 10.38 kB + 5.72 kB + 2.68 kB (✅ Bien découpés)
- **Avertissement CRA** : "Bundle size significantly larger than recommended"

### **🎯 Cibles de Performance**

- **Bundle principal** : `541 kB → <200 kB` (-63%)
- **First Contentful Paint** : `<1.5s`
- **Largest Contentful Paint** : `<2.5s`
- **Time to Interactive** : `<3.5s`

---

## 🛠️ **PHASE 1 : CODE SPLITTING (CRITIQUE)**

### **1.1 Lazy Loading des Écrans Principaux**

```javascript
// src/App.js - Implémenter React.lazy
import { lazy, Suspense } from 'react';

// Écrans principaux en lazy loading
const HomeScreen = lazy(() => import('./components/screens/HomeScreen'));
const FriendsScreen = lazy(() => import('./components/screens/FriendsScreen'));
const MapScreen = lazy(() => import('./components/screens/MapScreen'));
const NotificationsScreen = lazy(
  () => import('./components/screens/NotificationsScreen')
);
const SettingsScreen = lazy(
  () => import('./components/screens/SettingsScreen')
);

// Dans App.js
<Suspense fallback={<LoadingSpinner />}>
  {currentScreen === 'home' && <HomeScreen {...props} />}
  {currentScreen === 'friends' && <FriendsScreen {...props} />}
  {currentScreen === 'map' && <MapScreen {...props} />}
</Suspense>;
```

### **1.2 Lazy Loading des Modals Lourds**

```javascript
// Modals en lazy loading (chargés seulement à l'ouverture)
const MapboxMapView = lazy(() => import('./components/map/MapboxMapView'));
const InviteFriendsModal = lazy(
  () => import('./components/InviteFriendsModal')
);
const ProfileEditor = lazy(() => import('./components/profile/ProfileEditor'));
```

### **1.3 Optimisation Mapbox (Gros Impact)**

```javascript
// Chargement conditionnel de Mapbox
const MapView = lazy(
  () =>
    import(/* webpackChunkName: "mapbox" */ './components/map/MapboxMapView')
);

// Préload intelligent selon l'utilisation
useEffect(() => {
  if (currentScreen === 'map' || isAvailable) {
    import('./components/map/MapboxMapView');
  }
}, [currentScreen, isAvailable]);
```

---

## 🎨 **PHASE 2 : OPTIMISATION ASSETS (MOYEN)**

### **2.1 Optimisation Framer Motion**

```javascript
// Au lieu d'importer tout framer-motion
import { motion } from 'framer-motion';

// Importer seulement les composants utilisés
import { motion } from 'framer-motion/client';
import { AnimatePresence } from 'framer-motion/client';
```

### **2.2 Tree Shaking Lucide Icons**

```javascript
// Au lieu d'importer tous les icônes
import {
  Bell,
  MapPin,
  Users,
  Coffee, // ... tous
} from 'lucide-react';

// Importer seulement les icônes nécessaires par fichier
import Bell from 'lucide-react/dist/esm/icons/bell';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
```

### **2.3 Optimisation Firebase**

```javascript
// firebase.js - Importer seulement les modules nécessaires
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// NE PAS importer : analytics, storage, functions si non utilisés
```

---

## ⚡ **PHASE 3 : OPTIMISATION RUNTIME (HAUT IMPACT)**

### **3.1 Memoization Agressive**

```javascript
// useCallback pour les fonctions coûteuses
const handleLocationUpdate = useCallback(location => {
  // Logique mise à jour position
}, []);

// useMemo pour les calculs lourds
const filteredFriends = useMemo(
  () => friends.filter(friend => friend.isAvailable),
  [friends]
);

// React.memo pour les composants lourds
export default React.memo(
  MapView,
  (prevProps, nextProps) => prevProps.location === nextProps.location
);
```

### **3.2 Virtualisation Listes Longues**

```javascript
// Pour les listes d'amis/notifications avec react-window
import { FixedSizeList as List } from 'react-window';

const FriendsList = ({ friends }) => (
  <List
    height={400}
    itemCount={friends.length}
    itemSize={80}
    itemData={friends}
  >
    {FriendItem}
  </List>
);
```

### **3.3 Debouncing Recherches**

```javascript
// Recherche avec debounce pour éviter trop d'API calls
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## 🔧 **PHASE 4 : OPTIMISATION BUILD (TECHNIQUE)**

### **4.1 Webpack Bundle Analyzer**

```bash
# Installer l'analyseur de bundle
npm install --save-dev webpack-bundle-analyzer

# Script d'analyse
"analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
```

### **4.2 Compression Avancée**

```javascript
// craco.config.js - Optimisations webpack
module.exports = {
  webpack: {
    configure: webpackConfig => {
      // Optimisation production
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            mapbox: {
              test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl)[\\/]/,
              name: 'mapbox',
              chunks: 'all',
              priority: 20,
            },
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 15,
            },
          },
        };
      }
      return webpackConfig;
    },
  },
};
```

### **4.3 Preload/Prefetch Intelligent**

```javascript
// Dans index.html ou via webpack
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="prefetch" href="/static/js/mapbox.chunk.js">
```

---

## 📱 **PHASE 5 : OPTIMISATION UX MOBILE (CRITIQUE)**

### **5.1 Progressive Loading**

```javascript
// Skeleton screens pendant le chargement
const SkeletonFriendCard = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
  </div>
);

// Affichage immédiat avec skeleton
{
  loading ? <SkeletonFriendCard /> : <FriendCard data={friend} />;
}
```

### **5.2 Image Optimizations**

```javascript
// Lazy loading images avec intersection observer
const LazyImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true);
        observer.disconnect();
      }
    });

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      {loaded ? <img src={src} alt={alt} {...props} /> : <SkeletonImage />}
    </div>
  );
};
```

### **5.3 Service Worker Optimisé**

```javascript
// public/sw.js - Cache intelligent
const CACHE_NAME = 'qui-est-dispo-v1';
const STATIC_CACHE = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  // NE PAS cacher mapbox.js (trop lourd)
];

// Cache network-first pour API, cache-first pour assets
```

---

## 🎯 **PHASE 6 : MONITORING PERFORMANCE (ESSENTIEL)**

### **6.1 Web Vitals Tracking**

```javascript
// Monitoring automatique des métriques
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = metric => {
  // Envoyer à votre service d'analytics
  console.log('Performance metric:', metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### **6.2 Performance Budget**

```javascript
// webpack.config.js - Alertes si bundle trop lourd
module.exports = {
  performance: {
    maxAssetSize: 250000, // 250kb max par asset
    maxEntrypointSize: 250000, // 250kb max pour entry point
    hints: 'error', // Erreur si dépassement
  },
};
```

---

## 📊 **RÉSULTATS ATTENDUS**

### **🎯 Métriques Cibles**

| Métrique    | Avant  | Cible   | Amélioration |
| ----------- | ------ | ------- | ------------ |
| Bundle Size | 541 kB | <200 kB | -63%         |
| FCP         | ~2.5s  | <1.5s   | -40%         |
| LCP         | ~4s    | <2.5s   | -38%         |
| TTI         | ~5s    | <3.5s   | -30%         |

### **🚀 Impact Utilisateur**

- **Chargement initial** : 2x plus rapide
- **Navigation** : Instantanée (lazy loading)
- **Consommation data** : -60% mobile
- **Expérience** : Fluide sur 3G

---

## 🛣️ **ROADMAP D'IMPLÉMENTATION**

### **Sprint 1 (Haute Priorité) - 2-3 jours**

1. ✅ Code splitting écrans principaux
2. ✅ Lazy loading Mapbox
3. ✅ Optimisation imports Firebase

### **Sprint 2 (Moyenne Priorité) - 1-2 jours**

4. ✅ Memoization composants lourds
5. ✅ Tree shaking Lucide icons
6. ✅ Bundle analyzer setup

### **Sprint 3 (Polish) - 1 jour**

7. ✅ Skeleton screens
8. ✅ Image lazy loading
9. ✅ Web Vitals monitoring

---

## 💡 **BONNES PRATIQUES ÉTABLIES**

### **🔍 Règles de Développement**

- **Import dynamique** pour tout module >50kb
- **React.memo** pour composants re-rendus fréquemment
- **useMemo/useCallback** pour calculs coûteux
- **Lazy loading** obligatoire pour modals/écrans secondaires

### **🎯 Critères d'Acceptation**

- Bundle principal <200kb ✅
- Score Lighthouse >90 ✅
- TTI <3.5s sur 3G ✅
- Pas de waterfall critique ✅

---

**🎉 OBJECTIF : APPLICATION SUB-200KB ULTRA-RAPIDE !**
