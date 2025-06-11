# 🤝 Qui Est Dispo - Firebase Edition

Application mobile-first pour organiser des rencontres spontanées entre amis avec **Firebase intégré**.

## 🚀 Installation Rapide

### Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Compte Firebase (gratuit)

### Installation

```bash
# Naviguer vers le dossier du projet
cd qui-est-dispo

# Installer toutes les dépendances
npm install

# Démarrer l'application
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 🔥 **Firebase Intégré - Prêt à l'Emploi !**

Votre application utilise maintenant **Firebase comme vraie base de données** avec votre configuration :

```javascript
// ✅ Configuration Firebase ACTIVE
const firebaseConfig = {
  apiKey: 'AIzaSyD6Hv0ruhvmWJoxaAtsqEM5nSWwU63c7dg',
  authDomain: 'qui-est-dispo.firebaseapp.com',
  projectId: 'qui-est-dispo',
  // ... (configuration complète)
};
```

## 📱 **Fonctionnalités 100% Opérationnelles**

### ✨ **Authentification Firebase**

- 🔐 **Google Sign-In** : Connexion instantanée avec compte Google
- 📱 **Phone Authentication** : Vérification SMS avec Firebase Auth
- 👤 **Profils utilisateurs** : Stockage automatique dans Firestore
- 🔄 **Sessions persistantes** : Reconnexion automatique

### 👥 **Système d'Amis Temps Réel**

- 📞 **Ajout par téléphone** : Recherche réelle dans la base Firebase
- 📱 **QR Code** : Génération et scan pour ajout instantané
- 🔄 **Synchronisation live** : Liste d'amis mise à jour en temps réel
- 👀 **Statut en ligne** : Voir qui est connecté

### 📍 **Disponibilités & Géolocalisation**

- 🎯 **4 Activités** : Coffee, Lunch, Drinks, Chill
- 📍 **GPS réel** : Position sauvegardée en base de données
- ⏰ **Timer automatique** : Expiration après 45 minutes
- 🔔 **Notifications push** : Alertes instantanées aux amis
- 📊 **Historique** : Suivi des rencontres en base

### 🗺️ **Carte Interactive Avancée**

- 🌍 **Coordonnées GPS réelles** : Calculs géographiques précis
- 📍 **Pins animés** : Position temps réel des amis disponibles
- 🔍 **Zoom fonctionnel** : Navigation interactive
- 📏 **Calcul de distances** : Distance réelle entre utilisateurs
- 🎨 **Filtres dynamiques** : Par activité avec recentrage auto

### 🔔 **Notifications Temps Réel**

- ⚡ **Firebase Cloud Messaging** : Notifications push natives
- 🔄 **Listeners temps réel** : Firestore en temps réel
- 💬 **Réponses directes** : Join/Decline depuis les notifications
- 📱 **Badge compteur** : Notifications non lues
- ✅ **Statut de lecture** : Marquer comme lu automatiquement

### 🎨 **Design Premium 2024**

- 🌓 **Mode sombre/clair** : Synchronisé avec préférences système
- ✨ **Animations Framer Motion** : Transitions fluides partout
- 📱 **Mobile-first** : Interface optimisée tactile
- 🎮 **Haptic feedback** : Vibrations sur interactions
- 🎯 **Zero cognitive load** : UX ultra-simple

## 🛠️ **Architecture Technique**

### Frontend

- **React 18** avec Hooks personnalisés
- **Framer Motion** pour animations fluides
- **Tailwind CSS** avec design system custom
- **Lucide React** pour icônes cohérentes
- **PWA Ready** avec Service Worker

### Backend Firebase

- **Firebase Auth** : Google + Phone authentication
- **Firestore** : Base de données temps réel NoSQL
- **Cloud Messaging** : Notifications push multiplateforme
- **Cloud Functions** : Logic serveur (extensible)
- **Firebase Storage** : Photos et médias (préparé)

### Services Temps Réel

- **Geolocation API** : Position GPS native
- **WebRTC** : Préparé pour appels/vidéo futurs
- **Background Sync** : Synchronisation hors ligne
- **Push Notifications** : Alertes système natives

## 📂 Structure du Projet

```
qui-est-dispo/
├── src/
│   ├── components/
│   │   ├── MapView.js          # Carte interactive complète
│   │   └── ActivityCard.js     # Cartes d'activité
│   ├── services/
│   │   └── firebaseService.js  # Services Firebase complets
│   ├── hooks/
│   │   ├── useAuth.js          # Hook authentification
│   │   └── useGeolocation.js   # Hook géolocalisation
│   ├── firebase.js             # Configuration Firebase
│   ├── App.js                  # App principale avec Firebase
│   └── index.js                # Point d'entrée
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker
└── FIREBASE_SETUP.md           # Guide d'activation Firebase
```

## 🔧 **Activation Firebase (1 minute)**

### 1. **Console Firebase**

1. Allez sur [Firebase Console](https://console.firebase.google.com/project/qui-est-dispo)
2. **Authentication** → Activez Google + Phone
3. **Firestore Database** → Créez en mode test
4. **Cloud Messaging** → Générez clé VAPID

### 2. **Démarrage**

```bash
npm start
```

**C'est tout !** L'app utilise maintenant Firebase comme vraie base de données.

## 📊 **Base de Données Firestore**

### Collections Automatiques

- **`users`** : Profils utilisateurs avec localisation
- **`availabilities`** : Disponibilités temps réel
- **`notifications`** : Système de notifications
- **`friendships`** : Relations d'amitié

### Données Temps Réel

```javascript
// Exemple de document utilisateur
{
  uid: "user123",
  name: "Alex",
  phone: "+33612345678",
  isOnline: true,
  isAvailable: true,
  currentActivity: "Coffee",
  location: { lat: 48.8566, lng: 2.3522, address: "République" },
  friends: ["uid1", "uid2"],
  createdAt: timestamp
}
```

## 🎯 **Fonctionnalités Testables**

### **Authentification**

1. **Google** : Connexion instantanée → Profil créé en Firestore
2. **Phone** : SMS réel → Vérification → Compte créé

### **Ajout d'Amis**

1. **Téléphone** : Saisir numéro → Recherche Firebase → Ajout mutuel
2. **QR Code** : Scanner → Ajout instantané → Notification

### **Disponibilités**

1. **"I'm down"** → Sélection activité → Broadcast Firebase
2. **Géolocalisation** → Position sauvée → Visible sur carte
3. **Timer 45min** → Expiration auto → Suppression base

### **Notifications**

1. **Ami disponible** → Notification push → Réponse directe
2. **Join ami** → Notification confirmée → Historique

### **Carte**

1. **View Map** → Pins GPS réels → Calculs distance
2. **Filtre activité** → Recentrage → Sélection ami

## 🚀 **Déploiement Production**

### Build & Deploy

```bash
# Build optimisé
npm run build

