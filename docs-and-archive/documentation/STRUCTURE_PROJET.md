# 📁 Structure Complète du Projet - "Qui Est Dispo"

## 🏗️ Architecture Générale

```
qui-est-dispo/
├── 📁 src/                    # Code source principal
├── 📁 public/                 # Assets statiques & PWA
├── 📁 .github/               # CI/CD & templates
├── 📁 scripts/               # Scripts utilitaires
├── 📁 build/                 # Build de production
├── 📁 docs-and-archive/      # Documentation & archives
├── 📁 node_modules/          # Dépendances NPM
└── 📄 Fichiers config       # Configuration projet
```

---

## 📂 Dossier `src/` - Code Source Principal

### 🎯 **Fichiers Racine**

```
src/
├── 📄 App.js              # Composant principal (53KB - 1546 lignes)
├── 📄 App.new.js          # Version refactorisée (20KB)
├── 📄 App.old.js          # Backup ancien App
├── 📄 AppRefactored.js    # Refactoring en cours
├── 📄 firebase.js         # Configuration Firebase (8.2KB)
├── 📄 index.js            # Point d'entrée React (1.6KB)
├── 📄 index.css           # Styles globaux (6KB)
└── 📄 reportWebVitals.js  # Métriques performance
```

### 🧩 **Components** - Interface Utilisateur

```
src/components/
├── 📱 Écrans Principaux
│   ├── 📄 LoginScreen.js           # Écran de connexion
│   ├── 📄 AppShell.js             # Layout principal
│   └── 📄 WarningBanner.js        # Bannières d'alerte
│
├── 🔘 Fonctionnalités Core
│   ├── 📄 AvailabilityButtons.js  # Boutons de disponibilité
│   ├── 📄 ActivityCard.js         # Cartes d'activités
│   ├── 📄 NotificationBadge.js    # Badges notifications
│   └── 📄 GPSStatusToast.js       # Status GPS
│
├── 👥 Gestion des Amis
│   ├── 📁 friends/
│   │   ├── 📄 AddFriendModal.js   # Modal ajout ami
│   │   ├── 📄 FriendInviteForm.js # Formulaire invitation
│   │   ├── 📄 PhoneSearch.js      # Recherche par téléphone
│   │   └── 📄 QRCodeScanner.js    # Scanner QR Code
│   └── 📄 InviteFriendsModal.js
│
├── 🗺️ Cartes & Géolocalisation
│   └── 📁 map/
│       ├── 📄 BaseMapView.js      # Vue carte de base
│       ├── 📄 MapboxMapView.js    # Implémentation Mapbox
│       ├── 📄 StandardMapView.js  # Vue carte standard
│       ├── 📄 MapControls.js      # Contrôles carte
│       ├── 📄 MapMarkers.js       # Marqueurs carte
│       ├── 📄 mapUtils.js         # Utilitaires carte
│       └── 📄 useMapLogic.js      # Logique métier carte
│
├── 👤 Profil Utilisateur
│   └── 📁 profile/
│       ├── 📄 AvatarUploader.js   # Upload avatar
│       ├── 📄 ProfileEditor.js    # Éditeur profil
│       ├── 📄 ProfileForm.js      # Formulaire profil
│       └── 📄 useProfileEditor.js # Hook profil
│
├── 📱 Écrans Spécialisés
│   └── 📁 screens/
│       ├── 📄 HomeScreen.js       # Écran accueil
│       ├── 📄 FriendsScreen.js    # Écran amis
│       ├── 📄 MapScreen.js        # Écran carte
│       ├── 📄 NotificationsScreen.js # Écran notifications
│       └── 📄 SettingsScreen.js   # Écran paramètres
│
└── 🔧 Modals & Utilitaires
    ├── 📄 AddFriendModal.js       # Modal ajout ami
    ├── 📄 DeleteAccountModal.js   # Modal suppression compte
    ├── 📄 PhoneRequiredModal.js   # Modal téléphone requis
    ├── 📄 PWAInstallPrompt.js     # Prompt installation PWA
    ├── 📄 UpdateNotification.js   # Notifications MAJ
    ├── 📄 CookieConsent.js        # Consentement cookies
    ├── 📄 GoogleSignInButton.js   # Bouton Google Sign-In
    └── 📄 NotificationTest.js     # Tests notifications
```

### ⚡ **Hooks** - Logique Réutilisable

```
src/hooks/
├── 📄 useAuth.js              # Hook authentification
├── 📄 useGeolocation.js       # Hook géolocalisation
└── 📄 useGPSNotifications.js  # Hook notifications GPS
```

### 🔧 **Services** - Logique Métier

```
src/services/
├── 🔐 Authentification
│   ├── 📄 authService.js          # Service authentification principal
│   ├── 📄 googleSignInService.js  # Connexion Google
│   └── 📄 appCheckService.js      # Vérification App Check
│
├── 🔥 Firebase
│   ├── 📄 firebaseService.js      # Service Firebase principal
│   ├── 📄 firebaseService.old.js  # Backup ancienne version
│   └── 📄 firebaseUtils.js        # Utilitaires Firebase
│
├── 👥 Social & Amis
│   ├── 📄 friendsService.js       # Gestion amis
│   ├── 📄 invitationService.js    # Service invitations
│   └── 📄 availabilityService.js  # Gestion disponibilités
│
├── 🔔 Notifications
│   ├── 📄 notificationService.js      # Notifications générales
│   └── 📄 pushNotificationService.js  # Push notifications
│
├── 🍪 Utilitaires
│   ├── 📄 cookieService.js        # Gestion cookies
│   └── 📄 index.js                # Export services
│
└── 📚 README.md                   # Documentation services
```

