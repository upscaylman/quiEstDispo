# 🎨 PHASE 4 - INTERFACE UTILISATEUR TEMPS RÉEL

_Objectif : Rendre les états utilisateur visibles et implémenter le filtrage intelligent_

## 🎯 OBJECTIFS PHASE 4

### Task 4.1 : États Temps Réel

- **Badge couleur** par ami (libre=vert, occupé=orange, indisponible=rouge)
- **Texte explicatif** par statut avec raisons détaillées
- **Mise à jour automatique** toutes les 15-20 secondes

### Task 4.2 : FILTRAGE RELATIONNEL AVANCÉ ⭐

- **Filtrage automatique** des amis avec relation active
- **Messages spécifiques** : "Invitation en attente", "Partage en cours", "Déjà invité", "Occupé"
- **Compteur disponibles** avec validation en temps réel
- **Griser amis indisponibles** avec raisons visuelles

### Task 4.3 : Notifications Multiples Intelligentes

- **Regroupement événements** par expéditeur
- **Messages contextuels** : "AMI1 et 2 autres vous invitent"
- **Compteurs temps réel** dans les messages

## 🏗️ ARCHITECTURE PHASE 4

### Composants à Modifier

1. **FriendsScreen.js** - Affichage statuts temps réel
2. **InviteFriendsModal.js** - Filtrage intelligent + compteurs
3. **NotificationsScreen.js** - Regroupement notifications
4. **MapMarkers.js** - États sur carte
5. **HomeScreen.js** - Indicateurs généraux

### Hooks Temps Réel

1. **useFriendsStatus.js** - États amis avec refresh automatique
2. **useAvailableFriendsFilter.js** - Filtrage intelligent par statut
3. **useNotificationGrouping.js** - Regroupement notifications

### Services Support

1. **FriendsStatusService.js** - Calcul états temps réel
2. **RelationshipService.js** - Détection relations actives
3. **NotificationGroupingService.js** - Logique regroupement

## 📋 PLAN D'IMPLÉMENTATION

### Étape 1 : Hook useFriendsStatus (Fondation)

```javascript
// Hook pour états temps réel avec mise à jour automatique
const useFriendsStatus = (friends, currentUserId) => {
  const [friendsStatus, setFriendsStatus] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Actualisation toutes les 15s
  // Calcul des statuts : LIBRE, INVITATION_ENVOYEE, INVITATION_RECUE, EN_PARTAGE
  // Messages : "Disponible", "2 invitations en attente", "En café avec Alice"
};
```

### Étape 2 : Service FriendsStatusService

```javascript
export class FriendsStatusService {
  // Calculer le statut d'un ami avec détails
  static async getFriendDetailedStatus(friendId, currentUserId) {
    // 1. Vérifier invitations pending (envoyées et reçues)
    // 2. Vérifier partage de localisation actif
    // 3. Vérifier relations bilatérales
    // 4. Retourner : { status, message, color, available }
  }

  // Calculer tous les statuts amis
  static async getAllFriendsStatus(friends, currentUserId) {}

  // Filtrer amis disponibles pour invitation
  static filterAvailableFriends(friends, friendsStatus) {}
}
```

### Étape 3 : Interface Filtrage Intelligent

```javascript
// Dans InviteFriendsModal.js
const availableFriends = useMemo(() => {
  return friends.filter(friend => {
    const status = friendsStatus[friend.id];
    return status?.available === true;
  });
}, [friends, friendsStatus]);

// Affichage avec raisons
{
  unavailableFriends.map(friend => (
    <div className="opacity-50 bg-gray-100">
      <span className="text-gray-500">{friend.name}</span>
      <span className="text-xs italic">
        {friendsStatus[friend.id]?.message}
      </span>
    </div>
  ));
}
```

### Étape 4 : Badges Couleur Temps Réel

```javascript
// Composant StatusBadge
const StatusBadge = ({ status, message }) => {
  const colors = {
    LIBRE: 'bg-green-500 text-white',
    INVITATION_ENVOYEE: 'bg-orange-500 text-white',
    INVITATION_RECUE: 'bg-blue-500 text-white',
    EN_PARTAGE: 'bg-red-500 text-white',
  };

  return (
    <div className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
      {message}
    </div>
  );
};
```

## 🎨 SPÉCIFICATIONS VISUELLES

### Couleurs des États

