# 🧪 GUIDE TEST PHASE 4 - Voir les Changements Interface

## 🎯 Comment Tester les Nouveaux Statuts

### 1. Démarrer l'Application

```bash
npm start
```

### 2. Aller sur l'Écran Amis

- Connectez-vous si nécessaire
- Cliquez sur l'onglet "👥 Amis" (en bas)

### 3. Vérifier que vous avez des Amis

Si vous n'avez **aucun ami** :

1. Cliquez sur le bouton "+" (flottant en bas à droite)
2. Ajoutez quelques amis de test
3. OU en mode développement, cliquez "🧪 Créer amitiés Firebase"

### 4. Observer les Nouveaux Éléments

**✅ CE QUI DOIT ÊTRE VISIBLE MAINTENANT :**

#### Badges de Statut Colorés (sous le nom de chaque ami)

- 🟢 **Vert** : "Disponible pour activité"
- 🟠 **Orange** : "1 invitation envoyée" / "2 invitations envoyées"
- 🔵 **Bleu** : "1 invitation en attente"
- 🔴 **Rouge** : "En café actuellement"

#### Indicateurs de Disponibilité

- ✅ **"✓ Invitable"** (vert) - Ami peut être invité
- ❌ **"✗ Occupé"** (gris) - Ami ne peut pas être invité

#### Indicateur de Chargement (en haut)

- 🔄 **"Actualisation statuts..."** pendant le refresh

## 🔍 Debug Console

### Ouvrir la Console (F12)

Tapez ces commandes pour diagnostiquer :

```javascript
// Tester l'affichage des statuts
testPhase4StatusDisplay();

// Vérifier les données
console.log('Friends:', window.currentUser?.friends);
console.log('Status hook running?');
```

### Logs Attendus

```
🔍 [Mock Amélioré] Calcul statuts pour X amis
🔍 [Mock] Ami John (abc123) → LIBRE (Disponible pour activité)
🔍 [Mock] Ami Jane (def456) → INVITATION_ENVOYEE (1 invitation envoyée)
🔄 [useFriendsStatus] ✅ 2 statuts calculés
```

## 🐛 Problèmes Possibles

### "Rien ne s'affiche"

**Causes possibles :**

1. **Pas d'amis** → Ajoutez des amis de test
2. **Hook pas lancé** → Vérifiez les logs console
3. **Cache navigateur** → Rechargez la page (Ctrl+F5)
4. **Erreur JavaScript** → Vérifiez la console pour erreurs

### "Tous les badges sont verts"

**Normal** : Le mock alterne les couleurs selon l'ordre des amis

- Ami 1 : Vert (LIBRE)
- Ami 2 : Orange (INVITATION_ENVOYEE)
- Ami 3 : Bleu (INVITATION_RECUE)
- Ami 4 : Rouge (EN_PARTAGE)
- Ami 5 : Vert (retour au début)...

### "Pas de badges du tout"

**Solutions :**

1. Vérifiez que vous êtes bien sur l'onglet "👥 Amis"
2. Rechargez la page
3. Vérifiez la console pour erreurs
4. Tapez `testPhase4StatusDisplay()` dans la console

## 🎨 Comparaison Avant/Après

### ❌ AVANT Phase 4

```
👤 John Doe
   🟢 En ligne

👤 Jane Smith
   ⚫ Hors ligne
```

### ✅ APRÈS Phase 4

```
👤 John Doe [🟢 Disponible pour activité]
   🟢 En ligne  ✓ Invitable

👤 Jane Smith [🟠 2 invitations envoyées]
   ⚫ Hors ligne  ✗ Occupé
```

## 🔄 Actualisation Temps Réel

Les statuts se mettent à jour :

- **Automatiquement** toutes les 15 secondes
- **Instantanément** lors d'événements (invitations, etc.)
- **Manuellement** en revenant sur l'app (visibilitychange)

## 🧰 Outils de Debug Disponibles

### Dans la Console

```javascript
// Test affichage Phase 4
testPhase4StatusDisplay();

// Test invitations (existant)
testInvitationCompatibility();

// Forcer refresh statuts
window.dispatchEvent(new CustomEvent('friendsStatusUpdate'));
```

### Fichiers Modifiés

- `src/components/screens/FriendsScreen.js` - Interface avec badges
- `src/hooks/useFriendsStatus.js` - Hook temps réel
- `src/services/friendsStatusService.js` - Mock statuts variés
- `src/components/StatusBadge.js` - Composant badges

## ✅ Checklist Test Réussi

- [ ] Je vois des badges colorés sous les noms des amis
- [ ] Je vois "✓ Invitable" ou "✗ Occupé"
- [ ] Les couleurs alternent entre les amis (vert/orange/bleu/rouge)
- [ ] La console affiche les logs de calcul des statuts
- [ ] L'indicateur "🔄 Actualisation statuts..." apparaît parfois en haut

**Si tous ces points sont cochés → Phase 4 fonctionne ! 🎉**
