# 📁 Structure Complète - "Qui Est Dispo"

## 🏗️ Vue d'Ensemble

```
qui-est-dispo/
├── 📁 src/                    # Code source principal
├── 📁 public/                 # Assets PWA & statiques
├── 📁 .github/               # CI/CD & templates
├── 📁 scripts/               # Scripts utilitaires
├── 📁 build/                 # Build production
├── 📁 docs-and-archive/      # Documentation
├── 📁 node_modules/          # Dépendances
└── 📄 Config files           # Configuration
```

## 📂 src/ - Code Source

### 🎯 Fichiers Racine

- **App.js** (53KB) - Composant principal
- **firebase.js** (8.2KB) - Configuration Firebase
- **index.js** - Point d'entrée React
- **index.css** - Styles globaux

### 🧩 components/ - Interface

```
components/
├── 📱 Screens/
│   ├── LoginScreen.js
│   ├── AppShell.js
│   └── WarningBanner.js
├── 🔘 Core Features/
│   ├── AvailabilityButtons.js
│   ├── ActivityCard.js
│   └── NotificationBadge.js
├── 👥 friends/
│   ├── AddFriendModal.js
│   ├── FriendInviteForm.js
│   ├── PhoneSearch.js
│   └── QRCodeScanner.js
├── 🗺️ map/
│   ├── MapboxMapView.js
│   ├── MapControls.js
│   ├── MapMarkers.js
│   └── useMapLogic.js
├── 👤 profile/
│   ├── AvatarUploader.js
│   ├── ProfileEditor.js
│   └── ProfileForm.js
└── 📱 screens/
    ├── HomeScreen.js
    ├── FriendsScreen.js
    ├── MapScreen.js
    ├── NotificationsScreen.js
    └── SettingsScreen.js
```

### ⚡ hooks/ - Logique Réutilisable

- **useAuth.js** - Authentification
- **useGeolocation.js** - Géolocalisation
- **useGPSNotifications.js** - Notifications GPS

### 🔧 services/ - Logique Métier

```
services/
├── 🔐 Auth/
│   ├── authService.js
│   ├── googleSignInService.js
│   └── appCheckService.js
├── 🔥 Firebase/
│   ├── firebaseService.js
│   └── firebaseUtils.js
├── 👥 Social/
│   ├── friendsService.js
│   ├── invitationService.js
│   └── availabilityService.js
└── 🔔 Notifications/
    ├── notificationService.js
    └── pushNotificationService.js
```

### 🧪 tests/ - Tests Automatisés

- **authService.test.js** - Tests auth
- **utils.test.js** - Tests utilitaires

### 🛠️ utils/ - Fonctions Utilitaires

- **logger.js** - Logs centralisés
- **errorMonitoring.js** - Monitoring erreurs
- **avatarUtils.js** - Utilitaires avatar

## 📱 public/ - PWA & Assets

### 📄 Configuration PWA

- **manifest.json** - Manifeste PWA
- **sw.js** (12KB) - Service Worker
- **firebase-messaging-sw.js** - SW Firebase
- **index.html** - Template HTML

### 🎯 Assets

- **favicon.ico/svg** - Favicons
- **logo192/512.svg** - Logos PWA
- **social-preview.png/svg** - Images sociales

## ⚙️ .github/ - CI/CD

### 🚀 Workflows

- **workflows/ci.yml** - Pipeline GitHub Actions
- **CODEOWNERS** - Propriétaires code
- **pull_request_template.md** - Template PR

## 📋 Configuration Racine

### 📦 Package Management

- **package.json** (1.6KB) - Dépendances
- **package-lock.json** (738KB) - Lock file

### 🔧 Outils Dev

- **.eslintrc.json** - Configuration ESLint
- **.prettierrc** - Configuration Prettier
- **jsconfig.json** - Config JavaScript/TypeScript
- **tailwind.config.js** - Config Tailwind CSS

### 🔥 Firebase & Deploy

- **firebase.json** - Config Firebase
- **firestore.rules** - Règles sécurité
- **firestore.indexes.json** - Index DB
- **vercel.json** - Config déploiement

### 🛡️ Qualité & Git

- **.husky/pre-commit** - Hook pre-commit
- **GUIDE_STRATEGIE_QUALITE.md** - Guide qualité
- **GUIDE_PROTECTION_BRANCHES.md** - Guide Git

## 📊 Métriques

### 📈 Taille Fichiers Principaux

- **App.js**: 53KB (1546 lignes)
- **firebase.js**: 8.2KB (244 lignes)
- **sw.js**: 12KB (489 lignes)

### 🏗️ Architecture

- **Components**: ~35 fichiers UI/UX
- **Services**: 12 fichiers logique métier
- **Hooks**: 3 fichiers logique réutilisable
- **Utils**: 5 fichiers utilitaires
- **Tests**: 2 fichiers (en expansion)

## 🎯 Points Forts

✅ **Architecture modulaire** excellente
✅ **Séparation responsabilités** claire
✅ **PWA complète** avec offline
✅ **Tests automatisés** configurés
✅ **CI/CD** avec GitHub Actions
✅ **Monitoring erreurs** centralisé
✅ **Qualité code** avec ESLint/Prettier

---

💡 **Projet mature, bien structuré et prêt production !**