### 🧪 **Tests** - Tests Automatisés

```
src/tests/
├── 📄 authService.test.js     # Tests service authentification
└── 📄 utils.test.js          # Tests utilitaires
```

### 🛠️ **Utils** - Fonctions Utilitaires

```
src/utils/
├── 📄 logger.js              # Système de logs centralisé
├── 📄 errorHandler.js        # Gestion d'erreurs
├── 📄 errorMonitoring.js     # Monitoring d'erreurs
├── 📄 avatarUtils.js         # Utilitaires avatar
└── 📄 mockData.js           # Données de test
```

### 🎨 **Styles**

```
src/styles/
└── 📄 responsive.css         # Styles responsive
```

---

## 📱 Dossier `public/` - PWA & Assets

### 📄 **Configuration PWA**

```
public/
├── 📄 manifest.json              # Manifeste PWA (1.6KB)
├── 📄 sw.js                      # Service Worker (12KB)
├── 📄 firebase-messaging-sw.js   # SW Firebase messaging
├── 📄 index.html                 # Template HTML principal
└── 📄 robots.txt                 # SEO robots
```

### 🎯 **Assets & Icônes**

```
public/
├── 📄 favicon.ico               # Favicon classique
├── 📄 favicon.svg               # Favicon vectoriel
├── 📄 logo192.svg               # Logo PWA 192px
├── 📄 logo512.svg               # Logo PWA 512px
├── 📄 social-preview.png        # Image sociale (337KB)
└── 📄 social-preview.svg        # Image sociale vectorielle
```

---

## ⚙️ Dossier `.github/` - CI/CD & Automation

### 🚀 **Workflows CI/CD**

```
.github/
├── 📁 workflows/
│   └── 📄 ci.yml                # Pipeline GitHub Actions
├── 📄 CODEOWNERS               # Propriétaires du code
└── 📄 pull_request_template.md # Template PR
```

---

## 📋 **Fichiers de Configuration Racine**

### 📦 **Package Management**

```
├── 📄 package.json              # Dépendances & scripts (1.6KB)
├── 📄 package-lock.json         # Lock file NPM (738KB)
└── 📄 .gitignore               # Fichiers ignorés Git
```

### 🔧 **Configuration Outils**

```
├── 📄 .eslintrc.json           # Configuration ESLint
├── 📄 .prettierrc              # Configuration Prettier
├── 📄 jsconfig.json            # Configuration JavaScript/TypeScript
├── 📄 tailwind.config.js       # Configuration Tailwind CSS
├── 📄 postcss.config.js        # Configuration PostCSS
└── 📄 vercel.json              # Configuration déploiement Vercel
```

### 🔥 **Firebase & Deployment**

```
├── 📄 firebase.json            # Configuration Firebase
├── 📄 .firebaserc             # Projets Firebase
├── 📄 firestore.rules         # Règles sécurité Firestore
└── 📄 firestore.indexes.json  # Index Firestore
```

### 🛡️ **Git & Qualité**

```
├── 📁 .husky/
│   └── 📄 pre-commit           # Hook pre-commit
└── 📁 .git/                   # Repository Git
```

### 📚 **Documentation**

```
├── 📄 GUIDE_STRATEGIE_QUALITE.md      # Guide qualité complet
├── 📄 GUIDE_PROTECTION_BRANCHES.md    # Guide protection Git
├── 📄 GUIDE_RESOLUTION_ERREUR_500_SMS.md # Guide erreurs SMS
└── 📄 docs-and-archive/               # Documentation archivée
```

### 🧪 **Scripts & Debug**

```
├── 📁 scripts/
│   └── 📄 convert-svg-to-png.js       # Conversion SVG→PNG
├── 📄 debug-invitations.js            # Debug invitations (6.7KB)
├── 📄 debug-notifications.js          # Debug notifications (2.5KB)
└── 📄 test-notifications.html         # Test notifications HTML
```

---

## 📊 **Métriques du Projet**

### 📈 **Taille des Fichiers Principaux**

- **App.js** : 53KB (1546 lignes) - Composant principal
- **firebase.js** : 8.2KB (244 lignes) - Config Firebase
- **package-lock.json** : 738KB - Lock file NPM
- **sw.js** : 12KB (489 lignes) - Service Worker

### 🏗️ **Architecture en Chiffres**

- **Components** : ~35 fichiers (UI/UX)
- **Services** : 12 fichiers (logique métier)
- **Hooks** : 3 fichiers (logique réutilisable)
- **Utils** : 5 fichiers (fonctions utilitaires)
- **Tests** : 2 fichiers (en expansion)

### 🎯 **Points Remarquables**

✅ **Architecture modulaire** très bien organisée
✅ **Séparation claire** des responsabilités
✅ **PWA complète** avec Service Worker
✅ **Système de tests** en place
✅ **CI/CD configuré** avec GitHub Actions
✅ **Monitoring d'erreurs** intégré
✅ **Configuration qualité** complète

---

💡 **Cette structure démontre un projet mature, bien architecturé et prêt pour la production !**
