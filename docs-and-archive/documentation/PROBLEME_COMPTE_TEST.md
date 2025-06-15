# Problème de Connexion/Déconnexion après Suppression de Compte de Test

## Problème Identifié

Lorsqu'un utilisateur supprime son compte de test, puis tente de se reconnecter avec le même compte, il se connecte brièvement puis se déconnecte immédiatement. Ce cycle se répète indéfiniment.

## Cause du Problème

Le problème était causé par la fonction `cleanupOrphanedAuthAccount` dans `src/services/authService.js` qui :

1. Se déclenche à chaque connexion d'utilisateur
2. Vérifie si l'utilisateur a des données dans Firestore
3. Si aucune donnée Firestore n'existe (ce qui est le cas après suppression de compte), considère le compte comme "orphelin"
4. Supprime automatiquement le compte Firebase Auth
5. L'utilisateur est déconnecté immédiatement
6. Le cycle recommence

## Solution Implémentée

La fonction `cleanupOrphanedAuthAccount` a été modifiée pour :

- **Recréer les données Firestore** au lieu de supprimer le compte Auth
- Permettre la réutilisation d'un compte après suppression des données
- Ne supprimer les comptes Auth que s'ils sont vraiment anciens (plus de 1 jour) et sans données

### Code Modifié

```javascript
static async cleanupOrphanedAuthAccount() {
  // ...
  if (!userSnap.exists()) {
    console.log('🔄 Compte Auth sans données Firestore détecté, recréation du profil...');

    // Au lieu de supprimer le compte Auth, recréons les données Firestore
    try {
      await this.createUserProfile(currentUser);
      console.log('✅ Profil Firestore recréé pour le compte Auth existant');
      return false; // Pas de suppression, juste recréation
    } catch (error) {
      // Logique de fallback pour les vrais comptes orphelins anciens
    }
  }
}
```

## Comportement Après la Correction

Maintenant, quand un utilisateur :

1. Supprime son compte de test
2. Tente de se reconnecter avec le même compte
3. Le système détecte l'absence de données Firestore
4. **Recrée automatiquement le profil Firestore** au lieu de supprimer le compte
5. L'utilisateur reste connecté normalement

## Test de la Solution

Pour tester que la correction fonctionne :

1. Créer un compte de test
2. Le supprimer depuis les paramètres
3. Tenter de se reconnecter
4. Vérifier que la connexion se maintient sans déconnexion
5. Vérifier que les données de profil sont recréées

## Note Technique

Cette solution conserve l'aspect sécuritaire de nettoyage des vrais comptes orphelins anciens tout en permettant la réutilisation normale des comptes après suppression de données.
