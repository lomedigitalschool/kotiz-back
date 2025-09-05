e''''# Kotiz Backend API

API backend pour l'application Kotiz développée par Lome Digital School avec système KYC multi-soumissions.

## 🚀 Fonctionnalités

### Système d'authentification
- Inscription et connexion utilisateur
- Authentification JWT
- Gestion des profils utilisateur

### Système KYC Multi-Soumissions
- **Première soumission** : Vérification initiale
- **Nouvelle tentative** : Après un refus
- **Renouvellement** : Après expiration
- **Correction** : Modification d'informations
- Upload de documents (recto/verso)
- Historique complet des soumissions
- Interface d'administration pour validation

### Gestion des Cagnottes
- Création de cagnottes publiques/privées
- Contributions avec messages
- Suivi des objectifs
- Upload d'images

### Administration
- Interface AdminJS intégrée
- Gestion des utilisateurs et KYC
- Statistiques et rapports

## 📋 Installation

### Prérequis
- Node.js (v16+)
- PostgreSQL
- npm ou yarn

### Configuration

1. **Cloner le repository**
```bash
git clone https://github.com/lomedigitalschool/kotiz-back.git
cd kotiz-back
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables dans .env
DB_NAME=kotiz_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

4. **Lancer l'application**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🏗️ Architecture

### Structure des dossiers
```
src/
├── config/
│   ├── database.js      # Configuration PostgreSQL
│   └── admin.js         # Configuration AdminJS
├── migrations/          # Migrations automatiques (10 fichiers)
├── models/              # 9 modèles Sequelize avec relations
│   ├── User.js          # Utilisateurs (user/admin)
│   ├── pull.js      # pulls avec validation
│   ├── Contribution.js  # Contributions
│   ├── Transaction.js   # Transactions financières
│   ├── PaymentMethod.js # Méthodes de paiement
│   ├── UserPaymentMethod.js # Association users ↔ payments
│   ├── Notification.js  # Notifications système
│   ├── Log.js          # Journalisation
│   ├── Kyc.js          # Vérification d'identité
│   └── index.js        # Relations entre modèles
├── utils/
│   └── migrator.js     # Migrations automatiques
├── scripts/
│   └── create-admin.js # Création admin automatique
└── server.js           # Point d'entrée avec AdminJS
```

## 🌐 API Endpoints

### 🛠️ Utilitaires
- `GET /health` - Santé de l'API et base de données
- `GET /test-models` - Test de création des modèles
- `GET /test-relations` - Test des relations entre modèles

### 👑 Administration (AdminJS)
- `GET /admin` - **Dashboard complet** (admin uniquement)
  - 👤 Gestion des utilisateurs (user/admin)
  - 🎯 Approbation des pulls
  - 💰 Suivi des contributions
  - 💳 Gestion des méthodes de paiement
  - 🔔 Notifications système
  - 📊 Logs d'activité
  - ✅ Validation KYC
  - 💸 Transactions financières

### 🔐 Authentification (À implémenter)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur

### 📱 API Mobile/Web (À implémenter)
- `GET /api/pulls` - pulls publiques
- `POST /api/pulls` - Créer une pull
- `POST /api/contributions` - Faire une contribution
- `GET /api/payment-methods` - Méthodes de paiement disponibles

## 🛡️ Fonctionnalités de Sécurité

### ✅ Validations Implémentées
- **Montants financiers** : Validation > 0 pour contributions/pulls
- **Devises** : Limitées à XOF, EUR, USD (ENUM)
- **Mots de passe** : Hachage bcrypt automatique
- **KYC** : Validation des documents d'identité
- **Authentification AdminJS** : Accès admin uniquement

### 🔗 Relations Testées
- User ↔ pulls (1:N)
- User ↔ Contributions (1:N)
- User ↔ KYC (1:1)
- pull ↔ Contributions (1:N)
- Contribution ↔ Transaction (1:1)
- Transaction ↔ PaymentMethod (N:1)

## 🛠️ Développement

### Scripts disponibles
```bash
npm run dev          # Développement avec nodemon
npm start           # Production
npm test            # Tests unitaires
npm run create-admin # Créer un administrateur
```

### Variables d'environnement
```env
# Base de données
DB_NAME=kotiz_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# AdminJS
ADMIN_EMAIL=admin@kotiz.com
ADMIN_PASSWORD=admin123
```

## 📊 Administration

### Interface AdminJS
- **URL** : `http://localhost:3000/admin`
- **Identifiants par défaut** :
  - Email : `admin@kotiz.com`
  - Mot de passe : `admin123`

### Fonctionnalités admin
- Gestion des utilisateurs
- Validation des soumissions KYC
- Modération des cagnottes
- Statistiques et rapports

## 🧪 Tests

### Collection Postman
Importez le fichier `Kotiz_API_Collection.postman_collection.json` dans Postman pour tester tous les endpoints.

### Variables Postman
- `base_url` : `http://localhost:3000/api/v1`
- `auth_token` : Token JWT obtenu après connexion

## 🚀 Déploiement

### Production
1. Configurer les variables d'environnement
2. Installer les dépendances : `npm ci`
3. Lancer les migrations : `npm run migrate`
4. Démarrer l'application : `npm start`

### Docker (optionnel)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Changelog

### Version 2.0.0
- ✅ Système KYC multi-soumissions
- ✅ Upload de fichiers avec Multer
- ✅ Relations User-KYC (hasMany)
- ✅ Configuration alter: true pour préserver les données
- ✅ Interface d'administration KYC
- ✅ Collection Postman complète

### Version 1.0.0
- ✅ Authentification JWT
- ✅ Gestion des cagnottes
- ✅ Système de contributions
- ✅ Interface AdminJS

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

Développé par **Lome Digital School**

- 📧 Contact : contact@lomedigitalschool.com
- 🌐 Site web : https://lomedigitalschool.com

---

**Kotiz** - Plateforme de cagnottes collaboratives avec vérification d'identité sécurisée.