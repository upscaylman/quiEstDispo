# 🔥 Configuration Firebase pour "Qui Est Dispo"

## ✅ Configuration Firebase Déjà Intégrée

Votre application **"qui est dispo"** est maintenant **100% connectée à Firebase** avec votre vraie configuration !

## 🚀 Pour Activer Firebase Complètement :

### 1. **Activez les Services Firebase dans la Console :**

Allez sur [Firebase Console](https://console.firebase.google.com/project/qui-est-dispo) :

#### 🔐 **Authentication :**

- Cliquez sur **"Authentication"** → **"Sign-in method"**
- Activez **"Google"** : Ajoutez votre domaine autorisé
- Activez **"Phone"** : Configurez les numéros de test
- **Sauvegardez** les paramètres

#### 📊 **Firestore Database :**

- Cliquez sur **"Firestore Database"** → **"Create database"**
- Choisissez **"Start in test mode"** (pour commencer)
- Sélectionnez la région **"eur3 (Europe)"**
- Les collections seront créées automatiquement :
  - `users` - Profils utilisateurs
  - `availabilities` - Disponibilités temps réel
  - `notifications` - Notifications push
  - `friendships` - Relations d'amitié

#### 🔔 **Cloud Messaging :**

- Cliquez sur **"Cloud Messaging"**
- Générez une **clé VAPID** pour les notifications web
- Copiez la clé dans `src/firebase.js` (ligne avec `vapidKey`)

### 2. **Démarrez l'Application :**

```bash
# Dans le dossier qui-est-dispo
npm install
npm start
```

## ✨ **Fonctionnalités Firebase Intégrées :**

### 🔑 **Authentification Réelle**

- ✅ **Google Sign-In** : Connexion instantanée
- ✅ **Phone Authentication** : SMS de vérification
- ✅ **Profils utilisateurs** : Stockage automatique

### 👥 **Système d'Amis**

- ✅ **Ajout par téléphone** : Recherche dans la base Firebase
- ✅ **QR Code** : Ajout instantané d'amis
- ✅ **Synchronisation temps réel** : Liste mise à jour en live

### 📍 **Disponibilités**

- ✅ **Broadcast d'activité** : Coffee, Lunch, Drinks, Chill
- ✅ **Géolocalisation** : Position sauvée en base
- ✅ **Timer automatique** : Expiration après 45 min
- ✅ **Notifications push** : Alertes aux amis

### 🔔 **Notifications Temps Réel**

- ✅ **Système de notifications** : Firebase Cloud Messaging
- ✅ **Écoute en temps réel** : Firestore listeners
- ✅ **Réponses directes** : Join/Decline depuis notifications

### 🗺️ **Carte Interactive**

- ✅ **Positions GPS réelles** : Coordonnées stockées en Firebase
- ✅ **Amis disponibles** : Affichage temps réel sur carte
- ✅ **Calculs de distance** : Algorithmes géographiques

## 📊 **Structure de la Base de Données :**

### Collection `users`

```javascript
{
  uid: "user123",
  name: "Alex",
  phone: "+33612345678",
  email: "alex@example.com",
  avatar: "😊",
  createdAt: timestamp,
  isOnline: true,
  lastSeen: timestamp,
  location: { lat: 48.8566, lng: 2.3522 },
  isAvailable: false,
  currentActivity: null,
  friends: ["uid1", "uid2", "uid3"]
}
```

### Collection `availabilities`

```javascript
{
  userId: "user123",
  activity: "Coffee",
  location: {
    lat: 48.8566,
    lng: 2.3522,
    address: "République"
  },
  startTime: timestamp,
  endTime: timestamp,
  isActive: true,
  createdAt: timestamp
}
```

### Collection `notifications`

```javascript
{
  to: "user456",
  from: "user123",
  type: "availability",
  activity: "Coffee",
  message: "Alex is down for Coffee!",
  createdAt: timestamp,
  read: false
}
```

## 🛡️ **Règles de Sécurité Firestore :**

Une fois que vous testez, remplacez les règles par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users peuvent lire/écrire leurs propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.friends.hasAny([request.auth.uid]);
    }

    // Availabilities lisibles par les amis
    match /availabilities/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Notifications lisibles par le destinataire
    match /notifications/{docId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.to || request.auth.uid == resource.data.from);
    }
  }
}
```

## 🎉 **L'Application est Prête !**

Toutes les fonctionnalités sont **opérationnelles** :

- ✅ **Authentication Google/Phone** → Stockage Firebase
- ✅ **Ajout d'amis** → Base de données réelle
- ✅ **Disponibilités** → Notifications temps réel
- ✅ **Map interactive** → Coordonnées GPS
- ✅ **Notifications** → Système push intégré

**Lancez `npm start` et testez !** 🚀

---

## 🐛 **Dépannage :**

### **Erreur Auth :**

- Vérifiez que Google/Phone sont activés dans Firebase Console
- Ajoutez `localhost:3000` aux domaines autorisés

### **Erreur Firestore :**

- Vérifiez que la base est créée en mode "test"
- Les collections se créent automatiquement au premier usage

### **Erreur Géolocalisation :**

- Autorisez l'accès à la localisation dans le navigateur
- Position par défaut : Paris si refusée

---

**Firebase est maintenant votre vraie base de données ! 🔥**

---

# Configuration Firebase pour qui-est-dispo

Ce guide suit les recommandations de la [documentation officielle Firebase Authentication](https://firebase.google.com/docs/auth/?hl=fr).

## 1. Configuration dans la Console Firebase

### Étapes obligatoires :

1. **Accéder à la console Firebase** : https://console.firebase.google.com
2. **Sélectionner votre projet** : `qui-est-dispo`
3. **Aller dans Authentication** → **Sign-in method**

### Méthodes de connexion à activer :

#### A. Authentification par numéro de téléphone

- ✅ **Activer** "Phone"
- **Numéros de test** (pour développement) :
  - `+33612345678` → Code: `123456`
- **Configuration reCAPTCHA** : Ajouter votre domaine dans les domaines autorisés

#### B. Authentification Google

- ✅ **Activer** "Google"
- **Email d'assistance** : Votre email
- **Nom public du projet** : "Qui est dispo"
- **Configuration OAuth** :
  - Domaines autorisés : `localhost`, votre domaine de production

**Fonctionnalités avancées Google :**

- ✅ **Popup et Redirection** : Deux méthodes de connexion implémentées
- ✅ **Gestion d'erreurs avancée** : Messages en français avec codes Firebase
- ✅ **Support mobile** : Basculement automatique vers redirection si popup bloquée
- ✅ **Tokens Google** : Récupération des access tokens pour API Google
- ✅ **Personnalisation** : Interface en français, sélection de compte forcée

#### C. Authentification Facebook

- ✅ **Activer** "Facebook" dans Authentication > Sign-in method
- **Configuration App Facebook** :
  1. Créer une application sur [Facebook Developers](https://developers.facebook.com)
  2. Ajouter le produit "Facebook Login"
  3. **Valid OAuth Redirect URIs** : `https://PROJECT_ID.firebaseapp.com/__/auth/handler`
  4. **App ID** et **App Secret** : À copier dans Firebase Console

