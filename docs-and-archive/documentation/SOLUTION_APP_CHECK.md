# 🔧 Solution définitive : Désactiver App Check

## 🚨 Problème identifié

L'erreur `500 Internal Server Error` persiste car :

- ✅ Plan Blaze activé (OK)
- ✅ Code local configuré (OK)
- ❌ **App Check toujours ACTIVÉ dans Firebase Console**

## 📋 Actions à effectuer MAINTENANT

### 1. **Désactiver App Check dans Firebase Console**

1. **Allez sur** https://console.firebase.google.com
2. **Sélectionnez votre projet** "qui-est-dispo"
3. **Cliquez sur "App Check"** (dans le menu latéral)
4. **Trouvez votre application Web**
5. **DÉSACTIVEZ App Check** complètement

### 2. **Vérifier les domaines autorisés**

1. **Authentication > Settings > Authorized domains**
2. **Ajoutez :**
   - `qui-est-dispo-7bt3rsdf3-juliens-projects-2c11e769.vercel.app`
   - `localhost` (si pas déjà présent)

### 3. **Configuration reCAPTCHA (optionnel)**

Votre clé reCAPTCHA actuelle : `6LcMZR0UAAAAALgPMcgHwga7gY5p8QMg1Hj-bmUv`

**Si problème persiste :**

1. Allez sur https://www.google.com/recaptcha/admin
2. Créez une nouvelle clé **reCAPTCHA v3** (pas v2)
3. Ajoutez vos domaines : `localhost`, `vercel.app`
4. Mettez à jour `REACT_APP_RECAPTCHA_V3_SITE_KEY` dans Vercel

## 🧪 Test après modification

1. **Désactivez App Check**
2. **Attendez 5-10 minutes** (propagation)
3. **Testez avec +33677889876** (votre vrai numéro)
4. **Ou testez avec +33612345678 / 123456** (fictif)

## 🎯 Résultat attendu

Sans App Check activé :

- ✅ reCAPTCHA fonctionne
- ✅ Appel SMS réussit (pas de 500)
- ✅ Code reçu par SMS
- ✅ Authentification complète

## ⚠️ Important

**App Check en production :**

- En développement : DÉSACTIVÉ (pour éviter les conflits)
- En production finale : RÉACTIVÉ avec configuration correcte
- Pour l'instant : DÉSACTIVEZ pour que l'auth SMS fonctionne
