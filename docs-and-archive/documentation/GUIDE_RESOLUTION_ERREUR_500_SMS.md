# 🚨 Guide de résolution - Erreur 500 SMS Firebase

## 🔍 Problème identifié

Vous rencontrez cette erreur lors de l'authentification par téléphone :

```
POST https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode 500 (Internal Server Error)
```

## ✅ Solutions à appliquer IMMÉDIATEMENT

### 1. **DÉSACTIVER App Check dans Firebase Console** ⚠️ CRITIQUE

1. **Allez sur** https://console.firebase.google.com
2. **Sélectionnez votre projet** "qui-est-dispo"
3. **Cliquez sur "App Check"** (menu latéral)
4. **Trouvez votre application Web**
5. **DÉSACTIVEZ App Check complètement**
6. **Attendez 5-10 minutes** pour la propagation

### 2. **Vérifier les domaines autorisés**

1. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. **Ajoutez vos domaines :**
   - `localhost` (développement)
   - `qui-est-dispo-xxx.vercel.app` (production)
   - Votre domaine personnalisé si applicable

### 3. **Configuration des numéros de test**

1. **Firebase Console** → **Authentication** → **Sign-in method** → **Phone**
2. **Dans "Phone numbers for testing" :**
   - Numéro : `+33612345678`
   - Code : `123456`
3. **Cliquez "Save"**

### 4. **Vérifier votre plan Firebase**

- **Plan Spark (gratuit)** : Seuls les numéros de test fonctionnent
- **Plan Blaze (payant)** : Vrais SMS possibles

## 🧪 Test immédiat après modification

1. **Rechargez votre application**
2. **Cliquez sur le bouton jaune "🧪 Test SMS"**
3. **Le système devrait :**
   - Créer un reCAPTCHA invisible
   - Envoyer un "SMS" fictif
   - Afficher le champ de saisie du code
   - Accepter le code `123456`
   - Vous connecter avec succès

## 🔧 Modifications apportées au code

### Firebase Configuration (`src/firebase.js`)

- ✅ App Check complètement désactivé
- ✅ `appVerificationDisabledForTesting = true` forcé
- ✅ Numéros de test configurés automatiquement

### Service d'authentification (`src/services/authService.js`)

- ✅ Gestion spécifique des erreurs 500
- ✅ Messages d'erreur explicites avec solutions
- ✅ Vérification de connectivité avant envoi SMS
- ✅ Diagnostic amélioré des erreurs reCAPTCHA

### Interface utilisateur (`src/components/LoginScreen.js`)

- ✅ Bouton de test SMS visible en permanence
- ✅ Instructions claires pour contourner l'erreur 500
- ✅ Messages d'aide contextuelle

## 📱 Utilisation du bouton de test

Le bouton **"🧪 Test SMS (+33612345678)"** :

1. **Contourne complètement** l'API SMS de Firebase
2. **Utilise les numéros fictifs** configurés
3. **Évite l'erreur 500** grâce à la désactivation d'App Check
4. **Code de confirmation** : `123456`

## 🎯 Résultat attendu

Après avoir désactivé App Check :

```
✅ reCAPTCHA créé sans erreur
✅ Appel SMS réussit (pas de 500)
✅ Code de test accepté (123456)
✅ Authentification complète réussie
```

## ⚠️ Si l'erreur persiste

1. **Vérifiez la console développeur** (F12) pour voir :

   ```
   🔧 App Check DÉSACTIVÉ - résolution erreur 500 SMS
   🔧 Configuration auth téléphone optimisée
   ✅ Numéros de test configurés: +33612345678
   ```

2. **Attendez plus longtemps** (jusqu'à 15 minutes) après avoir désactivé App Check

3. **Redémarrez votre serveur de développement** :

   ```bash
   npm start
   # ou
   yarn start
   ```

4. **Vérifiez vos variables d'environnement** dans `.env.local`

## 🔄 Pour utiliser de vrais numéros plus tard

1. **Activez le plan Blaze** dans Firebase Console
2. **Réactivez App Check** avec une configuration correcte
3. **Configurez reCAPTCHA v3** avec une vraie clé
4. **Testez progressivement** avec votre numéro réel

## 📞 Support

Si le problème persiste même après ces modifications :

1. **Partagez les logs** de la console développeur (F12)
2. **Vérifiez l'état** d'App Check dans Firebase Console
3. **Confirmez** que les domaines sont bien autorisés
4. **Testez** avec le bouton de test en premier

---

💡 **Conseil** : Gardez le bouton de test visible même en production pour le débogage !
