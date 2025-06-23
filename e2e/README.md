# Tests End-to-End (E2E) - PHASE 6 🎭

## Vue d'ensemble

Cette suite de tests E2E utilise **Puppeteer** pour tester les parcours utilisateur complets de l'application "Qui est dispo".

## Prérequis

1. **Application démarrée** : L'application doit tourner sur `http://localhost:3000`

   ```bash
   npm start
   ```

2. **Puppeteer installé** : Déjà inclus dans les dépendances du projet

## Structure

```
e2e/
├── config/
│   └── puppeteer.config.js    # Configuration Puppeteer et sélecteurs
├── utils/
│   └── helpers.js             # Utilitaires E2E (navigation, authentification)
├── tests/
│   ├── 01-auth-flow.e2e.js    # Parcours connexion complète
│   ├── 02-add-friend-flow.e2e.js # Parcours ajout d'ami
│   └── ...                    # Autres parcours à venir
├── screenshots/               # Captures d'écran des tests
└── run-e2e.js                # Script de lancement
```

## Lancement des tests

### Tous les tests E2E

```bash
npm run test:e2e
```

### Tests spécifiques

```bash
# Test de connexion uniquement
npm run test:e2e:auth

# Test d'ajout d'ami uniquement
npm run test:e2e:friends

# Mode verbose (plus de détails)
npm run test:e2e:verbose
```

### Lancement manuel avec Jest

```bash
npx jest e2e/tests/01-auth-flow.e2e.js --testTimeout=120000
```

## Parcours testés

### 🔐 01-auth-flow.e2e.js - Connexion complète

- ✅ Connexion avec numéro français
- ✅ Gestion erreurs numéro invalide
- ✅ Déconnexion utilisateur
- ✅ Persistance session après rechargement
- ✅ Navigation entre onglets

### 👥 02-add-friend-flow.e2e.js - Ajout d'ami

- ✅ Ouverture modal ajout d'ami
- ✅ Ajout par numéro de téléphone
- ✅ Ajout par QR Code
- ✅ Partage de profil
- ✅ Fermeture modal
- ✅ Affichage liste amis

## Configuration

### Variables d'environnement

```bash
# URL de base de l'application (optionnel)
E2E_BASE_URL=http://localhost:3000

# Mode CI (headless automatique)
CI=true
```

### Données de test

Les utilisateurs de test sont configurés dans `config/puppeteer.config.js` :

- **testUser1** : +33612345678 (code: 123456)
- **testUser2** : +33687654321 (code: 123456)

### Sélecteurs

Les sélecteurs d'éléments sont centralisés dans la configuration pour faciliter la maintenance.

## Debugging

### Mode visuel (non-headless)

Les tests s'exécutent en mode visuel en développement (vous voyez le navigateur).
En CI, ils s'exécutent en mode headless automatiquement.

### Captures d'écran

Chaque test prend des captures d'écran automatiquement dans `e2e/screenshots/`.

### Logs détaillés

```bash
# Voir les logs Puppeteer et les erreurs console
npm run test:e2e:verbose
```

### Debug pas à pas

Modifiez `slowMo` dans la configuration pour ralentir les actions :

```javascript
slowMo: 500; // Millisecondes entre les actions
```

## Timeouts

- **Navigation** : 30s
- **Éléments** : 15s
- **Tests complets** : 120s (2 minutes)

## Bonnes pratiques

1. **Toujours se connecter** avant les tests qui nécessitent une authentification
2. **Nettoyer après chaque test** (localStorage, cookies, etc.)
3. **Utiliser les data-testid** pour les sélecteurs stables
4. **Prendre des captures** d'écran aux moments clés
5. **Gérer les cas d'erreur** et les éléments non trouvés

## Dépannage

### L'application ne répond pas

```bash
# Vérifier que l'application tourne
curl http://localhost:3000

# Redémarrer l'application
npm start
```

### Erreurs de timeout

- Augmenter les timeouts dans la configuration
- Vérifier la performance de l'application
- S'assurer que Firebase est bien configuré

### Sélecteurs non trouvés

- Vérifier que les `data-testid` existent dans l'interface
- Adapter les sélecteurs dans `puppeteer.config.js`
- Utiliser le mode verbose pour voir les erreurs

## Prochaines étapes

Parcours à développer :

- 📍 Parcours changement de disponibilité
- 🗺️ Parcours utilisation carte
- 🔔 Parcours notifications

---

**Note** : Les tests E2E sont plus lents que les tests unitaires mais offrent une couverture complète des parcours utilisateur réels.
