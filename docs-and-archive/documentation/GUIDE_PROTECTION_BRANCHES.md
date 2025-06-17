# 🔒 Guide de Protection des Branches - Qui Est Dispo

## ✅ Étapes Réalisées

```bash
git checkout main           # ✅ Positionné sur main
git checkout -b develop     # ✅ Branche develop créée
git push -u origin develop  # ✅ Branch develop pushée
```

## 🛡️ Configuration Protection de la Branche Main

### **Étape 1 : Accéder aux Paramètres GitHub**

1. Allez sur votre repository : `https://github.com/upscaylman/quiEstDispo`
2. Cliquez sur **Settings** (onglet en haut)
3. Dans le menu de gauche, cliquez sur **Branches**

### **Étape 2 : Créer une Règle de Protection**

1. Cliquez sur **Add rule** ou **Add branch protection rule**
2. Dans **Branch name pattern**, tapez : `main`

### **Étape 3 : Configurer les Protections Recommandées**

#### ✅ **Protections Essentielles**

- [x] **Require a pull request before merging**

  - [x] **Require approvals** : 1 approbation minimum
  - [x] **Dismiss stale reviews** : Annuler les anciennes approbations
  - [x] **Require review from code owners** (si vous avez un CODEOWNERS)

- [x] **Require status checks to pass before merging**

  - [x] **CI/CD Pipeline** : Sélectionnez "test", "build" et "lint"
  - [x] **Require branches to be up to date**

- [x] **Require conversation resolution before merging**

#### 🔒 **Protections Strictes**

- [x] **Restrict pushes that create files larger than 100 MB**
- [x] **Require signed commits** (optionnel mais recommandé)
- [x] **Include administrators** : Même les admins suivent les règles

#### ⚠️ **Protections Avancées** (Optionnel)

- [x] **Restrict force pushes** : Empêche les force push
- [x] **Allow deletions** : Décoché (empêche la suppression)

### **Étape 4 : Créer un fichier CODEOWNERS**

```bash
# Créer le fichier dans le repo
echo "# Code owners pour qui-est-dispo" > .github/CODEOWNERS
echo "* @upscaylman" >> .github/CODEOWNERS
```

## 🚀 Workflow de Développement Recommandé

### **Flux GitFlow Simplifié**

```
main (production) ←── develop (intégration) ←── feature/xxx (développement)
```

### **Commandes pour Nouvelles Features**

```bash
# 1. Partir de develop
git checkout develop
git pull origin develop

# 2. Créer une branche feature
git checkout -b feature/nom-de-la-feature

# 3. Développer et committer
git add .
git commit -m "feat: description de la feature"

# 4. Pusher la branche
git push -u origin feature/nom-de-la-feature

# 5. Créer une Pull Request via GitHub UI
# develop ← feature/nom-de-la-feature
```

### **Déploiement vers Production**

```bash
# 1. Merger develop vers main via PR
# GitHub UI: main ← develop

# 2. La CI/CD déploie automatiquement depuis main
```

## 🔄 Configuration des Environnements

### **develop = Staging/Testing**

- Tests d'intégration
- Validation fonctionnelle
- Tests utilisateurs

### **main = Production**

- Code stable uniquement
- Déploiement automatique
- Monitoring actif

## 📝 Template de Pull Request

Créer `.github/pull_request_template.md` :

```markdown
## 📝 Description

Brief description of changes

## 🧪 Tests

- [ ] Tests unitaires passent
- [ ] Tests d'intégration OK
- [ ] Tests manuels effectués

## 🚀 Déploiement

- [ ] Compatible avec l'environnement de prod
- [ ] Variables d'environnement mises à jour
- [ ] Documentation mise à jour

## 📋 Checklist

- [ ] Code reviewé par un pair
- [ ] Pas de console.log en production
- [ ] Gestion d'erreurs appropriée
- [ ] Performance acceptable
```

## ⚡ Commandes Utiles

### **Synchronisation**

```bash
# Mettre à jour develop depuis main
git checkout develop
git pull origin main
git push origin develop

# Mettre à jour une feature depuis develop
git checkout feature/ma-feature
git pull origin develop
```

### **Nettoyage**

```bash
# Supprimer les branches locales mergées
git branch --merged | grep -v "main\|develop" | xargs -n 1 git branch -d

# Supprimer les références distantes obsolètes
git remote prune origin
```

## 🎯 Bénéfices de Cette Configuration

✅ **Sécurité** : Impossible de push directement sur main
✅ **Qualité** : Tests obligatoires avant merge
✅ **Traçabilité** : Historique des PR et reviews
✅ **Collaboration** : Code review systématique
✅ **Stabilité** : Main toujours déployable

---

💡 **Prochaine étape** : Configurer la protection sur GitHub et créer votre première feature branch !
