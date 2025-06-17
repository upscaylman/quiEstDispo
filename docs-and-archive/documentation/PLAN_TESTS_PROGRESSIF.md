# 🧪 Plan de Tests Progressif - "Qui Est Dispo"

## 🎯 **Phase 1 - Composants Simples** (Semaine 1) ✅ EN COURS

### ✅ **NotificationBadge.js** - CRÉÉ

**Complexité**: ⭐ (Très Simple)
**Tests couverts**:

- ✅ Rendu conditionnel (count = 0, undefined, null)
- ✅ Affichage des valeurs (< 100, >= 100, cas limite 99+)
- ✅ Classes CSS et styles
- ✅ Cas limites (négatifs, grands nombres)
- ✅ Accessibilité de base

### 🎯 **Prochains Composants Simples**

#### **ActivityCard.js**

**Complexité**: ⭐⭐ (Simple)

```javascript
// Tests à créer:
- Affichage des props (title, description, time)
- Classes CSS conditionnelles
- Gestion des props optionnelles
- Format d'affichage du temps
```

#### **GPSStatusToast.js**

**Complexité**: ⭐⭐ (Simple)

```javascript
// Tests à créer:
- États GPS (enabled, disabled, loading)
- Messages d'état appropriés
- Animation d'apparition/disparition
- Fermeture automatique
```

#### **WarningBanner.js**

**Complexité**: ⭐ (Très Simple)

```javascript
// Tests à créer:
- Affichage conditionnel selon type
- Messages d'alerte appropriés
- Classes CSS selon gravité
- Bouton de fermeture
```

---

## 🚀 **Phase 2 - Composants avec Logique** (Semaine 2)

### **AvailabilityButtons.js**

**Complexité**: ⭐⭐⭐ (Moyen)

```javascript
// Tests prioritaires:
- États des boutons (actif, inactif, loading)
- Callbacks onClick appropriés
- Gestion des états de disponibilité
- Animations et transitions
- Intégration avec framer-motion
```

### **ProfileEditor.js**

**Complexité**: ⭐⭐⭐ (Moyen)

```javascript
// Tests à créer:
- Formulaire de modification profil
- Validation des champs
- Sauvegarde des modifications
- Gestion des erreurs
- Upload d'avatar
```

### **PWAInstallPrompt.js**

**Complexité**: ⭐⭐⭐ (Moyen)

```javascript
// Tests à créer:
- Détection support PWA
- Affichage conditionnel du prompt
- Gestion des événements d'installation
- États (disponible, installé, refusé)
```

---

## 🔧 **Phase 3 - Hooks Personnalisés** (Semaine 3)

### **useAuth.js**

**Complexité**: ⭐⭐⭐⭐ (Complexe)

```javascript
// Tests critiques:
- États d'authentification (loading, authenticated, error)
- Méthodes login/logout
- Persistance de session
- Gestion des erreurs Firebase
- Nettoyage des listeners
```

### **useGeolocation.js**

**Complexité**: ⭐⭐⭐⭐ (Complexe)

```javascript
// Tests essentiels:
- Demande de permissions
- Obtention des coordonnées
- Gestion des erreurs GPS
- Mise à jour de position
- Cleanup des watchers
```

### **useGPSNotifications.js**

**Complexité**: ⭐⭐⭐ (Moyen)

```javascript
// Tests à créer:
- États de notification GPS
- Triggers de notifications
- Gestion des permissions
- Messages appropriés selon statut
```

---

## 🗺️ **Phase 4 - Composants Complexes** (Semaine 4)

### **MapboxMapView.js**

**Complexité**: ⭐⭐⭐⭐⭐ (Très Complexe)

```javascript
// Tests avec mocks:
- Initialisation de la carte
- Gestion des marqueurs
- Événements de carte (zoom, pan, click)
- Intégration Mapbox GL
- Gestion des erreurs réseau
```

### **QRCodeScanner.js**

**Complexité**: ⭐⭐⭐⭐ (Complexe)

```javascript
// Tests avec mocks:
- Accès caméra
- Scan de QR codes
- Gestion permissions caméra
- Callback scan réussi/échoué
- Interface utilisateur scanner
```

### **LoginScreen.js**

**Complexité**: ⭐⭐⭐⭐ (Complexe)

```javascript
// Tests d'intégration:
- Processus de connexion SMS
- Validation numéro téléphone
- Gestion codes de vérification
- États de chargement
- Gestion erreurs authentification
```

---

## 🧩 **Phase 5 - Services & Intégration** (Semaine 5)

