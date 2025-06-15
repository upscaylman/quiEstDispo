# Test avec un vrai numéro de téléphone

## 🧪 Test à effectuer

1. **Allez sur votre application**
2. **Choisissez "Téléphone" comme méthode de connexion**
3. **Entrez votre VRAI numéro** (ex: 06 12 34 56 78)
4. **Cliquez "Envoyer le code SMS"**

## 📊 Résultats possibles

### ✅ **Si ça fonctionne :**

- Vous recevez un SMS réel sur votre téléphone
- **→ Plan Blaze activé, tout est OK !**

### ❌ **Si ça ne fonctionne pas :**

#### **Erreur typique :**

```
🔄 Authentification SMS non activée. Pour utiliser de vrais numéros :

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet
3. Cliquez "Upgrade" → "Blaze plan"
4. Ajoutez une carte de crédit

💡 En attendant, utilisez +33612345678 avec code 123456 pour tester
```

## 🔧 **Solution si erreur :**

### **Étape 1 : Activer le plan Blaze**

1. Firebase Console → Votre projet
2. ⚙️ Project Settings → Usage and billing
3. **Modify plan** → **Blaze (Pay as you go)**
4. Ajoutez une carte de crédit

### **Étape 2 : Vérifier la configuration**

1. Authentication → Sign-in method
2. ✅ Phone activé
3. **Authorized domains** → Ajouter `localhost:3000`

### **Étape 3 : Test**

- Redémarrez votre app : `npm start`
- Réessayez avec votre vrai numéro

## 💰 **Budget estimation**

- SMS France : ~0.05€
- SMS International : ~0.10€
- Coût de test : ~0.50€ pour 10 SMS

## 🎯 **Recommandation**

**Pour le développement :**

- Utilisez `+33612345678` / `123456` (gratuit)
- Activez Blaze seulement pour les tests réels
- En production, Blaze sera nécessaire
