# 🐛 BUGS ET RÉGRESSIONS ACTUELS - Système d'Invitations

_Dernière mise à jour : Après Phase 3_

## 🚨 BUGS CRITIQUES - À CORRIGER EN PRIORITÉ

### 1. Notifications d'Invitations Invisibles

- **Symptôme** : Les invitations ne s'affichent plus dans le centre de notifications
- **Impact** : Utilisateurs ne peuvent plus répondre aux invitations
- **Status** : ❌ Correction tentée mais non fonctionnelle
- **Cause suspectée** : Conflit Legacy vs Phase 3, problème de requêtes Firestore
- **Priorité** : CRITIQUE

### 2. Décompte Effacé lors d'Invitations

- **Symptôme** : Le compte à rebours disparaît quand un utilisateur en partage invite quelqu'un
- **Impact** : Perte de session, utilisateurs perdus
- **Status** : ❌ Non résolu
- **Phase** : Bug identifié Phase 1, persiste
- **Priorité** : HAUTE

### 3. Acceptation d'Invitation sans Effet

- **Symptôme** : Cliquer "Accepter" ne démarre pas l'activité partagée
- **Impact** : Fonctionnalité principale cassée
- **Status** : ❌ Non résolu
- **Cause** : Méthode `respondToInvitation` corrompue
- **Priorité** : CRITIQUE

## ⚠️ RÉGRESSIONS PHASE 3

### 4. Incompatibilité Formats d'Invitations

- **Cause** : Introduction `toUserIds[]` vs ancien `toUserId`
- **Impact** : Invitations legacy plus détectées
- **Correction tentée** : Méthodes unifiées créées mais inefficaces
- **Status** : ❌ Partiellement corrigé, problèmes persistent

### 5. Méthodes Duplicates et Confuses

- **Problème** : `getInvitationsForUser()` vs `getUserPendingInvitations()`
- **Impact** : Code dupliqué, logique incohérente
- **Status** : ❌ Non harmonisé

### 6. Notifications en Cascade

- **Symptôme** : Notifications multiples pour une même invitation
- **Cause** : Système legacy + Phase 3 qui se marchent dessus
- **Status** : ❌ Non résolu

## 🔄 PROBLÈMES MÉTIER NON RÉSOLUS

### 7. Relations Bilatérales Manquantes

- **Symptôme** : Paul peut inviter Jack alors que Jack a déjà invité Paul
- **Impact** : Conflits d'invitations, UX dégradée
- **Status** : ❌ Logique de validation incomplète
- **Note** : RelationshipService mentionné mais jamais implémenté

### 8. Restrictions d'État Insuffisantes

- **Symptôme** : Utilisateurs "occupés" reçoivent encore des invitations
- **Impact** : Invitations inappropriées
- **Status** : ⚠️ Partiellement implémenté via `checkUserBusyStatus`

### 9. Expiration d'Invitations Dysfonctionnelle

- **Symptôme** : Invitations expirées restent visibles
- **Impact** : Interface polluée, données obsolètes
- **Status** : ❌ Timer service créé mais non intégré

## 🎨 PROBLÈMES D'INTERFACE

### 10. États Utilisateur Non Visibles

- **Symptôme** : Impossible de voir qui est "libre", "occupé", etc.
- **Impact** : UX dégradée, invitations à l'aveugle
- **Status** : ❌ Interface temps réel manquante
- **Note** : Phase 4 nécessaire

### 11. Filtrage Amis Non Intelligent

- **Symptôme** : Tous les amis apparaissent dans la liste d'invitation
- **Impact** : Utilisateur peut inviter des amis déjà occupés
- **Status** : ❌ Filtrage automatique manquant

### 12. Notifications Sans Contexte

- **Symptôme** : Messages génériques "Paul vous invite"
- **Impact** : Manque d'informations pour décider
- **Status** : ⚠️ Partiellement amélioré

## 🏗️ PROBLÈMES ARCHITECTURAUX

### 13. Services Non Intégrés

- **Problème** :
  - `EventStatusService` créé mais non utilisé
  - `InvitationExpirationService` isolé
  - `EventGroupService` incomplet
- **Impact** : Code mort, fonctionnalités non opérationnelles

### 14. Tests Incomplets

- **Problème** : Tests unitaires ne reflètent pas la réalité
- **Impact** : Fausse confiance, bugs non détectés
- **Status** : ❌ Tests passent mais application dysfonctionnelle

### 15. Gestion d'Erreurs Faible

- **Problème** : Pas de fallback, erreurs silencieuses
- **Impact** : Utilisateurs bloqués sans explication
- **Status** : ❌ Non traité

## 📊 MÉTRIQUES DES PROBLÈMES

### Par Gravité

- 🚨 **CRITIQUES** : 3 bugs (Notifications, Décompte, Acceptation)
- ⚠️ **HAUTES** : 5 bugs (Régressions Phase 3)
- 🔄 **MOYENNES** : 4 bugs (Métier)
- 🎨 **INTERFACE** : 3 bugs (UX)
- 🏗️ **TECHNIQUE** : 3 bugs (Architecture)

### Par Phase

- **Phase 1** : 2 bugs restants
- **Phase 2** : 1 bug (groupes non implémentés)
- **Phase 3** : 6 nouvelles régressions
- **Phase 4** : 3 bugs d'interface à anticiper
- **Phase 5** : 3 bugs de validation à prévoir

## 🎯 STRATÉGIE DE CORRECTION

### Option A : Correction Bug par Bug

- ✅ **Avantage** : Résolution méthodique
- ❌ **Inconvénient** : Très long, risque nouveaux bugs

### Option B : Refactoring Complet

- ✅ **Avantage** : Architecture saine
- ❌ **Inconvénient** : Risque de tout casser

### Option C : Continue Phase 4-6 puis Debug

- ✅ **Avantage** : Système complet avant debug
- ❌ **Inconvénient** : Plus de bugs potentiels
- 🎯 **RECOMMANDÉ** : Approche actuelle

## 📋 CHECKLIST VALIDATION

### Tests Fonctionnels Manquants

- [ ] Envoyer invitation simple → Reçue et visible
- [ ] Répondre "Accepter" → Démarre activité partagée
- [ ] Répondre "Décliner" → Notifications nettoyées
- [ ] Invitation multiple → Tous destinataires reçoivent
- [ ] Expiration auto → Invitations disparaissent
- [ ] États temps réel → Amis occupés filtrés
- [ ] Compte à rebours → Persiste durant invitations

### Données Cohérentes

- [ ] Notifications ↔ Invitations Firestore cohérentes
- [ ] Statuts utilisateur ↔ Interface synchronisés
- [ ] Invitations legacy ↔ Phase 3 compatibles

## 🔮 PROCHAINES ÉTAPES

1. **Phase 4** : Interface temps réel (états visibles, filtrage intelligent)
2. **Phase 5** : Validation et conflits (RelationshipService)
3. **Phase 6** : Tests et polish
4. **Debug Session** : Correction systématique bugs listés

_Cette liste sera mise à jour après chaque phase pour tracking précis._