### **Services Firebase**

**Déjà en partie couvert**: ✅ authService.test.js

#### **friendsService.js**

```javascript
// Tests avec mocks Firebase:
- Ajout/suppression d'amis
- Recherche d'utilisateurs
- Gestion des invitations
- Mise à jour statuts amitié
```

#### **availabilityService.js**

```javascript
// Tests critiques:
- Mise à jour disponibilité
- Récupération statuts amis
- Synchronisation temps réel
- Gestion offline/online
```

#### **notificationService.js**

```javascript
// Tests push notifications:
- Demande permissions
- Registration tokens
- Envoi notifications
- Gestion des callbacks
```

---

## 🎭 **Phase 6 - Tests E2E** (Semaine 6)

### **Parcours Utilisateur Critiques**

#### **Authentification Complète**

```javascript
// Cypress/Playwright:
1. Arrivée sur app
2. Saisie numéro téléphone
3. Réception code SMS
4. Connexion réussie
5. Navigation vers écran principal
```

#### **Gestion des Amis**

```javascript
// E2E Workflow:
1. Connexion utilisateur
2. Accès section amis
3. Ajout nouvel ami (QR/téléphone)
4. Vérification invitation envoyée
5. Acceptation invitation
```

#### **Partage de Disponibilité**

```javascript
// E2E Scenario:
1. Utilisateur connecté
2. Modification statut disponibilité
3. Vérification mise à jour temps réel
4. Notification aux amis
5. Synchronisation multi-appareils
```

---

## 📊 **Objectifs de Couverture par Phase**

| Phase   | Objectif Couverture      | Types de Tests     |
| ------- | ------------------------ | ------------------ |
| Phase 1 | 90% composants simples   | Unit Tests         |
| Phase 2 | 80% composants logique   | Unit + Integration |
| Phase 3 | 85% hooks personnalisés  | Unit Tests         |
| Phase 4 | 70% composants complexes | Integration Tests  |
| Phase 5 | 80% services critiques   | Unit + Integration |
| Phase 6 | 100% parcours critiques  | E2E Tests          |

## 🛠️ **Configuration & Outils**

### **Tests Unitaires**

- ✅ Jest + React Testing Library
- ✅ Configuration jsdom
- ✅ Mocks Firebase
- ✅ Coverage reporting

### **Tests d'Intégration**

- 🚧 Mock Service Worker (MSW)
- 🚧 Firebase Emulator Suite
- 🚧 Tests avec données réelles

### **Tests E2E**

- 🎯 Puppeteer (déjà installé)
- 🎯 Environnement de test dédié
- 🎯 Données de test isolées

## 🎯 **Commandes Pratiques**

```bash
# Tests par composant
npm test -- --testPathPattern=NotificationBadge
npm test -- --testPathPattern=AvailabilityButtons

# Tests par catégorie
npm test -- --testPathPattern=components/
npm test -- --testPathPattern=hooks/
npm test -- --testPathPattern=services/

# Tests avec couverture
npm run test:coverage

# Tests de régression
npm run test:ci
```

## 📈 **Progression Hebdomadaire**

### **Semaine 1** - ✅ Fondations solides

- [x] NotificationBadge.js ✅
- [ ] ActivityCard.js
- [ ] GPSStatusToast.js
- [ ] WarningBanner.js

### **Semaine 2** - 🎯 Logique métier

- [ ] AvailabilityButtons.js
- [ ] ProfileEditor.js
- [ ] PWAInstallPrompt.js

### **Semaine 3** - ⚡ Hooks personnalisés

- [ ] useAuth.js (critique)
- [ ] useGeolocation.js
- [ ] useGPSNotifications.js

### **Semaine 4** - 🗺️ Composants avancés

- [ ] MapboxMapView.js
- [ ] QRCodeScanner.js
- [ ] LoginScreen.js

### **Semaine 5** - 🔧 Services Firebase

- [ ] friendsService.js
- [ ] availabilityService.js
- [ ] notificationService.js

### **Semaine 6** - 🎭 Tests E2E

- [ ] Parcours authentification
- [ ] Parcours gestion amis
- [ ] Parcours disponibilité

---

## 🎉 **Bénéfices Attendus**

✅ **Confiance déploiement** +90%
✅ **Réduction bugs** -70%
✅ **Vitesse debug** +80%
✅ **Documentation vivante** du code
✅ **Refactoring sûr** et rapide

---

💡 **Prochaine étape**: Terminer les tests de Phase 1 cette semaine !
