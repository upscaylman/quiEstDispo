# 🔧 Configuration reCAPTCHA pour l'authentification SMS

## ❌ Erreur rencontrée : "Missing required parameters: sitekey"

Cette erreur se produit quand Firebase essaie d'utiliser reCAPTCHA pour l'authentification SMS mais que la clé du site n'est pas configurée.

## ✅ Solutions

### **Option 1 : Utiliser les numéros de test (Recommandé pour le développement)**

En mode développement, utilisez le bouton **"🧪 Test SMS (+33612345678)"** qui :

- Utilise des numéros fictifs configurés dans Firebase
- Évite le besoin de reCAPTCHA en production
- Code de vérification : `123456`

### **Option 2 : Configurer reCAPTCHA (Pour la production)**

#### **2.1 - Obtenir une clé reCAPTCHA v3**

1. Allez sur https://www.google.com/recaptcha/admin
2. Créez un nouveau site :
   - **Label** : qui-est-dispo
   - **Type** : reCAPTCHA v3
   - **Domaines** :
     - `localhost` (développement)
     - `votre-domaine.com` (production)

#### **2.2 - Configurer Firebase Console**

1. Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Dans la section **Phone numbers for testing** :
   - Ajouter : `+33612345678` → `123456`
3. Cliquez **Save**

#### **2.3 - Créer le fichier .env.local**

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# reCAPTCHA v3 (Obligatoire pour l'authentification SMS en production)
REACT_APP_RECAPTCHA_V3_SITE_KEY=votre_recaptcha_site_key_ici

# Firebase Cloud Messaging (Optionnel)
REACT_APP_FIREBASE_VAPID_KEY=votre_vapid_key_ici
```

## 🧪 Testing SMS Authentication

### **Numéros de test gratuits (Plan Spark)**

- **Numéro** : `+33612345678`
- **Code** : `123456`
- **Usage** : Illimité en développement

### **Vrais numéros (Plan Blaze requis)**

- Coût estimé : 2-5€/mois
- SMS facturés selon l'usage
- Upgrade dans Firebase Console → **Usage and billing**

## 🔧 Debug

Si l'erreur persiste :

1. **Vérifiez la console développeur** (F12) pour voir :

   ```
   🔧 Creating reCAPTCHA verifier...
   🌐 Network status check: isOnline=true, navigator.onLine=true
   ```

2. **Testez avec le bouton de test** :

   - Le bouton jaune "🧪 Test SMS" apparaît en mode développement
   - Utilise automatiquement les numéros fictifs

3. **Rechargez la page** si reCAPTCHA reste bloqué

## 📝 Notes importantes

- **En développement** : reCAPTCHA est automatiquement désactivé si configuré
- **En production** : reCAPTCHA v3 requis pour la sécurité
- **Firebase gratuit** : Limité aux numéros de test
- **Firebase Blaze** : Vrais SMS avec facturation à l'usage