# Deploy Firebase Hosting
npm install -g firebase-tools
firebase login
firebase deploy
```

### Domaine Custom

- Configurez votre domaine dans Firebase Hosting
- SSL automatique avec certificat Google
- CDN mondial pour performances optimales

## 🔒 **Sécurité & Confidentialité**

- 🔐 **Authentification sécurisée** Firebase Auth
- 🛡️ **Règles Firestore** pour protection données
- 📍 **Géolocalisation approximative** (200m radius)
- 🚫 **Pas de tracking** publicitaire
- ✅ **RGPD compliant** avec consentement explicite

## 📈 **Analytics & Monitoring**

- 📊 **Firebase Analytics** : Métriques d'usage
- 🐛 **Crashlytics** : Monitoring erreurs
- ⚡ **Performance** : Temps de chargement
- 👥 **Engagement** : Rétention utilisateurs

## 🗺️ **Roadmap**

### Phase 1 : ✅ **Terminée** (MVP Firebase)

- [x] Authentification complète
- [x] Système d'amis temps réel
- [x] Disponibilités avec géolocalisation
- [x] Notifications push
- [x] Carte interactive

### Phase 2 : **En Cours** (Social Features)

- [ ] Chat intégré Firebase
- [ ] Groupes d'amis
- [ ] Photos de moments
- [ ] Historique des rencontres

### Phase 3 : **À Venir** (Intelligence)

- [ ] Recommandations IA
- [ ] Intégration calendrier
- [ ] Réservations automatiques
- [ ] Analytics comportementales

## 🐛 **Dépannage**

### **Problèmes Firebase**

```bash
# Reset complet
rm -rf node_modules
npm install
npm start
```

### **Erreurs d'Auth**

- Vérifiez domaines autorisés Firebase Console
- Contrôlez activation Google/Phone sign-in

### **Problèmes Géolocalisation**

- Autorisez l'accès localisation navigateur
- Position Paris par défaut si refusée

## 🤝 **Contribution**

1. Fork le projet
2. Créer branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add Firebase feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request avec description détaillée

## 📄 **Licence**

MIT License - Utilisation libre pour projets personnels et commerciaux.

## 🙏 **Technologies Utilisées**

- **Firebase** : Backend-as-a-Service complet
- **React** : Interface utilisateur moderne
- **Tailwind CSS** : Design system cohérent
- **Framer Motion** : Animations fluides
- **Geolocation API** : Positionnement GPS

---

## 🎉 **L'Application est Prête !**

**Firebase est maintenant votre vraie base de données !**

```bash
npm start
```

→ Connectez-vous avec Google ou téléphone
→ Ajoutez des amis par téléphone ou QR
→ Broadcastez votre disponibilité  
→ Rejoignez vos amis sur la carte !

**Qui est dispo ? Trouvez-le maintenant ! 🚀**

# Qui est dispo ? 🎉

Application mobile pour organiser des sorties spontanées entre amis. Partagez votre disponibilité et découvrez qui est libre pour un coffee ☕, un lunch 🍽️, des drinks 🍻 ou juste chill 😎 !

## 🚀 Fonctionnalités

- **Partage de disponibilité** : Indiquez quand vous êtes libre et pour quoi
- **Géolocalisation** : Trouvez les amis disponibles près de vous
- **Système d'invitations** : Invitez des amis à vous rejoindre
- **Notifications push** : Recevez des alertes en temps réel
- **Cartes interactives** : Visualisez les disponibilités sur une carte
- **Interface responsive** : Fonctionne sur mobile et desktop

## 📱 Installation

### En ligne

Accédez directement à l'application : [qui-est-dispo.vercel.app](https://qui-est-dispo.vercel.app/)

### Installation locale

1. Clonez le projet
2. Installez les dépendances : `npm install`
3. Configurez les variables d'environnement (voir section Configuration)
4. Lancez l'application : `npm start`

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Configuration Firebase (obligatoire)
REACT_APP_FIREBASE_API_KEY=votre_clé_api
REACT_APP_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre-projet-id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Notifications push (optionnel)
REACT_APP_FIREBASE_VAPID_KEY=votre_clé_vapid

# Sécurité reCAPTCHA (optionnel mais recommandé)
REACT_APP_RECAPTCHA_V3_SITE_KEY=votre_clé_recaptcha
```

