# 🗺️ Guide d'utilisation de la Carte

## Comment accéder à la carte

1. **Lancez l'application** avec `npm start`
2. **Connectez-vous** avec votre compte (Google, Facebook ou téléphone)
3. **Cliquez sur l'onglet "Carte"** en bas de l'écran (icône de pin 📍)

## Fonctionnalités de la carte

### 🎯 Vue d'ensemble

- **Votre position** : Pin bleu avec emoji 😊 marqué "Vous"
- **Amis disponibles** : Pins colorés selon leur activité
- **Légende** : Affichée en haut à gauche de la carte

### 🔍 Navigation

- **Zoom +/-** : Boutons ronds en bas à droite
- **Recentrer** : Bouton cible (crosshair) en haut à droite
- **Déplacer** : Cliquez et glissez sur la carte (désactive le suivi automatique)

### 🎨 Filtres d'activités

- **Bouton filtre** : En haut à droite (icône entonnoir)
- **Filtres disponibles** :
  - ☕ Coffee (orange)
  - 🍽️ Lunch (vert)
  - 🍻 Drinks (violet)
  - 😎 Chill (bleu)

### 👥 Interaction avec les amis

- **Cliquer sur un pin d'ami** : Affiche les détails en bas
- **Informations affichées** :
  - Nom et avatar
  - Type d'activité
  - Distance de vous
  - Temps restant
  - Bouton "Rejoindre"

## ⚠️ Problèmes courants

### "Localisation non disponible"

- **Cause** : Permission de géolocalisation refusée
- **Solution** :
  1. Cliquez sur l'icône 🔒 dans la barre d'adresse
  2. Autorisez la localisation
  3. Rechargez la page

### "Aucun ami disponible"

- **Cause** : Pas d'amis connectés ou disponibles
- **Solution** :
  1. Invitez des amis via l'onglet "Accueil"
  2. Utilisez les outils de debug (mode développement)
  3. Créez des amitiés de test

### Carte ne s'affiche pas

- **Vérifiez** :
  - Que vous êtes bien sur l'onglet "Carte"
  - Qu'il n'y a pas d'erreurs dans la console (F12)
  - Que votre connexion internet fonctionne

## 🛠️ Mode développement

En mode développement, des outils supplémentaires sont disponibles :

### Outils de debug des amitiés

1. **"🔍 Analyser les relations d'amitié"** : Affiche un rapport détaillé en console
2. **"🧪 Créer des amitiés de test"** : Ajoute automatiquement des amis fictifs

### Console de debug

- **F12** : Ouvrir les outils développeur
- **Console** : Voir les logs de géolocalisation et debug
- **Network** : Vérifier les appels Firebase

## 🎨 Thèmes

- **Mode clair** : Carte avec dégradé bleu/vert/violet
- **Mode sombre** : Carte avec dégradé gris/bleu foncé
- **Basculer** : Via l'onglet "Paramètres"

## 📱 Optimisations mobile

- **Touch** : Support tactile complet
- **Responsive** : Interface adaptée aux petits écrans
- **Performance** : Cache de géolocalisation (5 minutes)

## 🔧 Dépannage technique

### Erreurs fréquentes

```bash
# Redémarrer le serveur
npm start

# Nettoyer le cache
npm run build
```

### Structure des données

```javascript
// Format attendu pour les amis
{
  id: "user123",
  name: "Alice",
  avatar: "👩",
  activity: "coffee",
  lat: 48.8566,
  lng: 2.3522,
  timeLeft: 30,
  location: "Café de la Paix"
}
```

## 🚀 Prochaines fonctionnalités

- [ ] Intégration Google Maps réelle
- [ ] Chat direct depuis la carte
- [ ] Notifications de proximité
- [ ] Partage de position en temps réel
- [ ] Itinéraires vers les amis

---

**💡 Astuce** : Maintenez la touche F12 ouverte pour voir les logs de debug et diagnostiquer les problèmes plus facilement !