- 🟢 **LIBRE** : `bg-green-500` - "Disponible pour activité"
- 🟠 **INVITATION_ENVOYÉE** : `bg-orange-500` - "2 invitations envoyées"
- 🔵 **INVITATION_REÇUE** : `bg-blue-500` - "1 invitation en attente"
- 🔴 **EN_PARTAGE** : `bg-red-500` - "En café avec Alice"

### Messages Contextuels

```javascript
const STATUS_MESSAGES = {
  LIBRE: 'Disponible pour activité',
  INVITATION_ENVOYEE: count =>
    `${count} invitation${count > 1 ? 's' : ''} envoyée${count > 1 ? 's' : ''}`,
  INVITATION_RECUE: count =>
    `${count} invitation${count > 1 ? 's' : ''} en attente`,
  EN_PARTAGE: activity => `En ${activity} actuellement`,
};
```

### Filtrage Visuel

```javascript
// Ami disponible
<div className="bg-white border-green-200 border-2">
  <StatusBadge status="LIBRE" />
</div>

// Ami indisponible (grisé)
<div className="bg-gray-100 border-gray-300 opacity-60">
  <StatusBadge status="EN_PARTAGE" />
  <span className="text-gray-500 italic">Déjà en activité</span>
</div>
```

## 🔄 MISE À JOUR TEMPS RÉEL

### Intervals et Triggers

```javascript
// useFriendsStatus.js
useEffect(() => {
  const interval = setInterval(() => {
    refreshFriendsStatus();
  }, 15000); // 15 secondes

  // Triggers immédiats
  const events = [
    'invitation-sent',
    'invitation-responded',
    'availability-changed',
  ];
  events.forEach(event => {
    window.addEventListener(event, refreshFriendsStatus);
  });

  return () => {
    clearInterval(interval);
    events.forEach(event => {
      window.removeEventListener(event, refreshFriendsStatus);
    });
  };
}, []);
```

### Optimisations Performance

- **Cache intelligent** : Pas de requête si pas de changement
- **Batch updates** : Grouper les mises à jour
- **Debounce** : Éviter les appels répétés
- **Fallback offline** : États locaux si déconnecté

## 🧪 TESTS PHASE 4

### Tests Unitaires

- ✅ `useFriendsStatus` - États calculés correctement
- ✅ `FriendsStatusService` - Logique métier exacte
- ✅ `StatusBadge` - Rendu selon statut
- ✅ Filtrage - Amis disponibles/indisponibles

### Tests d'Intégration

- ✅ Interface → Service → Hook → Firestore
- ✅ Temps réel : Changement état → Mise à jour UI
- ✅ Filtrage : Ami devient occupé → Disparaît de la liste

### Tests Visuels

- ✅ Couleurs cohérentes selon statut
- ✅ Messages explicites et utiles
- ✅ Transitions fluides
- ✅ Responsive design

## 📊 MÉTRIQUES DE SUCCÈS

### UX Améliorée

- [ ] Utilisateur sait immédiatement qui peut être invité
- [ ] Messages clairs sur pourquoi un ami est indisponible
- [ ] Pas d'invitations "dans le vide" vers amis occupés
- [ ] Compteurs temps réel fiables

### Performance

- [ ] Mise à jour < 1 seconde après changement d'état
- [ ] Pas de scintillement d'interface
- [ ] Requêtes optimisées (pas de spam Firestore)
- [ ] Fonctionne hors ligne (mode dégradé)

### Données

- [ ] États synchronisés avec réalité Firestore
- [ ] Pas de statuts fantômes ou obsolètes
- [ ] Cohérence entre écrans (FriendsScreen ↔ InviteFriendsModal)

## 🔮 RÉSULTAT ATTENDU

### Avant Phase 4

- ❌ Interface "aveugle" : Impossible de savoir qui inviter
- ❌ Invitations ratées vers amis occupés
- ❌ Messages génériques sans contexte

### Après Phase 4

- ✅ **Interface intelligente** : États visibles en temps réel
- ✅ **Filtrage automatique** : Seuls amis disponibles proposés
- ✅ **Messages contextuels** : Raisons claires d'indisponibilité
- ✅ **UX fluide** : Pas de frustration, invitations efficaces

Cette phase résoudra les bugs **#10 États Non Visibles** et **#11 Filtrage Non Intelligent** de notre liste.
