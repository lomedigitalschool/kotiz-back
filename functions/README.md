# Cloud Functions Firebase - KOTIZ

Ce dossier contient les Cloud Functions Firebase pour automatiser l'envoi d'emails de bienvenue lors de la vérification d'adresse email.

## 🚀 Fonctionnalités

- **Email de bienvenue automatique** : Envoi d'un email personnalisé quand un utilisateur vérifie son adresse email
- **Email de vérification personnalisé** (optionnel) : Remplacement de l'email par défaut de Firebase

## 📋 Prérequis

1. **Firebase CLI** installé : `npm install -g firebase-tools`
2. **Projet Firebase** configuré avec Authentication et Functions activés
3. **Service account** configuré pour Firebase Admin SDK

## ⚙️ Configuration

### 1. Configuration des variables d'environnement

```bash
# Configurer les credentials email
firebase functions:config:set email.user="votre-email@gmail.com"
firebase functions:config:set email.password="votre-mot-de-passe-app"
```

### 2. Initialisation du projet Firebase

```bash
# À la racine du projet backend
firebase init functions
# Sélectionner votre projet existant
# Choisir TypeScript ou JavaScript
```

### 3. Installation des dépendances

```bash
cd functions/
npm install
```

## 🚀 Déploiement

### Déployer toutes les fonctions

```bash
firebase deploy --only functions
```

### Déployer une fonction spécifique

```bash
firebase deploy --only functions:sendWelcomeEmail
```

## 🔧 Utilisation

### Email de bienvenue automatique

La fonction `sendWelcomeEmail` se déclenche automatiquement quand :
- Un utilisateur vérifie son email dans Firebase Authentication
- L'événement `onUpdate` détecte le changement `emailVerified: false → true`

### Email de vérification personnalisé (optionnel)

Pour utiliser un email de vérification personnalisé au lieu de celui de Firebase :

```javascript
// Depuis votre frontend
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

const sendCustomVerification = httpsCallable(functions, 'sendCustomVerificationEmail');

try {
  const result = await sendCustomVerification();
  console.log(result.data.message);
} catch (error) {
  console.error('Erreur:', error.message);
}
```

## 📧 Configuration Email

### Gmail
```bash
firebase functions:config:set email.user="votre-email@gmail.com"
firebase functions:config:set email.password="votre-mot-de-passe-application"
```

### Autres fournisseurs
Modifiez le transporteur dans `index.js` :
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.votre-fournisseur.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});
```

## 🧪 Test local

```bash
# Démarrer l'émulateur
npm run serve

# Tester la fonction
curl -X POST http://localhost:5001/votre-projet/us-central1/sendCustomVerificationEmail \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 📊 Monitoring

### Logs des fonctions

```bash
firebase functions:log
```

### Métriques dans Firebase Console

1. Aller dans Firebase Console
2. Functions > Logs
3. Voir les exécutions et erreurs

## 🛠️ Dépannage

### Erreur "Billing account not configured"
- Les Cloud Functions nécessitent un compte de facturation Google Cloud
- Même pour l'offre gratuite, un compte de facturation doit être configuré

### Erreur "Functions region not set"
- Vérifier la région dans `firebase.json` :
```json
{
  "functions": {
    "source": "functions",
    "region": "us-central1"
  }
}
```

### Email non envoyé
- Vérifier les credentials email
- Vérifier les quotas Firebase
- Vérifier les logs : `firebase functions:log`

## 📝 Personnalisation

### Modifier le template d'email

Éditez la fonction `sendWelcomeEmail` dans `index.js` pour personnaliser :
- Le contenu HTML
- Le sujet
- L'expéditeur

### Ajouter de nouvelles fonctions

1. Créer une nouvelle fonction dans `index.js`
2. L'exporter : `exports.nomFonction = functions...`
3. Déployer : `firebase deploy --only functions:nomFonction`

## 🔒 Sécurité

- Les fonctions utilisent l'authentification Firebase intégrée
- Les emails sont envoyés via des services sécurisés
- Les credentials sont stockés dans Firebase Functions Config (chiffrés)

## 📞 Support

Pour toute question concernant les Cloud Functions :
- Documentation Firebase : https://firebase.google.com/docs/functions
- Console Firebase > Functions > Logs