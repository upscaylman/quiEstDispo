# 📁 Archive des Fichiers Non-Essentiels

Ce dossier contient tous les fichiers qui ne sont pas nécessaires au fonctionnement quotidien de l'application "Qui Est Dispo", mais qui peuvent être utiles pour référence ou historique.

## 📂 Structure

### `old-files/` - Anciens Fichiers Refactorisés

Contient les versions originales des fichiers qui ont été refactorisés :

- `oldApp.js` - Version originale avant refactorisation
- `oldMapboxMapView.js` - Version originale avant refactorisation des cartes
- `oldAddFriendModal.js` - Version originale avant refactorisation
- `oldFirebaseService.js` - Version originale avant refactorisation
- `oldProfileEditor.js` - Version originale avant refactorisation

### `documentation/` - Documentation et Guides

Contient toute la documentation du projet :

- `README.md` - Documentation principale du projet
- `REFACTORING_SUMMARY.md` - Résumé des refactorisations du profil
- `REFACTORING_MAP_SUMMARY.md` - Résumé de la refactorisation des cartes
- `FIREBASE_SETUP.md` - Guide de configuration Firebase
- `MAPBOX_SETUP.md` - Guide de configuration Mapbox
- `DEPLOY.md` - Guide de déploiement
- `BUG_FIXES_*.md` - Rapports de corrections de bugs
- `UPDATE_MAPBOX.md` - Guide de mise à jour Mapbox
- `GUIDE_CARTE.md` - Guide d'utilisation des cartes
- `DEBUG_FRIENDS_GUIDE.md` - Guide de débogage des amis
- `EMAIL_INVITE_FEATURE.md` - Documentation des invitations par email
- `RECAPTCHA_SETUP.md` - Configuration reCAPTCHA
- `UPGRADE_TO_BLAZE.md` - Guide de mise à niveau Firebase

### `test-data/` - Données de Test et Templates

Contient les fichiers de configuration de test et templates :

- `auth_config.json` - Configuration d'authentification test
- `users.json` - Données utilisateurs de test
- `temp.json` - Fichier temporaire
- `env-template.txt` - Template des variables d'environnement

### `scripts/` - Scripts d'Utilitaires

Contient les scripts batch pour Windows :

- `install.bat` - Script d'installation
- `start.bat` - Script de démarrage
- `stop.bat` - Script d'arrêt
- `setup-after-fix.bat` - Script de configuration post-correction

## 🚀 Fichiers Restés à la Racine (Essentiels)

Ces fichiers sont nécessaires au fonctionnement de l'application :

### Configuration NPM

- `package.json` - Dépendances et scripts NPM
- `package-lock.json` - Verrouillage des versions

### Code Source

- `src/` - Code source de l'application
- `public/` - Assets publics
- `build/` - Build de production
- `node_modules/` - Modules Node.js

### Configuration Firebase

- `firebase.json` - Configuration Firebase
- `.firebaserc` - Configuration des projets Firebase
- `firestore.rules` - Règles de sécurité Firestore
- `firestore.indexes.json` - Index Firestore

### Configuration de Déploiement

- `vercel.json` - Configuration Vercel
- `.vercel/` - Cache Vercel

### Configuration CSS et Outils

- `tailwind.config.js` - Configuration Tailwind CSS
- `postcss.config.js` - Configuration PostCSS
- `.eslintrc.json` - Configuration ESLint
- `.prettierrc` - Configuration Prettier

### Git et Autres

- `.git/` - Dépôt Git
- `.gitignore` - Fichiers ignorés par Git
- `.qodo/` - Configuration Qodo

## 📝 Notes

- Les fichiers dans ce dossier peuvent être supprimés sans affecter le fonctionnement de l'application
- Ils sont conservés pour référence historique et documentation
- En cas de besoin, ils peuvent être facilement restaurés depuis ce dossier
- Cette organisation améliore la lisibilité de la racine du projet

## 🔄 Maintenance

Pour maintenir cette organisation :

1. Déplacer tout nouveau fichier de documentation dans `documentation/`
2. Archiver les anciens fichiers refactorisés dans `old-files/`
3. Placer les données de test dans `test-data/`
4. Ranger les nouveaux scripts dans `scripts/`