**Fonctionnalités avancées Facebook :**

- ✅ **Popup et Redirection** : Deux méthodes de connexion implémentées
- ✅ **Scopes configurés** : `email`, `public_profile`
- ✅ **Interface française** : `locale: 'fr_FR'`
- ✅ **Gestion d'erreurs complète** : Messages en français avec codes Firebase
- ✅ **Tokens Facebook** : Access tokens disponibles pour Graph API

#### Configuration domaine personnalisé (optionnel)

Pour une meilleure expérience utilisateur sans afficher votre sous-domaine Firebase :

1. **Configurer Firebase Hosting** avec un domaine personnalisé (ex: `auth.monapp.com`)
2. **Ajouter aux domaines autorisés** : `auth.monapp.com`
3. **Configurer Google Cloud Console** : URL de redirection `https://auth.monapp.com/__/auth/handler`
4. **Modifier la config Firebase** :
   ```javascript
   const firebaseConfig = {
     // ...autres configs
     authDomain: 'auth.monapp.com', // au lieu de PROJECT_ID.firebaseapp.com
   };
   ```

## Configuration Facebook détaillée

### Étapes dans Facebook Developers Console :

1. **Créer l'application** : https://developers.facebook.com/apps/
2. **Configuration de base** :

   - Nom de l'application : "Qui est dispo"
   - Contact email : Votre email
   - Catégorie : "Social Networking"

3. **Ajouter Facebook Login** :

   - Products → Add a Product → Facebook Login → Set Up
   - **Valid OAuth Redirect URIs** :
     ```
     https://PROJECT_ID.firebaseapp.com/__/auth/handler
     ```
   - Remplacez `PROJECT_ID` par votre ID de projet Firebase

4. **App Review** :

   - **Public** : Activez "Make App Public" pour permettre les connexions
   - **Permissions** : `email` et `public_profile` sont disponibles par défaut

5. **Récupérer les clés** :
   - App Settings → Basic
   - Copiez **App ID** et **App Secret**

### Étapes dans Firebase Console :

