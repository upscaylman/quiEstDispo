# Configuration de l'authentification SMS Firebase

## Problème identifié

L'erreur `500 Internal Server Error` lors de l'authentification SMS est causée par :

1. Configuration App Check conflictuelle
2. Plan Firebase insuffisant (Spark au lieu de Blaze)
3. Configuration reCAPTCHA manquante ou incorrecte

## Solutions appliquées

### 1. Nettoyage de la configuration Firebase

- ✅ App Check complètement désactivé
- ✅ Configuration reCAPTCHA simplifiée
- ✅ Suppression des configurations conflictuelles

### 2. Configuration requise dans .env.local

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=votre_clé_api
REACT_APP_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre_projet_id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
REACT_APP_FIREBASE_APP_ID=votre_app_id

# Pour reCAPTCHA (optionnel en développement)
REACT_APP_RECAPTCHA_V3_SITE_KEY=votre_clé_recaptcha
```

## Actions à effectuer dans Firebase Console

### 1. Activer l'authentification par téléphone

1. Allez dans Firebase Console > Authentication > Sign-in method
2. Activez "Phone"
3. Ajoutez vos domaines autorisés (localhost:3000 pour le développement)

### 2. Passer au plan Blaze (OBLIGATOIRE pour SMS)

1. Firebase Console > Project settings > Usage and billing
2. Cliquez "Modify plan"
3. Sélectionnez "Blaze (Pay as you go)"
4. Ajoutez une carte de crédit

**💰 Coût :** ~0.05€ par SMS envoyé

### 3. Configuration reCAPTCHA (optionnel)

1. Allez sur https://www.google.com/recaptcha/admin
2. Créez un site reCAPTCHA v3
3. Ajoutez la clé dans votre .env.local

## Test en développement

Vous pouvez tester sans plan Blaze avec des numéros fictifs :

- Numéro : `+33612345678`
- Code : `123456`

Ces numéros sont automatiquement configurés pour les tests.

## Vérifications

1. ✅ Vérifiez que toutes les variables d'environnement sont définies
2. ✅ Redémarrez votre serveur de développement après modifications
3. ✅ Ouvrez les outils de développement pour voir les logs
4. ✅ Testez d'abord avec un numéro fictif, puis avec un vrai numéro

## En cas de problème persistant

1. Videz le cache du navigateur
2. Vérifiez la console Firebase pour les quotas
3. Assurez-vous que le domaine est autorisé dans Firebase Auth