### Configuration Firebase

1. **Créez un projet Firebase** sur [console.firebase.google.com](https://console.firebase.google.com/)

2. **Activez les services** :

   - Authentication (Google, Facebook, Phone)
   - Firestore Database
   - Cloud Messaging (pour les notifications push)

3. **Configurez les notifications push** :

   - Allez dans Project Settings > Cloud Messaging
   - Générez une clé Web push certificates (VAPID)
   - Copiez la clé dans `REACT_APP_FIREBASE_VAPID_KEY`

4. **Sécurité reCAPTCHA** (optionnel) :
   - Créez une clé sur [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
   - Utilisez reCAPTCHA v3
   - Ajoutez votre domaine dans la configuration

## 🛠️ Technologies

- **React** : Interface utilisateur
- **Firebase** : Base de données et authentification
- **Mapbox** : Cartes interactives
- **Tailwind CSS** : Styles
- **Framer Motion** : Animations
- **PWA** : Application web progressive

## 🎯 Comment utiliser

1. **Connectez-vous** avec Google, Facebook ou votre numéro de téléphone
2. **Autorisez la géolocalisation** pour partager votre position
3. **Partagez votre disponibilité** en sélectionnant une activité
4. **Ajoutez des amis** par numéro de téléphone ou QR code
5. **Recevez des invitations** et rejoignez les activités de vos amis
6. **Activez les notifications push** pour être alerté en temps réel

## 🔧 Développement

### Scripts disponibles

- `npm start` : Serveur de développement
- `npm build` : Build de production
- `npm test` : Tests unitaires
- `npm run deploy` : Déploiement sur Vercel

### Structure du projet

```
src/
├── components/     # Composants React
├── hooks/         # Hooks personnalisés
├── services/      # Services Firebase
├── utils/         # Utilitaires
└── App.js         # Composant principal
```

## 🚨 Résolution des problèmes

### Notifications push

Si vous rencontrez l'erreur "applicationServerKey is not valid" :

1. Vérifiez que `REACT_APP_FIREBASE_VAPID_KEY` est configurée
2. Générez une nouvelle clé VAPID dans la console Firebase
3. Redémarrez l'application après modification du .env.local

### Géolocalisation

Si la géolocalisation ne fonctionne pas :

1. Vérifiez les permissions de votre navigateur
2. Utilisez HTTPS (obligatoire pour la géolocalisation)
3. Testez sur un autre appareil/navigateur

## 🌟 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos modifications
4. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Fait avec ❤️ pour organiser des sorties spontanées entre amis ! 🎉