1. Authentication → Sign-in method → Facebook
2. **Enable** Facebook
3. Collez **App ID** et **App Secret** depuis Facebook
4. Copiez l'**OAuth redirect URI** et l'ajouter dans Facebook Console

## Configuration App Check (Protection contre les abus)

App Check protège vos APIs backend contre les abus selon la [documentation Firebase](https://firebase.google.com/docs/app-check/web/custom-resource).

### Étapes de configuration :

1. **Activer App Check dans Firebase Console** :

   - Project Settings → App Check
   - Cliquez "Get Started"
   - **Pour Web** : Sélectionnez "reCAPTCHA v3"

2. **Configurer reCAPTCHA v3** :

   - Allez sur [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
   - Créez un nouveau site avec reCAPTCHA v3
   - Domaines autorisés : `localhost`, votre domaine production
   - **Copiez la Site Key**

3. **Ajouter la variable d'environnement** :

   ```env
   REACT_APP_RECAPTCHA_V3_SITE_KEY=your_recaptcha_site_key_here
   ```

4. **Activer pour vos services** :
   - Firebase Console → App Check
   - **Firestore** : Enforce
   - **Cloud Functions** : Enforce (si vous en avez)
   - **Realtime Database** : Enforce (si vous l'utilisez)

### Fonctionnalités implémentées :

- ✅ **Tokens App Check** : Jetons automatiques pour toutes les requêtes
- ✅ **Tokens limités** : Protection contre la relecture pour actions sensibles
- ✅ **Backend sécurisé** : Requêtes API avec en-têtes `X-Firebase-AppCheck`
- ✅ **Debug en développement** : Fonctionnement sans reCAPTCHA en local

### Utilisation dans votre code :

```javascript
// Requête sécurisée vers votre backend
const response = await AuthService.secureBackendCall(
  'https://your-api.com/endpoint',
  {
    method: 'POST',
    body: JSON.stringify({ data: 'sensitive' }),
  },
  true
); // true = jeton à usage limité

// Vérifier l'état d'App Check
const isActive = await AuthService.checkAppCheckStatus();
```

## 2. Configuration des règles de sécurité

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs peuvent lire/écrire leurs propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Disponibilités : lecture pour les amis, écriture pour le propriétaire
    match /availabilities/{availabilityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Notifications : lecture/écriture pour le destinataire
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.to;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars utilisateurs
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3. Variables d'environnement

Créer un fichier `.env.local` :

```env
# Configuration Firebase
REACT_APP_FIREBASE_API_KEY=votre_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=qui-est-dispo.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=qui-est-dispo
REACT_APP_FIREBASE_STORAGE_BUCKET=qui-est-dispo.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
REACT_APP_FIREBASE_APP_ID=votre_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=votre_measurement_id
REACT_APP_FIREBASE_VAPID_KEY=votre_vapid_key
```

## 4. Bonnes pratiques implémentées

### Gestion des erreurs

- ✅ Codes d'erreur spécifiques selon la documentation
- ✅ Messages d'erreur en français
- ✅ Gestion des cas réseau

### Persistance d'authentification

- ✅ État maintenu automatiquement par Firebase
- ✅ Pas de re-connexion nécessaire après rechargement

### Sécurité

- ✅ Validation côté serveur avec les règles Firestore
- ✅ Tokens d'authentification automatiques
- ✅ Isolation des données utilisateur

### Performance

- ✅ Chargement optimisé des données
- ✅ Listeners temps-réel efficaces
- ✅ Cache approprié

## 5. Tests recommandés

### Numéros de test (développement)

- `+33612345678` avec code `123456`
- `06 12 34 56 78` avec code `123456`

### Comptes Google de test

- Créer des comptes Gmail de test pour validation

## 6. Monitoring

### Métriques à surveiller dans Firebase Console :

- **Authentication** → **Users** : Nombre d'utilisateurs actifs
- **Authentication** → **Sign-in methods** : Taux de réussite par méthode
- **Firestore** → **Usage** : Lectures/écritures par jour
- **Storage** → **Usage** : Taille des fichiers uploadés

## 7. Déploiement

### Domaines autorisés (Production)

Ajouter dans **Authentication** → **Settings** → **Authorized domains** :

- Votre domaine de production
- Sous-domaines si nécessaire

### Quotas et limites

- **SMS** : 10/jour en mode gratuit
- **Utilisateurs** : Illimité en mode gratuit
- **Authentifications** : 50 000/mois gratuites

## Support

En cas de problème, consulter :

- [Documentation Firebase Auth](https://firebase.google.com/docs/auth/?hl=fr)
- [Console Firebase](https://console.firebase.google.com)
- [StackOverflow Firebase](https://stackoverflow.com/questions/tagged/firebase)
