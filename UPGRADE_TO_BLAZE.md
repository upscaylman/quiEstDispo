# 🔥 Guide d'activation du plan Blaze Firebase

## 🎯 Objectif

Activer l'authentification SMS avec de vrais numéros de téléphone (actuellement limité aux numéros de test).

## ⚠️ Prérequis

- Avoir un projet Firebase existant
- Une carte de crédit/débit valide
- Accès à la console Firebase

## 📋 Étapes d'activation

### **1. Accéder à la console Firebase**

1. Ouvrez https://console.firebase.google.com
2. Sélectionnez votre projet `qui-est-dispo`
3. Cliquez sur l'icône **⚙️ Settings** (en bas à gauche)
4. Sélectionnez **"Usage and billing"**

### **2. Passer au plan Blaze**

1. Cliquez sur **"Upgrade"** ou **"Modify plan"**
2. Sélectionnez **"Blaze plan (Pay as you go)"**
3. Ajoutez votre carte de crédit/débit
4. **Définissez des limites de budget** (IMPORTANT !)
   - Budget mensuel recommandé : **10€** pour commencer
   - Alertes à : **5€** et **8€**

### **3. Configuration des limites (CRUCIAL pour éviter les surcoûts)**

1. Dans **"Usage and billing"**
2. Cliquez **"Set budget alerts"**
3. Configurez :
   - **Budget mensuel** : 10€
   - **Alerte à 50%** : 5€
   - **Alerte à 80%** : 8€
   - **Actions automatiques** : Désactiver services si dépassement

### **4. Activer l'authentification SMS**

1. Allez dans **Authentication** → **Sign-in method**
2. Cliquez sur **"Phone"**
3. Vérifiez que le statut est **"Enabled"**
4. Supprimez les numéros de test s'ils ne sont plus nécessaires

## 💰 Coûts estimés

### **SMS Authentication**

- **Envoi SMS** : ~0,03€ par SMS
- **Vérification** : Gratuite
- **Usage typique** : 2-5€/mois pour une petite app

### **Services gratuits maintenus**

- **Firestore** : 1GB gratuit
- **Storage** : 5GB gratuit
- **Cloud Functions** : 2M invocations gratuites/mois
- **Hosting** : 10GB gratuit

### **Estimation mensuelle totale**

- **Développement/Test** : 2-5€/mois
- **Production (100 utilisateurs)** : 5-15€/mois
- **Production (1000 utilisateurs)** : 15-50€/mois

## ✅ Vérification de l'activation

Après activation, dans votre application :

1. **Rechargez l'application**
2. **Allez sur l'écran de connexion**
3. **Sélectionnez "Téléphone"**
4. **Vérifiez le message** : Vous devriez voir :
   - ✅ **"Plan Blaze activé - SMS réels disponibles"** (vert)
   - Au lieu de ⚠️ **"Plan Spark - Seuls les numéros de test sont disponibles"** (jaune)

## 🧪 Test avec de vrais numéros

1. **Entrez votre vrai numéro** : +33 6 XX XX XX XX
2. **Cliquez "Envoyer le code SMS"**
3. **Recevez le SMS** sur votre téléphone
4. **Entrez le code reçu**
5. **Connexion réussie** ✅

## 🛡️ Mesures de sécurité

### **Prévention des abus**

- **Quota quotidien** : Limitez à 100 SMS/jour
- **reCAPTCHA v3** : Déjà configuré
- **Domaines autorisés** : Seuls vos domaines

### **Monitoring**

1. **Firebase Console** → **Usage and billing**
2. **Surveillez quotidiennement** les premiers jours
3. **Alertes email** configurées automatiquement

## 🔧 Configuration recommandée

### **Quotas SMS (dans Firebase Console)**

1. **Authentication** → **Settings** → **Quotas**
2. **SMS per day** : 100 (ajustez selon vos besoins)
3. **SMS per IP** : 10/heure

### **Domaines autorisés**

1. **Authentication** → **Settings** → **Authorized domains**
2. Ajoutez seulement :
   - `localhost` (développement)
   - `qui-est-dispo.vercel.app` (production)

## ❌ En cas de problème

### **Erreur "billing-not-enabled" persiste**

1. **Attendez 5-10 minutes** après activation
2. **Rechargez la page** de votre app
3. **Vérifiez** dans Firebase Console → Usage and billing

### **SMS non reçus**

1. **Vérifiez le format** : +33XXXXXXXXX
2. **Testez avec un autre numéro**
3. **Consultez** les logs dans Firebase Console

### **Coûts inattendus**

1. **Consultez** Usage and billing
2. **Vérifiez** les quotas
3. **Désactivez temporairement** l'authentification SMS

## 📞 Support

- **Documentation Firebase** : https://firebase.google.com/docs/auth/web/phone-auth
- **Support Google** : Via la console Firebase
- **Community** : https://stackoverflow.com/tags/firebase

---

**⚡ Une fois le plan Blaze activé, votre application permettra l'authentification avec de vrais numéros de téléphone !**
